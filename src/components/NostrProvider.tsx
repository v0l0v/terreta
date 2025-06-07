import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import React, { useRef } from 'react';

interface NostrProviderProps {
  children: React.ReactNode;
  relays: string[];
}

const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children, relays } = props;

  // Create NPool instance only once and recreate only when relays change
  const pool = useRef<NPool | undefined>(undefined);
  const lastRelays = useRef<string[]>([]);

  // Check if relays have changed
  const relaysChanged = JSON.stringify(relays) !== JSON.stringify(lastRelays.current);

  if (!pool.current || relaysChanged) {
    // Clean up old pool if it exists
    if (pool.current && relaysChanged) {
      try {
        // Close existing connections
        pool.current = undefined;
      } catch (error) {
        console.warn('Error cleaning up old Nostr pool:', error);
      }
    }

    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        return new Map(relays.map((url) => [url, filters]));
      },
      eventRouter(_event: NostrEvent) {
        return relays;
      },
    });
    
    lastRelays.current = [...relays];
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;