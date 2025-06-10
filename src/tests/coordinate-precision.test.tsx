import { describe, it, expect } from 'vitest';
import { getCoordinatePrecision, getGeohashPrecisionLevels } from '@/lib/coordinates';
import { buildGeocacheTags } from '@/lib/nip-gc';

describe('Coordinate Precision and Geohash Generation', () => {
  describe('getCoordinatePrecision', () => {
    it('should correctly determine precision for various coordinate formats', () => {
      expect(getCoordinatePrecision(40)).toBe(0); // Integer
      expect(getCoordinatePrecision(40.7)).toBe(1); // 1 decimal place
      expect(getCoordinatePrecision(40.71)).toBe(2); // 2 decimal places
      expect(getCoordinatePrecision(40.712)).toBe(3); // 3 decimal places
      expect(getCoordinatePrecision(40.7128)).toBe(4); // 4 decimal places
      expect(getCoordinatePrecision(40.71280)).toBe(4); // JavaScript drops trailing zero, becomes 40.7128
      expect(getCoordinatePrecision(40.712800)).toBe(4); // JavaScript drops trailing zeros, becomes 40.7128
      expect(getCoordinatePrecision(40.712834)).toBe(6); // 6 decimal places
      expect(getCoordinatePrecision(40.7128345)).toBe(7); // 7 decimal places
    });

    it('should handle negative coordinates', () => {
      expect(getCoordinatePrecision(-74.0060)).toBe(3); // JavaScript drops trailing zero, becomes -74.006
      expect(getCoordinatePrecision(-74)).toBe(0);
      expect(getCoordinatePrecision(-74.1)).toBe(1);
      expect(getCoordinatePrecision(-74.006034)).toBe(6); // This will preserve all digits
    });
  });

  describe('getGeohashPrecisionLevels', () => {
    it('should return appropriate precision levels for different coordinate precisions', () => {
      // Integer coordinates (very imprecise)
      expect(getGeohashPrecisionLevels(40, -74)).toEqual([3, 4]);
      
      // 1 decimal place (~11km precision)
      expect(getGeohashPrecisionLevels(40.7, -74.0)).toEqual([3, 4]);
      
      // 2 decimal places (~1.1km precision)
      expect(getGeohashPrecisionLevels(40.71, -74.01)).toEqual([3, 4, 5]);
      
      // 3 decimal places (~110m precision)
      expect(getGeohashPrecisionLevels(40.712, -74.006)).toEqual([3, 4, 5, 6]);
      
      // 4 decimal places (~11m precision)
      expect(getGeohashPrecisionLevels(40.7128, -74.0060)).toEqual([3, 4, 5, 6, 7]);
      
      // 5 decimal places (~1.1m precision)
      expect(getGeohashPrecisionLevels(40.71283, -74.00603)).toEqual([3, 4, 5, 6, 7, 8]);
      
      // 6+ decimal places (~0.11m precision or better)
      expect(getGeohashPrecisionLevels(40.712834, -74.006034)).toEqual([3, 4, 5, 6, 7, 8, 9]);
      expect(getGeohashPrecisionLevels(40.7128345, -74.0060345)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    });

    it('should use the maximum precision from lat/lng', () => {
      // Different precisions - should use the higher one
      expect(getGeohashPrecisionLevels(40.7, -74.006034)).toEqual([3, 4, 5, 6, 7, 8, 9]);
      expect(getGeohashPrecisionLevels(40.712834, -74.0)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('buildGeocacheTags with precision-aware geohashes', () => {
    it('should generate appropriate number of geohash tags based on coordinate precision', () => {
      // Low precision coordinates should generate fewer geohash tags
      const lowPrecisionTags = buildGeocacheTags({
        dTag: 'test-cache',
        name: 'Test Cache',
        location: { lat: 40.7, lng: -74.0 }, // 1 decimal place
        difficulty: 2,
        terrain: 2,
        size: 'regular',
        type: 'traditional',
      });

      const geohashTags = lowPrecisionTags.filter(tag => tag[0] === 'g');
      expect(geohashTags).toHaveLength(2); // Should only generate precision 3-4

      // High precision coordinates should generate more geohash tags
      const highPrecisionTags = buildGeocacheTags({
        dTag: 'test-cache-precise',
        name: 'Precise Test Cache',
        location: { lat: 40.712834, lng: -74.006034 }, // 6 decimal places
        difficulty: 2,
        terrain: 2,
        size: 'regular',
        type: 'traditional',
      });

      const preciseGeohashTags = highPrecisionTags.filter(tag => tag[0] === 'g');
      expect(preciseGeohashTags).toHaveLength(7); // Should generate precision 3-9
    });

    it('should generate valid geohashes at all precision levels', () => {
      const tags = buildGeocacheTags({
        dTag: 'test-cache',
        name: 'Test Cache',
        location: { lat: 40.712834, lng: -74.006034 },
        difficulty: 2,
        terrain: 2,
        size: 'regular',
        type: 'traditional',
      });

      const geohashTags = tags.filter(tag => tag[0] === 'g');
      
      // All geohashes should be valid strings
      geohashTags.forEach(tag => {
        expect(typeof tag[1]).toBe('string');
        expect(tag[1].length).toBeGreaterThan(0);
        expect(tag[1]).toMatch(/^[0-9bcdefghjkmnpqrstuvwxyz]+$/); // Valid geohash characters
      });

      // Geohashes should be of increasing length (precision)
      const geohashLengths = geohashTags.map(tag => tag[1].length);
      for (let i = 1; i < geohashLengths.length; i++) {
        expect(geohashLengths[i]).toBeGreaterThanOrEqual(geohashLengths[i - 1]);
      }
    });
  });
});