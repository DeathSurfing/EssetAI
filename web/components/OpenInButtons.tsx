"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OpenInButtonsProps {
  prompt: string;
}

export function OpenInButtons({ prompt }: OpenInButtonsProps) {
  const openInFramer = async () => {
    try {
      // Copy prompt to clipboard
      await navigator.clipboard.writeText(prompt);
      
      // Open Framer AI with prompt parameter (if supported)
      const encodedPrompt = encodeURIComponent(prompt);
      window.open(`https://www.framer.com/ai/?prompt=${encodedPrompt}`, '_blank');
      
      toast.success("Prompt copied! Paste it into Framer's prompt field.", {
        description: "The prompt has been copied to your clipboard.",
        duration: 4000,
      });
    } catch (err) {
      // If clipboard fails, still open Framer
      window.open('https://www.framer.com/ai/', '_blank');
      toast.info("Opening Framer AI", {
        description: "Please copy and paste the prompt manually.",
        duration: 4000,
      });
    }
  };

  const openInLovable = () => {
    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`https://lovable.dev/?prompt=${encodedPrompt}`, '_blank');
    toast.success("Opening Lovable", {
      description: "Your prompt has been passed to Lovable.",
      duration: 3000,
    });
  };

  const openInReplit = () => {
    const encodedPrompt = encodeURIComponent(prompt);
    // Replit's AI feature URL format
    window.open(`https://replit.com/@replit/AI?prompt=${encodedPrompt}`, '_blank');
    toast.success("Opening Replit", {
      description: "Your prompt has been passed to Replit.",
      duration: 3000,
    });
  };

  if (!prompt) return null;

  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      <p className="text-xs text-muted-foreground mb-1 font-medium">Open in:</p>
      <Button
        variant="outline"
        size="sm"
        onClick={openInFramer}
        className="justify-start text-xs h-8 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <span className="font-semibold">Framer</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openInLovable}
        className="justify-start text-xs h-8 hover:bg-pink-50 dark:hover:bg-pink-950"
      >
        <span className="font-semibold text-pink-600">Lovable</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openInReplit}
        className="justify-start text-xs h-8 hover:bg-blue-50 dark:hover:bg-blue-950"
      >
        <span className="font-semibold text-blue-600">Replit</span>
      </Button>
    </div>
  );
}
