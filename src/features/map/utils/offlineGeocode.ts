/**
 * Offline reverse geocoding utility using local data
 * Converts coordinates to "City, State 🏳️" or "City 🏳️" format
 */

import * as countryCoder from '@rapideditor/country-coder';
import { flag } from 'country-emoji';

// Simple in-memory cache for reverse geocoding results
const geocodeCache = new Map<string, string>();
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
const cacheTimestamps = new Map<string, number>();

// US states abbreviations
const US_STATES: Record<string, string> = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
};

// Canadian provinces/territories abbreviations
const CA_PROVINCES: Record<string, string> = {
  'Alberta': 'AB',
  'British Columbia': 'BC',
  'Manitoba': 'MB',
  'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL',
  'Northwest Territories': 'NT',
  'Nova Scotia': 'NS',
  'Nunavut': 'NU',
  'Ontario': 'ON',
  'Prince Edward Island': 'PE',
  'Quebec': 'QC',
  'Saskatchewan': 'SK',
  'Yukon': 'YT',
};

// Australian states/territories abbreviations
const AU_STATES: Record<string, string> = {
  'Australian Capital Territory': 'ACT',
  'New South Wales': 'NSW',
  'Northern Territory': 'NT',
  'Queensland': 'QLD',
  'South Australia': 'SA',
  'Tasmania': 'TAS',
  'Victoria': 'VIC',
  'Western Australia': 'WA',
};

// Brazilian states abbreviations
const BR_STATES: Record<string, string> = {
  'Acre': 'AC',
  'Alagoas': 'AL',
  'Amapá': 'AP',
  'Amazonas': 'AM',
  'Bahia': 'BA',
  'Ceará': 'CE',
  'Distrito Federal': 'DF',
  'Espírito Santo': 'ES',
  'Goiás': 'GO',
  'Maranhão': 'MA',
  'Mato Grosso': 'MT',
  'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG',
  'Pará': 'PA',
  'Paraíba': 'PB',
  'Paraná': 'PR',
  'Pernambuco': 'PE',
  'Piauí': 'PI',
  'Rio de Janeiro': 'RJ',
  'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS',
  'Rondônia': 'RO',
  'Roraima': 'RR',
  'Santa Catarina': 'SC',
  'São Paulo': 'SP',
  'Sergipe': 'SE',
  'Tocantins': 'TO',
};

// Countries with state/province systems
const STATES_BY_COUNTRY: Record<string, Record<string, string>> = {
  'US': US_STATES,
  'CA': CA_PROVINCES,
  'AU': AU_STATES,
  'BR': BR_STATES,
};

interface NominatimResult {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Get a human-readable location name from coordinates using offline data
 * Returns format: "City, ST 🏳️" for countries with states or "City 🏳️" for others
 */
export async function offlineGeocode(lat: number, lng: number): Promise<string> {
  // Create cache key from rounded coordinates (to 2 decimal places for reasonable caching)
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  // Check cache
  const cached = geocodeCache.get(cacheKey);
  const cacheTime = cacheTimestamps.get(cacheKey);
  
  if (cached && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cached;
  }

  try {
    // Get country code from coordinates using country-coder
    const countryFeature = countryCoder.iso1A2Code([lng, lat]); // Note: lon, lat order
    
    if (!countryFeature) {
      // Fallback to online geocoding if offline lookup fails
      return fallbackToOnlineGeocode(lat, lng);
    }

    const countryCode = countryFeature;
    const flagEmoji = flag(countryCode) || '';
    
    // Get state/province info if available
    const stateAbbreviations = STATES_BY_COUNTRY[countryCode];
    
    // For now, we need to get city name from Nominatim since we don't have a local city database
    // We'll make a minimal request just for the city name
    const cityName = await getCityName(lat, lng);
    
    let locationString = '';
    
    if (cityName) {
      if (stateAbbreviations) {
        // Try to get state from Nominatim
        const stateName = await getStateName(lat, lng);
        const stateAbbr = stateName && stateAbbreviations[stateName];
        
        if (stateAbbr) {
          locationString = `${cityName}, ${stateAbbr} ${flagEmoji}`;
        } else {
          locationString = `${cityName} ${flagEmoji}`;
        }
      } else {
        locationString = `${cityName} ${flagEmoji}`;
      }
    } else {
      // No city name, just show country flag
      locationString = flagEmoji;
    }
    
    // Cache the result
    geocodeCache.set(cacheKey, locationString);
    cacheTimestamps.set(cacheKey, Date.now());
    
    return locationString;
  } catch (error) {
    console.warn('Offline geocoding error:', error);
    // Fallback to online geocoding
    return fallbackToOnlineGeocode(lat, lng);
  }
}

/**
 * Get city name from coordinates using Nominatim
 */
async function getCityName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '10',
      }),
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      return '';
    }

    const data = await response.json() as NominatimResult;
    const address = data.address;

    if (!address) {
      return '';
    }

    return address.city || address.town || address.village || '';
  } catch {
    return '';
  }
}

/**
 * Get state name from coordinates using Nominatim
 */
async function getStateName(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '10',
      }),
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      return '';
    }

    const data = await response.json() as NominatimResult;
    const address = data.address;

    if (!address) {
      return '';
    }

    return address.state || '';
  } catch {
    return '';
  }
}

/**
 * Fallback to the original online geocoding method
 */
async function fallbackToOnlineGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '10',
      }),
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return '';
    }

    const data = await response.json() as NominatimResult;
    const address = data.address;

    if (!address) {
      return '';
    }

    const locationParts: string[] = [];
    
    const primaryLocation = address.city || address.town || address.village;
    if (primaryLocation) {
      locationParts.push(primaryLocation);
    }

    const secondaryLocation = address.state || address.county;
    if (secondaryLocation) {
      locationParts.push(secondaryLocation);
    }

    if (locationParts.length === 0 && address.country) {
      locationParts.push(address.country);
    } else if (locationParts.length === 1 && !address.state && address.country) {
      locationParts.push(address.country);
    }

    return locationParts.join(', ');
  } catch (error) {
    console.warn('Fallback geocoding error:', error);
    return '';
  }
}

/**
 * Prefetch location names for multiple coordinates
 * Useful for batch processing geocaches
 */
export async function prefetchLocations(coordinates: Array<{ lat: number; lng: number }>): Promise<void> {
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 1000;

  for (let i = 0; i < coordinates.length; i += BATCH_SIZE) {
    const batch = coordinates.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(coord => offlineGeocode(coord.lat, coord.lng))
    );

    if (i + BATCH_SIZE < coordinates.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear();
  cacheTimestamps.clear();
}
