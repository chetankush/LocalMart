import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStoreReviews(filters: {
    vendorId?: string;
    rating?: number;
    isHidden?: boolean;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.rating) where.rating = filters.rating;
    if (filters.isHidden !== undefined) where.isHidden = filters.isHidden;

    const skip = (filters.page - 1) * filters.limit;

    const [reviews, total] = await Promise.all([
      this.prisma.storeReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      this.prisma.storeReview.count({ where }),
    ]);

    return {
      reviews,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async updateStoreReview(
    id: string,
    dto: { isHidden?: boolean; isApproved?: boolean }
  ) {
    const review = await this.prisma.storeReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    return this.prisma.storeReview.update({
      where: { id },
      data: {
        isHidden: dto.isHidden !== undefined ? dto.isHidden : review.isHidden,
        isApproved:
          dto.isApproved !== undefined ? dto.isApproved : review.isApproved,
      },
    });
  }

  async deleteStoreReview(id: string) {
    const review = await this.prisma.storeReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    await this.prisma.storeReview.delete({
      where: { id },
    });
  }

  async getProductReviews(filters: {
    productId?: string;
    rating?: number;
    isHidden?: boolean;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.productId) where.productId = filters.productId;
    if (filters.rating) where.rating = filters.rating;
    if (filters.isHidden !== undefined) where.isHidden = filters.isHidden;

    const skip = (filters.page - 1) * filters.limit;

    const [reviews, total] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      this.prisma.productReview.count({ where }),
    ]);

    return {
      reviews,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  async updateProductReview(
    id: string,
    dto: { isHidden?: boolean; isApproved?: boolean }
  ) {
    const review = await this.prisma.productReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    return this.prisma.productReview.update({
      where: { id },
      data: {
        isHidden: dto.isHidden !== undefined ? dto.isHidden : review.isHidden,
        isApproved:
          dto.isApproved !== undefined ? dto.isApproved : review.isApproved,
      },
    });
  }

  async deleteProductReview(id: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException("Review not found");
    }

    await this.prisma.productReview.delete({
      where: { id },
    });
  }
}
