import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GROUPS } from "@/components/landing/CategoryGrid";

/**
 * "Shop by category" like Zepto / Blinkit: one grid of square picture
 * tiles on soft colours, name underneath. Kinds of shop not open in the
 * area yet stay in the grid, faded, with a small "Soon".
 */

// Soft tile colour per group (daily needs, fashion, health & home)
const TILE_BG = ["bg-[#EAF5EC]", "bg-[#FBEFF3]", "bg-[#EDF3FC]"];

export default function CategoryShowcase({ shopTypes }: { shopTypes: string[] }) {
  const available = new Set(shopTypes);
  // Open kinds first, then the ones coming soon, keeping each group's order
  const tiles = GROUPS.flatMap((g, gi) => g.tiles.map((t) => ({ ...t, bg: TILE_BG[gi % TILE_BG.length] })));
  const ordered = [...tiles.filter((t) => available.has(t.type)), ...tiles.filter((t) => !available.has(t.type))];
  // One name per kind of shop ("Kirana & grocery, Medicines, Mobiles & covers")
  const soonByType = new Map<string, string>();
  for (const t of tiles) if (!available.has(t.type) && !soonByType.has(t.type)) soonByType.set(t.type, t.label);
  const soonLabels = [...soonByType.values()];

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[24px]">Shop by category</h2>
          <p className="mt-0.5 text-[13px] text-label-2 sm:text-[14px]">From shops near you · आस-पास की दुकानों से</p>
        </div>
        <Link href="/stores" className="flex shrink-0 items-center gap-0.5 py-1 text-[14px] font-semibold text-tint">
          See all <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-6 sm:gap-x-4 lg:grid-cols-8 xl:grid-cols-12 xl:gap-x-4">
        {ordered.map((t) => {
          const on = available.has(t.type);
          const tile = (
            <>
              <span className={`relative block aspect-square overflow-hidden rounded-2xl ${t.bg}`}>
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 140px"
                  className={`object-cover transition-transform duration-300 group-hover:scale-105 ${on ? "" : "opacity-45 grayscale"}`}
                />
                {!on && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-card/95 px-2 py-0.5 text-[11px] font-bold text-label-2">
                    Soon
                  </span>
                )}
              </span>
              <span className={`mt-1.5 block text-center text-[13px] font-semibold leading-tight ${on ? "text-label" : "text-label-3"}`}>
                {t.label}
              </span>
            </>
          );
          return (
            // Phones: only kinds of shop that are open here (the rest is one line below)
            <li key={t.label} className={on ? "" : "hidden sm:block"}>
              {on ? (
                <Link href={`/stores?category=${t.slug}`} className="group block">
                  {tile}
                </Link>
              ) : (
                <div aria-label={`${t.label}: coming soon to your area`}>{tile}</div>
              )}
            </li>
          );
        })}
      </ul>
      {soonLabels.length > 0 && (
        <p className="mt-3 text-[13px] leading-snug text-label-2 sm:hidden">
          <span className="font-semibold text-label">Coming soon:</span>{" "}
          {soonLabels.length > 3 ? `${soonLabels.slice(0, 3).join(", ")} and more` : soonLabels.join(", ")}
        </p>
      )}
    </section>
  );
}
