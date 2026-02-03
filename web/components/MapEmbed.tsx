"use client";

import * as React from "react";
import { parseGoogleMapsUrl } from "@/lib/location-parser";

interface MapEmbedProps {
  mapsUrl: string;
}

export function MapEmbed({ mapsUrl }: MapEmbedProps) {
  // Parse location data from URL
  const location = React.useMemo(() => {
    if (!mapsUrl) return null;
    return parseGoogleMapsUrl(mapsUrl);
  }, [mapsUrl]);

  // Convert Google Maps URL to embed URL with pin marker
  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Extract coordinates from @lat,lng pattern
      const coordsMatch = url.match(/@([-\d.]+),([-\d.]+)/);
      if (coordsMatch) {
        const lat = coordsMatch[1];
        const lng = coordsMatch[2];
        // Use coordinates directly in embed URL
        return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
      }
      
      // Try to extract place name from /place/ URL
      if (url.includes("/place/")) {
        const placeMatch = url.match(/place\/([^/@]+)/);
        if (placeMatch) {
          const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
          // Use place name as query
          return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=16&output=embed`;
        }
      }
      
      // Fallback: try to extract from embedded location data
      const locationMatch = url.match(/!2s([^!]+)!/);
      if (locationMatch) {
        const location = decodeURIComponent(locationMatch[1]).replace(/\+/g, " ");
        return `https://maps.google.com/maps?q=${encodeURIComponent(location)}&z=16&output=embed`;
      }
      
      // Last resort: use the full URL as query
      return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&z=16&output=embed`;
    } catch {
      return null;
    }
  };
  
  const embedUrl = getEmbedUrl(mapsUrl);
  
  if (!embedUrl) {
    return (
      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center border border-border">
        <p className="text-sm text-muted-foreground text-center px-4">
          Enter a Google Maps URL to see the location
        </p>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Business Name & Location */}
      {location?.businessName && (
        <div className="bg-card rounded-lg px-3 py-2 border border-border shadow-sm">
          <p className="text-sm font-semibold text-foreground">
            {location.businessName}
          </p>
          {location.locality && (
            <p className="text-xs text-muted-foreground">
              {location.locality}
            </p>
          )}
        </div>
      )}
      
      {/* Map Embed */}
      <div className="flex-1 rounded-lg overflow-hidden border border-border bg-muted min-h-[150px]">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: "150px" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps"
        />
      </div>
    </div>
  );
}
