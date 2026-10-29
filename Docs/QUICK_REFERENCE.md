# 🚀 Quick Reference Card

## 📂 Where to Find Things

### Looking for...
| What | Where | Path |
|------|-------|------|
| **Customer cart** | (customer)/ | `app/(customer)/cart/` |
| **Vendor dashboard** | (vendor)/ | `app/(vendor)/dashboard/` |
| **Admin panel** | (admin)/ | `app/(admin)/` |
| **Store pages** | (public)/ | `app/(public)/stores/` |
| **Product pages** | (public)/ | `app/(public)/products/` |
| **Customer APIs** | api/customer/ | `app/api/customer/` |
| **Vendor APIs** | api/vendor/ | `app/api/vendor/` |
| **Admin APIs** | api/admin/ | `app/api/admin/` |

---

## 🎯 Common Tasks

### Task: Add New Customer Page
```
1. Create: app/(customer)/my-new-page/page.tsx
2. URL will be: /my-new-page
3. Add API: app/api/customer/my-new-page/route.ts
4. API URL: /api/customer/my-new-page
```

### Task: Add New Vendor Feature
```
1. Create: app/(vendor)/my-feature/page.tsx
2. URL will be: /vendor/my-feature
3. Add API: app/api/vendor/my-feature/route.ts
4. API URL: /api/vendor/my-feature
```

### Task: Add New Admin Page
```
1. Create: app/(admin)/my-admin-page/page.tsx
2. URL will be: /admin/my-admin-page
3. Add API: app/api/admin/my-admin-page/route.ts
4. API URL: /api/admin/my-admin-page
```

---

## 🔍 Quick Search

### Find Customer Code
```bash
# Search in customer folder
grep -r "search term" app/(customer)/

# Search customer APIs
grep -r "search term" app/api/customer/
```

### Find Vendor Code
```bash
# Search in vendor folder
grep -r "search term" app/(vendor)/

# Search vendor APIs
grep -r "search term" app/api/vendor/
```

### Find Admin Code
```bash
# Search in admin folder
grep -r "search term" app/(admin)/

# Search admin APIs
grep -r "search term" app/api/admin/
```

---

## ⚡ Remember

### Route Groups Don't Affect URLs
- Folder: `(public)/stores/` → URL: `/stores`
- Folder: `(customer)/cart/` → URL: `/cart`
- Folder: `(vendor)/dashboard/` → URL: `/vendor/dashboard`
- Folder: `(admin)/reviews/` → URL: `/admin/reviews`

### The parentheses `( )` are invisible in URLs!

---

## 📚 Full Documentation

- **Complete Guide**: `README_STRUCTURE.md`
- **Visual Overview**: `FINAL_STRUCTURE.md`
- **Migration Details**: `MIGRATION_COMPLETE.md`

---

**Print this and keep it handy! 📌**
