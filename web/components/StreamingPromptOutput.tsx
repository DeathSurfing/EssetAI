"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { Card } from "@/components/ui/card";
import { PromptHeader } from "./prompt/PromptHeader";
import { PromptContent } from "./prompt/PromptContent";
import { OpenInButtons } from "./OpenInButtons";

interface Section {
  header: string;
  content: string;
  previousContent: string | null;
  isRegenerating: boolean;
  isDirty: boolean;
}

interface StreamingPromptOutputProps {
  text: string;
  isLoading?: boolean;
  sections: Section[];
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

      gsap.fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.3 }
      );

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

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  if (!isLoading && !text) {
    return null;
  }

  const hasContent = text.length > 0;
  const isComplete = !isLoading && hasContent;

  return (
    <Card ref={cardRef} className="w-full overflow-hidden border-2 border-primary/20 shadow-xl">
      <PromptHeader isLoading={!!isLoading} isComplete={isComplete} copied={copied} onCopy={handleCopy} />

      <div className="p-6">
        <div className="flex gap-6">
          <div ref={scrollRef} className="flex-1 max-h-[600px] overflow-y-auto pr-2">
            <PromptContent
              text={text}
              isLoading={!!isLoading}
              sections={sections}
              onRegenerateSection={onRegenerateSection}
              onUndoSection={onUndoSection}
              onEditSection={onEditSection}
            />
          </div>

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
