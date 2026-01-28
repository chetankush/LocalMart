"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Loader2,
  FolderTree,
  Store,
  Package,
  TrendingUp,
  Users,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

type VendorInCategory = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  status: string;
  isActive: boolean;
  productCount: number;
};

type CategoryAnalytics = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  totalProducts: number;
  totalVendors: number;
  vendors: VendorInCategory[];
};

type VendorAnalytics = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  totalProducts: number;
  categoriesUsed: number;
};

type Summary = {
  totalCategories: number;
  categoriesInUse: number;
  unusedCategories: number;
  totalProducts: number;
  totalActiveVendors: number;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"categories" | "vendors">("categories");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let isAdmin = false;

        try {
          const response = await fetch("/api/admin/check-auth");
          if (response.ok) {
            const data = await response.json();
            isAdmin = data.isAdmin;
          }
        } catch {
          const { apiClient } = await import("@/lib/api/client");
          const result = await apiClient.checkAdminAuth();
          isAdmin = result.isAdmin;
        }

        if (!isAdmin) {
          router.push("/admin/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch analytics
  useEffect(() => {
    if (!authChecked) return;
    fetchAnalytics();
  }, [authChecked]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.getVendorCategoryAnalytics();
      if (response.success && response.data) {
        setSummary(response.data.summary);
        setCategoryAnalytics(response.data.categoryAnalytics);
        setVendorAnalytics(response.data.vendorAnalytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "SUSPENDED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="w-3.5 h-3.5" />;
      case "SUSPENDED":
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vendor-Category Analytics</h1>
                <p className="text-xs text-gray-500">See which categories are used by which vendors</p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FolderTree className="w-5 h-5 text-gray-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Categories</p>
              <p className="text-3xl font-bold text-gray-900">{summary.totalCategories}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Categories In Use</p>
              <p className="text-3xl font-bold text-green-600">{summary.categoriesInUse}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Unused Categories</p>
              <p className="text-3xl font-bold text-orange-600">{summary.unusedCategories}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Products</p>
              <p className="text-3xl font-bold text-blue-600">{summary.totalProducts}</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">Active Vendors</p>
              <p className="text-3xl font-bold text-purple-600">{summary.totalActiveVendors}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === "categories"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <FolderTree className="w-4 h-4" />
            By Category ({categoryAnalytics.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === "vendors"
                ? "bg-gray-900 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <Store className="w-4 h-4" />
            By Vendor ({vendorAnalytics.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
              <p className="text-gray-500 font-medium">Loading analytics...</p>
            </div>
          </div>
        ) : activeTab === "categories" ? (
          /* Categories View */
          <div className="space-y-4">
            {categoryAnalytics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FolderTree className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No category data found</h3>
                <p className="text-gray-500">Categories will appear here once created</p>
              </div>
            ) : (
              categoryAnalytics.map((category) => (
                <div key={category.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Category Header */}
                  <div
                    className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/20">
                        {category.icon || category.name[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{category.name}</h3>
                        <p className="text-sm text-gray-500">/{category.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{category.totalProducts}</p>
                        <p className="text-xs text-gray-500 font-medium">Products</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{category.totalVendors}</p>
                        <p className="text-xs text-gray-500 font-medium">Vendors</p>
                      </div>
                      <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform ${expandedCategory === category.id ? "rotate-180" : ""}`}>
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  {/* Vendors List (Expanded) */}
                  {expandedCategory === category.id && (
                    <div className="border-t border-gray-100">
                      {category.vendors.length === 0 ? (
                        <div className="px-6 py-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Store className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 font-medium">No vendors are using this category yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Vendor
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Business Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  City
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                  Products
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {category.vendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                        {vendor.businessName.charAt(0)}
                                      </div>
                                      <span className="font-medium text-gray-900">{vendor.businessName}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {vendor.businessType}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {vendor.city}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyles(vendor.status)}`}>
                                      {getStatusIcon(vendor.status)}
                                      {vendor.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-lg font-bold text-blue-600">
                                      {vendor.productCount}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* Vendors View */
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            {vendorAnalytics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No vendor data found</h3>
                <p className="text-gray-500">Vendors will appear here once registered</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Business Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Categories
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Diversity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vendorAnalytics.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold">
                              {vendor.businessName.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-900">{vendor.businessName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {vendor.businessType}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {vendor.city}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-bold text-blue-600">
                            {vendor.totalProducts}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xl font-bold text-purple-600">
                            {vendor.categoriesUsed}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {vendor.totalProducts > 0 ? (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2.5 bg-gray-100 rounded-full max-w-[120px] overflow-hidden">
                                <div
                                  className="h-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(100, (vendor.categoriesUsed / Math.max(1, vendor.totalProducts)) * 100 * 5)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 font-medium">
                                {((vendor.categoriesUsed / Math.max(1, vendor.totalProducts)) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
