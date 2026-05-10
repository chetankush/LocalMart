import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReviewsTable from "./ReviewsTable";
import {
  MessageSquare,
  Eye,
  EyeOff,
  Star,
  ArrowLeft,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getStoreReviews(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reviews?limit=100`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch store reviews:", response.status);
      return { reviews: [], total: 0 };
    }

    const result = await response.json();
    return result.data || { reviews: [], total: 0 };
  } catch (error) {
    console.error("Error fetching store reviews:", error);
    return { reviews: [], total: 0 };
  }
}

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();

  // Require admin authentication
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const data = await getStoreReviews(session.access_token);
  const reviews = data.reviews || [];

  // Format reviews for client component
  const formattedReviews = reviews.map((review: any) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    images: review.images,
    isApproved: review.isApproved,
    isHidden: review.isHidden,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    vendor: {
      ...review.vendor,
      averageRating: review.vendor?.averageRating
        ? Number(review.vendor.averageRating)
        : null,
    },
    vendorResponse: review.vendorResponse,
    vendorRespondedAt: review.vendorRespondedAt || null,
  }));

  // Calculate statistics
  const stats = {
    total: formattedReviews.length,
    visible: formattedReviews.filter((r: any) => !r.isHidden).length,
    hidden: formattedReviews.filter((r: any) => r.isHidden).length,
    averageRating:
      formattedReviews.length > 0
        ? (formattedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / formattedReviews.length).toFixed(1)
        : "0.0",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review Management</h1>
                <p className="text-xs text-gray-500">Monitor and moderate customer reviews</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Visible Reviews</p>
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
                <p className="text-sm font-medium text-gray-500">Hidden Reviews</p>
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
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
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
          <ReviewsTable
            initialReviews={formattedReviews}
            initialTotal={stats.total}
          />
        </div>
      </div>
    </div>
  );
}
