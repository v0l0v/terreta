import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';
import { queryNostr } from '@/lib/nostrQuery';
import { TIMEOUTS, QUERY_LIMITS } from '@/lib/constants';
import { isSafari } from '@/lib/safariNostr';
import { 
  NIP_GC_KINDS, 
  parseGeocacheEvent, 
  parseLogEvent, 
  createGeocacheCoordinate 
} from '@/lib/nip-gc';

export function useGeocache(id: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['geocache', id, isSafari()],
    queryFn: async (c) => {
      
      try {
        // Primary strategy: Direct ID lookup
        const filter: NostrFilter = {
          ids: [id],
          kinds: [37515], // Geocache listing events
          limit: 1,
        };

        // Use unified query utility
        const events = await queryNostr(nostr, [filter], {
          timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY : TIMEOUTS.STANDARD_QUERY,
          maxRetries: isSafari() ? 2 : 3,
          signal: c.signal,
        });

        if (events.length === 0) {
          return null;
        }

        const geocache = parseGeocacheEvent(events[0]);
        if (!geocache) {
          return null;
        }


        // Quick log count fetch
        
        // Get logs for this specific geocache
        const logFilter: NostrFilter = {
          kinds: [NIP_GC_KINDS.LOG],
          '#a': [createGeocacheCoordinate(geocache.pubkey, geocache.dTag)],
          limit: isSafari() ? QUERY_LIMITS.SAFARI_LOGS : QUERY_LIMITS.STANDARD_LOGS,
        };

        // Use unified query utility with error handling
        let logEvents: NostrEvent[];
        try {
          logEvents = await queryNostr(nostr, [logFilter], {
            timeout: isSafari() ? TIMEOUTS.SAFARI_QUERY : TIMEOUTS.STANDARD_QUERY,
            maxRetries: 1,
            signal: c.signal,
          });
        } catch (error) {
          logEvents = []; // Continue without log counts
        }
      
        let foundCount = 0;
        const logCount = logEvents.length;
        
        logEvents.forEach(event => {
          // Get type from tags
          const logType = event.tags.find(t => t[0] === 'log-type')?.[1];
          if (logType === 'found') {
            foundCount++;
          }
        });

        const result = {
          ...geocache,
          foundCount,
          logCount,
        };

        return result;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!id,
    retry: 2, // Reduced retry attempts
    retryDelay: 1000, // Fixed 1 second delay 
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}


// parseGeocacheEvent is now imported from @/lib/nip-gc
