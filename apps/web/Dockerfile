# --- Runtime ---
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    ENV HOST=0.0.0.0               # 👈 dışarıya dinle
    
    # Build çıktısını ve gerekli node_modules'ı kopyala
    COPY --from=builder /app/apps/web/.next ./apps/web/.next
    COPY --from=builder /app/apps/web/public ./apps/web/public   # 👈 public klasörü de gelsin
    COPY --from=builder /app/apps/web/package*.json ./apps/web/
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/packages ./packages
    COPY --from=builder /app/package*.json ./
    
    EXPOSE 3000
    CMD ["npm","run","start","--workspace=@castlyo/web"]
    