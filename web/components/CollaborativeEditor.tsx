"use client";

import * as React from "react";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SectionState, assemblePrompt, parseSections } from "@/lib/prompt-parser";
import { cn } from "@/lib/utils";
import { Users, PencilLine, Radio, Eye, Sparkles, Activity } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CollaborativeEditorProps {
  promptId: string;
  sections: SectionState[];
  onSectionsChange: (sections: SectionState[]) => void;
  children: React.ReactNode;
}

interface Collaborator {
  userId: Id<"users">;
  name: string;
  avatar?: string;
  cursor?: {
    sectionIndex: number;
    position: number;
  };
  isTyping?: boolean;
  joinedAt: number;
}

// Vibrant, energetic color palette for collaborators
const COLLABORATOR_COLORS = [
  { bg: "bg-fuchsia-500", text: "text-fuchsia-500", border: "border-fuchsia-400", glow: "shadow-fuchsia-500/40" },
  { bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-400", glow: "shadow-cyan-500/40" },
  { bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-400", glow: "shadow-rose-500/40" },
  { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-400", glow: "shadow-amber-500/40" },
  { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-400", glow: "shadow-emerald-500/40" },
  { bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-400", glow: "shadow-violet-500/40" },
  { bg: "bg-sky-500", text: "text-sky-500", border: "border-sky-400", glow: "shadow-sky-500/40" },
  { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-400", glow: "shadow-orange-500/40" },
];

// Get consistent color for a user
function getCollaboratorColor(userId: string): (typeof COLLABORATOR_COLORS)[0] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Typing indicator with animated dots
function TypingDots({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-current"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Pulse animation for online indicator
function OnlineIndicator({ color }: { color: string }) {
  return (
    <div className="relative flex h-2.5 w-2.5">
      <motion.span
        className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", color)}
        animate={{ scale: [1, 2], opacity: [0.75, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)} />
    </div>
  );
}

// Collaborator avatar with presence indicators
function CollaboratorAvatar({
  collaborator,
  isCurrentUser = false,
  onHover,
}: {
  collaborator: Collaborator;
  isCurrentUser?: boolean;
  onHover?: (show: boolean) => void;
}) {
  const color = useMemo(() => getCollaboratorColor(collaborator.userId), [collaborator.userId]);
  const displayName = useMemo(() => collaborator.name.split(" ")[0], [collaborator.name]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 10 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="relative group"
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      {/* Glow effect for typing */}
      {collaborator.isTyping && (
        <motion.div
          className={cn(
            "absolute -inset-1 rounded-full blur-md opacity-60",
            color.bg
          )}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Avatar */}
      <div
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-full",
          "border-2 bg-background shadow-lg",
          "transition-transform duration-200",
          "hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-offset-background",
          color.border,
          isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          collaborator.isTyping && ["ring-2", color.border]
        )}
      >
        {collaborator.avatar ? (
          <Avatar className="w-full h-full">
            <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
            <AvatarFallback className={cn("text-xs font-semibold", color.bg, "text-white")}>
              {getInitials(collaborator.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className={cn("text-xs font-bold", color.text)}>
            {getInitials(collaborator.name)}
          </span>
        )}

        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineIndicator color={color.bg} />
        </div>

        {/* Typing indicator */}
        {collaborator.isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className={cn(
              "absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5",
              "rounded-full text-[8px] font-medium",
              "bg-background border shadow-sm",
              color.border,
              color.text
            )}
          >
            <TypingDots />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Typing status badge
function TypingBadge({ collaborators }: { collaborators: Collaborator[] }) {
  const typingCollaborators = useMemo(
    () => collaborators.filter((c) => c.isTyping),
    [collaborators]
  );

  if (typingCollaborators.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/80 backdrop-blur-sm border"
    >
      <div className="flex -space-x-2">
        {typingCollaborators.slice(0, 3).map((c) => {
          const color = getCollaboratorColor(c.userId);
          return (
            <div
              key={c.userId}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold",
                "border border-background",
                color.bg,
                "text-white"
              )}
            >
              {getInitials(c.name)[0]}
            </div>
          );
        })}
      </div>
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        {typingCollaborators.length === 1 ? (
          <>
            {typingCollaborators[0].name.split(" ")[0]} is typing
            <TypingDots className="ml-1" />
          </>
        ) : typingCollaborators.length === 2 ? (
          <>
            {typingCollaborators.map((c) => c.name.split(" ")[0]).join(" and ")} are typing
          </>
        ) : (
          <>
            {typingCollaborators.length} people are typing
            <TypingDots className="ml-1" />
          </>
        )}
      </span>
    </motion.div>
  );
}

// Connection status indicator
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium",
        isConnected
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
      )}
    >
      {isConnected ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Live
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Syncing...
        </>
      )}
    </motion.div>
  );
}

export function CollaborativeEditor({
  promptId,
  sections,
  onSectionsChange,
  children,
}: CollaborativeEditorProps) {
  // Convex mutations
  const joinSession = useMutation(api.collaboration.joinSession);
  const leaveSession = useMutation(api.collaboration.leaveSession);
  const applyEditMutation = useMutation(api.collaboration.applyEdit);
  const setTypingStatus = useMutation(api.collaboration.setTypingStatus);

  // Convex queries
  const collaborators = useQuery(api.collaboration.getActiveCollaborators, {
    promptId: promptId as Id<"prompts">,
  });
  const prompt = useQuery(api.prompts.getPrompt, { id: promptId as Id<"prompts"> });

  // Refs for debouncing and tracking state
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedSectionsRef = useRef<SectionState[]>([]);
  const isApplyingEditRef = useRef(false);

  // Join session on mount, leave on unmount
  useEffect(() => {
    let isMounted = true;

    const join = async () => {
      try {
        console.log("[CollaborativeEditor] Joining session for prompt:", promptId);
        const result = await joinSession({ promptId: promptId as Id<"prompts"> });
        console.log("[CollaborativeEditor] Successfully joined session:", result);
      } catch (error) {
        console.error("[CollaborativeEditor] Failed to join collaborative session:", error);
      }
    };

    if (isMounted) {
      join();
    }

    return () => {
      isMounted = false;
      // Leave session on unmount
      leaveSession({ promptId: promptId as Id<"prompts"> }).catch((error) => {
        console.error("Failed to leave collaborative session:", error);
      });

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [promptId, joinSession, leaveSession]);

  // Sync external prompt changes to local state
  useEffect(() => {
    if (!prompt || !prompt.sections || isApplyingEditRef.current) return;

    // Only sync if sections have changed from external source
    const externalSections: SectionState[] = prompt.sections.map((s) => ({
      header: s.header,
      content: s.content,
      previousContent: null,
      isRegenerating: false,
      isDirty: false,
    }));

    // Check if sections are different from current local state
    const currentPrompt = assemblePrompt(sections);
    const externalPrompt = assemblePrompt(externalSections);

    if (currentPrompt !== externalPrompt && externalPrompt !== assemblePrompt(lastSyncedSectionsRef.current)) {
      // Update local state with external changes
      onSectionsChange(externalSections);
      lastSyncedSectionsRef.current = externalSections;
    }
  }, [prompt, sections, onSectionsChange]);

  // Apply edit to Convex
  const applyEdit = useCallback(
    async (sectionIndex: number, newContent: string) => {
      if (!sections[sectionIndex]) return;

      const oldContent = sections[sectionIndex].content;
      if (oldContent === newContent) return;

      try {
        isApplyingEditRef.current = true;

        // Update local state immediately for responsive UI
        const updatedSections = [...sections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          content: newContent,
          isDirty: true,
        };
        onSectionsChange(updatedSections);

        // Send to Convex
        await applyEditMutation({
          promptId: promptId as Id<"prompts">,
          sectionIndex,
          operation: "replace",
          oldContent,
          newContent,
        });

        lastSyncedSectionsRef.current = updatedSections;
      } catch (error) {
        console.error("Failed to apply edit:", error);
        // Revert to old content on error
        const revertedSections = [...sections];
        revertedSections[sectionIndex] = {
          ...revertedSections[sectionIndex],
          content: oldContent,
        };
        onSectionsChange(revertedSections);
      } finally {
        isApplyingEditRef.current = false;
      }
    },
    [sections, promptId, applyEditMutation, onSectionsChange]
  );

  // Set typing status with debouncing
  const handleTypingStart = useCallback(() => {
    setTypingStatus({
      promptId: promptId as Id<"prompts">,
      isTyping: true,
    }).catch((error) => {
      console.error("Failed to set typing status:", error);
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing status to false after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus({
        promptId: promptId as Id<"prompts">,
        isTyping: false,
      }).catch((error) => {
        console.error("Failed to set typing status:", error);
      });
    }, 2000);
  }, [promptId, setTypingStatus]);

  // Memoized values
  const sortedCollaborators = useMemo(() => {
    if (!collaborators) return [];
    return [...collaborators].sort((a, b) => {
      // Sort typing users first
      if (a.isTyping && !b.isTyping) return -1;
      if (!a.isTyping && b.isTyping) return 1;
      return 0;
    });
  }, [collaborators]);

  const typingCount = useMemo(
    () => (collaborators || []).filter((c: Collaborator) => c.isTyping).length,
    [collaborators]
  );

  const isLoading = !collaborators || !prompt;

  return (
    <div className="relative flex flex-col h-full">
      {/* Collaboration bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="sticky top-0 z-20 px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Title and status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-cyan-500/20 border border-primary/20">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Collaboration</span>
                <span className="text-xs text-muted-foreground">
                  {isLoading ? "Connecting..." : `${sortedCollaborators.length} active`}
                </span>
              </div>
            </div>

            {/* Connection status */}
            {!isLoading && (
              <ConnectionStatus isConnected={!!collaborators && !!prompt} />
            )}
          </div>

          {/* Center: Typing indicator */}
          <AnimatePresence mode="wait">
            {typingCount > 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="hidden sm:flex"
              >
                <TypingBadge collaborators={sortedCollaborators as Collaborator[]} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Collaborator avatars */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full border-2 border-muted animate-pulse bg-muted/50" />
                <div className="w-9 h-9 rounded-full border-2 border-muted animate-pulse bg-muted/50 -ml-3" />
              </div>
            ) : sortedCollaborators.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground/50">
                <Eye className="w-4 h-4" />
                <span className="text-xs">No viewers</span>
              </div>
            ) : (
              <div className="flex items-center">
                <AnimatePresence mode="popLayout">
                  {sortedCollaborators.slice(0, 5).map((collaborator) => (
                    <div
                      key={collaborator.userId}
                      className="-ml-2 first:ml-0"
                    >
                      <CollaboratorAvatar
                        collaborator={collaborator as Collaborator}
                      />
                    </div>
                  ))}
                </AnimatePresence>

                {sortedCollaborators.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                      "border-2 border-dashed border-muted-foreground/30 bg-muted/50",
                      "-ml-2"
                    )}
                  >
                    +{sortedCollaborators.length - 5}
                  </motion.div>
                )}

                {/* Live badge */}
                <Badge
                  variant="outline"
                  className="ml-3 bg-background/50 backdrop-blur-sm border-primary/20"
                >
                  <Sparkles className="w-3 h-3 mr-1 text-primary" />
                  Live
                </Badge>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Collaborative context provider */}
        <CollaborativeContext.Provider
          value={{
            promptId,
            collaborators: sortedCollaborators as Collaborator[],
            onTypingStart: handleTypingStart,
            applyEdit,
            isConnected: !isLoading,
          }}
        >
          {children}
        </CollaborativeContext.Provider>

        {/* Floating typing indicator (mobile) */}
        <AnimatePresence>
          {typingCount > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="sm:hidden absolute bottom-4 left-4 right-4 z-30"
            >
              <TypingBadge collaborators={sortedCollaborators as Collaborator[]} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="px-4 py-2 bg-muted/30 border-t border-border/50 text-xs text-muted-foreground"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              {sections.filter((s) => s.isDirty).length} unsaved changes
            </span>
            {prompt?.version && (
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                Version {prompt.version}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5">
            <PencilLine className="w-3 h-3" />
            Last synced: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// Context for child components to access collaborative features
interface CollaborativeContextType {
  promptId: string;
  collaborators: Collaborator[];
  onTypingStart: () => void;
  applyEdit: (sectionIndex: number, newContent: string) => Promise<void>;
  isConnected: boolean;
}

const CollaborativeContext = React.createContext<CollaborativeContextType | null>(null);

// Hook for child components
export function useCollaborativeEditor() {
  const context = React.useContext(CollaborativeContext);
  if (!context) {
    throw new Error("useCollaborativeEditor must be used within a CollaborativeEditor");
  }
  return context;
}

export default CollaborativeEditor;
