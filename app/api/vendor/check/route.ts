import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ isVendor: false, hasVendor: false });
    }

    // Check if user exists in our DB
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user) {
      return NextResponse.json({ isVendor: false, hasVendor: false });
    }

    // Check if user role is VENDOR
    if (user.role !== "VENDOR") {
      return NextResponse.json({ isVendor: false, hasVendor: false });
    }

    // Check if vendor profile exists and is active
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ isVendor: true, hasVendor: false });
    }

    // Only show dashboard for ACTIVE vendors
    const hasActiveVendor = vendor.status === "ACTIVE";

    return NextResponse.json({
      isVendor: true,
      hasVendor: hasActiveVendor,
    });
  } catch (error) {
    console.error("Error checking vendor status:", error);
    return NextResponse.json(
      { isVendor: false, hasVendor: false },
      { status: 500 }
    );
  }
}
