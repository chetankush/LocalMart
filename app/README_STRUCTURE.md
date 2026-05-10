# Application Structure Documentation

## 📁 Folder Organization

The application is now organized into clear domains using Next.js route groups for better maintainability.

### 🌐 **(public)/** - Public Pages (No Authentication Required)
```
(public)/
├── page.tsx (inherited from root)
├── about/                    # About page
├── stores/                   # Browse all stores
│   └── [id]/                # Individual store pages with themes
│       └── themes/          # KiranaTheme, FashionTheme, GroceryTheme, etc.
├── products/                 # Browse products
│   └── [id]/                # Product detail pages
├── become-vendor/            # Vendor application form
└── select-role/              # Role selection page
```

**URL Examples:**
- `/` - Landing page
- `/about` - About page
- `/stores` - All stores
- `/stores/123` - Store detail
- `/products/456` - Product detail
- `/become-vendor` - Apply to become vendor

---

### 🛒 **(customer)/** - Customer Portal (Authenticated)
```
(customer)/
├── cart/                     # Shopping cart
├── checkout/                 # Checkout flow
├── my-orders/                # Order history
├── profile/                  # User profile settings
├── favorite-stores/          # Saved favorite stores
├── notifications/            # User notifications
└── subscription/             # Subscription management
```

**URL Examples:**
- `/cart` - Shopping cart
- `/checkout` - Checkout
- `/my-orders` - Order history
- `/profile` - User profile
- `/favorite-stores` - Favorite stores

---

### 🏪 **(vendor)/** - Vendor Portal (Vendor Dashboard)
```
(vendor)/
├── dashboard/                # Vendor dashboard overview
├── products/                 # Product management
│   ├── create/              # Create new product
│   └── [id]/edit/           # Edit product
├── orders/                   # Order management
├── settings/                 # Vendor settings
├── broadcast/                # Broadcast messages to customers
├── onboarding/               # Vendor onboarding wizard
├── pending/                  # Pending approval status page
└── rejected/                 # Rejected application page
```

**URL Examples:**
- `/vendor/dashboard` - Vendor dashboard
- `/vendor/products` - Manage products
- `/vendor/orders` - View orders
- `/vendor/settings` - Settings
- `/vendor/onboarding` - Complete onboarding

---

### 👨‍💼 **(admin)/** - Admin Portal (Admin Only)
```
(admin)/
├── dashboard/                # Admin dashboard
├── login/                    # Admin login page
├── reviews/                  # Store reviews management
├── product-reviews/          # Product reviews management
└── (vendor-management)/      # Vendor-related admin pages
    ├── vendors/             # All vendors list
    └── vendor-requests/     # Approve/reject vendor requests
```

**URL Examples:**
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/reviews` - Manage reviews
- `/admin/vendor-requests` - Approve vendors

---

### 🔐 **(auth)/** - Authentication Pages
```
(auth)/
├── sign-in/                  # Sign in page
├── sign-up/                  # Sign up page
└── phone-signin/             # Phone authentication
```

**URL Examples:**
- `/sign-in` - Sign in
- `/sign-up` - Sign up
- `/phone-signin` - Phone sign in

---

### 🔌 **api/** - API Routes (Organized by Domain)
```
api/
├── customer/                 # Customer APIs
│   ├── favorites/           # Favorite stores
│   ├── orders/              # Customer orders
│   ├── notifications/       # Notifications
│   └── user/                # User data
│
├── vendor/                   # Vendor APIs
│   ├── vendor/              # Vendor CRUD
│   ├── vendors/             # Vendors list
│   └── product-templates/   # Product templates
│
├── admin/                    # Admin APIs
│   ├── admin/               # Admin operations
│   └── vendor-requests/     # Vendor approval
│
├── public/                   # Public APIs
│   ├── products/            # Product listings
│   ├── categories/          # Categories
│   ├── search/              # Search
│   ├── store-reviews/       # Store reviews
│   ├── check-categories/    # Check categories
│   └── check-vendor/        # Check vendor status
│
├── auth/                     # Auth APIs (if any)
├── seed-categories/          # Seed data
├── test-db/                  # DB tests
└── test-user/                # User tests
```

**API URL Examples:**
- `/api/customer/favorites` - Customer favorites
- `/api/vendor/vendor` - Vendor operations
- `/api/admin/vendor-requests` - Vendor requests
- `/api/public/products` - Public product listings

---

### 🧩 **components/** - Shared Components
```
components/
├── customer/                 # Customer-specific components
├── vendor/                   # Vendor-specific components
├── admin/                    # Admin-specific components
└── shared/                   # Truly shared components across all domains
```

---

### 📄 **Root Level Files**
```
app/
├── layout.tsx                # Root layout (applies to all routes)
├── page.tsx                  # Landing page
├── loading.tsx               # Global loading state
├── globals.css               # Global styles
├── LandingPageClient.tsx     # Landing page client component
├── tailwind.config.css       # Tailwind config
├── favicon.ico               # Favicon
├── unauthorized/             # Unauthorized access page
├── auth/                     # Auth callback
│   └── callback/
├── debug-categories/         # Debug utilities
├── seed-categories/          # Seed utilities
└── test-db/                  # Test utilities
```

---

## 🎯 Key Benefits of This Structure

### ✅ Clear Separation of Concerns
- **Customer code** is in `(customer)/`
- **Vendor code** is in `(vendor)/`
- **Admin code** is in `(admin)/`
- **Public pages** are in `(public)/`

### ✅ Easy Navigation
- Find files quickly based on user type
- No more searching through mixed folders

### ✅ Better Maintainability
- Changes to customer features don't affect vendor/admin code
- Isolated testing per domain
- Clear ownership of code sections

### ✅ Scalability
- Easy to add new features to specific domains
- Team members can work on different domains without conflicts

### ✅ Clean URLs
- Route groups `(name)` don't appear in URLs
- All existing URLs remain exactly the same
- No breaking changes to bookmarks or links

---

## 🔄 Migration Notes

### What Changed:
- ✅ Folder structure reorganized
- ✅ API routes organized by domain
- ✅ Components organized by user type

### What Stayed the Same:
- ✅ All URLs remain identical
- ✅ All functionality intact
- ✅ No code logic changes
- ✅ All imports work correctly

---

## 🚀 Quick Reference

### Find Customer Features
👉 Look in `(customer)/` folder

### Find Vendor Features
👉 Look in `(vendor)/` folder

### Find Admin Features
👉 Look in `(admin)/` folder

### Find Public Pages
👉 Look in `(public)/` folder

### Find API Routes
👉 Look in `api/{domain}/` folder

### Find Shared Components
👉 Look in `components/shared/` folder

---

## 📝 Adding New Features

### Adding a Customer Feature
1. Create folder in `(customer)/your-feature/`
2. Add API routes in `api/customer/your-feature/`
3. Add components in `components/customer/`

### Adding a Vendor Feature
1. Create folder in `(vendor)/your-feature/`
2. Add API routes in `api/vendor/your-feature/`
3. Add components in `components/vendor/`

### Adding an Admin Feature
1. Create folder in `(admin)/your-feature/`
2. Add API routes in `api/admin/your-feature/`
3. Add components in `components/admin/`

---

## 🔍 Troubleshooting

### "Page not found" error
- Check if the page is in the correct route group folder
- Verify the URL matches the folder structure (remember route groups don't appear in URLs)

### Import errors
- Update import paths to reflect new structure
- Use absolute imports with `@/` when possible

### API route not working
- Check if API route is in correct domain folder
- Verify the URL includes the domain segment (e.g., `/api/customer/orders`)

---

**Last Updated:** November 2025
**Maintained By:** Development Team
