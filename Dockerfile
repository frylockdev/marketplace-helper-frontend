# Use mirror to avoid Docker Hub rate limit (429)
# ── Build Stage ───────────────────────────────────────────────────────────────
FROM mirror.gcr.io/library/node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args become NEXT_PUBLIC_ env vars baked into the JS bundle at build time
ARG NEXT_PUBLIC_CASDOOR_ENDPOINT
ARG NEXT_PUBLIC_CASDOOR_CLIENT_ID
ARG NEXT_PUBLIC_CASDOOR_ORGANIZATION
ARG NEXT_PUBLIC_CASDOOR_APP_NAME
ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_CASDOOR_ENDPOINT=$NEXT_PUBLIC_CASDOOR_ENDPOINT
ENV NEXT_PUBLIC_CASDOOR_CLIENT_ID=$NEXT_PUBLIC_CASDOOR_CLIENT_ID
ENV NEXT_PUBLIC_CASDOOR_ORGANIZATION=$NEXT_PUBLIC_CASDOOR_ORGANIZATION
ENV NEXT_PUBLIC_CASDOOR_APP_NAME=$NEXT_PUBLIC_CASDOOR_APP_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Больше памяти для Next.js build (часто падает на "Creating an optimized production build" в Docker)
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM mirror.gcr.io/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Dokploy: PORT может быть переопределён платформой (Next.js читает PORT)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Only copy what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Healthcheck для Dokploy/orchestrator
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["sh", "-c", "wget -q -O /dev/null http://localhost:${PORT:-3000}/ || exit 1"]

# Запуск от непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs && chown -R nextjs:nodejs /app
USER nextjs

CMD ["node", "server.js"]
