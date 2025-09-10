# Kritik Güvenlik Senaryoları - Manual Test

## Test Ortamı
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Middleware: Aktif
- Auth Guards: Aktif

## Senaryo 1: Kayıt Sonrası Onboarding'e Atma YOK
**Amaç:** Kayıt sonrası direkt onboarding açılmamalı, login sayfasına yönlenmeli.

### Adımlar:
1. http://localhost:3000 ana sayfasında "Yetenek Olarak Başla" tıkla
2. Privacy info sayfasında "Anladım, Devam Et" tıkla
3. Register formunu doldur:
   - Email: test1@example.com
   - Password: Test123!@#
   - Confirm Password: Test123!@#
   - KVKK: ✓
   - Terms: ✓
4. "Kayıt Ol ve Devam Et" tıkla

### Beklenen Sonuç: ✅
- Status: 201 (Network tab'da)
- Yönlendirme: `/auth?mode=login&message=registration-success`
- **Onboarding açılmamalı**

### Kanıt:
- [ ] Screenshot: Login sayfası açıldı
- [ ] Network log: POST /api/auth/register → 201
- [ ] Browser URL: `/auth?mode=login`

---

## Senaryo 2: Rastgele İfadelerle Login Olmuyor
**Amaç:** Geçersiz credentials ile login başarısız olmalı.

### Adımlar:
1. Login sayfasında:
   - Email: test1@example.com
   - Password: WrongPassword123
2. "Giriş Yap" tıkla

### Beklenen Sonuç: ❌
- UI'da hata mesajı: "Geçersiz e-posta veya şifre"
- Network: 401 Unauthorized
- Yönlendirme yok

### Kanıt:
- [ ] Screenshot: Hata mesajı görünüyor
- [ ] Network log: POST /api/auth/login → 401
- [ ] Browser URL değişmedi

---

## Senaryo 3: Authsuz Onboarding'e Giriş Olmuyor
**Amaç:** Session olmadan onboarding'e erişim engellenmiş olmalı.

### Adımlar:
1. Yeni incognito tab aç
2. Direkt URL: `http://localhost:3000/onboarding/talent`

### Beklenen Sonuç: 🔒
- Otomatik yönlendirme: `/auth?next=%2Fonboarding%2Ftalent`
- Middleware log: "Redirecting unauthenticated user to login"

### Kanıt:
- [ ] Screenshot: Auth sayfası açıldı
- [ ] Browser URL: `/auth?next=%2Fonboarding%2Ftalent`
- [ ] Console log: Middleware redirect mesajı

---

## Senaryo 4: Login Sonrası Ana Sayfa (Bonus)
**Amaç:** Başarılı login sonrası onboarding değil, ana sayfa açılmalı.

### Adımlar:
1. Senaryo 1'de kayıt olan kullanıcı ile login:
   - Email: test1@example.com
   - Password: Test123!@#
2. "Giriş Yap" tıkla

### Beklenen Sonuç: 🏠
- Yönlendirme: `/` (ana sayfa)
- Dashboard: "Hoş Geldin, test1@example.com!"
- Butonlar: "Yetenek Profili Oluştur", "Ajans Profili Oluştur"

### Kanıt:
- [ ] Screenshot: Dashboard açıldı
- [ ] Browser URL: `/`
- [ ] Onboarding otomatik açılmadı

---

## Senaryo 5: Rate Limiting (Bonus)
**Amaç:** 5 hatalı login denemesinde rate limit devreye girsin.

### Adımlar:
1. 5 kez yanlış şifre ile login dene
2. 6. deneme

### Beklenen Sonuç: 🚫
- 6. denemede: 429 Too Many Requests
- Backend log: Rate limit triggered

### Kanıt:
- [ ] Network log: 429 status
- [ ] Backend terminal: Rate limit log

---

## Test Execution Log

| Senaryo | Status | Screenshot | Network Log | Notes |
|---------|--------|------------|-------------|--------|
| 1. Register→Login | ⏳ | - | - | - |
| 2. Wrong Login | ⏳ | - | - | - |
| 3. Auth Guard | ⏳ | - | - | - |
| 4. Login→Home | ⏳ | - | - | - |
| 5. Rate Limit | ⏳ | - | - | - |

## Başarı Kriteri
- ✅ İlk 3 senaryo PASS
- ✅ Her senaryo için kanıt dosyası
- ✅ Backend logları temiz

## Sonraki Adım
Bu testler geçtikten sonra Playwright otomasyonu kurulacak.
