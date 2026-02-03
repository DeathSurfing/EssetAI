import { expandGoogleMapsUrl, getUrlProcessingPriority, getExtractionConfidence } from './url-expander';

export interface ParsedLocation {
  businessName: string | null;
  area: string | null;
  city: string | null;
  locality: string | null;
  urlType: 'short' | 'place' | 'search' | 'directions' | 'coordinates' | 'unknown';
  domainType: 'maps.google.com' | 'google.com/maps' | 'unknown';
  originalUrl: string;
  expandedUrl?: string | null;
  isExpanded: boolean;
  extractionConfidence: 'high' | 'medium' | 'low';
  processingPriority: number;
}

/**
 * Detect domain type from URL
 */
function detectDomainType(url: string): ParsedLocation['domainType'] {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname === 'maps.google.com') {
      return 'maps.google.com';
    } else if ((hostname === 'google.com' || hostname === 'www.google.com') && urlObj.pathname.startsWith('/maps')) {
      return 'google.com/maps';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Comprehensive Google Maps URL parser that extracts business name and locality
 * from various Google Maps URL formats including short URLs, place URLs, search URLs
 */
export async function parseGoogleMapsUrl(url: string): Promise<ParsedLocation> {
  try {
    const urlObj = new URL(url);
    const decodedUrl = decodeURIComponent(url);
    
    // Expand URL if needed
    const expansionResult = await expandGoogleMapsUrl(url);
    const workingUrl = expansionResult.expandedUrl || url;
    const workingUrlObj = new URL(workingUrl);
    const workingDecodedUrl = decodeURIComponent(workingUrl);
    
// Detect URL type
    let urlType: ParsedLocation['urlType'] = 'unknown';
    
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl')) {
      urlType = 'short';
    } else if (workingUrl.includes('/place/')) {
      urlType = 'place';
    } else if (workingUrl.includes('/search/') || workingUrlObj.searchParams.has('q')) {
      urlType = 'search';
    } else if (workingUrl.includes('/dir/')) {
      urlType = 'directions';
    } else if (workingUrlObj.searchParams.has('ll') || workingUrlObj.searchParams.has('lat') || workingUrlObj.searchParams.has('lng')) {
      urlType = 'coordinates';
    }
    
    // Detect domain type
    const domainType = expansionResult.expandedDomain || detectDomainType(workingUrl);
    
    let businessName: string | null = null;
    let area: string | null = null;
    let city: string | null = null;
    let locality: string | null = null;
    let extractionConfidence: 'high' | 'medium' | 'low' = 'low';
    
// Extract from place URLs: /place/Name+City
    const placeMatch = workingDecodedUrl.match(/place\/([^/?&]+)/);
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
      const embeddedLocationMatch = workingDecodedUrl.match(/!2s([^!]+)!/);
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
    const coordsMatch = workingDecodedUrl.match(/@([-\d.]+),([-\d.]+)/);
    if (coordsMatch && !locality) {
      const lat = coordsMatch[1];
      const lng = coordsMatch[2];
      locality = `Coordinates: ${lat}, ${lng}`;
    }
    
    // Extract from search query parameter
    if (!businessName) {
      const qParam = workingUrlObj.searchParams.get('q');
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
      const queryMatch = workingDecodedUrl.match(/[?&]q=([^&]+)/);
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
      const nearMatch = workingDecodedUrl.match(/[?&]near=([^&]+)/);
      if (nearMatch) {
        locality = decodeURIComponent(nearMatch[1]).replace(/[+]/g, ' ');
        const parts = locality.split(',');
        area = parts[0] || null;
        city = parts[parts.length - 1] || null;
      }
    }
    
    // Extract from ll parameter (coordinates) - reverse geocoding would be needed
    const llParam = workingUrlObj.searchParams.get('ll');
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
    
    // Use the confidence calculation from URL expander
    const finalConfidence = getExtractionConfidence(urlType, expansionResult);
    const processingPriority = getUrlProcessingPriority(domainType);
    
    return {
      businessName: businessName || null,
      area: area || null,
      city: city || null,
      locality: locality || null,
      urlType,
      domainType,
      originalUrl: url,
      expandedUrl: expansionResult.expandedUrl,
      isExpanded: expansionResult.isExpanded,
      extractionConfidence: finalConfidence,
      processingPriority,
    };
  } catch {
    // Return minimal info if URL parsing fails
    return {
      businessName: null,
      area: null,
      city: null,
      locality: null,
      urlType: 'unknown',
      domainType: 'unknown',
      originalUrl: url,
      expandedUrl: null,
      isExpanded: false,
      extractionConfidence: 'low',
      processingPriority: 3,
    };
  }
}

/**
 * Synchronous version for backward compatibility (no URL expansion)
 */
export function parseGoogleMapsUrlSync(url: string): ParsedLocation {
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
    
    // Detect domain type
    const domainType = detectDomainType(url);
    
    let businessName: string | null = null;
    let area: string | null = null;
    let city: string | null = null;
    let locality: string | null = null;
    let extractionConfidence: 'high' | 'medium' | 'low' = 'low';
    
    // Basic extraction logic (simplified from async version)
    const placeMatch = decodedUrl.match(/place\/([^/?&]+)/);
    if (placeMatch) {
      const placePart = placeMatch[1].replace(/[+]/g, ' ');
      const parts = placePart.split(/,|\s+\d+\s+/);
      if (parts.length > 0) {
        businessName = parts[0].trim();
        extractionConfidence = 'high';
      }
    }
    
    const qParam = urlObj.searchParams.get('q');
    if (qParam && !businessName) {
      const decoded = decodeURIComponent(qParam).replace(/[+]/g, ' ');
      const parts = decoded.split(',').map(p => p.trim());
      businessName = parts[0];
      extractionConfidence = parts.length > 1 ? 'medium' : 'low';
    }
    
    const processingPriority = getUrlProcessingPriority(domainType);
    
    return {
      businessName: businessName || null,
      area: area || null,
      city: city || null,
      locality: locality || null,
      urlType,
      domainType,
      originalUrl: url,
      expandedUrl: null,
      isExpanded: false,
      extractionConfidence,
      processingPriority,
    };
  } catch {
    return {
      businessName: null,
      area: null,
      city: null,
      locality: null,
      urlType: 'unknown',
      domainType: 'unknown',
      originalUrl: url,
      expandedUrl: null,
      isExpanded: false,
      extractionConfidence: 'low',
      processingPriority: 3,
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
  
  // Add URL type info for context
  if (location.isExpanded) {
    parts.push(`Source: Expanded from ${location.originalUrl}`);
  } else if (location.domainType !== 'unknown') {
    parts.push(`Source: ${location.domainType}`);
  }
  
  if (parts.length === 0) {
    return "Location: Could not extract details from URL";
  }
  
  return parts.join('\n');
}
