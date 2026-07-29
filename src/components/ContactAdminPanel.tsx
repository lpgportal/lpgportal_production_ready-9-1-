import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { DbUser } from "../lib/membership";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Inbox, 
  Settings, 
  Plus, 
  Trash2, 
  Calendar, 
  X, 
  Check 
} from "lucide-react";
import { ContactMessage, ContactConfig } from "./Contact";

interface ContactAdminPanelProps {
  activeUser: DbUser | null;
}

export default function ContactAdminPanel({ activeUser }: ContactAdminPanelProps) {
  const { language } = useLanguage();
  const tLocal = (tr: string, en: string) => (language === "tr" ? tr : en);

  // 1. Load config
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

  // 2. Load messages
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

  // 3. Load notifications
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

  const [activeAdminTab, setActiveAdminTab] = useState<"messages" | "settings">("messages");
  const [msgFilter, setMsgFilter] = useState<string>("all");
  const [selectedMessageDetails, setSelectedMessageDetails] = useState<ContactMessage | null>(null);

  // Form states loaded from active config
  const [adminPhone, setAdminPhone] = useState(config.phone || "");
  const [adminEmail, setAdminEmail] = useState(config.email || "");
  const [adminAddress, setAdminAddress] = useState(config.address || "");
  const [adminWorkHours, setAdminWorkHours] = useState(config.workHours || "");
  const [adminInsta, setAdminInsta] = useState(config.instagram || "");
  const [adminFb, setAdminFb] = useState(config.facebook || "");
  const [adminLinkedin, setAdminLinkedin] = useState(config.linkedin || "");
  const [adminYoutube, setAdminYoutube] = useState(config.youtube || "");
  const [adminWhatsapp, setAdminWhatsapp] = useState(config.whatsapp || "");

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        if (key === "lpgportal_contact_messages") {
          setMessages(value);
        }
        if (key === "lpgportal_contact_notifications") {
          setAdminNotifications(value);
        }
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

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

  // Persist helpers
  const saveConfig = (newConfig: ContactConfig) => {
    setConfig(newConfig);
    localStorage.setItem("lpgportal_contact_config", JSON.stringify(newConfig));
    // Trigger global storage event for synchronization
    window.dispatchEvent(new Event("storage"));
  };

  const saveMessages = (newMsgs: ContactMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("lpgportal_contact_messages", JSON.stringify(newMsgs));
  };

  const handleUpdateMessageStatus = (id: string, newStatus: "Yeni Mesaj" | "İnceleniyor" | "Cevaplandı" | "Kapatıldı") => {
    const updated = messages.map(msg => msg.id === id ? { ...msg, status: newStatus } : msg);
    saveMessages(updated);
    if (selectedMessageDetails && selectedMessageDetails.id === id) {
      setSelectedMessageDetails({ ...selectedMessageDetails, status: newStatus });
    }
  };

  const handleDeleteMessage = (id: string) => {
    if (confirm(language === "tr" ? "Bu mesajı silmek istediğinize emin misiniz?" : "Delete message?")) {
      const filtered = messages.filter(msg => msg.id !== id);
      saveMessages(filtered);
      setSelectedMessageDetails(null);
    }
  };

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

  const filteredMessages = messages.filter(msg => {
    if (msgFilter === "all") return true;
    return msg.status === msgFilter;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* ADMIN CONSOLE / SECTION (ONLY ADMIN) */}
      <div id="admin-contact-console" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded animate-pulse">ADMIN</span>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-1.5 font-sans text-slate-100">
                <Inbox className="h-5 w-5 text-amber-500" />
                İletişim ve Mesaj Kontrol Paneli
              </h2>
            </div>
            <p className="text-slate-500 text-xs">Genel sitede paylaşılan telefon, çalışma saatleri, sosyal linkler ve müşteri mesaj yönetimi.</p>
          </div>

          {/* Sub-navigation tabs for admin */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveAdminTab("messages")}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition cursor-pointer ${
                activeAdminTab === "messages" 
                  ? "bg-amber-600 text-white" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Gelen Mesajlar ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveAdminTab("settings")}
              className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition cursor-pointer ${
                activeAdminTab === "settings" 
                  ? "bg-amber-600 text-white" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Özel İletişim Ayarları ⚙
            </button>
          </div>
        </div>

        {/* ACTIVE TAB: MESSAGES PANEL */}
        {activeAdminTab === "messages" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Filter and reset controls */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 mr-2 font-bold font-mono">DURUM FİLTRESİ:</span>
                <button
                  type="button"
                  onClick={() => setMsgFilter("all")}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    msgFilter === "all"
                      ? "bg-white text-slate-900 border-white"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  Hepsi ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMsgFilter("Yeni Mesaj")}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    msgFilter === "Yeni Mesaj"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-800 text-indigo-400 border-slate-700 hover:text-white"
                  }`}
                >
                  Yeni ({messages.filter(m => m.status === "Yeni Mesaj").length})
                </button>
                <button
                  type="button"
                  onClick={() => setMsgFilter("İnceleniyor")}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    msgFilter === "İnceleniyor"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-slate-800 text-amber-400 border-slate-700 hover:text-white"
                  }`}
                >
                  İnceleniyor ({messages.filter(m => m.status === "İnceleniyor").length})
                </button>
                <button
                  type="button"
                  onClick={() => setMsgFilter("Cevaplandı")}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    msgFilter === "Cevaplandı"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-800 text-emerald-400 border-slate-700 hover:text-white"
                  }`}
                >
                  Cevaplandı ({messages.filter(m => m.status === "Cevaplandı").length})
                </button>
                <button
                  type="button"
                  onClick={() => setMsgFilter("Kapatıldı")}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    msgFilter === "Kapatıldı"
                      ? "bg-slate-650 text-white border-slate-600"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  Kapatıldı ({messages.filter(m => m.status === "Kapatıldı").length})
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Tüm veri tabanındaki mesajları varsayılana sıfırlamak istiyor musunuz?")) {
                      localStorage.removeItem("lpgportal_contact_messages");
                      window.location.reload();
                    }
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-500 border border-rose-900/40 hover:bg-rose-950/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  İlk Veriyi Yükle
                </button>
              </div>
            </div>

            {/* MESSAGES LIST TABLE (HTML TABLE) */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900 text-slate-400 font-mono uppercase tracking-wider">
                      <th className="p-3">Tarih</th>
                      <th className="p-3">Gönderen</th>
                      <th className="p-3">İletişim Bilgisi</th>
                      <th className="p-3">Konu</th>
                      <th className="p-3">Kısa Mesaj</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                          Filtreye uygun kayıtlı mesaj bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.map(msg => (
                        <tr key={msg.id} className="hover:bg-slate-900/60 transition">
                          <td className="p-3 text-slate-400 font-mono whitespace-nowrap">{msg.date}</td>
                          <td className="p-3 font-bold text-slate-200">
                            <span className="block">{msg.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal">Rol: {msg.userId === "visitor" ? "Ziyaretçi" : "Kayıtlı Üye"}</span>
                          </td>
                          <td className="p-3 text-slate-300">
                            <span className="block">{msg.phone}</span>
                            <span className="block text-[10px] text-slate-500 font-mono">{msg.email}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-amber-400 font-semibold">{msg.category}</span>
                          </td>
                          <td className="p-3 text-slate-400 max-w-xs truncate">
                            {msg.message}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadgeClass(msg.status)}`}>
                              {msg.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedMessageDetails(msg)}
                                className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition cursor-pointer"
                              >
                                Detay & Yanıtla
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 text-rose-455 hover:bg-rose-950/40 rounded transition cursor-pointer"
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

            {/* ADMIN NOTIFICATION PREVIEW PANEL */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                🔑 Admin Bildirim Kütüğü ve E-Posta Gönderim Kuyruğu
              </span>
              <div className="font-mono text-[10px] text-slate-400 max-h-24 overflow-y-auto space-y-1 divide-y divide-slate-900/40">
                {adminNotifications.length === 0 ? (
                  <p className="italic text-slate-600">Kayıtlı sistem bildirimi bulunmamaktadır.</p>
                ) : (
                  adminNotifications.map((notif, index) => (
                    <p key={index} className="pt-1.5 text-slate-350 first:pt-0">
                      🔔 {notif}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE TAB: EDIT SYSTEM CONTACT CONFIG */}
        {activeAdminTab === "settings" && (
          <form onSubmit={handleSaveAdminConfig} className="space-y-6 animate-fade-in text-xs max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sol segment: Temel Bilgiler */}
              <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-500" />
                  Genel İletişim Detayları
                </h3>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Destek Telefon Numarası</label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Resmi E-Posta Adresi</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Adres / Merkez Lokasyon</label>
                  <input
                    type="text"
                    required
                    value={adminAddress}
                    onChange={(e) => setAdminAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Çalışma Gün & Saatleri</label>
                  <textarea
                    rows={2}
                    required
                    value={adminWorkHours}
                    onChange={(e) => setAdminWorkHours(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-white outline-none font-sans resize-none"
                  />
                </div>
              </div>

              {/* Sağ segment: Sosyal Medya Entegrasyonları */}
              <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-2 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  Sosyal Medya Link Entegrasyonları
                </h3>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Instagram Linki</label>
                  <input
                    type="url"
                    value={adminInsta}
                    onChange={(e) => setAdminInsta(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-[11px]"
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">Facebook Linki</label>
                  <input
                    type="url"
                    value={adminFb}
                    onChange={(e) => setAdminFb(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-[11px]"
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">LinkedIn Şirket Linki</label>
                  <input
                    type="url"
                    value={adminLinkedin}
                    onChange={(e) => setAdminLinkedin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-[11px]"
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">YouTube Kanalı</label>
                  <input
                    type="url"
                    value={adminYoutube}
                    onChange={(e) => setAdminYoutube(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-[11px]"
                    placeholder="https://"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block">WhatsApp Business Direkt API</label>
                  <input
                    type="text"
                    value={adminWhatsapp}
                    onChange={(e) => setAdminWhatsapp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-white outline-none font-mono text-[11px]"
                    placeholder="Örn: https://wa.me/905071545920"
                  />
                </div>
              </div>

            </div>

            {/* SUBMIT EDITS */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const fallbackConfig = {
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
                  saveConfig(fallbackConfig);
                  alert("Tüm telefon ve sosyal link ayarları varsayılana sıfırlandı.");
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Fabrika Ayarlarına Dön
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow-md transition cursor-pointer"
              >
                Ayarları Kaydet ve Yayına Al ✔
              </button>
            </div>

          </form>
        )}

      </div>

      {/* DETAIL MODAL FOR ADMIN TO REVIEW & CHANGE STATUS */}
      {selectedMessageDetails && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" id="admin-message-detail-modal">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-scale-up text-xs">
            
            <button
              type="button"
              onClick={() => setSelectedMessageDetails(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 bg-slate-800 p-2 rounded-full cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide float-right ${getStatusBadgeClass(selectedMessageDetails.status)}`}>
                {selectedMessageDetails.status}
              </span>
              <h3 className="text-base font-black text-slate-100 font-sans tracking-tight">🔎 İletişim Mesajı Detayları</h3>
              <p className="text-slate-400 text-xs mt-0.5">ID: {selectedMessageDetails.id}</p>
            </div>

            <hr className="border-slate-800" />

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold font-mono text-[10px] uppercase">GÖNDEREN ADI SOYADI</span>
                <p className="text-slate-200 font-bold text-sm">{selectedMessageDetails.name}</p>
                <span className="text-[10px] text-slate-500">Üye Türü: {selectedMessageDetails.userId === "visitor" ? "Anonim Ziyaretçi" : "LPG PORTAL Üyesi"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold font-mono text-[10px] uppercase">GÖNDERİM TARİHİ</span>
                <p className="text-slate-200 font-bold font-sm flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {selectedMessageDetails.date}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold font-mono text-[10px] uppercase">TELEFON NUMARASI</span>
                <a href={`tel:${selectedMessageDetails.phone}`} className="text-emerald-400 font-extrabold hover:underline block text-sm">
                  {selectedMessageDetails.phone}
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-bold font-mono text-[10px] uppercase">E-POSTA ADRESİ</span>
                <a href={`mailto:${selectedMessageDetails.email}`} className="text-emerald-400 font-extrabold hover:underline block break-all text-sm">
                  {selectedMessageDetails.email}
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase">KATEGORİ / KONU SEÇİMİ</span>
              <p className="text-amber-400 font-black text-sm bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 inline-block">
                {selectedMessageDetails.category}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase">ALINAN MÜŞTERİ MESAJI</span>
              <div className="bg-slate-950 p-4 rounded-xl text-slate-300 font-sans leading-relaxed whitespace-pre-wrap border border-slate-850">
                "{selectedMessageDetails.message}"
              </div>
            </div>

            {/* Action controls */}
            <div className="space-y-3.5 pt-2">
              <span className="text-slate-400 font-bold font-mono text-[10px] uppercase block">DURUMU GÜNCELLE & İŞLEM YAP</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessageDetails.id, "Yeni Mesaj")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    selectedMessageDetails.status === "Yeni Mesaj"
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-800 text-indigo-400 border-slate-750 hover:bg-slate-700"
                  }`}
                >
                  {selectedMessageDetails.status === "Yeni Mesaj" && <Check className="h-3.5 w-3.5" />}
                  <span>Yeni Mesaj</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessageDetails.id, "İnceleniyor")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    selectedMessageDetails.status === "İnceleniyor"
                      ? "bg-amber-600 text-white border-amber-500"
                      : "bg-slate-800 text-amber-400 border-slate-750 hover:bg-slate-700"
                  }`}
                >
                  {selectedMessageDetails.status === "İnceleniyor" && <Check className="h-3.5 w-3.5" />}
                  <span>İnceleniyor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessageDetails.id, "Cevaplandı")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    selectedMessageDetails.status === "Cevaplandı"
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-slate-800 text-emerald-400 border-slate-750 hover:bg-slate-700"
                  }`}
                >
                  {selectedMessageDetails.status === "Cevaplandı" && <Check className="h-3.5 w-3.5" />}
                  <span>Cevaplandı</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateMessageStatus(selectedMessageDetails.id, "Kapatıldı")}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                    selectedMessageDetails.status === "Kapatıldı"
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-slate-800 text-slate-400 border-slate-750/70 hover:bg-slate-700"
                  }`}
                >
                  {selectedMessageDetails.status === "Kapatıldı" && <Check className="h-3.5 w-3.5" />}
                  <span>Kapatıldı</span>
                </button>
              </div>

              {/* SIMULATED REPLY */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold block">📬 OPERATÖR YANITI SİMÜLATÖRÜ</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Seçilen e-posta adresine (<em className="text-emerald-400 select-all font-mono">{selectedMessageDetails.email}</em>) veya cep telefonuna mesaj bildirimlerini entegre şablondan anında gönderebilirsiniz. 
                </p>
                <div className="pt-2 flex gap-2">
                  <a
                    href={`mailto:${selectedMessageDetails.email}?subject=LPG PORTAL - ${encodeURIComponent(selectedMessageDetails.category)} Talebiniz Hakkında&body=Merhaba Sayın ${encodeURIComponent(selectedMessageDetails.name)},`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition text-center inline-block"
                  >
                    Müşteriye Doğrudan E-Posta Yaz (Gmail/Outlook)
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`${selectedMessageDetails.name} isimli kullanıcıya hızlı SMS / Portal bildirimi başarıyla kuyruğa alındı.`);
                      handleUpdateMessageStatus(selectedMessageDetails.id, "Cevaplandı");
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg transition inline-block cursor-pointer"
                  >
                    Hızlı Hazır Şablon İle Yanıtla & Kapat
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedMessageDetails(null)}
                className="text-xs bg-slate-800 hover:bg-slate-700 font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
