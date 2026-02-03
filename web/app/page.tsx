"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { Container } from "@/components/Container";
import { Header } from "@/components/Header";
import { PromptInputWithMap } from "@/components/PromptInputWithMap";
import { StreamingPromptOutput as PromptOutput } from "@/components/StreamingPromptOutput";
import { PromptQualityScoreDisplay } from "@/components/PromptQualityScore";
import { Button } from "@/components/ui/button";
import { usePromptGeneration } from "@/hooks/usePromptGeneration";
import { useSectionManagement } from "@/hooks/useSectionManagement";

export default function Home() {
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const {
    sections,
    qualityScore,
    isLoading,
    error,
    businessContext,
    generatedPrompt,
    generatePrompt,
  } = usePromptGeneration();

  const { regenerateSection, undoSection, editSection } = useSectionManagement();

  const mainRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const charCountRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const emptyStateRef = useRef<HTMLDivElement>(null);

  // Page entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

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

  const handleButtonClick = useCallback(() => {
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
    generatePrompt(googleMapsUrl);
  }, [googleMapsUrl, generatePrompt]);

  const handleRegenerateSection = useCallback(
    async (header: string, customPrompt: string) => {
      try {
        await regenerateSection(header, customPrompt, businessContext);
      } catch (err) {
        console.error("Regenerate error:", err);
      }
    },
    [regenerateSection, businessContext]
  );

  const handleUndoSection = useCallback(
    (header: string) => {
      undoSection(header);
    },
    [undoSection]
  );

  const handleEditSection = useCallback(
    (header: string, newContent: string) => {
      editSection(header, newContent);
    },
    [editSection]
  );

  return (
    <div ref={mainRef} className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Container className="py-12 px-4 sm:px-6 lg:px-8">
        <div ref={contentRef} className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-10">
            <Header />
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-shadow duration-300">
            <PromptInputWithMap value={googleMapsUrl} onChange={setGoogleMapsUrl} disabled={isLoading} />
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
                <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
