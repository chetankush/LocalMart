import Link from "next/link";
import { Map as MapIcon, Search, Store } from "lucide-react";
import { Button } from "@/components/app/ui";

export const metadata = {
  title: "Page not found | LocalMart",
};

/**
 * Shown for any address that doesn't exist (an old link, a typo). Plain
 * words, then the three places people usually want to go.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[520px] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fill text-label-2">
        <Search className="h-7 w-7" aria-hidden />
      </div>
      <h1 className="mt-5 text-[24px] font-bold leading-tight tracking-[-0.01em] text-label sm:text-[28px]">
        We couldn&apos;t find this page
      </h1>
      <p className="mt-1 text-[16px] text-label-2">यह पेज नहीं मिला</p>
      <p className="mt-3 text-[16px] leading-relaxed text-label-2">
        The link may be old, or the shop may have moved it. You can still find what you need from here.
      </p>

      <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href="/" full>
          Go to home
        </Button>
        <Button href="/stores" variant="secondary" full>
          <Store className="h-5 w-5" aria-hidden /> All shops
        </Button>
      </div>
      <Link
        href="/map"
        className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-tint underline-offset-4 hover:underline"
      >
        <MapIcon className="h-4 w-4" aria-hidden /> See shops on the map
      </Link>
    </main>
  );
}
