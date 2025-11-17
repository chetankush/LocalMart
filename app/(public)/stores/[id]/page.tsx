import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductCardWithCart from "./ProductCardWithCart";
import KiranaTheme from "./themes/KiranaTheme";
import GroceryTheme from "./themes/GroceryTheme";
import FashionTheme from "./themes/FashionTheme";
import DefaultTheme from "./themes/DefaultTheme";
import StoreReviewsSection from "./StoreReviewsSection";
import { serializeVendor, serializeProducts } from "@/lib/utils/serialize";

// ⚡ ISR: Revalidate store pages every 2 minutes
export const revalidate = 120;

// 🚀 Generate static pages for popular stores at build time
export async function generateStaticParams() {
  const stores = await prisma.vendor.findMany({
    where: {
      status: "ACTIVE",
      isActive: true
    },
    select: { id: true },
    take: 50, // Pre-generate top 50 stores
    orderBy: { favoriteCount: 'desc' }
  });

  return stores.map((store) => ({
    id: store.id,
  }));
}

interface StorePageProps {
  params: Promise<{
    id: string;
  }>;
}

interface BusinessAddress {
  address?: string;
  street?: string;
  landmark?: string;
  city?: string;
  state?: string;
  zip?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      storeDescription: true,
      storeLogo: true,
      storeImages: true,
      contactEmail: true,
      contactPhone: true,
      businessAddress: true,
      city: true,
      state: true,
      locality: true,
      pincode: true,
      businessHours: true,
      averageRating: true,
      reviewCount: true,
      whatsappNumber: true,
      telegramLink: true,
      instagramHandle: true,
      facebookPage: true,
      websiteUrl: true,
      storeTheme: true,
      products: {
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          images: true,
          stockQuantity: true,
          vendorId: true,
          averageRating: true,
          reviewCount: true,
          createdAt: true,
        },
      },
      storeReviews: {
        where: {
          isApproved: true,
          isHidden: false,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          images: true,
          createdAt: true,
          user: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  // Convert Decimal types to numbers for client components using serializers
  // Important: Remove products from vendor object before serializing to avoid passing Decimals
  const { products, storeReviews, ...vendorWithoutProducts } = vendor;
  const vendorData = serializeVendor(vendorWithoutProducts);
  const productsData = serializeProducts(products);

  // Calculate rating distribution
  const ratingDistribution: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  storeReviews.forEach((review) => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  // Serialize reviews
  const reviewsData = storeReviews.map((review) => ({
    ...review,
    images: review.images && Array.isArray(review.images) ? review.images : null,
    createdAt: review.createdAt,
  }));

  // Render theme-specific layout based on vendor's storeTheme
  const renderTheme = () => {
    switch (vendorData.storeTheme) {
      case "KIRANA":
        return <KiranaTheme vendor={vendorData} products={productsData} />;
      case "GROCERY":
        return <GroceryTheme vendor={vendorData} products={productsData} />;
      case "CLOTHING":
      case "SHOES":
        return <FashionTheme vendor={vendorData} products={productsData} />;
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
        return <DefaultTheme vendor={vendorData} products={productsData} />;
    }
  };

  return (
    <>
      {renderTheme()}

      {/* Reviews Section - Shared across all themes */}
      <StoreReviewsSection
        vendorId={vendorData.id}
        averageRating={vendorData.averageRating ? Number(vendorData.averageRating) : null}
        reviewCount={vendorData.reviewCount}
        reviews={reviewsData.slice(0, 10)}
        ratingDistribution={ratingDistribution}
        theme={vendorData.storeTheme || "DEFAULT"}
      />
    </>
  );
}
