"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type BuilderType = "lovable" | "framer" | "webflow";

interface BuilderToggleProps {
  value: BuilderType;
  onChange: (value: BuilderType) => void;
  disabled?: boolean;
}

const builders = [
  { id: "lovable" as BuilderType, label: "Lovable", description: "AI-first" },
  { id: "framer" as BuilderType, label: "Framer", description: "Design-first" },
  { id: "webflow" as BuilderType, label: "Webflow AI", description: "No-code" },
];

export function BuilderToggle({
  value,
  onChange,
  disabled = false,
}: BuilderToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        Target Builder
      </span>
      <div className="flex gap-2">
        {builders.map((builder) => (
          <button
            key={builder.id}
            onClick={() => !disabled && onChange(builder.id)}
            disabled={disabled}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              value === builder.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border",
              disabled && "opacity-50 cursor-not-allowed hover:bg-background"
            )}
          >
            <div className="font-medium">{builder.label}</div>
            <div className="text-xs opacity-70">{builder.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
