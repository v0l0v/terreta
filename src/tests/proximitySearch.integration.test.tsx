/**
 * Integration tests for proximity search with other system components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReliableProximitySearch } from '@/hooks/useReliableProximitySearch';
import { useDataManager } from '@/hooks/useDataManager';
import { NIP_GC_KINDS } from '@/lib/nip-gc';

// Mock geocache events with various geohash precisions
const mockGeocacheEvents = [
  {
    id: 'event1',
    pubkey: 'pubkey1',
    created_at: 1700000000,
    kind: NIP_GC_KINDS.GEOCACHE,
    content: 'NYC Cache 1',
    tags: [
      ['d', 'cache-1'],
      ['name', 'NYC Cache 1'],
      ['g', 'dr5ru7vt'], // 8-char geohash
      ['difficulty', '2'],
      ['terrain', '1'],
      ['size', 'small'],
    ],
  },
  {
    id: 'event2',
    pubkey: 'pubkey2',
    created_at: 1700000100,
    kind: NIP_GC_KINDS.GEOCACHE,
    content: 'NYC Cache 2',
    tags: [
      ['d', 'cache-2'],
      ['name', 'NYC Cache 2'],
      ['g', 'dr5ru4rsu'], // 9-char geohash
      ['difficulty', '3'],
      ['terrain', '2'],
      ['size', 'regular'],
    ],
  },
  {
    id: 'event3',
    pubkey: 'pubkey3',
    created_at: 1700000200,
    kind: NIP_GC_KINDS.GEOCACHE,
    content: 'Far Away Cache',
    tags: [
      ['d', 'cache-3'],
      ['name', 'Far Away Cache'],
      ['g', 'dqcjqcp0'], // Different area entirely
      ['difficulty', '4'],
      ['terrain', '3'],
      ['size', 'large'],
    ],
  },
  {
    id: 'event4',
    pubkey: 'pubkey4',
    created_at: 1700000300,
    kind: NIP_GC_KINDS.GEOCACHE,
    content: 'Hidden Cache',
    tags: [
      ['d', 'cache-4'],
      ['name', 'Hidden Cache'],
      ['g', 'dr5ru7vt'],
      ['difficulty', '1'],
      ['terrain', '1'],
      ['size', 'micro'],
      ['t', 'hidden'], // Hidden cache
    ],
  },
];

const mockNostrQuery = vi.fn();
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: mockNostrQuery,
    },
  }),
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: { pubkey: 'current-user-pubkey' } }),
}));

vi.mock('@/hooks/useDeletionFilter', () => ({
  useDeletionFilter: () => ({
    filterDeleted: {
      fast: (events: unknown[]) => events,
    },
  }),
}));

vi.mock('@/hooks/useConnectivity', () => ({
  useOnlineStatus: () => ({ isOnline: true, isConnected: true }),
}));

vi.mock('@/hooks/usePrefetchManager', () => ({
  usePrefetchManager: () => ({
    triggerPrefetch: vi.fn(),
    getPrefetchStatus: () => ({
      totalGeocaches: 0,
      prefetchedLogs: 0,
      prefetchedAuthors: 0,
    }),
  }),
}));

vi.mock('@/hooks/useCacheInvalidation', () => ({
  useCacheInvalidation: () => ({
    validateCachedGeocaches: vi.fn(),
  }),
}));

describe('Proximity Search Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('Geohash Precision Edge Cases', () => {
    it('should handle 8-character geocache geohashes correctly', async () => {
      const event8char = mockGeocacheEvents[0]; // 'dr5ru7vt'
      mockNostrQuery.mockResolvedValueOnce([event8char]);

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 1, // Small radius that previously failed
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.proximitySuccessful).toBe(true);
      expect(result.current.data[0].name).toBe('NYC Cache 1');
    });

    it('should handle 9-character geocache geohashes correctly', async () => {
      const event9char = mockGeocacheEvents[1]; // 'dr5ru4rsu'
      mockNostrQuery.mockResolvedValueOnce([event9char]);

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 0.5, // Very small radius
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.proximitySuccessful).toBe(true);
      expect(result.current.data[0].name).toBe('NYC Cache 2');
    });

    it('should filter out geocaches outside the radius', async () => {
      mockNostrQuery.mockResolvedValueOnce(mockGeocacheEvents);

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 10, // Should exclude the far away cache
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should find NYC caches but not the far away one
      expect(result.current.data.length).toBeGreaterThan(0);
      expect(result.current.data.every(cache => cache.name.includes('NYC'))).toBe(true);
      expect(result.current.data.some(cache => cache.name === 'Far Away Cache')).toBe(false);
    });
  });

  describe('Hidden Cache Handling', () => {
    it('should filter out hidden caches for non-owners', async () => {
      mockNostrQuery.mockResolvedValueOnce(mockGeocacheEvents);

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not include the hidden cache since current user doesn't own it
      expect(result.current.data.some(cache => cache.name === 'Hidden Cache')).toBe(false);
    });
  });

  describe('Fallback Scenarios', () => {
    it('should fallback when proximity search returns empty due to relay issues', async () => {
      // Mock proximity search returning empty, then successful broad search
      mockNostrQuery
        .mockResolvedValueOnce([]) // Empty proximity results
        .mockResolvedValueOnce(mockGeocacheEvents.slice(0, 2)); // Successful broad search

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.searchStrategy).toBe('fallback');
      expect(result.current.proximityAttempted).toBe(true);
      expect(result.current.proximitySuccessful).toBe(false);
      expect(mockNostrQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle relay timeout gracefully', async () => {
      // Mock proximity search timeout, then successful broad search
      mockNostrQuery
        .mockRejectedValueOnce(new Error('Request timeout'))
        .mockResolvedValueOnce(mockGeocacheEvents.slice(0, 2));

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.searchStrategy).toBe('fallback');
      expect(result.current.debugInfo?.errors?.[0]).toContain('timeout');
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle large numbers of geocaches efficiently', async () => {
      // Create 100 mock geocaches
      const manyGeocaches = Array.from({ length: 100 }, (_, i) => ({
        id: `event${i}`,
        pubkey: `pubkey${i}`,
        created_at: 1700000000 + i,
        kind: NIP_GC_KINDS.GEOCACHE,
        content: `Cache ${i}`,
        tags: [
          ['d', `cache-${i}`],
          ['name', `Cache ${i}`],
          ['g', 'dr5ru7vt'], // Same area
          ['difficulty', '2'],
          ['terrain', '1'],
          ['size', 'small'],
        ],
      }));

      mockNostrQuery.mockResolvedValueOnce(manyGeocaches);

      const startTime = Date.now();
      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(result.current.data).toHaveLength(100);
      expect(processingTime).toBeLessThan(1000); // Should process quickly
      expect(result.current.proximitySuccessful).toBe(true);
    });

    it('should handle empty results gracefully', async () => {
      mockNostrQuery.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(0);
      expect(result.current.searchStrategy).toBe('fallback');
      expect(result.current.totalFound).toBe(0);
    });
  });

  describe('Query Key Consistency', () => {
    it('should use consistent query keys for caching', async () => {
      mockNostrQuery.mockResolvedValue(mockGeocacheEvents);

      const options = {
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      };

      // Render the same hook twice with identical options
      const { result: result1 } = renderHook(() => useReliableProximitySearch(options), { wrapper });
      const { result: result2 } = renderHook(() => useReliableProximitySearch(options), { wrapper });

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      // Should use cached results, so only one network call
      expect(mockNostrQuery).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('should invalidate cache when parameters change', async () => {
      mockNostrQuery.mockResolvedValue(mockGeocacheEvents);

      const { result, rerender } = renderHook(
        ({ radius }: { radius: number }) => useReliableProximitySearch({
          centerLat: 40.7128,
          centerLng: -74.0060,
          radiusKm: radius,
          enableProximityOptimization: true,
        }),
        { 
          wrapper,
          initialProps: { radius: 25 }
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change radius - should trigger new query
      rerender({ radius: 50 });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have made two separate queries
      expect(mockNostrQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with DataManager', () => {
    it('should work correctly when used alongside DataManager', async () => {
      mockNostrQuery.mockResolvedValue(mockGeocacheEvents);

      const { result: dataManagerResult } = renderHook(() => useDataManager({
        enablePolling: true,
        enablePrefetching: true,
      }), { wrapper });

      const { result: proximityResult } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(dataManagerResult.current.isLoading).toBe(false);
        expect(proximityResult.current.isLoading).toBe(false);
      });

      // Both should have data
      expect(dataManagerResult.current.geocaches.length).toBeGreaterThan(0);
      expect(proximityResult.current.data.length).toBeGreaterThan(0);

      // DataManager refresh should not interfere with proximity search
      await dataManagerResult.current.refreshAll();

      expect(proximityResult.current.data.length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should clean up resources properly', async () => {
      mockNostrQuery.mockResolvedValue(mockGeocacheEvents);

      const { result, unmount } = renderHook(() => useReliableProximitySearch({
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusKm: 25,
        enableProximityOptimization: true,
      }), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid parameter changes without memory leaks', async () => {
      mockNostrQuery.mockResolvedValue(mockGeocacheEvents);

      const { result, rerender } = renderHook(
        ({ lat }: { lat: number }) => useReliableProximitySearch({
          centerLat: lat,
          centerLng: -74.0060,
          radiusKm: 25,
          enableProximityOptimization: true,
        }),
        { 
          wrapper,
          initialProps: { lat: 40.7128 }
        }
      );

      // Rapidly change parameters
      for (let i = 0; i < 10; i++) {
        rerender({ lat: 40.7128 + i * 0.001 });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still work correctly
      expect(result.current.data.length).toBeGreaterThan(0);
    });
  });
});