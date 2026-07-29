import React, { useState } from "react";
import { Flame, ShieldCheck, FileText, Lock, Eye, AlertCircle, Printer, ArrowLeft, Bookmark } from "lucide-react";

export type LegalDocType = "kvkk" | "gizlilik-politikasi" | "kullanim-sartlari" | "cerez-politikasi" | "mesafeli-hizmet-sozlesmesi";

interface LegalPageProps {
  initialDoc?: LegalDocType;
  onGoBack?: () => void;
}

export default function LegalPage({ initialDoc = "kvkk", onGoBack }: LegalPageProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  const docs = [
    {
      id: "kvkk" as LegalDocType,
      title: "KVKK Aydınlatma Metni",
      icon: ShieldCheck,
      desc: "Kişisel Verilerin Korunması Hakkında Kanun Kapsamında Bilgilendirme",
      activeBg: "bg-emerald-50 text-emerald-800 border-emerald-250",
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-150 pb-2 mb-3">6698 SAYILI KİŞİSEL VERİLERİN KORUNMASI KANUNU (KVKK) AYDINLATMA METNİ</h3>
            <p>
             6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, <strong>LPG PORTAL</strong> ("Platform") tarafından üyelik işlemlerinin yürütülmesi, kullanıcı hesaplarının oluşturulması, hizmetlerin sunulması, kullanıcı taleplerinin karşılanması, firma rehberi ve platform hizmetlerinin yönetilmesi amacıyla; ad, soyad, telefon numarası, e-posta adresi, firma bilgileri, adres bilgileri ve kullanıcı tarafından platforma yüklenen veya sağlanan diğer tüm veri grupları işlenebilecektir.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">1. Kişisel Verilerinizin İşlenme Amaçları</h4>
            <p className="mb-2">Kişisel verileriniz, yürürlükteki mevzuata uygun olarak aşağıdaki amaçlar doğrultusunda işlenebilecektir:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>LPG PORTAL platformundaki üyelik sözleşmelerinin tesisi, yürütülmesi ve feshi süreçlerinin işletilmesi,</li>
              <li>Ekosistemde yer alan araç sahipleri ile servis bayileri (TSE tescilli frenciler, montörler) ve mühendis teknisyenler arasında sağlıklı ve güvenli iletişimin temin edilmesi,</li>
              <li>Kullanıcı arayüzünde doğrulama (SMS / OTP veya E-posta) süreçlerinin eksiksiz tamamlanarak sahte veya mükerrer hesapların engellenmesi,</li>
              <li>Firma ve kullanıcı rehberi profillerinin coğrafi lokasyon verileriyle harita üzerinde gösterime açılması ve kurumsal hizmet kalitesinin izlenmesi,</li>
              <li>Platform teknik destek ekibi tarafından çağrıların yanıtlanması, sızdırmazlık veya kalibrasyon uyumluluk şikayetlerinin yönetilmesi,</li>
              <li>Ücretli abonelik paketi veya listeleme hizmetlerinin faturalandırılması, tahsilat takibi, iade ve muhasebe süreçlerinin yönetilmesi,</li>
              <li>LPG PORTAL altyapısının siber güvenlik operasyonlarının yürütülmesi, yasal yükümlülüklerin yerine getirilmesi.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">2. İşlenen Kişisel Verilerinizin Aktarılması</h4>
            <p>
              Kişisel verileriniz; yukarıda belirtilen amaçların gerçekleştirilmesiyle sınırlı olarak ve kanuni yükümlülükler çerçevesinde, yetkili kamu kurum ve kuruluşlarına (BTK, Gelir İdaresi Başkanlığı, yargı organları) ve platformun bulut ve veri depolama altyapısı sağlayıcılarına gerekli güvenlik tedbirleri alınarak aktarılabilecektir. Verileriniz, yasal zorunluluklar haricinde ticari kazanç amacıyla üçüncü kişilerle kesinlikle paylaşılmaz.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">3. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h4>
            <p>
              Kişisel verileriniz, platform mobil veya web kayıt paneli üzerinde doldurulan formlar, tarayıcı çerezleri ve destek talepleri aracılığıyla otomatik veya kısmen otomatik yöntemlerle toplanmaktadır. Söz konusu veri işleme faaliyeti, KVKK'nın 5. maddesinde yer alan "sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması", "veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması" ve "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaatler için veri işlenmesinin zorunlu olması" hukuki sebeplerine dayanmaktadır.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">4. Veri Sahibi Olarak Haklarınız (KVKK Madde 11)</h4>
            <p className="mb-2">Kanunun 11. maddesi kapsamındaki haklarınız uyarınca, LPG PORTAL yönetimine başvurarak şunları talep edebilirsiniz:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
              <li>Kanun ve ilgili diğer kanun hükümlerine uygun olarak işlenmiş olmasına rağmen, işlenmesini gerektiren sebeplerin ortadan kalkması hâlinde kişisel verilerinizin silinmesini veya yok edilmesini isteme.</li>
            </ul>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-start gap-3 mt-4">
            <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-emerald-850">
              <strong>Yasal Kabul Beyanı:</strong> LPG PORTAL platformuna kayıt işlemlerini gerçekleştirerek bu Aydınlatma Metni'ni bütünüyle okuduğunuzu, anladığınızı ve kişisel verilerinizin bu doğrultuda işlenmesine açık rızanızla muvafakat ettiğinizi beyan etmiş olursunuz.
            </div>
          </div>
        </div>
      )
    },
    {
      id: "gizlilik-politikasi" as LegalDocType,
      title: "Gizlilik Politikası",
      icon: Lock,
      desc: "Veri Güvenliği, Bilgi Muhafazası ve Gizlilik İlkelerimiz",
      activeBg: "bg-teal-50 text-teal-800 border-teal-250",
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-150 pb-2 mb-3">LPG PORTAL GİZLİLİK POLİTİKASI</h3>
            <p>
              LPG PORTAL internet platformu ("Platform") üzerinde toplanan ve işlenen her türlü bilginin gizliliğinin korunması en hassas olduğumuz konulardan biridir. Bu politika, platformda toplanan verilerin karakteristiğini, depolama standartlarını ve kullanıcıların kişisel gizlilik ayarlarını yönetme biçimlerini açıklar.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">1. Toplanan ve İzlenen Bilgiler</h4>
            <p className="mb-2">LPG PORTAL'da sistem güvenliği ve operasyonel verimlilik için şu bilgiler kayıt altına alınmaktadır:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Hesap Bilgileri:</strong> İsim, unvan, e-posta, telefon numarası ve şifre kırıcı algoritmalar tarafından okunamaz şekilde hash yöntemleriyle saklanan şifreniz.</li>
              <li><strong>İlan ve Firma Verileri:</strong> TSE yetki no, montaj markaları, adres, harita konum koordinatları, teknik servis teklif bütçeleri.</li>
              <li><strong>Ağ ve Arka Plan Logları:</strong> Sisteme giriş yaptığınız IP adresi, işletim sistemi tercihleri, tarayıcı türü, yasal onay tarihleriniz (KVKK, Hizmet Sözleşmesi onayı saat detayları).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">2. Bilgi Güvenliği Standartları ve Hassas Şifreleme</h4>
            <p>
              LPG PORTAL üzerindeki veri akışları endüstri standardı SHA-256 SSL (Secure Sockets Layer) şifreleme protokolleri ile güvenceye alınmıştır. Ödeme sistemlerimizde kredi kartı veya banka kartı verileriniz kesinlikle platform sunucularına kaydedilmez. Faturalandırma ve ödeme işlemleri tamamen BDDK lisanslı aracı sanal pos entegrasyonu (3D Secure) üzerinden, şifrelenmiş bankacılık kanallarıyla gerçekleştirilir.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">3. Konum Bilgisi ve Harita Entegrasyonu</h4>
            <p>
              Firma Rehberi modülümüzde size en yakın LPG montaj servisini bulabilmeniz için talep etmeniz halinde cihazınızın coğrafi konum bilgisi işlenebilir. Bu veriler sadece harita üzerindeki servislerin mesafesini ölçümlemek amacıyla tarayıcı seansında dinamik işlenir ve kalıcı olarak kayıt altına alınmaz.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">4. İletişim ve Pazarlama Tercihleri</h4>
            <p>
              Kullanıcılarımızın kayıt esnasında isteğe bağlı onay kutusunu işaretlemesi koşuluyla, LPG PORTAL sisteminde gerçekleşen fiyat güncellemeleri, mevzuat bültenleri veya kampanya bildirimleri SMS ya da E-posta olarak gönderilir. Kullanıcı dilediği an profil ayarlarından veya destek masamız aracılığıyla bu pazarlama iznini iptal etme özgürlüğüne sahiptir.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "kullanim-sartlari" as LegalDocType,
      title: "Kullanım Şartları",
      icon: FileText,
      desc: "Platformun Kullanım Kuralları, Haklar ve Sorumluluk Sınırları",
      activeBg: "bg-amber-50 text-amber-800 border-amber-250",
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-150 pb-2 mb-3">LPG PORTAL KULLANIM ŞARTLARI VE SÖZLEŞMESİ</h3>
            <p>
              LPG PORTAL ("Platform") web veya mobil arayüzünü ziyaret eden, üyelik hesabı oluşturan ya da platform modüllerindeki servislerden faydalanan tüm gerçek ve tüzel kişiler, bu Kullanım Şartları'nı bütünüyle onaylamış sayılırlar.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">1. Genel Hizmet Tanımı ve Sorumluluk Sınırlandırması</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>LPG PORTAL, otomotiv otogaz sektörünü dijital ortama taşımayı amaçlayan bağımsız bir firma rehberi, teknik forum, uyumluluk sorgu motoru ve ilan listeleme aracıdır.</li>
              <li>Platform bünyesinde yer alan servis bayilerinin, mühendislerin sunduğu hizmet kalitesi, montaj faturası, yedek parça orijinalliği, TSE sızdırmazlık onay süreçleri ve bunlardan doğabilecek maddi/manevi zararlardan doğrudan doğruya ilgili montör veya tescilli iş yeri sorumludur. LPG PORTAL, bir aracı platform sıfatıyla hiçbir montaj veya ayar kusurunun tarafı ya da kefili değildir.</li>
              <li>Araç sorgulama modülünde sunulan subap erime risk katsayıları, montaj kit önerileri ve tasarruf hesap makineleri genel bilgilendirme amaçlı olup, nihai kararlarda yetkili makine mühendisi onayı / kalibrasyon testi esas alınmalıdır.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">2. Üye Davranış Kuralları ve Güvenlik</h4>
            <p className="mb-2">Platform üyeleri aşağıda sıralanan etik kurallara uymayı taahhüt eder:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Sahte unvan veya sahte TSE yetki belgeleriyle sistemde kurumsal mağaza ya da mühendis profili açmamak,</li>
              <li>Sektörel rakipleri karalama amacı gütmeyen, objektif, tüketici haklarına saygılı ve küfür/hakaret içermeyen teknik yorumlar ve incelemeler paylaşmak,</li>
              <li>Platformun veritabanını izinsiz kopyalamamak, botlar vasıtasıyla veri kazıma (scraping) ve toplu veri çekme işlemleri gerçekleştirmemek.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">3. İhlal Durumunda Hesabın Askıya Alınması</h4>
            <p>
              Kullanım Şartları'nı ihlal eden, sahte ilanlar açan veya üyelerin yasal verilerini suistimal eden kullanıcıların hesapları, önceden herhangi bir ihtara gerek kalmaksızın sistem yöneticilerimiz tarafından süresiz olarak engellenir veya tamamen siliniz.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "cerez-politikasi" as LegalDocType,
      title: "Çerez Politikası",
      icon: Eye,
      desc: "İnternet Tarayıcısı Çerezleri (Cookie) Hakkında Bilgilendirme",
      activeBg: "bg-blue-50 text-blue-800 border-blue-250",
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-150 pb-2 mb-3">LPG PORTAL ÇEREZ (COOKIE) POLİTİKASI</h3>
            <p>
              LPG PORTAL olarak, web sitemizi ziyaretleriniz esnasında kullanıcı deneyiminizi geliştirmek, portal yüklenme hızını optimize etmek ve istatistiki analizleri doğru gerçekleştirebilmek adına tarayıcınızda çerezler muhafaza etmekteyiz. Bu metin, çerezlerin fonksiyonel kırılımlarını ve yönetim yollarını size sunmaktadır.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">1. Çerez Nedir?</h4>
            <p>
              Çerezler, bir web sitesini ziyaret ettiğinizde bilgisayarınıza, akıllı telefonunuza veya tabletinize kaydedilen ve web sitesinin sizi hatırlamasını, tercihlerinizi (seçtiğiniz arama filtresi, araç markası, giriş yaptığınız kullanıcı oturumu) saklamasını sağlayan küçük metin dosyalarıdır.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">2. Kullandığımız Çerez Tipleri</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Zorunlu Çerezler:</strong> Platformun temel fonksiyonlarını yerine getirebilmesi için elzemdir. Güvenli giriş, seans süresi takibi ve gizlilik onaylarının kaydedilmesi için zorunlu olarak devrededir.</li>
              <li><strong>Fonksiyonel Tercih Çerezleri:</strong> En son sorguladığınız araç modeli, haritada seçtiğiniz filtre ili gibi tercihlerinizi sonraki vizitlerinizde hatırlatmak amacıyla muhafaza edilir.</li>
              <li><strong>Performans ve Analiz Çerezleri:</strong> Sitemizi hangi saatlerde kaç kişinin ziyaret ettiğini, hangi bülten veya blogların çok okunduğunu saptamak amacıyla tamamen anonim olarak Google Analytics altyapısı ile entegre çalışır.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">3. Çerezlerin Kontrolü ve Pasif Hale Getirilmesi</h4>
            <p>
              İnternet tarayıcılarınız (Chrome, Safari, Firefox vb.) genellikle çerezleri otomatik kabul edecek şekilde ayarlanmıştır. Dilediğiniz zaman tarayıcınızın "Ayarlar / Gizlilik ve Güvenlik" adımlarını izleyerek çerezleri tamamen bloke edebilir veya tek tek silebilirsiniz. Ancak çerezleri engellemeniz halinde, LPG PORTAL üye paneli gibi aktif oturum gerektiren servislerin stabil çalışamayacağını önemle hatırlatırız.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "mesafeli-hizmet-sozlesmesi" as LegalDocType,
      title: "Mesafeli Hizmet Sözleşmesi",
      icon: Bookmark,
      desc: "Dijital Hizmet Satın Alımları, Üyelik Paketleri ve İade Şartları",
      activeBg: "bg-rose-50 text-rose-800 border-rose-250",
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-150 pb-2 mb-3">MESAFELİ HİZMET SÖZLEŞMESİ</h3>
            <p>
              Bu sözleşme, bir tarafta <strong>LPG PORTAL</strong> ("Sağlayıcı") ile diğer tarafta platformun sanal POS ödeme altyapısını kullanarak Kurumsal Bayi İlan Üyeliği, Mühendislik Ofisi Listelemesi veya Reklam / Sponsorluk alanları satın alan kullanıcı ("Alıcı") arasındaki ticari hak ve mükellefiyetleri tanımlar.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">1. Sözleşmenin Konusu ve Kapsamı</h4>
            <p>
              Sözleşmenin konusu, Alıcı'nın Sağlayıcı'ya ait internet platformundan veya mobil kanallardan elektronik ortamda siparişini verdiği, özellikleri ve ücret bilgisi ilgili paket ekranında belirtilen ücretli kurumsal üyelik / listeleme hizmetlerinin satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların karşılıklı hak ve yükümlülüklerinin saptanmasıdır.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">2. Ödeme ve Hizmet İfası</h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Abonelik veya ilan ödemeleri, BDDK onaylı ödeme ortakları kanalıyla peşin olarak tahsil edilir.</li>
              <li>Ödemenin kesinleşmesini müteakip en geç 24 saat içerisinde üyeliğin yasal hak tanımları sistem algoritması tarafından otomatik aktif edilir ve fatura e-posta adresine gönderilir.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2">3. İade, Cayma Hakkı Sınırları ve İstisnalar</h4>
            <p>
              Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesinin (ğ) bendi uyarınca; <strong>"elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmelerde cayma hakkı kullanılamaz."</strong> Bu doğrultuda, LPG PORTAL kurumsal üyelik paketleri, haritada öncelikli gösterimler veya dijital ilan bütçeleri, sisteme tanımlandığı ve ifa edilmeye başlandığı andan itibaren cayma hakkı kapsamı dışındadır. Faturalandırılmış paketler için kısmi veya tam ücret iadesi yapılmamaktadır.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentDocData = docs.find(d => d.id === activeDoc) || docs[0];
  const ActiveIcon = currentDocData.icon;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-sm">
              <Flame className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-slate-400 font-mono block uppercase">LPG PORTAL</span>
              <h1 className="text-base font-bold text-slate-950 flex items-center gap-1.5 leading-none">
                <span>📚 Hukuk ve Yasal Mevzuat Merkezi</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoBack ? (
              <button
                type="button"
                onClick={onGoBack}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-200 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 text-slate-550" />
                Ana Sayfaya Dön
              </button>
            ) : (
              <a
                href="/"
                className="flex items-center gap-1.5 bg-slate-150 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition border border-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Portal Girişine Git
              </a>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Yazdır
            </button>
          </div>
        </div>

        {/* Master Body Grid Structure */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-4 space-y-2.5">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block pl-2 font-mono">TABLO / BELGELER</span>
            
            <div className="bg-white rounded-3xl border border-slate-200 p-3 space-y-1.5 shadow-xs">
              {docs.map(doc => {
                const DocIcon = doc.icon;
                const isSelected = activeDoc === doc.id;
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setActiveDoc(doc.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? `${doc.activeBg} font-bold shadow-xs border-current`
                        : "bg-white border-transparent hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <DocIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isSelected ? "text-current" : "text-slate-400"}`} />
                    <div className="space-y-0.5">
                      <span className="text-xs block leading-tight font-sans font-bold">{doc.title}</span>
                      <p className="text-[9.5px] leading-snug font-normal text-slate-400 font-sans lines-clamp-1">{doc.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick trust card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-300 p-5 rounded-3xl border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-mono">
                <ShieldCheck className="h-4 w-4 text-emerald-450 text-emerald-500" />
                <span>UYUMLULUK GÜVENCESİ</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-sans">
                LPG PORTAL, Türkiye Cumhuriyeti Kişisel Verileri Korunma Kurumu standartları ve elektronik ticaret rehberi (ETBİS) ilkeleri doğrultusunda denetlenmektedir.
              </p>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 font-mono">
                Doğrulama Ref: LP-6698-2026
              </div>
            </div>
          </div>

          {/* Right Document Content */}
          <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs min-h-[480px]">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 text-slate-700">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-400">YÜRÜRLÜKTEKİ MEVZUAT METNİ</span>
                <h2 className="text-lg font-extrabold text-slate-950 font-sans leading-none">{currentDocData.title}</h2>
              </div>
            </div>

            {/* Render selected Document contents */}
            <div className="prose prose-sm font-sans max-w-none text-slate-700">
              {currentDocData.content}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 font-mono">
              <span>Son Güncellenme: 10 Haziran 2026</span>
              <span>Yayımcı: LPG PORTAL Hukuk Danışmanlığı</span>
            </div>
          </div>

        </div>

        {/* Legal copyright footer */}
        <div className="text-center text-slate-400 text-xs py-2">
          © 2026 LPG PORTAL. Tüm hakları saklıdır.
        </div>

      </div>
    </div>
  );
}
