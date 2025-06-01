/**
 * Geocache verification utilities using Nostr key pairs
 */

import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';
import QRCode from 'qrcode';

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
  
  // QR code generation for verification
  
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
    console.error('Failed to generate QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parse verification key from URL hash
 */
export function parseVerificationFromHash(hash: string): string | null {
  if (!hash.startsWith('#verify=')) {
    return null;
  }
  
  const nsec = hash.substring(8); // Remove '#verify='
  
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
 * Sign a log event with the verification key
 */
export function signVerifiedLog(
  nsec: string,
  eventTemplate: {
    kind: number;
    content: string;
    tags: string[][];
    created_at?: number;
  }
): any {
  try {
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid private key');
    }
    
    const privateKey = decoded.data;
    
    const event = {
      ...eventTemplate,
      created_at: eventTemplate.created_at || Math.floor(Date.now() / 1000),
      pubkey: getPublicKey(privateKey),
    };
    
    return finalizeEvent(event, privateKey);
  } catch (error) {
    console.error('Failed to sign verified log:', error);
    throw new Error('Failed to sign log with verification key');
  }
}

/**
 * Verify that an event was signed by the expected verification key
 */
export function verifyLogSignature(event: any, expectedPubkey: string): boolean {
  try {
    console.log('verifyLogSignature called:', {
      eventPubkey: event.pubkey,
      expectedPubkey,
      match: event.pubkey === expectedPubkey
    });
    
    // Check if the event was signed by the expected pubkey
    if (event.pubkey !== expectedPubkey) {
      console.log('Pubkey mismatch - not verified');
      return false;
    }
    
    // Verify the event signature
    const signatureValid = verifyEvent(event);
    console.log('Signature verification result:', signatureValid);
    return signatureValid;
  } catch (error) {
    console.log('Verification error:', error);
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