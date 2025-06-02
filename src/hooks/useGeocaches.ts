// This file exists for backward compatibility.
// Import useOfflineGeocaches directly instead for better offline support.
export { 
  useOfflineGeocaches as useGeocaches,
  useOfflineAdaptiveGeocaches as useAdaptiveGeocaches,
  type GeocacheWithDistance 
} from './useOfflineGeocaches';

// Legacy exports for backward compatibility
export type { UseOfflineGeocachesOptions as UseGeocachesOptions } from './useOfflineGeocaches';