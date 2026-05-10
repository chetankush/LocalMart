"use client";

import Link from "next/link";
import Image from "next/image";
import type { ProductCardProduct } from "./ProductCard";

interface CategorySection {
  businessType: string;
  title: string;
  products: ProductCardProduct[];
}

interface Props {
  sections: CategorySection[];
  locationLabel?: string;
}

export default function ShopByCategorySection({ sections, locationLabel }: Props) {
  if (sections.length === 0) return null;

  return (
    <section className="bg-cream">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              Shop by category
            </h2>
            <p className="text-ink-2 text-sm mt-1">
              {locationLabel ? `Best deals in ${locationLabel}` : "Best deals from local stores"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sections.slice(0, 6).map((section) => (
            <Link
              key={section.businessType}
              href={`/stores?category=${section.businessType}`}
              className="group bg-white rounded-2xl border border-sand p-4 sm:p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-ink text-base sm:text-lg font-semibold">
                  {section.title}
                </h3>
                <span className="text-sm font-semibold text-primary-dark group-hover:translate-x-0.5 transition-transform">
                  Shop all →
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {section.products.slice(0, 4).map((p) => {
                  const image =
                    Array.isArray(p.images) && p.images.length > 0
                      ? (p.images[0] as string)
                      : null;
                  return (
                    <div
                      key={p.id}
                      className="aspect-square bg-gradient-to-br from-cream to-sand/40 rounded-xl overflow-hidden flex items-center justify-center relative"
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-[10px] text-ink-3">No image</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
