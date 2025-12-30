import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { createClient } from "@/lib/supabase/server";

// Helper to check admin auth
async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email! },
  });

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

// GET - List all vendors (admin only)
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Admin vendors fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
