"use client";

import * as React from "react";
import gsap from "gsap";
import { URLInput } from "@/components/prompt/URLInput";
import { MapPreview } from "@/components/prompt/MapPreview";

interface PromptInputWithMapProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PromptInputWithMap({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste Google Maps business link here...",
}: PromptInputWithMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<HTMLDivElement>(null);

  // Entrance animation
  React.useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(
        inputRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(
        mapRef.current,
        { opacity: 0, x: 20, scale: 0.95 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, delay: 0.3, ease: "back.out(1.7)" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate map when URL changes
  React.useEffect(() => {
    if (value && mapRef.current) {
      gsap.fromTo(
        mapRef.current,
        { scale: 0.95, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [value]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <URLInput
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          inputRef={inputRef}
        />
        <MapPreview mapsUrl={value} mapRef={mapRef} />
      </div>
    </div>
  );
}
