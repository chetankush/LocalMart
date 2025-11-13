# Backend API - NestJS

This is the separated backend API for the LocalMart marketplace platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database and Supabase credentials.

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run migrations (if needed):
```bash
npm run prisma:migrate
```

6. Start development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001/api`

## Project Structure

```
src/
├── modules/          # Feature modules (vendors, products, orders, etc.)
├── prisma/           # Prisma service and module
├── core/              # Domain layer (entities, value objects)
├── shared/            # Shared utilities and constants
└── main.ts           # Application entry point
```

## API Endpoints

- `/api/vendors` - Vendor management
- `/api/products` - Product management
- `/api/orders` - Order management
- `/api/categories` - Category management
- `/api/user` - User management
- `/api/reviews` - Review management
- `/api/notifications` - Notification management
- `/api/admin` - Admin operations

## Development

- `npm run start:dev` - Start with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm run prisma:studio` - Open Prisma Studio

