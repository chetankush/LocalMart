import type { Metadata } from "next";
import { jsonLd, siteUrl } from "@/lib/seo";
import { notFound } from "next/navigation";
import KiranaTheme from "./themes/KiranaTheme";
import GroceryTheme from "./themes/GroceryTheme";
import FashionTheme from "./themes/FashionTheme";
import ClothingTheme from "./themes/ClothingTheme";
import ShoesTheme from "./themes/ShoesTheme";
import SareeTheme from "./themes/SareeTheme";
import DefaultTheme from "./themes/DefaultTheme";
import PlaceholderTheme from "./themes/PlaceholderTheme";
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

const SCHEMA_TYPE: Record<string, string> = {
  FASHION: "ClothingStore",
  GROCERY: "GroceryStore",
  PHARMACY: "Pharmacy",
  ELECTRONICS: "ElectronicsStore",
  RESTAURANT: "Restaurant",
};
const KIND: Record<string, string> = {
  FASHION: "Saree & clothing shop",
  GROCERY: "Grocery store",
  PHARMACY: "Medical store",
  ELECTRONICS: "Electronics shop",
  RESTAURANT: "Restaurant",
};

type Addr = { street?: string; landmark?: string; zip?: string; coordinates?: { lat: number; lng: number } } | null;

function placeLine(v: { locality?: string | null; city?: string; businessAddress?: Addr }) {
  const parts: string[] = [];
  for (const p of [v.businessAddress?.street, v.locality, v.city]) {
    if (p && !parts.join(", ").toLowerCase().includes(p.toLowerCase())) parts.push(p);
  }
  return parts.join(", ");
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  const vendor = await getVendorDetails(id);
  if (!vendor) {
    return { title: "Shop not found | LocalMart" };
  }
  const kind = KIND[vendor.businessType] ?? "Shop";
  const where = [vendor.locality, vendor.city].filter(Boolean).join(", ");
  const title = `${vendor.businessName} – ${kind} in ${where || vendor.city} | Order online on LocalMart`;
  const place = placeLine(vendor);
  const description = (
    `${vendor.businessName}${place ? `, ${place}` : ""}. ` +
    (vendor.storeDescription ? `${vendor.storeDescription}. ` : "") +
    "Order online — home delivery by the shop, cash on delivery or UPI."
  ).slice(0, 300);
  const ogImage = vendor.storeLogo || vendor.storeImages?.[0];
  const canonical = siteUrl(`/stores/${vendor.id}`);
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      type: "website",
      url: canonical,
    },
  };
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
      case "FASHION":
        return <FashionTheme vendor={vendorData} products={products || []} />;
      case "CLOTHING":
        return <ClothingTheme vendor={vendorData} products={products || []} />;
      case "SHOES":
        return <ShoesTheme vendor={vendorData} products={products || []} />;
      case "SAREE":
        return <SareeTheme vendor={vendorData} products={products || []} />;
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
        return <PlaceholderTheme vendor={vendorData} products={products || []} />;
      case "DEFAULT":
      case "OTHER":
      default:
        return <DefaultTheme vendor={vendorData} products={products || []} />;
    }
  };

  // Google: the shop as a local business (name, landmark address, map pin, phone)
  const addr = vendorData.businessAddress as Addr;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[vendorData.businessType] ?? "Store",
    name: vendorData.businessName,
    description: vendorData.storeDescription || undefined,
    url: siteUrl(`/stores/${vendorData.id}`),
    image: vendorData.storeLogo || vendorData.storeImages?.[0] || undefined,
    telephone: vendorData.contactPhone || undefined,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: [addr?.street, addr?.landmark && `Near ${addr.landmark}`].filter(Boolean).join(", ") || vendorData.locality || undefined,
      addressLocality: vendorData.city,
      addressRegion: vendorData.state || undefined,
      postalCode: vendorData.pincode || addr?.zip || undefined,
      addressCountry: "IN",
    },
    ...(addr?.coordinates?.lat && addr?.coordinates?.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: addr.coordinates.lat, longitude: addr.coordinates.lng } }
      : {}),
    ...(Number(vendorData.reviewCount) > 0 && vendorData.averageRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(vendorData.averageRating).toFixed(1),
            reviewCount: vendorData.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(localBusiness)} />
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
