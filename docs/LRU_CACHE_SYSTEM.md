# LRU Cache System for Geocaches and Logs

## Overview

The LRU (Least Recently Used) cache system provides intelligent in-memory caching for geocaches and their logs, preventing unnecessary network requests while ensuring data freshness through background polling.

## Key Features

### 🚀 **Smart Caching**
- **LRU eviction**: Automatically removes least recently used items when at capacity
- **Freshness validation**: Checks data age before serving from cache
- **Background updates**: Polls for new data without blocking UI
- **Memory efficient**: Configurable size limits and automatic cleanup

### 🔄 **Intelligent Updates**
- **Real data only**: Only updates cache when actual new data is received
- **Background polling**: Continuous sync without user interaction
- **Conditional fetching**: Skips network requests when cache is fresh
- **Optimistic loading**: Serves cached data immediately while fetching updates

### 📊 **Performance Monitoring**
- **Hit/miss statistics**: Track cache effectiveness
- **Memory usage tracking**: Monitor cache size and performance
- **Access patterns**: Understand data usage for optimization

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Query   │◄──►│  Cache Manager  │◄──►│   LRU Caches    │
│   (Network)     │    │  (Coordinator)  │    │ (Memory Store)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Background Sync │    │   Validation    │    │   Statistics    │
│   (Polling)     │    │  (Freshness)    │    │  (Monitoring)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. LRU Cache (`src/lib/lruCache.ts`)

**Base LRU Cache**
```typescript
const cache = new LRUCache<T>(maxSize);
cache.set(key, data);
const data = cache.get(key);
```

**Specialized Caches**
- `GeocacheCache`: Optimized for geocache data with spatial queries
- `LogCache`: Optimized for log data with temporal queries

### 2. Cache Manager (`src/lib/cacheManager.ts`)

Central coordinator that manages multiple LRU caches and provides:
- Unified API for all cache operations
- Data validation and freshness checking
- Background update coordination
- Statistics and monitoring

```typescript
import { cacheManager } from '@/lib/cacheManager';

// Geocache operations
cacheManager.setGeocache(id, geocache);
const geocache = cacheManager.getGeocache(id);

// Log operations
cacheManager.setLogs(geocacheId, logs);
const logs = cacheManager.getLogs(geocacheId);

// Validation
const validation = cacheManager.validateGeocache(id, maxAge);
if (validation.isValid) {
  // Use cached data
}
```

### 3. Cached Data Hooks (`src/hooks/useCachedData.ts`)

React hooks that integrate LRU cache with React Query:

```typescript
// Smart data fetching with cache integration
const { geocaches } = useSmartDataFetching();

// Cache-aware queries
const geocaches = useCachedGeocaches();
const logs = useCachedGeocacheLogs(geocacheId);

// Cache management
const { invalidateGeocache, getStats } = useCacheManager();
```

## Usage Patterns

### 1. **Component Data Fetching**

```typescript
function GeocacheList() {
  const { geocaches, isLoading } = useSmartDataFetching();
  
  // Data is served from cache if fresh, otherwise fetched
  // Background polling keeps data updated
  
  return (
    <div>
      {geocaches.map(cache => (
        <GeocacheCard key={cache.id} geocache={cache} />
      ))}
    </div>
  );
}
```

### 2. **Manual Cache Management**

```typescript
function AdminPanel() {
  const { getStats, clearAll } = useCacheManager();
  
  const stats = getStats();
  
  return (
    <div>
      <p>Cache Hit Rate: {(stats.geocaches.hitRate * 100).toFixed(1)}%</p>
      <p>Memory Usage: {(stats.totalMemoryUsage / 1024).toFixed(1)} KB</p>
      <button onClick={clearAll}>Clear Cache</button>
    </div>
  );
}
```

### 3. **Background Sync Integration**

```typescript
function useDataManager() {
  const backgroundSync = useBackgroundSync();
  
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only update if new data is available
      const updatedCount = await backgroundSync.syncGeocaches();
      if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} geocaches`);
      }
    }, POLLING_INTERVALS.BACKGROUND_SYNC);
    
    return () => clearInterval(interval);
  }, []);
}
```

## Configuration

### Cache Sizes
```typescript
// In src/lib/constants.ts
export const STORAGE_CONFIG = {
  MAX_CACHE_ENTRIES: 500,     // Total cache entries
  MAX_AGE_DAYS: 30,           // Auto-cleanup age
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
} as const;
```

### Polling Intervals
```typescript
export const POLLING_INTERVALS = {
  GEOCACHES: 180000,          // 3 minutes
  LOGS: 120000,               // 2 minutes  
  BACKGROUND_SYNC: 300000,    // 5 minutes
} as const;
```

### Validation Times
```typescript
// Geocache freshness: 5 minutes
const validation = cacheManager.validateGeocache(id, 300000);

// Log freshness: 4 minutes
const validation = cacheManager.validateLogs(id, 240000);
```

## Performance Benefits

### 🚀 **Reduced Network Requests**
- **Cache hits**: Serve data instantly from memory
- **Smart polling**: Only fetch when data might have changed
- **Batch operations**: Group related requests

### ⚡ **Faster UI Response**
- **Instant loading**: Cached data appears immediately
- **Optimistic updates**: Show cached data while fetching fresh
- **Background sync**: Updates happen without blocking UI

### 💾 **Memory Efficiency**
- **LRU eviction**: Automatically removes old data
- **Size limits**: Prevents memory bloat
- **Cleanup cycles**: Regular maintenance

## Monitoring and Debugging

### Cache Statistics
```typescript
const stats = cacheManager.getStats();

console.log({
  geocacheHitRate: stats.geocaches.hitRate,
  logHitRate: stats.logs.hitRate,
  totalMemory: stats.totalMemoryUsage,
  cacheSize: stats.geocaches.size + stats.logs.size,
});
```

### Debug Information
```typescript
// Get cache keys for debugging
const geocacheKeys = cacheManager.getGeocacheKeys();
const logKeys = cacheManager.getLogKeys();

// Check validation status
const validation = cacheManager.validateGeocache(id);
console.log('Cache validation:', validation);
```

## Best Practices

### ✅ **Do**
- Use `useSmartDataFetching()` for main data access
- Let background sync handle updates automatically
- Monitor cache hit rates for optimization
- Set appropriate freshness timeouts for your use case

### ❌ **Don't**
- Clear cache unnecessarily (let LRU handle eviction)
- Bypass cache for data that's already fresh
- Set polling intervals too aggressively
- Ignore cache statistics and performance metrics

## Testing

The cache system includes comprehensive tests:

```bash
# Run cache tests
npx vitest run src/tests/lruCache.test.ts
npx vitest run src/tests/cacheManager.test.ts

# Test coverage includes:
# - LRU eviction behavior
# - Cache validation logic
# - Background sync integration
# - Memory management
# - Error handling
```

## Migration Guide

### From Direct React Query
```typescript
// Before: Direct React Query
const { data: geocaches } = useQuery(['geocaches'], fetchGeocaches);

// After: Cache-integrated
const { geocaches } = useSmartDataFetching();
```

### From Manual Polling
```typescript
// Before: Manual polling
useEffect(() => {
  const interval = setInterval(fetchData, 60000);
  return () => clearInterval(interval);
}, []);

// After: Automatic background sync
const dataManager = useDataManager({
  enablePolling: true,
  enablePrefetching: true,
});
```

## Future Enhancements

- **Persistent cache**: Save cache to localStorage/IndexedDB
- **Cache warming**: Preload data based on user patterns
- **Compression**: Reduce memory usage for large datasets
- **Metrics dashboard**: Visual cache performance monitoring
- **Smart prefetching**: ML-based prediction of needed data