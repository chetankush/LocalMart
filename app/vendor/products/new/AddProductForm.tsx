"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutGrid, List, ChevronDown, ChevronUp, X } from "lucide-react";

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

interface AddProductFormProps {
  vendorId: string;
  categories: Category[];
}

export default function AddProductForm({
  vendorId,
  categories,
}: AddProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Debug: Log categories received
  console.log("AddProductForm received categories:", categories.length);
  console.log(
    "Category names:",
    categories.map((c) => c.name)
  );

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: categories && categories.length > 0 ? categories[0]?.id : "",
    price: "",
    compareAtPrice: "",
    sku: "",
    stockQuantity: "",
    lowStockThreshold: "10",
    weight: "",
    isActive: true,
  });

  const [images, setImages] = useState<string[]>([]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  // Template selection state
  const [showTemplates, setShowTemplates] = useState(true);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // Fetch templates when category changes
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!formData.categoryId) return;

      setLoadingTemplates(true);
      try {
        const response = await fetch(
          `/api/product-templates?categoryId=${formData.categoryId}&popularOnly=false`
        );
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
      setLoadingTemplates(false);
    };

    fetchTemplates();
  }, [formData.categoryId]);

  // Default templates for Kirana store
  const DEFAULT_TEMPLATES: ProductTemplate[] = [
    {
      id: "default-1",
      name: "Aashirvaad Shudh Chakki Atta",
      description: "100% whole wheat flour, 0% maida. Soft and fluffy rotis.",
      suggestedPrice: 450,
      suggestedWeight: 10,
      isPopular: true,
      tags: ["atta", "flour", "wheat"],
      suggestedImage: "https://loremflickr.com/600/600/wheat,flour",
      category: { id: "default", name: "Atta, Rice & Dal" }
    },
    {
      id: "default-2",
      name: "Tata Salt",
      description: "Vacuum evaporated iodized salt. Desh ka Namak.",
      suggestedPrice: 28,
      suggestedWeight: 1,
      isPopular: true,
      tags: ["salt", "grocery"],
      suggestedImage: "https://loremflickr.com/600/600/salt,shaker",
      category: { id: "default", name: "Dry Fruits, Masala & Oil" }
    },
    {
      id: "default-3",
      name: "Fortune Refined Soyabean Oil",
      description: "Healthy and light cooking oil. Rich in Omega 3.",
      suggestedPrice: 165,
      suggestedWeight: 1,
      isPopular: true,
      tags: ["oil", "cooking oil"],
      suggestedImage: "https://loremflickr.com/600/600/oil,bottle",
      category: { id: "default", name: "Dry Fruits, Masala & Oil" }
    },
    {
      id: "default-4",
      name: "India Gate Basmati Rice",
      description: "Premium quality basmati rice for biryani and pulao.",
      suggestedPrice: 120,
      suggestedWeight: 1,
      isPopular: false,
      tags: ["rice", "basmati"],
      suggestedImage: "https://loremflickr.com/600/600/rice,bowl",
      category: { id: "default", name: "Atta, Rice & Dal" }
    },
    {
      id: "default-5",
      name: "Maggi 2-Minute Noodles",
      description: "Instant noodles with masala tastemaker.",
      suggestedPrice: 14,
      suggestedWeight: 0.07,
      isPopular: true,
      tags: ["noodles", "snacks"],
      suggestedImage: "https://loremflickr.com/600/600/noodles,ramen",
      category: { id: "default", name: "Instant & Frozen Food" }
    }
  ];

  // Filter templates based on search query
  const displayTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
  
  const filteredTemplates = displayTemplates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      (template.tags && template.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate max 5 images
    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select image files only");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each image must be less than 5MB");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "product");

        const res = await fetch("/api/vendor/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to upload image");
        }

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error: any) {
      console.error("Image upload error:", error);
      alert(error.message || "Failed to upload images");
    }

    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const handleUseTemplate = async (template: ProductTemplate) => {
    setSelectedTemplate(template);

    // Find matching category by ID or Name
    let targetCategoryId = formData.categoryId; // Default to current selection
    
    // Check if the template's category ID exists in our categories list
    const categoryExists = categories.some(c => c.id === template.category.id);
    
    if (categoryExists) {
      targetCategoryId = template.category.id;
    } else {
      // Try to find by name
      const matchedCategory = categories.find(c => 
        c.name.toLowerCase() === template.category.name.toLowerCase()
      );
      if (matchedCategory) {
        targetCategoryId = matchedCategory.id;
      }
    }

    // Auto-fill form with template data
    setFormData((prev) => ({
      ...prev,
      name: template.name,
      description: template.description,
      categoryId: targetCategoryId,
      price: template.suggestedPrice?.toString() || "",
      weight: template.suggestedWeight?.toString() || "",
    }));

    // Set template image if available
    if (template.suggestedImage) {
      setImages([template.suggestedImage]);
    }

    // Hide templates section after selection
    setShowTemplates(false);

    // Record template usage
    try {
      await fetch(`/api/product-templates/${template.id}/use`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error recording template usage:", error);
    }

    // Scroll to form
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleSkipTemplates = () => {
    setShowTemplates(false);
    setSelectedTemplate(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setAddingCategory(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.createCategory({ name: newCategoryName.trim() });

      if (data.success) {
        // Add the new category to the list and select it
        const newCategory = { id: data.data.id, name: data.data.name };
        setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
        setNewCategoryName("");
        setShowAddCategory(false);
        alert("Category added successfully!");
        // Refresh the page to get updated categories
        window.location.reload();
      } else {
        alert(data.message || "Failed to add category");
      }
    } catch (error) {
      console.error("Add category error:", error);
      alert("Failed to add category");
    }

    setAddingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate images
    if (images.length === 0) {
      alert("Please add at least one product image");
      return;
    }

    // Validate required fields
    if (
      !formData.name ||
      !formData.description ||
      !formData.categoryId ||
      !formData.price
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate category exists
    const isValidCategory = categories.some(c => c.id === formData.categoryId);
    if (!isValidCategory) {
      alert("Invalid category selected. Please select a category from the list.");
      return;
    }

    setLoading(true);

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
        sku: formData.sku ? formData.sku : null,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      });

      if (data.success) {
        alert("Product added successfully!");
        router.push("/vendor/products");
      } else {
        alert(data.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Product creation error:", error);
      alert("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Product Template Selection */}
      {showTemplates && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span>⚡ Select from Popular Products</span>
              </h2>
              <p className="text-gray-600 text-sm">
                Save time! Select a popular product template and customize it with your details
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Hide Templates"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products... (e.g., oil, soap, saree)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Template Grid */}
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <>
              <div className={`grid gap-4 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredTemplates
                  .slice(0, showAllTemplates ? undefined : 3)
                  .map((template) => (
                  <div
                    key={template.id}
                    className={`bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group ${
                      viewMode === 'list' ? 'p-4 flex gap-4 items-center' : 'p-4'
                    }`}
                    onClick={() => handleUseTemplate(template)}
                  >
                    {/* Image for both Grid and List views */}
                    {template.suggestedImage && (
                      <div className={`relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100 ${
                        viewMode === 'list' ? 'w-24 h-24' : 'w-full aspect-square mb-3'
                      }`}>
                        <Image 
                          src={template.suggestedImage} 
                          alt={template.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-2">
                          {template.name}
                        </h3>
                        {template.isPopular && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium flex-shrink-0">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          {template.suggestedPrice && (
                            <span className="text-sm font-medium text-green-600">
                              ₹{template.suggestedPrice}
                            </span>
                          )}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex gap-1">
                              {template.tags.slice(0, 2).map((tag: string, index: number) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors font-medium whitespace-nowrap ml-2"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTemplates.length > 3 && (
                <div className="mt-6 text-center border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAllTemplates(!showAllTemplates)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
                  >
                    {showAllTemplates ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        See All {filteredTemplates.length} Templates <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No templates found. Try a different search or{" "}
              <button
                type="button"
                onClick={handleSkipTemplates}
                className="text-blue-600 hover:underline font-medium"
              >
                add manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show Templates Button */}
      {!showTemplates && !selectedTemplate && (
        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          <span className="text-2xl">⚡</span> 
          <span className="text-lg">Add Kirana Products from List</span>
        </button>
      )}

      {/* Show selected template info */}
      {selectedTemplate && !showTemplates && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">
                Using template: {selectedTemplate.name}
              </p>
              <p className="text-sm text-gray-600">
                Update the details below to match your product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowTemplates(true);
              setSelectedTemplate(null);
              setFormData((prev) => ({
                ...prev,
                name: "",
                description: "",
                price: "",
                weight: "",
              }));
            }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Choose Different Template
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Product Images *</h2>

        <div className="grid grid-cols-5 gap-4 mb-4">
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}

          {images.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              {uploadingImages ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              ) : (
                <>
                  <svg
                    className="w-8 h-8 text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs text-gray-500">Add Image</span>
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

        <p className="text-xs text-gray-500">
          Upload up to 5 images. First image will be the main product image.
        </p>
        <div className="mt-2 p-3 bg-blue-50 text-blue-700 text-sm rounded-md border border-blue-100 flex gap-2 items-start">
          <span className="text-lg">💡</span>
          <p>
            <strong>Tip:</strong> While template images are helpful, we highly recommend uploading your own 
            <strong> official product images</strong> to build trust with customers.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Organic Bananas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="flex gap-2">
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option value="">No categories available</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                + Add New
              </button>
            </div>

            {showAddCategory && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter new category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={addingCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {addingCategory ? "Adding..." : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price (₹)
            </label>
            <input
              type="number"
              name="compareAtPrice"
              value={formData.compareAtPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Original price before discount
            </p>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Inventory</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stockQuantity"
              value={formData.stockQuantity}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              name="lowStockThreshold"
              value={formData.lowStockThreshold}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be notified when stock falls below this number
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Status</h2>

        <label className="flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">
            Active (Product will be visible to customers)
          </span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || uploadingImages}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Adding Product..." : "Add Product"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
    </div>
  );
}
