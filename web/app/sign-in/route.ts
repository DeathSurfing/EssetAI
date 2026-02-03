import { redirect } from "next/navigation";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

export async function GET() {
  const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

  console.log("[Auth Debug] sign-in route called");
  console.log("[Auth Debug] NEXT_PUBLIC_WORKOS_REDIRECT_URI:", redirectUri);
  console.log("[Auth Debug] NODE_ENV:", process.env.NODE_ENV);
  console.log("[Auth Debug] All env keys:", Object.keys(process.env).filter(k => k.includes("WORKOS") || k.includes("REDIRECT")));

  if (!redirectUri) {
    console.error("[Auth Debug] ERROR: NEXT_PUBLIC_WORKOS_REDIRECT_URI is not set!");
    throw new Error("NEXT_PUBLIC_WORKOS_REDIRECT_URI environment variable is required");
  }

  try {
    const authorizationUrl = await getSignInUrl({
      redirectUri,
    });

    console.log("[Auth Debug] Generated authorization URL:", authorizationUrl);
    return redirect(authorizationUrl);
  } catch (error) {
    console.error("[Auth Debug] Error generating sign-in URL:", error);
    throw error;
  }
}
