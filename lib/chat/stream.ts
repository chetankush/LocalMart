"use client";

import type { ChatStreamEvent } from "./types";

/**
 * One live connection per tab for chat updates (server-sent events over
 * fetch, so the sign-in token goes in a header, not the address).
 * Every chat screen and badge listens to the same connection.
 *
 * - Reconnects by itself, waiting a little longer each time (up to 30 s).
 * - Closes after the tab has been hidden for a minute (saves the phone's
 *   battery and the server); opens again when the tab comes back.
 * - After any reconnect it tells listeners "reconnected" so they fetch what
 *   they missed — nothing is lost if the connection dropped.
 */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const HIDDEN_CLOSE_MS = 60_000;
/** No byte for this long (the server pings every 25 s): the connection is dead */
const SILENT_MS = 60_000;

type Listener = (e: ChatStreamEvent) => void;

const listeners = new Set<Listener>();
let controller: AbortController | null = null;
let running = false;
let retry = 0;
let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
let connectedOnce = false;

async function token(): Promise<string | null> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function emit(e: ChatStreamEvent) {
  for (const l of listeners) {
    try {
      l(e);
    } catch {
      // one broken listener must not stop the others
    }
  }
}

async function run() {
  if (running) return;
  running = true;
  while (listeners.size > 0 && (typeof document === "undefined" || document.visibilityState === "visible" || !hiddenTimer)) {
    const t = await token();
    if (!t) break; // signed out: nothing to listen to
    controller = new AbortController();
    let silence: ReturnType<typeof setTimeout> | null = null;
    const alive = () => {
      if (silence) clearTimeout(silence);
      silence = setTimeout(() => controller?.abort(), SILENT_MS);
    };
    try {
      const res = await fetch(`${API}/chats/stream`, {
        headers: { Authorization: `Bearer ${t}`, Accept: "text/event-stream" },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
      if (connectedOnce) emit({ type: "reconnected" });
      connectedOnce = true;
      retry = 0;
      alive();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        alive();
        buf += decoder.decode(value, { stream: true });
        let cut: number;
        while ((cut = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, cut);
          buf = buf.slice(cut + 2);
          const data = block
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trim())
            .join("\n");
          if (!data) continue;
          try {
            const parsed = JSON.parse(data) as { type?: string };
            if (parsed.type === "message" || parsed.type === "read") emit(parsed as ChatStreamEvent);
          } catch {
            // not ours
          }
        }
      }
    } catch {
      // dropped: try again below
    } finally {
      if (silence) clearTimeout(silence);
      controller = null;
    }
    if (listeners.size === 0) break;
    retry = Math.min(retry + 1, 6);
    await new Promise((r) => setTimeout(r, Math.min(30_000, 1000 * 2 ** (retry - 1))));
  }
  running = false;
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    hiddenTimer = setTimeout(() => controller?.abort(), HIDDEN_CLOSE_MS);
  } else {
    if (hiddenTimer) clearTimeout(hiddenTimer);
    hiddenTimer = null;
    if (!running && listeners.size > 0) {
      connectedOnce = true; // coming back counts as a reconnect: catch up
      void run();
    }
  }
}

/** Listen to chat updates; returns a function to stop */
export function subscribeChat(listener: Listener): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
  void run();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      controller?.abort();
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

/** After sign-out: close the connection */
export function closeChatStream() {
  controller?.abort();
}
