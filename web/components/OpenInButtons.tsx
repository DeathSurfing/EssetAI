"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface OpenInButtonsProps {
  prompt: string;
}

export function OpenInButtons({ prompt }: OpenInButtonsProps) {
  const openInLovable = () => {
    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`https://lovable.dev/?prompt=${encodedPrompt}`, '_blank');
  };

  const openInFramer = () => {
    // Framer doesn't have a direct prompt URL, so we'll copy to clipboard
    navigator.clipboard.writeText(prompt);
    window.open('https://framer.com/', '_blank');
  };

  const openInReplit = () => {
    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`https://replit.com/new?title=Generated%20Website&prompt=${encodedPrompt}`, '_blank');
  };

  if (!prompt) return null;

  return (
    <div className="flex flex-col gap-2 min-w-[120px]">
      <p className="text-xs text-muted-foreground mb-1 font-medium">Open in:</p>
      <Button
        variant="outline"
        size="sm"
        onClick={openInFramer}
        className="justify-start text-xs h-8"
      >
        <span className="font-semibold">Framer</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openInLovable}
        className="justify-start text-xs h-8"
      >
        <span className="font-semibold text-pink-600">Lovable</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={openInReplit}
        className="justify-start text-xs h-8"
      >
        <span className="font-semibold">Replit</span>
      </Button>
    </div>
  );
}
