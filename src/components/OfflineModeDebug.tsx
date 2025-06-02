/**
 * Debug component to show offline mode status
 * This component helps verify that offline-only mode is working correctly
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Settings } from 'lucide-react';
import { useOfflineMode, useOfflineSettings } from '@/hooks/useOfflineStorage';
import { useConnectivity } from '@/hooks/useConnectivity';

export function OfflineModeDebug() {
  const { 
    isOfflineMode, 
    isOnline, 
    isConnected, 
    connectionQuality 
  } = useOfflineMode();
  
  const { settings } = useOfflineSettings();
  const connectivity = useConnectivity();

  const isOfflineOnly = settings.offlineOnly as boolean ?? false;

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="h-4 w-4" />
          Offline Mode Debug
        </CardTitle>
        <CardDescription className="text-xs">
          Debug information for offline mode functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="font-medium">Settings</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Offline Only:</span>
                <Badge variant={isOfflineOnly ? "destructive" : "secondary"} className="text-xs">
                  {isOfflineOnly ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Connectivity</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Navigator Online:</span>
                <Badge variant={navigator.onLine ? "default" : "destructive"} className="text-xs">
                  {navigator.onLine ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Actual Connected:</span>
                <Badge variant={connectivity.isConnected ? "default" : "destructive"} className="text-xs">
                  {connectivity.isConnected ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Quality:</span>
                <Badge variant="outline" className="text-xs">
                  {connectivity.connectionQuality}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <div className="font-medium">Computed Status</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>useOfflineMode.isOnline:</span>
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>useOfflineMode.isConnected:</span>
                <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>useOfflineMode.isOfflineMode:</span>
                <Badge variant={isOfflineMode ? "destructive" : "default"} className="text-xs">
                  {isOfflineMode ? "Offline Mode" : "Online Mode"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs">
            {isOfflineMode ? (
              <WifiOff className="h-3 w-3 text-red-500" />
            ) : (
              <Wifi className="h-3 w-3 text-green-500" />
            )}
            <span className="font-medium">
              Current Mode: {isOfflineMode ? "Offline" : "Online"}
            </span>
            {isOfflineOnly && (
              <Badge variant="destructive" className="text-xs">
                Forced Offline
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}