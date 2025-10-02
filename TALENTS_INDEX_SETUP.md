# Talents Index API Setup

## Şu Anki Durum
- ✅ 404 hatası tamamen kayboldu
- ✅ Ana sayfada sadece "Ben" kartı görünüyor
- ✅ "Tümünü Gör" butonu gizli (normal)
- ✅ `/talents` sayfası bilgilendirici mesaj gösteriyor

## Backend Endpoint Hazır Olduğunda

### 1. Environment Variable Ekle
`apps/web/.env.local` dosyasına ekleyin:
```
NEXT_PUBLIC_TALENTS_INDEX_API=true
```

### 2. Uygulamayı Yeniden Başlatın
```bash
cd apps/web
npm run dev
```

### 3. Beklenen Davranış
- ✅ Ana sayfada 12'ye kadar profil görünecek
- ✅ 12'den fazla profil varsa "Tümünü Gör" butonu çıkacak
- ✅ `/talents` sayfasında sayfalama ile tüm profiller listelenecek
- ✅ En yeni profiller üstte görünecek

## Backend Endpoint Gereksinimleri

### Liste Endpoint
```
GET /api/v1/talents?limit=12&offset=0&order=-updated_at
```

**Response Format:**
```json
{
  "items": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string", 
      "city": "string | null",
      "profileImage": "string | null",
      "specialties": ["THEATER", "DANCE", "MUSIC", "VOICE_OVER", "ACTING", "MODELING"],
      "createdAt": "ISO string",
      "updatedAt": "ISO string"
    }
  ],
  "total": "number (optional)"
}
```

### Mevcut Çalışan Endpoint
- ✅ `GET /api/v1/profiles/talent/me` (kendi profil)

## Test Senaryoları

1. **Flag kapalı** (`false`): Sadece "Ben" kartı, 404 yok
2. **Flag açık** (`true`): Tüm profiller + "Ben" kartı, 12 sınırı, "Tümünü Gör"
