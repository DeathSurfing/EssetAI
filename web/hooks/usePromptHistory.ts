"use client";

import { useCallback, useEffect, useState } from "react";
import { SectionState } from "@/lib/prompt-parser";

const STORAGE_KEY = "website-prompt-history";
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

// Module-level cache
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

interface UsePromptHistoryReturn {
  prompts: SavedPrompt[];
  addPrompt: (prompt: Omit<SavedPrompt, "id" | "timestamp">) => void;
  deletePrompt: (id: string) => void;
  searchPrompts: (query: string) => SavedPrompt[];
  getPromptById: (id: string) => SavedPrompt | undefined;
  refresh: () => void;
}

export function usePromptHistory(): UsePromptHistoryReturn {
  // Initialize from cache/storage
  const [prompts, setPromptsState] = useState<SavedPrompt[]>(() => loadFromStorage());
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedPrompts = null; // Clear cache to force reload
        setPromptsState(loadFromStorage());
        setRefreshKey(k => k + 1);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Sync with cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const current = loadFromStorage();
      if (JSON.stringify(current) !== JSON.stringify(prompts)) {
        setPromptsState(current);
      }
    }, 1000);
    
    return () => clearInterval(interval);
     
  }, [prompts, refreshKey]);



  const addPrompt = useCallback(
    (prompt: Omit<SavedPrompt, "id" | "timestamp">) => {
      const newPrompt: SavedPrompt = {
        ...prompt,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // FIFO: Add new prompt at the beginning, keep only last 10
      const updated = [newPrompt, ...prompts].slice(0, MAX_ITEMS);
      saveToStorage(updated);
      setPromptsState(updated);
    },
    [prompts]
  );

  const deletePrompt = useCallback(
    (id: string) => {
      const updated = prompts.filter((p) => p.id !== id);
      saveToStorage(updated);
      setPromptsState(updated);
    },
    [prompts]
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
    setPromptsState(loadFromStorage());
    setRefreshKey(k => k + 1);
  }, []);

  return {
    prompts,
    addPrompt,
    deletePrompt,
    searchPrompts,
    getPromptById,
    refresh,
  };
}
