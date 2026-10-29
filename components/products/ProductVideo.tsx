"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { parseVideoLink } from "@/lib/videoLink";

/**
 * "Watch the video" on an item page: the shop's own Instagram reel of it.
 * Instagram's player only loads when the buyer taps (keeps the page fast and
 * sends nothing to Instagram before that). If the reel was deleted or made
 * private, "Open in Instagram" still says so plainly there.
 */
export default function ProductVideo({ videoUrl, productName }: { videoUrl?: string | null; productName: string }) {
  const [open, setOpen] = useState(false);
  const link = parseVideoLink(videoUrl);
  if (!link) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-card px-4 py-3 text-left transition-colors hover:bg-fill active:bg-fill cursor-pointer"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-white">
          <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-snug text-label">Watch the video · वीडियो देखें</span>
          <span className="block text-[13px] leading-snug text-label-2">From the shop’s Instagram</span>
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Video" description={productName}>
        <div className="mx-auto w-full max-w-[400px] overflow-hidden rounded-2xl bg-fill">
          <iframe
            src={link.embedUrl}
            title={`Video of ${productName}`}
            className="block h-[min(64vh,620px)] w-full"
            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto mt-3 flex h-12 w-full max-w-[400px] items-center justify-center gap-2 rounded-full bg-fill text-[15px] font-semibold text-label hover:bg-fill-strong"
        >
          Open in Instagram
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </Sheet>
    </>
  );
}
