"use client";

import { MessageCircle } from "lucide-react";
import { MessageShopButton } from "@/components/contact/MessageShop";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { waText, whatsappLinkProps } from "@/lib/contact";

/** "Questions? Message the shop" — for shop designs that have no contact buttons of their own */
export default function ShopContactCard({ vendor }: { vendor: { id: string; businessName: string; whatsappNumber?: string | null } }) {
  const wa = whatsappLinkProps({ number: vendor.whatsappNumber, text: waText.shop(vendor.businessName), vendorId: vendor.id, source: "SHOP" });
  return (
    <section aria-label={`Message ${vendor.businessName}`} className="mx-auto my-8 max-w-[1100px] px-4">
      <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[18px] font-semibold text-label">Questions? Message the shop</p>
          <p className="mt-0.5 text-[15px] text-label-2">Ask about price, size or delivery · दुकान से पूछें</p>
        </div>
        <div className={`grid gap-2 sm:w-[340px] sm:shrink-0 ${wa ? "grid-cols-2" : "grid-cols-1"}`}>
          <MessageShopButton
            target={{ vendor, source: "SHOP" }}
            className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-cta text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> Message
          </MessageShopButton>
          {wa && (
            <a {...wa} className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label">
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
