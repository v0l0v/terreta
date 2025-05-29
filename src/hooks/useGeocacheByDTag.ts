import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import type { Geocache } from '@/types/geocache';

export function useGeocacheByDTag(dTag: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['geocache-by-dtag', dTag],
    queryFn: async (c) => {
      console.log('🔍 [GEOCACHE BY DTAG] Starting query for d-tag:', dTag);
      
      try {
        // Fast timeout - let the fastest relay win
        const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
        
        // Query by d-tag - this is the stable identifier
        const filter: NostrFilter = {
          kinds: [30078],
          '#d': [dTag], // Find by d-tag
          limit: 1,
        };

        const events = await nostr.query([filter], { signal });
        console.log('🎯 [GEOCACHE BY DTAG] Query returned:', events.length, 'events');

        if (events.length === 0) {
          console.log('❌ [GEOCACHE BY DTAG] No geocache found with d-tag:', dTag);
          return null;
        }

        const geocache = parseGeocacheEvent(events[0]);
        if (!geocache) {
          console.log('❌ [GEOCACHE BY DTAG] Failed to parse geocache event');
          return null;
        }

        console.log('✅ [GEOCACHE BY DTAG] Successfully loaded geocache:', geocache.name);

        // Quick log count fetch - support both old and new linking methods
        console.log('📊 [GEOCACHE BY DTAG] Fetching log counts...');
        
        // Get all geocache logs and filter locally
        const logFilter: NostrFilter = {
          kinds: [30078],
          '#t': ['geocache-log'],
          limit: 200, // Reasonable limit
        };

        let logEvents = await nostr.query([logFilter], { signal });
        
        // Filter logs that reference this geocache either by d-tag or event ID
        logEvents = logEvents.filter(event => {
          // NEW method: link via stable d-tag
          const hasNewLink = event.tags.some(tag => 
            tag[0] === 'geocache-dtag' && tag[1] === geocache.dTag
          );
          if (hasNewLink) return true;
          
          // OLD method: link via event ID (for backward compatibility) 
          const hasOldLink = event.tags.some(tag => 
            (tag[0] === 'geocache' || tag[0] === 'geocache-id') && tag[1] === geocache.id
          );
          return hasOldLink;
        });
      
        let foundCount = 0;
        const logCount = logEvents.length;
        
        logEvents.forEach(event => {
          try {
            const data = JSON.parse(event.content);
            if (data.type === 'found') foundCount++;
          } catch (error) {
            // Ignore parse errors for log count
          }
        });

        const result = {
          ...geocache,
          foundCount,
          logCount,
        };

        console.log('✅ [GEOCACHE BY DTAG] Final result:', {
          dTag: result.dTag,
          name: result.name,
          logCount: result.logCount,
          foundCount: result.foundCount
        });

        return result;
      } catch (error) {
        console.error('❌ [GEOCACHE BY DTAG] Query failed:', error);
        throw error;
      }
    },
    enabled: !!dTag,
    retry: 2, // Reduced retry attempts
    retryDelay: 1000, // Fixed 1 second delay 
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

function parseGeocacheEvent(event: NostrEvent): Geocache | null {
  try {
    // Check if this is a geocache event (support both old and new formats)
    const dTag = event.tags.find(t => t[0] === 'd')?.[1];
    const tTag = event.tags.find(t => t[0] === 't')?.[1];
    
    const isGeocache = (dTag === 'geocache') || (tTag === 'geocache') || 
                      (dTag?.startsWith('geocache-'));
    
    if (!isGeocache || !dTag) return null;

    const data = JSON.parse(event.content);
    
    return {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      dTag: dTag, // Store the d-tag for proper replacement
      name: data.name,
      description: data.description,
      hint: data.hint,
      location: data.location,
      difficulty: data.difficulty,
      terrain: data.terrain,
      size: data.size,
      type: data.type,
      images: data.images,
    };
  } catch (error) {
    console.error('Failed to parse geocache event:', error);
    return null;
  }
}