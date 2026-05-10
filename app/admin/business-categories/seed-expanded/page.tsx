"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Expanded categories based on the old landing page categories
const EXPANDED_CATEGORIES = [
  {
    name: "Grocery & Daily Needs",
    value: "GROCERY",
    description: "Kirana, supermarket, daily essentials",
    icon: "🛒",
    gradient: "from-green-500 to-emerald-500",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
    sortOrder: 1,
  },
  {
    name: "Restaurant & Food",
    value: "RESTAURANT",
    description: "Restaurant, cafe, food delivery",
    icon: "🍽️",
    gradient: "from-orange-500 to-red-500",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
    sortOrder: 2,
  },
  {
    name: "Pharmacy & Medical",
    value: "PHARMACY",
    description: "Medicine, healthcare products",
    icon: "💊",
    gradient: "from-blue-500 to-cyan-500",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop",
    sortOrder: 3,
  },
  {
    name: "Electronics",
    value: "ELECTRONICS",
    description: "Mobile, computer, gadgets, appliances",
    icon: "📱",
    gradient: "from-purple-500 to-indigo-500",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    sortOrder: 4,
  },
  {
    name: "Fashion & Clothing",
    value: "FASHION",
    description: "Clothes, shoes, accessories",
    icon: "👕",
    gradient: "from-pink-500 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
    sortOrder: 5,
  },
  {
    name: "Home & Kitchen",
    value: "HOME_SERVICES",
    description: "Furniture, appliances, decor",
    icon: "🏠",
    gradient: "from-amber-500 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop",
    sortOrder: 6,
  },
  {
    name: "Cosmetics & Beauty",
    value: "COSMETICS",
    description: "Makeup, skincare, personal care",
    icon: "💄",
    gradient: "from-pink-400 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
    sortOrder: 7,
  },
  {
    name: "Milk & Dairy",
    value: "DAIRY",
    description: "Fresh milk, curd, paneer, cheese",
    icon: "🥛",
    gradient: "from-sky-400 to-blue-400",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop",
    sortOrder: 8,
  },
  {
    name: "Dry Fruits & Nuts",
    value: "DRY_FRUITS",
    description: "Almonds, cashews, dates, dry fruits",
    icon: "🥜",
    gradient: "from-amber-400 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
    sortOrder: 9,
  },
  {
    name: "Shoes & Footwear",
    value: "SHOES",
    description: "Shoes, sandals, slippers, footwear",
    icon: "👟",
    gradient: "from-indigo-400 to-purple-500",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    sortOrder: 10,
  },
  {
    name: "Mobiles & Laptops",
    value: "MOBILES",
    description: "Smartphones, laptops, tablets",
    icon: "📱",
    gradient: "from-violet-400 to-purple-500",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    sortOrder: 11,
  },
  {
    name: "Toys & Games",
    value: "TOYS",
    description: "Kids toys, board games, puzzles",
    icon: "🎮",
    gradient: "from-red-400 to-pink-500",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop",
    sortOrder: 12,
  },
  {
    name: "Books & Stationery",
    value: "BOOKS",
    description: "Books, notebooks, office supplies",
    icon: "📚",
    gradient: "from-blue-400 to-indigo-500",
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop",
    sortOrder: 13,
  },
  {
    name: "Sports & Fitness",
    value: "SPORTS",
    description: "Sports equipment, gym gear, fitness",
    icon: "⚽",
    gradient: "from-green-500 to-emerald-600",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop",
    sortOrder: 14,
  },
  {
    name: "Pet Supplies",
    value: "PETS",
    description: "Pet food, accessories, care products",
    icon: "🐾",
    gradient: "from-orange-400 to-red-400",
    imageUrl: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop",
    sortOrder: 15,
  },
  {
    name: "Automotive",
    value: "AUTOMOTIVE",
    description: "Car accessories, bike parts, tools",
    icon: "🚗",
    gradient: "from-gray-500 to-slate-600",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
    sortOrder: 16,
  },
  {
    name: "Garden & Outdoor",
    value: "GARDEN",
    description: "Plants, gardening tools, outdoor items",
    icon: "🌱",
    gradient: "from-lime-500 to-green-600",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
    sortOrder: 17,
  },
  {
    name: "Jewelry & Accessories",
    value: "JEWELRY",
    description: "Jewelry, watches, fashion accessories",
    icon: "💍",
    gradient: "from-yellow-400 to-amber-500",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
    sortOrder: 18,
  },
  {
    name: "Other",
    value: "OTHER",
    description: "Any other business type",
    icon: "📦",
    gradient: "from-gray-400 to-slate-500",
    imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=400&fit=crop",
    sortOrder: 99,
  },
];

export default function SeedExpandedCategoriesPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [results, setResults] = useState<{ created: string[]; skipped: string[]; errors: string[] }>({
    created: [],
    skipped: [],
    errors: [],
  });
  const [progress, setProgress] = useState(0);

  const handleSeed = async () => {
    if (!confirm("This will add all expanded categories. Existing categories with same value will be skipped. Continue?")) {
      return;
    }

    setStatus("loading");
    setProgress(0);
    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < EXPANDED_CATEGORIES.length; i++) {
      const category = EXPANDED_CATEGORIES[i];
      setProgress(Math.round(((i + 1) / EXPANDED_CATEGORIES.length) * 100));

      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.createBusinessCategory({
          name: category.name,
          value: category.value,
          description: category.description,
          icon: category.icon,
          gradient: category.gradient,
          imageUrl: category.imageUrl,
          isActive: true,
          sortOrder: category.sortOrder,
        });

        if (response.success) {
          created.push(category.name);
        } else {
          // Likely already exists
          skipped.push(category.name);
        }
      } catch (error: any) {
        if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
          skipped.push(category.name);
        } else {
          errors.push(`${category.name}: ${error.message}`);
        }
      }

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setResults({ created, skipped, errors });
    setStatus(errors.length > 0 ? "error" : "success");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seed Expanded Categories</h1>
              <p className="text-gray-600 mt-1">
                Add all {EXPANDED_CATEGORIES.length} categories with images and icons
              </p>
            </div>
            <Link
              href="/admin/business-categories"
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              ← Back to Categories
            </Link>
          </div>

          {/* Preview of categories */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Categories to be added:</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {EXPANDED_CATEGORIES.map((cat) => (
                <div
                  key={cat.value}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          {status === "idle" && (
            <button
              onClick={handleSeed}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Seed All Categories
            </button>
          )}

          {/* Progress */}
          {status === "loading" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Adding categories...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {(status === "success" || status === "error") && (
            <div className="space-y-4">
              {results.created.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">
                    ✓ Created ({results.created.length})
                  </h3>
                  <p className="text-sm text-green-700">{results.created.join(", ")}</p>
                </div>
              )}

              {results.skipped.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    ⏭ Skipped - Already Exist ({results.skipped.length})
                  </h3>
                  <p className="text-sm text-yellow-700">{results.skipped.join(", ")}</p>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">
                    ✕ Errors ({results.errors.length})
                  </h3>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {results.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/admin/business-categories")}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  View All Categories
                </button>
                <button
                  onClick={() => {
                    setStatus("idle");
                    setResults({ created: [], skipped: [], errors: [] });
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
