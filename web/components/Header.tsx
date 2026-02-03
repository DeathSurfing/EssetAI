"use client";

import * as React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({
  title = "Website Prompt Generator",
  subtitle = "Transform Google Maps business links into structured AI website prompts",
}: HeaderProps) {
  return (
    <header className="text-center space-y-2 py-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </header>
  );
}
