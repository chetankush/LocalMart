# Application Restructuring Plan

## Current Issues
- Mixed client, vendor, and admin pages in root `/app`
- Unclear separation of concerns
- Difficult to maintain and understand

## Proposed New Structure

```
app/
├── (public)/                    # Public-facing customer pages (no auth required)
│   ├── page.tsx                 # Landing page
│   ├── about/
│   ├── stores/                  # Browse stores
│   │   └── [id]/               # Individual store pages
│   └── products/                # Browse products
│       └── [id]/               # Product detail pages
│
├── (customer)/                  # Customer authenticated pages
│   ├── cart/
│   ├── checkout/
│   ├── my-orders/
│   ├── profile/
│   ├── favorite-stores/
│   ├── notifications/
│   └── subscription/
│
├── (vendor)/                    # Vendor portal (all vendor pages)
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── settings/
│   ├── broadcast/
│   ├── onboarding/
│   ├── pending/                 # Pending approval page
│   └── rejected/                # Rejected vendor page
│
├── (admin)/                     # Admin portal
│   ├── dashboard/
│   ├── vendors/                 # Vendor management
│   ├── vendor-requests/         # Approve/reject vendors
│   ├── reviews/                 # Store reviews
│   ├── product-reviews/
│   ├── users/
│   └── login/                   # Admin login
│
├── (auth)/                      # Authentication pages
│   ├── sign-in/
│   ├── sign-up/
│   ├── phone-signin/
│   └── callback/
│
├── api/                         # API routes (organized by domain)
│   ├── customer/               # Customer-related APIs
│   │   ├── favorites/
│   │   ├── orders/
│   │   └── notifications/
│   ├── vendor/                 # Vendor-related APIs
│   │   ├── products/
│   │   ├── orders/
│   │   └── settings/
│   ├── admin/                  # Admin-related APIs
│   │   ├── vendor-requests/
│   │   ├── reviews/
│   │   └── users/
│   ├── public/                 # Public APIs
│   │   ├── stores/
│   │   ├── products/
│   │   ├── categories/
│   │   └── search/
│   └── auth/                   # Auth-related APIs
│
├── components/                  # Shared components
│   ├── customer/               # Customer-specific components
│   ├── vendor/                 # Vendor-specific components
│   ├── admin/                  # Admin-specific components
│   └── shared/                 # Truly shared components
│
├── select-role/                # Role selection page
├── become-vendor/              # Vendor application page
├── unauthorized/               # Unauthorized access page
├── layout.tsx                  # Root layout
├── globals.css
└── favicon.ico
```

## Migration Steps

1. **Create new folder structure** with route groups
2. **Move pages systematically** by domain
3. **Update import paths** in moved files
4. **Update API routes** organization
5. **Test each section** after migration
6. **Update documentation**

## Key Benefits

✅ **Clear Separation**: Customer, Vendor, Admin pages clearly separated
✅ **Easy Navigation**: Find files quickly based on user type
✅ **Better Maintenance**: Changes to one domain don't affect others
✅ **Scalable**: Easy to add new features to specific domains
✅ **Route Groups**: Use Next.js route groups for clean URLs (parentheses don't appear in URL)

## Notes

- Route groups `(name)` don't affect URL structure
- All existing URLs remain the same
- No functionality changes, only organization
- Shared components stay accessible to all
