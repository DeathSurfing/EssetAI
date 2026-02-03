"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { InputView } from "@/components/InputView";
import { OutputView } from "@/components/OutputView";
import { GenerateAnimation } from "@/components/GenerateAnimation";
import { usePromptGeneration } from "@/hooks/usePromptGeneration";
import { useSectionManagement } from "@/hooks/useSectionManagement";
import { usePromptHistory, convertConvexPrompt } from "@/hooks/usePromptHistory";
import { SavedPrompt } from "@/hooks/usePromptHistory";
import { PromptMigration } from "@/components/auth/PromptMigration";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { SectionState } from "@/lib/prompt-parser";

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

  // Track if we need to save after generation
  const pendingSaveRef = useRef<{
    url: string;
    businessName: string;
  } | null>(null);

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

  const { regenerateSection, undoSection, editSection, syncSections } = useSectionManagement({
    sections,
    setSections,
    promptId: currentPromptId,
  });

  const { prompts, addPrompt, deletePrompt, searchPrompts } = usePromptHistory();
  const { user } = useAuth();

  // Fetch prompt access info when viewing a specific prompt
  const promptAccess = useQuery(
    api.collaborationInvites.getPromptAccess,
    currentPromptId ? { promptId: currentPromptId as any } : "skip"
  );

  // Fetch collaborators for the current prompt
  const collaborators = useQuery(
    api.collaborationInvites.getCollaborators,
    currentPromptId ? { promptId: currentPromptId as any } : "skip"
  );

  // Fetch current user info for role
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? {} : "skip"
  );

  // Fetch shared prompts (where user is a collaborator)
  const sharedPrompts = useQuery(
    api.prompts.getSharedPrompts,
    user ? {} : "skip"
  );

  // Filtered prompts based on search
  const filteredPrompts = searchQuery
    ? searchPrompts(searchQuery)
    : prompts;

  // Save prompt after generation completes
  useEffect(() => {
    const savePrompt = async () => {
      if (
        pendingSaveRef.current &&
        !isLoading &&
        sections.length > 0 &&
        businessContext
      ) {
        // Generation is complete, save the prompt
        const promptId = await addPrompt({
          placeName: businessContext.name,
          url: pendingSaveRef.current.url,
          promptPreview: generatedPrompt.slice(0, 150) + "...",
          fullPrompt: generatedPrompt,
          sections: sections,
        });
        
        // Store the prompt ID for sharing
        setCurrentPromptId(promptId);
        
        // Clear the pending save
        pendingSaveRef.current = null;
      }
    };
    
    savePrompt();
  }, [isLoading, sections, businessContext, generatedPrompt, addPrompt]);

// Handle generate with animation
  const handleGenerate = useCallback(async (parsedLocation?: any) => {
    if (!googleMapsUrl.trim()) return;

    // Start animation
    setIsGenerating(true);
    setShowOutput(false);

    // Store pending save info - we'll update this after generation
    pendingSaveRef.current = {
      url: googleMapsUrl,
      businessName: parsedLocation?.businessName || businessContext?.name || "Business",
    };

    // Start actual generation with parsed location
    await generatePrompt(googleMapsUrl, parsedLocation);

    // Update pending save with actual business context
    if (businessContext && pendingSaveRef.current) {
      pendingSaveRef.current.businessName = businessContext.name;
    }

    // Animation will handle the transition
  }, [googleMapsUrl, generatePrompt, businessContext]);

  // Handle animation complete
  const handleAnimationComplete = useCallback(() => {
    setIsGenerating(false);
    setShowOutput(true);
    setView("output");
  }, []);

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
    // Load the saved prompt data into state
    setGoogleMapsUrl(prompt.url);
    setCurrentPromptId(prompt.id);
    setSections(prompt.sections);
    setView("output");
    setShowOutput(true);
  }, [setSections]);

  // Handle shared prompt selection from sidebar
  const handleSharedPromptClick = useCallback((prompt: any) => {
    // Load the shared prompt data into state
    setGoogleMapsUrl(prompt.url);
    setCurrentPromptId(prompt._id);
    setSections(prompt.sections);
    setView("output");
    setShowOutput(true);
  }, [setSections]);

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
      {/* Prompt Migration - Auto-migrates localStorage to Convex on login */}
      <PromptMigration />

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
        onDeletePrompt={deletePrompt}
        currentPromptId={currentPromptId}
        sharedPrompts={(sharedPrompts || []).map(convertConvexPrompt)}
        onSharedPromptClick={handleSharedPromptClick}
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
                onSyncSections={syncSections}
                onBack={handleHomeClick}
                promptId={currentPromptId}
                isOwner={promptAccess?.access === "owner"}
                userRole={currentUser?.role || "free"}
                shareMode={promptAccess?.access === "collaborator" ? "edit" : "view"}
                isPublic={false}
                collaborators={collaborators || []}
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
