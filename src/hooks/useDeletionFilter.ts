/**
 * Hook for fetching and tracking deletion events
 * Provides utilities to filter out events that are pending deletion
 */

import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useMemo } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';
import { TIMEOUTS } from '@/lib/constants';
import {
  createDeletedEventIdSet,
  createDeletedEventCoordinateSet,
  fastFilterDeletedEvents,
  filterDeletedEvents,
} from '@/lib/deletionFilter';

interface UseDeletionFilterOptions {
  /**
   * Only fetch deletions by specific authors
   * Useful for filtering user-specific content
   */
  authors?: string[];
  
  /**
   * Enable automatic background refetching
   * Default: true
   */
  enableRefetch?: boolean;
  
  /**
   * Custom stale time for deletion events
   * Default: 2 minutes
   */
  staleTime?: number;
}

/**
 * Hook to fetch deletion events and provide filtering utilities
 */
export function useDeletionFilter(options: UseDeletionFilterOptions = {}) {
  const { nostr } = useNostr();
  const {
    authors,
    enableRefetch = true,
    staleTime = 120000, // 2 minutes
  } = options;

  // Fetch deletion events (kind 5)
  const { data: deletionEvents = [], ...queryResult } = useQuery({
    queryKey: ['deletion-events', authors],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(TIMEOUTS.QUERY)]);
      
      try {
        const filter = {
          kinds: [5], // Deletion events
          limit: 500, // Get recent deletions
        } as Record<string, unknown>;

        if (authors && authors.length > 0) {
          filter.authors = authors;
        }

        const events = await nostr.query([filter as any], { signal });
        return events;
      } catch (error) {
        console.warn('Failed to fetch deletion events:', error);
        return [];
      }
    },
    staleTime,
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: enableRefetch,
    refetchInterval: enableRefetch ? 60000 : false, // Refetch every minute if enabled
  });

  // Create optimized lookup sets for fast filtering
  const { deletedIdSet, deletedCoordinateSet } = useMemo(() => {
    return {
      deletedIdSet: createDeletedEventIdSet(deletionEvents),
      deletedCoordinateSet: createDeletedEventCoordinateSet(deletionEvents),
    };
  }, [deletionEvents]);

  // Filtering functions
  const filterDeleted = useMemo(() => {
    return {
      /**
       * Filter events using comprehensive deletion checking
       * Use this for smaller datasets or when you need detailed checking
       */
      comprehensive: <T extends NostrEvent>(events: T[]): T[] => {
        return filterDeletedEvents(events, deletionEvents);
      },

      /**
       * Filter events using fast lookup-based deletion checking
       * Use this for larger datasets for better performance
       */
      fast: <T extends NostrEvent>(events: T[]): T[] => {
        return fastFilterDeletedEvents(events, deletedIdSet, deletedCoordinateSet);
      },

      /**
       * Filter events by specific author's deletions only
       * Useful when you only care about deletions by a specific user
       */
      byAuthor: <T extends NostrEvent>(events: T[], authorPubkey: string): T[] => {
        const authorDeletions = deletionEvents.filter(e => e.pubkey === authorPubkey);
        return filterDeletedEvents(events, authorDeletions);
      },
    };
  }, [deletionEvents, deletedIdSet, deletedCoordinateSet]);

  return {
    ...queryResult,
    deletionEvents,
    filterDeleted,
    deletedIdSet,
    deletedCoordinateSet,
    stats: {
      totalDeletions: deletionEvents.length,
      deletedEventIds: deletedIdSet.size,
      deletedCoordinates: deletedCoordinateSet.size,
    },
  };
}

/**
 * Simplified hook that just provides fast filtering for a specific author
 * Optimized for single-user scenarios like "my geocaches" or "my logs"
 */
export function useAuthorDeletionFilter(authorPubkey?: string) {
  const deletionFilter = useDeletionFilter({
    authors: authorPubkey ? [authorPubkey] : undefined,
    enableRefetch: false, // Less frequent refetch for author-specific deletions
    staleTime: 300000, // 5 minutes for author-specific
  });

  const filterByAuthor = useMemo(() => {
    if (!authorPubkey) {
      return <T extends NostrEvent>(events: T[]): T[] => events;
    }

    return <T extends NostrEvent>(events: T[]): T[] => {
      return deletionFilter.filterDeleted.byAuthor(events, authorPubkey);
    };
  }, [deletionFilter.filterDeleted, authorPubkey]);

  return {
    ...deletionFilter,
    filterByAuthor,
  };
}