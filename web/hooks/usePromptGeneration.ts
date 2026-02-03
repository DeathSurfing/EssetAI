"use client";

import { useState, useCallback } from "react";
import { parseGoogleMapsUrl } from "@/lib/location-parser";
import { PromptQualityScore } from "@/lib/prompt-quality";
import { SectionState, parseSections, calculateSectionsQualityScore } from "@/lib/prompt-parser";

interface BusinessContext {
  name: string;
  location: string;
}

interface UsePromptGenerationReturn {
  sections: SectionState[];
  qualityScore: PromptQualityScore | null;
  isLoading: boolean;
  error: string | null;
  businessContext: BusinessContext | null;
  generatedPrompt: string;
  generatePrompt: (googleMapsUrl: string) => Promise<void>;
  clearError: () => void;
}

export function usePromptGeneration(): UsePromptGenerationReturn {
  const [sections, setSections] = useState<SectionState[]>([]);
  const [qualityScore, setQualityScore] = useState<PromptQualityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);

  const generatedPrompt = sections
    .filter((s) => s.header)
    .map((s) => `${s.header}\n${s.content}`)
    .join("\n\n");

  const generatePrompt = useCallback(async (googleMapsUrl: string) => {
    if (!googleMapsUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setSections([]);
    setQualityScore(null);

    try {
      console.log("Submitting URL:", googleMapsUrl);

      const location = parseGoogleMapsUrl(googleMapsUrl);
      setBusinessContext({
        name: location.businessName || "Local Business",
        location: location.locality || location.city || location.area || "Unknown location",
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleMapsUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received response:", data);

      if (data.prompt) {
        const parsedSections = parseSections(data.prompt);
        setSections(parsedSections);
        const score = calculateSectionsQualityScore(parsedSections);
        setQualityScore(score);
      } else {
        throw new Error("No prompt in response");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate prompt");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sections,
    qualityScore,
    isLoading,
    error,
    businessContext,
    generatedPrompt,
    generatePrompt,
    clearError,
  };
}
