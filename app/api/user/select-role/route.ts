import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/shared/utils/auth';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role || !['CUSTOMER', 'VENDOR'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedUser.role },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
