"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, ChevronLeft, Link2, Loader2, MoreHorizontal, Package, Search } from "lucide-react";
import { Page, Row, Thumb, rupees } from "@/components/app/ui";
import { List, IconBox } from "@/components/app/seller";
import { inputClass } from "@/components/app/form";
import { Sheet } from "@/components/app/Sheet";
import ChatThread from "@/components/chat/ChatThread";
import { apiError } from "@/components/ads/adLabels";

/** Short replies a shop sends most — one tap */
const QUICK = ["Haan, available hai ✅", "Abhi stock nahi hai", "Kaunsa size chahiye?", "Aaj hi bhej denge", "Dukaan aakar dekh lijiye"];

type PickItem = { id: string; name: string; price: number; image: string | null; left: number; counted: boolean };

/**
 * The shop's side of a chat: replies, plus the tools that turn a chat into
 * a sale — send an item card, send an order link, or block a buyer.
 */
export default function ShopChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [storeQuery, setStoreQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const [menu, setMenu] = useState(false);
  const [blocked, setBlocked] = useState<boolean | null>(null);
  const [buyerName, setBuyerName] = useState("");

  useEffect(() => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    setStoreQuery(storeId ? `?storeId=${encodeURIComponent(storeId)}` : "");
  }, []);

  const toggleBlock = async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.post<{ data: { blocked: boolean } }>(`/chats/${id}/block`, { blocked: !blocked });
      setBlocked(r.data.blocked);
      toast.success(r.data.blocked ? "Blocked — they can't message you here" : "Unblocked");
      setMenu(false);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't change it.");
    }
  };

  const orderLinkHref = `/vendor/order-links/new?${new URLSearchParams({
    ...Object.fromEntries(new URLSearchParams(storeQuery.replace(/^\?/, ""))),
    chat: id,
    ...(buyerName ? { for: buyerName } : {}),
  })}`;

  return (
    <Page>
      <ChatThread
        conversationId={id}
        side="SHOP"
        onLoaded={(d) => {
          setBlocked(d.conversation.blocked);
          setBuyerName(d.conversation.buyer.name || "");
        }}
        header={(d) => {
          return (
            <header className="-mx-2 mb-3 flex items-center gap-2 border-b border-hairline pb-2">
              <Link href={`/vendor/enquiries${storeQuery}`} aria-label="All messages" className="flex h-11 w-11 items-center justify-center rounded-full text-tint">
                <ChevronLeft className="h-6 w-6" aria-hidden />
              </Link>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-[17px] font-semibold text-label-2">
                {(d.conversation.buyer.name?.[0] || "?").toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold text-label">{d.conversation.buyer.name || "Buyer"}</span>
                <span className="block truncate text-[13px] text-label-2">
                  {d.about ? `Asked about ${d.about.name}` : "Chat from LocalMart"}
                </span>
              </span>
              <button type="button" onClick={() => setMenu(true)} aria-label="More" className="flex h-11 w-11 items-center justify-center rounded-full text-label-2 cursor-pointer">
                <MoreHorizontal className="h-6 w-6" aria-hidden />
              </button>
            </header>
          );
        }}
        tools={(send) => (
          <>
            <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Quick replies">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send({ body: q })}
                  className="min-h-[36px] shrink-0 rounded-full border border-hairline bg-card px-3 text-[14px] text-label cursor-pointer active:bg-fill"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-fill text-[14px] font-semibold text-label cursor-pointer"
              >
                <Package className="h-4 w-4" aria-hidden /> Send an item
              </button>
              <Link href={orderLinkHref} className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-tint-soft text-[14px] font-semibold text-tint">
                <Link2 className="h-4 w-4" aria-hidden /> Order link
              </Link>
            </div>
            <ItemSheet
              open={picking}
              onClose={() => setPicking(false)}
              storeQuery={storeQuery}
              onPick={(p) => {
                send({ productId: p.id, body: `${p.name} — ${rupees(p.price)}` });
                setPicking(false);
              }}
            />
          </>
        )}
      />

      <Sheet open={menu} onClose={() => setMenu(false)} title="Chat options">
        <List>
          <Row
            onClick={toggleBlock}
            leading={
              <IconBox tone="bad" size={40}>
                <Ban className="h-5 w-5" />
              </IconBox>
            }
            title={<span className="font-semibold">{blocked ? "Unblock this buyer" : "Block this buyer"}</span>}
            subtitle={blocked ? "They can message you again" : "They can't send you chat messages any more"}
          />
        </List>
      </Sheet>
    </Page>
  );
}

/** Pick one of the shop's items to send as a card */
function ItemSheet({ open, onClose, onPick, storeQuery }: { open: boolean; onClose: () => void; onPick: (p: PickItem) => void; storeQuery: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickItem[] | null>(null);
  const req = useRef(0);
  useEffect(() => {
    if (!open) return;
    const n = ++req.current;
    const t = setTimeout(async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const params = new URLSearchParams(storeQuery.replace(/^\?/, ""));
        if (q.trim()) params.set("q", q.trim());
        const r = await apiClient.get<{ data: PickItem[] }>(`/vendor/order-links/items${params.toString() ? `?${params}` : ""}`);
        if (n === req.current) setItems(r.data);
      } catch {
        if (n === req.current) setItems([]);
      }
    }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [q, open, storeQuery]);

  return (
    <Sheet open={open} onClose={onClose} title="Send an item" wide>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your items" aria-label="Search your items" className={`${inputClass} pl-11`} />
      </div>
      {!items ? (
        <p className="flex items-center gap-2 py-6 text-[15px] text-label-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading…
        </p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-[15px] text-label-2">Nothing found</p>
      ) : (
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl bg-card">
          {items.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => onPick(p)} className="flex min-h-[60px] w-full items-center gap-3 px-3 py-2 text-left active:bg-fill cursor-pointer">
                <Thumb src={p.image} alt="" size={44} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 block text-[16px] font-medium text-label">{p.name}</span>
                  <span className="block text-[14px] tabular-nums text-label-2">
                    {rupees(p.price)}
                    {p.left <= 0 ? " · Sold out" : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
