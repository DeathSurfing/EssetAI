"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { SectionState } from "@/lib/prompt-parser";
import { toast } from "sonner";

const STORAGE_KEY = "esset_prompts";
const MAX_ITEMS = 10;

export interface SavedPrompt {
  id: string;
  placeName: string;
  url: string;
  timestamp: number;
  promptPreview: string;
  fullPrompt: string;
  sections: SectionState[];
}

// Module-level cache for localStorage
let cachedPrompts: SavedPrompt[] | null = null;

const loadFromStorage = (): SavedPrompt[] => {
  if (typeof window === "undefined") return [];
  if (cachedPrompts !== null) return cachedPrompts;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: SavedPrompt[] = JSON.parse(stored);
      cachedPrompts = parsed;
      return parsed;
    } catch (e) {
      console.error("Failed to parse prompt history:", e);
    }
  }
  cachedPrompts = [];
  return cachedPrompts;
};

const saveToStorage = (prompts: SavedPrompt[]) => {
  if (typeof window === "undefined") return;
  cachedPrompts = prompts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
};

// Convert Convex prompt to SavedPrompt format
const convertConvexPrompt = (prompt: any): SavedPrompt => ({
  id: prompt._id,
  placeName: prompt.placeName,
  url: prompt.url,
  timestamp: prompt.createdAt,
  promptPreview: prompt.sections.map((s: any) => s.content).join(" ").slice(0, 150) + "...",
  fullPrompt: prompt.sections.map((s: any) => `${s.header}\n${s.content}`).join("\n\n"),
  sections: prompt.sections,
});

interface UsePromptHistoryReturn {
  prompts: SavedPrompt[];
  isLoading: boolean;
  addPrompt: (prompt: Omit<SavedPrompt, "id" | "timestamp">) => Promise<string>;
  deletePrompt: (id: string) => Promise<void>;
  searchPrompts: (query: string) => SavedPrompt[];
  getPromptById: (id: string) => SavedPrompt | undefined;
  refresh: () => void;
}

export function usePromptHistory(): UsePromptHistoryReturn {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Convex queries and mutations
  const convexPrompts = useQuery(api.prompts.getMyPrompts);
  const createPrompt = useMutation(api.prompts.createPrompt);
  const deleteConvexPrompt = useMutation(api.prompts.deletePrompt);

  // Local state
  const [localPrompts, setLocalPrompts] = useState<SavedPrompt[]>(() =>
    loadFromStorage()
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Combine prompts based on auth state
  const prompts = isAuthenticated
    ? (convexPrompts || []).map(convertConvexPrompt)
    : localPrompts;

  const isLoading = isAuthenticated && convexPrompts === undefined;

  // Listen for storage changes from other tabs (only for localStorage)
  useEffect(() => {
    if (isAuthenticated) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedPrompts = null;
        setLocalPrompts(loadFromStorage());
        setRefreshKey((k) => k + 1);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isAuthenticated]);

  // Sync with localStorage periodically (only for anonymous users)
  useEffect(() => {
    if (isAuthenticated) return;

    const interval = setInterval(() => {
      const current = loadFromStorage();
      if (JSON.stringify(current) !== JSON.stringify(localPrompts)) {
        setLocalPrompts(current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [localPrompts, isAuthenticated]);

  const addPrompt = useCallback(
    async (prompt: Omit<SavedPrompt, "id" | "timestamp">): Promise<string> => {
      if (isAuthenticated) {
        // Save to Convex - strip extra fields from sections
        try {
          const cleanSections = prompt.sections.map((section) => ({
            header: section.header,
            content: section.content,
          }));

          const promptId = await createPrompt({
            placeName: prompt.placeName,
            url: prompt.url,
            sections: cleanSections,
          });
          toast.success("Prompt saved to your account");
          return promptId;
        } catch (error) {
          console.error("Failed to save prompt to Convex:", error);
          toast.error("Failed to save prompt");
          throw error;
        }
      } else {
        // Save to localStorage
        const newPrompt: SavedPrompt = {
          ...prompt,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        const updated = [newPrompt, ...localPrompts].slice(0, MAX_ITEMS);
        saveToStorage(updated);
        setLocalPrompts(updated);
        return newPrompt.id;
      }
    },
    [isAuthenticated, localPrompts, createPrompt]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      if (isAuthenticated) {
        // Delete from Convex
        try {
          await deleteConvexPrompt({ id: id as any });
          toast.success("Prompt deleted");
        } catch (error) {
          console.error("Failed to delete prompt:", error);
          toast.error("Failed to delete prompt");
          throw error;
        }
      } else {
        // Delete from localStorage
        const updated = localPrompts.filter((p) => p.id !== id);
        saveToStorage(updated);
        setLocalPrompts(updated);
      }
    },
    [isAuthenticated, localPrompts, deleteConvexPrompt]
  );

  const searchPrompts = useCallback(
    (query: string) => {
      if (!query.trim()) return prompts;
      const lowerQuery = query.toLowerCase();
      return prompts.filter((p) =>
        p.placeName.toLowerCase().includes(lowerQuery)
      );
    },
    [prompts]
  );

  const getPromptById = useCallback(
    (id: string) => {
      return prompts.find((p) => p.id === id);
    },
    [prompts]
  );

  const refresh = useCallback(() => {
    cachedPrompts = null;
    setLocalPrompts(loadFromStorage());
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    prompts,
    isLoading,
    addPrompt,
    deletePrompt,
    searchPrompts,
    getPromptById,
    refresh,
  };
}
