/**
 * Geocache verification utilities using Nostr key pairs
 */

import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import * as QRCode from 'qrcode';
import { geocacheToNaddr, parseNaddr } from './naddr-utils';
import type { NostrEvent } from '@nostrify/nostrify';

// Verification constants
const VERIFICATION_KIND = 1985; // NIP-32 label event kind
const VERIFICATION_LABEL_NAMESPACE = 'geocache-verification';
const VERIFICATION_LABEL_TYPE = 'verified-find';
const VERIFICATION_HASH_PREFIX = '#verify=';

export interface VerificationKeyPair {
  privateKey: Uint8Array;
  publicKey: string;
  nsec: string;
  npub: string;
}

/**
 * Generate a new verification key pair for a geocache
 */
export function generateVerificationKeyPair(): VerificationKeyPair {
  const privateKey = generateSecretKey();
  const publicKey = getPublicKey(privateKey);
  
  return {
    privateKey,
    publicKey,
    nsec: nip19.nsecEncode(privateKey),
    npub: nip19.npubEncode(publicKey),
  };
}

/**
 * Generate QR code data URL for verification
 */
export async function generateVerificationQR(naddr: string, nsec: string): Promise<string> {
  const verificationUrl = `https://treasures.to/${naddr}#verify=${nsec}`;
  
  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return qrDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse verification key from URL hash
 */
export function parseVerificationFromHash(hash: string): string | null {
  if (!hash.startsWith(VERIFICATION_HASH_PREFIX)) {
    return null;
  }
  
  const nsec = hash.substring(VERIFICATION_HASH_PREFIX.length);
  
  // Validate that it's a proper nsec
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') {
      return null;
    }
    return nsec;
  } catch {
    return null;
  }
}

/**
 * Verify that a private key matches a public key
 */
export function verifyKeyPair(nsec: string, expectedPubkey: string): boolean {
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') {
      return false;
    }
    
    const privateKey = decoded.data;
    const publicKey = getPublicKey(privateKey);
    
    return publicKey === expectedPubkey;
  } catch {
    return false;
  }
}

/**
 * Create a verification event signed by the cache's verification key
 * This event attests that the specified user found the cache
 */
export function createVerificationEvent(
  nsec: string,
  finderPubkey: string,
  geocachePubkey: string,
  geocacheDTag: string
): NostrEvent {
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid private key');
    }
    
    const privateKey = decoded.data;
    
    // Generate naddr for the geocache
    const geocacheNaddr = geocacheToNaddr(geocachePubkey, geocacheDTag);
    
    const event = {
      kind: VERIFICATION_KIND,
      content: `Verified find by ${finderPubkey}`,
      tags: [
        ['L', VERIFICATION_LABEL_NAMESPACE],
        ['l', VERIFICATION_LABEL_TYPE, VERIFICATION_LABEL_NAMESPACE],
        ['p', finderPubkey, '', 'finder'],
        ['a', `${finderPubkey}:${geocacheNaddr}`, '', 'geocache']
      ],
      created_at: Math.floor(Date.now() / 1000),
      pubkey: getPublicKey(privateKey),
    };
    
    return finalizeEvent(event, privateKey);
  } catch (error) {
    throw new Error('Failed to create verification event');
  }
}

/**
 * Check if a log has embedded verification
 */
export function hasEmbeddedVerification(event: NostrEvent): boolean {
  try {
    const embeddedVerification = getEmbeddedVerification(event);
    return embeddedVerification !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a log has embedded verification event
 */
export function getEmbeddedVerification(event: NostrEvent): NostrEvent | null {
  try {
    // Look for embedded verification event
    const verificationTag = event.tags.find((tag: string[]) => 
      tag[0] === 'verification'
    );
    
    if (!verificationTag || !verificationTag[1]) {
      return null;
    }
    
    // Parse the embedded verification event
    return JSON.parse(verificationTag[1]);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a log has embedded verification and return its ID
 */
export function hasVerificationReference(event: NostrEvent): string | null {
  try {
    const embeddedVerification = getEmbeddedVerification(event);
    return embeddedVerification ? embeddedVerification.id : null;
  } catch (error) {
    return null;
  }
}

/**
 * Verify that an embedded verification event is valid for a specific log
 */
export function verifyEmbeddedVerification(
  logEvent: NostrEvent, 
  expectedVerificationPubkey: string
): boolean {
  try {
    const embeddedVerification = getEmbeddedVerification(logEvent);
    if (!embeddedVerification) {
      return false;
    }
    
    return verifyVerificationEvent(embeddedVerification, logEvent, expectedVerificationPubkey);
  } catch (error) {
    return false;
  }
}

/**
 * Parse geocache reference from verification event's 'a' tag
 * Expected format: ${finderPubkey}:${naddr}
 */
export function parseGeocacheReference(aTagValue: string): { finderPubkey: string; naddr: string } | null {
  try {
    const parts = aTagValue.split(':');
    if (parts.length < 2) {
      return null;
    }
    
    const finderPubkey = parts[0];
    const naddr = parts.slice(1).join(':'); // Rejoin in case naddr contains colons
    
    // Validate that the naddr is properly formatted
    const parsed = parseNaddr(naddr);
    if (!parsed) {
      return null;
    }
    
    return { finderPubkey, naddr };
  } catch (error) {
    return null;
  }
}

/**
 * Verify that a verification event is valid for a specific log
 */
export function verifyVerificationEvent(
  verificationEvent: NostrEvent, 
  logEvent: NostrEvent, 
  expectedVerificationPubkey: string
): boolean {
  try {
    // Check if the verification event was signed by the expected verification key
    if (verificationEvent.pubkey !== expectedVerificationPubkey) {
      return false;
    }
    
    // Check if it's the right kind of event (NIP-32 label)
    if (verificationEvent.kind !== VERIFICATION_KIND) {
      return false;
    }
    
    // Check if it has the right labels
    const hasCorrectLabel = verificationEvent.tags.some((tag: string[]) =>
      tag[0] === 'L' && tag[1] === VERIFICATION_LABEL_NAMESPACE
    ) && verificationEvent.tags.some((tag: string[]) =>
      tag[0] === 'l' && tag[1] === VERIFICATION_LABEL_TYPE
    );
    
    if (!hasCorrectLabel) {
      return false;
    }
    
    // Check if it references the correct finder
    const finderTag = verificationEvent.tags.find((tag: string[]) =>
      tag[0] === 'p' && tag[3] === 'finder'
    );
    
    if (!finderTag || finderTag[1] !== logEvent.pubkey) {
      return false;
    }
    
    // Validate the geocache reference in 'a' tag and verify finder pubkey matches
    const geocacheTag = verificationEvent.tags.find((tag: string[]) =>
      tag[0] === 'a' && tag[3] === 'geocache'
    );
    
    if (!geocacheTag) {
      return false;
    }
    
    const parsedReference = parseGeocacheReference(geocacheTag[1]);
    if (!parsedReference) {
      return false;
    }
    
    // Verify that the finder pubkey in the 'a' tag matches the log submitter
    if (parsedReference.finderPubkey !== logEvent.pubkey) {
      return false;
    }
    
    // Verify the event signature
    const signatureValid = verifyEvent(verificationEvent);
    return signatureValid;
  } catch (error) {
    return false;
  }
}

/**
 * Download QR code as PNG file
 */
export function downloadQRCode(dataUrl: string, filename: string = 'geocache-verification-qr.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}