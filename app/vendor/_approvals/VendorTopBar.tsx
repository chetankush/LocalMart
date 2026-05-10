'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useApprovals } from './ApprovalsPollerContext';

const NAV = [
  { href: '/vendor/dashboard', label: 'Dashboard' },
  { href: '/vendor/approvals', label: 'Approvals', isApprovals: true },
  { href: '/vendor/orders', label: 'Orders' },
  { href: '/vendor/products', label: 'Products' },
  { href: '/vendor/settings', label: 'Settings' },
];

export function VendorTopBar() {
  const pathname = usePathname();
  const { count, sessionMuted, setSessionMuted, audioUnlocked } = useApprovals();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-sand">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-ink-2 hover:bg-cream'
                }`}
              >
                <span>{item.label}</span>
                {item.isApprovals && count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-accent' : 'bg-laal text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {audioUnlocked && (
            <button
              type="button"
              onClick={() => setSessionMuted(!sessionMuted)}
              className="p-2 rounded-full hover:bg-cream text-ink-2"
              aria-label={sessionMuted ? 'Unmute chime for this session' : 'Mute chime for this session'}
              title={sessionMuted ? 'Chime muted' : 'Chime on'}
            >
              {sessionMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}
          <Link
            href="/vendor/approvals"
            className="relative p-2 rounded-full hover:bg-cream text-ink-2"
            aria-label={count > 0 ? `${count} pending approval${count === 1 ? '' : 's'}` : 'No pending approvals'}
          >
            <Bell className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-laal text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
