"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { MapEmbed } from "./MapEmbed";
import { cn } from "@/lib/utils";
import gsap from "gsap";

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
        {/* Input Section - Takes full width on mobile, flex-1 on desktop */}
        <div ref={inputRef} className="flex-1 min-w-0">
          <div className="relative group">
            <Input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className={cn(
                "w-full h-12 px-4 text-base bg-background border-2 border-border rounded-xl",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-300",
                "group-hover:border-border/80",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
          
          {/(maps\.app\.goo\.gl|goo\.gl)/i.test(value) && (
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
              Short URL detected. For better results, use the full Google Maps URL.
            </p>
          )}
        </div>
        
        {/* Map Section - Fixed width on desktop, full width on mobile */}
        <div ref={mapRef} className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
          <div className="h-[160px] lg:h-[120px] rounded-xl overflow-hidden border-2 border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <MapEmbed mapsUrl={value} />
          </div>
        </div>
      </div>
    </div>
  );
}
