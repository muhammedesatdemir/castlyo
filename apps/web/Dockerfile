FROM node:20-alpine AS builder
WORKDIR /app

# Paket tanımları
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ui/package*.json ./packages/ui/

# 🔑 Dev deps DAHİL kur (turbo için)
RUN npm ci

# Kaynak kod
COPY . .

# Build (turbo local devDep → npx ile)
RUN npx turbo run build --filter=@castlyo/web

# --- Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Build çıktısını ve gerekli node_modules'ı kopyala
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package*.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD ["npm","run","start","--workspace=@castlyo/web"]
