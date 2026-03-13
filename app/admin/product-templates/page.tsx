"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import {
  Package,
  ArrowLeft,
  Sparkles,
  Loader2,
  FolderTree,
  ChevronRight,
  Lightbulb,
  CheckCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  value?: string;
  icon?: string;
  description?: string;
  gradient?: string;
  imageUrl?: string;
}

interface TemplateCount {
  categoryId: string;
  count: number;
}

export default function ProductTemplatesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuth");
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch business categories
      const catResponse = await apiClient.getBusinessCategories(false);
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data);
      }

      // Fetch all templates to count per category
      const templatesResponse = await apiClient.getAdminProductTemplates({});
      if (templatesResponse.success && templatesResponse.data) {
        const counts: Record<string, number> = {};
        (templatesResponse.data as any[]).forEach((template) => {
          const catId = template.categoryId || template.category?.id;
          if (catId) {
            counts[catId] = (counts[catId] || 0) + 1;
          }
        });
        setTemplateCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    if (!confirm("Seed default product templates? This will add 5 templates each for Grocery and Fashion categories.")) {
      return;
    }

    setSeeding(true);
    try {
      const response = await apiClient.seedProductTemplates('all') as any;

      if (response.success) {
        const created = response.created ?? response.data?.created ?? 0;
        const skipped = response.skipped ?? response.data?.skipped ?? 0;
        alert(`${response.message}\n\nCreated: ${created}\nSkipped: ${skipped}`);
        fetchData();
      } else {
        alert("Failed to seed templates");
      }
    } catch (error: any) {
      console.error("Error seeding templates:", error);
      alert(error.message || "Failed to seed templates");
    } finally {
      setSeeding(false);
    }
  };

  const totalTemplates = Object.values(templateCounts).reduce((sum, count) => sum + count, 0);
  const categoriesWithTemplates = Object.keys(templateCounts).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Product Templates</h1>
                <p className="text-xs text-gray-500">Click on a category to view and manage its templates</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSeedTemplates}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Seed Templates
                  </>
                )}
              </button>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Templates</p>
            <p className="text-3xl font-bold text-gray-900">{totalTemplates}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Categories with Templates</p>
            <p className="text-3xl font-bold text-green-600">{categoriesWithTemplates}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <FolderTree className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Categories</p>
            <p className="text-3xl font-bold text-blue-600">{categories.length}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Quick Tip</h3>
              <p className="text-sm text-gray-600 mt-1">
                Click on any category below to view its product templates, add new templates, or edit existing ones.
                Use the "Seed Templates" button to add sample templates for Grocery and Fashion categories.
              </p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
              <p className="text-gray-500 font-medium">Loading categories...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderTree className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-6">Add business categories first</p>
            <Link
              href="/admin/business-categories"
              className="flex items-center gap-2 px-6 py-3 bg-[#FF9933] text-white rounded-full font-semibold hover:bg-[#e8872b] transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <FolderTree className="w-5 h-5" />
              Add Business Categories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const count = templateCounts[category.id] || 0;
              return (
                <Link
                  key={category.id}
                  href={`/admin/product-templates/${category.id}`}
                  className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-lg transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-4">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient || 'from-purple-500 to-indigo-500'} flex items-center justify-center text-white text-2xl shadow-lg`}>
                        {category.icon || category.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{category.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{category.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        {count} {count === 1 ? 'template' : 'templates'}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-orange-500 text-sm font-semibold group-hover:translate-x-1 transition-transform">
                      View
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
