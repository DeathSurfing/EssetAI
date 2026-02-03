"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

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
  allSections,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(content);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  
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
    // Auto-focus textarea after render
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
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditedContent(content); // Revert on Escape
    }
  };

  // Auto-resize textarea to fit content
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editedContent, isEditing]);

  return (
    <div
      className={cn(
        "border-l-2 pl-4 py-2 transition-all duration-300 relative group",
        header
          ? "border-primary bg-primary/5"
          : "border-border"
      )}
    >
      {header && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide">
              {header}
            </h4>
            {isRegenerating && (
              <span className="text-xs text-muted-foreground animate-pulse bg-muted px-2 py-0.5 rounded">
                Regenerating...
              </span>
            )}
            {isDirty && !isRegenerating && (
              <span className="text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                Edited
              </span>
            )}
          </div>
          
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Regenerate section"
              >
                <HugeiconsIcon icon={RefreshIcon} size={16} className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-4" 
              align="end"
              sideOffset={5}
            >
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm mb-1">
                    Regenerate: {header}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    Enter custom instructions to modify this section.
                  </p>
                </div>
                
                <Textarea
                  placeholder="e.g., Make it more focused on fine dining..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[80px] text-sm"
                />
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleApply}
                    disabled={isRegenerating || !customPrompt.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    {isRegenerating ? (
                      <>
                        <HugeiconsIcon icon={RefreshIcon} size={12} className="mr-1 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                  
                  {previousContent && (
                    <Button
                      onClick={handleUndo}
                      disabled={isRegenerating}
                      variant="outline"
                      size="sm"
                    >
                      Undo
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleCancel}
                    disabled={isRegenerating}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editedContent}
          onChange={handleContentChange}
          onBlur={handleContentBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-2 font-mono text-sm bg-background border-2 border-primary rounded-md resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <div 
          onClick={handleContentClick}
          className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed cursor-text hover:bg-accent/30 p-2 rounded transition-colors"
        >
          {content}
        </div>
      )}
    </div>
  );
}
