import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StoreTheme } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      select: {
        id: true,
        businessName: true,
        businessType: true,
        storeDescription: true,
        storeLogo: true,
        city: true,
        locality: true,
        status: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async getVendorReviews(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Store not found');
    }

    const reviews = await this.prisma.storeReview.findMany({
      where: {
        vendorId,
        isApproved: true,
        isHidden: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        averageRating: vendor.averageRating
          ? Number(vendor.averageRating)
          : null,
        reviewCount: vendor.reviewCount,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        createdAt: review.createdAt,
        user: review.user,
        vendorResponse: review.vendorResponse,
        vendorRespondedAt: review.vendorRespondedAt,
      })),
    };
  }

  async updateStatus(id: string, dto: { status: string; isActive?: boolean }) {
    if (!['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED'].includes(dto.status)) {
      throw new BadRequestException(
        'Invalid status. Must be ACTIVE, PENDING_APPROVAL, or SUSPENDED',
      );
    }

    return this.prisma.vendor.update({
      where: { id },
      data: {
        status: dto.status as any,
        isActive: dto.isActive !== undefined ? dto.isActive : dto.status === 'ACTIVE',
        canDeliver: dto.status === 'ACTIVE',
      },
    });
  }

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
        themeCustomization: dto.themeCustomization || existingVendor.themeCustomization,
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
}
