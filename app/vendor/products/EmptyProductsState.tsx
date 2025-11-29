"use client";

import Link from "next/link";

interface EmptyProductsStateProps {
  vendorId: string;
}

export default function EmptyProductsState({
  vendorId,
}: EmptyProductsStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <svg
        className="mx-auto h-16 w-16 text-gray-400 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No products yet
      </h3>
      <p className="text-gray-600 mb-6">
        Start adding products to your store to begin selling
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/vendor/products/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Add Product Manually
        </Link>
      </div>
    </div>
  );
}
