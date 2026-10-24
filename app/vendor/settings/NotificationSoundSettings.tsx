'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { FormCard, Toggle } from '@/components/app/form';

interface StoreRow {
  id: string;
  businessName: string;
  approvalSoundMuted: boolean;
}

export function NotificationSoundSettings() {
  const [stores, setStores] = useState<StoreRow[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Reuse the inbox endpoint since it returns the stores array with
        // approvalSoundMuted populated. No need for a dedicated endpoint.
        const res = await apiClient.getPendingApprovals();
        if (cancelled) return;
        if (res.success) {
          setStores(
            res.data.stores.map((s) => ({
              id: s.id,
              businessName: s.businessName,
              approvalSoundMuted: s.approvalSoundMuted,
            })),
          );
        } else {
          setError('Could not load your shops.');
        }
      } catch {
        if (!cancelled) setError('Could not load your shops.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (store: StoreRow) => {
    const next = !store.approvalSoundMuted;
    setSavingId(store.id);
    setError(null);
    // Optimistic
    setStores((prev) =>
      (prev ?? []).map((s) =>
        s.id === store.id ? { ...s, approvalSoundMuted: next } : s,
      ),
    );
    try {
      await apiClient.setApprovalSoundMuted(store.id, next);
    } catch {
      // Rollback
      setStores((prev) =>
        (prev ?? []).map((s) =>
          s.id === store.id
            ? { ...s, approvalSoundMuted: store.approvalSoundMuted }
            : s,
        ),
      );
      setError("Couldn't save. Check your internet and try again.");
    } finally {
      setSavingId(null);
    }
  };

  if (!stores) return null; // Loading silently — keeps settings page calm
  if (stores.length === 0) return null;

  const single = stores.length === 1;

  return (
    <FormCard
      title="New order sound"
      description={
        single
          ? 'A short sound plays when a new order comes. Saves right away.'
          : 'A short sound plays when a new order comes. Turn it off for a shop that is closed today.'
      }
    >
      {error && <p className="text-[14px] leading-snug text-bad">{error}</p>}

      <div className="-my-2 divide-y divide-hairline">
        {stores.map((s) => {
          const muted = s.approvalSoundMuted;
          return (
            <Toggle
              key={s.id}
              checked={!muted}
              onChange={() => toggle(s)}
              disabled={savingId === s.id}
              label={single ? 'Play a sound for new orders' : s.businessName}
              description={muted ? 'Off: no sound for new orders' : 'On: sound plays for new orders'}
            />
          );
        })}
      </div>
    </FormCard>
  );
}
