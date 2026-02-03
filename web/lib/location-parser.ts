export interface ParsedLocation {
  businessName: string | null;
  area: string | null;
  city: string | null;
  locality: string | null;
  urlType: 'short' | 'place' | 'search' | 'directions' | 'coordinates' | 'unknown';
  originalUrl: string;
  extractionConfidence: 'high' | 'medium' | 'low';
}

/**
 * Comprehensive Google Maps URL parser that extracts business name and locality
 * from various Google Maps URL formats including short URLs, place URLs, search URLs
 */
export function parseGoogleMapsUrl(url: string): ParsedLocation {
  try {
    const urlObj = new URL(url);
    const decodedUrl = decodeURIComponent(url);
    
    // Detect URL type
    let urlType: ParsedLocation['urlType'] = 'unknown';
    
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
      urlType = 'short';
    } else if (url.includes('/place/')) {
      urlType = 'place';
    } else if (url.includes('/search/') || urlObj.searchParams.has('q')) {
      urlType = 'search';
    } else if (url.includes('/dir/')) {
      urlType = 'directions';
    } else if (urlObj.searchParams.has('ll') || urlObj.searchParams.has('lat') || urlObj.searchParams.has('lng')) {
      urlType = 'coordinates';
    }
    
    let businessName: string | null = null;
    let area: string | null = null;
    let city: string | null = null;
    let locality: string | null = null;
    let extractionConfidence: 'high' | 'medium' | 'low' = 'low';
    
    // Extract from place URLs: /place/Name+City
    const placeMatch = decodedUrl.match(/place\/([^/?&]+)/);
    if (placeMatch) {
      const placePart = placeMatch[1].replace(/[+]/g, ' ');
      // Place often contains business name followed by address components
      const parts = placePart.split(/,|\s+\d+\s+/);
      if (parts.length > 0) {
        businessName = parts[0].trim();
        extractionConfidence = 'high';
        
        // Try to extract locality from remaining parts
        if (parts.length > 1) {
          locality = parts.slice(1).join(', ').trim();
          // Extract city (usually the last part before any state/country)
          const cityMatch = locality.match(/([^,]+)(?:,\s*[A-Za-z]+)?$/);
          if (cityMatch) {
            city = cityMatch[1].trim();
          }
        }
      }
    }
    
    // Extract location from embedded Google Maps data (e.g., !2sLocation+Name!)
    if (!locality) {
      // Look for !2s pattern which contains location name
      const embeddedLocationMatch = decodedUrl.match(/!2s([^!]+)!/);
      if (embeddedLocationMatch) {
        const embeddedLocation = decodeURIComponent(embeddedLocationMatch[1]).replace(/[+]/g, ' ');
        const locationParts = embeddedLocation.split(',').map(p => p.trim());
        
        if (locationParts.length > 0) {
          area = locationParts[0];
          locality = embeddedLocation;
          if (locationParts.length > 1) {
            city = locationParts[locationParts.length - 1];
          }
          extractionConfidence = 'high';
        }
      }
    }
    
    // Extract coordinates from @lat,lng pattern
    const coordsMatch = decodedUrl.match(/@([-\d.]+),([-\d.]+)/);
    if (coordsMatch && !locality) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      locality = `Coordinates: ${lat}, ${lng}`;
    }
    
    // Extract from search query parameter
    if (!businessName) {
      const qParam = urlObj.searchParams.get('q');
      if (qParam) {
        const decoded = decodeURIComponent(qParam).replace(/[+]/g, ' ');
        const parts = decoded.split(',').map(p => p.trim());
        
        if (parts.length > 0) {
          // First part is likely business name or search term
          businessName = parts[0];
          extractionConfidence = parts.length > 1 ? 'medium' : 'low';
          
          // Build locality from remaining parts
          if (parts.length > 1) {
            locality = parts.slice(1).join(', ');
            area = parts[1];
            if (parts.length > 2) {
              city = parts[parts.length - 1];
            }
          }
        }
      }
    }
    
    // Extract from query parameter in old format
    if (!businessName) {
      const queryMatch = decodedUrl.match(/[?&]q=([^&]+)/);
      if (queryMatch) {
        const query = decodeURIComponent(queryMatch[1]).replace(/[+]/g, ' ');
        const parts = query.split(',').map(p => p.trim());
        
        businessName = parts[0] || null;
        if (parts.length > 1) {
          locality = parts.slice(1).join(', ');
          area = parts[1] || null;
          city = parts[parts.length - 1] || null;
        }
        extractionConfidence = parts.length > 1 ? 'medium' : 'low';
      }
    }
    
    // Extract from near parameter
    if (!locality) {
      const nearMatch = decodedUrl.match(/[?&]near=([^&]+)/);
      if (nearMatch) {
        locality = decodeURIComponent(nearMatch[1]).replace(/[+]/g, ' ');
        const parts = locality.split(',');
        area = parts[0] || null;
        city = parts[parts.length - 1] || null;
      }
    }
    
    // Extract from ll parameter (coordinates) - reverse geocoding would be needed
    const llParam = urlObj.searchParams.get('ll');
    if (llParam && !locality) {
      locality = `Location at ${llParam}`;
    }
    
    // Clean up business name
    if (businessName) {
      // Remove common noise
      businessName = businessName
        .replace(/\s+/g, ' ')
        .replace(/\d{4,}/, '') // Remove 4+ digit numbers (likely IDs)
        .trim();
      
      // If business name is too generic, lower confidence
      if (['place', 'location', 'address', 'business'].includes(businessName.toLowerCase())) {
        extractionConfidence = 'low';
      }
    }
    
    // If it's a short URL but we have some extraction, still use it
    if (urlType === 'short' && businessName) {
      extractionConfidence = 'medium';
    }
    
    return {
      businessName: businessName || null,
      area: area || null,
      city: city || null,
      locality: locality || null,
      urlType,
      originalUrl: url,
      extractionConfidence,
    };
  } catch {
    // Return minimal info if URL parsing fails
    return {
      businessName: null,
      area: null,
      city: null,
      locality: null,
      urlType: 'unknown',
      originalUrl: url,
      extractionConfidence: 'low',
    };
  }
}

/**
 * Format location context for the AI prompt
 */
export function formatLocationContext(location: ParsedLocation): string {
  const parts: string[] = [];
  
  if (location.businessName) {
    parts.push(`Business Name: ${location.businessName}`);
  }
  
  if (location.locality) {
    parts.push(`Locality: ${location.locality}`);
  } else if (location.city) {
    parts.push(`City: ${location.city}`);
    if (location.area) {
      parts.push(`Area: ${location.area}`);
    }
  }
  
  if (parts.length === 0) {
    return "Location: Could not extract details from URL";
  }
  
  return parts.join('\n');
}
