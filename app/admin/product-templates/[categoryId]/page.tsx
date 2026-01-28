"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";

interface Category {
  id: string;
  name: string;
  value?: string;
  icon?: string;
  description?: string;
}

interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  suggestedImage: string | null;
  suggestedPrice: number | null;
  suggestedWeight: number | null;
  isPopular: boolean;
  usageCount: number;
  tags: string[];
  category: {
    id: string;
    name: string;
    value?: string;
  };
  createdAt: string;
}

export default function CategoryTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    suggestedImage: "",
    suggestedPrice: "",
    suggestedWeight: "",
    isPopular: false,
    tags: "",
  });

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuth");
    if (!isAuthenticated) {
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all business categories to find this one
      const catResponse = await apiClient.getBusinessCategories(false);
      if (catResponse.success && catResponse.data) {
        const found = catResponse.data.find((c: Category) => c.id === categoryId);
        if (found) {
          setCategory(found);
        }
      }

      // Fetch templates for this category
      const templatesResponse = await apiClient.getAdminProductTemplates({ categoryId });
      if (templatesResponse.success && templatesResponse.data) {
        setTemplates(templatesResponse.data as ProductTemplate[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      suggestedImage: "",
      suggestedPrice: "",
      suggestedWeight: "",
      isPopular: false,
      tags: "",
    });
    setShowModal(true);
  };

  const openEditModal = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      suggestedImage: template.suggestedImage || "",
      suggestedPrice: template.suggestedPrice?.toString() || "",
      suggestedWeight: template.suggestedWeight?.toString() || "",
      isPopular: template.isPopular,
      tags: template.tags?.join(", ") || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      alert("Please fill in name and description");
      return;
    }

    setProcessing(true);
    try {
      const data = {
        categoryId: categoryId,
        name: formData.name,
        description: formData.description,
        suggestedImage: formData.suggestedImage || undefined,
        suggestedPrice: formData.suggestedPrice ? parseFloat(formData.suggestedPrice) : undefined,
        suggestedWeight: formData.suggestedWeight ? parseFloat(formData.suggestedWeight) : undefined,
        isPopular: formData.isPopular,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
      };

      let response;
      if (editingTemplate) {
        response = await apiClient.updateProductTemplate(editingTemplate.id, data);
      } else {
        response = await apiClient.createProductTemplate(data);
      }

      if (response.success) {
        alert(editingTemplate ? "Template updated successfully!" : "Template created successfully!");
        setShowModal(false);
        fetchData();
      } else {
        alert("Failed to save template");
      }
    } catch (error: any) {
      console.error("Error saving template:", error);
      alert(error.message || "Failed to save template");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await apiClient.deleteProductTemplate(id);
      if (response.success) {
        alert("Template deleted successfully!");
        fetchData();
      } else {
        alert("Failed to delete template");
      }
    } catch (error: any) {
      console.error("Error deleting template:", error);
      alert(error.message || "Failed to delete template");
    }
  };

  const handleSeedExamples = async () => {
    if (!confirm(`Seed example product templates for ${category?.name}? This will add sample products to help you get started.`)) {
      return;
    }

    setSeeding(true);
    try {
      const response = await apiClient.seedCategoryTemplates(categoryId) as any;
      if (response.success) {
        const created = response.created ?? 0;
        const skipped = response.skipped ?? 0;
        if (created === 0 && skipped > 0) {
          alert(`All example templates already exist for this category.`);
        } else if (created === 0 && skipped === 0) {
          alert(`No example templates available for ${category?.name}. You can add templates manually.`);
        } else {
          alert(`${response.message}\n\nCreated: ${created}\nSkipped (already exists): ${skipped}`);
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Category not found</p>
          <Link href="/admin/product-templates" className="text-blue-600 hover:text-blue-700">
            ← Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl">
                {category.icon || category.name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
                <p className="text-sm text-gray-600">{templates.length} templates</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSeedExamples}
                disabled={seeding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {seeding ? "Seeding..." : "Seed Examples"}
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                + Add Template
              </button>
              <Link href="/admin/product-templates" className="text-blue-600 hover:text-blue-700 flex items-center">
                ← Back to Categories
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Templates</p>
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Popular Templates</p>
            <p className="text-2xl font-bold text-green-600">{templates.filter(t => t.isPopular).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Usage</p>
            <p className="text-2xl font-bold text-purple-600">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
          </div>
        </div>

        {/* Templates Table */}
        {templates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 mb-4">No templates in this category yet.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSeedExamples}
                disabled={seeding}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {seeding ? "Seeding..." : "Seed Example Products"}
              </button>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Template Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {template.suggestedImage ? (
                          <Image
                            src={template.suggestedImage}
                            alt={template.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{template.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {template.suggestedPrice ? `₹${template.suggestedPrice}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {template.isPopular ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Popular</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Normal</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {template.usageCount} times
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {template.tags?.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {tag}
                          </span>
                        ))}
                        {template.tags?.length > 3 && (
                          <span className="text-xs text-gray-500">+{template.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTemplate ? "Edit Template" : "Add New Template"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Category:</strong> {category.name}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Rice (1kg)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the product..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.suggestedImage}
                    onChange={(e) => setFormData({ ...formData, suggestedImage: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Price (₹)</label>
                    <input
                      type="number"
                      value={formData.suggestedPrice}
                      onChange={(e) => setFormData({ ...formData, suggestedPrice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Weight (kg)</label>
                    <input
                      type="number"
                      value={formData.suggestedWeight}
                      onChange={(e) => setFormData({ ...formData, suggestedWeight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="rice, grains, kirana"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Mark as Popular (shown first to vendors)</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
