"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
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
  };
  createdAt: string;
}

export default function ProductTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [processing, setProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    categoryId: "",
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
    fetchCategories();
    fetchTemplates();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/public/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/product-templates";
      const params = new URLSearchParams();
      
      if (selectedCategory !== "ALL") {
        params.append("categoryId", selectedCategory);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async (theme: string) => {
    if (!confirm(`Seed ${theme} product templates? This will add default products for ${theme === "all" ? "Kirana and Fashion" : theme} stores.`)) {
      return;
    }

    setSeeding(true);
    try {
      const response = await fetch(`/api/admin/product-templates/seed?theme=${theme}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        alert(`${data.message}\n\nCreated: ${data.data.created.length}\nSkipped: ${data.data.skipped.length}\nErrors: ${data.data.errors.length}`);
        fetchTemplates();
      } else {
        alert(data.error || "Failed to seed templates");
      }
    } catch (error) {
      console.error("Error seeding templates:", error);
      alert("Failed to seed templates");
    } finally {
      setSeeding(false);
    }
  };

  const handleAddTemplate = async () => {
    if (!formData.categoryId || !formData.name || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/admin/product-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert("Template created successfully!");
        setShowAddModal(false);
        resetForm();
        fetchTemplates();
      } else {
        alert(data.error || "Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Failed to create template");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    if (!formData.categoryId || !formData.name || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/product-templates/${selectedTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        }),
      });
      const data = await response.json();

      if (data.success) {
        alert("Template updated successfully!");
        setShowEditModal(false);
        setSelectedTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        alert(data.error || "Failed to update template");
      }
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/admin/product-templates/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        alert("Template deleted successfully!");
        fetchTemplates();
      } else {
        alert(data.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template");
    }
  };

  const openEditModal = (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      categoryId: template.category.id,
      name: template.name,
      description: template.description,
      suggestedImage: template.suggestedImage || "",
      suggestedPrice: template.suggestedPrice?.toString() || "",
      suggestedWeight: template.suggestedWeight?.toString() || "",
      isPopular: template.isPopular,
      tags: template.tags?.join(", ") || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      categoryId: categories[0]?.id || "",
      name: "",
      description: "",
      suggestedImage: "",
      suggestedPrice: "",
      suggestedWeight: "",
      isPopular: false,
      tags: "",
    });
  };

  const filteredTemplates = templates.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Templates</h1>
              <p className="text-sm text-gray-600">Manage default product templates for vendors</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              resetForm();
              setFormData(prev => ({ ...prev, categoryId: categories[0]?.id || "" }));
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            + Add Template
          </button>
          <button
            onClick={() => handleSeedTemplates("kirana")}
            disabled={seeding}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed Kirana Products"}
          </button>
          <button
            onClick={() => handleSeedTemplates("fashion")}
            disabled={seeding}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed Fashion Products"}
          </button>
          <button
            onClick={() => handleSeedTemplates("all")}
            disabled={seeding}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {seeding ? "Seeding..." : "Seed All Products"}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Templates</p>
            <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Popular Templates</p>
            <p className="text-2xl font-bold text-green-600">{templates.filter(t => t.isPopular).length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Categories with Templates</p>
            <p className="text-2xl font-bold text-blue-600">{new Set(templates.map(t => t.category.id)).size}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Usage</p>
            <p className="text-2xl font-bold text-purple-600">{templates.reduce((sum, t) => sum + t.usageCount, 0)}</p>
          </div>
        </div>

        {/* Templates Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No templates found. Click &quot;Seed Products&quot; to add default templates.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
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
                      {template.category.name}
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
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(template)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
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
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {showEditModal ? "Edit Template" : "Add New Template"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedTemplate(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Tata Salt (1kg)"
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
                    placeholder="salt, cooking, essential"
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
                    onClick={showEditModal ? handleUpdateTemplate : handleAddTemplate}
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? "Saving..." : showEditModal ? "Update Template" : "Create Template"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedTemplate(null);
                      resetForm();
                    }}
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
