"use client";

import { useState, useCallback } from "react";
import { SectionState, assemblePrompt } from "@/lib/prompt-parser";
import { PromptQualityScore, calculateQualityScore } from "@/lib/prompt-quality";

interface BusinessContext {
  name: string;
  location: string;
}

interface UseSectionManagementReturn {
  sections: SectionState[];
  setSections: React.Dispatch<React.SetStateAction<SectionState[]>>;
  regenerateSection: (header: string, customPrompt: string, businessContext: BusinessContext | null) => Promise<void>;
  undoSection: (header: string) => void;
  editSection: (header: string, newContent: string) => PromptQualityScore | null;
  recalculateQualityScore: () => PromptQualityScore | null;
}

export function useSectionManagement(): UseSectionManagementReturn {
  const [sections, setSections] = useState<SectionState[]>([]);

  const regenerateSection = useCallback(async (
    header: string,
    customPrompt: string,
    businessContext: BusinessContext | null
  ) => {
    if (!businessContext) return;

    const sectionIndex = sections.findIndex((s) => s.header === header);
    if (sectionIndex === -1) return;

    // Mark section as regenerating
    setSections((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, isRegenerating: true } : s))
    );

    try {
      const section = sections[sectionIndex];

      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName: header,
          sectionContent: section.content,
          allSections: sections.map((s) => ({ header: s.header, content: s.content })),
          customInstructions: customPrompt,
          businessContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to regenerate section");
      }

      const data = await response.json();

      if (data.section) {
        setSections((prev) =>
          prev.map((s, i) =>
            i === sectionIndex
              ? {
                  ...s,
                  content: data.section,
                  previousContent: s.content,
                  isRegenerating: false,
                  isDirty: true,
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      setSections((prev) =>
        prev.map((s, i) => (i === sectionIndex ? { ...s, isRegenerating: false } : s))
      );
      throw err;
    }
  }, [sections]);

  const undoSection = useCallback((header: string) => {
    const sectionIndex = sections.findIndex((s) => s.header === header);
    if (sectionIndex === -1) return;

    const section = sections[sectionIndex];
    if (!section.previousContent) return;

    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, content: s.previousContent!, previousContent: null, isDirty: false }
          : s
      )
    );
  }, [sections]);

  const editSection = useCallback((header: string, newContent: string) => {
    const sectionIndex = sections.findIndex((s) => s.header === header);
    if (sectionIndex === -1) return null;

    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, content: newContent, previousContent: s.previousContent || s.content, isDirty: true }
          : s
      )
    );

    // Return new quality score
    const newSections = sections.map((s, i) =>
      i === sectionIndex ? { ...s, content: newContent } : s
    );
    const newPrompt = assemblePrompt(newSections);
    return calculateQualityScore(newPrompt);
  }, [sections]);

  const recalculateQualityScore = useCallback(() => {
    const prompt = assemblePrompt(sections);
    return calculateQualityScore(prompt);
  }, [sections]);

  return {
    sections,
    setSections,
    regenerateSection,
    undoSection,
    editSection,
    recalculateQualityScore,
  };
}
