"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, FolderTree, RefreshCw, Store } from "lucide-react";
import { Button, Pill, Row } from "@/components/app/ui";
import { Segmented } from "@/components/app/form";
import { IconBox, List, StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminGate,
  AdminPage,
  Avatar,
  Chips,
  EmptyBlock,
  LoadingBlock,
  StatusPill,
  TableCard,
  Toolbar,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";

type VendorInCategory = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  status: string;
  isActive: boolean;
  productCount: number;
};

type CategoryAnalytics = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  totalProducts: number;
  totalVendors: number;
  vendors: VendorInCategory[];
};

type VendorAnalytics = {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  totalProducts: number;
  categoriesUsed: number;
};

type Summary = {
  totalCategories: number;
  categoriesInUse: number;
  unusedCategories: number;
  totalProducts: number;
  totalActiveVendors: number;
};

type CategoryFilter = "all" | "used" | "unused";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

const TYPE_LABEL: Record<string, string> = {
  GROCERY: "Grocery",
  RESTAURANT: "Food",
  PHARMACY: "Medical",
  ELECTRONICS: "Electronics",
  FASHION: "Fashion",
  HOME_SERVICES: "Services",
  OTHER: "Other",
};
const typeLabel = (t: string) =>
  t ? TYPE_LABEL[t] ?? t.charAt(0) + t.slice(1).replace(/_/g, " ").toLowerCase() : "";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Thin horizontal bar: crimson fill on a grey track */
function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(value > 0 ? 4 : 0, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-fill", className)} aria-hidden>
      <div className="h-full rounded-full bg-tint transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"categories" | "vendors">("categories");
  // The category whose shops are open in the sheet
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([]);

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

  // Fetch analytics
  useEffect(() => {
    if (!authChecked) return;
    fetchAnalytics();
  }, [authChecked]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const response = await apiClient.getVendorCategoryAnalytics();
      if (response.success && response.data) {
        setSummary(response.data.summary);
        setCategoryAnalytics(response.data.categoryAnalytics);
        setVendorAnalytics(response.data.vendorAnalytics);
      } else {
        toast.error("Couldn't load the numbers. Try again.");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Couldn't load the numbers. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (!authChecked) return <AdminGate />;

  const usedCount = categoryAnalytics.filter((c) => c.totalVendors > 0).length;
  const unusedCount = categoryAnalytics.length - usedCount;
  const categories = categoryAnalytics.filter((c) =>
    categoryFilter === "used" ? c.totalVendors > 0 : categoryFilter === "unused" ? c.totalVendors === 0 : true,
  );
  const maxCategoryProducts = Math.max(0, ...categoryAnalytics.map((c) => c.totalProducts));
  const maxVendorCategories = Math.max(0, ...vendorAnalytics.map((v) => v.categoriesUsed));
  const openCategory = categoryAnalytics.find((c) => c.id === expandedCategory) ?? null;

  return (
    <AdminPage
      title="Analytics"
      subtitle="Which product categories shops use, and how many products are in each."
      actions={
        <Button variant="secondary" size="md" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={cx("h-[18px] w-[18px]", loading && "animate-spin")} aria-hidden />
          Refresh
        </Button>
      }
    >
      {summary ? (
        <div className="mb-6">
          <StatGrid>
            <StatTile
              label="Categories in use"
              value={summary.categoriesInUse}
              hint={`of ${plural(summary.totalCategories, "category", "categories")}`}
            />
            <StatTile
              label="Not used yet"
              value={summary.unusedCategories}
              hint="No shop sells here"
              tone={summary.unusedCategories > 0 ? "warn" : undefined}
            />
            <StatTile label="Products" value={summary.totalProducts.toLocaleString("en-IN")} hint="Across all categories" />
            <StatTile label="Live shops" value={summary.totalActiveVendors} hint="Open and selling" />
          </StatGrid>
        </div>
      ) : (
        loading && <div className="mb-6 h-[196px] animate-pulse rounded-2xl bg-fill md:h-[98px]" aria-hidden />
      )}

      <div className="mb-4 max-w-sm">
        <Segmented
          label="Show"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "categories", label: "By category" },
            { value: "vendors", label: "By shop" },
          ]}
        />
      </div>

      {activeTab === "categories" && categoryAnalytics.length > 0 && (
        <Toolbar>
          <Chips
            label="Filter categories"
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              { value: "all", label: "All", count: categoryAnalytics.length },
              { value: "used", label: "In use", count: usedCount },
              { value: "unused", label: "Not used yet", count: unusedCount },
            ]}
          />
        </Toolbar>
      )}

      {loading ? (
        <LoadingBlock label="Loading the numbers…" />
      ) : activeTab === "categories" ? (
        categories.length === 0 ? (
          <EmptyBlock
            icon={<FolderTree className="h-7 w-7" aria-hidden />}
            title={categoryAnalytics.length === 0 ? "No categories yet" : "Nothing here"}
            body={
              categoryAnalytics.length === 0
                ? "Product categories show up here once they are created."
                : categoryFilter === "unused"
                  ? "Every category has at least one shop selling in it."
                  : "No shop sells in any category yet."
            }
          />
        ) : (
          <>
            {/* Desktop */}
            <TableCard>
              <thead>
                <tr>
                  <th className={thClass}>Category</th>
                  <th className={cx(thClass, "w-[38%]")}>Products</th>
                  <th className={thClass}>Shops</th>
                  <th className={thClass}>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className={`${trClass} cursor-pointer`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <IconBox size={40}>
                          <span className="text-[16px] font-semibold">{category.name.charAt(0).toUpperCase()}</span>
                        </IconBox>
                        <p className="font-semibold text-label">{category.name}</p>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <Bar value={category.totalProducts} max={maxCategoryProducts} className="flex-1" />
                        <span className="w-12 text-right tabular-nums text-label">
                          {category.totalProducts.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </td>
                    <td className={tdClass}>
                      {category.totalVendors > 0 ? (
                        <span className="tabular-nums">{plural(category.totalVendors, "shop", "shops")}</span>
                      ) : (
                        <Pill tone="warn">Not used yet</Pill>
                      )}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[15px] font-medium text-tint">
                        See shops <ChevronRight className="h-4 w-4" aria-hidden />
                      </span>
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
                  onClick={() => toggleCategory(category.id)}
                  chevron
                  leading={
                    <IconBox size={40}>
                      <span className="text-[16px] font-semibold">{category.name.charAt(0).toUpperCase()}</span>
                    </IconBox>
                  }
                  title={<span className="font-semibold">{category.name}</span>}
                  subtitle={
                    <>
                      <span className="tabular-nums">
                        {plural(category.totalProducts, "product", "products")} ·{" "}
                        {category.totalVendors > 0 ? plural(category.totalVendors, "shop", "shops") : "not used yet"}
                      </span>
                      <Bar value={category.totalProducts} max={maxCategoryProducts} className="mt-2" />
                    </>
                  }
                />
              ))}
            </List>
          </>
        )
      ) : vendorAnalytics.length === 0 ? (
        <EmptyBlock
          icon={<Store className="h-7 w-7" aria-hidden />}
          title="No live shops yet"
          body="Shops show up here once they are approved and live."
        />
      ) : (
        <>
          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                <th className={thClass}>City</th>
                <th className={`${thClass} text-right`}>Products</th>
                <th className={cx(thClass, "w-[32%]")}>Categories used</th>
              </tr>
            </thead>
            <tbody>
              {vendorAnalytics.map((vendor) => (
                <tr key={vendor.id} className={trClass}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={vendor.businessName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-label">{vendor.businessName}</p>
                        <p className="text-[13px] text-label-2">{typeLabel(vendor.businessType)}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`${tdClass} text-label-2`}>{vendor.city}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{vendor.totalProducts.toLocaleString("en-IN")}</td>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Bar value={vendor.categoriesUsed} max={maxVendorCategories} className="flex-1" />
                      <span className="w-8 text-right tabular-nums text-label">{vendor.categoriesUsed}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          {/* Phone */}
          <List className="md:hidden">
            {vendorAnalytics.map((vendor) => (
              <Row
                key={vendor.id}
                leading={<Avatar name={vendor.businessName} />}
                title={<span className="font-semibold">{vendor.businessName}</span>}
                subtitle={
                  <>
                    <span className="tabular-nums">
                      {vendor.city} · {plural(vendor.categoriesUsed, "category", "categories")}
                    </span>
                    <Bar value={vendor.categoriesUsed} max={maxVendorCategories} className="mt-2" />
                  </>
                }
                trailing={
                  <span className="block text-right">
                    <span className="block text-[17px] font-semibold tabular-nums text-label">
                      {vendor.totalProducts.toLocaleString("en-IN")}
                    </span>
                    <span className="block text-[13px] text-label-2">products</span>
                  </span>
                }
              />
            ))}
          </List>
        </>
      )}

      {/* ── Shops in one category ── */}
      <Sheet
        open={!!openCategory}
        onClose={() => setExpandedCategory(null)}
        wide
        title={openCategory?.name}
        description={
          openCategory
            ? `${plural(openCategory.totalProducts, "product", "products")} from ${plural(openCategory.totalVendors, "shop", "shops")}`
            : undefined
        }
      >
        {openCategory &&
          (openCategory.vendors.length === 0 ? (
            <EmptyBlock
              icon={<Store className="h-7 w-7" aria-hidden />}
              title="No shop sells here yet"
              body="Shops that add products in this category show up here."
            />
          ) : (
            <List>
              {openCategory.vendors.map((vendor) => (
                <Row
                  key={vendor.id}
                  leading={<Avatar name={vendor.businessName} />}
                  title={<span className="font-semibold">{vendor.businessName}</span>}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{[typeLabel(vendor.businessType), vendor.city].filter(Boolean).join(" · ")}</span>
                      <StatusPill status={vendor.status} />
                    </span>
                  }
                  trailing={
                    <span className="block text-right">
                      <span className="block text-[17px] font-semibold tabular-nums text-label">{vendor.productCount}</span>
                      <span className="block text-[13px] text-label-2">
                        {vendor.productCount === 1 ? "product" : "products"}
                      </span>
                    </span>
                  }
                />
              ))}
            </List>
          ))}
      </Sheet>
    </AdminPage>
  );
}
