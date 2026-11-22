"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import AddStepper from "@/components/cart/AddStepper";
import { allSizesSoldOut, hasSizes, type Size } from "@/lib/sizes";
import { parseVideoLink } from "@/lib/videoLink";

type Numeric = number | string;

export interface WatchProduct {
  id: string;
  name: string;
  price: Numeric;
  compareAtPrice?: Numeric | null;
  images: unknown;
  stockQuantity: number;
  vendorId: string;
  listingType?: "SALE" | "RENT" | null;
  variants?: Size[] | null;
  videoUrl?: string | null;
  /** The video is of just this one item: only then do price and Buy show */
  videoSingleProduct?: boolean;
}

function firstImage(value: unknown): string | null {
  if (Array.isArray(value)) {
    const s = value.find((v) => typeof v === "string" && v);
    return typeof s === "string" ? s : null;
  }
  return null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * "Watch and Buy": the shop's own Instagram reels of its items, as a row of
 * tall cards. Tapping one plays it and puts the price and Add button right
 * under the video, so a buyer can order without leaving it.
 * Instagram's player loads only when a card is tapped, so the page stays fast
 * and nothing is sent to Instagram until the buyer chooses to watch.
 */
export default function WatchAndBuy({ products, vendorName }: { products: WatchProduct[]; vendorName: string }) {
  const [active, setActive] = useState<WatchProduct | null>(null);
  const rail = useRef<HTMLDivElement>(null);

  const reels = useMemo(
    () => products.filter((p) => p.listingType !== "RENT" && parseVideoLink(p.videoUrl)),
    [products]
  );
  if (reels.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  const link = active ? parseVideoLink(active.videoUrl) : null;
  const price = active ? Number(active.price) : 0;
  const compareAt = active?.compareAtPrice ? Number(active.compareAtPrice) : 0;
  const soldOut = active ? active.stockQuantity === 0 || allSizesSoldOut(active) : false;

  return (
    <>
      <div className="relative">
        <div
          ref={rail}
          className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide lg:mx-0 lg:px-0"
        >
          {reels.map((p) => {
            const img = firstImage(p.images);
            const file = parseVideoLink(p.videoUrl);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(p)}
                aria-label={`Watch the video of ${p.name}`}
                className="group relative flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-[#F4EBDD] text-left shadow-sm w-[44%] sm:w-[26%] lg:w-[19%] cursor-pointer"
                style={{ aspectRatio: "9/16" }}
              >
                {file?.kind === "file" ? (
                  // A video file previews right on the card: muted, looping, no sound until opened
                  <video
                    src={file.url}
                    poster={img ?? undefined}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  img && (
                  <Image
                    src={img}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 44vw, (max-width: 1024px) 26vw, 19vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  )
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden />
                <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#4A0D18] shadow-lg">
                  <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
                </span>
                {p.videoSingleProduct && (
                  <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                    <span className="line-clamp-2 block text-[14px] font-semibold leading-snug">{p.name}</span>
                    <span className="mt-0.5 block text-[15px] font-bold">{inr(Number(p.price))}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {reels.length > 2 && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous videos"
              className="absolute left-0 top-1/2 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-[#F4EBDD] lg:flex cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next videos"
              className="absolute right-0 top-1/2 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-[#F4EBDD] lg:flex cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      <Sheet
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.videoSingleProduct ? active.name : vendorName}
        description={active?.videoSingleProduct ? `From ${vendorName}` : undefined}
      >
        {active && link && (
          <div className="mx-auto w-full max-w-[400px]">
            <div className="overflow-hidden rounded-2xl bg-black">
              {link.kind === "file" ? (
                <video
                  key={link.url}
                  src={link.url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  poster={firstImage(active.images) ?? undefined}
                  className="block h-[min(56vh,540px)] w-full object-contain"
                >
                  Your browser can’t play this video.
                </video>
              ) : (
                <iframe
                  src={link.embedUrl ?? undefined}
                  title={`Video of ${active.name}`}
                  className="block h-[min(56vh,540px)] w-full bg-fill"
                  allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>

            {/* A video of several items shows no price or buy controls — only a video of one item does */}
            {active.videoSingleProduct && (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-[22px] font-bold text-label">{inr(price)}</span>
                  {compareAt > price && <span className="text-[15px] text-label-2 line-through">{inr(compareAt)}</span>}
                </div>

                <div className="mt-2">
                  {soldOut ? (
                    <p className="rounded-xl bg-fill px-4 py-3 text-center text-[15px] font-semibold text-label-2">Sold out</p>
                  ) : (
                    <AddStepper
                      size="lg"
                      disabled={soldOut}
                      chooseSizeHref={hasSizes(active) ? `/products/${active.id}` : undefined}
                      item={{
                        id: active.id,
                        name: active.name,
                        price,
                        image: firstImage(active.images) ?? undefined,
                        stockQuantity: active.stockQuantity,
                        vendorId: active.vendorId,
                        vendorName,
                      }}
                    />
                  )}
                </div>
              </>
            )}

            <div className="mt-3 flex gap-2">
              {active.videoSingleProduct && (
                <Link
                  href={`/products/${active.id}`}
                  className="flex h-11 flex-1 items-center justify-center rounded-full bg-fill text-[14px] font-semibold text-label hover:bg-fill-strong"
                >
                  See details
                </Link>
              )}
              {link.kind === "instagram" && (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-fill text-[14px] font-semibold text-label hover:bg-fill-strong"
                >
                  Open in Instagram
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
