"use client";

import { useCallback, useEffect, useState, useRef } from "react";
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

// Convert Convex prompt to SavedPrompt format with error handling
export const convertConvexPrompt = (prompt: any): SavedPrompt | null => {
  // Validate prompt data
  if (!prompt) {
    console.error("[convertConvexPrompt] Received null/undefined prompt");
    return null;
  }

  if (!prompt._id) {
    console.error("[convertConvexPrompt] Prompt missing _id:", prompt);
    return null;
  }

  // Handle missing or invalid sections
  const sections = Array.isArray(prompt.sections) ? prompt.sections : [];
  
  if (!Array.isArray(prompt.sections)) {
    console.warn(`[convertConvexPrompt] Prompt ${prompt._id} has invalid sections:`, prompt.sections);
  }

  return {
    id: prompt._id,
    placeName: prompt.placeName || "Untitled",
    url: prompt.url || "",
    timestamp: prompt.createdAt || Date.now(),
    promptPreview: sections.length > 0 
      ? sections.map((s: any) => s?.content || "").join(" ").slice(0, 150) + "..."
      : "No content...",
    fullPrompt: sections.length > 0
      ? sections.map((s: any) => `${s?.header || ""}\n${s?.content || ""}`).join("\n\n")
      : "",
    sections: sections.map((s: any) => ({
      header: s?.header || "",
      content: s?.content || "",
      isRegenerating: false,
      isDirty: false,
      previousContent: null,
    })),
  };
};

interface UsePromptHistoryReturn {
  prompts: SavedPrompt[];
  isLoading: boolean;
  isAuthReady: boolean;
  addPrompt: (prompt: Omit<SavedPrompt, "id" | "timestamp">) => Promise<string>;
  deletePrompt: (id: string) => Promise<void>;
  searchPrompts: (query: string) => SavedPrompt[];
  getPromptById: (id: string) => SavedPrompt | undefined;
  refresh: () => void;
}

export function usePromptHistory(): UsePromptHistoryReturn {
  const { user } = useAuth();
  const isWorkOSAuthenticated = !!user;
  
  // Track if we've successfully loaded prompts at least once
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convex queries and mutations
  const convexPrompts = useQuery(api.prompts.getMyPrompts);
  const createPrompt = useMutation(api.prompts.createPrompt);
  const deleteConvexPrompt = useMutation(api.prompts.deletePrompt);

  // Local state
  const [localPrompts, setLocalPrompts] = useState<SavedPrompt[]>(() =>
    loadFromStorage()
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Convert prompts with error handling - filter out nulls
  const convertedPrompts = isWorkOSAuthenticated
    ? (convexPrompts || [])
        .map(convertConvexPrompt)
        .filter((p): p is SavedPrompt => p !== null)
    : localPrompts;

  // Determine if auth is ready (Convex has returned data or confirmed empty)
  const isAuthReady = isWorkOSAuthenticated && convexPrompts !== undefined;
  
  // Loading state: still loading if authenticated but haven't got Convex data yet
  const isLoading = isWorkOSAuthenticated && convexPrompts === undefined && retryCount < maxRetries;

  // Retry logic: if we have WorkOS auth but no Convex data, retry
  useEffect(() => {
    if (isWorkOSAuthenticated && convexPrompts === undefined && retryCount < maxRetries) {
      console.log(`[PromptHistory] Retry ${retryCount + 1}/${maxRetries} - waiting for Convex data...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Force a re-render to trigger query refetch
        setRefreshKey(k => k + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s, etc.
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isWorkOSAuthenticated, convexPrompts, retryCount]);

  // Reset retry count when we successfully get data
  useEffect(() => {
    if (convexPrompts !== undefined && !hasLoadedOnce) {
      setHasLoadedOnce(true);
      setRetryCount(0);
      console.log("[PromptHistory] Successfully loaded prompts:", convexPrompts.length);
    }
  }, [convexPrompts, hasLoadedOnce]);

  // Debug logging
  useEffect(() => {
    console.log("[PromptHistory] State:", {
      isWorkOSAuthenticated,
      isAuthReady,
      isLoading,
      retryCount,
      convexPromptsCount: convexPrompts?.length,
      convertedPromptsCount: convertedPrompts.length,
      hasLoadedOnce
    });
  }, [isWorkOSAuthenticated, isAuthReady, isLoading, retryCount, convexPrompts, convertedPrompts.length, hasLoadedOnce]);

  // Listen for storage changes from other tabs (only for localStorage)
  useEffect(() => {
    if (isWorkOSAuthenticated) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        cachedPrompts = null;
        setLocalPrompts(loadFromStorage());
        setRefreshKey((k) => k + 1);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [isWorkOSAuthenticated]);

  // Sync with localStorage periodically (only for anonymous users)
  useEffect(() => {
    if (isWorkOSAuthenticated) return;

    const interval = setInterval(() => {
      const current = loadFromStorage();
      if (JSON.stringify(current) !== JSON.stringify(localPrompts)) {
        setLocalPrompts(current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [localPrompts, isWorkOSAuthenticated]);

  const addPrompt = useCallback(
    async (prompt: Omit<SavedPrompt, "id" | "timestamp">): Promise<string> => {
      if (isWorkOSAuthenticated) {
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
    [isWorkOSAuthenticated, localPrompts, createPrompt]
  );

  const deletePrompt = useCallback(
    async (id: string) => {
      if (isWorkOSAuthenticated) {
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
    [isWorkOSAuthenticated, localPrompts, deleteConvexPrompt]
  );

  const searchPrompts = useCallback(
    (query: string) => {
      if (!query.trim()) return convertedPrompts;
      const lowerQuery = query.toLowerCase();
      return convertedPrompts.filter((p) =>
        p.placeName.toLowerCase().includes(lowerQuery)
      );
    },
    [convertedPrompts]
  );

  const getPromptById = useCallback(
    (id: string) => {
      return convertedPrompts.find((p) => p.id === id);
    },
    [convertedPrompts]
  );

  const refresh = useCallback(() => {
    cachedPrompts = null;
    setLocalPrompts(loadFromStorage());
    setRefreshKey((k) => k + 1);
    setRetryCount(0);
    setHasLoadedOnce(false);
  }, []);

  return {
    prompts: convertedPrompts,
    isLoading,
    isAuthReady,
    addPrompt,
    deletePrompt,
    searchPrompts,
    getPromptById,
    refresh,
  };
}
