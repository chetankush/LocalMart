import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Store, Tag } from "lucide-react";
import { Button, EmptyState, Page, buttonClass, formatIST, rupees } from "@/components/app/ui";
import type { PublicStockSale } from "@/lib/stockSale";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Prices change when the sale ends — always fresh
export const dynamic = "force-dynamic";

async function getSale(code: string): Promise<PublicStockSale | null> {
  if (!/^[a-zA-Z0-9]{8}$/.test(code)) return null;
  try {
    const key = process.env.INTERNAL_API_KEY;
    const res = await fetch(`${API_BASE_URL}/stock-sales/${code.toLowerCase()}`, {
      cache: "no-store",
      headers: key ? { "x-localmart-internal": key } : undefined,
    });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: PublicStockSale }).data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const sale = await getSale((await params).code);
  if (!sale) return { title: "Sale · LocalMart", robots: { index: false } };
  const title = `${sale.shop.name} — Sale ${sale.percentOff}% off`;
  const first = sale.items.find((i) => i.image)?.image;
  return {
    title,
    description: `${sale.items.length} items at ${sale.percentOff}% off${sale.running ? `, till ${formatIST(sale.endsAt)}` : ""}.`,
    robots: { index: false, follow: false },
    openGraph: { title, ...(first ? { images: [first] } : {}) },
  };
}

/**
 * A shop's "clear old stock" sale (localmart.in/s/ab3k9xyz): the items, old
 * and new price, and when it ends. Each item opens its own page to order.
 */
export default async function SalePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const [{ code }, { src }] = await Promise.all([params, searchParams]);
  const sale = await getSale(code);
  if (!sale) {
    return (
      <Page>
        <EmptyState icon={<Tag className="h-8 w-8" aria-hidden />} title="Sale not found" body="Check the link, or ask the shop." action={<Button href="/" full>Go to LocalMart</Button>} />
      </Page>
    );
  }
  const shopHref = sale.shop.handle ? `/${sale.shop.handle}` : `/stores/${sale.shop.id}`;
  // From the shop's phone alert or its shared link — orders count as the shop's
  const from = src === "alert" ? "alert" : "link";

  return (
    <Page>
      <header className="mb-4 flex items-center gap-3 pt-2">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-fill">
          {sale.shop.logo ? <Image src={sale.shop.logo} alt="" fill sizes="56px" className="object-cover" /> : <Store className="h-7 w-7 text-label-2" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold leading-tight text-label">{sale.shop.name}</h1>
          {sale.shop.city && <p className="text-[14px] text-label-2">{sale.shop.city}</p>}
        </div>
      </header>

      <section className={`mb-5 rounded-2xl p-4 ${sale.running ? "bg-tint text-white" : "bg-card"}`}>
        <p className="text-[30px] font-extrabold leading-none tracking-[-0.02em]">{sale.running ? `SALE ${sale.percentOff}% OFF` : "This sale has ended"}</p>
        <p className={`mt-2 flex items-center gap-1.5 text-[15px] ${sale.running ? "text-white/90" : "text-label-2"}`}>
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          {sale.running ? `Till ${formatIST(sale.endsAt)} · stock is limited` : "Prices are back to normal — see what the shop has now."}
        </p>
      </section>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sale.items.map((i) => (
          <li key={i.id} className={`overflow-hidden rounded-2xl bg-card ${i.soldOut ? "opacity-50" : ""}`}>
            <Link href={`/products/${i.id}?src=${from}`} className="block">
              <span className="relative block aspect-[3/4] w-full bg-fill">
                {i.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                {sale.running && !i.soldOut && i.price < i.priceBefore && (
                  <span className="absolute left-2 top-2 rounded-full bg-tint px-2 py-0.5 text-[12px] font-bold text-white">−{sale.percentOff}%</span>
                )}
                {i.soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 text-center text-[13px] font-semibold text-white">Sold out</span>}
              </span>
              <span className="block p-3">
                <span className="line-clamp-2 block text-[15px] font-semibold leading-snug text-label">{i.name}</span>
                <span className="mt-1 flex items-baseline gap-2 tabular-nums">
                  <span className="text-[17px] font-bold text-label">{rupees(i.price)}</span>
                  {i.price < i.priceBefore && <span className="text-[13px] text-label-3 line-through">{rupees(i.priceBefore)}</span>}
                </span>
                {i.sizes.length > 0 && <span className="mt-0.5 block text-[12px] text-label-2">Sizes: {i.sizes.join(", ")}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link href={`${shopHref}${shopHref.startsWith("/stores/") ? `?src=${from}` : ""}`} className={`${buttonClass("secondary", "lg", true)} mt-6`}>
        <Store className="h-5 w-5" aria-hidden /> See all of {sale.shop.name}
      </Link>
    </Page>
  );
}
