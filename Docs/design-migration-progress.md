# Design System Migration — Progress Tracker

> **Goal**: Apply the LocalMart palette (saffron `accent` + periwinkle `primary` + warm ivory neutrals) across the entire platform — landing, customer, vendor, admin. Match the OYO OS reference: minimal, crisp, single-accent, flat surfaces, hairline borders, no gradients on operational pages.
>
> **Reference doc**: `frontend/Docs/localmart-design-system.md` (Section 14 covers vendor + admin enterprise console rules).
>
> **Tokens**: `accent` / `accent-dark` / `accent-light` / `primary` / `primary-xlight` / `primary-dark` / `ivory` / `cream` / `sand` / `ink` / `ink-2` / `ink-3` / `tulsi` / `laal`.
>
> **Last updated**: 2026-05-04

---

## Migration rules (apply on every file)

**Replace**:
- `bg-gray-50` → `bg-ivory`
- `bg-gray-100` → `bg-cream` (or `bg-ivory` for hover states)
- `border-gray-100` → `border-cream`
- `border-gray-200` → `border-sand`
- `text-gray-500` → `text-ink-3`
- `text-gray-600` → `text-ink-2`
- `text-gray-700` → `text-ink-2`
- `text-gray-900` → `text-ink`
- `bg-[#FF9933]` / `bg-orange-500` → `bg-accent`
- `hover:bg-[#e8872b]` / `hover:bg-orange-600` → `hover:bg-accent-dark`
- `bg-orange-100` (icon tile) → `bg-accent-light`
- `text-orange-500/600/700` → `text-accent` / `text-accent-dark`
- `bg-emerald-500/600` (success CTA) → `bg-accent` (single-accent rule) OR `bg-tulsi` if semantic
- `bg-green-100 text-green-700` → `bg-tulsi/10 text-tulsi`
- `bg-red-100 text-red-700` → `bg-laal/10 text-laal`
- `bg-amber-100 text-amber-700` → `bg-accent-light text-accent-dark`
- `bg-blue-100 text-blue-700` → `bg-primary-xlight text-primary-dark`
- Status pills: drop the `border ${color}-200` segment entirely (flat tints only)

**Remove / replace patterns**:
- ❌ `bg-gradient-to-br from-* to-*` → flat single color
- ❌ `shadow-lg shadow-orange-500/20` (and any colored shadow) → `shadow-sm` only
- ❌ `border-2` → `border` (always 1px)
- ❌ Decorative emoji in headers (🔒 ⛔ 🛍️ ⭐ 🔍 😔) → `text-[10px] uppercase tracking-[0.18em] text-ink-3` overline label
- ❌ Multiple primary-color CTAs in one section → keep ONE saffron CTA per visible viewport, the rest go ghost (`bg-white border border-sand`)

**Always add**:
- Headings: `font-[family-name:var(--font-family-heading)]` (General Sans)
- Section titles: weight `font-semibold` (not `font-bold`)
- KPI numbers: `font-semibold text-ink` (or `text-accent-dark` / `text-tulsi` for semantic)

**Behavior preservation rules** (CRITICAL):
- Touch ONLY className, color tokens, and dead emoji decorations
- Do NOT modify: `useState`, `useEffect`, fetch calls, handlers, `href` routes, conditional rendering, form structure, validation, alert/confirm flows
- Do NOT remove imports unless replacing with palette token (e.g. removing Lucide icon usage isn't required — keep the icons, recolor them)
- Verify: every original `<Link>`, `<button onClick>`, modal, and form field is still present after the edit

---

## Status by file / route

### ✅ DONE

| File | Date | Notes |
|---|---|---|
| `frontend/Docs/localmart-design-system.md` | 2026-05-03 | v1.0 → v1.1, added Section 14 (vendor/admin enterprise console rules) |
| `frontend/app/admin/page.tsx` | 2026-05-03 | Header pills, tabs, filters, table, modals (request + vendor), status helper. All handlers preserved. |
| `frontend/app/vendor/dashboard/page.tsx` | 2026-05-03 | All 4 guard screens (no-user, not-vendor, no-session, no-stores). Replaced 🔒/⛔ emoji with overline labels. |
| `frontend/app/vendor/dashboard/DashboardClient.tsx` | 2026-05-03 | Header, store grid, selected-store hero, quick actions (6 tiles → 1 accent + 5 ghost), pending notice, stats grid (icon-free OYO-OS style), products/orders panels with empty states. |

### ⏳ TODO — Vendor surfaces

Priority order (start from most-visible after dashboard):

| Path | Owner | Notes |
|---|---|---|
| `frontend/components/VendorStoreCard.tsx` | — | Likely uses orange/emerald gradients — used inside dashboard grid, do this first |
| `frontend/components/ShareStoreModal.tsx` | — | Modal palette pass |
| `frontend/app/vendor/stores/page.tsx` | — | Store listing |
| `frontend/app/vendor/products/page.tsx` | — | Product list |
| `frontend/app/vendor/products/new/page.tsx` | — | New-product form |
| `frontend/app/vendor/products/bulk-add/page.tsx` | — | Bulk-add flow |
| `frontend/app/vendor/orders/page.tsx` | — | Order list |
| `frontend/app/vendor/settings/page.tsx` | — | Settings form |
| `frontend/app/vendor/broadcast/page.tsx` | — | Broadcast composer |
| `frontend/app/vendor/onboarding/page.tsx` | — | Multi-step onboarding |
| `frontend/app/vendor/pending/page.tsx` | — | Pending approval screen |
| `frontend/app/vendor/rejected/page.tsx` | — | Rejected screen |
| `frontend/app/vendor/telegram/page.tsx` | — | Telegram integration |

### ⏳ TODO — Admin surfaces

| Path | Owner | Notes |
|---|---|---|
| `frontend/app/admin/login/page.tsx` | — | Login form |
| `frontend/app/admin/analytics/page.tsx` | — | Charts may need palette-token fills |
| `frontend/app/admin/orders/page.tsx` | — | Orders table |
| `frontend/app/admin/users/page.tsx` | — | Users table |
| `frontend/app/admin/revenue/page.tsx` | — | Revenue dashboard |
| `frontend/app/admin/business-categories/page.tsx` | — | Category CRUD |
| `frontend/app/admin/product-templates/page.tsx` | — | Template CRUD |
| `frontend/app/admin/reviews/page.tsx` | — | Reviews moderation |
| `frontend/app/admin/product-reviews/page.tsx` | — | Product reviews moderation |

### ⏳ TODO — Customer / public surfaces

| Path | Owner | Notes |
|---|---|---|
| `frontend/app/(public)/*` | — | Public landing, marketing |
| `frontend/app/(customer)/*` | — | Customer-area pages |
| `frontend/app/search/page.tsx` | — | Search results |
| `frontend/app/(auth)/*` | — | Sign-in / sign-up |
| `frontend/app/unauthorized/page.tsx` | — | 403 screen |
| `frontend/app/loading.tsx` | — | Already on ivory? verify |
| `frontend/components/Navbar.tsx` | partial | Green button fixed earlier; full review pending |
| `frontend/components/Footer.tsx` | — | Still on old palette per prior note |

### ⏳ TODO — API routes (no UI work, but copy/email templates if any)

- `frontend/app/api/**/*.ts` — verify no inline HTML strings reference old hex

---

## Audit checklist (run before marking a file done)

```
1. grep file for: bg-orange, bg-emerald, bg-indigo, bg-blue, bg-purple, bg-amber, bg-red, bg-green
   → all should be palette tokens or semantic (tulsi/laal/accent/primary)
2. grep file for: shadow-{color}-, gradient-to, #FF9933, #10A37F, #e8872b
   → must be zero
3. grep file for: text-gray-, bg-gray-, border-gray-
   → all should be ink/ink-2/ink-3 / ivory/cream / sand
4. grep file for: text-2xl font-bold (or any font-bold heading)
   → swap to font-semibold + General Sans utility
5. grep file for emoji: 🔒 ⛔ 🛍️ ⭐ 🔍 😔 ✅ ❌ ⚠️
   → replace with overline labels or Lucide icons in palette colors
6. Diff against original: every onClick/href/useState/useEffect must still be present
7. Visit page in browser at 430px and at desktop width — confirm no layout regression
```

---

## Open questions / decisions to revisit

- **Sidebar navigation**: design system spec calls for a 220px left sidebar in admin/vendor. Current admin uses a horizontal pill nav in the header. Decide: keep horizontal (denser, single screen), or convert to OYO-OS-style left sidebar (more scalable as more pages added).
- **Charts** (admin/analytics, admin/revenue): which library? Need to set chart color palette to `accent` / `primary` / `tulsi` / `laal` / `ink-2` series.
- **Status copy**: `PENDING_APPROVAL` / `SUSPENDED` / `ACTIVE` — keep as-is or humanize? (e.g. "Awaiting review" / "Paused" / "Live")
- **Mobile bottom nav**: design system has bottom nav spec — confirm where it should appear (customer mobile only? vendor mobile too?).

---

## Notes for future sessions

- Tailwind v4 uses `@theme` in `frontend/app/tailwind.config.css`. Token changes require `rm -rf .next && npm run dev` + hard refresh.
- The DB is commonly disconnected — do NOT run `prisma migrate`, server boots, or E2E. Code + `prisma generate` only.
- Verify each page's behavior in a 430px viewport (mobile-first). Vendors and buyers primarily use phones.
- General Sans loaded via Fontshare `<link>` in `app/layout.tsx`; DM Sans via `next/font/google`.
- One saffron CTA per visible viewport. If a page already has a saffron header button, the form-submit button below should be saffron too only if it's the canonical action; otherwise ghost.

---

## Quick-resume prompt for next session

> Continue the LocalMart design system migration. Read `frontend/Docs/design-migration-progress.md` for status, rules, and the next file to do. Pick the top item from "TODO — Vendor surfaces" (currently `frontend/components/VendorStoreCard.tsx`). Apply the migration rules from this doc, preserve every handler/route/state, then update this progress file: move the row from TODO to DONE with today's date and a one-line note about what changed.
