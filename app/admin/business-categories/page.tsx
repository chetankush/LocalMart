"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import {
  FolderTree,
  ArrowLeft,
  Plus,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";

type BusinessCategory = {
  id: string;
  name: string;
  value: string;
  description: string | null;
  imageUrl: string | null;
  gradient: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

export default function BusinessCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    description: "",
    imageUrl: "",
    gradient: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
  });

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

  // Fetch categories
  useEffect(() => {
    if (!authChecked) return;
    fetchCategories();
  }, [authChecked]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.getAdminBusinessCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("Seed default business categories? This will add missing default categories.")) return;

    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.seedBusinessCategories();

      if (data.success) {
        alert(data.message);
        fetchCategories();
      } else {
        alert("Failed to seed categories");
      }
    } catch (error: any) {
      console.error("Error seeding categories:", error);
      alert(error.message || "Failed to seed categories");
    } finally {
      setProcessing(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      value: "",
      description: "",
      imageUrl: "",
      gradient: "from-blue-500 to-cyan-500",
      icon: "",
      isActive: true,
      sortOrder: categories.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (category: BusinessCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      value: category.value,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      gradient: category.gradient || "",
      icon: category.icon || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value) {
      alert("Name and value are required");
      return;
    }

    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");

      let data;
      if (editingCategory) {
        data = await apiClient.updateBusinessCategory(editingCategory.id, formData);
      } else {
        data = await apiClient.createBusinessCategory(formData);
      }

      if (data.success) {
        alert(data.message);
        setShowModal(false);
        fetchCategories();
      } else {
        alert("Failed to save category");
      }
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.message || "Failed to save category");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.deleteBusinessCategory(id);

      if (data.success) {
        alert(data.message);
        fetchCategories();
      } else {
        alert("Failed to delete category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(error.message || "Failed to delete category");
    } finally {
      setProcessing(false);
    }
  };

  const toggleActive = async (category: BusinessCategory) => {
    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateBusinessCategory(category.id, {
        isActive: !category.isActive,
      });

      if (data.success) {
        fetchCategories();
      } else {
        alert("Failed to update category");
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      alert(error.message || "Failed to update category");
    } finally {
      setProcessing(false);
    }
  };

  // Gradient options for dropdown
  const gradientOptions = [
    { label: "Green", value: "from-green-500 to-emerald-500" },
    { label: "Orange/Red", value: "from-orange-500 to-red-500" },
    { label: "Blue/Cyan", value: "from-blue-500 to-cyan-500" },
    { label: "Indigo/Purple", value: "from-indigo-500 to-purple-500" },
    { label: "Pink/Rose", value: "from-pink-500 to-rose-500" },
    { label: "Amber/Orange", value: "from-amber-500 to-orange-500" },
    { label: "Gray/Slate", value: "from-gray-500 to-slate-500" },
    { label: "Purple/Pink", value: "from-purple-500 to-pink-500" },
    { label: "Teal/Cyan", value: "from-teal-500 to-cyan-500" },
    { label: "Red/Pink", value: "from-red-500 to-pink-500" },
  ];

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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <FolderTree className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Business Categories</h1>
                <p className="text-xs text-gray-500">Manage categories shown in vendor onboarding</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Link
                href="/admin/business-categories/seed-expanded"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-100 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Seed All (19)</span>
              </Link>
              <button
                onClick={handleSeed}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Seed Defaults</span>
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Category</span>
              </button>
              <Link
                href="/admin/product-templates"
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-sm font-medium hover:bg-amber-100 transition-all"
              >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Templates</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Templates Info Box */}
        <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Product Templates</h3>
              <p className="text-sm text-gray-600 mt-1">
                Product templates help vendors quickly add common products. Manage templates or seed Kirana/Fashion products.
              </p>
              <div className="mt-3">
                <Link
                  href="/admin/product-templates"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-full hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
                >
                  <Package className="w-4 h-4" />
                  Manage Templates
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <FolderTree className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Total Categories</p>
            <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {categories.filter(c => c.isActive).length}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Inactive</p>
            <p className="text-3xl font-bold text-red-600">
              {categories.filter(c => !c.isActive).length}
            </p>
          </div>
        </div>

        {/* Categories Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
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
            <p className="text-gray-500 mb-6">Get started by seeding default categories</p>
            <button
              onClick={handleSeed}
              className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="w-5 h-5" />
              Seed Default Categories
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-orange-50/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/product-templates/${category.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600">
                          {category.sortOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xl shadow-lg`}>
                              {category.icon || category.name[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              {category.icon && <span>{category.icon}</span>}
                              {category.name}
                            </div>
                            <div className="text-xs text-orange-500 font-medium flex items-center gap-1">
                              Click to manage templates
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">{category.value}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {category.description || "-"}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleActive(category)}
                          disabled={processing}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                            category.isActive
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                              : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                          }`}
                        >
                          {category.isActive ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/product-templates/${category.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 transition-all"
                          >
                            <Package className="w-3.5 h-3.5" />
                            Templates
                          </Link>
                          <button
                            onClick={() => openEditModal(category)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            disabled={processing}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <p className="text-sm text-gray-500">
                  {editingCategory ? "Update category details" : "Create a new business category"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="e.g., Grocery / Kirana Store"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Value (Code) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all uppercase"
                  placeholder="e.g., GROCERY"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  This will be stored in the vendor profile. Use uppercase letters and underscores.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Image
                </label>
                <ImageUploader
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  uploadType="categories"
                  previewSize="md"
                  allowUrlInput={true}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Upload an image or paste a URL. Recommended size: 400x400px
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="🛒"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gradient Color
                </label>
                <select
                  value={formData.gradient}
                  onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="">Select a gradient</option>
                  {gradientOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {formData.gradient && (
                  <div className={`mt-3 h-10 rounded-xl bg-gradient-to-r ${formData.gradient}`} />
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (visible in vendor onboarding)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      {editingCategory ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
