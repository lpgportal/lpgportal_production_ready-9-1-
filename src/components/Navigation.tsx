import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState } from "react";
import { 
  Flame, 
  MapPin, 
  BookOpen, 
  FileText, 
  Wrench, 
  ShoppingBag, 
  Briefcase, 
  GraduationCap, 
  Calculator,
  User,
  Settings,
  Menu,
  X,
  Lock,
  Globe,
  Phone
} from "lucide-react";
import { DbUser, formatDisplayName } from "../lib/membership";
import { useLanguage } from "../lib/LanguageContext";



interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: string;
  setUserRole: (role: string) => void;
  activeUser: DbUser | null;
  onGirisRoleSelected: (chosenRole: string) => void;
  onLogout?: () => void;
}

export default function Navigation({ 
  currentTab, 
  setCurrentTab, 
  userRole, 
  setUserRole,
  activeUser,
  onGirisRoleSelected,
  onLogout
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const tLocal = (tr: string, en: string) => {
    return language === "tr" ? tr : en;
  };

  const [pricingData, setPricingData] = useState(() => {
    if (typeof window === "undefined") return { active: false, title: "", istanbul: "", ankara: "", izmir: "", savings: "", cities: [] };
    const saved = localStorage.getItem("lpgportal_pricing_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultData = {
      active: true,
      title: "Güncel LPG Fiyatları & Tasarruf Oranları",
      istanbul: "21.40",
      ankara: "21.30",
      izmir: "21.50",
      savings: "%45'e Varan Tasarruf",
      cities: [
        { name: "Bursa", price: "21.25" },
        { name: "Antalya", price: "21.80" }
      ]
    };
    localStorage.setItem("lpgportal_pricing_data", JSON.stringify(defaultData));
    return defaultData;
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("lpgportal_pricing_data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPricingData(prev => {
            if (JSON.stringify(prev) === JSON.stringify(parsed)) {
              return prev;
            }
            return parsed;
          });
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Escape key global listener to close mobile menu
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Logical groupings for the menu items with translated labels
  const menuItems = [
    { id: "dashboard", label: t("nav.dashboard"), icon: Flame },
    { id: "compatibility", label: t("nav.compatibility"), icon: Calculator },
    { id: "companies", label: t("nav.companies"), icon: MapPin },
    { id: "teklif", label: t("nav.teklif"), icon: FileText },
    { id: "supportCenter", label: t("nav.supportCenter"), icon: Wrench },
    { id: "blogSpace", label: t("nav.blogSpace"), icon: BookOpen },
    { id: "phase2", label: t("nav.phase2"), icon: GraduationCap },
    { id: "marketplace", label: t("nav.marketplace"), icon: ShoppingBag },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleProfileSubTabClick = (tabName: "profile" | "notifications") => {
    localStorage.setItem("lpgportal_user_main_tab", tabName);
    setCurrentTab("giris");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-[0_2px_8px_rgba(0,0,0,0.01)] w-full max-w-full overflow-x-hidden">
      <style>{`
        @media (min-width: 1200px) {
          .desktop-nav-only {
            display: flex !important;
          }
          .mobile-nav-only {
            display: none !important;
          }
        }
        @media (max-width: 1199px) {
          .desktop-nav-only {
            display: none !important;
          }
          .mobile-nav-only {
            display: flex !important;
          }
        }
        
        /* Precision scaling for desktop nav items to avoid any possible overflow at lower desktop widths */
        @media (min-width: 1200px) and (max-width: 1350px) {
          .desktop-nav-item {
            font-size: 11px !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            gap: 4px !important;
          }
          .desktop-nav-item svg {
            width: 12px !important;
            height: 12px !important;
          }
          .desktop-nav-container {
            gap: 5px !important;
          }
          .desktop-nav-divider {
            margin-left: 5px !important;
            margin-right: 5px !important;
          }
          .desktop-login-button {
            font-size: 11px !important;
            padding-left: 6px !important;
            padding-right: 6px !important;
            gap: 4px !important;
          }
          .desktop-login-button svg {
            width: 12px !important;
            height: 12px !important;
          }
          .desktop-lang-container {
            padding: 2px !important;
          }
          .desktop-lang-btn {
            font-size: 10px !important;
            padding-left: 4px !important;
            padding-right: 4px !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
          }
        }
      `}</style>
      {/* Top Banner: Fuel Prices simulation & fast info */}
      {pricingData.active && (
        <div className="bg-emerald-50/70 text-emerald-800 text-xs px-4 py-2 border-b border-emerald-100/60 flex flex-col sm:flex-row gap-2 justify-between items-center overflow-x-auto whitespace-nowrap scrollbar-none font-medium text-center sm:text-left">
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center sm:justify-start">
            <span>📢 <strong>{language === "tr" ? pricingData.title : "Real-time Prices & Savings"}:</strong></span>
            <span>⛽ {t("nav.istanbul")}: <strong className="text-slate-900 font-mono">{pricingData.istanbul} TL</strong></span>
            <span>⛽ {t("nav.ankara")}: <strong className="text-slate-900 font-mono">{pricingData.ankara} TL</strong></span>
            <span>⛽ {t("nav.izmir")}: <strong className="text-slate-900 font-mono">{pricingData.izmir} TL</strong></span>
            {pricingData.cities && pricingData.cities.map((city: any, idx: number) => (
              <span key={idx}>⛽ {city.name}: <strong className="text-slate-900 font-mono">{city.price} TL</strong></span>
            ))}
            <span className="hidden md:inline">🔥 {t("nav.savings")}: <strong className="text-emerald-700 font-bold">{language === "tr" ? pricingData.savings : "Up to 45% Savings"}</strong></span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <a 
              href="tel:+905071545920" 
              className="flex items-center gap-1.5 text-slate-700 hover:text-emerald-700 font-mono font-bold text-[11px] transition bg-white/80 hover:bg-white border border-slate-200/60 px-2 py-0.5 rounded shadow-2xs"
              title="📞 0507 154 59 20"
            >
              <span>📞</span>
              <span className="hidden sm:inline">0507 154 59 20</span>
            </a>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-sans">{t("nav.login_role")}:</span>
              <select 
                value={userRole}
                onChange={(e) => onGirisRoleSelected(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 text-[11px] font-bold rounded py-0.5 px-2 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-sm"
              >
                <option value="visitor">{t("nav.role_visitor")}</option>
                <option value="vehicle_owner">{t("nav.role_owner")}</option>
                <option value="dealer">{t("nav.role_dealer")}</option>
                <option value="engineer">{t("nav.role_engineer")}</option>
                <option value="manufacturer">{t("nav.role_manufacturer")}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full gap-4">
          <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => setCurrentTab("dashboard")}>
            <div className="flex items-center gap-1.5">
              <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm">
                <Flame className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 block leading-none">LPG PORTAL</span>
              </div>
            </div>
          </div>

          {/* Desktop menus shifted to the RIGHT and filling the center/right area, with slightly compressed gap of 10-15% (e.g. gap-1.5 xl:gap-2) */}
          <div className="desktop-nav-only hidden xl:flex items-center justify-end flex-1 gap-1.5 xl:gap-2 flex-nowrap">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`desktop-nav-item flex items-center gap-1 px-2 py-1 text-xs xl:text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? "bg-emerald-600 text-white font-bold shadow-sm" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Login and Language selections - placed at the absolute far right of the navbar */}
          <div className="desktop-nav-only hidden xl:flex items-center gap-2 flex-shrink-0">
            <div className="h-4 w-px bg-slate-200"></div>
            
            <button
              onClick={() => handleTabClick("giris")}
              className={`desktop-login-button flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "giris"
                  ? "bg-emerald-950 text-white border border-emerald-900"
                  : activeUser
                  ? "bg-slate-100 text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/50"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>{activeUser ? formatDisplayName(activeUser.name) : t("nav.login_register")}</span>
            </button>

            <div className="h-4 w-px bg-slate-200"></div>
            <div className="desktop-lang-container flex bg-slate-100 rounded-lg p-0.5 border border-slate-200/80 font-sans shadow-xs flex-shrink-0">
              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={`desktop-lang-btn px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  language === "tr" 
                    ? "bg-white text-emerald-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="TR"
              >
                <span>TR</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`desktop-lang-btn px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  language === "en" 
                    ? "bg-white text-emerald-800 shadow-sm" 
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="EN"
              >
                <span>EN</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Actions */}
          <div className="mobile-nav-only flex items-center xl:hidden gap-1.5">
            {/* Quick Mini Toggle for Mobile */}
            <button
              type="button"
              onClick={() => setLanguage(language === "tr" ? "en" : "tr")}
              className="flex items-center justify-center p-2 rounded-md text-slate-600 hover:bg-slate-50 font-bold text-xs gap-1"
              title="Dili Değiştir / Switch Language"
            >
              <Globe className="h-4 w-4 text-slate-500" />
              <span>{language === "tr" ? "TR" : "EN"}</span>
            </button>

            <button
              onClick={() => handleTabClick("giris")}
              className={`flex items-center justify-center p-2 rounded-md ${
                currentTab === "giris" ? "text-emerald-700 bg-emerald-50" : "text-slate-500 hover:text-slate-800"
              }`}
              title={tLocal("Üye Paneli", "Member Portal")}
            >
              <User className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel: Sliding Drawer from right & Modal Backdrop overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 xl:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div 
        className={`fixed inset-y-0 right-0 z-[1000] w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform xl:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        id="mobile-drawer-menu"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => { setCurrentTab("dashboard"); setMobileMenuOpen(false); }}>
            <div className="bg-emerald-600 p-1.5 rounded-lg shadow-sm animate-bounce">
              <Flame className="h-4 w-4 text-white animate-pulse" />
            </div>
            <span className="text-sm font-black tracking-tight text-slate-900 leading-none">LPG PORTAL</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition focus:outline-none cursor-pointer"
            title={language === "tr" ? "Kapat" : "Close"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable contents inside mobile menu */}
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6">
          
          {/* 1. Language switcher (TR / EN) */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              🌍 {language === "tr" ? "Dil Seçimi" : "Language Selection"}
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-200/60 rounded-xl p-1 font-sans">
              <button
                type="button"
                onClick={() => setLanguage("tr")}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                  language === "tr" 
                    ? "bg-white text-emerald-800 shadow-xs border border-slate-200/30 font-extrabold" 
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <span>🇹🇷</span><span>TR</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                  language === "en" 
                    ? "bg-white text-emerald-800 shadow-xs border border-slate-200/30 font-extrabold" 
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <span>🇬🇧</span><span>EN</span>
              </button>
            </div>
          </div>

          {/* 2. Primary Navigation Links */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              📂 {language === "tr" ? "Ana Menü" : "Main Menu"}
            </span>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition duration-150 cursor-pointer ${
                      isActive 
                        ? "bg-emerald-600 text-white font-bold shadow-sm" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Logged-in Account Section OR Login/Register Trigger */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {activeUser ? (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  👤 {language === "tr" ? "Kullanıcı Paneli" : "User Account"}
                </span>
                
                {/* Active user preview pill */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm shrink-0">
                    {activeUser.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-slate-800 block truncate leading-tight">{activeUser.name}</span>
                    <span className="text-[9px] font-semibold text-slate-500 block truncate font-mono uppercase tracking-tight mt-0.5">{activeUser.role}</span>
                  </div>
                </div>

                {/* Sub Menu Links for member */}
                <div className="space-y-1">
                  <button
                    onClick={() => handleProfileSubTabClick("profile")}
                    className="flex items-center gap-3 w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium cursor-pointer"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>{language === "tr" ? "Profil" : "Profile"}</span>
                  </button>
                  <button
                    onClick={() => handleProfileSubTabClick("notifications")}
                    className="flex items-center gap-3 w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium cursor-pointer"
                  >
                    <span>🔔</span>
                    <span>{language === "tr" ? "Bildirimler" : "Notifications"}</span>
                  </button>
                  <button
                    onClick={() => handleProfileSubTabClick("profile")}
                    className="flex items-center gap-3 w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition font-medium cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>{language === "tr" ? "Üyelik Bilgileri" : "Membership Info"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        localStorage.removeItem("lpgportal_active_user");
                        window.location.reload();
                      }
                    }}
                    className="flex items-center gap-3 w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm text-rose-600 hover:bg-rose-50/50 transition font-bold cursor-pointer"
                  >
                    <Lock className="h-4 w-4 text-rose-400" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  🔒 {language === "tr" ? "Sistem Girişi" : "Authentication"}
                </span>
                <button
                  onClick={() => handleTabClick("giris")}
                  className="flex items-center justify-center gap-2 w-full text-center py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  <User className="h-4 w-4" />
                  <span>{t("nav.login_register")}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info in drawer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-center font-mono text-[8px] text-slate-400 uppercase tracking-wider">
          {tLocal("LPG PORTAL Mobil Menü Sistemi", "LPG PORTAL Mobile Menu System")}
        </div>
      </div>
    </nav>
  );
}
