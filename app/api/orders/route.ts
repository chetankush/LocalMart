import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/src/core/infrastructure/database/prisma/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: supabaseUser.email },
          { phone: supabaseUser.phone }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { items, deliveryAddress, paymentMethod, totalAmount } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in order' },
        { status: 400 }
      );
    }

    // Group items by vendor
    const itemsByVendor = items.reduce((acc: any, item: any) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = [];
      }
      acc[item.vendorId].push(item);
      return acc;
    }, {});

    // Create separate orders for each vendor
    const createdOrders = [];

    for (const [vendorId, vendorItems] of Object.entries(itemsByVendor) as [string, any][]) {
      // Get vendor to calculate commission
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId }
      });

      if (!vendor) {
        continue;
      }

      // Calculate order totals
      const subtotal = vendorItems.reduce((sum: number, item: any) =>
        sum + (item.price * item.quantity), 0
      );
      const deliveryFee = 0;
      const taxAmount = 0;
      const orderTotal = subtotal + deliveryFee + taxAmount;

      const platformCommission = orderTotal * Number(vendor.commissionRate);
      const vendorPayout = orderTotal - platformCommission;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          vendorId: vendorId,
          status: 'PENDING',
          statusHistory: [
            {
              status: 'PENDING',
              timestamp: new Date().toISOString(),
              note: 'Order placed'
            }
          ],
          subtotal,
          deliveryFee,
          taxAmount,
          discount: 0,
          totalAmount: orderTotal,
          platformCommission,
          vendorPayout,
          deliveryAddress,
          paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'PROCESSING',
          paymentMethod: paymentMethod.toUpperCase(),
          items: {
            create: vendorItems.map((item: any) => ({
              productId: item.id,
              productName: item.name,
              productImage: item.image,
              quantity: item.quantity,
              unitPrice: item.price,
              totalPrice: item.price * item.quantity,
              productSnapshot: {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image
              }
            }))
          }
        },
        include: {
          items: true,
          vendor: {
            select: {
              businessName: true,
              contactPhone: true,
              contactEmail: true
            }
          }
        }
      });

      createdOrders.push(order);
    }

    return NextResponse.json({
      success: true,
      orders: createdOrders,
      message: `${createdOrders.length} order(s) created successfully`
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: supabaseUser.email },
          { phone: supabaseUser.phone }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all orders for the user
    const orders = await prisma.order.findMany({
      where: {
        customerId: user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        },
        vendor: {
          select: {
            businessName: true,
            contactPhone: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ orders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
