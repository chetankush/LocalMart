"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { FolderTree, Package, Pencil, Plus, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button, Pill, Row, Thumb, rupees } from "@/components/app/ui";
import { Field, FormCard, RupeeInput, Toggle, inputClass, textareaClass } from "@/components/app/form";
import { List, StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminGate,
  AdminPage,
  EmptyBlock,
  SearchField,
  TableCard,
  Toolbar,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

interface Category {
  id: string;
  name: string;
  value?: string;
  icon?: string;
  description?: string;
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
    value?: string;
  };
  createdAt: string;
}

const BACK = { href: "/admin/product-templates", label: "Ready-made products" };

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-fill hover:text-label disabled:opacity-40 cursor-pointer";

const usedLabel = (n: number) => (n === 0 ? "Not used yet" : `Used ${n} ${n === 1 ? "time" : "times"}`);

export default function CategoryTemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const categoryId = params.categoryId as string;
  const confirm = useConfirm();

  const [category, setCategory] = useState<Category | null>(null);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    suggestedImage: "",
    suggestedPrice: "",
    suggestedWeight: "",
    isPopular: false,
    tags: "",
  });

  // Admins only — same server check as the other admin pages (the old
  // localStorage flag was only set by the admin sign-in form)
  useEffect(() => {
    fetch("/api/admin/check-auth")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => {
        if (!d.isAdmin) router.push("/admin/login");
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all business categories to find this one
      const catResponse = await apiClient.getBusinessCategories(false);
      if (catResponse.success && catResponse.data) {
        const found = catResponse.data.find((c: Category) => c.id === categoryId);
        if (found) {
          setCategory(found);
        }
      }

      // Fetch templates for this category
      const templatesResponse = await apiClient.getAdminProductTemplates({ categoryId });
      if (templatesResponse.success && templatesResponse.data) {
        setTemplates(templatesResponse.data as ProductTemplate[]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Couldn't load ready-made products");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setErrors({});
    setFormData({
      name: "",
      description: "",
      suggestedImage: "",
      suggestedPrice: "",
      suggestedWeight: "",
      isPopular: false,
      tags: "",
    });
    setShowModal(true);
  };

  const openEditModal = (template: ProductTemplate) => {
    setEditingTemplate(template);
    setErrors({});
    setFormData({
      name: template.name,
      description: template.description,
      suggestedImage: template.suggestedImage || "",
      suggestedPrice: template.suggestedPrice?.toString() || "",
      suggestedWeight: template.suggestedWeight?.toString() || "",
      isPopular: template.isPopular,
      tags: template.tags?.join(", ") || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      setErrors({
        name: formData.name ? undefined : "Add a name, e.g. “Rice (1 kg)”.",
        description: formData.description ? undefined : "Add a short description — sellers can change it later.",
      });
      toast.error("Name and description are needed");
      return;
    }

    setProcessing(true);
    try {
      const data = {
        categoryId: categoryId,
        name: formData.name,
        description: formData.description,
        suggestedImage: formData.suggestedImage || undefined,
        suggestedPrice: formData.suggestedPrice ? parseFloat(formData.suggestedPrice) : undefined,
        suggestedWeight: formData.suggestedWeight ? parseFloat(formData.suggestedWeight) : undefined,
        isPopular: formData.isPopular,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
      };

      let response;
      if (editingTemplate) {
        response = await apiClient.updateProductTemplate(editingTemplate.id, data);
      } else {
        response = await apiClient.createProductTemplate(data);
      }

      if (response.success) {
        toast.success(editingTemplate ? "Product saved" : "Product added");
        setShowModal(false);
        fetchData();
      } else {
        toast.error("Couldn't save this product");
      }
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast.error(error.message || "Couldn't save this product");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const name = templates.find((t) => t.id === id)?.name;
    const ok = await confirm({
      title: name ? `Delete “${name}”?` : "Delete this product?",
      description: "Sellers won't see it in the ready-made list any more. This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    try {
      const response = await apiClient.deleteProductTemplate(id);
      if (response.success) {
        toast.success("Product deleted");
        if (editingTemplate?.id === id) setShowModal(false);
        fetchData();
      } else {
        toast.error("Couldn't delete this product");
      }
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error(error.message || "Couldn't delete this product");
    }
  };

  const handleSeedExamples = async () => {
    const ok = await confirm({
      title: `Add sample products to ${category?.name ?? "this category"}?`,
      description: "Adds a few common products to get you started. Ones that are already here are skipped.",
      confirmLabel: "Add samples",
    });
    if (!ok) return;

    setSeeding(true);
    try {
      const response = await apiClient.seedCategoryTemplates(categoryId) as any;
      if (response.success) {
        const created = response.created ?? 0;
        const skipped = response.skipped ?? 0;
        if (created === 0 && skipped > 0) {
          toast.info("All the sample products are already here.");
        } else if (created === 0 && skipped === 0) {
          toast.info(`There are no sample products for ${category?.name} yet. Add them by hand.`);
        } else {
          toast.success(response.message || "Sample products added", {
            description: `${created} added · ${skipped} already there`,
          });
        }
        fetchData();
      } else {
        toast.error("Couldn't add sample products");
      }
    } catch (error: any) {
      console.error("Error seeding templates:", error);
      toast.error(error.message || "Couldn't add sample products");
    } finally {
      setSeeding(false);
    }
  };

  // Refetches (after saving) keep the page on screen; only the first load waits
  if (loading && !category) return <AdminGate label="Loading products…" />;

  if (!category) {
    return (
      <AdminPage title="Category not found" back={BACK}>
        <EmptyBlock
          icon={<FolderTree className="h-7 w-7" aria-hidden />}
          title="We couldn't find this category"
          body="It may have been deleted. Pick another one from the list."
          action={
            <Button variant="secondary" href={BACK.href}>
              See all categories
            </Button>
          }
        />
      </AdminPage>
    );
  }

  const q = search.trim().toLowerCase();
  const shown = q
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q)),
      )
    : templates;
  const popularCount = templates.filter((t) => t.isPopular).length;
  const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
  const noPhoto = templates.filter((t) => !t.suggestedImage).length;
  const price = (t: ProductTemplate) => (t.suggestedPrice ? rupees(t.suggestedPrice) : null);

  return (
    <AdminPage
      title={category.name}
      subtitle={`${templates.length} ready-made ${templates.length === 1 ? "product" : "products"} sellers can add in one tap.`}
      back={BACK}
      actions={
        <>
          <Button variant="secondary" onClick={handleSeedExamples} loading={seeding}>
            {seeding ? "Adding…" : "Add samples"}
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="h-5 w-5" aria-hidden />
            Add product
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <StatGrid>
          <StatTile label="Products" value={templates.length} />
          <StatTile label="Popular" value={popularCount} hint="Shown first to sellers" />
          <StatTile label="Times used" value={totalUsage} hint="Added by sellers" />
          <StatTile label="Without a photo" value={noPhoto} tone={noPhoto > 0 ? "warn" : undefined} />
        </StatGrid>
      </div>

      {templates.length === 0 ? (
        <EmptyBlock
          icon={<Package className="h-7 w-7" aria-hidden />}
          title="No ready-made products yet"
          body="Add a few sample products to get started, or add your own."
          action={
            <Button variant="secondary" onClick={handleSeedExamples} loading={seeding}>
              {!seeding && <Sparkles className="h-[18px] w-[18px]" aria-hidden />}
              Add sample products
            </Button>
          }
        />
      ) : (
        <>
          <Toolbar>
            <SearchField value={search} onChange={setSearch} placeholder="Search products or tags" />
          </Toolbar>

          {shown.length === 0 ? (
            <EmptyBlock
              icon={<Search className="h-7 w-7" aria-hidden />}
              title="Nothing matches"
              body={`No product in ${category.name} matches “${search.trim()}”.`}
              action={
                <Button variant="secondary" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop */}
              <TableCard>
                <thead>
                  <tr>
                    <th className={thClass}>Product</th>
                    <th className={`${thClass} text-right`}>Suggested price</th>
                    <th className={thClass}>Tags</th>
                    <th className={`${thClass} text-right`}>Used</th>
                    <th className={thClass}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((template) => (
                    <tr key={template.id} className={`${trClass} cursor-pointer`} onClick={() => openEditModal(template)}>
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                          <Thumb src={template.suggestedImage} alt="" size={44} />
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 font-semibold text-label">
                              {template.name}
                              {template.isPopular && (
                                <Pill tone="brand" icon={<Star className="h-3.5 w-3.5" aria-hidden />}>
                                  Popular
                                </Pill>
                              )}
                            </p>
                            <p className="line-clamp-1 max-w-md text-[13px] text-label-2">{template.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right tabular-nums`}>
                        {price(template) ?? <span className="text-label-3">—</span>}
                      </td>
                      <td className={tdClass}>
                        {template.tags?.length ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {template.tags.slice(0, 3).map((tag, i) => (
                              <Pill key={i}>{tag}</Pill>
                            ))}
                            {template.tags.length > 3 && (
                              <span className="text-[13px] text-label-2">+{template.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-label-3">—</span>
                        )}
                      </td>
                      <td className={`${tdClass} whitespace-nowrap text-right tabular-nums text-label-2`}>
                        {template.usageCount} {template.usageCount === 1 ? "time" : "times"}
                      </td>
                      <td className={`${tdClass} text-right`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(template)}
                            className={iconButton}
                            aria-label={`Edit ${template.name}`}
                            title="Edit"
                          >
                            <Pencil className="h-[18px] w-[18px]" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(template.id)}
                            className={`${iconButton} hover:bg-bad-soft hover:text-bad`}
                            aria-label={`Delete ${template.name}`}
                            title="Delete"
                          >
                            <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableCard>

              {/* Phone */}
              <List className="md:hidden">
                {shown.map((template) => (
                  <Row
                    key={template.id}
                    onClick={() => openEditModal(template)}
                    leading={<Thumb src={template.suggestedImage} alt="" size={48} />}
                    title={<span className="font-semibold">{template.name}</span>}
                    subtitle={
                      <span className="tabular-nums">
                        {price(template) ?? "No price"} · {usedLabel(template.usageCount)}
                      </span>
                    }
                    trailing={
                      template.isPopular ? (
                        <Pill tone="brand" icon={<Star className="h-3.5 w-3.5" aria-hidden />}>
                          Popular
                        </Pill>
                      ) : undefined
                    }
                  />
                ))}
              </List>
            </>
          )}
        </>
      )}

      {/* ── Add / edit ── */}
      <Sheet
        open={showModal}
        onClose={() => setShowModal(false)}
        wide
        title={editingTemplate ? "Edit product" : "Add product"}
        description={`In ${category.name}`}
        footer={
          <div className="flex items-center gap-3">
            {editingTemplate && (
              <Button
                variant="danger"
                className="px-3"
                onClick={() => handleDelete(editingTemplate.id)}
                disabled={processing}
                aria-label="Delete product"
              >
                <Trash2 className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="template-form" className="flex-[1.6]" loading={processing}>
              {editingTemplate ? "Save changes" : "Add product"}
            </Button>
          </div>
        }
      >
        <form
          id="template-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <FormCard title="Product">
            <Field label="Name" htmlFor="tpl-name" error={errors.name}>
              <input
                id="tpl-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                aria-invalid={!!errors.name}
                className={inputClass}
                placeholder="e.g. Rice (1 kg)"
              />
            </Field>
            <Field label="Description" htmlFor="tpl-description" error={errors.description}>
              <textarea
                id="tpl-description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                rows={3}
                aria-invalid={!!errors.description}
                className={textareaClass}
                placeholder="What it is, in a line or two"
              />
            </Field>
          </FormCard>

          <FormCard title="Photo">
            <Field label="Photo link" htmlFor="tpl-image" hint="Paste a link to the photo (starts with https://)." optional>
              <div className="flex items-center gap-3">
                <Thumb src={formData.suggestedImage || null} alt="" size={48} />
                <input
                  id="tpl-image"
                  type="url"
                  inputMode="url"
                  value={formData.suggestedImage}
                  onChange={(e) => setFormData({ ...formData, suggestedImage: e.target.value })}
                  className={`${inputClass} min-w-0 flex-1`}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </Field>
          </FormCard>

          <FormCard title="Price and weight" description="Suggestions only — each seller sets their own.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Suggested price" htmlFor="tpl-price" optional>
                <RupeeInput
                  id="tpl-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.suggestedPrice}
                  onChange={(e) => setFormData({ ...formData, suggestedPrice: e.target.value })}
                  placeholder="0"
                />
              </Field>
              <Field label="Weight" htmlFor="tpl-weight" optional>
                <div className="relative">
                  <input
                    id="tpl-weight"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={formData.suggestedWeight}
                    onChange={(e) => setFormData({ ...formData, suggestedWeight: e.target.value })}
                    className={`${inputClass} pr-12 tabular-nums`}
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">kg</span>
                </div>
              </Field>
            </div>
          </FormCard>

          <FormCard>
            <Field label="Search words" htmlFor="tpl-tags" hint="Separate with commas, e.g. rice, grains, kirana." optional>
              <input
                id="tpl-tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className={inputClass}
                placeholder="rice, grains, kirana"
              />
            </Field>
            <Toggle
              checked={formData.isPopular}
              onChange={(next) => setFormData({ ...formData, isPopular: next })}
              label="Popular"
              description="Shown first to sellers when they add products."
            />
          </FormCard>
        </form>
      </Sheet>
    </AdminPage>
  );
}
