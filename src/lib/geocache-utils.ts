// Utility functions for geocache display and formatting
import { 
  getDifficultyLabel as getSharedDifficultyLabel,
  getCacheSizeLabel,
  getCacheTypeLabel 
} from './geocache-constants';

export function getDifficultyLabel(difficulty: number): string {
  return getSharedDifficultyLabel(difficulty);
}

export function getTypeLabel(type: string): string {
  // Handle legacy earthcache variant
  if (type.toLowerCase() === 'earthcache') {
    return 'EarthCache';
  }
  return getCacheTypeLabel(type);
}

export function getSizeLabel(size: string): string {
  return getCacheSizeLabel(size);
}

export function getSizeLevel(size: string): number {
  const sizeMap: Record<string, number> = {
    micro: 1,
    small: 2,  
    regular: 3,
    large: 4,
  };
  return sizeMap[size.toLowerCase()] || 2;
}

export function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    traditional: '📦',
    multi: '🔗',
    mystery: '❓',
    letterbox: '📮',
    event: '📅',
    virtual: '👻',
    earthcache: '🌍',
    earth: '🌍',
    wherigo: '📱',
  };
  return icons[type.toLowerCase()] || '📦';
}