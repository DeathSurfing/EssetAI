"use client";

import * as React from "react";
import { MapEmbed } from "@/components/MapEmbed";

interface MapPreviewProps {
  mapsUrl: string;
  mapRef?: React.RefObject<HTMLDivElement | null>;
}

export function MapPreview({ mapsUrl, mapRef }: MapPreviewProps) {
  return (
    <div ref={mapRef} className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
      <div className="h-[160px] lg:h-[120px] rounded-xl overflow-hidden border-2 border-border shadow-sm hover:shadow-md transition-shadow duration-300">
        <MapEmbed mapsUrl={mapsUrl} />
      </div>
    </div>
  );
}
