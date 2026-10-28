import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Link2, Store } from "lucide-react";
import { Button, EmptyState, Notice, Page, StickyBar, StickyBarSpacer, Thumb, buttonClass, formatIST, rupees } from "@/components/app/ui";
import type { PublicOrderLink } from "@/lib/api/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// The link can be used up or cancelled any moment — always fresh
export const dynamic = "force-dynamic";

async function getLink(code: string): Promise<PublicOrderLink | null> {
  if (!/^[a-zA-Z0-9]{8}$/.test(code)) return null;
  try {
    const key = process.env.INTERNAL_API_KEY;
    const res = await fetch(`${API_BASE_URL}/order-links/${code.toLowerCase()}`, {
      cache: "no-store",
      headers: key ? { "x-localmart-internal": key } : undefined,
    });
    if (!res.ok) return null;
    return ((await res.json()) as { data?: PublicOrderLink }).data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const link = await getLink((await params).code);
  if (!link) return { title: "Order link · LocalMart", robots: { index: false } };
  // What WhatsApp shows under the link in the chat
  const title = `Your order from ${link.shop.name} — ${rupees(link.total)}`;
  const first = link.items.find((i) => i.image)?.image;
  return {
    title,
    description: `${link.items.length} item${link.items.length > 1 ? "s" : ""}${link.offerText ? ` · ${link.offerText}` : ""}. Tap to add your address and order.`,
    robots: { index: false, follow: false },
    openGraph: { title, ...(first ? { images: [first] } : {}) },
  };
}

/**
 * An order a shop made for a buyer in a chat (localmart.in/o/ab3k9xyz):
 * what's in it, the shop's price, and one button to order.
 */
export default async function OrderLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const link = await getLink((await params).code);

  if (!link) {
    return (
      <Page>
        <EmptyState
          icon={<Link2 className="h-8 w-8" aria-hidden />}
          title="Order link not found"
          body="Check the link, or ask the shop to send it again."
          action={<Button href="/" full>Go to LocalMart</Button>}
        />
      </Page>
    );
  }

  const shopHref = link.shop.handle ? `/${link.shop.handle}` : `/stores/${link.shop.id}`;
  const open = link.state === "OPEN";
  const canOrder = open && link.allAvailable && link.items.length > 0;
  const soldOut = link.items.filter((i) => !i.available);

  return (
    <>
      <Page>
        {/* Who sent it */}
        <header className="mb-5 flex items-center gap-3 pt-2">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-fill">
            {link.shop.logo ? (
              <Image src={link.shop.logo} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <Store className="h-7 w-7 text-label-2" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-label-2">Order from</p>
            <h1 className="truncate text-[24px] font-bold leading-tight tracking-[-0.01em] text-label">{link.shop.name}</h1>
            {link.shop.city && <p className="text-[14px] text-label-2">{link.shop.city}</p>}
          </div>
        </header>

        {(link.forName || link.note) && (
          <div className="mb-5 rounded-2xl rounded-tl-md bg-tint-soft px-4 py-3">
            {link.forName && <p className="text-[15px] font-semibold text-label">For {link.forName}</p>}
            {link.note && <p className="mt-0.5 text-[16px] leading-snug text-label">{link.note}</p>}
          </div>
        )}

        {!open && link.message && (
          <div className="mb-5">
            <Notice tone="bad">{link.message}</Notice>
          </div>
        )}
        {open && soldOut.length > 0 && (
          <div className="mb-5">
            <Notice tone="warn">
              {soldOut.length === 1 ? `"${soldOut[0].name}" is` : `${soldOut.length} items are`} sold out now. Ask {link.shop.name} to send a new link.
            </Notice>
          </div>
        )}

        {/* What's in it */}
        <section aria-label="Items" className="mb-4 overflow-hidden rounded-2xl bg-card">
          <ul className="divide-y divide-hairline">
            {link.items.map((i, n) => (
              <li key={`${i.productId}-${i.variantId ?? ""}-${n}`} className={`flex items-center gap-3 p-3 ${i.available ? "" : "opacity-50"}`}>
                <Thumb src={i.image} alt={i.name} size={64} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">{i.name}</p>
                  <p className="mt-0.5 text-[14px] tabular-nums text-label-2">
                    {i.quantity} × {rupees(i.price)}
                    {!i.available && <span className="ml-2 font-semibold text-bad">Sold out</span>}
                  </p>
                </div>
                <p className="shrink-0 text-[16px] font-semibold tabular-nums text-label">{rupees(i.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="border-t border-hairline px-4 py-3 text-[15px]">
            {link.discount > 0 && (
              <>
                <div className="flex justify-between gap-3 py-1">
                  <dt className="text-label-2">Items</dt>
                  <dd className="tabular-nums text-label">{rupees(link.itemsTotal)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-1 font-medium text-ok">
                  <dt>Special price · {link.offerText}</dt>
                  <dd className="tabular-nums">−{rupees(link.discount)}</dd>
                </div>
              </>
            )}
            <div className="flex items-baseline justify-between gap-3 py-1">
              <dt className="font-semibold text-label">Total</dt>
              <dd className="text-[20px] font-bold tabular-nums text-label">{rupees(link.total)}</dd>
            </div>
            <p className="text-[13px] text-label-2">+ delivery if any — you choose delivery or pickup next</p>
          </dl>
        </section>

        {open && (
          <p className="mb-6 flex items-center gap-1.5 text-[14px] text-label-2">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            Order before {formatIST(link.expiresAt)}
          </p>
        )}

        <Link href={shopHref} className={buttonClass("secondary", "lg", true)}>
          <Store className="h-5 w-5" aria-hidden /> See {link.shop.name}
        </Link>
        <StickyBarSpacer />
      </Page>

      {canOrder && (
        <StickyBar>
          <div className="min-w-0">
            <p className="text-[13px] text-label-2">Add your address next</p>
            <p className="text-[20px] font-bold tabular-nums text-label">{rupees(link.total)}</p>
          </div>
          <Button href={`/checkout?link=${link.code}`} className="flex-1">
            Order now
          </Button>
        </StickyBar>
      )}
    </>
  );
}
