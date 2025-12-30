import { NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { createClient } from "@/lib/supabase/server";

// GET - Check if current user is admin
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({
        isAdmin: false,
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (!user) {
      return NextResponse.json({
        isAdmin: false,
        message: "User not found",
      });
    }

    const isAdmin = user.role === "ADMIN";

    return NextResponse.json({
      isAdmin,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Admin check auth error:", error);
    return NextResponse.json({
      isAdmin: false,
      message: "Error checking authentication",
    });
  }
}
