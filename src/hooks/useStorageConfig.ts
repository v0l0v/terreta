/**
 * React hook for managing storage configuration and monitoring usage
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  StorageConfig, 
  getStorageConfig, 
  setStorageConfig, 
  getStorageUsage,
  isStorageNearLimit,
  formatBytes,
  DEFAULT_STORAGE_CONFIG 
} from '@/lib/storageConfig';
import { offlineStorage } from '@/lib/offlineStorage';

export function useStorageConfig() {
  const queryClient = useQueryClient();

  // Get current storage configuration
  const { data: config = DEFAULT_STORAGE_CONFIG, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['storage-config'],
    queryFn: getStorageConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current storage usage
  const { data: usage, isLoading: isLoadingUsage, refetch: refetchUsage } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: getStorageUsage,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Check if storage is near limit
  const { data: isNearLimit = false } = useQuery({
    queryKey: ['storage-near-limit'],
    queryFn: isStorageNearLimit,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Update storage configuration
  const updateConfig = useMutation({
    mutationFn: async (newConfig: Partial<StorageConfig>) => {
      await setStorageConfig(newConfig);
      return newConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-config'] });
      queryClient.invalidateQueries({ queryKey: ['storage-near-limit'] });
    },
  });

  // Perform cleanup
  const performCleanup = useMutation({
    mutationFn: async () => {
      await offlineStorage.performCleanup();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] });
      queryClient.invalidateQueries({ queryKey: ['storage-near-limit'] });
      refetchUsage();
    },
  });

  // Set storage limit (convenience method)
  const setStorageLimit = useCallback(async (limitInGB: number) => {
    const limitInBytes = limitInGB * 1024 * 1024 * 1024;
    await updateConfig.mutateAsync({ maxStorageSize: limitInBytes });
  }, [updateConfig]);

  // Get formatted storage info
  const storageInfo = {
    used: usage ? formatBytes(usage.used) : '0 Bytes',
    quota: usage ? formatBytes(usage.quota) : formatBytes(config.maxStorageSize),
    percentage: usage ? Math.round(usage.percentage * 100) : 0,
    isNearLimit,
    limitInGB: Math.round(config.maxStorageSize / (1024 * 1024 * 1024) * 100) / 100,
  };

  // Auto-cleanup when near limit
  useEffect(() => {
    if (isNearLimit && config.enableAutoCleanup && !performCleanup.isPending) {
      console.log('Storage near limit, performing automatic cleanup...');
      performCleanup.mutate();
    }
  }, [isNearLimit, config.enableAutoCleanup, performCleanup]);

  return {
    config,
    usage,
    storageInfo,
    isNearLimit,
    isLoading: isLoadingConfig || isLoadingUsage,
    updateConfig: updateConfig.mutate,
    setStorageLimit,
    performCleanup: performCleanup.mutate,
    isUpdating: updateConfig.isPending,
    isPerformingCleanup: performCleanup.isPending,
    refetchUsage,
  };
}

// Hook for storage monitoring (lightweight version for components that just need to monitor)
export function useStorageMonitor() {
  const { storageInfo, isNearLimit, refetchUsage } = useStorageConfig();
  
  return {
    storageInfo,
    isNearLimit,
    refetchUsage,
  };
}

// Hook for storage warnings
export function useStorageWarnings() {
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const { isNearLimit, storageInfo } = useStorageConfig();

  useEffect(() => {
    if (isNearLimit && !hasShownWarning) {
      setHasShownWarning(true);
      // You could show a toast notification here
      console.warn(`Storage is ${storageInfo.percentage}% full (${storageInfo.used} of ${storageInfo.quota})`);
    } else if (!isNearLimit && hasShownWarning) {
      setHasShownWarning(false);
    }
  }, [isNearLimit, hasShownWarning, storageInfo]);

  return {
    isNearLimit,
    hasShownWarning,
    storageInfo,
  };
}