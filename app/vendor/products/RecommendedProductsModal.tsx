"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Check, ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { Button, Pill, Thumb, rupees } from "@/components/app/ui";
import { Field, FormCard, RupeeInput, Toggle, inputClass, selectClass, textareaClass } from "@/components/app/form";

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
  // Name of the product just added — shows the "add another?" step
  const [justAdded, setJustAdded] = useState<string | null>(null);
  // Anything added this time → reload the product list when the sheet closes
  const [addedAny, setAddedAny] = useState(false);

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

  const handleSelectTemplate = async (template: ProductTemplate) => {
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
      const { apiClient } = await import("@/lib/api/client");
      apiClient.useProductTemplate(template.id);
    } catch (error) {
      console.error("Error recording template usage:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error("You can add up to 5 photos");
      return;
    }

    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Please pick photos only");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each photo must be under 5 MB");
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
          throw new Error(data.error || "Couldn't upload the photo");
        }

        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error: unknown) {
      console.error("Image upload error:", error);
      toast.error(error instanceof Error ? error.message : "Couldn't upload the photos. Please try again.");
    }

    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProduct = async () => {
    if (images.length === 0) {
      toast.error("Add at least one photo — customers want to see what they buy");
      return;
    }

    if (!formData.name || !formData.description || !formData.categoryId || !formData.price) {
      toast.error("Add a name, a few words about it, a category and a price");
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
        // Reset and ask whether to add another (in the sheet, not a browser popup)
        setShowEditForm(false);
        setSelectedTemplate(null);
        setImages([]);
        setJustAdded(formData.name);
        setAddedAny(true);
      } else {
        toast.error((data as { error?: string }).error || "Couldn't add the product. Please try again.");
      }
    } catch (error) {
      console.error("Product creation error:", error);
      toast.error("Something went wrong. Check your internet and try again.");
    }

    setProcessing(false);
  };

  const handleBackToTemplates = () => {
    setShowEditForm(false);
    setSelectedTemplate(null);
    setImages([]);
  };

  // "Done" after adding: close and reload the list so the new product shows
  const handleDone = () => {
    setJustAdded(null);
    setAddedAny(false);
    onClose();
    router.refresh();
  };

  const handleClose = () => {
    if (addedAny) {
      handleDone();
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const title = justAdded ? "Product added" : showEditForm ? "Check and add" : "Ready-made products";
  const description = justAdded
    ? undefined
    : showEditForm
      ? "Change anything you like, then add it to your shop."
      : "Pick a product. Its photo, name and details are filled in for you.";

  return (
    <Sheet
      open={isOpen}
      onClose={handleClose}
      wide
      title={title}
      description={description}
      footer={
        showEditForm && !justAdded ? (
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleBackToTemplates}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddProduct}
              loading={processing}
              disabled={processing || uploadingImages}
            >
              {processing ? "Adding…" : "Add to my shop"}
            </Button>
          </div>
        ) : undefined
      }
    >
      {justAdded ? (
        /* Added — another one, or done? */
        <div className="rounded-2xl bg-card px-6 py-8 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
            <Check className="h-8 w-8" strokeWidth={2.6} aria-hidden />
          </span>
          <p className="text-[20px] font-semibold leading-tight text-label">{justAdded} is in your shop</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[16px] leading-snug text-label-2">
            Do you want to add another ready-made product?
          </p>
          <div className="mx-auto mt-6 flex max-w-xs flex-col gap-3">
            <Button full onClick={handleDone}>
              Done
            </Button>
            <Button variant="secondary" full onClick={() => setJustAdded(null)}>
              Add another
            </Button>
          </div>
        </div>
      ) : !showEditForm ? (
        <>
          {/* Category & search */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${selectClass} sm:w-56 sm:shrink-0`}
              aria-label="Category"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search, e.g. rice or soap"
                aria-label="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          {/* Templates */}
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 rounded-2xl bg-card p-3">
                  <div className="h-[60px] w-[60px] animate-pulse rounded-xl bg-fill" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-3/4 animate-pulse rounded-full bg-fill" />
                    <div className="h-4 w-1/2 animate-pulse rounded-full bg-fill" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="rounded-2xl bg-card px-6 py-10 text-center">
              <p className="text-[17px] font-semibold text-label">No ready-made products here</p>
              <p className="mx-auto mt-1 max-w-xs text-[15px] leading-snug text-label-2">
                Try another category, or add your product yourself.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {filteredTemplates.map((template) => (
                <li key={template.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className="flex w-full items-start gap-3 rounded-2xl bg-card p-3 text-left transition-colors active:bg-fill hover:bg-white/70 cursor-pointer"
                  >
                    <Thumb src={template.suggestedImage} alt={template.name} size={60} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">
                          {template.name}
                        </span>
                        {template.isPopular && <Pill tone="brand">Popular</Pill>}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[14px] leading-snug text-label-2">
                        {template.description}
                      </span>
                      {template.suggestedPrice ? (
                        <span className="mt-1 block text-[15px] font-semibold tabular-nums text-label">
                          {rupees(template.suggestedPrice)}
                        </span>
                      ) : null}
                      {template.tags && template.tags.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="rounded-full bg-fill px-2 py-0.5 text-[13px] text-label-2">
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-label-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        /* Edit form */
        <>
          <button
            type="button"
            onClick={handleBackToTemplates}
            className="-ml-1 mb-2 inline-flex min-h-[44px] items-center gap-0.5 rounded-lg px-1 text-[16px] text-tint cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
            Back to the list
          </button>

          {/* Photos */}
          <FormCard title="Photos" description="Keep the suggested photo or add your own. Up to 5.">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <div className="relative h-full w-full overflow-hidden rounded-xl bg-fill">
                    <Image src={url} alt={`Photo ${index + 1}`} fill className="object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full cursor-pointer"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-label text-white ring-2 ring-card">
                      <X className="h-4 w-4" strokeWidth={2.6} aria-hidden />
                    </span>
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label
                  className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-dashed border-hairline bg-fill p-1 text-center transition-colors hover:border-label/25 ${
                    uploadingImages ? "cursor-wait" : "cursor-pointer"
                  }`}
                >
                  {uploadingImages ? (
                    <Loader2 className="h-6 w-6 animate-spin text-tint" aria-hidden />
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-tint" aria-hidden />
                      <span className="text-[14px] font-semibold leading-tight text-label">Add photo</span>
                      <span className="text-[13px] leading-tight text-label-2">फ़ोटो जोड़ें</span>
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
          </FormCard>

          {/* Details */}
          <FormCard title="Details">
            <Field label="Name" htmlFor="rec-name">
              <input
                id="rec-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </Field>

            <Field label="About this product" htmlFor="rec-description">
              <textarea
                id="rec-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={textareaClass}
              />
            </Field>

            <Field label="Category" htmlFor="rec-category">
              <select
                id="rec-category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className={selectClass}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" htmlFor="rec-price">
                <RupeeInput
                  id="rec-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </Field>
              <Field label="MRP" htmlFor="rec-mrp" optional hint="Shown crossed out">
                <RupeeInput
                  id="rec-mrp"
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  step="0.01"
                  min="0"
                />
              </Field>
              <Field label="In stock" htmlFor="rec-stock">
                <input
                  id="rec-stock"
                  type="number"
                  inputMode="numeric"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                  min="0"
                />
              </Field>
              <Field label="Weight (kg)" htmlFor="rec-weight" optional>
                <input
                  id="rec-weight"
                  type="number"
                  inputMode="decimal"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className={`${inputClass} tabular-nums`}
                  step="0.01"
                  min="0"
                />
              </Field>
            </div>

            <Field label="Your item code" htmlFor="rec-code" optional hint="Only if you use codes in your shop">
              <input
                id="rec-code"
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className={inputClass}
                placeholder="e.g. SALT-001"
              />
            </Field>

            <Toggle
              checked={formData.isActive}
              onChange={(next) => setFormData({ ...formData, isActive: next })}
              label="Show in shop"
              description="Customers can see and order it"
            />
          </FormCard>
        </>
      )}
    </Sheet>
  );
}
