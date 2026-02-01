import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReviewForm from "./ReviewForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface WriteReviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getVendorWriteReviewData(vendorId: string, authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/store/${vendorId}/write-data`, {
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
    console.error("Error fetching vendor write review data:", error);
    return null;
  }
}

export default async function WriteReviewPage({
  params,
}: WriteReviewPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Require authentication
  if (!user) {
    redirect(`/login?redirect=/stores/${id}/write-review`);
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(`/login?redirect=/stores/${id}/write-review`);
  }

  // Get vendor and review data
  const data = await getVendorWriteReviewData(id, session.access_token);

  if (!data) {
    notFound();
  }

  const { vendor, existingReview, isOwnStore } = data;

  // Check if user is trying to review their own store
  if (isOwnStore) {
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
              href={`/stores/${id}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                    Have you visited this store?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your review should be about your shopping experience with this store.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Why review a store?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your valuable feedback will help fellow shoppers discover great local stores!
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    How to review a store?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Share your experience about the store's service, product quality, and overall shopping experience. An honest opinion is always appreciated. If you have an issue, please contact us from the{" "}
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
                vendorId={id}
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
