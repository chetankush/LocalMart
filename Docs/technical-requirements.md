# Technical Requirements Document - Updated
## Hyperlocal Multi-Vendor Marketplace Platform (Vendor-Managed Delivery)

### 1. System Architecture Overview

#### 1.1 High-Level Architecture (Platform-Only Model)
```
Frontend (Web & Mobile) ↔ API Gateway ↔ Backend Services ↔ Database & Storage
                                      ↕
                External Services (Payment, SMS, Maps, Analytics)
```

**Architecture Pattern:** Microservices with API-first approach (No delivery logistics layer)
**Deployment:** Cloud-based with containerization
**Scalability:** Horizontal scaling with load balancers
**Security:** Multi-layer security with authentication, authorization, and encryption

**Key Difference:** No delivery management, logistics, or real-time tracking infrastructure required

### 2. Technology Stack Specifications

#### 2.1 Frontend Technologies

**Web Application:**
- **Framework:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **State Management:** Zustand for vendor analytics and order management
- **Forms:** React Hook Form with Zod validation for vendor delivery area setup
- **Maps Integration:** Google Maps for vendor delivery zone configuration
- **Charts/Analytics:** Recharts or Chart.js for vendor analytics dashboard
- **Authentication:** Clerk Auth integration

**Mobile Application:**
- **Framework:** React Native with TypeScript
- **Navigation:** React Navigation v6
- **State Management:** Zustand for order status and vendor communication
- **UI Components:** Native Base or Tamagui
- **Maps:** React Native Maps for delivery area visualization
- **Notifications:** Firebase Cloud Messaging for order status updates
- **Authentication:** Clerk React Native SDK

#### 2.2 Backend Technologies

**Core Backend:**
- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js API Routes (simplified as no delivery APIs needed)
- **Language:** TypeScript
- **Validation:** Zod for runtime type checking
- **ORM:** Prisma with focus on order and vendor analytics tables
- **API Documentation:** OpenAPI 3.0 with Swagger

**Database & Storage:**
- **Primary Database:** PostgreSQL 15+ (via Supabase)
- **File Storage:** Supabase Storage for product images and vendor documents
- **Analytics Storage:** Dedicated tables for vendor performance metrics
- **Search:** PostgreSQL full-text search for products and vendors
- **Real-time:** Supabase Realtime for order status updates (vendor-driven)

**Authentication & Payment:**
- **Service:** Clerk Auth with role-based access control
- **Payment Processing:** Stripe or Razorpay with marketplace/split payments
- **Vendor Payouts:** Automated payout system (daily/weekly)
- **Commission Calculation:** Automatic deduction system

### 3. Database Design (Vendor-Delivery Focused)

#### 3.1 Core Tables Structure

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE,
  full_name VARCHAR NOT NULL,
  role VARCHAR CHECK (role IN ('customer', 'vendor', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vendors Table (Enhanced for Delivery):**
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR NOT NULL,
  business_type VARCHAR NOT NULL,
  gst_number VARCHAR,
  business_license VARCHAR,
  store_description TEXT,
  store_logo_url VARCHAR,
  
  -- Delivery-specific fields
  delivery_areas JSONB NOT NULL, -- Geographic delivery zones
  delivery_charges JSONB NOT NULL, -- Zone-wise delivery pricing
  delivery_time_windows JSONB, -- Available delivery slots
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_delivery_distance INTEGER, -- in kilometers
  delivery_policy TEXT,
  
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  can_deliver BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Orders Table (Vendor-Managed Delivery):**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  
  -- Order status managed by vendor
  status VARCHAR CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  vendor_payout DECIMAL(10,2) NOT NULL,
  
  delivery_address JSONB NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  
  payment_status VARCHAR DEFAULT 'pending',
  payment_id VARCHAR,
  payout_status VARCHAR DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vendor Analytics Table:**
```sql
CREATE TABLE vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  date DATE NOT NULL,
  
  -- Sales metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  platform_commission DECIMAL(12,2) DEFAULT 0,
  net_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Delivery performance metrics
  average_delivery_time INTERVAL,
  delivery_success_rate DECIMAL(5,2),
  customer_satisfaction_score DECIMAL(3,2),
  on_time_delivery_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, date)
);
```

#### 3.2 Additional Tables
- **Product Reviews** (with delivery experience ratings)
- **Vendor Delivery Zones** (detailed geographic coverage)
- **Order Status History** (vendor-updated timeline)
- **Customer Addresses** (with vendor coverage validation)

### 4. API Design Specifications (Platform-Only)

#### 4.1 Core RESTful API Endpoints

**Vendor Delivery Management:**
```typescript
// Vendor delivery configuration
PUT  /api/vendors/delivery-areas
GET  /api/vendors/delivery-areas
PUT  /api/vendors/delivery-charges
GET  /api/vendors/delivery-performance

// Vendor order management (no delivery logistics)
GET  /api/vendors/orders
PUT  /api/vendors/orders/:id/status
POST /api/vendors/orders/:id/update-delivery-time
GET  /api/vendors/analytics/delivery-performance
```

**Customer Delivery Information:**
```typescript
// Check delivery availability
POST /api/delivery/check-availability
GET  /api/vendors/delivery-info/:vendorId
GET  /api/orders/:id/delivery-status

// Customer delivery preferences
PUT  /api/customers/delivery-addresses
GET  /api/customers/delivery-addresses/validate
```

**Platform Analytics (No Delivery Operations):**
```typescript
GET  /api/admin/analytics/vendor-performance
GET  /api/admin/analytics/delivery-metrics
GET  /api/admin/vendors/delivery-capability
```

#### 4.2 Real-time Features (Vendor-Driven)
- Order status updates (vendor manages)
- Vendor availability status
- Customer-vendor messaging
- Order completion notifications

### 5. Third-Party Integrations (Simplified)

#### 5.1 Payment Gateway (Marketplace Model)
**Stripe Connect or Razorpay Route:**
- Automatic vendor payouts after commission deduction
- Split payment functionality
- Refund management with vendor coordination
- Transaction reporting for vendor analytics

```typescript
class PaymentService {
  async processMarketplacePayment(orderId: string, vendorId: string, amount: number) {
    // Process payment and calculate commission
    const commission = amount * 0.03; // 3% platform commission
    const vendorPayout = amount - commission;
    
    // Queue vendor payout
    await this.queueVendorPayout(vendorId, vendorPayout);
  }
}
```

#### 5.2 Communication Services (Vendor-Customer)
- **SMS/WhatsApp:** Order status updates from vendor
- **Email:** Order confirmations and receipts
- **Push Notifications:** Vendor-driven status updates
- **In-app Messaging:** Direct vendor-customer communication

#### 5.3 Maps & Location (Delivery Area Management)
- **Google Maps Platform:** For vendor delivery area configuration
- **Geocoding API:** Address validation and delivery area checking
- **Distance Matrix API:** Delivery charge calculation support

### 6. Vendor Analytics & Business Intelligence

#### 6.1 Vendor Dashboard Analytics
```typescript
interface VendorAnalytics {
  // Sales Performance
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  
  // Delivery Performance (Vendor-Reported)
  averageDeliveryTime: number;
  deliverySuccessRate: number;
  customerSatisfactionScore: number;
  onTimeDeliveryRate: number;
  
  // Business Insights
  peakDeliveryHours: Array<{hour: number, orderCount: number}>;
  topPerformingAreas: Array<{area: string, revenue: number}>;
  customerRetentionRate: number;
  reorderRate: number;
}
```

#### 6.2 Platform Business Intelligence
```typescript
interface PlatformAnalytics {
  // Platform Performance
  totalGMV: number;
  totalCommission: number;
  activeVendors: number;
  activeCustomers: number;
  
  // Vendor Performance
  averageVendorRevenue: number;
  topPerformingVendors: Array<VendorPerformance>;
  vendorRetentionRate: number;
  
  // Customer Satisfaction
  overallCustomerSatisfaction: number;
  platformNPS: number;
  customerLifetimeValue: number;
}
```

### 7. Performance Requirements (Platform-Focused)

#### 7.1 System Performance
- **API Response Time:** < 300ms for 95% of requests
- **Database Queries:** Optimized for vendor analytics and order processing
- **Real-time Updates:** < 2 seconds for order status changes
- **Vendor Dashboard Load:** < 3 seconds with full analytics

#### 7.2 Scalability (Simplified Architecture)
- **Concurrent Orders:** Support 10,000+ simultaneous orders
- **Vendor Analytics:** Real-time processing for 1,000+ vendors
- **Database Optimization:** Efficient indexing for vendor and order queries
- **Caching Strategy:** Vendor analytics and product catalog caching

### 8. Security Requirements (Platform-Only)

#### 8.1 Financial Security
- **PCI DSS Compliance:** For payment processing
- **Vendor Payout Security:** Secure bank account verification
- **Commission Transparency:** Clear audit trail for all transactions
- **Fraud Prevention:** Order and payment monitoring

#### 8.2 Data Security
- **Vendor Business Data:** Encrypted storage of sensitive business information
- **Customer Personal Data:** GDPR compliant data handling
- **Transaction Security:** End-to-end encryption for all financial data

### 9. Monitoring & Analytics (Business-Focused)

#### 9.1 Platform Monitoring
- **Order Processing:** Success rates and failure analysis
- **Vendor Performance:** Delivery success and customer satisfaction tracking
- **Payment Processing:** Transaction success and payout monitoring
- **Customer Experience:** Order completion and satisfaction metrics

#### 9.2 Business Analytics
```typescript
interface BusinessMetrics {
  // Revenue Analytics
  monthlyRecurringRevenue: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  
  // Platform Health
  vendorChurnRate: number;
  customerRetentionRate: number;
  averageOrderProcessingTime: number;
  
  // Growth Metrics
  newVendorSignups: number;
  newCustomerRegistrations: number;
  platformGrowthRate: number;
}
```

### 10. Development Priorities (Platform-Only Model)

#### 10.1 Core MVP Features
1. **Vendor Management:** Registration, verification, and delivery area setup
2. **Order Processing:** Basic order flow with vendor status updates
3. **Payment System:** Marketplace payments with automatic commission deduction
4. **Vendor Analytics:** Basic performance and sales analytics
5. **Customer Interface:** Product browsing with delivery information

#### 10.2 Advanced Features (Post-MVP)
1. **Advanced Analytics:** Predictive analytics and business intelligence
2. **Vendor Tools:** Marketing tools, inventory management, customer insights
3. **Mobile Apps:** Dedicated vendor and customer mobile applications
4. **Integration APIs:** Third-party integrations for vendor tools
5. **White-label Solutions:** Platform licensing for other markets

### 11. Cost Optimization (Platform Model Benefits)

#### 11.1 Reduced Infrastructure Costs
- **No Delivery Fleet Management:** Eliminates vehicle tracking, routing, and fleet management systems
- **No Real-time GPS Tracking:** Reduces server costs and complexity
- **Simplified Architecture:** Lower hosting and maintenance costs
- **Reduced Support Overhead:** No delivery-related customer support needed

#### 11.2 Scalability Advantages
- **Geographic Expansion:** Can launch in new cities without delivery infrastructure setup
- **Faster Market Entry:** Reduced complexity allows quicker market penetration
- **Lower Capital Requirements:** No upfront investment in delivery logistics
- **Higher Margins:** Better unit economics due to reduced operational overhead

This updated technical requirements document focuses on building a robust platform infrastructure that empowers vendors to manage their own deliveries while providing comprehensive business intelligence and analytics tools for sustainable growth.