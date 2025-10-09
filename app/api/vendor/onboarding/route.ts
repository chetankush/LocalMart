import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/src/shared/utils/auth';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['VENDOR']);

    const body = await request.json();

    const {
      businessName,
      businessType,
      contactEmail,
      contactPhone,
      street,
      city,
      state,
      zipCode,
      deliveryRadius,
      deliveryCharge,
      minOrderAmount,
    } = body;

    // Validate required fields
    if (!businessName || !contactEmail || !street || !city || !state || !zipCode) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if vendor already exists
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor profile already exists' },
        { status: 400 }
      );
    }

    // Create vendor profile
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        businessName,
        businessType,
        contactEmail,
        contactPhone,
        businessAddress: {
          street,
          city,
          state,
          zip: zipCode,
        },
        deliveryAreas: {
          zones: [
            {
              id: 'default',
              name: 'Primary Delivery Zone',
              radius: parseFloat(deliveryRadius),
              coordinates: { lat: 0, lng: 0 }, // TODO: Get from geocoding
              deliveryCharge: parseFloat(deliveryCharge),
              minOrderAmount: parseFloat(minOrderAmount),
            },
          ],
        },
        deliveryCharges: {
          zones: [
            {
              zoneId: 'default',
              charge: parseFloat(deliveryCharge),
              minOrder: parseFloat(minOrderAmount),
            },
          ],
        },
        minOrderAmount: parseFloat(minOrderAmount),
        maxDeliveryDistance: parseFloat(deliveryRadius),
        status: 'PENDING_APPROVAL', // Admin needs to approve
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor profile created successfully',
      data: { vendorId: vendor.id },
    });
  } catch (error) {
    console.error('Vendor onboarding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor profile' },
      { status: 500 }
    );
  }
}
