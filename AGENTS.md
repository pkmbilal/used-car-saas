# AGENTS.md

Guidance for Claude (and other coding agents) working in this repository.

## Project Overview

A used-vehicle marketplace SaaS for the Saudi market. Buyers browse/search
vehicle listings; sellers (individuals and dealers) create and manage
listings. Built solo — keep changes simple, avoid premature abstraction.

## Stack

- **Framework**: Next.js (App Router)
- **Database / Auth / RLS**: Supabase (Postgres)
- **File storage**: Cloudflare R2 (listing images — NOT Supabase Storage)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Architecture Conventions

- Server Components by default. Only mark `"use client"` when the component
  needs interactivity (forms, filters, image carousels).
- Data access goes through `lib/supabase/` — never instantiate a Supabase
  client ad hoc inside a component.
- Use **two** Supabase clients:
  - `lib/supabase/server.ts` — server-side, uses the user's session (RLS-scoped)
  - `lib/supabase/admin.ts` — service-role client, server-only, used ONLY in
    API routes/server actions that must bypass RLS (e.g. admin moderation)
- All tables must have Row Level Security enabled. A seller can only
  read/write their own listings; public read access is limited to
  `status = 'active'` listings.
- R2 uploads happen via presigned PUT URLs issued from an API route/server
  action — images go browser → R2 directly, never proxied through the
  Next.js server.
- Keep API routes thin; put real logic in `lib/` so it's testable and
  reusable from server actions too.

## Commands

```bash
npm run dev          # start local dev server
npm run build         # production build (run before opening a PR)
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npx supabase db diff  # check for pending schema drift before migrating
npx supabase migration new <name>   # create a new migration
```

Always run `lint` and `typecheck` before considering a task done. If tests
exist for the touched area, run them too.

## Database Migrations

- All schema changes go through Supabase migrations in `supabase/migrations/`
  — never edit the schema directly in the dashboard for anything that should
  persist.
- Every new table needs an RLS policy in the same migration that creates it.
  Do not ship a table without RLS.

## Environment Variables

Never commit secrets. Expected vars (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never expose to client
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## Project Plan (Phase by Phase)

We are currently building **Phase 1**. Do not implement features from a
later phase unless explicitly asked — keep scope tight to the active phase.
Update the "Current Phase" marker below as phases are completed.

**Current Phase: 1**

### Phase 1 — Core Marketplace (MVP)
Goal: get listings live and searchable.
- Auth: Supabase Auth (email/phone OTP or Google) — buyer & seller roles
- Listings CRUD: make, model, year, mileage, price, condition, city
- Image uploads: direct-to-R2 via presigned URLs, multiple photos per listing
- Browse/search: listing grid, filters (make, price range, year, city, fuel
  type), sort (newest, price)
- Listing detail page: photo gallery, specs table, seller contact button
- Seller dashboard: manage own listings, mark as sold
- Basic seller profile: name, phone, city, member since

### Phase 2 — Trust & Engagement
Goal: make it feel like a real platform, not a bulletin board.
- Favorites/saved listings (per user)
- In-app messaging or WhatsApp deep-link (WhatsApp generally preferred in
  the Saudi market over in-app chat)
- Seller verification badge (phone-verified / ID-verified tier)
- Report listing / flag spam
- View counter per listing
- Basic admin panel: approve/reject listings, remove flagged content,
  manage users
- Search improvements: Postgres full-text search (`tsvector`), saved
  searches with alerts

### Phase 3 — Monetization
Goal: turn traffic into revenue.
- Featured/boosted listings (paid placement)
- Listing limits by tier: free users get N listings/month, paid dealers
  get more
- Dealer accounts: bulk upload (CSV import), dealer storefront page
- Payment integration: Moyasar/Tap/PayTabs (Mada, STC Pay support)
- Subscription billing for dealer plans

### Phase 4 — Trust Infrastructure (differentiators)
Goal: solve the real pain point of buying used cars in KSA.
- VIN/Istimara-based vehicle history lookup (accident history, ownership
  count — requires a data source or partner)
- Inspection report upload (PDF/photos from a mechanic, attached to listing)
- Price estimator — compare listing price against similar sold/active
  listings (basic averaging by make/model/year/mileage, or light ML later)
- In-platform financing/insurance lead capture (partner referrals)

### Phase 5 — Scale & Retention
Goal: growth loops and stickiness.
- Push/SMS notifications for saved search matches, price drops
- SEO-optimized listing pages (SSR via Next.js — critical for organic
  traffic on car searches)
- Reviews/ratings for sellers
- Analytics dashboard for dealers (views, contacts, conversion)
- Multi-city expansion tooling
- Mobile app or PWA wrapper once traffic justifies it

## Code Style

- TypeScript strict mode — no `any` unless justified with a comment.
- Prefer small, composable components over large page files.
- Arabic/English bilingual support is a future consideration, not required
  yet — don't add i18n scaffolding unless asked.
- Currency is SAR; format with `Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' })`
  or an equivalent helper — don't hardcode "$" anywhere.

## What NOT to do

- Don't add Supabase Storage usage — R2 is the image store for this project.
- Don't introduce a new state-management library; React state + Supabase
  realtime (if/when needed) is sufficient at this stage.
- Don't add payment/billing code until Phase 3 is explicitly started.
