import { getCurrentUser } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import ReviewForm from "./ReviewForm";
import { signInHref } from "@/lib/auth/returnTo";
import { Button, LargeTitle, Page } from "@/components/app/ui";

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
    redirect(signInHref(`/stores/${id}/write-review`));
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect(signInHref(`/stores/${id}/write-review`));
  }

  // Get vendor and review data
  const data = await getVendorWriteReviewData(id, session.access_token);

  if (!data) {
    notFound();
  }

  const { vendor, existingReview, isOwnStore } = data;

  const storeImages = Array.isArray(vendor.storeImages) ? vendor.storeImages : [];
  const storeImage = storeImages[0] || vendor.storeLogo;

  // Shop owners can't rate their own shop
  if (isOwnStore) {
    return (
      <Page>
        <LargeTitle title="This is your shop" back={{ href: `/stores/${id}`, label: "Shop" }} />
        <div className="rounded-2xl bg-card p-6 text-center">
          <p className="text-[16px] text-label-2">
            Ratings come from your customers. Share your shop link with them after a delivery to get more reviews.
          </p>
          <Button href={`/stores/${id}`} className="mt-5" full>
            Back to my shop
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <LargeTitle
        title={existingReview ? "Update your review" : "Rate this shop"}
        subtitle="Your rating helps other shoppers nearby."
        back={{ href: `/stores/${id}`, label: "Shop" }}
      />

      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-card p-4">
        {storeImage ? (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-fill">
            <Image src={storeImage} alt="" fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tint-soft text-[18px] font-bold text-tint">
            {vendor.businessName?.[0] ?? "S"}
          </div>
        )}
        <p className="min-w-0 text-[16px] font-semibold leading-snug text-label">{vendor.businessName}</p>
      </div>

      <ReviewForm vendorId={id} vendorName={vendor.businessName} existingReview={existingReview} />
    </Page>
  );
}
