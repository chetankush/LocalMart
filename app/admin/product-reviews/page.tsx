import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPage } from "@/components/app/admin";
import { StatGrid, StatTile } from "@/components/app/seller";
import ProductReviewsTable from "./ProductReviewsTable";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getProductReviews(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/product-reviews?limit=100`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch product reviews:", response.status);
      return { reviews: [], total: 0 };
    }

    const result = await response.json();
    return result.data || { reviews: [], total: 0 };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return { reviews: [], total: 0 };
  }
}

export default async function AdminProductReviewsPage() {
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

  const data = await getProductReviews(session.access_token);
  const reviews = data.reviews || [];

  // Format reviews for client component
  const formattedReviews = reviews.map((review: any) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    images: review.images,
    isApproved: review.isApproved,
    isHidden: review.isHidden,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user,
    product: {
      ...review.product,
      averageRating: review.product?.averageRating
        ? Number(review.product.averageRating)
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
    verified: formattedReviews.filter((r: any) => r.isVerifiedPurchase).length,
    averageRating:
      formattedReviews.length > 0
        ? (formattedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / formattedReviews.length).toFixed(1)
        : "0.0",
  };

  return (
    <AdminPage title="Product reviews" subtitle="What customers say about products. Hide or remove reviews that break the rules.">
      <div className="mb-6">
        <StatGrid>
          <StatTile label="Reviews" value={stats.total} hint={`${stats.visible} visible`} />
          <StatTile label="Hidden" value={stats.hidden} hint="Customers can't see these" />
          <StatTile label="Verified buyers" value={stats.verified} hint="Bought before reviewing" />
          <StatTile label="Average rating" value={stats.total > 0 ? stats.averageRating : "—"} hint="Out of 5 stars" />
        </StatGrid>
      </div>

      <ProductReviewsTable initialReviews={formattedReviews} initialTotal={stats.total} />
    </AdminPage>
  );
}
