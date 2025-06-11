# Phase 6.2 Final Cleanup Analysis

## Overview
We're in Phase 6.2 of the refactoring roadmap. We skipped Phase 5 (Testing & Documentation) and are working on Phase 6 (Optimization & Cleanup). The issue is that there are still 38 files under `src/hooks` and `src/lib` that contain actual implementations (not just re-exports) and need to be migrated to either `src/features` or `src/shared`.

## Files Requiring Migration

### App-Level Hooks (should go to `src/shared/hooks/`)
1. `src/hooks/useAppContext.ts` - App context access hook
2. `src/hooks/usePWAInstall.ts` - PWA installation functionality  
3. `src/hooks/usePWAUpdate.ts` - PWA update management
4. `src/hooks/useNostr.ts` - Re-export from @nostrify/react (special case)

### Shared Utility Hooks (should go to `src/shared/hooks/`)
5. `src/hooks/useDeleteWithConfirmation.ts` - Generic deletion confirmation pattern
6. `src/hooks/useRelayStatus.ts` - Relay health monitoring
7. `src/hooks/useRelayConfig.ts` - Relay configuration management

### Offline Feature Hooks (should go to `src/features/offline/hooks/`)
8. `src/hooks/useOfflineStorageInfo.ts` - Offline storage information
9. `src/hooks/useOfflineStorageInfo.tsx` - Duplicate TSX version
10. `src/hooks/useStorageConfig.ts` - Storage configuration management
11. `src/hooks/useOfflineStorage.ts` - Offline storage operations
12. `src/hooks/useOfflineStorage.tsx` - Duplicate TSX version
13. `src/hooks/useConnectivity.ts` - Network connectivity monitoring
14. `src/hooks/useConnectivity.tsx` - Duplicate TSX version

### Data Management Hooks (deprecated, should be removed)
15. `src/hooks/useDeletionFilter.ts` - Legacy data filtering
16. `src/hooks/usePrefetchManager.ts` - Legacy prefetch management
17. `src/hooks/useCacheInvalidation.ts` - Legacy cache invalidation
18. `src/hooks/useCacheManager.ts` - Legacy cache management
19. `src/hooks/usePerformanceOptimization.ts` - Legacy performance optimization

### Geocache Feature Hooks (should go to `src/features/geocache/hooks/`)
20. `src/hooks/useNostrSavedCaches.ts` - Saved caches functionality
21. `src/hooks/useSavedCaches.ts` - Cache saving operations
22. `src/hooks/useReliableProximitySearch.ts` - Proximity search functionality
23. `src/hooks/useLoggedInAccounts.ts` - Account management for geocaching
24. `src/hooks/useRegenerateVerificationKey.ts` - Verification key management

### Shared Utilities (should go to `src/shared/utils/`)
25. `src/lib/relays.ts` - Relay management utilities
26. `src/lib/storageConfig.ts` - Storage configuration utilities
27. `src/lib/connectivityChecker.ts` - Connectivity checking utilities
28. `src/lib/connectivityChecker.tsx` - Duplicate TSX version

### Offline Feature Utilities (should go to `src/features/offline/utils/`)
29. `src/lib/offlineStorage.ts` - Offline storage implementation
30. `src/lib/offlineStorage.tsx` - Duplicate TSX version
31. `src/lib/offlineSync.ts` - Offline synchronization
32. `src/lib/offlineSync.tsx` - Duplicate TSX version
33. `src/lib/storageConfig.tsx` - Duplicate TSX version

### Index Files (need updating after migration)
34. `src/hooks/index.ts` - Hooks barrel export
35. `src/lib/index.ts` - Lib barrel export

### Test Files (should go to appropriate feature test directories)
36. `src/lib/__tests__/deletionFilter.test.ts` - Test for deletion filter

## Migration Strategy

### Step 1: Migrate Shared Hooks
- Move app-level and shared utility hooks to `src/shared/hooks/`
- Update barrel exports
- Create backward compatibility re-exports

### Step 2: Migrate Feature-Specific Hooks
- Move offline hooks to `src/features/offline/hooks/`
- Move geocache hooks to `src/features/geocache/hooks/`
- Update feature barrel exports

### Step 3: Migrate Utilities
- Move shared utilities to `src/shared/utils/`
- Move feature utilities to appropriate feature directories
- Update barrel exports

### Step 4: Remove Legacy Data Management
- Remove deprecated data management hooks (they're replaced by stores)
- Update any remaining imports to use new store system

### Step 5: Clean Up Duplicates
- Remove duplicate .tsx versions of .ts files
- Consolidate functionality where appropriate

### Step 6: Update Index Files
- Update barrel exports to only include necessary re-exports
- Remove exports for migrated files

### Step 7: Migrate Tests
- Move tests to appropriate feature test directories
- Update test imports

## Expected Outcome
After this migration:
- `src/hooks/` will only contain backward compatibility re-exports
- `src/lib/` will only contain backward compatibility re-exports  
- All actual implementations will be in `src/features/` or `src/shared/`
- Build will continue to work with no breaking changes
- Phase 6.2 Final Cleanup will be complete

## Files to Remove (Legacy Data Management)
These hooks are deprecated and replaced by the new store system:
- `useDeletionFilter.ts`
- `usePrefetchManager.ts` 
- `useCacheInvalidation.ts`
- `useCacheManager.ts`
- `usePerformanceOptimization.ts`

## Duplicate Files to Consolidate
Several files have both .ts and .tsx versions - need to determine which to keep:
- `useOfflineStorageInfo` (.ts and .tsx)
- `useOfflineStorage` (.ts and .tsx)
- `useConnectivity` (.ts and .tsx)
- `connectivityChecker` (.ts and .tsx)
- `offlineStorage` (.ts and .tsx)
- `offlineSync` (.ts and .tsx)
- `storageConfig` (.ts and .tsx)