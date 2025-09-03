export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Gizlilik Politikası</h1>
            
            <div className="prose prose-invert max-w-none">
              <div className="space-y-6 text-white/80">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">1. Giriş</h2>
                  <p>
                    Castlyo olarak gizliliğinizi korumak bizim önceliğimizdir. Bu gizlilik politikası, 
                    kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">2. Topladığımız Bilgiler</h2>
                  <p>Aşağıdaki bilgileri topluyoruz:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Hesap Bilgileri:</strong> Ad, soyad, e-posta, telefon</li>
                    <li><strong>Profil Bilgileri:</strong> Mesleki deneyim, yetenekler, portfolyo</li>
                    <li><strong>Kullanım Verileri:</strong> Platform etkileşimleri, tercihler</li>
                    <li><strong>Teknik Veriler:</strong> IP adresi, cihaz bilgileri, çerezler</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">3. Veri Güvenliği</h2>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-200 font-medium mb-2">🔐 Güvenlik Önlemlerimiz:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-200">
                      <li>SSL/TLS şifreleme ile veri aktarımı</li>
                      <li>Veritabanı şifreleme</li>
                      <li>Düzenli güvenlik güncellemeleri</li>
                      <li>Erişim kontrolü ve audit logları</li>
                      <li>Veri yedekleme ve kurtarma sistemleri</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">4. Veri Paylaşımı</h2>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-200 font-medium mb-2">✅ Paylaşım İlkelerimiz:</p>
                    <ul className="list-disc list-inside space-y-1 text-green-200">
                      <li><strong>Sadece onayınızla:</strong> İletişim bilgileri hiçbir zaman otomatik paylaşılmaz</li>
                      <li><strong>Just-in-time consent:</strong> Her paylaşım için ayrı onay alınır</li>
                      <li><strong>Audit trail:</strong> Tüm paylaşımlar loglanır ve takip edilir</li>
                      <li><strong>Geri çekme hakkı:</strong> İzinleri istediğiniz zaman iptal edebilirsiniz</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">5. Çerezler ve Takip</h2>
                  <p>Çerezleri şu amaçlarla kullanıyoruz:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Oturum yönetimi ve güvenlik</li>
                    <li>Kullanıcı tercihlerini hatırlama</li>
                    <li>Platform performansını iyileştirme</li>
                    <li>Analitik ve raporlama (anonim)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">6. Veri Saklama</h2>
                  <p>
                    Verilerinizi yalnızca gerekli olduğu süre boyunca saklıyoruz:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Aktif hesaplar:</strong> Hesap aktif olduğu sürece</li>
                    <li><strong>Kapatılan hesaplar:</strong> 30 gün içinde silinir</li>
                    <li><strong>Yasal gereklilikler:</strong> Yasal saklama süreleri geçerlidir</li>
                    <li><strong>Audit logları:</strong> Güvenlik amacıyla 2 yıl saklanır</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">7. Haklarınız</h2>
                  <p>Kişisel verileriniz konusunda sahip olduğunuz haklar:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Erişim hakkı:</strong> Verilerinizi görüntüleme</li>
                    <li><strong>Düzeltme hakkı:</strong> Yanlış bilgileri düzeltme</li>
                    <li><strong>Silme hakkı:</strong> Verilerinizin silinmesini talep etme</li>
                    <li><strong>Taşınabilirlik hakkı:</strong> Verilerinizi indirme</li>
                    <li><strong>İtiraz hakkı:</strong> İşleme faaliyetlerine itiraz etme</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">8. Uluslararası Aktarımlar</h2>
                  <p>
                    Verileriniz Türkiye'de saklanır. Uluslararası aktarım gerektiğinde 
                    uygun güvenlik önlemleri alınır ve yasal gereklilikler yerine getirilir.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">9. Çocukların Gizliliği</h2>
                  <p>
                    Platformumuz 18 yaş altındaki kullanıcılar için tasarlanmamıştır. 
                    18 yaş altı kullanıcılardan bilerek veri toplamayız.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">10. İletişim</h2>
                  <p>
                    Gizlilik konularında sorularınız için:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>E-posta:</strong> privacy@castlyo.com</li>
                    <li><strong>Platform:</strong> Ayarlar > Gizlilik menüsü</li>
                    <li><strong>Posta:</strong> Castlyo Teknoloji A.Ş., İstanbul</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">11. Değişiklikler</h2>
                  <p>
                    Bu gizlilik politikası güncellenebilir. Önemli değişiklikler size 
                    e-posta ile bildirilir ve platform üzerinde duyurulur.
                  </p>
                </section>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/60 text-sm">
                <strong>Son Güncelleme:</strong> {new Date().toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
