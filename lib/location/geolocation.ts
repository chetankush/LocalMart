/**
 * Production-grade Geolocation Service (No API Key Required)
 * High accuracy with multiple fallbacks
 */

export interface LocationResult {
  latitude: number;
  longitude: number;
  pincode: string;
  locality: string;
  city: string;
  state: string;
  fullAddress: string;
  accuracy: 'high' | 'medium' | 'low';
  source: 'gps' | 'ip' | 'manual';
  gpsAccuracyMeters?: number;
}

export interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const LOCATION_CACHE_KEY = 'user_location_v2';
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Progressive GPS - tries high accuracy first, then falls back
 */
export async function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    let resolved = false;

    // Try high accuracy first (GPS)
    const highAccuracyTimeout = setTimeout(() => {
      if (!resolved) {
        // Fall back to low accuracy if high accuracy takes too long
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!resolved) {
              resolved = true;
              resolve(pos);
            }
          },
          (err) => {
            if (!resolved) {
              resolved = true;
              reject(formatGeoError(err));
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(highAccuracyTimeout);
          resolve(pos);
        }
      },
      () => {
        // High accuracy failed, let the timeout handler try low accuracy
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

function formatGeoError(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return { code: 1, message: 'Location permission denied' };
    case error.POSITION_UNAVAILABLE:
      return { code: 2, message: 'Location unavailable' };
    case error.TIMEOUT:
      return { code: 3, message: 'Location request timed out' };
    default:
      return error;
  }
}

/**
 * Reverse geocode using multiple services in parallel for best accuracy
 */
async function reverseGeocodeParallel(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  // Run all geocoding services in parallel
  const results = await Promise.allSettled([
    reverseGeocodeBigDataCloud(lat, lng),
    reverseGeocodeOSM(lat, lng),
    reverseGeocodeLocationIQ(lat, lng),
  ]);

  // Collect successful results
  const successfulResults: LocationResult[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      successfulResults.push(result.value);
    }
  }

  if (successfulResults.length === 0) return null;

  // Pick the best result (prefer one with pincode)
  const withPincode = successfulResults.filter(r => r.pincode);
  if (withPincode.length > 0) {
    // If multiple have pincode, prefer the one with more complete data
    return withPincode.sort((a, b) => {
      const scoreA = [a.pincode, a.locality, a.city, a.state].filter(Boolean).length;
      const scoreB = [b.pincode, b.locality, b.city, b.state].filter(Boolean).length;
      return scoreB - scoreA;
    })[0];
  }

  // Return the most complete result
  return successfulResults.sort((a, b) => {
    const scoreA = [a.pincode, a.locality, a.city, a.state].filter(Boolean).length;
    const scoreB = [b.pincode, b.locality, b.city, b.state].filter(Boolean).length;
    return scoreB - scoreA;
  })[0];
}

/**
 * BigDataCloud - Free, good for India
 */
async function reverseGeocodeBigDataCloud(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();

    return {
      latitude: lat,
      longitude: lng,
      pincode: data.postcode || '',
      locality: data.locality || data.city || '',
      city: data.city || data.locality || '',
      state: data.principalSubdivision || '',
      fullAddress: [data.locality, data.city, data.principalSubdivision, data.countryName]
        .filter(Boolean).join(', '),
      accuracy: data.postcode ? 'high' : 'medium',
      source: 'gps',
    };
  } catch {
    return null;
  }
}

/**
 * OpenStreetMap Nominatim - Free, detailed
 */
async function reverseGeocodeOSM(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'LocalMart-App/1.0',
          'Accept-Language': 'en',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    const addr = data.address || {};

    return {
      latitude: lat,
      longitude: lng,
      pincode: addr.postcode || '',
      locality: addr.suburb || addr.neighbourhood || addr.city_district || addr.village || '',
      city: addr.city || addr.town || addr.state_district || '',
      state: addr.state || '',
      fullAddress: data.display_name || '',
      accuracy: addr.postcode ? 'high' : 'medium',
      source: 'gps',
    };
  } catch {
    return null;
  }
}

/**
 * LocationIQ - Free tier available, good accuracy
 */
async function reverseGeocodeLocationIQ(
  lat: number,
  lng: number
): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // LocationIQ free tier (limited but works)
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=pk.0f147952a41c555a5b70f3f6b0a56a97&lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    const addr = data.address || {};

    return {
      latitude: lat,
      longitude: lng,
      pincode: addr.postcode || '',
      locality: addr.suburb || addr.neighbourhood || addr.city_district || '',
      city: addr.city || addr.town || addr.county || '',
      state: addr.state || '',
      fullAddress: data.display_name || '',
      accuracy: addr.postcode ? 'high' : 'medium',
      source: 'gps',
    };
  } catch {
    return null;
  }
}

/**
 * IP-based location with multiple providers
 */
async function getLocationByIP(): Promise<LocationResult | null> {
  const providers = [
    fetchIPAPI,
    fetchIPWhoIs,
    fetchIPInfo,
  ];

  for (const provider of providers) {
    try {
      const result = await provider();
      if (result) return result;
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchIPAPI(): Promise<LocationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) return null;
  const data = await response.json();
  
  if (!data.city) return null;

  return {
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    pincode: data.postal || '',
    locality: data.city,
    city: data.city,
    state: data.region || '',
    fullAddress: `${data.city}, ${data.region || ''}, ${data.country_name || ''}`,
    accuracy: 'low',
    source: 'ip',
  };
}

async function fetchIPWhoIs(): Promise<LocationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://ipwho.is/', { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) return null;
  const data = await response.json();
  
  if (!data.success || !data.city) return null;

  return {
    latitude: data.latitude || 0,
    longitude: data.longitude || 0,
    pincode: data.postal || '',
    locality: data.city,
    city: data.city,
    state: data.region || '',
    fullAddress: `${data.city}, ${data.region || ''}`,
    accuracy: 'low',
    source: 'ip',
  };
}

async function fetchIPInfo(): Promise<LocationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch('https://ipinfo.io/json', { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) return null;
  const data = await response.json();
  
  if (!data.city) return null;

  const [lat, lng] = (data.loc || '0,0').split(',').map(Number);

  return {
    latitude: lat,
    longitude: lng,
    pincode: data.postal || '',
    locality: data.city,
    city: data.city,
    state: data.region || '',
    fullAddress: `${data.city}, ${data.region || ''}, ${data.country || ''}`,
    accuracy: 'low',
    source: 'ip',
  };
}

/**
 * Main location detection with high accuracy
 */
export async function detectLocation(): Promise<LocationResult> {
  // Check cache
  const cached = getCachedLocation();
  if (cached && cached.accuracy === 'high') {
    return cached;
  }

  let result: LocationResult | null = null;

  // Step 1: Try GPS with parallel geocoding
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude, accuracy } = position.coords;

    console.log(`GPS acquired: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);

    // Use parallel geocoding for best results
    result = await reverseGeocodeParallel(latitude, longitude);

    if (result) {
      result.gpsAccuracyMeters = accuracy;
      result.source = 'gps';
      
      // Only cache high accuracy results
      if (result.pincode) {
        cacheLocation(result);
      }
      return result;
    }
  } catch (gpsError: any) {
    console.warn('GPS failed:', gpsError.message);
  }

  // Step 2: IP fallback
  try {
    result = await getLocationByIP();
    if (result) {
      // Don't cache IP results (less accurate)
      return result;
    }
  } catch {
    // Continue
  }

  throw new Error('Unable to detect location. Please enter your pincode manually.');
}

/**
 * Search addresses using OpenStreetMap
 */
export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (query.length < 3) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`,
      {
        headers: { 'User-Agent': 'LocalMart-App/1.0' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    if (!response.ok) return [];

    const data = await response.json();

    return data.map((item: any) => ({
      placeId: item.place_id?.toString() || '',
      description: item.display_name || '',
      mainText: item.address?.suburb || item.address?.city || item.address?.town || item.name || '',
      secondaryText: [item.address?.state_district, item.address?.state].filter(Boolean).join(', '),
    }));
  } catch {
    return [];
  }
}

/**
 * Get place details from search result
 */
export async function getPlaceDetails(placeId: string): Promise<LocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/details?place_id=${placeId}&format=json&addressdetails=1`,
      {
        headers: { 'User-Agent': 'LocalMart-App/1.0' },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    const address = data.address || [];
    
    let pincode = '', locality = '', city = '', state = '';

    for (const item of address) {
      if (item.type === 'postcode') pincode = item.localname;
      if (item.type === 'suburb' || item.type === 'neighbourhood') locality = item.localname;
      if (item.type === 'city' || item.type === 'town') city = item.localname;
      if (item.type === 'state') state = item.localname;
    }

    return {
      latitude: data.centroid?.coordinates?.[1] || 0,
      longitude: data.centroid?.coordinates?.[0] || 0,
      pincode,
      locality: locality || city,
      city,
      state,
      fullAddress: data.localname || '',
      accuracy: 'high',
      source: 'manual',
    };
  } catch {
    return null;
  }
}

/**
 * Validate Indian pincode
 */
export async function validateAndGetPincodeLocation(pincode: string): Promise<LocationResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    
    if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      
      return {
        latitude: 0,
        longitude: 0,
        pincode,
        locality: po.Name || '',
        city: po.District || '',
        state: po.State || '',
        fullAddress: `${po.Name}, ${po.District}, ${po.State} - ${pincode}`,
        accuracy: 'high',
        source: 'manual',
      };
    }
  } catch {
    // Continue
  }

  return {
    latitude: 0,
    longitude: 0,
    pincode,
    locality: '',
    city: '',
    state: '',
    fullAddress: pincode,
    accuracy: 'low',
    source: 'manual',
  };
}

// Cache helpers
function getCachedLocation(): LocationResult | null {
  try {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > LOCATION_CACHE_EXPIRY) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheLocation(location: LocationResult): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ data: location, timestamp: Date.now() }));
  } catch {}
}

export function clearLocationCache(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  } catch {}
}
