import { ParsedLocation } from './location-parser';

export interface UrlExpansionResult {
  expandedUrl: string | null;
  isExpanded: boolean;
  error: string | null;
  expandedDomain: 'maps.google.com' | 'google.com/maps' | 'unknown';
}

const URL_EXPANSION_CACHE = new Map<string, UrlExpansionResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache management for URL expansion results
 */
interface CachedUrlExpansionResult extends UrlExpansionResult {
  timestamp: number;
}

function getCachedResult(originalUrl: string): UrlExpansionResult | null {
  const cached = URL_EXPANSION_CACHE.get(originalUrl) as CachedUrlExpansionResult;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const { timestamp, ...result } = cached;
    return result;
  }
  return null;
}

function setCachedResult(originalUrl: string, result: UrlExpansionResult): void {
  URL_EXPANSION_CACHE.set(originalUrl, {
    ...result,
    timestamp: Date.now()
  } as CachedUrlExpansionResult);
}

/**
 * Detect URL domain type
 */
function detectDomainType(url: string): UrlExpansionResult['expandedDomain'] {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname === 'maps.google.com') {
      return 'maps.google.com';
    } else if (hostname === 'google.com' && urlObj.pathname.startsWith('/maps')) {
      return 'google.com/maps';
    } else if (hostname === 'www.google.com' && urlObj.pathname.startsWith('/maps')) {
      return 'google.com/maps';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Expand shortened Google Maps URLs by following redirects
 */
async function expandUrlWithFetch(url: string, timeout: number = 5000): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // Use a HEAD request first to follow redirects without downloading the entire page
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // Don't automatically follow redirects
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    // If we get a redirect, follow it
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // If still a short URL, continue following
        if (location.includes('maps.app.goo.gl') || location.includes('goo.gl')) {
          return await expandUrlWithFetch(location, timeout);
        }
        return location;
      }
    }

    // If no redirect, try a GET request to see if there's a meta refresh or JS redirect
    const getResponse = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);

    if (getResponse.status >= 300 && getResponse.status < 400) {
      const location = getResponse.headers.get('location');
      return location || null;
    }

    // Return original URL if no redirect found
    return url;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`URL expansion timeout after ${timeout}ms`);
    }
    throw new Error(`URL expansion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main URL expansion function
 */
export async function expandGoogleMapsUrl(originalUrl: string): Promise<UrlExpansionResult> {
  // Check cache first
  const cached = getCachedResult(originalUrl);
  if (cached) {
    return cached;
  }

  const result: UrlExpansionResult = {
    expandedUrl: null,
    isExpanded: false,
    error: null,
    expandedDomain: 'unknown'
  };

  try {
    // Check if this is a short URL that needs expansion
    const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(originalUrl);
    
    if (isShortUrl) {
      result.expandedUrl = await expandUrlWithFetch(originalUrl);
      result.isExpanded = true;
      
      if (result.expandedUrl) {
        result.expandedDomain = detectDomainType(result.expandedUrl);
      }
    } else {
      // For non-short URLs, just detect the domain type
      result.expandedUrl = originalUrl;
      result.isExpanded = false;
      result.expandedDomain = detectDomainType(originalUrl);
    }

    // Cache the result
    setCachedResult(originalUrl, result);
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown expansion error';
    result.expandedUrl = originalUrl; // Fallback to original URL
    result.isExpanded = false;
    result.expandedDomain = detectDomainType(originalUrl);
    
    // Cache error result with shorter TTL
    setCachedResult(originalUrl, result);
    return result;
  }
}

/**
 * Get URL processing priority based on domain type
 */
export function getUrlProcessingPriority(domain: UrlExpansionResult['expandedDomain']): number {
  switch (domain) {
    case 'google.com/maps':
      return 1; // Highest priority
    case 'maps.google.com':
      return 2; // Medium priority
    case 'unknown':
      return 3; // Lowest priority
    default:
      return 3;
  }
}

/**
 * Determine extraction confidence based on URL type and expansion result
 */
export function getExtractionConfidence(
  originalUrlType: ParsedLocation['urlType'],
  expansionResult: UrlExpansionResult
): 'high' | 'medium' | 'low' {
  // If we successfully expanded a short URL
  if (expansionResult.isExpanded && expansionResult.expandedUrl) {
    if (expansionResult.expandedDomain === 'google.com/maps') {
      return 'high';
    } else if (expansionResult.expandedDomain === 'maps.google.com') {
      return 'medium';
    }
  }

  // Original URL type confidence
  switch (originalUrlType) {
    case 'place':
      return 'high';
    case 'search':
    case 'directions':
      return 'medium';
    case 'short':
      // If expansion failed, lower confidence
      return expansionResult.error ? 'low' : 'medium';
    case 'coordinates':
      return 'medium';
    case 'unknown':
    default:
      return 'low';
  }
}

/**
 * Clean up old cache entries
 */
export function cleanupExpansionCache(): void {
  const now = Date.now();
  for (const [key, value] of URL_EXPANSION_CACHE.entries()) {
    if (now - (value as any).timestamp > CACHE_TTL) {
      URL_EXPANSION_CACHE.delete(key);
    }
  }
}

// Periodic cleanup
setInterval(cleanupExpansionCache, CACHE_TTL);