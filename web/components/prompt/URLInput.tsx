"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseGoogleMapsUrlSync } from "@/lib/location-parser";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLDivElement | null>;
  showUrlType?: boolean;
}

function getUrlTypeIcon(urlType: string): string {
  switch (urlType) {
    case 'place':
      return '📍';
    case 'search':
      return '🔍';
    case 'directions':
      return '🧭';
    case 'coordinates':
      return '📍';
    case 'short':
      return '🔗';
    default:
      return '🌐';
  }
}

function getUrlTypeColor(domainType: string, isShortUrl: boolean): string {
  if (isShortUrl) return 'text-yellow-600 dark:text-yellow-400';
  if (domainType === 'google.com/maps') return 'text-green-600 dark:text-green-400';
  if (domainType === 'maps.google.com') return 'text-blue-600 dark:text-blue-400';
  return 'text-gray-500 dark:text-gray-400';
}

function getUrlTypeMessage(parsed: ReturnType<typeof parseGoogleMapsUrlSync>): {
  message: string;
  color: string;
} {
  const { urlType, domainType, isExpanded, extractionConfidence } = parsed;
  const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(parsed.originalUrl);

  if (isShortUrl) {
    if (isExpanded) {
      return {
        message: '✅ Short URL expanded successfully',
        color: 'text-green-600 dark:text-green-400'
      };
    }
    return {
      message: '🔄 Expanding short URL... (may take a moment)',
      color: 'text-yellow-600 dark:text-yellow-400 animate-pulse'
    };
  }

  if (domainType === 'google.com/maps') {
    return {
      message: '✅ Full Google Maps URL - High quality data',
      color: 'text-green-600 dark:text-green-400'
    };
  }

  if (domainType === 'maps.google.com') {
    return {
      message: 'ℹ️ Maps URL - Standard processing',
      color: 'text-blue-600 dark:text-blue-400'
    };
  }

  if (urlType === 'place') {
    return {
      message: '📍 Place URL - Business details available',
      color: 'text-green-600 dark:text-green-400'
    };
  }

  if (urlType === 'search') {
    return {
      message: '🔍 Search URL - Processing search results',
      color: 'text-blue-600 dark:text-blue-400'
    };
  }

  return {
    message: '⚠️ Unknown URL format - Best effort processing',
    color: 'text-gray-500 dark:text-gray-400'
  };
}

export function URLInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste Google Maps business link here...",
  inputRef,
  showUrlType = true,
}: URLInputProps) {
  const parsed = React.useMemo(() => {
    if (!value.trim()) return null;
    return parseGoogleMapsUrlSync(value);
  }, [value]);

  const isShortUrl = value ? /(maps\.app\.goo\.gl|goo\.gl)/i.test(value) : false;
  const urlTypeMessage = parsed ? getUrlTypeMessage(parsed) : null;

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

      {showUrlType && parsed && urlTypeMessage && (
        <div className="mt-2 flex items-center justify-between">
          <p className={cn("text-xs", urlTypeMessage.color)}>
            {urlTypeMessage.message}
          </p>
          {parsed.extractionConfidence && (
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              parsed.extractionConfidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              parsed.extractionConfidence === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            )}>
              {parsed.extractionConfidence === 'high' ? 'High confidence' :
               parsed.extractionConfidence === 'medium' ? 'Medium confidence' : 'Low confidence'}
            </span>
          )}
        </div>
      )}

      {isShortUrl && !parsed?.isExpanded && (
        <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
          💡 Tip: Full URLs (google.com/maps) provide better results than short URLs
        </p>
      )}
    </div>
  );
}
