export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Kullanım Şartları</h1>
            
            <div className="prose prose-invert max-w-none">
              <div className="space-y-6 text-white/80">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">1. Genel Hükümler</h2>
                  <p>
                    Bu kullanım şartları ("Şartlar"), Castlyo Teknoloji A.Ş. ("Castlyo") tarafından işletilen 
                    casting ve yetenek eşleştirme platformunun ("Platform") kullanımına ilişkin kuralları belirler.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">2. Hizmet Tanımı</h2>
                  <p>Castlyo aşağıdaki hizmetleri sunar:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Yetenekler ve ajanslar arasında güvenli eşleştirme</li>
                    <li>Profesyonel profil oluşturma ve yönetimi</li>
                    <li>İş fırsatları ve casting duyuruları</li>
                    <li>Platform içi güvenli mesajlaşma</li>
                    <li>KVKK uyumlu veri paylaşımı</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">3. Kullanıcı Yükümlülükleri</h2>
                  <p>Platform kullanıcıları olarak:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Doğru ve güncel bilgi paylaşmakla yükümlüsünüz</li>
                    <li>Başkalarının haklarına saygı göstermelisiniz</li>
                    <li>Platform kurallarına uygun davranmalısınız</li>
                    <li>Fikri mülkiyet haklarını ihlal etmemelisiniz</li>
                    <li>Spam veya rahatsız edici içerik paylaşmamalısınız</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">4. Gizlilik ve Veri Güvenliği</h2>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-200">
                      <strong>🔒 Gizlilik Güvencemiz:</strong>
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-green-200">
                      <li>İletişim bilgileriniz sadece onayınızla paylaşılır</li>
                      <li>Tüm veri paylaşımları audit log ile izlenir</li>
                      <li>KVKK ve GDPR standartlarına tam uyum</li>
                      <li>Verilerinizi istediğiniz zaman silebilirsiniz</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">5. İçerik Politikası</h2>
                  <p>Platform üzerinde paylaşılan içerikler:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Yasal, etik ve profesyonel olmalıdır</li>
                    <li>Telif hakları size ait olmalı veya kullanım izniniz bulunmalıdır</li>
                    <li>Müstehcen, ayrımcı veya nefret içerikli olmamalıdır</li>
                    <li>Spam veya aldatıcı bilgi içermemelidir</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">6. Ücretlendirme</h2>
                  <p>
                    Temel platform kullanımı ücretsizdir. Premium özellikler için ücretlendirme 
                    politikalarımız ayrı olarak belirtilmiştir. Ücretli hizmetler için iade 
                    politikamız geçerlidir.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">7. Hesap Askıya Alma ve Sonlandırma</h2>
                  <p>
                    Castlyo, kullanım şartlarını ihlal eden hesapları uyarı vermeksizin 
                    askıya alabilir veya sonlandırabilir. Kullanıcılar da hesaplarını 
                    istediği zaman kapatabilir.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">8. Sorumluluk Sınırlaması</h2>
                  <p>
                    Castlyo, platform üzerinden yapılan anlaşmalar veya iletişimlerden 
                    doğan zararlardan sorumlu değildir. Kullanıcılar kendi sorumluluklarında 
                    hareket ederler.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">9. Değişiklikler</h2>
                  <p>
                    Bu şartlar gerektiğinde güncellenebilir. Önemli değişiklikler 
                    kullanıcılara e-posta ile bildirilir ve platform üzerinde duyurulur.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">10. İletişim</h2>
                  <p>
                    Kullanım şartları ile ilgili sorularınız için <strong>legal@castlyo.com</strong> 
                    adresine e-posta gönderebilirsiniz.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-4">11. Yürürlük</h2>
                  <p>
                    Bu kullanım şartları, platformu kullanmaya başladığınız andan itibaren 
                    yürürlüğe girer ve hesabınızı kapattığınızda sona erer.
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
