import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProductReviewForm from "./ProductReviewForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface WriteReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProductWriteReviewData(productId: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}/write-data`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching product write review data:", error);
    return null;
  }
}

export default async function WriteReviewPage({ params }: WriteReviewPageProps) {
  const { id } = await params;

  // Check authentication
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(`/signin?redirect=/products/${id}/write-review`);
  }

  // Get product and review data
  const data = await getProductWriteReviewData(id, session.access_token);

  if (!data) {
    notFound();
  }

  const { product, existingReview, isVerifiedPurchase, isOwnProduct } = data;

  // Redirect if user already reviewed this product
  if (existingReview) {
    redirect(`/products/${id}?alreadyReviewed=true`);
  }

  // Redirect if user is trying to review their own product
  if (isOwnProduct) {
    redirect(`/products/${id}?ownProduct=true`);
  }

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
              isVerifiedPurchase={isVerifiedPurchase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
