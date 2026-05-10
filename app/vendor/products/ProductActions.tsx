"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ProductActionsProps {
  productId: string;
  isActive: boolean;
}

export default function ProductActions({
  productId,
  isActive,
}: ProductActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleToggleStatus = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateVendorProduct(productId, { isActive: !isActive });

      if (data.success) {
        router.refresh();
        setShowMenu(false);
      } else {
        alert(data.error || "Failed to update product status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update product status");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.deleteVendorProduct(productId);

      if (data.success) {
        router.refresh();
        setShowMenu(false);
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product");
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="text-gray-600 hover:text-gray-900 cursor-pointer"
        disabled={loading}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <Link
                href={`/vendor/products/${productId}/edit`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Edit
              </Link>
              <button
                onClick={handleToggleStatus}
                disabled={loading}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
              >
                {isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
