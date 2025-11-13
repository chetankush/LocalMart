/**
 * Authentication Utilities
 * Helper functions for user authentication and role management
 */

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { redirect } from "next/navigation";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

/**
 * Get current authenticated user from database
 * Syncs with Supabase if user doesn't exist
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  // Check if user exists in our DB
  let user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          businessType: true,
          storeLogo: true,
          status: true,
          isActive: true,
        },
      },
    },
  });

  // If not, create from Supabase user
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: supabaseUser.email!,
        phone: supabaseUser.phone,
        fullName: supabaseUser.user_metadata?.full_name || "User",
        role: "CUSTOMER", // Default role
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            storeLogo: true,
            status: true,
            isActive: true,
          },
        },
      },
    });
  }

  return user;
}

/**
 * Require authentication - redirect if not logged in
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user;
}

/**
 * Require specific role - redirect if unauthorized
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Check if user is vendor
 */
export async function isVendor() {
  const user = await getCurrentUser();
  return user?.role === "VENDOR";
}

/**
 * Check if user is customer
 */
export async function isCustomer() {
  const user = await getCurrentUser();
  return user?.role === "CUSTOMER";
}

/**
 * Check if user has completed vendor onboarding
 */
export async function hasCompletedVendorOnboarding() {
  const user = await getCurrentUser();

  if (!user || user.role !== "VENDOR") {
    return false;
  }

  // Check if vendor profile exists
  return !!user.vendor;
}
