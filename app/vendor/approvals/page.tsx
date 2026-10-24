'use client';

import { useState } from 'react';
import { BellRing, LogIn, RefreshCw, WifiOff } from 'lucide-react';
import { Button, LargeTitle, Notice, Page } from '@/components/app/ui';
import { MessageCard } from '@/components/app/seller';
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
      <MessageCard
        icon={<LogIn className="h-8 w-8" aria-hidden />}
        title="Please sign in again"
        body="You were signed out. Sign in to keep getting new orders."
      >
        <Button href="/sign-in" full>
          Sign in
        </Button>
      </MessageCard>
    );
  }

  return (
    <Page>
      <LargeTitle
        title="New orders"
        back={{ href: '/vendor/orders', label: 'All orders' }}
        subtitle={
          filtered.length > 0
            ? `${filtered.length} waiting · Accept or reject within 10 minutes`
            : 'Orders that need your OK show up here'
        }
        trailing={
          <button
            type="button"
            onClick={handlePullRefresh}
            disabled={pulling}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-label-2 hover:text-label disabled:opacity-50 cursor-pointer"
            aria-label="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${pulling ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        }
      />

      <EnableSoundBanner />

      <StoreFilterChips selectedStoreId={selectedStoreId} onSelect={setSelectedStoreId} />

      {status === 'error' && (
        <div className="mb-4">
          <Notice tone="warn" icon={<WifiOff className="h-5 w-5 text-warn" aria-hidden />}>
            Can&apos;t reach LocalMart right now. We&apos;ll keep trying.
          </Notice>
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
    </Page>
  );
}

function SkeletonStack() {
  return (
    <div className="space-y-4" aria-busy>
      {[0, 1].map((i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-fill" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-fill" />
              <div className="h-3 w-1/3 rounded bg-fill" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-2/3 rounded bg-fill" />
            <div className="h-3 w-1/2 rounded bg-fill" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-12 rounded-full bg-fill" />
            <div className="h-12 rounded-full bg-fill" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl bg-card px-6 py-12 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
        <BellRing className="h-8 w-8" aria-hidden />
      </span>
      <h2 className="text-[20px] font-semibold text-label">You&apos;re all caught up</h2>
      <p className="mx-auto mt-1.5 max-w-xs text-[16px] leading-snug text-label-2">
        Keep this page open. A sound plays when a new order comes in.
      </p>
      <p className="mt-1 text-[15px] text-label-3">नया ऑर्डर आने पर आवाज़ आएगी</p>
    </div>
  );
}
