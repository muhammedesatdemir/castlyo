# ---------- BUILD STAGE ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    
    # 1) Root ve workspace manifestlerini kopyala (lock dosyası dahil)
    COPY package*.json ./
    COPY apps/api/package*.json ./apps/api/
    COPY packages/types/package*.json ./packages/types/
    COPY packages/ui/package*.json ./packages/ui/
    COPY packages/database/package*.json ./packages/database/
    
    # 2) Tüm workspaces bağımlılıklarını (dev dahil) kur
    #    (Nest CLI ve derleyiciler için dev deps gerekiyor)
    RUN npm ci
    
    # 3) Kaynak kodu al ve yalnızca API'yi build et
    COPY . .
    RUN npm run build --workspace=@castlyo/api
    # Bu adımın sonunda: /app/apps/api/dist/** mevcut
    
    # ---------- RUNTIME STAGE ----------
    FROM node:20-alpine AS runner
    ENV NODE_ENV=production
    # Uygulama dizinini direkt API'ye ayarla
    WORKDIR /app/apps/api
    
    # 1) Sadece çalışması gereken artefact'ları ve node_modules'u al
    #    - API'nin derlenmiş çıktıları
    #    - API package.json (start script vs.)
    #    - root node_modules (hoisted bağımlılıklar)
    #    - root package*.json (çoğu tool için faydalı ama zorunlu değil)
    COPY --from=builder /app/apps/api/dist ./dist
    COPY --from=builder /app/apps/api/package*.json ./
    COPY --from=builder /app/node_modules /app/node_modules
    COPY --from=builder /app/package*.json /app/
    
    # 2) Port ve komut
    EXPOSE 3001
    # Workdir zaten apps/api olduğundan doğrudan node ile başlat
    CMD ["node", "dist/main.js"]
    