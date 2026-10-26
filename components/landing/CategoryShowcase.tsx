import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GROUPS } from "@/components/landing/CategoryGrid";

/**
 * "Shop by category" like Zepto / Blinkit: square picture tiles on soft
 * colours, name underneath — only for kinds of shop that are open here.
 * The rest of the row is one calm "Coming soon" card (not a row of faded
 * tiles that all say "not available"), which also invites those shops in.
 */

// Soft tile colour per group (daily needs, fashion, health & home)
const TILE_BG = ["bg-[#EAF5EC]", "bg-[#FBEFF3]", "bg-[#EDF3FC]"];

// Columns of the grid at each width (must match the classes on the <ul>)
const COLS = { base: 4, sm: 6, lg: 8, xl: 12 };

/** Columns left on the last row after n tiles (a full row when it's exactly full) */
const rest = (n: number, cols: number) => cols - (n % cols) || cols;

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
  const tiles = GROUPS.flatMap((g, gi) => g.tiles.map((t) => ({ ...t, bg: TILE_BG[gi % TILE_BG.length] })));
  const open = tiles.filter((t) => available.has(t.type));
  // One entry per kind of shop not open yet ("Kirana & grocery", "Medicines"…)
  const soon = new Map<string, (typeof tiles)[number]>();
  for (const t of tiles) if (!available.has(t.type) && !soon.has(t.type)) soon.set(t.type, t);
  const soonTiles = [...soon.values()];
  const town = place || "your town";

  if (open.length === 0 && soonTiles.length === 0) return null;
  const n = open.length;

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

        {soonTiles.length > 0 && (
          // Fills what's left of the last row (a whole row on phones)
          <li
            className="col-span-4 sm:col-span-(--rest-sm) lg:col-span-(--rest-lg) xl:col-span-(--rest-xl)"
            style={
              {
                "--rest-sm": rest(n, COLS.sm),
                "--rest-lg": rest(n, COLS.lg),
                "--rest-xl": rest(n, COLS.xl),
              } as React.CSSProperties
            }
          >
            <div className="flex h-full flex-col justify-center gap-3 rounded-2xl bg-fill px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-label">
                  Coming soon to {town} <span className="font-medium text-label-2">· जल्द आ रहा है</span>
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-label-2">
                  {soonTiles.length > 4
                    ? `${soonTiles
                        .slice(0, 4)
                        .map((t) => t.label)
                        .join(", ")} and more`
                    : soonTiles.map((t) => t.label).join(", ")}
                </p>
                <Link
                  href="/become-vendor"
                  className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-semibold text-tint underline-offset-4 hover:underline"
                >
                  Own one of these shops? Join free <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              {/* A few of the coming kinds, small and quiet */}
              <div className="hidden shrink-0 -space-x-2 sm:flex" aria-hidden>
                {soonTiles.slice(0, 5).map((t) => (
                  <span key={t.type} className="relative h-11 w-11 overflow-hidden rounded-full ring-2 ring-fill">
                    <Image src={t.image} alt="" fill sizes="44px" className="object-cover opacity-80 grayscale" />
                  </span>
                ))}
              </div>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}
