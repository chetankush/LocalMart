import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Increment usage count
    await prisma.productTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Template usage recorded",
    });
  } catch (error) {
    console.error("Error recording template usage:", error);
    return NextResponse.json(
      { error: "Failed to record template usage" },
      { status: 500 }
    );
  }
}
