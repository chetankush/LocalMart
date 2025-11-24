# Backend Separation Migration Guide

This guide explains how the backend has been separated from Next.js into a standalone NestJS backend.

## What Changed

### Backend Structure
- **Location**: `backend/` folder
- **Framework**: NestJS (TypeScript)
- **Database**: Prisma (same as before)
- **Port**: 3001 (default)

### Frontend Changes
- API routes in `app/api/` are being migrated to NestJS controllers
- New API client in `lib/api/client.ts` for making requests to backend
- Frontend now calls backend API instead of Next.js API routes

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Update .env with your database credentials
npm run prisma:generate
npm run start:dev
```

Backend will run on `http://localhost:3001/api`

### 2. Frontend Setup

Update your `.env.local` (or `.env`) in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Migration Status

#### ✅ Completed
- NestJS project structure
- Prisma schema moved to backend
- Basic modules created (vendors, products, orders, etc.)
- Vendors module fully implemented
- API client created in frontend

#### 🚧 In Progress
- Migrating remaining API routes to NestJS controllers
- Authentication middleware
- All service implementations

#### 📋 To Do
- Complete all module implementations
- Add authentication guards
- Add validation DTOs
- Add error handling
- Add logging
- Add tests

## API Endpoints

### Current Endpoints (Working)

- `GET /api/vendors` - Get all vendors
- `GET /api/vendors/:id` - Get vendor by ID

### Migration Pattern

**Before (Next.js API Route):**
```typescript
// app/api/vendors/route.ts
export async function GET(request: NextRequest) {
  const vendors = await prisma.vendor.findMany();
  return NextResponse.json({ success: true, data: vendors });
}
```

**After (NestJS Controller):**
```typescript
// backend/src/modules/vendors/vendors.controller.ts
@Controller('vendors')
export class VendorsController {
  @Get()
  async findAll() {
    const vendors = await this.vendorsService.findAll();
    return { success: true, data: vendors };
  }
}
```

## Using the API Client

### In React Components

```typescript
import { apiClient } from '@/lib/api/client';

// Get vendors
const { data } = await apiClient.getVendors();

// Get vendor by ID
const { data } = await apiClient.getVendor('vendor-id');

// Create order
const result = await apiClient.createOrder({
  items: [...],
  deliveryAddress: {...},
  paymentMethod: 'cod'
});
```

### Replacing Old API Calls

**Before:**
```typescript
const response = await fetch('/api/vendors');
const data = await response.json();
```

**After:**
```typescript
const { data } = await apiClient.getVendors();
```

## Next Steps

1. **Complete Module Implementations**
   - Migrate each API route to corresponding NestJS controller
   - Implement business logic in services
   - Add DTOs for validation

2. **Authentication**
   - Create Supabase auth guard
   - Add role-based access control
   - Protect routes with guards

3. **Error Handling**
   - Add global exception filters
   - Standardize error responses
   - Add logging

4. **Testing**
   - Unit tests for services
   - Integration tests for controllers
   - E2E tests for critical flows

## Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend Development**
   ```bash
   npm run dev
   ```

3. **Database Management**
   ```bash
   cd backend
   npm run prisma:studio  # Open Prisma Studio
   npm run prisma:migrate # Run migrations
   ```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify DATABASE_URL in `.env`
- Run `npm run prisma:generate`

### CORS errors
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS settings in `main.ts`

### Authentication issues
- Ensure Supabase tokens are being sent
- Check auth guard implementation
- Verify user exists in database

## Notes

- The old Next.js API routes are still present but will be removed once migration is complete
- Both frontend and backend can run simultaneously
- Database is shared between both (same Prisma schema)
- Frontend should gradually migrate to use `apiClient` instead of direct fetch calls

