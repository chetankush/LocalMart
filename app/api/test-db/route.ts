import { NextResponse } from 'next/server';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';

/**
 * Test Database Connection
 * GET /api/test-db
 */
export async function GET() {
  try {
    // Test 1: Check connection
    await prisma.$queryRaw`SELECT 1`;

    // Test 2: Count users
    const userCount = await prisma.user.count();

    // Test 3: Count vendors
    const vendorCount = await prisma.vendor.count();

    // Test 4: Count products
    const productCount = await prisma.product.count();

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully! ✅',
      data: {
        userCount,
        vendorCount,
        productCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed ❌',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
