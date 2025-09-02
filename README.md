# Castlyo Platform

Profesyonel casting ve yetenek eşleştirme platformu. Oyuncu, model, müzisyen gibi yetenekler ile film, dizi, reklam ajansları arasında güvenli ve etkili bir köprü kurar.

## 🚀 Özellikler

- **Güvenli Platform**: KVKK uyumlu, SSL şifreli, güvenli ödeme sistemi
- **Akıllı Eşleştirme**: Yapay zeka destekli algoritma ile hızlı ve doğru eşleştirme
- **Geniş Ağ**: 500+ yetenek ve 50+ doğrulanmış ajans
- **Kullanıcı Dostu**: Modern ve responsive tasarım
- **7/24 Erişim**: Dünyanın her yerinden erişilebilir
- **Mobil Uygulama**: iOS ve Android desteği

## 🏗️ Teknoloji Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Radix UI** - UI bileşenleri
- **Lucide React** - İkonlar

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Tip güvenliği
- **Drizzle ORM** - Veritabanı ORM
- **PostgreSQL** - Ana veritabanı
- **Redis** - Cache ve session
- **JWT** - Kimlik doğrulama

### Veritabanı
- **PostgreSQL** - Ana veritabanı
- **Drizzle ORM** - Type-safe ORM
- **Migrations** - Otomatik veritabanı yönetimi

### DevOps
- **Docker** - Containerization
- **Turbo** - Monorepo build tool
- **ESLint** - Kod kalitesi
- **Prettier** - Kod formatı

## 📁 Proje Yapısı

```
castlyo-platform/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── database/            # Veritabanı şeması ve bağlantısı
│   ├── types/               # Paylaşılan TypeScript tipleri
│   └── ui/                  # Paylaşılan UI bileşenleri
├── scripts/                 # Yardımcı scriptler
├── docker-compose.yml       # Geliştirme ortamı
└── turbo.json               # Monorepo konfigürasyonu
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm 10+
- Docker Desktop
- PostgreSQL

### 1. Projeyi klonlayın
```bash
git clone https://github.com/your-username/castlyo-platform.git
cd castlyo-platform
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. Ortam değişkenlerini ayarlayın
```bash
copy dev.env .env
# .env dosyasını düzenleyin
```

### 4. Veritabanını başlatın
```bash
# Docker ile PostgreSQL ve Redis
docker-compose up -d

# Veya manuel olarak PostgreSQL kurun
```

### 5. Veritabanı şemasını oluşturun
```bash
npm run db:generate
npm run db:push
```

### 6. Projeyi başlatın
```bash
# Tüm servisleri başlat
npm run dev

# Veya ayrı ayrı
npm run dev:web      # Frontend (port 3000)
npm run dev:api      # Backend (port 3001)
```

## 🌐 Erişim

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 📚 API Dokümantasyonu

API dokümantasyonu için Swagger UI'ya erişin:
- **Swagger**: http://localhost:3001/api/docs

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm run test

# Belirli bir paketi test et
npm run test --filter=@castlyo/api
npm run test --filter=@castlyo/web
```

## 🏗️ Geliştirme

### Yeni paket ekleme
```bash
npm run turbo gen package
```

### Yeni uygulama ekleme
```bash
npm run turbo gen app
```

### Veritabanı migration
```bash
npm run db:generate
npm run db:push
npm run db:migrate
```

## 📦 Build

```bash
# Tüm paketleri build et
npm run build

# Belirli bir paketi build et
npm run build --filter=@castlyo/web
npm run build --filter=@castlyo/api
```

## 🐳 Docker

### Geliştirme ortamı
```bash
docker-compose up -d
```

### Production ortamı
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Konfigürasyon

### Ortam Değişkenleri
- `DATABASE_URL` - PostgreSQL bağlantı URL'i
- `REDIS_HOST` - Redis host adresi
- `JWT_SECRET` - JWT şifreleme anahtarı
- `SMTP_*` - E-posta ayarları
- `AWS_*` - AWS S3 ayarları

### Veritabanı
- PostgreSQL 15+
- Drizzle ORM ile type-safe sorgular
- Otomatik migration sistemi

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **Website**: https://castlyo.com
- **Email**: info@castlyo.com
- **Telefon**: +90 (212) XXX XX XX

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/) - React framework
- [NestJS](https://nestjs.com/) - Node.js framework
- [Drizzle](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI bileşenleri

---

**Castlyo** - Yetenekler ve Fırsatlar Buluşuyor 🎭✨
