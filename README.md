# Lakupak Marketplace Web

## Overview
Lakupak Marketplace Web is the buyer-facing **website** for Lakupak. It lets verified retailers (warungs, kiosks, small shops) browse the wholesale catalog, open shareable product links, manage accounts and orders in the browser, and hand off into the mobile app when needed. Built with Next.js (App Router) and connected to the existing Lakupak backend (Next.js + Prisma).

This is a sibling of `Lakupak-Marketplace` (Expo buyer app), `Lakupak-Dashboard` (SaaS + API), and `Lakupak-Driver`. It owns no data: everything comes from the Dashboard API.

## Key Security & Trust Principles
- Verified buyer access; pricing and offers scoped to approved distributors.
- Role-based data isolation; buyers see only their own orders and eligible catalogs.
- Marketplace JWT is stored in an httpOnly cookie (`laku_mp_token`) — never exposed to client JavaScript.
- Browser never calls the Dashboard directly (no CORS); server components and route handlers proxy all API traffic.

## Why Lakupak Marketplace Web
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
- Data: server-side GraphQL + REST proxies to Lakupak-Dashboard
- Auth session: httpOnly cookie via `/api/auth/*` route handlers
- i18n: Indonesian + English locale JSON under `src/i18n`

## Data flow

```
Browser → Lakupak Marketplace Web (RSC / route handlers) → Lakupak Dashboard API
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
1) Prerequisites: Node LTS, Git, a running **Lakupak-Dashboard** (default `http://localhost:3000`)
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

## Run with Docker

You can run Marketplace Web with **only Docker** (no Node.js or npm required on your machine), using the same multi-stage pattern as `Lakupak-Dashboard`.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running, plus a reachable **Lakupak-Dashboard** API (default host port `3000`).

1. **Clone the repo** and `cd` into `Lakupak-Marketplace-Web`.
2. **Create a `.env` file** in the project root (Compose reads `.env`; local npm can keep using `.env.local`):
   ```bash
   cp env.example .env
   ```
   Keep both API hosts in `.env`:
   - `LAKU_API_BASE_URL_DEV=http://localhost:3000` — used by `npm run dev`
   - `LAKU_API_BASE_URL_PROD=https://lakupak-dashboard.onrender.com` — used in production builds
   Compose does **not** use those for the container (it would point at the container itself); it sets `LAKU_API_BASE_URL` from `DOCKER_LAKU_API_BASE_URL` / `host.docker.internal:3000` so the storefront can reach Dashboard on your machine.
3. **Build and start** (Dashboard must already be running on host `:3000`):
   ```bash
   docker compose up --build
   ```
   First run builds inside Docker (a few minutes). Later runs reuse the image.
4. Open **http://localhost:3002** in your browser.

**Notes:**
- This app has no Postgres/Redis/Meilisearch sidecars — those live with Dashboard. Compose only runs the Next.js storefront.
- `NEXT_PUBLIC_*` values are baked at **image build** time. Change them in `.env`, then `docker compose up --build` again.
- Container API URL: `DOCKER_LAKU_API_BASE_URL` (default `http://host.docker.internal:3000`). Host npm picks `LAKU_API_BASE_URL_DEV` or `LAKU_API_BASE_URL_PROD` from `NODE_ENV`.

## Environment
Copy `env.example` to `.env.local` (npm) or `.env` (Docker) and set:

| Variable | Purpose |
|----------|---------|
| `LAKU_API_BASE_URL_DEV` | Dashboard origin for local `npm run dev` |
| `LAKU_API_BASE_URL_PROD` | Dashboard origin for production / Render |
| `LAKU_API_BASE_URL` | Optional hard override (Docker Compose sets this) |
| `NEXT_PUBLIC_SITE_URL_DEV` / `NEXT_PUBLIC_SITE_URL_PROD` | Canonical site URL (share links, OG tags) |
| `NEXT_PUBLIC_APP_SCHEME` | Mobile deep-link scheme |
| `NEXT_PUBLIC_ANDROID_STORE_URL` / `NEXT_PUBLIC_IOS_STORE_URL` | Install CTAs |
| `NEXT_PUBLIC_DASHBOARD_URL_DEV` / `NEXT_PUBLIC_DASHBOARD_URL_PROD` | Distributor / seller entry |
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
Mirrors `Lakupak-Marketplace` mobile: primary blue `#0a61d7`, page surface `#f9fafb`, flat white product cards (6px radius), blue prices, red discount tags, purple promo pills. Tokens live in `src/app/globals.css`. Default copy aligns with the app’s Indonesian locale; English is available via i18n.

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
