import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { userId: null },
        { status: 200 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
      select: { id: true },
    });

    return NextResponse.json({
      userId: user?.id || null,
    });
  } catch (error) {
    console.error("Error fetching current user ID:", error);
    return NextResponse.json(
      { userId: null },
      { status: 500 }
    );
  }
}

