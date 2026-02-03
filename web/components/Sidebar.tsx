"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ChevronLeft, ChevronRight, Search, Clock, Settings, Moon, Sun, Trash2, User, LogIn, LogOut, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";
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
  sharedPrompts?: SavedPrompt[];
  onSharedPromptClick?: (prompt: SavedPrompt) => void;
  isLoading?: boolean;
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
  sharedPrompts,
  onSharedPromptClick,
  isLoading = false,
}: SidebarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const isSignedIn = !!user;
  const [activeTab, setActiveTab] = useState<"my-prompts" | "shared">("my-prompts");

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

  const userDisplayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName 
    ? user.firstName 
    : user?.email?.split('@')[0] 
    || "User";

  const userInitials = userDisplayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
                  <Logo className="w-7 h-7" />
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

              {/* Tabs */}
              {isSignedIn && (
                <div className="flex gap-1 mb-3 bg-muted/50 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab("my-prompts")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      activeTab === "my-prompts"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <User size={14} />
                    My Prompts
                  </button>
                  <button
                    onClick={() => setActiveTab("shared")}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      activeTab === "shared"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Users size={14} />
                    Shared
                  </button>
                </div>
              )}

              {/* Prompts List */}
              <div className="flex-1 overflow-y-auto -mx-4 px-4">
                <div className="space-y-2">
                  {activeTab === "my-prompts" ? (
                    // My Prompts Tab
                    isLoading ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <div className="animate-pulse">Loading prompts...</div>
                      </div>
                    ) : prompts.length === 0 ? (
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
                    )
                  ) : (
                    // Shared Prompts Tab
                    !sharedPrompts || sharedPrompts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No prompts shared with you</p>
                        <p className="text-xs mt-1">When someone adds you as a collaborator, prompts will appear here</p>
                      </div>
                    ) : (
                      sharedPrompts.map((prompt) => (
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
                          <div onClick={() => onSharedPromptClick?.(prompt)}>
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
                            {/* Owner info for shared prompts */}
                            {('ownerName' in prompt) && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">
                                  Shared by: <span className="text-foreground">{(prompt as any).ownerName}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* User Profile Section */}
              <div className="mt-4 pt-4 border-t border-border">
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.button
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar size="sm" className="shrink-0">
                        <AvatarImage src={user?.profilePictureUrl || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {isSignedIn ? userInitials : <User size={16} />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isSignedIn ? userDisplayName : "Not signed in"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSignedIn ? "Account" : "Sign in to sync"}
                        </p>
                      </div>
                      
                      <div className="w-2 h-2 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </motion.button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start" side="top">
                    <div className="space-y-4">
                      {isSignedIn ? (
                        <>
                          <div className="flex items-center gap-3 pb-3 border-b">
                            <Avatar>
                              <AvatarImage src={user?.profilePictureUrl || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {userInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{userDisplayName}</p>
                              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start gap-2 text-sm h-9">
                              <User size={16} />
                              Profile Settings
                            </Button>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start gap-2 text-sm h-9 text-destructive hover:text-destructive"
                              onClick={() => signOut()}
                            >
                              <LogOut size={16} />
                              Sign Out
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center py-4">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                              <User size={24} className="text-muted-foreground" />
                            </div>
                            <p className="font-medium text-sm mb-1">Sign in to esset.ai</p>
                            <p className="text-xs text-muted-foreground">Sync your prompts across devices</p>
                          </div>
                          
                          <div className="space-y-2">
                            <Link href="/sign-in" className="w-full">
                              <Button 
                                variant="default" 
                                className="w-full gap-2 h-9"
                              >
                                <LogIn size={16} />
                                Sign In
                              </Button>
                            </Link>
                            <Link href="/sign-up" className="w-full">
                              <Button variant="outline" className="w-full gap-2 h-9">
                                <User size={16} />
                                Sign Up
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
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
