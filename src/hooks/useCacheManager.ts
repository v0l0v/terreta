/**
 * Hook for managing cache operations and statistics
 * Provides a clean interface to the LRU cache system
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheManager } from '@/lib/cacheManager';

export function useCacheManager() {
  const queryClient = useQueryClient();

  const invalidateGeocache = useCallback((geocacheId: string) => {
    cacheManager.removeGeocache(geocacheId);
    queryClient.invalidateQueries({ queryKey: ['geocache', geocacheId] });
    queryClient.invalidateQueries({ queryKey: ['geocaches'] });
  }, [queryClient]);

  const invalidateLogs = useCallback((geocacheId: string) => {
    cacheManager.removeLogs(geocacheId);
    queryClient.invalidateQueries({ queryKey: ['geocache-logs', geocacheId] });
  }, [queryClient]);

  const addNewLog = useCallback((geocacheId: string, log: any) => {
    cacheManager.addLog(geocacheId, log);
    // Invalidate React Query to trigger re-render
    queryClient.invalidateQueries({ queryKey: ['geocache-logs', geocacheId] });
  }, [queryClient]);

  const updateGeocache = useCallback((geocacheId: string, updates: any) => {
    // If geocache doesn't exist, set it; otherwise update it
    if (cacheManager.hasGeocache(geocacheId)) {
      cacheManager.updateGeocache(geocacheId, updates);
    } else {
      cacheManager.setGeocache(geocacheId, updates);
    }
    queryClient.invalidateQueries({ queryKey: ['geocache', geocacheId] });
    queryClient.invalidateQueries({ queryKey: ['geocaches'] });
  }, [queryClient]);

  const getStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  const clearAll = useCallback(() => {
    cacheManager.clearAll();
    queryClient.clear();
  }, [queryClient]);

  const forceRefresh = useCallback(async () => {
    // Force refresh by invalidating all queries and clearing cache
    cacheManager.clearAll();
    await queryClient.invalidateQueries();
  }, [queryClient]);

  return {
    // Cache operations
    invalidateGeocache,
    invalidateLogs,
    addNewLog,
    updateGeocache,
    
    // Cache management
    getStats,
    clearAll,
    forceRefresh,
    
    // Direct access to cache manager for advanced use
    cacheManager,
  };
}