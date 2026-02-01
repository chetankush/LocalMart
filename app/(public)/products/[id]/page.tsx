import { notFound } from "next/navigation";
import ImageGallery from "./ImageGallery";
import ProductInfo from "./ProductInfo";
import ProductReviews from "./ProductReviews";
import ProductPageClient from "./ProductPageClient";
import { TrackProductView } from "@/components/TrackView";

// ISR: Revalidate product pages every 3 minutes
export const revalidate = 180;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Generate static pages for popular products at build time
export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    const products = result.data || [];

    // Pre-generate top 100 products
    return products.slice(0, 100).map((product: any) => ({
      id: product.id,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProductDetails(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}/details`, {
      next: { revalidate: 180 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      console.error("Failed to fetch product details:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching product details:", error);
    return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await getProductDetails(id);

  if (!product) {
    notFound();
  }

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];

  return (
    <ProductPageClient vendor={{
      id: product.vendor.id,
      businessName: product.vendor.businessName,
      storeLogo: product.vendor.storeLogo,
    }}>
      <div className="min-h-screen bg-gray-50">
        {/* Track product view */}
        <TrackProductView
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            image: images[0] || "/placeholder-product.png",
          }}
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:px-6 xl:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6 text-xs sm:text-sm overflow-x-auto">
            <ol className="flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap">
              <li>
                <a href="/" className="text-blue-600 hover:text-blue-700">
                  Home
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a href="/stores" className="text-blue-600 hover:text-blue-700">
                  Stores
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a
                  href={`/stores/${product.vendor.id}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {product.vendor.businessName}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium truncate max-w-[100px] sm:max-w-xs">
                {product.name}
              </li>
            </ol>
          </nav>

          {/* Main Product Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
              {/* Image Gallery */}
              <ImageGallery images={images} productName={product.name} />

              {/* Product Info */}
              <ProductInfo
                product={product}
                vendor={product.vendor}
              />
            </div>
          </div>

          {/* Product Description */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Product Description
            </h2>
            <div className="prose max-w-none">
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Additional Details */}
            {(product.weight || product.dimensions || product.sku) && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                  Product Details
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {product.sku && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">SKU</dt>
                      <dd className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-900">{product.sku}</dd>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Weight</dt>
                      <dd className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-900">
                        {product.weight.toFixed(2)} kg
                      </dd>
                    </div>
                  )}
                  {product.dimensions && typeof product.dimensions === 'object' && (
                    <div>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">
                        Dimensions
                      </dt>
                      <dd className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-900">
                        {JSON.stringify(product.dimensions)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <ProductReviews
            productId={product.id}
            productName={product.name}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
            reviews={product.reviews || []}
            ratingDistribution={product.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
          />
        </div>
      </div>
    </ProductPageClient>
  );
}
