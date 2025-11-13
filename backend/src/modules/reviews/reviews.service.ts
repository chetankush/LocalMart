import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createProductReview(
    userId: string,
    dto: { productId: string; rating: number; comment?: string; images?: any },
  ) {
    if (!dto.productId) {
      throw new BadRequestException('Product ID is required');
    }

    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { vendor: { select: { userId: true } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor.userId === userId) {
      throw new ForbiddenException('You cannot review your own product');
    }

    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: {
          customerId: userId,
          status: 'DELIVERED',
        },
      },
    });

    const existingReview = await this.prisma.productReview.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });

    if (existingReview) {
      return this.prisma.$transaction(async (tx) => {
        const updatedReview = await tx.productReview.update({
          where: { id: existingReview.id },
          data: {
            rating: dto.rating,
            comment: dto.comment || null,
            images: dto.images || null,
            isVerifiedPurchase: !!hasPurchased,
          },
        });

        const allReviews = await tx.productReview.findMany({
          where: {
            productId: dto.productId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating =
          allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) /
              allReviews.length
            : 0;

        await tx.product.update({
          where: { id: dto.productId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return updatedReview;
      });
    } else {
      return this.prisma.$transaction(async (tx) => {
        const newReview = await tx.productReview.create({
          data: {
            userId,
            productId: dto.productId,
            rating: dto.rating,
            comment: dto.comment || null,
            images: dto.images || null,
            isVerifiedPurchase: !!hasPurchased,
          },
        });

        const allReviews = await tx.productReview.findMany({
          where: {
            productId: dto.productId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) /
          allReviews.length;

        await tx.product.update({
          where: { id: dto.productId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return newReview;
      });
    }
  }

  async createStoreReview(
    userId: string,
    dto: { vendorId: string; rating: number; comment?: string; images?: any },
  ) {
    if (!dto.vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }

    if (!dto.rating || dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Store not found');
    }

    if (vendor.userId === userId) {
      throw new ForbiddenException('You cannot review your own store');
    }

    const existingReview = await this.prisma.storeReview.findUnique({
      where: {
        userId_vendorId: {
          userId,
          vendorId: dto.vendorId,
        },
      },
    });

    if (existingReview) {
      return this.prisma.$transaction(async (tx) => {
        const updatedReview = await tx.storeReview.update({
          where: { id: existingReview.id },
          data: {
            rating: dto.rating,
            comment: dto.comment || null,
            images: dto.images || null,
          },
        });

        const allReviews = await tx.storeReview.findMany({
          where: {
            vendorId: dto.vendorId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating =
          allReviews.length > 0
            ? allReviews.reduce((sum, r) => sum + r.rating, 0) /
              allReviews.length
            : 0;

        await tx.vendor.update({
          where: { id: dto.vendorId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return updatedReview;
      });
    } else {
      return this.prisma.$transaction(async (tx) => {
        const newReview = await tx.storeReview.create({
          data: {
            userId,
            vendorId: dto.vendorId,
            rating: dto.rating,
            comment: dto.comment || null,
            images: dto.images || null,
          },
        });

        const allReviews = await tx.storeReview.findMany({
          where: {
            vendorId: dto.vendorId,
            isApproved: true,
            isHidden: false,
          },
          select: { rating: true },
        });

        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) /
          allReviews.length;

        await tx.vendor.update({
          where: { id: dto.vendorId },
          data: {
            averageRating: avgRating,
            reviewCount: allReviews.length,
          },
        });

        return newReview;
      });
    }
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

  async getStoreReviews(vendorId: string) {
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
}
