"use client";

import { useState, useEffect, useCallback } from "react";
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

interface UsePromptHistoryReturn {
  prompts: SavedPrompt[];
  addPrompt: (prompt: Omit<SavedPrompt, "id" | "timestamp">) => void;
  deletePrompt: (id: string) => void;
  searchPrompts: (query: string) => SavedPrompt[];
  getPromptById: (id: string) => SavedPrompt | undefined;
}

// Load initial state from localStorage
const loadInitialPrompts = (): SavedPrompt[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse prompt history:", e);
    }
  }
  return [];
};

export function usePromptHistory(): UsePromptHistoryReturn {
  const [prompts, setPrompts] = useState<SavedPrompt[]>(loadInitialPrompts);

  // Save to localStorage whenever prompts change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const addPrompt = useCallback(
    (prompt: Omit<SavedPrompt, "id" | "timestamp">) => {
      const newPrompt: SavedPrompt = {
        ...prompt,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      setPrompts((prev) => {
        // FIFO: Add new prompt at the beginning, keep only last 10
        const updated = [newPrompt, ...prev].slice(0, MAX_ITEMS);
        return updated;
      });
    },
    []
  );

  const deletePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

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

  return {
    prompts,
    addPrompt,
    deletePrompt,
    searchPrompts,
    getPromptById,
  };
}
