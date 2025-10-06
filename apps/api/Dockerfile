# ---------- BUILD STAGE ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Manifestler
    COPY package*.json ./
    COPY apps/api/package*.json ./apps/api/
    COPY packages/types/package*.json ./packages/types/
    COPY packages/ui/package*.json ./packages/ui/
    COPY packages/database/package*.json ./packages/database/
    
    # Dev deps dahil kur (Nest CLI vs. için gerekli)
    RUN npm ci
    
    # Kaynak kod
    COPY . .
    
    # Sadece API'yi derle
    RUN npm run build --workspace=@castlyo/api
    # Sonuç: /app/apps/api/dist/**
    
    # ---------- RUNTIME STAGE ----------
    FROM node:20-alpine AS runner
    ENV NODE_ENV=production
    WORKDIR /app
    
    # Artefactlar ve bağımlılıklar
    COPY --from=builder /app/apps/api/dist /app/apps/api/dist
    COPY --from=builder /app/apps/api/package*.json /app/apps/api/
    COPY --from=builder /app/node_modules /app/node_modules
    COPY --from=builder /app/package*.json /app/
    
    EXPOSE 3001
    
    # Başlamadan önce dist'i göster, sonra çalıştır
    CMD ["sh", "-lc", "ls -la /app/apps/api/dist && node /app/apps/api/dist/main.js"]
    