import Link from "next/link";
import { Banknote, MapPin, ShieldCheck, Truck } from "lucide-react";

interface Props {
  locationLabel?: string;
  shopCount: number;
}

const promises = [
  { icon: Truck, title: "Delivered by the shop", text: "Usually the same day" },
  { icon: Banknote, title: "Cash or UPI", text: "Pay when it arrives" },
  { icon: ShieldCheck, title: "Shop confirms first", text: "Price & stock checked" },
];

/** Location-aware banner at the top of the home page */
export default function HomeHero({ locationLabel, shopCount }: Props) {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-tint-soft px-6 py-7 sm:px-10 sm:py-12">
        <p className="flex items-center gap-1.5 text-[14px] font-medium text-label-2">
          <MapPin className="h-4 w-4 text-tint" aria-hidden />
          {locationLabel
            ? `${shopCount} ${shopCount === 1 ? "shop delivers" : "shops deliver"} in ${locationLabel}`
            : "Shops near you"}
        </p>
        <h1 className="mt-2 max-w-xl text-[28px] font-bold leading-[1.12] tracking-[-0.02em] text-label sm:text-[40px]">
          Your local market, now at your door.
        </h1>
        <p className="mt-2 text-[16px] text-label-2 sm:text-[18px]">अपने शहर की दुकानों से घर बैठे खरीदें</p>
        <Link
          href="/stores"
          className="mt-5 inline-flex h-11 items-center rounded-full bg-cta px-6 text-[16px] font-semibold text-white hover:bg-cta-hover"
        >
          Browse shops
        </Link>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-6">
        {promises.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3 sm:text-left">
            <Icon className="h-6 w-6 shrink-0 text-label" strokeWidth={1.75} aria-hidden />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold leading-tight text-label sm:text-[15px]">{title}</span>
              <span className="block text-[12px] leading-tight text-label-2 sm:text-[13px]">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
