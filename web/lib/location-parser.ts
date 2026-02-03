export interface ParsedLocation {
  businessName: string | null;
  area: string | null;
  city: string | null;
}

export function parseGoogleMapsUrl(url: string): ParsedLocation {
  try {
    const decodedUrl = decodeURIComponent(url);
    
    // Extract business name from place URL pattern
    const placeMatch = decodedUrl.match(/place\/([^/]+)/);
    const businessName = placeMatch 
      ? placeMatch[1].replace(/[+]/g, ' ').replace(/\d+$/, '').trim()
      : null;
    
    // Extract area from search/nearby patterns
    const nearMatch = decodedUrl.match(/near\/([^/]+)/);
    const area = nearMatch
      ? nearMatch[1].replace(/[+]/g, ' ').trim()
      : null;
    
    // Extract city from various patterns
    const cityMatch = decodedUrl.match(/,([^,]+)(?:,\s*[A-Za-z]{2})?$/);
    const city = cityMatch
      ? cityMatch[1].replace(/[+]/g, ' ').trim()
      : null;
    
    // Fallback: try to parse from query parameter
    const queryMatch = decodedUrl.match(/[?&]q=([^&]+)/);
    if (!businessName && queryMatch) {
      const query = queryMatch[1].replace(/[+]/g, ' ');
      const parts = query.split(',').map(p => p.trim());
      return {
        businessName: parts[0] || null,
        area: parts[1] || null,
        city: parts[2] || null,
      };
    }
    
    return {
      businessName: businessName || null,
      area: area || null,
      city: city || null,
    };
  } catch {
    return {
      businessName: null,
      area: null,
      city: null,
    };
  }
}
