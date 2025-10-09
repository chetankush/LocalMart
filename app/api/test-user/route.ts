import { NextResponse } from 'next/server';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';

/**
 * Create Test User
 * POST /api/test-user
 */
export async function POST() {
  try {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: `test${Date.now()}@example.com`,
        fullName: 'Test User',
        role: 'CUSTOMER',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully! 🎉',
      data: user,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user ❌',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get All Users
 * GET /api/test-user
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      message: `Found ${users.length} users`,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users ❌',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
