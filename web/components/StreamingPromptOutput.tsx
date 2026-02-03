"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import gsap from "gsap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Entrance animation
  useEffect(() => {
    if (!cardRef.current || (!text && !isLoading)) return;

    const ctx = gsap.context(() => {
      // Card entrance
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
        }
      );

      // Content fade in
      gsap.fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.3 }
      );

      // Side buttons slide in
      if (buttonsRef.current) {
        gsap.fromTo(
          buttonsRef.current,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.5, delay: 0.4, ease: "power3.out" }
        );
      }
    }, cardRef);

    return () => ctx.revert();
  }, [text, isLoading]);

  // Auto-scroll while streaming
  useEffect(() => {
    if (scrollRef.current && isLoading) {
      gsap.to(scrollRef.current, {
        scrollTop: scrollRef.current.scrollHeight,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [text, isLoading]);

  // Copy button animation
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
    <Card
      ref={cardRef}
      className="w-full overflow-hidden border-2 border-primary/20 shadow-xl"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                isLoading
                  ? "bg-primary animate-pulse"
                  : "bg-green-500"
              }`}
            />
            <h3 className="text-base font-semibold text-foreground">
              Generated Website Prompt
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <span className="text-sm text-muted-foreground animate-pulse">
                Generating...
              </span>
            ) : (
              <span className="text-sm text-green-600 font-medium">
                Complete
              </span>
            )}
            {isComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-sm transition-all duration-200 hover:scale-105"
              >
                {copied ? (
                  <>
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={16}
                      className="mr-2"
                    />
                    Copied!
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={Copy01Icon}
                      size={16}
                      className="mr-2"
                    />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left side - Prompt Content */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[600px] overflow-y-auto pr-2"
          >
            {!hasContent ? (
              <div className="flex items-center justify-center gap-3 text-muted-foreground py-12">
                <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                />
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span className="text-base ml-2">Initializing...</span>
              </div>
            ) : !hasSections ? (
              <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-muted/50 rounded-lg">
                {text}
                {isLoading && (
                  <span className="animate-pulse text-primary ml-1">▍</span>
                )}
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
                    allSections={sections.map(
                      (s) => `${s.header}\n${s.content}`
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right side - Open In Buttons */}
          {isComplete && (
            <div ref={buttonsRef} className="shrink-0 w-[140px]">
              <div className="sticky top-0">
                <OpenInButtons prompt={text} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
