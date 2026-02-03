"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { MapEmbed } from "./MapEmbed";
import { cn } from "@/lib/utils";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_400px] gap-4">
      {/* Input Section */}
      <div className="space-y-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {/(maps\.app\.goo\.gl|goo\.gl)/i.test(value) && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Short URL detected. For better results, use the full Google Maps URL.
          </p>
        )}
      </div>
      
      {/* Map Section */}
      <div className="h-[200px] md:h-[120px]">
        <MapEmbed mapsUrl={value} />
      </div>
    </div>
  );
}
