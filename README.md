# Laku Marketplace Web

## Overview
Laku Marketplace Web is the buyer-facing **website** for Laku. It lets verified retailers (warungs, kiosks, small shops) browse the wholesale catalog, open shareable product links, manage accounts and orders in the browser, and hand off into the mobile app when needed. Built with Next.js (App Router) and connected to the existing Laku backend (Next.js + Prisma).

This is a sibling of `Laku-Marketplace` (Expo buyer app), `Laku-Dashboard` (SaaS + API), and `Laku-Driver`. It owns no data: everything comes from the Dashboard API.

## Key Security & Trust Principles
- Verified buyer access; pricing and offers scoped to approved distributors.
- Role-based data isolation; buyers see only their own orders and eligible catalogs.
- Marketplace JWT is stored in an httpOnly cookie (`laku_mp_token`) — never exposed to client JavaScript.
- Browser never calls the Dashboard directly (no CORS); server components and route handlers proxy all API traffic.

## Why Laku Marketplace Web
- Shareable product and promo URLs for WhatsApp / browser discovery.
- Desktop-friendly wholesale browse and reorder without installing the app first.
- Same visual language as the mobile Marketplace so both feel like one product.
- Deep-link and “Open in app” CTAs when native flows are preferred.

## Core Features
- Home: special offers (Admin Offers), categories, featured products
- Browse/search with sort and filters (rating, price, sales channel)
- Product detail pages with gallery, variants, reviews, seller rating, and share links
- Cart, checkout, and order tracking (status timeline, pay, cancel, return, review)
- Order support: help center, return/refund info, printable invoice, report distributor
- Account: profile, address book, favourites, networks / followings, messages
- Auth: login, register, forgot / reset password
- Distributor / seller shop pages and seller information
- Settings, policies, and general Help Center

## Business Model
- Seller-side commission on transactions
- Optional value-added services: logistics, financing, promotions

## Technical Architecture
- Next.js 16 (App Router) + React 19 + TypeScript
- Styling: Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- UI icons: lucide-react
- Maps (signup address preview): Mapbox GL
- Data: server-side GraphQL + REST proxies to Laku-Dashboard
- Auth session: httpOnly cookie via `/api/auth/*` route handlers
- i18n: Indonesian + English locale JSON under `src/i18n`

## Data flow

```
Browser → Laku Marketplace Web (RSC / route handlers) → Laku Dashboard API
```

| Need | Upstream |
|------|----------|
| Catalog, search, categories, product detail | `POST /api/graphql` → `mobileMarketplaceProducts` |
| Product / distributor reviews | `GET /api/mobile/reviews/product` / `distributor` |
| Sale banners (signed-in) | `GET /api/mobile/offers` |
| Public announcements | `GET /api/marketplace/latest-updates` |
| Cart, orders, addresses, profile | Mobile GraphQL / REST (`/api/mobile/*`) |
| Login / register / password reset | `POST /api/mobile/auth/*` |

Product pages resolve through the `productId` argument on `mobileMarketplaceProducts` so shared links work even when free-text search does not index product ids.

## Getting Started
1) Prerequisites: Node LTS, Git, a running **Laku-Dashboard** (default `http://localhost:3000`)
2) Install dependencies:
```
npm install
```
3) Configure environment:
```
cp env.example .env.local
```
4) Start the site:
```
npm run dev
```
Open [http://localhost:3002](http://localhost:3002).

Browse surfaces degrade to empty states instead of crashing when the Dashboard is down.

## Environment
Copy `env.example` to `.env.local` and set:

| Variable | Purpose |
|----------|---------|
| `LAKU_API_BASE_URL` | Dashboard origin (server-side only) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (share links, OG tags) |
| `NEXT_PUBLIC_APP_SCHEME` | Mobile deep-link scheme |
| `NEXT_PUBLIC_ANDROID_STORE_URL` / `NEXT_PUBLIC_IOS_STORE_URL` | Install CTAs |
| `NEXT_PUBLIC_DASHBOARD_URL` | Distributor / seller entry |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Signup address map (public `pk…` token) |

## Main routes

| Surface | Route |
|---------|-------|
| Home | `/` |
| Categories / search | `/categories`, `/search` |
| Product detail | `/product/[productId]` |
| Cart / checkout | `/cart`, `/checkout` |
| Orders | `/orders`, `/orders/[orderId]` |
| Account | `/account`, `/account/profile`, `/account/addresses` |
| Seller / distributor | `/seller/[id]`, `/distributor/[id]` |
| Offers / promo | `/offers`, `/promo/[id]` |
| Auth | `/login`, `/register`, `/forgot-password` |
| Help / settings | `/help`, `/settings` |
| App handoff | `/app` |

## Design
Mirrors `Laku-Marketplace` mobile: primary blue `#0a61d7`, page surface `#f9fafb`, flat white product cards (6px radius), blue prices, red discount tags, purple promo pills. Tokens live in `src/app/globals.css`. Default copy aligns with the app’s Indonesian locale; English is available via i18n.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on port 3002 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run ci:check` | Lint + typecheck (used by GitHub Actions) |

## CI
GitHub Actions (`.github/workflows/ci.yml`) runs on push and pull requests to `main` / `master`:
- `npm ci`
- `npm run ci:check` (ESLint + TypeScript)

## Roadmap
- Richer search filters (shipping origin / option) aligned with mobile
- Populate seller/product ratings in GraphQL list responses (Dashboard)
- Optional payments SDK beyond COD / bank transfer
- Stronger SEO / OG coverage for promotions and distributor pages

## Contributing
TypeScript strict (no `any`), keep server-only secrets out of client bundles, match existing fetch/auth patterns, and reuse design tokens.

## License
MIT License
