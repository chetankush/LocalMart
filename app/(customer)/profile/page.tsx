import { getCurrentUser } from "@/src/shared/utils/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch complete user data including additional contacts
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      additionalEmails: true,
      additionalPhones: true,
      priorityEmail: true,
      priorityPhone: true,
      createdAt: true,
    },
  });

  if (!userData) {
    redirect("/sign-in");
  }

  return <ProfileClient user={userData} />;
}
