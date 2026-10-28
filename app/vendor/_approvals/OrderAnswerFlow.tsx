'use client';

/**
 * Answering a new order — the same steps from the full-screen alert and the
 * order cards:
 *  - Accept
 *  - Some items not available → tick them; they come off the order and are
 *    marked "not available" in the shop (back tomorrow morning, in 2 hours,
 *    or when the seller turns them on)
 *  - Can't take this order → why (items / too busy / other); "too busy" can
 *    also pause new orders for a while
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, PackageX, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '@/components/app/Sheet';
import { apiClient } from '@/lib/api/client';
import { useApprovals, type ApprovalOrder } from './ApprovalsPollerContext';
import { offerDiscount } from '@/lib/offers';

export type BackIn = 'TOMORROW' | 'TWO_HOURS' | null;

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Accept / reject with the order taken off the list right away (put back if it fails) */
export function useAnswerOrder(order: ApprovalOrder) {
  const { removeOrderOptimistic, rollbackRemove, refetch, setStorePause } = useApprovals();
  const router = useRouter();
  const [busy, setBusy] = useState<null | 'accept' | 'reject'>(null);

  const run = async (kind: 'accept' | 'reject', call: () => Promise<unknown>, done: string) => {
    setBusy(kind);
    removeOrderOptimistic(order.id);
    try {
      await call();
      if (kind === 'accept' && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(30);
        } catch {
          /* noop */
        }
      }
      toast.success(done);
      // Seller Home / Orders show the answered order and switched-off items right away
      router.refresh();
      return true;
    } catch (err: any) {
      if (err?.status === 409) {
        toast.message('This order was already answered.');
        return true;
      }
      rollbackRemove(order);
      toast.error("Couldn't send — check internet and tap again.");
      return false;
    } finally {
      setBusy(null);
      void refetch();
    }
  };

  return {
    busy,
    accept: (unavailableItemIds: string[] = [], backIn: BackIn = 'TOMORROW') =>
      run(
        'accept',
        () => apiClient.approveOrder(order.id, unavailableItemIds.length ? { unavailableItemIds, backIn } : {}),
        unavailableItemIds.length
          ? 'Accepted without the missing items · बाकी सामान भेजें'
          : 'Order accepted — pack it now · ऑर्डर पक्का',
      ),
    reject: (opts: { reason: 'ITEMS_UNAVAILABLE' | 'TOO_BUSY' | 'OTHER'; unavailableItemIds?: string[]; backIn?: BackIn; pauseMinutes?: number }) =>
      run(
        'reject',
        async () => {
          await apiClient.rejectOrder(order.id, opts);
          if (opts.reason === 'TOO_BUSY' && opts.pauseMinutes) {
            setStorePause(order.vendor.id, new Date(Date.now() + opts.pauseMinutes * 60000).toISOString(), 'RUSH');
          }
        },
        opts.reason === 'TOO_BUSY' && opts.pauseMinutes
          ? `Order declined · new orders paused for ${opts.pauseMinutes >= 60 ? `${opts.pauseMinutes / 60} hour` : `${opts.pauseMinutes} min`}`
          : 'Order declined. The customer has been told.',
      ),
  };
}

const BACK_IN_CHOICES: { value: BackIn; label: string; hint: string }[] = [
  { value: 'TOMORROW', label: 'Tomorrow morning', hint: 'कल सुबह' },
  { value: 'TWO_HOURS', label: 'In 2 hours', hint: '2 घंटे में' },
  { value: null, label: "I'll turn it on", hint: 'मैं खुद चालू करूँगा' },
];

export function BackInChoice({ value, onChange }: { value: BackIn; onChange: (v: BackIn) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="When will it be available again?">
      {BACK_IN_CHOICES.map((c) => {
        const on = value === c.value;
        return (
          <button
            key={String(c.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(c.value)}
            className={`flex min-h-[60px] flex-col items-center justify-center rounded-2xl border-2 px-2 py-2 text-center transition-colors cursor-pointer ${
              on ? 'border-tint bg-tint/[0.06]' : 'border-hairline bg-card'
            }`}
          >
            <span className={`text-[14px] font-semibold leading-tight ${on ? 'text-tint' : 'text-label'}`}>{c.label}</span>
            <span className="mt-0.5 text-[12px] text-label-2">{c.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "Some items not available": tick what's missing, accept the rest */
export function ItemsUnavailableSheet({
  order,
  open,
  onClose,
  onDone,
}: {
  order: ApprovalOrder;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { accept, reject, busy } = useAnswerOrder(order);
  const [missing, setMissing] = useState<Set<string>>(new Set());
  const [backIn, setBackIn] = useState<BackIn>('TOMORROW');
  const keptTotal = totalWithout(order, missing);
  const nothingLeft = missing.size === order.items.length;

  const toggle = (id: string) =>
    setMissing((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    const ids = [...missing];
    const ok = nothingLeft
      ? await reject({ reason: 'ITEMS_UNAVAILABLE', unavailableItemIds: ids, backIn })
      : await accept(ids, backIn);
    if (ok) {
      onClose();
      onDone?.();
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Which items don't you have?"
      description="Tick them. We take them off this order and mark them “not available” in your shop. · जो सामान नहीं है उसे चुनें"
      footer={
        <button
          type="button"
          disabled={missing.size === 0 || busy !== null}
          onClick={submit}
          className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[17px] font-semibold text-white transition-colors disabled:bg-fill-strong disabled:text-label-3 cursor-pointer ${
            nothingLeft ? 'bg-bad' : 'bg-ok hover:brightness-110'
          }`}
        >
          {busy ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
          ) : missing.size === 0 ? (
            'Tick the missing items'
          ) : nothingLeft ? (
            'Decline — none of it is available'
          ) : (
            <>
              <Check className="h-5 w-5" strokeWidth={2.6} aria-hidden />
              Accept the rest · {rupees(keptTotal)}
            </>
          )}
        </button>
      }
    >
      <ul className="space-y-2">
        {order.items.map((it) => {
          const on = missing.has(it.id);
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => toggle(it.id)}
                aria-pressed={on}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors cursor-pointer ${
                  on ? 'border-bad bg-bad-soft' : 'border-hairline bg-card'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                    on ? 'border-bad bg-bad text-white' : 'border-label/25 bg-card'
                  }`}
                  aria-hidden
                >
                  {on && <PackageX className="h-4 w-4" />}
                </span>
                {it.productImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.productImage} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-fill object-cover" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={`block text-[16px] font-semibold leading-snug ${on ? 'text-bad line-through' : 'text-label'}`}>
                    {it.quantity} × {it.productName}
                  </span>
                  <span className="text-[14px] text-label-2">{on ? 'Not available · नहीं है' : rupees(Number(it.totalPrice))}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {missing.size > 0 && (() => {
        const ticked = order.items.filter((i) => missing.has(i.id));
        const counted = ticked.filter((i) => i.product?.trackStock !== false);
        const loose = ticked.length - counted.length;
        return (
          <div className="mt-5 space-y-3">
            {loose > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[15px] font-semibold text-label">
                  <Clock className="h-4 w-4 text-label-2" aria-hidden />
                  When will {loose === 1 ? 'it' : 'they'} be available again?
                </p>
                <BackInChoice value={backIn} onChange={setBackIn} />
              </div>
            )}
            {counted.length > 0 && (
              <p className="rounded-xl bg-fill px-3.5 py-2.5 text-[14px] leading-snug text-label-2">
                {counted.map((i) => i.productName).join(', ')}: set to 0. When you get more, add the new number in
                Products. · नया स्टॉक आने पर संख्या डालें
              </p>
            )}
          </div>
        );
      })()}
    </Sheet>
  );
}

const PAUSE_CHOICES = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 0, label: "Don't pause" },
];

/** "Can't take this order": why, and maybe pause new orders */
export function DeclineSheet({
  order,
  open,
  onClose,
  onDone,
  onItemsMissing,
}: {
  order: ApprovalOrder;
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
  /** "Items not available" goes to the item list instead */
  onItemsMissing: () => void;
}) {
  const { reject, busy } = useAnswerOrder(order);
  const [reason, setReason] = useState<'TOO_BUSY' | 'OTHER' | null>(null);
  const [pause, setPause] = useState(30);

  const submit = async () => {
    if (!reason) return;
    const ok = await reject(reason === 'TOO_BUSY' && pause ? { reason, pauseMinutes: pause } : { reason });
    if (ok) {
      onClose();
      onDone?.();
    }
  };

  const reasons: { value: 'ITEMS' | 'TOO_BUSY' | 'OTHER'; title: string; hint: string; Icon: typeof PackageX }[] = [
    { value: 'ITEMS', title: 'Items not available', hint: 'सामान नहीं है', Icon: PackageX },
    { value: 'TOO_BUSY', title: 'Too busy right now', hint: 'अभी बहुत भीड़ है', Icon: Timer },
    { value: 'OTHER', title: 'Other reason', hint: 'कोई और वजह', Icon: Clock },
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Why can't you take it?"
      description="The customer is told right away and nothing is charged. · ग्राहक को बता दिया जाएगा"
      footer={
        <button
          type="button"
          disabled={!reason || busy !== null}
          onClick={submit}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-bad text-[17px] font-semibold text-white disabled:bg-fill-strong disabled:text-label-3 cursor-pointer"
        >
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden /> : 'Decline this order'}
        </button>
      }
    >
      <div className="space-y-2">
        {reasons.map((r) => {
          const on = reason === r.value;
          return (
            <button
              key={r.value}
              type="button"
              onClick={() => (r.value === 'ITEMS' ? onItemsMissing() : setReason(r.value))}
              aria-pressed={on}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors cursor-pointer ${
                on ? 'border-tint bg-tint/[0.06]' : 'border-hairline bg-card'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fill text-label-2">
                <r.Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold text-label">{r.title}</span>
                <span className="text-[13px] text-label-2">{r.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {reason === 'TOO_BUSY' && (
        <div className="mt-5 rounded-2xl bg-fill p-3.5">
          <p className="text-[15px] font-semibold text-label">Also stop new orders for a while?</p>
          <p className="mt-0.5 text-[13px] text-label-2">Customers see “Busy” and can order again after this. · नए ऑर्डर कुछ देर बंद</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {PAUSE_CHOICES.map((c) => (
              <button
                key={c.minutes}
                type="button"
                onClick={() => setPause(c.minutes)}
                aria-pressed={pause === c.minutes}
                className={`h-11 rounded-xl border-2 text-[14px] font-semibold cursor-pointer ${
                  pause === c.minutes ? 'border-tint bg-card text-tint' : 'border-transparent bg-card text-label'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/**
 * The order's total once the ticked items come off — worked out the way the
 * server will (a percent discount on what's left, a ₹ discount kept), so
 * the shop sees exactly what the buyer is told.
 */
function totalWithout(order: ApprovalOrder, missing: Set<string>) {
  const removed = order.items.filter((i) => missing.has(i.id)).reduce((sum, i) => sum + Number(i.totalPrice), 0);
  if (order.subtotal == null) return Number(order.totalAmount) - removed;
  const items = Number(order.subtotal) - removed;
  const off = order.offerRule
    ? offerDiscount(order.offerRule.kind, order.offerRule.value, items, order.offerRule.maxOff)
    : Math.min(Number(order.discount ?? 0), items);
  return Math.round((items + Number(order.deliveryFee ?? 0) + Number(order.taxAmount ?? 0) - off) * 100) / 100;
}
