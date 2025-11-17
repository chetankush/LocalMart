import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReviewForm from "./ReviewForm";

interface WriteReviewPageProps {
  params: {
    id: string;
  };
}

export default async function WriteReviewPage({
  params,
}: WriteReviewPageProps) {
  const user = await getCurrentUser();

  // Require authentication
  if (!user) {
    redirect(`/login?redirect=/stores/${params.id}/write-review`);
  }

  // Get vendor information
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      businessName: true,
      userId: true,
      storeLogo: true,
      storeImages: true,
    },
  });

  if (!vendor) {
    notFound();
  }

  // Check if user is trying to review their own store
  if (vendor.userId === user.id) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Cannot Review Your Own Store
            </h1>
            <p className="text-gray-600 mb-6">
              You cannot submit a review for your own store.
            </p>
            <Link
              href={`/stores/${params.id}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has already reviewed this store
  const existingReview = await prisma.storeReview.findUnique({
    where: {
      userId_vendorId: {
        userId: user.id,
        vendorId: params.id,
      },
    },
  });

  // Get store image for header
  const storeImages = Array.isArray(vendor.storeImages) ? vendor.storeImages : [];
  const storeImage = storeImages.length > 0 ? storeImages[0] : vendor.storeLogo;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h1>
        </div>

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Review Guidance */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                What makes a good review
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Have you used this product?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your review should be about your experience with the product.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Why review a product?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your valuable feedback will help fellow shoppers decide!
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    How to review a product?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your review should include facts. An honest opinion is always appreciated. If you have an issue with the product or service please contact us from the{" "}
                    <Link href="/help" className="text-blue-600 hover:underline">
                      help centre
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Review Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Store Header */}
              <div className="flex items-center justify-end mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 max-w-[200px] truncate">
                    {vendor.businessName}
                  </span>
                  {storeImage && (
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                      <Image
                        src={storeImage}
                        alt={vendor.businessName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <ReviewForm 
                vendorId={params.id} 
                vendorName={vendor.businessName}
                existingReview={existingReview}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
