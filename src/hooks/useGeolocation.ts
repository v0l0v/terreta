import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { getIPLocation } from '@/lib/ipGeolocation';

interface GeolocationState {
  loading: boolean;
  error: string | null;
  coords: GeolocationCoordinates | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    coords: null,
  });
  const { toast } = useToast();

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const error = "Geolocation is not supported by your browser";
      setState({ loading: false, error, coords: null });
      toast({
        title: "Geolocation not supported",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Simplified options for better Safari compatibility
    const geoOptions: PositionOptions = {
      enableHighAccuracy: false, // Start with low accuracy for better compatibility
      timeout: 15000, // Shorter timeout
      maximumAge: 600000, // Allow 10-minute old positions
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        loading: false,
        error: null,
        coords: position.coords,
      });
      
      toast({
        title: "Location found",
        description: `±${Math.round(position.coords.accuracy)}m accuracy`,
      });
    };

    const handleError = async (error: GeolocationPositionError) => {
      console.log('Geolocation error:', {
        code: error.code,
        message: error.message,
      });

      // Try IP geolocation fallback
      try {
        const ipLocation = await getIPLocation();
        if (ipLocation) {
          const mockCoords = {
            latitude: ipLocation.lat,
            longitude: ipLocation.lng,
            accuracy: ipLocation.accuracy,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          } as GeolocationCoordinates;
          
          setState({
            loading: false,
            error: null,
            coords: mockCoords,
          });
          
          toast({
            title: "Location found",
            description: `Using approximate location (~${Math.round(ipLocation.accuracy / 1000)}km accuracy)`,
          });
          return;
        }
      } catch (ipError) {
        console.warn('IP geolocation failed:', ipError);
      }

      // If all fails, show error
      let errorMessage = "Unable to get your location";
      let description = "Please try again";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          description = "Please enable location access in your browser settings";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location unavailable";
          description = "GPS/WiFi location failed";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          description = "Getting your location took too long";
          break;
      }

      setState({
        loading: false,
        error: errorMessage,
        coords: null,
      });

      toast({
        title: errorMessage,
        description: description,
        variant: "destructive",
      });
    };

    // Single, simple geolocation call
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      geoOptions
    );
  }, [toast]);

  return {
    ...state,
    getLocation,
  };
}