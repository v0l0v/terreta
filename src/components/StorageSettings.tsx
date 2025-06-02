/**
 * Storage settings component for managing local storage configuration
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { HardDrive, Trash2, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { useStorageConfig } from '@/hooks/useStorageConfig';
import { useToast } from '@/hooks/useToast';

export function StorageSettings() {
  const { 
    config, 
    storageInfo, 
    isNearLimit, 
    updateConfig, 
    setStorageLimit, 
    performCleanup,
    isUpdating,
    isPerformingCleanup 
  } = useStorageConfig();
  
  const [tempLimit, setTempLimit] = useState(storageInfo.limitInGB.toString());
  const { toast } = useToast();

  const handleUpdateLimit = async () => {
    const limitGB = parseFloat(tempLimit);
    if (isNaN(limitGB) || limitGB < 0.1) {
      toast({
        title: 'Invalid storage limit',
        description: 'Storage limit must be at least 0.1 GB',
        variant: 'destructive',
      });
      return;
    }

    try {
      await setStorageLimit(limitGB);
      toast({
        title: 'Storage limit updated',
        description: `Storage limit set to ${limitGB} GB`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update storage limit',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCleanup = async () => {
    try {
      performCleanup();
      toast({
        title: 'Cleanup started',
        description: 'Removing old cached data to free up space...',
      });
    } catch (error) {
      toast({
        title: 'Cleanup failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAutoCleanup = (enabled: boolean) => {
    updateConfig({ enableAutoCleanup: enabled });
    toast({
      title: enabled ? 'Auto-cleanup enabled' : 'Auto-cleanup disabled',
      description: enabled 
        ? 'Old data will be automatically removed when storage is full'
        : 'You will need to manually clean up storage when it gets full',
    });
  };

  const handleUpdateCleanupThreshold = (threshold: number) => {
    updateConfig({ cleanupThreshold: threshold / 100 });
    toast({
      title: 'Cleanup threshold updated',
      description: `Auto-cleanup will trigger when storage reaches ${threshold}%`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Settings
        </CardTitle>
        <CardDescription>
          Manage local storage limits and cleanup settings for cached data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Storage Usage</Label>
            <div className="flex items-center gap-2">
              {isNearLimit && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Near Limit
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {storageInfo.used} / {storageInfo.quota}
              </Badge>
            </div>
          </div>
          
          <Progress 
            value={storageInfo.percentage} 
            className={`h-2 ${isNearLimit ? 'bg-red-100' : ''}`}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{storageInfo.percentage}% used</span>
            <span>{100 - storageInfo.percentage}% available</span>
          </div>
        </div>

        <Separator />

        {/* Storage Limit */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Storage Limit</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                placeholder="Storage limit in GB"
                min="0.1"
                step="0.1"
              />
            </div>
            <Button 
              onClick={handleUpdateLimit}
              disabled={isUpdating || tempLimit === storageInfo.limitInGB.toString()}
              size="sm"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current limit: {storageInfo.limitInGB} GB (default: 2 GB)
          </p>
        </div>

        <Separator />

        {/* Auto-cleanup Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Auto-cleanup</Label>
              <p className="text-xs text-muted-foreground">
                Automatically remove old cached data when storage is full
              </p>
            </div>
            <Switch
              checked={config.enableAutoCleanup}
              onCheckedChange={handleToggleAutoCleanup}
              disabled={isUpdating}
            />
          </div>

          {config.enableAutoCleanup && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="space-y-2">
                <Label className="text-sm">Cleanup Threshold</Label>
                <div className="flex gap-2">
                  {[80, 85, 90, 95].map((threshold) => (
                    <Button
                      key={threshold}
                      variant={Math.round(config.cleanupThreshold * 100) === threshold ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleUpdateCleanupThreshold(threshold)}
                      disabled={isUpdating}
                    >
                      {threshold}%
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cleanup will trigger when storage reaches this percentage
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Manual Cleanup */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Manual Cleanup</Label>
              <p className="text-xs text-muted-foreground">
                Remove old cached data to free up space immediately
              </p>
            </div>
            <Button
              onClick={handleCleanup}
              disabled={isPerformingCleanup}
              variant="outline"
              size="sm"
            >
              {isPerformingCleanup ? (
                <>
                  <Settings className="h-4 w-4 mr-2 animate-spin" />
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clean Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Storage Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Storage Information
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Cached data includes map tiles, geocache details, and user profiles</p>
            <p>• Old data is automatically removed after {Math.round(config.maxCacheAge / (24 * 60 * 60 * 1000))} days</p>
            <p>• Saved caches are preserved even during cleanup</p>
            <p>• Storage is shared across all browser tabs and windows</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}