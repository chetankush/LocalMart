import { MapPin } from "lucide-react";

/**
 * The page's one main heading for first-time visitors (and for Google):
 * what LocalMart is, in plain words, and the one thing to do next.
 */
export default function FirstVisitIntro({ onChoose }: { onChoose: () => void }) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
      <h1 className="text-[20px] font-bold leading-tight tracking-[-0.02em] text-label sm:text-[28px] lg:text-[34px]">
        Shop from local shops in your town
      </h1>
      <p className="mt-0.5 line-clamp-1 text-[13px] text-label-2 sm:line-clamp-none sm:text-[16px]">
        अपने शहर की दुकानों से घर बैठे खरीदें · Home delivery by the shop · Cash on delivery or UPI
      </p>
      {/* Phones: the header and the first banner already ask for the area */}
      <button
        type="button"
        onClick={onChoose}
        className="mt-4 hidden h-12 items-center gap-2 rounded-full bg-cta px-6 text-[16px] font-semibold text-white hover:bg-cta-hover lg:inline-flex cursor-pointer"
      >
        <MapPin className="h-5 w-5" aria-hidden />
        Choose your area
      </button>
    </section>
  );
}
