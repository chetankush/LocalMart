/**
 * Authentication Utilities
 * Helper functions for user authentication and role management
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Get current authenticated user from API
 * The backend will sync with Supabase if user doesn't exist
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to get current user:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
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
