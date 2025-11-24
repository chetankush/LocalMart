# Environment Variables Setup

## Frontend (Next.js)

Create or update `.env.local` in the **root directory**:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**For production:**

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

**Note:** The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

## Backend (NestJS)

Create or update `.env` in the `backend/` directory:

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Backend port
PORT=3001

# Database (if not already set)
DATABASE_URL=your_database_url_here

# Supabase (if needed)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

**For production:**

```env
FRONTEND_URL=https://your-frontend-domain.com
PORT=3001
DATABASE_URL=your_production_database_url
```

## Quick Setup

### 1. Frontend `.env.local` (root directory)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 2. Backend `.env` (backend directory)

```env
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## How It Works

- **Frontend** reads `NEXT_PUBLIC_API_URL` and uses it in `lib/api/client.ts`
- **Backend** reads `FRONTEND_URL` to configure CORS (allows frontend to make requests)
- **Backend** reads `PORT` to determine which port to run on (default: 3001)

## Verification

After setting up:

1. **Frontend** will call: `http://localhost:3001/api/*`
2. **Backend** will allow requests from: `http://localhost:3000`
3. Both should work together seamlessly

## Troubleshooting

**CORS Error?**

- Make sure `FRONTEND_URL` in backend matches your frontend URL exactly
- Check that backend is running on port 3001

**Connection Refused?**

- Make sure backend is running: `npm run backend:dev`
- Check that `NEXT_PUBLIC_API_URL` is set correctly

**401 Unauthorized?**

- Check that Supabase session is active
- Verify authentication token is being sent (check browser Network tab)
