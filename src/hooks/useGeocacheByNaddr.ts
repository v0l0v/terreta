import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';
import { parseNaddr } from '@/lib/naddr-utils';
import { queryNostr } from '@/lib/nostrQuery';
import { TIMEOUTS, QUERY_LIMITS } from '@/lib/constants';
import { isSafari } from '@/lib/safariNostr';
import { 
  NIP_GC_KINDS, 
  parseGeocacheEvent, 
  createGeocacheCoordinate 
} from '@/lib/nip-gc';

export function useGeocacheByNaddr(naddr: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['geocache-by-naddr', naddr, isSafari()],
    queryFn: async (c) => {
      
      try {
        // Parse the naddr to get pubkey and dTag
        const parsed = parseNaddr(naddr);
        if (!parsed) {
          throw new Error('Invalid naddr format');
        }
        
        const { pubkey, dTag, relays } = parsed;
        
        // Query by pubkey and d-tag
        const filter: NostrFilter = {
          kinds: [37515], // Geocache listing events
          authors: [pubkey],
          '#d': [dTag],
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
    enabled: !!naddr,
    retry: 2, // Reduced retry attempts
    retryDelay: 1000, // Fixed 1 second delay 
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}