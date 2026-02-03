"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Container } from "@/components/Container";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { BuilderToggle } from "@/components/BuilderToggle";
import { StreamingPromptOutput } from "@/components/StreamingPromptOutput";
import { PromptQualityScoreDisplay } from "@/components/PromptQualityScore";
import { Button } from "@/components/ui/button";
import { calculateQualityScore, PromptQualityScore } from "@/lib/prompt-quality";

type BuilderType = "lovable" | "framer" | "webflow";

export default function Home() {
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [builder, setBuilder] = useState<BuilderType>("lovable");
  const [qualityScore, setQualityScore] = useState<PromptQualityScore | null>(null);
  
  const { completion, isLoading, complete, error } = useCompletion({
    api: "/api/generate",
    onFinish: (prompt) => {
      const score = calculateQualityScore(prompt);
      setQualityScore(score);
    },
  });
  
  const handleSubmit = useCallback(async () => {
    if (!googleMapsUrl.trim() || isLoading) return;
    
    setQualityScore(null);
    await complete("", {
      body: {
        googleMapsUrl,
        builder,
      },
    });
  }, [googleMapsUrl, builder, isLoading, complete]);
  
  const builderLabels: Record<BuilderType, string> = {
    lovable: "Lovable",
    framer: "Framer",
    webflow: "Webflow AI",
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-8">
        <Header />
        
        <div className="space-y-6">
          <PromptInput
            value={googleMapsUrl}
            onChange={setGoogleMapsUrl}
            disabled={isLoading}
          />
          
          <BuilderToggle
            value={builder}
            onChange={setBuilder}
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
                Generating for {builderLabels[builder]}...
              </>
            ) : (
              `Generate ${builderLabels[builder]} Prompt`
            )}
          </Button>
          
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              Error: {error.message}
            </div>
          )}
          
          <StreamingPromptOutput
            text={completion}
            isLoading={isLoading}
          />
          
          <PromptQualityScoreDisplay score={qualityScore} />
        </div>
      </Container>
    </div>
  );
}
