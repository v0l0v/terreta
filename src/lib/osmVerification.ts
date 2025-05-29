/**
 * OpenStreetMap location verification
 * Checks if a location is in a restricted area
 */

interface OSMElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

interface OSMResponse {
  elements: OSMElement[];
}

export interface LocationVerification {
  isRestricted: boolean;
  warnings: string[];
  nearbyFeatures: {
    name?: string;
    type: string;
    distance?: number;
  }[];
}

// Restricted area types and their descriptions
const RESTRICTED_AREAS = {
  // Educational facilities
  'amenity=school': 'School',
  'amenity=kindergarten': 'Kindergarten',
  'amenity=college': 'College',
  'amenity=university': 'University',
  'amenity=childcare': 'Childcare facility',
  
  // Government and military
  'amenity=police': 'Police station',
  'amenity=fire_station': 'Fire station',
  'amenity=courthouse': 'Courthouse',
  'amenity=prison': 'Prison',
  'office=government': 'Government office',
  'military=*': 'Military area',
  'landuse=military': 'Military area',
  
  // Healthcare
  'amenity=hospital': 'Hospital',
  'amenity=clinic': 'Medical clinic',
  
  // Private property indicators
  'access=private': 'Private property',
  'access=no': 'No public access',
  'landuse=residential': 'Residential area',
  
  // Sensitive infrastructure
  'power=plant': 'Power plant',
  'power=substation': 'Power substation',
  'amenity=water_treatment': 'Water treatment facility',
  
  // Religious sites (may require permission)
  'amenity=place_of_worship': 'Place of worship',
  'landuse=cemetery': 'Cemetery',
  
  // Transportation (may have restrictions)
  'aeroway=aerodrome': 'Airport',
  'railway=station': 'Train station',
  'amenity=bus_station': 'Bus station',
};

// Tags that indicate public spaces (generally safe for geocaching)
const PUBLIC_AREAS = [
  'leisure=park',
  'leisure=garden',
  'leisure=nature_reserve',
  'landuse=forest',
  'natural=wood',
  'tourism=viewpoint',
  'tourism=picnic_site',
  'highway=footway',
  'highway=path',
  'highway=cycleway',
];

export async function verifyLocation(lat: number, lng: number): Promise<LocationVerification> {
  const warnings: string[] = [];
  const nearbyFeatures: LocationVerification['nearbyFeatures'] = [];
  
  try {
    // Query Overpass API for nearby features (within 50 meters)
    const radius = 50; // meters
    const query = `
      [out:json][timeout:10];
      (
        node(around:${radius},${lat},${lng});
        way(around:${radius},${lat},${lng});
        relation(around:${radius},${lat},${lng});
      );
      out tags;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error('Overpass API error:', response.status);
      return {
        isRestricted: false,
        warnings: ['Unable to verify location restrictions. Please manually verify the location is appropriate.'],
        nearbyFeatures: [],
      };
    }
    
    const data: OSMResponse = await response.json();
    
    // Check each element for restricted tags
    for (const element of data.elements) {
      if (!element.tags) continue;
      
      // Check for restricted areas
      for (const [tagKey, description] of Object.entries(RESTRICTED_AREAS)) {
        const [key, value] = tagKey.split('=');
        
        if (value === '*') {
          // Wildcard match (e.g., military=*)
          if (key in element.tags) {
            warnings.push(`Location is near/in a ${description}`);
            nearbyFeatures.push({
              name: element.tags.name,
              type: description,
            });
          }
        } else if (element.tags[key] === value) {
          warnings.push(`Location is near/in a ${description}`);
          nearbyFeatures.push({
            name: element.tags.name,
            type: description,
          });
        }
      }
      
      // Check for general access restrictions
      if (element.tags.access === 'private' || element.tags.access === 'no') {
        warnings.push('Location appears to be on private property or restricted access area');
      }
      
      // Add notable nearby features for context
      if (element.tags.name && element.tags.amenity) {
        nearbyFeatures.push({
          name: element.tags.name,
          type: element.tags.amenity,
        });
      }
    }
    
    // Check if location is in a public area (good for geocaching)
    const isInPublicArea = data.elements.some(element => {
      if (!element.tags) return false;
      return PUBLIC_AREAS.some(publicTag => {
        const [key, value] = publicTag.split('=');
        return element.tags![key] === value;
      });
    });
    
    if (isInPublicArea && warnings.length === 0) {
      // Location appears to be in a public area - good!
      nearbyFeatures.unshift({
        type: 'Public area - suitable for geocaching',
      });
    }
    
    return {
      isRestricted: warnings.length > 0,
      warnings: [...new Set(warnings)], // Remove duplicates
      nearbyFeatures: nearbyFeatures.slice(0, 5), // Limit to 5 most relevant
    };
    
  } catch (error) {
    console.error('Error verifying location:', error);
    return {
      isRestricted: false,
      warnings: ['Unable to verify location restrictions. Please manually verify the location is appropriate.'],
      nearbyFeatures: [],
    };
  }
}

// Helper function to get a human-readable description of the verification result
export function getVerificationSummary(verification: LocationVerification): {
  status: 'safe' | 'warning' | 'restricted';
  message: string;
} {
  if (verification.warnings.length === 0) {
    if (verification.nearbyFeatures.some(f => f.type.includes('suitable for geocaching'))) {
      return {
        status: 'safe',
        message: 'Location appears to be in a public area suitable for geocaching.',
      };
    }
    return {
      status: 'safe',
      message: 'No restrictions detected at this location.',
    };
  }
  
  if (verification.warnings.some(w => 
    w.includes('School') || 
    w.includes('Military') || 
    w.includes('Prison') ||
    w.includes('private property')
  )) {
    return {
      status: 'restricted',
      message: 'This location appears to be restricted. Please choose a different location.',
    };
  }
  
  return {
    status: 'warning',
    message: 'This location may have restrictions. Please verify it is appropriate for a geocache.',
  };
}