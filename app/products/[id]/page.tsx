import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";
import ImageGallery from "./ImageGallery";
import ProductInfo from "./ProductInfo";
import ProductReviews from "./ProductReviews";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      compareAtPrice: true,
      images: true,
      stockQuantity: true,
      sku: true,
      weight: true,
      dimensions: true,
      averageRating: true,
      reviewCount: true,
      isActive: true,
      createdAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          storeLogo: true,
          city: true,
          state: true,
          averageRating: true,
          reviewCount: true,
        },
      },
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  // Get reviews with rating distribution
  const reviews = await prisma.productReview.findMany({
    where: {
      productId: id,
      isApproved: true,
      isHidden: false,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: [
      { isVerifiedPurchase: "desc" },
      { createdAt: "desc" },
    ],
    take: 10,
  });

  // Calculate rating distribution
  const ratingDistribution = await prisma.productReview.groupBy({
    by: ["rating"],
    where: {
      productId: id,
      isApproved: true,
      isHidden: false,
    },
    _count: {
      rating: true,
    },
  });

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach((item) => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating;
  });

  const images = Array.isArray(product.images) ? (product.images as string[]) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
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
            <li className="text-gray-900 font-medium truncate max-w-xs">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery */}
            <ImageGallery images={images} productName={product.name} />

            {/* Product Info */}
            <ProductInfo
              product={{
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stockQuantity: product.stockQuantity,
                sku: product.sku,
                weight: product.weight,
                dimensions: product.dimensions,
                averageRating: product.averageRating,
                reviewCount: product.reviewCount,
                category: product.category,
                images: images,
              }}
              vendor={{
                id: product.vendor.id,
                businessName: product.vendor.businessName,
                storeLogo: product.vendor.storeLogo,
                city: product.vendor.city,
                state: product.vendor.state,
                averageRating: product.vendor.averageRating,
                reviewCount: product.vendor.reviewCount,
              }}
            />
          </div>
        </div>

        {/* Product Description */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Product Description
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Additional Details */}
          {(product.weight || product.dimensions || product.sku) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Product Details
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.sku && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.sku}</dd>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Weight</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {Number(product.weight).toFixed(2)} kg
                    </dd>
                  </div>
                )}
                {product.dimensions && typeof product.dimensions === 'object' && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Dimensions
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
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
          reviews={reviews}
          ratingDistribution={distribution}
        />
      </div>
    </div>
  );
}
