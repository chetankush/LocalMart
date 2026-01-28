"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, Package, ArrowLeft, Loader2, Search, Filter, X, Edit2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import ImageUploader from "@/components/ImageUploader";

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
  category: Category;
}

interface BulkAddProductsClientProps {
  vendorId: string;
  categories: Category[];
  templates: ProductTemplate[];
  allTemplatesCount: number;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

interface SelectedProduct extends ProductTemplate {
  price: number;
  stockQuantity: number;
  customName?: string;
  customDescription?: string;
  customImage?: string;
  customWeight?: number;
}

export default function BulkAddProductsClient({
  vendorId,
  categories,
  templates,
  allTemplatesCount,
  selectedCategory,
  onCategoryChange,
}: BulkAddProductsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [loading, setLoading] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SelectedProduct | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: 0,
    stockQuantity: 10,
    weight: 0,
    image: "",
  });

  // Filter templates (category filtering is done by parent, only search filter here)
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesSearch;
  });

  // Group by category for display
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const categoryName = template.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(template);
    return acc;
  }, {} as Record<string, ProductTemplate[]>);

  const handleToggleProduct = (template: ProductTemplate) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(template.id)) {
      newSelected.delete(template.id);
    } else {
      newSelected.set(template.id, {
        ...template,
        price: template.suggestedPrice || 0,
        stockQuantity: 10, // Default stock
      });
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredTemplates.length) {
      // Deselect all
      setSelectedProducts(new Map());
    } else {
      // Select all filtered
      const newSelected = new Map<string, SelectedProduct>();
      filteredTemplates.forEach((template) => {
        newSelected.set(template.id, {
          ...template,
          price: template.suggestedPrice || 0,
          stockQuantity: 10,
        });
      });
      setSelectedProducts(newSelected);
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    const categoryTemplates = groupedTemplates[categoryName] || [];
    const allSelected = categoryTemplates.every((t) => selectedProducts.has(t.id));

    const newSelected = new Map(selectedProducts);
    if (allSelected) {
      // Deselect all in category
      categoryTemplates.forEach((t) => newSelected.delete(t.id));
    } else {
      // Select all in category
      categoryTemplates.forEach((t) => {
        if (!newSelected.has(t.id)) {
          newSelected.set(t.id, {
            ...t,
            price: t.suggestedPrice || 0,
            stockQuantity: 10,
          });
        }
      });
    }
    setSelectedProducts(newSelected);
  };

  const handleUpdateProduct = (templateId: string, field: "price" | "stockQuantity", value: number) => {
    const newSelected = new Map(selectedProducts);
    const product = newSelected.get(templateId);
    if (product) {
      newSelected.set(templateId, { ...product, [field]: value });
      setSelectedProducts(newSelected);
    }
  };

  // Edit modal functions
  const openEditModal = (product: SelectedProduct) => {
    setEditingProduct(product);
    setEditForm({
      name: product.customName || product.name,
      description: product.customDescription || product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      weight: product.customWeight || product.suggestedWeight || 0,
      image: product.customImage || product.suggestedImage || "",
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
  };

  const saveEditedProduct = () => {
    if (!editingProduct) return;

    const newSelected = new Map(selectedProducts);
    newSelected.set(editingProduct.id, {
      ...editingProduct,
      customName: editForm.name,
      customDescription: editForm.description,
      price: editForm.price,
      stockQuantity: editForm.stockQuantity,
      customWeight: editForm.weight,
      customImage: editForm.image,
    });
    setSelectedProducts(newSelected);
    closeEditModal();
  };

  const handleBulkAdd = async () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product to add");
      return;
    }

    setLoading(true);
    setAddedCount(0);
    setErrorCount(0);

    const products = Array.from(selectedProducts.values());
    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
      try {
        const response = await apiClient.createVendorProduct({
          vendorId,
          name: product.customName || product.name,
          description: product.customDescription || product.description,
          // Use categoryName instead of categoryId since template categories are BusinessCategories
          categoryName: product.category.name,
          price: product.price,
          stockQuantity: product.stockQuantity,
          lowStockThreshold: 5,
          weight: product.customWeight || product.suggestedWeight || undefined,
          images: (product.customImage || product.suggestedImage) ? [product.customImage || product.suggestedImage] : [],
          isActive: true,
        });

        if (response.success) {
          successCount++;
          setAddedCount(successCount);
        } else {
          failCount++;
          setErrorCount(failCount);
          console.error(`Failed to add ${product.customName || product.name}`);
        }
      } catch (error: any) {
        failCount++;
        setErrorCount(failCount);
        console.error(`Error adding ${product.customName || product.name}:`, error.message);
      }
    }

    setLoading(false);

    if (successCount > 0) {
      alert(`Successfully added ${successCount} products!${failCount > 0 ? ` (${failCount} failed)` : ""}`);
      router.push("/vendor/products");
    } else {
      alert("Failed to add products. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/vendor/products"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Add Products</h1>
                <p className="text-sm text-gray-600">
                  Select multiple products to add to your store at once
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedProducts.size}</p>
              </div>
              <button
                onClick={handleBulkAdd}
                disabled={loading || selectedProducts.size === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding {addedCount}/{selectedProducts.size}...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Add {selectedProducts.size} Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Select All */}
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {selectedProducts.size === filteredTemplates.length && filteredTemplates.length > 0
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Total Templates</p>
            <p className="text-2xl font-bold text-gray-900">{allTemplatesCount}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Showing</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTemplates.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-blue-600">{selectedProducts.size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedTemplates).length}</p>
          </div>
        </div>

        {/* Products by Category */}
        {Object.keys(groupedTemplates).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            {allTemplatesCount === 0 ? (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No product templates available</h3>
                <p className="text-gray-500 mb-4">
                  Product templates need to be seeded by an admin first.
                </p>
                <p className="text-sm text-gray-400">
                  Ask your admin to seed templates via: <code className="bg-gray-100 px-2 py-1 rounded">POST /api/admin/product-templates/seed?theme=kirana</code>
                </p>
              </>
            ) : searchQuery ? (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates match your search</h3>
                <p className="text-gray-500">Try a different search term or clear the search</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates for this category</h3>
                <p className="text-gray-500 mb-4">
                  There are {allTemplatesCount} templates available in other categories.
                </p>
                <button
                  onClick={() => onCategoryChange("all")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Show All Templates
                </button>
              </>
            )}
          </div>
        ) : (
          Object.entries(groupedTemplates).map(([categoryName, categoryTemplates]) => {
            const allSelected = categoryTemplates.every((t) => selectedProducts.has(t.id));
            const someSelected = categoryTemplates.some((t) => selectedProducts.has(t.id));

            return (
              <div key={categoryName} className="bg-white rounded-lg shadow mb-6 overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSelectCategory(categoryName)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        allSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : someSelected
                          ? "bg-blue-100 border-blue-400"
                          : "border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {allSelected && <Check className="w-4 h-4" />}
                      {someSelected && !allSelected && <div className="w-2 h-2 bg-blue-600 rounded-sm" />}
                    </button>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{categoryName}</h2>
                      <p className="text-sm text-gray-600">
                        {categoryTemplates.length} products
                        {someSelected && (
                          <span className="ml-2 text-blue-600">
                            ({categoryTemplates.filter((t) => selectedProducts.has(t.id)).length} selected)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectCategory(categoryName)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Products Grid */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryTemplates.map((template) => {
                    const isSelected = selectedProducts.has(template.id);
                    const selectedProduct = selectedProducts.get(template.id);

                    return (
                      <div
                        key={template.id}
                        className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:shadow"
                        }`}
                        onClick={() => handleToggleProduct(template)}
                      >
                        {/* Selection Checkbox */}
                        <div
                          className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>

                        {/* Popular Badge */}
                        {template.isPopular && (
                          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full z-10">
                            Popular
                          </div>
                        )}

                        {/* Image */}
                        <div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                          {template.suggestedImage ? (
                            <Image
                              src={template.suggestedImage}
                              alt={template.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 truncate">
                            {selectedProduct?.customName || template.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 h-8">
                            {selectedProduct?.customDescription || template.description}
                          </p>

                          {/* Price & Stock (editable when selected) */}
                          {isSelected && selectedProduct ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-600">Price (₹)</label>
                                  <input
                                    type="number"
                                    value={selectedProduct.price}
                                    onChange={(e) =>
                                      handleUpdateProduct(template.id, "price", parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-600">Stock</label>
                                  <input
                                    type="number"
                                    value={selectedProduct.stockQuantity}
                                    onChange={(e) =>
                                      handleUpdateProduct(template.id, "stockQuantity", parseInt(e.target.value) || 0)
                                    }
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    min="0"
                                  />
                                </div>
                              </div>
                              {/* Edit Button */}
                              <button
                                onClick={() => openEditModal(selectedProduct)}
                                className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit Details
                              </button>
                              {/* Show if customized */}
                              {(selectedProduct.customName || selectedProduct.customDescription || selectedProduct.customImage) && (
                                <p className="mt-1 text-xs text-green-600 text-center">Customized</p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm font-semibold text-green-600">
                                {template.suggestedPrice ? `₹${template.suggestedPrice}` : "Set price"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {template.suggestedWeight ? `${template.suggestedWeight}kg` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar */}
      {selectedProducts.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedProducts(new Map())}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={handleBulkAdd}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding Products...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Add {selectedProducts.size} Products to Store
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
                <p className="text-sm text-gray-500 mt-1">Customize this product before adding to your store</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Product Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <ImageUploader
                  value={editForm.image}
                  onChange={(url) => setEditForm({ ...editForm, image: url })}
                  uploadType="product"
                  placeholder="Upload product image or paste URL"
                  previewSize="md"
                  allowUrlInput={true}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Upload your own image or use the template image. Recommended: Square images (500x500px)
                </p>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter product description"
                />
              </div>

              {/* Price, Stock, Weight */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Original Template Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Original Template</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700">{editingProduct.name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-500">₹{editingProduct.suggestedPrice || 0}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-500">{editingProduct.category?.name}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedProduct}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
