"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface ProductsPageClientProps {
  vendorId: string;
}

export default function ProductsPageClient({
  vendorId,
}: ProductsPageClientProps) {
  return (
    <div className="flex gap-3">
      <Link
        href="/vendor/products/bulk-add"
        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-semibold flex items-center gap-2 shadow-md cursor-pointer"
      >
        <Zap className="w-4 h-4" />
        Bulk Add
      </Link>
      <Link
        href="/vendor/products/new"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold cursor-pointer"
      >
        + Add Product
      </Link>
    </div>
  );
}
