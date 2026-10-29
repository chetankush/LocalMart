/**
 * Prisma Client Singleton
 * Ensures single instance across the application
 * Optimized for Next.js development and production
 */

import { PrismaClient } from '@/generated/prisma';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL is not defined in environment variables!");
} else {
  console.log("Prisma Client initialized with DATABASE_URL present.");
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Disconnect Prisma on application shutdown
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
};

/**
 * Connect to database (useful for testing)
 */
export const connectPrisma = async () => {
  await prisma.$connect();
};

/**
 * Health check - verify database connection
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};
