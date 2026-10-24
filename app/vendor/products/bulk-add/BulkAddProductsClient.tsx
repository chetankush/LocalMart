"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Layers, Package, Pencil, Search } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import ImageUploader from "@/components/ImageUploader";
import { Button, LargeTitle, Pill, StickyBar, StickyBarSpacer, Thumb, rupees } from "@/components/app/ui";
import { Field, RupeeInput, inputClass, textareaClass } from "@/components/app/form";
import { Sheet } from "@/components/app/Sheet";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] cursor-pointer",
        active ? "bg-label font-semibold text-white" : "bg-card font-medium text-label-2 hover:text-label",
      )}
    >
      {children}
    </button>
  );
}

function Message({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl bg-card px-6 py-10 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fill text-label-2">
        <Package className="h-8 w-8" aria-hidden />
      </span>
      <p className="text-[20px] font-semibold leading-tight text-label">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-xs text-[16px] leading-snug text-label-2">{body}</p>}
      {action && <div className="mx-auto mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

/**
 * Pick many ready-made products in one go. Phone first: tick a row, set your
 * price and stock right there, then one button at the bottom adds them all.
 */
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
  // Turned on after a failed "Add" so rows without a price are marked
  const [showPriceErrors, setShowPriceErrors] = useState(false);

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
      toast.error("Tick at least one product to add");
      return;
    }

    // A ₹0 product can't be ordered — ask for the price before sending anything
    const noPrice = Array.from(selectedProducts.values()).filter((p) => !(p.price > 0));
    if (noPrice.length > 0) {
      setShowPriceErrors(true);
      toast.error(
        noPrice.length === 1
          ? `Add a price for ${noPrice[0].customName || noPrice[0].name} — customers need it to order`
          : `Add a price for ${noPrice.length} products — customers need it to order`,
      );
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
      toast.success(`Added ${successCount} product${successCount === 1 ? "" : "s"} to your shop`, {
        description: failCount > 0 ? `${failCount} couldn't be added — please try those again.` : undefined,
      });
      router.push("/vendor/products");
    } else {
      toast.error("Couldn't add the products. Check your internet and try again.");
    }
  };

  const count = selectedProducts.size;
  const allShownSelected = count === filteredTemplates.length && filteredTemplates.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3 pb-8 sm:pt-6 lg:max-w-5xl lg:px-8">
      <LargeTitle
        title="Add many at once"
        back={{ href: "/vendor/products", label: "Products" }}
        subtitle={
          <>
            Tick the products you sell, set your price, and add them all together.
            <span className="mt-0.5 block text-[15px]">एक साथ कई सामान जोड़ें</span>
          </>
        }
      />

      {/* Search */}
      <div className="relative mb-3">
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
          className={cx(inputClass, "pl-11")}
        />
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide" role="group" aria-label="Category">
          <Chip active={selectedCategory === "all"} onClick={() => onCategoryChange("all")}>
            All
          </Chip>
          {categories.map((cat) => (
            <Chip key={cat.id} active={selectedCategory === cat.id} onClick={() => onCategoryChange(cat.id)}>
              {cat.name}
            </Chip>
          ))}
        </div>
      )}

      {/* Count + select all */}
      {filteredTemplates.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <p className="text-[15px] text-label-2 tabular-nums">
            {filteredTemplates.length} product{filteredTemplates.length === 1 ? "" : "s"}
            {count > 0 && <span className="font-medium text-label"> · {count} ticked</span>}
          </p>
          <button
            type="button"
            onClick={handleSelectAll}
            className="-my-2 flex min-h-[44px] items-center text-[15px] font-medium text-tint cursor-pointer"
          >
            {allShownSelected ? "Untick all" : "Tick all"}
          </button>
        </div>
      )}

      {/* Products by category */}
      {Object.keys(groupedTemplates).length === 0 ? (
        allTemplatesCount === 0 ? (
          <Message
            title="No ready-made products yet"
            body="LocalMart is still setting up this list. You can add your products one by one for now."
            action={
              <Button href="/vendor/products/new" full>
                Add a product
              </Button>
            }
          />
        ) : searchQuery ? (
          <Message
            title={`Nothing matches “${searchQuery}”`}
            body="Try another word, or clear the search."
            action={
              <Button variant="secondary" full onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <Message
            title="Nothing in this category yet"
            body={`There are ${allTemplatesCount} products in other categories.`}
            action={
              <Button variant="secondary" full onClick={() => onCategoryChange("all")}>
                Show all products
              </Button>
            }
          />
        )
      ) : (
        Object.entries(groupedTemplates).map(([categoryName, categoryTemplates]) => {
          const allSelected = categoryTemplates.every((t) => selectedProducts.has(t.id));

          return (
            <section key={categoryName} className="mb-6">
              <div className="flex items-end justify-between gap-3 px-1 pb-2">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">
                  {categoryName} · {categoryTemplates.length}
                </h2>
                <button
                  type="button"
                  onClick={() => handleSelectCategory(categoryName)}
                  className="-my-2 flex min-h-[44px] items-center text-[15px] font-medium text-tint cursor-pointer"
                >
                  {allSelected ? "Untick all" : "Tick all"}
                </button>
              </div>

              <ul className="grid gap-3 lg:grid-cols-2 lg:items-start">
                {categoryTemplates.map((template) => {
                  const isSelected = selectedProducts.has(template.id);
                  const selectedProduct = selectedProducts.get(template.id);
                  const name = selectedProduct?.customName || template.name;
                  const image = selectedProduct?.customImage || template.suggestedImage;
                  const customized =
                    selectedProduct &&
                    (selectedProduct.customName || selectedProduct.customDescription || selectedProduct.customImage);
                  const priceMissing = showPriceErrors && !!selectedProduct && !(selectedProduct.price > 0);

                  return (
                    <li
                      key={template.id}
                      className={cx("overflow-hidden rounded-2xl bg-card", isSelected && "ring-2 ring-tint")}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleProduct(template)}
                        aria-pressed={isSelected}
                        className="flex min-h-[80px] w-full items-center gap-3 p-3 text-left transition-colors active:bg-fill cursor-pointer sm:p-4"
                      >
                        <span
                          aria-hidden
                          className={cx(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                            isSelected ? "border-tint bg-tint text-white" : "border-label/25 bg-card",
                          )}
                        >
                          {isSelected && <Check className="h-[18px] w-[18px]" strokeWidth={3} />}
                        </span>
                        <Thumb src={image} alt={name} size={56} />
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-[16px] font-semibold leading-snug text-label">
                            {name}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-label-2">
                            {template.suggestedPrice ? (
                              <span className="tabular-nums">{rupees(template.suggestedPrice)} usual price</span>
                            ) : (
                              <span>Set your price</span>
                            )}
                            {template.suggestedWeight ? (
                              <span className="tabular-nums">· {template.suggestedWeight} kg</span>
                            ) : null}
                            {template.isPopular && <Pill tone="brand">Popular</Pill>}
                          </span>
                        </span>
                      </button>

                      {/* Price & stock (editable when ticked) */}
                      {isSelected && selectedProduct && (
                        <div className="border-t border-hairline p-3 sm:p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <Field
                              label="Your price"
                              htmlFor={`price-${template.id}`}
                              error={priceMissing ? "Add a price" : undefined}
                            >
                              <RupeeInput
                                id={`price-${template.id}`}
                                type="number"
                                min="0"
                                placeholder="0"
                                aria-invalid={priceMissing || undefined}
                                value={selectedProduct.price || ""}
                                onChange={(e) =>
                                  handleUpdateProduct(template.id, "price", parseFloat(e.target.value) || 0)
                                }
                              />
                            </Field>
                            <Field label="In stock" htmlFor={`stock-${template.id}`}>
                              <input
                                id={`stock-${template.id}`}
                                type="number"
                                inputMode="numeric"
                                min="0"
                                value={selectedProduct.stockQuantity}
                                onChange={(e) =>
                                  handleUpdateProduct(template.id, "stockQuantity", parseInt(e.target.value) || 0)
                                }
                                className={cx(inputClass, "tabular-nums")}
                              />
                            </Field>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(selectedProduct)}
                              className="-ml-1 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-1 text-[15px] font-medium text-tint cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                              Change name or photo
                            </button>
                            {customized && <Pill tone="ok">Changed</Pill>}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {/* One button adds everything ticked (nothing to tick → no bar) */}
      {allTemplatesCount > 0 && <StickyBarSpacer />}
      {allTemplatesCount > 0 && (
      <StickyBar aboveTabBar>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {count > 0 ? (
            <>
              <span className="text-[16px] font-semibold tabular-nums text-label">{count} ticked</span>
              <button
                type="button"
                onClick={() => setSelectedProducts(new Map())}
                disabled={loading}
                className="flex min-h-[44px] items-center px-2 text-[15px] font-medium text-tint disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>
            </>
          ) : (
            <span className="text-[15px] leading-snug text-label-2">Tick the products you sell</span>
          )}
        </div>
        <Button onClick={handleBulkAdd} loading={loading} disabled={loading || count === 0} className="shrink-0">
          {loading ? (
            `Adding ${addedCount} of ${count}…`
          ) : (
            <>
              <Layers className="h-5 w-5" aria-hidden />
              {count > 0 ? `Add ${count} product${count === 1 ? "" : "s"}` : "Add products"}
            </>
          )}
        </Button>
      </StickyBar>
      )}

      {/* Change name / photo before adding */}
      <Sheet
        open={editModalOpen && !!editingProduct}
        onClose={closeEditModal}
        wide
        title="Change details"
        description="Make it match what you sell. This only changes it for your shop."
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveEditedProduct}>
              Save
            </Button>
          </div>
        }
      >
        {editingProduct && (
          <>
            <section className="mb-3 space-y-5 rounded-2xl bg-card p-4 sm:p-5">
              <Field label="Photo" hint="Use your own photo or keep this one. A square photo looks best.">
                <ImageUploader
                  value={editForm.image}
                  onChange={(url) => setEditForm({ ...editForm, image: url })}
                  uploadType="product"
                  placeholder="Upload product image or paste URL"
                  previewSize="md"
                  allowUrlInput={true}
                />
              </Field>

              <Field label="Name" htmlFor="bulk-edit-name">
                <input
                  id="bulk-edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Tata Salt 1 kg"
                />
              </Field>

              <Field label="About this product" htmlFor="bulk-edit-description">
                <textarea
                  id="bulk-edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className={textareaClass}
                  placeholder="Size, brand, colour — what customers should know"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Field label="Price" htmlFor="bulk-edit-price">
                  <RupeeInput
                    id="bulk-edit-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={editForm.price || ""}
                    onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="In stock" htmlFor="bulk-edit-stock">
                  <input
                    id="bulk-edit-stock"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={editForm.stockQuantity}
                    onChange={(e) => setEditForm({ ...editForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className={cx(inputClass, "tabular-nums")}
                  />
                </Field>
                <Field label="Weight (kg)" htmlFor="bulk-edit-weight" optional className="col-span-2 sm:col-span-1">
                  <input
                    id="bulk-edit-weight"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={editForm.weight || ""}
                    onChange={(e) => setEditForm({ ...editForm, weight: parseFloat(e.target.value) || 0 })}
                    className={cx(inputClass, "tabular-nums")}
                  />
                </Field>
              </div>
            </section>

            {/* Where it started */}
            <p className="px-1 text-[14px] leading-snug text-label-2">
              Started from: {editingProduct.name}
              {editingProduct.suggestedPrice ? ` · ${rupees(editingProduct.suggestedPrice)} usual price` : ""}
              {editingProduct.category?.name ? ` · ${editingProduct.category.name}` : ""}
            </p>
          </>
        )}
      </Sheet>
    </div>
  );
}
