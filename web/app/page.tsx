"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
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
  
  // Refs for animated elements
  const mainRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const charCountRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);
  
  // Page entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate main container
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
      
      // Animate content children with stagger
      if (contentRef.current) {
        const children = contentRef.current.children;
        gsap.fromTo(
          children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2,
          }
        );
      }
    });
    
    return () => ctx.revert();
  }, []);
  
  // Animate character count when it appears
  useEffect(() => {
    if (generatedPrompt && charCountRef.current) {
      gsap.fromTo(
        charCountRef.current,
        { opacity: 0, scale: 0.9, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [generatedPrompt]);
  
  // Animate error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(
        errorRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [error]);
  
  // Animate empty state
  useEffect(() => {
    if (!generatedPrompt && !isLoading && !error && emptyStateRef.current) {
      gsap.fromTo(
        emptyStateRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 }
      );
    }
  }, [generatedPrompt, isLoading, error]);
  
  // Button click animation
  const handleButtonClick = () => {
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.in",
        onComplete: () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            duration: 0.15,
            ease: "elastic.out(1, 0.5)",
          });
        },
      });
    }
    handleSubmit();
  };
  
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
    <div 
      ref={mainRef}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      <Container className="py-12 px-4 sm:px-6 lg:px-8">
        <div ref={contentRef} className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-10">
            <Header />
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-shadow duration-300">
            <PromptInputWithMap
              value={googleMapsUrl}
              onChange={setGoogleMapsUrl}
              disabled={isLoading}
            />
          </div>
          
          <Button
            ref={buttonRef}
            onClick={handleButtonClick}
            disabled={!googleMapsUrl.trim() || isLoading}
            className="w-full bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:via-primary hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-xl py-6 text-lg font-semibold"
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
            <div 
              ref={errorRef}
              className="p-4 rounded-xl bg-gradient-to-r from-destructive/10 to-destructive/5 text-destructive text-sm border border-destructive/20 shadow-sm"
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {generatedPrompt && (
            <div 
              ref={charCountRef}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-sm font-medium border border-primary/20 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Generated {generatedPrompt.length} characters
            </div>
          )}
          
          {!generatedPrompt && !isLoading && !error && (
            <div 
              ref={emptyStateRef}
              className="text-center py-16 px-6 rounded-2xl bg-gradient-to-b from-muted/30 to-muted/10 border border-border/30"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-primary/60" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground text-base">
                Enter a Google Maps URL above and click Generate to create a professional website prompt
              </p>
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
          
          {qualityScore && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PromptQualityScoreDisplay score={qualityScore} />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
