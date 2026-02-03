"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLDivElement | null>;
}

export function URLInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste Google Maps business link here...",
  inputRef,
}: URLInputProps) {
  const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(value);

  return (
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

      {isShortUrl && (
        <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse">
          Short URL detected. For better results, use the full Google Maps URL.
        </p>
      )}
    </div>
  );
}
