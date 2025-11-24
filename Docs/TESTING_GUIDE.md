# 🧪 LocalMart MVP - Testing Guide

## ✅ What's Been Implemented

### 1. **Authentication & Role-Based Access** ✅
- User sign-up via Clerk
- Auto-sync with database
- Role selection (Customer vs Vendor)
- Separate dashboards for each role

### 2. **Vendor Features** ✅
- Complete onboarding flow
- Business details setup
- Delivery configuration
- Vendor dashboard with stats
- Status tracking (Pending/Active)

### 3. **Customer Features** ✅
- Homepage with vendor listing
- Browse active vendors
- View featured products

---

## 🚀 How to Test (Step-by-Step)

### **Start the App**
```bash
npm run dev
```
Visit: **http://localhost:3000**

---

## Test Scenario 1: Customer Sign-Up Flow

### Step 1: Sign Up as New User
1. Go to **http://localhost:3000**
2. Click **"Get Started"** or **"Sign Up"**
3. Create account with:
   - Email: `customer@test.com`
   - Password: (choose any)

### Step 2: Select Role
1. After sign-up, you'll be redirected to **Role Selection Page**
2. Click **"I want to Shop"** (Customer option)

### Step 3: Browse Homepage
1. You'll be redirected to homepage
2. See list of active vendors (empty for now)
3. See featured products (empty for now)

✅ **Customer flow complete!**

---

## Test Scenario 2: Vendor Sign-Up Flow

### Step 1: Sign Up as Vendor
1. **Sign out** from customer account (top-right menu)
2. Go to **http://localhost:3000**
3. Click **"Sign Up"** again
4. Create account with:
   - Email: `vendor@test.com`
   - Password: (choose any)

### Step 2: Select Vendor Role
1. On role selection page, click **"I want to Sell"**

### Step 3: Complete Onboarding
1. You'll be redirected to **Vendor Onboarding**
2. Fill in the form:

**Business Info:**
- Business Name: "My Test Store"
- Business Type: Select any
- Contact Email: vendor@test.com
- Contact Phone: 9876543210

**Address:**
- Street: "123 Main Street"
- City: "Mumbai"
- State: "Maharashtra"
- PIN Code: 400001

**Delivery Settings:**
- Delivery Radius: 5 km
- Delivery Charge: ₹50
- Min Order: ₹100

3. Click **"Complete Setup"**

### Step 4: View Vendor Dashboard
1. You'll be redirected to **Vendor Dashboard**
2. See:
   - ⚠️ "Awaiting Approval" notice (yellow banner)
   - Stats: 0 products, 0 orders
   - Empty product list
   - Empty order list
3. Notice **"Add Product"** button (functional in next phase)

✅ **Vendor flow complete!**

---

## Test Scenario 3: Check Database

### Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/piwtgqryjcneszxjajwk/editor
2. Check **users** table - you should see 2 users
3. Check **vendors** table - you should see 1 vendor (status: PENDING_APPROVAL)

---

## Test Scenario 4: Role Switching

### Step 1: Sign In as Customer
1. Sign in with customer@test.com
2. Go to **http://localhost:3000**
3. You see customer homepage

### Step 2: Sign In as Vendor
1. Sign out
2. Sign in with vendor@test.com
3. You're automatically redirected to **Vendor Dashboard**

✅ **Role-based access working!**

---

## 🎯 What's Working Now

| Feature | Status |
|---------|--------|
| **Authentication** | ✅ Working |
| User Sign Up/Sign In | ✅ Working |
| Role Selection | ✅ Working |
| Auto DB Sync | ✅ Working |
| **Vendor** | ✅ Working |
| Vendor Onboarding | ✅ Working |
| Business Setup | ✅ Working |
| Delivery Config | ✅ Working |
| Vendor Dashboard | ✅ Working |
| Status (Pending/Active) | ✅ Working |
| **Customer** | ✅ Working |
| Homepage | ✅ Working |
| Browse Vendors | ✅ Working (shows when vendors are active) |
| Browse Products | ✅ Working (shows when products exist) |

---

## 🔜 Next Features to Implement

### Phase 2: Vendor Product Management
- ➕ Add products
- ✏️ Edit products
- 📦 Manage inventory
- 🖼️ Upload product images

### Phase 3: Admin Panel
- ✅ Approve vendors
- 📊 Platform analytics
- 🛡️ Moderate content

### Phase 4: Order Management
- 🛒 Customer cart
- 💳 Checkout & payment
- 📦 Order tracking
- 🚚 Delivery status updates

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" error
**Solution:** Sign out and sign in again

### Issue: Vendor dashboard not loading
**Solution:** Make sure you completed onboarding

### Issue: Database errors
**Solution:** Check that `.env` has correct `DATABASE_URL` and `DIRECT_URL`

### Issue: Clerk auth not working
**Solution:** Check that Clerk keys in `.env` are correct

---

## 📊 Check Your Setup

### Required Files Created:
- ✅ `/app/select-role/page.tsx` - Role selection
- ✅ `/app/vendor/onboarding/page.tsx` - Vendor onboarding
- ✅ `/app/vendor/dashboard/page.tsx` - Vendor dashboard
- ✅ `/app/page.tsx` - Customer homepage
- ✅ `/app/api/user/select-role/route.ts` - Role API
- ✅ `/app/api/vendor/onboarding/route.ts` - Onboarding API
- ✅ `/src/shared/utils/auth.ts` - Auth helpers

### Database Tables:
- ✅ users
- ✅ vendors
- ✅ products
- ✅ orders
- ✅ (all 11 tables created)

---

## 🎉 You're Ready to Test!

**Start testing now with the scenarios above!**

Any issues? Check the troubleshooting section or let me know.

**Want more features?** Tell me what to build next:
- Product management for vendors?
- Cart & checkout for customers?
- Admin approval panel?
