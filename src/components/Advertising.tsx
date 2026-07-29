import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { DbUser } from "../lib/membership";
import { 
  Building2, 
  Target, 
  Send, 
  CheckCircle2, 
  Layout, 
  Users, 
  Megaphone, 
  Briefcase, 
  ShieldAlert,
  Calendar,
  Layers,
  Inbox,
  Trash2,
  Lock
} from "lucide-react";

interface AdvertisingProps {
  activeUser: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

export interface AdInquiry {
  id: string;
  date: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  status: "Yeni Talep" | "Görüşülüyor" | "Onaylandı" | "Reddedildi";
}

export default function Advertising({ activeUser, onNavigateToTab }: AdvertisingProps) {
  const { language } = useLanguage();

  // Load state for Ad inquiries
  const [inquiries, setInquiries] = useState<AdInquiry[]>(() => {
    const saved = localStorage.getItem("lpgportal_ad_inquiries");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Prepopulated records for rich UI evaluation
    return [
      {
        id: "ad-1",
        date: "2026-06-11 09:40",
        companyName: "BRC Türkiye Distribütörü",
        contactPerson: "Ahmet Kozan",
        phone: "0212 999 88 77",
        email: "ahmet.kozan@brc.com.tr",
        subject: "Ana Sayfa Vitrin Reklamları",
        message: "Yeni çıkan VSI-3 DI direk enjeksiyonlu kitlerimiz için LPG PORTAL genel ana sayfa banner alanları ve teknik bülten sponsorluğu hakkında 3 aylık bir reklam sözleşmesi teklif almak istiyoruz."
      },
      {
        id: "ad-2",
        date: "2026-06-10 16:10",
        companyName: "Prins Teknik Destek Ltd.",
        contactPerson: "Ömer Şahin",
        phone: "0532 555 44 33",
        email: "omer@prinsdestek.com",
        subject: "Firma Rehberi Öne Çıkarma",
        message: "İstanbul genelinde yetkili servislerimizi platform firma rehberinde ön plana çıkarmak ve 'Yılın Yetkili Ustası' sponsorluk paketinize başvurmak istiyoruz."
      }
    ];
  });

  // Admin and CRM notifications simulation lists
  const [adminNotifications, setAdminNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem("lpgportal_ad_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      "[İlan CRM] BRC Türkiye Distribütörü reklam başvurusunda bulundu.",
      "[İlan CRM] Prins Teknik Destek Ltd. iş ortaklığı talebini tescilledi."
    ];
  });

  // Form states
  const [formCompany, setFormCompany] = useState("");
  const [formPerson, setFormPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSubject, setFormSubject] = useState("Banner Reklam Alanları");
  const [formMessage, setFormMessage] = useState("");
  const [formKvkk, setFormKvkk] = useState(false);

  // Status feedback
  const [successToast, setSuccessToast] = useState("");
  const [crmLogs, setCrmLogs] = useState<string[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<AdInquiry | null>(null);

  // Persists
  const saveInquiries = (newInq: AdInquiry[]) => {
    setInquiries(newInq);
    localStorage.setItem("lpgportal_ad_inquiries", JSON.stringify(newInq));
  };

  const saveNotifications = (newNotifs: string[]) => {
    setAdminNotifications(newNotifs);
    localStorage.setItem("lpgportal_ad_notifications", JSON.stringify(newNotifs));
  };

  // Pre-fill fields if user has membership profile
  useEffect(() => {
    if (activeUser) {
      setFormPerson(activeUser.name || "");
      setFormEmail(activeUser.email || "");
      setFormPhone(activeUser.phone || "");
      if ((activeUser as any).brand_name || (activeUser as any).company_name) {
        setFormCompany((activeUser as any).brand_name || (activeUser as any).company_name || "");
      }
    }
  }, [activeUser]);

  // Handle inquiry submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formKvkk) {
      alert("Lütfen KVKK Aydınlatma Metnini okuyup onaylayın.");
      return;
    }

    if (!formCompany || !formPerson || !formPhone || !formEmail || !formMessage) {
      alert("Lütfen zorunlu tüm alanları doldurunuz.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newInquiry: AdInquiry = {
      id: "ad-" + Date.now(),
      date: formattedDate,
      companyName: formCompany,
      contactPerson: formPerson,
      phone: formPhone,
      email: formEmail,
      subject: formSubject,
      message: formMessage,
      status: "Yeni Talep"
    };

    const updatedInquiries = [newInquiry, ...inquiries];
    saveInquiries(updatedInquiries);

    // Dynamic notification pushed to Admin Panel
    const newNotif = `[İlan CRM] ${formCompany} '${formSubject}' konulu reklam/iş birliği talebi iletti. (${formattedDate})`;
    const updatedNotifs = [newNotif, ...adminNotifications];
    saveNotifications(updatedNotifs);

    // Populate actual CRM and internal process pipelines logs
    const logs = [
      `🌐 CRM Sistemi: Talebiniz Salesforce / HubSpot entegrasyon kuyruğuna aktarıldı (ID: ${newInquiry.id}).`,
      `📧 E-Posta İletimi: lpgportal@reklam.com adresinden satış temsilcilerine anlık bildirim fakslandı.`,
      `📊 Admin Bildirimi: Yönetici konsoluna 'Reklam ve İş Birlikleri' yeni mesaj bildirimi düştü.`
    ];
    setCrmLogs(logs);

    setSuccessToast(
      "İş birliği talebiniz başarıyla alınmıştır. Reklam ekibimiz en kısa sürede sizinle iletişime geçecektir."
    );

    // Reset non-essential form fields
    setFormMessage("");
    setFormKvkk(false);
    if (!activeUser) {
      setFormCompany("");
      setFormPerson("");
      setFormPhone("");
      setFormEmail("");
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = (id: string) => {
    if (confirm("Bu iş birliği başvurusunu silmek istediğinize emin misiniz?")) {
      const filtered = inquiries.filter(inq => inq.id !== id);
      saveInquiries(filtered);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
    }
  };

  // Update Status
  const handleUpdateStatus = (id: string, nextStatus: any) => {
    const updated = inquiries.map(inq => inq.id === id ? { ...inq, status: nextStatus } : inq);
    saveInquiries(updated);
    if (selectedInquiry?.id === id) setSelectedInquiry({ ...selectedInquiry, status: nextStatus });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fade-in text-left font-sans" id="advertising-partnership-view">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-[10px] text-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-600/10 px-3 py-1 rounded-full uppercase font-mono tracking-widest leading-none inline-block">
          REKLAM & B2B ORTAKLIĞI
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Reklam ve İş Birlikleri
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          LPG PORTAL, LPG ve alternatif yakıt sektöründe faaliyet gösteren markalar, distribütörler, kit üreticileri, dönüşüm firmaları ve hizmet sağlayıcılar için çeşitli reklam ve iş birliği fırsatları sunmaktadır.
        </p>
      </div>

      {/* METRIC BOX & AD TARGET AUDIENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SOL PANEL: SUNULAN HİZMETLER & HEDEF KİTLE (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* SUNULAN HİZMETLER */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-emerald-600" />
                Sunulan Hizmetlerimiz
              </h2>
              <p className="text-slate-400 text-xs mt-1">LPG PORTAL dijital ağında yer alabileceğiniz prestijli reklam yerleşimleri.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">🖼️ Banner Reklam Alanları</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Masaüstü ve mobil kurgularda ana sayfa, blog ve yedek parça sayfalarında özel konumlandırmalar.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">🌟 Ana Sayfa Vitrin Reklamları</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Kullanıcıların arama yaparken veya siteye girdiklerinde gördükleri ilk spot teklif alanı.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">📰 Haber Sponsorlukları</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Sektörel haber bültenlerimizin altına veya içine entegre edilen kurumsal tanıtım spotları ve linkleri.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">📑 Teknik Bülten Sponsorlukları</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Yakıt ayar formülleri, kalibrasyon kılavuzları ve montaj bültenlerinde marka logoları gösterimi.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">🎥 Eğitim Video Sponsorlukları</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Usta eğitimlerimizde kullanılan test cihazları ve montaj teçhizatları üzerinde ürün sponsorlukları.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">🚀 Firma Rehberi Öne Çıkarma</strong>
                <p className="text-[11px] text-slate-500 leading-normal">Bulunduğunuz ilin arama sonuçlarında en üst sıraya sabitlenme ve 'Sertifikalı Bayi' brövesi.</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-1 col-span-1 sm:col-span-2">
                <strong className="text-xs text-slate-800 font-extrabold uppercase block">📦 Diğer Stratejik Çözümler</strong>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Market Ürün Vitrini, Özel Marka Tanıtım Sayfaları, Etkinlik / Lansman Duyuruları ve geniş B2B Kurumsal İş Birlikleri.
                </p>
              </div>
            </div>
          </div>

          {/* HEDEF KİTLEİMİZ */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Sinerjik Reklam Hedef Kitlesi
              </h2>
              <p className="text-slate-400 text-xs mt-1">LPG PORTAL bünyesinde reklamlarımızın doğrudan temas ettiği niş kitle grupları.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 text-center space-y-1.5 shadow-xs">
                <span className="text-lg">🚗</span>
                <span className="text-[11px] font-extrabold text-slate-700 block uppercase leading-tight">Araç Sahipleri</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 text-center space-y-1.5 shadow-xs">
                <span className="text-lg">🏪</span>
                <span className="text-[11px] font-extrabold text-slate-700 block uppercase leading-tight">LPG Bayileri</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 text-center space-y-1.5 shadow-xs">
                <span className="text-lg">🔧</span>
                <span className="text-[11px] font-extrabold text-slate-700 block uppercase leading-tight">LPG Servisleri</span>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-150 text-center space-y-1.5 shadow-xs">
                <span className="text-lg">🎓</span>
                <span className="text-[11px] font-extrabold text-slate-700 block uppercase leading-tight">Mühendisler</span>
              </div>
            </div>
          </div>

        </div>

        {/* SAĞ PANEL: BAŞVURU İŞ BİRLİĞİ FORMU (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-205 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                İş Birliği Başvuru Formu
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Lütfen reklam veya ortaklık fikirlerinizi girin. Pazarlama ekibimiz en geç 12 saat içinde sizi arayacaktır.
              </p>
            </div>

            {/* Notification and Simulated Email / CRM Log views */}
            {successToast && (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-extrabold">{successToast}</p>
                    <p className="text-[11px] text-emerald-600 font-mono">CRM-LOGS: Alındı ve şifrelendi.</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1.5 font-mono text-[10px] text-slate-600">
                  <span className="font-bold text-slate-700 block uppercase tracking-wide">⛓️ CRM VE E-POSTA İLETİM KANALLARI</span>
                  {crmLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-1">
                      <span className="text-emerald-500">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Firma Adı */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Firma Adı <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="Örn: Lovato Otogaz A.Ş."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* Yetkili Kişi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Yetkili Kişi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formPerson}
                  onChange={(e) => setFormPerson(e.target.value)}
                  placeholder="Örn: Mustafa Kılıç"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* Telefon */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Telefon Numarası <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Örn: 0532 999 88 77"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* E-Posta */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  E-Posta Adresi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Örn: sponsor@lovato.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* Konu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  İş Birliği Alanı / Konu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="Banner Reklam Alanları">Banner Reklam Alanları</option>
                  <option value="Ana Sayfa Vitrin Reklamları">Ana Sayfa Vitrin Reklamları</option>
                  <option value="Haber Sponsorlukları">Haber Sponsorlukları</option>
                  <option value="Teknik Bülten Sponsorlukları">Teknik Bülten Sponsorlukları</option>
                  <option value="Eğitim Video Sponsorlukları">Eğitim Video Sponsorlukları</option>
                  <option value="Firma Rehberi Öne Çıkarma">Firma Rehberi Öne Çıkarma</option>
                  <option value="Market Ürün Vitrini">Market Ürün Vitrini</option>
                  <option value="Kurumsal İş Birliği">Diğer Kurumsal Ortaklık</option>
                </select>
              </div>

              {/* Mesaj */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Mesajınız / Teklif Detayları <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Talep ettiğiniz reklam alanını, bütçeyi veya iş ortaklığı metodunuzu kısaca açıklayınız..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none resize-y"
                />
              </div>

              {/* KVKK */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="ad-kvkk-check"
                  checked={formKvkk}
                  onChange={(e) => setFormKvkk(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="ad-kvkk-check" className="text-[11px] text-slate-500 leading-normal select-none">
                  Sosyal ve kurumsal veri kullanım şartları dahilinde{" "}
                  <a href="/kvkk" target="_blank" className="font-bold text-emerald-700 underline">KVKK Aydınlatma Beyanını</a>{" "}
                  okudum, onaylıyorum. <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={!formKvkk}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-white transition text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  formKvkk ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm" : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>İş Birliği Başvurusunu Gönder</span>
              </button>

            </form>
          </div>
        </div>

      </div>

      {/* ========================================= */}
      {/* ADVERTISING ADMIN PANEL SUB-DASHBOARD (ONLY ADMIN) */}
      {/* ========================================= */}
      {activeUser?.role === "admin" && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800" id="advertising-admin-panel">
          <div className="border-b border-slate-800 pb-5 space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded uppercase">CRM AKTİF</span>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2 text-slate-100">
                <Inbox className="h-5 w-5 text-emerald-500" />
                Reklam & Sponsorluk Talepleri (CRM Paneli)
              </h3>
            </div>
            <p className="text-xs text-slate-500">Site üzerinden gelen B2B iş ortaklıkları ve sponsorluk teklifleri merkezi veritabanı.</p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs divide-y divide-slate-800">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Firma Bilgisi</th>
                    <th className="p-3">Yetkili</th>
                    <th className="p-3">Alan / Konu</th>
                    <th className="p-3">Teklif Mesajı</th>
                    <th className="p-3 text-center">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-600 italic">Kayıtlı reklam başvurusu bulunmuyor.</td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => (
                      <tr key={inq.id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 text-slate-400 font-mono whitespace-nowrap">{inq.date}</td>
                        <td className="p-3">
                          <strong className="text-slate-200 block">{inq.companyName}</strong>
                          <span className="text-[10px] text-slate-500 block font-mono">{inq.phone}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 block font-bold">{inq.contactPerson}</span>
                          <span className="text-[10px] text-slate-550 text-slate-500 font-mono block">{inq.email}</span>
                        </td>
                        <td className="p-3 text-emerald-400 font-semibold">{inq.subject}</td>
                        <td className="p-3 text-slate-400 max-w-sm font-sans truncate" title={inq.message}>
                          {inq.message}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`📧 CRM Yanıt Ekranı:\n\nFirma: ${inq.companyName}\nE-Posta: ${inq.email}\n\nHazır Taslak Gönderimi: 'LPG PORTAL Sponsorluk Şartları & Medya Kiti PDF' dosyası başarıyla yetkili e-posta adresine sevk edildi.`);
                              }}
                              className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded transition"
                            >
                              Medya Kitini Sevk Et
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq.id)}
                              className="p-1 hover:bg-rose-950/40 rounded text-rose-450 text-rose-500 transition"
                              title="Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[10px] text-slate-400">
            <span className="font-bold text-slate-500 uppercase tracking-widest block">🔑 CRM INTEGRATION STACK ACTIVITY</span>
            {adminNotifications.map((not, i) => (
              <p key={i}>🌐 {not}</p>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
