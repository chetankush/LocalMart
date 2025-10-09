import { getVendorById } from "@/lib/actions/vendor.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface StorePageProps {
  params: Promise<{ id: string }>;
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const vendor = await getVendorById(id);

  if (!vendor) {
    notFound();
  }

  // Serialize products to convert Decimal to number for client components
  const serializedProducts = vendor.products.map(product => ({
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    cost: product.cost ? Number(product.cost) : null,
    weight: product.weight ? Number(product.weight) : null,
    images: Array.isArray(product.images) ? product.images : [],
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
    }
  }));

  // Group products by category
  const productsByCategory = serializedProducts.reduce((acc, product) => {
    const categoryName = product.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(product);
    return acc;
  }, {} as Record<string, typeof serializedProducts>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            {/* Store Logo */}
            <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              {vendor.storeLogo ? (
                <img
                  src={vendor.storeLogo}
                  alt={vendor.businessName}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-4xl">🏪</span>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {vendor.businessName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {vendor.businessType}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      {vendor.status}
                    </span>
                  </div>
                </div>
              </div>

              {vendor.storeDescription && (
                <p className="mt-4 text-gray-600 max-w-3xl">
                  {vendor.storeDescription}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
                {vendor.city && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📍 Location:</span>
                    <span className="font-semibold text-gray-900">
                      {vendor.locality ? `${vendor.locality}, ` : ""}{vendor.city}, {vendor.state}
                    </span>
                  </div>
                )}
                {vendor.minOrderAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Min Order:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{vendor.minOrderAmount.toString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-semibold text-gray-900">
                    {vendor.products.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {vendor.products.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(productsByCategory).map(([categoryName, products]) => (
              <div key={categoryName}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {categoryName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Available
            </h3>
            <p className="text-gray-600">
              This store hasn't added any products yet. Check back later!
            </p>
          </div>
        )}

        {/* Back to Stores */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>←</span>
            <span>Back to All Stores</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
