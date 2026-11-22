import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GROUPS } from "@/components/landing/CategoryGrid";

/**
 * "Shop by category" like Zepto / Blinkit: square picture tiles on soft
 * colours, name underneath — only for kinds of shop that are open here.
 * LocalMart starts in Guna, where it is fully available, so kinds of shop
 * with no shop open yet are simply not shown (no "coming soon" card).
 */

// Soft tile colour per kind of shop
const TILE_BG: Record<string, string> = { SAREE: "bg-[#FBEFF3]", CLOTHING: "bg-[#EDF3FC]", SHOES: "bg-[#FFF3E6]" };

export default function CategoryShowcase({
  shopTypes,
  located = true,
  place,
}: {
  shopTypes: string[];
  /** The shopper picked an area ("near you"); otherwise we say the town */
  located?: boolean;
  /** Town shown when no area is chosen ("Guna") */
  place?: string;
}) {
  const available = new Set(shopTypes);
  const tiles = GROUPS.flatMap((g) => g.tiles.map((t) => ({ ...t, bg: TILE_BG[t.kind] })));
  const open = tiles.filter((t) => available.has(t.kind));
  const town = place || "your town";

  if (open.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[24px]">Shop by category</h2>
          <p className="mt-0.5 text-[13px] text-label-2 sm:text-[14px]">
            {located ? "From shops near you · आस-पास की दुकानों से" : `From shops in ${town} · ${town} की दुकानों से`}
          </p>
        </div>
        <Link href="/stores" className="flex shrink-0 items-center gap-0.5 py-1 text-[14px] font-semibold text-tint">
          See all <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-6 sm:gap-x-4 lg:grid-cols-8 xl:grid-cols-12 xl:gap-x-4">
        {open.map((t) => (
          <li key={t.label}>
            <Link href={`/stores?category=${t.slug}`} className="group block">
              <span className={`relative block aspect-square overflow-hidden rounded-2xl ${t.bg}`}>
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 140px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="mt-1.5 block text-center text-[13px] font-semibold leading-tight text-label">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
