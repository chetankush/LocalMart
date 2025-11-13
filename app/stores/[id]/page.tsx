import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductCardWithCart from "./ProductCardWithCart";
import KiranaTheme from "./themes/KiranaTheme";
import GroceryTheme from "./themes/GroceryTheme";
import DefaultTheme from "./themes/DefaultTheme";
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
        take: 5,
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  // Convert Decimal types to numbers for client components using serializers
  // Important: Remove products from vendor object before serializing to avoid passing Decimals
  const { products, ...vendorWithoutProducts } = vendor;
  const vendorData = serializeVendor(vendorWithoutProducts);
  const productsData = serializeProducts(products);

  // Render theme-specific layout based on vendor's storeTheme
  const renderTheme = () => {
    switch (vendorData.storeTheme) {
      case "KIRANA":
        return <KiranaTheme vendor={vendorData} products={productsData} />;
      case "GROCERY":
        return <GroceryTheme vendor={vendorData} products={productsData} />;
      case "CLOTHING":
      case "SHOES":
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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Customer Reviews ({vendorData.reviewCount})
            </h2>
            <Link
              href={`/stores/${vendorData.id}/write-review`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </Link>
          </div>

          {vendorData.storeReviews && vendorData.storeReviews.length > 0 ? (
            <div className="space-y-4">
              {vendorData.storeReviews.map((review: any) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-4 last:border-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.user.fullName}
                      </p>
                      <div className="flex items-center mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  {review.images && Array.isArray(review.images) && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {(review.images as string[]).map((img, idx) => (
                        <Image
                          key={idx}
                          src={img}
                          alt={`Review image ${idx + 1}`}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {vendorData.reviewCount > 5 && (
                <Link
                  href={`/stores/${vendorData.id}/reviews`}
                  className="block text-center py-3 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Reviews ({vendorData.reviewCount})
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to review this store!
              </p>
              <Link
                href={`/stores/${vendorData.id}/write-review`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Write First Review
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
