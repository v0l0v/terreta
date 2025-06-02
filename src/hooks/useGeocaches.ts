import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';
import { queryNostr } from '@/lib/nostrQuery';
import { QUERY_LIMITS, TIMEOUTS } from '@/lib/constants';
import { NIP_GC_KINDS, parseGeocacheEvent, parseLogEvent } from '@/lib/nip-gc';
import { isSafari } from '@/lib/safariNostr';

interface UseGeocachesOptions {
  limit?: number;
  search?: string;
  difficulty?: number;
  terrain?: number;
  authorPubkey?: string;
}

export function useGeocaches(options: UseGeocachesOptions = {}) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['geocaches', options, isSafari()],
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    queryFn: async () => {
      
      try {
        // Build filter for geocache events
        const filter: NostrFilter = {
          kinds: [NIP_GC_KINDS.GEOCACHE],
          limit: options.limit || (isSafari() ? QUERY_LIMITS.SAFARI_GEOCACHES : QUERY_LIMITS.STANDARD_GEOCACHES),
        };

        if (options.authorPubkey) {
          filter.authors = [options.authorPubkey];
        }

        // Use unified query utility
        const events = await queryNostr(nostr, [filter], {
          timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY_RETRY : TIMEOUTS.STANDARD_QUERY,
          maxRetries: isSafari() ? 2 : 3,
        });
        
        
        // Parse and filter geocaches
        let geocaches: Geocache[] = events
          .map(parseGeocacheEvent)
          .filter((g): g is Geocache => g !== null);
        

        // Apply client-side filters
        if (options.search) {
          const searchLower = options.search.toLowerCase();
          geocaches = geocaches.filter(g => 
            g.name.toLowerCase().includes(searchLower) ||
            g.description.toLowerCase().includes(searchLower)
          );
        }

        if (options.difficulty !== undefined) {
          geocaches = geocaches.filter(g => g.difficulty === options.difficulty);
        }

        if (options.terrain !== undefined) {
          geocaches = geocaches.filter(g => g.terrain === options.terrain);
        }

        // Sort by creation date (newest first)
        geocaches.sort((a, b) => b.created_at - a.created_at);

        // Log count fetching with Safari compatibility
        if (geocaches.length > 0) {
          try {
            // Limit the number of caches we query logs for
            const limitedCaches = geocaches.slice(0, isSafari() ? 5 : 10);
            const logFilter: NostrFilter = {
              kinds: [NIP_GC_KINDS.LOG],
              '#a': limitedCaches.map(g => `${NIP_GC_KINDS.GEOCACHE}:${g.pubkey}:${g.dTag}`),
              limit: isSafari() ? QUERY_LIMITS.SAFARI_LOGS : QUERY_LIMITS.STANDARD_LOGS,
            };

            // Use unified query utility with error handling
            let logEvents: NostrEvent[];
            try {
              logEvents = await queryNostr(nostr, [logFilter], {
                timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY : TIMEOUTS.STANDARD_QUERY,
                maxRetries: 1,
              });
            } catch (error) {
              logEvents = []; // Continue without log counts
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
            geocaches = geocaches.map(g => {
              const coord = `${NIP_GC_KINDS.GEOCACHE}:${g.pubkey}:${g.dTag}`;
              const counts = logCounts.get(coord) || { total: 0, found: 0 };
              return {
                ...g,
                logCount: counts.total,
                foundCount: counts.found,
              };
            });
          } catch (error) {
            // Continue without log counts if there's an error
          }
        }

        return geocaches;
      } catch (error) {
        throw error;
      }
    },
  });
}

// parseGeocacheEvent and parseLogEvent are now imported from @/lib/nip-gc