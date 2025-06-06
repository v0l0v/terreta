/**
 * Completely redesigned proximity search with reliability and fallback mechanisms
 * Fixes all issues with the previous implementation
 */

import { useMemo, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useDeletionFilter } from '@/hooks/useDeletionFilter';
import { TIMEOUTS, QUERY_LIMITS, POLLING_INTERVALS } from '@/lib/constants';
import type { ComparisonOperator } from '@/components/ui/comparison-filter';
import { 
  NIP_GC_KINDS, 
  parseGeocacheEvent,
  encodeGeohash
} from '@/lib/nip-gc';
import { calculateDistance } from '@/lib/geo';

interface UseReliableProximitySearchOptions {
  limit?: number;
  search?: string;
  difficulty?: number;
  difficultyOperator?: ComparisonOperator;
  terrain?: number;
  terrainOperator?: ComparisonOperator;
  cacheType?: string;
  authorPubkey?: string;
  // Proximity parameters
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  enableProximityOptimization?: boolean;
}

export type GeocacheWithDistance = Geocache & { distance?: number };

interface SearchResult {
  geocaches: GeocacheWithDistance[];
  searchStrategy: 'proximity' | 'broad' | 'fallback';
  proximityAttempted: boolean;
  proximitySuccessful: boolean;
  totalFound: number;
  debugInfo?: {
    geohashPatterns?: string[];
    filterGroups?: number;
    errors?: string[];
  };
}

/**
 * Fixed precision calculation that works for all radius sizes
 */
function getReliablePrecision(radiusKm: number): number {
  // More conservative precision mapping to ensure matches
  if (radiusKm >= 100) return 1;
  if (radiusKm >= 50) return 2;
  if (radiusKm >= 25) return 2;
  if (radiusKm >= 10) return 3;
  if (radiusKm >= 5) return 3;
  if (radiusKm >= 2) return 4;
  if (radiusKm >= 1) return 4; // Fixed: was 6, now 4 to match 8-char geocaches
  if (radiusKm >= 0.5) return 5; // Fixed: was 7, now 5
  return 6; // Fixed: was 8-9, now 6 for very small searches
}

/**
 * Generate simple, reliable geohash patterns
 */
function generateReliableGeohashPatterns(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): string[] {
  const patterns = new Set<string>();
  
  // Use conservative precision
  const basePrecision = getReliablePrecision(radiusKm);
  
  // Generate center pattern
  const centerHash = encodeGeohash(centerLat, centerLng, basePrecision);
  patterns.add(centerHash);
  
  // Add broader patterns for better coverage
  for (let p = Math.max(1, basePrecision - 1); p <= basePrecision; p++) {
    const hash = encodeGeohash(centerLat, centerLng, p);
    patterns.add(hash);
  }
  
  // Add neighbor approximations by slightly adjusting coordinates
  const offset = radiusKm * 0.009; // Rough degrees per km
  const neighbors = [
    [centerLat + offset, centerLng],
    [centerLat - offset, centerLng],
    [centerLat, centerLng + offset],
    [centerLat, centerLng - offset],
  ];
  
  neighbors.forEach(([lat, lng]) => {
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const hash = encodeGeohash(lat, lng, basePrecision);
      patterns.add(hash);
    }
  });
  
  return Array.from(patterns).sort();
}

export function useReliableProximitySearch(options: UseReliableProximitySearchOptions = {}) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { filterDeleted } = useDeletionFilter();
  
  // Determine if proximity search should be attempted
  const hasProximityParams = !!(options.centerLat && options.centerLng && options.radiusKm);
  const shouldAttemptProximity = hasProximityParams && options.enableProximityOptimization !== false;
  
  // Query key includes all parameters that affect the Nostr query
  const queryKey = useMemo(() => [
    'reliable-proximity-search',
    {
      limit: options.limit,
      authorPubkey: options.authorPubkey,
      centerLat: options.centerLat,
      centerLng: options.centerLng,
      radiusKm: options.radiusKm,
      enableProximityOptimization: options.enableProximityOptimization,
    }
  ], [
    options.limit,
    options.authorPubkey,
    options.centerLat,
    options.centerLng,
    options.radiusKm,
    options.enableProximityOptimization,
  ]);

  const executeProximitySearch = useCallback(async (signal: AbortSignal): Promise<{
    events: NostrEvent[];
    successful: boolean;
    debugInfo: any;
  }> => {
    if (!options.centerLat || !options.centerLng || !options.radiusKm) {
      return { events: [], successful: false, debugInfo: { error: 'Missing proximity parameters' } };
    }

    try {
      const patterns = generateReliableGeohashPatterns(
        options.centerLat,
        options.centerLng,
        options.radiusKm
      );

      if (import.meta.env.DEV) {
        console.log('🔍 Proximity search patterns:', {
          center: [options.centerLat, options.centerLng],
          radius: options.radiusKm,
          patterns,
          precision: getReliablePrecision(options.radiusKm)
        });
      }

      // Create a single filter with all patterns
      const filter: NostrFilter = {
        kinds: [NIP_GC_KINDS.GEOCACHE],
        '#g': patterns,
        limit: Math.min(patterns.length * 20, 200), // Reasonable limit
      };

      if (options.authorPubkey) {
        filter.authors = [options.authorPubkey];
      }

      const events = await nostr.query([filter], { signal });

      if (import.meta.env.DEV) {
        console.log('🔍 Proximity search results:', {
          patterns: patterns.length,
          eventsFound: events.length,
          successful: events.length > 0
        });
      }

      return {
        events,
        successful: events.length > 0,
        debugInfo: {
          geohashPatterns: patterns,
          filterGroups: 1,
          eventsFound: events.length
        }
      };
    } catch (error) {
      console.warn('🔍 Proximity search failed:', error);
      return {
        events: [],
        successful: false,
        debugInfo: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }, [options.centerLat, options.centerLng, options.radiusKm, options.authorPubkey, nostr]);

  const executeBroadSearch = useCallback(async (signal: AbortSignal): Promise<NostrEvent[]> => {
    const filter: NostrFilter = {
      kinds: [NIP_GC_KINDS.GEOCACHE],
      limit: options.limit || QUERY_LIMITS.GEOCACHES,
    };

    if (options.authorPubkey) {
      filter.authors = [options.authorPubkey];
    }

    return await nostr.query([filter], { signal });
  }, [options.limit, options.authorPubkey, nostr]);

  const applyClientSideFilters = useCallback((geocaches: GeocacheWithDistance[]): GeocacheWithDistance[] => {
    let filtered = [...geocaches];

    // Text search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchLower) ||
        g.description.toLowerCase().includes(searchLower)
      );
    }

    // Difficulty filter
    if (options.difficulty !== undefined && options.difficultyOperator && options.difficultyOperator !== 'all') {
      filtered = filtered.filter(g => 
        applyComparison(g.difficulty, options.difficultyOperator!, options.difficulty!)
      );
    }

    // Terrain filter
    if (options.terrain !== undefined && options.terrainOperator && options.terrainOperator !== 'all') {
      filtered = filtered.filter(g => 
        applyComparison(g.terrain, options.terrainOperator!, options.terrain!)
      );
    }

    // Cache type filter
    if (options.cacheType && options.cacheType !== 'all') {
      filtered = filtered.filter(g => g.type === options.cacheType);
    }

    // Apply proximity filtering and add distances
    if (hasProximityParams) {
      filtered = filtered.map(cache => ({
        ...cache,
        distance: calculateDistance(
          options.centerLat!,
          options.centerLng!,
          cache.location.lat,
          cache.location.lng
        )
      })).filter(cache => cache.distance! <= options.radiusKm!)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      // Sort by creation date if no proximity
      filtered.sort((a, b) => b.created_at - a.created_at);
    }

    return filtered;
  }, [
    options.search,
    options.difficulty,
    options.difficultyOperator,
    options.terrain,
    options.terrainOperator,
    options.cacheType,
    hasProximityParams,
    options.centerLat,
    options.centerLng,
    options.radiusKm
  ]);

  const { data: searchResult, ...queryResult } = useQuery({
    queryKey,
    queryFn: async (c): Promise<SearchResult> => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(TIMEOUTS.QUERY)]);
      
      let events: NostrEvent[] = [];
      let searchStrategy: 'proximity' | 'broad' | 'fallback' = 'broad';
      let proximityAttempted = false;
      let proximitySuccessful = false;
      let debugInfo: any = {};

      // Step 1: Try proximity search if enabled
      if (shouldAttemptProximity) {
        proximityAttempted = true;
        const proximityResult = await executeProximitySearch(signal);
        
        if (proximityResult.successful) {
          events = proximityResult.events;
          searchStrategy = 'proximity';
          proximitySuccessful = true;
          debugInfo = proximityResult.debugInfo;
          
          if (import.meta.env.DEV) {
            console.log('✅ Proximity search successful:', events.length, 'events');
          }
        } else {
          if (import.meta.env.DEV) {
            console.log('❌ Proximity search failed, falling back to broad search');
          }
          debugInfo = proximityResult.debugInfo;
        }
      }

      // Step 2: Fallback to broad search if proximity failed or wasn't attempted
      if (events.length === 0) {
        try {
          events = await executeBroadSearch(signal);
          searchStrategy = proximityAttempted ? 'fallback' : 'broad';
          
          if (import.meta.env.DEV) {
            console.log(`✅ ${searchStrategy} search completed:`, events.length, 'events');
          }
        } catch (error) {
          console.error('❌ Broad search also failed:', error);
          debugInfo.broadSearchError = error instanceof Error ? error.message : String(error);
        }
      }

      // Step 3: Process events into geocaches
      const nonDeletedEvents = filterDeleted.fast(events);
      const geocaches: Geocache[] = nonDeletedEvents
        .map(parseGeocacheEvent)
        .filter((g): g is Geocache => g !== null)
        .filter(g => !g.hidden || g.pubkey === user?.pubkey);

      // Step 4: Apply client-side filters
      const filteredGeocaches = applyClientSideFilters(geocaches);

      return {
        geocaches: filteredGeocaches,
        searchStrategy,
        proximityAttempted,
        proximitySuccessful,
        totalFound: events.length,
        debugInfo: import.meta.env.DEV ? debugInfo : undefined
      };
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    refetchInterval: POLLING_INTERVALS.GEOCACHES,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  return {
    ...queryResult,
    data: searchResult?.geocaches || [],
    searchStrategy: searchResult?.searchStrategy || 'broad',
    proximityAttempted: searchResult?.proximityAttempted || false,
    proximitySuccessful: searchResult?.proximitySuccessful || false,
    totalFound: searchResult?.totalFound || 0,
    debugInfo: searchResult?.debugInfo,
  };
}

function applyComparison(value: number, operator: ComparisonOperator, target: number): boolean {
  switch (operator) {
    case 'eq': return value === target;
    case 'gt': return value > target;
    case 'gte': return value >= target;
    case 'lt': return value < target;
    case 'lte': return value <= target;
    case 'all':
    default: return true;
  }
}

/**
 * Adaptive hook that automatically uses the reliable proximity search
 */
export function useAdaptiveReliableGeocaches(options: Omit<UseReliableProximitySearchOptions, 'centerLat' | 'centerLng' | 'radiusKm'> & {
  userLocation?: { lat: number; lng: number } | null;
  searchLocation?: { lat: number; lng: number } | null;
  searchRadius?: number;
  showNearMe?: boolean;
}) {
  const searchOptions: UseReliableProximitySearchOptions = {
    ...options,
    centerLat: options.searchLocation?.lat || (options.showNearMe ? options.userLocation?.lat : undefined),
    centerLng: options.searchLocation?.lng || (options.showNearMe ? options.userLocation?.lng : undefined),
    radiusKm: (options.searchLocation || (options.showNearMe && options.userLocation)) ? options.searchRadius : undefined,
    enableProximityOptimization: !!(options.searchLocation || (options.showNearMe && options.userLocation)),
  };

  return useReliableProximitySearch(searchOptions);
}