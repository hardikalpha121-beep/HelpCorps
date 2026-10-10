export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedLocation {
  address: string;
  coordinates: Coordinates;
  city?: string;
  country?: string;
}

/**
 * Acquire user's current GPS location via browser Geolocation API
 */
export async function getGPSCoordinates(): Promise<Coordinates> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Unable to retrieve your location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location signal unavailable. Please ensure GPS/location services are turned on.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      },
    );
  });
}

/**
 * Reverse geocode latitude and longitude to a human-readable street/area address.
 * Tries Google Maps Geocoding API first; if Google returns REQUEST_DENIED (e.g. unbilled project)
 * or network fails, automatically falls back to OpenStreetMap Nominatim reverse geocoder so it never fails.
 */
export async function reverseGeocode(coords: Coordinates): Promise<{ address: string; city?: string }> {
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. Attempt Google Maps Geocoding API if key is present
  if (googleKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${googleKey}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const formatted = data.results[0].formatted_address;
          let city: string | undefined;
          for (const comp of data.results[0].address_components || []) {
            if (comp.types.includes('locality')) {
              city = comp.long_name;
              break;
            }
          }
          return { address: formatted, city };
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim (works without billing, fast, worldwide)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      },
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county;
        return {
          address: data.display_name,
          city,
        };
      }
    }
  } catch {
    // Fallback to coordinates string
  }

  // 3. Fallback coordinates representation
  return {
    address: `GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
  };
}

/**
 * High-level auto-detector: acquires GPS coordinates and resolves full address in one step.
 */
export async function autoDetectLocation(): Promise<GeocodedLocation> {
  const coords = await getGPSCoordinates();
  const { address, city } = await reverseGeocode(coords);
  return {
    address,
    coordinates: coords,
    city,
  };
}
