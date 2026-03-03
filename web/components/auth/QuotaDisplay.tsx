"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export function QuotaDisplay() {
  const user = useQuery(api.users.getCurrentUser);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const { generationsRemaining, role, monthlyGenerationLimit, email } = user;

  const handleUpgrade = async (targetRole: "normal" | "paid") => {
    if (!email) {
      toast.error("Please sign in to upgrade");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          workosId: user.workosId,
          email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      toast.error("Failed to start upgrade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Badge variant={role === "free" ? "secondary" : "default"} className="capitalize">
        {role}
      </Badge>
      <span className="text-muted-foreground">
        {generationsRemaining} / {monthlyGenerationLimit} generations
      </span>
      {role === "free" && generationsRemaining === 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => handleUpgrade("normal")}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Upgrade to continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
