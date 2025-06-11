/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * New code should import utilities from their specific locations:
 * - @/shared/utils for shared utilities
 * - @/shared/config for configuration
 * - @/features/*/utils for feature-specific utilities
 */

// Re-export commonly used utilities for backward compatibility
export * from '@/shared/config'; // constants
export * from '@/shared/utils/cacheUtils';
export * from '@/shared/utils/errorUtils';
export * from '@/shared/utils/validation';

// Feature-specific utilities (re-exported for compatibility)
export * from '@/features/offline/utils/offlineStorage';
export * from '@/features/offline/utils/offlineSync';
export * from '@/shared/utils/connectivityChecker';