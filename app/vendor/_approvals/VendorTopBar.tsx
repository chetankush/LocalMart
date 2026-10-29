'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, MessageCircle, Package, ReceiptText, Store, Volume2, VolumeX } from 'lucide-react';
import { useUnreadMessages } from '@/lib/leads';
import { useApprovals } from './ApprovalsPollerContext';

/**
 * Seller navigation. Phones get a bottom tab bar (same as the shopper app),
 * desktops get a tab strip under the header. Five places only:
 * Home, Orders, Messages, Products, My shop. The Orders badge counts orders
 * waiting for the shop's OK; the Messages badge counts unread buyer messages.
 */
const TABS = [
  { href: '/vendor/dashboard', label: 'Home', icon: Home, match: ['/vendor/dashboard'] },
  { href: '/vendor/orders', label: 'Orders', icon: ReceiptText, match: ['/vendor/orders', '/vendor/approvals', '/vendor/visits'], badge: 'orders' as const },
  { href: '/vendor/enquiries', label: 'Messages', icon: MessageCircle, match: ['/vendor/enquiries'], badge: 'messages' as const },
  { href: '/vendor/products', label: 'Products', icon: Package, match: ['/vendor/products'] },
  {
    href: '/vendor/settings',
    label: 'My shop',
    icon: Store,
    match: ['/vendor/settings', '/vendor/shop-page', '/vendor/stores', '/vendor/broadcast', '/vendor/telegram', '/vendor/ads'],
  },
];

// Set-up and waiting screens are a single task — no tabs there
const NO_NAV = ['/vendor/onboarding', '/vendor/pending', '/vendor/rejected'];

export function VendorTopBar() {
  const pathname = usePathname() ?? '';
  const { count, stores, sessionMuted, setSessionMuted, audioUnlocked } = useApprovals();
  const hidden = NO_NAV.some((p) => pathname.startsWith(p));
  const unread = useUnreadMessages(!hidden);

  if (hidden) return null;

  const isActive = (match: string[]) => match.some((m) => pathname.startsWith(m));
  const countFor = (b?: 'orders' | 'messages') => (b === 'orders' ? count : b === 'messages' ? unread : 0);
  const show = (n: number) => (n > 99 ? '99+' : String(n));

  return (
    <>
      {/* ── Desktop tab strip ── */}
      <nav
        aria-label="Seller"
        className="sticky top-16 z-40 hidden border-b border-hairline bg-white/90 backdrop-blur-xl lg:block"
      >
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-1 px-8">
          {TABS.map(({ href, label, icon: Icon, match, badge: which }) => {
            const active = isActive(match);
            const n = countFor(which);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-[15px] transition-colors ${
                  active ? 'bg-tint-soft font-semibold text-tint' : 'font-medium text-label-2 hover:bg-fill hover:text-label'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                {label}
                {n > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-tint px-1.5 text-[12px] font-bold text-white">
                    {show(n)}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            {/* Browsers block sound until the first click — not a button, any click turns it on */}
            {!audioUnlocked && stores.length > 0 && (
              <span role="status" className="flex h-10 items-center gap-2 rounded-full bg-label px-4 text-[14px] font-semibold text-white">
                <VolumeX className="h-[18px] w-[18px]" aria-hidden />
                Order ringer is off — click anywhere
              </span>
            )}
            {audioUnlocked && (
              <button
                type="button"
                onClick={() => setSessionMuted(!sessionMuted)}
                className="flex h-10 items-center gap-2 rounded-full px-3 text-[14px] font-medium text-label-2 hover:bg-fill cursor-pointer"
                aria-label={sessionMuted ? 'Turn order sound on' : 'Turn order sound off'}
              >
                {sessionMuted ? <VolumeX className="h-[18px] w-[18px]" aria-hidden /> : <Volume2 className="h-[18px] w-[18px]" aria-hidden />}
                {sessionMuted ? 'Sound off' : 'Sound on'}
              </button>
            )}
            {count > 0 && (
              <Link
                href="/vendor/approvals"
                className="flex h-10 items-center gap-2 rounded-full bg-tint px-4 text-[15px] font-semibold text-white hover:bg-cta-hover"
              >
                <Bell className="h-[18px] w-[18px]" aria-hidden />
                {count} new order{count === 1 ? '' : 's'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Phone tab bar ── */}
      <nav
        aria-label="Seller"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_8px_rgba(15,17,17,0.06)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-5">
          {TABS.map(({ href, label, icon: Icon, match, badge: which }) => {
            const active = isActive(match);
            const n = countFor(which);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={n > 0 ? `${label}, ${n} new` : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[12px] ${
                  active ? 'font-bold text-tint' : 'font-medium text-label-2'
                }`}
              >
                {active && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-tint" aria-hidden />}
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                  {n > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tint px-1 text-[11px] font-bold text-white ring-2 ring-white">
                      {show(n)}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
