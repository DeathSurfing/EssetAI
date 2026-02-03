"use client";

import * as React from "react";
import { useState } from "react";
import { Container } from "@/components/Container";
import { Header } from "@/components/Header";
import { PromptInputWithMap } from "@/components/PromptInputWithMap";
import { StreamingPromptOutput as PromptOutput } from "@/components/StreamingPromptOutput";
import { PromptQualityScoreDisplay } from "@/components/PromptQualityScore";
import { Button } from "@/components/ui/button";
import { calculateQualityScore, PromptQualityScore } from "@/lib/prompt-quality";
import { parseGoogleMapsUrl } from "@/lib/location-parser";

type SectionState = {
  header: string;
  content: string;
  previousContent: string | null;
  isRegenerating: boolean;
  isDirty: boolean;
};

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

function parseSections(text: string): SectionState[] {
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

function assemblePrompt(sections: SectionState[]): string {
  return sections
    .filter(s => s.header)
    .map(s => `${s.header}\n${s.content}`)
    .join("\n\n");
}

export default function Home() {
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [sections, setSections] = useState<SectionState[]>([]);
  const [qualityScore, setQualityScore] = useState<PromptQualityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessContext, setBusinessContext] = useState<{ name: string; location: string } | null>(null);
  
  const generatedPrompt = assemblePrompt(sections);
  
  const handleSubmit = async () => {
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
        const score = calculateQualityScore(data.prompt);
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
  };
  
  const handleRegenerateSection = async (header: string, customPrompt: string) => {
    if (!businessContext) return;
    
    const sectionIndex = sections.findIndex(s => s.header === header);
    if (sectionIndex === -1) return;
    
    // Mark section as regenerating
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex ? { ...s, isRegenerating: true } : s
    ));
    
    try {
      const section = sections[sectionIndex];
      
      const response = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName: header,
          sectionContent: section.content,
          allSections: sections.map(s => ({ header: s.header, content: s.content })),
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
        setSections(prev => prev.map((s, i) => 
          i === sectionIndex 
            ? { ...s, content: data.section, previousContent: s.content, isRegenerating: false, isDirty: true }
            : s
        ));
        
        // Recalculate quality score with new prompt
        const newPrompt = assemblePrompt(sections.map((s, i) => 
          i === sectionIndex ? { ...s, content: data.section } : s
        ));
        const score = calculateQualityScore(newPrompt);
        setQualityScore(score);
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      setError(err instanceof Error ? err.message : "Failed to regenerate section");
      setSections(prev => prev.map((s, i) => 
        i === sectionIndex ? { ...s, isRegenerating: false } : s
      ));
    }
  };
  
  const handleUndoSection = (header: string) => {
    const sectionIndex = sections.findIndex(s => s.header === header);
    if (sectionIndex === -1) return;
    
    const section = sections[sectionIndex];
    if (!section.previousContent) return;
    
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex 
        ? { ...s, content: s.previousContent!, previousContent: null, isDirty: false }
        : s
    ));
    
    // Recalculate quality score
    const newPrompt = assemblePrompt(sections.map((s, i) => 
      i === sectionIndex ? { ...s, content: s.previousContent! } : s
    ));
    const score = calculateQualityScore(newPrompt);
    setQualityScore(score);
  };
  
  const handleEditSection = (header: string, newContent: string) => {
    const sectionIndex = sections.findIndex(s => s.header === header);
    if (sectionIndex === -1) return;
    
    setSections(prev => prev.map((s, i) => 
      i === sectionIndex 
        ? { ...s, content: newContent, previousContent: s.previousContent || s.content, isDirty: true }
        : s
    ));
    
    // Recalculate quality score
    const newPrompt = assemblePrompt(sections.map((s, i) => 
      i === sectionIndex ? { ...s, content: newContent } : s
    ));
    const score = calculateQualityScore(newPrompt);
    setQualityScore(score);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        <Header />
        
        <div className="space-y-6">
          <PromptInputWithMap
            value={googleMapsUrl}
            onChange={setGoogleMapsUrl}
            disabled={isLoading}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={!googleMapsUrl.trim() || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating...
              </>
            ) : (
              "Generate Prompt"
            )}
          </Button>
          
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {generatedPrompt && (
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Generated {generatedPrompt.length} characters
            </div>
          )}
          
          {!generatedPrompt && !isLoading && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Enter a Google Maps URL and click Generate to create a website prompt</p>
            </div>
          )}
          
          <PromptOutput 
            text={generatedPrompt}
            isLoading={isLoading}
            sections={sections}
            onRegenerateSection={handleRegenerateSection}
            onUndoSection={handleUndoSection}
            onEditSection={handleEditSection}
          />
          
          {qualityScore && <PromptQualityScoreDisplay score={qualityScore} />}
        </div>
      </Container>
    </div>
  );
}
