"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useChatUnread } from "@/lib/chat/useChatUnread";

/** The buyer's chats, with how many messages are waiting */
export default function ChatButton({ withLabel = false }: { withLabel?: boolean }) {
  const { buyer } = useChatUnread(true);
  return (
    <Link
      href="/chats"
      aria-label={buyer ? `Chats, ${buyer} unread` : "Chats"}
      className={`relative flex h-11 items-center justify-center gap-2 rounded-full text-label hover:bg-fill ${withLabel ? "rounded-lg px-3 text-[15px] font-medium" : "w-11"}`}
    >
      <MessageCircle className={withLabel ? "h-5 w-5" : "h-6 w-6"} strokeWidth={1.9} aria-hidden />
      {withLabel && "Chats"}
      {buyer > 0 && (
        <span className={`absolute flex h-5 min-w-5 items-center justify-center rounded-full bg-tint px-1 text-[11px] font-bold text-white ${withLabel ? "left-6 top-1" : "right-0.5 top-0.5"}`}>
          {buyer > 99 ? "99+" : buyer}
        </span>
      )}
    </Link>
  );
}
