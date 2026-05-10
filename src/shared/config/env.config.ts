/**
 * Environment Configuration
 * Type-safe access to environment variables
 */

// Validate required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Missing environment variable: ${envVar}`);
  }
}

export const env = {
  // Application
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "LocalMart",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    env: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
  },

  // Database
  database: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },

  // Authentication (Supabase)
  auth: {
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
    afterSignInUrl: "/",
    afterSignUpUrl: "/select-role",
  },

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  // Payment (Stripe)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  },

  // Payment (Razorpay)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  // Maps (OpenStreetMap - no key needed)
  maps: {
    provider: "openstreetmap" as const,
  },

  // Email (SendGrid)
  email: {
    apiKey: process.env.SENDGRID_API_KEY || "",
    fromEmail: process.env.SENDGRID_FROM_EMAIL || "noreply@localmart.com",
    fromName: process.env.SENDGRID_FROM_NAME || "LocalMart",
  },

  // SMS (Twilio)
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  },

  // Redis (Optional)
  redis: {
    url: process.env.REDIS_URL || "",
  },

  // Analytics
  analytics: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  },

  // Feature Flags
  features: {
    vendorAnalytics: process.env.ENABLE_VENDOR_ANALYTICS === "true",
    realTimeTracking: process.env.ENABLE_REAL_TIME_TRACKING === "true",
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === "true",
    smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === "true",
  },

  // Rate Limiting
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === "true",
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // File Upload
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "5", 10),
    allowedImageTypes: (
      process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/webp"
    ).split(","),
  },
} as const;

// Helper function to check if service is configured
export const isServiceConfigured = (
  service: "stripe" | "razorpay" | "maps" | "email" | "sms" | "redis"
): boolean => {
  switch (service) {
    case "stripe":
      return !!env.stripe.secretKey && !!env.stripe.publishableKey;
    case "razorpay":
      return !!env.razorpay.keyId && !!env.razorpay.keySecret;
    case "maps":
      return true; // OpenStreetMap, always available
    case "email":
      return !!env.email.apiKey;
    case "sms":
      return !!env.sms.accountSid && !!env.sms.authToken;
    case "redis":
      return !!env.redis.url;
    default:
      return false;
  }
};
