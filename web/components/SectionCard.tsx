"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

interface SectionCardProps {
  header: string;
  content: string;
  index: number;
  isRegenerating: boolean;
  previousContent: string | null;
  onRegenerate: (header: string, customPrompt: string) => void;
  onUndo: (header: string) => void;
  allSections: string[];
}

export function SectionCard({
  header,
  content,
  index,
  isRegenerating,
  previousContent,
  onRegenerate,
  onUndo,
  allSections,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");

  const handleApply = () => {
    onRegenerate(header, customPrompt);
    setIsOpen(false);
    setCustomPrompt("");
  };

  const handleUndo = () => {
    onUndo(header);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setCustomPrompt("");
  };

  return (
    <div
      className={cn(
        "border-l-2 pl-4 py-2 transition-all duration-300 relative group",
        header
          ? "border-primary bg-primary/5"
          : "border-border"
      )}
    >
      {header && (
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
          </div>
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
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
            <PopoverContent 
              className="w-80 p-4" 
              align="end"
              sideOffset={5}
            >
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm mb-1">
                    Regenerate: {header}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Enter custom instructions to modify this section.
                  </p>
                </div>
                
                <Textarea
                  placeholder="e.g., Make it more focused on fine dining..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleApply}
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
                    <Button
                      onClick={handleUndo}
                      disabled={isRegenerating}
                      variant="outline"
                      size="sm"
                    >
                      Undo
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleCancel}
                    disabled={isRegenerating}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed">
        {content}
      </div>
    </div>
  );
}
