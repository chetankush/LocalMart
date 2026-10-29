"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Link2, Loader2 } from "lucide-react";
import { Pill, Thumb, formatIST, rupees } from "@/components/app/ui";
import { AdminPage, LoadingBlock } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";
import { clock, dayLabel, sameDay } from "@/lib/chat/time";
import type { ChatMessage } from "@/lib/chat/types";

interface AdminThread {
  conversation: {
    id: string;
    shop: { id: string; name: string };
    buyer: { id: string; name: string };
    createdAt: string;
    messageCount: number;
    blocked: boolean;
    shopRepliedAt: string | null;
  };
  messages: ChatMessage[];
  hasMore: boolean;
}

/** One chat, read only, for LocalMart staff: the buyer on the left, the shop on the right */
export default function AdminChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<AdminThread | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const load = useCallback(
    async (before?: string) => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: AdminThread }>(`/admin/chats/${id}${before ? `?before=${before}` : ""}`);
        setData((prev) => (before && prev ? { ...r.data, messages: [...r.data.messages, ...prev.messages] } : r.data));
      } catch (err) {
        toast.error(apiError(err).message || "Couldn't open this chat.");
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <LoadingBlock label="Opening chat…" />;
  const c = data.conversation;

  return (
    <AdminPage title={`${c.shop.name} ↔ ${c.buyer.name || "Buyer"}`} subtitle={`Started ${formatIST(c.createdAt)} · ${c.messageCount} messages`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/admin/chats" className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-card px-3 text-[14px] font-medium text-tint">
          <ChevronLeft className="h-4 w-4" aria-hidden /> All chats
        </Link>
        <Pill tone={c.shopRepliedAt ? "ok" : "warn"}>{c.shopRepliedAt ? `Shop first replied ${formatIST(c.shopRepliedAt)}` : "Shop never replied"}</Pill>
        {c.blocked && <Pill tone="bad">Buyer blocked by the shop</Pill>}
        <Pill tone="neutral">Read only</Pill>
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl bg-card p-4">
        {data.hasMore && (
          <button
            type="button"
            disabled={loadingOlder}
            onClick={async () => {
              setLoadingOlder(true);
              await load(data.messages[0]?.id);
              setLoadingOlder(false);
            }}
            className="mx-auto mb-3 flex min-h-[40px] items-center gap-2 rounded-full bg-fill px-4 text-[14px] font-medium text-tint cursor-pointer"
          >
            {loadingOlder && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Earlier messages
          </button>
        )}
        {data.messages.length === 0 && <p className="py-8 text-center text-label-2">No messages.</p>}
        <ol className="space-y-1.5">
          {data.messages.map((m, i) => {
            const shop = m.senderRole === "SHOP";
            const prev = data.messages[i - 1];
            return (
              <li key={m.id}>
                {(!prev || !sameDay(prev.createdAt, m.createdAt)) && (
                  <p className="my-3 text-center text-[12px] font-semibold uppercase tracking-wide text-label-3">{dayLabel(m.createdAt)}</p>
                )}
                <div className={`flex flex-col ${shop ? "items-end" : "items-start"}`}>
                  <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-label-3">{shop ? c.shop.name : c.buyer.name || "Buyer"}</span>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${shop ? "rounded-br-md bg-tint-soft text-label" : "rounded-bl-md bg-fill text-label"}`}>
                    {m.product && (
                      <Link href={`/products/${m.product.id}`} className="mb-1.5 flex items-center gap-2 rounded-xl bg-card p-1.5">
                        <Thumb src={m.product.image} alt="" size={40} />
                        <span className="text-[13px] font-semibold">
                          {m.product.name} · {rupees(m.product.price)}
                        </span>
                      </Link>
                    )}
                    {m.orderLink && (
                      <Link href={`/o/${m.orderLink.code}`} className="mb-1.5 flex items-center gap-1.5 text-[14px] font-semibold text-tint">
                        <Link2 className="h-4 w-4" aria-hidden /> {m.orderLink.mode === "CHOOSE" ? "Options link" : "Order link"} /o/{m.orderLink.code}
                      </Link>
                    )}
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    <p className="mt-0.5 text-right text-[11px] tabular-nums text-label-3">{clock(m.createdAt)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </AdminPage>
  );
}
