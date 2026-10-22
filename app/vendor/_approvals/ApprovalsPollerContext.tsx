'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { apiClient } from '@/lib/api/client';

export interface ApprovalOrder {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  paymentMethod: string | null;
  deliveryAddress: any;
  placedAt: string;
  customer: { fullName: string; phone: string | null };
  vendor: { id: string; businessName: string; storeLogo: string | null };
  items: Array<{
    quantity: number;
    productName: string;
    unitPrice: string | number;
    totalPrice: string | number;
  }>;
}

export interface ApprovalStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  approvalSoundMuted: boolean;
}

export type PollerStatus = 'idle' | 'loading' | 'ok' | 'error' | 'auth-expired';

interface NewOrderEvent {
  order: ApprovalOrder;
  shouldChime: boolean;
}

interface ContextValue {
  orders: ApprovalOrder[];
  stores: ApprovalStore[];
  count: number;
  status: PollerStatus;
  newOrderEvents: NewOrderEvent[];
  consumeNewOrderEvents: () => void;
  refetch: () => Promise<void>;
  removeOrderOptimistic: (orderId: string) => void;
  rollbackRemove: (order: ApprovalOrder) => void;
  setStoreMute: (storeId: string, muted: boolean) => void;
  audioUnlocked: boolean;
  unlockAudio: () => void;
  sessionMuted: boolean;
  setSessionMuted: (v: boolean) => void;
}

const ApprovalsContext = createContext<ContextValue | null>(null);

const POLL_INTERVAL_OK = 3000;
const POLL_INTERVAL_BACKOFF = 10_000;
const FAILURE_THRESHOLD = 5;

export function ApprovalsPollerProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  const [orders, setOrders] = useState<ApprovalOrder[]>([]);
  const [stores, setStores] = useState<ApprovalStore[]>([]);
  const [status, setStatus] = useState<PollerStatus>('idle');
  const [newOrderEvents, setNewOrderEvents] = useState<NewOrderEvent[]>([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [sessionMuted, setSessionMuted] = useState(false);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const failureCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleRef = useRef(true);
  const mountedRef = useRef(true);
  const firstFetchRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiClient.getPendingApprovals();
      if (!res.success) {
        // suppressNetworkError path returns success:false on 401/network
        failureCountRef.current += 1;
        setStatus(failureCountRef.current >= FAILURE_THRESHOLD ? 'error' : status);
        return;
      }
      failureCountRef.current = 0;

      const nextOrders = res.data.orders;
      const nextStores = res.data.stores;

      // Detect new orders since last tick (skip on first fetch — it's the
      // initial load, not a "new arrival" event)
      const newEvents: NewOrderEvent[] = [];
      if (!firstFetchRef.current) {
        const mutedIds = new Set(
          nextStores.filter((s) => s.approvalSoundMuted).map((s) => s.id),
        );
        for (const o of nextOrders) {
          if (!knownIdsRef.current.has(o.id)) {
            newEvents.push({
              order: o,
              shouldChime: !mutedIds.has(o.vendor.id) && !sessionMuted,
            });
          }
        }
      }
      firstFetchRef.current = false;
      knownIdsRef.current = new Set(nextOrders.map((o) => o.id));

      if (mountedRef.current) {
        setOrders(nextOrders);
        setStores(nextStores);
        setStatus('ok');
        if (newEvents.length > 0) {
          setNewOrderEvents((prev) => [...prev, ...newEvents]);
        }
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.isAuthError) {
        setStatus('auth-expired');
        return;
      }
      failureCountRef.current += 1;
      if (failureCountRef.current >= FAILURE_THRESHOLD) {
        setStatus('error');
      }
    }
  }, [enabled, sessionMuted, status]);

  const scheduleNext = useCallback(() => {
    if (!enabled) return;
    if (status === 'auth-expired') return;
    if (!visibleRef.current) return; // paused while hidden
    const interval =
      failureCountRef.current >= FAILURE_THRESHOLD
        ? POLL_INTERVAL_BACKOFF
        : POLL_INTERVAL_OK;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await fetchOnce();
      scheduleNext();
    }, interval);
  }, [enabled, fetchOnce, status]);

  // Initial fetch + visibility-aware polling
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    setStatus('loading');
    fetchOnce().then(() => scheduleNext());

    const onVis = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) {
        // Resuming — fetch immediately, then schedule
        fetchOnce().then(() => scheduleNext());
      } else if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    visibleRef.current = document.visibilityState === 'visible';

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // fetchOnce/scheduleNext are stable enough — re-creating on every status
    // change would thrash the timer. Intentionally limited deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const consumeNewOrderEvents = useCallback(() => {
    setNewOrderEvents([]);
  }, []);

  const refetch = useCallback(async () => {
    await fetchOnce();
  }, [fetchOnce]);

  const removeOrderOptimistic = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    knownIdsRef.current.delete(orderId);
  }, []);

  const rollbackRemove = useCallback((order: ApprovalOrder) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === order.id)) return prev;
      return [...prev, order].sort(
        (a, b) =>
          new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime(),
      );
    });
    knownIdsRef.current.add(order.id);
  }, []);

  const setStoreMute = useCallback((storeId: string, muted: boolean) => {
    setStores((prev) =>
      prev.map((s) =>
        s.id === storeId ? { ...s, approvalSoundMuted: muted } : s,
      ),
    );
  }, []);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
    try {
      sessionStorage.setItem('localmart.audioUnlocked', '1');
    } catch {
      /* sessionStorage may be unavailable */
    }
  }, []);

  // Restore audio-unlock state from sessionStorage on mount
  useEffect(() => {
    try {
      if (sessionStorage.getItem('localmart.audioUnlocked') === '1') {
        setAudioUnlocked(true);
      }
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<ContextValue>(
    () => ({
      orders,
      stores,
      count: orders.length,
      status,
      newOrderEvents,
      consumeNewOrderEvents,
      refetch,
      removeOrderOptimistic,
      rollbackRemove,
      setStoreMute,
      audioUnlocked,
      unlockAudio,
      sessionMuted,
      setSessionMuted,
    }),
    [
      orders,
      stores,
      status,
      newOrderEvents,
      consumeNewOrderEvents,
      refetch,
      removeOrderOptimistic,
      rollbackRemove,
      setStoreMute,
      audioUnlocked,
      unlockAudio,
      sessionMuted,
    ],
  );

  return (
    <ApprovalsContext.Provider value={value}>
      {children}
    </ApprovalsContext.Provider>
  );
}

export function useApprovals(): ContextValue {
  const ctx = useContext(ApprovalsContext);
  if (!ctx) {
    throw new Error('useApprovals must be used inside ApprovalsPollerProvider');
  }
  return ctx;
}
