"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { Field, inputClass, textareaClass } from "@/components/app/form";
import { useAuth } from "@/lib/supabase/auth-provider";
import { apiError } from "@/components/ads/adLabels";
import { rememberContact, savedContact, trackContact, whatsappHref, type ContactSource } from "@/lib/contact";

/**
 * "Message the shop": the buyer's message, name and number go straight to the
 * shop's LocalMart inbox (and ring the seller's phone). The shop replies on
 * WhatsApp or calls back. Each message is a real lead for the shop.
 */
export type MessageShopTarget = {
  vendor: { id: string; businessName: string; whatsappNumber?: string | null };
  product?: { id: string; name: string };
  source: ContactSource;
};


const QUICK: Record<"SHOP" | "PRODUCT" | "RENT", string[]> = {
  SHOP: ["Kya dukaan abhi khuli hai?", "Home delivery milegi?", "Price list bhej dijiye"],
  PRODUCT: ["Kya yeh available hai?", "Sabse kam price kya hoga?", "Home delivery milegi?"],
  RENT: ["Kal se khaali hai?", "Site par pahuncha denge?", "Kitne din ka kitna lagega?"],
};

function firstMessage(t: MessageShopTarget) {
  if (t.source === "RENT" && t.product) return `Namaste, "${t.product.name}" kiraye par chahiye.`;
  if (t.product) return `Namaste, "${t.product.name}" ke baare mein poochna hai.`;
  return "Namaste, mujhe kuch saaman chahiye.";
}

export function MessageShopSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: MessageShopTarget }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ shopName: string } | null>(null);

  // Fresh form each time it opens; name and number remembered on this phone
  useEffect(() => {
    if (!open) return;
    const saved = savedContact(user?.id);
    setName(saved.name || (user?.user_metadata?.full_name as string) || "");
    setPhone(saved.phone || "");
    setMessage(firstMessage(target));
    setErrors({});
    setSent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const quick = QUICK[target.source === "RENT" ? "RENT" : target.product ? "PRODUCT" : "SHOP"];
  const addQuick = (q: string) => setMessage((m) => (m.includes(q) ? m : `${m.trim()} ${q}`.trim()));

  const send = async () => {
    const digits = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Add your name";
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = "Add your 10-digit mobile number";
    if (!message.trim()) e.message = "Write what you need";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.post<{ success: boolean; data: { shopName: string } }>("/enquiries", {
        vendorId: target.vendor.id,
        productId: target.product?.id,
        name: name.trim(),
        phone: digits,
        message: message.trim(),
        source: target.source === "RENT" ? "RENT" : target.product ? "PRODUCT" : "SHOP",
      });
      rememberContact(user?.id, { name: name.trim(), phone: digits });
      setSent({ shopName: res?.data?.shopName ?? target.vendor.businessName });
    } catch (err) {
      setErrors({ form: apiError(err).message || "Couldn't send. Check your internet and try again." });
    } finally {
      setSending(false);
    }
  };

  const wa = whatsappHref(target.vendor.whatsappNumber, `Namaste, maine LocalMart par message bheja hai: ${message.trim()}`);

  if (sent) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Message sent"
        footer={
          <div className="flex flex-col gap-2">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContact({ vendorId: target.vendor.id, kind: "WHATSAPP", source: target.source, productId: target.product?.id })}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-[16px] font-semibold text-white hover:brightness-95 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                Also chat on WhatsApp
              </a>
            )}
            <button type="button" onClick={onClose} className="h-12 w-full rounded-full border border-hairline bg-card text-[16px] font-semibold text-label cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <CheckCircle2 className="h-12 w-12 text-ok" aria-hidden />
          <p className="mt-3 text-[17px] font-semibold text-label">{sent.shopName} got your message</p>
          <p className="mt-1 text-[15px] text-label-2">They&apos;ll reply on WhatsApp or call you on {phone.replace(/\D/g, "").slice(-10)}.</p>
          <p className="mt-1 text-[14px] text-label-3">संदेश दुकान को भेज दिया गया</p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Message ${target.vendor.businessName}`}
      description={target.product ? `About: ${target.product.name}` : "दुकान को संदेश भेजें"}
      footer={
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Send className="h-5 w-5" aria-hidden />}
          {sending ? "Sending…" : "Send message"}
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Your message" htmlFor="ms-message" error={errors.message}>
          <textarea id="ms-message" value={message} onChange={(e) => setMessage(e.target.value)} className={textareaClass} maxLength={500} />
        </Field>
        <div className="flex flex-wrap gap-2" aria-label="Quick add">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => addQuick(q)}
              className="min-h-[40px] rounded-full border border-hairline bg-card px-3.5 text-[14px] text-label cursor-pointer hover:border-tint"
            >
              + {q}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Your name" htmlFor="ms-name" error={errors.name}>
            <input id="ms-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" placeholder="e.g. Ravi Kushwah" maxLength={60} />
          </Field>
          <Field label="Mobile number" htmlFor="ms-phone" error={errors.phone}>
            <input id="ms-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} inputMode="tel" autoComplete="tel" placeholder="10-digit number" maxLength={16} />
          </Field>
        </div>
        <p className="text-[14px] leading-snug text-label-3">
          Your name and number go to {target.vendor.businessName} so they can reply. · आपका नाम और नंबर दुकान को जाएगा।
        </p>
        {errors.form && (
          <p role="alert" className="text-[15px] text-bad">
            {errors.form}
          </p>
        )}
      </div>
    </Sheet>
  );
}

/** A button that opens the sheet. Pass className to match a shop theme. */
export function MessageShopButton({
  target,
  className,
  children,
}: {
  target: MessageShopTarget;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cta px-5 text-[16px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
        }
      >
        {children ?? (
          <>
            <MessageCircle className="h-5 w-5" aria-hidden />
            Message the shop
          </>
        )}
      </button>
      <MessageShopSheet open={open} onClose={() => setOpen(false)} target={target} />
    </>
  );
}
