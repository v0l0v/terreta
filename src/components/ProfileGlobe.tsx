import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geocache } from '@/shared/types/geocache';

// Fix for default Leaflet markers - use CDN fallback like the rest of the app
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ProfileGlobeProps {
  geocaches: Geocache[];
  className?: string;
}

export function ProfileGlobe({ geocaches, className = '' }: ProfileGlobeProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Filter geocaches with valid locations
  const validGeocaches = geocaches.filter(cache =>
    cache.location &&
    typeof cache.location.lat === 'number' &&
    typeof cache.location.lng === 'number'
  );

  // If no valid caches, show a message
  if (!validGeocaches.length) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted/20 rounded-lg border ${className}`}>
        <p className="text-muted-foreground text-sm">No cache locations to display</p>
      </div>
    );
  }

  // Create bounds to fit all markers
  const bounds = new LatLngBounds(
    validGeocaches.map(cache => [cache.location!.lat, cache.location!.lng])
  );

  // Custom icon for cache markers
  const cacheIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Fit map to bounds once it's ready
  useEffect(() => {
    if (mapRef.current && isClient) {
      const map = mapRef.current;
      if (validGeocaches.length === 1) {
        // If only one cache, zoom in on it
        map.setView([validGeocaches[0].location!.lat, validGeocaches[0].location!.lng], 10);
      } else {
        // Fit all markers in view
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [isClient, validGeocaches, bounds]);

  if (!isClient) {
    return (
      <div className={`flex items-center justify-center h-64 bg-muted/20 rounded-lg border ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        ref={mapRef}
        center={[0, 0]} // Will be updated by fitBounds
        zoom={2}
        style={{ height: '300px', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validGeocaches.map((cache) => (
          <Marker
            key={cache.id}
            position={[cache.location!.lat, cache.location!.lng]}
            icon={cacheIcon}
          >
            <Popup>
              <div className="text-sm">
                <h3 className="font-semibold">{cache.name}</h3>
                <p className="text-muted-foreground text-xs mt-1">
                  {cache.location?.city && `${cache.location.city}, `}
                  {cache.location?.state && `${cache.location.state}, `}
                  {cache.location?.country}
                </p>
                <p className="text-xs mt-2">
                  Difficulty: {cache.difficulty}/5 • Terrain: {cache.terrain}/5
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}