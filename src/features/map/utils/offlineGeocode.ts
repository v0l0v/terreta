/**
 * 100% Offline reverse geocoding utility using local data
 * Converts coordinates to "City, ST 🏳️" or "City 🏳️" format
 * No external API calls - everything is local
 */

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import { countryToFlag } from './countryToFlag';

// Simple in-memory cache for reverse geocoding results
const geocodeCache = new Map<string, string>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const cacheTimestamps = new Map<string, number>();

// Countries that use state/province abbreviations
const COUNTRIES_WITH_STATES = new Set(['US', 'CA', 'AU', 'BR', 'IN', 'MX']);

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest city to given coordinates
 */
function findNearestCity(
  lat: number,
  lng: number,
  countryCode: string,
  stateCode?: string
): ICity | null {
  let cities: ICity[] = [];

  if (stateCode) {
    // Get cities for specific state
    cities = City.getCitiesOfState(countryCode, stateCode);
  } else {
    // Get all cities for country
    cities = City.getCitiesOfCountry(countryCode) || [];
  }

  if (cities.length === 0) {
    return null;
  }

  // Find the closest city
  let nearestCity: ICity | null = null;
  let minDistance = Infinity;

  for (const city of cities) {
    if (city.latitude && city.longitude) {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(city.latitude),
        parseFloat(city.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
  }

  // Only return if city is within reasonable distance (500km)
  return minDistance < 500 ? nearestCity : null;
}

/**
 * Find the nearest state to given coordinates
 */
function findNearestState(lat: number, lng: number, countryCode: string): IState | null {
  const states = State.getStatesOfCountry(countryCode);

  if (!states || states.length === 0) {
    return null;
  }

  let nearestState: IState | null = null;
  let minDistance = Infinity;

  for (const state of states) {
    if (state.latitude && state.longitude) {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(state.latitude),
        parseFloat(state.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestState = state;
      }
    }
  }

  return nearestState;
}

/**
 * Find the nearest country to given coordinates
 */
function findNearestCountry(lat: number, lng: number): ICountry | null {
  const countries = Country.getAllCountries();

  let nearestCountry: ICountry | null = null;
  let minDistance = Infinity;

  for (const country of countries) {
    if (country.latitude && country.longitude) {
      const distance = calculateDistance(
        lat,
        lng,
        parseFloat(country.latitude),
        parseFloat(country.longitude)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCountry = country;
      }
    }
  }

  return nearestCountry;
}

/**
 * Get a human-readable location name from coordinates using 100% offline data
 * Returns format: "City, ST 🏳️" for countries with states or "City 🏳️" for others
 */
export function offlineGeocode(lat: number, lng: number): string {
  // Create cache key from rounded coordinates (to 2 decimal places for reasonable caching)
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  // Check cache
  const cached = geocodeCache.get(cacheKey);
  const cacheTime = cacheTimestamps.get(cacheKey);
  
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cached;
  }

  try {
    // Find nearest country
    const country = findNearestCountry(lat, lng);
    
    if (!country) {
      return '';
    }

    const countryCode = country.isoCode;
    const flagEmoji = countryToFlag(countryCode);
    
    // Check if this country uses states
    const hasStates = COUNTRIES_WITH_STATES.has(countryCode);
    
    let locationString = '';
    
    if (hasStates) {
      // Find nearest state
      const state = findNearestState(lat, lng, countryCode);
      
      if (state) {
        // Find nearest city within the state
        const city = findNearestCity(lat, lng, countryCode, state.isoCode);
        
        if (city) {
          // Format: "City, ST 🏳️"
          locationString = `${city.name}, ${state.isoCode} ${flagEmoji}`;
        } else {
          // No city found, just show state
          locationString = `${state.name}, ${state.isoCode} ${flagEmoji}`;
        }
      } else {
        // No state found, try to find city directly
        const city = findNearestCity(lat, lng, countryCode);
        
        if (city) {
          locationString = `${city.name} ${flagEmoji}`;
        } else {
          // Just show country
          locationString = `${country.name} ${flagEmoji}`;
        }
      }
    } else {
      // Country without states - find nearest city
      const city = findNearestCity(lat, lng, countryCode);
      
      if (city) {
        // Format: "City 🏳️"
        locationString = `${city.name} ${flagEmoji}`;
      } else {
        // No city found, just show country
        locationString = `${country.name} ${flagEmoji}`;
      }
    }
    
    // Cache the result
    geocodeCache.set(cacheKey, locationString);
    cacheTimestamps.set(cacheKey, Date.now());
    
    return locationString;
  } catch (error) {
    console.warn('Offline geocoding error:', error);
    return '';
  }
}

/**
 * Prefetch location names for multiple coordinates
 * Useful for batch processing geocaches
 */
export function prefetchLocations(coordinates: Array<{ lat: number; lng: number }>): void {
  // Since we're fully offline, we can process all at once
  coordinates.forEach(coord => {
    offlineGeocode(coord.lat, coord.lng);
  });
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  cacheTimestamps.clear();
}
