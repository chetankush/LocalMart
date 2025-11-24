# Frontend Integration Guide

## How to Use the NestJS Backend in Your Next.js Frontend

### 1. Environment Setup

First, add the backend URL to your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

### 2. Start Both Servers

**Option 1: Run separately**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run backend:dev
```

**Option 2: Run both together**
```bash
npm run dev:all
```

### 3. Using the API Client

The API client is already set up in `lib/api/client.ts`. It automatically:
- Adds authentication tokens from Supabase
- Handles errors
- Formats requests/responses

#### Basic Usage

```typescript
import { apiClient } from '@/lib/api/client';

// Get categories
const { data: categories } = await apiClient.getCategories();

// Get products
const { data: products } = await apiClient.get('/products');

// Get vendor
const { data: vendor } = await apiClient.getVendor(vendorId);
```

### 4. Migration Examples

#### Example 1: Fetching Categories

**Before (Next.js API route):**
```typescript
const response = await fetch('/api/categories');
const data = await response.json();
const categories = data.data;
```

**After (NestJS Backend):**
```typescript
import { apiClient } from '@/lib/api/client';

const { data: categories } = await apiClient.getCategories();
// or
const { data: categories } = await apiClient.get('/categories');
```

#### Example 2: Creating an Order

**Before:**
```typescript
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items, deliveryAddress, paymentMethod, totalAmount }),
});
const data = await response.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';

const result = await apiClient.post('/orders', {
  items,
  deliveryAddress,
  paymentMethod,
  totalAmount,
});
```

#### Example 3: Search

**Before:**
```typescript
const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
const data = await response.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';

const { data } = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
```

#### Example 4: User Profile

**Before:**
```typescript
const response = await fetch('/api/user/profile');
const data = await response.json();
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';

const { data: profile } = await apiClient.getUserProfile();
```

#### Example 5: Vendor Settings

**Before:**
```typescript
const response = await fetch('/api/vendor/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(settings),
});
```

**After:**
```typescript
import { apiClient } from '@/lib/api/client';

const { data } = await apiClient.patch('/vendor/settings', settings);
```

### 5. Complete API Client Methods

The API client has methods for all endpoints. Here are the most common:

```typescript
import { apiClient } from '@/lib/api/client';

// Categories
await apiClient.getCategories();

// Products
await apiClient.getProducts({ vendorId: 'xxx' });
await apiClient.getProduct(id);
await apiClient.post('/products', productData);
await apiClient.patch(`/products/${id}`, updates);
await apiClient.delete(`/products/${id}`);

// Orders
await apiClient.post('/orders', orderData);
await apiClient.get('/orders');

// Vendors
await apiClient.getVendors('ACTIVE');
await apiClient.getVendor(id);
await apiClient.get(`/vendors/${id}/reviews`);

// Vendor (authenticated)
await apiClient.post('/vendor/onboarding', data);
await apiClient.get('/vendor/check');
await apiClient.get('/vendor/settings');
await apiClient.patch('/vendor/settings', data);
await apiClient.get('/vendor/theme');
await apiClient.patch('/vendor/theme', data);
await apiClient.get('/vendor/orders');
await apiClient.patch(`/vendor/orders/${id}/status`, { status: 'ACCEPTED' });
await apiClient.get('/vendor/products');
await apiClient.post('/vendor/products', data);
await apiClient.post('/vendor/broadcast', { title, message });

// User
await apiClient.getUserProfile();
await apiClient.updateUserProfile(data);
await apiClient.post('/user/select-role', { role: 'VENDOR' });

// Reviews
await apiClient.post('/reviews/product', reviewData);
await apiClient.post('/reviews/store', reviewData);
await apiClient.get(`/reviews/product/${productId}?page=1&limit=10`);
await apiClient.get(`/reviews/store/${vendorId}`);

// Notifications
await apiClient.get('/notifications?limit=20&offset=0');
await apiClient.post(`/notifications/${id}/mark-read`);
await apiClient.delete(`/notifications/${id}`);

// Search
await apiClient.get(`/search?q=${query}`);

// Favorites
await apiClient.get('/favorites');
await apiClient.post('/favorites/toggle', { vendorId });

// Vendor Requests
await apiClient.post('/vendor-requests', requestData);
await apiClient.get('/vendor-requests?status=PENDING');

// Admin
await apiClient.get('/admin/reviews?vendorId=xxx&page=1');
await apiClient.patch('/admin/reviews/:id', { isHidden: true });
await apiClient.get('/admin/product-reviews?productId=xxx');
```

### 6. Error Handling

The API client throws errors that you can catch:

```typescript
import { apiClient } from '@/lib/api/client';

try {
  const { data } = await apiClient.getCategories();
} catch (error) {
  if (error instanceof Error) {
    console.error('API Error:', error.message);
    // Handle error (show toast, redirect, etc.)
  }
}
```

### 7. React Component Examples

#### Example: Categories List

```typescript
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export default function CategoriesList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const { data } = await apiClient.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {categories.map((cat) => (
        <li key={cat.id}>{cat.name}</li>
      ))}
    </ul>
  );
}
```

#### Example: Create Order

```typescript
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePlaceOrder = async (orderData: any) => {
    try {
      setLoading(true);
      const result = await apiClient.post('/orders', orderData);
      
      if (result.success) {
        alert(`Order placed! Order #${result.orders[0]?.orderNumber}`);
        router.push('/my-orders');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={() => handlePlaceOrder(orderData)}
      disabled={loading}
    >
      {loading ? 'Placing Order...' : 'Place Order'}
    </button>
  );
}
```

### 8. Server-Side Usage (Server Components)

For server components, you can use the API client directly:

```typescript
import { apiClient } from '@/lib/api/client';

export default async function ProductsPage() {
  const { data: products } = await apiClient.getProducts();
  
  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 9. Authentication

The API client automatically includes the Supabase auth token. Make sure you're logged in:

```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  // API calls will automatically include auth token if user is logged in
  const fetchData = async () => {
    const { data } = await apiClient.getUserProfile();
  };
}
```

### 10. Response Format

All backend responses follow this format:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}
```

### 11. Migration Checklist

- [ ] Add `NEXT_PUBLIC_API_URL` to `.env.local`
- [ ] Update all `fetch('/api/...')` calls to use `apiClient`
- [ ] Test authentication flows
- [ ] Test all CRUD operations
- [ ] Update error handling
- [ ] Test in production environment

### 12. Common Issues & Solutions

**Issue: CORS Error**
- Solution: Make sure `FRONTEND_URL` is set in backend `.env` and matches your frontend URL

**Issue: 401 Unauthorized**
- Solution: Check that Supabase session is active and token is being sent

**Issue: 404 Not Found**
- Solution: Verify the endpoint path matches the backend route (check `backend/src/modules/*/controllers`)

**Issue: Connection Refused**
- Solution: Ensure backend is running on port 3001 (`npm run backend:dev`)

### 13. Testing

Test your integration:

```typescript
// Test connection
const test = await apiClient.get('/categories');
console.log('Backend connected:', test);
```

### 14. Next Steps

1. Start migrating endpoints one by one
2. Test each endpoint after migration
3. Remove old Next.js API routes once migration is complete
4. Update documentation
5. Deploy backend to production
6. Update production environment variables

