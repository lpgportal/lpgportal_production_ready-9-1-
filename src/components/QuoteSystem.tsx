import React, { useState, useEffect, useRef } from "react";
import { COMPANIES_DATA, MASTER_LPG_BRANDS, VEHICLES_DATA, getVehiclesDb } from "../data";
import { QuoteRequest, QuoteOffer, Vehicle } from "../types";
import { DbUser } from "../lib/membership";
import { TURKEY_DISTRICTS_DATA } from "../lib/turkey_districts";
import { useLanguage } from "../lib/LanguageContext";
import { 
  FileText, 
  MapPin, 
  Wrench, 
  Shield, 
  CheckCircle, 
  Clock, 
  Check, 
  Send, 
  Sparkles, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Users,
  Building,
  ShieldCheck,
  Bell,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Mail,
  PhoneCall
} from "lucide-react";

// Sort alphabetically for Turkish language sorting
const MASTER_BRANDS_SORTED = [...MASTER_LPG_BRANDS].sort((a, b) => a.localeCompare(b, 'tr'));

// Process log signature typing (İşlem Kaydı)
interface AuditLog {
  id: string;
  date: string;
  time: string;
  user: string;
  company: string;
  offer: string;
  status: string;
}

interface QuoteSystemProps {
  prepopulatedBrand: string;
  prepopulatedModel: string;
  prepopulatedYear: string;
  prepopulatedEngine: string;
  onClearPrepopulate: () => void;
  activeUser?: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

export default function QuoteSystem({
  prepopulatedBrand,
  prepopulatedModel,
  prepopulatedYear,
  prepopulatedEngine,
  onClearPrepopulate,
  activeUser = null,
  onNavigateToTab
}: QuoteSystemProps) {
  const { language, translateEntity } = useLanguage();
  const tLocal = (tr: string, en: string) => (language === "tr" ? tr : en);

  const activeRole = "owner" as "owner" | "company" | "admin";

  // Local Storage State Hookups
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; type: string }[]>([]);

  // Newly submitted quote request form fields
  const [userFirstName, setUserFirstName] = useState(() => {
    if (activeUser) {
      const parts = activeUser.name.trim().split(/\s+/);
      return parts[0] || "";
    }
    return "";
  });
  const [userLastName, setUserLastName] = useState(() => {
    if (activeUser) {
      const parts = activeUser.name.trim().split(/\s+/);
      return parts.slice(1).join(" ") || "";
    }
    return "";
  });
  const [userPhone, setUserPhone] = useState(activeUser?.phone || "");
  const [userEmail, setUserEmail] = useState(activeUser?.email || "");
  const [userCity, setUserCity] = useState("İstanbul");
  const [userDistrict, setUserDistrict] = useState("");
  const [brand, setBrand] = useState(prepopulatedBrand || "");
  const [model, setModel] = useState(prepopulatedModel || "");
  const [year, setYear] = useState(prepopulatedYear || "");
  const [engine, setEngine] = useState(prepopulatedEngine || "");
  const [fuelType, setFuelType] = useState("");
  const [kilometer, setKilometer] = useState("");
  const [preferredBrand, setPreferredBrand] = useState("");

  const [vehiclesDb, setVehiclesDb] = useState<Vehicle[]>(() => getVehiclesDb());

  const carBrands = React.useMemo(() => {
    return Array.from(new Set(vehiclesDb.map(v => v.brand))).sort();
  }, [vehiclesDb]);

  const getYearsForModel = (brandName: string, modelName: string) => {
    const currentYear = new Date().getFullYear(); // 2026
    const startYear = 1995;
    const years = [];
    for (let y = currentYear; y >= startYear; y--) {
      years.push(String(y));
    }
    return years;
  };

  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const brandSuggestionsRef = useRef<HTMLDivElement>(null);
  const modelSuggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem("lpgportal_vehicles_db");
        if (saved) {
          const parsed = JSON.parse(saved);
          setVehiclesDb(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }
      } catch (e) {}
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("lpgportal_db_update", handleSync as any);
    const interval = setInterval(handleSync, 1500);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("lpgportal_db_update", handleSync as any);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandSuggestionsRef.current && !brandSuggestionsRef.current.contains(event.target as Node)) {
        setShowBrandSuggestions(false);
      }
      if (modelSuggestionsRef.current && !modelSuggestionsRef.current.contains(event.target as Node)) {
        setShowModelSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeUser) {
      const parts = activeUser.name.trim().split(/\s+/);
      setUserFirstName(parts[0] || "");
      setUserLastName(parts.slice(1).join(" ") || "");
      setUserPhone(activeUser.phone || "");
      setUserEmail(activeUser.email || "");
    } else {
      setUserFirstName("");
      setUserLastName("");
      setUserPhone("");
      setUserEmail("");
    }
  }, [activeUser]);

  // Searchable Multi-select dropdown states
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const [showCustomPreferredInput, setShowCustomPreferredInput] = useState(false);
  const [customPreferredValue, setCustomPreferredValue] = useState("");

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;
        // Open upward if space below is too small and there is more space above
        if (spaceBelow < 260 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, { passive: true });
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  // Active Car Owner Selected Request ID (for detailing)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Custom simulation company states (Firma Teklif Paneli)
  const [selectedRequestForBid, setSelectedRequestForBid] = useState<QuoteRequest | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidKitBrand, setBidKitBrand] = useState("Atiker");
  const [bidNotes, setBidNotes] = useState("");
  const [bidWarranty, setBidWarranty] = useState("2");
  const [bidDuration, setBidDuration] = useState("1 Gün");
  const [selectedBiddingCompany, setSelectedBiddingCompany] = useState(COMPANIES_DATA[0]?.id || "comp_1");

  // Shared state for interactive alerts (automatic notifications such as Email/SMS simulation)
  const [smsAlert, setSmsAlert] = useState<{ recipient: string; title: string; content: string } | null>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Initialize dataset on load from local storage or pre-populate with mock data
  useEffect(() => {
    const savedRequests = localStorage.getItem("lpgportal_quote_requests");
    const savedAuditLogs = localStorage.getItem("lpgportal_quote_audit_logs");
    const savedNotifications = localStorage.getItem("lpgportal_quote_notifications");

    const initialRequests: QuoteRequest[] = [];

    const initialLogs: AuditLog[] = [];

    const initialNotifs: any[] = [];

    if (savedRequests) {
      try {
        setRequests(JSON.parse(savedRequests));
      } catch (e) {
        setRequests(initialRequests);
      }
    } else {
      setRequests(initialRequests);
      localStorage.setItem("lpgportal_quote_requests", JSON.stringify(initialRequests));
    }

    if (savedAuditLogs) {
      try {
        setAuditLogs(JSON.parse(savedAuditLogs));
      } catch (e) {
        setAuditLogs(initialLogs);
      }
    } else {
      setAuditLogs(initialLogs);
      localStorage.setItem("lpgportal_quote_audit_logs", JSON.stringify(initialLogs));
    }

    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        setNotifications(initialNotifs);
      }
    } else {
      setNotifications(initialNotifs);
      localStorage.setItem("lpgportal_quote_notifications", JSON.stringify(initialNotifs));
    }
  }, []);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        if (key === "lpgportal_quote_requests") setRequests(value);
        if (key === "lpgportal_quote_audit_logs") setAuditLogs(value);
        if (key === "lpgportal_quote_notifications") setNotifications(value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  // Sync state helpers to localStorage
  const saveRequestsToStorage = (updated: QuoteRequest[]) => {
    setRequests(updated);
    localStorage.setItem("lpgportal_quote_requests", JSON.stringify(updated));
  };

  const addAuditLog = (user: string, company: string, offer: string, status: string) => {
    const today = new Date();
    const dateStr = today.toLocaleDateString("tr-TR");
    const timeStr = today.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const newLog: AuditLog = {
      id: "LOG-" + Date.now().toString().slice(-4),
      date: dateStr,
      time: timeStr,
      user,
      company,
      offer,
      status
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    localStorage.setItem("lpgportal_quote_audit_logs", JSON.stringify(updated));
  };

  const addAdminNotification = (text: string, type: string) => {
    const today = new Date();
    const timeStr = today.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const newNotif = {
      id: "NT-" + Date.now(),
      text,
      time: timeStr,
      type
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    localStorage.setItem("lpgportal_quote_notifications", JSON.stringify(updated));
  };

  // Watch for prepopulation changes
  useEffect(() => {
    if (prepopulatedBrand) {
      setBrand(prepopulatedBrand);
      setModel(prepopulatedModel);
      setYear(prepopulatedYear);
      setEngine(prepopulatedEngine);
    }
  }, [prepopulatedBrand, prepopulatedModel, prepopulatedYear, prepopulatedEngine]);

  const selectedBrands = preferredBrand === "Fark Etmez" || preferredBrand === ""
    ? []
    : preferredBrand.split(",").map(b => b.trim()).filter(Boolean);

  // Step 1: User submits their demand
  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) {
      alert("Giriş yapmanız veya üye olmanız gerekmektedir.");
      onNavigateToTab?.("giris");
      return;
    }

    if (!userFirstName || !userLastName || !userPhone || !brand || !model) {
      alert("Lütfen araç ve iletişim bilgilerini eksiksiz doldurun.");
      return;
    }

    const reqId = "REQ-" + Math.floor(1000 + Math.random() * 9000);
    const fullName = `${userFirstName} ${userLastName}`;

    const newRequest: QuoteRequest = {
      id: reqId,
      userId: activeUser.id,
      userName: fullName,
      userFirstName,
      userLastName,
      userPhone,
      userEmail: userEmail || `${userFirstName.toLowerCase()}@gmail.com`,
      userCity,
      userDistrict: userDistrict || "Merkez",
      brand,
      model,
      year,
      engine,
      fuelType,
      preferredBrand,
      kilometer,
      status: "Beklemede",
      created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
      updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
      offers: []
    };

    const updated = [newRequest, ...requests];
    saveRequestsToStorage(updated);
    setSelectedRequestId(newRequest.id);

    // Record audit log
    addAuditLog(fullName, "-", "-", "Talep Oluşturuldu");

    // Clear form states
    setUserFirstName("");
    setUserLastName("");
    setUserPhone("");
    setUserEmail("");
    setUserDistrict("");
    setKilometer("");
    setPreferredBrand("");

    // Switch to step details
    onClearPrepopulate();

    // TRIGGER AN AUTOMATED SERVICE BID SIMULATION after 3 seconds so the client instantly gets feedback!
    setTimeout(() => {
      // Find updated list to append
      const currentStored = JSON.parse(localStorage.getItem("lpgportal_quote_requests") || "[]") as QuoteRequest[];
      const requestToUpdate = currentStored.find(r => r.id === reqId);
      if (requestToUpdate) {
        const matchingCompany = COMPANIES_DATA.find(c => c.city === userCity) || COMPANIES_DATA[0];
        
        const autoOffer: QuoteOffer = {
          id: "OFF-" + Math.floor(2000 + Math.random() * 8000),
          companyId: matchingCompany.id,
          companyName: matchingCompany.company_name,
          companyContactName: "Kemal Güven (Şef Montör)",
          companyPhone: matchingCompany.phone || "0850 305 1254",
          companyEmail: matchingCompany.email || "info@tseotogaz.com",
          kitBrandProposed: selectedBrands.length > 0 ? selectedBrands[0] : "Lovato Smart",
          price: userCity === "İstanbul" ? 21500 : 19000,
          warrantyYears: 2,
          warrantyInfo: "2 Yıl TSE Onaylı Garanti",
          installationDuration: "8 Saat",
          installmentOptions: "Kredi Kartına Vade Farksız 6 Taksit",
          notes: "TSE ve montaj test prosedürleri dahil anahtar teslim teklifimizdir. Sübap koruma yazılımı ücretsiz entegre edilecektir.",
          rating: matchingCompany.rating,
          created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
          status: "Beklemede"
        };

        requestToUpdate.offers.push(autoOffer);
        requestToUpdate.status = "Firma Teklif Verdi";
        requestToUpdate.updated_at = new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' });

        // Save
        const nextList = currentStored.map(r => r.id === reqId ? requestToUpdate : r);
        setRequests(nextList);
        localStorage.setItem("lpgportal_quote_requests", JSON.stringify(nextList));

        // Logs and notifications
        addAuditLog(fullName, matchingCompany.company_name, `${autoOffer.kitBrandProposed} (${autoOffer.price} TL)`, "Firma Teklif Verdi");
        addAdminNotification(`Yeni teklif iletildi! Talep: ${reqId}, Firma: ${matchingCompany.company_name}`, " teklif");

        // TRIGGER AUTOMATED USER NOTIFICATION (Mail/SMS simulation alert)
        setSmsAlert({
          recipient: fullName,
          title: "✉️ Yeni Fiyat Teklifi Geldi!",
          content: `Sayın ${fullName}, aracınız için firmalardan ${autoOffer.price} TL tutarında ${autoOffer.kitBrandProposed} kiti teklifi gelmiştir. Detaylar ve montör kalifikasyonları korumalı teklif ekranınızda listelenmiştir. (Not: Karşılıklı telefon numaraları gizlidir).`
        });
      }
    }, 3200);
  };

  // Step 2: Company/Dealer submits a custom blind bid
  const handleCompanySubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForBid) {
      alert("Lütfen teklif vermek istediğiniz talebi seçiniz.");
      return;
    }
    if (!bidPrice || isNaN(Number(bidPrice))) {
      alert("Lütfen geçerli bir teklif tutarı giriniz.");
      return;
    }

    const companyObject = COMPANIES_DATA.find(c => c.id === selectedBiddingCompany) || COMPANIES_DATA[0];

    const newOffer: QuoteOffer = {
      id: "OFF-" + Math.floor(3000 + Math.random() * 7000),
      companyId: companyObject.id,
      companyName: companyObject.company_name,
      companyContactName: "Ahmet Yetkin (Yönetici)",
      companyPhone: companyObject.phone || "0555 999 8877",
      companyEmail: companyObject.email || "destek@bayiotogaz.com",
      kitBrandProposed: bidKitBrand,
      price: Number(bidPrice),
      warrantyYears: Number(bidWarranty),
      warrantyInfo: `${bidWarranty} Yıl Distribütör Güvenceli`,
      installationDuration: bidDuration,
      installmentOptions: "Kredi Kartına 9 Peşin Fiyatına Taksit",
      notes: bidNotes || "Uzman mühendis kadromuzla bilgisayarlı yol ayarı entegreli otogaz tescil garantili montaj servisimiz.",
      rating: companyObject.rating,
      created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
      status: "Beklemede"
    };

    const targetReq = requests.find(r => r.id === selectedRequestForBid.id);
    if (targetReq) {
      const updatedReq = {
        ...targetReq,
        status: "Firma Teklif Verdi",
        offers: [...targetReq.offers, newOffer]
      };

      const updatedRequests = requests.map(r => r.id === targetReq.id ? updatedReq : r);
      saveRequestsToStorage(updatedRequests);

      // Trigger Audit logs & Admin notifications
      addAuditLog(targetReq.userName, companyObject.company_name, `${newOffer.kitBrandProposed} (${newOffer.price} TL)`, "Firma Teklif Verdi");
      addAdminNotification(`Yeni Teklif Geldi! Talep: ${targetReq.id} nolu araç için ${companyObject.company_name} fiyat verdi.`, "teklif");

      // Auto Send SMS simulation to owner
      setSmsAlert({
        recipient: targetReq.userName,
        title: "✉️ LPGPORTAL: Yeni Fiyat Teklifi!",
        content: `Sayın ${targetReq.userName}, ${companyObject.company_name} size ${newOffer.price} TL değerinde ${newOffer.kitBrandProposed} teklifi sundu! Açıklama: "${newOffer.notes}".`
      });

      // Clear input state
      setBidPrice("");
      setBidNotes("");
      setSelectedRequestForBid(null);
      alert("Teklifiniz blind sistem üzerinden başarıyla iletilmiştir. Araç sahibinin onayı bekleniyor.");
    }
  };

  // Step 3: Owner accepts or rejects a specific offer
  const handleOwnerActionOnOffer = (requestId: string, offer: QuoteOffer, action: "onayla" | "reddet") => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    if (action === "onayla") {
      const updatedOffers = targetReq.offers.map(off => {
        if (off.id === offer.id) {
          return { ...off, status: "Onaylandı" };
        }
        return { ...off, status: "Reddedildi" };
      });

      const updatedReq: QuoteRequest = {
        ...targetReq,
        status: "Kullanıcı Onayladı",
        offers: updatedOffers
      };

      const updatedRequests = requests.map(r => r.id === requestId ? updatedReq : r);
      saveRequestsToStorage(updatedRequests);

      // Logs & admin alerting
      addAuditLog(targetReq.userName, offer.companyName, `${offer.kitBrandProposed} (${offer.price} TL)`, "Kullanıcı Onayladı");
      addAdminNotification(`Kullanıcı Onayladı! ${targetReq.id} nolu araç sahibi ${offer.companyName} teklifini kabul etti. Eşleştirme bekliyor.`, "onay");

      alert("Teklifi onayladınız! İletişim bilgilerinizin paylaşılması için talep Yönetici (Admin) onayına iletilmiştir. Kısa süre içinde eşleşme tamamlanacaktır.");
    } else {
      // Reject
      const updatedOffers = targetReq.offers.map(off => {
        if (off.id === offer.id) return { ...off, status: "Reddedildi" };
        return off;
      });

      const updatedReq: QuoteRequest = {
        ...targetReq,
        offers: updatedOffers
      };

      const updatedRequests = requests.map(r => r.id === requestId ? updatedReq : r);
      saveRequestsToStorage(updatedRequests);
      addAuditLog(targetReq.userName, offer.companyName, `${offer.kitBrandProposed}`, "Teklif Reddedildi");
    }
  };

  // Step 4: Admin matches the consumer and dealer
  const handleAdminMatch = (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const acceptedOffer = targetReq.offers.find(o => o.status === "Onaylandı");
    if (!acceptedOffer) {
      alert("Eşleştirme yapabilmek için araç sahibinin önce bir teklifi onaylamış olması gerekmektedir.");
      return;
    }

    const updatedReq: QuoteRequest = {
      ...targetReq,
      status: "Eşleştirildi"
    };

    const updatedRequests = requests.map(r => r.id === requestId ? updatedReq : r);
    saveRequestsToStorage(updatedRequests);

    // Audit logs & notifications
    addAuditLog(targetReq.userName, acceptedOffer.companyName, `${acceptedOffer.kitBrandProposed}`, "Eşleştirildi");
    addAdminNotification(`Eşleştirme Tamamlandı! Talep No: ${requestId} için araç sahibi ve firma eşleştirildi.`, "match");

    // Double-sided contact trigger simulation (Araç sahibine ve firmaya karşılıklı iletişim yollama)
    setSmsAlert({
      recipient: `${targetReq.userName} (Müşteri) & ${acceptedOffer.companyName} (Firma)`,
      title: "📞 LPGPORTAL ÇİFT TARAFLI EŞLEŞME TAMAMLANDI!",
      content: `ARAÇ SAHİBİNE İLETİLEN: Sayın ${targetReq.userName}, onayladığınız ${acceptedOffer.companyName} firması iletişim bilgileri: Yetkili: ${acceptedOffer.companyContactName || "Ahmet Usta"}, Tel: ${acceptedOffer.companyPhone || "0555 XXXXXXX"}, E-posta: ${acceptedOffer.companyEmail || "destek@servis.com"}. \x0A\x0AFİRMAYA İLETİLEN: Sayın ${acceptedOffer.companyName}, ${targetReq.brand} ${targetReq.model} teklifinizi onaylayan müşterinin iletişim bilgileri: İsim: ${targetReq.userName}, Tel: ${targetReq.userPhone}, E-posta: ${targetReq.userEmail}.`
    });

    alert("İki taraf başarıyla eşleştirildi! İletişim bilgileri otomatik SMS ve E-posta yoluyla iki tarafa da anında iletildi.");
  };

  const handleAdminComplete = (requestId: string) => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const acceptedOffer = targetReq.offers.find(o => o.status === "Onaylandı") || targetReq.offers[0];

    const updatedReq: QuoteRequest = {
      ...targetReq,
      status: "Tamamlandı"
    };

    const updatedRequests = requests.map(r => r.id === requestId ? updatedReq : r);
    saveRequestsToStorage(updatedRequests);

    addAuditLog(targetReq.userName, acceptedOffer?.companyName || "-", acceptedOffer?.kitBrandProposed || "-", "Tamamlandı");
    alert("Talep süreci başarıyla 'Tamamlandı' olarak işaretlendi.");
  };

  // Math/Stats calculations
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "Beklemede").length;
  const approvedRequests = requests.filter(r => r.status === "Kullanıcı Onayladı").length;
  const matchedRequests = requests.filter(r => r.status === "Eşleştirildi").length;
  const completedRequests = requests.filter(r => r.status === "Tamamlandı").length;

  return (
    <div id="ote-teklif-al" className="bg-white text-slate-900 rounded-3xl border border-slate-200 shadow-sm overflow-hidden max-w-6xl mx-auto">
      


      {/* Simulated SMS/E-mail notification tray */}
      {smsAlert && (
        <div className="bg-emerald-950 text-emerald-100 p-4 border-b border-emerald-900 flex items-start gap-3 animate-fade-in text-xs">
          <Mail className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                {smsAlert.title} (Alıcı: {smsAlert.recipient})
              </strong>
              <button 
                onClick={() => setSmsAlert(null)}
                className="text-emerald-400 hover:text-emerald-250 font-bold underline text-[10px]"
              >
                Kapat
              </button>
            </div>
            <p className="leading-relaxed font-mono whitespace-pre-wrap">{smsAlert.content}</p>
          </div>
        </div>
      )}

      {/* VIEW 1: ARAÇ SAHİBİ (CAR OWNER) INTERFACE */}
      {activeRole === "owner" && (
        <div className="p-6 sm:p-10 space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form column (Left) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-slate-150 p-6 rounded-2xl bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-extrabold text-lg text-slate-900 font-sans tracking-tight">
                    LPG Dönüşüm Teklifi Al
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  LPGPORTAL merkezi marka veritabanını tarayarak, iletişim bilgilerinizi tamamen koruyan kapalı ihale formatında bölge bayilerinden blind teklif alın.
                </p>

                {prepopulatedBrand && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-150 p-3 rounded-lg flex justify-between items-center text-xs animate-fade-in">
                    <span className="text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      {language === "tr" ? "LPG Uyumluluktan yönlendirildi:" : "Redirected from LPG Compatibility:"} <strong>{prepopulatedBrand} {prepopulatedModel}</strong>
                    </span>
                    <button 
                      type="button" 
                      onClick={onClearPrepopulate}
                      className="text-slate-500 hover:text-slate-800 underline font-semibold"
                    >
                      {language === "tr" ? "Temizle" : "Clear"}
                    </button>
                  </div>
                )}

                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Adınız *" : "First Name *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Adı" : "First Name"}
                        value={userFirstName}
                        onChange={(e) => setUserFirstName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Soyadınız *" : "Last Name *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Soyadı" : "Last Name"}
                        value={userLastName}
                        onChange={(e) => setUserLastName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Telefon No *" : "Phone No *"}</label>
                      <input
                        type="tel"
                        required
                        placeholder={language === "tr" ? "Örn: 0532XXXXXXX" : "e.g. 532XXXXXXX"}
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "E-posta adresi" : "Email address"}</label>
                      <input
                        type="email"
                        placeholder={language === "tr" ? "isim@adres.com" : "name@address.com"}
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative text-left" ref={brandSuggestionsRef}>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Araç Markası *" : "Vehicle Brand *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Örn: Toyota, Fiat" : "e.g. Toyota, Fiat"}
                        value={brand}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBrand(val);
                          const matched = carBrands.filter(b => b.toLowerCase().includes(val.toLowerCase()));
                          setBrandSuggestions(matched);
                          setShowBrandSuggestions(true);
                        }}
                        onFocus={() => {
                          setBrandSuggestions(carBrands);
                          setShowBrandSuggestions(true);
                        }}
                        onClick={() => {
                          setBrandSuggestions(carBrands);
                          setShowBrandSuggestions(true);
                        }}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                      {showBrandSuggestions && brandSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                          {brandSuggestions.map((b) => (
                            <div
                              key={b}
                              onClick={() => {
                                  setBrand(b);
                                  setModel("");
                                  setYear("");
                                  setShowBrandSuggestions(false);
                              }}
                              className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 cursor-pointer font-sans text-left"
                            >
                              {b}
                            </div>
                          ))}
                          <div
                            onClick={() => {
                              setShowBrandSuggestions(false);
                            }}
                            className="px-3 py-2 text-xs text-amber-600 hover:bg-slate-50 cursor-pointer font-sans font-bold border-t border-slate-100 text-left"
                          >
                            ➕ Listede Yok Mu? Kendi Bilgilerini Gir
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative text-left" ref={modelSuggestionsRef}>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Araç Modeli *" : "Vehicle Model *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Örn: Corolla, Civic" : "e.g. Corolla, Civic"}
                        value={model}
                        onChange={(e) => {
                          const val = e.target.value;
                          setModel(val);
                          const brandModels = vehiclesDb.filter(v => v.brand.toLowerCase() === brand.toLowerCase()).map(v => v.model);
                          const matched = ([...new Set(brandModels)] as string[]).filter(m => m.toLowerCase().includes(val.toLowerCase()));
                          setModelSuggestions(matched);
                          setShowModelSuggestions(true);
                        }}
                        onFocus={() => {
                          const brandModels = vehiclesDb.filter(v => v.brand.toLowerCase() === brand.toLowerCase()).map(v => v.model);
                          setModelSuggestions([...new Set(brandModels)] as string[]);
                          setShowModelSuggestions(true);
                        }}
                        onClick={() => {
                          const brandModels = vehiclesDb.filter(v => v.brand.toLowerCase() === brand.toLowerCase()).map(v => v.model);
                          setModelSuggestions([...new Set(brandModels)] as string[]);
                          setShowModelSuggestions(true);
                        }}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                      {showModelSuggestions && modelSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                          {modelSuggestions.map((m) => (
                            <div
                              key={m}
                              onClick={() => {
                                setModel(m);
                                setShowModelSuggestions(false);
                                setYear("");
                              }}
                              className="px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-emerald-700 cursor-pointer font-sans text-left"
                            >
                              {m}
                            </div>
                          ))}
                          <div
                            onClick={() => {
                              setShowModelSuggestions(false);
                            }}
                            className="px-3 py-2 text-xs text-amber-600 hover:bg-slate-50 cursor-pointer font-sans font-bold border-t border-slate-100 text-left"
                          >
                            ➕ Listede Yok Mu? Kendi Bilgilerini Gir
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Model Yılı *" : "Model Year *"}</label>
                      <select
                        required
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans cursor-pointer"
                      >
                        <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
                        {getYearsForModel(brand, model).map((yr) => (
                          <option key={yr} value={yr}>{yr}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Yakıt Türü *" : "Fuel Type *"}</label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      >
                        <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
                        <option value="Benzin">{language === "tr" ? "Benzin" : "Gasoline"}</option>
                        <option value="Benzin / Hibrit">{language === "tr" ? "Benzin+Hibrit" : "Gasoline+Hybrid"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Kilometre *" : "Mileage *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Örn: 45.000" : "e.g. 45,000"}
                        value={kilometer}
                        onChange={(e) => setKilometer(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Motor Tipi *" : "Engine Type *"}</label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Örn: 1.6 Atmosferik" : "e.g. 1.6 Naturally Aspired"}
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "Teklif Alınacak İl" : "Province for Bid"}</label>
                      <select
                        value={userCity}
                        onChange={(e) => setUserCity(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                      >
                        {Object.keys(TURKEY_DISTRICTS_DATA).sort((a, b) => a.localeCompare(b, "tr")).map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "İlçe" : "District"}</label>
                    <input
                      type="text"
                      placeholder={language === "tr" ? "Örn: Kadıköy, Osmangazi" : "e.g. Kadikoy, Osmangazi"}
                      value={userDistrict}
                      onChange={(e) => setUserDistrict(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans"
                    />
                  </div>

                  {/* Searchable dropdown preferred brands inside QuoteSystem */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">{language === "tr" ? "İstediğiniz Özel Marka(lar)" : "Preferred Brand(s)"}</label>
                    <div 
                      onClick={() => setIsOpen(!isOpen)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus-within:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 cursor-pointer flex flex-wrap gap-1 items-center justify-between min-h-[38px] transition"
                    >
                      <div className="flex flex-wrap gap-1 items-center flex-1 pr-2">
                        {selectedBrands.length === 0 ? (
                          <span className="text-slate-400">{language === "tr" ? "Fark Etmez (Usta Tavsiyesi)" : "Any (Expert Recommendation)"}</span>
                        ) : (
                          selectedBrands.map((bName) => (
                            <span 
                              key={bName}
                              className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1 hover:bg-emerald-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSel = selectedBrands.filter(b => b !== bName);
                                setPreferredBrand(newSel.length > 0 ? newSel.join(", ") : "Fark Etmez");
                              }}
                            >
                              {bName}
                              <X className="h-3 w-3 inline hover:text-red-500" />
                            </span>
                          ))
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>

                    {isOpen && (
                      <div className={`absolute z-50 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 space-y-2 max-w-full ${openUpward ? "bottom-full mb-2" : "top-full mt-1"}`}>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-150 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none font-sans"
                            placeholder={language === "tr" ? "Marka aratın..." : "Search brand..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto space-y-1">
                          <div
                            onClick={() => {
                              setPreferredBrand("Fark Etmez");
                              setSearchQuery("");
                              setIsOpen(false);
                            }}
                            className={`flex items-center justify-between px-2 py-2 rounded text-xs cursor-pointer ${
                              selectedBrands.length === 0 ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50"
                            }`}
                          >
                            <span>Fark Etmez (Usta Tavsiyesi)</span>
                            {selectedBrands.length === 0 && <Check className="h-3 w-3 text-emerald-600" />}
                          </div>

                          {MASTER_BRANDS_SORTED.filter(b => b.toLowerCase().includes(searchQuery.toLowerCase())).map((bName) => {
                            const isCh = selectedBrands.includes(bName);
                            return (
                              <div
                                key={bName}
                                onClick={() => {
                                  const nextArr = isCh 
                                    ? selectedBrands.filter(s => s !== bName)
                                    : [...selectedBrands, bName];
                                  setPreferredBrand(nextArr.length > 0 ? nextArr.join(", ") : "Fark Etmez");
                                }}
                                className={`flex items-center justify-between px-2 py-2 rounded text-xs cursor-pointer ${
                                  isCh ? "bg-emerald-50 text-emerald-800 font-bold" : "hover:bg-slate-50"
                                }`}
                              >
                                <span>{bName}</span>
                                {isCh && <Check className="h-3 w-3 text-emerald-600" />}
                              </div>
                            );
                          })}
                          
                          <div
                            onClick={() => {
                              setShowCustomPreferredInput(true);
                              setIsOpen(false);
                            }}
                            className="flex items-center justify-between px-2 py-2 rounded text-xs text-amber-600 font-bold hover:bg-slate-50 cursor-pointer border-t border-slate-100 text-left"
                          >
                            <span>➕ Listede Yok Mu? Kendi Bilgilerini Gir</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {showCustomPreferredInput && (
                    <div className="mt-2 animate-fade-in text-left">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500">{language === "tr" ? "Manuel Marka Girişi" : "Manual Brand Entry"}</label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomPreferredInput(false);
                            setCustomPreferredValue("");
                            setPreferredBrand("Fark Etmez");
                          }}
                          className="text-[9px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          {language === "tr" ? "Listeye Dön" : "Back to List"}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={customPreferredValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomPreferredValue(val);
                          setPreferredBrand(val);
                        }}
                        placeholder={language === "tr" ? "Tercih ettiğiniz markayı yazın..." : "Write preferred brand..."}
                        className="w-full bg-white border border-amber-300 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none transition font-sans font-bold"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition transform hover:scale-[1.01]"
                  >
                    Teklif Talebini Gönder (Kişisel Bilgilar Gizlenir)
                  </button>
                </form>
              </div>
            </div>

            {/* Demands / Offers List (Right) */}
            {(() => {
              const userRequests = requests.filter(r => activeUser && r.userId === activeUser.id);
              return (
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Gönderdiğiniz Taleplerim & Gelen Teklifler
                    </h4>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
                      Sistem Geneli Talep Havuzu: {requests.length} Adet
                    </span>
                  </div>

                  {userRequests.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-150 text-slate-400 text-xs">
                      Henüz bir teklif talebi göndermediniz. Soldaki form aracılığıyla hemen ilk talebinizi oluşturun!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Select box for viewing demand details */}
                      <div className="flex flex-wrap gap-2">
                        {userRequests.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedRequestId(r.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                              selectedRequestId === r.id 
                                ? "bg-slate-900 border-slate-900 text-white" 
                                : "bg-white border-slate-200 text-slate-700 hover:border-slate-350"
                            }`}
                          >
                            <span>{r.brand} {r.model} ({r.id})</span>
                            <span className={`h-2 w-2 rounded-full ${
                              r.status === "Tamamlandı" || r.status === "Eşleştirildi"
                                ? "bg-emerald-500" 
                                : r.status === "Kullanıcı Onayladı"
                                  ? "bg-blue-500 animate-pulse"
                                  : "bg-amber-500 animate-pulse"
                            }`} />
                          </button>
                        ))}
                      </div>

                      {/* Active selected demand detail panel */}
                      {(() => {
                        const req = userRequests.find(r => r.id === selectedRequestId) || userRequests[0];
                        if (!req) return null;

                    return (
                      <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                        
                        {/* Request Header */}
                        <div className="bg-slate-50 p-5 border-b border-slate-150 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{language === "tr" ? "TALEP KARTI" : "REQUEST DETAIL CARD"}</span>
                            <h5 className="font-bold text-slate-800 text-sm">
                              {req.brand} {req.model} ({req.year})
                            </h5>
                            <p className="text-slate-500">
                              {language === "tr" ? "Dönüşüm Bölgesi" : "Conversion Area"}: <strong>{req.userCity}, {req.userDistrict || (language === "tr" ? "Merkez" : "Center")}</strong> | {language === "tr" ? "Yakıt" : "Fuel"}: {req.fuelType || (language === "tr" ? "Benzin" : "Gasoline")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">{language === "tr" ? "DURUM" : "STATUS"}</span>
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              req.status === "Tamamlandı" || req.status === "Eşleştirildi"
                                ? "bg-emerald-100 text-emerald-800" 
                                : req.status === "Kullanıcı Onayladı"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}>
                              {language === "tr" ? req.status : 
                               req.status === "Tamamlandı" ? "Completed" : 
                               req.status === "Eşleştirildi" ? "Matched" : 
                               req.status === "Kullanıcı Onayladı" ? "User Approved" : 
                               req.status === "Teklifler Geldi" ? "Offers Received" :
                               req.status === "Beklemede" ? "Pending" : req.status}
                            </span>
                          </div>
                        </div>

                        {/* Request content properties */}
                        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/20 text-xs border-b border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-mono">{language === "tr" ? "Motor" : "Engine"}</span>
                            <strong className="text-slate-700">{req.engine}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-mono">{language === "tr" ? "Kilometre" : "Mileage"}</span>
                            <strong className="text-slate-700">{req.kilometer ? `${req.kilometer} KM` : (language === "tr" ? "Belirtilmedi" : "Not Specified")}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-mono">{language === "tr" ? "Marka Tercihi" : "Brand Preference"}</span>
                            <strong className="text-slate-700">{req.preferredBrand}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-mono">{language === "tr" ? "Talep No" : "Request ID"}</span>
                            <strong className="text-emerald-700 font-mono font-bold">{req.id}</strong>
                          </div>
                        </div>

                        {/* Offers section */}
                        <div className="p-5 space-y-4">
                          <h6 className="font-bold text-slate-850 text-xs tracking-wider uppercase font-mono">
                            GELEN BLIND TEKLİFLER ({req.offers.length})
                          </h6>

                          {req.offers.length === 0 ? (
                            <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                              <Bell className="h-6 w-6 text-slate-300 mx-auto animate-bounce mb-2" />
                              {language === "tr" ? "Şehir bayileri bu araca blind fiyat çalışıyor. İlk teklifler kısa süre içinde listelenecektir..." : "City dealers are preparing blind price quotes for this vehicle. Initial offers will be listed shortly..."}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {req.offers.map((off) => {
                                const isMatched = req.status === "Eşleştirildi" || req.status === "Tamamlandı";
                                const isApproved = off.status === "Onaylandı";

                                return (
                                  <div
                                    key={off.id}
                                    className={`p-4 rounded-xl border transition flex flex-col ${
                                      isApproved 
                                        ? "bg-emerald-50/40 border-emerald-500 shadow-sm" 
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                          📦 {off.kitBrandProposed}
                                        </span>
                                        {/* Name privacy logic */}
                                        <h6 className="font-bold text-slate-900 mt-2 flex items-center gap-1">
                                          {isMatched ? (
                                            <>
                                              <span className="text-emerald-700 font-extrabold">{off.companyName}</span>
                                              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-mono">{language === "tr" ? "Bilgiler Paylaşıldı" : "Contact Revealed"}</span>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-slate-500 italic">{language === "tr" ? "🔒 Firma Adı Gizli (Onaylayınca Açılır)" : "🔒 Company Name Hidden (Revealed on Approval)"}</span>
                                            </>
                                          )}
                                        </h6>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[10px] text-slate-400 block font-mono">{language === "tr" ? "Anahtar Teslim Fiyatı" : "Turnkey Price"}</span>
                                        <strong className="text-base text-emerald-600 font-extrabold">{off.price} TL</strong>
                                      </div>
                                    </div>

                                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 my-3">
                                      "{translateEntity(off, "notes")}"
                                    </p>

                                    {/* Reveal Contact Details Only on Eşleştirildi state */}
                                    {isMatched && isApproved && (
                                      <div className="bg-emerald-950 text-emerald-200 rounded-lg p-3 text-[11px] mb-3 space-y-1.5 border border-emerald-900 font-mono">
                                        <h4 className="font-bold underline text-emerald-300 mb-1 flex items-center gap-1 uppercase">
                                          <PhoneCall className="h-3 w-3" /> {language === "tr" ? "FİRMA İLETİŞİM VE ADRES VERİSİ" : "COMPANY CONTACT AND ADDRESS DATA"}
                                        </h4>
                                        <p><strong>{language === "tr" ? "Yetkili Usta:" : "Authorized Expert:"}</strong> {off.companyContactName || "Kemal Usta – Başteknisyen"}</p>
                                        <p><strong>{language === "tr" ? "Telefon:" : "Phone:"}</strong> {off.companyPhone || "0555 XXXXXXX"}</p>
                                        <p><strong>{language === "tr" ? "E-posta:" : "Email:"}</strong> {off.companyEmail || "support@firma.com"}</p>
                                        <p><strong>{language === "tr" ? "Adres:" : "Address:"}</strong> Maslak Sanayi Bölgesi 2. Ada No: 12, Şişli / {req.userCity}</p>
                                        <p className="text-[9px] text-emerald-400 italic pt-1">{language === "tr" ? "İletişime geçerek tescil randevusu oluşturabilirsiniz." : "You can contact them to schedule a registration appointment."}</p>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100 mb-3">
                                      <span className="flex items-center gap-1">
                                        <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        {language === "tr" ? "Garanti:" : "Warranty:"} {off.warrantyYears} {language === "tr" ? "Yıl" : "Years"}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                        {language === "tr" ? "Montaj Süresi:" : "Installation Duration:"} {off.installationDuration || (language === "tr" ? "1 Gün" : "1 Day")}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Wrench className="h-3.5 w-3.5 text-emerald-600 shrink-0 font-mono" />
                                        {language === "tr" ? "Taksit:" : "Installment:"} {off.installmentOptions}
                                      </span>
                                    </div>

                                    {/* Action choice buttons */}
                                    <div className="flex gap-2 justify-end">
                                      {off.status === "Onaylandı" ? (
                                        <span className="bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1">
                                          <CheckCircle className="h-3.5 w-3.5" />
                                          {isMatched ? (language === "tr" ? "Eşleştirme Tamamlandı" : "Matching Completed") : (language === "tr" ? "Teklifi Onayladınız - Admin Bekleniyor" : "You Approved Bid - Awaiting Admin")}
                                        </span>
                                      ) : off.status === "Reddedildi" ? (
                                        <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                          <X className="h-3.5 w-3.5" />
                                          {language === "tr" ? "Reddedildi" : "Rejected"}
                                        </span>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleOwnerActionOnOffer(req.id, off, "onayla")}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                                          >
                                            {language === "tr" ? "Onayla / Reze Et" : "Approve / Reserve"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleOwnerActionOnOffer(req.id, off, "reddet")}
                                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                                          >
                                            {language === "tr" ? "Reddet" : "Reject"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => alert(language === "tr" ? "Kararınız sistem arşivine alındı. Talebiniz 15 gün daha yayında kalacaktır." : "Your decision has been archived. Your request will remain live for 15 more days.")}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition"
                                          >
                                            {language === "tr" ? "Daha Sonra Karar Ver" : "Decide Later"}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
            </div>
          )}
        </div>
      );
    })()}

          </div>

        </div>
      )}


      {/* VIEW 2: FİRMA PORTALI (DEALER / WORKSHOP PORTAL) */}
      {activeRole === "company" && (
        <div className="p-6 sm:p-10 space-y-8 animate-fade-in bg-slate-50">
          
          <div className="relative rounded-2xl bg-slate-900 text-white p-5 border border-slate-800">
            <h4 className="font-bold text-base flex items-center gap-1.5">
              <Building className="h-5 w-5 text-emerald-400" />
              {language === "tr" ? "TSE Yetkili Servis (Bayi / Usta) Teklif Modülü" : "TSE Authorized Service (Dealer / Expert) Bidding Module"}
            </h4>
            <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
              {language === "tr"
                ? "Bu ekran, sisteme kayıtlı alternatif yakıt otogaz dönüştürme firmalarının arayüzüdür. Kişisel müşteri iletişim bilgileri (ad, soyad, telefon vb.) 'Çift Taraflı Onay' öncesinde tamamen gizlidir. Fiyat teklifi girerek ihale başlatın."
                : "This screen is the interface for registered alternative fuel autogas conversion companies. Personal customer contact information (first/last name, phone, etc.) is completely hidden before 'Double-Sided Approval'. Submit a price offer to start the bidding."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono">{language === "tr" ? "Simüle Edilen Firma:" : "Simulated Company:"}</span>
              <select
                value={selectedBiddingCompany}
                onChange={(e) => setSelectedBiddingCompany(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded font-bold px-2 py-1 text-xs text-emerald-400 focus:outline-none"
              >
                {COMPANIES_DATA.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name} ({c.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Active blind requests pool (Left) */}
            <div className="lg:col-span-7 space-y-4">
              <h5 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 uppercase font-mono">
                {language === "tr" ? `🏁 Çevredeki Blind LPG Dönüşüm Talepleri (${requests.filter(r => r.status !== "Tamamlandı").length})` : `🏁 Blind LPG Conversion Requests Nearby (${requests.filter(r => r.status !== "Tamamlandı").length})`}
              </h5>

              {requests.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  {language === "tr" ? "Sistemde kayıtlı aktif araç dönüşüm talebi bulunmamaktadır." : "There are no active vehicle conversion requests registered in the system."}
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => {
                    const hasOurOffer = r.offers.some(o => o.companyId === selectedBiddingCompany);
                    const matchedOffer = r.offers.find(o => o.companyId === selectedBiddingCompany);

                    return (
                      <div 
                        key={r.id} 
                        className={`p-5 rounded-2xl bg-white border shadow-sm transition-all duration-200 ${
                          selectedRequestForBid?.id === r.id 
                            ? "border-emerald-500 ring-1 ring-emerald-500" 
                            : "border-slate-180 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-2 text-xs">
                          <div>
                            <span className="bg-slate-100 text-slate-600 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                              {language === "tr" ? "Talep No:" : "Request No:"} {r.id}
                            </span>
                            <h6 className="font-extrabold text-slate-900 text-sm mt-2">
                              {r.brand} {r.model} ({r.year})
                            </h6>
                            <p className="text-slate-500 mt-1 leading-normal">
                              {language === "tr" ? "Tarih:" : "Date:"} {r.created_at} | {language === "tr" ? "Şehir:" : "City:"} <strong>{r.userCity}</strong> | {language === "tr" ? "İlçe:" : "District:"} <strong>{r.userDistrict || (language === "tr" ? "Merkez" : "Center")}</strong>
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {/* Privacy guard message */}
                            <span className="bg-red-50 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100 inline-block uppercase tracking-tight">
                              {language === "tr" ? "🔒 Ad & Tel Kilitli" : "🔒 Name & Tel Locked"}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">
                              {language === "tr" ? `DURUM: ${r.status}` : `STATUS: ${r.status === "Beklemede" ? "PENDING" : r.status === "Eşleştirildi" ? "MATCHED" : r.status}`}
                            </p>
                          </div>
                        </div>

                        {/* Motor details */}
                        <div className="mt-4 bg-slate-50 p-3 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 border border-slate-150">
                          <p><strong>{language === "tr" ? "Motor Hacmi:" : "Engine Displacement:"}</strong> {r.engine}</p>
                          <p><strong>{language === "tr" ? "Yakıt Türü:" : "Fuel Type:"}</strong> {r.fuelType ? (language === "tr" ? r.fuelType : (r.fuelType === "Benzin" ? "Gasoline" : "Gasoline / Hybrid")) : (language === "tr" ? "Benzin" : "Gasoline")}</p>
                          <p><strong>{language === "tr" ? "KM:" : "Mileage:"}</strong> {r.kilometer || (language === "tr" ? "Yeni" : "New")}</p>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                          <p className="text-slate-500">
                            {language === "tr" ? "Tercih Edilen Kit Sınıfı:" : "Preferred Kit Class:"} <strong className="text-slate-800 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded font-mono font-bold text-[10px] border border-emerald-100">{r.preferredBrand === "Fark Etmez" && language === "en" ? "Any" : r.preferredBrand}</strong>
                          </p>

                          {r.status === "Eşleştirildi" && matchedOffer?.status === "Onaylandı" ? (
                            <div className="bg-emerald-950 text-emerald-200 border border-emerald-900 p-3 rounded-lg text-[10px] font-mono leading-relaxed w-full">
                              <h5 className="font-bold underline text-emerald-400 uppercase tracking-wider text-[9px] mb-1">
                                {language === "tr" ? "✔️ EŞLEŞME YAPILDI! (MÜŞTERİ BİLGİSİ AÇILDI)" : "✔️ MATCH COMPLETED! (CUSTOMER CONTACT SHOWN)"}
                              </h5>
                              <p><strong>{language === "tr" ? "Müşteri Ad Soyad:" : "Customer Name:"}</strong> {r.userName}</p>
                              <p><strong>{language === "tr" ? "Telefon:" : "Phone:"}</strong> <span className="bg-emerald-900 font-bold px-1 rounded">{r.userPhone}</span></p>
                              <p><strong>{language === "tr" ? "E-posta:" : "Email:"}</strong> {r.userEmail || (language === "tr" ? "Bilinmiyor" : "Unknown")}</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {hasOurOffer ? (
                                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" /> 
                                  {language === "tr" ? "Fiyat Verdiniz:" : "Your Bid:"} {r.offers.find(o => o.companyId === selectedBiddingCompany)?.price} TL
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRequestForBid(r);
                                    setBidKitBrand(selectedBrands.length > 0 ? selectedBrands[0] : "Atiker");
                                  }}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl"
                                >
                                  {language === "tr" ? "Teklif Ver / Fiyatlandır" : "Submit Bid / Quote"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Bidding Form (Right) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-slate-200 p-6 rounded-2xl bg-white shadow-sm space-y-4">
                <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  {language === "tr" ? "Müşteri Gıyabında Blind Teklif Sun" : "Submit Blind Offer on Behalf of Customer"}
                </h5>

                {selectedRequestForBid ? (
                  <form onSubmit={handleCompanySubmitBid} className="space-y-4 animate-fade-in text-xs">
                    <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl rounded-b-none text-[11px] text-slate-700">
                      {language === "tr" ? (
                        <>Önemli: <strong>{selectedRequestForBid.brand} {selectedRequestForBid.model} ({selectedRequestForBid.id})</strong> kodlu talebe blind montaj faturası çalışıyorsunuz. Müşteri fiyat onayladığında telefonunuz kendisine iletilecektir.</>
                      ) : (
                        <>Important: You are preparing a blind installation quote for request <strong>{selectedRequestForBid.brand} {selectedRequestForBid.model} ({selectedRequestForBid.id})</strong>. Your phone will be shared with the customer once they approve the price.</>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        {language === "tr" ? "Anahtar Teslim Teklif Tutarı (TL) *" : "Turnkey Bid Amount (TL) *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={language === "tr" ? "Örn: 22500" : "e.g. 22500"}
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === "tr" ? "Kurulacak LPG Kit Markası *" : "LPG Kit Brand to Install *"}
                        </label>
                        <select
                          value={bidKitBrand}
                          onChange={(e) => setBidKitBrand(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs text-slate-800"
                        >
                          {MASTER_BRANDS_SORTED.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === "tr" ? "Garanti Süresi (Yıl) *" : "Warranty Period (Years) *"}
                        </label>
                        <select
                          value={bidWarranty}
                          onChange={(e) => setBidWarranty(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs text-slate-800 text-center"
                        >
                          <option value="2">2 {language === "tr" ? "Yıl" : "Years"}</option>
                          <option value="3">3 {language === "tr" ? "Yıl" : "Years"}</option>
                          <option value="5">5 {language === "tr" ? "Yıl" : "Years"}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          {language === "tr" ? "Tahmini Montaj Süresi *" : "Estimated Installation Duration *"}
                        </label>
                        <select
                          value={bidDuration}
                          onChange={(e) => setBidDuration(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs text-slate-800"
                        >
                          <option value="6 Saat">6 {language === "tr" ? "Saat" : "Hours"}</option>
                          <option value="8 Saat">8 {language === "tr" ? "Saat" : "Hours"}</option>
                          <option value="1 Gün">{language === "tr" ? "1 Gün (Normal)" : "1 Day (Normal)"}</option>
                          <option value="2 Gün">2 {language === "tr" ? "Gün" : "Days"}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        {language === "tr" ? "Montör Açıklaması / Notu *" : "Installer Notes / Description *"}
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder={language === "tr" ? "Örn: Manifold delmeden özel montaj, bilgisayarlı yol ayarı calibration ve su sızdırmazlık testleri teklife dâhildir." : "e.g. Special installation without manifold drilling, computerized road calibration adjustment, and water tightness tests are included in the quote."}
                        value={bidNotes}
                        onChange={(e) => setBidNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-lg text-xs text-slate-800 font-sans focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl flex-1 text-xs transition"
                      >
                        {language === "tr" ? "Teklifi Gönder & İhaleye Gir" : "Submit Bid & Enter Auction"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRequestForBid(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                      >
                        {language === "tr" ? "İptal" : "Cancel"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                    {language === "tr" ? "Lütfen sol taraftaki aktif talepler listesinden bir araç talebini seçerek fiyatlandırmaya başlayın." : "Please select a vehicle request from the active demands list on the left to start pricing."}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}


      {/* VIEW 3: YÖNETİCİ KONTROL PANELİ (ADMIN DASHBOARD) */}
      {activeRole === "admin" && (
        <div className="p-6 sm:p-10 space-y-8 animate-fade-in bg-slate-900 text-white">
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400 animate-pulse" />
                {language === "tr" ? "LPGPORTAL Yönetici Teklif Denetleme Paneli" : "LPGPORTAL Administrator Quote Audit Panel"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {language === "tr" ? "Gelen tüm araç taleplerini, usta blind tekliflerini yönetebilir, manuel eşleştirmeyi ( Match ) onaylayıp kontakları açabilirsiniz." : "You can manage all incoming vehicle demands and technician blind quotes, approve manual matching, and reveal contacts."}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm(language === "tr" ? "Tüm teklif veritabanını ve loglarını sıfırlamak istiyor musunuz?" : "Do you want to reset the entire quotes database and logs?")) {
                  localStorage.removeItem("lpgportal_quote_requests");
                  localStorage.removeItem("lpgportal_quote_audit_logs");
                  localStorage.removeItem("lpgportal_quote_notifications");
                  window.location.reload();
                }
              }}
              className="bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-400 text-2xs uppercase tracking-wider font-mono font-bold px-2.5 py-1.5 rounded-lg transition"
            >
              {language === "tr" ? "Tüm Teklifleri Sıfırla" : "Reset All Bids"}
            </button>
          </div>

          {/* Statistics widgets box */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{language === "tr" ? "Toplam Talep" : "Total Requests"}</span>
              <span className="text-2xl font-black text-white">{totalRequests}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{language === "tr" ? "Bekleyen Teklifler" : "Pending Bids"}</span>
              <span className="text-2xl font-black text-amber-400">{pendingRequests}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{language === "tr" ? "Onaylanan Teklifler" : "Approved Bids"}</span>
              <span className="text-2xl font-black text-blue-400">{approvedRequests}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{language === "tr" ? "Eşleştirilen Talepler" : "Matched Demands"}</span>
              <span className="text-2xl font-black text-emerald-400">{matchedRequests}</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-[10px] text-slate-500 font-mono block uppercase">{language === "tr" ? "Tamamlanan Talepler" : "Completed Demands"}</span>
              <span className="text-2xl font-black text-white">{completedRequests}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Live Demands Audit Screen with Matching action (Left) */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-bold text-sm tracking-widest text-slate-400 uppercase font-mono flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                {language === "tr" ? "Aktif Talepler & Eşleştirme Masası" : "Active Demands & Matchmaking Table"}
              </h4>

              {requests.map((r) => {
                const acceptedOffer = r.offers.find(o => o.status === "Onaylandı" || o.status === "Eşleştirildi");
                
                return (
                  <div key={r.id} className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                    <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-900 pb-3 text-xs">
                      <div>
                        <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                          {r.id} • {r.created_at}
                        </span>
                        <h5 className="font-extrabold text-sm text-white mt-1.5">{r.brand} {r.model} ({r.year})</h5>
                        <p className="text-slate-500">{language === "tr" ? "Bölge:" : "Region:"} {r.userCity}, {r.userDistrict || (language === "tr" ? "Merkez" : "Center")}</p>
                      </div>

                      <div className="bg-slate-900 p-2 rounded border border-slate-800 space-y-0.5">
                        <strong className="text-emerald-400 font-mono font-bold block">{language === "tr" ? "👑 ARAC SAHİBİ BİLGİLERİ (SADECE ADMİN)" : "👑 VEHICLE OWNER DETAILS (ADMIN ONLY)"}</strong>
                        <p className="text-[11px] text-slate-300"><strong>{language === "tr" ? "Ad Soyad:" : "Full Name:"}</strong> {r.userName}</p>
                        <p className="text-[11px] text-slate-300"><strong>{language === "tr" ? "Telefon:" : "Phone:"}</strong> {r.userPhone}</p>
                        <p className="text-[11px] text-slate-300"><strong>{language === "tr" ? "E-posta:" : "Email:"}</strong> {r.userEmail || (language === "tr" ? "Bilinmiyor" : "Unknown")}</p>
                      </div>
                    </div>

                    {/* Offers sub-box */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 font-mono uppercase">{language === "tr" ? "İlişik Teklif Listesi :" : "Associated Offer List:"}</p>
                      {r.offers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">{language === "tr" ? "Henüz bu araç için teklif verilmedi." : "No quotes have been submitted for this vehicle yet."}</p>
                      ) : (
                        <div className="space-y-2">
                          {r.offers.map(off => (
                            <div key={off.id} className="bg-slate-900 border border-slate-850 p-3 rounded-lg flex flex-wrap justify-between items-center text-xs text-slate-300">
                              <div>
                                <span className="font-bold text-slate-100">{off.companyName}</span>
                                <span className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.2 rounded font-mono ml-2">{language === "tr" ? "Kit:" : "KitProposed:"} {off.kitBrandProposed}</span>
                                <p className="text-slate-500 font-mono text-[10px] mt-0.5">{language === "tr" ? "Firma Kontak:" : "Company Contact:"} {off.companyContactName} | {language === "tr" ? "Telefon:" : "Phone:"} {off.companyPhone}</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <div>
                                  <strong className="text-emerald-400 block">{off.price} TL</strong>
                                  <span className={`text-[10px] font-bold ${
                                    off.status === "Onaylandı" 
                                      ? "text-emerald-500" 
                                      : off.status === "Reddedildi" 
                                        ? "text-red-500" 
                                        : "text-amber-500"
                                  }`}>{off.status || "Beklemede"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Match action flow */}
                    <div className="flex gap-2 justify-end border-t border-slate-900 pt-3">
                      {r.status === "Kullanıcı Onayladı" && (
                        <button
                          type="button"
                          onClick={() => handleAdminMatch(r.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-md"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Onayla ve Karşılıklı Eşleştir (İletişimleri Gönder)
                        </button>
                      )}
                      
                      {r.status === "Eşleştirildi" && (
                        <button
                          type="button"
                          onClick={() => handleAdminComplete(r.id)}
                          className="bg-white hover:bg-slate-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="h-4 w-4" />
                          Süreci Tamamlandı Olarak Kapat
                        </button>
                      )}

                      {r.status === "Tamamlandı" && (
                        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Tamamlandı (Süreç Kapatıldı)
                        </span>
                      )}

                      {r.status !== "Kullanıcı Onayladı" && r.status !== "Eşleştirildi" && r.status !== "Tamamlandı" && (
                        <span className="text-xs text-slate-500 bg-slate-900/60 p-2 rounded-lg font-mono">
                          Müşteri Onayı Bekleniyor
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notifications & System Audit Log (Right) */}
            <div className="lg:col-span-4 space-y-6 text-xs">
              
              {/* Notification card panel */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider text-[11px]">
                    <Bell className="h-4 w-4 text-red-400 animate-pulse" />
                    Sistem Bildirimleri
                  </h5>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[9px] hover:text-red-400 underline uppercase tracking-tight text-slate-500"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-slate-500 italic text-2xs py-4 text-center">Yeni bir sistem bildirimi yok.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2 bg-slate-900 border border-slate-850 rounded flex items-start gap-1 text-[11px] leading-relaxed text-slate-300">
                        <span className="bg-red-950 text-red-400 text-[9px] border border-red-900 font-mono font-bold px-1 rounded uppercase shrink-0 mt-0.5">Yeni</span>
                        <div className="flex-1">
                          <p>{n.text}</p>
                          <span className="text-[9px] text-slate-500 font-mono block text-right mt-1">{n.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Processing logs table (İşlem Kaydı) */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h5 className="font-bold text-white uppercase tracking-wider font-mono text-[11px] border-b border-slate-800 pb-2">
                  📜 Süreç İşlem Kaydı (Sistem Logu)
                </h5>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-900/60 rounded border border-slate-850/60 font-mono text-[10px] text-slate-400 space-y-1">
                      <div className="flex justify-between text-slate-500 text-[9px]">
                        <span>{log.date} - {log.time}</span>
                        <span className="text-emerald-500 font-bold">{log.id}</span>
                      </div>
                      <p className="text-slate-300"><strong className="text-slate-400 uppercase">{language === "tr" ? "Araç Sahibi" : "Vehicle Owner"}:</strong> {log.user}</p>
                      <p className="text-slate-300"><strong className="text-slate-400 uppercase">{language === "tr" ? "Firma" : "Company"}:</strong> {log.company}</p>
                      <p className="text-slate-300"><strong className="text-slate-400 uppercase">{language === "tr" ? "Teklif" : "Bid"}:</strong> {log.offer}</p>
                      <div className="pt-1 flex justify-between items-center border-t border-slate-900 mt-1">
                        <span className="text-[9px] uppercase font-bold text-slate-500">{language === "tr" ? "Durum" : "Status"}:</span>
                        <span className="bg-emerald-950/60 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                          {language === "tr" ? log.status : 
                           log.status === "Tamamlandı" ? "Completed" : 
                           log.status === "Eşleştirildi" ? "Matched" : 
                           log.status === "Kullanıcı Onayladı" ? "User Approved" : 
                           log.status === "Teklifler Geldi" ? "Offers Received" :
                           log.status === "Beklemede" ? "Pending" : log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
