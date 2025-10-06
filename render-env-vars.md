# Render.com Environment Variables

Render.com dashboard'unda şu environment variables'ları eklemeniz gerekiyor:

## Temel Konfigürasyon
```
NODE_ENV=production
PORT=3001
```

## JWT Konfigürasyonu (ZORUNLU)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-also-long-and-random
JWT_REFRESH_EXPIRES_IN=30d
```

## Database (Render PostgreSQL)
```
DATABASE_URL=postgresql://castlyo_db_user:Fes0xE80RYmwY4FJJGdr9ILoAI83fJ8G@dpg-d3i022r3fgac73a5i9j0-a.oregon-postgres.render.com/castlyo_db
DB_SYNC=false
```

## Feature Flags (Opsiyonel)
```
PAYMENTS_ENABLED=false
ADV_PERMISSIONS_ENABLED=false
SEARCH_ENABLED=false
```

## File Storage (S3 veya MinIO)
```
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_REGION=us-east-1
S3_BUCKET=your-bucket-name
S3_ENDPOINT=https://s3.amazonaws.com
```

## CORS ve Frontend URL
```
FRONTEND_URL=https://your-frontend-url.onrender.com
```

## Güvenlik
```
BCRYPT_ROUNDS=12
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## En Kritik Olanlar (Mutlaka Ekleyin):
1. JWT_SECRET
2. JWT_REFRESH_SECRET
3. DATABASE_URL (zaten var)
4. NODE_ENV=production
5. PORT=3001
