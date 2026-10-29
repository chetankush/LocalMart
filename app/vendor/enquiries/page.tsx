"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link2, MessageCircle, Phone } from "lucide-react";
import { EmptyState, LargeTitle, Notice, Page, Pill, Thumb } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { apiError } from "@/components/ads/adLabels";
import { whatsappHref } from "@/lib/contact";
import { MESSAGES_CHANGED, timeAgo, type Enquiry, type LeadSummary } from "@/lib/leads";
import HoldRequests from "./HoldRequests";
import ChatList from "@/components/chat/ChatList";
import { Segmented } from "@/components/app/form";

/**
 * Seller inbox: buyers who wrote to the shop from LocalMart. Each one comes
 * with the buyer's name and number; the seller replies on WhatsApp in one tap.
 */
export default function EnquiriesPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [messages, setMessages] = useState<Enquiry[] | null>(null);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Stay highlighted for this visit even after they're marked as seen
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);
  const [storeQuery, setStoreQuery] = useState<string | null>(null);
  // Chats (live, inside LocalMart) or messages sent with the form
  const [tab, setTab] = useState<"chats" | "forms">("chats");

  const load = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const storeId = params.get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const [list, sum] = await Promise.all([
        apiClient.get<{ data: { shop: { businessName: string }; messages: Enquiry[] } }>(`/vendor/enquiries${q}`),
        apiClient.get<{ data: LeadSummary }>(`/vendor/leads/summary${q}`),
      ]);
      const rows = list.data?.messages ?? [];
      setShopName(list.data?.shop?.businessName ?? "");
      setMessages(rows);
      setSummary(sum.data ?? null);
      setError(null);
      const unseen = rows.filter((m) => m.status === "NEW").map((m) => m.id);
      if (unseen.length) {
        setFresh((s) => new Set([...s, ...unseen]));
        await Promise.all(unseen.map((id) => apiClient.patch(`/vendor/enquiries/${id}`, { status: "SEEN" }).catch(() => null)));
        window.dispatchEvent(new Event(MESSAGES_CHANGED));
      }
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push("/sign-in?redirect=%2Fvendor%2Fenquiries");
        return;
      }
      if ((err as { status?: number })?.status === 403) {
        setError("This page is for shop owners.");
        return;
      }
      setError(apiError(err).message || "Couldn't load your messages. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
    // New messages show up without a refresh
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (m: Enquiry, status: "REPLIED" | "CLOSED") => {
    setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, status } : x)) ?? null);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/vendor/enquiries/${m.id}`, { status });
      if (status === "CLOSED") toast.success("Moved to Done");
    } catch {
      // The reply already went on WhatsApp; the label can catch up later
    }
  };

  const open = useMemo(() => (messages ?? []).filter((m) => m.status !== "CLOSED"), [messages]);
  const done = useMemo(() => (messages ?? []).filter((m) => m.status === "CLOSED"), [messages]);

  return (
    <Page>
      <LargeTitle title="Messages" subtitle="Buyers who wrote to your shop · ग्राहकों के संदेश" />

      {/* "Keep it for me" requests come first — they need an answer in 30 minutes */}
      {storeQuery !== null && <HoldRequests storeQuery={storeQuery} shopName={shopName} />}

      {error && <Notice tone="bad">{error}</Notice>}

      {summary && (
        <section className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline">
          <div className="bg-card px-4 py-4">
            <span className="block text-[14px] font-medium text-label-2">Messages</span>
            <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums text-label">{summary.messages.thisMonth}</span>
            <span className="mt-1.5 block text-[13px] text-label-3">This month · {summary.messages.today} today</span>
          </div>
          <div className="bg-card px-4 py-4">
            <span className="block text-[14px] font-medium text-label-2">Opened WhatsApp</span>
            <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums text-label">{summary.whatsappTaps.thisMonth}</span>
            <span className="mt-1.5 block text-[13px] text-label-3">People this month · they may not have written</span>
          </div>
        </section>
      )}

      <div className="mb-4">
        <Segmented<"chats" | "forms">
          label="Which messages"
          value={tab}
          onChange={setTab}
          options={[
            { value: "chats", label: "Chats" },
            { value: "forms", label: `Form messages${open.length ? ` (${open.length})` : ""}` },
          ]}
        />
      </div>

      {tab === "chats" && storeQuery !== null && <ChatList side="SHOP" storeQuery={storeQuery} />}

      {tab === "forms" && messages === null && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      )}

      {tab === "forms" && messages && open.length === 0 && (
        <EmptyState
          icon={<MessageCircle className="h-7 w-7" aria-hidden />}
          title="No messages yet"
          body="When a buyer taps “Message the shop” on your page, it shows up here and your phone rings."
        />
      )}

      {tab === "forms" && open.length > 0 && (
        <section className="space-y-3">
          {open.map((m) => (
            <MessageCard key={m.id} m={m} shopName={shopName} isNew={fresh.has(m.id)} onStatus={setStatus} storeQuery={storeQuery ?? ""} />
          ))}
        </section>
      )}

      {tab === "forms" && done.length > 0 && (
        <section className="mt-8">
          <button type="button" onClick={() => setShowDone((v) => !v)} className="w-full text-left cursor-pointer">
            <SectionHeader title={`Done (${done.length})`} />
          </button>
          {showDone && (
            <div className="space-y-3">
              {done.slice(0, 50).map((m) => (
                <MessageCard key={m.id} m={m} shopName={shopName} isNew={false} onStatus={setStatus} storeQuery={storeQuery ?? ""} />
              ))}
            </div>
          )}
        </section>
      )}
    </Page>
  );
}

function MessageCard({
  m,
  shopName,
  isNew,
  onStatus,
  storeQuery,
}: {
  m: Enquiry;
  shopName: string;
  isNew: boolean;
  onStatus: (m: Enquiry, s: "REPLIED" | "CLOSED") => void;
  storeQuery: string;
}) {
  // Make their order and send it: starts with the item they asked about
  const orderLink = new URLSearchParams(storeQuery.replace(/^\?/, ""));
  if (m.productId && m.source !== "RENT") orderLink.set("product", m.productId);
  orderLink.set("for", m.name);
  orderLink.set("phone", m.phone);
  const short = m.message.length > 80 ? `${m.message.slice(0, 80)}…` : m.message;
  const wa = whatsappHref(m.phone, `Namaste ${m.name} ji, ${shopName ? `${shopName} se` : "dukaan se"}. LocalMart par aapka message mila: "${short}"`);
  return (
    <article className={`rounded-2xl bg-card p-4 ${isNew ? "ring-2 ring-tint" : ""}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17px] font-semibold text-label">{m.name}</p>
          <p className="text-[15px] tabular-nums text-label-2">{m.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-[13px] text-label-3">{timeAgo(m.createdAt)}</span>
          {isNew && <Pill tone="info">New</Pill>}
          {m.source === "EXCHANGE" && <Pill tone="warn">Exchange</Pill>}
          {m.status === "REPLIED" && <Pill tone="ok" icon={<Check className="h-3.5 w-3.5" aria-hidden />}>Replied</Pill>}
        </div>
      </header>

      {m.productName && (
        <Link href={m.productId ? `/products/${m.productId}` : "#"} className="mt-3 flex items-center gap-3 rounded-xl bg-fill p-2">
          <Thumb src={m.productImage} alt="" size={44} />
          <span className="min-w-0 flex-1 truncate text-[15px] text-label">
            {m.source === "RENT" ? "On rent: " : m.source === "EXCHANGE" ? "Exchange: " : "About: "}
            {m.productName}
          </span>
        </Link>
      )}

      <p className="mt-3 whitespace-pre-line text-[16px] leading-snug text-label">{m.message}</p>
      {m.timesWritten > 1 && <p className="mt-2 text-[14px] font-medium text-ok">Wrote to you {m.timesWritten} times · पुराना ग्राहक</p>}

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onStatus(m, "REPLIED")}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#1F8F4E] text-[16px] font-semibold text-white hover:brightness-95"
          >
            <WhatsAppIcon className="h-5 w-5" fill="fill-white" /> Reply on WhatsApp
          </a>
        )}
        <a
          href={`tel:+91${m.phone}`}
          onClick={() => onStatus(m, "REPLIED")}
          aria-label={`Call ${m.name}`}
          className="flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card px-5 text-[16px] font-semibold text-label"
        >
          <Phone className="h-5 w-5" aria-hidden /> Call
        </a>
      </div>
      {m.source !== "RENT" && m.source !== "EXCHANGE" && (
        <Link
          href={`/vendor/order-links/new?${orderLink}`}
          className="mt-2 flex h-12 items-center justify-center gap-2 rounded-full bg-tint-soft text-[16px] font-semibold text-tint active:opacity-70"
        >
          <Link2 className="h-5 w-5" aria-hidden /> Send order link
        </Link>
      )}
      {m.status !== "CLOSED" && (
        <button
          type="button"
          onClick={() => onStatus(m, "CLOSED")}
          className="mt-2 min-h-[44px] w-full rounded-full text-[15px] font-medium text-label-2 hover:bg-fill cursor-pointer"
        >
          Mark as done
        </button>
      )}
    </article>
  );
}
