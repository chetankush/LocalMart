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
    id: string;
    productId: string;
    productImage?: string | null;
    quantity: number;
    productName: string;
    unitPrice: string | number;
    totalPrice: string | number;
    product?: { trackStock: boolean } | null;
  }>;
}

export interface ApprovalStore {
  id: string;
  businessName: string;
  storeLogo: string | null;
  approvalSoundMuted: boolean;
  pausedUntil?: string | null;
  pauseReason?: 'RUSH' | 'CLOSED_TODAY' | 'MISSED_ORDERS' | null;
}

export type PollerStatus = 'idle' | 'loading' | 'ok' | 'error' | 'auth-expired';

interface NewOrderEvent {
  order: ApprovalOrder;
  shouldChime: boolean;
}

/** A new order must be answered within this long (then it's cancelled) */
export const ANSWER_WINDOW_MS = 5 * 60 * 1000;

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
  /** Shop paused / back — show it right away, before the next check */
  setStorePause: (storeId: string, pausedUntil: string | null, pauseReason: ApprovalStore['pauseReason']) => void;
  audioUnlocked: boolean;
  unlockAudio: () => void;
  sessionMuted: boolean;
  setSessionMuted: (v: boolean) => void;
  /** Orders the seller tapped "Stop ringing" on (still waiting for an answer) */
  silencedIds: Set<string>;
  silence: (orderId: string) => void;
  /** Server time minus this phone's time — for correct countdowns */
  clockOffsetMs: number;
}

const ApprovalsContext = createContext<ContextValue | null>(null);

const POLL_INTERVAL_OK = 3000;
// In a background tab browsers slow timers anyway; keep checking so the ring and
// notification still come
const POLL_INTERVAL_HIDDEN = 5000;
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
  const [silencedIds, setSilencedIds] = useState<Set<string>>(new Set());
  const [clockOffsetMs, setClockOffsetMs] = useState(0);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const failureCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const firstFetchRef = useRef(true);
  // Latest values for the polling loop (it's created once)
  const sessionMutedRef = useRef(sessionMuted);
  sessionMutedRef.current = sessionMuted;
  const authExpiredRef = useRef(false);

  const fetchOnce = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await apiClient.getPendingApprovals();
      if (!res.success) {
        // suppressNetworkError path returns success:false on 401/network
        failureCountRef.current += 1;
        if (failureCountRef.current >= FAILURE_THRESHOLD) setStatus('error');
        return;
      }
      failureCountRef.current = 0;

      const nextOrders = res.data.orders as ApprovalOrder[];
      const nextStores = res.data.stores as ApprovalStore[];
      if (res.data.serverTime) {
        setClockOffsetMs(new Date(res.data.serverTime).getTime() - Date.now());
      }

      // Detect new orders since last tick (skip on first fetch — it's the
      // initial load, not a "new arrival" event)
      const newEvents: NewOrderEvent[] = [];
      if (!firstFetchRef.current) {
        const mutedIds = new Set(nextStores.filter((s) => s.approvalSoundMuted).map((s) => s.id));
        for (const o of nextOrders) {
          if (!knownIdsRef.current.has(o.id)) {
            newEvents.push({ order: o, shouldChime: !mutedIds.has(o.vendor.id) && !sessionMutedRef.current });
          }
        }
      }
      firstFetchRef.current = false;
      knownIdsRef.current = new Set(nextOrders.map((o) => o.id));

      if (mountedRef.current) {
        setOrders(nextOrders);
        setStores(nextStores);
        setStatus('ok');
        // Forget silenced orders that are gone
        setSilencedIds((prev) => {
          if (prev.size === 0) return prev;
          const next = new Set([...prev].filter((id) => knownIdsRef.current.has(id)));
          return next.size === prev.size ? prev : next;
        });
        if (newEvents.length > 0) {
          setNewOrderEvents((prev) => [...prev, ...newEvents]);
        }
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.isAuthError) {
        authExpiredRef.current = true;
        setStatus('auth-expired');
        return;
      }
      failureCountRef.current += 1;
      if (failureCountRef.current >= FAILURE_THRESHOLD) {
        setStatus('error');
      }
    }
  }, [enabled]);

  const fetchRef = useRef(fetchOnce);
  fetchRef.current = fetchOnce;

  // Polling loop — created once, always uses the latest fetch
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    setStatus('loading');

    const schedule = () => {
      if (authExpiredRef.current) return;
      const hidden = typeof document !== 'undefined' && document.visibilityState !== 'visible';
      const interval =
        failureCountRef.current >= FAILURE_THRESHOLD
          ? POLL_INTERVAL_BACKOFF
          : hidden
            ? POLL_INTERVAL_HIDDEN
            : POLL_INTERVAL_OK;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await fetchRef.current();
        schedule();
      }, interval);
    };

    fetchRef.current().then(schedule);

    const onVis = () => {
      if (document.visibilityState === 'visible') {
        // Back on the page — check right away
        fetchRef.current().then(schedule);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVis);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);

  const consumeNewOrderEvents = useCallback(() => {
    setNewOrderEvents([]);
  }, []);

  const refetch = useCallback(async () => {
    await fetchRef.current();
  }, []);

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

  const setStorePause = useCallback(
    (storeId: string, pausedUntil: string | null, pauseReason: ApprovalStore['pauseReason']) => {
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, pausedUntil, pauseReason } : s)));
    },
    [],
  );

  const silence = useCallback((orderId: string) => {
    setSilencedIds((prev) => new Set(prev).add(orderId));
  }, []);

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true);
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
      setStorePause,
      audioUnlocked,
      unlockAudio,
      sessionMuted,
      setSessionMuted,
      silencedIds,
      silence,
      clockOffsetMs,
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
      setStorePause,
      audioUnlocked,
      unlockAudio,
      sessionMuted,
      silencedIds,
      silence,
      clockOffsetMs,
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
