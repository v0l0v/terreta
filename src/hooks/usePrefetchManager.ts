/**
 * Centralized prefetching and background update manager
 * Coordinates prefetching of related data and manages polling intervals
 */

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useOnlineStatus } from '@/hooks/useConnectivity';
import { NIP_GC_KINDS, createGeocacheCoordinate, parseGeocacheEvent, parseLogEvent } from '@/lib/nip-gc';
import { TIMEOUTS, POLLING_INTERVALS, QUERY_LIMITS } from '@/lib/constants';
import type { Geocache } from '@/types/geocache';
import type { NostrEvent } from '@nostrify/nostrify';

interface PrefetchManagerOptions {
  enableBackgroundPolling?: boolean;
  enablePrefetching?: boolean;
  priorityGeocaches?: string[]; // Geocache IDs to prioritize for prefetching
}

/**
 * Hook that manages prefetching and background updates for optimal performance
 */
export function usePrefetchManager(options: PrefetchManagerOptions = {}) {
  const {
    enableBackgroundPolling = true,
    enablePrefetching = true,
    priorityGeocaches = [],
  } = options;

  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { isOnline } = useOnlineStatus();
  const queryClient = useQueryClient();
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  /**
   * Prefetch logs for a specific geocache
   */
  const prefetchGeocacheLogs = useCallback(async (geocache: Geocache) => {
    if (!geocache.dTag || !geocache.pubkey) return;

    const queryKey = ['geocache-logs', geocache.dTag, geocache.pubkey];
    
    // Only prefetch if not already cached or stale
    const existingData = queryClient.getQueryData(queryKey);
    const queryState = queryClient.getQueryState(queryKey);
    
    if (existingData && queryState && Date.now() - queryState.dataUpdatedAt < 30000) {
      return; // Data is fresh, skip prefetch
    }

    try {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const signal = AbortSignal.timeout(TIMEOUTS.FAST_QUERY);
          const geocacheCoordinate = createGeocacheCoordinate(geocache.pubkey!, geocache.dTag!);
          const allEvents: NostrEvent[] = [];

          try {
            const foundLogs = await nostr.query([{
              kinds: [NIP_GC_KINDS.FOUND_LOG],
              '#a': [geocacheCoordinate],
              limit: 50,
            }], { signal });
            allEvents.push(...foundLogs);
          } catch (error) {
            console.warn('Failed to prefetch found logs:', error);
          }

          try {
            const commentLogs = await nostr.query([{
              kinds: [NIP_GC_KINDS.COMMENT_LOG],
              '#a': [geocacheCoordinate],
              '#A': [geocacheCoordinate],
              limit: 50,
            }], { signal });
            allEvents.push(...commentLogs);
          } catch (error) {
            console.warn('Failed to prefetch comment logs:', error);
          }

          return allEvents.map(parseLogEvent).filter(Boolean);
        },
        staleTime: 30000,
      });
    } catch (error) {
      console.warn('Failed to prefetch logs for geocache:', geocache.id, error);
    }
  }, [nostr, queryClient]);

  /**
   * Prefetch author metadata for multiple pubkeys
   */
  const prefetchAuthors = useCallback(async (pubkeys: string[]) => {
    const uniquePubkeys = [...new Set(pubkeys)];
    
    for (const pubkey of uniquePubkeys.slice(0, 10)) { // Limit to 10 authors at once
      try {
        await queryClient.prefetchQuery({
          queryKey: ['author', pubkey],
          queryFn: async () => {
            const signal = AbortSignal.timeout(TIMEOUTS.FAST_QUERY);
            const events = await nostr.query([{
              kinds: [0], // Profile metadata
              authors: [pubkey],
              limit: 1,
            }], { signal });
            
            return events[0] || null;
          },
          staleTime: 300000, // 5 minutes for author data
        });
      } catch (error) {
        console.warn('Failed to prefetch author:', pubkey, error);
      }
    }
  }, [nostr, queryClient]);

  /**
   * Background update for geocaches
   */
  const backgroundUpdateGeocaches = useCallback(async () => {
    if (!isOnline) return;

    try {
      const signal = AbortSignal.timeout(TIMEOUTS.QUERY);
      const events = await nostr.query([{
        kinds: [NIP_GC_KINDS.GEOCACHE],
        limit: QUERY_LIMITS.GEOCACHES,
        since: Math.floor((Date.now() - POLLING_INTERVALS.GEOCACHES * 2) / 1000), // Only recent updates
      }], { signal });

      if (events.length > 0) {
        // Update the cache with new data
        queryClient.setQueryData(['geocaches'], (oldData: unknown) => {
          const geocaches = oldData as Geocache[] | undefined;
          if (!geocaches) return geocaches;

          const newGeocaches = events.map(parseGeocacheEvent).filter((g): g is Geocache => g !== null);
          const updatedData = [...geocaches];

          // Update existing geocaches or add new ones
          for (const newGeocache of newGeocaches) {
            const existingIndex = updatedData.findIndex(g => g.id === newGeocache.id);
            if (existingIndex >= 0) {
              updatedData[existingIndex] = newGeocache;
            } else {
              // Only add if not hidden or user is the creator
              if (!newGeocache.hidden || newGeocache.pubkey === user?.pubkey) {
                updatedData.unshift(newGeocache);
              }
            }
          }

          return updatedData.slice(0, QUERY_LIMITS.GEOCACHES * 2); // Keep reasonable size
        });

        console.log(`Background updated ${events.length} geocaches`);
      }
    } catch (error) {
      console.warn('Background geocache update failed:', error);
    }
  }, [nostr, queryClient, isOnline, user?.pubkey]);

  /**
   * Background update for logs of priority geocaches
   */
  const backgroundUpdateLogs = useCallback(async () => {
    if (!isOnline || priorityGeocaches.length === 0) return;

    for (const geocacheId of priorityGeocaches.slice(0, 3)) { // Limit to 3 at once
      try {
        const geocacheData = queryClient.getQueryData(['geocache', geocacheId]) as Geocache | undefined;
        if (!geocacheData?.dTag || !geocacheData?.pubkey) continue;

        const signal = AbortSignal.timeout(TIMEOUTS.FAST_QUERY);
        const geocacheCoordinate = createGeocacheCoordinate(geocacheData.pubkey, geocacheData.dTag);
        
        const recentLogs = await nostr.query([{
          kinds: [NIP_GC_KINDS.FOUND_LOG, NIP_GC_KINDS.COMMENT_LOG],
          '#a': [geocacheCoordinate],
          since: Math.floor((Date.now() - POLLING_INTERVALS.LOGS * 2) / 1000),
          limit: 20,
        }], { signal });

        if (recentLogs.length > 0) {
          const queryKey = ['geocache-logs', geocacheData.dTag, geocacheData.pubkey];
          queryClient.invalidateQueries({ queryKey });
          console.log(`Background updated logs for geocache ${geocacheId}: ${recentLogs.length} new logs`);
        }
      } catch (error) {
        console.warn('Background log update failed for geocache:', geocacheId, error);
      }
    }
  }, [nostr, queryClient, isOnline, priorityGeocaches]);

  /**
   * Smart prefetching based on current data
   */
  const smartPrefetch = useCallback(async () => {
    if (!enablePrefetching || !isOnline) return;

    // Get current geocaches
    const geocaches = queryClient.getQueryData(['geocaches']) as Geocache[] | undefined;
    if (!geocaches || geocaches.length === 0) return;

    // Prefetch logs for top geocaches
    const topGeocaches = geocaches.slice(0, 5);
    for (const geocache of topGeocaches) {
      await prefetchGeocacheLogs(geocache);
    }

    // Prefetch author metadata
    const authorPubkeys = geocaches.slice(0, 10).map(g => g.pubkey).filter(Boolean);
    await prefetchAuthors(authorPubkeys);

    console.log(`Smart prefetch completed for ${topGeocaches.length} geocaches and ${authorPubkeys.length} authors`);
  }, [enablePrefetching, isOnline, queryClient, prefetchGeocacheLogs, prefetchAuthors]);

  /**
   * Setup background polling intervals
   */
  useEffect(() => {
    if (!enableBackgroundPolling || !isOnline) {
      // Clear existing intervals
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
      return;
    }

    // Clear existing intervals first
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];

    // Setup new intervals
    const geocacheInterval = setInterval(backgroundUpdateGeocaches, POLLING_INTERVALS.GEOCACHES);
    const logInterval = setInterval(backgroundUpdateLogs, POLLING_INTERVALS.LOGS);
    const prefetchInterval = setInterval(smartPrefetch, POLLING_INTERVALS.BACKGROUND_SYNC);

    intervalsRef.current = [geocacheInterval, logInterval, prefetchInterval];

    // Initial smart prefetch
    setTimeout(smartPrefetch, 1000);

    return () => {
      intervalsRef.current.forEach(clearInterval);
      intervalsRef.current = [];
    };
  }, [enableBackgroundPolling, isOnline, backgroundUpdateGeocaches, backgroundUpdateLogs, smartPrefetch]);

  /**
   * Manual prefetch trigger
   */
  const triggerPrefetch = useCallback(async (geocacheIds?: string[]) => {
    if (!isOnline) return;

    if (geocacheIds) {
      // Prefetch specific geocaches
      for (const geocacheId of geocacheIds) {
        const geocache = queryClient.getQueryData(['geocache', geocacheId]) as Geocache | undefined;
        if (geocache) {
          await prefetchGeocacheLogs(geocache);
        }
      }
    } else {
      // Smart prefetch
      await smartPrefetch();
    }
  }, [isOnline, queryClient, prefetchGeocacheLogs, smartPrefetch]);

  /**
   * Get prefetch status
   */
  const getPrefetchStatus = useCallback(() => {
    const geocaches = queryClient.getQueryData(['geocaches']) as Geocache[] | undefined;
    const totalGeocaches = geocaches?.length || 0;
    
    let prefetchedLogs = 0;
    let prefetchedAuthors = 0;

    if (geocaches) {
      // Count prefetched logs
      for (const geocache of geocaches.slice(0, 10)) {
        if (geocache.dTag && geocache.pubkey) {
          const queryKey = ['geocache-logs', geocache.dTag, geocache.pubkey];
          const queryState = queryClient.getQueryState(queryKey);
          if (queryState?.data) {
            prefetchedLogs++;
          }
        }
      }

      // Count prefetched authors
      const authorPubkeys = geocaches.slice(0, 10).map(g => g.pubkey).filter(Boolean);
      for (const pubkey of authorPubkeys) {
        const queryState = queryClient.getQueryState(['author', pubkey]);
        if (queryState?.data) {
          prefetchedAuthors++;
        }
      }
    }

    return {
      totalGeocaches,
      prefetchedLogs,
      prefetchedAuthors,
      isPolling: enableBackgroundPolling && isOnline,
      isPrefetching: enablePrefetching,
    };
  }, [queryClient, enableBackgroundPolling, enablePrefetching, isOnline]);

  return {
    triggerPrefetch,
    getPrefetchStatus,
    prefetchGeocacheLogs,
    prefetchAuthors,
    isActive: enableBackgroundPolling && isOnline,
  };
}

/**
 * Hook for components that want to trigger prefetching for specific geocaches
 */
export function useGeocachePrefetch() {
  const { triggerPrefetch, prefetchGeocacheLogs } = usePrefetchManager({
    enableBackgroundPolling: false, // Don't start background polling
    enablePrefetching: true,
  });

  return {
    prefetchGeocache: prefetchGeocacheLogs,
    prefetchMultiple: triggerPrefetch,
  };
}