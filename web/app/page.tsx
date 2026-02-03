"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InputView } from "@/components/InputView";
import { OutputView } from "@/components/OutputView";
import { GenerateAnimation } from "@/components/GenerateAnimation";
import { usePromptGeneration } from "@/hooks/usePromptGeneration";
import { useSectionManagement } from "@/hooks/useSectionManagement";
import { usePromptHistory } from "@/hooks/usePromptHistory";
import { SavedPrompt } from "@/hooks/usePromptHistory";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "input" | "output";

// Section headers for animation
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

export default function Home() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // View state
  const [view, setView] = useState<ViewState>("input");
  const [currentPromptId, setCurrentPromptId] = useState<string | undefined>();

  // Animation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Input state
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");

  // Hooks
  const {
    sections,
    setSections,
    qualityScore,
    isLoading,
    error,
    businessContext,
    generatedPrompt,
    streamingText,
    generatePrompt,
  } = usePromptGeneration();

  const { regenerateSection, undoSection, editSection } = useSectionManagement({
    sections,
    setSections,
  });

  const { prompts, addPrompt, searchPrompts } = usePromptHistory();

  // Filtered prompts based on search
  const filteredPrompts = searchQuery
    ? searchPrompts(searchQuery)
    : prompts;

  // Handle generate with animation
  const handleGenerate = useCallback(async () => {
    if (!googleMapsUrl.trim()) return;

    // Start animation
    setIsGenerating(true);
    setShowOutput(false);

    // Start the actual generation
    await generatePrompt(googleMapsUrl);

    // Animation will handle the transition
  }, [googleMapsUrl, generatePrompt]);

  // Handle animation complete
  const handleAnimationComplete = useCallback(() => {
    setIsGenerating(false);
    setShowOutput(true);
    setView("output");

    // Save to history after animation completes
    if (businessContext) {
      addPrompt({
        placeName: businessContext.name,
        url: googleMapsUrl,
        promptPreview: (generatedPrompt || streamingText).slice(0, 150) + "...",
        fullPrompt: generatedPrompt || streamingText,
        sections: sections,
      });
    }
  }, [businessContext, googleMapsUrl, generatedPrompt, streamingText, sections, addPrompt]);

  // Handle home click
  const handleHomeClick = useCallback(() => {
    setView("input");
    setGoogleMapsUrl("");
    setCurrentPromptId(undefined);
    setShowOutput(false);
    setIsGenerating(false);
  }, []);

  // Handle prompt selection from sidebar
  const handlePromptClick = useCallback((prompt: SavedPrompt) => {
    setGoogleMapsUrl(prompt.url);
    setCurrentPromptId(prompt.id);
    setView("output");
    setShowOutput(true);
  }, []);

  // Handle regenerate section
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

  // Handle undo section
  const handleUndoSection = useCallback(
    (header: string) => {
      undoSection(header);
    },
    [undoSection]
  );

  // Handle edit section
  const handleEditSection = useCallback(
    (header: string, newContent: string) => {
      editSection(header, newContent);
    },
    [editSection]
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Animation Overlay */}
      <GenerateAnimation
        isAnimating={isGenerating}
        businessName={businessContext?.name || "Business"}
        onAnimationComplete={handleAnimationComplete}
        sections={SECTION_HEADERS}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onHomeClick={handleHomeClick}
        prompts={filteredPrompts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPromptClick={handlePromptClick}
        currentPromptId={currentPromptId}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === "input" && !showOutput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ 
                opacity: 0, 
                scale: 0.9,
                transition: { duration: 0.3 }
              }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <InputView
                googleMapsUrl={googleMapsUrl}
                onUrlChange={setGoogleMapsUrl}
                onGenerate={handleGenerate}
                isLoading={isGenerating}
              />
            </motion.div>
          ) : (
            <motion.div
              key="output"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ 
                duration: 0.5,
                type: "spring",
                stiffness: 100,
                damping: 20,
              }}
              className="h-full w-full"
            >
              <OutputView
                googleMapsUrl={googleMapsUrl}
                onUrlChange={setGoogleMapsUrl}
                text={streamingText || generatedPrompt}
                isLoading={isLoading && !isGenerating}
                sections={sections}
                qualityScore={qualityScore}
                onRegenerateSection={handleRegenerateSection}
                onUndoSection={handleUndoSection}
                onEditSection={handleEditSection}
                onBack={handleHomeClick}
                showUrlInput={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="px-6 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg shadow-lg">
              {error}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
