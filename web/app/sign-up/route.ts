import { redirect } from "next/navigation";
import { getSignUpUrl } from "@workos-inc/authkit-nextjs";

export async function GET() {
  const redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI;

  console.log("[Auth Debug] sign-up route called");
  console.log("[Auth Debug] NEXT_PUBLIC_WORKOS_REDIRECT_URI:", redirectUri);

  if (!redirectUri) {
    console.error("[Auth Debug] ERROR: NEXT_PUBLIC_WORKOS_REDIRECT_URI is not set!");
    throw new Error("NEXT_PUBLIC_WORKOS_REDIRECT_URI environment variable is required");
  }

  try {
    const authorizationUrl = await getSignUpUrl({
      redirectUri,
    });

    console.log("[Auth Debug] Generated authorization URL:", authorizationUrl);
    return redirect(authorizationUrl);
  } catch (error) {
    console.error("[Auth Debug] Error generating sign-up URL:", error);
    throw error;
  }
}
