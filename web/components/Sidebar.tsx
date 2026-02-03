"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronLeft, ChevronRight, Search, Clock, Settings, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SavedPrompt } from "@/hooks/usePromptHistory";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onHomeClick: () => void;
  prompts: SavedPrompt[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPromptClick: (prompt: SavedPrompt) => void;
  onDeletePrompt?: (id: string) => void;
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
  onDeletePrompt,
  currentPromptId,
}: SidebarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);

  // Prevent hydration mismatch for theme
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDark = theme === "dark";

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
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    esset.ai
                  </span>
                </div>
                
                {/* Preferences Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Settings size={18} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Preferences</h4>
                      
                      {/* Theme Toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Theme</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTheme(isDark ? "light" : "dark")}
                          className="h-8 w-8 p-0"
                        >
                          {mounted ? (
                            isDark ? (
                              <Sun size={16} className="text-yellow-400" />
                            ) : (
                              <Moon size={16} />
                            )
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
                      <div
                        key={prompt.id}
                        className={`relative group w-full text-left p-3 rounded-lg transition-all cursor-pointer ${
                          currentPromptId === prompt.id
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-accent border border-transparent"
                        }`}
                        onMouseEnter={() => setHoveredPromptId(prompt.id)}
                        onMouseLeave={() => setHoveredPromptId(null)}
                      >
                        <div onClick={() => onPromptClick(prompt)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-foreground truncate pr-8">
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
                        </div>
                        
                        {/* Delete Button */}
                        {onDeletePrompt && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ 
                              opacity: hoveredPromptId === prompt.id ? 1 : 0,
                              scale: hoveredPromptId === prompt.id ? 1 : 0.8
                            }}
                            transition={{ duration: 0.15 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePrompt(prompt.id);
                              if (currentPromptId === prompt.id) {
                                onHomeClick();
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete chat"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </div>
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
