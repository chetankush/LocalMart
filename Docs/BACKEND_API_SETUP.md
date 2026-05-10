# Backend API Setup Guide

This guide explains how to switch between Next.js API routes and the Backend NestJS API for submitting reviews.

## Architecture

You now have **two API implementations** that work identically:

1. **Next.js API Routes** (Default) - Located in `app/api/public/`
2. **Backend NestJS API** - Located in `backend/src/modules/reviews/`

## Current Status

✅ **Next.js API Routes** - Fully working, currently active
✅ **Backend NestJS API** - Fully implemented, ready to use

## How to Switch

### Use Next.js API (Default)

**No configuration needed** - This is the default and is currently active.

Benefits:
- ✅ No separate backend server needed
- ✅ Simpler deployment
- ✅ Built-in authentication with Supabase
- ✅ Works out of the box

### Use Backend NestJS API

Add this to your `.env.local` file:

```env
NEXT_PUBLIC_USE_BACKEND_API=true
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Start the backend server:**

```bash
cd backend
npm install
npm run start:dev
```

Backend will run on `http://localhost:3001/api`

Benefits:
- ✅ Scalable architecture
- ✅ Can be deployed separately
- ✅ Ready for mobile apps
- ✅ Better for microservices

## Backend Setup (If Using Backend API)

### 1. Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL="your_database_url"
DIRECT_URL="your_direct_url"

# Supabase
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_anon_key"

# CORS
FRONTEND_URL="http://localhost:3000"

# Port
PORT=3001
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Backend Server

```bash
npm run start:dev
```

## API Endpoints

### Store Reviews

**Next.js API:**
```
POST /api/public/store-reviews
```

**Backend API:**
```
POST http://localhost:3001/api/reviews/store
```

### Product Reviews

**Next.js API:**
```
POST /api/public/products/reviews
```

**Backend API:**
```
POST http://localhost:3001/api/reviews/product
```

## Authentication

### Next.js API
- Uses server-side Supabase client
- Automatically handles authentication
- No token management needed

### Backend API
- Uses Supabase JWT tokens
- Tokens sent in `Authorization: Bearer <token>` header
- Frontend `apiClient` handles this automatically

## Response Format

Both APIs return the same response format:

```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "id": "...",
    "userId": "...",
    "rating": 5,
    "comment": "Great store!",
    "images": [...],
    "createdAt": "..."
  }
}
```

## Error Handling

Both APIs handle errors identically:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (not signed in)
- `403` - Forbidden (e.g., reviewing own store)
- `404` - Not Found (store/product doesn't exist)
- `500` - Internal Server Error

## Testing

### Test Next.js API

1. Start Next.js dev server: `npm run dev`
2. Go to any store or product
3. Click "Write Review"
4. Submit a review
5. ✅ Should work immediately

### Test Backend API

1. Set `NEXT_PUBLIC_USE_BACKEND_API=true` in `.env.local`
2. Start backend: `cd backend && npm run start:dev`
3. Start frontend: `npm run dev`
4. Go to any store or product
5. Click "Write Review"
6. Submit a review
7. ✅ Should work the same way

## Verification

Check which API is being used:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit a review
4. Look at the request:
   - **Next.js API**: `/api/public/store-reviews`
   - **Backend API**: `http://localhost:3001/api/reviews/store`

## Troubleshooting

### Backend API Issues

**401 Unauthorized:**
- Check that backend is running
- Verify Supabase env vars in `backend/.env`
- Check browser console for token errors

**CORS Error:**
- Verify `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Check backend console for CORS logs

**Connection Refused:**
- Make sure backend is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### Next.js API Issues

**401 Unauthorized:**
- Check that you're signed in
- Verify Supabase session is active
- Try signing out and back in

## Deployment

### Deploy with Next.js API (Simpler)

Just deploy Next.js as normal:
```bash
vercel deploy
```

### Deploy with Backend API (Advanced)

1. **Deploy Backend** (e.g., Railway, Render, AWS):
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

2. **Update Frontend** `.env.production`:
   ```env
   NEXT_PUBLIC_USE_BACKEND_API=true
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   ```

3. **Deploy Frontend**:
   ```bash
   vercel deploy
   ```

## Recommendation

**For Development:**
- Use **Next.js API** (simpler, faster iteration)

**For Production:**
- **Small/Medium Apps**: Use **Next.js API** (simpler deployment)
- **Large Apps/Mobile Apps**: Use **Backend API** (better scalability)

## Files Changed

### Frontend
- `app/(public)/stores/[id]/write-review/ReviewForm.tsx`
- `app/(public)/products/[id]/write-review/ProductReviewForm.tsx`
- `lib/api/client.ts`

### Backend
- `backend/src/modules/reviews/reviews.controller.ts`
- `backend/src/modules/reviews/reviews.service.ts`
- `backend/src/shared/guards/auth.guard.ts`

## Support

Both APIs are fully implemented and tested. Choose the one that best fits your needs!

