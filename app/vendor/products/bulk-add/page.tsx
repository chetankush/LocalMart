"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import BulkAddProductsClient from "./BulkAddProductsClient";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  value?: string;
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

export default function BulkAddProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTemplates, setAllTemplates] = useState<ProductTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check vendor status
        const vendorResponse = await apiClient.checkVendor();
        if (!vendorResponse.success || !vendorResponse.data?.isVendor) {
          router.push("/vendor/onboarding");
          return;
        }

        // Get first active store's ID
        const activeStore = vendorResponse.data.stores?.find(s => s.isActive);
        if (!activeStore) {
          router.push("/vendor/onboarding");
          return;
        }
        setVendorId(activeStore.id);

        // Get business categories from backend (admin panel categories)
        const categoriesResponse = await apiClient.getBusinessCategories(true);
        if (categoriesResponse.success && categoriesResponse.data) {
          // Map business categories to the format expected by the component
          setCategories(categoriesResponse.data.map(cat => ({
            id: cat.id,
            name: cat.name,
            value: cat.value,
          })));
        }

        // Get ALL templates from backend (no filtering - we'll filter client-side)
        const templatesResponse = await apiClient.getProductTemplates({ limit: 500 });
        if (templatesResponse.success && templatesResponse.data) {
          setAllTemplates(templatesResponse.data as ProductTemplate[]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Filter templates client-side based on selected category
  const filteredTemplates = selectedCategory === "all"
    ? allTemplates
    : allTemplates.filter(template => {
        // Match by category id, name, or check if template's category name contains the selected category name
        const selectedCat = categories.find(c => c.id === selectedCategory);
        if (!selectedCat) return true;

        return (
          template.category?.id === selectedCategory ||
          template.category?.name?.toLowerCase().includes(selectedCat.name.toLowerCase()) ||
          selectedCat.name.toLowerCase().includes(template.category?.name?.toLowerCase() || '')
        );
      });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product templates...</p>
        </div>
      </div>
    );
  }

  if (!vendorId) {
    return null;
  }

  return (
    <BulkAddProductsClient
      vendorId={vendorId}
      categories={categories}
      templates={filteredTemplates}
      allTemplatesCount={allTemplates.length}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
    />
  );
}
