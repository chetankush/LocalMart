import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { redirect } from "next/navigation";
import AddProductForm from "@/app/vendor/products/new/AddProductForm";

export default async function AddProductPage() {
  const user = await requireRole(["VENDOR"]);

  // Get vendor profile - try by userId first, then by email
  let vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
  });

  // If not found by userId, try to find by contact email
  if (!vendor && user.email) {
    vendor = await prisma.vendor.findFirst({
      where: { contactEmail: user.email },
    });

    // If found by email, link vendor to this user and update user role
    if (vendor) {
      await prisma.$transaction([
        prisma.vendor.update({
          where: { id: vendor.id },
          data: { userId: user.id },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { role: "VENDOR" },
        }),
      ]);
    }
  }

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  // Get all active categories (not filtered by theme to show all options)
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // Debug: Log categories to console
  console.log("Categories fetched:", categories.length);
  console.log(
    "Categories:",
    categories.map((c) => c.name)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-600">
            Fill in the details to add a new product to your store
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <AddProductForm vendorId={vendor.id} categories={categories} />
      </div>
    </div>
  );
}
