import { prisma } from "@/src/core/infrastructure/database/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductCardWithCart from "./ProductCardWithCart";

interface StorePageProps {
  params: {
    id: string;
  };
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
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      products: {
        where: { isActive: true },
        take: 12,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Store Image */}
            <div className="lg:w-1/3">
              <div className="h-48 lg:h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center relative overflow-hidden">
                {vendor.storeLogo ? (
                  <Image
                    src={vendor.storeLogo}
                    alt={vendor.businessName}
                    width={300}
                    height={300}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-6xl">🏪</div>
                )}
              </div>
            </div>

            {/* Store Info */}
            <div className="lg:w-2/3 ml-3 mt-3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {vendor.businessName}
                  </h1>
                  <p className="text-base text-gray-600 mb-2">
                    {vendor.businessType}
                  </p>
                </div>
                <div className="flex items-center text-yellow-500">
                  <span className="text-lg font-bold">4.8</span>
                  <svg
                    className="w-5 h-5 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>

              {vendor.storeDescription && (
                <p className="text-gray-700 mb-4 leading-relaxed text-sm">
                  {vendor.storeDescription}
                </p>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 flex items-center text-sm">
                    <svg
                      className="w-4 h-4 mr-2 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Store Address
                  </h3>
                  <div className="flex gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                      Open Now
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      <svg
                        className="w-3 h-3 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Local Delivery
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {vendor.businessAddress ? (
                    <div>
                      {typeof vendor.businessAddress === "string" ? (
                        <div className="space-y-2">
                          <p className="text-gray-600 leading-relaxed font-medium">
                            {vendor.businessAddress}
                          </p>
                          <div className="text-gray-500 text-sm">
                            {[
                              vendor.locality,
                              vendor.city,
                              vendor.state,
                              vendor.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(vendor.businessAddress as BusinessAddress)
                            .address && (
                            <p className="text-gray-600 leading-relaxed font-medium">
                              {
                                (vendor.businessAddress as BusinessAddress)
                                  .address
                              }
                            </p>
                          )}
                          {(vendor.businessAddress as BusinessAddress)
                            .street && (
                            <p className="text-gray-600 leading-relaxed">
                              {
                                (vendor.businessAddress as BusinessAddress)
                                  .street
                              }
                            </p>
                          )}
                          {(vendor.businessAddress as BusinessAddress)
                            .landmark && (
                            <p className="text-gray-500 text-sm">
                              Near{" "}
                              {
                                (vendor.businessAddress as BusinessAddress)
                                  .landmark
                              }
                            </p>
                          )}
                          <div className="text-gray-500 text-sm">
                            {[
                              vendor.locality,
                              vendor.city,
                              vendor.state,
                              vendor.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendor.locality && (
                        <p className="text-gray-600 leading-relaxed font-medium">
                          {vendor.locality}
                        </p>
                      )}
                      <div className="text-gray-500 text-sm">
                        {[vendor.city, vendor.state, vendor.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    </div>
                  )}

                  {/* Business Hours */}
                  {vendor.businessHours && (
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Business Hours
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {typeof vendor.businessHours === "string"
                          ? vendor.businessHours
                          : JSON.stringify(vendor.businessHours)}
                      </p>
                    </div>
                  )}

                  {/* Additional Contact Information */}
                  <div className="pt-2 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {vendor.contactPhone && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{vendor.contactPhone}</span>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center text-gray-600">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{vendor.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Products ({vendor.products.length})
          </h2>
        </div>

        {vendor.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendor.products.map((product) => (
              <ProductCardWithCart
                key={product.id}
                product={product}
                vendorName={vendor.businessName}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Products Yet
            </h3>
            <p className="text-gray-600">
              This store hasn't added any products yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
