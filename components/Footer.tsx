"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useOpenShopTypes } from "@/hooks/useOpenShopTypes";
import { signInHref } from "@/lib/auth/returnTo";
import { IndianRupee, Wallet } from "lucide-react";

// Focused task screens don't need a footer
// Seller and admin screens are app-like: no shopper footer there
const NO_FOOTER = ["/checkout", "/orders/waiting", "/cart", "/my-orders", "/vendor", "/admin", "/map"];

// Only real pages — no dead links
const SHOP_LINKS = [
  { label: "All shops", href: "/stores" },
  { label: "Shops on the map", href: "/map" },
  { label: "Sarees & fashion", href: "/stores?category=clothing", type: "FASHION" },
  { label: "Groceries", href: "/stores?category=grocery", type: "GROCERY" },
  { label: "Medical stores", href: "/stores?category=medical", type: "PHARMACY" },
];

const linkClass = "text-[14px] text-label-2 hover:text-tint transition-colors";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-label-3">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

const Footer = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const openTypes = useOpenShopTypes();
  if (NO_FOOTER.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="mt-10 hidden border-t border-hairline bg-canvas text-label lg:block">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="LocalMart home" className="text-[22px] font-extrabold tracking-[-0.03em] text-label">
              Local<span className="text-coral">Mart</span>
            </Link>
            <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-label-2">
              Order from real shops in your town, delivered by the shop itself.
            </p>
            <p className="mt-1 text-[13px] text-label-3">अपने शहर की दुकानों से घर बैठे खरीदें</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-[12px] font-medium text-label-2">
                <Wallet className="h-3.5 w-3.5 text-tint" aria-hidden />
                Cash on delivery
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-[12px] font-medium text-label-2">
                <IndianRupee className="h-3.5 w-3.5 text-tint" aria-hidden />
                UPI to the shop
              </span>
            </div>
          </div>

          <Column title="Shop">
            {/* Only kinds of shop that are open (no links to empty pages) */}
            {SHOP_LINKS.filter((l) => !("type" in l) || openTypes?.has(l.type as string)).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Column>

          <Column title="Your account">
            {user ? (
              <>
                <li>
                  <Link href="/my-orders" className={linkClass}>
                    My orders
                  </Link>
                </li>
                <li>
                  <Link href="/favorite-stores" className={linkClass}>
                    Saved shops
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className={linkClass}>
                    Profile
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href={signInHref(pathname)} className={linkClass}>
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className={linkClass}>
                    Create an account
                  </Link>
                </li>
              </>
            )}
          </Column>

          <Column title="Sell on LocalMart">
            <li>
              <Link href="/become-vendor" className={linkClass}>
                Open your shop
              </Link>
            </li>
            <li>
              <Link href="/vendor/dashboard" className={linkClass}>
                Seller dashboard
              </Link>
            </li>
          </Column>

          <Column title="Help">
            <li>
              <Link href="/faq" className={linkClass}>
                Questions & answers
              </Link>
            </li>
            <li>
              <Link href="/about" className={linkClass}>
                About LocalMart
              </Link>
            </li>
          </Column>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-hairline pt-6 text-[13px] text-label-3">
          <p>© {new Date().getFullYear()} LocalMart</p>
          <p>Made for local shops in India · भारत की दुकानों के लिए</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
