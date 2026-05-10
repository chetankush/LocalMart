# 🚀 Supabase Authentication Setup Guide

## Complete setup for Google, Facebook, and Phone OTP authentication

---

## 📋 **Prerequisites**

- Supabase account (free tier works)
- Google Cloud Console account (for Google OAuth)
- Facebook Developer account (for Facebook OAuth)
- Indian phone number for testing (for Phone OTP)

---

## 🔧 **Step 1: Create Supabase Project**

### **A. Sign Up / Sign In**

1. Go to: https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended)

### **B. Create New Project**

1. Click "New Project"
2. Enter project details:
   - **Name:** `LocalMart` (or your app name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to India (e.g., Mumbai, Singapore)
   - **Pricing Plan:** Free tier is perfect to start
3. Click "Create new project"
4. Wait 2-3 minutes for project setup

### **C. Get API Keys**

1. Go to **Project Settings** (⚙️ icon in sidebar)
2. Click **API** in left menu
3. Copy these values:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGciOiJ...
   ```

---

## 🔐 **Step 2: Configure Environment Variables**

### **Create `.env.local` file:**

```bash
# Database (from Supabase dashboard)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get Database URL:**

1. Supabase Dashboard → Project Settings → Database
2. Copy "Connection string" → "URI"
3. Replace `[YOUR-PASSWORD]` with your database password

---

## 📱 **Step 3: Enable Phone Authentication**

### **A. Enable Phone Provider**

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Phone** provider
3. Toggle it **ON** (enabled)
4. Click **Save**

### **B. Configure Phone Settings**

Supabase uses Twilio for SMS by default. You have two options:

#### **Option 1: Use Supabase's Twilio (Easiest for testing)**

1. Supabase provides free SMS for development
2. Limited to a few messages per day
3. Works immediately - no extra setup needed!

#### **Option 2: Use Your Own Twilio Account (Production)**

1. Sign up at: https://www.twilio.com
2. Get your:
   - Account SID
   - Auth Token
   - Phone Number
3. In Supabase Dashboard:
   - Go to **Authentication** → **Providers** → **Phone**
   - Enable "Use your own Twilio credentials"
   - Enter your Twilio credentials
   - Click **Save**

### **C. Test Phone Auth**

1. Go to: http://localhost:3000/phone-signin
2. Enter Indian phone number (e.g., 9876543210)
3. You should receive SMS with 6-digit OTP
4. Enter OTP to verify

**Note:** Make sure phone number is in E.164 format (+919876543210)

---

## 🌐 **Step 4: Setup Google OAuth**

### **A. Create Google OAuth Credentials**

1. Go to: https://console.cloud.google.com
2. Create new project or select existing one
3. Enable **Google+ API**:

   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `LocalMart Web Client`
5. Add authorized redirect URIs:

   ```
   https://xxxxx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   (Replace `xxxxx` with your Supabase project ID)

6. Click **Create**
7. Copy:
   - Client ID
   - Client Secret

### **B. Configure in Supabase**

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** provider
3. Toggle it **ON**
4. Enter:
   - **Client ID:** (from Google Console)
   - **Client Secret:** (from Google Console)
5. Click **Save**

### **C. Test Google Auth**

1. Go to: http://localhost:3000/sign-in
2. Click "Continue with Google"
3. Select your Google account
4. You should be redirected back and logged in

---

## 👥 **Step 5: Setup Facebook OAuth**

### **A. Create Facebook App**

1. Go to: https://developers.facebook.com
2. Click **My Apps** → **Create App**
3. Select **Consumer** use case
4. Fill in details:
   - **App Name:** `LocalMart`
   - **App Contact Email:** your@email.com
5. Click **Create App**

### **B. Setup Facebook Login**

1. In your app dashboard, find **Facebook Login**
2. Click **Set Up**
3. Choose **Web** platform
4. Enter site URL: `http://localhost:3000`
5. Click **Save** and **Continue**

### **C. Get App Credentials**

1. Go to **Settings** → **Basic**
2. Copy:
   - **App ID**
   - **App Secret** (click "Show" to reveal)

### **D. Configure OAuth Redirect URI**

1. Go to **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs:**
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
3. Click **Save Changes**

### **E. Configure in Supabase**

1. Supabase Dashboard → **Authentication** → **Providers**
2. Find **Facebook** provider
3. Toggle it **ON**
4. Enter:
   - **Client ID:** (Facebook App ID)
   - **Client Secret:** (Facebook App Secret)
5. Click **Save**

### **F. Make App Live (Important!)**

1. Go to Facebook App Dashboard
2. Toggle app from **Development** to **Live** mode
3. You may need to add a privacy policy URL

### **G. Test Facebook Auth**

1. Go to: http://localhost:3000/sign-in
2. Click "Continue with Facebook"
3. Log in with Facebook
4. You should be redirected back and logged in

---

## 📧 **Step 6: Configure Email Settings** (Optional but Recommended)

### **A. Email Templates**

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Reset password email
   - Magic link email

### **B. SMTP Settings** (For production)

By default, Supabase sends emails from their domain. For production, use custom SMTP:

1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enable **Use Custom SMTP**
4. Enter your SMTP details:
   - **Host:** (e.g., smtp.gmail.com)
   - **Port:** 587
   - **Username:** your@email.com
   - **Password:** your app password
5. Click **Save**

---

## 🗄️ **Step 7: Run Database Migrations**

Now that Supabase is configured, update your database schema:

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name remove_clerk_add_supabase

# Apply migration
npx prisma migrate deploy
```

This will:

- Remove `clerkId` field
- Make `email` and `phone` optional
- Add proper indexes

---

## ✅ **Step 8: Test Everything**

### **Email Authentication:**

1. Go to: http://localhost:3000/sign-up
2. Enter email and password
3. Check email for verification link
4. Click link to verify
5. Sign in at: http://localhost:3000/sign-in

### **Google Authentication:**

1. Go to: http://localhost:3000/sign-in
2. Click "Continue with Google"
3. Select Google account
4. ✅ Should be logged in

### **Facebook Authentication:**

1. Go to: http://localhost:3000/sign-in
2. Click "Continue with Facebook"
3. Log in with Facebook
4. ✅ Should be logged in

### **Phone Authentication:**

1. Go to: http://localhost:3000/phone-signin
2. Enter Indian phone number
3. Receive SMS with OTP
4. Enter OTP
5. ✅ Should be logged in

---

## 🚨 **Troubleshooting**

### **Problem: Google OAuth not working**

**Solution:**

1. Check redirect URI is exactly: `https://xxxxx.supabase.co/auth/v1/callback`
2. Make sure Google+ API is enabled
3. Check Client ID and Secret are correct
4. Clear browser cookies and try again

---

### **Problem: Facebook OAuth shows error**

**Solution:**

1. Make sure app is in **Live** mode (not Development)
2. Check redirect URI matches exactly
3. Add privacy policy URL in Facebook App settings
4. Try in incognito mode

---

### **Problem: Phone OTP not received**

**Solution:**

1. Check phone number format: +919876543210 (E.164 format)
2. Check if Phone provider is enabled in Supabase
3. Try different phone number
4. Check Twilio credits (if using your own)
5. For Indian numbers, make sure DND is not enabled

---

### **Problem: Email verification not working**

**Solution:**

1. Check spam/junk folder
2. Check Supabase email settings
3. Try resending verification email
4. For production, setup custom SMTP

---

### **Problem: "Invalid token" error**

**Solution:**

1. Clear all cookies
2. Sign out completely
3. Restart dev server
4. Try in incognito mode

---

## 🔒 **Security Best Practices**

### **1. Row Level Security (RLS)**

Enable RLS for all tables:

```sql
-- In Supabase SQL Editor
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (example)
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);
```

### **2. Environment Variables**

- Never commit `.env.local` to Git
- Use different keys for development/production
- Rotate keys regularly

### **3. Rate Limiting**

Configure in Supabase Dashboard:

- Authentication → Settings → Rate limiting
- Set appropriate limits to prevent abuse

---

## 📊 **Production Deployment**

### **Update Environment Variables:**

```bash
# Production .env
DATABASE_URL="postgresql://production-db-url"
NEXT_PUBLIC_SUPABASE_URL=https://prod-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi... (production key)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Update OAuth Redirect URIs:**

**Google:**

- Add: `https://yourdomain.com/auth/callback`

**Facebook:**

- Add: `https://yourdomain.com/auth/callback`

**Supabase:**

- Project Settings → Authentication → Site URL
- Update to: `https://yourdomain.com`

---

## 🎯 **Summary Checklist**

- [ ] Created Supabase project
- [ ] Configured environment variables
- [ ] Enabled Phone authentication
- [ ] Setup Google OAuth
- [ ] Setup Facebook OAuth
- [ ] Configured email templates
- [ ] Ran database migrations
- [ ] Tested all auth methods
- [ ] Enabled RLS policies
- [ ] Configured rate limiting

---

## 📞 **Need Help?**

- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Discord:** https://discord.supabase.com
- **GitHub Issues:** https://github.com/supabase/supabase/issues

---

**Created:** October 7, 2025  
**Status:** ✅ Production Ready  
**Authentication:** Email, Google, Facebook, Phone OTP 🚀
