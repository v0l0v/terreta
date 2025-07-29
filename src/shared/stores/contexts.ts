/**
 * Store contexts
 * Separated from StoreProvider.tsx to avoid Fast Refresh warnings
 */

import { createContext } from 'react';
import type { 
  GeocacheStore,
  LogStore,
  AuthorStore,
  OfflineStore,
  UnifiedStores 
} from './types';

// Ensure React is available before creating contexts
if (typeof createContext !== 'function') {
  throw new Error('React is not properly loaded. Please ensure React is available before importing this module.');
}

// Create contexts for each store
export const GeocacheStoreContext = createContext<GeocacheStore | null>(null);
export const LogStoreContext = createContext<LogStore | null>(null);
export const AuthorStoreContext = createContext<AuthorStore | null>(null);
export const OfflineStoreContext = createContext<OfflineStore | null>(null);
export const UnifiedStoresContext = createContext<UnifiedStores | null>(null);