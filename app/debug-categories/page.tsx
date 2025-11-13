"use client";

import { useState, useEffect } from "react";

export default function DebugCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const { data } = await apiClient.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    setSeeding(true);
    setResult(null);

    try {
      const response = await fetch("/api/seed-categories", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Refresh categories after seeding
        await fetchCategories();
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to seed categories",
      });
    }

    setSeeding(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Categories Debug
          </h1>

          {/* Current Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Current Categories ({categories.length})
            </h2>

            {loading ? (
              <p>Loading categories...</p>
            ) : categories.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>No categories found!</strong> You need to seed the
                  categories first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-gray-50 border rounded-lg p-3 text-sm"
                  >
                    <div className="font-medium">{category.name}</div>
                    <div className="text-gray-500 text-xs">{category.slug}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seed Button */}
          <div className="mb-8">
            <button
              onClick={handleSeedCategories}
              disabled={seeding}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {seeding ? "Seeding Categories..." : "Seed 20 Default Categories"}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <h3
                className={`font-semibold mb-2 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.success ? "✅ Success!" : "❌ Error"}
              </h3>
              <p
                className={`text-sm ${
                  result.success ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.message}
              </p>

              {result.data && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Created:</strong> {result.data.totalCreated}{" "}
                    categories
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Skipped:</strong> {result.data.totalSkipped}{" "}
                    categories
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-4">
            <button
              onClick={fetchCategories}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Refresh Categories
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
