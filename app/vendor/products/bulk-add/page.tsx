"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import BulkAddProductsClient from "./BulkAddProductsClient";
import { LargeTitle } from "@/components/app/ui";

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
  const [shopKind, setShopKind] = useState<string | null>(null);

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
        setShopKind(activeStore.businessType ?? null);

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
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 pb-8 sm:pt-6 lg:max-w-5xl lg:px-8" aria-busy="true">
        <LargeTitle
          title="Add many at once"
          back={{ href: "/vendor/products", label: "Products" }}
          subtitle="Loading products…"
        />
        <div className="mb-4 h-12 animate-pulse rounded-xl bg-card" aria-hidden />
        <div className="grid gap-3 lg:grid-cols-2" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-card p-4">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-fill" />
              <div className="h-14 w-14 animate-pulse rounded-xl bg-fill" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded-full bg-fill" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-fill" />
              </div>
            </div>
          ))}
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
      shopKind={shopKind}
    />
  );
}
