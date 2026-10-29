"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  ChevronRight,
  FolderTree,
  Home,
  IndianRupee,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquareText,
  Package,
  ReceiptText,
  Star,
  Store,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { AdminGate } from "@/components/app/admin";

type Item = { href: string; label: string; icon: typeof Store; match?: (p: string) => boolean };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Run",
    items: [
      { href: "/admin", label: "Shops & requests", icon: Store, match: (p) => p === "/admin" },
      { href: "/admin/orders", label: "Orders", icon: ReceiptText },
      { href: "/admin/visits", label: "Shop visits", icon: CalendarCheck },
      { href: "/admin/users", label: "People", icon: Users },
    ],
  },
  {
    title: "Money & numbers",
    items: [
      { href: "/admin/revenue", label: "Revenue", icon: IndianRupee },
      { href: "/admin/ads", label: "Ads", icon: Megaphone },
      { href: "/admin/plans", label: "Pro payments", icon: BadgeCheck },
      { href: "/admin/handloom", label: "Handloom checks", icon: ShieldCheck },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/business-categories", label: "Shop categories", icon: FolderTree },
      { href: "/admin/product-templates", label: "Ready-made products", icon: Package },
    ],
  },
  {
    title: "Reviews",
    items: [
      { href: "/admin/reviews", label: "Shop reviews", icon: Star },
      { href: "/admin/product-reviews", label: "Product reviews", icon: MessageSquareText },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items);
// Phone tab bar: the four places used most, the rest under "More"
const TABS = ALL.filter((i) => ["/admin", "/admin/orders", "/admin/users", "/admin/revenue"].includes(i.href));
const SHORT: Record<string, string> = {
  "/admin": "Shops",
  "/admin/orders": "Orders",
  "/admin/users": "People",
  "/admin/revenue": "Revenue",
};

const isActive = (item: Item, path: string) =>
  item.match ? item.match(path) : path === item.href || path.startsWith(`${item.href}/`);

/**
 * Admin navigation. Desktop: a left sidebar under the site header.
 * Phones: a bottom tab bar (Shops, Orders, People, Revenue, More).
 */
export function AdminNav() {
  const path = usePathname() ?? "";
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  if (path.startsWith("/admin/login")) return null;

  const signOut = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
    router.push("/admin/login");
  };

  const moreActive = !TABS.some((t) => isActive(t, path));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        aria-label="Admin"
        className="fixed bottom-0 left-0 top-[65px] z-30 hidden w-64 flex-col border-r border-hairline bg-white lg:flex"
      >
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-5">
              <p className="px-3 pb-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-label-3">{g.title}</p>
              {g.items.map((item) => {
                const active = isActive(item, path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${
                      active ? "bg-tint-soft font-semibold text-tint" : "font-medium text-label-2 hover:bg-fill hover:text-label"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.3 : 1.9} aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-hairline p-3">
          <Link
            href="/"
            className="flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-label-2 hover:bg-fill hover:text-label"
          >
            <Home className="h-[18px] w-[18px]" aria-hidden />
            Open LocalMart
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-bad hover:bg-bad-soft cursor-pointer"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Phone tab bar ── */}
      <nav
        aria-label="Admin"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_8px_rgba(15,17,17,0.06)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-5">
          {TABS.map((item) => {
            const active = isActive(item, path);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[12px] ${
                  active ? "font-bold text-tint" : "font-medium text-label-2"
                }`}
              >
                {active && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-tint" aria-hidden />}
                <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                {SHORT[item.href]}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[12px] cursor-pointer ${
              moreActive ? "font-bold text-tint" : "font-medium text-label-2"
            }`}
          >
            {moreActive && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-tint" aria-hidden />}
            <LayoutGrid className="h-6 w-6" strokeWidth={moreActive ? 2.3 : 1.8} aria-hidden />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Admin">
        {GROUPS.map((g) => (
          <div key={g.title} className="mb-4">
            <p className="px-1 pb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">{g.title}</p>
            <div className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
              {g.items.map((item) => {
                const active = isActive(item, path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-[52px] items-center gap-3 px-4 active:bg-fill"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                        active ? "bg-tint text-white" : "bg-tint-soft text-tint"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className={`flex-1 text-[16px] ${active ? "font-semibold text-label" : "text-label"}`}>{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-label-3" aria-hidden />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        <div className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
          <Link href="/" onClick={() => setMoreOpen(false)} className="flex min-h-[52px] items-center gap-3 px-4 text-[16px] text-label active:bg-fill">
            <Home className="h-5 w-5 text-label-2" aria-hidden />
            Open LocalMart
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex min-h-[52px] w-full items-center gap-3 px-4 text-[16px] text-bad active:bg-fill cursor-pointer"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            Sign out
          </button>
        </div>
      </Sheet>
    </>
  );
}

/**
 * Sidebar + room for it — except on the sign-in screen. Also the one place
 * that makes sure the person is an admin: checked on every admin page, and
 * anyone else is sent to the admin sign-in.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const router = useRouter();
  const isLogin = path.startsWith("/admin/login");
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLogin) return;
    let live = true;
    fetch("/api/admin/check-auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .catch(() => ({ isAdmin: false }))
      .then((d: { isAdmin?: boolean }) => {
        if (!live) return;
        if (d.isAdmin) setAllowed(true);
        else {
          setAllowed(false);
          router.replace("/admin/login");
        }
      });
    return () => {
      live = false;
    };
  }, [path, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (!allowed) return <AdminGate />;
  return (
    <>
      <AdminNav />
      <div className="lg:pl-64">{children}</div>
    </>
  );
}
