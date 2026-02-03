"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronLeft, ChevronRight, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedPrompt } from "@/hooks/usePromptHistory";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onHomeClick: () => void;
  prompts: SavedPrompt[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPromptClick: (prompt: SavedPrompt) => void;
  currentPromptId?: string;
}

export function Sidebar({
  isOpen,
  onToggle,
  onHomeClick,
  prompts,
  searchQuery,
  onSearchChange,
  onPromptClick,
  currentPromptId,
}: SidebarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 280 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="h-screen bg-muted/30 border-r border-border overflow-hidden flex flex-col"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  Prompt History
                </h2>
              </div>

              {/* Home Button */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 mb-4 text-foreground hover:bg-accent"
                onClick={onHomeClick}
              >
                <Home size={18} />
                <span>New Prompt</span>
              </Button>

              {/* Search */}
              <div className="relative mb-4">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isSearchFocused ? "text-primary" : "text-muted-foreground"
                  }`}
                  size={16}
                />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-9 bg-background"
                />
              </div>

              {/* Prompts List */}
              <div className="flex-1 overflow-y-auto -mx-4 px-4">
                <div className="space-y-2">
                  {prompts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No prompts yet
                    </div>
                  ) : (
                    prompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => onPromptClick(prompt)}
                        className={`w-full text-left p-3 rounded-lg transition-colors group ${
                          currentPromptId === prompt.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-accent border border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate">
                              {prompt.placeName}
                            </h3>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock size={12} />
                              <span>{formatDate(prompt.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {prompt.promptPreview}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
                {prompts.length} / 10 prompts saved
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-background border border-border shadow-lg rounded-r-lg p-2 hover:bg-accent transition-colors"
        animate={{
          x: isOpen ? 280 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </motion.button>
    </>
  );
}
