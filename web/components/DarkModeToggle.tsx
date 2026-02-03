"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-10 h-10 p-0 rounded-full"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 p-0 rounded-full hover:bg-muted transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <HugeiconsIcon
        icon={isDark ? Sun02Icon : Moon02Icon}
        size={20}
        className={isDark ? "text-yellow-400" : "text-slate-600"}
      />
    </Button>
  );
}
