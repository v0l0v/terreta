/**
 * Store exports - centralized exports for store functionality
 */

// Export the StoreProvider component
export { StoreProvider } from './StoreProvider';

// Export all store hooks
export {
  useGeocacheStoreContext,
  useLogStoreContext,
  useAuthorStoreContext,
  useOfflineStoreContext,
  useStores,
  useStore,
  useMultipleStores,
  useStoreStatus,
  useStoreActions,
  withStores
} from './hooks';

// Export types
export type {
  GeocacheStore,
  LogStore,
  AuthorStore,
  OfflineStore,
  UnifiedStores,
  StoreProviderProps,
  StoreConfig
} from './types';