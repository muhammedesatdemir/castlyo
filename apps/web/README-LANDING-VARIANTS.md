# Landing Page Varyantları

Bu proje iki farklı ana sayfa varyantını destekler:

## Varyantlar

### 1. Classic (Varsayılan)
- Geniş hero bölümü ile "Yetenekler Sahneye Çıkıyor" başlığı
- Tam özellikli landing page (HeroShowreel, LogoMarquee, ExploreGrid)
- Hem giriş yapmış hem de yapmamış kullanıcılar için aynı arayüz

### 2. Minimal
- Giriş yapmış kullanıcılar için koyu/minimal arayüz
- Giriş yapmamış kullanıcılar için yine classic arayüz

## Varyant Değiştirme

Environment değişkeni ile kontrol edilir:

```env
# Classic varyant için (varsayılan)
NEXT_PUBLIC_LANDING_VARIANT=classic

# Minimal varyant için
NEXT_PUBLIC_LANDING_VARIANT=minimal
```

## Dosya Konumları

- **Konfigürasyon:** `apps/web/src/config/ui.ts`
- **Ana Sayfa:** `apps/web/src/app/page.tsx`
- **Environment:** `dev.env` (development için)

## Geliştirme Notları

- Varsayılan olarak `classic` varyant kullanılır
- `NODE_ENV` değişkenine bağlı otomatik seçim kaldırıldı
- Artık sadece `NEXT_PUBLIC_LANDING_VARIANT` environment değişkeni ile kontrol edilir
