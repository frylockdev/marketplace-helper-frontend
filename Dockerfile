# Frontend (Next.js) — сборка для Dokploy
# Зеркало образа: обход лимита Docker Hub (429)
FROM mirror.gcr.io/library/node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time переменные (пробросить в Dokploy как build args)
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

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Next.js 16 по умолчанию Turbopack — в Docker стабильнее Webpack
RUN npx next build --webpack

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM mirror.gcr.io/library/node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Healthcheck без wget/curl (их нет в node:alpine). 2xx/3xx = ok
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD ["node", "-e", "const port = process.env.PORT || 3000; const req = require('http').get('http://127.0.0.1:'+port+'/', r => { r.resume(); r.on('end', () => process.exit(r.statusCode >= 200 && r.statusCode < 400 ? 0 : 1)); }); req.on('error', () => process.exit(1)); req.setTimeout(8000, () => { req.destroy(); process.exit(1); });"]

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs && chown -R nextjs:nodejs /app
USER nextjs

CMD ["node", "server.js"]
