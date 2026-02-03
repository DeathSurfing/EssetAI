DEPLOYMENT.md
# Deployment Guide for Esset

## Environment Variables Setup

### Required Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the following values:

#### OpenRouter API Configuration
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
```

#### Convex Configuration
```env
CONVEX_DEPLOYMENT=your_convex_deployment_name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

#### WorkOS AuthKit Configuration (CRITICAL)
```env
# Get these from https://dashboard.workos.com
WORKOS_CLIENT_ID=client_your_client_id_here
WORKOS_API_KEY=sk_live_your_production_api_key_here  # Use sk_live_ for production, NOT sk_test_
WORKOS_COOKIE_PASSWORD=your_secure_random_32_char_password_here

# IMPORTANT: Update this for production!
NEXT_PUBLIC_WORKOS_REDIRECT_URI=https://esset.adityavikram.dev/callback
```

**⚠️ CRITICAL: Do NOT use `sk_test_` keys in production!**

### WorkOS Dashboard Configuration

1. Go to https://dashboard.workos.com
2. Navigate to your application settings
3. Add these **Redirect URIs**:
   - `https://esset.adityavikram.dev/callback`
   - `https://esset.adityavikram.dev/sign-in`
   - `https://esset.adityavikram.dev/sign-up`
4. Set the **Default Redirect URI** to: `https://esset.adityavikram.dev/callback`
5. Enable the domains you want to allow for sign-in

### Platform-Specific Setup

#### Vercel
If deploying to Vercel:
1. Go to Project Settings → Environment Variables
2. Add all environment variables from above
3. Redeploy the application

#### Manual Deployment
If deploying manually:
1. Set environment variables on your server
2. Restart the application
3. Verify the callback URL is accessible

## Debugging

### Common Issues

#### "Couldn't sign in" Error
- Check that `NEXT_PUBLIC_WORKOS_REDIRECT_URI` matches your production domain
- Verify WorkOS dashboard has the correct redirect URIs configured
- Ensure you're using production API keys (sk_live_ not sk_test_)

#### Prompts Not Loading
- Check browser console for error messages
- Verify Convex deployment is configured correctly
- Ensure user is properly authenticated

#### Build Errors
- Run `npm run build` locally to catch errors early
- Check that all environment variables are set
- Verify TypeScript types with `npm run typecheck`

### Logs and Monitoring

- Check browser console for client-side errors
- Monitor WorkOS dashboard for authentication events
- Check Convex dashboard for database queries

## Production Checklist

- [ ] Updated `NEXT_PUBLIC_WORKOS_REDIRECT_URI` to production domain
- [ ] Using WorkOS production API keys (sk_live_)
- [ ] Added production domain to WorkOS dashboard redirect URIs
- [ ] Set all required environment variables
- [ ] Tested sign-in flow on production
- [ ] Tested prompt loading on production
- [ ] Verified error handling works correctly

## Support

If issues persist:
1. Check browser console for error messages
2. Review WorkOS dashboard logs
3. Verify all environment variables are set correctly
4. Test with a fresh browser session (clear cookies/localStorage)
