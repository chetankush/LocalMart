import type { Metadata } from "next";
import { jsonLd, siteUrl } from "@/lib/seo";
import { nearLandmark } from "@/lib/landmark";
import { shopPath } from "@/lib/shopHandle";
import { notFound } from "next/navigation";
import FashionTheme from "./themes/FashionTheme";
import ClothingTheme from "./themes/ClothingTheme";
import ShoesTheme from "./themes/ShoesTheme";
import SareeTheme from "./themes/SareeTheme";
import ConstructionTheme from "./themes/ConstructionTheme";
import DefaultTheme from "./themes/DefaultTheme";
import ShopBusyBanner from "@/components/store/ShopBusyBanner";
import StoreReviewsSection from "./StoreReviewsSection";
import BookVisitCta from "@/components/visits/BookVisitCta";
import ShopContactCard from "@/components/contact/ShopContactCard";
import { TrackStoreView } from "@/components/TrackView";
import ShopSourceNote from "@/components/store/ShopSourceNote";

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
    // (the address segment is the shop's link name; a shop without one by its id)
    return stores.slice(0, 50).map((store: any) => ({
      id: store.handle || store.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface StorePageProps {
  params: Promise<{
    /** The shop's link name (localmart.in/<name>, served here by the middleware) or, for a shop without one, its id */
    id: string;
  }>;
}

async function getVendorDetails(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors/${encodeURIComponent(id)}/details`, {
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
  const canonical = siteUrl(shopPath(vendor));
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
      case "FASHION":
        return <FashionTheme vendor={vendorData} products={products || []} />;
      case "CLOTHING":
        return <ClothingTheme vendor={vendorData} products={products || []} />;
      case "SHOES":
        return <ShoesTheme vendor={vendorData} products={products || []} />;
      case "SAREE":
        return <SareeTheme vendor={vendorData} products={products || []} />;
      case "CONSTRUCTION":
        return <ConstructionTheme vendor={vendorData} products={products || []} />;
      // Everything without its own special design gets the e-commerce page
      // (it shows only what the shop itself has: no made-up ratings or times)
      case "KIRANA":
      case "GROCERY":
      case "DEFAULT":
      case "OTHER":
      default:
        return <DefaultTheme vendor={vendorData} products={products || []} />;
    }
  };

  // These designs have no contact buttons of their own: add "Message the shop" under them
  const needsContactCard = ["FASHION", "CLOTHING", "SHOES"].includes(vendorData.storeTheme);

  // Google: the shop as a local business (name, landmark address, map pin)
  const addr = vendorData.businessAddress as Addr;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[vendorData.businessType] ?? "Store",
    name: vendorData.businessName,
    description: vendorData.storeDescription || undefined,
    url: siteUrl(shopPath(vendorData)),
    image: vendorData.storeLogo || vendorData.storeImages?.[0] || undefined,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: [addr?.street, addr?.landmark && nearLandmark(addr.landmark)].filter(Boolean).join(", ") || vendorData.locality || undefined,
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
      <ShopSourceNote shopId={vendorData.id} handle={vendorData.handle} />
      {/* Track store view */}
      <TrackStoreView
        store={{
          id: vendorData.id,
          handle: vendorData.handle,
          businessName: vendorData.businessName,
          storeLogo: vendorData.storeLogo,
        }}
      />
      {/* "Busy right now" — checked live */}
      <ShopBusyBanner storeId={vendorData.id} />
      {renderTheme()}
      {needsContactCard && (
        <ShopContactCard vendor={{ id: vendorData.id, businessName: vendorData.businessName, whatsappNumber: vendorData.whatsappNumber }} />
      )}

      {/* "Book a visit" — only shows for shops that take visits */}
      <BookVisitCta shopId={vendorData.id} shopName={vendorData.businessName} shopHandle={vendorData.handle} />

      {/* Reviews Section - Shared across all themes */}
      <div id="reviews">
      <StoreReviewsSection
        vendorId={vendorData.id}
        vendorHandle={vendorData.handle}
        averageRating={vendorData.averageRating}
        reviewCount={vendorData.reviewCount}
        reviews={reviewsData.slice(0, 10)}
        ratingDistribution={ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
        theme={vendorData.storeTheme || "DEFAULT"}
      />
      </div>
    </>
  );
}
