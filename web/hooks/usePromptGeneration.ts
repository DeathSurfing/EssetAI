"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { parseGoogleMapsUrlSync } from "@/lib/location-parser";
import { PromptQualityScore } from "@/lib/prompt-quality";
import { SectionState, parseSections, calculateSectionsQualityScore } from "@/lib/prompt-parser";

interface BusinessContext {
  name: string;
  location: string;
}

interface UsePromptGenerationReturn {
  sections: SectionState[];
  setSections: React.Dispatch<React.SetStateAction<SectionState[]>>;
  qualityScore: PromptQualityScore | null;
  isLoading: boolean;
  error: string | null;
  businessContext: BusinessContext | null;
  generatedPrompt: string;
  streamingText: string;
  generatePrompt: (googleMapsUrl: string, parsedLocation?: any) => Promise<void>;
  clearError: () => void;
}

export function usePromptGeneration(): UsePromptGenerationReturn {
  const [sections, setSections] = useState<SectionState[]>([]);
  const [qualityScore, setQualityScore] = useState<PromptQualityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [streamingText, setStreamingText] = useState("");

  // Track generation usage
  const trackGeneration = useMutation(api.generations.trackGeneration);

  const generatedPrompt = sections
    .filter((s) => s.header)
    .map((s) => `${s.header}\n${s.content}`)
    .join("\n\n");

const generatePrompt = useCallback(async (googleMapsUrl: string, parsedLocation?: any) => {
    if (!googleMapsUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setSections([]);
    setQualityScore(null);
    setStreamingText("");

    try {
      console.log("Submitting URL:", googleMapsUrl);

      // Use client-parsed location if available, otherwise parse on server
      let location;
      if (parsedLocation) {
        location = parsedLocation;
        console.log("Using client-parsed location:", location);
      } else {
        // Fallback to sync parsing for backward compatibility
        location = parseGoogleMapsUrlSync(googleMapsUrl);
        console.log("Using fallback sync parsing:", location);
      }
      
      setBusinessContext({
        name: location.businessName || "Local Business",
        location: location.locality || location.city || location.area || "Unknown location",
      });

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleMapsUrl,
          parsedLocation: location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON (error) instead of text stream
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Server returned JSON instead of stream");
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
        setStreamingText(fullText);
      }

      console.log("Received full text, length:", fullText.length);
      console.log("Text preview:", fullText.substring(0, 100));

      if (fullText.trim().length === 0) {
        console.error("Empty response received. Status:", response.status, "Headers:", Object.fromEntries(response.headers.entries()));
        throw new Error("No prompt in response. The AI service may be temporarily unavailable or the API key may be invalid.");
      }

      // Parse sections from the complete text
      const parsedSections = parseSections(fullText);
      setSections(parsedSections);
      const score = calculateSectionsQualityScore(parsedSections);
      setQualityScore(score);

      // Track generation usage
      try {
        await trackGeneration({ type: "full" });
      } catch (trackError) {
        console.error("Failed to track generation:", trackError);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate prompt");
    } finally {
      setIsLoading(false);
    }
  }, [trackGeneration]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sections,
    setSections,
    qualityScore,
    isLoading,
    error,
    businessContext,
    generatedPrompt,
    streamingText,
    generatePrompt,
    clearError,
  };
}
