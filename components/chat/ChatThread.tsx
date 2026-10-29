"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Link2, Loader2, ShieldCheck, X } from "lucide-react";
import { Notice, Thumb, rupees } from "@/components/app/ui";
import { apiError } from "@/components/ads/adLabels";
import { subscribeChat } from "@/lib/chat/stream";
import { clock, dayLabel, sameDay } from "@/lib/chat/time";
import type { ChatMessage, ChatOpen, ChatSide } from "@/lib/chat/types";

const MAX = 2000;

const newClientId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c${Date.now()}${Math.random().toString(36).slice(2)}`;

/**
 * One chat, for the buyer or the shop. Messages appear the moment they're
 * sent (and quietly confirm), arrive live from the other side, show ✓✓ when
 * read, and older ones load on demand. A message that fails to send stays
 * with "Tap to retry" — never lost, never sent twice.
 */
export default function ChatThread({
  conversationId,
  side,
  header,
  tools,
  firstDraft,
  attachProductId,
  onLoaded,
}: {
  conversationId: string;
  side: ChatSide;
  /** Above the messages: who you're talking to */
  header: (data: ChatOpen) => ReactNode;
  /** Shop tools above the box (quick replies, send item / order link) */
  tools?: (send: (m: { body?: string; productId?: string; orderLinkCode?: string }) => void) => ReactNode;
  /** Text to start with (e.g. "Namaste, is this available?") */
  firstDraft?: string;
  /** The item this chat is about, sent as a card with the first message */
  attachProductId?: string | null;
  /** Once the chat is open (e.g. the page wants the buyer's name) */
  onLoaded?: (data: ChatOpen) => void;
}) {
  const loaded = useRef(onLoaded);
  loaded.current = onLoaded;
  const [data, setData] = useState<ChatOpen | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(firstDraft ?? "");
  const [attach, setAttach] = useState<string | null>(attachProductId ?? null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const keepScroll = useRef<number | null>(null);
  const stickToBottom = useRef(true);
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const api = async () => (await import("@/lib/api/client")).apiClient;

  // Tell the server we've read up to now (a moment after the last new message)
  const markRead = useCallback(() => {
    if (readTimer.current) clearTimeout(readTimer.current);
    readTimer.current = setTimeout(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await (await api()).post(`/chats/${conversationId}/read`);
      } catch {
        // next one will do it
      }
    }, 400);
  }, [conversationId]);

  // Add messages without doubles (live + fetched + my own sending ones)
  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const next = [...prev];
      for (const m of incoming) {
        const at = next.findIndex((x) => x.id === m.id || (!!m.clientId && x.clientId === m.clientId));
        if (at >= 0) next[at] = m;
        else next.push(m);
      }
      return next.sort((a, b) => (a.pending && !b.pending ? 1 : !a.pending && b.pending ? -1 : a.createdAt.localeCompare(b.createdAt)));
    });
  }, []);

  // Open the chat
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await (await api()).get<{ data: ChatOpen }>(`/chats/${conversationId}`);
        if (!alive) return;
        setData(r.data);
        setMessages(r.data.messages);
        setHasMore(r.data.hasMore);
        setOtherReadAt(r.data.conversation.otherReadAt);
        setBlocked(side === "BUYER" && r.data.conversation.blocked);
        loaded.current?.(r.data);
        if (r.data.conversation.unread > 0) markRead();
      } catch (err) {
        if (alive) setError(apiError(err).message || "Couldn't open this chat. Check your internet.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [conversationId, side, markRead]);

  // Live: new messages, "read", and catching up after a dropped connection
  const lastServerId = useRef<string | null>(null);
  useEffect(() => {
    const server = messages.filter((m) => !m.pending);
    lastServerId.current = server.length ? server[server.length - 1].id : null;
  }, [messages]);

  useEffect(() => {
    return subscribeChat(async (e) => {
      if (e.type === "reconnected") {
        if (!lastServerId.current) return;
        try {
          const r = await (await api()).get<{ data: { messages: ChatMessage[] } }>(`/chats/${conversationId}/messages?after=${lastServerId.current}`);
          merge(r.data.messages);
          if (r.data.messages.some((m) => !m.mine)) markRead();
        } catch {
          // the next reconnect tries again
        }
        return;
      }
      if (e.conversationId !== conversationId) return;
      if (e.type === "message") {
        merge([e.message]);
        if (!e.message.mine) markRead();
      } else if (e.type === "read" && e.by !== side) {
        setOtherReadAt(e.at);
      }
    });
  }, [conversationId, side, merge, markRead]);

  // Coming back to the tab: mark what arrived meanwhile as read
  useEffect(() => {
    const onVis = () => document.visibilityState === "visible" && markRead();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [markRead]);

  // Scroll: stay at the bottom for new messages (unless reading older ones);
  // keep the place when older messages are added above
  useEffect(() => {
    const onScroll = () => {
      stickToBottom.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useLayoutEffect(() => {
    if (keepScroll.current != null) {
      window.scrollTo({ top: document.documentElement.scrollHeight - keepScroll.current });
      keepScroll.current = null;
    } else if (stickToBottom.current) {
      window.scrollTo({ top: document.documentElement.scrollHeight });
    }
  }, [messages]);

  const loadOlder = async () => {
    const first = messages.find((m) => !m.pending);
    if (!first) return;
    setLoadingOlder(true);
    try {
      const r = await (await api()).get<{ data: { messages: ChatMessage[]; hasMore: boolean } }>(`/chats/${conversationId}/messages?before=${first.id}`);
      keepScroll.current = document.documentElement.scrollHeight - window.scrollY;
      setMessages((prev) => [...r.data.messages, ...prev]);
      setHasMore(r.data.hasMore);
    } catch (err) {
      setError(apiError(err).message || "Couldn't load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const deliver = useCallback(
    async (m: ChatMessage, payload: { body?: string; productId?: string; orderLinkCode?: string }) => {
      try {
        const r = await (await api()).post<{ data: { message: ChatMessage } }>(`/chats/${conversationId}/messages`, { ...payload, clientId: m.clientId });
        merge([r.data.message]);
      } catch (err) {
        merge([{ ...m, pending: "failed" }]);
        const msg = apiError(err).message;
        if (msg && /isn't taking chat messages/.test(msg)) setBlocked(true);
      }
    },
    [conversationId, merge],
  );

  const send = useCallback(
    (payload: { body?: string; productId?: string; orderLinkCode?: string }) => {
      const body = payload.body?.trim().slice(0, MAX) || undefined;
      if (!body && !payload.productId && !payload.orderLinkCode) return;
      const m: ChatMessage = {
        id: `local-${newClientId()}`,
        clientId: newClientId(),
        senderRole: side,
        mine: true,
        kind: payload.orderLinkCode ? "ORDER_LINK" : payload.productId ? "PRODUCT" : "TEXT",
        body: body ?? null,
        product: null,
        orderLink: payload.orderLinkCode ? { code: payload.orderLinkCode, mode: "ORDER", forName: null } : null,
        createdAt: new Date().toISOString(),
        pending: "sending",
      };
      stickToBottom.current = true;
      merge([m]);
      void deliver(m, { body, productId: payload.productId, orderLinkCode: payload.orderLinkCode });
    },
    [side, merge, deliver],
  );

  const submit = () => {
    if (!draft.trim() && !attach) return;
    send({ body: draft, productId: attach ?? undefined });
    setDraft("");
    setAttach(null);
    box.current?.focus();
  };

  const retry = (m: ChatMessage) => {
    merge([{ ...m, pending: "sending" }]);
    void deliver(m, { body: m.body ?? undefined, productId: m.product?.id, orderLinkCode: m.orderLink?.code });
  };

  // Grow the box with the text (up to ~5 lines)
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  if (error && !data) return <Notice tone="bad">{error}</Notice>;
  if (!data)
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Opening chat">
        <div className="h-14 animate-pulse rounded-2xl bg-card" />
        <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-card" />
        <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-card" />
      </div>
    );

  const lastMine = [...messages].reverse().find((m) => m.mine && !m.pending);
  const about = attach && data.about?.id === attach ? data.about : null;

  return (
    <>
      {header(data)}

      <p className="mb-4 flex items-start gap-2 rounded-xl bg-fill px-3 py-2 text-[13px] leading-snug text-label-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Chats are between you and {side === "BUYER" ? "the shop" : "the buyer"}. LocalMart may read them to keep everyone safe. Never share an OTP or bank PIN.
      </p>

      {hasMore && (
        <button
          type="button"
          onClick={loadOlder}
          disabled={loadingOlder}
          className="mx-auto mb-3 flex min-h-[40px] items-center gap-2 rounded-full bg-card px-4 text-[14px] font-medium text-tint cursor-pointer"
        >
          {loadingOlder && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Earlier messages
        </button>
      )}

      {messages.length === 0 && (
        <p className="py-8 text-center text-[15px] text-label-2">{side === "BUYER" ? "Say hello — the shop gets it on their phone." : "No messages yet."}</p>
      )}

      <ol className="space-y-1.5" aria-label="Messages" aria-live="polite">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          return (
            <li key={m.clientId ?? m.id}>
              {(!prev || !sameDay(prev.createdAt, m.createdAt)) && (
                <p className="my-3 text-center text-[12px] font-semibold uppercase tracking-wide text-label-3">{dayLabel(m.createdAt)}</p>
              )}
              <Bubble
                m={m}
                side={side}
                status={
                  m.pending === "sending"
                    ? "Sending…"
                    : m.pending === "failed"
                      ? "failed"
                      : m.id === lastMine?.id
                        ? otherReadAt && otherReadAt >= m.createdAt
                          ? "Seen"
                          : "Sent"
                        : null
                }
                onRetry={() => retry(m)}
              />
            </li>
          );
        })}
      </ol>
      <div className="h-36" aria-hidden />

      {/* The box: pinned to the bottom */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-3 py-2">
          {blocked ? (
            <p className="py-2 text-center text-[14px] text-label-2">This shop isn&apos;t taking chat messages from you.</p>
          ) : (
            <>
              {tools?.(send)}
              {about && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-fill p-2">
                  <Thumb src={about.image} alt="" size={36} />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-label">About: {about.name}</span>
                  <button type="button" onClick={() => setAttach(null)} aria-label="Don't attach this item" className="flex h-9 w-9 items-center justify-center rounded-full text-label-2 cursor-pointer">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <label htmlFor={`chat-box-${conversationId}`} className="sr-only">
                  Message
                </label>
                <textarea
                  id={`chat-box-${conversationId}`}
                  ref={box}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX))}
                  onKeyDown={(e) => {
                    // Enter sends on a computer; on a phone it's a new line (send with the button)
                    if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer: fine)").matches) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={1}
                  placeholder="Write a message"
                  className="max-h-[132px] min-h-[44px] flex-1 resize-none rounded-2xl border border-hairline bg-card px-4 py-2.5 text-[16px] leading-snug text-label outline-none focus:border-tint"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() && !attach}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-white transition-opacity disabled:opacity-40 cursor-pointer"
                >
                  <ArrowUp className="h-5 w-5" strokeWidth={2.6} aria-hidden />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const Bubble = memo(function Bubble({
  m,
  side,
  status,
  onRetry,
}: {
  m: ChatMessage;
  side: ChatSide;
  status: string | null;
  onRetry: () => void;
}) {
  const mine = m.mine;
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[16px] leading-snug ${
          mine ? "rounded-br-md bg-tint text-white" : "rounded-bl-md bg-card text-label"
        } ${m.pending === "sending" ? "opacity-70" : ""}`}
      >
        {m.product && (
          <Link
            href={`/products/${m.product.id}`}
            className={`mb-1.5 flex items-center gap-2 rounded-xl p-1.5 ${mine ? "bg-white/15" : "bg-fill"}`}
          >
            <Thumb src={m.product.image} alt="" size={44} />
            <span className="min-w-0">
              <span className="line-clamp-2 block text-[14px] font-semibold leading-tight">{m.product.name}</span>
              <span className="block text-[13px] tabular-nums opacity-90">{rupees(m.product.price)}</span>
            </span>
          </Link>
        )}
        {m.orderLink && (
          <Link
            href={`/o/${m.orderLink.code}`}
            className={`mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold ${mine ? "bg-white/15" : "bg-tint-soft text-tint"}`}
          >
            <Link2 className="h-4 w-4 shrink-0" aria-hidden />
            {m.orderLink.mode === "CHOOSE"
              ? side === "BUYER"
                ? "Options for you — tap to choose"
                : "Options link sent"
              : side === "BUYER"
                ? "Your order is ready — tap to order"
                : "Order link sent"}
          </Link>
        )}
        {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
        <p className={`mt-0.5 text-right text-[11px] tabular-nums ${mine ? "text-white/75" : "text-label-3"}`}>{clock(m.createdAt)}</p>
      </div>
      {status === "failed" ? (
        <button type="button" onClick={onRetry} className="mt-0.5 min-h-[32px] px-1 text-[13px] font-semibold text-bad cursor-pointer">
          Not sent · Tap to retry
        </button>
      ) : (
        status && <p className="mt-0.5 px-1 text-[12px] text-label-3">{status}</p>
      )}
    </div>
  );
});
