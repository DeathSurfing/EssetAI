"use client";

import * as React from "react";
import { useState } from "react";
import { Container } from "@/components/Container";
import { Header } from "@/components/Header";
import { PromptInput } from "@/components/PromptInput";
import { BuilderToggle } from "@/components/BuilderToggle";
import { StreamingPromptOutput as PromptOutput } from "@/components/StreamingPromptOutput";
import { PromptQualityScoreDisplay } from "@/components/PromptQualityScore";
import { Button } from "@/components/ui/button";
import { calculateQualityScore, PromptQualityScore } from "@/lib/prompt-quality";

type BuilderType = "lovable" | "framer" | "webflow";

export default function Home() {
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [builder, setBuilder] = useState<BuilderType>("lovable");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [qualityScore, setQualityScore] = useState<PromptQualityScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async () => {
    if (!googleMapsUrl.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedPrompt("");
    setQualityScore(null);
    
    try {
      console.log("Submitting URL:", googleMapsUrl);
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleMapsUrl,
          builder,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received response:", data);
      
      if (data.prompt) {
        setGeneratedPrompt(data.prompt);
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
          
          <PromptOutput text={generatedPrompt} />
          
          {qualityScore && <PromptQualityScoreDisplay score={qualityScore} />}
        </div>
      </Container>
    </div>
  );
}
