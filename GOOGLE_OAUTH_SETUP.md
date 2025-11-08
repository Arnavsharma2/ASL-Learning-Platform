# Google OAuth Setup Guide

This guide will help you enable Google OAuth authentication for the ASL Learning Platform.

## Prerequisites

- A Supabase project (free tier works fine)
- A Google Cloud account (also free)

## Step 1: Get Google OAuth Credentials

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ASL Learning Platform" (or any name you prefer)
4. Click "Create"

### 1.2 Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to "APIs & Services" → "OAuth consent screen"
2. Select "External" as the User Type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: ASL Learning Platform
   - **User support email**: Your email
   - **Developer contact**: Your email
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Add test users if needed (for development)
8. Click "Save and Continue"

### 1.3 Create OAuth Credentials

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "ASL Learning Platform Web Client"
5. **Authorized JavaScript origins**: Leave empty for now
6. **Authorized redirect URIs**: You'll add this in the next step
7. Click "Create"
8. **Save your credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxx`

## Step 2: Configure Supabase

### 2.1 Get Your Supabase Callback URL

Your Supabase callback URL follows this format:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

To find it:
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Authentication" → "Providers"
4. The callback URL is shown at the top

### 2.2 Add Callback URL to Google Cloud

1. Return to Google Cloud Console → "Credentials"
2. Click on your OAuth client ID
3. Under "Authorized redirect URIs", click "Add URI"
4. Paste your Supabase callback URL
5. Click "Save"

### 2.3 Enable Google Provider in Supabase

1. In your Supabase Dashboard, go to "Authentication" → "Providers"
2. Find "Google" in the list
3. Toggle it to "Enabled"
4. Enter your credentials:
   - **Client ID**: The one from Google Cloud Console
   - **Client Secret**: The one from Google Cloud Console
5. Click "Save"

## Step 3: Test Your Setup

### 3.1 Frontend Configuration

Make sure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.2 Test the Flow

1. Start your backend: `cd backend && ./run.sh`
2. Start your frontend: `cd frontend && npm run dev`
3. Navigate to http://localhost:3000
4. Click "Sign In"
5. Click "Sign in with Google"
6. You should be redirected to Google's OAuth page
7. After signing in, you'll be redirected back to the dashboard

## Troubleshooting

### Error: "Provider is not enabled"

**Solution**: Make sure you enabled Google in Supabase Authentication → Providers

### Error: "redirect_uri_mismatch"

**Solution**:
1. Check that the callback URL in Google Cloud Console matches exactly with your Supabase callback URL
2. Make sure there are no trailing slashes

### Error: "Access blocked: This app's request is invalid"

**Solution**:
1. Make sure your OAuth consent screen is configured
2. Add your email as a test user in Google Cloud Console
3. Verify the scopes are correct (should include email and profile)

### OAuth Works in Development but Not Production

When deploying to production:

1. Update Google Cloud Console redirect URIs to include your production URL:
   ```
   https://your-production-url.vercel.app/auth/callback
   ```

2. Update your production environment variables in Vercel/Railway

3. Make sure your Supabase project is configured for production

## Security Best Practices

1. **Never commit credentials**: Keep `.env.local` and `.env` files in `.gitignore`
2. **Use environment variables**: Always use environment variables for sensitive data
3. **Rotate secrets**: If you accidentally expose credentials, rotate them immediately
4. **Limit scopes**: Only request the OAuth scopes you actually need (email, profile)
5. **HTTPS in production**: Always use HTTPS for OAuth in production

## Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase logs in the Dashboard
3. Verify all environment variables are set correctly
4. Ensure both backend and frontend are running

For this project specifically:
- The authentication implementation is in `frontend/contexts/AuthContext.tsx`
- The OAuth callback handler is in `frontend/app/auth/callback/route.ts`
- Login page: `frontend/app/auth/login/page.tsx`
