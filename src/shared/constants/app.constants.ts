/**
 * Application-wide constants
 */

export const APP_CONSTANTS = {
  // Application Info
  APP_NAME: "LocalMart",
  APP_DESCRIPTION:
    "Hyperlocal Multi-Vendor Marketplace with Vendor-Managed Delivery",
  APP_VERSION: "1.0.0",

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Commission Rates
  COMMISSION_RATES: {
    BASIC: 0.04, // 4%
    PREMIUM: 0.025, // 2.5%
    ENTERPRISE: 0.02, // 2%
  },

  // Subscription Plans
  SUBSCRIPTION_PLANS: {
    BASIC: {
      name: "Basic",
      price: 0,
      commissionRate: 0.04,
      features: ["Basic Analytics", "Email Support", "Product Management"],
    },
    PREMIUM: {
      name: "Premium",
      price: 799,
      commissionRate: 0.025,
      features: [
        "Advanced Analytics",
        "Priority Support",
        "Marketing Tools",
        "Delivery Optimization",
      ],
    },
    ENTERPRISE: {
      name: "Enterprise",
      price: 1999,
      commissionRate: 0.02,
      features: [
        "Custom Analytics",
        "API Access",
        "Dedicated Account Manager",
        "White-label Options",
      ],
    },
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    PREPARING: "PREPARING",
    READY: "READY",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    REFUNDED: "REFUNDED",
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
  },

  // Vendor Status
  VENDOR_STATUS: {
    PENDING_APPROVAL: "PENDING_APPROVAL",
    APPROVED: "APPROVED",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    REJECTED: "REJECTED",
  },

  // User Roles
  ROLES: {
    CUSTOMER: "CUSTOMER",
    VENDOR: "VENDOR",
    ADMIN: "ADMIN",
  },

  // Delivery
  MAX_DELIVERY_DISTANCE_KM: 50,
  MIN_ORDER_AMOUNT: 100, // ₹100

  // File Upload
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_PRODUCT_IMAGES: 5,

  // Cache TTL (in seconds)
  CACHE_TTL: {
    VENDOR_DATA: 3600, // 1 hour
    PRODUCT_LIST: 1800, // 30 minutes
    DELIVERY_AREAS: 7200, // 2 hours
    ANALYTICS: 300, // 5 minutes
  },

  // Rate Limiting (requests per minute)
  RATE_LIMITS: {
    CUSTOMER: 100,
    VENDOR: 200,
    ADMIN: 500,
  },
} as const;

export type OrderStatus = keyof typeof APP_CONSTANTS.ORDER_STATUS;
export type PaymentStatus = keyof typeof APP_CONSTANTS.PAYMENT_STATUS;
export type VendorStatus = keyof typeof APP_CONSTANTS.VENDOR_STATUS;
export type UserRole = keyof typeof APP_CONSTANTS.ROLES;
