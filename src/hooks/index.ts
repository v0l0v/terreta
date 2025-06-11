/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * New code should import hooks from their specific feature directories or @/shared/hooks.
 * 
 * Most hooks have been migrated to:
 * - @/shared/hooks for shared functionality
 * - @/features/*/hooks for feature-specific functionality
 */

// Re-export commonly used hooks for backward compatibility
export * from '@/shared/hooks/useAsyncOperation';
export * from '@/shared/hooks/useForm';

// Note: usePrefetchManager and useDataManager have been replaced by the new store system
// Note: useOfflineStorageInfo has been moved to @/features/offline/hooks