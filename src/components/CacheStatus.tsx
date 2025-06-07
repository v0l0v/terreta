/**
 * Component to display cache status and allow manual cache validation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Trash2, CheckCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useCacheInvalidation } from '@/hooks/useCacheInvalidation';
import { useOfflineMode } from '@/hooks/useOfflineStorage';
import { offlineStorage } from '@/lib/offlineStorage';
import { useQuery } from '@tanstack/react-query';

export function CacheStatus() {
  const [isValidating, setIsValidating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  
  const { 
    validateCachedGeocaches, 
    isMonitoring 
  } = useCacheInvalidation();
  
  const { 
    isOnline, 
    isConnected, 
    connectionQuality, 
    pendingActions,
    lastSyncTime 
  } = useOfflineMode();

  // Get cache statistics
  const { data: cacheStats } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const [allCaches, unvalidatedCaches] = await Promise.all([
        offlineStorage.getAllGeocaches(),
        offlineStorage.getUnvalidatedGeocaches(),
      ]);

      return {
        totalCaches: allCaches.length,
        unvalidatedCaches: unvalidatedCaches.length,
        oldestCache: allCaches.reduce((oldest, cache) => 
          !oldest || cache.lastUpdated < oldest.lastUpdated ? cache : oldest, 
          null as any
        ),
      };
    },
    refetchInterval: 30000, // Update every 30 seconds
  });

  const handleValidateCache = async () => {
    if (!isOnline || !isConnected) return;
    
    setIsValidating(true);
    try {
      await validateCachedGeocaches();
    } catch (error) {
      console.error('Cache validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearCache = async () => {
    setIsCleaning(true);
    try {
      await offlineStorage.performCleanup();
      // Force refresh of cache stats
      window.location.reload();
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    } finally {
      setIsCleaning(false);
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline || !isConnected) return <WifiOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getConnectionStatus = () => {
    if (!isOnline || !isConnected) return 'Offline';
    return `Online (${connectionQuality})`;
  };

  const getConnectionColor = () => {
    if (!isOnline || !isConnected) return 'destructive';
    if (connectionQuality === 'good') return 'default';
    if (connectionQuality === 'poor') return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Cache Status
          {getConnectionIcon()}
        </CardTitle>
        <CardDescription>
          Monitor and manage offline cache status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection:</span>
          <Badge variant={getConnectionColor()}>
            {getConnectionStatus()}
          </Badge>
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cached Geocaches:</span>
                <Badge variant="outline">{cacheStats.totalCaches}</Badge>
              </div>
              
              {cacheStats.unvalidatedCaches > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    Need Validation:
                  </span>
                  <Badge variant="secondary" className="text-amber-600 dark:text-amber-400">
                    {cacheStats.unvalidatedCaches}
                  </Badge>
                </div>
              )}

              {pendingActions > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    Pending Sync:
                  </span>
                  <Badge variant="secondary" className="text-blue-600 dark:text-blue-400">
                    {pendingActions}
                  </Badge>
                </div>
              )}
            </div>
          </>
        )}



        {/* Last Sync Time */}
        {lastSyncTime && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Sync:</span>
              <span className="text-xs text-muted-foreground">
                {new Date(lastSyncTime).toLocaleString()}
              </span>
            </div>
          </>
        )}

        {/* Monitoring Status */}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm">Cache Monitoring:</span>
          <div className="flex items-center gap-1">
            {isMonitoring ? (
              <>
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary">Active</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-accent" />
                <span className="text-xs text-accent">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <Separator />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidateCache}
            disabled={!isOnline || !isConnected || isValidating}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Validate Cache'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            disabled={isCleaning}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isCleaning ? 'Cleaning...' : 'Clear Old Data'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground">
          Cache validation checks if stored geocaches still exist upstream. 
          Deleted geocaches are automatically removed from local storage.
        </div>
      </CardContent>
    </Card>
  );
}