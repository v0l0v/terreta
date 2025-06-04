/**
 * Tests for the usePrefetchManager hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { usePrefetchManager, useGeocachePrefetch } from '@/hooks/usePrefetchManager';
import type { Geocache } from '@/types/geocache';

// Mock dependencies
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn().mockResolvedValue([]),
    },
  }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { pubkey: 'test-pubkey' } }),
}));

vi.mock('@/hooks/useConnectivity', () => ({
  useOnlineStatus: () => ({ isOnline: true }),
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  TIMEOUTS: {
    FAST_QUERY: 3000,
    QUERY: 8000,
  },
  POLLING_INTERVALS: {
    GEOCACHES: 60000,
    LOGS: 30000,
    BACKGROUND_SYNC: 300000,
  },
  QUERY_LIMITS: {
    GEOCACHES: 100,
    LOGS: 200,
  },
}));

vi.mock('@/lib/nip-gc', () => ({
  NIP_GC_KINDS: {
    GEOCACHE: 37515,
    FOUND_LOG: 3753515,
    COMMENT_LOG: 3753516,
  },
  createGeocacheCoordinate: vi.fn((pubkey, dTag) => `37515:${pubkey}:${dTag}`),
  parseLogEvent: vi.fn((event) => ({ id: event.id, type: 'found' })),
}));

describe('usePrefetchManager', () => {
  let queryClient: QueryClient;

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  const mockGeocache: Geocache = {
    id: 'test-cache-1',
    name: 'Test Cache',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    dTag: 'test-tag',
    difficulty: 1,
    terrain: 1,
    size: 'regular',
    type: 'traditional',
    description: 'Test description',
    location: { lat: 40.7128, lng: -74.0060 },
    images: [],
    hidden: false,
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('usePrefetchManager', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isActive).toBe(true);
      expect(typeof result.current.triggerPrefetch).toBe('function');
      expect(typeof result.current.getPrefetchStatus).toBe('function');
    });

    it('should handle custom options', () => {
      const options = {
        enableBackgroundPolling: false,
        enablePrefetching: true,
        priorityGeocaches: ['cache1'],
      };

      const { result } = renderHook(() => usePrefetchManager(options), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should provide prefetch status', () => {
      // Add some test data to query cache
      queryClient.setQueryData(['geocaches'], [mockGeocache]);

      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      const status = result.current.getPrefetchStatus();

      expect(status).toEqual({
        totalGeocaches: 1,
        prefetchedLogs: 0,
        prefetchedAuthors: 0,
        isPolling: true,
        isPrefetching: true,
      });
    });

    it('should handle manual prefetch trigger', async () => {
      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.triggerPrefetch(['cache1']);
      });

      // Should not throw and complete successfully
      expect(true).toBe(true);
    });

    it('should prefetch geocache logs', async () => {
      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

      await act(async () => {
        await result.current.prefetchGeocacheLogs(mockGeocache);
      });

      expect(prefetchQuerySpy).toHaveBeenCalledWith({
        queryKey: ['geocache-logs', 'test-tag', 'test-pubkey'],
        queryFn: expect.any(Function),
        staleTime: 30000,
      });
    });

    it('should prefetch author metadata', async () => {
      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

      await act(async () => {
        await result.current.prefetchAuthors(['pubkey1', 'pubkey2']);
      });

      expect(prefetchQuerySpy).toHaveBeenCalledTimes(2);
    });

    it('should skip prefetch for geocache without dTag or pubkey', async () => {
      const invalidGeocache = { ...mockGeocache, dTag: undefined };
      
      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

      await act(async () => {
        await result.current.prefetchGeocacheLogs(invalidGeocache);
      });

      expect(prefetchQuerySpy).not.toHaveBeenCalled();
    });

    it('should skip prefetch when data is fresh', async () => {
      const queryKey = ['geocache-logs', 'test-tag', 'test-pubkey'];
      
      // Set fresh data
      queryClient.setQueryData(queryKey, []);
      queryClient.setQueryState(queryKey, {
        data: [],
        dataUpdatedAt: Date.now() - 15000, // 15 seconds ago (fresh)
        error: null,
        status: 'success',
      });

      const { result } = renderHook(() => usePrefetchManager(), {
        wrapper: createWrapper(queryClient),
      });

      const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

      await act(async () => {
        await result.current.prefetchGeocacheLogs(mockGeocache);
      });

      expect(prefetchQuerySpy).not.toHaveBeenCalled();
    });

    it('should setup background polling intervals', () => {
      const options = {
        enableBackgroundPolling: true,
        enablePrefetching: true,
        priorityGeocaches: ['cache1'],
      };

      renderHook(() => usePrefetchManager(options), {
        wrapper: createWrapper(queryClient),
      });

      // Verify intervals are set
      expect(setInterval).toHaveBeenCalledTimes(3);
    });

    it('should cleanup intervals on unmount', () => {
      const options = {
        enableBackgroundPolling: true,
        enablePrefetching: true,
        priorityGeocaches: [],
      };

      const { unmount } = renderHook(() => usePrefetchManager(options), {
        wrapper: createWrapper(queryClient),
      });

      unmount();

      // Verify clearInterval was called
      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('useGeocachePrefetch', () => {
    it('should provide prefetch functions', () => {
      const { result } = renderHook(() => useGeocachePrefetch(), {
        wrapper: createWrapper(queryClient),
      });

      expect(typeof result.current.prefetchGeocache).toBe('function');
      expect(typeof result.current.prefetchMultiple).toBe('function');
    });

    it('should handle geocache prefetch', async () => {
      const { result } = renderHook(() => useGeocachePrefetch(), {
        wrapper: createWrapper(queryClient),
      });

      const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery');

      await act(async () => {
        await result.current.prefetchGeocache(mockGeocache);
      });

      expect(prefetchQuerySpy).toHaveBeenCalled();
    });

    it('should handle multiple prefetch', async () => {
      const { result } = renderHook(() => useGeocachePrefetch(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.prefetchMultiple(['cache1', 'cache2']);
      });

      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Background Updates', () => {
    it('should handle background geocache updates', () => {
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');
      
      // Set up existing data
      queryClient.setQueryData(['geocaches'], [mockGeocache]);

      const options = {
        enableBackgroundPolling: true,
        enablePrefetching: true,
        priorityGeocaches: [],
      };

      renderHook(() => usePrefetchManager(options), {
        wrapper: createWrapper(queryClient),
      });

      // Trigger background update by advancing timer
      act(() => {
        vi.advanceTimersByTime(60000); // 1 minute
      });

      // Background update should be triggered
      expect(setQueryDataSpy).toHaveBeenCalled();
    });

    it('should skip background updates when offline', () => {
      // Mock offline state
      vi.doMock('@/hooks/useConnectivity', () => ({
        useOnlineStatus: () => ({ isOnline: false }),
      }));

      const options = {
        enableBackgroundPolling: true,
        enablePrefetching: true,
        priorityGeocaches: [],
      };

      renderHook(() => usePrefetchManager(options), {
        wrapper: createWrapper(queryClient),
      });

      // No intervals should be set when offline
      expect(setInterval).not.toHaveBeenCalled();
    });
  });
});