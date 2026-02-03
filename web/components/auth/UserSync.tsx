"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Authenticated, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY = 1000;

function UserSyncInner() {
  const { user } = useAuth();
  const syncUser = useMutation(api.users.syncUserFromWorkOS);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const attemptSync = useCallback(async () => {
    if (!user || syncAttempts >= MAX_RETRY_ATTEMPTS || isSyncing) {
      return;
    }

    setIsSyncing(true);
    console.log(`[UserSync] Attempt ${syncAttempts + 1}/${MAX_RETRY_ATTEMPTS} to sync user:`, user.id);

    try {
      const userId = await syncUser({
        workosId: user.id,
        email: user.email,
        name: user.firstName
          ? user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.firstName
          : undefined,
        avatar: user.profilePictureUrl ?? undefined,
      });
      
      console.log("[UserSync] User synced successfully to Convex:", userId);
      setSyncAttempts(MAX_RETRY_ATTEMPTS); // Mark as complete
      
      // Dispatch a custom event to notify other components that user is synced
      window.dispatchEvent(new CustomEvent('user-synced', { detail: { userId } }));
    } catch (error) {
      console.error(`[UserSync] Failed to sync user (attempt ${syncAttempts + 1}):`, error);
      setSyncAttempts(prev => prev + 1);
      
      if (syncAttempts + 1 >= MAX_RETRY_ATTEMPTS) {
        toast.error("Failed to sync user data. Please refresh the page.");
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, syncUser, syncAttempts, isSyncing]);

  useEffect(() => {
    if (!user) return;

    if (syncAttempts === 0) {
      // First attempt immediately
      attemptSync();
    } else if (syncAttempts < MAX_RETRY_ATTEMPTS && !isSyncing) {
      // Retry with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(1.5, syncAttempts - 1);
      console.log(`[UserSync] Retrying in ${delay}ms...`);
      
      const timeoutId = setTimeout(() => {
        attemptSync();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [user, syncAttempts, attemptSync, isSyncing]);

  return null;
}

export function UserSync() {
  return (
    <Authenticated>
      <UserSyncInner />
    </Authenticated>
  );
}
