import { useNostrSavedCaches } from './useNostrSavedCaches';

// Use the Nostr-based implementation
export function useSavedCaches() {
  return useNostrSavedCaches();
}