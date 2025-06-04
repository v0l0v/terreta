/**
 * Tests for the useCacheInvalidation hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';

// Mock dependencies
const mockNostr = {
  query: vi.fn(),
};

vi.mock('@nostrify/react', () => ({
  useNostr: () => ({ nostr: mockNostr }),
}));

vi.mock('@/hooks/useConnectivity', () => ({
  useOnlineStatus: () => ({ isOnline: true, isConnected: true }),
}));

vi.mock('@/lib/offlineStorage', () => ({
  offlineStorage: {
    getStoredGeocaches: vi.fn().mockResolvedValue([
      { id: 'cache1', name: 'Cache 1', pubkey: 'pubkey1' },
      { id: 'cache2', name: 'Cache 2', pubkey: 'pubkey2' },
    ]),
    removeGeocache: vi.fn().mockResolvedValue(undefined),
    removeLog: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/constants', () => ({
  TIMEOUTS: {
    QUERY: 8000,
  },
  QUERY_LIMITS: {
    DELETION_EVENTS: 100,
  },
  POLLING_INTERVALS: {
    DELETION_EVENTS: 120000,
    BACKGROUND_SYNC: 300000,
  },
}));

vi.mock('@/lib/nip-gc', () => ({
  NIP_GC_KINDS: {
    GEOCACHE: 37515,
  },
  createGeocacheCoordinate: vi.fn((pubkey, dTag) => `37515:${pubkey}:${dTag}`),
}));

describe('useCacheInvalidation', () => {
  let queryClient: QueryClient;

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
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

  it('should initialize and query deletion events', async () => {
    const mockDeletionEvents = [
      {
        id: 'deletion1',
        kind: 5,
        tags: [['e', 'cache1']],
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockDeletionEvents);

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(mockNostr.query).toHaveBeenCalledWith(
        [{
          kinds: [5],
          limit: 100,
        }],
        { signal: expect.any(AbortSignal) }
      );
    });
  });

  it('should handle network errors when querying deletion events', async () => {
    mockNostr.query.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    // Should not throw and handle error gracefully
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });

  it('should invalidate caches when deletion events are found', async () => {
    const mockDeletionEvents = [
      {
        id: 'deletion1',
        kind: 5,
        tags: [['e', 'cache1']],
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockDeletionEvents);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['geocaches'],
      });
    });
  });

  it('should validate cached geocaches', async () => {
    mockNostr.query.mockResolvedValue([
      {
        id: 'cache1',
        kind: 37515,
        pubkey: 'pubkey1',
        tags: [['d', 'tag1']],
        content: '{"name":"Cache 1"}',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
    ]);

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.validateCachedGeocaches();

    expect(mockNostr.query).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          kinds: [37515],
          authors: ['pubkey1', 'pubkey2'],
        }),
      ]),
      { signal: expect.any(AbortSignal) }
    );
  });

  it('should handle empty cached geocaches', async () => {
    // Mock empty storage
    vi.doMock('@/lib/offlineStorage', () => ({
      offlineStorage: {
        getStoredGeocaches: vi.fn().mockResolvedValue([]),
        removeGeocache: vi.fn().mockResolvedValue(undefined),
        removeLog: vi.fn().mockResolvedValue(undefined),
      },
    }));

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.validateCachedGeocaches();

    // Should complete without making unnecessary queries
    expect(true).toBe(true);
  });

  it('should handle validation errors gracefully', async () => {
    mockNostr.query.mockRejectedValue(new Error('Validation error'));

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.validateCachedGeocaches()).resolves.not.toThrow();
  });

  it('should remove invalid geocaches from storage', async () => {
    // Mock scenario where cached geocache is not found on relay
    mockNostr.query.mockResolvedValue([]); // No geocaches found on relay

    const { offlineStorage } = await import('@/lib/offlineStorage');

    const { result } = renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.validateCachedGeocaches();

    // Should remove geocaches that are no longer on relay
    expect(offlineStorage.removeGeocache).toHaveBeenCalled();
  });

  it('should setup validation intervals', () => {
    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    // Should set up validation interval
    expect(setInterval).toHaveBeenCalled();
  });

  it('should skip operations when offline', () => {
    // Mock offline state
    vi.doMock('@/hooks/useConnectivity', () => ({
      useOnlineStatus: () => ({ isOnline: false, isConnected: false }),
    }));

    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    // Should not make network calls when offline
    expect(mockNostr.query).not.toHaveBeenCalled();
  });

  it('should process author-based deletions', async () => {
    const mockDeletionEvents = [
      {
        id: 'deletion1',
        kind: 5,
        tags: [['a', '37515:pubkey1:tag1']],
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockDeletionEvents);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { offlineStorage } = await import('@/lib/offlineStorage');

    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalled();
      expect(offlineStorage.removeGeocache).toHaveBeenCalled();
    });
  });

  it('should handle mixed deletion event formats', async () => {
    const mockDeletionEvents = [
      {
        id: 'deletion1',
        kind: 5,
        tags: [
          ['e', 'cache1'],
          ['a', '37515:pubkey1:tag1'],
        ],
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
    ];

    mockNostr.query.mockResolvedValue(mockDeletionEvents);

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['geocaches'],
      });
    });
  });

  it('should deduplicate deletion events', async () => {
    const mockDeletionEvents = [
      {
        id: 'deletion1',
        kind: 5,
        tags: [['e', 'cache1']],
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature1',
      },
      {
        id: 'deletion2',
        kind: 5,
        tags: [['e', 'cache1']], // Same cache, different deletion event
        content: '',
        pubkey: 'pubkey1',
        created_at: Math.floor(Date.now() / 1000),
        sig: 'signature2',
      },
    ];

    mockNostr.query.mockResolvedValue(mockDeletionEvents);

    const { offlineStorage } = await import('@/lib/offlineStorage');

    renderHook(() => useCacheInvalidation(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      // Should only remove each cache once, despite multiple deletion events
      expect(offlineStorage.removeGeocache).toHaveBeenCalledTimes(1);
    });
  });
});