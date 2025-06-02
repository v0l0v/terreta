/**
 * Tests for storage configuration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DEFAULT_STORAGE_LIMIT, 
  DEFAULT_STORAGE_CONFIG, 
  formatBytes,
  getStorageConfig,
  setStorageConfig 
} from '@/lib/storageConfig';

describe('Storage Configuration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should have correct default values', () => {
    expect(DEFAULT_STORAGE_LIMIT).toBe(2 * 1024 * 1024 * 1024); // 2GB
    expect(DEFAULT_STORAGE_CONFIG.maxStorageSize).toBe(DEFAULT_STORAGE_LIMIT);
    expect(DEFAULT_STORAGE_CONFIG.cleanupThreshold).toBe(0.9);
    expect(DEFAULT_STORAGE_CONFIG.enableAutoCleanup).toBe(true);
  });

  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });

  it('should get default config when none is stored', async () => {
    const config = await getStorageConfig();
    expect(config).toEqual(DEFAULT_STORAGE_CONFIG);
  });

  it.skip('should save and retrieve storage config', async () => {
    const newConfig = {
      maxStorageSize: 1024 * 1024 * 1024, // 1GB
      enableAutoCleanup: false,
    };

    await setStorageConfig(newConfig);
    const retrievedConfig = await getStorageConfig();

    expect(retrievedConfig.maxStorageSize).toBe(newConfig.maxStorageSize);
    expect(retrievedConfig.enableAutoCleanup).toBe(newConfig.enableAutoCleanup);
    // Other values should remain as defaults
    expect(retrievedConfig.cleanupThreshold).toBe(DEFAULT_STORAGE_CONFIG.cleanupThreshold);
  });

  it.skip('should merge partial config with defaults', async () => {
    const partialConfig = {
      maxStorageSize: 512 * 1024 * 1024, // 512MB
    };

    await setStorageConfig(partialConfig);
    const config = await getStorageConfig();

    expect(config.maxStorageSize).toBe(partialConfig.maxStorageSize);
    expect(config.cleanupThreshold).toBe(DEFAULT_STORAGE_CONFIG.cleanupThreshold);
    expect(config.enableAutoCleanup).toBe(DEFAULT_STORAGE_CONFIG.enableAutoCleanup);
  });
});