"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, MessageCircle } from "lucide-react";
import { SectionHeader } from "@/components/app/seller";
import { MESSAGES_CHANGED, type LeadSummary } from "@/lib/leads";

/**
 * "People who contacted you" — the proof LocalMart brings buyers. Messages are
 * real (name + number); WhatsApp counts people who tapped the button, which
 * is said plainly because we can't see the chat itself.
 */
export default function LeadsCard({ storeId }: { storeId: string }) {
  const [s, setS] = useState<LeadSummary | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: LeadSummary }>(`/vendor/leads/summary?storeId=${encodeURIComponent(storeId)}`);
        if (alive) setS(r.data ?? null);
      } catch {
        // The card just stays hidden
      }
    };
    load();
    window.addEventListener(MESSAGES_CHANGED, load);
    return () => {
      alive = false;
      window.removeEventListener(MESSAGES_CHANGED, load);
    };
  }, [storeId]);

  if (!s) return null;
  const inbox = `/vendor/enquiries?storeId=${encodeURIComponent(storeId)}`;

  return (
    <section className="mb-6">
      <SectionHeader title="People who contacted you" />
      {(s.holds?.pending ?? 0) > 0 && (
        <Link
          href={inbox}
          className="mb-3 flex min-h-[56px] items-center gap-3 rounded-2xl bg-[#1F8F4E] px-4 text-white hover:brightness-95"
        >
          <Clock className="h-6 w-6 shrink-0" aria-hidden />
          <span className="flex-1 text-[16px] font-semibold">
            {s.holds!.pending} buyer{s.holds!.pending === 1 ? " wants" : "s want"} you to keep something aside — answer now
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      )}
      {s.messages.unread > 0 && (
        <Link
          href={inbox}
          className="mb-3 flex min-h-[56px] items-center gap-3 rounded-2xl bg-tint px-4 text-white hover:bg-cta-hover"
        >
          <MessageCircle className="h-6 w-6 shrink-0" aria-hidden />
          <span className="flex-1 text-[16px] font-semibold">
            {s.messages.unread} new message{s.messages.unread === 1 ? "" : "s"} — reply now
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      )}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hairline">
        <Link href={inbox} className="block bg-card px-4 py-4 transition-colors hover:bg-fill/60 active:bg-fill">
          <span className="block text-[14px] font-medium text-label-2">Messages</span>
          <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums text-label">{s.messages.thisMonth}</span>
          <span className="mt-1.5 block text-[13px] text-label-3">This month · with name and number</span>
        </Link>
        <div className="bg-card px-4 py-4">
          <span className="block text-[14px] font-medium text-label-2">Opened WhatsApp</span>
          <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums text-label">{s.whatsappTaps.thisMonth}</span>
          <span className="mt-1.5 block text-[13px] text-label-3">People this month · they may not have written</span>
        </div>
        {s.holds && s.holds.thisMonth > 0 && (
          <Link href={inbox} className="col-span-2 block bg-card px-4 py-4 transition-colors hover:bg-fill/60 active:bg-fill">
            <span className="block text-[14px] font-medium text-label-2">Came to your shop</span>
            <span className="mt-1 block text-[28px] font-bold leading-none tabular-nums text-label">
              {s.holds.came}
              {s.holds.bought > 0 && <span className="ml-2 text-[16px] font-semibold text-ok">{s.holds.bought} bought</span>}
            </span>
            <span className="mt-1.5 block text-[13px] text-label-3">This month · from {s.holds.thisMonth} “keep it for me” requests</span>
          </Link>
        )}
      </div>
      {s.messages.thisMonth === 0 && s.whatsappTaps.thisMonth === 0 && !(s.holds?.thisMonth ?? 0) && (
        <p className="mt-2 text-[14px] text-label-3">Share your shop page on WhatsApp to get your first messages.</p>
      )}
    </section>
  );
}
