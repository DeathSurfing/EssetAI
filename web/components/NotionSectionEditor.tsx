"use client";

import * as React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Lock, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface NotionSectionEditorProps {
  sectionIndex: number;
  header: string;
  content: string;
  promptId: string;
  onContentChange: (newContent: string) => void;
  className?: string;
}

interface ActiveEditor {
  userId: string;
  userName: string;
  userAvatar?: string;
  sectionIndex: number;
  lockedAt: number;
  isOtherUser: boolean;
}

export function NotionSectionEditor({
  sectionIndex,
  header,
  content,
  promptId,
  onContentChange,
  className,
}: NotionSectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convex mutations
  const lockSection = useMutation(api.collaboration.lockSection);
  const unlockSection = useMutation(api.collaboration.unlockSection);

  // Query active editors for this prompt
  const activeEditors = useQuery(api.collaboration.getActiveEditors, {
    promptId: promptId as Id<"prompts">,
  });

  // Check if this section is locked by another user
  const lockedByOther = activeEditors?.find(
    (editor) => editor.sectionIndex === sectionIndex && editor.isOtherUser
  );

  // Check if locked by current user
  const lockedByMe = activeEditors?.find(
    (editor) => editor.sectionIndex === sectionIndex && !editor.isOtherUser
  );

  // Sync local content when external changes come in (only when not editing)
  useEffect(() => {
    if (!isEditing && content !== localContent) {
      setLocalContent(content);
      setHasChanges(false);
    }
  }, [content, isEditing, localContent]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        localContent.length,
        localContent.length
      );
    }
  }, [isEditing, localContent.length]);

  const handleClick = useCallback(async () => {
    if (lockedByOther) {
      toast.info(`${lockedByOther.userName} is currently editing this section`);
      return;
    }

    try {
      console.log(`[NotionSectionEditor] Attempting to lock section ${sectionIndex} for prompt ${promptId}`);
      const result = await lockSection({
        promptId: promptId as Id<"prompts">,
        sectionIndex,
      });
      console.log(`[NotionSectionEditor] Successfully locked section:`, result);
      setIsEditing(true);
      setLocalContent(content);
    } catch (error) {
      console.error("[NotionSectionEditor] Failed to lock section:", error);
      toast.error("Could not start editing. Please try again.");
    }
  }, [lockedByOther, promptId, sectionIndex, content, lockSection]);

  const handleBlur = useCallback(async () => {
    if (!isEditing) return;

    try {
      // Save changes if any
      if (hasChanges && localContent !== content) {
        onContentChange(localContent);
      }

      await unlockSection({
        promptId: promptId as Id<"prompts">,
        sectionIndex,
      });

      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to unlock section:", error);
    }
  }, [
    isEditing,
    hasChanges,
    localContent,
    content,
    promptId,
    sectionIndex,
    unlockSection,
    onContentChange,
  ]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalContent(e.target.value);
      setHasChanges(true);
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Save on Cmd/Ctrl + Enter
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleBlur();
        return;
      }

      // Cancel on Escape
      if (e.key === "Escape") {
        setLocalContent(content);
        setHasChanges(false);
        unlockSection({
          promptId: promptId as Id<"prompts">,
          sectionIndex,
        }).then(() => {
          setIsEditing(false);
        });
      }
    },
    [handleBlur, content, promptId, sectionIndex, unlockSection]
  );

  const handleCancel = useCallback(() => {
    setLocalContent(content);
    setHasChanges(false);
    unlockSection({
      promptId: promptId as Id<"prompts">,
      sectionIndex,
    }).then(() => {
      setIsEditing(false);
    });
  }, [content, promptId, sectionIndex, unlockSection]);

  const handleSave = useCallback(async () => {
    if (localContent !== content) {
      onContentChange(localContent);
    }
    await handleBlur();
  }, [localContent, content, onContentChange, handleBlur]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "group relative rounded-lg transition-all duration-200",
        isEditing
          ? "bg-background border-2 border-primary/50 shadow-lg"
          : "hover:bg-muted/30 border border-transparent hover:border-border/50",
        lockedByOther && "opacity-70 cursor-not-allowed",
        className
      )}
      onClick={!isEditing && !lockedByOther ? handleClick : undefined}
      layout
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {header}
        </h3>

        <div className="flex items-center gap-2">
          {/* Locked by other indicator */}
          <AnimatePresence>
            {lockedByOther && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
              >
                <Avatar className="w-5 h-5">
                  <AvatarImage src={lockedByOther.userAvatar} />
                  <AvatarFallback className="text-[8px] bg-amber-500 text-white">
                    {lockedByOther.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-amber-700">
                  {lockedByOther.userName} is editing
                </span>
                <Lock className="w-3 h-3 text-amber-600" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit/Save indicators */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                {hasChanges && (
                  <span className="text-xs text-muted-foreground px-2">
                    Unsaved changes
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="p-1.5 rounded-md hover:bg-green-500/10 text-green-600 transition-colors"
                  title="Save (Cmd+Enter)"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-red-600 transition-colors"
                  title="Cancel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="readonly"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {lockedByOther ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                  "w-full min-h-[100px] resize-none",
                  "bg-transparent border-none outline-none",
                  "text-sm leading-relaxed font-mono",
                  "focus:ring-0 focus:outline-none"
                )}
                placeholder={`Enter ${header.toLowerCase()}...`}
              />
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  {hasChanges ? "Press Cmd+Enter to save, Esc to cancel" : "No changes"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {localContent.length} characters
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="readonly"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                lockedByOther && "text-muted-foreground"
              )}
            >
              {content || (
                <span className="text-muted-foreground italic">
                  Click to edit {header.toLowerCase()}...
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active editor overlay */}
      <AnimatePresence>
        {lockedByMe && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-lg">
              <Pencil className="w-3 h-3" />
              <span>Editing...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
