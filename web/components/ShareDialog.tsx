"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, X, Users, Link2, Eye, Edit3, Globe2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface ShareDialogProps {
  promptId: string;
  isOwner: boolean;
  currentMode?: "view" | "edit";
  isPublic?: boolean;
  shareToken?: string;
  onShareSettingsChange?: (settings: {
    isPublic: boolean;
    shareMode: "view" | "edit";
  }) => void;
}

export function ShareDialog({
  promptId,
  isOwner,
  currentMode = "view",
  isPublic = false,
  shareToken,
  onShareSettingsChange,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<"view" | "edit">(currentMode);
  const [publicAccess, setPublicAccess] = useState(isPublic);
  const [isLoading, setIsLoading] = useState(false);

  const createShareLink = useMutation(api.prompts.createShareLink);

  const shareUrl = shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : null;

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    if (!isOwner) return;
    
    setIsLoading(true);
    try {
      setPublicAccess(checked);
      onShareSettingsChange?.({
        isPublic: checked,
        shareMode,
      });
      
      if (checked && !shareToken) {
        await createShareLink({
          promptId: promptId as any,
          isPublic: true,
        });
      }
      
      toast.success(checked ? "Prompt is now public" : "Prompt is now private");
    } catch (error) {
      toast.error("Failed to update sharing settings");
      setPublicAccess(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeMode = (mode: "view" | "edit") => {
    if (!isOwner) return;
    
    setShareMode(mode);
    onShareSettingsChange?.({
      isPublic: publicAccess,
      shareMode: mode,
    });
    
    toast.success(`Others can now ${mode} this prompt`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 size={16} />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <Globe2 className="w-5 h-5 text-primary" />
            Share Prompt
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mx-6 mb-4 w-auto">
            <TabsTrigger value="link" className="gap-2">
              <Link2 size={16} />
              Link
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Users size={16} />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="px-6 pb-6 space-y-6">
            {/* Share URL */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl || "Generate a link to share"}
                  readOnly
                  className="flex-1 bg-muted/50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={16} className="text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can access your prompt
              </p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {publicAccess ? (
                    <Globe2 size={20} className="text-primary" />
                  ) : (
                    <Lock size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">Public Access</p>
                  <p className="text-xs text-muted-foreground">
                    {publicAccess
                      ? "Anyone can view this prompt"
                      : "Only you can access this prompt"}
                  </p>
                </div>
              </div>
              <Switch
                checked={publicAccess}
                onCheckedChange={handleTogglePublic}
                disabled={!isOwner || isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="px-6 pb-6 space-y-6">
            {/* Permission Mode */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Permission Level</label>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleChangeMode("view")}
                  disabled={!isOwner}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    shareMode === "view"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={18} className={shareMode === "view" ? "text-primary" : ""} />
                    <span className="font-medium">View Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Others can view but not edit
                  </p>
                  {shareMode === "view" && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Active
                    </Badge>
                  )}
                </button>

                <button
                  onClick={() => handleChangeMode("edit")}
                  disabled={!isOwner}
                  className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                    shareMode === "edit"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Edit3 size={18} className={shareMode === "edit" ? "text-primary" : ""} />
                    <span className="font-medium">Can Edit</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Others can collaborate in real-time
                  </p>
                  {shareMode === "edit" && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      Active
                    </Badge>
                  )}
                </button>
              </div>
            </div>

            {/* Collaboration Info */}
            {shareMode === "edit" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      Real-time Collaboration
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Multiple users can edit simultaneously. Changes sync instantly 
                      across all connected devices.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Owner Info */}
            {!isOwner && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Only the owner can change sharing settings
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
