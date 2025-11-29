import { NextResponse } from "next/server";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params as required by Next.js 15
    const { id } = await params;

    // specific check for default templates which are not in DB
    if (id.startsWith("default-")) {
      return NextResponse.json({
        success: true,
        message: "Usage recorded for default template"
      });
    }

    await prisma.productTemplate.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Template usage recorded"
    });
  } catch (error) {
    console.error("Error recording template usage:", error);
    // Don't fail the request if usage tracking fails
    return NextResponse.json(
      { success: false, error: "Failed to record usage" },
      { status: 500 }
    );
  }
}
