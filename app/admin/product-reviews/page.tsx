import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { getCurrentUser } from "@/src/shared/utils/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProductReviewsTable from "./ProductReviewsTable";
import {
  Package,
  Eye,
  EyeOff,
  Star,
  BadgeCheck,
  ArrowLeft,
} from "lucide-react";

export default async function AdminProductReviewsPage() {
  const user = await getCurrentUser();

  // Require admin authentication
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all product reviews with related data
  const reviews = await prisma.productReview.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          averageRating: true,
          reviewCount: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Format reviews for client component
  const formattedReviews = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    images: review.images,
    isApproved: review.isApproved,
    isHidden: review.isHidden,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    user: review.user,
    product: {
      ...review.product,
      averageRating: review.product.averageRating
        ? Number(review.product.averageRating)
        : null,
    },
    vendorResponse: review.vendorResponse,
    vendorRespondedAt: review.vendorRespondedAt?.toISOString() || null,
  }));

  // Calculate statistics
  const stats = {
    total: reviews.length,
    visible: reviews.filter((r) => !r.isHidden).length,
    hidden: reviews.filter((r) => r.isHidden).length,
    verified: reviews.filter((r) => r.isVerifiedPurchase).length,
    averageRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Product Reviews</h1>
                <p className="text-xs text-gray-500">Moderate customer reviews for products</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Visible</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.visible}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Hidden</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.hidden}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Verified</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.verified}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                <p className="text-3xl font-bold text-amber-500 mt-1">{stats.averageRating}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <ProductReviewsTable
            initialReviews={formattedReviews}
            initialTotal={stats.total}
          />
        </div>
      </div>
    </div>
  );
}
