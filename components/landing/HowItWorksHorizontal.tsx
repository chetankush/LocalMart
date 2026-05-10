"use client";

import { useEffect, useState } from "react";
import { hasSeenHowItWorks, markHowItWorksSeen } from "@/lib/landing/seenHowItWorks";

const steps = [
  { num: "01", title: "Browse local stores", desc: "Set your pincode. See shops delivering to your street right now." },
  { num: "02", title: "Order in a tap", desc: "Add to cart, pay by UPI or COD, message the shopkeeper directly." },
  { num: "03", title: "Receive same-day", desc: "Most kirana and pharmacy orders arrive in 20 to 45 minutes." },
];

interface Props {
  authenticated?: boolean;
}

export default function HowItWorksHorizontal({ authenticated = false }: Props) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (authenticated && hasSeenHowItWorks()) {
      setHidden(true);
      return;
    }
    if (authenticated) markHowItWorksSeen();
  }, [authenticated]);

  if (hidden) return null;

  return (
    <section className="bg-cream border-y border-sand">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <p className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase mb-2">
              How LocalMart Works
            </p>
            <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
              Three steps to your shopkeeper
            </h2>
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((s) => (
            <li key={s.num} className="bg-white rounded-2xl border border-sand p-5 flex gap-4">
              <span className="font-heading text-2xl sm:text-3xl font-semibold text-accent tabular-nums leading-none shrink-0">
                {s.num}
              </span>
              <div>
                <h3 className="font-heading text-ink text-base font-semibold mb-1">{s.title}</h3>
                <p className="text-ink-2 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
