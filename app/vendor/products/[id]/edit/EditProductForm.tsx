"use client";

import { refreshShopPage } from "@/lib/refreshShopPage";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { Field, FormCard, RupeeInput, Toggle, inputClass, textareaClass } from "@/components/app/form";
import { useConfirm } from "@/hooks/useConfirm";
import {
  CategoryButton,
  CategoryPicker,
  MoreDetails,
  MoreDetailsFields,
  PhotoPicker,
  StockStepper,
  focusField,
  moreSummary,
} from "@/app/vendor/products/new/AddProductForm";

interface Category {
  id: string;
  name: string;
  /** Set when the category belongs to this shop only */
  vendorId?: string | null;
}

interface Product {
  id: string;
  /** The shop this product belongs to */
  vendorId: string;
  name: string;
  description: string;
  categoryId: string;
  images: any;
  price: any;
  compareAtPrice: any;
  sku: string | null;
  stockQuantity: number;
  /** false = not counted: just available or not */
  trackStock?: boolean;
  lowStockThreshold: number | null;
  weight: any;
  isActive: boolean;
  category?: { id: string; name: string } | null;
}

interface EditProductFormProps {
  product: Product;
  categories: Category[];
}

// Top-to-bottom order of the fields, so we jump to the first problem
const FIELD_ORDER = ["images", "name", "price", "stockQuantity", "category", "description"] as const;
const FIELD_IDS: Record<(typeof FIELD_ORDER)[number], string> = {
  images: "field-images",
  name: "p-name",
  price: "p-price",
  stockQuantity: "p-stock",
  category: "p-category",
  description: "p-desc",
};

export default function EditProductForm({
  product,
  categories,
}: EditProductFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  // Inline messages under fields, keyed by field name ("" = no error)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(false);

  const startForm = () => ({
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice?.toString() || "",
    sku: product.sku || "",
    trackStock: product.trackStock !== false,
    // Uncounted items keep a placeholder number — start the box empty if they switch to counting
    stockQuantity: product.trackStock === false ? "" : product.stockQuantity.toString(),
    lowStockThreshold: product.lowStockThreshold?.toString() || "10",
    weight: product.weight?.toString() || "",
    isActive: product.isActive,
  });
  const startImages = (): string[] => (Array.isArray(product.images) ? product.images : []);

  const [formData, setFormData] = useState(startForm);
  const [images, setImages] = useState<string[]>(startImages);
  // What the form looked like when opened — to warn before throwing changes away
  const [startSnapshot] = useState(() => JSON.stringify([startForm(), startImages()]));

  // Categories added from this screen join the list straight away
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

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
    clearError(name);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files || files.length === 0) return;

    // Validate max 5 images
    if (images.length + files.length > 5) {
      const left = 5 - images.length;
      toast.error(left > 0 ? `You can add ${left} more photo${left === 1 ? "" : "s"} (5 in total)` : "You can add up to 5 photos");
      input.value = "";
      return;
    }

    setUploadingImages(true);

    try {
      const { apiClient } = await import("@/lib/api/client");

      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file
        if (!file.type.startsWith("image/")) {
          throw new Error("Please pick a photo (JPG or PNG)");
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error("Each photo must be smaller than 5 MB");
        }

        // Same upload as the add screen (there is no /api/vendor/upload route in this app)
        const response = await apiClient.vendorUpload(file, "products");

        if (!response.success) {
          throw new Error("Couldn't upload the photo. Please try again.");
        }

        return response.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      clearError("images");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Couldn't upload the photo. Please try again.");
    }

    // Let the same photo be picked again later
    input.value = "";
    setUploadingImages(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCategory = (category: Category) => {
    setFormData((prev) => ({ ...prev, categoryId: category.id }));
    setShowCategoryPicker(false);
    clearError("category");
  };

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) {
      toast.error("Type a category name first");
      return;
    }

    setAddingCategory(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      // Made just for this product's shop
      const data = await apiClient.createCategory({ name: name.trim(), storeId: product.vendorId });

      if (data.success) {
        // Add the new category to the list and select it (no page reload, so edits are kept)
        const newCategory = { id: data.data.id, name: data.data.name, vendorId: data.data.vendorId };
        setLocalCategories((prev) => (prev.some((c) => c.id === newCategory.id) ? prev : [...prev, newCategory]));
        setFormData((prev) => ({ ...prev, categoryId: newCategory.id }));
        setShowCategoryPicker(false);
        clearError("category");
        toast.success(`Category “${newCategory.name}” added`);
      } else {
        toast.error((data as any).error || data.message || "Couldn't add the category");
      }
    } catch (error) {
      console.error("Add category error:", error);
      toast.error("Couldn't add the category. Please try again.");
    }

    setAddingCategory(false);
  };

  const handleCancel = async () => {
    const dirty = JSON.stringify([formData, images]) !== startSnapshot;
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        description: "Your changes to this product will be lost.",
        confirmLabel: "Leave",
        cancelLabel: "Keep editing",
        destructive: true,
      }))
    )
      return;
    if (window.history.length > 1) router.back();
    else router.push("/vendor/products");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate — one plain message under each field that needs fixing
    const next: Record<string, string> = {};
    if (images.length === 0) next.images = "Add at least one photo — customers want to see what they are buying";
    if (!formData.name.trim()) next.name = "Add a name — customers search by it";
    const priceNum = parseFloat(formData.price);
    if (!formData.price) next.price = "Add a price — customers need it to order";
    else if (isNaN(priceNum) || priceNum < 0) next.price = "Type the price in rupees, like 120 or 99.50";
    if (formData.trackStock && formData.stockQuantity === "") next.stockQuantity = "Tell us how many you have — tap + or type a number";
    else if (formData.trackStock && parseInt(formData.stockQuantity) < 0) next.stockQuantity = "Stock can't be less than 0";
    if (!formData.categoryId) next.category = "Choose a category so customers can find it";
    if (!formData.description.trim()) next.description = "Add a short description — size, colour or brand";

    const firstKey = FIELD_ORDER.find((k) => next[k]);
    if (firstKey) {
      setErrors(next);
      toast.error(next[firstKey]);
      focusField(FIELD_IDS[firstKey]);
      return;
    }

    setLoading(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      // Send the count only if the seller changed it (or started counting) —
      // otherwise orders placed while this form was open would be undone
      const { stockQuantity: typedStock, trackStock, ...rest } = formData;
      const countChanged =
        trackStock && (typedStock !== startForm().stockQuantity || product.trackStock === false);
      const data = await apiClient.updateVendorProduct(product.id, {
        ...rest,
        images,
        price: parseFloat(formData.price),
        compareAtPrice: formData.compareAtPrice
          ? parseFloat(formData.compareAtPrice)
          : null,
        ...(trackStock !== (product.trackStock !== false) ? { trackStock } : {}),
        ...(countChanged ? { stockQuantity: parseInt(typedStock) || 0 } : {}),
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      });

      if (data.success) {
        toast.success("Changes saved");
        void refreshShopPage(product.vendorId, product.id);
        router.push("/vendor/products");
        router.refresh();
        // Keep the button busy while we leave the page (no double save)
        return;
      } else {
        toast.error((data as any).error || data.message || "Couldn't save your changes. Please try again.");
      }
    } catch (error) {
      console.error("Product update error:", error);
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const selectedCategoryName =
    localCategories.find((c) => c.id === formData.categoryId)?.name ||
    (product.category?.id === formData.categoryId ? product.category?.name : "") ||
    "";

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Photos ── */}
        <FormCard title="Photos" description="Clear photos sell faster. Add up to 5 — the first one is the main photo.">
          <div id="field-images">
            <PhotoPicker
              images={images}
              uploading={uploadingImages}
              onPick={handleImageUpload}
              onRemove={handleRemoveImage}
              error={errors.images}
            />
          </div>
        </FormCard>

        {/* ── The basics: name, price, stock, category ── */}
        <FormCard>
          <Field label="Product name" htmlFor="p-name" hint="Customers search by this name" error={errors.name}>
            <input
              id="p-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              aria-invalid={!!errors.name || undefined}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
            <Field label="Price" htmlFor="p-price" hint="What customers pay" error={errors.price}>
              <RupeeInput
                id="p-price"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                aria-invalid={!!errors.price || undefined}
                placeholder="0"
              />
            </Field>
            <Field label="Price before discount" optional htmlFor="p-mrp" hint="The MRP — shown crossed out">
              <RupeeInput
                id="p-mrp"
                type="number"
                name="compareAtPrice"
                value={formData.compareAtPrice}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0"
              />
            </Field>
          </div>

          <div className="rounded-2xl bg-fill px-3.5 py-1">
            <Toggle
              checked={formData.trackStock}
              onChange={(on) => {
                setFormData((prev) => ({ ...prev, trackStock: on }));
                clearError("stockQuantity");
              }}
              label="Count how many I have"
              description={
                formData.trackStock
                  ? "We take one off for every order and stop orders at 0."
                  : "Off: it's simply available. Switch it off in Products when it runs out. · गिनती ज़रूरी नहीं"
              }
            />
          </div>
          {formData.trackStock && (
            <Field
              label="How many do you have?"
              htmlFor="p-stock"
              hint="Pieces or packets in your shop right now"
              error={errors.stockQuantity}
            >
              <StockStepper
                id="p-stock"
                value={formData.stockQuantity}
                invalid={!!errors.stockQuantity}
                onChange={(v) => {
                  setFormData((prev) => ({ ...prev, stockQuantity: v }));
                  clearError("stockQuantity");
                }}
              />
            </Field>
          )}

          <Field label="Category" htmlFor="p-category" hint="Helps customers find it in your shop" error={errors.category}>
            <CategoryButton
              id="p-category"
              label={selectedCategoryName}
              invalid={!!errors.category}
              onClick={() => setShowCategoryPicker(true)}
            />
          </Field>
        </FormCard>

        {/* ── Description ── */}
        <FormCard>
          <Field
            label="Description"
            htmlFor="p-desc"
            hint="A line or two — size, colour, brand or how to use it"
            error={errors.description}
          >
            <textarea
              id="p-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              aria-invalid={!!errors.description || undefined}
              className={textareaClass}
            />
          </Field>
        </FormCard>

        {/* ── Show in shop ── */}
        <FormCard>
          <Toggle
            checked={formData.isActive}
            onChange={(v) => setFormData((prev) => ({ ...prev, isActive: v }))}
            label="Show in my shop"
            description={formData.isActive ? "Customers can see and order it" : "Hidden — customers can't see it"}
          />
        </FormCard>

        {/* ── Rarely used fields ── */}
        <MoreDetails open={showMore} onToggle={() => setShowMore((v) => !v)} summary={moreSummary(formData)}>
          <MoreDetailsFields formData={formData} onChange={handleChange} />
        </MoreDetails>

        <StickyBarSpacer />
        <StickyBar aboveTabBar>
          <Button variant="secondary" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={loading} disabled={loading || uploadingImages}>
            {loading ? "Saving…" : uploadingImages ? "Uploading photo…" : "Save changes"}
          </Button>
        </StickyBar>
      </form>

      <CategoryPicker
        open={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        categories={localCategories}
        selectedId={formData.categoryId}
        onSelect={selectCategory}
        onAddNew={handleAddCategory}
        adding={addingCategory}
      />
    </>
  );
}
