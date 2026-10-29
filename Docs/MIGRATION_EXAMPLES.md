# Migration Examples: Next.js API → NestJS Backend

## Quick Reference: Before & After

### 1. Categories

**Before:**
```typescript
const res = await fetch('/api/categories');
const { data } = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.getCategories();
```

### 2. Search

**Before:**
```typescript
const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
const data = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.search(query);
```

### 3. Create Order

**Before:**
```typescript
const res = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items, deliveryAddress, paymentMethod, totalAmount }),
});
const data = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const result = await apiClient.createOrder({
  items,
  deliveryAddress,
  paymentMethod,
  totalAmount,
});
```

### 4. User Profile

**Before:**
```typescript
const res = await fetch('/api/user/profile');
const { data } = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.getUserProfile();
```

### 5. Notifications

**Before:**
```typescript
const res = await fetch('/api/notifications?limit=20&offset=0');
const { data } = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.getNotifications({ limit: 20, offset: 0 });
```

### 6. Vendor Settings

**Before:**
```typescript
const res = await fetch('/api/vendor/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(settings),
});
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.updateVendorSettings(settings);
```

### 7. Product Reviews

**Before:**
```typescript
const res = await fetch(`/api/products/${id}/reviews?page=1&limit=10`);
const data = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.getProductReviews(id, { page: 1, limit: 10 });
```

### 8. Create Review

**Before:**
```typescript
const res = await fetch('/api/reviews/product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reviewData),
});
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.createProductReview(reviewData);
```

### 9. Vendor Onboarding

**Before:**
```typescript
const res = await fetch('/api/vendor/onboarding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(onboardingData),
});
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { data } = await apiClient.vendorOnboarding(onboardingData);
```

### 10. Check Vendor Status

**Before:**
```typescript
const res = await fetch('/api/check-vendor');
const data = await res.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';
const { isVendor, hasVendor } = await apiClient.checkVendor();
```

## Component Migration Example

### Before (using Next.js API)

```typescript
'use client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.data))
      .catch(err => console.error(err));
  }, []);

  return <div>{/* render categories */}</div>;
}
```

### After (using NestJS Backend)

```typescript
'use client';

import { apiClient } from '@/lib/api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const { data } = await apiClient.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* render categories */}</div>;
}
```

## Error Handling Pattern

```typescript
try {
  const { data } = await apiClient.getCategories();
  // Success
} catch (error) {
  if (error instanceof Error) {
    // Handle error
    console.error(error.message);
    // Show toast, redirect, etc.
  }
}
```

