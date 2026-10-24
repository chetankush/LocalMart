"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleAlert, CircleCheck, Heart, Megaphone, Send } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { Field, FormCard, inputClass, textareaClass } from "@/components/app/form";
import { IconBox, SectionHeader } from "@/components/app/seller";

const TITLE_MAX = 100;
const MESSAGE_MAX = 500;

// Server errors → plain words that say what to do next
function friendlyError(msg?: string) {
  if (!msg) return "Couldn't send the offer. Please try again.";
  if (/no subscribers/i.test(msg))
    return "No customers have added your shop to their Favourite shops yet. Share your shop link first, then send offers.";
  return msg;
}

function Counter({ n, max }: { n: number; max: number }) {
  return (
    <span className={`shrink-0 tabular-nums ${n >= max * 0.9 ? "text-warn" : "text-label-3"}`}>
      {n}/{max}
    </span>
  );
}

/**
 * "Send an offer": a short headline + message that goes as a notification to
 * every customer who saved this shop. Live preview shows how it will look.
 */
export default function BroadcastPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopName, setShopName] = useState<string | null>(null);

  // Check if user is authenticated vendor on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const result = await apiClient.checkVendor();

        if (!result.data?.hasVendor) {
          router.push("/become-vendor");
          return;
        }

        // Shop name for the preview (read from the URL here, so the page needs no Suspense boundary)
        const storeId = new URLSearchParams(window.location.search).get("storeId");
        const stores = result.data.stores ?? [];
        const shop = stores.find((s) => s.id === storeId) ?? stores[0];
        setShopName(shop?.businessName ?? null);

        setIsLoading(false);
      } catch (err: any) {
        console.error("[BroadcastPage] Auth check error:", err);
        router.push("/sign-in");
      }
    };

    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim()) {
      setError("Add a headline, e.g. “Diwali sale: 20% off on all sarees”.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Write a short message: what is the offer and till when?");
      return;
    }

    if (formData.message.length > MESSAGE_MAX) {
      setError(`Message is too long. Keep it under ${MESSAGE_MAX} letters.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.sendBroadcast(formData);

      if (data.success) {
        const count = Number(data.data?.count);
        const sentText = Number.isFinite(count)
          ? `Offer sent to ${count} customer${count === 1 ? "" : "s"}.`
          : data.message;
        setSuccess(sentText);
        toast.success(sentText);
        setFormData({ title: "", message: "" });

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/vendor/dashboard");
        }, 2000);
      } else {
        setError(friendlyError((data as any).error || data.message));
      }
    } catch (err: any) {
      console.error("[BroadcastPage] Broadcast error:", err);
      setError(friendlyError(err?.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Page>
        <div className="mb-3 h-6 w-20 rounded-full bg-fill-strong animate-pulse" />
        <div className="mb-6 h-9 w-52 rounded-xl bg-fill-strong animate-pulse" />
        <div className="space-y-4 rounded-2xl bg-card p-4 sm:p-5" aria-busy="true" aria-label="Loading">
          <div className="h-5 w-32 rounded-full bg-fill animate-pulse" />
          <div className="h-12 rounded-xl bg-fill animate-pulse" />
          <div className="h-28 rounded-xl bg-fill animate-pulse" />
        </div>
      </Page>
    );
  }

  const { title, message } = formData;

  return (
    <Page>
      <LargeTitle
        title="Send an offer"
        subtitle="Tell your customers about a sale or new stock · ग्राहकों को ऑफ़र भेजें"
        back={{ href: "/vendor/dashboard", label: "Home" }}
      />

      <div className="mb-4">
        <Notice tone="info" icon={<Heart className="h-5 w-5 text-info" aria-hidden />}>
          Goes to every customer who added your shop to their <b>Favourite shops</b>. They see it in their
          notifications.
        </Notice>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <FormCard title="Your offer">
          <Field
            label="Headline"
            htmlFor="title"
            hint={
              <span className="flex justify-between gap-3">
                <span>Short and clear, like a shop board</span>
                <Counter n={title.length} max={TITLE_MAX} />
              </span>
            }
          >
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Diwali sale: 20% off"
              maxLength={TITLE_MAX}
              className={inputClass}
              disabled={isSubmitting}
            />
          </Field>

          <Field
            label="Message"
            htmlFor="message"
            hint={
              <span className="flex justify-between gap-3">
                <span>What is the offer, and till when?</span>
                <Counter n={message.length} max={MESSAGE_MAX} />
              </span>
            }
          >
            <textarea
              id="message"
              value={message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="e.g. All silk sarees 20% off till Sunday. Come to the shop or order on LocalMart."
              rows={5}
              maxLength={MESSAGE_MAX}
              className={textareaClass}
              disabled={isSubmitting}
            />
          </Field>

          {error && (
            <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
              <span role="alert">{error}</span>
            </Notice>
          )}

          {success && (
            <Notice tone="ok" icon={<CircleCheck className="h-5 w-5 text-ok" aria-hidden />}>
              <span role="status">{success} Taking you home…</span>
            </Notice>
          )}
        </FormCard>

        {/* ── Live preview ── */}
        <section className="mb-6">
          <SectionHeader title="How customers will see it" />
          <div className="flex items-start gap-3 rounded-2xl bg-card p-4">
            <IconBox tone="solid" size={40}>
              <Megaphone className="h-5 w-5" />
            </IconBox>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[14px] font-medium text-label-2">{shopName ?? "Your shop"}</p>
                <span className="shrink-0 text-[13px] text-label-3">now</span>
              </div>
              <p
                className={`mt-0.5 break-words text-[16px] font-semibold leading-snug ${
                  title.trim() ? "text-label" : "text-label-3"
                }`}
              >
                {title.trim() || "Your headline"}
              </p>
              <p
                className={`mt-0.5 whitespace-pre-line break-words text-[15px] leading-snug ${
                  message.trim() ? "text-label-2" : "text-label-3"
                }`}
              >
                {message.trim() || "Your message shows here."}
              </p>
            </div>
          </div>
        </section>

        <StickyBar aboveTabBar>
          <Button type="submit" full loading={isSubmitting} disabled={isSubmitting || Boolean(success)}>
            {!isSubmitting && <Send className="h-5 w-5" aria-hidden />}
            {isSubmitting ? "Sending…" : "Send offer"}
          </Button>
        </StickyBar>
      </form>

      <StickyBarSpacer />
    </Page>
  );
}
