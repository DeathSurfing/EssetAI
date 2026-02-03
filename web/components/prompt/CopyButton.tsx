"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  copied: boolean;
  onCopy: () => void;
}

export function CopyButton({ text, copied, onCopy }: CopyButtonProps) {
  if (!text) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onCopy}
      className="h-8 px-3 text-sm transition-all duration-200 hover:scale-105"
    >
      {copied ? (
        <>
          <HugeiconsIcon icon={Tick02Icon} size={16} className="mr-2" />
          Copied!
        </>
      ) : (
        <>
          <HugeiconsIcon icon={Copy01Icon} size={16} className="mr-2" />
          Copy
        </>
      )}
    </Button>
  );
}
