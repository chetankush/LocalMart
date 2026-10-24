import { MapPin, ShoppingBag, Truck } from "lucide-react";
import { HomeSection } from "@/components/app/commerce";

const steps = [
  { icon: MapPin, title: "Choose your area", text: "Enter your PIN code to see shops that deliver to you." },
  { icon: ShoppingBag, title: "Order from the shop", text: "Add items to your cart. The shop confirms price and stock." },
  { icon: Truck, title: "Shop delivers", text: "Pay cash on delivery, or UPI straight to the shop." },
];

/** Three plain steps — mainly for first-time visitors */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept so existing callers still type-check
export default function HowItWorksHorizontal(_props: { authenticated?: boolean } = {}) {
  return (
    <HomeSection title="How LocalMart works">
      <ol className="grid gap-3 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-fill p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-label">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-label">
                {i + 1}. {title}
              </span>
              <span className="block text-[14px] text-label-2">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </HomeSection>
  );
}
