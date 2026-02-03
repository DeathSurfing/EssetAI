"use client";

import { ReactNode, useCallback, useRef, useEffect, useState } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuthKit } from "@convex-dev/workos";
import {
  AuthKitProvider,
  useAuth,
  useAccessToken,
} from "@workos-inc/authkit-nextjs/components";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuthKit client={convex} useAuth={useAuthFromAuthKit}>
        {children}
      </ConvexProviderWithAuthKit>
    </AuthKitProvider>
  );
}

function useAuthFromAuthKit() {
  const { user, loading: isLoading } = useAuth();
  const { accessToken, loading: tokenLoading, error: tokenError } =
    useAccessToken();

  const loading = (isLoading ?? false) || (tokenLoading ?? false);

  // Use a ref that we can mutate to always have the latest token
  const tokenRef = useRef<string | null>(null);
  
  // Update the ref whenever accessToken changes
  useEffect(() => {
    if (accessToken && !tokenError) {
      console.log("[ConvexClientProvider] Access token updated, length:", accessToken.length);
      tokenRef.current = accessToken;
    } else if (tokenError) {
      console.error("[ConvexClientProvider] Token error:", tokenError);
      tokenRef.current = null;
    }
  }, [accessToken, tokenError]);

  // This function is called by Convex to get the auth token
  // It must return the CURRENT token value, not a stale one
  const getAccessToken = useCallback(async () => {
    const currentToken = tokenRef.current;
    console.log("[ConvexClientProvider] getAccessToken called, has token:", !!currentToken);
    
    if (!currentToken) {
      console.warn("[ConvexClientProvider] No access token available");
    }
    
    return currentToken;
  }, []); // No dependencies - always reads from ref

  return {
    isLoading: loading,
    user,
    getAccessToken,
  };
}
