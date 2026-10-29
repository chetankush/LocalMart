"use client";

import Link from "next/link";
import { HomeSection } from "@/components/app/commerce";

interface Category {
  name: string;
  hindi: string;
  label: string;
  slug: string;
  image: string;
}

const categories: Category[] = [
  {
    name: "Kirana",
    hindi: "किराना",
    label: "Groceries",
    slug: "GROCERY",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Fashion",
    hindi: "कपड़े",
    label: "Apparel & boutiques",
    slug: "FASHION",
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Electronics",
    hindi: "इलेक्ट्रॉनिक्स",
    label: "Devices & repair",
    slug: "ELECTRONICS",
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Pharmacy",
    hindi: "दवाई",
    label: "Medicines",
    slug: "PHARMACY",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Food",
    hindi: "खाना",
    label: "Restaurants & tiffins",
    slug: "RESTAURANT",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Beauty",
    hindi: "ब्यूटी",
    label: "Cosmetics & salons",
    slug: "COSMETICS",
    image: "https://images.unsplash.com/photo-1522335789203-aaa2f6dd4bd6?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Home",
    hindi: "घर का सामान",
    label: "Kitchen & decor",
    slug: "HOME_SERVICES",
    image: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&q=80&w=600",
  },
  {
    name: "Services",
    hindi: "सेवाएँ",
    label: "Repairs & hires",
    slug: "OTHER",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=600",
  },
];

interface Props {
  /**
   * When provided, only categories whose slug appears in this list are
   * rendered. Lets the personalized landing page hide categories with no
   * serviceable vendors in the user's pincode.
   */
  availableSlugs?: string[];
}

export default function CategoryTiles({ availableSlugs }: Props = {}) {
  const visible = availableSlugs && availableSlugs.length > 0
    ? categories.filter((c) => availableSlugs.includes(c.slug))
    : categories;

  if (visible.length === 0) return null;

  return (
    <HomeSection title="Shop by category" href="/stores" linkLabel="All shops">
      <ul className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3 sm:px-0 lg:grid-cols-8">
        {visible.map((cat) => (
          <li key={cat.slug} className="w-[84px] shrink-0 sm:w-auto">
            <Link href={`/stores?category=${cat.slug}`} className="group flex flex-col items-center gap-1.5 rounded-lg p-1 text-center">
              <span className="relative block h-[72px] w-[72px] overflow-hidden rounded-full bg-fill ring-1 ring-hairline transition-shadow group-hover:ring-2 group-hover:ring-link sm:h-24 sm:w-24">
                <span
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
              </span>
              <span className="text-[14px] font-semibold leading-tight text-label group-hover:text-link-hover">{cat.name}</span>
              <span className="-mt-1 text-[12px] leading-tight text-label-2">{cat.hindi}</span>
            </Link>
          </li>
        ))}
      </ul>
    </HomeSection>
  );
}
