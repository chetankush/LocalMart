import { prisma } from "@/src/core/infrastructure/database/prisma/client";

// Anti-spam delay: 2 hours between automated new collection notifications
const NOTIFICATION_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Check if vendor can send new collection notification (anti-spam)
 * Returns true if enough time has passed since last notification
 */
export async function canSendNewCollectionNotification(vendorId: string): Promise<boolean> {
  try {
    // Find the most recent NEW_COLLECTION notification from this vendor
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

    // If no previous notification, allow
    if (!lastNotification) {
      return true;
    }

    // Check if enough time has passed
    const timeSinceLastNotification = Date.now() - lastNotification.createdAt.getTime();
    return timeSinceLastNotification >= NOTIFICATION_DELAY_MS;
  } catch (error) {
    console.error("Error checking notification eligibility:", error);
    // On error, allow notification to avoid blocking vendors
    return true;
  }
}

/**
 * Send new collection notification to all vendor subscribers
 */
export async function sendNewCollectionNotification(
  vendorId: string,
  productId: string,
  productName: string,
  productImage: string | null,
  vendorName: string
): Promise<number> {
  try {
    // Check anti-spam delay
    const canSend = await canSendNewCollectionNotification(vendorId);

    if (!canSend) {
      console.log(`Skipping new collection notification for vendor ${vendorId} - anti-spam delay active`);
      return 0;
    }

    // Get all subscribers (users who favorited this store)
    const subscribers = await prisma.favoriteStore.findMany({
      where: { vendorId },
      select: { userId: true },
    });

    if (subscribers.length === 0) {
      return 0;
    }

    // Create notifications for all subscribers
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

/**
 * Send back-in-stock notification to all subscribed users
 */
export async function sendBackInStockNotifications(
  productId: string,
  productName: string,
  productImage: string | null,
  vendorId: string,
  vendorName: string
): Promise<number> {
  try {
    // Get all users subscribed to this product
    const subscriptions = await prisma.backInStockSubscription.findMany({
      where: { productId },
      select: { userId: true },
    });

    if (subscriptions.length === 0) {
      return 0;
    }

    // Create notifications for all subscribed users
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

    // Delete all subscriptions for this product
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
