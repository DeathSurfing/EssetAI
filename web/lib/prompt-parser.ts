import { PromptQualityScore, calculateQualityScore } from "@/lib/prompt-quality";

export type SectionState = {
  header: string;
  content: string;
  previousContent: string | null;
  isRegenerating: boolean;
  isDirty: boolean;
};

export const SECTION_HEADERS = [
  "PROJECT CONTEXT",
  "BUSINESS OVERVIEW",
  "TARGET AUDIENCE",
  "DESIGN DIRECTION",
  "SITE STRUCTURE",
  "CONTENT GUIDELINES",
  "PRIMARY CALL-TO-ACTION",
  "LOCATION CONTEXT",
] as const;

export function parseSections(text: string): SectionState[] {
  if (!text.trim()) return [];

  const sections: SectionState[] = [];
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
          header: currentHeader || "",
          content: currentContent.trim(),
          previousContent: null,
          isRegenerating: false,
          isDirty: false,
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
      header: currentHeader || "",
      content: currentContent.trim(),
      previousContent: null,
      isRegenerating: false,
      isDirty: false,
    });
  }

  return sections;
}

export function assemblePrompt(sections: SectionState[]): string {
  return sections
    .filter((s) => s.header)
    .map((s) => `${s.header}\n${s.content}`)
    .join("\n\n");
}

export function calculateSectionsQualityScore(sections: SectionState[]): PromptQualityScore | null {
  if (sections.length === 0) return null;
  const prompt = assemblePrompt(sections);
  return calculateQualityScore(prompt);
}
