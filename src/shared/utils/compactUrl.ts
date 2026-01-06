/**
 * Compact URL encoding/decoding for geocache QR codes
 * 
 * This provides a ~28% reduction in URL length compared to standard naddr+nsec format.
 * 
 * Current format (221 chars):
 *   https://treasures.to/{naddr}#verify={nsec}
 * 
 * Compact format (~164 chars):
 *   https://treasures.to/c/{base64url-payload}
 * 
 * Payload structure (106 bytes max):
 *   - pubkey:          32 bytes (raw)
 *   - d-tag length:     1 byte
 *   - d-tag:           41 bytes (full d-tag, null-padded)
 *   - verify privkey:  32 bytes (raw)
 * 
 * Note: kind is always 37516 (NIP_GC_KINDS.GEOCACHE), so it's not stored.
 */

import { nip19 } from 'nostr-tools';
import { NIP_GC_KINDS } from '@/features/geocache/utils/nip-gc';

// D-tag max length: normalized name (32) + hyphen (1) + pubkey prefix (8) = 41
const DTAG_MAX_LENGTH = 41;

/**
 * Get the compact URL prefix based on current environment
 */
function getCompactUrlPrefix(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/c/`;
  }
  // Fallback for SSR or non-browser environments
  return 'https://treasures.to/c/';
}

/**
 * Encode geocache data into a compact URL
 * Note: kind parameter is ignored - always uses GEOCACHE kind (37516)
 */
export function encodeCompactUrl(
  pubkey: string,
  dTag: string,
  nsec: string,
  _kind?: number // Kept for API compatibility but ignored
): string {
  // Decode nsec to get raw private key bytes
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') {
    throw new Error('Invalid nsec format');
  }
  const privateKeyBytes = decoded.data as Uint8Array;

  // Convert hex pubkey to bytes
  const pubkeyBytes = hexToBytes(pubkey);
  if (pubkeyBytes.length !== 32) {
    throw new Error('Invalid pubkey length');
  }

  // Encode d-tag to fixed length
  const dTagBytes = encodeDTag(dTag);

  // Build payload: pubkey (32) + dTagLen (1) + dTag (41) + privkey (32) = 106 bytes
  const payload = new Uint8Array(106);
  let offset = 0;

  // Pubkey (32 bytes)
  payload.set(pubkeyBytes, offset);
  offset += 32;

  // D-tag length (1 byte) - store original length for reconstruction
  payload[offset] = Math.min(dTag.length, DTAG_MAX_LENGTH);
  offset += 1;

  // D-tag (41 bytes, null-padded)
  payload.set(dTagBytes, offset);
  offset += DTAG_MAX_LENGTH;

  // Verification private key (32 bytes)
  payload.set(privateKeyBytes, offset);

  // Encode to base64url
  const base64url = bytesToBase64Url(payload);

  return getCompactUrlPrefix() + base64url;
}

/**
 * Decode a compact URL back to its components
 */
export function decodeCompactUrl(url: string): {
  pubkey: string;
  kind: number;
  dTag: string;
  nsec: string;
} | null {
  try {
    // Handle both full URL and just the payload
    let base64url: string;
    const prefix = getCompactUrlPrefix();
    if (url.startsWith(prefix)) {
      base64url = url.slice(prefix.length);
    } else if (url.includes('/c/')) {
      // Handle any origin (localhost, prod, etc.)
      base64url = url.split('/c/')[1] || '';
    } else if (url.startsWith('/c/')) {
      base64url = url.slice(3);
    } else {
      base64url = url;
    }

    // Decode base64url to bytes
    const payload = base64UrlToBytes(base64url);
    if (payload.length !== 106) {
      return null;
    }

    let offset = 0;

    // Pubkey (32 bytes)
    const pubkeyBytes = payload.slice(offset, offset + 32);
    const pubkey = bytesToHex(pubkeyBytes);
    offset += 32;

    // D-tag length (1 byte)
    const dTagLength = payload[offset] ?? 0;
    offset += 1;

    // D-tag (41 bytes)
    const dTagBytes = payload.slice(offset, offset + DTAG_MAX_LENGTH);
    const dTag = new TextDecoder().decode(dTagBytes.slice(0, dTagLength));
    offset += DTAG_MAX_LENGTH;

    // Verification private key (32 bytes)
    const privateKeyBytes = payload.slice(offset, offset + 32);
    const nsec = nip19.nsecEncode(privateKeyBytes);

    // Kind is always GEOCACHE (37516)
    const kind = NIP_GC_KINDS.GEOCACHE;

    return { pubkey, kind, dTag, nsec };
  } catch (error) {
    console.error('Failed to decode compact URL:', error);
    return null;
  }
}

/**
 * Check if a URL/path is a compact geocache URL
 */
export function isCompactUrl(url: string): boolean {
  return url.includes('/c/') || url.startsWith('/c/');
}

/**
 * Convert compact URL data to standard naddr format for relay queries
 */
export function compactToNaddr(pubkey: string, dTag: string, kind: number): string {
  return nip19.naddrEncode({
    pubkey,
    kind,
    identifier: dTag,
    relays: [],
  });
}

// ===== Helper functions =====

function encodeDTag(dTag: string): Uint8Array {
  const bytes = new Uint8Array(DTAG_MAX_LENGTH);
  const encoded = new TextEncoder().encode(dTag.slice(0, DTAG_MAX_LENGTH));
  bytes.set(encoded.slice(0, DTAG_MAX_LENGTH));
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64Url(bytes: Uint8Array): string {
  // Convert to regular base64
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const base64 = btoa(binary);
  
  // Convert to base64url (URL-safe)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Remove padding
}

function base64UrlToBytes(base64url: string): Uint8Array {
  // Convert from base64url to regular base64
  let base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  
  // Decode base64
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

