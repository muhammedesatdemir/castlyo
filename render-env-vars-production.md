# 🚨 KRİTİK: RENDER.COM ENVIRONMENT VARIABLES

Bu dosya canlıdaki tüm işlev bozukluklarını düzeltecek environment variables'ları içerir.

## 📋 API SERVICE (castlyo) - Environment Variables

```bash
# CRITICAL: API Service Environment Variables
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
DB_SSL=true

# API URLs
API_BASE_URL=https://castlyo.onrender.com
API_PROXY_TARGET=https://castlyo.onrender.com
API_INTERNAL_URL=https://castlyo.onrender.com
INTERNAL_API_URL=https://castlyo.onrender.com

# CORS
CORS_ORIGIN=https://castlyo-web.onrender.com,https://castlyo.com

# S3/File Storage
S3_PUBLIC_URL=https://your-s3-bucket.amazonaws.com
CDN_URL=https://your-s3-bucket.amazonaws.com
S3_BUCKET=castlyo-prod
S3_ENDPOINT=https://s3.amazonaws.com

# JWT
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Cookie Security
COOKIE_SECURE=true
COOKIE_SAMESITE=lax

# Frontend URL
FRONTEND_URL=https://castlyo-web.onrender.com
```

## 📋 WEB SERVICE (castlyo-web) - Environment Variables

```bash
# CRITICAL: Web Service Environment Variables
NODE_ENV=production

# API URLs
NEXT_PUBLIC_API_URL=https://castlyo-web.onrender.com/api/proxy/api/v1
API_PROXY_TARGET=https://castlyo.onrender.com
API_INTERNAL_URL=https://castlyo.onrender.com
INTERNAL_API_URL=https://castlyo.onrender.com

# NextAuth
NEXTAUTH_URL=https://castlyo-web.onrender.com
NEXTAUTH_SECRET=your-production-nextauth-secret

# S3 URLs
NEXT_PUBLIC_S3_PUBLIC_URL=https://your-s3-bucket.amazonaws.com
NEXT_PUBLIC_S3_BUCKET=castlyo-prod

# Frontend URLs
FRONTEND_URL=https://castlyo-web.onrender.com
```

## 🎯 DEPLOYMENT SIRASI

### 1. API Service'i Düzelt
1. Render Dashboard → castlyo (API) → Environment Variables
2. Yukarıdaki API environment variables'ları ekle
3. Manual Deploy → Clear build cache & deploy

### 2. Web Service'i Düzelt
1. Render Dashboard → castlyo-web → Environment Variables
2. Yukarıdaki Web environment variables'ları ekle
3. Manual Deploy → Clear build cache & deploy

### 3. Test Et
```bash
# API Health Check
curl https://castlyo.onrender.com/api/v1/health

# Web Health Check
curl https://castlyo-web.onrender.com/api/proxy/api/v1/health
```

## ✅ BEKLENEN SONUÇLAR

Bu düzeltmelerden sonra:
- ✅ Giriş/Kayıt çalışacak
- ✅ Profil kaydetme çalışacak
- ✅ İlan verme çalışacak
- ✅ Dosya yükleme çalışacak
- ✅ Yetenek/Ajans başvuru çalışacak
- ✅ Tüm buton işlevleri çalışacak

## 🔧 YAPILAN KOD DÜZELTMELERİ

1. **Proxy Route**: API_BASE URL production için düzeltildi
2. **Upload Service**: S3/CDN URL'leri production için düzeltildi
3. **Next.js Config**: Environment variables production için düzeltildi
4. **Auth Service**: API URL production için düzeltildi
5. **Talent Mapper**: S3 URL helper production için düzeltildi
6. **CORS Config**: Production domain'leri için düzeltildi
7. **Payment Service**: Frontend URL production için düzeltildi

Ana sorun: Environment variables eksik/yanlış olduğu için kod localhost'a gidiyordu. Bu düzeltmelerle production URL'leri kullanılacak.
