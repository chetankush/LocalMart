# LocalMart — Platform Brief & Redesign Prompt

Companion to `Docs/localmart-design-system.md` (v1.0). This doc captures *what the platform is and why it wins*, and provides a paste-ready prompt for any redesign work (AI design tool or human designer).

---

## 1. What the Platform Is

**LocalMart** (codenamed NearStore in older docs) is a **hyperlocal multi-vendor marketplace** — think "Amazon meets your neighborhood kirana." Three audiences live in one product:

| Role | Goal | Primary surface |
|---|---|---|
| **Customer** | Discover & order from local stores within their pincode | `/`, `/stores`, `/products/[id]`, `/cart`, `/checkout`, `/my-orders` |
| **Vendor** | Run a digital storefront — products, orders, broadcasts | `/vendor/dashboard`, `/vendor/products`, `/vendor/orders` |
| **Admin** | Approve vendors, moderate reviews, manage templates | `/admin/*` |

---

## 2. Core Functionalities

### Customer side
- **Location-first discovery** — GPS → IP → manual pincode fallback. Every store/product list is location-scoped.
- **Multi-theme storefronts** — same backend, vendor picks Kirana / Grocery / Fashion / Default theme. The store page UI changes per vertical.
- **Multi-vendor cart** — one cart, items grouped by vendor, separate orders created per vendor at checkout.
- **COD-only payment** (UPI/Card "Coming Soon") — checkout flow is intentionally light.
- **Order lifecycle**: PENDING → ACCEPTED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED (+ CANCELLED / REFUNDED).
- **Notification system** — back-in-stock, new collection, vendor broadcast, area alerts (new store in your pincode).
- **Reviews** — both store-level and product-level, with verified-purchase badges.
- **Favorites** — saved stores feed the broadcast subscriber list.

### Vendor side
- Application → approval → onboarding wizard with product seed templates.
- Dashboard with stats (products, pending orders, completed).
- Multi-store support (one account, many storefronts).
- Product CRUD with SKU, stock, low-stock threshold, compare-at price.
- Order status updates with timeline.
- Theme + storefront customization (logo, banner, social links).
- Broadcast composer to push notifications to favoriters.

### Admin side
- Vendor request approval queue with rejection-reason workflow.
- Store activate/suspend.
- Product template library (the seed catalog vendors use to quick-add inventory).
- Review moderation (hide / delete, auto-recalculates ratings).

---

## 3. The Moat (Defensibility)

These are the *structural* advantages — not "features," but reasons competitors can't easily copy.

1. **Hyperlocal density network effect.** The product is worthless until ~10 vendors in one pincode are live. Once a pincode hits critical mass, customers default to LocalMart for that area, vendors can't leave (their customers are on it), and a new entrant has to bootstrap pincode-by-pincode all over again. Swiggy/Instamart can't go this granular without burning capital — LocalMart wins by being *boring and small*.
2. **Vendor-owned trust graph.** Favoriters subscribe to *that vendor's* broadcasts. The vendor's customer list is portable inside LocalMart but invisible to competitors. Each broadcast deepens the moat.
3. **Zero-friction COD/UPI-direct rails.** No payment gateway, no settlement delay, no compliance. Customer pays vendor directly. This is a **regulatory and capital moat** vs. payment-heavy competitors.
4. **Theme-per-vertical storefronts.** Same infra serves a kirana selling rice and a boutique selling sarees, each looking native. Generic marketplaces (Meesho, Flipkart) flatten this; LocalMart respects the category's aesthetic.
5. **Template-driven onboarding.** A new kirana can list 20 SKUs in 5 minutes via the seed catalog. Onboarding cost ≈ 0; this is the cheapest vendor-acquisition mechanic in the category.
6. **Admin-curated supply, not open marketplace.** Every vendor is approved. No counterfeit, no spam. This is the Etsy-style trust premium.

---

## 4. USPs

### For customers
- *Apna bazaar, apni keemat* — buy from the same shops you already know, but with delivery and order tracking.
- See what's in stock *right now* in your pincode, not what's available "in 2 days from a warehouse 800km away."
- One cart, multiple shops, one checkout.
- Get notified when your favorite kirana restocks atta or your tailor lists new fabrics.

### For vendors
- Free digital storefront, zero commission at launch.
- WhatsApp/QR sharing built in — your existing customers find your store in 3 seconds.
- One-click bulk product add via templates.
- Direct UPI payments — money lands in your account, not the platform's.
- Multi-store from day one (your son's electronics shop and your kirana in one login).

### For the platform
- The only marketplace built for the **₹50–₹2000 basket size** that's too small for Amazon, too physical for Meesho, and too local for Swiggy.

---

## 5. Redesign Prompt (Paste-Ready)

Use this as the master brief for any AI design tool (Claude, v0, Figma Make, Lovable) or human designer. It's anchored to the v1.0 design tokens in `Docs/localmart-design-system.md` so the redesign **extends, not replaces**, the existing system.

---

> # LocalMart — Mobile-First Redesign Brief
>
> ## Product
> LocalMart is India's hyperlocal multi-vendor marketplace. Customers discover and order from local stores (kirana, fashion, electronics, grocery, pharmacy) within their pincode. Vendors run free digital storefronts. Payment is COD or direct UPI — there is no payment gateway.
>
> Tagline: **"Apna Bazaar, Apni Keemat."**
>
> ## Audience
> - **Primary**: Indian buyers, 25–35, Tier-1 and Tier-2 cities, smartphone-native, value-conscious, trust local brands more than global ones.
> - **Secondary**: Vendors aged 30–55 running kirana, boutique, electronics, or grocery shops. Comfortable with WhatsApp, less so with dashboards.
>
> ## Brand position
> Trustworthy, local, modern — **not** generic global SaaS. Not nationalistic, not ornamental, not "ethnic." Distinctiveness comes from palette and spacing, not decorative type.
>
> ## Design tokens (locked — do not change)
> - **Brand**: Periwinkle `#93A4FF` for explore/discover/brand. Never on buy CTAs.
> - **Action**: Saffron Gold `#F59B1C` reserved for buy CTAs, sale badges, and warnings.
> - **Surfaces**: Warm Ivory `#FAF7F2` page background, Cream `#F2EDE4` alternating sections, Sand `#E4DED6` borders. **Never pure white as page background.**
> - **Ink**: `#1C1C2E` (primary), `#5A5870` (secondary), `#9896AA` (tertiary).
> - **Semantic**: Tulsi `#2A7D4F` success, Laal `#C62828` error.
> - **Type**: General Sans 600 (display, headings, brand) at -0.01em tracking + DM Sans (body, prices, UI). No Playfair, no Baloo, no scripts.
> - **Radius**: 8 / 12 / 16 / 20 / pill.
> - **Shadows**: Subtle periwinkle bloom on cards, saffron glow on CTAs, deep ink for modals.
>
> ## Mobile baseline
> Design at **430px width** first. Desktop is a stretched mobile, not a different product. Bottom nav on mobile (Home / Stores / Cart / Orders / Profile).
>
> ## Screens to redesign (in priority order)
>
> ### Customer
> 1. **Landing page** (`/`) — Hero carousel, location bar, category rail, featured stores near you, popular products, vendor CTA strip, trust section, FAQs.
> 2. **Store listing** (`/stores`) — Filter chips (category, distance, rating), store cards with logo + rating + delivery time, empty state for "no stores in pincode."
> 3. **Store detail** (`/stores/[id]`) — Theme-aware (Kirana/Fashion/Grocery/Default), banner + logo + reviews summary, product grid, favorite toggle.
> 4. **Product detail** (`/products/[id]`) — Image gallery, price + strike price + % off, vendor strip, stock badge, reviews, "notify me" if out of stock, sticky Add to Cart on mobile.
> 5. **Cart** (`/cart`) — Items grouped by vendor (each group = one order at checkout), per-vendor delivery fee, total summary, sticky Checkout pill.
> 6. **Checkout** (`/checkout`) — Address form, COD as default + "UPI/Card coming soon" disabled chips, per-vendor order breakdown, place order CTA.
> 7. **My Orders** (`/my-orders`) — Tabs (Active, Delivered, Cancelled), status timeline per order, reorder action.
> 8. **Notifications** (`/notifications`) — Grouped by type (broadcasts, back-in-stock, area alerts), unread dot, mark-all-read.
> 9. **Favorites**, **Profile**, **Subscription** — secondary surfaces, light treatment.
>
> ### Vendor
> 10. **Dashboard** (`/vendor/dashboard`) — Stats cards (products, pending orders, completed, revenue placeholder), store switcher, quick actions.
> 11. **Products list** (`/vendor/products`) — Filter (active, low stock, out of stock), inline stock edit, bulk template import.
> 12. **Add/edit product** (`/vendor/products/new`) — Wizard: template pick → details → images → pricing → stock.
> 13. **Orders** (`/vendor/orders`) — Status tabs, status update buttons, customer contact, order timeline.
> 14. **Settings** (`/vendor/settings`) — Business info, address, logo upload, banner, social links, theme picker.
> 15. **Broadcast composer** — Title + message + character counter + recipient count.
>
> ### Admin
> 16. **Vendor requests** — Queue with status filters, approve/reject modal with reason field.
> 17. **Vendor management** — Activate/suspend toggles, vendor detail drawer.
> 18. **Product templates**, **Reviews moderation** — Tables with bulk actions.
>
> ## Interaction & motion principles
> - **No skeletons that flash.** Use cream-tinted placeholders that look intentional — empty states are first-class, never zero-height.
> - **Every list shows count and location context** ("12 stores near 110024").
> - **Status is always a chip with a color and a verb**, never just a colored dot.
> - **Sticky action pills on mobile** (Add to Cart, Checkout, Place Order) — never bury the primary action in a scrolling form.
> - **Gentle motion only** — 150–200ms ease-out for hovers, 250ms for sheet slides. No bouncy springs, no parallax.
>
> ## Components to systematize
> - Button (primary saffron pill, secondary periwinkle ghost pill, tertiary text link, destructive laal).
> - Badge (NEW periwinkle, SALE saffron, % OFF tulsi text-only, VERIFIED tulsi pill).
> - Product card, store card, order card, notification card.
> - Filter chip rail (horizontal scroll, snap, active state).
> - Bottom sheet (mobile filters, location selector, address form).
> - Empty state (dashed sand border, hairline saffron, headline + body, no emoji/icon art).
> - Toast (success tulsi, error laal, info periwinkle).
> - Bottom nav (mobile, 5 slots, active = ink + periwinkle stroke; cart-active = saffron stroke).
>
> ## Category atmosphere
> The CTA stays saffron everywhere, but the **supporting tint shifts per vertical**:
> - **Fashion** → periwinkle leads (aspirational, soft).
> - **Kirana** → saffron leads (warm, homely).
> - **Electronics** → periwinkle-dark leads (precise, tech-forward).
> - **Beauty** → soft pink fallback gradients.
> - **Home/Decor** → warm peach fallback gradients.
>
> ## Hard rules (do not violate)
> 1. Saffron `#F59B1C` only for buy actions and SALE/warning. Never on links, headers, body text.
> 2. Page background is always Ivory `#FAF7F2`. White is reserved for raised cards/modals.
> 3. No decorative fonts. No emoji as decoration. No 3D illustrations. No gradients on text.
> 4. Prices always in DM Sans 700 with `tabular-nums` and the `₹` glyph.
> 5. Every empty state renders a dashed-border panel — never a collapsed section.
> 6. Trust comes from typography and spacing, not from "trust badges" with shields.
>
> ## Deliverables
> 1. A token sheet that extends the v1.0 design system (don't redefine — extend).
> 2. Hi-fi mobile (430px) for all 9 customer screens.
> 3. Hi-fi mobile + desktop for the vendor dashboard, products list, and orders.
> 4. Component library (buttons, cards, chips, sheets, empty states, toasts, bottom nav).
> 5. One filled and one empty state per screen.
> 6. A short rationale doc explaining where you flexed the v1.0 system and why.

---

## Versioning

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-05-02 | Initial brief. Platform overview, moat, USPs, paste-ready redesign prompt anchored to design system v1.0. |
