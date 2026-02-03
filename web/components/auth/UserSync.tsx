"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Authenticated, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function UserSyncInner() {
  const { user } = useAuth();
  const syncUser = useMutation(api.users.syncUserFromWorkOS);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!user || hasSynced.current) return;

    const sync = async () => {
      try {
        hasSynced.current = true;
        await syncUser({
          workosId: user.id,
          email: user.email,
          name: user.firstName
            ? user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName
            : undefined,
          avatar: user.profilePictureUrl ?? undefined,
        });
        console.log("User synced successfully to Convex");
      } catch (error) {
        console.error("Failed to sync user to Convex:", error);
        hasSynced.current = false;
      }
    };

    sync();
  }, [user, syncUser]);

  return null;
}

export function UserSync() {
  return (
    <Authenticated>
      <UserSyncInner />
    </Authenticated>
  );
}
