"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PromptInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Paste Google Maps business link here...",
}: PromptInputProps) {
  const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(value);
  
  return (
    <div className="w-full space-y-2">
      <Input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full",
          disabled && "opacity-50 cursor-not-allowed",
          isShortUrl && "border-yellow-500/50 focus-visible:border-yellow-500"
        )}
      />
      {isShortUrl && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Short URL detected. For better results, use the full Google Maps URL (open the link and copy the long URL from the address bar).
        </p>
      )}
    </div>
  );
}
