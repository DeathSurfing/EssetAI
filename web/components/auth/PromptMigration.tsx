"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Authenticated } from "convex/react";

interface SavedPrompt {
  id: string;
  placeName: string;
  url: string;
  sections: Array<{ header: string; content: string }>;
  createdAt: number;
}

function MigrationComponent() {
  const [hasMigrated, setHasMigrated] = useState(false);
  const migratePrompts = useMutation(api.prompts.migratePrompts);
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    const migrate = async () => {
      if (hasMigrated || !user) return;

      const migrationFlag = localStorage.getItem("esset_prompts_migrated");
      if (migrationFlag === "true") return;

      const stored = localStorage.getItem("esset_prompts");
      if (!stored) {
        localStorage.setItem("esset_prompts_migrated", "true");
        return;
      }

      try {
        const prompts: SavedPrompt[] = JSON.parse(stored);

        if (prompts.length > 0) {
          await migratePrompts({
            prompts: prompts.map((p) => ({
              placeName: p.placeName,
              url: p.url,
              sections: p.sections,
              createdAt: p.createdAt,
            })),
          });

          localStorage.removeItem("esset_prompts");
          localStorage.setItem("esset_prompts_migrated", "true");
          localStorage.removeItem("esset_anonymous_generations");
        }
      } catch (error) {
        console.error("Migration failed:", error);
      }

      setHasMigrated(true);
    };

    migrate();
  }, [user, migratePrompts, hasMigrated]);

  return null;
}

export function PromptMigration() {
  return (
    <Authenticated>
      <MigrationComponent />
    </Authenticated>
  );
}
