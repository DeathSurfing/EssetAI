"use client";

import * as React from "react";

interface EditableContentProps {
  content: string;
  isEditing: boolean;
  editedContent: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentClick: () => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onContentBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function EditableContent({
  content,
  isEditing,
  editedContent,
  textareaRef,
  onContentClick,
  onContentChange,
  onContentBlur,
  onKeyDown,
}: EditableContentProps) {
  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editedContent}
        onChange={onContentChange}
        onBlur={onContentBlur}
        onKeyDown={onKeyDown}
        className="w-full p-2 font-mono text-sm bg-background border-2 border-primary rounded-md resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    );
  }

  return (
    <div
      onClick={onContentClick}
      className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed cursor-text hover:bg-accent/30 p-2 rounded transition-colors"
    >
      {content}
    </div>
  );
}
