import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID ? "✓ Set" : "✗ Missing",
    WORKOS_API_KEY: process.env.WORKOS_API_KEY ? "✓ Set" : "✗ Missing",
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD ? "✓ Set" : "✗ Missing",
  };

  const diagnostic = {
    timestamp: new Date().toISOString(),
    environment: envVars,
    issues: [] as string[],
  };

  // Check for common issues
  if (!process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI) {
    diagnostic.issues.push("NEXT_PUBLIC_WORKOS_REDIRECT_URI is not set");
  } else if (process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI.includes("localhost")) {
    diagnostic.issues.push("NEXT_PUBLIC_WORKOS_REDIRECT_URI contains 'localhost' - should be production URL");
  }

  if (!process.env.WORKOS_CLIENT_ID) {
    diagnostic.issues.push("WORKOS_CLIENT_ID is not set");
  }

  if (!process.env.WORKOS_API_KEY) {
    diagnostic.issues.push("WORKOS_API_KEY is not set");
  }

  if (!process.env.WORKOS_COOKIE_PASSWORD) {
    diagnostic.issues.push("WORKOS_COOKIE_PASSWORD is not set");
  }

  const status = diagnostic.issues.length === 0 ? "ok" : "error";

  return NextResponse.json({
    status,
    ...diagnostic,
    nextSteps: diagnostic.issues.length > 0 ? [
      "1. Check WorkOS dashboard: https://dashboard.workos.com",
      "2. Verify environment variables are set in your deployment platform",
      "3. Ensure NEXT_PUBLIC_WORKOS_REDIRECT_URI matches your production domain",
      "4. Restart your deployment after changing environment variables",
    ] : [],
  });
}
