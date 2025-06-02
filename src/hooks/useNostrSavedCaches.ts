import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Geocache } from '@/types/geocache';
import { NostrFilter, NostrEvent } from '@nostrify/nostrify';
import { 
  NIP_GC_KINDS, 
  parseGeocacheEvent, 
  createGeocacheCoordinate 
} from '@/lib/nip-gc';
import { useOfflineMode } from '@/hooks/useOfflineStorage';
import { offlineStorage } from '@/lib/offlineStorage';

interface SavedCache {
  id: string;
  dTag: string;
  pubkey: string;
  name: string;
  savedAt: number;
  location: {
    lat: number;
    lng: number;
  };
  difficulty: number;
  terrain: number;
  size: string;
  type: string;
  foundCount?: number;
  logCount?: number;
}

// Use a custom event kind for cache bookmarks
const CACHE_BOOKMARK_KIND = 1985; // Use kind 1985 (labeling) for bookmark actions

export function useNostrSavedCaches() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutateAsync: publishEvent } = useNostrPublish();
  const queryClient = useQueryClient();
  const { isOnline, isOfflineMode } = useOfflineMode();

  // Query user's cache bookmark and deletion events
  const { data: bookmarkEvents, refetch: refetchBookmarks, isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['cache-bookmarks', user?.pubkey, isOnline && !isOfflineMode && navigator.onLine],
    queryFn: async () => {
      if (!user?.pubkey) return [];
      
      console.log('useNostrSavedCaches bookmark query starting...', {
        isOnline,
        isOfflineMode,
        navigatorOnLine: navigator.onLine,
        userPubkey: user.pubkey.slice(0, 8)
      });
      
      // If we're truly offline or in offline mode, use cached data immediately
      if (!navigator.onLine || isOfflineMode || !isOnline) {
        console.log('Using offline bookmark data - not connected to internet');
        try {
          const bookmarkEvents = await offlineStorage.getEventsByKind(CACHE_BOOKMARK_KIND);
          const deletionEvents = await offlineStorage.getEventsByKind(5);
          
          // Filter events by user
          const userBookmarks = bookmarkEvents.filter(event => event.pubkey === user.pubkey);
          const userDeletions = deletionEvents.filter(event => event.pubkey === user.pubkey);
          
          // Filter to only cache bookmark events and relevant deletion events
          const relevantEvents = [...userBookmarks, ...userDeletions].filter(event => {
            if (event.kind === CACHE_BOOKMARK_KIND) {
              return event.tags.some(tag => tag[0] === 'a' && tag[1]?.startsWith('37515:'));
            } else if (event.kind === 5) {
              return event.tags.some(tag => tag[0] === 'e');
            }
            return false;
          });
          
          console.log(`Found ${relevantEvents.length} offline bookmark events`);
          return relevantEvents.sort((a, b) => b.created_at - a.created_at);
        } catch (error) {
          console.error('Failed to get offline bookmark data:', error);
          return [];
        }
      }
      
      // Try online first if available
      if (isOnline && nostr) {
        try {
          // Query both bookmark events (kind 1985) and deletion events (kind 5)
          const queries = [
            { 
              kinds: [CACHE_BOOKMARK_KIND], 
              authors: [user.pubkey],
              '#l': ['treasures/cache-bookmark'],
              limit: 1000
            },
            {
              kinds: [5], // Deletion events
              authors: [user.pubkey],
              limit: 1000
            }
          ];
          
          // Safari-compatible query with shorter timeout
          const events = await Promise.race([
            nostr.query(queries),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Bookmark query timeout')), 5000)
            )
          ]);
          
          // Filter to only cache bookmark events and relevant deletion events
          const relevantEvents = events.filter(event => {
            if (event.kind === CACHE_BOOKMARK_KIND) {
              // Include bookmark events for caches
              return event.tags.some(tag => tag[0] === 'a' && tag[1]?.startsWith('37515:'));
            } else if (event.kind === 5) {
              // Include deletion events that reference bookmark events
              return event.tags.some(tag => tag[0] === 'e');
            }
            return false;
          });
          
          // Cache bookmark events offline for future use
          for (const event of relevantEvents) {
            try {
              await offlineStorage.storeEvent(event);
            } catch (error) {
              console.warn('Failed to cache bookmark event offline:', error);
            }
          }
          
          console.log(`Online bookmark query successful - found ${relevantEvents.length} events`);
          return relevantEvents.sort((a, b) => b.created_at - a.created_at);
        } catch (error) {
          console.warn('Online bookmark query failed, falling back to offline data:', error);
          // Fall through to offline query
        }
      }
      
      // Offline mode or online query failed - use cached data
      try {
        const bookmarkEvents = await offlineStorage.getEventsByKind(CACHE_BOOKMARK_KIND);
        const deletionEvents = await offlineStorage.getEventsByKind(5);
        
        // Filter events by user
        const userBookmarks = bookmarkEvents.filter(event => event.pubkey === user.pubkey);
        const userDeletions = deletionEvents.filter(event => event.pubkey === user.pubkey);
        
        // Filter to only cache bookmark events and relevant deletion events
        const relevantEvents = [...userBookmarks, ...userDeletions].filter(event => {
          if (event.kind === CACHE_BOOKMARK_KIND) {
            return event.tags.some(tag => tag[0] === 'a' && tag[1]?.startsWith('37515:'));
          } else if (event.kind === 5) {
            return event.tags.some(tag => tag[0] === 'e');
          }
          return false;
        });
        
        console.log(`Offline bookmark query fallback - found ${relevantEvents.length} events`);
        return relevantEvents.sort((a, b) => b.created_at - a.created_at);
      } catch (error) {
        console.error('Failed to get offline bookmark data:', error);
        return [];
      }
    },
    enabled: !!user?.pubkey,
    staleTime: (isOnline && !isOfflineMode && navigator.onLine) ? 30000 : Infinity, // 30 seconds online, never stale offline
    retry: false, // Disable retries to prevent cache invalidation
    refetchOnReconnect: true, // Refetch when connection is restored
    networkMode: 'always', // Always run queries regardless of network status
  });

  // Extract saved cache coordinates from bookmark events, considering deletions
  const savedCacheCoords = useMemo(() => {
    if (!bookmarkEvents || bookmarkEvents.length === 0) {
      return [];
    }
    
    // Separate bookmark events and deletion events
    const bookmarks = bookmarkEvents.filter(event => event.kind === CACHE_BOOKMARK_KIND);
    const deletions = bookmarkEvents.filter(event => event.kind === 5);
    
    // Create a set of deleted event IDs
    const deletedEventIds = new Set<string>();
    deletions.forEach(deletion => {
      deletion.tags.forEach(tag => {
        if (tag[0] === 'e') {
          deletedEventIds.add(tag[1]);
        }
      });
    });
    
    // Filter out deleted bookmark events
    const activeBookmarks = bookmarks.filter(event => !deletedEventIds.has(event.id));
    
    // Extract coordinates from active bookmark events with 'save' action
    const savedCoords: string[] = [];
    activeBookmarks.forEach((event) => {
      const aTag = event.tags.find(tag => tag[0] === 'a' && tag[1]?.startsWith('37515:'));
      const actionTag = event.tags.find(tag => tag[0] === 'action');
      
      if (aTag && actionTag && actionTag[1] === 'save') {
        savedCoords.push(aTag[1]);
      }
    });
    
    return savedCoords;
  }, [bookmarkEvents]);

  // Query the actual geocache events for saved caches
  const { data: savedGeocacheEvents, isLoading: isLoadingCaches } = useQuery({
    queryKey: ['saved-geocaches', savedCacheCoords, isOnline && !isOfflineMode && navigator.onLine],
    queryFn: async () => {
      if (savedCacheCoords.length === 0) return [];
      
      console.log('useNostrSavedCaches geocache query starting...', {
        coordsCount: savedCacheCoords.length,
        isOnline,
        isOfflineMode,
        navigatorOnLine: navigator.onLine
      });
      
      // If we're truly offline or in offline mode, use cached data immediately
      if (!navigator.onLine || isOfflineMode || !isOnline) {
        console.log('Using offline geocache data - not connected to internet');
        try {
          const events: NostrEvent[] = [];
          
          // Try to get cached geocache events for each coordinate
          for (const coord of savedCacheCoords) {
            const [kind, pubkey, dTag] = coord.split(':');
            
            // First try to get from cached geocaches
            const cachedGeocaches = await offlineStorage.getAllGeocaches();
            const cachedGeocache = cachedGeocaches.find(cache => 
              cache.event.pubkey === pubkey && 
              cache.event.tags.some(tag => tag[0] === 'd' && tag[1] === dTag)
            );
            
            if (cachedGeocache) {
              events.push(cachedGeocache.event);
            } else {
              // Try to get from general event storage
              const allEvents = await offlineStorage.getEventsByKind(parseInt(kind));
              const matchingEvent = allEvents.find(event => 
                event.pubkey === pubkey && 
                event.tags.some(tag => tag[0] === 'd' && tag[1] === dTag)
              );
              if (matchingEvent) {
                events.push(matchingEvent);
              }
            }
          }
          
          console.log(`Found ${events.length} offline saved geocache events`);
          return events;
        } catch (error) {
          console.error('Failed to get offline saved geocache data:', error);
          return [];
        }
      }
      
      // Try online first if available
      if (isOnline && nostr) {
        try {
          // Build filters for each saved geocache coordinate
          const filters = savedCacheCoords.map(coord => {
            const [kind, pubkey, dTag] = coord.split(':');
            return {
              kinds: [parseInt(kind)],
              authors: [pubkey],
              '#d': [dTag],
              limit: 1
            };
          });
          
          // Safari-compatible query with batch processing
          const events: NostrEvent[] = [];
          
          // Process filters in smaller batches for Safari
          const batchSize = 5;
          for (let i = 0; i < filters.length; i += batchSize) {
            const batch = filters.slice(i, i + batchSize);
            try {
              const batchEvents = await Promise.race([
                nostr.query(batch),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Batch query timeout')), 5000)
                )
              ]);
              events.push(...batchEvents);
            } catch (error) {
              // Continue with other batches
            }
          }
          
          // Cache geocache events offline for future use
          for (const event of events) {
            try {
              await offlineStorage.storeEvent(event);
              
              // Also store as cached geocache for easier retrieval
              const parsed = parseGeocacheEvent(event);
              if (parsed) {
                await offlineStorage.storeGeocache({
                  id: event.id,
                  event,
                  lastUpdated: Date.now(),
                  coordinates: [parsed.location.lat, parsed.location.lng],
                  difficulty: parsed.difficulty,
                  terrain: parsed.terrain,
                  type: parsed.type,
                });
              }
            } catch (error) {
              console.warn('Failed to cache geocache event offline:', error);
            }
          }
          
          console.log(`Online saved geocache query successful - found ${events.length} events`);
          return events;
        } catch (error) {
          console.warn('Online saved geocache query failed, falling back to offline data:', error);
          // Fall through to offline query
        }
      }
      
      // Offline mode or online query failed - use cached data
      try {
        const events: NostrEvent[] = [];
        
        // Try to get cached geocache events for each coordinate
        for (const coord of savedCacheCoords) {
          const [kind, pubkey, dTag] = coord.split(':');
          
          // First try to get from cached geocaches
          const cachedGeocaches = await offlineStorage.getAllGeocaches();
          const cachedGeocache = cachedGeocaches.find(cache => 
            cache.event.pubkey === pubkey && 
            cache.event.tags.some(tag => tag[0] === 'd' && tag[1] === dTag)
          );
          
          if (cachedGeocache) {
            events.push(cachedGeocache.event);
          } else {
            // Try to get from general event storage
            const allEvents = await offlineStorage.getEventsByKind(parseInt(kind));
            const matchingEvent = allEvents.find(event => 
              event.pubkey === pubkey && 
              event.tags.some(tag => tag[0] === 'd' && tag[1] === dTag)
            );
            if (matchingEvent) {
              events.push(matchingEvent);
            }
          }
        }
        
        console.log(`Offline saved geocache query fallback - found ${events.length} events`);
        return events;
      } catch (error) {
        console.error('Failed to get offline saved geocache data:', error);
        return [];
      }
    },
    enabled: savedCacheCoords.length > 0,
    staleTime: (isOnline && !isOfflineMode && navigator.onLine) ? 60000 : Infinity, // 1 minute online, never stale offline
    retry: false, // Disable retries to prevent cache invalidation
    refetchOnReconnect: true, // Refetch when connection is restored
    networkMode: 'always', // Always run queries regardless of network status
  });

  // Query log counts for saved caches
  const { data: savedCacheLogCounts, isLoading: isLoadingLogCounts } = useQuery({
    queryKey: ['saved-cache-log-counts', savedCacheCoords, isOnline && !isOfflineMode && navigator.onLine],
    queryFn: async () => {
      if (savedCacheCoords.length === 0) return new Map();
      
      // Skip log counts in offline mode to avoid network requests
      if (!navigator.onLine || isOfflineMode || !isOnline || !nostr) {
        console.log('Skipping log counts query - offline mode');
        return new Map();
      }
      
      try {
        // Single filter for all log events
        const logFilter: NostrFilter = {
          kinds: [NIP_GC_KINDS.LOG],
          '#a': savedCacheCoords,
          limit: 1000,
        };
        
        // Safari-compatible log query with reduced scope
        const allLogEvents = await Promise.race([
          nostr.query([logFilter]),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Log count query timeout')), 4000)
          )
        ]);
        
        // Group logs by geocache and count them
        const logCounts = new Map<string, { total: number; found: number }>();
        
        for (const logEvent of allLogEvents) {
          const aTag = logEvent.tags.find(t => t[0] === 'a')?.[1];
          if (aTag) {
            const logType = logEvent.tags.find(t => t[0] === 'log-type')?.[1];
            
            if (!logCounts.has(aTag)) {
              logCounts.set(aTag, { total: 0, found: 0 });
            }
            
            const counts = logCounts.get(aTag)!;
            counts.total++;
            
            if (logType === 'found') {
              counts.found++;
            }
          }
        }
        
        console.log(`Log counts query successful - found counts for ${logCounts.size} caches`);
        return logCounts;
      } catch (error) {
        console.warn('Log counts query failed:', error);
        return new Map();
      }
    },
    enabled: savedCacheCoords.length > 0,
    staleTime: (isOnline && !isOfflineMode && navigator.onLine) ? 60000 : Infinity, // 1 minute online, never stale offline
    retry: false,
    refetchOnReconnect: true,
    networkMode: 'always',
  });

  // Convert geocache events to SavedCache format
  const savedCaches = useMemo(() => {
    if (!savedGeocacheEvents) return [];
    
    return savedGeocacheEvents.map(event => {
      const parsed = parseGeocacheEvent(event);
      if (!parsed) {
        return null;
      }
      
      // Get log counts for this cache
      const coord = createGeocacheCoordinate(event.pubkey, parsed.dTag);
      const counts = savedCacheLogCounts?.get(coord) || { total: 0, found: 0 };
      
      return {
        id: parsed.id,
        dTag: parsed.dTag,
        pubkey: parsed.pubkey,
        name: parsed.name,
        savedAt: parsed.created_at * 1000, // Convert to milliseconds
        location: parsed.location,
        difficulty: parsed.difficulty,
        terrain: parsed.terrain,
        size: parsed.size,
        type: parsed.type,
        foundCount: counts.found,
        logCount: counts.total,
      } as SavedCache;
    }).filter((cache): cache is SavedCache => cache !== null)
      .sort((a, b) => b.savedAt - a.savedAt); // Sort by most recently saved
  }, [savedGeocacheEvents, savedCacheLogCounts]);

  // Check if a cache is saved
  const isCacheSaved = useCallback((cacheId: string, dTag?: string, pubkey?: string) => {
    if (!user) return false;
    
    if (dTag && pubkey) {
      const coord = `37515:${pubkey}:${dTag}`;
      return savedCacheCoords.includes(coord);
    }
    
    // Fallback: check by cache ID in saved events
    return savedCaches.some(cache => cache.id === cacheId);
  }, [savedCacheCoords, savedCaches, user]);

  // Save cache by publishing a bookmark event
  const saveCache = useCallback(async (geocache: Geocache) => {
    if (!user) throw new Error('User must be logged in to save caches');

    const coord = `37515:${geocache.pubkey}:${geocache.dTag}`;
    
    // Check if already saved
    if (savedCacheCoords.includes(coord)) {
      return;
    }

    const bookmarkEvent = {
      kind: CACHE_BOOKMARK_KIND,
      content: `Saved cache: ${geocache.name}`,
      tags: [
        ['L', 'treasures/cache-bookmark'],
        ['l', 'treasures/cache-bookmark'],
        ['a', coord],
        ['name', geocache.name],
        ['action', 'save'],
        ['client', 'treasures']
      ],
    };

    if (isOnline) {
      try {
        // Publish online
        await publishEvent(bookmarkEvent);
      } catch (error) {
        console.warn('Failed to publish bookmark online, storing offline:', error);
        // Store offline for later sync
        if (user.signer) {
          const signedEvent = await user.signer.signEvent({
            ...bookmarkEvent,
            created_at: Math.floor(Date.now() / 1000),
          });
          await offlineStorage.storeEvent(signedEvent);
        }
      }
    } else {
      // Offline mode - store for later sync
      if (user.signer) {
        const signedEvent = await user.signer.signEvent({
          ...bookmarkEvent,
          created_at: Math.floor(Date.now() / 1000),
        });
        await offlineStorage.storeEvent(signedEvent);
      }
    }

    // Refetch bookmarks to update UI
    await refetchBookmarks();
    queryClient.invalidateQueries({ queryKey: ['saved-geocaches'] });
  }, [user, savedCacheCoords, publishEvent, refetchBookmarks, queryClient, isOnline]);

  // Unsave cache by deleting the bookmark event
  const unsaveCache = useCallback(async (geocache: Geocache) => {
    if (!user) throw new Error('User must be logged in to unsave caches');

    const coord = `37515:${geocache.pubkey}:${geocache.dTag}`;
    
    // Find the bookmark event to delete
    const bookmarkEvent = bookmarkEvents?.find(event => {
      const aTag = event.tags.find(tag => tag[0] === 'a' && tag[1] === coord);
      const actionTag = event.tags.find(tag => tag[0] === 'action' && tag[1] === 'save');
      return aTag && actionTag;
    });

    if (bookmarkEvent) {
      const deletionEvent = {
        kind: 5, // Event deletion request
        content: `Removed bookmark for cache: ${geocache.name}`,
        tags: [
          ['e', bookmarkEvent.id], // Reference to the bookmark event to delete
          ['client', 'treasures']
        ],
      };

      if (isOnline) {
        try {
          // Publish deletion online
          await publishEvent(deletionEvent);
        } catch (error) {
          console.warn('Failed to publish deletion online, storing offline:', error);
          // Store offline for later sync
          if (user.signer) {
            const signedEvent = await user.signer.signEvent({
              ...deletionEvent,
              created_at: Math.floor(Date.now() / 1000),
            });
            await offlineStorage.storeEvent(signedEvent);
          }
        }
      } else {
        // Offline mode - store for later sync
        if (user.signer) {
          const signedEvent = await user.signer.signEvent({
            ...deletionEvent,
            created_at: Math.floor(Date.now() / 1000),
          });
          await offlineStorage.storeEvent(signedEvent);
        }
      }

      // Remove from local storage immediately for better UX
      try {
        // Remove the bookmark event from offline storage
        await offlineStorage.removeEvent(bookmarkEvent.id);
        
        // Remove the geocache from offline storage if it exists
        await offlineStorage.removeGeocache(geocache.id);
        
        // Also remove from browser cache if it exists
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            // Remove any cached data related to this geocache
            const keys = await cache.keys();
            for (const request of keys) {
              if (request.url.includes(geocache.id) || request.url.includes(geocache.dTag)) {
                await cache.delete(request);
              }
            }
          }
        }
        
        console.log(`Removed cache ${geocache.name} from local storage`);
      } catch (error) {
        console.warn('Failed to remove cache from local storage:', error);
      }
    }

    // Refetch bookmarks to update UI
    await refetchBookmarks();
    queryClient.invalidateQueries({ queryKey: ['saved-geocaches'] });
  }, [user, bookmarkEvents, publishEvent, refetchBookmarks, queryClient, isOnline]);

  // Toggle save cache
  const toggleSaveCache = useCallback(async (geocache: Geocache) => {
    if (!user) {
      throw new Error('User must be logged in to save caches');
    }

    const isCurrentlySaved = isCacheSaved(geocache.id, geocache.dTag, geocache.pubkey);
    
    if (isCurrentlySaved) {
      await unsaveCache(geocache);
    } else {
      await saveCache(geocache);
    }
  }, [isCacheSaved, saveCache, unsaveCache, user]);

  // Clear all saved caches by deleting all bookmark events
  const clearAllSaved = useCallback(async () => {
    if (!user) return;
    
    // Find all bookmark events with 'save' action
    const saveBookmarkEvents = bookmarkEvents?.filter(event => {
      const actionTag = event.tags.find(tag => tag[0] === 'action' && tag[1] === 'save');
      const aTag = event.tags.find(tag => tag[0] === 'a' && tag[1]?.startsWith('37515:'));
      return actionTag && aTag;
    }) || [];

    if (saveBookmarkEvents.length > 0) {
      // Publish a deletion event for all bookmark events
      await publishEvent({
        kind: 5, // Event deletion request
        content: 'Cleared all saved caches',
        tags: [
          ...saveBookmarkEvents.map(event => ['e', event.id]), // Reference all bookmark events to delete
          ['client', 'treasures']
        ],
      });

      // Remove all saved caches from local storage immediately
      try {
        // Remove all bookmark events from offline storage
        for (const event of saveBookmarkEvents) {
          await offlineStorage.removeEvent(event.id);
        }
        
        // Remove all saved geocaches from offline storage
        for (const cache of savedCaches) {
          await offlineStorage.removeGeocache(cache.id);
        }
        
        // Clear related browser cache entries
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (cacheName.includes('saved') || cacheName.includes('bookmark')) {
              await caches.delete(cacheName);
            }
          }
        }
        
        console.log(`Cleared all ${saveBookmarkEvents.length} saved caches from local storage`);
      } catch (error) {
        console.warn('Failed to clear saved caches from local storage:', error);
      }
    }
    
    // Force immediate cache invalidation
    queryClient.invalidateQueries({ queryKey: ['cache-bookmarks', user.pubkey] });
    queryClient.invalidateQueries({ queryKey: ['saved-geocaches'] });
    queryClient.invalidateQueries({ queryKey: ['saved-cache-log-counts'] });
    
    // Also refetch the bookmarks
    await refetchBookmarks();
  }, [user, bookmarkEvents, publishEvent, refetchBookmarks, queryClient, savedCaches]);

  // Unsave cache by ID (for compatibility with existing components)
  const unsaveCacheById = useCallback(async (cacheId: string) => {
    // Find the cache in saved caches to get its details
    const cache = savedCaches.find(c => c.id === cacheId);
    if (cache) {
      // Use the full geocache object for proper unsaving
      const geocache: Geocache = {
        id: cache.id,
        dTag: cache.dTag,
        pubkey: cache.pubkey,
        name: cache.name,
        location: cache.location,
        difficulty: cache.difficulty,
        terrain: cache.terrain,
        size: cache.size as "micro" | "small" | "regular" | "large" | "other",
        type: cache.type as "traditional" | "multi" | "mystery",
        created_at: Math.floor(cache.savedAt / 1000), // Convert to seconds
        description: '', // Not stored in saved cache
        foundCount: cache.foundCount || 0,
        logCount: cache.logCount || 0,
      };
      await toggleSaveCache(geocache);
    }
  }, [savedCaches, toggleSaveCache]);

  return {
    savedCaches,
    isCacheSaved,
    toggleSaveCache,
    unsaveCache: unsaveCacheById,
    clearAllSaved,
    isNostrEnabled: !!user,
    nostrSavedCount: savedCacheCoords.length,
    isLoading: isLoadingBookmarks || isLoadingCaches || isLoadingLogCounts,
  };
}