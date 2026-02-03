"use client";

import * as React from "react";
import { SectionCard } from "@/components/SectionCard";

interface Section {
  header: string;
  content: string;
  previousContent: string | null;
  isRegenerating: boolean;
  isDirty: boolean;
}

interface PromptContentProps {
  text: string;
  isLoading: boolean;
  sections: Section[];
  onRegenerateSection: (header: string, customPrompt: string) => void;
  onUndoSection: (header: string) => void;
  onEditSection: (header: string, newContent: string) => void;
}

export function PromptContent({
  text,
  isLoading,
  sections,
  onRegenerateSection,
  onUndoSection,
  onEditSection,
}: PromptContentProps) {
  const hasContent = text.length > 0;
  const hasSections = sections.length > 0;

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center gap-3 text-muted-foreground py-12">
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        <span className="text-base ml-2">Initializing...</span>
      </div>
    );
  }

  if (!hasSections) {
    return (
      <div className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-muted/50 rounded-lg">
        {text}
        {isLoading && <span className="animate-pulse text-primary ml-1">▍</span>}
      </div>
    );
  }

  return (
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
          allSections={sections.map((s) => `${s.header}\n${s.content}`)}
        />
      ))}
    </div>
  );
}
