# Decimal Serialization Fixes - Complete Documentation

## Problem Statement

Prisma uses `Decimal` type for numeric fields (`price`, `averageRating`, `weight`, `minOrderAmount`, etc.). These Decimal objects cannot be serialized and passed from server components to client components in Next.js, causing errors:

```
Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported.
```

## Solution

Created a comprehensive serialization utility (`lib/utils/serialize.ts`) that converts all Decimal fields to numbers before passing data to client components.

---

## Files Fixed

### 1. ✅ **Core Utility Created**
- **`lib/utils/serialize.ts`**
  - `serializeProduct()` - Converts product Decimal fields
  - `serializeVendor()` - Converts vendor Decimal fields
  - `serializeOrder()` - Converts order Decimal fields
  - `serializeProducts()` - Array version for products
  - `serializeVendors()` - Array version for vendors
  - `serializeDecimalFields()` - Generic recursive converter

### 2. ✅ **Pages Updated with Serializers**

#### Customer-Facing Pages:
- **`app/page.tsx`** (Landing Page)
  - Vendors: `averageRating`
  - Products: `price`, `averageRating`

- **`app/stores/page.tsx`** (Stores List)
  - Vendors: `averageRating`

- **`app/stores/[id]/page.tsx`** (Store Detail)
  - Vendor: `averageRating`
  - Products: `price`, `averageRating`

- **`app/products/[id]/page.tsx`** (Product Detail)
  - Product: `price`, `compareAtPrice`, `weight`, `averageRating`
  - Vendor: `averageRating`

#### Vendor Pages:
- **`app/vendor/products/[id]/edit/page.tsx`** (Edit Product)
  - Product: `price`, `compareAtPrice`, `weight`, `averageRating`

#### Authentication:
- **`src/shared/utils/auth.ts`** (`getCurrentUser`)
  - Changed from `include: { vendor: true }` to selective fields
  - Removed: `minOrderAmount`, `maxDeliveryDistance`, `commissionRate`

### 3. ✅ **Already Safe Pages (No Changes Needed)**

These pages either:
- Use `.toString()` for display only
- Use `select` to avoid Decimal fields
- Only pass primitives to client components

#### Safe Pages:
- `app/vendor/products/page.tsx` - Uses `.toString()` for display
- `app/vendor/settings/page.tsx` - Uses `select` without Decimal fields
- `app/vendor/orders/page.tsx` - No Decimal fields passed to clients
- `app/admin/reviews/page.tsx` - Already converts `averageRating`
- `app/admin/product-reviews/page.tsx` - Already converts `averageRating`
- `app/products/[id]/write-review/page.tsx` - Uses `Number()` for display
- `app/stores/[id]/write-review/page.tsx` - No Decimal fields
- `app/vendor/onboarding/page.tsx` - Only passes userId string

---

## Usage Guide

### For New Pages/Components

When creating server components that pass Prisma data to client components:

```typescript
// ❌ WRONG - Will cause Decimal error
import { prisma } from "@/lib/prisma";

export default async function MyPage() {
  const product = await prisma.product.findUnique({ where: { id } });

  return <ClientComponent product={product} /> // ❌ Error!
}
```

```typescript
// ✅ CORRECT - Use serializer
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/utils/serialize";

export default async function MyPage() {
  const product = await prisma.product.findUnique({ where: { id } });
  const productData = serializeProduct(product);

  return <ClientComponent product={productData} /> // ✅ Works!
}
```

### Available Serializers

```typescript
import {
  serializeProduct,
  serializeProducts,
  serializeVendor,
  serializeVendors,
  serializeOrder,
  serializeOrders,
  serializeDecimalFields // Generic for any object
} from "@/lib/utils/serialize";

// Single items
const productData = serializeProduct(product);
const vendorData = serializeVendor(vendor);
const orderData = serializeOrder(order);

// Arrays
const productsData = serializeProducts(products);
const vendorsData = serializeVendors(vendors);
const ordersData = serializeOrders(orders);

// Generic (recursively converts all Decimals)
const anyData = serializeDecimalFields(complexObject);
```

---

## Decimal Fields Reference

### Product Fields:
- `price` → number
- `compareAtPrice` → number | null
- `weight` → number | null
- `averageRating` → number | null

### Vendor Fields:
- `averageRating` → number | null
- `minOrderAmount` → number | null
- `maxDeliveryDistance` → number | null
- `commissionRate` → number | null

### Order Fields:
- `totalAmount` → number | null
- `subtotal` → number | null
- `deliveryFee` → number | null
- `tax` → number | null
- `discount` → number | null

### OrderItem Fields:
- `price` → number | null
- `total` → number | null

---

## Testing Checklist

### ✅ Critical User Flows:
1. **Landing Page** → View vendors and products
2. **Browse Stores** → Click store card → View store page
3. **Product Detail** → View product with price/rating
4. **Vendor Dashboard** → Edit product → Save changes
5. **Vendor Settings** → Update store info
6. **Admin Reviews** → View and moderate reviews
7. **Write Reviews** → Submit product/store reviews
8. **Authentication** → Login as vendor (check user.vendor data)

### Test Commands:
```bash
# Development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Test specific pages
- Visit http://localhost:3000 (landing)
- Visit http://localhost:3000/stores (stores list)
- Click any store card
- Click any product
- Login as vendor → go to /vendor/products
```

---

## Error Prevention

### ⚠️ Warning Signs:
If you see these errors, add serialization:

```
Only plain objects can be passed to Client Components...
Decimal objects are not supported
```

### Quick Fix:
1. Import the appropriate serializer
2. Wrap the data before passing to client component
3. Use the serialized data

---

## Performance Notes

- **No Performance Impact**: Serialization is O(n) and happens once during SSR
- **Type Safety**: Return types match input types (generic functions)
- **Null Safety**: All converters handle null/undefined gracefully

---

## Future Maintenance

### When Adding New Prisma Models:
1. Identify Decimal fields in schema
2. Add serializer function to `lib/utils/serialize.ts`
3. Use serializer when passing to client components

### When Creating New Pages:
1. If page fetches Prisma data → Check for Decimal fields
2. If passing to client component → Use appropriate serializer
3. Test page load to ensure no errors

---

## Summary

**All Decimal serialization issues have been fixed!** The application now:

✅ Uses consistent serialization utilities
✅ Prevents Decimal errors across all pages
✅ Maintains type safety with TypeScript
✅ Provides easy-to-use helper functions
✅ Documents best practices for future development

**No more Decimal errors!** 🎉
