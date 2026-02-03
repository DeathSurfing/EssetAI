"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StreamingPromptOutputProps {
  text: string;
  isLoading?: boolean;
}

const SECTION_HEADERS = [
  "PROJECT CONTEXT",
  "BUSINESS OVERVIEW",
  "TARGET AUDIENCE",
  "DESIGN DIRECTION",
  "SITE STRUCTURE",
  "CONTENT GUIDELINES",
  "PRIMARY CALL-TO-ACTION",
  "LOCATION CONTEXT",
];

function parseSections(text: string): { header: string | null; content: string }[] {
  if (!text.trim()) return [];
  
  const sections: { header: string | null; content: string }[] = [];
  let currentContent = "";
  let currentHeader: string | null = null;
  
  const lines = text.split("\n");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    const isHeader = SECTION_HEADERS.some(
      (header) => trimmedLine === header || trimmedLine.startsWith(header)
    );
    
    if (isHeader) {
      if (currentHeader || currentContent) {
        sections.push({
          header: currentHeader,
          content: currentContent.trim(),
        });
      }
      currentHeader = trimmedLine.replace(/:$/, "");
      currentContent = "";
    } else {
      currentContent += line + "\n";
    }
  }
  
  if (currentHeader || currentContent.trim()) {
    sections.push({
      header: currentHeader,
      content: currentContent.trim(),
    });
  }
  
  return sections;
}

export function StreamingPromptOutput({
  text,
  isLoading,
}: StreamingPromptOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const sections = parseSections(text);
  
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
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="max-h-[600px] overflow-y-auto p-4"
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
              <div
                key={index}
                className={cn(
                  "border-l-2 pl-4 py-2 transition-all duration-300",
                  section.header
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {section.header && (
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wide">
                      {section.header}
                    </h4>
                    {isLoading && index === sections.length - 1 && (
                      <span className="text-xs text-muted-foreground animate-pulse bg-muted px-2 py-0.5 rounded">
                        Writing...
                      </span>
                    )}
                  </div>
                )}
                <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {section.content}
                  {isLoading && index === sections.length - 1 && (
                    <span className="animate-pulse text-primary">▍</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
