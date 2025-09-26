FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/ui/package*.json ./packages/ui/
COPY packages/database/package*.json ./packages/database/

# 🔑 Dev deps DAHİL kur (Nest CLI / build için)
RUN npm ci

COPY . .

# Build (turbo varsa npx turbo; yoksa workspace build)
# Tercih 1 (turbo): RUN npx turbo run build --filter=@castlyo/api
# Tercih 2 (workspace):
RUN npm run build --workspace=@castlyo/api

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Çıktılar + bağımlılıklar
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package*.json ./

EXPOSE 3001
CMD ["npm","run","start","--workspace=@castlyo/api"]
