import { notFound } from "next/navigation";
import KiranaTheme from "./themes/KiranaTheme";
import GroceryTheme from "./themes/GroceryTheme";
import FashionTheme from "./themes/FashionTheme";
import ClothingTheme from "./themes/ClothingTheme";
import ShoesTheme from "./themes/ShoesTheme";
import DefaultTheme from "./themes/DefaultTheme";
import StoreReviewsSection from "./StoreReviewsSection";
import { TrackStoreView } from "@/components/TrackView";

// ISR: Revalidate store pages every 2 minutes
export const revalidate = 120;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Generate static pages for popular stores at build time
export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors?status=ACTIVE`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const stores = result.data || [];

    // Pre-generate top 50 stores
    return stores.slice(0, 50).map((store: any) => ({
      id: store.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface StorePageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getVendorDetails(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors/${id}/details`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error("Failed to fetch vendor details:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    return null;
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;

  const vendor = await getVendorDetails(id);

  if (!vendor) {
    notFound();
  }

  // Extract data
  const { products, storeReviews, ratingDistribution, ...vendorData } = vendor;

  // Serialize reviews
  const reviewsData = storeReviews?.map((review: any) => ({
    ...review,
    images: review.images && Array.isArray(review.images) ? review.images : null,
  })) || [];

  // Render theme-specific layout based on vendor's storeTheme
  const renderTheme = () => {
    switch (vendorData.storeTheme) {
      case "KIRANA":
        return <KiranaTheme vendor={vendorData} products={products || []} />;
      case "GROCERY":
        return <GroceryTheme vendor={vendorData} products={products || []} />;
      case "CLOTHING":
        return <ClothingTheme vendor={vendorData} products={products || []} />;
      case "SHOES":
        return <ShoesTheme vendor={vendorData} products={products || []} />;
      case "DAIRY":
      case "ELECTRONICS":
      case "MOBILES":
      case "BRAND_SPEC":
      case "WHOLESALE":
      case "COSMETICS":
      case "BEAUTY_PARLOUR":
      case "AUTOMOTIVE":
      case "BICYCLE":
      case "MEDICINE":
      case "DEFAULT":
      case "OTHER":
      default:
        return <DefaultTheme vendor={vendorData} products={products || []} />;
    }
  };

  return (
    <>
      {/* Track store view */}
      <TrackStoreView
        store={{
          id: vendorData.id,
          businessName: vendorData.businessName,
          storeLogo: vendorData.storeLogo,
        }}
      />
      {renderTheme()}

      {/* Reviews Section - Shared across all themes */}
      <StoreReviewsSection
        vendorId={vendorData.id}
        averageRating={vendorData.averageRating}
        reviewCount={vendorData.reviewCount}
        reviews={reviewsData.slice(0, 10)}
        ratingDistribution={ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
        theme={vendorData.storeTheme || "DEFAULT"}
      />
    </>
  );
}
