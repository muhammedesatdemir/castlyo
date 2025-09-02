# Castlyo Development Guide

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 18+
- npm 9+
- PostgreSQL 15+
- Redis 6+
- Docker & Docker Compose (isteğe bağlı)

### Kurulum

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/your-org/castlyo.git
cd castlyo
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment dosyasını oluşturun:**
```bash
cp env.example .env.local
# .env.local dosyasını düzenleyin
```

4. **Veritabanını başlatın (Docker ile):**
```bash
npm run docker:dev
```

5. **Veritabanı migration'larını çalıştırın:**
```bash
npm run db:generate
npm run db:push
```

6. **Geliştirme sunucularını başlatın:**
```bash
npm run dev
```

## 📁 Proje Yapısı

```
castlyo/
├── apps/
│   ├── web/           # Next.js frontend (http://localhost:3000)
│   ├── api/           # NestJS backend API (http://localhost:3001)
│   └── admin/         # Admin dashboard (http://localhost:3002)
├── packages/
│   ├── ui/            # Shared UI components
│   ├── database/      # Database schemas & migrations
│   ├── types/         # Shared TypeScript types
│   └── config/        # Shared configurations
└── docs/              # Documentation
```

## 🔧 Geliştirme Komutları

### Tüm Proje
```bash
npm run dev              # Tüm uygulamaları başlat
npm run build           # Tüm uygulamaları build et
npm run lint            # Tüm uygulamalarda lint çalıştır
npm run test            # Tüm testleri çalıştır
npm run type-check      # TypeScript type check
```

### Tekil Uygulamalar
```bash
npm run dev:web         # Sadece web uygulamasını başlat
npm run dev:api         # Sadece API'yi başlat
```

### Veritabanı
```bash
npm run db:generate     # Schema'dan migration dosyaları oluştur
npm run db:push         # Migration'ları veritabanına uygula
npm run db:migrate      # Migration'ları çalıştır (production)
```

### Docker
```bash
npm run docker:dev      # Geliştirme ortamını başlat
npm run docker:prod     # Production ortamını başlat
npm run docker:down     # Container'ları durdur
npm run docker:dev:logs # Log'ları görüntüle
```

## 🌐 Uygulama URL'leri

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **API Docs:** http://localhost:3001/docs
- **Admin:** http://localhost:3002
- **Mailhog:** http://localhost:8025
- **Database:** postgres://localhost:5432/castlyo
- **Redis:** redis://localhost:6379

## 📊 Veritabanı Yönetimi

### Schema Güncellemeleri
1. `packages/database/schema/` içinde schema dosyalarını düzenleyin
2. `npm run db:generate` ile migration dosyalarını oluşturun
3. `npm run db:push` ile değişiklikleri uygulayın

### Seed Data
```bash
# Geliştirme verileri eklemek için
npm run db:seed
```

## 🎨 UI Geliştirme

### Komponenet Oluşturma
```bash
# Yeni UI komponenti oluştur
cd packages/ui
# Component'i oluştur ve export et
```

### Styling
- Tailwind CSS kullanılıyor
- shadcn/ui bileşenleri baz alınıyor
- Design system: `packages/ui/`

## 🔐 Authentication Flow

1. **Kayıt:** `/api/v1/auth/register`
2. **Giriş:** `/api/v1/auth/login`
3. **Token Yenileme:** `/api/v1/auth/refresh`
4. **Çıkış:** `/api/v1/auth/logout`

### JWT Token Yapısı
```typescript
{
  sub: string;    // user id
  email: string;
  role: 'TALENT' | 'AGENCY' | 'ADMIN';
  iat: number;
  exp: number;
}
```

## 📝 API Geliştirme

### Yeni Endpoint Oluşturma
1. `apps/api/src/modules/` içinde modül oluşturun
2. Controller, Service, DTO'ları tanımlayın
3. Module'ü `app.module.ts`'e ekleyin

### Swagger Dokümantasyonu
- `@ApiTags()`, `@ApiOperation()` dekoratörlerini kullanın
- DTO'larda `@ApiProperty()` ekleyin
- Response type'ları tanımlayın

## 🧪 Test Yazma

### Unit Tests
```bash
npm run test
npm run test:watch
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

## 📱 Responsive Design

### Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px  
- Desktop: 1024px+

### Mobile-First Approach
```css
/* Mobile first */
.class { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🚨 Hata Ayıklama

### Log Seviyeleri
- `error`: Kritik hatalar
- `warn`: Uyarılar
- `log`: Genel bilgiler
- `debug`: Debug bilgileri
- `verbose`: Detaylı loglar

### Debugging Tools
- **API:** http://localhost:3001/docs (Swagger)
- **Database:** Drizzle Studio
- **Redis:** Redis CLI
- **Email:** Mailhog UI

## 📋 Code Standards

### Naming Conventions
- **Files:** kebab-case (`user-profile.tsx`)
- **Components:** PascalCase (`UserProfile`)
- **Variables:** camelCase (`userName`)
- **Constants:** SCREAMING_SNAKE_CASE (`API_URL`)

### Git Commit Messages
```
feat: add user authentication
fix: resolve database connection issue  
docs: update API documentation
style: improve button styling
refactor: restructure user service
test: add unit tests for auth module
```

## 🔒 Güvenlik

### Environment Variables
- Hassas bilgileri `.env.local` dosyasında saklayın
- Production'da güçlü şifreler kullanın
- API key'leri asla commit etmeyin

### CORS Ayarları
- Sadece güvenilir domain'lere izin verin
- Credentials: true sadece gerekirse

### Rate Limiting
- API endpoint'ler için hız sınırları uygulanıyor
- Auth endpoint'ler için daha sıkı sınırlar

## 📦 Deployment

### Staging
```bash
npm run build
npm run docker:prod
```

### Production
1. Environment variables'ları ayarlayın
2. `docker-compose.prod.yml` kullanın
3. SSL sertifikalarını ekleyin
4. Database backup'larını ayarlayın

## 🤝 Katkıda Bulunma

1. Feature branch oluşturun
2. Değişikliklerinizi yapın
3. Test yazın
4. Pull request oluşturun
5. Code review bekleyin

### Branch Naming
- `feature/user-authentication`
- `fix/database-connection`
- `docs/api-documentation`

## 📞 Destek

- **GitHub Issues:** Bug report ve feature request
- **Documentation:** `/docs` klasörü
- **API Docs:** http://localhost:3001/docs

---

**Happy Coding! 🎭✨**
