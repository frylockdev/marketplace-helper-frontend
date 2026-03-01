# ── Build Stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

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

RUN npm run build

# ── Runtime Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
