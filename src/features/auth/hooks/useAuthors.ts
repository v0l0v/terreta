import { NSchema as n } from '@nostrify/nostrify';
import { useNostr } from '@nostrify/react';
import { useQueries } from '@tanstack/react-query';
import { TIMEOUTS } from '@/shared/config/timeouts';

export function useAuthors(pubkeys: (string | undefined)[]) {
  const { nostr } = useNostr();

  return useQueries({
    queries: pubkeys.map((pubkey) => {
      return {
        queryKey: ['author', pubkey ?? ''],
        queryFn: async (c: any) => {
          if (!pubkey) {
            return {};
          }

          let events: NostrEvent[] = [];
          let usedFallback = false;

          try {
            const signal = AbortSignal.any([c.signal, AbortSignal.timeout(TIMEOUTS.FAST_QUERY)]);
            events = await nostr.query(
              [{ kinds: [0], authors: [pubkey], limit: 1 }],
              { signal }
            );

            // If no event found, try nostr.band fallback
            if (!events || events.length === 0) {
              console.log(`🔄 [useAuthors] No kind 0 metadata found for ${pubkey.slice(0, 8)}... on selected relay, trying nostr.band fallback`);

              try {
                // Create a direct connection to nostr.band for fallback
                const { NRelay1 } = await import('@nostrify/nostrify');
                const fallbackRelay = new NRelay1('wss://relay.nostr.band');

                const fallbackSignal = AbortSignal.timeout(TIMEOUTS.FAST_QUERY);
                const fallbackEvents = await fallbackRelay.query([{
                  kinds: [0],
                  authors: [pubkey],
                  limit: 1,
                }], { signal: fallbackSignal });

                events = fallbackEvents;
                usedFallback = true;

                if (events.length > 0) {
                  console.log(`✅ [useAuthors] Found kind 0 metadata for ${pubkey.slice(0, 8)}... on nostr.band fallback`);
                } else {
                  console.log(`❌ [useAuthors] No kind 0 metadata found for ${pubkey.slice(0, 8)}... on nostr.band either`);
                }

                // Close the fallback relay connection
                fallbackRelay.close();
              } catch (fallbackError) {
                console.warn(`⚠️ [useAuthors] Fallback to nostr.band failed for ${pubkey.slice(0, 8)}...:`, fallbackError);
              }
            } else {
              console.log(`✅ [useAuthors] Found kind 0 metadata for ${pubkey.slice(0, 8)}... on selected relay`);
            }

            if (!events || events.length === 0) {
              return { hasProfile: false };
            }

            const event = events[0];

            try {
              const metadata = n.json().pipe(n.metadata()).parse(event?.content);
              return { metadata, event, hasProfile: true, usedFallback };
            } catch (parseError) {
              console.warn('Failed to parse metadata for pubkey', pubkey, parseError);
              return { event, hasProfile: true, usedFallback };
            }
          } catch (error) {
            console.warn('Failed to fetch author data for pubkey', pubkey, error);
            return { hasProfile: false };
          }
        },
        retry: (failureCount: any, error: any) => {
          const errorObj = error as { message?: string };
          if (errorObj.message?.includes('No event found') || errorObj.message?.includes('timeout')) {
            return failureCount < 1;
          }
          return failureCount < 2;
        },
        retryDelay: (attemptIndex: any) => Math.min(1000 * 2 ** attemptIndex, 3000),
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        networkMode: 'online' as const,
        enabled: !!pubkey,
        refetchOnMount: false,
        placeholderData: { hasProfile: false },
      };
    }),
  });
}
