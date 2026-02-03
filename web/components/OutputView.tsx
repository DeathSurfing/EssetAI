"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowLeft, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StreamingPromptOutput } from "./StreamingPromptOutput";
import { PromptQualityScoreDisplay } from "./PromptQualityScore";
import { SectionState } from "@/lib/prompt-parser";
import { PromptQualityScore } from "@/lib/prompt-quality";
import { cn } from "@/lib/utils";

interface OutputViewProps {
  googleMapsUrl: string;
  onUrlChange?: (url: string) => void;
  text: string;
  isLoading: boolean;
  sections: SectionState[];
  qualityScore: PromptQualityScore | null;
  onRegenerateSection: (header: string, customPrompt: string) => void;
  onUndoSection: (header: string) => void;
  onEditSection: (header: string, newContent: string) => void;
  onBack?: () => void;
  showUrlInput?: boolean;
}

export function OutputView({
  googleMapsUrl,
  onUrlChange,
  text,
  isLoading,
  sections,
  qualityScore,
  onRegenerateSection,
  onUndoSection,
  onEditSection,
  onBack,
  showUrlInput = true,
}: OutputViewProps) {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Top Bar with URL Input and Back Button */}
      {showUrlInput && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-border bg-muted/30 p-4"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft size={20} />
              </Button>
            )}

            <div className="flex-1 relative">
              <MapPin
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2",
                  googleMapsUrl ? "text-primary" : "text-muted-foreground"
                )}
                size={18}
              />
              <Input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => onUrlChange?.(e.target.value)}
                disabled={isLoading}
                placeholder="Google Maps URL"
                className="pl-10 bg-background"
              />
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={16} />
                </motion.span>
                Generating...
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Content Area - Full Width */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Character Count */}
          {(text || isLoading) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-medium border border-primary/20"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Generated {text.length} characters
            </motion.div>
          )}

          {/* Prompt Output - Full Width */}
          <StreamingPromptOutput
            text={text}
            isLoading={isLoading}
            sections={sections}
            onRegenerateSection={onRegenerateSection}
            onUndoSection={onUndoSection}
            onEditSection={onEditSection}
          />

          {/* Quality Score */}
          {qualityScore && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <PromptQualityScoreDisplay score={qualityScore} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
