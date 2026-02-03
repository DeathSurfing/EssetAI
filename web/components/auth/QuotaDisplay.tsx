"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";

export function QuotaDisplay() {
  const user = useQuery(api.users.getCurrentUser);

  if (!user) return null;

  const { generationsRemaining, role, monthlyGenerationLimit } = user;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={role === "free" ? "secondary" : "default"} className="capitalize">
        {role}
      </Badge>
      <span className="text-muted-foreground">
        {generationsRemaining} / {monthlyGenerationLimit} generations
      </span>
      {role === "free" && generationsRemaining === 0 && (
        <span className="text-orange-500 text-xs">Upgrade to continue</span>
      )}
    </div>
  );
}
