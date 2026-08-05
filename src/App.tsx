import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import CompatibilitySystem from "./components/CompatibilitySystem";
import CompanyDirectory from "./components/CompanyDirectory";
import NewsAndBulletinsCenter from "./components/NewsAndBulletinsCenter";
import NewsCenter from "./components/NewsCenter";
import QuoteSystem from "./components/QuoteSystem";
import SavingsCalculator from "./components/SavingsCalculator";
import LpgRoutePlanner from "./components/LpgRoutePlanner";
import { hashPassword, signSession, verifySession } from "./lib/security";
import Phase2Modules from "./components/Phase2Modules";
import Marketplace from "./components/Marketplace";
import { DbUser, getUsers, saveUsers, addSystemLog, INITIAL_FREE_PROMO_CODES } from "./lib/membership";
import MembershipPortal from "./components/MembershipPortal";
import SupportCenter from "./components/SupportCenter";
import Contact from "./components/Contact";
import AboutUs from "./components/AboutUs";
import Advertising from "./components/Advertising";
import LegalPage, { LegalDocType } from "./components/LegalPage";
import { useLanguage } from "./lib/LanguageContext";
import { 


  Flame, 
  Calculator, 
  MapPin, 
  BookOpen, 
  FileText, 
  Sparkles, 
  GraduationCap, 
  ShoppingBag, 
  TrendingUp, 
  ShieldCheck, 
  Check, 
  Heart,
  Globe,
  Phone,
  Mail,
  AlertTriangle
} from "lucide-react";

function getClientDetails() {
  const ua = navigator.userAgent;
  let browser = "Bilinmeyen Tarayıcı";
  let device = "Bilinmeyen Cihaz";
  
  // Detect browser
  if (ua.includes("Firefox")) browser = "Mozilla Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Trident")) browser = "Internet Explorer";
  else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Google Chrome";
  else if (ua.includes("Safari")) browser = "Apple Safari";

  // Detect device/OS
  if (ua.includes("Android")) device = "Android Mobil Cihaz";
  else if (ua.includes("iPhone")) device = "Apple iPhone";
  else if (ua.includes("iPad")) device = "Apple iPad";
  else if (ua.includes("Windows")) device = "Windows PC";
  else if (ua.includes("Macintosh")) device = "macOS Bilgisayar";
  else if (ua.includes("Linux")) device = "Linux Bilgisayar";

  // Generate or read local IP
  let ip = localStorage.getItem("lpgportal_client_ip");
  if (!ip) {
    const octet3 = Math.floor(Math.random() * 254) + 1;
    const octet4 = Math.floor(Math.random() * 254) + 1;
    ip = `176.234.${octet3}.${octet4}`;
    localStorage.setItem("lpgportal_client_ip", ip);
  }

  return { browser, device, ip };
}

const seoConfig: Record<string, Record<string, { title: string; description: string; image: string }>> = {
  tr: {
    dashboard: {
      title: "LPG PORTAL - Türkiye'nin Otogaz ve LPG Dönüşüm Portalı",
      description: "Türkiye'nin en kapsamlı otogaz, LPG dönüşüm ve bayi rehberlik portalı. Akıllı rota planlayıcı ile tasarruf edin.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    compatibility: {
      title: "Araç LPG Uyumluluk Sistemi - LPG PORTAL",
      description: "Aracınızın motor koduna göre en uyumlu LPG kitlerini sorgulayın, montaj tavsiyelerini inceleyin.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    companies: {
      title: "Yetkili LPG Servisleri ve Firma Rehberi - LPG PORTAL",
      description: "Türkiye genelindeki TSE onaylı yetkili LPG montaj ve bakım servislerini listeleyin, karşılaştırın.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    teklif: {
      title: "LPG Dönüşüm Teklifi Al - LPG PORTAL",
      description: "Bulunduğunuz şehirdeki en iyi LPG montaj servislerinden anında ücretsiz fiyat teklifi alın.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    supportCenter: {
      title: "Müşteri Destek ve Çözüm Merkezi - LPG PORTAL",
      description: "LPG dönüşümü, montaj sonrası arızalar ve portal kullanımı hakkında teknik destek alın.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    contact: {
      title: "İletişim ve Destek - LPG PORTAL",
      description: "LPG PORTAL ekibine ulaşın, soru, görüş ve kurumsal işbirlikleri için mesaj gönderin.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    blogSpace: {
      title: "LPG Sektör Haberleri ve Teknik Bültenler - LPG PORTAL",
      description: "Otogaz teknolojilerindeki en son gelişmeler, teknik bültenler ve sektörel haberler.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    phase2: {
      title: "LPG Eğitimleri, Kariyer ve İkinci El İlanları - LPG PORTAL",
      description: "LPG dönüşüm ustalık eğitimleri, sertifikasyon programları ve kurumsal iş ilanları.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    marketplace: {
      title: "LPG Yedek Parça ve İkinci El Market - LPG PORTAL",
      description: "LPG kitleri, regülatörler, enjektörler ve kaliteli yedek parçaları güvenle satın alın.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    giris: {
      title: "Giriş Yap ve Kayıt Ol - LPG PORTAL",
      description: "LPG PORTAL ailesine katılarak firma rehberi, özel teklifler ve sektörel ilanlardan yararlanın.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    about: {
      title: "Hakkımızda - LPG PORTAL",
      description: "Türkiye'nin otogaz ve LPG dönüşüm ekosistemini bir araya getiren bağımsız sektörel platform.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    advertising: {
      title: "Reklam ve İşbirlikleri - LPG PORTAL",
      description: "LPG PORTAL üzerinde reklam vererek sektör genelindeki hedef kitlenize anında ulaşın.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    }
  },
  en: {
    dashboard: {
      title: "LPG PORTAL - Turkey's Autogas & LPG Conversion Portal",
      description: "Turkey's most comprehensive autogas, LPG conversion, and dealer directory portal. Optimize savings with our route planner.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    compatibility: {
      title: "Vehicle LPG Compatibility System - LPG PORTAL",
      description: "Query the most compatible LPG kits according to your engine code and review installation recommendations.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    companies: {
      title: "Authorized LPG Services & Directory - LPG PORTAL",
      description: "List and compare TSE-approved authorized LPG installation and maintenance services across Turkey.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    teklif: {
      title: "Get LPG Conversion Quote - LPG PORTAL",
      description: "Get instant free price quotes from the best LPG installation shops in your area.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    supportCenter: {
      title: "Customer Support & Solutions Center - LPG PORTAL",
      description: "Get technical support regarding LPG conversion, post-installation issues, and portal usage.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    contact: {
      title: "Contact & Support - LPG PORTAL",
      description: "Contact the LPG PORTAL team, send messages for questions, feedback, and corporate collaborations.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    blogSpace: {
      title: "LPG News & Technical Bulletins - LPG PORTAL",
      description: "The latest developments in autogas technology, technical bulletins, and industry news.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    phase2: {
      title: "LPG Training, Careers & Store Ads - LPG PORTAL",
      description: "LPG conversion masterclass training, certification programs, and corporate job postings.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    marketplace: {
      title: "LPG Spare Parts & Marketplace - LPG PORTAL",
      description: "Safely purchase autogas kits, regulators, injectors, and high-quality spare parts.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    giris: {
      title: "Login & Register - LPG PORTAL",
      description: "Join the LPG PORTAL family to access the dealer directory, custom quotes, and industry ads.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    },
    about: {
      title: "About Us - LPG PORTAL",
      description: "Independent sector platform bringing Turkey's autogas and LPG conversion ecosystem under one roof.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    advertising: {
      title: "Advertising & Sponsorships - LPG PORTAL",
      description: "Advertise on LPG PORTAL to instantly reach your target audience within the industry.",
      image: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop"
    }
  }
};

const legalSeoConfig: Record<string, Record<string, { title: string; description: string; image: string }>> = {
  tr: {
    kvkk: {
      title: "KVKK Aydınlatma Metni - LPG PORTAL",
      description: "LPG PORTAL Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma ve onay metni.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "gizlilik-politikasi": {
      title: "Gizlilik Politikası - LPG PORTAL",
      description: "LPG PORTAL kullanıcı veri güvenliği ve gizlilik sözleşmesi detayları.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "kullanim-sartlari": {
      title: "Kullanım Şartları ve Koşullar - LPG PORTAL",
      description: "Web sitemizi ve mobil uygulamamızı kullanırken uymanız gereken kurallar.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "cerez-politikasi": {
      title: "Çerez Politikası - LPG PORTAL",
      description: "Daha iyi bir kullanıcı deneyimi sunabilmek için kullandığımız çerezler hakkında bilgi.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "mesafeli-hizmet-sozlesmesi": {
      title: "Mesafeli Satış ve Hizmet Sözleşmesi - LPG PORTAL",
      description: "Portal üyelik ödemeleri ve ilan hizmetleri için mesafeli satış sözleşmesi kuralları.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    }
  },
  en: {
    kvkk: {
      title: "KVKK Clarification Text - LPG PORTAL",
      description: "LPG PORTAL Personal Data Protection Law clarification and consent text.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "gizlilik-politikasi": {
      title: "Privacy Policy - LPG PORTAL",
      description: "LPG PORTAL user data security and privacy agreement details.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "kullanim-sartlari": {
      title: "Terms and Conditions of Use - LPG PORTAL",
      description: "Rules you must follow when using our website and mobile application.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "cerez-politikasi": {
      title: "Cookie Policy - LPG PORTAL",
      description: "Information about the cookies we use to provide a better user experience.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    },
    "mesafeli-hizmet-sozlesmesi": {
      title: "Distance Services Agreement - LPG PORTAL",
      description: "Distance service and sales agreement rules for portal memberships and advertising.",
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop"
    }
  }
};

export default function App() {
  const { language, setLanguage, t, translateEntity } = useLanguage();

  // Check if current URL is a legal document page
  const [activeLegalTab, setActiveLegalTab] = useState<LegalDocType | null>(() => {
    const pathname = window.location.pathname;
    if (pathname === "/kvkk") return "kvkk";
    if (pathname === "/gizlilik-politikasi") return "gizlilik-politikasi";
    if (pathname === "/kullanim-sartlari") return "kullanim-sartlari";
    if (pathname === "/cerez-politikasi") return "cerez-politikasi";
    if (pathname === "/mesafeli-hizmet-sozlesmesi") return "mesafeli-hizmet-sozlesmesi";
    return null;
  });

  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window === "undefined") return "dashboard";
    const pathname = window.location.pathname;
    
    if (["/kvkk", "/gizlilik-politikasi", "/kullanim-sartlari", "/cerez-politikasi", "/mesafeli-hizmet-sozlesmesi"].includes(pathname)) {
      return "dashboard";
    }

    const trPathMapping: Record<string, string> = {
      "/": "dashboard",
      "/ana-sayfa": "dashboard",
      "/lpg-uyumluluk": "compatibility",
      "/firma-rehberi": "companies",
      "/teklif-al": "teklif",
      "/destek-merkezi": "supportCenter",
      "/iletisim": "contact",
      "/haberler-bultenler": "blogSpace",
      "/egitimler-kariyer": "phase2",
      "/market": "marketplace",
      "/uyelik": "giris",
      "/giris": "giris",
      "/kayit": "giris",
      "/hakkimizda": "about",
      "/reklam-ve-isbirlikleri": "advertising",
      "/bildirim-merkezi": "giris"
    };

    const enPathMapping: Record<string, string> = {
      "/en": "dashboard",
      "/home": "dashboard",
      "/lpg-compatibility": "compatibility",
      "/company-directory": "companies",
      "/get-quote": "teklif",
      "/support-center": "supportCenter",
      "/contact": "contact",
      "/news-bulletins": "blogSpace",
      "/education-careers": "phase2",
      "/store": "marketplace",
      "/membership": "giris",
      "/login": "giris",
      "/register": "giris",
      "/about": "about",
      "/advertising-sponsorship": "advertising",
      "/notifications": "giris"
    };

    return trPathMapping[pathname] || enPathMapping[pathname] || "dashboard";
  });

  const [initialAuthMode, setInitialAuthMode] = useState<"login" | "register">(() => {
    if (typeof window === "undefined") return "login";
    const pathname = window.location.pathname;
    if (["/register", "/kayit"].includes(pathname)) return "register";
    return "login";
  });
  
  // Persisted user session state with signature validation (anti role manipulation)
  const [activeUser, setActiveUser] = useState<DbUser | null>(() => {
    const saved = localStorage.getItem("lpgportal_active_user");
    const sig = localStorage.getItem("lpgportal_active_user_sig");
    if (saved && sig) {
      try {
        const user = JSON.parse(saved);
        if (verifySession(user, sig)) {
          // Sync sessionStorage if it's empty to allow multi-tab support within same browser session
          if (typeof window !== "undefined" && user.active_session_id && !sessionStorage.getItem("lpgportal_session_id")) {
            sessionStorage.setItem("lpgportal_session_id", user.active_session_id);
          }
          return user;
        }
      } catch (e) {
        return null;
      }
    }
    if (saved) {
      localStorage.removeItem("lpgportal_active_user");
      localStorage.removeItem("lpgportal_active_user_sig");
    }
    return null;
  });

  const [userRole, setUserRole] = useState<string>(() => {
    const saved = localStorage.getItem("lpgportal_active_user");
    const sig = localStorage.getItem("lpgportal_active_user_sig");
    if (saved && sig) {
      try {
        const user = JSON.parse(saved);
        if (verifySession(user, sig)) {
          return user.role;
        }
      } catch (e) {}
    }
    return "visitor"; // defaults to visitor/Ziyaretçi
  });

  // BroadcastChannel to synchronize login sessions instantly across multiple tabs
  const broadcastChannel = React.useMemo(() => {
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      return new BroadcastChannel("lpgportal_session_channel");
    }
    return null;
  }, []);

  // Central session management helper to store both user and security signature
  const updateActiveUserSession = (user: DbUser | null) => {
    setActiveUser(user);
    if (user) {
      setUserRole(user.role);
      localStorage.setItem("lpgportal_active_user", JSON.stringify(user));
      localStorage.setItem("lpgportal_active_user_sig", signSession(user));

      const localSessionId = sessionStorage.getItem("lpgportal_session_id");
      if (broadcastChannel && localSessionId) {
        broadcastChannel.postMessage({
          type: "SESSION_LOGIN",
          userId: user.id,
          sessionId: localSessionId
        });
      }
    } else {
      setUserRole("visitor");
      localStorage.removeItem("lpgportal_active_user");
      localStorage.removeItem("lpgportal_active_user_sig");
    }
  };

  const [initialRoleToRegister, setInitialRoleToRegister] = useState<"vehicle_owner" | "dealer" | "engineer" | "manufacturer" | null>(null);
  const [showSessionTerminatedModal, setShowSessionTerminatedModal] = useState(false);

  // Prepopulate Quote Request fields from Compatibility Matcher
  const [prepopulatedBrand, setPrepopulatedBrand] = useState("");
  const [prepopulatedModel, setPrepopulatedModel] = useState("");
  const [prepopulatedYear, setPrepopulatedYear] = useState("");
  const [prepopulatedEngine, setPrepopulatedEngine] = useState("");

  // Dynamic reviews state and helpers
  const [homeReviews, setHomeReviews] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("lpgportal_home_reviews");
    if (saved) {
      try {
        setHomeReviews(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    // Seed default reviews
    const seeded = [
      {
        id: "rev-seed-1",
        userId: "user_hakan",
        authorName: "Hakan Soylu",
        authorRole: "vehicle_owner",
        profession: "Yazılımcı",
        city: "İstanbul",
        carBrand: "Honda",
        carModel: "Civic i-VTEC",
        title: "Honda Civic BRC Montajı",
        content: "2018 model 1.6 Civic aracıma maslak bayisinde BRC kit montajı yaptırdım. LPG bütçesi beni şoke etti, benzin faturam yarı yarıya düştü. Sübap ayarı uyarısını burada okuduktan sonra yaptıracağım.",
        rating: 5,
        status: "Onaylandı",
        createdAt: "2026-06-12T10:00:00Z"
      },
      {
        id: "rev-seed-2",
        userId: "user_kemal",
        authorName: "Kemal Demir",
        authorRole: "vehicle_owner",
        profession: "Esnaf",
        city: "Ankara",
        carBrand: "Fiat",
        carModel: "Egea Fire",
        title: "Atiker Grand Tasarrufu",
        content: "1.4 Egea Fire aracıma Atiker Grand kiti taktırdım. Hem yerli hem kuruşu kuruşuna harika tasarruf. Bu portalın teklif al sistemini kullandım, 2 usta anında fiyat teklifi yolladı, randevu oluşturup yaptırdım.",
        rating: 5,
        status: "Onaylandı",
        createdAt: "2026-06-11T12:00:00Z"
      }
    ];
    localStorage.setItem("lpgportal_home_reviews", JSON.stringify(seeded));
    setHomeReviews(seeded);
  }, [currentTab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentTab]);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent?.detail?.key === "lpgportal_home_reviews" && Array.isArray(customEvent.detail.data)) {
        setHomeReviews(customEvent.detail.data);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  const formatReviewDisplayName = (fullName: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return fullName;
    const lastName = parts.pop() || "";
    const firstName = parts.join(" ");
    return `${firstName} ${lastName.charAt(0).toUpperCase()}.`;
  };

  const getReviewRoleLabel = (role: string, profession?: string) => {
    if (role === "vehicle_owner") return profession || "Araç Sahibi";
    if (role === "dealer") return "Bayi / Servis";
    if (role === "engineer") {
      if (profession && (
        profession.toLowerCase().includes("usta") || 
        profession.toLowerCase().includes("tekniker") || 
        profession.toLowerCase().includes("servis")
      )) {
        return "LPG Ustası";
      }
      return "LPG Mühendisi";
    }
    if (role === "manufacturer") return "Kit Üreticisi";
    return role;
  };

  const handlePrepopulateQuote = (brand: string, model: string, year: string, engine: string) => {
    setPrepopulatedBrand(brand);
    setPrepopulatedModel(model);
    setPrepopulatedYear(year);
    setPrepopulatedEngine(engine);
    setCurrentTab("teklif"); // Switch directly to Module 5
  };

  const handleClearPrepopulate = () => {
    setPrepopulatedBrand("");
    setPrepopulatedModel("");
    setPrepopulatedYear("");
    setPrepopulatedEngine("");
  };

  // Intercept selection from the navigation role dropdown menu
  const onGirisRoleSelected = (chosenRole: string) => {
    if (chosenRole === "visitor") {
      updateActiveUserSession(null);
      setCurrentTab("dashboard");
      return;
    }

    setUserRole(chosenRole);

    // If currently active user matches this role, no redirection needed
    if (activeUser && activeUser.role === chosenRole) {
      setCurrentTab("giris");
      return;
    }

    // Otherwise redirect to Giriş / Üye Ol screen
    setCurrentTab("giris");
    setInitialAuthMode("register");
    setInitialRoleToRegister(chosenRole as any);
  };

  const handleLoginSuccess = (user: DbUser) => {
    // 1. Generate unique active session ID
    const newSessionId = user.active_session_id || Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("lpgportal_session_id", newSessionId);

    // 2. Detect browser, device, and simulated IP
    const { browser, device, ip } = getClientDetails();

    // 3. Update database
    const currentUsers = getUsers();
    const dbUserIdx = currentUsers.findIndex(u => u.id === user.id);
    
    const updatedUser = { 
      ...user, 
      active_session_id: newSessionId,
      last_login_time: new Date().toISOString(),
      last_login_ip: ip,
      last_login_device: `${device} (${browser})`
    };

    if (dbUserIdx > -1) {
      currentUsers[dbUserIdx] = {
        ...currentUsers[dbUserIdx],
        active_session_id: updatedUser.active_session_id,
        last_login_time: updatedUser.last_login_time,
        last_login_ip: updatedUser.last_login_ip,
        last_login_device: updatedUser.last_login_device
      };
      saveUsers(currentUsers);
    }

    // 4. Log security record
    // GÜVENLİK KAYDI: Her yeni giriş işleminde: Kullanıcı, Tarih, Saat, IP adresi, Tarayıcı bilgisi, Cihaz bilgisi
    const logDetails = `IP: ${ip} | Tarayıcı: ${browser} | Cihaz: ${device}`;
    addSystemLog("Kullanıcı Girişi", logDetails, user.email);

    // 5. Update state & storage
    updateActiveUserSession(updatedUser);
    setCurrentTab("dashboard");
  };

  const handleLogout = () => {
    updateActiveUserSession(null);
    sessionStorage.removeItem("lpgportal_session_id");
    setCurrentTab("dashboard");
  };

  // 0. Check if session was terminated in another tab/refresh on mount
  useEffect(() => {
    if (localStorage.getItem("lpgportal_session_terminated") === "true") {
      setShowSessionTerminatedModal(true);
      localStorage.removeItem("lpgportal_session_terminated");
    }
  }, []);

  // Password Migration & Security Check (convert plain text passwords to secure hashes on startup)
  useEffect(() => {
    const currentUsers = getUsers();
    let migrated = false;
    const updatedUsers = currentUsers.map(u => {
      // Hashed passwords are 64 characters long (SHA-256 output) or start with v2_
      if (u.password && u.password.length !== 64 && !u.password.startsWith("v2_")) {
        migrated = true;
        return {
          ...u,
          password: hashPassword(u.password, u.email)
        };
      }
      return u;
    });

    if (migrated) {
      saveUsers(updatedUsers);
      addSystemLog("Sistem Sertleştirme", "Veritabanındaki eski formatlı kullanıcı şifreleri SHA-256 ile özetlendi.");
      
      // Also update active session user if their password was migrated
      if (activeUser) {
        const activeDbUser = updatedUsers.find(u => u.id === activeUser.id);
        if (activeDbUser) {
          updateActiveUserSession(activeDbUser);
        }
      }
    }
  }, [activeUser]);



  // Session Mismatch Check & Database Poller
  useEffect(() => {
    if (!activeUser) return;

    const checkSession = async () => {
      const localSessionId = sessionStorage.getItem("lpgportal_session_id");
      if (!activeUser || !localSessionId) return;

      try {
        const res = await fetch(`/api/auth/session/${activeUser.id}`, {
          headers: {
            'X-LpgPortal-Secure': 'true'
          }
        });
        
        // Safety check if user logged out while request was in flight
        if (!activeUser) return;

        if (res.status === 401) {
          handleLogout();
          localStorage.setItem("lpgportal_session_terminated", "true");
          setShowSessionTerminatedModal(true);
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const serverSessionId = data.active_session_id;

        // Skip verification if missing database/server session ID
        if (!serverSessionId) return;
        
        if (serverSessionId !== localSessionId) {
          handleLogout();
          localStorage.setItem("lpgportal_session_terminated", "true");
          setShowSessionTerminatedModal(true);
        }
      } catch (e) {
        console.error("Session check failed:", e);
      }
    };

    const pollDatabaseUpdates = async () => {
      try {
        const currentVer = (window as any).lpgportal_db_version || "0";
        const res = await fetch(`/api/db/get-all?v=${currentVer}`, {
          headers: {
            'X-LpgPortal-Secure': 'true'
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.upToDate) {
          return;
        }

        const newVer = res.headers.get("X-LpgPortal-Version");
        if (newVer) {
          (window as any).lpgportal_db_version = newVer;
        }

        for (const key in data) {
          const pendingSync = (window as any).lpgportal_pending_sync || {};
          if (key in pendingSync) {
            continue;
          }
          const serialized = JSON.stringify(data[key]);
          if (window.lpgportal_db[key] !== serialized) {
            window.lpgportal_db[key] = serialized;
            window.dispatchEvent(
              new CustomEvent("lpgportal_db_update", {
                detail: { key, value: data[key] }
              })
            );
          }
        }
      } catch (e) {
        console.error("Database poll failed:", e);
      }
    };

    // 1. Run checks periodically
    checkSession();
    pollDatabaseUpdates();
    const interval = setInterval(checkSession, 2000);
    const dbInterval = setInterval(pollDatabaseUpdates, 3000);

    // 2. Listen to BroadcastChannel for instant cross-tab updates (primary mechanism)
    const handleBroadcastMessage = (event: MessageEvent) => {
      const { type, userId, sessionId } = event.data;
      if (type === "SESSION_LOGIN" && activeUser && activeUser.id === userId) {
        const localSessionId = sessionStorage.getItem("lpgportal_session_id");
        if (localSessionId && sessionId && localSessionId !== sessionId) {
          handleLogout();
          localStorage.setItem("lpgportal_session_terminated", "true");
          setShowSessionTerminatedModal(true);
        }
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener("message", handleBroadcastMessage);
    }

    return () => {
      clearInterval(interval);
      clearInterval(dbInterval);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener("message", handleBroadcastMessage);
      }
    };
  }, [activeUser, broadcastChannel]);

  // Synchronize manual logout and login changes across tabs via StorageEvent
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "lpgportal_active_user") {
        if (!e.newValue) {
          // Silent logout (manual logout in another tab)
          setActiveUser(null);
          setUserRole("visitor");
          sessionStorage.removeItem("lpgportal_session_id");
        } else {
          // Silent login / update (logged in in another tab)
          try {
            const user = JSON.parse(e.newValue);
            setActiveUser(user);
            setUserRole(user.role);
            if (user.active_session_id) {
              sessionStorage.setItem("lpgportal_session_id", user.active_session_id);
            }
          } catch (err) {}
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 1. Path-to-Tab Initializer on Mount (Supports entering directly via TR or EN SEO URL)
  useEffect(() => {
    const pathname = window.location.pathname;
    
    // Skip checking if it is a legal document tab
    if (["/kvkk", "/gizlilik-politikasi", "/kullanim-sartlari", "/cerez-politikasi", "/mesafeli-hizmet-sozlesmesi"].includes(pathname)) {
      return;
    }

    const trPathMapping: Record<string, string> = {
      "/": "dashboard",
      "/ana-sayfa": "dashboard",
      "/lpg-uyumluluk": "compatibility",
      "/firma-rehberi": "companies",
      "/teklif-al": "teklif",
      "/destek-merkezi": "supportCenter",
      "/iletisim": "contact",
      "/haberler-bultenler": "blogSpace",
      "/egitimler-kariyer": "phase2",
      "/market": "marketplace",
      "/uyelik": "giris",
      "/giris": "giris",
      "/kayit": "giris",
      "/hakkimizda": "about",
      "/reklam-ve-isbirlikleri": "advertising",
      "/bildirim-merkezi": "giris"
    };

    const enPathMapping: Record<string, string> = {
      "/en": "dashboard",
      "/home": "dashboard",
      "/lpg-compatibility": "compatibility",
      "/company-directory": "companies",
      "/get-quote": "teklif",
      "/support-center": "supportCenter",
      "/contact": "contact",
      "/news-bulletins": "blogSpace",
      "/education-careers": "phase2",
      "/store": "marketplace",
      "/membership": "giris",
      "/login": "giris",
      "/register": "giris",
      "/about": "about",
      "/advertising-sponsorship": "advertising",
      "/notifications": "giris"
    };

    if (trPathMapping[pathname]) {
      setCurrentTab(trPathMapping[pathname]);
      setLanguage("tr");
      if (["/kayit", "/register"].includes(pathname)) {
        setInitialAuthMode("register");
      } else {
        setInitialAuthMode("login");
      }
    } else if (enPathMapping[pathname]) {
      setCurrentTab(enPathMapping[pathname]);
      setLanguage("en");
      if (["/register", "/kayit"].includes(pathname)) {
        setInitialAuthMode("register");
      } else {
        setInitialAuthMode("login");
      }
    }
  }, []);

  // 2. SEO Url state pusher when active language or tab changes
  useEffect(() => {
    if (activeLegalTab) return;

    // Prevent pushing incorrect paths before language initializer runs on mount
    const pathname = window.location.pathname;
    const enPaths = ["/en", "/home", "/lpg-compatibility", "/company-directory", "/get-quote", "/support-center", "/contact", "/news-bulletins", "/education-careers", "/store", "/membership", "/login", "/register", "/about", "/advertising-sponsorship"];
    if (enPaths.includes(pathname) && language !== "en") return;
    const trPaths = ["/", "/ana-sayfa", "/lpg-uyumluluk", "/firma-rehberi", "/teklif-al", "/destek-merkezi", "/iletisim", "/haberler-bultenler", "/egitimler-kariyer", "/market", "/uyelik", "/giris", "/kayit", "/hakkimizda", "/reklam-ve-isbirlikleri"];
    if (trPaths.includes(pathname) && language !== "tr") return;

    const trPathsByTab: Record<string, string> = {
      "dashboard": "/",
      "compatibility": "/lpg-uyumluluk",
      "companies": "/firma-rehberi",
      "teklif": "/teklif-al",
      "supportCenter": "/destek-merkezi",
      "contact": "/iletisim",
      "blogSpace": "/haberler-bultenler",
      "phase2": "/egitimler-kariyer",
      "marketplace": "/market",
      "giris": "/uyelik",
      "about": "/hakkimizda",
      "advertising": "/reklam-ve-isbirlikleri"
    };

    const enPathsByTab: Record<string, string> = {
      "dashboard": "/en",
      "compatibility": "/lpg-compatibility",
      "companies": "/company-directory",
      "teklif": "/get-quote",
      "supportCenter": "/support-center",
      "contact": "/contact",
      "blogSpace": "/news-bulletins",
      "phase2": "/education-careers",
      "marketplace": "/store",
      "giris": "/membership",
      "about": "/about",
      "advertising": "/advertising-sponsorship"
    };

    const targetPath = (language === "tr" ? trPathsByTab[currentTab] : enPathsByTab[currentTab]) || "/";
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  }, [currentTab, language, activeLegalTab]);

  // Dynamic SEO & Metadata Manager Effect
  useEffect(() => {
    const lang = (language === "tr" || language === "en") ? language : "tr";
    let meta = activeLegalTab 
      ? (legalSeoConfig[lang]?.[activeLegalTab] || null)
      : (seoConfig[lang]?.[currentTab] || null);

    if (!meta) {
      meta = seoConfig[lang]?.dashboard;
    }

    if (meta) {
      document.title = meta.title;

      const setMetaTag = (propertyOrName: string, isProperty: boolean, content: string) => {
        const selector = isProperty ? `meta[property='${propertyOrName}']` : `meta[name='${propertyOrName}']`;
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          if (isProperty) {
            element.setAttribute('property', propertyOrName);
          } else {
            element.setAttribute('name', propertyOrName);
          }
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      const currentPath = window.location.pathname;
      const canonicalUrl = window.location.origin + currentPath;

      // Update basic meta
      setMetaTag("description", false, meta.description);

      // Update OpenGraph
      setMetaTag("og:title", true, meta.title);
      setMetaTag("og:description", true, meta.description);
      setMetaTag("og:image", true, meta.image);
      setMetaTag("og:url", true, canonicalUrl);
      setMetaTag("og:type", true, "website");
      setMetaTag("og:site_name", true, "LPGPORTAL");

      // Update Twitter Card
      setMetaTag("twitter:card", false, "summary_large_image");
      setMetaTag("twitter:title", false, meta.title);
      setMetaTag("twitter:description", false, meta.description);
      setMetaTag("twitter:image", false, meta.image);

      // Update Canonical Link
      let canonicalElement = document.querySelector("link[rel='canonical']");
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', canonicalUrl);
    }
  }, [currentTab, language, activeLegalTab]);

  if (activeLegalTab) {
    return (
      <LegalPage 
        initialDoc={activeLegalTab} 
        onGoBack={() => {
          setActiveLegalTab(null);
          window.history.pushState({}, "", "/");
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-850 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top sticky navigation bar */}
      <Navigation 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        userRole={userRole} 
        setUserRole={setUserRole} 
        activeUser={activeUser}
        onGirisRoleSelected={onGirisRoleSelected}
        onLogout={handleLogout}
      />

      {/* Main viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {currentTab === "dashboard" && (
          <div className="space-y-12 animate-fade-in">
            {/* Elegant Hero Section with green emerald values */}
            <div className="relative rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white p-8 sm:p-12 border border-emerald-100 shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810d_1px,transparent_1px),linear-gradient(to_bottom,#10b9810d_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              <div className="relative z-10 max-w-3xl space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-150">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  {language === "tr" ? "Türkiye'nin Tek Alternatif Yakıt ve Otogaz Portalı" : "Turkey's Definitive Alternative Fuel & Autogas Portal"}
                </span>

                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  {language === "tr" ? (
                    <>
                      LPG Dönüşümü ile Yakıt <br className="hidden sm:inline" />
                      Maliyetlerinizi <span className="text-emerald-600 underline decoration-emerald-500 underline-offset-4">%45'e Varan</span> Oranda Kısın!
                    </>
                  ) : (
                    <>
                      Cut Fuel Bills Up to <br className="hidden sm:inline" />
                      <span className="text-emerald-600 underline decoration-emerald-500 underline-offset-4">45% Savings</span> with LPG Conversion!
                    </>
                  )}
                </h1>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                  {language === "tr" 
                    ? "LPG PORTAL; araç sahiplerini, TSE yetki belgeli dönüşüm bayilerini, kit üreticilerini ve teknik kalibrasyon mühendislerini bir araya getiren bağımsız sektörel ekosistemdir."
                    : "LPG PORTAL is an independent sectoral ecosystem bridging vehicle owners, certified TSE assembly centers, kit manufacturers, and expert calibration engineers together."
                  }
                </p>

                {/* Instant Actions Grid */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button 
                    onClick={() => setCurrentTab("compatibility")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-1.5 transition-all duration-150 transform hover:scale-[1.02] shadow-sm cursor-pointer"
                  >
                    <Calculator className="h-4 w-4" />
                    {t("home.check_compatibility")}
                  </button>
                  <button 
                    onClick={() => setCurrentTab("teklif")}
                    className="bg-white hover:bg-slate-50 border border-slate-200 font-bold px-6 py-3 rounded-xl text-xs text-slate-700 flex items-center gap-1.5 transition-all duration-150 shadow-sm cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                    {language === "tr" ? "Ücretsiz Fiyat Teklifi Al" : "Get Free Price Offers"}
                  </button>
                  <button 
                    onClick={() => setCurrentTab("blogSpace")}
                    className="bg-white hover:bg-slate-50 border border-slate-200 font-bold px-6 py-3 rounded-xl text-xs text-emerald-600 flex items-center gap-1.5 transition-all duration-150 shadow-sm cursor-pointer"
                  >
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                    {language === "tr" ? "Haber & Bülten Merkezi" : "News & Bulletin Archive"}
                  </button>
                </div>
              </div>

              {/* Glowing vector element on right edge */}
              <div className="hidden lg:block absolute right-12 bottom-12 opacity-80 pointer-events-none">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-emerald-400/10 blur-3xl animate-pulse"></div>
                  <div className="text-[120px] font-black text-center font-mono leading-none bg-gradient-to-br from-emerald-400 to-emerald-700 bg-clip-text text-transparent opacity-10 select-none">
                    LPG
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Bento Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                  {language === "tr" ? "Piyasa Oranı" : "Market Share"}
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {language === "tr" ? "%38.4 Otogazlı" : "38.4% Registered"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {language === "tr" 
                    ? "Türkiye'de binek dizele kıyasla en yüksek yakıt kullanım oranı."
                    : "The highest registered vehicle fuel usage ratio in Turkey compared to passenger diesel."
                  }
                </p>
              </div>
              
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                  {language === "tr" ? "Sertifikalı Ağ" : "Certified Network"}
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {language === "tr" ? "800+ Mühendislik Ofisi" : "800+ Engineering Centers"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {language === "tr" 
                    ? "TSE Hizmet Yeterlilik sertifikasına (HYB) sahip kayıtlı bayilerimiz."
                    : "Our verified installers holding official TSE Service Adequacy validations (HYB)."
                  }
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                  {language === "tr" ? "Aylık Tasarruf" : "Average Savings"}
                </span>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {language === "tr" ? "%45 Net Kazanç" : "45% Net Savings"}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {language === "tr"
                    ? "Benzine karşı ortalamada her kilometrede elde edilen net tasarruf oranı."
                    : "Net direct monetary savings achieved per kilometer driven relative to standard petrol."
                  }
                </p>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <span className="text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                  {language === "tr" ? "Müşteri Memnuniyeti" : "Customer Score"}
                </span>
                <p className="text-xl font-bold text-slate-800 mt-1">4.8 / 5 Yıldız</p>
                <p className="text-xs text-slate-500 mt-2">
                  {language === "tr"
                    ? "Teklif sistemiyle dönüşüm yaptıran araç sahiplerimizin geri bildirim ortalaması."
                    : "Average ratings left by vehicle owners utilizing our blind bidding workspace."
                  }
                </p>
              </div>
            </div>

            {/* Structured Features Intro Grid (Bento style) */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                {language === "tr" ? "LPG PORTAL Dijital Sektör Çözümleri" : "LPG PORTAL Digital Features and Modules"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Panel 1 */}
                <div 
                  onClick={() => setCurrentTab("compatibility")}
                  className="bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer hover:shadow-md transition duration-200 group"
                >
                  <div className="p-3 bg-slate-50 group-hover:bg-emerald-50 rounded-xl w-fit transition text-emerald-600">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-850 mt-4 flex items-center gap-1">
                    {t("compat.title")}
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ml-1.5">MODÜL 1</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 lines-clamp-3 leading-relaxed">
                    {language === "tr"
                      ? "Aracınızın LPG ile uyumlu olup olmadığını anında öğrenin. Supap erime risklerini ve motorunuza en uyumlu kitleri inceleyin."
                      : "Look up your vehicle's mechanical LPG compatibility. Inspect valve temperature risks and highly recommended kits."
                    }
                  </p>
                </div>

                {/* Panel 2 */}
                <div 
                  onClick={() => setCurrentTab("companies")}
                  className="bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer hover:shadow-md transition duration-200 group"
                >
                  <div className="p-3 bg-slate-50 group-hover:bg-emerald-50 rounded-xl w-fit transition text-emerald-600">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-850 mt-4 flex items-center gap-1">
                    {t("company.directory_title")}
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ml-1.5">MODÜL 2</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 lines-clamp-3 leading-relaxed">
                    {language === "tr"
                      ? "Şehrinizdeki bilgisayarlı yol ayarı yapan, TSE tescilli yetkili montörleri harita üzerinde pin koordinatlarıyla anında karşılaştırın."
                      : "Instantly compare certified TSE installers in your city offering computerized road calibrations with interactive mapping."
                    }
                  </p>
                </div>

                {/* Panel 3 */}
                <div 
                  onClick={() => setCurrentTab("blogSpace")}
                  className="bg-white border border-slate-200 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer hover:shadow-md transition duration-200 group"
                >
                  <div className="p-3 bg-slate-50 group-hover:bg-emerald-50 rounded-xl w-fit transition text-emerald-600">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-base text-slate-850 mt-4 flex items-center gap-1">
                    {t("blog.news_center")}
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ml-1.5">MODÜL 3</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 lines-clamp-3 leading-relaxed">
                    {language === "tr"
                      ? "TSE tebliğleri, yeni araç uyumluluğu, Prins/Atiker yazılım güncellemeleri ve Valvematic/T-GDI enjektör montaj rehberlerini inceleyin."
                      : "Examine authorized TSE rules, fresh vehicle approvals, software parameter releases, and GDI injector manuals."
                    }
                  </p>
                </div>

              </div>
            </div>

            {/* Benzin / LPG Tasarruf Hesaplama Robotu Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {t("home.savings_calculator")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === "tr"
                    ? "Aracınızın aylık ve yıllık LPG tasarrufunu saniyeler içerisinde hesaplayın."
                    : "Input query parameters to instantly approximate your monthly and annual alternative fuel savings."
                  }
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-1 sm:p-2 shadow-sm">
                <SavingsCalculator />
              </div>
            </div>

            {/* Akıllı LPG Rota Planlayıcı */}
            <div className="space-y-4">
              <LpgRoutePlanner />
            </div>

            {/* Drivers testimonies section / Sürücü Görüşleri */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                {language === "tr" ? "Sürücü Deneyimleri ve Dönüşüm Hikayeleri" : "Driver Reviews & Conversion Stories"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeReviews
                  .filter((r: any) => r.status === "Onaylandı")
                  .slice(0, 2)
                  .map((review: any) => (
                    <div key={review.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between animate-fade-in">
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        "{translateEntity(review, "content")}"
                      </p>
                      <div className="mt-3 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                        <span>
                          {formatReviewDisplayName(review.authorName)}{" "}
                          ({getReviewRoleLabel(review.authorRole, review.profession)}, {review.city})
                        </span>
                        {review.authorRole === "vehicle_owner" ? (
                          <span className="text-emerald-600 font-bold">{review.carBrand} {review.carModel}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">{review.carBrand || "LPG Profesyoneli"}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {currentTab === "compatibility" && (
          <CompatibilitySystem onPrepopulateQuote={handlePrepopulateQuote} />
        )}

        {currentTab === "companies" && (
          <CompanyDirectory 
            activeUser={activeUser}
            onUpdateActiveUser={(updatedUser) => {
              updateActiveUserSession(updatedUser);
            }}
          />
        )}

        {currentTab === "blogSpace" && (
          <NewsAndBulletinsCenter activeUser={activeUser} />
        )}

        {currentTab === "supportCenter" && (
          <SupportCenter activeUser={activeUser} onNavigateToTab={setCurrentTab} />
        )}

        {currentTab === "contact" && (
          <Contact activeUser={activeUser} onNavigateToTab={setCurrentTab} />
        )}

        {currentTab === "about" && (
          <AboutUs activeUser={activeUser} onNavigateToTab={setCurrentTab} />
        )}

        {currentTab === "advertising" && (
          <Advertising activeUser={activeUser} onNavigateToTab={setCurrentTab} />
        )}

        {currentTab === "teklif" && (
          <QuoteSystem 
            prepopulatedBrand={prepopulatedBrand}
            prepopulatedModel={prepopulatedModel}
            prepopulatedYear={prepopulatedYear}
            prepopulatedEngine={prepopulatedEngine}
            onClearPrepopulate={handleClearPrepopulate}
            activeUser={activeUser}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === "phase2" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto">
              <div 
                onClick={() => setCurrentTab("phase2")}
                className="bg-white border border-slate-200 p-4 rounded-xl cursor-pointer text-center hover:border-emerald-500 shadow-sm"
              >
                <GraduationCap className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <span className="text-xs font-bold block text-slate-800">
                  {language === "tr" ? "Akademi Eğitim & Sınav" : "Academy Training & Quiz"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === "tr" ? "Teknisyen sertifikasyonu" : "Technician certification"}
                </span>
              </div>
              <div 
                onClick={() => setCurrentTab("news")}
                className="bg-white border border-slate-200 p-4 rounded-xl cursor-pointer text-center hover:border-emerald-500 shadow-sm"
              >
                <TrendingUp className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <span className="text-xs font-bold block text-slate-800">
                  {language === "tr" ? "LPG Tasarruf Cihazı" : "LPG Savings Calculator"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {language === "tr" ? "Yakıt maliyet simülatörü" : "Fuel cost simulator"}
                </span>
              </div>
              <div 
                onClick={() => setCurrentTab("marketplace")}
                className="bg-white border border-slate-200 p-4 rounded-xl cursor-pointer text-center hover:border-emerald-500 shadow-sm"
              >
                <ShoppingBag className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <span className="text-xs font-bold block text-slate-800">
                  {language === "tr" ? "Usta Parça Tedariği" : "Spare Parts Trading"}
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {language === "tr" ? "Orijinal filtre & lpg rekorları" : "OEM Filters & components"}
                </span>
              </div>
            </div>
            
            <Phase2Modules 
              activeUser={activeUser} 
              onNavigateToTab={(tab, role) => {
                if (role) {
                  setInitialRoleToRegister(role);
                }
                setCurrentTab(tab);
              }} 
            />
          </div>
        )}

        {currentTab === "news" && (
          <NewsCenter />
        )}

        {currentTab === "marketplace" && (
          <Marketplace activeUser={activeUser} onNavigateToTab={setCurrentTab} />
        )}

        {currentTab === "giris" && (
          <MembershipPortal 
            onLoginSuccess={handleLoginSuccess}
            activeUser={activeUser}
            onLogout={handleLogout}
            initialRoleToRegister={initialRoleToRegister}
            onRoleRegisterProcessed={() => setInitialRoleToRegister(null)}
            onUpdateActiveUser={(updated) => {
              updateActiveUserSession(updated);
            }}
            initialAuthMode={initialAuthMode}
          />
        )}

      </main>

      {/* Modern Credentials and Associations Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 pt-16 pb-12 mt-16 font-sans shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100 text-left">
            {/* Column 1: Brand Info */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                <Flame className="h-4 w-4 text-emerald-600" />
                <span>LPG PORTAL</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                {language === "tr" 
                  ? "Türkiye'nin Bağımsız Sıralı Otogaz Bilgi, Cari ve Teknik Danışmanlık Platformu."
                  : "Turkey's Definitive Independent Sequential Autogas Information & Technical Consulting Network."
                }
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <span>{language === "tr" ? "İstanbul, Türkiye" : "Istanbul, Turkey"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <a href="tel:05071545920" className="hover:text-emerald-600 transition">0 (507) 154 59 20</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                  <a href="mailto:info@lpgportal.com" className="hover:text-emerald-600 transition">info@lpgportal.com</a>
                </div>
              </div>
            </div>

            {/* Column 2: KURUMSAL */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 tracking-wider uppercase font-mono">
                {language === "tr" ? "KURUMSAL" : "CORPORATE"}
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab("about"); }} className="hover:text-emerald-600 transition">
                    {language === "tr" ? "Hakkımızda" : "About Us"}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab("contact"); }} className="hover:text-emerald-600 transition font-bold text-slate-800">
                    {language === "tr" ? "İletişim" : "Contact"}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert(language === "tr" ? 'Kariyer ilanları yakında listelenecektir.' : "Job positions are listed under the Training index."); }} className="hover:text-emerald-600 transition">
                    {language === "tr" ? "Kariyer" : "Careers"}
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab("advertising"); }} className="hover:text-emerald-600 transition">
                    {language === "tr" ? "Reklam ve İş Birlikleri" : "Advertising & Sponsorship"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: YASAL */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 tracking-wider uppercase font-mono">
                {language === "tr" ? "YASAL" : "LEGAL MANDATES"}
              </h5>
              <ul className="space-y-2 text-xs">
                <li><a href="/kvkk" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition font-bold text-slate-850">
                  {language === "tr" ? "KVKK Aydınlatma Metni" : "KVKK Data Clarification"}
                </a></li>
                <li><a href="/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
                </a></li>
                <li><a href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Kullanım Şartları" : "Terms & Disclaimers"}
                </a></li>
                <li><a href="/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Çerez Politikası" : "Cookies Policy"}
                </a></li>
                <li><a href="/mesafeli-hizmet-sozlesmesi" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Mesafeli Hizmet Sözleşmesi" : "Distance Selling Contract"}
                </a></li>
              </ul>
            </div>

            {/* Column 4: HİZMETLER */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 tracking-wider uppercase font-mono">
                {language === "tr" ? "HİZMETLER" : "SOLUTIONS"}
              </h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('compatibility'); }} className="hover:text-emerald-600 transition">
                  {t("compat.title")}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('companies'); }} className="hover:text-emerald-600 transition">
                  {t("company.directory_title")}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('blogSpace'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Teknik Bültenler" : "Technical Bulletins"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('blogSpace'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Haberler" : "Recent News"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('teklif'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Teklif Talebi" : "Get Bid Proposal"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('phase2'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Eğitim Merkezi" : "Training Academy"}
                </a></li>
              </ul>
            </div>

            {/* Column 5: ÜYELİK */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-900 tracking-wider uppercase font-mono">
                {language === "tr" ? "ÜYELİK" : "RECRUIT MEMBERS"}
              </h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('giris'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Üyelik Paketleri" : "Membership Packages"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onGirisRoleSelected('dealer'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Firma Üyeliği" : "Dealer Membership"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onGirisRoleSelected('manufacturer'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Kit Üreticisi Üyeliği" : "Kit Producer Signup"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onGirisRoleSelected('engineer'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "LPG Mühendisi Üyeliği" : "Expert Engineer Area"}
                </a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onGirisRoleSelected('vehicle_owner'); }} className="hover:text-emerald-600 transition">
                  {language === "tr" ? "Araç Sahibi Üyeliği" : "Vehicle Owner Signup"}
                </a></li>
              </ul>
            </div>
          </div>

          {/* Footer Alt Satırı */}
          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <span>
              {language === "tr" 
                ? "© 2026 LPG PORTAL. Tüm hakları saklıdır." 
                : "© 2026 LPG PORTAL. All statutory rights reserved."
              }
            </span>
            <div className="flex gap-4">
              <span className="text-slate-300">|</span>
              <span>
                {language === "tr" 
                  ? "Alternatif Yakıt ve Çevre Sektör Entegrasyonu" 
                  : "Alternative Fuel and Eco Sector Engineering Integrity"
                }
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Session Terminated Warning Modal */}
      {showSessionTerminatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="session-terminated-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-200 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Oturum Sonlandırıldı</h3>
                <p className="text-[10px] text-slate-400 font-mono">Güvenlik Uyarısı</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p className="font-semibold text-rose-700 bg-rose-50 p-4 rounded-2xl border border-rose-200">
                Hesabınız başka bir cihazdan giriş yaptığı için mevcut oturumunuz sonlandırılmıştır.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSessionTerminatedModal(false);
                  setCurrentTab("giris");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-md shadow-rose-200/50"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
