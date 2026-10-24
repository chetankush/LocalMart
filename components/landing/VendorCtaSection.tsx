"use client";

import Link from "next/link";
import { Bell, IndianRupee, Store } from "lucide-react";
import { useLocation } from "@/context/LocationContext";

const points = [
  { icon: Store, text: "Your shop online in minutes" },
  { icon: Bell, text: "New orders on your phone and Telegram" },
  { icon: IndianRupee, text: "Customers pay you directly — UPI or cash" },
];

export default function VendorCtaSection() {
  const { location } = useLocation();

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-navy-3 px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-saffron">For shop owners</p>
          <h2 className="mt-1 text-[22px] font-bold leading-tight sm:text-[26px]">
            Sell to customers in {location?.city || "your city"}
          </h2>
          <ul className="mt-3 space-y-1.5">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-[15px] text-white/85">
                <Icon className="h-4 w-4 shrink-0 text-saffron" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/become-vendor"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-[16px] font-semibold text-navy-3 hover:bg-tint-soft"
        >
          Open your shop
        </Link>
      </div>
    </section>
  );
}
