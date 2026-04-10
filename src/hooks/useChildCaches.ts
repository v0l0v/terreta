import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { parseGeocacheEvent, NIP_GC_KINDS } from '@/utils/nip-gc';
import { TIMEOUTS } from '@/config';
import { parseNaddr } from '@/utils/naddr';
import type { Geocache } from '@/types/geocache';

export function useChildCaches(childReferences: string[] | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['childCaches', childReferences],
    staleTime: 600000, // 10 mins
    gcTime: 3600000, // 1 hour
    enabled: !!childReferences && childReferences.length > 0,
    queryFn: async () => {
      if (!childReferences || childReferences.length === 0) return [];

      const parsedRefs = childReferences.map(ref => {
        // Try parsing as naddr first
        try {
          const parsed = parseNaddr(ref);
          if (parsed) return parsed;
        } catch {
          // If not naddr, maybe it's a coordinate string "kind:pubkey:dtag"
          const parts = ref.split(':');
          if (parts.length >= 3) {
            return {
              kind: parseInt(parts[0]),
              pubkey: parts[1],
              dTag: parts[2]
            };
          }
        }
        return null;
      }).filter((p): p is { kind: number, pubkey: string, dTag: string } => p !== null);

      if (parsedRefs.length === 0) return [];

      const authors = [...new Set(parsedRefs.map(r => r.pubkey))];
      const dTags = [...new Set(parsedRefs.map(r => r.dTag))];

      const signal = AbortSignal.timeout(TIMEOUTS.QUERY);
      const events = await nostr.query([{
        kinds: [NIP_GC_KINDS.GEOCACHE, NIP_GC_KINDS.GEOCACHE_LEGACY],
        authors: authors,
        '#d': dTags,
      }], { signal });

      const caches: Geocache[] = [];
      for (const event of events) {
        const parsed = parseGeocacheEvent(event);
        if (parsed) {
          // Only include if it actually matches one of the requested child references
          const isRequested = parsedRefs.some(ref => ref.pubkey === parsed.pubkey && ref.dTag === parsed.dTag);
          if (isRequested) {
            caches.push(parsed);
          }
        }
      }

      return caches;
    }
  });
}
