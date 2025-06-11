/**
 * @deprecated Use @/shared/config/storage instead
 * This file provides backward compatibility and will be removed in a future version.
 */

export {
  DEFAULT_STORAGE_LIMIT,
  DEFAULT_STORAGE_CONFIG,
  getStorageConfig,
  setStorageConfig,
  getStorageUsage,
  isStorageNearLimit,
  formatBytes,
} from '@/shared/config/storage';

export type {
  StorageConfig,
} from '@/shared/config/storage';