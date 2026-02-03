"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSectionAnimations } from "@/hooks/useSectionAnimations";
import { SectionHeader } from "@/components/section/SectionHeader";
import { EditableContent } from "@/components/section/EditableContent";

interface SectionCardProps {
  header: string;
  content: string;
  index: number;
  isRegenerating: boolean;
  isDirty: boolean;
  previousContent: string | null;
  onRegenerate: (header: string, customPrompt: string) => void;
  onUndo: (header: string) => void;
  onEdit: (header: string, newContent: string) => void;
  allSections: string[];
}

export function SectionCard({
  header,
  content,
  index,
  isRegenerating,
  isDirty,
  previousContent,
  onRegenerate,
  onUndo,
  onEdit,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(content);

  const { cardRef, textareaRef, handleMouseEnter, handleMouseLeave } = useSectionAnimations({
    index,
    isEditing,
  });

  // Update editedContent when content changes externally
  React.useEffect(() => {
    if (!isEditing) {
      setEditedContent(content);
    }
  }, [content, isEditing]);

  const handleApply = () => {
    onRegenerate(header, customPrompt);
    setIsOpen(false);
    setCustomPrompt("");
  };

  const handleUndo = () => {
    onUndo(header);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setCustomPrompt("");
  };

  const handleContentClick = () => {
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleContentBlur = () => {
    setIsEditing(false);
    if (editedContent !== content) {
      onEdit(header, editedContent);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditedContent(content);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "border-l-2 pl-4 py-2 transition-all duration-300 relative group",
        header ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <SectionHeader
        header={header}
        isRegenerating={isRegenerating}
        isDirty={isDirty}
        previousContent={previousContent}
        customPrompt={customPrompt}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onCustomPromptChange={setCustomPrompt}
        onApply={handleApply}
        onUndo={handleUndo}
        onCancel={handleCancel}
      />
      <EditableContent
        content={content}
        isEditing={isEditing}
        isRegenerating={isRegenerating}
        editedContent={editedContent}
        textareaRef={textareaRef}
        onContentClick={handleContentClick}
        onContentChange={handleContentChange}
        onContentBlur={handleContentBlur}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
