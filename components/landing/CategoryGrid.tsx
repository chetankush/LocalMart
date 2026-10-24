import Image from "next/image";
import Link from "next/link";
import { HomeSection } from "@/components/app/commerce";

/**
 * Blinkit-style category tiles, grouped like a market: daily needs,
 * fashion, health & home. Each tile opens the shops of that kind.
 * Categories with no shop in the area yet are shown as "Soon" so the
 * shopper knows what's coming — they never lead to an empty page.
 */

interface Tile {
  label: string;
  hindi: string;
  slug: string; // /stores?category=<slug>
  type: string; // vendor businessType that serves it
  image: string;
}

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&h=300&fit=crop`;

const GROUPS: { title: string; tiles: Tile[] }[] = [
  {
    title: "Daily needs",
    tiles: [
      { label: "Kirana & grocery", hindi: "किराना", slug: "grocery", type: "GROCERY", image: U("photo-1542838132-92c53300491e") },
      { label: "Atta, rice & dal", hindi: "आटा, चावल, दाल", slug: "grocery", type: "GROCERY", image: U("photo-1586201375761-83865001e31c") },
      { label: "Milk & dairy", hindi: "दूध, दही", slug: "dairy", type: "GROCERY", image: U("photo-1550583724-b2692b85b150") },
      { label: "Snacks & drinks", hindi: "नाश्ता", slug: "grocery", type: "GROCERY", image: U("photo-1558961363-fa8fdf82db35") },
    ],
  },
  {
    title: "Fashion",
    tiles: [
      { label: "Sarees & ethnic", hindi: "साड़ी", slug: "clothing", type: "FASHION", image: U("photo-1610030469983-98e550d6193c") },
      { label: "Clothes", hindi: "कपड़े", slug: "clothing", type: "FASHION", image: U("photo-1445205170230-053b83016050") },
      { label: "Footwear", hindi: "जूते, चप्पल", slug: "shoes", type: "FASHION", image: U("photo-1549298916-b41d501d3772") },
      { label: "Beauty", hindi: "ब्यूटी", slug: "beauty", type: "FASHION", image: U("photo-1596462502278-27bfdc403348") },
    ],
  },
  {
    title: "Health, home & mobiles",
    tiles: [
      { label: "Medicines", hindi: "दवाई", slug: "medical", type: "PHARMACY", image: U("photo-1585435557343-3b092031a831") },
      { label: "Mobiles & covers", hindi: "मोबाइल", slug: "mobiles", type: "ELECTRONICS", image: U("photo-1511707171634-5f897ff02aa9") },
      { label: "Electronics", hindi: "इलेक्ट्रॉनिक्स", slug: "electronics", type: "ELECTRONICS", image: U("photo-1498049794561-7780e7231661") },
      { label: "Home & kitchen", hindi: "घर का सामान", slug: "home-kitchen", type: "HOME_SERVICES", image: U("photo-1556020685-ae41abfc9365") },
    ],
  },
];

export default function CategoryGrid({ shopTypes }: { shopTypes: string[] }) {
  const available = new Set(shopTypes);
  // Groups with at least one open category first
  const groups = [...GROUPS].sort(
    (a, b) =>
      Number(b.tiles.some((t) => available.has(t.type))) - Number(a.tiles.some((t) => available.has(t.type)))
  );

  return (
    <HomeSection title="Shop by category">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-4">
        {groups.map((g) => (
          <div key={g.title} className="lg:rounded-2xl lg:border lg:border-hairline lg:p-4">
            <h3 className="mb-2.5 text-[15px] font-semibold text-label-2 lg:text-[17px] lg:font-bold lg:text-label">{g.title}</h3>
            <ul className="grid grid-cols-4 gap-x-2 gap-y-3 sm:gap-x-4 lg:grid-cols-2 lg:gap-3">
              {g.tiles.map((t) => {
                const on = available.has(t.type);
                const inner = (
                  <>
                    <span className={`relative block aspect-square overflow-hidden rounded-2xl ${on ? "bg-[#F3EEE9]" : "bg-fill"}`}>
                      <Image
                        src={t.image}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 25vw, 180px"
                        className={`object-cover transition-transform duration-300 group-hover:scale-105 ${on ? "" : "opacity-40 grayscale"}`}
                      />
                      {!on && (
                        <span className="absolute inset-x-0 bottom-1.5 mx-auto w-fit rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-label-2">
                          Soon
                        </span>
                      )}
                    </span>
                    <span className={`mt-1.5 block text-center text-[13px] font-semibold leading-tight ${on ? "text-label" : "text-label-3"}`}>
                      {t.label}
                    </span>
                    <span className="block text-center text-[11px] leading-tight text-label-2">{t.hindi}</span>
                  </>
                );
                return (
                  <li key={t.label}>
                    {on ? (
                      <Link href={`/stores?category=${t.slug}`} className="group block">
                        {inner}
                      </Link>
                    ) : (
                      <div aria-label={`${t.label}: coming soon to your area`}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </HomeSection>
  );
}
