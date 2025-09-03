export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">KVKK Aydınlatma Metni</h1>
            
            <div className="prose prose-invert max-w-none">
              <div className="space-y-6 text-white/80">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">1. Veri Sorumlusu</h2>
                  <p>
                    Castlyo Teknoloji A.Ş. ("Castlyo" veya "Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") 
                    uyarınca veri sorumlusu sıfatıyla, kişisel verilerinizin işlenmesine ilişkin sizi bilgilendirmek isteriz.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">2. Kişisel Verilerin İşlenme Amacı</h2>
                  <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Casting ve yetenek eşleştirme hizmetlerinin sunulması</li>
                    <li>Kullanıcı hesabının oluşturulması ve yönetimi</li>
                    <li>Platform güvenliğinin sağlanması</li>
                    <li>İletişimin kurulması ve sürdürülmesi</li>
                    <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
                    <li>İstatistiksel analiz ve raporlama</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">3. İşlenen Kişisel Veriler</h2>
                  <p>Platform üzerinde aşağıdaki kişisel verileriniz işlenmektedir:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, doğum tarihi</li>
                    <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası, adres</li>
                    <li><strong>Fiziksel Özellikler:</strong> Boy, kilo, göz rengi, saç rengi (yetenek profilleri için)</li>
                    <li><strong>Mesleki Bilgiler:</strong> Deneyim, yetenekler, uzmanlık alanları</li>
                    <li><strong>Görsel/İşitsel Kayıtlar:</strong> Profil fotoğrafları, portföy görüntüleri</li>
                    <li><strong>Lokasyon Bilgileri:</strong> Şehir, konum bilgileri</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">4. Kişisel Verilerin Aktarılması</h2>
                  <p>
                    Kişisel verileriniz, <strong>sadece açık rızanız alındıktan sonra</strong> ve aşağıdaki durumlarda 
                    üçüncü taraflarla paylaşılabilir:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Ajans ve yetenek eşleştirmesi için gerekli olması durumunda</li>
                    <li>Hukuki yükümlülüklerin yerine getirilmesi için</li>
                    <li>Platform güvenliğinin sağlanması amacıyla</li>
                  </ul>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                    <p className="text-blue-200 font-medium">
                      🔒 <strong>Gizlilik Güvencesi:</strong> İletişim bilgileriniz hiçbir zaman otomatik olarak paylaşılmaz. 
                      Her paylaşım için ayrı onayınız alınır.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">5. Veri Saklama Süresi</h2>
                  <p>
                    Kişisel verileriniz, işleme amacının gerektirdiği süre boyunca ve yasal saklama süreleri 
                    dikkate alınarak saklanmaktadır. Hesabınızı sildiğinizde verileriniz 30 gün içinde 
                    sistemden tamamen kaldırılır.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">6. Haklarınız</h2>
                  <p>KVKK uyarınca aşağıdaki haklara sahipsiniz:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>İşlenen kişisel verileriniz hakkında bilgi talep etme</li>
                    <li>İşleme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Kişisel verilerinizin düzeltilmesini veya silinmesini talep etme</li>
                    <li>İşleme faaliyetine itiraz etme</li>
                    <li>Zararınızın giderilmesini talep etme</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">7. İletişim</h2>
                  <p>
                    KVKK kapsamındaki taleplerinizi <strong>info@castlyo.com</strong> e-posta adresi üzerinden 
                    veya platform üzerindeki ayarlar menüsünden iletebilirsiniz.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">8. Değişiklikler</h2>
                  <p>
                    Bu aydınlatma metni gerekli durumlarda güncellenebilir. Güncellemeler platform üzerinden 
                    duyurulacak ve yürürlük tarihinden itibaren geçerli olacaktır.
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
