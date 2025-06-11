# Detailed Migration Plan - Phase 1.3

## Migration Strategy

### Backward Compatibility Approach
- Maintain existing import paths during migration
- Use barrel exports (`index.ts`) to re-export from new locations
- Gradually update imports after each feature migration
- Keep old structure until all features are migrated

### Breaking Change Management
- Each phase will be done in a separate commit
- Test suite must pass after each phase
- Rollback plan: revert to previous commit if issues arise
- No breaking changes to public API during migration

## Detailed File Migration Plan

### Phase 2.1: Migrate Shared Components (Priority 1)

#### Step 1: Move UI Components
```bash
# Move all UI components except geocache-specific ones
mv src/components/ui/* src/shared/components/ui/ (except geocache-specific)

# Geocache-specific UI components stay for now:
# - geocache-card.tsx
# - geocache-form.tsx  
# - difficulty-terrain-rating.tsx
# - hint-display.tsx
# - comparison-filter.tsx
```

#### Step 2: Move Layout Components
```bash
mv src/components/layout/* src/shared/components/layout/
mv src/components/DesktopHeader.tsx src/shared/components/layout/
mv src/components/MobileNav.tsx src/shared/components/layout/
mv src/components/ScrollToTop.tsx src/shared/components/layout/
```

#### Step 3: Move Common Components
```bash
mv src/components/common/* src/shared/components/common/
mv src/components/BlurredImage.tsx src/shared/components/common/
mv src/components/ImageGallery.tsx src/shared/components/common/
mv src/components/DeleteConfirmationDialog.tsx src/shared/components/common/
mv src/components/SaveButton.tsx src/shared/components/common/
mv src/components/ThemeProvider.tsx src/shared/components/common/
mv src/components/ThemeToggle.tsx src/shared/components/common/
```

#### Step 4: Create Barrel Exports
Create `src/shared/components/index.ts` to re-export all shared components.

### Phase 2.2: Consolidate Constants

#### Step 1: Split Constants by Feature
```bash
# Create feature-specific constant files:
# src/features/geocache/utils/constants.ts
# src/features/map/utils/constants.ts
# src/features/auth/utils/constants.ts
# etc.
```

#### Step 2: Create Shared Config
```bash
# Move shared constants to:
# src/shared/config/defaults.ts
# src/shared/config/timeouts.ts
# src/shared/config/limits.ts
```

### Phase 3: Feature Migration (Detailed Steps)

#### Phase 3.1: Authentication Feature

**Components to Move:**
```bash
mv src/components/auth/* src/features/auth/components/
mv src/components/EditProfileForm.tsx src/features/auth/components/
mv src/components/ProfileDialog.tsx src/features/auth/components/
mv src/components/ProfileHeader.tsx src/features/auth/components/
mv src/components/LoginRequiredCard.tsx src/features/auth/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useCurrentUser.ts src/features/auth/hooks/
mv src/hooks/useLoginActions.ts src/features/auth/hooks/
mv src/hooks/useLoggedInAccounts.ts src/features/auth/hooks/
mv src/hooks/useAuthor.ts src/features/auth/hooks/
mv src/hooks/useNip05Verification.ts src/features/auth/hooks/
mv src/hooks/useRegenerateVerificationKey.ts src/features/auth/hooks/
```

**Utils to Move:**
```bash
mv src/lib/verification.ts src/features/auth/utils/
mv src/lib/security.ts src/features/auth/utils/
```

**Pages to Move:**
```bash
mv src/pages/Profile.tsx src/features/auth/components/ProfilePage.tsx
```

**Create Feature Barrel Export:**
```typescript
// src/features/auth/index.ts
export * from './components';
export * from './hooks';
export * from './utils';
export * from './types';
```

#### Phase 3.2: Map Feature

**Components to Move:**
```bash
mv src/components/GeocacheMap.tsx src/features/map/components/
mv src/components/OfflineMap.tsx src/features/map/components/
mv src/components/LocationPicker.tsx src/features/map/components/
mv src/components/LocationSearch.tsx src/features/map/components/
mv src/components/LocationWarnings.tsx src/features/map/components/
mv src/components/MapStyleSelector.tsx src/features/map/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useGeolocation.ts src/features/map/hooks/
```

**Utils to Move:**
```bash
mv src/lib/geo.ts src/features/map/utils/
mv src/lib/coordinates.ts src/features/map/utils/
mv src/lib/coordinateUtils.ts src/features/map/utils/
mv src/lib/mapIcons.ts src/features/map/utils/
mv src/lib/ipGeolocation.ts src/features/map/utils/
```

**Pages to Move:**
```bash
mv src/pages/Map.tsx src/features/map/components/MapPage.tsx
```

#### Phase 3.3: Geocache Feature (Most Complex)

**Components to Move:**
```bash
mv src/components/GeocacheDialog.tsx src/features/geocache/components/
mv src/components/GeocacheList.tsx src/features/geocache/components/
mv src/components/CacheMenu.tsx src/features/geocache/components/
mv src/components/FilterButton.tsx src/features/geocache/components/
mv src/components/ShareDialog.tsx src/features/geocache/components/

# Move geocache-specific UI components
mv src/components/ui/geocache-card.tsx src/features/geocache/components/
mv src/components/ui/geocache-form.tsx src/features/geocache/components/
mv src/components/ui/difficulty-terrain-rating.tsx src/features/geocache/components/
mv src/components/ui/hint-display.tsx src/features/geocache/components/
mv src/components/ui/comparison-filter.tsx src/features/geocache/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useGeocache.ts src/features/geocache/hooks/
mv src/hooks/useGeocaches.ts src/features/geocache/hooks/
mv src/hooks/useGeocacheByNaddr.ts src/features/geocache/hooks/
mv src/hooks/useGeocacheStats.ts src/features/geocache/hooks/
mv src/hooks/useGeocacheNavigation.ts src/features/geocache/hooks/
mv src/hooks/useCreateGeocache.ts src/features/geocache/hooks/
mv src/hooks/useEditGeocache.ts src/features/geocache/hooks/
mv src/hooks/useDeleteGeocache.ts src/features/geocache/hooks/
mv src/hooks/useBatchDeleteGeocaches.ts src/features/geocache/hooks/
mv src/hooks/useUserGeocaches.ts src/features/geocache/hooks/
mv src/hooks/useUserFoundCaches.ts src/features/geocache/hooks/
mv src/hooks/useSavedCaches.ts src/features/geocache/hooks/
mv src/hooks/useNostrSavedCaches.ts src/features/geocache/hooks/
mv src/hooks/useOptimisticGeocaches.ts src/features/geocache/hooks/
mv src/hooks/useReliableProximitySearch.ts src/features/geocache/hooks/
```

**Utils to Move:**
```bash
mv src/lib/geocache-utils.ts src/features/geocache/utils/
mv src/lib/geocache-constants.ts src/features/geocache/utils/
mv src/lib/nip-gc.ts src/features/geocache/utils/
mv src/lib/cacheUtils.ts src/features/geocache/utils/
mv src/lib/cacheConstants.ts src/features/geocache/utils/
mv src/lib/cacheIcons.tsx src/features/geocache/utils/
mv src/lib/cacheManager.ts src/features/geocache/utils/
mv src/lib/cacheCleanup.ts src/features/geocache/utils/
mv src/lib/naddr-utils.ts src/features/geocache/utils/
mv src/lib/validation.ts src/features/geocache/utils/
```

**Pages to Move:**
```bash
mv src/pages/CreateCache.tsx src/features/geocache/components/CreateCachePage.tsx
mv src/pages/CacheDetail.tsx src/features/geocache/components/CacheDetailPage.tsx
mv src/pages/MyCaches.tsx src/features/geocache/components/MyCachesPage.tsx
mv src/pages/Claim.tsx src/features/geocache/components/ClaimPage.tsx
```

#### Phase 3.4: Logging Feature

**Components to Move:**
```bash
mv src/components/LogList.tsx src/features/logging/components/
mv src/components/LogsSection.tsx src/features/logging/components/
mv src/components/VerifiedLogForm.tsx src/features/logging/components/
mv src/components/VerificationQRDialog.tsx src/features/logging/components/
mv src/components/RegenerateQRDialog.tsx src/features/logging/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useGeocacheLogs.ts src/features/logging/hooks/
mv src/hooks/useCreateLog.ts src/features/logging/hooks/
mv src/hooks/useCreateVerifiedLog.ts src/features/logging/hooks/
mv src/hooks/useDeleteLog.ts src/features/logging/hooks/
```

**Utils to Move:**
```bash
mv src/lib/osmVerification.ts src/features/logging/utils/
```

#### Phase 3.5: Offline Feature

**Components to Move:**
```bash
mv src/components/OfflineIndicator.tsx src/features/offline/components/
mv src/components/OfflineSettings.tsx src/features/offline/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useOfflineStorage.ts src/features/offline/hooks/
mv src/hooks/useOfflineStorageInfo.ts src/features/offline/hooks/
mv src/hooks/useOfflineGeocaches.ts src/features/offline/hooks/
mv src/hooks/useConnectivity.ts src/features/offline/hooks/
mv src/hooks/useStorageConfig.ts src/features/offline/hooks/
```

**Utils to Move:**
```bash
mv src/lib/offlineStorage.ts src/features/offline/utils/
mv src/lib/offlineSync.ts src/features/offline/utils/
mv src/lib/storageConfig.ts src/features/offline/utils/
mv src/lib/connectivityChecker.ts src/features/offline/utils/
mv src/lib/networkUtils.ts src/features/offline/utils/
```

#### Phase 3.6: PWA Feature

**Components to Move:**
```bash
mv src/components/PWASettings.tsx src/features/pwa/components/
mv src/components/PWAUpdateNotification.tsx src/features/pwa/components/
```

**Hooks to Move:**
```bash
mv src/hooks/usePWAInstall.ts src/features/pwa/hooks/
mv src/hooks/usePWAUpdate.ts src/features/pwa/hooks/
```

**Pages to Move:**
```bash
mv src/pages/Install.tsx src/features/pwa/components/InstallPage.tsx
```

#### Phase 3.7: Relay Feature

**Components to Move:**
```bash
mv src/components/RelayCombobox.tsx src/features/relay/components/
mv src/components/RelayErrorFallback.tsx src/features/relay/components/
mv src/components/RelaySelector.tsx src/features/relay/components/
mv src/components/RelayStatusIndicator.tsx src/features/relay/components/
mv src/components/PublishTroubleshooter.tsx src/features/relay/components/
```

**Hooks to Move:**
```bash
mv src/hooks/useRelayConfig.ts src/features/relay/hooks/
mv src/hooks/useRelayStatus.ts src/features/relay/hooks/
```

**Utils to Move:**
```bash
mv src/lib/relayConfig.ts src/features/relay/utils/
mv src/lib/relays.ts src/features/relay/utils/
```

### Phase 2.3: Move Shared Hooks

```bash
mv src/hooks/useAppContext.ts src/shared/hooks/
mv src/hooks/useAsyncAction.ts src/shared/hooks/
mv src/hooks/useAsyncOperation.ts src/shared/hooks/
mv src/hooks/useForm.ts src/shared/hooks/
mv src/hooks/useIsMobile.tsx src/shared/hooks/
mv src/hooks/useLocalStorage.ts src/shared/hooks/
mv src/hooks/useTheme.ts src/shared/hooks/
mv src/hooks/useToast.ts src/shared/hooks/
mv src/hooks/useUploadFile.ts src/shared/hooks/
mv src/hooks/useDeleteWithConfirmation.ts src/shared/hooks/
```

### Phase 2.4: Move Nostr Hooks

```bash
mv src/hooks/useNostr.ts src/shared/nostr/
mv src/hooks/useNostrPublish.ts src/shared/nostr/
```

### Phase 2.5: Move Shared Utils

```bash
mv src/lib/utils.ts src/shared/utils/
mv src/lib/constants.ts src/shared/utils/
mv src/lib/date.ts src/shared/utils/
mv src/lib/errorUtils.ts src/shared/utils/
mv src/lib/performance.ts src/shared/utils/
mv src/lib/lruCache.ts src/shared/utils/
mv src/lib/deletionFilter.ts src/shared/utils/
```

### Phase 2.6: Move App-Level Components

```bash
mv src/components/AppProvider.tsx src/app/providers/
mv src/components/NostrProvider.tsx src/app/providers/
```

### Phase 2.7: Move App-Level Pages

```bash
mv src/pages/Home.tsx src/app/pages/
mv src/pages/About.tsx src/app/pages/
mv src/pages/Settings.tsx src/app/pages/
mv src/pages/NotFound.tsx src/app/pages/
```

## Import Update Strategy

### Phase-by-Phase Import Updates

After each feature migration:

1. **Create barrel exports** in the new feature directory
2. **Update imports** in the migrated feature files
3. **Create temporary re-exports** in old locations for backward compatibility
4. **Update external imports** gradually
5. **Remove temporary re-exports** once all imports are updated

### Example Barrel Export Structure

```typescript
// src/features/auth/index.ts
export * from './components';
export * from './hooks';
export * from './utils';
export * from './types';

// src/features/auth/components/index.ts
export { LoginArea } from './LoginArea';
export { LoginDialog } from './LoginDialog';
export { AccountSwitcher } from './AccountSwitcher';
// ... etc

// src/features/auth/hooks/index.ts
export { useCurrentUser } from './useCurrentUser';
export { useLoginActions } from './useLoginActions';
// ... etc
```

### Temporary Backward Compatibility

```typescript
// src/components/auth/index.ts (temporary)
export * from '@/features/auth/components';

// src/hooks/useCurrentUser.ts (temporary)
export { useCurrentUser } from '@/features/auth/hooks';
```

## Testing Strategy

### Test Migration Plan

1. **Move tests with their features**
2. **Update test imports** to use new paths
3. **Ensure all tests pass** after each phase
4. **Add integration tests** at feature boundaries

### Test File Moves

```bash
# Move feature-specific tests
mv src/tests/auth-*.test.tsx src/features/auth/components/__tests__/
mv src/tests/geocache-*.test.tsx src/features/geocache/components/__tests__/
# ... etc
```

## Rollback Procedures

### Git Strategy
- Each phase is a separate commit
- Tag major milestones
- Keep detailed commit messages
- Use feature branches for risky changes

### Rollback Commands
```bash
# Rollback to previous phase
git reset --hard HEAD~1

# Rollback to specific phase
git reset --hard <phase-tag>

# Rollback specific files
git checkout HEAD~1 -- src/path/to/file
```

## Risk Mitigation

### High-Risk Mitigation
1. **TypeScript Errors**: Fix incrementally, use `@ts-ignore` temporarily if needed
2. **Circular Dependencies**: Identify and break during migration
3. **Test Failures**: Fix immediately, don't proceed until green

### Medium-Risk Mitigation
1. **Import Path Updates**: Use find/replace with verification
2. **Missing Exports**: Add barrel exports proactively
3. **Build Failures**: Test build after each major change

## Success Criteria

### Phase Completion Criteria
- [ ] All files moved to correct locations
- [ ] All imports updated and working
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] No runtime errors in development

### Overall Success Metrics
- [ ] Feature isolation achieved
- [ ] Clear dependency boundaries
- [ ] Improved developer experience
- [ ] Maintained functionality
- [ ] Better test organization

## Next Steps

1. **Begin Phase 2.1**: Start with shared component migration
2. **Create feature branches** for each major phase
3. **Set up automated testing** to catch regressions
4. **Document decisions** as we go

## Status: Phase 1.3 Complete ✅

**Completed:**
- ✅ Detailed migration plan created
- ✅ File move strategies defined
- ✅ Backward compatibility approach established
- ✅ Testing strategy outlined
- ✅ Rollback procedures documented

**Next:** Phase 2.1 - Begin Shared Component Migration