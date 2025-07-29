/**
 * Store hooks for accessing store contexts
 * Separated from StoreProvider.tsx to avoid Fast Refresh warnings
 */

import React, { useContext, useMemo } from 'react';
import type { 
  GeocacheStore,
  LogStore,
  AuthorStore,
  OfflineStore,
  UnifiedStores,
  StoreConfig 
} from './types';
import { 
  GeocacheStoreContext, 
  LogStoreContext, 
  AuthorStoreContext, 
  OfflineStoreContext, 
  UnifiedStoresContext 
} from './contexts';

/**
 * Hook to access the geocache store
 */
export function useGeocacheStoreContext(): GeocacheStore {
  const store = useContext(GeocacheStoreContext);
  if (!store) {
    throw new Error('useGeocacheStoreContext must be used within a StoreProvider');
  }
  return store;
}

/**
 * Hook to access the log store
 */
export function useLogStoreContext(): LogStore {
  const store = useContext(LogStoreContext);
  if (!store) {
    throw new Error('useLogStoreContext must be used within a StoreProvider');
  }
  return store;
}

/**
 * Hook to access the author store
 */
export function useAuthorStoreContext(): AuthorStore {
  const store = useContext(AuthorStoreContext);
  if (!store) {
    throw new Error('useAuthorStoreContext must be used within a StoreProvider');
  }
  return store;
}

/**
 * Hook to access the offline store
 */
export function useOfflineStoreContext(): OfflineStore {
  const store = useContext(OfflineStoreContext);
  if (!store) {
    throw new Error('useOfflineStoreContext must be used within a StoreProvider');
  }
  return store;
}

/**
 * Hook to access all stores
 */
export function useStores(): UnifiedStores {
  const stores = useContext(UnifiedStoresContext);
  if (!stores) {
    throw new Error('useStores must be used within a StoreProvider');
  }
  return stores;
}

/**
 * Hook to access a specific store by name
 */
export function useStore<T extends keyof UnifiedStores>(storeName: T): UnifiedStores[T] {
  const stores = useStores();
  return stores[storeName];
}

/**
 * Hook for components that need multiple stores
 */
export function useMultipleStores<T extends (keyof UnifiedStores)[]>(
  storeNames: T
): Pick<UnifiedStores, T[number]> {
  const stores = useStores();
  
  return useMemo(() => {
    const selectedStores = {} as Pick<UnifiedStores, T[number]>;
    storeNames.forEach(storeName => {
      (selectedStores as any)[storeName] = (stores as any)[storeName];
    });
    return selectedStores;
  }, [stores, storeNames]);
}

/**
 * Hook to get store status across all stores
 */
export function useStoreStatus() {
  const stores = useStores();
  
  return useMemo(() => {
    const status = {
      isLoading: false,
      isError: false,
      errorCount: 0,
      syncStatus: {
        isActive: false,
        lastSync: null as Date | null,
        errorCount: 0,
      },
      cacheStats: {
        totalItems: 0,
        hitRate: 0,
        memoryUsage: 0,
        lastCleanup: null as Date | null,
      },
    };

    // Aggregate status from all stores
    Object.values(stores).forEach(store => {
      if (store.isLoading) status.isLoading = true;
      if (store.isError) status.isError = true;
      if (store.error) status.errorCount++;
      
      const storeStats = store.getStats();
      status.cacheStats.totalItems += storeStats.totalItems;
      status.cacheStats.memoryUsage += storeStats.memoryUsage;
      
      if (store.syncStatus.isActive) {
        status.syncStatus.isActive = true;
      }
      
      if (store.syncStatus.lastSync) {
        if (!status.syncStatus.lastSync || store.syncStatus.lastSync > status.syncStatus.lastSync) {
          status.syncStatus.lastSync = store.syncStatus.lastSync;
        }
      }
      
      status.syncStatus.errorCount += store.syncStatus.errorCount;
    });

    // Calculate average hit rate
    const storeCount = Object.keys(stores).length;
    if (storeCount > 0) {
      status.cacheStats.hitRate = Object.values(stores)
        .reduce((sum, store) => sum + store.getStats().hitRate, 0) / storeCount;
    }

    return status;
  }, [stores]);
}

/**
 * Hook to trigger actions across multiple stores
 */
export function useStoreActions() {
  const stores = useStores();
  
  return useMemo(() => ({
    // Refresh all data
    refreshAll: async () => {
      const results = await Promise.allSettled([
        stores.geocache.refreshAll(),
        stores.author.triggerSync(),
        stores.offline.triggerSync(),
      ]);
      
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      
      if (errors.length > 0) {
        throw new Error(`Failed to refresh some stores: ${errors.map(e => e.message).join(', ')}`);
      }
    },
    
    // Clear all caches
    clearAll: async () => {
      await Promise.all([
        stores.geocache.invalidateAll(),
        stores.log.invalidateAll(),
        stores.author.invalidateAll(),
        stores.offline.clearOfflineData(),
      ]);
    },
    
    // Start background sync for all stores
    startBackgroundSync: () => {
      stores.geocache.startBackgroundSync();
      stores.log.startBackgroundSync();
      stores.author.startBackgroundSync();
      stores.offline.startBackgroundSync();
    },
    
    // Stop background sync for all stores
    stopBackgroundSync: () => {
      stores.geocache.stopBackgroundSync();
      stores.log.stopBackgroundSync();
      stores.author.stopBackgroundSync();
      stores.offline.stopBackgroundSync();
    },
    
    // Update configuration for all stores
    updateConfig: (config: Partial<StoreConfig>) => {
      stores.geocache.updateConfig(config);
      stores.log.updateConfig(config);
      stores.author.updateConfig(config);
      stores.offline.updateConfig(config);
    },
  }), [stores]);
}

/**
 * Higher-order component to provide stores
 * Note: This creates a circular dependency. Use StoreProvider directly instead.
 */
export function withStores<P extends object>(
  Component: React.ComponentType<P>,
  _config?: Partial<StoreConfig>
): React.ComponentType<P> {
  // This function is deprecated - use StoreProvider directly
  // For backward compatibility, return the component as-is
  return Component;
}