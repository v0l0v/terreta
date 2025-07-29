/**
 * Unified Store Provider
 * Provides all stores through React context
 */

import React, { useMemo } from 'react';
import type { 
  UnifiedStores, 
  StoreProviderProps,
  StoreConfig 
} from './types';
import { useGeocacheStore } from './useGeocacheStore';
import { useLogStore } from './useLogStore';
import { useAuthorStore } from './useAuthorStore';
import { useOfflineStore } from './useOfflineStore';
import { DEFAULT_STORE_CONFIG } from './baseStore';
import {
  GeocacheStoreContext,
  LogStoreContext,
  AuthorStoreContext,
  OfflineStoreContext,
  UnifiedStoresContext
} from './contexts';

// Stable empty config object to prevent re-renders
const EMPTY_CONFIG = {};

/**
 * Store Provider Component - Only component export in this file
 * Use hooks from './hooks' for accessing store contexts
 */
export function StoreProvider({ children, config = EMPTY_CONFIG }: StoreProviderProps) {
  const storeConfig: StoreConfig = useMemo(() => ({
    ...DEFAULT_STORE_CONFIG,
    ...config,
  }), [config]);

  // Initialize all stores
  const geocacheStore = useGeocacheStore(storeConfig);
  const logStore = useLogStore(storeConfig);
  const authorStore = useAuthorStore(storeConfig);
  const offlineStore = useOfflineStore(storeConfig);

  // Create unified stores object
  const unifiedStores = useMemo((): UnifiedStores => ({
    geocache: geocacheStore,
    log: logStore,
    author: authorStore,
    offline: offlineStore,
  }), [geocacheStore, logStore, authorStore, offlineStore]);

  return (
    <GeocacheStoreContext.Provider value={geocacheStore}>
      <LogStoreContext.Provider value={logStore}>
        <AuthorStoreContext.Provider value={authorStore}>
          <OfflineStoreContext.Provider value={offlineStore}>
            <UnifiedStoresContext.Provider value={unifiedStores}>
              {children}
            </UnifiedStoresContext.Provider>
          </OfflineStoreContext.Provider>
        </AuthorStoreContext.Provider>
      </LogStoreContext.Provider>
    </GeocacheStoreContext.Provider>
  );
}