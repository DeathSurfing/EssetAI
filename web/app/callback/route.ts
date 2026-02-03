import { handleAuth } from "@workos-inc/authkit-nextjs";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  console.log("[Auth Debug] callback route called");
  console.log("[Auth Debug] Callback URL:", url.toString());
  console.log("[Auth Debug] Query params:", url.searchParams.toString());
  console.log("[Auth Debug] NODE_ENV:", process.env.NODE_ENV);
  console.log("[Auth Debug] NEXT_PUBLIC_WORKOS_REDIRECT_URI:", process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI);

  try {
    const handler = handleAuth();
    return await handler(request);
  } catch (error) {
    console.error("[Auth Debug] Error in callback handler:", error);
    throw error;
  }
}
