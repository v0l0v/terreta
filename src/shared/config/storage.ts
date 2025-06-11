/**
 * Storage configuration constants
 * Used by offline features for consistent storage behavior
 */

// Storage configuration
export const STORAGE_CONFIG = {
  MAX_AGE_DAYS: 30,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  MAX_CACHE_ENTRIES: 500,
  MAX_IMAGE_CACHE_ENTRIES: 200,
} as const;