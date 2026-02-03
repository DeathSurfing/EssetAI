"use client";

import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionState, assemblePrompt } from "@/lib/prompt-parser";
import { PromptQualityScore, calculateQualityScore } from "@/lib/prompt-quality";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

interface BusinessContext {
  name: string;
  location: string;
}

interface UseSectionManagementParams {
  sections: SectionState[];
  setSections: React.Dispatch<React.SetStateAction<SectionState[]>>;
  promptId?: string;
  defaultBusinessContext?: BusinessContext;
}

interface UseSectionManagementReturn {
  regenerateSection: (
    header: string,
    customPrompt: string,
    businessContext?: BusinessContext | null,
    onStream?: (text: string) => void
  ) => Promise<void>;
  undoSection: (header: string) => void;
  editSection: (header: string, newContent: string) => Promise<PromptQualityScore | null>;
  syncSections: (newSections: SectionState[]) => void;
  recalculateQualityScore: () => PromptQualityScore | null;
}

export function useSectionManagement({
  sections,
  setSections,
  promptId,
  defaultBusinessContext,
}: UseSectionManagementParams): UseSectionManagementReturn {
  // Convex mutation for saving sections
  const updatePromptSections = useMutation(api.prompts.updatePromptSections);

  const regenerateSection = useCallback(
    async (
      header: string,
      customPrompt: string,
      businessContext?: BusinessContext | null,
      onStream?: (text: string) => void
    ) => {
      // Use provided businessContext, or default, or extract from sections
      const effectiveBusinessContext = businessContext || defaultBusinessContext;
      
      if (!effectiveBusinessContext) {
        toast.error("Cannot regenerate: Missing business context. Please reload the page.");
        return;
      }

      const sectionIndex = sections.findIndex((s) => s.header === header);
      if (sectionIndex === -1) return;

      const originalSection = sections[sectionIndex];

      // Mark section as regenerating
      setSections((prev) =>
        prev.map((s, i) =>
          i === sectionIndex
            ? { ...s, isRegenerating: true, content: "" }
            : s
        )
      );

      try {
        const response = await fetch("/api/regenerate-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionName: header,
            sectionContent: originalSection.content,
            allSections: sections.map((s) => ({
              header: s.header,
              content: s.content,
            })),
            customInstructions: customPrompt,
            businessContext: effectiveBusinessContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to regenerate section");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          // Update section content in real-time
          setSections((prev) =>
            prev.map((s, i) =>
              i === sectionIndex ? { ...s, content: fullText } : s
            )
          );

          // Call the onStream callback if provided
          onStream?.(fullText);
        }

        if (fullText.trim().length === 0) {
          throw new Error("No content generated");
        }

        // Final update with complete text
        const finalSections = sections.map((s, i) =>
          i === sectionIndex
            ? {
                ...s,
                content: fullText.trim(),
                previousContent: originalSection.content,
                isRegenerating: false,
                isDirty: true,
              }
            : s
        );

        setSections(finalSections);

        // Save to Convex if we have a promptId
        if (promptId) {
          try {
            await updatePromptSections({
              promptId: promptId as Id<"prompts">,
              sections: finalSections.map((s) => ({
                header: s.header,
                content: s.content,
              })),
            });
          } catch (error) {
            console.error("Failed to save regenerated section:", error);
          }
        }
      } catch (err) {
        console.error("Regenerate error:", err);
        toast.error(err instanceof Error ? err.message : "Failed to regenerate section");
        setSections((prev) =>
          prev.map((s, i) =>
            i === sectionIndex
              ? {
                  ...s,
                  content: originalSection.content,
                  isRegenerating: false,
                }
              : s
          )
        );
        throw err;
      }
    },
    [sections, setSections, promptId, updatePromptSections, defaultBusinessContext]
  );

  const undoSection = useCallback(
    (header: string) => {
      const sectionIndex = sections.findIndex((s) => s.header === header);
      if (sectionIndex === -1) return;

      const section = sections[sectionIndex];
      if (!section.previousContent) return;

      setSections((prev) =>
        prev.map((s, i) =>
          i === sectionIndex
            ? {
                ...s,
                content: s.previousContent!,
                previousContent: null,
                isDirty: false,
              }
            : s
        )
      );
    },
    [sections, setSections]
  );

  const editSection = useCallback(
    async (header: string, newContent: string): Promise<PromptQualityScore | null> => {
      const sectionIndex = sections.findIndex((s) => s.header === header);
      if (sectionIndex === -1) return null;

      const updatedSections = sections.map((s, i) =>
        i === sectionIndex
          ? {
              ...s,
              content: newContent,
              previousContent: s.previousContent || s.content,
              isDirty: true,
            }
          : s
      );

      setSections(updatedSections);

      // Save to Convex if we have a promptId
      if (promptId) {
        try {
          await updatePromptSections({
            promptId: promptId as Id<"prompts">,
            sections: updatedSections.map((s) => ({
              header: s.header,
              content: s.content,
            })),
          });
        } catch (error) {
          console.error("Failed to save edited section:", error);
        }
      }

      // Return new quality score
      const newPrompt = assemblePrompt(updatedSections);
      return calculateQualityScore(newPrompt);
    },
    [sections, setSections, promptId, updatePromptSections]
  );

  const recalculateQualityScore = useCallback(() => {
    const prompt = assemblePrompt(sections);
    return calculateQualityScore(prompt);
  }, [sections]);

  const syncSections = useCallback(
    (newSections: SectionState[]) => {
      setSections(newSections);
    },
    [setSections]
  );

  return {
    regenerateSection,
    undoSection,
    editSection,
    syncSections,
    recalculateQualityScore,
  };
}
