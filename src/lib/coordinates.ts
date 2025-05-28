/**
 * Autocorrect coordinates to handle common input errors
 * @param lat Latitude value
 * @param lng Longitude value
 * @returns Corrected coordinates
 */
export function autocorrectCoordinates(lat: number, lng: number): { lat: number; lng: number; corrected: boolean } {
  let corrected = false;
  let newLat = lat;
  let newLng = lng;

  // Auto-detect if coordinates are swapped
  // If latitude is outside valid range but longitude is within latitude range
  if (Math.abs(newLat) > 90 && Math.abs(newLng) <= 90) {
    [newLat, newLng] = [newLng, newLat];
    corrected = true;
  }

  // Clamp latitude to valid range
  if (newLat > 90) {
    newLat = 90;
    corrected = true;
  }
  if (newLat < -90) {
    newLat = -90;
    corrected = true;
  }

  // Wrap longitude to valid range
  if (newLng > 180 || newLng < -180) {
    while (newLng > 180) newLng -= 360;
    while (newLng < -180) newLng += 360;
    corrected = true;
  }

  // Common correction: Western hemisphere positive longitude
  // If coordinates appear to be in North America but longitude is positive
  if (newLat > 20 && newLat < 50 && newLng > 0 && newLng < 130) {
    newLng = -newLng;
    corrected = true;
  }

  return { lat: newLat, lng: newLng, corrected };
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Number of decimal places
 * @returns Formatted string
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}