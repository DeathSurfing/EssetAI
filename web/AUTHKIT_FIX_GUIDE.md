# AuthKit Redirect Fix Guide

## Problem
AuthKit is redirecting to `localhost:3000` instead of production domain `https://esset.adityavikram.dev`

## Quick Diagnostic

### Step 1: Check Environment Variables

Visit: `https://esset.adityavikram.dev/api/debug/auth`

This will show you:
- Which environment variables are set
- Whether `NEXT_PUBLIC_WORKOS_REDIRECT_URI` contains localhost
- Any configuration issues

### Step 2: Check WorkOS Dashboard

1. Go to https://dashboard.workos.com
2. Navigate to your application
3. Click **Configuration** tab
4. Check these settings:

**Redirect URIs section should show:**
```
Default Redirect URI: https://esset.adityavikram.dev/callback

Allowed Redirect URIs:
☑ https://esset.adityavikram.dev/callback
☑ https://esset.adityavikram.dev/sign-in
☑ https://esset.adityavikram.dev/sign-up
```

**Common mistake:** The Default Redirect URI might still be `http://localhost:3000/callback`

### Step 3: Verify Production Environment Variables

**If deploying to Vercel:**
1. Go to https://vercel.com/dashboard
2. Find your project
3. Go to **Settings** → **Environment Variables**
4. Verify these are set:
   - `NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://esset.adityavikram.dev/callback`
   - `WORKOS_CLIENT_ID=client_01KGHY0AFYSEB3X79HKECQ8Z6P`
   - `WORKOS_API_KEY=sk_a2V5XzAxS0dKU0NETUg5NFFIN1pKVEtCN0JEOVpILHFnUDBxbUMxMnlxeEh6TzZhcWsxU0ZGUWc`
   - `WORKOS_COOKIE_PASSWORD=eIJPcs18rgfIomsZDBRrwBp0qPSfj2R57SJdRW4vEuI=`

5. **Important:** After changing environment variables, you must redeploy!
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment

**If deploying elsewhere (Railway, Render, etc.):**
- Check their environment variable settings
- Make sure all 4 WorkOS variables are set
- Restart the service after making changes

## Debug Console Output

After adding the debug logging, check these places for clues:

### 1. Server Logs (Vercel Functions)
In Vercel dashboard:
- Go to **Monitoring** or **Functions** tab
- Look for logs with `[Auth Debug]` prefix
- Check the sign-in and callback routes

### 2. Browser Console
Open DevTools (F12) → Console:
- Look for `[LoginButton Debug]` messages
- Click Sign In and watch the network tab

## Most Likely Causes

### 1. WorkOS Dashboard Default Redirect URI
**Fix:** Change the Default Redirect URI from `localhost:3000` to `https://esset.adityavikram.dev/callback`

### 2. Environment Variables Not Set in Production
**Fix:** Add all WorkOS environment variables to your deployment platform and redeploy

### 3. NEXT_PUBLIC_ Variable Not Available at Build Time
**Note:** `NEXT_PUBLIC_` variables are embedded at build time, not runtime.
- If you set the env var after building, you need to rebuild/redeploy
- This is why changing env vars requires a redeploy on Vercel

## Testing the Fix

1. **Check the debug endpoint:**
   ```
   https://esset.adityavikram.dev/api/debug/auth
   ```
   Should show `status: "ok"` and no issues

2. **Clear browser cookies:**
   - DevTools → Application → Cookies → Clear all
   - Or try in an incognito window

3. **Try signing in:**
   - Click "Sign in" button
   - Should redirect to WorkOS, then back to production domain (not localhost)
   - Check browser console for `[Auth Debug]` logs

4. **Check server logs:**
   - Look for the authorization URL being generated
   - Verify it doesn't contain `localhost:3000`

## Still Not Working?

If you've verified all the above and it's still redirecting to localhost:

1. **Check if it's a cached redirect:**
   - WorkOS might be caching the old redirect
   - Wait 5-10 minutes and try again
   - Or try creating a new browser session

2. **Check the exact redirect:**
   - Open DevTools → Network tab
   - Preserve log (checkbox)
   - Click Sign In
   - Look for the redirect chain
   - See exactly where localhost appears

3. **Contact WorkOS support:**
   - Include your client ID: `client_01KGHY0AFYSEB3X79HKECQ8Z6P`
   - Describe the redirect chain you're seeing
   - They can check their logs

## Need to Rollback?

If these changes cause issues, you can revert:
```bash
git checkout HEAD -- app/sign-in/route.ts app/sign-up/route.ts app/callback/route.ts components/auth/LoginButton.tsx
rm app/api/debug/auth/route.ts
```

## Next Steps

After fixing, you can remove the debug logging by reverting the changes above, or keep them for future debugging.
