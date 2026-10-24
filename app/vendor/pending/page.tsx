import { Clock } from "lucide-react";
import { Button } from "@/components/app/ui";
import { MessageCard } from "@/components/app/seller";

const SUPPORT_EMAIL = "support@nearstore.in";

const NEXT_STEPS = [
  { title: "LocalMart checks your shop", body: "Usually 2–3 working days" },
  { title: "We email you", body: "As soon as your shop is approved" },
  { title: "Add products and start selling", body: "Customers near you can order" },
];

export default function VendorPendingPage() {
  return (
    <MessageCard
      icon={<Clock className="h-8 w-8" aria-hidden />}
      title="LocalMart is checking your shop"
      body={
        <>
          We&apos;ll email you when it&apos;s approved.
          <span className="mt-1 block text-[15px]">आपकी दुकान की जाँच हो रही है</span>
        </>
      }
    >
      <ol className="space-y-4 rounded-2xl bg-fill p-4 text-left">
        {NEXT_STEPS.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3">
            <span
              aria-hidden
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
                i === 0 ? "bg-warn-soft text-warn" : "bg-card text-label-2"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 pt-1">
              <span className="block text-[16px] font-semibold leading-snug text-label">{step.title}</span>
              <span className="mt-0.5 block text-[14px] leading-snug text-label-2">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <Button href="/vendor/dashboard" full>
        Go to my shop
      </Button>
      <Button href="/" variant="secondary" full>
        Go to home
      </Button>
      <p className="pt-2 text-[14px] text-label-2">
        Questions? Write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-tint">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </MessageCard>
  );
}
