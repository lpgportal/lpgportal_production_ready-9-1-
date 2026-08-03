import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { DbUser, sendLpgNotification } from "../lib/membership";
import { 


  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Send,
  CheckCircle,
  MessageSquare,
  Settings,
  Lock,
  MessageCircle,
  X,
  Plus,
  AlertCircle,
  Check,
  Filter,
  Trash2,
  Calendar,
  Inbox
} from "lucide-react";

interface ContactProps {
  activeUser: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

export interface ContactMessage {
  id: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  category: string;
  message: string;
  status: "Yeni Mesaj" | "İnceleniyor" | "Cevaplandı" | "Kapatıldı";
  userId: string;
}

export interface ContactConfig {
  phone: string;
  email: string;
  address: string;
  workHours: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  youtube: string;
  whatsapp: string;
}

export default function Contact({ activeUser, onNavigateToTab }: ContactProps) {
  const { language, t } = useLanguage();

  // 1. Initial configuration or Load from localStorage
  const [config, setConfig] = useState<ContactConfig>(() => {
    const defaultConfig = {
      phone: "05071545920",
      email: "info@lpgportalı.com",
      address: "İstanbul, Türkiye",
      workHours: "Pazartesi - Cumartesi\n09:00 - 19:00",
      instagram: "https://instagram.com/lpgportal",
      facebook: "https://facebook.com/lpgportal",
      linkedin: "https://linkedin.com/company/lpgportal",
      youtube: "https://youtube.com/c/lpgportal",
      whatsapp: "https://wa.me/905071545920"
    };
    const saved = localStorage.getItem("lpgportal_contact_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...defaultConfig, ...parsed };
        }
      } catch (e) {}
    }
    return defaultConfig;
  });

  // Messages list state
  const [messages, setMessages] = useState<ContactMessage[]>(() => {
    const defaultMessages = [
      {
        id: "msg-1",
        date: "2026-06-11 14:32",
        name: "Ahmet Yılmaz",
        phone: "0532 111 22 33",
        email: "ahmet@gmail.com",
        category: "Bayilik Başvurusu",
        message: "Ankara Ostim bölgesinde 15 yıllık sıralı otogaz servisiyiz. LPG PORTAL firma rehberi üyeliğimizi premium yapmak ve bayilik sisteminize dahil olmak istiyoruz. Şartlar hakkında bilgi talep ediyorum.",
        status: "Yeni Mesaj" as const,
        userId: "visitor"
      },
      {
        id: "msg-2",
        date: "2026-06-10 10:15",
        name: "Selin Demir",
        phone: "0544 222 33 44",
        email: "selin@hotmail.com",
        category: "Teknik Destek",
        message: "Fiat Egea aracım için Atiker Grand montajı sonrası rölantide hafif bir sarsıntı var. Sistem uyumluluğu kontrol panelinizi kullandım. Sizin önereceğiniz bir usta var mı İstanbul Anadolu yakasında?",
        status: "İnceleniyor" as const,
        userId: "visitor"
      },
      {
        id: "msg-3",
        date: "2026-06-08 17:45",
        name: "Murat Can",
        phone: "0555 333 44 55",
        email: "murat.can@lpgustasi.com",
        category: "Market Desteği",
        message: "Market bölümünden satın aldığım orijinal lpg filtresi elime çok hızlı ulaştı. Satıcı firmaya ve size teşekkür iletmek istedim.",
        status: "Cevaplandı" as const,
        userId: "visitor"
      }
    ];
    const saved = localStorage.getItem("lpgportal_contact_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return defaultMessages;
  });

  // Admin Logs / Notifications simulation
  const [adminNotifications, setAdminNotifications] = useState<string[]>(() => {
    const defaultNotifs = [
      "[Bildirim] Ahmet Yılmaz 'Bayilik Başvurusu' konulu bir mesaj iletti.",
      "[Bildirim] Selin Demir 'Teknik Destek' konulu bir mesaj iletti."
    ];
    const saved = localStorage.getItem("lpgportal_contact_notifications");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return defaultNotifs;
  });

  // Form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCategory, setFormCategory] = useState("Genel Bilgi Talebi");
  const [formMessage, setFormMessage] = useState("");
  const [formKvkk, setFormKvkk] = useState(false);

  // Status feedback
  const [successToast, setSuccessToast] = useState("");
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<"messages" | "settings">("messages");
  const [msgFilter, setMsgFilter] = useState<string>("all");
  const [selectedMessageDetails, setSelectedMessageDetails] = useState<ContactMessage | null>(null);

  // Admin configuration form states (loaded from active config)
  const [adminPhone, setAdminPhone] = useState(config.phone || "");
  const [adminEmail, setAdminEmail] = useState(config.email || "");
  const [adminAddress, setAdminAddress] = useState(config.address || "");
  const [adminWorkHours, setAdminWorkHours] = useState(config.workHours || "");
  const [adminInsta, setAdminInsta] = useState(config.instagram || "");
  const [adminFb, setAdminFb] = useState(config.facebook || "");
  const [adminLinkedin, setAdminLinkedin] = useState(config.linkedin || "");
  const [adminYoutube, setAdminYoutube] = useState(config.youtube || "");
  const [adminWhatsapp, setAdminWhatsapp] = useState(config.whatsapp || "");

  // Synchronize defaults on config reset/update
  useEffect(() => {
    setAdminPhone(config.phone || "");
    setAdminEmail(config.email || "");
    setAdminAddress(config.address || "");
    setAdminWorkHours(config.workHours || "");
    setAdminInsta(config.instagram || "");
    setAdminFb(config.facebook || "");
    setAdminLinkedin(config.linkedin || "");
    setAdminYoutube(config.youtube || "");
    setAdminWhatsapp(config.whatsapp || "");
  }, [config]);

  // Persist config
  const saveConfig = (newConfig: ContactConfig) => {
    setConfig(newConfig);
    localStorage.setItem("lpgportal_contact_config", JSON.stringify(newConfig));
  };

  // Persist messages
  const saveMessages = (newMsgs: ContactMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("lpgportal_contact_messages", JSON.stringify(newMsgs));
  };

  // Persist notifications
  const saveNotifications = (newNotifs: string[]) => {
    setAdminNotifications(newNotifs);
    localStorage.setItem("lpgportal_contact_notifications", JSON.stringify(newNotifs));
  };

  // Pre-fill user data if available
  useEffect(() => {
    if (activeUser) {
      setFormName(activeUser.name || "");
      setFormEmail(activeUser.email || "");
      setFormPhone(activeUser.phone || "");
    }
  }, [activeUser]);

  // Form submission dispatcher
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formKvkk) {
      alert(language === "tr" ? "Lütfen KVKK Aydınlatma Metnini okuyup kabul ediniz." : "Please accept terms.");
      return;
    }

    if (!formName || !formPhone || !formEmail || !formMessage) {
      alert(language === "tr" ? "Lütfen gerekli alanları doldurunuz." : "Please fill required fields.");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newMessage: ContactMessage = {
      id: "msg-" + Date.now(),
      date: formattedDate,
      name: formName,
      phone: formPhone,
      email: formEmail,
      category: formCategory,
      message: formMessage,
      status: "Yeni Mesaj",
      userId: activeUser ? activeUser.id : "visitor"
    };

    const updatedMessages = [newMessage, ...messages];
    saveMessages(updatedMessages);

    // 1. Admin notification simulation
    const newNotif = `[Bildirim] ${formName} '${formCategory}' konulu yeni bir mesaj gönderdi. (${formattedDate})`;
    const updatedNotifications = [newNotif, ...adminNotifications];
    saveNotifications(updatedNotifications);

    // Notify admin in system notifications
    sendLpgNotification(
      "user_admin",
      "✉️ Yeni İletişim Mesajı / Talep",
      `${formName} '${formCategory}' konulu yeni bir mesaj gönderdi.`,
      "mesaj",
      "all",
      true
    );

    // 2. Feedback simulation log details
    const logs = [
      `🌐 Sistem Kaydı: Form yerel durum ve veritabanı loglarına eklendi (ID: ${newMessage.id})`,
      `📧 E-Posta Simülasyonu: info@lpgportalı.com adresine detaylı bildirim e-postası iletildi.`,
      `📱 SMS/Sistem Gönderimi: Admin bildirim kuyruğuna push-event yapıldı.`,
      activeUser ? `👤 Kullanıcı Paneli: ${activeUser.name} talepleri arasına eklendi.` : `👤 Ziyaretçi Talebi: Anonim oturuma kaydedildi.`
    ];

    setSimulationLogs(logs);
    setSuccessToast(language === "tr" 
      ? "Mesajınız başarıyla iletilmiştir. En kısa sürede sizinle iletişime geçeceğiz."
      : "Your message has been successfully transmitted. We will contact you shortly."
    );

    // Clear form except user defaults
    setFormMessage("");
    setFormKvkk(false);
    if (!activeUser) {
      setFormName("");
      setFormEmail("");
      setFormPhone("");
    }
  };

  // Manage status of message
  const handleUpdateMessageStatus = (id: string, newStatus: "Yeni Mesaj" | "İnceleniyor" | "Cevaplandı" | "Kapatıldı") => {
    const updated = messages.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg);
    saveMessages(updated);
    if (selectedMessageDetails && selectedMessageDetails.id === id) {
      setSelectedMessageDetails({ ...selectedMessageDetails, status: newStatus });
    }
  };

  // Delete message
  const handleDeleteMessage = (id: string) => {
    if (confirm(language === "tr" ? "Bu mesajı silmek istediğinize emin misiniz?" : "Delete message?")) {
      const filtered = messages.filter(msg => msg.id !== id);
      saveMessages(filtered);
      setSelectedMessageDetails(null);
    }
  };

  // Save admin custom configuration
  const handleSaveAdminConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig: ContactConfig = {
      phone: adminPhone,
      email: adminEmail,
      address: adminAddress,
      workHours: adminWorkHours,
      instagram: adminInsta,
      facebook: adminFb,
      linkedin: adminLinkedin,
      youtube: adminYoutube,
      whatsapp: adminWhatsapp
    };
    saveConfig(updatedConfig);
    alert(language === "tr" ? "İletişim sayfa ayarları başarıyla güncellendi!" : "Settings saved!");
  };

  // Render Category Badge
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Yeni Mesaj":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "İnceleniyor":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cevaplandı":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Kapatıldı":
        return "bg-slate-100 text-slate-500 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    if (msgFilter === "all") return true;
    return msg.status === msgFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in" id="contact-portal-view">
      
      {/* HEADER SECTION */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-[10px] text-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-600/10 px-3 py-1 rounded-full uppercase font-mono tracking-widest leading-none inline-block">
          {language === "tr" ? "BİZE ULAŞIN" : "CONTACT US"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-905 text-slate-905 tracking-tight font-sans text-slate-900 leading-tight">
          {language === "tr" ? "İletişim" : "Contact"}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-sans">
          {language === "tr" 
            ? "Sorularınız, önerileriniz, iş birliği talepleriniz ve teknik destek konularında bizimle iletişime geçebilirsiniz."
            : "You can contact us daily for questions, suggestions, advertising proposals, system technical guidelines or customized services."
          }
        </p>
      </div>

      {/* ADMIN CONTROLS GATEWAY INDICATOR */}
      {activeUser?.role === "admin" && (
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <strong className="text-xs text-amber-900 block font-black uppercase">YÖNETİCİ MODU AKTİF</strong>
              <p className="text-[11px] text-amber-700 leading-normal">
                Bu sayfadaki iletişim bilgilerini, sosyal bağlantıları ve gelen mesajları dinamik olarak düzenleyebilirsiniz.
              </p>
            </div>
          </div>
          <a
            href="#admin-contact-console"
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] py-1.5 px-4 rounded-xl transition shadow-xs text-center inline-block"
          >
            Yönetim Masasına Git ↓
          </a>
        </div>
      )}

      {/* TWO COLUMN CONTACT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CONTACT DETAILS PANEL (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-white to-slate-50/20 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans">
                {language === "tr" ? "İletişim Bilgileri" : "Contact Information"}
              </h2>
              <p className="text-slate-500 text-[11px] mt-1">LPG PORTAL genel haberleşme kanalları ve çalışma periyotları.</p>
            </div>

            <hr className="border-slate-100" />

            {/* TELEFON */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex-shrink-0 shadow-xs">
                <Phone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                  {language === "tr" ? "Telefon" : "Telephone"}
                </h4>
                <a href={`tel:${config.phone.replace(/\s+/g, "")}`} className="text-base font-bold text-slate-800 hover:text-emerald-600 transition block">
                  {config.phone}
                </a>
              </div>
            </div>

            {/* E-POSTA */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex-shrink-0 shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                  {language === "tr" ? "E-Posta" : "E-Mail"}
                </h4>
                <a href={`mailto:${config.email}`} className="text-base font-bold text-slate-800 hover:text-emerald-600 transition block break-all">
                  {config.email}
                </a>
              </div>
            </div>

            {/* ADRES */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex-shrink-0 shadow-xs">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                  {language === "tr" ? "Adres" : "Address"}
                </h4>
                <p className="text-base font-bold text-slate-800 leading-relaxed">
                  {config.address}
                </p>
              </div>
            </div>

            {/* CALISMA SAATLERI */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 flex-shrink-0 shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                  {language === "tr" ? "Çalışma Saatleri" : "Working Hours"}
                </h4>
                <p className="text-sm font-bold text-slate-800 whitespace-pre-line leading-relaxed">
                  {config.workHours}
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* SOSYAL MEDYA LINKS TRAY */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono">
                {language === "tr" ? "Sosyal Medya Hesaplarımız" : "Connect with Us"}
              </h4>
              <div className="flex flex-wrap gap-2 pt-1" id="social-links-tray">
                {/* Instagram */}
                {config.instagram && (
                  <a
                    href={config.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-100 hover:bg-[#E1306C] hover:text-white rounded-2xl text-slate-600 transition shadow-xs flex items-center justify-center cursor-pointer"
                    title="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}

                {/* Facebook */}
                {config.facebook && (
                  <a
                    href={config.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-100 hover:bg-[#1877F2] hover:text-white rounded-2xl text-slate-600 transition shadow-xs flex items-center justify-center cursor-pointer"
                    title="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}

                {/* LinkedIn */}
                {config.linkedin && (
                  <a
                    href={config.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-100 hover:bg-[#0A66C2] hover:text-white rounded-2xl text-slate-600 transition shadow-xs flex items-center justify-center cursor-pointer"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}

                {/* YouTube */}
                {config.youtube && (
                  <a
                    href={config.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-100 hover:bg-[#FF0000] hover:text-white rounded-2xl text-slate-600 transition shadow-xs flex items-center justify-center cursor-pointer"
                    title="YouTube"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                )}

                {/* WhatsApp */}
                {config.whatsapp && (
                  <a
                    href={config.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-100 hover:bg-[#25D366] hover:text-white rounded-2xl text-slate-600 transition shadow-xs flex items-center justify-center cursor-pointer"
                    title="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5 animate-pulse-light" />
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* KVKK ADVISORY NOTE */}
          <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-3xl text-[11px] text-slate-500 leading-normal space-y-1 shadow-xs">
            <span className="font-extrabold uppercase text-slate-705 block tracking-wider">🔒 6698 Sayılı KVKK Güvencesi</span>
            <p>
              LPG PORTAL, kullanıcılarımız tarafından bu form aracılığıyla girilen kişisel ve kurumsal verileri sadece iletişim talebinin değerlendirilmesi sınırları içerisinde yüksek güvenlikli şifreli yerel depolama katmanında saklar. Bilgileriniz asla üçüncü taraflarla reklam amacıyla paylaşılmaz.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTACT FORM PANEL (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans">
                {language === "tr" ? "Bize Mesaj Gönderin" : "Send Us a Message"}
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Eşzamanlı e-posta gönderimi ve admin kontrol entegrasyonu ile iletinizi en geç 24 saat içinde cevaplayacağız.
              </p>
            </div>

            {/* Toast feedback */}
            {successToast && (
              <div className="animate-fade-in">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-[13px]">{successToast}</p>
                    <p className="text-[11px] text-emerald-600">İletişim talebiniz güvenle tescillendi.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ad Soyad */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "tr" ? "Ad Soyad" : "Full Name"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={language === "tr" ? "Örn: Caner Korkmaz" : "e.g. John Doe"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-sans"
                  />
                </div>

                {/* Telefon */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {language === "tr" ? "Telefon" : "Phone Number"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder={language === "tr" ? "Örn: 0507 123 4567" : "e.g. +90..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-sans"
                  />
                </div>
              </div>

              {/* E-Posta */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {language === "tr" ? "E-Posta Adresi" : "E-Mail Address"} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={language === "tr" ? "Örn: info@bireyselusta.com" : "e.g. mail@domain.com"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-sans"
                />
              </div>

              {/* Konu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {language === "tr" ? "İletişim Konusu" : "Subject Theme"} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-800"
                >
                  <option value="Genel Bilgi Talebi">{language === "tr" ? "Genel Bilgi Talebi" : "General Information"}</option>
                  <option value="Teknik Destek">{language === "tr" ? "Teknik Destek" : "Technical Support"}</option>
                  <option value="Bayilik Başvurusu">{language === "tr" ? "Bayilik Başvurusu" : "Dealer Application"}</option>
                  <option value="Kit Üreticisi Başvurusu">{language === "tr" ? "Kit Üreticisi Başvurusu" : "Kit Manufacturer Registration"}</option>
                  <option value="Reklam ve İş Birliği">{language === "tr" ? "Reklam ve İş Birliği" : "Advertising & Business Partnership"}</option>
                  <option value="Eğitim ve Kariyer">{language === "tr" ? "Eğitim ve Kariyer" : "Training & Careers"}</option>
                  <option value="Market Desteği">{language === "tr" ? "Market Desteği" : "Market Support"}</option>
                  <option value="Diğer">{language === "tr" ? "Diğer" : "Other"}</option>
                </select>
              </div>

              {/* Mesaj */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {language === "tr" ? "Mesajınız" : "Your Message"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder={language === "tr" ? "Talebinizi, araç marka ve modelini veya iş birliği fikirlerinizi buraya yazın..." : "Write down the request detail..."}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-4 text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none font-sans resize-y"
                />
              </div>

              {/* KVKK CHECKBOX */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="form-kvkk"
                  checked={formKvkk}
                  onChange={(e) => setFormKvkk(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer w-4 h-4"
                />
                <label htmlFor="form-kvkk" className="text-[11px] text-slate-500 select-none leading-relaxed">
                  <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                    KVKK Aydınlatma Metnini
                  </a>{" "}
                  {language === "tr" ? "okudum ve kabul ediyorum." : "I have read and agree to the KVKK context."}{" "}
                  <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!formKvkk}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-2 cursor-pointer ${
                    formKvkk 
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/10" 
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>{language === "tr" ? "Mesajı Gönder" : "Send Message"}</span>
                </button>
              </div>

            </form>

            {/* MY PAST REQUESTS TAB (Active User Only) */}
            {activeUser && (
              <div className="pt-6 border-t border-slate-150 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    {language === "tr" ? "Geçmiş Mesajlarım & Taleplerim" : "My History Requests"}
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full font-mono">
                    {messages.filter(msg => msg.userId === activeUser.id).length} Talepler
                  </span>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {messages.filter(msg => msg.userId === activeUser.id).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">Henüz bu hesaptan gönderilmiş bir mesaj bulunmamaktadır.</p>
                  ) : (
                    messages.filter(msg => msg.userId === activeUser.id).map(msg => (
                      <div key={msg.id} className="bg-slate-50 border border-slate-205 border-slate-200/60 p-3 rounded-2xl space-y-1.5 text-left text-xs leading-normal">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-700">{msg.category}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{msg.date}</span>
                        </div>
                        <p className="text-slate-605 text-slate-600 text-[11px] line-clamp-2">{msg.message}</p>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadgeClass(msg.status)}`}>
                            {msg.status}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">ID: {msg.id.slice(0, 10)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>



    </div>
  );
}
