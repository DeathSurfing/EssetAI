"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Authenticated } from "convex/react";
import { toast } from "sonner";

interface Section {
  header: string;
  content: string;
  isDirty?: boolean;
  isRegenerating?: boolean;
  previousContent?: string | null;
}

interface SavedPrompt {
  id: string;
  placeName: string;
  url: string;
  sections: Section[];
  createdAt: number;
}

const STORAGE_KEY = "website-prompt-history";

function MigrationComponent() {
  const [hasMigrated, setHasMigrated] = useState(false);
  const migratePrompts = useMutation(api.prompts.migratePrompts);
  const user = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    const migrate = async () => {
      if (hasMigrated || !user) return;

      const migrationFlag = localStorage.getItem("esset_prompts_migrated_v1");
      if (migrationFlag === "true") {
        // Clean up any leftover localStorage data from old key
        localStorage.removeItem("esset_prompts");
        localStorage.removeItem("esset_prompts_migrated");
        return;
      }

      // Check both old and new storage keys
      const storedOld = localStorage.getItem("esset_prompts");
      const storedNew = localStorage.getItem(STORAGE_KEY);
      const promptsToMigrate: SavedPrompt[] = [];

      if (storedOld) {
        try {
          const parsed = JSON.parse(storedOld);
          if (Array.isArray(parsed) && parsed.length > 0) {
            promptsToMigrate.push(...parsed);
          }
        } catch (e) {
          console.error("Failed to parse old prompt format:", e);
        }
      }

      if (storedNew && promptsToMigrate.length === 0) {
        try {
          const parsed = JSON.parse(storedNew);
          if (Array.isArray(parsed) && parsed.length > 0) {
            promptsToMigrate.push(...parsed);
          }
        } catch (e) {
          console.error("Failed to parse prompt history:", e);
        }
      }

      if (promptsToMigrate.length === 0) {
        localStorage.setItem("esset_prompts_migrated_v1", "true");
        return;
      }

      try {
        toast.loading(`Migrating ${promptsToMigrate.length} prompts to your account...`, {
          id: "migration-toast",
        });

        await migratePrompts({
          prompts: promptsToMigrate.map((p) => ({
            placeName: p.placeName,
            url: p.url,
            sections: p.sections.map((section) => ({
              header: section.header,
              content: section.content,
            })),
            createdAt: p.createdAt,
          })),
        });

        // Clear all localStorage prompt data
        localStorage.removeItem("esset_prompts");
        localStorage.removeItem("esset_prompts_migrated");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem("esset_prompts_migrated_v1", "true");
        localStorage.removeItem("esset_anonymous_generations");

        toast.success(`Successfully migrated ${promptsToMigrate.length} prompts to your account!`, {
          id: "migration-toast",
          duration: 5000,
        });

        // Refresh the page to load Convex data
        window.location.reload();
      } catch (error) {
        console.error("Migration failed:", error);
        toast.error("Failed to migrate prompts. Please try refreshing the page.", {
          id: "migration-toast",
        });
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
