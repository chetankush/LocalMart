"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HomeSection } from "@/components/app/commerce";
import { jsonLd } from "@/lib/seo";

const faqs = [
  {
    q: "Who delivers my order?",
    a: "The shop itself. After the shopkeeper confirms your order they pack it and deliver it, usually the same day. Each shop shows its delivery charge before you order.",
  },
  {
    q: "How do I pay?",
    a: "Cash on delivery, or UPI (PhonePe, Google Pay, Paytm) straight to the shop. You only pay after the shop confirms the price and stock.",
  },
  {
    q: "Are the shops real?",
    a: "Yes. Every shop is a physical store in your area. You can see its address and call the shop from its page.",
  },
  {
    q: "How do I track my order?",
    a: "Open Orders at the bottom of the screen. You'll see when the shop confirms, packs and sends out your order.",
  },
  {
    q: "Can I return something?",
    a: "Returns and exchanges are handled by the shopkeeper. Call the shop from your order page — most shops accept returns of unused items within a few days.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <HomeSection title="Questions? Answers" href="/faq" linkLabel="All FAQs">
      {/* Lets Google show these answers in search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        })}
      />
      <ul className="divide-y divide-hairline border-y border-hairline">
        {faqs.map((faq, i) => {
          const isOpen = open === i;
          return (
            <li key={faq.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex min-h-[52px] w-full items-center gap-4 py-3 text-left cursor-pointer"
              >
                <span className="flex-1 text-[16px] font-semibold text-label">{faq.q}</span>
                <ChevronDown
                  aria-hidden
                  className={`h-5 w-5 shrink-0 text-label-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <p className="pr-6 text-[15px] leading-relaxed text-label-2">{faq.a}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </HomeSection>
  );
}
