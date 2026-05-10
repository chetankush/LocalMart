/**
 * Notification Helper Utilities
 *
 * DEPRECATED: This file used Prisma directly which has been removed from frontend.
 * All notification operations should now be handled by the NestJS backend.
 * The backend should trigger these notifications when products are created/updated.
 */

// import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// Anti-spam delay: 2 hours between automated new collection notifications
const NOTIFICATION_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * DEPRECATED: Check if vendor can send new collection notification (anti-spam)
 * This logic should now be handled in the backend when products are created.
 */
export async function canSendNewCollectionNotification(vendorId: string): Promise<boolean> {
  console.warn("DEPRECATED: canSendNewCollectionNotification should be handled by backend");
  // This function no longer works as Prisma has been removed from frontend
  return true;
}

/**
 * DEPRECATED: Send new collection notification to all vendor subscribers
 * This logic should now be handled in the backend when products are created.
 * The backend product creation endpoint should trigger notifications automatically.
 */
export async function sendNewCollectionNotification(
  vendorId: string,
  productId: string,
  productName: string,
  productImage: string | null,
  vendorName: string
): Promise<number> {
  console.warn("DEPRECATED: sendNewCollectionNotification should be handled by backend product creation");
  // This function no longer works as Prisma has been removed from frontend
  // The backend should handle this when a product is created via POST /api/vendor/products
  return 0;
}

/**
 * DEPRECATED: Send back-in-stock notification to all subscribed users
 * This logic should now be handled in the backend when product stock is updated.
 * The backend product update endpoint should trigger notifications automatically.
 */
export async function sendBackInStockNotifications(
  productId: string,
  productName: string,
  productImage: string | null,
  vendorId: string,
  vendorName: string
): Promise<number> {
  console.warn("DEPRECATED: sendBackInStockNotifications should be handled by backend product update");
  // This function no longer works as Prisma has been removed from frontend
  // The backend should handle this when product stock is updated via PATCH /api/vendor/products/:id
  return 0;
}

/* Original Prisma code (commented out for reference):

export async function canSendNewCollectionNotification(vendorId: string): Promise<boolean> {
  try {
    const lastNotification = await prisma.notification.findFirst({
      where: {
        vendorId,
        type: "NEW_COLLECTION",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (!lastNotification) {
      return true;
    }

    const timeSinceLastNotification = Date.now() - lastNotification.createdAt.getTime();
    return timeSinceLastNotification >= NOTIFICATION_DELAY_MS;
  } catch (error) {
    console.error("Error checking notification eligibility:", error);
    return true;
  }
}

export async function sendNewCollectionNotification(
  vendorId: string,
  productId: string,
  productName: string,
  productImage: string | null,
  vendorName: string
): Promise<number> {
  try {
    const canSend = await canSendNewCollectionNotification(vendorId);

    if (!canSend) {
      console.log(`Skipping new collection notification for vendor ${vendorId} - anti-spam delay active`);
      return 0;
    }

    const subscribers = await prisma.favoriteStore.findMany({
      where: { vendorId },
      select: { userId: true },
    });

    if (subscribers.length === 0) {
      return 0;
    }

    const result = await prisma.notification.createMany({
      data: subscribers.map((subscriber) => ({
        userId: subscriber.userId,
        vendorId,
        productId,
        type: "NEW_COLLECTION",
        title: `New product from ${vendorName}`,
        message: `${vendorName} just added "${productName}" to their collection. Check it out!`,
        metadata: {
          productName,
          productImage,
          vendorName,
          productLink: `/products/${productId}`,
        },
      })),
    });

    console.log(`Sent ${result.count} new collection notifications for product ${productId}`);
    return result.count;
  } catch (error) {
    console.error("Error sending new collection notification:", error);
    return 0;
  }
}

export async function sendBackInStockNotifications(
  productId: string,
  productName: string,
  productImage: string | null,
  vendorId: string,
  vendorName: string
): Promise<number> {
  try {
    const subscriptions = await prisma.backInStockSubscription.findMany({
      where: { productId },
      select: { userId: true },
    });

    if (subscriptions.length === 0) {
      return 0;
    }

    const result = await prisma.notification.createMany({
      data: subscriptions.map((subscription) => ({
        userId: subscription.userId,
        vendorId,
        productId,
        type: "BACK_IN_STOCK",
        title: `${productName} is back in stock!`,
        message: `Good news! "${productName}" from ${vendorName} is now available. Get it before it's gone!`,
        metadata: {
          productName,
          productImage,
          vendorName,
          productLink: `/products/${productId}`,
        },
      })),
    });

    await prisma.backInStockSubscription.deleteMany({
      where: { productId },
    });

    console.log(`Sent ${result.count} back-in-stock notifications for product ${productId}`);
    return result.count;
  } catch (error) {
    console.error("Error sending back-in-stock notifications:", error);
    return 0;
  }
}
*/
