import HeroCarousel from "../HeroCarousel";

const trustItems = [
  { label: "Local stores" },
  { label: "Same-day delivery" },
  { label: "Verified vendors" },
];

export default function HeroBanner() {
  return (
    <section className="bg-ivory">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-sand shadow-[0_8px_30px_rgb(28,28,46,0.08)] h-[420px] sm:h-[480px] lg:h-[540px]">
          <HeroCarousel />
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-ink-2">
          {trustItems.map((item, i) => (
            <span key={item.label} className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
              <span className="font-medium">{item.label}</span>
              {i < trustItems.length - 1 && <span className="hidden sm:inline text-sand" aria-hidden>·</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
