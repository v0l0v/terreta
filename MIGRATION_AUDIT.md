# Migration Audit - Current State Analysis

## Phase 1.2: Feature Boundary Identification

### Current Component Analysis

#### Authentication Feature Components
- `src/components/auth/` (entire directory)
  - `AccountSwitcher.tsx`
  - `LoginArea.tsx` 
  - `LoginDialog.tsx`
  - `SignupDialog.tsx`
  - `WelcomeModal.tsx`
- `src/components/EditProfileForm.tsx`
- `src/components/ProfileDialog.tsx`
- `src/components/ProfileHeader.tsx`
- `src/components/LoginRequiredCard.tsx`

#### Geocache Feature Components
- `src/components/GeocacheDialog.tsx`
- `src/components/GeocacheList.tsx`
- `src/components/CacheMenu.tsx`
- `src/components/FilterButton.tsx`
- `src/components/ShareDialog.tsx`
- `src/components/ui/geocache-card.tsx`
- `src/components/ui/geocache-form.tsx`
- `src/components/ui/difficulty-terrain-rating.tsx`
- `src/components/ui/hint-display.tsx`
- `src/components/ui/comparison-filter.tsx`

#### Logging Feature Components
- `src/components/LogList.tsx`
- `src/components/LogsSection.tsx`
- `src/components/VerifiedLogForm.tsx`
- `src/components/VerificationQRDialog.tsx`
- `src/components/RegenerateQRDialog.tsx`

#### Map Feature Components
- `src/components/GeocacheMap.tsx`
- `src/components/OfflineMap.tsx`
- `src/components/LocationPicker.tsx`
- `src/components/LocationSearch.tsx`
- `src/components/LocationWarnings.tsx`
- `src/components/MapStyleSelector.tsx`

#### Offline Feature Components
- `src/components/OfflineIndicator.tsx`
- `src/components/OfflineSettings.tsx`

#### PWA Feature Components
- `src/components/PWASettings.tsx`
- `src/components/PWAUpdateNotification.tsx`

#### Relay Feature Components
- `src/components/RelayCombobox.tsx`
- `src/components/RelayErrorFallback.tsx`
- `src/components/RelaySelector.tsx`
- `src/components/RelayStatusIndicator.tsx`
- `src/components/PublishTroubleshooter.tsx`

#### Shared/Common Components (to move to src/shared/)
- `src/components/ui/` (most components except geocache-specific)
- `src/components/layout/`
- `src/components/common/`
- `src/components/DesktopHeader.tsx`
- `src/components/MobileNav.tsx`
- `src/components/ScrollToTop.tsx`
- `src/components/BlurredImage.tsx`
- `src/components/ImageGallery.tsx`
- `src/components/DeleteConfirmationDialog.tsx`
- `src/components/SaveButton.tsx`
- `src/components/ThemeProvider.tsx`
- `src/components/ThemeToggle.tsx`

#### App-Level Components (to move to src/app/)
- `src/components/AppProvider.tsx`
- `src/components/NostrProvider.tsx`

### Hook Dependencies Analysis

#### Authentication Hooks
- `useCurrentUser.ts`
- `useLoginActions.ts`
- `useLoggedInAccounts.ts`
- `useAuthor.ts`
- `useNip05Verification.ts`
- `useRegenerateVerificationKey.ts`

#### Geocache Hooks
- `useGeocache.ts`
- `useGeocaches.ts`
- `useGeocacheByNaddr.ts`
- `useGeocacheStats.ts`
- `useGeocacheNavigation.ts`
- `useCreateGeocache.ts`
- `useEditGeocache.ts`
- `useDeleteGeocache.ts`
- `useBatchDeleteGeocaches.ts`
- `useUserGeocaches.ts`
- `useUserFoundCaches.ts`
- `useSavedCaches.ts`
- `useNostrSavedCaches.ts`
- `useOptimisticGeocaches.ts`
- `useReliableProximitySearch.ts`

#### Logging Hooks
- `useGeocacheLogs.ts`
- `useCreateLog.ts`
- `useCreateVerifiedLog.ts`
- `useDeleteLog.ts`

#### Map Hooks
- `useGeolocation.ts`

#### Offline Hooks
- `useOfflineStorage.ts`
- `useOfflineStorageInfo.ts`
- `useOfflineGeocaches.ts`
- `useConnectivity.ts`
- `useStorageConfig.ts`

#### PWA Hooks
- `usePWAInstall.ts`
- `usePWAUpdate.ts`

#### Relay Hooks
- `useRelayConfig.ts`
- `useRelayStatus.ts`

#### Shared Hooks (to move to src/shared/)
- `useAppContext.ts`
- `useAsyncAction.ts`
- `useAsyncOperation.ts`
- `useForm.ts`
- `useIsMobile.tsx`
- `useLocalStorage.ts`
- `useTheme.ts`
- `useToast.ts`
- `useUploadFile.ts`
- `useDeleteWithConfirmation.ts`

#### Data Management Hooks (need consolidation)
- `useDataManager.ts`
- `usePrefetchManager.ts`
- `useCacheInvalidation.ts`
- `useCacheManager.ts`
- `usePerformanceOptimization.ts`
- `useDeletionFilter.ts`

#### Nostr Hooks (to move to src/shared/nostr/)
- `useNostr.ts`
- `useNostrPublish.ts`

### Utility/Library Analysis

#### Feature-Specific Utils
**Geocache Utils:**
- `src/lib/geocache-utils.ts`
- `src/lib/geocache-constants.ts`
- `src/lib/nip-gc.ts`
- `src/lib/cacheUtils.ts`
- `src/lib/cacheConstants.ts`
- `src/lib/cacheIcons.tsx`
- `src/lib/cacheManager.ts`
- `src/lib/cacheCleanup.ts`
- `src/lib/naddr-utils.ts`
- `src/lib/validation.ts`

**Map Utils:**
- `src/lib/geo.ts`
- `src/lib/coordinates.ts`
- `src/lib/coordinateUtils.ts`
- `src/lib/mapIcons.ts`
- `src/lib/ipGeolocation.ts`

**Auth Utils:**
- `src/lib/verification.ts`
- `src/lib/security.ts`

**Logging Utils:**
- `src/lib/osmVerification.ts`

**Offline Utils:**
- `src/lib/offlineStorage.ts`
- `src/lib/offlineSync.ts`
- `src/lib/storageConfig.ts`
- `src/lib/connectivityChecker.ts`
- `src/lib/networkUtils.ts`

**Relay Utils:**
- `src/lib/relayConfig.ts`
- `src/lib/relays.ts`

#### Shared Utils (to move to src/shared/utils/)
- `src/lib/utils.ts`
- `src/lib/constants.ts`
- `src/lib/date.ts`
- `src/lib/errorUtils.ts`
- `src/lib/performance.ts`
- `src/lib/lruCache.ts`
- `src/lib/deletionFilter.ts`

### Page Analysis

#### Feature-Specific Pages
**Auth Pages:**
- `src/pages/Profile.tsx`

**Geocache Pages:**
- `src/pages/CreateCache.tsx`
- `src/pages/CacheDetail.tsx`
- `src/pages/MyCaches.tsx`
- `src/pages/Claim.tsx`

**Map Pages:**
- `src/pages/Map.tsx`

**PWA Pages:**
- `src/pages/Install.tsx`

#### App-Level Pages (to move to src/app/pages/)
- `src/pages/Home.tsx`
- `src/pages/About.tsx`
- `src/pages/Settings.tsx`
- `src/pages/NotFound.tsx`

### Migration Priority Assessment

#### High Priority (Foundational)
1. **Authentication** - Affects entire application
2. **Shared Components** - Used everywhere

#### Medium Priority (Core Features)
3. **Map** - Core functionality, moderate complexity
4. **Geocache** - Most complex feature, depends on auth and map

#### Lower Priority (Independent Features)
5. **Logging** - Depends on geocache
6. **Offline** - Can be done in parallel
7. **PWA** - Independent
8. **Relay** - Affects all but can be done last

### Identified Issues & Risks

#### High Risk
- **Data Management Overlap**: Multiple hooks doing similar things
- **Circular Dependencies**: Some features heavily interdependent
- **TypeScript Strictness**: May reveal hidden issues

#### Medium Risk
- **Import Updates**: Many files will need import path changes
- **Test Migration**: Tests scattered across features

#### Low Risk
- **Path Alias Updates**: Straightforward configuration changes
- **Directory Structure**: Clean separation possible

### Next Steps for Phase 1.3

1. Create detailed migration plan with specific file moves
2. Identify breaking change points
3. Plan backward compatibility strategy
4. Create rollback procedures

## Status: Phase 1.2 Complete ✅

**Completed:**
- ✅ Directory structure created
- ✅ Path aliases updated
- ✅ Feature boundaries identified
- ✅ Component categorization complete
- ✅ Hook dependencies mapped
- ✅ Utility analysis complete
- ✅ Migration priorities established

**Next:** Phase 1.3 - Create Migration Plan