# LocalMart Design System

Mobile-first design system (430px baseline) for **LocalMart** — India's neighbourhood multi-vendor marketplace. Serves buyers aged 25–35 in tier-1 and tier-2 cities, and vendors across Fashion, Kirana, and Electronics.

> **Tagline**: Apna Bazaar, Apni Keemat
>
> **Tone**: Trustworthy, local, modern. *Not* generic global SaaS.

---

## 1. Palette

### Rationale

- **Periwinkle (#93A4FF)** is the brand colour — distinctive in Indian fintech/marketplace (which is saturated with corporate blue), visually rooted in the indigo tradition of Indian textiles, but modern enough for a young buyer audience.
- **Saffron Gold (#F59B1C)** is reserved *exclusively* for buy actions — Add to Cart, Shop Now, primary CTAs, sale badges. Culturally resonant without being nationalistic, and it pulls strong against warm neutrals.
- **Warm Ivory (#FAF7F2)** replaces sterile white as the page background — feels like a haveli wall or kirana counter rather than a SaaS dashboard. Every surface reads a shade warmer.

### Tokens

#### Primary — Periwinkle

Role: explore, discover, brand, tints. **Never used on primary buy CTAs.**

| Token | Hex | Use |
|---|---|---|
| `--color-primary` | `#93A4FF` | Brand accents, icons, hover rings |
| `--color-primary-dark` | `#6B7FFF` | Link hover, secondary button text |
| `--color-primary-light` | `#C4CEFF` | Subtle tints, borders |
| `--color-primary-xlight` | `#EEF0FF` | Ghost backgrounds, chip fills |

#### Accent — Saffron Gold

Role: every primary CTA, every buy action, every sale/discount badge.

| Token | Hex | Use |
|---|---|---|
| `--color-accent` | `#F59B1C` | Primary CTA button, Add to Cart, SALE badge |
| `--color-accent-dark` | `#D4820E` | CTA hover, pressed states |
| `--color-accent-light` | `#FDE8B8` | Highlight backgrounds, vendor badge tint |

#### Neutrals — Warm grey system

| Token | Hex | Use |
|---|---|---|
| `--color-bg` (ivory) | `#FAF7F2` | Page background |
| `--color-surface` (cream) | `#F2EDE4` | Alternating section background |
| `--color-border` (sand) | `#E4DED6` | Dividers, input borders, card outlines |
| `--color-white` | `#FFFFFF` | Product card fills, modal surfaces |

#### Text — Ink scale

| Token | Hex | Use |
|---|---|---|
| `--color-text-primary` (ink) | `#1C1C2E` | Headlines, body copy |
| `--color-text-secondary` (slate) | `#5A5870` | Descriptions, captions |
| `--color-text-tertiary` (mist) | `#9896AA` | Metadata, placeholders, disabled |

#### Semantic

| Token | Hex | Use |
|---|---|---|
| `--color-success` (tulsi) | `#2A7D4F` | Success toasts, verified badges, in-stock |
| `--color-error` (laal) | `#C62828` | Error toasts, destructive actions |
| `--color-warning` (marigold) | `#F59B1C` | Warnings (same as accent — context differentiates) |

---

## 2. Typography

### Rationale

- **General Sans** (Indian Type Foundry, via Fontshare) is the display voice — geometric but warm, distinctly non-Western-SaaS, designed by an Indian-origin foundry. Used at semibold (600) with `-0.01em` tracking for headings, buttons, brand marks, and anywhere a distinctive voice matters.
- **DM Sans** handles all body copy, labels, captions, prices, and numeric data. It's readable at small sizes, has excellent tabular numerals, and pairs cleanly with General Sans.
- **No decorative display fonts** (Playfair Display, Baloo 2, script faces) — they undermine trust for a money-handling marketplace targeting 25–35 Indian users. Distinctiveness comes from palette, spacing, and hierarchy — not from ornamental typography.

### Stacks

| Purpose | Family | Weights | Loaded via |
|---|---|---|---|
| Display / Headings / Brand | `"General Sans"` | 400, 500, 600, 700 | Fontshare CDN (`<link>` in `layout.tsx`) |
| Body / UI / Labels / Price | `DM Sans` | 300, 400, 500, 600, 700 | `next/font/google` |
| Devanagari fallback | `Hind`, `Noto Sans Devanagari` | 400, 500, 600 | `next/font/google` (add when needed) |

### Type scale (mobile 430px baseline)

| Token | Size / Family / Weight | Use |
|---|---|---|
| `--text-hero` | 34–48px / General Sans 600 | Hero carousel headline |
| `--text-h2` | 28–36px / General Sans 600 | Major section titles |
| `--text-h3` | 18–22px / General Sans 600 | Card titles, sub-sections |
| `--text-body` | 14px / DM Sans 400 | Body copy |
| `--text-small` | 12–13px / DM Sans 400 | Secondary text |
| `--text-caption` | 11px / DM Sans 400 | Metadata, timestamps |
| `--text-label` | 10px / General Sans 600 uppercase `tracking-[0.22em]` | Overline/eyebrow labels |
| `--text-price` | 15–18px / DM Sans 700 `tabular-nums` | Product prices (`₹849`) |

### Loading snippets

```html
<!-- In app/layout.tsx <head> -->
<link
  rel="stylesheet"
  href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
/>
```

```ts
// In app/layout.tsx
import { DM_Sans } from "next/font/google";
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});
```

---

## 3. Spacing (4px base)

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

---

## 4. Border radius

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Chips, small badges |
| `--radius-md` | 12px | Inputs, small cards |
| `--radius-lg` | 16px | Product cards, promo cards |
| `--radius-xl` | 20px | Hero banners, bottom sheets |
| `--radius-full` | 9999px | Pills, CTAs, avatars |

---

## 5. Shadows

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 2px 12px rgba(147,164,255,0.08)` | Resting product cards (subtle periwinkle bloom) |
| `--shadow-hover` | `0 8px 24px rgba(147,164,255,0.15)` | Card hover lift |
| `--shadow-accent` | `0 4px 16px rgba(245,155,28,0.4)` | Saffron CTA glow |
| `--shadow-modal` | `0 24px 64px rgba(28,28,46,0.25)` | Modals, bottom sheets, overlays |

---

## 6. Component rules

### Buttons

| Variant | Background | Text | Border | Font | Radius | Shadow |
|---|---|---|---|---|---|---|
| **Primary** (Shop Now, Add to Cart, all buy actions) | `--color-accent` → `--color-accent-dark` on hover | white | none | General Sans 600 / 14px | `--radius-full` | `--shadow-accent` |
| **Secondary** (Explore, View all) | `--color-primary-xlight` | `--color-primary-dark` | 1.5px `--color-primary-light` | DM Sans 600 / 13px | `--radius-full` | none |
| **Ghost** | transparent | `--color-text-secondary` | 1.5px `--color-border` | DM Sans 500 / 13px | `--radius-full` | none |

### Badges

| Badge | Background | Text | Font | Case |
|---|---|---|---|---|
| NEW | `--color-primary` | white | DM Sans 700 / 9px | Uppercase, 0.04em |
| SALE | `--color-accent` | white | DM Sans 700 / 9px | Uppercase, 0.04em |
| % OFF | none | `--color-success` | DM Sans 700 / 10px | — |

### Product card

| Element | Style |
|---|---|
| Container | `bg: white`, `radius: --radius-lg`, `border: 1px --color-border`, `shadow: --shadow-card` |
| Image area | 140–150px tall; placeholder gradient: `from-cream to-sand/40` |
| Vendor label | General Sans 600 / 10px uppercase, `--color-primary-dark`, letter-spacing 0.06em |
| Product name | General Sans 600 / 13px, `--color-text-primary`, 2-line clamp |
| Price | DM Sans 700 / 15px, `--color-text-primary`, tabular numerals |
| Strike price | DM Sans 400 / 10px, `--color-text-tertiary`, line-through |

### Bottom nav (mobile)

- Background: `white`, `border-top: 1px --color-border`
- Active icon stroke: `--color-primary-dark`
- Cart-active stroke: `--color-accent-dark`
- Label: DM Sans 500 / 10px

### Empty states

- Container: `rounded-xl border border-dashed --color-border bg: white/50`
- Opens with a hairline `--color-accent` (40px wide, 1px tall)
- Headline: General Sans 600 / 17–20px
- Body: DM Sans 400 / 14px, `--color-text-secondary`
- No emoji, no Lucide icons — line + type only

---

## 7. CSS custom properties

Drop into `:root` of your stylesheet if you want the raw variable API:

```css
:root {
  /* Primary — Periwinkle */
  --color-primary: #93A4FF;
  --color-primary-dark: #6B7FFF;
  --color-primary-light: #C4CEFF;
  --color-primary-xlight: #EEF0FF;

  /* Accent — Saffron Gold */
  --color-accent: #F59B1C;
  --color-accent-dark: #D4820E;
  --color-accent-light: #FDE8B8;

  /* Neutrals */
  --color-bg: #FAF7F2;
  --color-surface: #F2EDE4;
  --color-border: #E4DED6;
  --color-white: #FFFFFF;

  /* Text — Ink scale */
  --color-text-primary: #1C1C2E;
  --color-text-secondary: #5A5870;
  --color-text-tertiary: #9896AA;

  /* Semantic */
  --color-success: #2A7D4F;
  --color-error: #C62828;
  --color-warning: #F59B1C;

  /* Typography */
  --font-display: "General Sans", system-ui, -apple-system, sans-serif;
  --font-body: "DM Sans", system-ui, -apple-system, sans-serif;

  /* Spacing (4px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 2px 12px rgba(147, 164, 255, 0.08);
  --shadow-hover: 0 8px 24px rgba(147, 164, 255, 0.15);
  --shadow-accent: 0 4px 16px rgba(245, 155, 28, 0.4);
  --shadow-modal: 0 24px 64px rgba(28, 28, 46, 0.25);
}
```

---

## 8. Tailwind configuration

### Tailwind v4 (used in this project) — `@theme`

This is the canonical form and matches `NSfrontend/app/tailwind.config.css`:

```css
@theme {
  /* Font families */
  --font-family-sans: var(--font-dm-sans), system-ui, -apple-system, sans-serif;
  --font-family-display: "General Sans", var(--font-dm-sans), system-ui, sans-serif;
  --font-family-heading: "General Sans", var(--font-dm-sans), system-ui, sans-serif;
  --font-family-brand: "General Sans", var(--font-dm-sans), system-ui, sans-serif;

  /* Breakpoints */
  --breakpoint-xs: 320px;

  /* Periwinkle */
  --color-primary: #93A4FF;
  --color-primary-dark: #6B7FFF;
  --color-primary-light: #C4CEFF;
  --color-primary-xlight: #EEF0FF;

  /* Saffron Gold */
  --color-accent: #F59B1C;
  --color-accent-dark: #D4820E;
  --color-accent-light: #FDE8B8;

  /* Surfaces */
  --color-ivory: #FAF7F2;
  --color-cream: #F2EDE4;
  --color-sand: #E4DED6;

  /* Ink */
  --color-ink: #1C1C2E;
  --color-ink-2: #5A5870;
  --color-ink-3: #9896AA;

  /* Semantic */
  --color-tulsi: #2A7D4F;
  --color-laal: #C62828;
  --color-marigold: #F59B1C;
}
```

### Tailwind v3 compat — `tailwind.config.js` extension object

For projects on v3 or for external references:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#93A4FF",
          dark: "#6B7FFF",
          light: "#C4CEFF",
          xlight: "#EEF0FF",
        },
        accent: {
          DEFAULT: "#F59B1C",
          dark: "#D4820E",
          light: "#FDE8B8",
        },
        ivory: "#FAF7F2",
        cream: "#F2EDE4",
        sand: "#E4DED6",
        ink: {
          DEFAULT: "#1C1C2E",
          2: "#5A5870",
          3: "#9896AA",
        },
        tulsi: "#2A7D4F",
        laal: "#C62828",
        marigold: "#F59B1C",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["General Sans", "var(--font-dm-sans)", "sans-serif"],
        heading: ["General Sans", "var(--font-dm-sans)", "sans-serif"],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(147,164,255,0.08)",
        hover: "0 8px 24px rgba(147,164,255,0.15)",
        accent: "0 4px 16px rgba(245,155,28,0.4)",
        modal: "0 24px 64px rgba(28,28,46,0.25)",
      },
    },
  },
};
```

---

## 9. Token → Component map

| Token | Where it appears in the product |
|---|---|
| `--color-accent` | Primary CTA pills, Add to Cart, sale badges, carousel progress bar, highlight accents on headings |
| `--color-primary` | Brand mark, NEW badge, link hover rings, trust-icon circle fills |
| `--color-primary-dark` | Link text, secondary button labels, vendor labels in cards, top-loader |
| `--color-primary-xlight` | Trust icon backgrounds, secondary button fills, product image placeholders |
| `--color-bg` (ivory) | Page background body-wide |
| `--color-surface` (cream) | Trust strip, alternating sections, "Best of X" deal-grid headers |
| `--color-border` (sand) | Card borders, dividers, chip outlines, empty-state dashed borders |
| `--color-ink` | All headlines, body text, CTA-dark backgrounds (vendor CTA section) |
| `--color-ink-2` | Descriptions, captions, metadata |
| `--color-ink-3` | Timestamps, placeholders, strike-through prices |
| `--color-tulsi` | Success toasts, "Verified" badges, "In stock" |
| `--color-laal` | Discount percent badges, error toasts, destructive buttons |

---

## 10. Do / Don't rules

### Do

1. **Use saffron (`--color-accent`) only for buy actions.** Every Add to Cart, Shop Now, Checkout pill — never anywhere else.
2. **Pair periwinkle with warm neutrals.** Periwinkle on cream/ivory feels premium Indian; periwinkle on pure white feels cold SaaS.
3. **Keep headings in General Sans 600 with -0.01em tracking.** Tighter tracking is the difference between "editorial" and "generic".
4. **Show empty states, never blank sections.** If a rail has no data, render a dashed `--color-border` panel with a numbered placeholder — never collapse to zero height.
5. **Use tabular numerals for prices.** `font-variant-numeric: tabular-nums` on all `₹XXX` display to keep columns aligned.

### Don't

1. **Don't use saffron for headers, links, or body text.** It loses meaning as a buy cue the moment it appears elsewhere.
2. **Don't use pure white (`#FFFFFF`) as the page background.** Always ivory `#FAF7F2`. White is reserved for raised cards.
3. **Don't introduce decorative fonts.** No Playfair Display, no Baloo 2, no scripts. Distinctiveness comes from palette and scale, not ornament.
4. **Don't use emoji or icon art as decoration.** Empty states, trust badges, and section headers use numbered labels + horizontal lines only. Functional icons (close, chevron, search) are fine.
5. **Don't mix the semantic colours.** Tulsi only for success; laal only for error/destructive; saffron only for buy/warning (same hex, context differentiates).

---

## 11. Category vertical accent usage

The primary/accent split flips based on which vertical is being promoted:

| Vertical | Primary role | CTA |
|---|---|---|
| **Fashion** | Periwinkle leads (aspirational, soft) | Saffron CTA |
| **Kirana** | Saffron leads (warm, homely) | Saffron CTA |
| **Electronics** | Primary-dark leads (precise, tech-forward) | Saffron CTA |

The CTA is always saffron. Only the *supporting* tint shifts per vertical, giving each category page a distinct atmosphere without breaking the system.

## 12. Category tint gradients (card image placeholders)

```css
/* Fashion */   background: linear-gradient(135deg, #EEF0FF, #C4CEFF);
/* Kirana */    background: linear-gradient(135deg, #FFF8E8, #FDE8B8);
/* Electronics*/background: linear-gradient(135deg, #E8F4FE, #B3D8F8);
/* Beauty */    background: linear-gradient(135deg, #FEE8F0, #F8BBD0);
/* Home/Decor */background: linear-gradient(135deg, #FEF0E8, #F8CEAC);
```

Use these only as *fallback* backgrounds when a product image is missing — never as the main surface of a live card.

---

## 13. Font loading reference

Import line for documentation or static HTML:

```html
<!-- DM Sans + Hind (for Devanagari) — via Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Hind:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>

<!-- General Sans — via Fontshare (Indian Type Foundry) -->
<link
  href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
  rel="stylesheet"
/>
```

> **In this project**, DM Sans is loaded via `next/font/google` in `app/layout.tsx` (preferred for self-hosting + zero-FOUT), and General Sans is loaded via the Fontshare `<link>` in the root `<head>`.

---

## 14. Vendor + Admin (enterprise console)

The vendor dashboard and admin panel are **operational consoles**, not marketing surfaces. The visual language is closer to OYO OS, Razorpay, Linear: minimal, crisp, dense, single-accent. Buyers see warm ivory + saffron CTAs; operators see white surfaces + saffron primary action + flat status pills.

### Principles

1. **One accent, one action** — saffron (`accent`) is the only brand color used for primary actions ("New Booking", "Approve", "Add Product", "Save"). Periwinkle is reserved for highlight states (current selection, link, focus ring). No gradients on operational surfaces.
2. **Flat surfaces** — pure white cards on `ivory` page bg. No card shadows above `shadow-sm`. No gradient cards. No colored card backgrounds.
3. **Hairline dividers** — `border border-sand` everywhere; never `border-2`. Internal section dividers are `border-b border-cream`.
4. **Status pills are flat tints** — not gradients, not borders + tint. Just `bg-{color}-50 text-{color}-700 px-2.5 py-0.5 text-xs rounded-full`.
5. **Reserve `accent` for the primary CTA** — at most one saffron button per visible viewport. Secondary actions are ghost (`bg-white border border-sand`).
6. **Typography**: General Sans 600 for section titles, DM Sans 400/500 for body and tabular data. Numbers in KPI tiles: General Sans 700, ink, 28-32px.

### Sidebar (admin & vendor desktop)

```
width: 220px
bg: white
border-right: 1px solid sand
padding: 24px 0
```

- Each item: `px-6 py-2.5 text-sm text-ink-2 hover:text-ink hover:bg-ivory`
- Active: `text-accent-dark font-medium` + 2px left bar in `accent` (no fill, no rounded pill)
- Section headings: 11px uppercase tracking-wider `text-ink-3` `mt-6 mb-2 px-6`
- Logo at top-left: 12px brand mark + "localmart" wordmark in General Sans 600

### Top bar

```
height: 64px
bg: white
border-bottom: 1px solid sand
```

- Search: full-width input with `bg-ivory border border-sand rounded-full` placeholder `text-ink-3`
- Primary CTA on far right (e.g. "+ New Order"): `bg-accent text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-accent-dark`
- Secondary icons: 22px stroke icons in `text-ink-2`, 8px gap
- User chip on far right: avatar + name in DM Sans 500 + chevron

### KPI cards (Today's Status, Total Orders, etc.)

```
bg: white
border: 1px solid sand
rounded: 16px
padding: 20px 24px
shadow: shadow-sm
```

- Title: 13px DM Sans 500 `text-ink-2`
- Big number: 28-32px General Sans 700 `text-ink`
- Subtext (e.g. "of 12"): 13px DM Sans 400 `text-ink-3` inline next to number
- Right-aligned action link (e.g. "Modify"): 13px DM Sans 500 `text-accent hover:text-accent-dark`
- **No icons inside KPI cards.** Numbers carry the meaning.

### Data tables

```
container: bg-white border border-sand rounded-2xl overflow-hidden
header row: bg-ivory border-b border-sand
header cell: text-xs font-medium text-ink-2 uppercase tracking-wider px-6 py-3.5
body cell: px-6 py-4 text-sm text-ink
divider: divide-y divide-cream
hover row: hover:bg-ivory transition-colors
```

- Avatar/logo column: 36px square `rounded-lg` `bg-primary-xlight` (not gradient) with brand letter in `text-primary-dark font-semibold`
- Action column: `text-accent hover:text-accent-dark` text link with `→` arrow

### Status pills (the canonical map)

| State | Class | Hex |
|---|---|---|
| Active / Approved / Delivered | `bg-tulsi/10 text-tulsi` | green-700 on green-50 |
| Pending / Awaiting | `bg-accent-light text-accent-dark` | saffron-50 on saffron-700 |
| Suspended / Rejected / Cancelled | `bg-laal/10 text-laal` | red-700 on red-50 |
| In progress / Processing | `bg-primary-xlight text-primary-dark` | periwinkle |
| Inactive / Default | `bg-cream text-ink-2` | warm grey |

Pill structure: `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full` — no border, no icon, just dot + label if needed (`<span class="w-1.5 h-1.5 rounded-full bg-current" />`).

### Buttons

| Variant | Class |
|---|---|
| Primary | `bg-accent text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent-dark` |
| Secondary | `bg-white border border-sand text-ink-2 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-ivory hover:text-ink` |
| Ghost | `text-accent hover:text-accent-dark text-sm font-medium` (no bg, no border) |
| Destructive | `bg-laal text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-red-700` |

**No gradient buttons. No colored shadows on buttons.** A subtle `shadow-sm` is fine on hover; nothing more.

### Modals (request review, vendor details, edit)

```
overlay: bg-ink/40 backdrop-blur-sm
panel: bg-white rounded-2xl max-w-2xl shadow-2xl border border-sand
header: px-6 py-5 border-b border-cream — title (General Sans 600 18px) + close (×) btn
body: px-6 py-6 space-y-6
footer: px-6 py-4 border-t border-cream — flex justify-end gap-3
```

### Quick-action grid (vendor dashboard)

Replaces the current rainbow-gradient cards. Each tile:

```
bg: white
border: 1px solid sand
rounded: 16px
padding: 20px
hover: border-accent / shadow-sm
```

- Icon square: 40px `bg-ivory rounded-lg` with stroke icon in `text-ink-2` (or `text-accent` for the primary action)
- Title: 14px General Sans 600 `text-ink`
- Subtitle: 12px DM Sans 400 `text-ink-3`
- **One** tile per page may use `bg-accent text-white` to surface the recommended next action.

### Empty states (operational)

```
container: bg-white border border-dashed border-sand rounded-2xl py-14 text-center
title: 16px General Sans 600 text-ink mb-1
subtitle: 13px DM Sans 400 text-ink-3 mb-4
cta: primary button (bg-accent)
```

No emoji, no large iconography. A 1-line label `STORE · APPROVED · 03 / 24` style overline in `tracking-[0.18em] text-[10px] uppercase text-ink-3` is acceptable.

### Forbidden in vendor + admin

- ❌ `bg-gradient-to-br from-orange-500 to-orange-600` and friends
- ❌ Colored shadows (`shadow-orange-500/20`, `shadow-emerald-500/20`)
- ❌ Hard-coded brand hex (`#FF9933`, `#10A37F`, `#e8872b`) — use `bg-accent` / `bg-accent-dark`
- ❌ Multiple primary CTAs in one section
- ❌ Mixing 3+ accent colors in tabs/buttons (indigo + emerald + purple + blue)
- ❌ Border-2, border-4
- ❌ Decorative emoji in headers (🛍️ ⭐ 🔍 😔 🔒 ⛔)

### Status color tokens (alias for clarity)

In Tailwind v4 the existing tokens map cleanly:

- `tulsi` (#2A7D4F) → success
- `laal` (#C62828) → danger
- `accent` (#F59B1C) → warning + primary CTA
- `primary` (#93A4FF) → info / selected

---

## Versioning

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-04-22 | Initial design system. Palette, type, spacing, components, rules. |
| 1.1 | 2026-05-03 | Added Section 14 — Vendor + Admin enterprise console (sidebar, top-bar, KPI cards, tables, status pills, modals, quick actions, empty states). Bans gradients/colored-shadows/hard-coded brand hex on operational surfaces. |

Maintained alongside the build — if `frontend/app/tailwind.config.css` drifts from this doc, this doc is the intent and the code must be reconciled.
