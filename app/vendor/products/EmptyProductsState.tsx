"use client";

import Link from "next/link";
import { Zap, Plus, Package } from "lucide-react";

interface EmptyProductsStateProps {
  vendorId: string;
}

export default function EmptyProductsState({
  vendorId,
}: EmptyProductsStateProps) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="w-10 h-10 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">
        No products yet
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Start adding products to your store to begin selling. Use bulk add to quickly set up your store!
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {/* Primary CTA - Bulk Add */}
        <Link
          href="/vendor/products/bulk-add"
          className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Zap className="w-5 h-5" />
          <span>
            <span className="block text-lg">Bulk Add Products</span>
            <span className="block text-xs font-normal opacity-90">Add 20+ products in 1 click</span>
          </span>
        </Link>

        {/* Secondary CTA - Manual Add */}
        <Link
          href="/vendor/products/new"
          className="px-6 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Manually
        </Link>
      </div>

      {/* Tips */}
      <div className="mt-10 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl max-w-lg mx-auto">
        <p className="text-sm text-green-800">
          <strong>Tip:</strong> Use Bulk Add to quickly populate your store with common products.
          You can adjust prices and stock quantities before adding them.
        </p>
      </div>
    </div>
  );
}
