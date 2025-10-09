"use client";

import { useState } from "react";

export default function SeedCategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSeedCategories = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/seed-categories", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to seed categories",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Seed Default Categories
          </h1>

          <p className="text-gray-600 mb-8">
            This will add 20 default product categories to your database.
            Categories that already exist will be skipped.
          </p>

          <button
            onClick={handleSeedCategories}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Seeding Categories..." : "Seed Categories"}
          </button>

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
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

                  {result.data.created.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        New Categories:
                      </p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {result.data.created.map((cat: any) => (
                          <li key={cat.id}>{cat.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Default Categories to be Added:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div>• Fruits & Vegetables</div>
              <div>• Dairy & Eggs</div>
              <div>• Meat & Seafood</div>
              <div>• Bakery & Bread</div>
              <div>• Pantry Staples</div>
              <div>• Snacks & Confectionery</div>
              <div>• Beverages</div>
              <div>• Frozen Foods</div>
              <div>• Health & Beauty</div>
              <div>• Household & Cleaning</div>
              <div>• Baby & Kids</div>
              <div>• Pet Supplies</div>
              <div>• Electronics</div>
              <div>• Clothing & Fashion</div>
              <div>• Home & Garden</div>
              <div>• Sports & Outdoors</div>
              <div>• Books & Media</div>
              <div>• Automotive</div>
              <div>• Office Supplies</div>
              <div>• Jewelry & Accessories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
