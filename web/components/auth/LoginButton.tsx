"use client";

import Link from "next/link";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user.firstName || user.email}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button variant="secondary" size="sm" asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
