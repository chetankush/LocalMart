import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    dto: {
      items: any[];
      deliveryAddress: any;
      paymentMethod: string;
      totalAmount?: number;
    },
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('No items in order');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Group items by vendor
    const itemsByVendor = dto.items.reduce((acc: any, item: any) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = [];
      }
      acc[item.vendorId].push(item);
      return acc;
    }, {});

    // Create separate orders for each vendor
    const createdOrders = [];

    for (const [vendorId, vendorItems] of Object.entries(itemsByVendor) as [
      string,
      any,
    ][]) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
      });

      if (!vendor) {
        continue;
      }

      // Calculate order totals
      const subtotal = vendorItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      );
      const deliveryFee = 0;
      const taxAmount = 0;
      const orderTotal = subtotal + deliveryFee + taxAmount;

      const platformCommission = orderTotal * Number(vendor.commissionRate);
      const vendorPayout = orderTotal - platformCommission;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`;

      // Create order
      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: user.id,
          vendorId: vendorId,
          status: 'PENDING',
          statusHistory: [
            {
              status: 'PENDING',
              timestamp: new Date().toISOString(),
              note: 'Order placed',
            },
          ],
          subtotal,
          deliveryFee,
          taxAmount,
          discount: 0,
          totalAmount: orderTotal,
          platformCommission,
          vendorPayout,
          deliveryAddress: dto.deliveryAddress,
          paymentStatus: dto.paymentMethod === 'cod' ? 'PENDING' : 'PROCESSING',
          paymentMethod: dto.paymentMethod.toUpperCase(),
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
                image: item.image,
              },
            })),
          },
        },
        include: {
          items: true,
          vendor: {
            select: {
              businessName: true,
              contactPhone: true,
              contactEmail: true,
            },
          },
        },
      });

      createdOrders.push(order);
    }

    return { orders: createdOrders };
  }

  async findAll(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
        vendor: {
          select: {
            businessName: true,
            contactPhone: true,
            city: true,
            state: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    orderId: string,
    userId: string,
    dto: { status: string; note?: string },
  ) {
    // Get vendor profile
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Get the order and verify ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendor.id) {
      throw new ForbiddenException('Unauthorized');
    }

    // Validate status transition
    const validTransitions = this.getValidTransitions(order.status);
    if (!validTransitions.includes(dto.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    // Prepare status history update
    const statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];
    const newStatusEntry = {
      status: dto.status,
      timestamp: new Date().toISOString(),
      note: dto.note || null,
      updatedBy: 'VENDOR',
    };

    // Prepare update data
    const updateData: any = {
      status: dto.status as OrderStatus,
      statusHistory: [...statusHistory, newStatusEntry],
    };

    // Set specific timestamps based on status
    switch (dto.status) {
      case 'ACCEPTED':
        updateData.acceptedAt = new Date();
        break;
      case 'CANCELLED':
        updateData.cancelledAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        updateData.actualDeliveryTime = new Date();
        break;
    }

    // Update the order
    return this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });
  }

  private getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
    switch (currentStatus) {
      case 'PENDING':
        return ['ACCEPTED', 'CANCELLED'];
      case 'ACCEPTED':
        return ['PREPARING', 'CANCELLED'];
      case 'PREPARING':
        return ['READY', 'CANCELLED'];
      case 'READY':
        return ['OUT_FOR_DELIVERY', 'CANCELLED'];
      case 'OUT_FOR_DELIVERY':
        return ['DELIVERED'];
      case 'DELIVERED':
        return [];
      case 'CANCELLED':
        return [];
      case 'REFUNDED':
        return [];
      default:
        return [];
    }
  }
}
