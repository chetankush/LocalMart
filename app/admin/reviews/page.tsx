import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPage } from "@/components/app/admin";
import { StatGrid, StatTile } from "@/components/app/seller";
import ReviewsTable from "./ReviewsTable";

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
    <AdminPage title="Shop reviews" subtitle="What customers say about shops. Hide or remove reviews that break the rules.">
      <div className="mb-6">
        <StatGrid>
          <StatTile label="Reviews" value={stats.total} hint={stats.total >= 100 ? "Newest 100" : "All time"} />
          <StatTile label="Visible" value={stats.visible} hint="Customers can see these" />
          <StatTile label="Hidden" value={stats.hidden} hint="Customers can't see these" />
          <StatTile label="Average rating" value={stats.total > 0 ? stats.averageRating : "—"} hint="Out of 5 stars" />
        </StatGrid>
      </div>

      <ReviewsTable initialReviews={formattedReviews} initialTotal={stats.total} />
    </AdminPage>
  );
}
