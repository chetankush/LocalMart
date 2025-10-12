import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { redirect } from "next/navigation";
import VendorSettingsForm from "@/app/vendor/settings/VendorSettingsForm";

export default async function VendorSettingsPage() {
  const user = await requireRole(["VENDOR"]);

  // Get vendor profile
  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      storeDescription: true,
      storeLogo: true,
      storeImages: true,
      contactEmail: true,
      contactPhone: true,
      businessAddress: true,
      city: true,
      state: true,
      locality: true,
      pincode: true,
    },
  });

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your store information, images, and location
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <VendorSettingsForm vendor={vendor} />
      </div>
    </div>
  );
}
