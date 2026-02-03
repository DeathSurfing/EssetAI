"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface SectionHeaderProps {
  header: string;
  isRegenerating: boolean;
  isDirty: boolean;
  previousContent: string | null;
  customPrompt: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomPromptChange: (value: string) => void;
  onApply: () => void;
  onUndo: () => void;
  onCancel: () => void;
}

export function SectionHeader({
  header,
  isRegenerating,
  isDirty,
  previousContent,
  customPrompt,
  isOpen,
  onOpenChange,
  onCustomPromptChange,
  onApply,
  onUndo,
  onCancel,
}: SectionHeaderProps) {
  if (!header) return null;

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-bold text-primary uppercase tracking-wide">
          {header}
        </h4>
        {isRegenerating && (
          <span className="text-xs text-muted-foreground animate-pulse bg-muted px-2 py-0.5 rounded">
            Regenerating...
          </span>
        )}
        {isDirty && !isRegenerating && (
          <span className="text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 rounded">
            Edited
          </span>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Regenerate section"
          >
            <HugeiconsIcon icon={RefreshIcon} size={16} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end" sideOffset={5}>
          <div className="space-y-3">
            <div>
              <h5 className="font-medium text-sm mb-1">Regenerate: {header}</h5>
              <p className="text-xs text-muted-foreground">
                Enter custom instructions to modify this section.
              </p>
            </div>

            <Textarea
              placeholder="e.g., Make it more focused on fine dining..."
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              className="min-h-[80px] text-sm"
            />

            <div className="flex items-center gap-2">
              <Button
                onClick={onApply}
                disabled={isRegenerating || !customPrompt.trim()}
                size="sm"
                className="flex-1"
              >
                {isRegenerating ? (
                  <>
                    <HugeiconsIcon icon={RefreshIcon} size={12} className="mr-1 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply"
                )}
              </Button>

              {previousContent && (
                <Button onClick={onUndo} disabled={isRegenerating} variant="outline" size="sm">
                  Undo
                </Button>
              )}

              <Button onClick={onCancel} disabled={isRegenerating} variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
