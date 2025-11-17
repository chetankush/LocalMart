import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import AllReviewsList from "./AllReviewsList";

interface ProductReviewsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductReviewsPage({ params }: ProductReviewsPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      images: true,
      price: true,
      averageRating: true,
      reviewCount: true,
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

  // Get all reviews
  const reviews = await prisma.productReview.findMany({
    where: {
      productId: id,
      isApproved: true,
      isHidden: false,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [
      { isVerifiedPurchase: "desc" },
      { createdAt: "desc" },
    ],
  });

  // Calculate rating distribution
  const ratingDistribution = await prisma.productReview.groupBy({
    by: ["rating"],
    where: {
      productId: id,
      isApproved: true,
      isHidden: false,
    },
    _count: {
      rating: true,
    },
  });

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach((item) => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating;
  });

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/stores" className="text-blue-600 hover:text-blue-700">
                Stores
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/stores/${product.vendor.id}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {product.vendor.businessName}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link
                href={`/products/${product.id}`}
                className="text-blue-600 hover:text-blue-700 truncate max-w-xs"
              >
                {product.name}
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Reviews</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Customer Reviews
              </h1>
              <Link
                href={`/products/${product.id}`}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Product
              </Link>
            </div>
            <Link
              href={`/products/${product.id}/write-review`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </Link>
          </div>

          {/* Product Info */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-2xl">📦</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {product.name}
                </h2>
                <p className="text-gray-600 text-sm mb-2">
                  Sold by {product.vendor.businessName}
                </p>
                {product.averageRating && product.reviewCount > 0 && (
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(Number(product.averageRating))
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 font-semibold text-gray-900">
                        {Number(product.averageRating).toFixed(1)}
                      </span>
                    </div>
                    <span className="ml-2 text-gray-600 text-sm">
                      ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <AllReviewsList
          reviews={reviews}
          ratingDistribution={distribution}
          totalReviews={product.reviewCount}
          averageRating={product.averageRating}
        />
      </div>
    </div>
  );
}
