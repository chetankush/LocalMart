"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button, Notice, Pill, Row, Thumb, type Tone } from "@/components/app/ui";
import { List, SectionHeader } from "@/components/app/seller";
import { AdminPage } from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

// Expanded categories based on the old landing page categories
const EXPANDED_CATEGORIES = [
  {
    name: "Grocery & Daily Needs",
    value: "GROCERY",
    description: "Kirana, supermarket, daily essentials",
    icon: "🛒",
    gradient: "from-green-500 to-emerald-500",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop",
    sortOrder: 1,
  },
  {
    name: "Restaurant & Food",
    value: "RESTAURANT",
    description: "Restaurant, cafe, food delivery",
    icon: "🍽️",
    gradient: "from-orange-500 to-red-500",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
    sortOrder: 2,
  },
  {
    name: "Pharmacy & Medical",
    value: "PHARMACY",
    description: "Medicine, healthcare products",
    icon: "💊",
    gradient: "from-blue-500 to-cyan-500",
    imageUrl: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop",
    sortOrder: 3,
  },
  {
    name: "Electronics",
    value: "ELECTRONICS",
    description: "Mobile, computer, gadgets, appliances",
    icon: "📱",
    gradient: "from-purple-500 to-indigo-500",
    imageUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop",
    sortOrder: 4,
  },
  {
    name: "Fashion & Clothing",
    value: "FASHION",
    description: "Clothes, shoes, accessories",
    icon: "👕",
    gradient: "from-pink-500 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop",
    sortOrder: 5,
  },
  {
    name: "Home & Kitchen",
    value: "HOME_SERVICES",
    description: "Furniture, appliances, decor",
    icon: "🏠",
    gradient: "from-amber-500 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop",
    sortOrder: 6,
  },
  {
    name: "Cosmetics & Beauty",
    value: "COSMETICS",
    description: "Makeup, skincare, personal care",
    icon: "💄",
    gradient: "from-pink-400 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
    sortOrder: 7,
  },
  {
    name: "Milk & Dairy",
    value: "DAIRY",
    description: "Fresh milk, curd, paneer, cheese",
    icon: "🥛",
    gradient: "from-sky-400 to-blue-400",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop",
    sortOrder: 8,
  },
  {
    name: "Dry Fruits & Nuts",
    value: "DRY_FRUITS",
    description: "Almonds, cashews, dates, dry fruits",
    icon: "🥜",
    gradient: "from-amber-400 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
    sortOrder: 9,
  },
  {
    name: "Shoes & Footwear",
    value: "SHOES",
    description: "Shoes, sandals, slippers, footwear",
    icon: "👟",
    gradient: "from-indigo-400 to-purple-500",
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    sortOrder: 10,
  },
  {
    name: "Mobiles & Laptops",
    value: "MOBILES",
    description: "Smartphones, laptops, tablets",
    icon: "📱",
    gradient: "from-violet-400 to-purple-500",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    sortOrder: 11,
  },
  {
    name: "Toys & Games",
    value: "TOYS",
    description: "Kids toys, board games, puzzles",
    icon: "🎮",
    gradient: "from-red-400 to-pink-500",
    imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=400&fit=crop",
    sortOrder: 12,
  },
  {
    name: "Books & Stationery",
    value: "BOOKS",
    description: "Books, notebooks, office supplies",
    icon: "📚",
    gradient: "from-blue-400 to-indigo-500",
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop",
    sortOrder: 13,
  },
  {
    name: "Sports & Fitness",
    value: "SPORTS",
    description: "Sports equipment, gym gear, fitness",
    icon: "⚽",
    gradient: "from-green-500 to-emerald-600",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop",
    sortOrder: 14,
  },
  {
    name: "Pet Supplies",
    value: "PETS",
    description: "Pet food, accessories, care products",
    icon: "🐾",
    gradient: "from-orange-400 to-red-400",
    imageUrl: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop",
    sortOrder: 15,
  },
  {
    name: "Automotive",
    value: "AUTOMOTIVE",
    description: "Car accessories, bike parts, tools",
    icon: "🚗",
    gradient: "from-gray-500 to-slate-600",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=400&fit=crop",
    sortOrder: 16,
  },
  {
    name: "Garden & Outdoor",
    value: "GARDEN",
    description: "Plants, gardening tools, outdoor items",
    icon: "🌱",
    gradient: "from-lime-500 to-green-600",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
    sortOrder: 17,
  },
  {
    name: "Jewelry & Accessories",
    value: "JEWELRY",
    description: "Jewelry, watches, fashion accessories",
    icon: "💍",
    gradient: "from-yellow-400 to-amber-500",
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
    sortOrder: 18,
  },
  {
    name: "Other",
    value: "OTHER",
    description: "Any other business type",
    icon: "📦",
    gradient: "from-gray-400 to-slate-500",
    imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=400&h=400&fit=crop",
    sortOrder: 99,
  },
];

type ItemStatus = "adding" | "added" | "skipped" | "failed";

const ITEM_PILL: Record<ItemStatus, { label: string; tone: Tone }> = {
  adding: { label: "Adding…", tone: "info" },
  added: { label: "Added", tone: "ok" },
  skipped: { label: "Already there", tone: "neutral" },
  failed: { label: "Failed", tone: "bad" },
};

export default function SeedExpandedCategoriesPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [results, setResults] = useState<{ created: string[]; skipped: string[]; errors: string[] }>({
    created: [],
    skipped: [],
    errors: [],
  });
  const [progress, setProgress] = useState(0);
  // Per-row result, keyed by category code, so each row shows how it went
  const [itemStatus, setItemStatus] = useState<Record<string, ItemStatus>>({});

  const handleSeed = async () => {
    const ok = await confirm({
      title: `Add ${EXPANDED_CATEGORIES.length} starter categories?`,
      description: "Categories you already have (same code) are skipped, so nothing is added twice.",
      confirmLabel: "Add categories",
    });
    if (!ok) return;

    setStatus("loading");
    setProgress(0);
    setItemStatus({});
    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];
    const mark = (value: string, s: ItemStatus) => setItemStatus((prev) => ({ ...prev, [value]: s }));

    for (let i = 0; i < EXPANDED_CATEGORIES.length; i++) {
      const category = EXPANDED_CATEGORIES[i];
      setProgress(Math.round(((i + 1) / EXPANDED_CATEGORIES.length) * 100));
      mark(category.value, "adding");

      try {
        const { apiClient } = await import("@/lib/api/client");
        const response = await apiClient.createBusinessCategory({
          name: category.name,
          value: category.value,
          description: category.description,
          icon: category.icon,
          gradient: category.gradient,
          imageUrl: category.imageUrl,
          isActive: true,
          sortOrder: category.sortOrder,
        });

        if (response.success) {
          created.push(category.name);
          mark(category.value, "added");
        } else {
          // Likely already exists
          skipped.push(category.name);
          mark(category.value, "skipped");
        }
      } catch (error: any) {
        if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
          skipped.push(category.name);
          mark(category.value, "skipped");
        } else {
          errors.push(`${category.name}: ${error.message}`);
          mark(category.value, "failed");
        }
      }

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setResults({ created, skipped, errors });
    setStatus(errors.length > 0 ? "error" : "success");
  };

  const reset = () => {
    setStatus("idle");
    setResults({ created: [], skipped: [], errors: [] });
    setItemStatus({});
  };

  const done = status === "success" || status === "error";

  return (
    <AdminPage
      title="Add starter categories"
      subtitle={`${EXPANDED_CATEGORIES.length} common kinds of shop, each with a photo and icon, added in one go.`}
      back={{ href: "/admin/business-categories", label: "Shop categories" }}
    >
      <div className="max-w-3xl">
        {/* Action / progress / result */}
        <section className="mb-6 rounded-2xl bg-card p-4 sm:p-5" aria-live="polite">
          {status === "idle" && (
            <>
              <p className="text-[15px] leading-snug text-label-2">
                Each one is added as shown to sellers. Categories you already have (same code) are skipped, so it’s
                safe to run this again. You can edit or hide any of them afterwards.
              </p>
              <Button className="mt-4 w-full sm:w-auto" onClick={handleSeed}>
                Add {EXPANDED_CATEGORIES.length} categories
              </Button>
            </>
          )}

          {status === "loading" && (
            <div>
              <div className="flex items-center justify-between text-[15px]">
                <span className="text-label-2">Adding categories…</span>
                <span className="font-semibold tabular-nums text-label">{progress}%</span>
              </div>
              <div
                className="mt-3 h-2 w-full overflow-hidden rounded-full bg-fill"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Adding categories"
              >
                <div className="h-full rounded-full bg-tint transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-[14px] text-label-2">Keep this page open until it finishes.</p>
            </div>
          )}

          {done && (
            <div>
              <div className="flex items-start gap-3">
                {status === "success" ? (
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-ok" aria-hidden />
                ) : (
                  <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-bad" aria-hidden />
                )}
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold leading-snug text-label">
                    {status === "success" ? "All done" : "Done, but some didn't go through"}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill tone="ok">{results.created.length} added</Pill>
                    <Pill tone="neutral">{results.skipped.length} already there</Pill>
                    {results.errors.length > 0 && <Pill tone="bad">{results.errors.length} failed</Pill>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button className="sm:flex-none" onClick={() => router.push("/admin/business-categories")}>
                  See shop categories
                </Button>
                <Button variant="secondary" className="sm:flex-none" onClick={reset}>
                  Start again
                </Button>
              </div>
            </div>
          )}
        </section>

        {results.errors.length > 0 && (
          <div className="mb-6">
            <Notice tone="bad" icon={<AlertCircle className="h-5 w-5 text-bad" aria-hidden />}>
              <p className="font-semibold">These couldn’t be added</p>
              <ul className="mt-1 space-y-0.5 text-label-2">
                {results.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <p className="mt-2 text-label-2">Check your internet and press “Start again” — the rest will be skipped.</p>
            </Notice>
          </div>
        )}

        <SectionHeader title={`What will be added (${EXPANDED_CATEGORIES.length})`} />
        <List>
          {EXPANDED_CATEGORIES.map((cat) => {
            const s = itemStatus[cat.value];
            return (
              <Row
                key={cat.value}
                leading={<Thumb src={cat.imageUrl} alt="" size={44} />}
                title={<span className="font-semibold">{cat.name}</span>}
                subtitle={
                  <>
                    {cat.description} · <span className="font-mono text-[13px]">{cat.value}</span>
                  </>
                }
                trailing={s ? <Pill tone={ITEM_PILL[s].tone}>{ITEM_PILL[s].label}</Pill> : undefined}
              />
            );
          })}
        </List>
      </div>
    </AdminPage>
  );
}
