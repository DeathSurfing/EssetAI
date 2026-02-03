"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("w-full max-w-2xl mx-auto px-4", className)}>
      {children}
    </div>
  );
}
