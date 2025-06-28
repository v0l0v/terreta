/**
 * Utility functions for generating deterministic dTags for geocaches
 * This ensures that pre-generated QR codes will match the actual published cache
 */

/**
 * Generate a deterministic dTag based on cache name and user pubkey
 * This ensures the same naddr will be generated for the same cache name and user
 */
export function generateDeterministicDTag(cacheName: string, userPubkey: string): string {
  // Normalize the cache name to be URL-safe
  const normalizedName = cacheName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')  // Replace non-alphanumeric with dashes
    .replace(/-+/g, '-')         // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '')       // Remove leading/trailing dashes
    .substring(0, 32);           // Limit length
  
  // Use first 8 characters of pubkey for uniqueness
  const userPrefix = userPubkey.slice(0, 8);
  
  // Combine normalized name with user prefix
  return `${normalizedName}-${userPrefix}`;
}

/**
 * Generate a fallback random dTag (for cases where deterministic generation fails)
 */
export function generateRandomDTag(): string {
  return `cache-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}