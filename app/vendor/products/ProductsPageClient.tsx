"use client";

import Link from "next/link";

interface ProductsPageClientProps {
  vendorId: string;
}

export default function ProductsPageClient({
  vendorId,
}: ProductsPageClientProps) {
  return (
    <div className="flex gap-3">
      <Link
        href="/vendor/products/new"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        + Add Product
      </Link>
    </div>
  );
}
