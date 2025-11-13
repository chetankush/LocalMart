import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.favoriteStore.findMany({
      where: { userId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            storeDescription: true,
            storeLogo: true,
            city: true,
            locality: true,
            favoriteCount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggle(userId: string, vendorId: string) {
    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const existingFavorite = await this.prisma.favoriteStore.findUnique({
      where: {
        userId_vendorId: {
          userId,
          vendorId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.$transaction([
        this.prisma.favoriteStore.delete({
          where: { id: existingFavorite.id },
        }),
        this.prisma.vendor.update({
          where: { id: vendorId },
          data: { favoriteCount: { decrement: 1 } },
        }),
      ]);

      return {
        success: true,
        isFavorited: false,
        favoriteCount: vendor.favoriteCount - 1,
      };
    } else {
      await this.prisma.$transaction([
        this.prisma.favoriteStore.create({
          data: {
            userId,
            vendorId,
          },
        }),
        this.prisma.vendor.update({
          where: { id: vendorId },
          data: { favoriteCount: { increment: 1 } },
        }),
      ]);

      return {
        success: true,
        isFavorited: true,
        favoriteCount: vendor.favoriteCount + 1,
      };
    }
  }
}

