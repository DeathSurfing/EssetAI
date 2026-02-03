import { redirect } from "next/navigation";
import { getSignUpUrl } from "@workos-inc/authkit-nextjs";

export async function GET() {
  const authorizationUrl = await getSignUpUrl({
    redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
  });
  return redirect(authorizationUrl);
}
