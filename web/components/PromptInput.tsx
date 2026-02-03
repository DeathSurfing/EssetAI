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
  return (
    <div className="w-full">
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
    </div>
  );
}
