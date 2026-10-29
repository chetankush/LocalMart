import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HomeSection } from "@/components/app/commerce";
import type { ProductCardProduct } from "./ProductCard";

/**
 * Amazon-style collection cards: one card per product category the shops
 * actually sell ("Silk Sarees", "Festive Suits"…), each with real product
 * photos, the lowest price and how many items — never stock pictures.
 */

type P = ProductCardProduct & { category?: { id: string; name: string } | null };

interface Collection {
  name: string;
  photos: string[];
  from: number;
  count: number;
}

const firstImage = (images: unknown) =>
  Array.isArray(images) && typeof images[0] === "string" ? (images[0] as string) : null;

export function buildCollections(products: P[]): Collection[] {
  const byName = new Map<string, { photos: string[]; prices: number[]; ids: Set<string> }>();
  for (const p of products) {
    const name = p.category?.name?.trim();
    if (!name) continue;
    const c = byName.get(name) ?? { photos: [], prices: [], ids: new Set<string>() };
    if (c.ids.has(p.id)) continue;
    c.ids.add(p.id);
    c.prices.push(Number(p.price));
    const img = firstImage(p.images);
    if (img && !c.photos.includes(img)) c.photos.push(img);
    byName.set(name, c);
  }
  return [...byName.entries()]
    .filter(([, c]) => c.photos.length > 0)
    .map(([name, c]) => ({ name, photos: c.photos.slice(0, 4), from: Math.min(...c.prices), count: c.ids.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export default function CollectionCards({
  products,
  title = "Shop by collection",
  subtitle = "Picked from what shops near you sell · आपके लिए चुना गया",
}: {
  products: P[];
  title?: string;
  subtitle?: string;
}) {
  const collections = buildCollections(products);
  if (collections.length < 2) return null;

  return (
    <HomeSection title={title} subtitle={subtitle}>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 scroll-px-4 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {collections.map((c) => (
          <li key={c.name} className="w-[72%] shrink-0 snap-start sm:w-auto">
            <Link
              href={`/search?q=${encodeURIComponent(c.name)}`}
              className="group flex h-full flex-col rounded-2xl border border-hairline bg-card p-4 transition-shadow hover:shadow-[0_8px_24px_rgba(16,24,40,0.08)]"
            >
              <h3 className="line-clamp-1 text-[17px] font-bold text-label">{c.name}</h3>
              <p className="mt-0.5 text-[13px] text-label-2">
                From <span className="font-semibold text-label">{rupees(c.from)}</span> · {c.count}{" "}
                {c.count === 1 ? "item" : "items"}
              </p>

              {c.photos.length >= 4 ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {c.photos.map((src) => (
                    <span key={src} className="relative aspect-square overflow-hidden rounded-xl bg-fill">
                      <Image
                        src={src}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 36vw, 160px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </span>
                  ))}
                </div>
              ) : (
                <span className="relative mt-3 block aspect-square overflow-hidden rounded-xl bg-fill">
                  <Image
                    src={c.photos[0]}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 72vw, 320px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
              )}

              <span className="mt-3 inline-flex items-center gap-0.5 text-[14px] font-semibold text-tint">
                See all <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
