import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    options: { limit: number; offset: number; unreadOnly: boolean }
  ) {
    const where: any = {
      userId,
    };

    if (options.unreadOnly) {
      where.isRead = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              storeLogo: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              images: true,
              price: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options.limit,
        skip: options.offset,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications,
      totalCount,
      unreadCount,
      hasMore: options.offset + options.limit < totalCount,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException("Unauthorized");
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException("Unauthorized");
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }
}
