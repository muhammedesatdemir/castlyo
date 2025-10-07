# Render Deployment Guide

Bu dosya Castlyo platformunun Render'da Blueprint kullanarak nasıl deploy edileceğini açıklar.

## Render Blueprint Nedir?

Render Blueprint, tek bir `render.yaml` dosyası ile birden fazla servisi (API, frontend, database, cache vb.) aynı anda deploy etmenizi sağlar. Docker Compose'un production versiyonu gibi düşünebilirsiniz.

## Deployment Adımları

### 1. Repository Hazırlığı

Bu repository'de zaten `render.yaml` dosyası mevcut. Bu dosya şunları tanımlar:
- **castlyo-api**: NestJS API backend servisi
- **castlyo-web**: Next.js frontend uygulaması  
- **castlyo-search**: Meilisearch servisi (arama için)
- **castlyo-db**: PostgreSQL veritabanı
- **castlyo-redis**: Redis cache

### 2. Render'da Blueprint Oluşturma

1. [Render Dashboard](https://dashboard.render.com)'a gidin
2. "New" → "Blueprint" seçin
3. Bu GitHub repository'sini seçin
4. `render.yaml` dosyası otomatik olarak algılanacak
5. "Apply" butonuna tıklayın

### 3. Environment Variables

Blueprint otomatik olarak çoğu environment variable'ı ayarlar, ancak bazılarını manuel eklemeniz gerekebilir:

#### API Servisi için:
- `SMTP_USER`: Email gönderimi için SMTP kullanıcı adı
- `SMTP_PASS`: Email gönderimi için SMTP şifresi
- `TWILIO_ACCOUNT_SID`: SMS için (opsiyonel)
- `TWILIO_AUTH_TOKEN`: SMS için (opsiyonel)

#### Web Servisi için:
Çoğu ayar otomatik olarak yapılır.

### 4. Custom Domains (Opsiyonel)

Eğer kendi domain'inizi kullanmak istiyorsanız:

1. Render Dashboard'da her servis için "Settings" → "Custom Domains"
2. Domain'inizi ekleyin
3. DNS ayarlarınızı güncelleyin
4. `render.yaml` dosyasındaki URL'leri güncelleyin

## Servis URL'leri

Deploy sonrası servisleriniz şu adreslerde erişilebilir olacak:

- **API**: `https://castlyo.onrender.com`
- **Web**: `https://castlyo-web.onrender.com`
- **API Docs**: `https://castlyo.onrender.com/api/docs`
- **Health Check**: `https://castlyo.onrender.com/api/v1/health`

## Önemli Notlar

### Free Plan Limitasyonları

- Servislerin 15 dakika inaktivite sonrası uyku moduna geçmesi
- Aylık 750 saat limit (tüm servislerin toplamı)
- Database 1GB limit

### Production Önerileri

1. **Paid Plan**: Production için paid plan kullanın
2. **External Database**: Büyük uygulamalar için external PostgreSQL
3. **CDN**: Static dosyalar için CDN kullanın
4. **Monitoring**: Log monitoring ekleyin
5. **Backup**: Veritabanı backup stratejisi oluşturun

## Troubleshooting

### Deployment Hataları

1. **Build Fails**: 
   - `package.json` dependencies'i kontrol edin
   - Node.js version uyumluluğunu kontrol edin

2. **Database Connection**:
   - Environment variables'ları kontrol edin
   - Database migration'ların çalıştığından emin olun

3. **CORS Errors**:
   - API'daki CORS ayarlarını kontrol edin
   - Frontend URL'lerinin doğru olduğundan emin olun

### Logs

Her servisin loglarını Render Dashboard'dan görebilirsiniz:
1. Servis → "Logs" sekmesi
2. Real-time log streaming mevcut

## Güncelleme

Kod değişikliklerini deploy etmek için:

1. GitHub'a push yapın
2. Render otomatik olarak yeniden deploy eder
3. Veya manuel olarak "Deploy Latest Commit" butonunu kullanın

## Monitoring

Render Dashboard'da her servis için:
- CPU/Memory kullanımı
- Response time
- Error rate
- Uptime statistics

## Support

Sorun yaşarsanız:
1. Render Documentation: https://render.com/docs
2. Render Community: https://community.render.com
3. Bu repository'nin Issues sekmesi
