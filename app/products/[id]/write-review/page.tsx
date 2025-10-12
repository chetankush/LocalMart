import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProductReviewForm from "./ProductReviewForm";

interface WriteReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WriteReviewPage({ params }: WriteReviewPageProps) {
  const { id } = await params;

  // Check authentication
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    redirect(`/signin?redirect=/products/${id}/write-review`);
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
  });

  if (!user) {
    redirect(`/signin?redirect=/products/${id}/write-review`);
  }

  // Get product
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      images: true,
      price: true,
      vendor: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Check if user already reviewed this product
  const existingReview = await prisma.productReview.findUnique({
    where: {
      userId_productId: {
        userId: user.id,
        productId: id,
      },
    },
  });

  if (existingReview) {
    redirect(`/products/${id}?alreadyReviewed=true`);
  }

  // Check if user has purchased this product
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId: id,
      order: {
        customerId: user.id,
        status: "DELIVERED",
      },
    },
  });

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Write a Product Review</h1>
            <p className="text-blue-100">
              Share your experience with this product
            </p>
          </div>

          {/* Product Info */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-3xl">📦</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {product.name}
                </h2>
                <p className="text-gray-600 mb-2">
                  Sold by {product.vendor.businessName}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{Number(product.price).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            <ProductReviewForm
              productId={product.id}
              productName={product.name}
              isVerifiedPurchase={!!hasPurchased}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
