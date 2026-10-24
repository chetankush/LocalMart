"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FolderTree, Loader2, Package, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import { Button, Pill, Row, Thumb } from "@/components/app/ui";
import { Field, FormCard, Toggle, inputClass, selectClass, textareaClass } from "@/components/app/form";
import { IconBox, List, SectionHeader, StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminGate,
  AdminPage,
  EmptyBlock,
  LoadingBlock,
  TableCard,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

type BusinessCategory = {
  id: string;
  name: string;
  value: string;
  description: string | null;
  imageUrl: string | null;
  gradient: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
};

// Stored with each category (older screens read it). The values are data,
// not classes this page renders — the preview below stays neutral.
const gradientOptions = [
  { label: "Green", value: "from-green-500 to-emerald-500" },
  { label: "Orange/Red", value: "from-orange-500 to-red-500" },
  { label: "Blue/Cyan", value: "from-blue-500 to-cyan-500" },
  { label: "Indigo/Purple", value: "from-indigo-500 to-purple-500" },
  { label: "Pink/Rose", value: "from-pink-500 to-rose-500" },
  { label: "Amber/Orange", value: "from-amber-500 to-orange-500" },
  { label: "Gray/Slate", value: "from-gray-500 to-slate-500" },
  { label: "Purple/Pink", value: "from-purple-500 to-pink-500" },
  { label: "Teal/Cyan", value: "from-teal-500 to-cyan-500" },
  { label: "Red/Pink", value: "from-red-500 to-pink-500" },
];

/** Photo when there is one, else the category's icon (or first letter) on a grey tile */
function CategoryThumb({
  category,
  size = 48,
}: {
  category: { name: string; imageUrl?: string | null; icon?: string | null };
  size?: number;
}) {
  if (category.imageUrl) return <Thumb src={category.imageUrl} alt="" size={size} />;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-fill font-semibold text-label-2"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      aria-hidden
    >
      {category.icon || (category.name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

const iconButton =
  "flex h-10 w-10 items-center justify-center rounded-full text-label-2 transition-colors hover:bg-fill hover:text-label disabled:opacity-40 cursor-pointer";

export default function BusinessCategoriesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);
  // Phone: tapping a row opens its actions
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; value?: string }>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    value: "",
    description: "",
    imageUrl: "",
    gradient: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let isAdmin = false;

        try {
          const response = await fetch("/api/admin/check-auth");
          if (response.ok) {
            const data = await response.json();
            isAdmin = data.isAdmin;
          }
        } catch {
          const { apiClient } = await import("@/lib/api/client");
          const result = await apiClient.checkAdminAuth();
          isAdmin = result.isAdmin;
        }

        if (!isAdmin) {
          router.push("/admin/login");
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch categories
  useEffect(() => {
    if (!authChecked) return;
    fetchCategories();
  }, [authChecked]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.getAdminBusinessCategories();
      setCategories((response.data || []) as BusinessCategory[]);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Couldn't load shop categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    const ok = await confirm({
      title: "Add the default categories?",
      description: "Adds any standard shop categories that are missing. The ones you already have stay as they are.",
      confirmLabel: "Add defaults",
    });
    if (!ok) return;

    setProcessing(true);
    setSeeding(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.seedBusinessCategories();

      if (data.success) {
        toast.success(data.message || "Default categories added");
        fetchCategories();
      } else {
        toast.error("Couldn't add the default categories");
      }
    } catch (error: any) {
      console.error("Error seeding categories:", error);
      toast.error(error.message || "Couldn't add the default categories");
    } finally {
      setProcessing(false);
      setSeeding(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setErrors({});
    setFormData({
      name: "",
      value: "",
      description: "",
      imageUrl: "",
      gradient: "from-blue-500 to-cyan-500",
      icon: "",
      isActive: true,
      sortOrder: categories.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (category: BusinessCategory) => {
    setSelectedId(null);
    setEditingCategory(category);
    setErrors({});
    setFormData({
      name: category.name,
      value: category.value,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      gradient: category.gradient || "",
      icon: category.icon || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.value) {
      setErrors({
        name: formData.name ? undefined : "Add a name — sellers see it when they pick their kind of shop.",
        value: formData.value ? undefined : "Add a code, e.g. GROCERY. It's saved on each seller's shop.",
      });
      toast.error("Name and code are needed");
      return;
    }

    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");

      let data;
      if (editingCategory) {
        data = await apiClient.updateBusinessCategory(editingCategory.id, formData);
      } else {
        data = await apiClient.createBusinessCategory(formData);
      }

      if (data.success) {
        toast.success(data.message || (editingCategory ? "Category saved" : "Category added"));
        setShowModal(false);
        fetchCategories();
      } else {
        toast.error("Couldn't save this category");
      }
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Couldn't save this category");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const name = categories.find((c) => c.id === id)?.name;
    const ok = await confirm({
      title: name ? `Delete “${name}”?` : "Delete this category?",
      description: "Sellers can no longer pick it when they sign up. This can't be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;

    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.deleteBusinessCategory(id);

      if (data.success) {
        toast.success(data.message || "Category deleted");
        setSelectedId(null);
        fetchCategories();
      } else {
        toast.error("Couldn't delete this category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Couldn't delete this category");
    } finally {
      setProcessing(false);
    }
  };

  const toggleActive = async (category: BusinessCategory) => {
    setProcessing(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.updateBusinessCategory(category.id, {
        isActive: !category.isActive,
      });

      if (data.success) {
        toast.success(category.isActive ? `${category.name} is hidden from sellers` : `${category.name} is shown to sellers`);
        fetchCategories();
      } else {
        toast.error("Couldn't change this category");
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast.error(error.message || "Couldn't change this category");
    } finally {
      setProcessing(false);
    }
  };

  if (!authChecked) return <AdminGate />;

  // Refetches keep the old list on screen; only the first load shows a spinner
  const firstLoad = loading && categories.length === 0;
  const shown = categories.filter((c) => c.isActive).length;
  const noPhoto = categories.filter((c) => !c.imageUrl).length;
  const selected = categories.find((c) => c.id === selectedId) ?? null;
  const templatesHref = (id: string) => `/admin/product-templates/${id}`;

  return (
    <AdminPage
      title="Shop categories"
      subtitle="The kinds of shop sellers choose from when they sign up."
      actions={
        <>
          <Button variant="secondary" href="/admin/business-categories/seed-expanded">
            Starter list
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="h-5 w-5" aria-hidden />
            Add category
          </Button>
        </>
      }
    >
      <div className="mb-6">
        <StatGrid>
          <StatTile label="Categories" value={firstLoad ? "–" : categories.length} />
          <StatTile label="Shown to sellers" value={firstLoad ? "–" : shown} tone={shown > 0 ? "ok" : undefined} />
          <StatTile label="Hidden" value={firstLoad ? "–" : categories.length - shown} />
          <StatTile label="Without a photo" value={firstLoad ? "–" : noPhoto} tone={noPhoto > 0 ? "warn" : undefined} />
        </StatGrid>
      </div>

      {firstLoad ? (
        <LoadingBlock label="Loading categories…" />
      ) : categories.length === 0 ? (
        <EmptyBlock
          icon={<FolderTree className="h-7 w-7" aria-hidden />}
          title="No shop categories yet"
          body="Add the standard ones in one tap, or pick from the starter list with photos."
          action={
            <Button variant="secondary" onClick={handleSeed} loading={seeding} disabled={processing}>
              <Sparkles className="h-[18px] w-[18px]" aria-hidden />
              Add default categories
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Category</th>
                <th className={thClass}>Code</th>
                <th className={`${thClass} text-right`}>Order</th>
                <th className={thClass}>Shown to sellers</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className={`${trClass} cursor-pointer`}
                  onClick={() => router.push(templatesHref(category.id))}
                >
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <CategoryThumb category={category} />
                      <div className="min-w-0">
                        <p className="font-semibold text-label">{category.name}</p>
                        <p className="max-w-xs truncate text-[13px] text-label-2">
                          {category.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <span className="rounded-lg bg-fill px-2 py-1 font-mono text-[13px] text-label-2">{category.value}</span>
                  </td>
                  <td className={`${tdClass} text-right tabular-nums text-label-2`}>{category.sortOrder}</td>
                  <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                    <div className="w-[132px]">
                      <Toggle
                        checked={category.isActive}
                        onChange={() => toggleActive(category)}
                        disabled={processing}
                        label={<span className="text-[15px] text-label-2">{category.isActive ? "Shown" : "Hidden"}</span>}
                      />
                    </div>
                  </td>
                  <td className={`${tdClass} text-right`} onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className={iconButton}
                        aria-label={`Edit ${category.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category.id)}
                        disabled={processing}
                        className={`${iconButton} hover:bg-bad-soft hover:text-bad`}
                        aria-label={`Delete ${category.name}`}
                        title="Delete"
                      >
                        <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(templatesHref(category.id))}
                        className="ml-2 inline-flex h-10 items-center gap-0.5 whitespace-nowrap rounded-full px-2 text-[15px] font-medium text-tint hover:bg-tint-soft cursor-pointer"
                      >
                        Products <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          {/* Phone */}
          <List className="md:hidden">
            {categories.map((category) => (
              <Row
                key={category.id}
                onClick={() => setSelectedId(category.id)}
                leading={<CategoryThumb category={category} />}
                title={<span className="font-semibold">{category.name}</span>}
                subtitle={`${category.value} · order ${category.sortOrder}`}
                trailing={<Pill tone={category.isActive ? "ok" : "neutral"}>{category.isActive ? "Shown" : "Hidden"}</Pill>}
              />
            ))}
          </List>
        </>
      )}

      {/* Related tools */}
      <section className="mt-8">
        <SectionHeader title="More" />
        <List>
          {categories.length > 0 && (
            <Row
              onClick={processing ? undefined : handleSeed}
              leading={
                <IconBox tone="brand" size={40}>
                  <Sparkles className="h-5 w-5" />
                </IconBox>
              }
              title={<span className="font-semibold">Fill in missing defaults</span>}
              subtitle="Adds the standard categories that aren't in the list yet."
              trailing={seeding ? <Loader2 className="h-5 w-5 animate-spin text-tint" aria-hidden /> : undefined}
            />
          )}
          <Row
            href="/admin/product-templates"
            leading={
              <IconBox tone="brand" size={40}>
                <Package className="h-5 w-5" />
              </IconBox>
            }
            title={<span className="font-semibold">Ready-made products</span>}
            subtitle="Common products sellers can add in one tap, per category."
            chevron
          />
        </List>
      </section>

      {/* ── Category actions (phone) ── */}
      <Sheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.name}
        description={selected ? `Code ${selected.value} · order ${selected.sortOrder}` : undefined}
      >
        {selected && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-card px-4">
              <Toggle
                checked={selected.isActive}
                onChange={() => toggleActive(selected)}
                disabled={processing}
                label="Shown to sellers"
                description="Sellers can pick it when they sign up."
              />
            </div>
            <List>
              <Row
                href={templatesHref(selected.id)}
                leading={
                  <IconBox tone="brand" size={40}>
                    <Package className="h-5 w-5" />
                  </IconBox>
                }
                title={<span className="font-semibold">Ready-made products</span>}
                subtitle="See or change this category's list"
                chevron
              />
              <Row
                onClick={() => openEditModal(selected)}
                leading={
                  <IconBox tone="neutral" size={40}>
                    <Pencil className="h-5 w-5" />
                  </IconBox>
                }
                title={<span className="font-semibold">Edit category</span>}
                subtitle="Name, photo, icon and order"
              />
            </List>
            <List>
              <Row
                onClick={processing ? undefined : () => handleDelete(selected.id)}
                leading={
                  <IconBox tone="bad" size={40}>
                    <Trash2 className="h-5 w-5" />
                  </IconBox>
                }
                title={<span className="font-semibold text-bad">Delete category</span>}
                subtitle="Removes it for good"
              />
            </List>
          </div>
        )}
      </Sheet>

      {/* ── Add / edit ── */}
      <Sheet
        open={showModal}
        onClose={() => setShowModal(false)}
        wide
        title={editingCategory ? "Edit category" : "Add category"}
        description={editingCategory ? editingCategory.name : "A new kind of shop sellers can choose."}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" className="flex-[1.6]" loading={processing}>
              {editingCategory ? "Save changes" : "Add category"}
            </Button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} noValidate>
          <FormCard title="About the category">
            <Field label="Name" htmlFor="cat-name" hint="Sellers see this, e.g. “Grocery / Kirana Store”." error={errors.name}>
              <input
                id="cat-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                aria-invalid={!!errors.name}
                className={inputClass}
                placeholder="e.g. Grocery / Kirana Store"
              />
            </Field>
            <Field
              label="Code"
              htmlFor="cat-value"
              hint="Saved on each seller's shop. Capital letters and underscores, e.g. HOME_SERVICES."
              error={errors.value}
            >
              <input
                id="cat-value"
                type="text"
                value={formData.value}
                onChange={(e) => {
                  setFormData({ ...formData, value: e.target.value.toUpperCase() });
                  if (errors.value) setErrors({ ...errors, value: undefined });
                }}
                aria-invalid={!!errors.value}
                autoCapitalize="characters"
                className={`${inputClass} font-mono uppercase`}
                placeholder="e.g. GROCERY"
              />
            </Field>
            <Field label="Description" htmlFor="cat-description" optional>
              <textarea
                id="cat-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className={textareaClass}
                placeholder="e.g. Kirana, supermarket, daily essentials"
              />
            </Field>
          </FormCard>

          <FormCard title="Photo" description="Upload a photo or paste a link. Square works best, about 400 × 400.">
            <ImageUploader
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url })}
              uploadType="categories"
              previewSize="md"
              allowUrlInput={true}
            />
          </FormCard>

          <FormCard title="Icon and order">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Icon" htmlFor="cat-icon" hint="One emoji, shown when there's no photo." optional>
                <input
                  id="cat-icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className={inputClass}
                  placeholder="🛒"
                />
              </Field>
              <Field label="Order" htmlFor="cat-order" hint="Lower numbers come first.">
                <input
                  id="cat-order"
                  type="number"
                  inputMode="numeric"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className={`${inputClass} tabular-nums`}
                />
              </Field>
            </div>
            <Field label="Colour" htmlFor="cat-gradient" hint="Saved with the category for screens that still use it." optional>
              <select
                id="cat-gradient"
                value={formData.gradient}
                onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                className={selectClass}
              >
                <option value="">No colour</option>
                {gradientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Neutral preview of how the category reads in a list */}
            <div>
              <p className="mb-1.5 text-[15px] font-semibold text-label">Preview</p>
              <div className="flex items-center gap-3 rounded-2xl bg-fill p-3">
                <CategoryThumb category={formData} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-label">{formData.name || "Category name"}</p>
                  <p className="truncate text-[14px] text-label-2">{formData.description || "Short description"}</p>
                </div>
              </div>
            </div>
          </FormCard>

          <FormCard>
            <Toggle
              checked={formData.isActive}
              onChange={(next) => setFormData({ ...formData, isActive: next })}
              label="Shown to sellers"
              description="Sellers can pick it when they sign up. Turn off to hide it."
            />
          </FormCard>
        </form>
      </Sheet>
    </AdminPage>
  );
}
