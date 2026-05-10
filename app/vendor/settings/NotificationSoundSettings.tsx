'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

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
          setError('Could not load stores.');
        }
      } catch {
        if (!cancelled) setError('Could not load stores.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (store: StoreRow) => {
    const next = !store.approvalSoundMuted;
    setSavingId(store.id);
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
      setError('Could not save. Try again.');
    } finally {
      setSavingId(null);
    }
  };

  if (!stores) return null; // Loading silently — keeps settings page calm
  if (stores.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-sand p-6">
      <h2 className="text-base font-semibold text-ink mb-1">
        Notification sound
      </h2>
      <p className="text-sm text-ink-2 mb-4">
        A short chime plays when a new order arrives. Mute individual stores —
        useful if a shop is closed for the day.
      </p>

      {error && (
        <div className="mb-3 text-xs text-laal bg-laal/5 border border-laal/20 rounded px-2 py-1">
          {error}
        </div>
      )}

      <ul className="divide-y divide-sand">
        {stores.map((s) => {
          const muted = s.approvalSoundMuted;
          return (
            <li key={s.id} className="py-3 flex items-center gap-3">
              <span className={`p-1.5 rounded-full ${muted ? 'bg-sand/60 text-ink-3' : 'bg-accent/10 text-accent'}`}>
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {s.businessName}
                </div>
                <div className="text-xs text-ink-3">
                  {muted
                    ? 'Chime muted for new orders'
                    : 'Chime plays for new orders'}
                </div>
              </div>
              <button
                type="button"
                disabled={savingId === s.id}
                onClick={() => toggle(s)}
                role="switch"
                aria-checked={!muted}
                aria-label={`${muted ? 'Enable' : 'Mute'} chime for ${s.businessName}`}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${!muted ? 'bg-accent' : 'bg-sand'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${!muted ? 'translate-x-5' : ''}`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
