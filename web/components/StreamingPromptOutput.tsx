"use client";

import * as React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Card } from "@/components/ui/card";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { SectionCard } from "./SectionCard";
import { NotionSectionEditor } from "./NotionSectionEditor";
import { OpenInButtons } from "./OpenInButtons";
import { CopyIcon, CheckIcon } from "lucide-react";

interface Section {
  header: string;
  content: string;
  previousContent: string | null;
  isRegenerating: boolean;
  isDirty: boolean;
}

interface StreamingPromptOutputProps {
  text: string;
  isLoading?: boolean;
  sections: Section[];
  promptId?: string;
  onRegenerateSection: (header: string, customPrompt: string) => void;
  onUndoSection: (header: string) => void;
  onEditSection: (header: string, newContent: string) => void;
  onSyncSections?: (sections: Section[]) => void;
}

export function StreamingPromptOutput({
  text,
  isLoading,
  sections,
  promptId,
  onRegenerateSection,
  onUndoSection,
  onEditSection,
  onSyncSections,
}: StreamingPromptOutputProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const [copied, setCopied] = useState(false);

  // Entrance animation - only runs once when component first appears
  useEffect(() => {
    if (!cardRef.current || hasAnimated.current) return;
    
    // Only animate if we have content or are loading
    if (!text && !isLoading) return;

    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
        }
      );

      if (buttonsRef.current) {
        gsap.fromTo(
          buttonsRef.current,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.5, delay: 0.4, ease: "power3.out" }
        );
      }
    }, cardRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only runs once on mount

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

  if (!isLoading && !text) {
    return null;
  }

  const hasContent = text.length > 0;
  const hasSections = sections.length > 0;
  const isComplete = !isLoading && hasContent;

  return (
    <Card ref={cardRef} className="w-full overflow-hidden border-2 border-primary/20 shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                isLoading ? "bg-primary animate-pulse" : "bg-green-500"
              }`}
            />
            <h3 className="text-base font-semibold text-foreground">
              Website Brief
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <Shimmer className="text-sm">Generating prompt...</Shimmer>
            ) : (
              <span className="text-sm text-green-600 font-medium">Complete</span>
            )}
            {isComplete && (
              <MessageActions>
                <MessageAction
                  onClick={handleCopy}
                  tooltip={copied ? "Copied!" : "Copy to clipboard"}
                  label={copied ? "Copied" : "Copy"}
                >
                  {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                </MessageAction>
              </MessageActions>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left side - Prompt Content */}
          <div className="flex-1 max-h-[600px]">
            <Conversation className="max-h-[600px] overflow-y-auto">
              <ConversationContent className="gap-4 p-0">
                {!hasContent ? (
                  <Message from="assistant" className="w-full max-w-full">
                    <MessageContent className="w-full bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
                        <div
                          className="w-3 h-3 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-3 h-3 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span className="text-base ml-2">Initializing...</span>
                      </div>
                    </MessageContent>
                  </Message>
                ) : !hasSections ? (
                  <Message from="assistant" className="w-full max-w-full">
                    <MessageContent className="w-full font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-muted/50 rounded-lg">
                      {text}
                      {isLoading && (
                        <span className="inline-block w-2 h-5 bg-primary ml-1 animate-pulse align-middle" />
                      )}
                    </MessageContent>
                  </Message>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -50, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1,
                          type: "spring",
                          stiffness: 100,
                          damping: 15,
                        }}
                      >
                        {promptId ? (
                          <NotionSectionEditor
                            sectionIndex={index}
                            header={section.header}
                            content={section.content}
                            promptId={promptId}
                            isRegenerating={section.isRegenerating}
                            onContentChange={(newContent) => {
                              onEditSection(section.header, newContent);
                            }}
                            onRegenerate={onRegenerateSection}
                          />
                        ) : (
                          <SectionCard
                            header={section.header}
                            content={section.content}
                            index={index}
                            isRegenerating={section.isRegenerating}
                            isDirty={section.isDirty}
                            previousContent={section.previousContent}
                            onRegenerate={onRegenerateSection}
                            onUndo={onUndoSection}
                            onEdit={onEditSection}
                            allSections={sections.map(
                              (s) => `${s.header}\n${s.content}`
                            )}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
          </div>

          {/* Right side - Open In Buttons */}
          {isComplete && (
            <div ref={buttonsRef} className="shrink-0 w-[140px]">
              <div className="sticky top-0">
                <OpenInButtons prompt={text} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
