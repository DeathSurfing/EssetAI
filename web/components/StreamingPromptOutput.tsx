"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionCard } from "./SectionCard";
import { OpenInButtons } from "./OpenInButtons";

interface StreamingPromptOutputProps {
  text: string;
  isLoading?: boolean;
  sections: {
    header: string;
    content: string;
    previousContent: string | null;
    isRegenerating: boolean;
    isDirty: boolean;
  }[];
  onRegenerateSection: (header: string, customPrompt: string) => void;
  onUndoSection: (header: string) => void;
  onEditSection: (header: string, newContent: string) => void;
}

export function StreamingPromptOutput({
  text,
  isLoading,
  sections,
  onRegenerateSection,
  onUndoSection,
  onEditSection,
}: StreamingPromptOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (scrollRef.current && isLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, isLoading]);
  
  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  // Show card if loading or has content
  if (!isLoading && !text) {
    return null;
  }
  
  const hasContent = text.length > 0;
  const hasSections = sections.length > 0;
  const isComplete = !isLoading && hasContent;
  
  return (
    <Card className="w-full overflow-hidden border-2 border-primary/20">
      <div className="px-4 py-3 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Generated Website Prompt
          </h3>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">
                  {hasContent ? "Streaming..." : "Starting..."}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Complete</span>
            )}
            {isComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-xs ml-2"
              >
                {copied ? (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={14} className="mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Copy01Icon} size={14} className="mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Left side - Prompt Content */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[600px] overflow-y-auto"
          >
            {!hasContent ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150" />
                <span className="text-sm">Initializing...</span>
              </div>
            ) : !hasSections ? (
              <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                {text}
                {isLoading && <span className="animate-pulse text-primary ml-1">▍</span>}
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <SectionCard
                    key={index}
                    header={section.header}
                    content={section.content}
                    index={index}
                    isRegenerating={section.isRegenerating}
                    isDirty={section.isDirty}
                    previousContent={section.previousContent}
                    onRegenerate={onRegenerateSection}
                    onUndo={onUndoSection}
                    onEdit={onEditSection}
                    allSections={sections.map(s => `${s.header}\n${s.content}`)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right side - Open In Buttons */}
          {isComplete && (
            <div className="shrink-0">
              <OpenInButtons prompt={text} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
