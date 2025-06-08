/**
 * Component to display cache statistics and performance metrics
 * Useful for monitoring the LRU cache system performance
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCacheManager } from '@/hooks/useCacheManager';
import { formatDistanceToNow } from 'date-fns';

export function CacheStatsDisplay() {
  const { getStats, clearAll } = useCacheManager();
  const [stats, setStats] = useState(getStats());

  // Update stats every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [getStats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 0.8) return 'bg-green-500';
    if (hitRate >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cache Performance</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAll}
          className="text-destructive hover:text-destructive"
        >
          Clear Cache
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.geocaches.size + stats.logs.size}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatBytes(stats.totalMemoryUsage)}
            </div>
            <div className="text-sm text-muted-foreground">Memory Usage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats.lastCleanup 
                ? formatDistanceToNow(new Date(stats.lastCleanup), { addSuffix: true })
                : 'Never'
              }
            </div>
            <div className="text-sm text-muted-foreground">Last Cleanup</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {formatPercentage(
                (stats.geocaches.totalHits + stats.logs.totalHits) /
                Math.max(1, stats.geocaches.totalHits + stats.geocaches.totalMisses + 
                         stats.logs.totalHits + stats.logs.totalMisses)
              )}
            </div>
            <div className="text-sm text-muted-foreground">Overall Hit Rate</div>
          </div>
        </div>

        {/* Geocache Cache Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Geocache Cache</h3>
            <Badge 
              className={`${getHitRateColor(stats.geocaches.hitRate)} text-white`}
            >
              {formatPercentage(stats.geocaches.hitRate)} hit rate
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">{stats.geocaches.size}</div>
              <div className="text-muted-foreground">Cached Items</div>
            </div>
            <div>
              <div className="font-medium">{stats.geocaches.totalHits}</div>
              <div className="text-muted-foreground">Cache Hits</div>
            </div>
            <div>
              <div className="font-medium">{stats.geocaches.totalMisses}</div>
              <div className="text-muted-foreground">Cache Misses</div>
            </div>
            <div>
              <div className="font-medium">
                {stats.geocaches.maxSize - stats.geocaches.size}
              </div>
              <div className="text-muted-foreground">Available Slots</div>
            </div>
          </div>

          {/* Cache age info */}
          {stats.geocaches.oldestEntry && stats.geocaches.newestEntry && (
            <div className="text-xs text-muted-foreground">
              Oldest entry: {formatDistanceToNow(new Date(stats.geocaches.oldestEntry), { addSuffix: true })} • 
              Newest entry: {formatDistanceToNow(new Date(stats.geocaches.newestEntry), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Log Cache Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Log Cache</h3>
            <Badge 
              className={`${getHitRateColor(stats.logs.hitRate)} text-white`}
            >
              {formatPercentage(stats.logs.hitRate)} hit rate
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">{stats.logs.size}</div>
              <div className="text-muted-foreground">Cached Items</div>
            </div>
            <div>
              <div className="font-medium">{stats.logs.totalHits}</div>
              <div className="text-muted-foreground">Cache Hits</div>
            </div>
            <div>
              <div className="font-medium">{stats.logs.totalMisses}</div>
              <div className="text-muted-foreground">Cache Misses</div>
            </div>
            <div>
              <div className="font-medium">
                {stats.logs.maxSize - stats.logs.size}
              </div>
              <div className="text-muted-foreground">Available Slots</div>
            </div>
          </div>

          {/* Cache age info */}
          {stats.logs.oldestEntry && stats.logs.newestEntry && (
            <div className="text-xs text-muted-foreground">
              Oldest entry: {formatDistanceToNow(new Date(stats.logs.oldestEntry), { addSuffix: true })} • 
              Newest entry: {formatDistanceToNow(new Date(stats.logs.newestEntry), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Performance Indicators */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Performance Indicators</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Cache Efficiency:</span>
              <span className={`font-medium ${
                stats.geocaches.hitRate > 0.8 ? 'text-green-600' : 
                stats.geocaches.hitRate > 0.6 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.geocaches.hitRate > 0.8 ? 'Excellent' :
                 stats.geocaches.hitRate > 0.6 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span className={`font-medium ${
                stats.totalMemoryUsage < 1024 * 1024 ? 'text-green-600' : 
                stats.totalMemoryUsage < 5 * 1024 * 1024 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.totalMemoryUsage < 1024 * 1024 ? 'Low' :
                 stats.totalMemoryUsage < 5 * 1024 * 1024 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cache Utilization:</span>
              <span className="font-medium">
                {formatPercentage(
                  (stats.geocaches.size + stats.logs.size) / 
                  (stats.geocaches.maxSize + stats.logs.maxSize)
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}