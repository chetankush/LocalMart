import { MapPin } from "lucide-react";

/**
 * The page's one main heading for first-time visitors (and for Google):
 * what LocalMart is, in plain words, and the one thing to do next.
 */
export default function FirstVisitIntro({ onChoose }: { onChoose: () => void }) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-5 sm:px-6 lg:px-8">
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-label sm:text-[34px]">
        Shop from local shops in your town
      </h1>
      <p className="mt-1 text-[16px] text-label-2">
        अपने शहर की दुकानों से घर बैठे खरीदें · Home delivery by the shop · Cash on delivery or UPI
      </p>
      <button
        type="button"
        onClick={onChoose}
        className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-cta px-6 text-[16px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
      >
        <MapPin className="h-5 w-5" aria-hidden />
        Choose your area
      </button>
    </section>
  );
}
