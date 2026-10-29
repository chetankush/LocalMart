"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronRight, FolderTree, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button, Row, Thumb } from "@/components/app/ui";
import { List, StatGrid, StatTile } from "@/components/app/seller";
import { AdminPage, EmptyBlock, LoadingBlock } from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

interface Category {
  id: string;
  name: string;
  value?: string;
  icon?: string;
  description?: string;
  gradient?: string;
  imageUrl?: string;
}

interface TemplateCount {
  categoryId: string;
  count: number;
}

/** Photo when there is one, else the category's icon (or first letter) on a grey tile */
function CategoryThumb({ category, size = 48 }: { category: Category; size?: number }) {
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

const countLabel = (n: number) => (n === 0 ? "No products yet" : `${n} ready-made ${n === 1 ? "product" : "products"}`);

export default function ProductTemplatesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch business categories
      const catResponse = await apiClient.getBusinessCategories(false);
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data);
      }

      // Fetch all templates to count per category
      const templatesResponse = await apiClient.getAdminProductTemplates({});
      if (templatesResponse.success && templatesResponse.data) {
        const counts: Record<string, number> = {};
        (templatesResponse.data as any[]).forEach((template) => {
          const catId = template.categoryId || template.category?.id;
          if (catId) {
            counts[catId] = (counts[catId] || 0) + 1;
          }
        });
        setTemplateCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Couldn't load ready-made products");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTemplates = async () => {
    const ok = await confirm({
      title: "Add sample products?",
      description: "Adds 5 ready-made products each for Grocery and Fashion. Ones that are already there are skipped.",
      confirmLabel: "Add samples",
    });
    if (!ok) return;

    setSeeding(true);
    try {
      const response = await apiClient.seedProductTemplates('all') as any;

      if (response.success) {
        const created = response.created ?? response.data?.created ?? 0;
        const skipped = response.skipped ?? response.data?.skipped ?? 0;
        toast.success(response.message || "Sample products added", {
          description: `${created} added · ${skipped} already there`,
        });
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

  const totalTemplates = Object.values(templateCounts).reduce((sum, count) => sum + count, 0);
  const categoriesWithTemplates = Object.keys(templateCounts).length;
  const categoriesWithout = categories.filter((c) => !templateCounts[c.id]).length;
  // Refetches keep the old list on screen; only the first load shows a spinner
  const firstLoad = loading && categories.length === 0;

  return (
    <AdminPage
      title="Ready-made products"
      subtitle="Common products sellers can add to their shop in one tap. Pick a category to see or change its list."
      actions={
        <Button variant="secondary" onClick={handleSeedTemplates} loading={seeding}>
          {!seeding && <Sparkles className="h-[18px] w-[18px]" aria-hidden />}
          {seeding ? "Adding…" : "Add sample products"}
        </Button>
      }
    >
      <div className="mb-6">
        <StatGrid>
          <StatTile label="Ready-made products" value={firstLoad ? "–" : totalTemplates} />
          <StatTile label="Categories with products" value={firstLoad ? "–" : categoriesWithTemplates} />
          <StatTile label="All categories" value={firstLoad ? "–" : categories.length} />
          <StatTile
            label="Categories with none"
            value={firstLoad ? "–" : categoriesWithout}
            tone={!firstLoad && categoriesWithout > 0 ? "warn" : undefined}
          />
        </StatGrid>
      </div>

      {firstLoad ? (
        <LoadingBlock label="Loading categories…" />
      ) : categories.length === 0 ? (
        <EmptyBlock
          icon={<FolderTree className="h-7 w-7" aria-hidden />}
          title="No shop categories yet"
          body="Ready-made products are grouped by shop category, so add categories first."
          action={<Button href="/admin/business-categories">Go to shop categories</Button>}
        />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const count = templateCounts[category.id] || 0;
              return (
                <Link
                  key={category.id}
                  href={`/admin/product-templates/${category.id}`}
                  className="group flex items-center gap-3 rounded-2xl bg-card p-4 transition-colors hover:bg-fill/60 active:bg-fill"
                >
                  <CategoryThumb category={category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-label">{category.name}</p>
                    <p className={`mt-0.5 truncate text-[14px] ${count === 0 ? "text-warn" : "text-label-2"}`}>
                      {countLabel(count)}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-label-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>

          {/* Phone */}
          <List className="md:hidden">
            {categories.map((category) => {
              const count = templateCounts[category.id] || 0;
              return (
                <Row
                  key={category.id}
                  href={`/admin/product-templates/${category.id}`}
                  leading={<CategoryThumb category={category} size={44} />}
                  title={<span className="font-semibold">{category.name}</span>}
                  subtitle={<span className={count === 0 ? "text-warn" : undefined}>{countLabel(count)}</span>}
                  chevron
                />
              );
            })}
          </List>
        </>
      )}
    </AdminPage>
  );
}
