import { requireRole } from "@/src/shared/utils/auth";
import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { redirect } from "next/navigation";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole(["VENDOR"]);

  // Get vendor profile
  const vendor = await prisma.vendor.findUnique({
    where: { userId: user.id },
  });

  if (!vendor) {
    redirect("/vendor/onboarding");
  }

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
    },
  });

  if (!product) {
    redirect("/vendor/products");
  }

  // Verify ownership
  if (product.vendorId !== vendor.id) {
    redirect("/vendor/products");
  }

  // Get all categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-600">Update product information</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <EditProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
