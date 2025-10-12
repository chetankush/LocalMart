import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/stores/${params.id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Store
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {existingReview ? "Update Your Review" : "Write a Review"}
          </h1>
          <p className="text-gray-600">
            Share your experience with{" "}
            <span className="font-semibold">{vendor.businessName}</span>
          </p>
          {existingReview && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              You've already reviewed this store. Submitting this form will
              update your existing review.
            </div>
          )}
        </div>

        {/* Review Form */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <ReviewForm vendorId={params.id} vendorName={vendor.businessName} />
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Review Guidelines
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Be honest and share your genuine experience
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Focus on the store, products, and service quality
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Be respectful and avoid offensive language
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 mr-2 text-gray-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Adding photos helps other customers make informed decisions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
