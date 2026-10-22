'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApprovals } from '../_approvals/ApprovalsPollerContext';
import { ApprovalCard } from './_components/ApprovalCard';
import { EnableSoundBanner } from './_components/EnableSoundBanner';
import { StoreFilterChips } from './_components/StoreFilterChips';

export default function ApprovalsPage() {
  const { orders, status, refetch } = useApprovals();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [pulling, setPulling] = useState(false);

  const filtered = selectedStoreId
    ? orders.filter((o) => o.vendor.id === selectedStoreId)
    : orders;

  const handlePullRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  // Auth-expired takes precedence over everything
  if (status === 'auth-expired') {
    return (
      <main className="min-h-screen bg-ivory">
        <div className="bg-laal text-white px-4 py-3 text-sm flex items-center justify-between">
          <span>Your session expired.</span>
          <Link
            href="/sign-in"
            className="px-3 py-1 bg-white text-laal rounded-full text-xs font-semibold"
          >
            Sign in again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ivory">
      <EnableSoundBanner />

      {/* Sticky page header */}
      <div className="sticky top-12 z-30 bg-ivory/95 backdrop-blur border-b border-sand">
        <div className="max-w-3xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-lg md:text-xl font-semibold text-ink font-[family-name:var(--font-family-heading)]">
              Awaiting your OK
              <span className="ml-2 text-ink-3 font-normal">
                · {filtered.length} order{filtered.length === 1 ? '' : 's'}
              </span>
            </h1>
            <button
              type="button"
              onClick={handlePullRefresh}
              disabled={pulling}
              className="text-xs text-ink-3 hover:text-ink-2 px-2 py-1 rounded disabled:opacity-50"
            >
              {pulling ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <StoreFilterChips
            selectedStoreId={selectedStoreId}
            onSelect={setSelectedStoreId}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {status === 'error' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-900">
            Couldn't refresh. We'll keep trying.
          </div>
        )}

        {status === 'loading' && orders.length === 0 ? (
          <SkeletonStack />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <ApprovalCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SkeletonStack() {
  return (
    <div className="space-y-4" aria-busy>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-sand p-6 animate-pulse"
        >
          <div className="flex gap-6">
            <div className="w-[120px] h-[120px] rounded-full bg-sand/50 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-3 bg-sand/50 rounded w-1/3" />
              <div className="h-4 bg-sand/50 rounded w-1/2" />
              <div className="h-3 bg-sand/50 rounded w-2/3" />
              <div className="h-3 bg-sand/50 rounded w-1/2" />
              <div className="h-3 bg-sand/50 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">🎉</div>
      <h2 className="text-lg font-semibold text-ink mb-1">
        You're all caught up.
      </h2>
      <p className="text-sm text-ink-2">
        We'll chime when a new order lands.
      </p>
    </div>
  );
}
