"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StreamingPromptOutputProps {
  text: string;
  isLoading: boolean;
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
  const sections = parseSections(text);
  
  useEffect(() => {
    if (scrollRef.current && isLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, isLoading]);
  
  if (!text && !isLoading) {
    return null;
  }
  
  return (
    <Card className="w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="max-h-[500px] overflow-y-auto p-4 space-y-4"
      >
        {sections.length === 0 ? (
          <div className="font-mono text-sm whitespace-pre-wrap text-foreground">
            {text}
            {isLoading && <span className="animate-pulse">▍</span>}
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={index}
              className={cn(
                "border-l-2 pl-4 py-1 transition-all duration-300",
                section.header
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              {section.header && (
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
                    {section.header}
                  </h3>
                  {isLoading && index === sections.length - 1 && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Writing...
                    </span>
                  )}
                  {!isLoading && (
                    <span className="text-xs text-muted-foreground">
                      Complete
                    </span>
                  )}
                </div>
              )}
              <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                {section.content}
              </div>
            </div>
          ))
        )}
        {isLoading && sections.length === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150" />
            <span className="text-sm">Generating prompt...</span>
          </div>
        )}
      </div>
    </Card>
  );
}
