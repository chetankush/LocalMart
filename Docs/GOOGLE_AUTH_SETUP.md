# Google OAuth Setup Guide for LocalMart

This guide will help you configure Google Sign-In for your LocalMart application using Supabase.

## Prerequisites
- A Google account
- Supabase project (already created)
- Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select an existing one

### 1.2 Enable Google+ API (Optional for newer versions)
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable** (if not already enabled)

### 1.3 Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace account)
3. Click **Create**
4. Fill in the required information:
   - **App name**: LocalMart
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. Skip the Scopes section (click **Save and Continue**)
7. Add test users if in testing mode
8. Click **Save and Continue** and then **Back to Dashboard**

### 1.4 Create OAuth 2.0 Client ID
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. Give it a name: **LocalMart Web Client**
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://piwtgqryjcneszxjajwk.supabase.co
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/callback
   https://piwtgqryjcneszxjajwk.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. **IMPORTANT**: Copy your **Client ID** and **Client Secret** - you'll need these next!

## Step 2: Configure Google Provider in Supabase

### 2.1 Go to Supabase Dashboard
1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **piwtgqryjcneszxjajwk**
3. Go to **Authentication** → **Providers** in the left sidebar

### 2.2 Enable Google Provider
1. Find **Google** in the list of providers
2. Enable it by toggling the switch
3. Enter your **Client ID** (from Google Cloud Console)
4. Enter your **Client Secret** (from Google Cloud Console)
5. Click **Save**

## Step 3: Verify Email/Password is Enabled

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email settings:
   - **Enable email confirmations**: Toggle ON (recommended for production)
   - **Enable email confirmations**: Toggle OFF (for easier testing in development)

## Step 4: Test Authentication

### 4.1 Start Your Development Server
```bash
npm run dev
```

### 4.2 Test Google Sign-In
1. Go to `http://localhost:3000/sign-up`
2. Click **Continue with Google**
3. Select your Google account
4. Grant permissions
5. You should be redirected to `/select-role`

### 4.3 Test Email/Password Sign-Up
1. Go to `http://localhost:3000/sign-up`
2. Fill in:
   - Full Name
   - Email
   - Password (minimum 6 characters)
3. Click **Create Account**
4. If email confirmation is enabled:
   - Check your email for confirmation link
   - Click the link to verify
5. If email confirmation is disabled:
   - You'll be redirected to sign-in
   - Sign in with your credentials

### 4.4 Test Email/Password Sign-In
1. Go to `http://localhost:3000/sign-in`
2. Enter your email and password
3. Click **Sign In**
4. You should be redirected to `/select-role`

## Step 5: Update for Production

When deploying to production, update the following:

### 5.1 Update Google OAuth Credentials
Add your production URLs to Google Cloud Console:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**:
  ```
  https://yourdomain.com/auth/callback
  https://piwtgqryjcneszxjajwk.supabase.co/auth/v1/callback
  ```

### 5.2 Update Supabase Settings
1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://yourdomain.com`
3. Add **Redirect URLs**: `https://yourdomain.com/auth/callback`

## Troubleshooting

### Error: "Unsupported provider: provider is not enabled"
- **Solution**: Make sure Google provider is enabled in Supabase Dashboard → Authentication → Providers

### Error: "redirect_uri_mismatch"
- **Solution**: Make sure your redirect URI in Google Cloud Console matches exactly:
  ```
  https://piwtgqryjcneszxjajwk.supabase.co/auth/v1/callback
  ```

### Error: "Invalid email or password"
- **Solution**:
  - Check if email confirmation is required
  - Verify email by clicking the link sent to your inbox
  - Make sure password is at least 6 characters

### Google Sign-In Opens but Doesn't Redirect
- **Solution**:
  - Check browser console for errors
  - Verify callback route exists at `/app/auth/callback/route.ts`
  - Make sure middleware allows `/auth/callback` route

## Current Implementation Status

✅ Email/Password Authentication
✅ Google OAuth Authentication
✅ Auth callback route configured
✅ Role selection flow after authentication
✅ Prisma database sync on user creation
❌ Facebook OAuth (removed - not configured)
❌ Phone Auth (removed - SMS provider not configured)

## Next Steps

1. Configure Google OAuth in Google Cloud Console
2. Enable Google provider in Supabase Dashboard
3. Test both authentication methods
4. Once working, you can optionally add:
   - Facebook OAuth
   - Phone/SMS authentication
   - Additional OAuth providers

## Files Modified

- `lib/supabase/auth-provider.tsx` - Removed Facebook, kept Google + Email auth
- `app/(auth)/sign-up/page.tsx` - Removed Facebook and Phone UI
- `app/(auth)/sign-in/page.tsx` - Removed Facebook and Phone UI
- `app/auth/callback/route.ts` - Already configured for OAuth callbacks
