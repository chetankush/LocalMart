import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, additionalEmails, additionalPhones, priorityEmail, priorityPhone } = body;

    // Validate full name
    if (typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 }
      );
    }

    if (fullName.trim().length > 100) {
      return NextResponse.json(
        { error: "Full name is too long" },
        { status: 400 }
      );
    }

    // Validate additional emails
    if (additionalEmails && !Array.isArray(additionalEmails)) {
      return NextResponse.json(
        { error: "Additional emails must be an array" },
        { status: 400 }
      );
    }

    // Validate additional phones
    if (additionalPhones && !Array.isArray(additionalPhones)) {
      return NextResponse.json(
        { error: "Additional phones must be an array" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (additionalEmails) {
      for (const email of additionalEmails) {
        if (!emailRegex.test(email)) {
          return NextResponse.json(
            { error: `Invalid email format: ${email}` },
            { status: 400 }
          );
        }
      }
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (additionalPhones) {
      for (const phone of additionalPhones) {
        if (!phoneRegex.test(phone)) {
          return NextResponse.json(
            { error: `Invalid phone format: ${phone}. Must be 10 digits.` },
            { status: 400 }
          );
        }
      }
    }

    // Validate priority email is in the list
    if (priorityEmail) {
      const allEmails = [user.email, ...(additionalEmails || [])].filter(Boolean);
      if (!allEmails.includes(priorityEmail)) {
        return NextResponse.json(
          { error: "Priority email must be one of your registered emails" },
          { status: 400 }
        );
      }
    }

    // Validate priority phone is in the list
    if (priorityPhone) {
      const allPhones = [user.phone, ...(additionalPhones || [])].filter(Boolean);
      if (!allPhones.includes(priorityPhone)) {
        return NextResponse.json(
          { error: "Priority phone must be one of your registered phones" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName.trim(),
        additionalEmails: additionalEmails || [],
        additionalPhones: additionalPhones || [],
        priorityEmail: priorityEmail || null,
        priorityPhone: priorityPhone || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        additionalEmails: true,
        additionalPhones: true,
        priorityEmail: true,
        priorityPhone: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
