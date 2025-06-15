/**
 * React hook for enhanced connectivity detection
 */

import { useState, useEffect } from 'react';
import { connectivityChecker, ConnectivityStatus } from '@/features/offline/utils/connectivityChecker';
import { useOfflineSettings } from './useOfflineStorage';

export function useConnectivity() {
  const [status, setStatus] = useState<ConnectivityStatus>(() => 
    connectivityChecker.getStatus()
  );

  useEffect(() => {
    // Subscribe to connectivity changes
    const unsubscribe = connectivityChecker.addListener(setStatus);

    // Get initial status
    setStatus(connectivityChecker.getStatus());

    return unsubscribe;
  }, []);

  const forceCheck = async () => {
    return await connectivityChecker.forceCheck();
  };

  return {
    ...status,
    forceCheck,
  };
}

// Convenience hook for simple online/offline detection
export function useOnlineStatus() {
  const { isConnected, connectionQuality } = useConnectivity();
  const { settings } = useOfflineSettings();
  const { offlineOnly } = settings;
  
  const isOnline = isConnected && connectionQuality !== 'offline' && !offlineOnly;

  return {
    isOnline,
    isConnected: isConnected && !offlineOnly,
    connectionQuality: offlineOnly ? 'offline' : connectionQuality,
  };
}
