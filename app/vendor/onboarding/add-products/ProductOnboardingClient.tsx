'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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

interface AddedProduct {
  templateId: string;
  name: string;
  price: number;
  stockQuantity: number;
}

interface ProductOnboardingClientProps {
  vendorId: string;
  businessType: string;
  categories: Category[];
  hasExistingProducts: boolean;
}

export default function ProductOnboardingClient({
  vendorId,
  businessType,
  categories,
  hasExistingProducts,
}: ProductOnboardingClientProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);
  const [quickAddData, setQuickAddData] = useState({ price: '', stock: '' });
  const [addingProduct, setAddingProduct] = useState(false);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!selectedCategory) return;

      setLoadingTemplates(true);
      try {
        const response = await fetch(
          `/api/product-templates?categoryId=${selectedCategory}&popularOnly=false`
        );
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      }
      setLoadingTemplates(false);
    };

    fetchTemplates();
  }, [selectedCategory]);

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      (template.tags && template.tags.some((tag: string) => tag.toLowerCase().includes(query)))
    );
  });

  const handleQuickAdd = async (template: ProductTemplate) => {
    if (!quickAddData.price || !quickAddData.stock) {
      alert('Please enter price and stock quantity');
      return;
    }

    setAddingProduct(true);

    try {
      const { apiClient } = await import('@/lib/api/client');

      // Create basic product from template
      const data = await apiClient.createVendorProduct({
        vendorId,
        name: template.name,
        description: template.description,
        categoryId: template.category.id,
        images: [], // No images for now - vendor can add later
        price: parseFloat(quickAddData.price),
        compareAtPrice: null,
        sku: null,
        stockQuantity: parseInt(quickAddData.stock),
        lowStockThreshold: 10,
        weight: template.suggestedWeight,
        isActive: true,
      });

      if (data.success) {
        // Track added product
        setAddedProducts((prev) => [
          ...prev,
          {
            templateId: template.id,
            name: template.name,
            price: parseFloat(quickAddData.price),
            stockQuantity: parseInt(quickAddData.stock),
          },
        ]);

        // Record template usage
        await fetch(`/api/product-templates/${template.id}/use`, {
          method: 'POST',
        });

        // Reset and close modal
        setShowQuickAdd(null);
        setQuickAddData({ price: '', stock: '' });

        // Show success feedback
        alert(`✓ ${template.name} added successfully!`);
      } else {
        alert(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Product creation error:', error);
      alert('Something went wrong. Please try again.');
    }

    setAddingProduct(false);
  };

  const handleFinishOnboarding = () => {
    if (addedProducts.length === 0) {
      const confirmSkip = window.confirm(
        'You haven\'t added any products yet. Are you sure you want to continue? You can add products later from your dashboard.'
      );
      if (!confirmSkip) return;
    }

    router.push('/vendor/dashboard');
  };

  const handleAddManually = () => {
    router.push('/vendor/products/new');
  };

  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: string } = {
      grocery: '🛒',
      fashion: '👕',
      pharmacy: '💊',
      electronics: '📱',
      'home services': '🔧',
      restaurant: '🍽️',
    };
    return icons[categoryName.toLowerCase()] || '📦';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          ⚡ Quick Start: Add Your Products
        </h1>
        <p className="text-lg text-gray-600">
          Save time! Select products from our suggestions and customize them with your details
        </p>
        {addedProducts.length > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {addedProducts.length} product{addedProducts.length > 1 ? 's' : ''} added
          </div>
        )}
      </div>

      {/* Category Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Product Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedCategory === category.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">{getCategoryIcon(category.name)}</div>
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <input
          type="text"
          placeholder="Search products... (e.g., oil, soap, saree)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Product Templates Grid */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Popular Products in {categories.find((c) => c.id === selectedCategory)?.name}
          </h2>
          <button
            onClick={handleAddManually}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Custom Product
          </button>
        </div>

        {loadingTemplates ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredTemplates.map((template) => {
              const isAdded = addedProducts.some((p) => p.templateId === template.id);

              return (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 hover:shadow-lg transition-all ${
                    isAdded ? 'bg-green-50 border-green-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      {template.isPopular && (
                        <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                    </div>
                    {isAdded && (
                      <svg
                        className="w-6 h-6 text-green-600 flex-shrink-0"
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
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                  {template.suggestedPrice && (
                    <p className="text-sm text-gray-500 mb-3">
                      Suggested Price: <span className="font-medium text-green-600">₹{template.suggestedPrice}</span>
                    </p>
                  )}

                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isAdded && (
                    <button
                      onClick={() => {
                        setShowQuickAdd(template.id);
                        setQuickAddData({
                          price: template.suggestedPrice?.toString() || '',
                          stock: '50',
                        });
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Quick Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">No products found in this category.</p>
            <button
              onClick={handleAddManually}
              className="text-blue-600 hover:underline font-medium"
            >
              Add custom product manually
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Quick Add:{' '}
              {templates.find((t) => t.id === showQuickAdd)?.name}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Selling Price (₹) *
                </label>
                <input
                  type="number"
                  value={quickAddData.price}
                  onChange={(e) =>
                    setQuickAddData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your price"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={quickAddData.stock}
                  onChange={(e) =>
                    setQuickAddData((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How many items do you have?"
                  min="0"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 You can add images and more details later from your product dashboard
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuickAdd(null);
                  setQuickAddData({ price: '', stock: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                disabled={addingProduct}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleQuickAdd(templates.find((t) => t.id === showQuickAdd)!)
                }
                disabled={addingProduct}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {addingProduct ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg rounded-t-lg p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {addedProducts.length === 0
                ? 'Add at least one product to get started'
                : `Great! You've added ${addedProducts.length} product${
                    addedProducts.length > 1 ? 's' : ''
                  }`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddManually}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Add Custom Product
            </button>
            <button
              onClick={handleFinishOnboarding}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              {addedProducts.length > 0 ? 'Go to Dashboard →' : 'Skip for Now →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
