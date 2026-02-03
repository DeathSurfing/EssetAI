"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InputView } from "@/components/InputView";
import { OutputView } from "@/components/OutputView";
import { usePromptGeneration } from "@/hooks/usePromptGeneration";
import { useSectionManagement } from "@/hooks/useSectionManagement";
import { usePromptHistory } from "@/hooks/usePromptHistory";
import { SavedPrompt } from "@/hooks/usePromptHistory";
import { motion, AnimatePresence } from "framer-motion";

type ViewState = "input" | "output";

export default function Home() {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // View state
  const [view, setView] = useState<ViewState>("input");
  const [currentPromptId, setCurrentPromptId] = useState<string | undefined>();

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

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!googleMapsUrl.trim()) return;

    await generatePrompt(googleMapsUrl);
    setView("output");

    // Save to history after successful generation
    // This will be called after the stream completes
    setTimeout(() => {
      if (businessContext && (generatedPrompt || streamingText)) {
        addPrompt({
          placeName: businessContext.name,
          url: googleMapsUrl,
          promptPreview:
            (generatedPrompt || streamingText).slice(0, 150) + "...",
          fullPrompt: generatedPrompt || streamingText,
          sections: sections,
        });
      }
    }, 1000);
  }, [
    googleMapsUrl,
    generatePrompt,
    businessContext,
    generatedPrompt,
    streamingText,
    sections,
    addPrompt,
  ]);

  // Handle home click
  const handleHomeClick = useCallback(() => {
    setView("input");
    setGoogleMapsUrl("");
    setCurrentPromptId(undefined);
  }, []);

  // Handle prompt selection from sidebar
  const handlePromptClick = useCallback((prompt: SavedPrompt) => {
    setGoogleMapsUrl(prompt.url);
    setCurrentPromptId(prompt.id);
    setView("output");
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
          {view === "input" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <InputView
                googleMapsUrl={googleMapsUrl}
                onUrlChange={setGoogleMapsUrl}
                onGenerate={handleGenerate}
                isLoading={isLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="output"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full w-full"
            >
              <OutputView
                googleMapsUrl={googleMapsUrl}
                onUrlChange={setGoogleMapsUrl}
                text={streamingText || generatedPrompt}
                isLoading={isLoading}
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
        {error && (
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
