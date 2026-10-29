# 🚀 Quick Start - Supabase Authentication

## ⚡ **Get Started in 5 Minutes**

### **Step 1: Create Supabase Project** (2 min)

1. Go to https://supabase.com and sign up
2. Create new project
3. Copy your credentials:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJ...`

---

### **Step 2: Add Environment Variables** (1 min)

Create `.env.local` in your project root:

```bash
# Copy your existing DATABASE_URL and DIRECT_URL from .env

# Add these NEW variables:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### **Step 3: Enable Authentication Providers** (2 min)

In Supabase Dashboard:

1. **Phone (for India 🇮🇳):**

   - Go to: Authentication → Providers → Phone
   - Toggle ON
   - Click Save

2. **Google (Optional):**

   - Go to: Authentication → Providers → Google
   - Toggle ON
   - Add Client ID & Secret (get from Google Cloud Console)
   - Click Save

3. **Facebook (Optional):**
   - Go to: Authentication → Providers → Facebook
   - Toggle ON
   - Add App ID & Secret (get from Facebook Developers)
   - Click Save

---

### **Step 4: Run Database Migration** (1 min)

```bash
# Generate Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name remove_clerk_add_supabase_auth

# When prompted "Are you sure?" type: y
```

**Note:** If you have existing users, see `MIGRATION_COMPLETE_GUIDE.md` for data migration options.

---

### **Step 5: Start Development Server**

```bash
npm run dev
```

Visit: http://localhost:3000

---

## ✅ **Test Your Setup**

### **1. Email Authentication:**

- Go to: http://localhost:3000/sign-up
- Sign up with your email
- Check your inbox for verification email
- Click the link to verify
- Sign in at: http://localhost:3000/sign-in

### **2. Phone OTP (India):**

- Go to: http://localhost:3000/phone-signin
- Enter your Indian phone number (e.g., 9876543210)
- Receive SMS with 6-digit OTP
- Enter OTP to verify
- ✅ You're signed in!

### **3. Google OAuth (if configured):**

- Go to: http://localhost:3000/sign-in
- Click "Continue with Google"
- Select your Google account
- ✅ You're signed in!

### **4. Facebook OAuth (if configured):**

- Go to: http://localhost:3000/sign-in
- Click "Continue with Facebook"
- Log in with Facebook
- ✅ You're signed in!

---

## 🎯 **What's Available**

### **Authentication Methods:**

- ✅ Email + Password
- ✅ Phone + OTP (Works in India!)
- ✅ Google OAuth
- ✅ Facebook OAuth
- ✅ Magic Links (via email)

### **Features:**

- ✅ Email verification
- ✅ Password reset
- ✅ Session management
- ✅ Protected routes
- ✅ Role-based access (Customer/Vendor/Admin)

---

## 📁 **Key Files**

### **Authentication:**

- `lib/supabase/client.ts` - Client-side Supabase
- `lib/supabase/server.ts` - Server-side Supabase
- `lib/supabase/auth-provider.tsx` - Auth context

### **Pages:**

- `app/(auth)/sign-in/page.tsx` - Sign in page
- `app/(auth)/sign-up/page.tsx` - Sign up page
- `app/(auth)/phone-signin/page.tsx` - Phone OTP page

### **Utils:**

- `src/shared/utils/auth.ts` - Auth helper functions
- `middleware.ts` - Route protection

---

## 🆘 **Troubleshooting**

### **"Module not found: @supabase/ssr"**

```bash
npm install @supabase/ssr
```

### **"NEXT_PUBLIC_SUPABASE_URL is not defined"**

1. Check `.env.local` file exists
2. Make sure variables are correctly set
3. Restart dev server: `npm run dev`

### **"Phone OTP not received"**

1. Check phone number format: +919876543210
2. Verify Phone provider is enabled in Supabase
3. Check Supabase logs for errors

### **"OAuth redirect not working"**

1. Add correct redirect URI in OAuth provider settings
2. Format: `https://xxxxx.supabase.co/auth/v1/callback`
3. Clear browser cookies and try again

---

## 📚 **Documentation**

- **Detailed Setup:** `SUPABASE_SETUP_GUIDE.md`
- **Migration Guide:** `MIGRATION_COMPLETE_GUIDE.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth

---

## 🎉 **You're All Set!**

Your app now has:

- ✅ Phone OTP for India
- ✅ Google & Facebook OAuth
- ✅ Email authentication
- ✅ Secure session management

**Start building amazing features!** 🚀
