"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Store } from "lucide-react";
import { Button, EmptyState, Notice } from "@/components/app/ui";
import { apiError } from "@/components/ads/adLabels";
import { subscribeChat } from "@/lib/chat/stream";
import { listTime } from "@/lib/chat/time";
import type { ChatSide, ChatSummary } from "@/lib/chat/types";

/**
 * The list of chats (a buyer's, or a shop's inbox), newest first. Updates
 * live: a new message moves its chat to the top with the unread count.
 */
export default function ChatList({ side, storeQuery = "", emptyText }: { side: ChatSide; storeQuery?: string; emptyText?: string }) {
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (before?: string) => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const q = new URLSearchParams(storeQuery.replace(/^\?/, ""));
        q.set("as", side === "SHOP" ? "shop" : "buyer");
        if (before) q.set("before", before);
        const r = await apiClient.get<{ data: { chats: ChatSummary[]; nextBefore: string | null } }>(`/chats?${q}`);
        setChats((prev) => (before && prev ? [...prev, ...r.data.chats] : r.data.chats));
        setNextBefore(r.data.nextBefore);
        setError(null);
      } catch (err) {
        setError(apiError(err).message || "Couldn't load chats. Check your internet.");
      }
    },
    [side, storeQuery],
  );

  useEffect(() => {
    load();
    return subscribeChat((e) => {
      if (e.type === "reconnected") return void load();
      if (e.type !== "message" || e.conversation.side !== side) return;
      // The chat with the new message goes to the top
      setChats((prev) => [e.conversation, ...(prev ?? []).filter((c) => c.id !== e.conversationId)]);
    });
  }, [load, side]);

  if (error) return <Notice tone="bad">{error}</Notice>;
  if (!chats)
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading chats">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  if (chats.length === 0)
    return (
      <EmptyState
        icon={<MessageCircle className="h-7 w-7" aria-hidden />}
        title="No chats yet"
        body={emptyText ?? (side === "SHOP" ? "When a buyer writes to your shop, the chat shows up here and your phone rings." : "Tap “Message the shop” on any shop or item to start a chat.")}
      />
    );

  return (
    <>
      <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
        {chats.map((c) => (
          <ChatRow key={c.id} c={c} href={side === "SHOP" ? `/vendor/chats/${c.id}${storeQuery}` : `/chats/${c.id}`} />
        ))}
      </ul>
      {nextBefore && (
        <Button
          variant="secondary"
          full
          className="mt-3"
          loading={loadingMore}
          onClick={async () => {
            setLoadingMore(true);
            await load(nextBefore);
            setLoadingMore(false);
          }}
        >
          Show older chats
        </Button>
      )}
    </>
  );
}

const ChatRow = memo(function ChatRow({ c, href }: { c: ChatSummary; href: string }) {
  const name = c.side === "BUYER" ? c.shop.name : c.buyer.name || "Buyer";
  return (
    <li>
      <Link href={href} className="flex min-h-[72px] items-center gap-3 px-4 py-3 active:bg-fill">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-fill text-[17px] font-semibold text-label-2">
          {c.side === "BUYER" ? (
            c.shop.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.shop.logo} alt="" className="h-full w-full object-cover" />
            ) : (
              <Store className="h-5 w-5" aria-hidden />
            )
          ) : (
            (name[0] || "?").toUpperCase()
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-[16px] ${c.unread ? "font-bold" : "font-semibold"} text-label`}>{name}</span>
            <span className={`shrink-0 text-[12px] tabular-nums ${c.unread ? "font-semibold text-tint" : "text-label-3"}`}>{listTime(c.lastMessageAt)}</span>
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className={`truncate text-[14px] ${c.unread ? "font-medium text-label" : "text-label-2"}`}>
              {c.lastFromMe && "You: "}
              {c.lastMessageText}
            </span>
            {c.unread > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-tint px-1.5 text-[12px] font-bold text-white" aria-label={`${c.unread} unread`}>
                {c.unread > 99 ? "99+" : c.unread}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
});
