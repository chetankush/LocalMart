import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTheme, OrderStatus } from '@prisma/client';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async onboarding(userId: string, dto: any) {
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (existingVendor) {
      throw new ConflictException('Vendor profile already exists');
    }

    if (
      !dto.businessName ||
      !dto.contactEmail ||
      !dto.street ||
      !dto.city ||
      !dto.state ||
      !dto.zipCode
    ) {
      throw new BadRequestException('Missing required fields');
    }

    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        businessName: dto.businessName,
        businessType: dto.businessType || 'OTHER',
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone || '',
        city: dto.city,
        state: dto.state || 'Madhya Pradesh',
        businessAddress: {
          street: dto.street,
          city: dto.city,
          state: dto.state,
          zip: dto.zipCode,
        },
        deliveryAreas: {
          zones: [
            {
              id: 'default',
              name: 'Primary Delivery Zone',
              radius: parseFloat(dto.deliveryRadius || '5'),
              coordinates: { lat: 0, lng: 0 },
              deliveryCharge: parseFloat(dto.deliveryCharge || '0'),
              minOrderAmount: parseFloat(dto.minOrderAmount || '0'),
            },
          ],
        },
        deliveryCharges: {
          zones: [
            {
              zoneId: 'default',
              charge: parseFloat(dto.deliveryCharge || '0'),
              minOrder: parseFloat(dto.minOrderAmount || '0'),
            },
          ],
        },
        minOrderAmount: parseFloat(dto.minOrderAmount || '0'),
        maxDeliveryDistance: parseFloat(dto.deliveryRadius || '5'),
        status: 'PENDING_APPROVAL',
      },
    });

    return { vendorId: vendor.id };
  }

  async checkVendor(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== 'VENDOR') {
      return { isVendor: false, hasVendor: false };
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    return {
      isVendor: true,
      hasVendor: !!vendor,
    };
  }

  async getSettings(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async updateSettings(userId: string, dto: any) {
    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!existingVendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (
      !dto.businessName ||
      !dto.contactEmail ||
      !dto.contactPhone ||
      !dto.street ||
      !dto.city ||
      !dto.state
    ) {
      throw new BadRequestException('Missing required fields');
    }

    return this.prisma.vendor.update({
      where: { userId },
      data: {
        businessName: dto.businessName,
        storeDescription: dto.storeDescription,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        city: dto.city,
        state: dto.state,
        locality: dto.locality,
        pincode: dto.pincode,
        storeLogo: dto.storeLogo,
        storeImages: dto.storeImages || [],
        whatsappNumber: dto.whatsappNumber,
        telegramLink: dto.telegramLink,
        instagramHandle: dto.instagramHandle,
        facebookPage: dto.facebookPage,
        websiteUrl: dto.websiteUrl,
        storeTheme: dto.storeTheme || existingVendor.storeTheme,
        themeCustomization:
          dto.themeCustomization || existingVendor.themeCustomization,
        businessAddress: {
          street: dto.street,
          city: dto.city,
          state: dto.state,
          zip: dto.pincode,
          coordinates: {
            lat: dto.latitude || 0,
            lng: dto.longitude || 0,
          },
        },
      },
    });
  }

  async getTheme(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      select: {
        storeTheme: true,
        themeCustomization: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendor;
  }

  async updateTheme(
    userId: string,
    dto: { storeTheme: string; themeCustomization?: any },
  ) {
    if (!Object.values(StoreTheme).includes(dto.storeTheme as StoreTheme)) {
      throw new BadRequestException('Invalid theme selected');
    }

    const existingVendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!existingVendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const updatedVendor = await this.prisma.vendor.update({
      where: { userId },
      data: {
        storeTheme: dto.storeTheme as StoreTheme,
        themeCustomization: dto.themeCustomization || null,
      },
    });

    return {
      storeTheme: updatedVendor.storeTheme,
      themeCustomization: updatedVendor.themeCustomization,
    };
  }

  async getOrders(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return this.prisma.order.findMany({
      where: { vendorId: vendor.id },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    dto: { status: string; note?: string },
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.vendorId !== vendor.id) {
      throw new ForbiddenException('Unauthorized');
    }

    const validTransitions = this.getValidTransitions(order.status);
    if (!validTransitions.includes(dto.status as OrderStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    const statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];
    const newStatusEntry = {
      status: dto.status,
      timestamp: new Date().toISOString(),
      note: dto.note || null,
      updatedBy: 'VENDOR',
    };

    const updateData: any = {
      status: dto.status as OrderStatus,
      statusHistory: [...statusHistory, newStatusEntry],
    };

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

  async getProducts(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.product.findMany({
      where: { vendorId: vendor.id },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(userId: string, dto: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendor.id !== dto.vendorId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (
      !dto.name ||
      !dto.description ||
      !dto.categoryId ||
      !dto.images ||
      !dto.price
    ) {
      throw new BadRequestException('Missing required fields');
    }

    const slug =
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();

    // Ensure SKU is null if it's an empty string or falsy
    const sku = dto.sku && dto.sku.trim() !== '' ? dto.sku.trim() : null;

    console.log('Creating product with SKU:', sku, 'Original SKU:', dto.sku);

    try {
      return await this.prisma.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          description: dto.description,
          images: dto.images,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice || null,
          sku,
          stockQuantity: dto.stockQuantity || 0,
          lowStockThreshold: dto.lowStockThreshold || 10,
          weight: dto.weight || null,
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
        include: {
          category: true,
        },
      });
    } catch (error: any) {
      console.error('Product creation error:', error);
      if (error.code === 'P2002') {
        throw new ConflictException('SKU already exists');
      }
      throw error;
    }
  }

  async getProduct(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    return product;
  }

  async updateProduct(productId: string, userId: string, dto: any) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.stockQuantity !== undefined)
      updateData.stockQuantity = dto.stockQuantity;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.images) updateData.images = dto.images;
    if (dto.compareAtPrice !== undefined)
      updateData.compareAtPrice = dto.compareAtPrice;

    return this.prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async deleteProduct(productId: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async broadcast(userId: string, dto: { title: string; message: string }) {
    if (!dto.title || !dto.message) {
      throw new BadRequestException('Title and message are required');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const subscribers = await this.prisma.favoriteStore.findMany({
      where: { vendorId: vendor.id },
      select: { userId: true },
    });

    if (subscribers.length === 0) {
      throw new BadRequestException('No subscribers to notify');
    }

    const notifications = await this.prisma.notification.createMany({
      data: subscribers.map((subscriber) => ({
        userId: subscriber.userId,
        vendorId: vendor.id,
        type: 'VENDOR_BROADCAST',
        title: dto.title,
        message: dto.message,
        metadata: {
          vendorName: vendor.businessName,
          vendorLogo: vendor.storeLogo,
        },
      })),
    });

    return { count: notifications.count };
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
