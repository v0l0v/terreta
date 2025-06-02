/**
 * Enhanced geocache hook with proximity search optimization
 * Replaces useAdvancedGeocaches with geohash-based proximity queries
 */

import { useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';
import { queryNostr, batchQueryNostr } from '@/lib/nostrQuery';
import { TIMEOUTS, QUERY_LIMITS } from '@/lib/constants';
import { isSafari } from '@/lib/safariNostr';
import type { ComparisonOperator } from '@/components/ui/comparison-filter';
import { 
  NIP_GC_KINDS, 
  parseGeocacheEvent, 
  parseLogEvent, 
  createGeocacheCoordinate,
  getGeohashesInRadius,
  getGeohashPrefixes,
  getOptimalPrecision
} from '@/lib/nip-gc';
import { calculateDistance, sortByDistance, filterByRadius } from '@/lib/geo';

interface UseProximityGeocachesOptions {
  limit?: number;
  search?: string;
  difficulty?: number;
  difficultyOperator?: ComparisonOperator;
  terrain?: number;
  terrainOperator?: ComparisonOperator;
  authorPubkey?: string;
  // Proximity parameters
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  useProximityOptimization?: boolean;
  maxProximityPrecision?: number;
}

export type GeocacheWithDistance = Geocache & { distance?: number };

export function useProximityGeocaches(options: UseProximityGeocachesOptions = {}) {
  const { nostr } = useNostr();
  
  const queryKey = useMemo(() => [
    'geocaches-proximity', 
    options, 
    isSafari()
  ], [options]);

  return useQuery({
    queryKey,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    queryFn: async (): Promise<GeocacheWithDistance[]> => {
      try {
        let events: NostrEvent[];
        
        // Determine search strategy
        const hasProximitySearch = options.centerLat && options.centerLng && options.radiusKm;
        const useOptimization = hasProximitySearch && options.useProximityOptimization !== false;
        
        if (useOptimization) {
          events = await queryByProximity();
          
          // If proximity search returns very few results, also try a broader search
          if (events.length < 5) {
            const broadEvents = await queryBroad();
            // Combine and deduplicate
            const eventIds = new Set(events.map(e => e.id));
            const newEvents = broadEvents.filter(e => !eventIds.has(e.id));
            events = [...events, ...newEvents];
          }
        } else {
          events = await queryBroad();
        }
        
        // Parse geocaches
        const geocaches: Geocache[] = events
          .map(parseGeocacheEvent)
          .filter((g): g is Geocache => g !== null);

        // Apply proximity filtering if specified
        let geocachesWithDistance: GeocacheWithDistance[];
        if (hasProximitySearch) {
          // Add distance to all results and sort by distance
          geocachesWithDistance = geocaches.map(cache => ({
            ...cache,
            distance: calculateDistance(options.centerLat!, options.centerLng!, cache.location.lat, cache.location.lng)
          }));
          
          // Filter by radius with a small buffer (10% extra) for edge cases
          const radiusBuffer = options.radiusKm! * 1.1;
          geocachesWithDistance = geocachesWithDistance
            .filter(cache => cache.distance! <= radiusBuffer)
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));
        } else {
          // No proximity filtering, just convert type
          geocachesWithDistance = geocaches.map(cache => ({ ...cache }));
        }

        // Apply client-side filters
        geocachesWithDistance = applyClientSideFilters(geocachesWithDistance);

        // Get log counts for limited set
        geocachesWithDistance = await addLogCounts(geocachesWithDistance);

        return geocachesWithDistance;
      } catch (error) {
        throw error;
      }
    },
  });

  async function queryByProximity(): Promise<NostrEvent[]> {
    if (!options.centerLat || !options.centerLng || !options.radiusKm) {
      throw new Error('Proximity search requires centerLat, centerLng, and radiusKm');
    }

    // Use more conservative precision to cast a wider net
    const precision = Math.min(
      getOptimalPrecision(options.radiusKm),
      options.maxProximityPrecision || 5
    );
    
    // Strategy 1: Direct geohash targeting with wider coverage
    const targetHashes = getGeohashesInRadius(
      options.centerLat, 
      options.centerLng, 
      options.radiusKm,
      precision
    );

    // Strategy 2: Add prefix-based expansion for even broader coverage
    const prefixes = getGeohashPrefixes(options.centerLat, options.centerLng, options.radiusKm);
    const allHashes = [...new Set([...targetHashes, ...prefixes])];

    if (isSafari()) {
      return await safariProximityQuery(allHashes);
    } else {
      return await standardProximityQuery(allHashes);
    }
  }

  async function queryBroad(): Promise<NostrEvent[]> {
    // Build standard filter
    const filter: NostrFilter = {
      kinds: [NIP_GC_KINDS.GEOCACHE],
      limit: options.limit || (isSafari() ? QUERY_LIMITS.SAFARI_GEOCACHES : QUERY_LIMITS.STANDARD_GEOCACHES),
    };

    if (options.authorPubkey) {
      filter.authors = [options.authorPubkey];
    }

    // Use unified query utility
    return await queryNostr(nostr, [filter], {
      timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY_RETRY : TIMEOUTS.STANDARD_QUERY,
      maxRetries: isSafari() ? 2 : 3,
    });
  }

  async function safariProximityQuery(targetHashes: string[]): Promise<NostrEvent[]> {
    // Query in batches for better efficiency
    const batchSize = isSafari() ? 8 : 12;
    const filterGroups: NostrFilter[][] = [];
    
    for (let i = 0; i < targetHashes.length; i += batchSize) {
      const batch = targetHashes.slice(i, i + batchSize);
      
      const filter: NostrFilter = {
        kinds: [NIP_GC_KINDS.GEOCACHE],
        '#g': batch,
        limit: 50
      };
      
      if (options.authorPubkey) {
        filter.authors = [options.authorPubkey];
      }
      
      filterGroups.push([filter]);
    }
    
    // Use batch query utility
    return await batchQueryNostr(nostr, filterGroups, {
      timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY : TIMEOUTS.STANDARD_QUERY,
      maxRetries: 1,
    });
  }

  async function standardProximityQuery(targetHashes: string[]): Promise<NostrEvent[]> {
    const filter: NostrFilter = {
      kinds: [NIP_GC_KINDS.GEOCACHE],
      '#g': targetHashes,
      limit: options.limit || QUERY_LIMITS.PROXIMITY_RESULTS
    };

    if (options.authorPubkey) {
      filter.authors = [options.authorPubkey];
    }

    // Use unified query utility
    return await queryNostr(nostr, [filter], {
      timeout: TIMEOUTS.STANDARD_QUERY,
      maxRetries: 2,
    });
  }

  function applyClientSideFilters(geocaches: GeocacheWithDistance[]): GeocacheWithDistance[] {
    let filtered = [...geocaches];

    // Text search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower)
      );
    }

    // Difficulty comparison filter
    if (options.difficulty !== undefined && options.difficultyOperator && options.difficultyOperator !== 'all') {
      filtered = filtered.filter(g => 
        applyComparison(g.difficulty, options.difficultyOperator!, options.difficulty!)
      );
    }

    // Terrain comparison filter
    if (options.terrain !== undefined && options.terrainOperator && options.terrainOperator !== 'all') {
      filtered = filtered.filter(g => 
        applyComparison(g.terrain, options.terrainOperator!, options.terrain!)
      );
    }

    // Sort by distance if available, otherwise by creation date
    if (filtered.some(g => g.distance !== undefined)) {
      // Sort by distance (already calculated if using proximity)
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      // Sort by creation date (newest first)
      filtered.sort((a, b) => b.created_at - a.created_at);
    }

    return filtered;
  }

  async function addLogCounts(geocaches: GeocacheWithDistance[]): Promise<GeocacheWithDistance[]> {
    if (geocaches.length === 0) return geocaches;

    try {
      // Limit the number of caches we query logs for
      const limitedCaches = geocaches.slice(0, isSafari() ? 8 : 15);
      const logFilter: NostrFilter = {
        kinds: [NIP_GC_KINDS.LOG],
        '#a': limitedCaches.map(g => createGeocacheCoordinate(g.pubkey, g.dTag)),
        limit: isSafari() ? 200 : 500,
      };

      // Use unified query utility with error handling
      let logEvents: NostrEvent[];
      try {
        logEvents = await queryNostr(nostr, [logFilter], {
          timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY : TIMEOUTS.STANDARD_QUERY,
          maxRetries: 1,
        });
      } catch (error) {
        return geocaches; // Return without log counts
      }
      
      // Count logs per geocache
      const logCounts = new Map<string, { total: number; found: number }>();
      
      logEvents.forEach(event => {
        const aTag = event.tags.find(tag => tag[0] === 'a')?.[1];
        if (!aTag) return;
        
        const log = parseLogEvent(event);
        if (log) {
          const current = logCounts.get(aTag) || { total: 0, found: 0 };
          current.total++;
          if (log.type === 'found') current.found++;
          logCounts.set(aTag, current);
        }
      });

      // Add counts to geocaches
      return geocaches.map(g => {
        const coord = createGeocacheCoordinate(g.pubkey, g.dTag);
        const counts = logCounts.get(coord) || { total: 0, found: 0 };
        return {
          ...g,
          logCount: counts.total,
          foundCount: counts.found,
        };
      });
    } catch (error) {
      return geocaches; // Continue without log counts
    }
  }
}

function applyComparison(value: number, operator: ComparisonOperator, target: number): boolean {
  switch (operator) {
    case 'eq':
      return value === target;
    case 'gt':
      return value > target;
    case 'gte':
      return value >= target;
    case 'lt':
      return value < target;
    case 'lte':
      return value <= target;
    case 'all':
    default:
      return true;
  }
}

/**
 * Hook that automatically switches between proximity and broad search based on user location
 */
export function useAdaptiveGeocaches(options: Omit<UseProximityGeocachesOptions, 'centerLat' | 'centerLng' | 'radiusKm'> & {
  userLocation?: { lat: number; lng: number } | null;
  searchLocation?: { lat: number; lng: number } | null;
  searchRadius?: number;
  showNearMe?: boolean;
}) {
  const proximityOptions: UseProximityGeocachesOptions = {
    ...options,
    // Use search location if available, otherwise user location if "Near Me" is active
    centerLat: options.searchLocation?.lat || (options.showNearMe ? options.userLocation?.lat : undefined),
    centerLng: options.searchLocation?.lng || (options.showNearMe ? options.userLocation?.lng : undefined),
    radiusKm: (options.searchLocation || (options.showNearMe && options.userLocation)) ? options.searchRadius : undefined,
    // Enable proximity optimization when we have location data
    useProximityOptimization: !!(options.searchLocation || (options.showNearMe && options.userLocation)),
  };

  return useProximityGeocaches(proximityOptions);
}