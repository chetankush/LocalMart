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
    <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-4 px-4 pt-7 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
      {sections.slice(0, 4).map((section) => (
        <Link
          key={section.businessType}
          href={`/stores?category=${section.businessType}`}
          className="group rounded-2xl bg-fill p-4"
        >
          <h3 className="mb-3 text-[18px] font-bold leading-tight text-label">{section.title}</h3>
          <div className="grid grid-cols-2 gap-3">
            {section.products.slice(0, 4).map((p) => {
              const image = Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null;
              return (
                <div key={p.id} className="min-w-0">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
                    {image ? (
                      <Image src={image} alt={p.name} fill sizes="(max-width: 768px) 45vw, 160px" className="object-contain" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[12px] text-label-3">No photo</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-label">{p.name}</p>
                </div>
              );
            })}
          </div>
          <span className="mt-3 inline-block text-[14px] text-label underline underline-offset-2 group-hover:text-link">
            {locationLabel ? `See more in ${locationLabel}` : "See more"}
          </span>
        </Link>
      ))}
    </div>
  );
}
