"use client";

import * as React from "react";
import { CopyButton } from "./CopyButton";

interface PromptHeaderProps {
  isLoading: boolean;
  isComplete: boolean;
  copied: boolean;
  onCopy: () => void;
}

export function PromptHeader({ isLoading, isComplete, copied, onCopy }: PromptHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              isLoading ? "bg-primary animate-pulse" : "bg-green-500"
            }`}
          />
          <h3 className="text-base font-semibold text-foreground">Generated Website Prompt</h3>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <span className="text-sm text-muted-foreground animate-pulse">Generating...</span>
          ) : (
            <span className="text-sm text-green-600 font-medium">Complete</span>
          )}
          {isComplete && <CopyButton text="prompt" copied={copied} onCopy={onCopy} />}
        </div>
      </div>
    </div>
  );
}
