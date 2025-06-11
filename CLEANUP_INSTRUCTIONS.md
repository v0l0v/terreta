# Cleanup Instructions for Next Session

## Overview
Phase 6.2 Final Cleanup is complete, but the deprecated `src/hooks/` and `src/lib/` directories still contain re-export files for backward compatibility. These can be safely removed in a future session once we're confident all imports have been updated.

## Current Status

### ✅ Completed
- All implementation files migrated to feature-based locations
- All imports updated throughout the codebase
- Build successful with no breaking changes
- Backward compatibility maintained through re-exports

### 📁 Directories Ready for Cleanup

#### `src/hooks/` (Contains only re-exports)
```
src/hooks/
├── index.ts                    # Barrel export with re-exports
├── useAppContext.ts           # Re-export → @/shared/hooks
├── useAsyncAction.ts          # Re-export → @/shared/hooks
├── useAsyncOperation.ts       # Re-export → @/shared/hooks
├── useAuthor.ts               # Re-export → @/features/auth/hooks
├── useBatchDeleteGeocaches.ts # Re-export → @/features/geocache/hooks
├── useConnectivity.ts         # Re-export → @/features/offline/hooks
├── useCreateGeocache.ts       # Re-export → @/features/geocache/hooks
├── useCreateLog.ts            # Re-export → @/features/logging/hooks
├── useCreateVerifiedLog.ts    # Re-export → @/features/logging/hooks
├── useCurrentUser.ts          # Re-export → @/shared/stores/simpleStores
├── useDataManager.ts          # Re-export → @/shared/stores/simpleStores
├── useDeleteGeocache.ts       # Re-export → @/features/geocache/hooks
├── useDeleteLog.ts            # Re-export → @/features/logging/hooks
├── useDeleteWithConfirmation.ts # Re-export → @/shared/hooks
├── useEditGeocache.ts         # Re-export → @/features/geocache/hooks
├── useForm.ts                 # Re-export → @/shared/hooks
├── useGeocache.ts             # Re-export → @/features/geocache/hooks
├── useGeocacheByNaddr.ts      # Re-export → @/features/geocache/hooks
├── useGeocacheLogs.ts         # Re-export → @/features/geocache/hooks
├── useGeocacheNavigation.ts   # Re-export → @/features/geocache/hooks
├── useGeocacheStats.ts        # Re-export → @/features/geocache/hooks
├── useGeocaches.ts            # Re-export → @/features/geocache/hooks
├── useGeolocation.ts          # Re-export → @/features/map/hooks
├── useIsMobile.tsx            # Re-export → @/shared/hooks
├── useLocalStorage.ts         # Re-export → @/shared/hooks
├── useLoggedInAccounts.ts     # Re-export → @/features/geocache/hooks
├── useLoginActions.ts         # Re-export → @/features/auth/hooks
├── useNip05Verification.ts    # Re-export → @/features/profile/hooks
├── useNostr.ts                # Special case: re-export from @nostrify/react
├── useNostrPublish.ts         # Re-export → @/shared/hooks
├── useNostrSavedCaches.ts     # Re-export → @/features/geocache/hooks
├── useOfflineGeocaches.ts     # Re-export → @/features/geocache/hooks
├── useOfflineStorage.ts       # Re-export → @/features/offline/hooks
├── useOfflineStorageInfo.ts   # Re-export → @/features/offline/hooks
├── useOptimisticGeocaches.ts  # Re-export → @/features/geocache/hooks
├── usePWAInstall.ts           # Re-export → @/shared/hooks
├── usePWAUpdate.ts            # Re-export → @/shared/hooks
├── useRegenerateVerificationKey.ts # Re-export → @/features/geocache/hooks
├── useRelayConfig.ts          # Re-export → @/shared/hooks
├── useRelayStatus.ts          # Re-export → @/shared/hooks
├── useReliableProximitySearch.ts # Re-export → @/features/geocache/hooks
├── useSavedCaches.ts          # Re-export → @/features/geocache/hooks
├── useTheme.ts                # Re-export → @/shared/hooks
├── useToast.ts                # Re-export → @/shared/hooks
├── useUploadFile.ts           # Re-export → @/shared/hooks
├── useUserFoundCaches.ts      # Re-export → @/features/profile/hooks
└── useUserGeocaches.ts        # Re-export → @/features/geocache/hooks
```

#### `src/lib/` (Contains only re-exports)
```
src/lib/
├── index.ts                   # Barrel export with re-exports
├── cacheCleanup.ts           # Re-export → @/shared/utils
├── cacheConstants.ts         # Re-export → @/shared/config
├── cacheIcons.tsx            # Re-export → @/shared/components
├── cacheManager.ts           # Re-export → @/shared/utils
├── cacheUtils.ts             # Re-export → @/shared/utils
├── connectivityChecker.ts    # Re-export → @/shared/utils
├── constants.ts              # Re-export → @/shared/config
├── coordinateUtils.ts        # Re-export → @/shared/utils
├── coordinates.ts            # Re-export → @/features/map/utils
├── date.ts                   # Re-export → @/shared/utils
├── deletionFilter.ts         # Re-export → @/shared/utils
├── errorUtils.ts             # Re-export → @/shared/utils
├── geo.ts                    # Re-export → @/features/map/utils
├── geocache-constants.ts     # Re-export → @/features/geocache/config
├── geocache-utils.ts         # Re-export → @/features/geocache/utils
├── ipGeolocation.ts          # Re-export → @/features/map/utils
├── lruCache.ts               # Re-export → @/shared/utils
├── mapIcons.ts               # Re-export → @/features/map/utils
├── naddr-utils.ts            # Re-export → @/shared/utils
├── networkUtils.ts           # Re-export → @/shared/utils
├── nip-gc.ts                 # Re-export → @/features/geocache/utils
├── offlineStorage.ts         # Re-export → @/features/offline/utils
├── offlineSync.ts            # Re-export → @/features/offline/utils
├── osmVerification.ts        # Re-export → @/features/geocache/utils
├── performance.ts            # Re-export → @/shared/utils
├── relayConfig.ts            # Re-export → @/shared/config
├── relays.ts                 # Re-export → @/shared/utils
├── security.ts               # Re-export → @/shared/utils
├── storageConfig.ts          # Re-export → @/shared/utils
├── utils.ts                  # Re-export → @/shared/utils
├── validation.ts             # Re-export → @/shared/utils
└── verification.ts           # Re-export → @/features/geocache/utils
```

## Cleanup Strategy

### Option 1: Gradual Cleanup (Recommended)
1. **Monitor for 1-2 weeks** to ensure no import issues
2. **Search codebase** for any remaining direct imports to `src/hooks/` or `src/lib/`
3. **Update any found imports** to use new feature-based paths
4. **Remove directories** once confident all imports are updated

### Option 2: Immediate Cleanup (Aggressive)
1. **Remove both directories** immediately
2. **Fix any build errors** that arise from missed imports
3. **Update imports** as needed

## Cleanup Commands

### Step 1: Verify No Direct Imports (Recommended)
```bash
# Search for any remaining direct imports to old paths
grep -r "from ['\"]@/hooks/" src/ --exclude-dir=hooks
grep -r "from ['\"]@/lib/" src/ --exclude-dir=lib
grep -r "import.*['\"]@/hooks/" src/ --exclude-dir=hooks  
grep -r "import.*['\"]@/lib/" src/ --exclude-dir=lib

# If any results found, update those imports first
```

### Step 2: Remove Deprecated Directories
```bash
# Remove the deprecated directories
rm -rf src/hooks/
rm -rf src/lib/

# Test build
npm run build

# If build fails, restore from git and fix imports:
# git checkout HEAD -- src/hooks/ src/lib/
```

### Step 3: Update Path Aliases (Optional)
If removing the directories, consider updating `tsconfig.json` and `vite.config.ts` to remove the old path aliases:

```json
// tsconfig.json - Remove these if directories are deleted:
"@/hooks/*": ["./src/hooks/*"],
"@/lib/*": ["./src/lib/*"]
```

## Verification Steps

### Before Cleanup
1. ✅ Build successful: `npm run build`
2. ✅ All tests pass: `npm run test`
3. ✅ No direct imports found in search

### After Cleanup
1. ✅ Build still successful: `npm run build`
2. ✅ All tests still pass: `npm run test`
3. ✅ Application runs correctly: `npm run dev`
4. ✅ All features work as expected

## Rollback Plan

If issues arise after cleanup:
```bash
# Restore directories from git
git checkout HEAD~1 -- src/hooks/ src/lib/

# Or restore from specific commit
git checkout 573bdd9 -- src/hooks/ src/lib/

# Then fix any remaining imports gradually
```

## Benefits of Cleanup

### After Cleanup Complete
- ✅ **Cleaner codebase**: No deprecated directories
- ✅ **Reduced confusion**: Clear feature-based structure
- ✅ **Faster navigation**: Fewer directories to search
- ✅ **Enforced architecture**: Prevents accidental use of old paths
- ✅ **Smaller bundle**: No unused re-export files

## Notes

- **useNostr.ts**: This file should be kept or handled specially as it's a re-export from `@nostrify/react` that prevents LLM confusion
- **Build system**: Will continue to work after cleanup since all real imports use feature-based paths
- **Backward compatibility**: Will be broken after cleanup, but this is intentional to enforce new architecture

## Recommended Timeline

1. **Week 1**: Monitor for any issues with current re-export setup
2. **Week 2**: Search for and update any remaining direct imports
3. **Week 3**: Execute cleanup and verify everything works
4. **Week 4**: Remove path aliases if desired

This gradual approach ensures a smooth transition while maintaining the benefits of the new feature-based architecture.