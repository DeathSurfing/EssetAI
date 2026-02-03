"use client";

import * as React from "react";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Users, MousePointer2, Sparkles } from "lucide-react";

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

interface CollaborationPresenceProps {
  promptId: Id<"prompts">;
  className?: string;
  maxVisible?: number;
}

// Vibrant color palette for user presence indicators
const USER_COLORS = [
  { bg: "bg-rose-500", border: "border-rose-400", text: "text-rose-500", glow: "shadow-rose-500/30" },
  { bg: "bg-amber-500", border: "border-amber-400", text: "text-amber-500", glow: "shadow-amber-500/30" },
  { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-500", glow: "shadow-emerald-500/30" },
  { bg: "bg-sky-500", border: "border-sky-400", text: "text-sky-500", glow: "shadow-sky-500/30" },
  { bg: "bg-violet-500", border: "border-violet-400", text: "text-violet-500", glow: "shadow-violet-500/30" },
  { bg: "bg-fuchsia-500", border: "border-fuchsia-400", text: "text-fuchsia-500", glow: "shadow-fuchsia-500/30" },
  { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-500", glow: "shadow-cyan-500/30" },
  { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-500", glow: "shadow-orange-500/30" },
];

// Get consistent color for a user based on their ID
function getUserColor(userId: string): typeof USER_COLORS[0] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
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
function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-0.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className={cn("w-1 h-1 rounded-full", color)}
          animate={{
            scale: [1, 1.2, 1],
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

// Single collaborator avatar with tooltip
function CollaboratorAvatar({
  collaborator,
  index,
  total,
}: {
  collaborator: Collaborator;
  index: number;
  total: number;
}) {
  const color = useMemo(() => getUserColor(collaborator.userId), [collaborator.userId]);
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -10 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Glow effect */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full blur-md opacity-0 transition-opacity duration-300",
          color.bg
        )}
        animate={{ opacity: collaborator.isTyping ? 0.4 : 0 }}
      />

      {/* Avatar container */}
      <div
        className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
          "border-2 transition-all duration-300 cursor-pointer overflow-hidden",
          "bg-background/80 backdrop-blur-sm",
          color.border,
          collaborator.isTyping && ["ring-2", "ring-offset-1", "ring-offset-background", color.glow]
        )}
        style={{
          marginLeft: index > 0 ? "-0.75rem" : 0,
          zIndex: total - index,
        }}
      >
        {collaborator.avatar ? (
          <img
            src={collaborator.avatar}
            alt={collaborator.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={color.text}>{getInitials(collaborator.name)}</span>
        )}

        {/* Online indicator */}
        <motion.div
          className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background", color.bg)}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2",
              "rounded-lg bg-popover border border-border shadow-xl backdrop-blur-md",
              "min-w-max z-50"
            )}
          >
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold">{collaborator.name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {collaborator.isTyping ? (
                  <span className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", color.bg)} />
                    Typing...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <MousePointer2 size={12} />
                    Viewing
                  </span>
                )}
              </div>
              {collaborator.cursor && (
                <span className="text-xs text-muted-foreground/70">
                  Section {collaborator.cursor.sectionIndex + 1}
                </span>
              )}
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="w-2 h-2 bg-popover border-r border-b border-border rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Overflow counter for additional users
function OverflowCounter({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
        "border-2 border-dashed border-muted-foreground/30",
        "bg-muted/50 text-muted-foreground",
        "hover:border-muted-foreground/50 hover:bg-muted transition-all duration-200",
        "ml-[-0.75rem] cursor-pointer"
      )}
    >
      +{count}
    </motion.button>
  );
}

// Empty state when no collaborators
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-muted-foreground/50 text-sm"
    >
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
        <Users size={14} />
      </div>
      <span className="text-muted-foreground/40">No active users</span>
    </motion.div>
  );
}

// Main component
export function CollaborationPresence({
  promptId,
  className,
  maxVisible = 4,
}: CollaborationPresenceProps) {
  const collaborators = useQuery(api.collaboration.getActiveCollaborators, { promptId });
  const [showAll, setShowAll] = React.useState(false);

  // Separate typing users to show first
  const sortedCollaborators = useMemo(() => {
    if (!collaborators) return [];
    return [...collaborators].sort((a, b) => {
      if (a.isTyping && !b.isTyping) return -1;
      if (!a.isTyping && b.isTyping) return 1;
      return 0;
    });
  }, [collaborators]);

  const visibleCollaborators = showAll
    ? sortedCollaborators
    : sortedCollaborators.slice(0, maxVisible);
  const overflowCount = sortedCollaborators.length - maxVisible;

  // Count typing users
  const typingCount = sortedCollaborators.filter((c: Collaborator) => c.isTyping).length;

  if (!collaborators) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-9 h-9 rounded-full border-2 border-muted animate-pulse bg-muted/30" />
      </div>
    );
  }

  if (collaborators.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("flex flex-col gap-2", className)}
    >
      {/* Main presence bar */}
      <div className="flex items-center">
        <div className="flex items-center">
          <AnimatePresence mode="popLayout">
            {visibleCollaborators.map((collaborator, index) => (
              <CollaboratorAvatar
                key={collaborator.userId}
                collaborator={collaborator}
                index={index}
                total={visibleCollaborators.length}
              />
            ))}
          </AnimatePresence>

          {overflowCount > 0 && !showAll && (
            <OverflowCounter count={overflowCount} onClick={() => setShowAll(true)} />
          )}
        </div>

      </div>

      {/* Typing indicator bar */}
      <AnimatePresence>
        {typingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            {sortedCollaborators
              .filter((c) => c.isTyping)
              .slice(0, 3)
              .map((collaborator) => {
                const color = getUserColor(collaborator.userId);
                return (
                  <motion.div
                    key={collaborator.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                      "bg-muted/50 border border-border/50"
                    )}
                  >
                    <span className={cn("font-medium", color.text)}>
                      {collaborator.name.split(" ")[0]}
                    </span>
                    <TypingIndicator color={color.bg} />
                  </motion.div>
                );
              })}
            {typingCount > 3 && (
              <span className="text-xs text-muted-foreground">
                +{typingCount - 3} more
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact variant for tight spaces
export function CollaborationPresenceCompact({
  promptId,
  className,
}: Omit<CollaborationPresenceProps, "maxVisible">) {
  const collaborators = useQuery(api.collaboration.getActiveCollaborators, { promptId });

  if (!collaborators || collaborators.length === 0) return null;

  const typingCount = collaborators.filter((c: Collaborator) => c.isTyping).length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-full",
        "bg-muted/50 border border-border/50",
        className
      )}
    >
      <div className="flex -space-x-2">
        {collaborators.slice(0, 3).map((collaborator: Collaborator, index: number) => {
          const color = getUserColor(collaborator.userId);
          return (
            <div
              key={collaborator.userId}
              className={cn(
                "w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold",
                color.bg,
                "text-white"
              )}
              style={{ zIndex: 3 - index }}
            >
              {collaborator.avatar ? (
                <img
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                getInitials(collaborator.name)[0]
              )}
            </div>
          );
        })}
        {collaborators.length > 3 && (
          <div className="w-6 h-6 rounded-full border-2 border-background bg-muted text-[10px] font-bold flex items-center justify-center text-muted-foreground">
            +{collaborators.length - 3}
          </div>
        )}
      </div>

      {typingCount > 0 && (
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          />
          <span className="text-xs text-muted-foreground">{typingCount} typing</span>
        </div>
      )}
    </motion.div>
  );
}

// Badge variant for inline display
export function CollaborationBadge({
  promptId,
  className,
}: Omit<CollaborationPresenceProps, "maxVisible">) {
  const collaborators = useQuery(api.collaboration.getActiveCollaborators, { promptId });

  if (!collaborators || collaborators.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs",
        "bg-primary/10 text-primary border border-primary/20",
        className
      )}
    >
      <Sparkles size={12} className="animate-pulse" />
      <span className="font-medium">{collaborators.length} viewing</span>
    </motion.div>
  );
}

export default CollaborationPresence;
