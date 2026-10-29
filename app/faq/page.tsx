import FaqAccordion from "@/components/landing/FaqAccordion";

export const metadata = {
  title: "FAQ — LocalMart",
  description:
    "Frequently asked questions about LocalMart's hyperlocal marketplace, delivery, returns, and payments.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <h1 className="font-heading text-ink text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
          Help & FAQ
        </h1>
        <p className="text-ink-2 text-sm sm:text-base">
          Everything you need to know before placing your first order or opening your shop.
        </p>
      </div>
      <FaqAccordion />
    </main>
  );
}
