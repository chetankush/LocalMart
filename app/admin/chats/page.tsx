"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button, Pill } from "@/components/app/ui";
import { AdminPage, Chips, EmptyBlock, LoadingBlock, SearchField, Toolbar } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";
import { listTime } from "@/lib/chat/time";

type Filter = "all" | "waiting" | "blocked";

interface AdminChat {
  id: string;
  shop: { id: string; name: string };
  buyer: { id: string; name: string; phone: string | null };
  lastMessageAt: string;
  lastMessageText: string | null;
  lastSenderRole: "BUYER" | "SHOP" | "LOCALMART" | null;
  waitingForShop: boolean;
  shopUnread: number;
  messageCount: number;
  shopRepliedAt: string | null;
  blocked: boolean;
  createdAt: string;
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All chats" },
  { value: "waiting", label: "Waiting for the shop" },
  { value: "blocked", label: "Blocked" },
];

/** "3 h", "2 days" since the buyer's message */
function waited(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`;
}

/**
 * Every chat between buyers and shops, newest first. Find a shop or a buyer,
 * see which chats a shop hasn't answered, open any chat to read it.
 */
export default function AdminChatsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminChat[] | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const req = useRef(0);

  const load = useCallback(async (f: Filter, query: string, before?: string) => {
    const n = ++req.current;
    try {
      const { apiClient } = await import("@/lib/api/client");
      const p = new URLSearchParams({ filter: f });
      if (query.trim()) p.set("q", query.trim());
      if (before) p.set("before", before);
      const r = await apiClient.get<{ data: { chats: AdminChat[]; nextBefore: string | null } }>(`/admin/chats?${p}`);
      if (n !== req.current) return;
      setRows((prev) => (before && prev ? [...prev, ...r.data.chats] : r.data.chats));
      setNextBefore(r.data.nextBefore);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load chats.");
      if (!before) setRows([]);
    }
  }, []);

  // Opened from the overview: "/admin/chats?filter=waiting"
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("filter");
    if (f === "waiting" || f === "blocked") setFilter(f);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(filter, q), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [filter, q, load]);

  return (
    <AdminPage title="Chats" subtitle="Messages between buyers and shops. Read any chat; see which shops haven't answered.">
      <Toolbar>
        <Chips label="Filter chats" options={FILTERS} value={filter} onChange={(v) => { setRows(null); setFilter(v); }} />
        <SearchField value={q} onChange={setQ} placeholder="Shop, buyer name or phone" />
      </Toolbar>

      {!rows ? (
        <LoadingBlock label="Loading chats…" />
      ) : rows.length === 0 ? (
        <EmptyBlock icon={<MessageCircle className="h-6 w-6" aria-hidden />} title={q ? "No chats match" : filter === "waiting" ? "Every chat is answered" : "No chats yet"} />
      ) : (
        <>
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
            {rows.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/chats/${c.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-fill/50">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-label">{c.shop.name}</span>
                      <span className="text-[14px] text-label-2">↔ {c.buyer.name || "Buyer"}{c.buyer.phone ? ` · ${c.buyer.phone}` : ""}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-label-2">
                      {c.lastSenderRole === "SHOP" ? "Shop: " : "Buyer: "}
                      {c.lastMessageText}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {c.waitingForShop && !c.blocked && <Pill tone="warn">Waiting {waited(c.lastMessageAt)}</Pill>}
                      {!c.shopRepliedAt && <Pill tone="neutral">Shop never replied</Pill>}
                      {c.blocked && <Pill tone="bad">Blocked by shop</Pill>}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[13px] tabular-nums text-label-3">{listTime(c.lastMessageAt)}</span>
                    <span className="block text-[13px] tabular-nums text-label-3">{c.messageCount} msg</span>
                  </span>
                </Link>
              </li>
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
                await load(filter, q, nextBefore);
                setLoadingMore(false);
              }}
            >
              Show older chats
            </Button>
          )}
        </>
      )}
    </AdminPage>
  );
}
