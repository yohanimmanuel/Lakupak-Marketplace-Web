# Multi-stage: build and run in Docker. No need to run npm install or npm run build on the host.
# Prerequisites: Docker, a .env file (see env.example), and a reachable Laku-Dashboard API.
# Run: docker compose up --build
# App listens on 3002 (same port as `npm run dev` / `npm start`).

# -----------------------------------------------------------------------------
# Stage 1: build
# Use node:20-alpine (pull latest before build to reduce base-image CVEs).
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Next.js expects NODE_ENV to be one of: production | development | test.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Match Dashboard Docker npm pin (avoids npm 11+ lockfile drift).
RUN npm install -g npm@10.8.2

# NEXT_PUBLIC_* are inlined into the client bundle at build time.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3002
ARG NEXT_PUBLIC_APP_SCHEME=lakumarketplace
ARG NEXT_PUBLIC_ANDROID_STORE_URL=https://play.google.com/store/apps/details?id=com.laku.marketplace
ARG NEXT_PUBLIC_IOS_STORE_URL=https://apps.apple.com/app/laku
ARG NEXT_PUBLIC_DASHBOARD_URL=http://localhost:3000
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_SCHEME=$NEXT_PUBLIC_APP_SCHEME
ENV NEXT_PUBLIC_ANDROID_STORE_URL=$NEXT_PUBLIC_ANDROID_STORE_URL
ENV NEXT_PUBLIC_IOS_STORE_URL=$NEXT_PUBLIC_IOS_STORE_URL
ENV NEXT_PUBLIC_DASHBOARD_URL=$NEXT_PUBLIC_DASHBOARD_URL
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

COPY package.json package-lock.json ./
# With NODE_ENV=production, npm may omit devDependencies by default.
# We need Tailwind/PostCSS/TS tooling to run `next build`.
# Retry once: esbuild's postinstall can hit ETXTBSY on Docker Desktop (Windows).
RUN npm ci --include=dev --no-audit --no-fund \
  || (rm -rf node_modules && npm ci --include=dev --no-audit --no-fund)

COPY . .

RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: run
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002

RUN npm install -g npm@10.8.2

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY package.json package-lock.json ./
# Serialize after builder so BuildKit does not run two npm installs in parallel
# (parallel native-binary postinstalls frequently cause esbuild ETXTBSY on Docker Desktop).
COPY --from=builder /app/package.json /tmp/.builder-ready
RUN npm ci --omit=dev --no-audit --no-fund \
  || (rm -rf node_modules && npm ci --omit=dev --no-audit --no-fund) \
  && npm cache clean --force

COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/public         ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json  ./tsconfig.json
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3002

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
