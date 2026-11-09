"use client";

import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ContactSource } from "@/lib/contact";

/**
 * "Message the shop": a chat with the shop inside LocalMart (live, both ways),
 * for signed-in buyers only. Someone who isn't signed in is taken to sign in
 * first and then straight into the chat: /chats/new asks for the login and
 * brings them back. There are no anonymous messages (the API refuses them too).
 */
/** Where "Message the shop" opens a chat (with the item to attach) */
export const chatHref = (t: { vendor: { id: string }; product?: { id: string } }) =>
  `/chats/new?shop=${encodeURIComponent(t.vendor.id)}${t.product ? `&product=${encodeURIComponent(t.product.id)}` : ""}`;

export type MessageShopTarget = {
  vendor: { id: string; businessName: string; whatsappNumber?: string | null };
  product?: { id: string; name: string };
  source: ContactSource;
};

/** A button that opens the chat. Pass className to match a shop theme. */
export function MessageShopButton({
  target,
  className,
  children,
}: {
  target: MessageShopTarget;
  className?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      // Always the chat page: it opens the chat when signed in, and asks for the login first when not
      onClick={() => router.push(chatHref(target))}
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
  );
}
