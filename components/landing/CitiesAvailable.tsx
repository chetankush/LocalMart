"use client";

interface Props {
  cities: { city: string; vendorCount: number }[];
  onNotifyMe?: () => void;
}

export default function CitiesAvailable({ cities, onNotifyMe }: Props) {
  if (!cities || cities.length === 0) return null;

  return (
    <section className="bg-white border-y border-sand">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="text-center mb-6">
          <p className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase mb-2">
            Now serving
          </p>
          <h2 className="font-heading text-ink text-2xl sm:text-3xl font-semibold tracking-tight">
            Real local shops in {cities.length} {cities.length === 1 ? "city" : "cities"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {cities.slice(0, 24).map((c) => (
            <span
              key={c.city}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ivory border border-sand text-ink text-sm font-medium"
            >
              {c.city}
              <span className="text-ink-2 text-xs tabular-nums">· {c.vendorCount}</span>
            </span>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-ink-2">
          Don&apos;t see your city?{" "}
          <button
            type="button"
            onClick={onNotifyMe}
            className="text-primary-dark font-semibold hover:text-ink underline-offset-2 hover:underline"
          >
            Get notified when we launch
          </button>
        </div>
      </div>
    </section>
  );
}
