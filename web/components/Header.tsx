"use client";

import * as React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = "esset.ai",
  subtitle = "Transform locations into stunning websites with AI",
}: HeaderProps) {
  return (
    <header className="text-center space-y-2 py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>
  );
}
