# Architectural Refactoring Roadmap

## Overview
This roadmap outlines the step-by-step transformation of the Treasures project from a type-based architecture to a feature-based, maintainable architecture optimized for contributor efficiency.

## Progress Tracking
- 🔴 Not Started
- 🟡 In Progress  
- 🟢 Complete
- ⚠️ Blocked/Issues

---

## Phase 1: Foundation & Planning 🟢
**Goal**: Establish the new architecture foundation without breaking existing functionality.

### 1.1 Create New Directory Structure 🟢
- [x] Create `src/features/` directory structure
- [x] Create `src/shared/` directory for common utilities
- [x] Create `src/app/` directory for app-level concerns
- [x] Update path aliases in `tsconfig.json` and `vite.config.ts`

**Estimated Time**: 1 session
**Dependencies**: None
**Risk**: Low

### 1.2 Identify Feature Boundaries 🟢
- [x] Audit existing components and categorize by feature
- [x] Map hook dependencies between features
- [x] Identify shared vs feature-specific utilities
- [x] Document feature interaction points

**Estimated Time**: 1 session  
**Dependencies**: None
**Risk**: Medium (requires domain knowledge)

### 1.3 Create Migration Plan 🟢
- [x] Prioritize features by migration complexity
- [x] Identify breaking change points
- [x] Plan backward compatibility strategy
- [x] Create rollback procedures

**Estimated Time**: 0.5 sessions
**Dependencies**: 1.2
**Risk**: Low

---

## Phase 2: Core Infrastructure 🟢
**Goal**: Migrate shared utilities and establish new patterns.

### 2.1 Migrate Shared Components 🟢
- [x] Move `src/components/ui/` to `src/shared/components/ui/`
- [x] Move layout components to `src/shared/components/layout/`
- [x] Move common components to `src/shared/components/common/`
- [x] Update barrel exports for all shared directories
- [x] Maintain backward compatibility through re-exports
- [x] Verify build and TypeScript checks pass

**Estimated Time**: 1 session
**Dependencies**: 1.1
**Risk**: Medium (many import changes)

### 2.2 Consolidate Constants 🟢
- [x] Split `src/lib/constants.ts` by feature into logical config files
- [x] Create `src/shared/config/` directory with feature-specific configs
- [x] Move shared utilities to `src/shared/utils/`
- [x] Create barrel exports for all shared config and utils
- [x] Update imports to use new shared config location
- [x] Maintain backward compatibility through re-exports

**Estimated Time**: 1 session
**Dependencies**: 1.2, 2.1
**Risk**: Low

### 2.3 Establish Error Handling Pattern 🟢
- [x] Create `src/shared/errors/` directory with comprehensive error handling
- [x] Implement `ErrorBoundary` component with fallback UI
- [x] Create `useErrorHandler` hook with specialized error handlers
- [x] Create error types and factory functions
- [x] Move shared hooks to `src/shared/hooks/`
- [x] Update imports and maintain backward compatibility
- [x] Document error handling patterns

**Estimated Time**: 1 session
**Dependencies**: 2.1
**Risk**: Low

### 2.4 Strengthen TypeScript Configuration 🟢
- [x] Update `tsconfig.json` with strict settings
- [x] Fix all new TypeScript errors
- [x] Create shared type definitions
- [x] Document type patterns

**Estimated Time**: 1-2 sessions
**Dependencies**: None
**Risk**: High (may reveal many issues)

---

## Phase 3: Feature Migration 🟡
**Goal**: Migrate features one by one to new architecture.

### 3.1 Authentication Feature 🟢
**Priority**: High (foundational)
- [x] Create `src/features/auth/` structure
- [x] Move auth components (`LoginArea`, `SignupDialog`, etc.)
- [x] Move auth hooks (`useCurrentUser`, `useLoginActions`, etc.)
- [x] Create auth types and constants
- [x] Update imports and test auth functionality
- [x] Migrate auth tests

**Estimated Time**: 2 sessions
**Dependencies**: 2.1, 2.2
**Risk**: High (affects entire app)

### 3.2 Map Feature 🟢
**Priority**: High (core functionality)
- [x] Create `src/features/map/` structure
- [x] Move map components (`GeocacheMap`, `OfflineMap`, etc.)
- [x] Move map hooks (`useGeolocation`, map-related hooks)
- [x] Move map utilities (`coordinateUtils`, `geo.ts`, etc.)
- [x] Create map types and constants
- [x] Update imports and test map functionality
- [x] Migrate map tests

**Estimated Time**: 2-3 sessions
**Dependencies**: 2.1, 2.2
**Risk**: Medium

### 3.3 Geocache Feature 🟢
**Priority**: High (core functionality)
- [x] Create `src/features/geocache/` structure
- [x] Move geocache components (`GeocacheDialog`, `GeocacheList`, etc.)
- [x] Move geocache hooks (`useGeocaches`, `useCreateGeocache`, etc.)
- [x] Move geocache utilities (`geocache-utils.ts`, `cacheManager.ts`, etc.)
- [x] Create geocache types and constants
- [x] Update imports and test geocache functionality
- [x] Migrate geocache tests

**Estimated Time**: 3-4 sessions
**Dependencies**: 3.1, 3.2
**Risk**: High (most complex feature)

### 3.4 Profile Feature 🟢
**Priority**: Medium
- [x] Create `src/features/profile/` structure
- [x] Move profile components (`ProfileDialog`, `EditProfileForm`, etc.)
- [x] Move profile hooks (`useNip05Verification`, `useUserFoundCaches`)
- [x] Create profile types and constants
- [x] Update imports and test profile functionality
- [x] Migrate profile tests

**Estimated Time**: 1-2 sessions
**Dependencies**: 3.1
**Risk**: Low

### 3.5 Offline Feature 🔴
**Priority**: Medium
- [ ] Create `src/features/offline/` structure
- [ ] Move offline components (`OfflineSettings`, `OfflineIndicator`, etc.)
- [ ] Move offline hooks (`useOfflineStorage`, `useConnectivity`, etc.)
- [ ] Move offline utilities (`offlineStorage.ts`, `offlineSync.ts`, etc.)
- [ ] Create offline types and constants
- [ ] Update imports and test offline functionality
- [ ] Migrate offline tests

**Estimated Time**: 2 sessions
**Dependencies**: 2.1, 2.2
**Risk**: Medium

---

## Phase 4: Data Layer Simplification 🔴
**Goal**: Consolidate overlapping data management into unified system.

### 4.1 Audit Current Data Hooks 🔴
- [ ] Map all data-related hooks and their dependencies
- [ ] Identify overlapping functionality
- [ ] Document current data flow
- [ ] Plan consolidation strategy

**Estimated Time**: 1 session
**Dependencies**: Phase 3 complete
**Risk**: Medium

### 4.2 Create Unified Data Stores 🔴
- [ ] Design store interfaces for each feature
- [ ] Implement `useGeocacheStore`
- [ ] Implement `useLogStore`
- [ ] Implement `useAuthorStore`
- [ ] Implement `useOfflineStore`

**Estimated Time**: 2-3 sessions
**Dependencies**: 4.1
**Risk**: High (complex refactoring)

### 4.3 Migrate to New Data Layer 🔴
- [ ] Replace `useDataManager` with feature stores
- [ ] Replace `usePrefetchManager` with store methods
- [ ] Replace `useCacheInvalidation` with store methods
- [ ] Update all components to use new stores
- [ ] Remove old data management hooks

**Estimated Time**: 3-4 sessions
**Dependencies**: 4.2
**Risk**: High (affects entire app)

### 4.4 Optimize Performance 🔴
- [ ] Implement proper memoization in stores
- [ ] Add background sync capabilities
- [ ] Optimize query patterns
- [ ] Add performance monitoring

**Estimated Time**: 1-2 sessions
**Dependencies**: 4.3
**Risk**: Medium

---

## Phase 5: Testing & Documentation 🔴
**Goal**: Consolidate tests and improve documentation.

### 5.1 Reorganize Tests 🔴
- [ ] Move tests to feature directories
- [ ] Consolidate overlapping test files
- [ ] Create shared test utilities per feature
- [ ] Remove redundant tests

**Estimated Time**: 2-3 sessions
**Dependencies**: Phase 3 complete
**Risk**: Medium

### 5.2 Improve Test Coverage 🔴
- [ ] Add integration tests at feature boundaries
- [ ] Ensure all new patterns are tested
- [ ] Add performance tests for data layer
- [ ] Update test documentation

**Estimated Time**: 2 sessions
**Dependencies**: 5.1
**Risk**: Low

### 5.3 Update Documentation 🔴
- [ ] Create feature-specific README files
- [ ] Update main README with new architecture
- [ ] Document contribution guidelines
- [ ] Create architecture decision records (ADRs)

**Estimated Time**: 1-2 sessions
**Dependencies**: Phase 4 complete
**Risk**: Low

---

## Phase 6: Optimization & Cleanup 🔴
**Goal**: Final optimizations and cleanup.

### 6.1 Bundle Optimization 🔴
- [ ] Implement feature-based code splitting
- [ ] Optimize lazy loading strategies
- [ ] Analyze and reduce bundle size
- [ ] Add bundle analysis tools

**Estimated Time**: 1 session
**Dependencies**: Phase 4 complete
**Risk**: Low

### 6.2 Final Cleanup 🔴
- [ ] Remove old unused files
- [ ] Clean up imports and dependencies
- [ ] Update package.json scripts
- [ ] Final testing pass

**Estimated Time**: 1 session
**Dependencies**: All phases complete
**Risk**: Low

---

## Session Planning

### Recommended Session Order:
1. **Session 1**: Phase 1.1, 1.2 (Foundation)
2. **Session 2**: Phase 1.3, 2.1 (Shared Components)
3. **Session 3**: Phase 2.2, 2.3 (Constants & Errors)
4. **Session 4**: Phase 2.4 (TypeScript Strictness)
5. **Session 5-6**: Phase 3.1 (Auth Feature)
6. **Session 7-8**: Phase 3.2 (Map Feature)
7. **Session 9-12**: Phase 3.3 (Geocache Feature)
8. **Session 13-14**: Phase 3.4, 3.5 (Profile & Offline)
9. **Session 15-16**: Phase 4.1, 4.2 (Data Layer Design)
10. **Session 17-20**: Phase 4.3, 4.4 (Data Layer Migration)
11. **Session 21-23**: Phase 5 (Testing & Docs)
12. **Session 24**: Phase 6 (Final Cleanup)

### Total Estimated Time: 24 sessions

---

## Risk Mitigation

### High-Risk Items:
- **TypeScript Strictness** (2.4): May reveal many hidden issues
- **Auth Feature Migration** (3.1): Affects entire application
- **Geocache Feature Migration** (3.3): Most complex feature
- **Data Layer Migration** (4.3): Major architectural change

### Mitigation Strategies:
- Create feature branches for each phase
- Maintain backward compatibility during migration
- Extensive testing at each phase
- Rollback procedures documented
- Regular progress checkpoints

---

## Success Metrics

### Code Quality:
- [ ] Reduced cyclomatic complexity
- [ ] Improved test coverage (>90%)
- [ ] Faster build times
- [ ] Smaller bundle size

### Developer Experience:
- [ ] Faster onboarding for new contributors
- [ ] Reduced time to understand features
- [ ] Easier debugging and testing
- [ ] Clearer code review process

### Maintainability:
- [ ] Feature isolation achieved
- [ ] Consistent patterns across features
- [ ] Reduced coupling between features
- [ ] Clear dependency boundaries

---

## Notes for Future Sessions

### Context Preservation:
- Always check this roadmap at session start
- Update progress markers (🔴🟡🟢⚠️)
- Note any deviations or discoveries
- Update time estimates based on actual progress

### Decision Log:
- Record architectural decisions made
- Note any compromises or trade-offs
- Document patterns established
- Track technical debt created/resolved

---

**Last Updated**: Current Session

## Session Summary

### Completed in This Session:
- ✅ **Phase 3.4**: Profile Feature Migration
  - Created complete `src/features/profile/` structure with components, hooks, types, tests
  - Migrated 3 profile components (ProfileDialog, EditProfileForm, ProfileHeader)
  - Migrated 2 profile hooks (useNip05Verification, useUserFoundCaches)
  - Created comprehensive profile type definitions
  - Created backward compatibility re-exports for all moved files
  - Updated Profile page to use new feature structure
  - Migrated profile tests to new feature location
  - Fixed import paths for shared config and geocache components
  - Verified build passes with all profile feature changes
  - All profile tests passing (7/7 tests)

### Key Achievements:
- **Zero Breaking Changes**: All existing imports continue to work through re-exports
- **Feature Isolation**: Profile functionality is now properly isolated in its own feature directory
- **Type Safety**: Comprehensive type definitions for all profile-related interfaces
- **Maintainability**: Clear separation of concerns with proper barrel exports
- **Test Coverage**: All profile tests migrated and passing
- **Build Stability**: All changes maintain build integrity and functionality
- **Import Consistency**: Updated to use new shared config and feature structure

### Migration Progress:
- ✅ **Phase 1**: Foundation & Planning (Complete)
- ✅ **Phase 2**: Core Infrastructure (Complete)
- ✅ **Phase 3.1**: Authentication Feature (Complete)
- ✅ **Phase 3.2**: Map Feature (Complete)
- ✅ **Phase 3.3**: Geocache Feature (Complete)
- ✅ **Phase 3.4**: Profile Feature (Complete)
- 🔴 **Phase 3.5**: Offline Feature (Next)

### Next Steps:
- **Phase 3.5**: Offline Feature Migration (next session focus)
- **Phase 4**: Data Layer Simplification
- Eventually consolidate data layer and remove redundant hooks

**Current Phase**: Phase 3 (Feature Migration) 
**Next Session Focus**: Phase 3.5 - Offline Feature Migration