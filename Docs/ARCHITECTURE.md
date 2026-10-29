# LocalMart - Scalable Architecture Documentation

## Overview
LocalMart is a hyperlocal multi-vendor marketplace platform with vendor-managed delivery. This architecture is designed to scale to 100,000+ customers while maintaining SOLID principles, clean code, and optimal performance.

## Architecture Pattern
**Clean Architecture with Vertical Slice Organization**

### Core Principles
1. **SOLID Principles**
   - **S**ingle Responsibility: Each module/class has one reason to change
   - **O**pen/Closed: Open for extension, closed for modification
   - **L**iskov Substitution: Derived classes substitutable for base classes
   - **I**nterface Segregation: Specific interfaces over general ones
   - **D**ependency Inversion: Depend on abstractions, not concretions

2. **DRY (Don't Repeat Yourself)**
   - Shared utilities and helpers
   - Reusable components and hooks
   - Common validation schemas
   - Generic repository patterns

3. **Clean Code Principles**
   - Meaningful names
   - Small, focused functions
   - Clear separation of concerns
   - Comprehensive error handling
   - Type safety with TypeScript

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  (Next.js Frontend - Web & React Native - Mobile)           │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│            (Next.js API Routes + Middleware)                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Vendor     │ │   Customer   │ │    Order     │        │
│  │   Service    │ │   Service    │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Product    │ │   Payment    │ │  Analytics   │        │
│  │   Service    │ │   Service    │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   DOMAIN LAYER                               │
│  (Business Logic, Entities, Value Objects, Interfaces)       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Repository  │ │    Cache     │ │   Storage    │        │
│  │  (Database)  │ │   (Redis)    │ │  (Supabase)  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Payment    │ │    Email     │ │     Maps     │        │
│  │   Gateway    │ │   Service    │ │   Service    │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── core/
│   ├── domain/                    # Domain layer (business rules)
│   │   ├── entities/              # Business entities
│   │   │   ├── User.ts
│   │   │   ├── Vendor.ts
│   │   │   ├── Product.ts
│   │   │   ├── Order.ts
│   │   │   └── DeliveryArea.ts
│   │   ├── value-objects/         # Immutable value objects
│   │   │   ├── Email.ts
│   │   │   ├── Phone.ts
│   │   │   ├── Address.ts
│   │   │   ├── Money.ts
│   │   │   └── DeliveryCharge.ts
│   │   ├── interfaces/            # Repository interfaces
│   │   │   ├── IVendorRepository.ts
│   │   │   ├── IProductRepository.ts
│   │   │   ├── IOrderRepository.ts
│   │   │   └── IUserRepository.ts
│   │   └── errors/                # Domain-specific errors
│   │       ├── VendorError.ts
│   │       ├── OrderError.ts
│   │       └── ValidationError.ts
│   │
│   ├── application/               # Application layer (use cases)
│   │   ├── use-cases/
│   │   │   ├── vendor/
│   │   │   │   ├── CreateVendorUseCase.ts
│   │   │   │   ├── UpdateDeliveryAreasUseCase.ts
│   │   │   │   └── GetVendorAnalyticsUseCase.ts
│   │   │   ├── customer/
│   │   │   │   ├── RegisterCustomerUseCase.ts
│   │   │   │   └── UpdateAddressUseCase.ts
│   │   │   ├── order/
│   │   │   │   ├── PlaceOrderUseCase.ts
│   │   │   │   ├── UpdateOrderStatusUseCase.ts
│   │   │   │   └── ProcessRefundUseCase.ts
│   │   │   └── product/
│   │   │       ├── CreateProductUseCase.ts
│   │   │       └── UpdateInventoryUseCase.ts
│   │   ├── services/              # Application services
│   │   │   ├── VendorService.ts
│   │   │   ├── OrderService.ts
│   │   │   ├── PaymentService.ts
│   │   │   ├── AnalyticsService.ts
│   │   │   └── NotificationService.ts
│   │   └── dto/                   # Data transfer objects
│   │       ├── CreateVendorDto.ts
│   │       ├── PlaceOrderDto.ts
│   │       └── UpdateOrderStatusDto.ts
│   │
│   └── infrastructure/            # Infrastructure layer
│       ├── database/
│       │   ├── repositories/      # Repository implementations
│       │   │   ├── VendorRepository.ts
│       │   │   ├── ProductRepository.ts
│       │   │   ├── OrderRepository.ts
│       │   │   └── UserRepository.ts
│       │   ├── mappers/           # Data mappers
│       │   │   ├── VendorMapper.ts
│       │   │   ├── OrderMapper.ts
│       │   │   └── ProductMapper.ts
│       │   └── supabase/
│       │       └── client.ts
│       ├── cache/
│       │   ├── RedisCache.ts      # Caching implementation
│       │   └── CacheKeys.ts
│       ├── external/              # External services
│       │   ├── payment/
│       │   │   ├── IPaymentGateway.ts
│       │   │   ├── StripeGateway.ts
│       │   │   └── RazorpayGateway.ts
│       │   ├── email/
│       │   │   ├── IEmailService.ts
│       │   │   └── SendGridService.ts
│       │   ├── sms/
│       │   │   └── TwilioService.ts
│       │   └── maps/
│       │       └── GoogleMapsService.ts
│       └── storage/
│           └── SupabaseStorage.ts
│
├── modules/                       # Feature modules
│   ├── vendor/
│   │   ├── components/
│   │   │   ├── VendorDashboard.tsx
│   │   │   ├── DeliveryAreaMap.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── hooks/
│   │   │   ├── useVendorOrders.ts
│   │   │   ├── useVendorAnalytics.ts
│   │   │   └── useDeliveryAreas.ts
│   │   └── types/
│   │       └── vendor.types.ts
│   ├── customer/
│   │   ├── components/
│   │   │   ├── ProductListing.tsx
│   │   │   ├── VendorCard.tsx
│   │   │   ├── ShoppingCart.tsx
│   │   │   └── OrderTracking.tsx
│   │   ├── hooks/
│   │   │   ├── useProducts.ts
│   │   │   ├── useCart.ts
│   │   │   └── useOrders.ts
│   │   └── types/
│   │       └── customer.types.ts
│   ├── orders/
│   │   ├── components/
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderDetails.tsx
│   │   │   └── OrderStatusTimeline.tsx
│   │   ├── hooks/
│   │   │   └── useOrderTracking.ts
│   │   └── types/
│   │       └── order.types.ts
│   ├── products/
│   │   ├── components/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductDetails.tsx
│   │   └── hooks/
│   │       └── useProductManagement.ts
│   ├── admin/
│   │   ├── components/
│   │   │   ├── VendorApproval.tsx
│   │   │   ├── PlatformAnalytics.tsx
│   │   │   └── DisputeManagement.tsx
│   │   └── hooks/
│   │       └── useAdminDashboard.ts
│   └── auth/
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   └── RegisterForm.tsx
│       └── hooks/
│           └── useAuth.ts
│
├── shared/                        # Shared resources
│   ├── components/                # Reusable UI components
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── forms/
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   └── FormTextarea.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Toast.tsx
│   ├── hooks/                     # Shared hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useInfiniteScroll.ts
│   │   └── useGeolocation.ts
│   ├── utils/                     # Utility functions
│   │   ├── validation/
│   │   │   ├── schemas.ts         # Zod schemas
│   │   │   └── validators.ts
│   │   ├── formatters/
│   │   │   ├── currency.ts
│   │   │   ├── date.ts
│   │   │   └── phone.ts
│   │   ├── helpers/
│   │   │   ├── distance.ts
│   │   │   ├── commission.ts
│   │   │   └── delivery.ts
│   │   └── constants/
│   │       ├── app.constants.ts
│   │       ├── error.constants.ts
│   │       └── validation.constants.ts
│   ├── types/                     # Shared TypeScript types
│   │   ├── api.types.ts
│   │   ├── database.types.ts
│   │   └── common.types.ts
│   └── config/                    # Configuration
│       ├── env.config.ts
│       ├── api.config.ts
│       └── payment.config.ts
│
└── app/                           # Next.js App Router
    ├── (auth)/
    │   ├── sign-in/
    │   └── sign-up/
    ├── (vendor)/
    │   ├── dashboard/
    │   ├── products/
    │   ├── orders/
    │   ├── analytics/
    │   └── settings/
    ├── (customer)/
    │   ├── browse/
    │   ├── cart/
    │   ├── orders/
    │   └── profile/
    ├── (admin)/
    │   ├── vendors/
    │   ├── analytics/
    │   └── disputes/
    └── api/
        ├── vendors/
        │   ├── route.ts
        │   ├── [id]/
        │   │   ├── route.ts
        │   │   └── delivery-areas/
        │   │       └── route.ts
        │   └── analytics/
        │       └── route.ts
        ├── products/
        │   ├── route.ts
        │   └── [id]/
        │       └── route.ts
        ├── orders/
        │   ├── route.ts
        │   └── [id]/
        │       ├── route.ts
        │       └── status/
        │           └── route.ts
        ├── payments/
        │   ├── create-intent/
        │   │   └── route.ts
        │   └── webhook/
        │       └── route.ts
        └── admin/
            ├── vendors/
            │   └── approve/
            │       └── route.ts
            └── analytics/
                └── route.ts
```

## Scalability Strategies

### 1. Database Optimization
- **Indexing**: Strategic indexes on frequently queried columns
- **Partitioning**: Table partitioning for large datasets (orders, analytics)
- **Connection Pooling**: Efficient database connection management
- **Read Replicas**: Separate read/write operations for analytics

### 2. Caching Strategy
```typescript
// Three-tier caching
1. Browser Cache (Static Assets)
2. CDN Cache (Next.js Static/ISR Pages)
3. Redis Cache (API Responses, User Sessions)
```

### 3. API Optimization
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Pagination**: Cursor-based pagination for large datasets
- **Response Compression**: Gzip/Brotli compression
- **Query Optimization**: GraphQL-style field selection

### 4. Load Distribution
- **Horizontal Scaling**: Stateless API design for easy scaling
- **Load Balancer**: Distribute traffic across multiple instances
- **Auto-scaling**: Based on CPU/Memory usage metrics

### 5. Real-time Features
- **Supabase Realtime**: For order status updates
- **WebSockets**: For vendor-customer communication
- **Server-Sent Events**: For notifications

## Design Patterns Implementation

### 1. Repository Pattern
```typescript
// Abstracts data layer
interface IVendorRepository {
  findById(id: string): Promise<Vendor | null>;
  findAll(filters: VendorFilters): Promise<Vendor[]>;
  create(vendor: Vendor): Promise<Vendor>;
  update(id: string, vendor: Partial<Vendor>): Promise<Vendor>;
  delete(id: string): Promise<void>;
}
```

### 2. Service Pattern
```typescript
// Encapsulates business logic
class VendorService {
  constructor(
    private vendorRepo: IVendorRepository,
    private analyticsService: AnalyticsService
  ) {}

  async registerVendor(dto: CreateVendorDto): Promise<Vendor> {
    // Business logic here
  }
}
```

### 3. Factory Pattern
```typescript
// Creates complex objects
class PaymentGatewayFactory {
  static create(type: 'stripe' | 'razorpay'): IPaymentGateway {
    switch(type) {
      case 'stripe': return new StripeGateway();
      case 'razorpay': return new RazorpayGateway();
    }
  }
}
```

### 4. Strategy Pattern
```typescript
// Different algorithms for same task
interface DeliveryChargeStrategy {
  calculate(distance: number, orderValue: number): Money;
}

class FlatRateStrategy implements DeliveryChargeStrategy {
  calculate(): Money { /* ... */ }
}

class DistanceBasedStrategy implements DeliveryChargeStrategy {
  calculate(distance: number): Money { /* ... */ }
}
```

### 5. Observer Pattern
```typescript
// Event-driven architecture
class OrderService extends EventEmitter {
  async updateStatus(orderId: string, status: OrderStatus) {
    // Update order
    this.emit('orderStatusChanged', { orderId, status });
  }
}

// Listeners
orderService.on('orderStatusChanged', async (data) => {
  await notificationService.notifyCustomer(data);
  await analyticsService.trackOrderStatus(data);
});
```

## Security Measures

### 1. Authentication & Authorization
- **Clerk Auth**: Secure user authentication
- **Role-Based Access Control (RBAC)**: Customer, Vendor, Admin roles
- **JWT Tokens**: Secure API access
- **Row Level Security (RLS)**: Supabase database security

### 2. Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based protection

### 3. API Security
- **Rate Limiting**: Prevent DDoS attacks
- **HTTPS Only**: Encrypted communication
- **API Key Management**: Secure key storage
- **CORS Configuration**: Restrict origins

## Performance Metrics

### Target Metrics (100K Users)
- API Response Time: < 300ms (95th percentile)
- Database Query Time: < 100ms (95th percentile)
- Page Load Time: < 2s (First Contentful Paint)
- Time to Interactive: < 3s
- Concurrent Requests: 10,000+
- Database Connections: 500+ (pooled)
- Cache Hit Ratio: > 80%
- Uptime: 99.9%

## Monitoring & Observability

### 1. Application Monitoring
- **Error Tracking**: Sentry for error monitoring
- **Performance Monitoring**: Vercel Analytics
- **Uptime Monitoring**: UptimeRobot

### 2. Database Monitoring
- **Query Performance**: Slow query logs
- **Connection Pool**: Monitor active connections
- **Disk Usage**: Track storage growth

### 3. Business Metrics
- **Order Volume**: Track GMV and order counts
- **Vendor Performance**: Delivery success rates
- **Customer Satisfaction**: NPS and ratings
- **Platform Health**: Active users, retention rates

## Development Workflow

### 1. Code Quality
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright

### 2. CI/CD Pipeline
```
Git Push → GitHub Actions →
  ├── Lint & Format Check
  ├── Type Check
  ├── Unit Tests
  ├── Build Check
  └── Deploy to Vercel (on main branch)
```

### 3. Environment Strategy
- **Development**: Local development environment
- **Staging**: Pre-production testing
- **Production**: Live environment

## Conclusion

This architecture ensures:
- ✅ Scalability to 100,000+ users
- ✅ SOLID principles adherence
- ✅ DRY principle implementation
- ✅ Clean, maintainable code
- ✅ High performance and reliability
- ✅ Security and data protection
- ✅ Comprehensive monitoring and observability
