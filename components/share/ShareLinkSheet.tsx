"use client";

import { useState } from "react";
import { Check, Copy, Instagram, MessageSquareText } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { buttonClass } from "@/components/app/ui";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { whatsappDigits } from "@/lib/contact";

/**
 * Share one link the way small shops actually do: send it on WhatsApp
 * (straight to the buyer's chat when we know their number), copy the link,
 * copy a ready message, or copy a caption for Instagram.
 */
export function ShareLinkSheet({
  open,
  onClose,
  title,
  description,
  url,
  message,
  instagram,
  whatsappTo,
  whatsappToName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  url: string;
  /** Ready text for WhatsApp (includes the link) */
  message: string;
  /** Caption for an Instagram post / story (includes the link) */
  instagram?: string;
  /** The buyer's number — WhatsApp opens their chat directly */
  whatsappTo?: string | null;
  whatsappToName?: string | null;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <ShareLinkBody url={url} message={message} instagram={instagram} whatsappTo={whatsappTo} whatsappToName={whatsappToName} />
    </Sheet>
  );
}

/** The share buttons on their own, for a page that shows them without a sheet */
export function ShareLinkBody({
  url,
  message,
  instagram,
  whatsappTo,
  whatsappToName,
}: {
  url: string;
  message: string;
  instagram?: string;
  whatsappTo?: string | null;
  whatsappToName?: string | null;
}) {
  const [copied, setCopied] = useState<null | "link" | "message" | "instagram">(null);
  const to = whatsappDigits(whatsappTo);
  const wa = `https://wa.me/${to ?? ""}?text=${encodeURIComponent(message)}`;

  const copy = async (what: "link" | "message" | "instagram", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older phones: select-and-copy fallback
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(what);
    setTimeout(() => setCopied((c) => (c === what ? null : c)), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="break-all rounded-xl bg-card px-4 py-3 text-[16px] font-semibold text-tint" aria-label="Link">
        {url.replace(/^https?:\/\//, "")}
      </p>

      <a href={wa} target="_blank" rel="noopener noreferrer" className={`${buttonClass("primary", "lg", true)} !bg-[#1FA855]`}>
        <WhatsAppIcon className="h-5 w-5" fill="fill-white" />
        {to ? `Send to ${whatsappToName || "them"} on WhatsApp` : "Send on WhatsApp"}
      </a>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => copy("link", url)} className={buttonClass("secondary", "lg", true)}>
          {copied === "link" ? <Check className="h-5 w-5 text-ok" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={() => copy("message", message)} className={buttonClass("secondary", "lg", true)}>
          {copied === "message" ? <Check className="h-5 w-5 text-ok" aria-hidden /> : <MessageSquareText className="h-5 w-5" aria-hidden />}
          {copied === "message" ? "Copied" : "Copy message"}
        </button>
      </div>

      {instagram && (
        <button type="button" onClick={() => copy("instagram", instagram)} className={buttonClass("secondary", "lg", true)}>
          {copied === "instagram" ? <Check className="h-5 w-5 text-ok" aria-hidden /> : <Instagram className="h-5 w-5" aria-hidden />}
          {copied === "instagram" ? "Copied — paste it on Instagram" : "Copy for Instagram"}
        </button>
      )}
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </p>
      {instagram && (
        <p className="text-center text-[13px] leading-snug text-label-2">
          On Instagram, links work in a story&apos;s link sticker, your bio, or a DM.
        </p>
      )}
    </div>
  );
}
