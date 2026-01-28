"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  tags: string[];
  category: {
    id: string;
    name: string;
  };
}

interface RecommendedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  vendorId: string;
}

export default function RecommendedProductsModal({
  isOpen,
  onClose,
  categories,
  vendorId,
}: RecommendedProductsModalProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form state for editing the selected template before adding
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    sku: "",
    stockQuantity: "10",
    lowStockThreshold: "5",
    weight: "",
    isActive: true,
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [isOpen, categories]);

  useEffect(() => {
    if (selectedCategory) {
      fetchTemplates();
    }
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/vendor/product-templates?categoryId=${selectedCategory}`
      );
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
    setLoading(false);
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleSelectTemplate = (template: ProductTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      categoryId: template.category.id,
      price: template.suggestedPrice?.toString() || "",
      compareAtPrice: "",
      sku: "",
      stockQuantity: "10",
      lowStockThreshold: "5",
      weight: template.suggestedWeight?.toString() || "",
      isActive: true,
    });
    // Pre-fill image if available
    if (template.suggestedImage) {
      setImages([template.suggestedImage]);
    } else {
      setImages([]);
    }
    setShowEditForm(true);

    // Record template usage
    try {
      fetch(`/api/vendor/product-templates/${template.id}/use`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error recording template usage:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select image files only");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be less than 5MB");
        }

        const formDataUpload = new FormData();
        formDataUpload.append("file", file);
        formDataUpload.append("type", "product");

        const res = await fetch("/api/vendor/upload", {
          method: "POST",
          body: formDataUpload,
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to upload image");
        }

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error: unknown) {
      console.error("Image upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload images");
    }

    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async () => {
    if (images.length === 0) {
      alert("Please add at least one product image");
      return;
    }

    if (!formData.name || !formData.description || !formData.categoryId || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    setProcessing(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.createVendorProduct({
        ...formData,
        vendorId,
        images,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      });

      if (data.success) {
        alert("Product added successfully!");
        // Reset and go back to template selection
        setShowEditForm(false);
        setSelectedTemplate(null);
        setImages([]);
        // Optionally close modal or let user add more
        const addMore = confirm("Product added! Do you want to add another recommended product?");
        if (!addMore) {
          onClose();
          router.refresh();
        }
      } else {
        alert(data.error || "Failed to add product");
      }
    } catch (error) {
      console.error("Product creation error:", error);
      alert("Something went wrong. Please try again.");
    }

    setProcessing(false);
  };

  const handleBackToTemplates = () => {
    setShowEditForm(false);
    setSelectedTemplate(null);
    setImages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {showEditForm ? "Edit & Add Product" : "📦 Recommended Products"}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {showEditForm
                  ? "Customize the product details before adding to your store"
                  : "Select a product template to quickly add to your store"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showEditForm ? (
            <>
              {/* Category & Search Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Templates Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading products...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    No recommended products found for this category.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Try selecting a different category or add products manually.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <div className="flex items-start gap-3">
                        {template.suggestedImage ? (
                          <Image
                            src={template.suggestedImage}
                            alt={template.name}
                            width={60}
                            height={60}
                            className="w-15 h-15 rounded object-cover"
                          />
                        ) : (
                          <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center text-2xl">
                            📦
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                              {template.name}
                            </h3>
                            {template.isPopular && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                          {template.suggestedPrice && (
                            <p className="text-sm font-medium text-green-600 mt-2">
                              ₹{template.suggestedPrice}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <button className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium opacity-0 group-hover:opacity-100">
                          Select & Edit →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Edit Form */
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={handleBackToTemplates}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                ← Back to Templates
              </button>

              {/* Product Images */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Product Images *</h3>
                <div className="grid grid-cols-5 gap-3">
                  {images.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                    >
                      <Image
                        src={url}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      {uploadingImages ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs text-gray-500">Add</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImages}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload your own images or keep the suggested one. Max 5 images.
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., SALT-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    step="0.01"
                    min="0"
                    placeholder="Original price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">
                      Active (Product will be visible to customers)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showEditForm && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={handleAddProduct}
                disabled={processing || uploadingImages}
                className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {processing ? "Adding Product..." : "Add Product to My Store"}
              </button>
              <button
                onClick={handleBackToTemplates}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
