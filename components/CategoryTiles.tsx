"use client";

import Link from "next/link";

interface Category {
  name: string;
  label: string;
  slug: string;
  image: string;
}

const categories: Category[] = [
  {
    name: "Kirana",
    label: "Groceries",
    slug: "GROCERY",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Fashion",
    label: "Apparel & boutiques",
    slug: "FASHION",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Electronics",
    label: "Devices & repair",
    slug: "ELECTRONICS",
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Pharmacy",
    label: "Medicines",
    slug: "PHARMACY",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Food",
    label: "Restaurants & tiffins",
    slug: "RESTAURANT",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Beauty",
    label: "Cosmetics & salons",
    slug: "COSMETICS",
    image: "https://images.unsplash.com/photo-1522335789203-aaa2f6dd4bd6?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Home",
    label: "Kitchen & decor",
    slug: "HOME_SERVICES",
    image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Services",
    label: "Repairs & hires",
    slug: "OTHER",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600",
  },
];

export default function CategoryTiles() {
  return (
    <section className="bg-ivory">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

        {/* Section header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-accent" aria-hidden />
              <span className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase">
                Shop by Category
              </span>
            </div>
            <h2 className="font-heading text-ink text-2xl sm:text-3xl lg:text-[36px] font-semibold tracking-tight leading-tight">
              What do you need today?
            </h2>
            <p className="text-ink-2 text-sm mt-2 max-w-lg hidden sm:block">
              Eight categories, one neighbourhood marketplace. Pick a lane to start browsing local shops.
            </p>
          </div>

          <Link
            href="/stores"
            className="font-heading hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent-dark transition-colors group"
          >
            View all stores
            <span className="inline-block group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* Tile grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/stores?category=${cat.slug}`}
              className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-xl overflow-hidden ring-1 ring-sand hover:ring-ink transition-all"
            >
              {/* Background photo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.08]"
                style={{ backgroundImage: `url(${cat.image})` }}
              />

              {/* Ink tint for legibility + hover darken */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-ink/10 group-hover:from-ink/95 group-hover:via-ink/50 transition-all" />

              {/* Number marker top-left */}
              <span className="absolute top-3 left-3 font-heading text-[10px] font-semibold text-white/60 tabular-nums tracking-[0.16em]">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Label block bottom */}
              <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                <div className="h-px w-6 bg-accent mb-2 group-hover:w-10 transition-all duration-300" aria-hidden />
                <h3 className="font-heading text-white text-base sm:text-lg font-semibold leading-tight tracking-tight">
                  {cat.name}
                </h3>
                <p className="text-white/60 text-[11px] mt-0.5 leading-tight hidden sm:block">
                  {cat.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
