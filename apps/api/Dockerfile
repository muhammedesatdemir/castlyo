# ---------- BUILD STAGE ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # Manifestler
    COPY package*.json ./
    COPY apps/api/package*.json ./apps/api/
    COPY packages/types/package*.json ./packages/types/
    COPY packages/ui/package*.json ./packages/ui/
    COPY packages/database/package*.json ./packages/database/
    
    # Dev deps (Nest CLI vs. için gerekli)
    RUN npm ci
    
    # Kaynak kod
    COPY . .
    
    # Sadece API'yi derle
    RUN npm run build --workspace=@castlyo/api
    # ÇIKTI: /app/apps/api/dist/**
    
    # ---------- RUNTIME STAGE ----------
    FROM node:20-alpine AS runner
    ENV NODE_ENV=production
    WORKDIR /app
    
    # apps/api'nin tamamını (dist dahil) kopyala
    COPY --from=builder /app/apps/api /app/apps/api
    # hoisted node_modules ve root package manifestleri
    COPY --from=builder /app/node_modules /app/node_modules
    COPY --from=builder /app/package*.json /app/
    
    EXPOSE 3001
    
    # Çalışmadan önce dist'in varlığını kontrol et, yoksa ağacı göster
    CMD ["sh","-lc","set -e; \
      echo '--- debug: arama /app/apps/api/dist/apps/api/src/main.js'; \
      if [ ! -f /app/apps/api/dist/apps/api/src/main.js ]; then \
        echo 'dist yok! ağaç:'; ls -la /app; ls -la /app/apps || true; ls -la /app/apps/api || true; ls -la /app/apps/api/dist || true; exit 66; \
      fi; \
      node /app/apps/api/dist/apps/api/src/main.js"]
    