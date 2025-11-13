import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(vendorId?: string) {
    const where: any = { isActive: true };
    if (vendorId) {
      where.vendorId = vendorId;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(userId: string, dto: any) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    if (vendor.id !== dto.vendorId) {
      throw new ForbiddenException('Unauthorized');
    }

    if (!dto.name || !dto.description || !dto.categoryId || !dto.images || !dto.price) {
      throw new BadRequestException('Missing required fields');
    }

    const slug =
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now();

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
          sku: dto.sku || null,
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
      if (error.code === 'P2002') {
        throw new ConflictException('SKU already exists');
      }
      throw error;
    }
  }

  async update(id: string, userId: string, dto: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
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
    if (dto.stockQuantity !== undefined) updateData.stockQuantity = dto.stockQuantity;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.images) updateData.images = dto.images;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  }

  async delete(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor.userId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    await this.prisma.product.delete({
      where: { id },
    });
  }

  async subscribeToNotifications(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stockQuantity > 0) {
      throw new BadRequestException('Product is already in stock');
    }

    const existingSubscription =
      await this.prisma.backInStockSubscription.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

    if (existingSubscription) {
      throw new ConflictException(
        'You are already subscribed to notifications for this product',
      );
    }

    return this.prisma.backInStockSubscription.create({
      data: {
        userId,
        productId,
      },
    });
  }

  async unsubscribeFromNotifications(userId: string, productId: string) {
    const subscription =
      await this.prisma.backInStockSubscription.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    await this.prisma.backInStockSubscription.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async getSubscriptions(userId: string) {
    return this.prisma.backInStockSubscription.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            stockQuantity: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductReviews(
    productId: string,
    pagination?: { page: number; limit: number },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const skip = pagination
      ? (pagination.page - 1) * pagination.limit
      : 0;
    const take = pagination ? pagination.limit : 10;

    const [reviews, total, ratingDistribution] = await Promise.all([
      this.prisma.productReview.findMany({
        where: {
          productId,
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
        orderBy: [
          { isVerifiedPurchase: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
      this.prisma.productReview.count({
        where: {
          productId,
          isApproved: true,
          isHidden: false,
        },
      }),
      this.prisma.productReview.groupBy({
        by: ['rating'],
        where: {
          productId,
          isApproved: true,
          isHidden: false,
        },
        _count: {
          rating: true,
        },
      }),
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingDistribution.forEach((item) => {
      distribution[item.rating as keyof typeof distribution] =
        item._count.rating;
    });

    return {
      product: {
        id: product.id,
        name: product.name,
        averageRating: product.averageRating
          ? Number(product.averageRating)
          : null,
        reviewCount: product.reviewCount,
      },
      reviews: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt,
        user: review.user,
        vendorResponse: review.vendorResponse,
        vendorRespondedAt: review.vendorRespondedAt,
      })),
      ratingDistribution: distribution,
      pagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
          }
        : undefined,
    };
  }
}
