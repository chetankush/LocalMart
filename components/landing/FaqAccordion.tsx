"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    q: "How fast is local delivery?",
    a: "Most orders from kirana and pharmacy shops arrive in 20 to 45 minutes. Each store shows its live delivery estimate at checkout.",
  },
  {
    q: "Are products authentic?",
    a: "Yes. Every vendor is a verified physical shop. We sort by distance from your pincode so you buy from the shopkeeper around the corner.",
  },
  {
    q: "How do I track my order?",
    a: "Each order page has live status from the moment the shopkeeper accepts it. You can also chat with the vendor directly inside the app.",
  },
  {
    q: "What is the return policy?",
    a: "Returns happen directly with the shopkeeper. Most categories allow returns within 7 days. Groceries are handled case by case from the order page.",
  },
  {
    q: "Which payment methods are supported?",
    a: "UPI (PhonePe, GPay, Paytm), all major debit and credit cards, netbanking, and cash on delivery. Refunds go back to the original method in 3 to 5 working days.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white border-y border-sand">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-8">
          <p className="font-heading text-[10px] sm:text-[11px] font-semibold text-accent tracking-[0.22em] uppercase mb-2">
            Frequently Asked
          </p>
          <h2 className="font-heading text-ink text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight">
            Questions, answered
          </h2>
        </div>

        <ul className="divide-y divide-sand border-y border-sand">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <li key={i}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full text-left py-4 sm:py-5 flex items-center gap-4 group cursor-pointer"
                >
                  <span className="flex-1 font-heading text-ink text-sm sm:text-base font-semibold">
                    {faq.q}
                  </span>
                  <span
                    aria-hidden
                    className={`shrink-0 text-ink text-2xl font-light leading-none transition-transform duration-300 ${
                      isOpen ? "rotate-45" : "rotate-0"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-ink-2 text-sm sm:text-[15px] leading-relaxed pr-8">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="text-center mt-6">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-dark hover:text-ink transition-colors"
          >
            See all FAQs →
          </Link>
        </div>
      </div>
    </section>
  );
}
