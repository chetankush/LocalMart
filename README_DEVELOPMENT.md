# LocalMart - Developer Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ LTS
- PostgreSQL 15+ (or Supabase account)
- npm or yarn
- Git

### Installation

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd localmart
npm install
```

2. **Set Up Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Database URL (Supabase or local PostgreSQL)
- Clerk authentication keys
- Payment gateway credentials
- Google Maps API key
- Other service credentials

3. **Initialize Database**
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (create database tables)
npx prisma migrate dev --name init

# Optional: Seed database with sample data
npx prisma db seed
```

4. **Run Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📁 Project Structure Explained

```
src/
├── core/                          # Core business logic
│   ├── domain/                    # Domain layer (business rules)
│   │   ├── entities/              # Business entities with logic
│   │   ├── value-objects/         # Immutable value objects
│   │   ├── interfaces/            # Repository contracts
│   │   └── errors/                # Domain-specific errors
│   ├── application/               # Application layer (use cases)
│   │   ├── use-cases/             # Business operations
│   │   ├── dto/                   # Data transfer objects
│   │   └── validators/            # Input validation
│   └── infrastructure/            # Infrastructure layer
│       ├── database/              # Database access
│       └── external-services/     # External APIs
└── shared/                        # Shared utilities
    ├── types/                     # Shared types
    ├── constants/                 # App constants
    └── config/                    # Configuration
```

---

## 🏗️ Architecture Overview

### **Clean Architecture Layers**

1. **Domain Layer** (Innermost - No dependencies)
   - Business entities (User, Vendor, Product, Order)
   - Value objects (Money, Address, DeliveryCharge)
   - Repository interfaces
   - Business rules and validation

2. **Application Layer** (Depends on Domain)
   - Use cases (business operations)
   - DTOs (data transfer objects)
   - Input validation (Zod schemas)
   - Orchestrates domain logic

3. **Infrastructure Layer** (Depends on Domain & Application)
   - Database repositories (Prisma implementations)
   - External services (Stripe, Google Maps, SendGrid)
   - File storage (Supabase)
   - Caching (Redis)

4. **Presentation Layer** (Depends on Application)
   - Next.js pages and API routes
   - React components
   - UI logic

### **Data Flow**

```
User Request
    ↓
API Route (Presentation)
    ↓
Use Case (Application)
    ↓
Domain Entity (Domain)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Infrastructure)
    ↓
Database
```

---

## 🔨 Development Workflow

### **Creating a New Feature**

Example: Add "Add to Wishlist" feature

1. **Domain Layer** (if needed)
```typescript
// src/core/domain/entities/Wishlist.ts
export class Wishlist extends Entity<WishlistProps> {
  public addProduct(productId: string): Result<void> {
    // Business logic here
  }
}
```

2. **Repository Interface**
```typescript
// src/core/domain/interfaces/IWishlistRepository.ts
export interface IWishlistRepository {
  findByUserId(userId: string): Promise<Result<Wishlist>>;
  save(wishlist: Wishlist): Promise<Result<void>>;
}
```

3. **Repository Implementation**
```typescript
// src/core/infrastructure/database/repositories/WishlistRepository.ts
export class PrismaWishlistRepository implements IWishlistRepository {
  async findByUserId(userId: string): Promise<Result<Wishlist>> {
    // Implementation using Prisma
  }
}
```

4. **Use Case**
```typescript
// src/core/application/use-cases/wishlist/AddToWishlistUseCase.ts
export class AddToWishlistUseCase {
  constructor(private wishlistRepo: IWishlistRepository) {}

  async execute(dto: AddToWishlistDTO): Promise<Result<void>> {
    // Orchestrate the operation
  }
}
```

5. **API Route**
```typescript
// app/api/wishlist/route.ts
export async function POST(request: Request) {
  const useCase = new AddToWishlistUseCase(wishlistRepo);
  const result = await useCase.execute(data);

  if (result.isFailure) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
```

6. **React Component**
```typescript
// components/wishlist/AddToWishlistButton.tsx
export function AddToWishlistButton({ productId }: Props) {
  const handleAdd = async () => {
    await fetch('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
  };

  return <Button onClick={handleAdd}>Add to Wishlist</Button>;
}
```

---

## 🧪 Testing Strategy

### **Unit Tests** (Domain & Application Layers)
```typescript
// __tests__/domain/entities/Order.test.ts
describe('Order Entity', () => {
  it('should accept order when vendor is authorized', () => {
    const order = Order.create({...}).getValue();
    const result = order.accept(vendorId);

    expect(result.isSuccess).toBe(true);
    expect(order.status).toBe(OrderStatus.ACCEPTED);
  });
});
```

### **Integration Tests** (Use Cases)
```typescript
// __tests__/application/use-cases/PlaceOrderUseCase.test.ts
describe('PlaceOrderUseCase', () => {
  it('should place order successfully', async () => {
    const useCase = new PlaceOrderUseCase(
      mockOrderRepo,
      mockVendorRepo,
      mockPaymentService
    );

    const result = await useCase.execute(validDTO);
    expect(result.isSuccess).toBe(true);
  });
});
```

### **E2E Tests** (API Routes)
```typescript
// __tests__/e2e/orders.test.ts
describe('POST /api/orders', () => {
  it('should create order', async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    expect(response.status).toBe(201);
  });
});
```

---

## 📝 Code Style Guide

### **Entity Example**
```typescript
export class Order extends Entity<OrderProps> {
  private constructor(props: OrderProps, id?: string) {
    super(props, id);
  }

  public static create(props: OrderProps): Result<Order> {
    // Validation
    if (!props.items || props.items.length === 0) {
      return Result.fail('Order must have items');
    }

    // Create entity
    return Result.ok(new Order(props));
  }

  // Business logic methods
  public accept(vendorId: string): Result<void> {
    // Check authorization
    // Check business rules
    // Update state
    return Result.ok();
  }
}
```

### **Use Case Example**
```typescript
export class PlaceOrderUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private vendorRepo: IVendorRepository,
    private paymentService: IPaymentService
  ) {}

  async execute(dto: PlaceOrderDTO): Promise<Result<OrderDTO>> {
    // 1. Validate input
    // 2. Fetch dependencies
    // 3. Execute business logic
    // 4. Persist changes
    // 5. Return result

    return Result.ok(orderDTO);
  }
}
```

### **Error Handling**
```typescript
// DON'T throw exceptions in domain/application layer
throw new Error('Something went wrong'); // ❌

// DO use Result pattern
return Result.fail('Something went wrong'); // ✅

// Handle in API routes
const result = await useCase.execute(dto);

if (result.isFailure) {
  return NextResponse.json(
    { error: result.error },
    { status: 400 }
  );
}

return NextResponse.json({ data: result.getValue() });
```

---

## 🔍 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create and apply migration
npx prisma migrate reset # Reset database
npx prisma generate      # Generate Prisma Client
npx prisma db seed       # Seed database

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Type Checking
npm run type-check       # Check TypeScript types
```

---

## 🐛 Debugging Tips

1. **Database Issues**
```bash
# Check database connection
npx prisma db pull

# View generated Prisma Client
cat src/generated/prisma/index.d.ts
```

2. **Environment Variables**
```typescript
// Check if service is configured
import { isServiceConfigured } from '@/shared/config/env.config';

if (!isServiceConfigured('stripe')) {
  console.log('Stripe not configured');
}
```

3. **Domain Logic**
```typescript
// Use Result pattern to track errors
const result = vendor.updateDeliveryZones(zones);

if (result.isFailure) {
  console.log('Failed:', result.error);
}
```

---

## 📚 Key Concepts

### **Value Objects vs Entities**
- **Value Object**: Defined by attributes, immutable (Money, Address)
- **Entity**: Defined by identity, mutable (User, Order)

### **Result Pattern**
```typescript
// Instead of throwing exceptions
const money = Money.create(100, 'INR');

if (money.isSuccess) {
  const value = money.getValue();
} else {
  console.error(money.error);
}
```

### **Repository Pattern**
```typescript
// Domain defines interface
interface IOrderRepository {
  findById(id: string): Promise<Result<Order>>;
}

// Infrastructure implements
class PrismaOrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Result<Order>> {
    // Database access
  }
}
```

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### **Docker**
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

---

## 📖 Documentation

- **Architecture**: See `ARCHITECTURE.md`
- **Progress**: See `IMPLEMENTATION_PROGRESS.md`
- **Summary**: See `FINAL_IMPLEMENTATION_SUMMARY.md`
- **API Docs**: Generate with `npm run docs`

---

## 🤝 Contributing

1. Follow the architecture patterns
2. Write tests for new features
3. Update documentation
4. Follow code style guide
5. Use Result pattern for errors
6. Keep domain layer pure (no dependencies)

---

## 📞 Support

For questions or issues:
- Check documentation files
- Review existing code examples
- Test in development environment first

---

**Happy Coding! 🚀**
