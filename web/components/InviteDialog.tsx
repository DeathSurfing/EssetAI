"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Link2,
  Copy,
  Check,
  UserPlus,
  Clock,
  X,
  Users,
  Crown,
  Zap,
  ArrowUpRight,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Collaborator {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
}

interface InviteDialogProps {
  promptId: string;
  isOwner: boolean;
  userRole: "free" | "normal" | "paid" | "admin";
  currentCollaborators: Collaborator[];
}

const collaboratorLimits = {
  free: 0,
  normal: 3,
  paid: 10,
  admin: 50,
};

const roleLabels = {
  free: "Free",
  normal: "Standard",
  paid: "Pro",
  admin: "Admin",
};

const roleColors = {
  free: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function InviteDialog({
  promptId,
  isOwner,
  userRole,
  currentCollaborators,
}: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const pendingInvites = useQuery(api.collaborationInvites.getPendingInvites, {
    promptId: promptId as Id<"prompts">,
  });

  const createInvite = useMutation(api.collaborationInvites.createInvite);
  const revokeInvite = useMutation(api.collaborationInvites.revokeInvite);
  const removeCollaborator = useMutation(
    api.collaborationInvites.removeCollaborator
  );

  const maxCollaborators = collaboratorLimits[userRole];
  const currentCount = currentCollaborators.length;
  const remainingSlots = Math.max(0, maxCollaborators - currentCount);
  const isAtLimit = currentCount >= maxCollaborators;
  const canInvite = isOwner && !isAtLimit && userRole !== "free";

  const handleGenerateLink = async () => {
    if (!canInvite) {
      if (userRole === "free") {
        toast.error("Upgrade to invite collaborators");
      } else {
        toast.error(`Maximum ${maxCollaborators} collaborators reached`);
      }
      return;
    }

    setIsGenerating(true);
    try {
      const result = await createInvite({
        promptId: promptId as Id<"prompts">,
        email: email.trim() || undefined,
      });

      const inviteUrl = `${window.location.origin}/invite/${result.inviteToken}`;
      setGeneratedLink(inviteUrl);
      toast.success("Magic invite link generated!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate invite"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevokeInvite = async (inviteId: Id<"collaborationInvites">) => {
    try {
      await revokeInvite({ inviteId });
      toast.success("Invite revoked");
    } catch (error) {
      toast.error("Failed to revoke invite");
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      await removeCollaborator({
        promptId: promptId as Id<"prompts">,
        collaboratorId: collaboratorId as Id<"users">,
      });
      toast.success("Collaborator removed");
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysRemaining = (expiresAt: number) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 group">
            <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Collaborate</span>
            {currentCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {currentCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <UserPlus className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    Invite Collaborators
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Share access and work together in real-time
                  </DialogDescription>
                </div>
              </div>
              <Badge
                className={cn(
                  "px-2.5 py-1 text-xs font-medium",
                  roleColors[userRole]
                )}
              >
                {roleLabels[userRole]} Plan
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-8">
              {/* Limit Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
              >
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300",
                    isAtLimit
                      ? "bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-800/40"
                      : "bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/40 dark:border-emerald-800/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isAtLimit
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isAtLimit ? (
                          <Crown className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isAtLimit
                            ? "Collaborator limit reached"
                            : `${remainingSlots} spot${
                                remainingSlots === 1 ? "" : "s"
                              } remaining`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {currentCount} of {maxCollaborators} collaborators
                          used
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {currentCollaborators.slice(0, 3).map((c, i) => (
                          <Avatar
                            key={c.userId}
                            className="w-7 h-7 border-2 border-background"
                            style={{ zIndex: 3 - i }}
                          >
                            <AvatarImage src={c.avatar} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {c.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {currentCount > 3 && (
                          <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                            +{currentCount - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAtLimit && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 bg-white/50 dark:bg-background/50 border-amber-300/50 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <Zap className="w-4 h-4 text-amber-500" />
                        Upgrade to add more collaborators
                        <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Generate Invite Link Section */}
              {canInvite && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">
                      Generate Invite Link
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter email (optional for open invite)"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-muted/30 border-muted focus:bg-background transition-colors"
                          type="email"
                        />
                      </div>
                      <Button
                        onClick={handleGenerateLink}
                        disabled={isGenerating}
                        className="h-11 px-5 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 transition-opacity"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>

                    <AnimatePresence mode="wait">
                      {generatedLink && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: "auto" }}
                          exit={{ opacity: 0, scale: 0.95, height: 0 }}
                          className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/5 to-muted border border-primary/20"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Link2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                Magic invite link ready
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Expires in 7 days
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              value={generatedLink}
                              readOnly
                              className="flex-1 bg-background/50 border-primary/20 font-mono text-xs"
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={handleCopyLink}
                                  className="h-9 w-9 border-primary/20 hover:bg-primary/10"
                                >
                                  <AnimatePresence mode="wait">
                                    {copied ? (
                                      <motion.div
                                        key="check"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                      >
                                        <Check className="w-4 h-4 text-emerald-500" />
                                      </motion.div>
                                    ) : (
                                      <motion.div
                                        key="copy"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                      >
                                        <Copy className="w-4 h-4" />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{copied ? "Copied!" : "Copy link"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Links expire after 7 days. You can revoke them anytime.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Pending Invites Section */}
              {isOwner && pendingInvites && pendingInvites.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">
                      Pending Invites
                      <Badge variant="secondary" className="ml-2">
                        {pendingInvites.length}
                      </Badge>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {pendingInvites.map((invite, index) => (
                        <motion.div
                          key={invite._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center shrink-0">
                              {invite.email ? (
                                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <Link2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {invite.email || "Open invite link"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Created {formatDate(invite.createdAt)}</span>
                                <span>•</span>
                                <span
                                  className={cn(
                                    getDaysRemaining(invite.expiresAt) <= 1
                                      ? "text-amber-500"
                                      : ""
                                  )}
                                >
                                  {getDaysRemaining(invite.expiresAt)} days
                                  left
                                </span>
                              </div>
                            </div>
                          </div>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRevokeInvite(invite._id)}
                              >
                                <X className="w-4 h-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Revoke invite</p>
                            </TooltipContent>
                          </Tooltip>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* Current Collaborators Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Current Collaborators</h3>
                </div>

                {currentCollaborators.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 flex flex-col items-center justify-center text-center space-y-3"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No collaborators yet
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {canInvite
                          ? "Generate an invite link to get started"
                          : "Collaborators will appear here"}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {currentCollaborators.map((collaborator, index) => (
                        <motion.div
                          key={collaborator.userId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="group flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/20 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar className="w-9 h-9 border-2 border-background shadow-sm">
                              <AvatarImage src={collaborator.avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {collaborator.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {collaborator.name}
                              </p>
                              {collaborator.email && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {collaborator.email}
                                </p>
                              )}
                            </div>
                          </div>

                          {isOwner && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() =>
                                    handleRemoveCollaborator(collaborator.userId)
                                  }
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove collaborator</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>

              {/* Free User Upgrade Prompt */}
              {userRole === "free" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-zinc-50 dark:from-slate-950/50 dark:to-zinc-950/50 border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        Unlock Collaboration
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Upgrade to Standard to invite up to 3 collaborators, or
                        go Pro for up to 10. Work together in real-time with
                        your team.
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity"
                      >
                        <Zap className="w-4 h-4" />
                        Upgrade Now
                        <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
