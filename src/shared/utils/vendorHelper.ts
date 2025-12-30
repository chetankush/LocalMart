/**
 * Vendor Helper Utilities
 * Helper functions for vendor lookup and management
 */

import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { Prisma } from "@/src/generated/prisma";

interface User {
  id: string;
  email: string | null;
  role: string;
}

/**
 * Get vendor by user - tries userId first, then email
 * Also auto-links vendor to user if found by email
 */
export async function getVendorByUser<T extends Prisma.VendorInclude>(
  user: User,
  include?: T
) {
  console.log("=== getVendorByUser DEBUG ===");
  console.log("Looking up vendor for user:", { id: user.id, email: user.email, role: user.role });
  
  // Try to find by userId first
  console.log("Step 1: Searching by userId:", user.id);
  let vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    include: include as any,
  });
  console.log("Step 1 Result:", vendor ? { id: vendor.id, businessName: vendor.businessName } : "NOT FOUND");

  // If not found by userId, try to find by contact email
  if (!vendor && user.email) {
    console.log("Step 2: Searching by contactEmail:", user.email);
    vendor = await prisma.vendor.findFirst({
      where: { contactEmail: user.email },
      include: include as any,
    });
    console.log("Step 2 Result:", vendor ? { id: vendor.id, businessName: vendor.businessName } : "NOT FOUND");

    // If found by email, link vendor to this user and update user role
    if (vendor) {
      console.log("Step 3: Linking vendor to user...");
      await prisma.$transaction([
        prisma.vendor.update({
          where: { id: vendor.id },
          data: { userId: user.id },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { role: "VENDOR" },
        }),
      ]);
      console.log("Step 3: Vendor linked successfully");
    }
  }

  console.log("=== getVendorByUser RESULT ===", vendor ? "FOUND" : "NOT FOUND");
  return vendor;
}
