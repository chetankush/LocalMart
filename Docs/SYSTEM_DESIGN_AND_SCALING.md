# LocalMart — System Design & Scaling Plan

_Last reviewed: 24 Oct 2026. Same file lives in `backend/docs/` and `frontend/docs/` (separate repos) — update both._

This describes what is **actually deployed today** (read from code and config), where it breaks first, roughly how many users it can serve, and the step-by-step plan to scale. `frontend/docs/ARCHITECTURE.md` describes an older target design; where they differ, this file reflects the current code.

> Capacity numbers below are **estimates** from the code and hosting plans. Nothing has been load-tested yet — see "Measure it" at the end.

---

## 1. Architecture today

**Style:** modular monolith — one NestJS API (~20 feature modules) + one Next.js web app, sharing one Postgres database.

```
 Customer / Seller phone or PC
            │
            ▼
 ┌──────────────────────────────┐
 │ Next.js 15 (App Router)      │  Vercel, region bom1 (Mumbai)
 │ SSR pages + client fetches   │  frontend/vercel.json
 └──────────────┬───────────────┘
                │ HTTPS  /api/*
                ▼
 ┌──────────────────────────────┐
 │ NestJS 11 API — 1 instance   │  Render "free" plan, no region set
 │ 20 modules: orders, vendor,  │  (Render default = Oregon, US)
 │ products, search, public,    │  backend/render.yaml
 │ telegram, upload, admin, …   │
 │ + in-process cron (1/min)    │
 │ + in-memory rate limiter     │
 └───┬──────────┬─────────┬─────┘
     │          │         │
     ▼          ▼         ▼
 Postgres    Supabase   Telegram Bot API (webhook in,
 (Supabase,  Auth +     messages out) · Resend (email)
 Singapore,  Storage
 PgBouncer   (photos)
 :6543)
```

| Layer | What | Where in code |
|---|---|---|
| Web | Next.js 15, React 19, Tailwind v4 | `frontend/` |
| API | NestJS 11 + Express, Prisma 6 | `backend/src/main.ts`, `backend/src/app.module.ts` |
| DB | PostgreSQL (Supabase) via PgBouncer pooler, `pg_trgm` for fuzzy search, ~78 indexes/uniques | `backend/prisma/schema.prisma` |
| Auth | Supabase Auth (JWT verified by API) | `backend/src/shared/guards/auth.guard.ts` |
| Files | Supabase Storage bucket | `backend/src/modules/upload` |
| Notifications | Telegram webhook + per-minute expiry cron; email via Resend | `backend/src/modules/telegram/telegram.service.ts:310` |
| Rate limit | `@nestjs/throttler`, global guard, **100 req/min per IP, in memory** | `backend/src/app.module.ts:34,63` |

### Key request flows

- **Home page** — server-rendered with `revalidate = 0` and `cache: "no-store"` (`frontend/app/page.tsx:10,80,119-121`): ~5 API calls per visit, nothing cached. `/public/homepage` loads up to **500 active vendors** and filters by distance in JS (`backend/src/modules/public/public.service.ts:26,54`).
- **Search** — `/search/advanced`: normalise query (Hindi/Hinglish/typos) → Prisma `OR` + `pg_trgm word_similarity` candidates → score in JS → filter by delivery area (`backend/src/modules/search/`).
- **Live order updates = polling**
  - Seller approvals: every **3 s** while the tab is visible, 10 s backoff on errors (`GET /vendor/pending-approvals`, `frontend/app/vendor/_approvals/ApprovalsPollerContext.tsx:64-65`).
  - Customer "waiting for shop": every **3 s** for up to 12 min (`frontend/app/(customer)/orders/waiting/_components/WaitingCard.tsx`).
- **Order expiry** — `@Cron(EVERY_MINUTE)` inside the API process.

### Status note
The production Supabase project hostname currently does not resolve (NXDOMAIN) — production DB/auth must be restored or re-created before launch.

---

## 2. Bottlenecks (worst first)

1. **Rate limiter probably buckets everyone together.** `main.ts` never sets Express `trust proxy`, so behind Render's proxy `req.ip` is the proxy's address, not the shopper's. If so, the **whole platform shares 100 req/min**. One seller dashboard polling every 3 s = 20 req/min → **~5 open seller tabs exhaust it** and everyone else gets HTTP 429. Next.js server-side calls also come from a handful of Vercel IPs.
2. **Render free plan** — ~0.1 CPU, 512 MB RAM, **sleeps after 15 min idle** (first visitor waits 30–60 s).
3. **Three regions per request** — Vercel Mumbai → Render US → Supabase Singapore. Every DB round-trip crosses the Pacific; a home page with several queries takes seconds.
4. **No caching** — home page and shop lists are rebuilt on every visit.
5. **Polling cost grows linearly** — 1,000 sellers online ≈ 330 req/s just to ask "any new order?"; customers waiting add 0.33 req/s each.
6. **Cron inside the web process** — run 2+ API instances and the per-minute expiry job runs on each (duplicate expiries/Telegram messages).
7. **Distance + search in JS** — fine to a few hundred shops per city and tens of thousands of products; beyond that, latency and memory climb (500-vendor scans, JS scoring).
8. **Single DB, no read replica** — all reads and writes on one Postgres; Prisma pool per instance is small (no `connection_limit` set).

---

## 3. How many users (estimates)

| Stage | Concurrent users | Daily users (approx.) | Limiting factor |
|---|---|---|---|
| **Today** (free plan + shared rate limit) | ~10–20 | a few hundred | shared 100 req/min bucket, cold starts, cross-region latency |
| **After Stage 1** | a few hundred | ~5–10k | single API instance CPU, polling volume |
| **After Stage 2** | thousands | ~50–100k | single primary DB, search in Postgres |
| **After Stage 3** | tens of thousands+ | 1M+ | cost / ops maturity |

Rule of thumb used: concurrent ≈ 2–5 % of daily users at peak; one active shopper ≈ 0.2–0.5 req/s; one open seller dashboard ≈ 0.33 req/s.

---

## 4. Scaling roadmap

### Stage 1 — "launch-safe" (≈1 day, ~$7–25/month)
Code:
- [ ] `main.ts`: `app.getHttpAdapter().getInstance().set('trust proxy', 1)` so the limiter sees real client IPs.
- [ ] `@SkipThrottle()` (or a much higher limit) on polling endpoints (`GET /vendor/pending-approvals`, order status) and SSR-only public endpoints; keep strict limits on auth, order create, vendor-requests.
- [ ] Cache public reads: `revalidate: 30–60` on home/shop list fetches in `frontend/app/page.tsx` (location-keyed), and `Cache-Control: public, s-maxage=30` on `/public/*`.
- [ ] Poll slower when idle: seller 3 s → 5 s visible / 30 s hidden; customer waiting 3 s → 5 s.
- [ ] `render.yaml`: add `region: singapore` (same region as the DB).
Dashboards (owner does this):
- [ ] Render: upgrade to a paid instance (no sleep, more CPU) in Singapore.
- [ ] Supabase: keep DB in Singapore, or move both to Mumbai (`ap-south-1`) for Indian users.
- [ ] Add uptime monitoring on `/api/health` and error tracking (e.g. Sentry).

### Stage 2 — growth (≈1–2 weeks)
- [ ] **2–3 API instances** behind Render's load balancer (API is stateless except the items below).
- [ ] **Redis** (Upstash/Render Key Value): shared rate-limit store (`@nest-lab/throttler-storage-redis`), response cache for homepage/search, job queue.
- [ ] **Move cron to a worker** (BullMQ repeatable job) or guard it with `pg_try_advisory_lock` so only one instance runs it.
- [ ] **Replace polling with push**: Server-Sent Events / WebSocket for seller new-order alerts and customer order status (+ Telegram/FCM push as backup). Cuts ~90 % of request volume.
- [ ] **Images via CDN** with resizing (Supabase image transforms or Cloudflare Images); serve WebP/AVIF thumbnails.
- [ ] Set Prisma `connection_limit` per instance and keep using the PgBouncer pooler (`:6543`, `pgbouncer=true`).
- [ ] Load-test and set alerts on p95 latency, 5xx rate, DB CPU and connections.

### Stage 3 — big scale
- [ ] **Search engine**: Meilisearch or Typesense (typo-tolerant, Hindi support, geo filter) fed by DB change events; keep the query normaliser.
- [ ] **PostGIS** for "delivers to me" (`ST_DWithin` on shop location/radius) instead of scanning 500 vendors in JS.
- [ ] **Read replicas** for browse/search traffic; primary for orders and payments.
- [ ] Split hot paths into services only when needed: notifications worker, search indexer, payments.
- [ ] Partition/archive old orders; per-city sharding only if one DB is truly saturated.

---

## 5. Measure it (replace estimates with numbers)

1. Script a k6 (or Artillery) test against a staging copy: home → search → product → add to cart → quote → place order, plus N seller dashboards polling.
2. Ramp 10 → 50 → 200 → 500 virtual users; record p95 latency, error rate, API CPU/RAM, DB CPU/connections.
3. The first stage where p95 > 1 s or errors > 1 % is the real capacity — update the table in §3.
4. Re-run after each stage above.
