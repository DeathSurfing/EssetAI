/**
 * Nominatim reverse geocoding service for OpenStreetMap
 */

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface NominatimResult {
  display_name: string;
  address: NominatimAddress;
  extratags?: {
    website?: string;
    phone?: string;
    opening_hours?: string;
  };
  type: string;
  category: string;
  lat: string;
  lon: string;
}

/**
 * Round coordinates to 6 decimal places for privacy/performance
 */
function roundCoordinate(coord: number): number {
  return Math.round(coord * 1000000) / 1000000;
}

/**
 * Fetch enriched location data from Nominatim
 * @param lat Latitude
 * @param lon Longitude
 * @param timeoutMs Timeout in milliseconds (default: 5000)
 * @returns NominatimResult or null if failed
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  timeoutMs: number = 5000
): Promise<NominatimResult | null> {
  // Round coordinates for privacy/performance
  const roundedLat = roundCoordinate(lat);
  const roundedLon = roundCoordinate(lon);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Respect Nominatim's rate limit: 1 request per second
    // We'll handle this at the caller level
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${roundedLat}&` +
      `lon=${roundedLon}&` +
      `format=json&` +
      `addressdetails=1&` +
      `extratags=1&` +
      `zoom=18`,
      {
        headers: {
          'User-Agent': 'esset.ai/1.0 (website-prompt-generator)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      throw new Error(data?.error || 'No data returned from Nominatim');
    }

    return {
      display_name: data.display_name,
      address: data.address || {},
      extratags: data.extratags,
      type: data.type,
      category: data.category,
      lat: roundedLat.toString(),
      lon: roundedLon.toString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Nominatim request timed out');
      }
      throw error;
    }
    
    throw new Error('Unknown error fetching Nominatim data');
  }
}

/**
 * Format Nominatim result into a human-readable string for the prompt
 */
export function formatNominatimContext(result: NominatimResult): string {
  const parts: string[] = [];

  // Build address line
  const addressParts: string[] = [];
  if (result.address.house_number) addressParts.push(result.address.house_number);
  if (result.address.road) addressParts.push(result.address.road);
  if (result.address.suburb) addressParts.push(result.address.suburb);
  if (result.address.city) addressParts.push(result.address.city);
  if (result.address.state) addressParts.push(result.address.state);
  if (result.address.postcode) addressParts.push(result.address.postcode);
  if (result.address.country) addressParts.push(result.address.country);

  if (addressParts.length > 0) {
    parts.push(`Full Address: ${addressParts.join(', ')}`);
  }

  // Add coordinates
  parts.push(`Coordinates: ${result.lat}, ${result.lon}`);

  // Add type/category
  if (result.type && result.category) {
    parts.push(`Location Type: ${result.type} (${result.category})`);
  }

  // Add extra tags if available
  if (result.extratags) {
    if (result.extratags.website) {
      parts.push(`Website: ${result.extratags.website}`);
    }
    if (result.extratags.phone) {
      parts.push(`Phone: ${result.extratags.phone}`);
    }
    if (result.extratags.opening_hours) {
      parts.push(`Opening Hours: ${result.extratags.opening_hours}`);
    }
  }

  return parts.join('\n');
}
