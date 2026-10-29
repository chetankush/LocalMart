"use client";

import Link from "next/link";
import Image from "next/image";

interface Category {
  name: string;
  slug: string;
  image: string;
}

const categories: Category[] = [
  { name: "Kirana", slug: "GROCERY", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400" },
  { name: "Fashion", slug: "FASHION", image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=400" },
  { name: "Electronics", slug: "ELECTRONICS", image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=400" },
  { name: "Pharmacy", slug: "PHARMACY", image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=400" },
  { name: "Food", slug: "RESTAURANT", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400" },
  { name: "Beauty", slug: "COSMETICS", image: "https://images.unsplash.com/photo-1522335789203-aaa2f6dd4bd6?auto=format&fit=crop&q=80&w=400" },
  { name: "Home", slug: "HOME_SERVICES", image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&q=80&w=400" },
  { name: "Services", slug: "OTHER", image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=400" },
];

export default function CategoryRail() {
  return (
    <section className="bg-ivory">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex items-end justify-between mb-4 sm:mb-5">
          <h2 className="font-heading text-ink text-lg sm:text-xl md:text-2xl font-semibold tracking-tight">
            Shop by category
          </h2>
          <Link
            href="/stores"
            className="text-sm font-semibold text-primary-dark hover:text-ink transition-colors"
          >
            View all →
          </Link>
        </div>

        <div className="-mx-4 sm:mx-0 overflow-x-auto scrollbar-hide">
          <ul className="flex gap-3 sm:gap-4 px-4 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((cat) => (
              <li key={cat.slug} className="shrink-0 w-[88px] sm:w-auto">
                <Link
                  href={`/stores?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2"
                >
                  <span className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full overflow-hidden ring-1 ring-sand group-hover:ring-ink transition-all">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-ink group-hover:text-accent-dark transition-colors text-center">
                    {cat.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
