/**
 * COMPATIBILITY LAYER: usePrefetchManager
 * This hook provides simple compatibility while the app uses SimpleStoreProvider
 */

// Simple implementation that doesn't require store context
export function useGeocachePrefetch() {
  return {
    prefetchGeocache: async (geocache: any) => {
      // No-op implementation for compatibility
    },
    prefetchMultiple: async (geocacheIds: string[]) => {
      // No-op implementation for compatibility
    },
  };
}

// Legacy export for backward compatibility
export function usePrefetchManager(options: any = {}) {
  return useGeocachePrefetch();
}