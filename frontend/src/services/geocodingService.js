import api from './api.js';

const GOOGLE_GEOCODING_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_GEOCODING_API_KEY) ||
  '***REMOVED_GOOGLE_API_KEY***';

// Known coordinates for Ammas Pastries Bengaluru Outlets (fallback / defaults)
export const OUTLET_COORDINATES = {
  'AMP-MGR': { lat: 12.9756, lng: 77.6066, name: 'MG Road' },
  'AMP-IND': { lat: 12.9784, lng: 77.6408, name: 'Indiranagar' },
  'AMP-KOR': { lat: 12.9352, lng: 77.6245, name: 'Koramangala' },
  'AMP-WHI': { lat: 12.9698, lng: 77.7499, name: 'Whitefield' },
  'AMP-JAY': { lat: 12.925, lng: 77.5938, name: 'Jayanagar' },
  'BLR-KOT': { lat: 13.0551932, lng: 77.6422206, name: 'Kothanuru' },
  'BLR-315': { lat: 13.0551932, lng: 77.6422206, name: 'Kothanuru' },
};

/**
 * Resolves coordinates for an outlet object:
 * 1. Checks outlet.latitude and outlet.longitude from database
 * 2. Checks OUTLET_COORDINATES by outlet.code
 * 3. Checks by matching area or name (e.g. Kothanur, Indiranagar)
 */
export const getOutletCoordinates = (outlet) => {
  if (!outlet) return null;

  // 1. Direct database coordinates
  if (outlet.latitude && outlet.longitude) {
    const lat = parseFloat(outlet.latitude);
    const lng = parseFloat(outlet.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
  }

  // 2. Known code mapping
  if (outlet.code && OUTLET_COORDINATES[outlet.code]) {
    return OUTLET_COORDINATES[outlet.code];
  }

  // 3. Fallback match by area or outlet name
  const areaKey = (outlet.area || '').toLowerCase().trim();
  const nameKey = (outlet.name || '').toLowerCase().trim();

  if (areaKey.includes('kothanur') || nameKey.includes('kothanur')) {
    return { lat: 13.0551932, lng: 77.6422206, name: 'Kothanuru' };
  }
  if (areaKey.includes('indiranagar') || nameKey.includes('indiranagar')) {
    return { lat: 12.9783692, lng: 77.6408356, name: 'Indiranagar' };
  }
  if (areaKey.includes('koramangala') || nameKey.includes('koramangala')) {
    return { lat: 12.9352, lng: 77.6245, name: 'Koramangala' };
  }
  if (areaKey.includes('whitefield') || nameKey.includes('whitefield')) {
    return { lat: 12.9698, lng: 77.7499, name: 'Whitefield' };
  }
  if (areaKey.includes('jayanagar') || nameKey.includes('jayanagar')) {
    return { lat: 12.925, lng: 77.5938, name: 'Jayanagar' };
  }
  if (areaKey.includes('mg road') || nameKey.includes('mg road') || areaKey.includes('brigade')) {
    return { lat: 12.9756, lng: 77.6066, name: 'MG Road' };
  }

  return null;
};

/**
 * Parses Google Geocoding address_components into structured fields
 */
export const parseAddressComponents = (components = []) => {
  let sublocality = '';
  let locality = '';
  let adminArea = '';
  let postalCode = '';
  let streetNumber = '';
  let route = '';
  let neighborhood = '';

  for (const component of components) {
    const types = component.types || [];

    if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
      sublocality = component.long_name;
    } else if (types.includes('neighborhood') && !sublocality) {
      neighborhood = component.long_name;
    } else if (types.includes('locality')) {
      locality = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      adminArea = component.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
    } else if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    }
  }

  const area = sublocality || neighborhood || locality || '';
  const city = locality || 'Bengaluru';
  const state = adminArea || 'Karnataka';

  return {
    area,
    city,
    state,
    pincode: postalCode,
    streetNumber,
    route,
  };
};

/**
 * Forward Geocoding: Searches address query using Google Geocoding API
 * with automatic fallback to backend proxy if client-side request fails
 */
export const geocodeAddress = async (searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) {
    throw new Error('Please enter a location or address to search.');
  }

  // Bias towards Bengaluru, Karnataka, India if not already present
  let queryWithContext = searchQuery.trim();
  if (
    !queryWithContext.toLowerCase().includes('bengaluru') &&
    !queryWithContext.toLowerCase().includes('bangalore')
  ) {
    queryWithContext += ', Bengaluru, Karnataka';
  }

  let data = null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      queryWithContext
    )}&components=country:IN&key=${GOOGLE_GEOCODING_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      data = await response.json();
    }
  } catch (directErr) {
    console.warn('Direct Google Geocoding failed, trying backend proxy:', directErr);
  }

  // Fallback to backend proxy if direct fetch failed
  if (!data) {
    try {
      const res = await api.get(`/geocode?address=${encodeURIComponent(queryWithContext)}`);
      data = res.data;
    } catch (proxyErr) {
      console.error('Backend geocode proxy also failed:', proxyErr);
    }
  }

  if (!data) {
    throw new Error('Unable to connect to Geocoding service.');
  }

  if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
    return {
      success: false,
      status: 'ZERO_RESULTS',
      message: 'No location details found for this address.',
    };
  }

  if (data.status !== 'OK') {
    return {
      success: false,
      status: data.status,
      message: data.error_message || `Geocoding error: ${data.status}`,
    };
  }

  const primaryResult = data.results[0];
  const location = primaryResult.geometry?.location || null;
  const parsed = parseAddressComponents(primaryResult.address_components);

  return {
    success: true,
    status: 'OK',
    formattedAddress: primaryResult.formatted_address,
    placeId: primaryResult.place_id,
    location, // { lat, lng }
    area: parsed.area,
    city: parsed.city,
    state: parsed.state,
    pincode: parsed.pincode,
    streetInfo: [parsed.streetNumber, parsed.route].filter(Boolean).join(' '),
    allResults: data.results,
  };
};

/**
 * Reverse Geocoding: Converts lat, lng into human-readable address
 * with automatic fallback to backend proxy
 */
export const reverseGeocode = async (lat, lng) => {
  if (!lat || !lng) {
    throw new Error('Valid latitude and longitude coordinates are required.');
  }

  let data = null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      data = await response.json();
    }
  } catch (directErr) {
    console.warn('Direct reverse geocoding failed, trying backend proxy:', directErr);
  }

  if (!data) {
    try {
      const res = await api.get(`/geocode?latlng=${lat},${lng}`);
      data = res.data;
    } catch (proxyErr) {
      console.error('Backend reverse geocode proxy also failed:', proxyErr);
    }
  }

  if (!data) {
    throw new Error('Unable to resolve GPS coordinates.');
  }

  if (data.status === 'ZERO_RESULTS' || !data.results || data.results.length === 0) {
    return {
      success: false,
      status: 'ZERO_RESULTS',
      message: 'No location found at these coordinates.',
    };
  }

  if (data.status !== 'OK') {
    return {
      success: false,
      status: data.status,
      message: data.error_message || `Reverse geocoding error: ${data.status}`,
    };
  }

  const primaryResult = data.results[0];
  const location = primaryResult.geometry?.location || { lat, lng };
  const parsed = parseAddressComponents(primaryResult.address_components);

  return {
    success: true,
    status: 'OK',
    formattedAddress: primaryResult.formatted_address,
    placeId: primaryResult.place_id,
    location,
    area: parsed.area,
    city: parsed.city,
    state: parsed.state,
    pincode: parsed.pincode,
    streetInfo: [parsed.streetNumber, parsed.route].filter(Boolean).join(' '),
    allResults: data.results,
  };
};

/**
 * Returns Google Static Map image URL with a red location marker
 */
export const getStaticMapUrl = (lat, lng, zoom = 15, width = 600, height = 240) => {
  if (!lat || !lng) return '';
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&markers=color:0xd97706%7Csize:mid%7C${lat},${lng}&key=${GOOGLE_GEOCODING_API_KEY}`;
};

/**
 * Haversine formula to calculate straight-line distance in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Finds the nearest outlet among available outlets to given coordinates
 */
export const findNearestOutlet = (userLat, userLng, outlets = []) => {
  if (!userLat || !userLng || !outlets || outlets.length === 0) {
    return null;
  }

  let closestOutlet = null;
  let minDistance = Infinity;

  for (const outlet of outlets) {
    const coords = getOutletCoordinates(outlet);
    if (coords) {
      const dist = calculateDistanceKm(userLat, userLng, coords.lat, coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestOutlet = {
          outlet,
          distanceKm: dist,
        };
      }
    }
  }

  return closestOutlet;
};

/**
 * Extracts latitude and longitude from various Google Maps URL formats
 */
export const extractCoordsFromMapUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // Pattern 1: @lat,lng, e.g. /@13.0551932,77.6422206
  const atMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Pattern 2: !3dlat!4dlng (embed/place data)
  const dataMatch = clean.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };
  }

  // Pattern 3: ?q=lat,lng or ?ll=lat,lng or &query=lat,lng
  const queryMatch = clean.match(/[?&](?:q|ll|query)=(-?\d+\.\d+)(?:%2C|,)(-?\d+\.\d+)/);
  if (queryMatch) {
    return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };
  }

  // Pattern 4: /place/.../lat,lng
  const placeMatch = clean.match(/\/place\/[^\/]+\/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (placeMatch) {
    return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  }

  return null;
};
