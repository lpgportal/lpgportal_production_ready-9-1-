import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Gift, 
  ExternalLink, 
  Bell, 
  FileText, 
  CheckCircle2, 
  Building, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ChevronRight,
  Eye,
  EyeOff,
  Search,
  Calendar,
  User,
  ShieldCheck,
  Mail,
  Globe,
  Phone,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Plus
} from "lucide-react";
import { DbUser, getUsers, saveUsers, addCentralNotification } from "../lib/membership";

// Campaign Interface
export interface Campaign {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  shortDescription: string;
  content: string;
  terms: string;
  coverImage?: string;
  publishDate: string;
  expiryDate: string;
  status: "Taslak" | "Yayında" | "Pasif" | "Süresi Doldu";
  type: "bilgilendirme" | "kod" | "link";
  url?: string;
  allowedRoles: ("all" | "visitor" | "vehicle_owner" | "dealer" | "engineer" | "manufacturer" | "admin")[];
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  gallery?: string[];
  contactInfo?: string;
}

// Partnership Application Interface
export interface CampaignApplication {
  id: string;
  companyName: string;
  authorizedName: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  campaignType: string;
  message: string;
  status: "Beklemede" | "Onaylandı" | "Reddedildi";
  createdAt: string;
}

// Claimed Code Log Interface
export interface ClaimedCodeLog {
  id: string;
  campaignId: string;
  campaignTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  code: string;
  claimedAt: string;
}

interface CampaignsSystemProps {
  activeUser: DbUser | null;
  mode: "user" | "admin";
  onNavigateToTab?: (tab: string) => void;
  language?: "tr" | "en";
}

// Seed Initial Campaigns if none in localStorage
const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: "camp_atiker_15",
    title: "Atiker Sıralı Otogaz Kitlerinde %15 İndirim",
    companyName: "Atiker",
    shortDescription: "LPGPORTAL üyelerine özel, Atiker bayilerinde geçerli tüm sıralı otogaz dönüşüm kitlerinde net %15 indirim fırsatı!",
    content: "LPGPORTAL üyelerine özel, Atiker'in yaygın bayi ağında geçerli sıralı otogaz montajlarında net %15 indirim sunulmaktadır. Kampanya kodunuzu alarak size en yakın yetkili Atiker bayisine başvurabilirsiniz. Dönüşüm işleminizi avantajlı fiyatlarla tamamlayın.",
    terms: "Bu kampanya diğer indirimlerle birleştirilemez. Her üye yalnızca 1 kez kod alabilir. Kampanya kodları tek kullanımlıktır ve yetkili Atiker bayilerinde montaj öncesinde ibraz edilmelidir.",
    publishDate: "2026-06-01",
    expiryDate: "2026-12-31",
    status: "Yayında",
    type: "kod",
    allowedRoles: ["all"],
    slug: "atiker-sirali-otogaz-15-indirim",
    metaTitle: "Atiker %15 İndirim Kampanyası - LPGPORTAL",
    metaDescription: "Atiker otogaz sistemlerinde net %15 üye indirimi fırsatını kaçırmayın.",
    contactInfo: "Destek Hattı: 444 0 ATK (285)",
    gallery: []
  },
  {
    id: "camp_brc_maestro",
    title: "BRC Maestro DI Direkt Enjeksiyon Lansman Fırsatı",
    companyName: "BRC Türkiye",
    shortDescription: "TSI, FSI, GDI ve T-GDI direkt enjeksiyonlu motorlar için geliştirilen BRC Maestro DI sistemlerinde lansmana özel hediye çeki!",
    content: "Yeni nesil direkt enjeksiyonlu araçlar için kusursuz uyum ve yüksek tasarruf sağlayan BRC Maestro DI sistemine hemen geçiş yapın. Lansmana özel 2.000 TL değerinde akaryakıt hediye çeki fırsatını yakalamak için aşağıdaki bağlantıyı kullanabilirsiniz.",
    terms: "Kampanya sadece anlaşmalı BRC Premium Servislerinde yapılacak Maestro DI montajlarında geçerlidir. Lansman hediyeleri stoklarla sınırlıdır.",
    publishDate: "2026-06-15",
    expiryDate: "2026-09-30",
    status: "Yayında",
    type: "link",
    url: "https://www.brc.com.tr",
    allowedRoles: ["vehicle_owner", "admin"],
    slug: "brc-maestro-di-lansman-firsati",
    metaTitle: "BRC Maestro DI Lansman Kampanyası - LPGPORTAL",
    metaDescription: "BRC Maestro direkt enjeksiyon otogaz kiti lansman hediyelerini keşfedin.",
    contactInfo: "İletişim: info@brc.com.tr",
    gallery: []
  },
  {
    id: "camp_lovato_obd",
    title: "Mühendislere Özel Lovato OBD & Kalibrasyon Eğitimi",
    companyName: "Lovato Gas",
    shortDescription: "Lovato teknik mühendisleri tarafından verilecek OBD II parametrik kalibrasyon ve hata teşhis online eğitim programı.",
    content: "LPGPORTAL üyesi mühendis ve teknik ustalara özel olarak organize edilen online eğitim programı. Yeni nesil Lovato OBD II yazılımları, gelişmiş kalibrasyon ayarları ve arıza teşhis adımları Lovato İtalyan teknik ekibi eşliğinde ele alınacaktır. Katılım ücretsizdir.",
    terms: "Sadece LPGPORTAL sisteminde kayıtlı yetki belgeli LPG Mühendisleri ve bayileri katılabilir. Eğitim sonunda dijital katılım sertifikası verilecektir.",
    publishDate: "2026-07-01",
    expiryDate: "2026-08-15",
    status: "Yayında",
    type: "bilgilendirme",
    allowedRoles: ["engineer", "dealer", "admin"],
    slug: "lovato-obd-kalibrasyon-egitimi",
    metaTitle: "Lovato OBD & Kalibrasyon Eğitimi - LPGPORTAL",
    metaDescription: "LPG mühendislerine özel Lovato OBD II online eğitim katılım koşulları.",
    contactInfo: "Eğitim Koordinatörlüğü: egitim@lovato.com.tr",
    gallery: []
  }
];

export default function CampaignsSystem({ activeUser, mode, onNavigateToTab, language = "tr" }: CampaignsSystemProps) {
  // Load State from LocalStorage
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [codesLog, setCodesLog] = useState<ClaimedCodeLog[]>([]);
  
  // UI Tabs & Views
  const [userTab, setUserTab] = useState<"active" | "codes">("active");
  const [adminSubTab, setAdminSubTab] = useState<"campaigns" | "codes" | "applications">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  
  // Forms & Editing
  const [showAddEditForm, setShowAddEditForm] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState<string | null>(null);
  
  // Campaign Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formShortDescription, setFormShortDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTerms, setFormTerms] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formType, setFormType] = useState<"bilgilendirme" | "kod" | "link">("bilgilendirme");
  const [formUrl, setFormUrl] = useState("");
  const [formAllowedRoles, setFormAllowedRoles] = useState<string[]>(["all"]);
  const [formStatus, setFormStatus] = useState<Campaign["status"]>("Yayında");
  const [formContactInfo, setFormContactInfo] = useState("");
  const [formGallery, setFormGallery] = useState<string[]>([]);
  
  // Partnership Application Form State
  const [appCompanyName, setAppCompanyName] = useState(activeUser?.company_name || "");
  const [appAuthorizedName, setAppAuthorizedName] = useState(activeUser?.authorized_name || activeUser?.name || "");
  const [appPhone, setAppPhone] = useState(activeUser?.phone || "");
  const [appEmail, setAppEmail] = useState(activeUser?.email || "");
  const [appWebsite, setAppWebsite] = useState(activeUser?.website || "");
  const [appDescription, setAppDescription] = useState("");
  const [appCampaignType, setAppCampaignType] = useState("kod");
  const [appMessage, setAppMessage] = useState("");
  const [appSuccessMessage, setAppSuccessMessage] = useState("");
  
  // Search / Filters
  const [adminSearch, setAdminSearch] = useState("");

  // Initialize Lists and Expiry Checker
  useEffect(() => {
    // 1. Fetch campaigns
    const savedCamps = localStorage.getItem("lpgportal_campaigns");
    let loadedCamps: Campaign[] = savedCamps ? JSON.parse(savedCamps) : DEFAULT_CAMPAIGNS;
    
    // Auto Expiry Check
    const nowStr = new Date().toISOString().split("T")[0];
    let changed = false;
    loadedCamps = loadedCamps.map(c => {
      if (c.expiryDate && c.expiryDate < nowStr && c.status === "Yayında") {
        changed = true;
        return { ...c, status: "Süresi Doldu" };
      }
      return c;
    });

    if (changed) {
      localStorage.setItem("lpgportal_campaigns", JSON.stringify(loadedCamps));
    }
    setCampaigns(loadedCamps);

    // 2. Fetch applications
    const savedApps = localStorage.getItem("lpgportal_campaign_applications");
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    }

    // 3. Fetch codes
    const savedCodes = localStorage.getItem("lpgportal_campaign_codes");
    if (savedCodes) {
      setCodesLog(JSON.parse(savedCodes));
    }
  }, []);

  // Listen to cross-tab/database updates for campaigns data sync
  useEffect(() => {
    const handleDbUpdate = (e: any) => {
      const { key, value } = e.detail;
      if (key === "lpgportal_campaigns" && Array.isArray(value)) {
        setCampaigns(value);
      } else if (key === "lpgportal_campaign_applications" && Array.isArray(value)) {
        setApplications(value);
      } else if (key === "lpgportal_campaign_codes" && Array.isArray(value)) {
        setCodesLog(value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  // Save changes to localStorage
  const saveCampaignsList = (list: Campaign[]) => {
    localStorage.setItem("lpgportal_campaigns", JSON.stringify(list));
    setCampaigns(list);
  };

  const saveApplicationsList = (list: CampaignApplication[]) => {
    if (list.length > applications.length && activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
      alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
      return;
    }
    localStorage.setItem("lpgportal_campaign_applications", JSON.stringify(list));
    setApplications(list);
  };

  const saveCodesList = (list: ClaimedCodeLog[]) => {
    localStorage.setItem("lpgportal_campaign_codes", JSON.stringify(list));
    setCodesLog(list);
  };

  // Check if current user has access to campaign
  const hasAccessToCampaign = (camp: Campaign): boolean => {
    if (!activeUser) return false;
    if (activeUser.role === "admin") return true;
    if (camp.allowedRoles.includes("all")) return true;
    return camp.allowedRoles.includes(activeUser.role);
  };

  // Filter campaigns for user view
  const userVisibleCampaigns = campaigns.filter(c => {
    if (c.status !== "Yayında" && c.status !== "Süresi Doldu") return false;
    return hasAccessToCampaign(c);
  });

  // Generate Unique Code
  const handleClaimCode = (camp: Campaign) => {
    if (!activeUser) return;
    if (activeUser.subscription_type === "free" && activeUser.role !== "admin") {
      alert("Bu özelliğe erişebilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
      return;
    }

    // Double claim validation
    const alreadyClaimed = codesLog.some(log => log.campaignId === camp.id && log.userId === activeUser.id);
    if (alreadyClaimed) {
      alert(language === "tr" ? "Bu kampanyadan daha önce kod aldınız!" : "You have already claimed a code for this campaign!");
      return;
    }

    // Generate Code format: BRAND+YEAR-RANDOM
    const brandPrefix = camp.companyName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || "LPG";
    const year = new Date().getFullYear();
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${brandPrefix}${year}-${randomPart}`;

    const newLog: ClaimedCodeLog = {
      id: "code_" + Date.now(),
      campaignId: camp.id,
      campaignTitle: camp.title,
      userId: activeUser.id,
      userName: activeUser.name,
      userEmail: activeUser.email,
      userRole: activeUser.role,
      code: code,
      claimedAt: new Date().toLocaleString()
    };

    const updatedLogs = [newLog, ...codesLog];
    saveCodesList(updatedLogs);

    // Notify user in their Panel Notification Center
    addCentralNotification(
      activeUser.id,
      language === "tr" ? "🎁 Kampanya Kodu Tanımlandı" : "🎁 Campaign Code Claimed",
      language === "tr" 
        ? `${camp.companyName} kampanyası için kodunuz üretildi: ${code}. Montaj sırasında kullanabilirsiniz.`
        : `Your code for ${camp.companyName} campaign has been generated: ${code}. Present it during installation.`,
      "duyuru",
      "panel"
    );

    alert(language === "tr" ? `Kampanya kodunuz başarıyla alındı: ${code}` : `Campaign code successfully claimed: ${code}`);
  };

  // Submit Partnership Application
  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
      alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
      return;
    }

    const newApp: CampaignApplication = {
      id: "app_" + Date.now(),
      companyName: appCompanyName,
      authorizedName: appAuthorizedName,
      phone: appPhone,
      email: appEmail,
      website: appWebsite,
      description: appDescription,
      campaignType: appCampaignType,
      message: appMessage,
      status: "Beklemede",
      createdAt: new Date().toLocaleString()
    };

    const updatedApps = [newApp, ...applications];
    saveApplicationsList(updatedApps);

    // Notify Admins
    const allUsers = getUsers();
    const admins = allUsers.filter(u => u.role === "admin");
    admins.forEach(admin => {
      addCentralNotification(
        admin.id,
        "💼 Yeni Kurumsal İş Birliği Başvurusu",
        `'${appCompanyName}' firması yeni bir kurumsal kampanya / iş birliği talebinde bulundu. Yönetim panelinden inceleyebilirsiniz.`,
        "duyuru",
        "panel"
      );
    });

    setAppSuccessMessage(language === "tr" ? "Başvurunuz başarıyla alındı. Yönetici onayından sonra sizinle iletişime geçilecektir." : "Your application was submitted successfully. We will contact you shortly.");
    
    // Clear custom form fields
    setAppDescription("");
    setAppMessage("");
  };

  // Toggle notification subscription
  const handleToggleSubscription = () => {
    if (!activeUser) return;
    const users = getUsers();
    const isSubscribed = activeUser.marketing_approved ?? false;
    const updatedUser = { ...activeUser, marketing_approved: !isSubscribed };
    
    const newList = users.map(u => u.id === activeUser.id ? updatedUser : u);
    saveUsers(newList);

    // Force parent refresh if possible
    window.location.reload(); 
  };

  // Admin: Save Campaign (Create/Edit)
  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formCompanyName || !formShortDescription || !formContent || !formTerms || !formExpiryDate) {
      alert(language === "tr" ? "Lütfen tüm zorunlu alanları doldurun." : "Please fill in all required fields.");
      return;
    }

    const slug = formTitle.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    if (editCampaignId) {
      // Edit mode
      const updated = campaigns.map(c => {
        if (c.id === editCampaignId) {
          return {
            ...c,
            title: formTitle,
            companyName: formCompanyName,
            shortDescription: formShortDescription,
            content: formContent,
            terms: formTerms,
            coverImage: formCoverImage,
            gallery: formGallery,
            expiryDate: formExpiryDate,
            type: formType,
            url: formType === "link" ? formUrl : undefined,
            allowedRoles: formAllowedRoles as any,
            status: formStatus,
            contactInfo: formContactInfo,
            slug
          };
        }
        return c;
      });
      saveCampaignsList(updated);
      alert(language === "tr" ? "Kampanya başarıyla güncellendi." : "Campaign successfully updated.");
    } else {
      // Create mode
      const newCamp: Campaign = {
        id: "camp_" + Date.now(),
        title: formTitle,
        companyName: formCompanyName,
        shortDescription: formShortDescription,
        content: formContent,
        terms: formTerms,
        coverImage: formCoverImage,
        gallery: formGallery,
        publishDate: new Date().toISOString().split("T")[0],
        expiryDate: formExpiryDate,
        status: formStatus,
        type: formType,
        url: formType === "link" ? formUrl : undefined,
        allowedRoles: formAllowedRoles as any,
        contactInfo: formContactInfo,
        slug
      };

      const updated = [newCamp, ...campaigns];
      saveCampaignsList(updated);

      // Auto-notify subscribed users about the new campaign
      const allUsers = getUsers();
      allUsers.forEach(user => {
        const wantsNotifications = user.marketing_approved ?? false;
        const matchesRole = newCamp.allowedRoles.includes("all") || newCamp.allowedRoles.includes(user.role);
        if (wantsNotifications && matchesRole && newCamp.status === "Yayında") {
          addCentralNotification(
            user.id,
            `🎉 Yeni Kampanya: ${newCamp.title}`,
            `${newCamp.companyName} tarafından yeni bir üye avantajı yayınlandı! Detayları panelinizde inceleyin.`,
            "duyuru",
            "panel"
          );
        }
      });

      alert(language === "tr" ? "Yeni kampanya başarıyla oluşturuldu." : "New campaign successfully created.");
    }

    // Reset Form
    setShowAddEditForm(false);
    setEditCampaignId(null);
    clearCampaignForm();
  };

  const clearCampaignForm = () => {
    setFormTitle("");
    setFormCompanyName("");
    setFormShortDescription("");
    setFormContent("");
    setFormTerms("");
    setFormCoverImage("");
    setFormExpiryDate("");
    setFormType("bilgilendirme");
    setFormUrl("");
    setFormAllowedRoles(["all"]);
    setFormStatus("Yayında");
    setFormContactInfo("");
    setFormGallery([]);
  };

  // Open Edit Form
  const handleEditClick = (camp: Campaign) => {
    setEditCampaignId(camp.id);
    setFormTitle(camp.title);
    setFormCompanyName(camp.companyName);
    setFormShortDescription(camp.shortDescription);
    setFormContent(camp.content);
    setFormTerms(camp.terms);
    setFormCoverImage(camp.coverImage || "");
    setFormExpiryDate(camp.expiryDate);
    setFormType(camp.type);
    setFormUrl(camp.url || "");
    setFormAllowedRoles(camp.allowedRoles);
    setFormStatus(camp.status);
    setFormContactInfo(camp.contactInfo || "");
    setFormGallery(camp.gallery || []);
    setShowAddEditForm(true);
  };

  // Delete Campaign
  const handleDeleteCampaign = (id: string) => {
    if (!window.confirm(language === "tr" ? "Bu kampanyayı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this campaign?")) return;
    const updated = campaigns.filter(c => c.id !== id);
    saveCampaignsList(updated);
  };

  // Handle application actions
  const handleApproveApplication = (appId: string) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status: "Onaylandı" as const } : a);
    saveApplicationsList(updated);
    alert(language === "tr" ? "Başvuru onaylandı." : "Application approved.");
  };

  const handleRejectApplication = (appId: string) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status: "Reddedildi" as const } : a);
    saveApplicationsList(updated);
    alert(language === "tr" ? "Başvuru reddedildi." : "Application rejected.");
  };

  const handleDeleteApplication = (appId: string) => {
    if (!window.confirm(language === "tr" ? "Başvuruyu silmek istediğinize emin misiniz?" : "Are you sure you want to delete this application?")) return;
    const updated = applications.filter(a => a.id !== appId);
    saveApplicationsList(updated);
  };

  // Simulating CSV download for generated codes
  const handleExportCSV = () => {
    if (codesLog.length === 0) {
      alert(language === "tr" ? "Dışa aktarılacak kod kaydı bulunmuyor." : "No code claims to export.");
      return;
    }

    const headers = "Kullanici Adi,Kullanici E-posta,Kullanici Rolu,Kampanya Basligi,Kod,Alim Tarihi\n";
    const rows = codesLog.map(log => 
      `"${log.userName}","${log.userEmail}","${log.userRole}","${log.campaignTitle}","${log.code}","${log.claimedAt}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lpgportal_kampanya_kodlari_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: return a gorgeous CSS gradient background representation
  const getBannerGradient = (index: number) => {
    const gradients = [
      "from-emerald-500 to-teal-600",
      "from-blue-600 to-indigo-700",
      "from-amber-500 to-orange-600",
      "from-rose-500 to-pink-600",
      "from-violet-600 to-purple-800"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="w-full text-slate-800 font-sans">
      
      {/* -------------------- USER VIEW -------------------- */}
      {mode === "user" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-550 text-amber-500" />
                {language === "tr" ? "Üyelere Özel Kampanyalar" : "Exclusive Campaigns"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === "tr" ? "LPGPORTAL üyesi olmanın ayrıcalıklarını yaşayın, lider otogaz markalarının özel fırsatlarından yararlanın." : "Enjoy benefits of being a member. Explore premium discounts and events."}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setUserTab("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userTab === "active" 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {language === "tr" ? "Aktif Kampanyalar" : "Active Campaigns"}
              </button>
              <button 
                onClick={() => setUserTab("codes")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  userTab === "codes" 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {language === "tr" ? "Kodlarım & Geçmişim" : "My Codes & History"}
              </button>
            </div>
          </div>

          {/* Toggle Alert Subscription Panel */}
          {userTab === "active" && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {language === "tr" ? "Kampanyalardan İlk Sen Haberdar Ol" : "Get Notified of New Deals First"}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    {language === "tr" ? "Yeni kampanya ve kurumsal fırsatlar sisteme eklendiğinde panel bildirimi almak için aboneliği aktifleştirin." : "Opt-in to receive central dashboard alerts instantly when new campaigns drop."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleSubscription}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-lg shadow-xs shrink-0 cursor-pointer transition-all"
              >
                {activeUser?.marketing_approved ? (
                  <>
                    <ToggleRight className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-800">{language === "tr" ? "Abonelik Aktif" : "Subscribed"}</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5 text-slate-400" />
                    <span>{language === "tr" ? "Abone Ol" : "Subscribe"}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {userTab === "active" && (
            <>
              {userVisibleCampaigns.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-400 text-xs font-medium">
                  {language === "tr" ? "Şu anda rolünüze uygun aktif bir kampanya bulunmuyor." : "No active campaigns for your account role at the moment."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userVisibleCampaigns.map((camp, idx) => {
                    const isClaimed = codesLog.some(log => log.campaignId === camp.id && log.userId === activeUser?.id);
                    return (
                      <div 
                        key={camp.id} 
                        className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col h-full group"
                      >
                        {/* Kapak / Gradient placeholder */}
                        <div 
                          className="h-36 p-4 flex flex-col justify-between text-white relative overflow-hidden bg-cover bg-center"
                          style={camp.coverImage ? { backgroundImage: `url(${camp.coverImage})` } : undefined}
                        >
                          {!camp.coverImage && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${getBannerGradient(idx)}`} />
                          )}
                          {camp.coverImage && (
                            <div className="absolute inset-0 bg-slate-900/40" />
                          )}
                          <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-15">
                            <Sparkles className="h-32 w-32" />
                          </div>
                          
                          <span className="bg-white/20 backdrop-blur-md border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider self-start z-10">
                            {camp.companyName}
                          </span>
                          
                          <div className="space-y-0.5 z-10">
                            <h3 className="text-sm font-extrabold line-clamp-2 leading-tight">
                              {camp.title}
                            </h3>
                          </div>
                        </div>

                        {/* Detay */}
                        <div className="p-4 flex flex-col flex-grow justify-between space-y-4">
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                              {camp.shortDescription}
                            </p>
                            <div className="grid grid-cols-2 gap-1 text-[9px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
                              <div>{language === "tr" ? "Yayın:" : "Published:"} {camp.publishDate}</div>
                              <div className="text-right">
                                {camp.status === "Süresi Doldu" ? (
                                  <span className="text-rose-500 font-bold uppercase">{language === "tr" ? "SÜRESİ DOLDU" : "EXPIRED"}</span>
                                ) : (
                                  <span className="text-slate-500">{language === "tr" ? "Son:" : "Ends:"} {camp.expiryDate}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => {
                                if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
                                  alert("Bu kampanyaya erişebilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                                } else {
                                  setSelectedCampaign(camp);
                                }
                              }}
                              className="flex-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-150 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {language === "tr" ? "Kampanyayı İncele" : "Inspect Campaign"}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                            {camp.type === "kod" && isClaimed && (
                              <span className="bg-rose-50 text-rose-700 px-2 py-2 rounded-xl border border-rose-150" title={language === "tr" ? "Kod Alındı" : "Code Claimed"}>
                                <Check className="h-3.5 w-3.5 font-bold" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Kurumsal İş Birliği Call-out */}
              <div className="mt-8 border border-dashed border-slate-350 p-6 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1 text-left">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Building className="h-4.5 w-4.5 text-emerald-600" />
                    {language === "tr" ? "Partner Firmamız Olmak İster Misiniz?" : "Would You Like to Become a Partner?"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    {language === "tr" ? "LPGPORTAL üyelerine özel kampanya tanımlamak veya kurumsal iş birliği projeleri geliştirmek için hemen başvurun." : "Apply to run campaigns or corporate deals for LPGPORTAL's broad base of autogas members."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
                      alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                      return;
                    }
                    setSelectedCampaign({
                      id: "custom_app_form",
                      title: language === "tr" ? "Kurumsal İş Birliği Başvurusu" : "Corporate Collaboration Application",
                      companyName: "LPGPORTAL",
                      shortDescription: "",
                      content: "",
                      terms: "",
                      publishDate: "",
                      expiryDate: "",
                      status: "Yayında",
                      type: "bilgilendirme",
                      allowedRoles: ["all"],
                      slug: "is-birligi-basvurusu"
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition cursor-pointer shrink-0"
                >
                  {language === "tr" ? "İş Birliği Başvurusu Yap" : "Submit Application"}
                </button>
              </div>
            </>
          )}

          {/* User Tab: Claimed Codes */}
          {userTab === "codes" && (
            <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-150 bg-slate-50/70">
                <h3 className="text-xs font-bold text-slate-800">
                  {language === "tr" ? "Aldığınız Kampanya Kodları Geçmişi" : "Your Claimed Campaign Codes"}
                </h3>
              </div>
              
              {codesLog.filter(log => log.userId === activeUser?.id).length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  {language === "tr" ? "Henüz hiçbir kampanya kodu almadınız." : "You have not claimed any campaign codes yet."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono uppercase text-[10px]">
                        <th className="p-3">{language === "tr" ? "Kampanya" : "Campaign"}</th>
                        <th className="p-3">{language === "tr" ? "Kod" : "Code"}</th>
                        <th className="p-3">{language === "tr" ? "Alım Tarihi" : "Claim Date"}</th>
                        <th className="p-3 text-center">{language === "tr" ? "Durum" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {codesLog.filter(log => log.userId === activeUser?.id).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{log.campaignTitle}</td>
                          <td className="p-3">
                            <span className="font-mono bg-emerald-50 text-emerald-800 font-bold border border-emerald-150 px-2 py-0.5 rounded">
                              {log.code}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{log.claimedAt}</td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                              <Check className="h-3 w-3" />
                              {language === "tr" ? "Kayıtlı" : "Registered"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* User View: Modal Detail View */}
          {selectedCampaign && (activeUser?.subscription_type !== "free" || activeUser?.role === "admin") && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-slate-50 shrink-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {selectedCampaign.title}
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setSelectedCampaign(null); setAppSuccessMessage(""); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-150 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-grow text-left">
                  
                  {/* If custom app form is selected */}
                  {selectedCampaign.id === "custom_app_form" ? (
                    <div className="space-y-4">
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-xs text-emerald-800 leading-relaxed">
                        <strong>LPGPORTAL İş Birliği Koşulları:</strong> Kampanyalarımız tamamen kapalı devre olup sadece kayıtlı üye panelinde yayınlanır. Dış dünya ve arama motorları indekslemesine kapalıdır.
                      </div>
                      
                      {appSuccessMessage ? (
                        <div className="p-6 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl text-center space-y-3">
                          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                          <p className="text-xs font-bold">{appSuccessMessage}</p>
                        </div>
                      ) : (
                        <form onSubmit={handleAppSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "Firma Adı *" : "Company Name *"}</label>
                              <input 
                                type="text" 
                                required
                                value={appCompanyName}
                                onChange={(e) => setAppCompanyName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "Yetkili Kişi *" : "Authorized Person *"}</label>
                              <input 
                                type="text" 
                                required
                                value={appAuthorizedName}
                                onChange={(e) => setAppAuthorizedName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "Telefon *" : "Phone *"}</label>
                              <input 
                                type="tel" 
                                required
                                value={appPhone}
                                onChange={(e) => setAppPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "E-posta *" : "Email *"}</label>
                              <input 
                                type="email" 
                                required
                                value={appEmail}
                                onChange={(e) => setAppEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "Web Sitesi" : "Website"}</label>
                              <input 
                                type="url" 
                                placeholder="https://"
                                value={appWebsite}
                                onChange={(e) => setAppWebsite(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 block">{language === "tr" ? "Kampanya Türü *" : "Campaign Type *"}</label>
                              <select
                                value={appCampaignType}
                                onChange={(e) => setAppCampaignType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                              >
                                <option value="kod">{language === "tr" ? "Kampanya Kodu Dağıtımı" : "Code Claim Deal"}</option>
                                <option value="link">{language === "tr" ? "Kampanyaya Git (Bağlantı Yönlendirme)" : "Redirect Link Deal"}</option>
                                <option value="bilgilendirme">{language === "tr" ? "Sadece Bilgilendirme / Duyuru" : "Informative/News"}</option>
                                <option value="diger">{language === "tr" ? "Diğer Ortaklık Projeleri" : "Other Collaboration"}</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-700 block">{language === "tr" ? "Firma Tanıtımı / Açıklaması *" : "Company Description *"}</label>
                            <textarea 
                              required
                              rows={3}
                              value={appDescription}
                              onChange={(e) => setAppDescription(e.target.value)}
                              placeholder={language === "tr" ? "Firmanız ve faaliyet alanlarınız..." : "Describe your company..."}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                            />
                          </div>

                          <div className="space-y-1 text-xs">
                            <label className="font-bold text-slate-700 block">{language === "tr" ? "Başvuru Mesajınız / Teklifiniz" : "Proposal Details"}</label>
                            <textarea 
                              rows={3}
                              value={appMessage}
                              onChange={(e) => setAppMessage(e.target.value)}
                              placeholder={language === "tr" ? "Planladığınız kampanya içeriği..." : "What discount/event do you propose?"}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-sans"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer"
                          >
                            {language === "tr" ? "Başvuruyu Gönder" : "Submit Proposal"}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    // Regular campaign detail
                    <div className="space-y-6 text-slate-750">
                      
                      {/* Cover Image in Detail Modal */}
                      <div 
                        className="h-40 rounded-xl relative overflow-hidden bg-cover bg-center"
                        style={selectedCampaign.coverImage ? { backgroundImage: `url(${selectedCampaign.coverImage})` } : undefined}
                      >
                        {!selectedCampaign.coverImage && (
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
                        )}
                        {selectedCampaign.coverImage && (
                          <div className="absolute inset-0 bg-slate-900/35" />
                        )}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end text-white text-left bg-gradient-to-t from-slate-950/65 to-transparent">
                          <span className="text-[10px] uppercase font-mono font-bold tracking-wider bg-white/20 backdrop-blur-md px-2 py-0.5 rounded self-start mb-2">
                            {selectedCampaign.companyName}
                          </span>
                          <h3 className="text-sm font-black leading-tight">{selectedCampaign.title}</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-150 pb-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">{language === "tr" ? "Kampanya Sahibi:" : "Provider:"}</span>
                          <strong className="text-slate-800 text-sm flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-emerald-600 shrink-0" />
                            {selectedCampaign.companyName}
                          </strong>
                        </div>
                        <div className="space-y-1 sm:text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">{language === "tr" ? "Geçerlilik:" : "Valid Until:"}</span>
                          <strong className="text-slate-700 text-xs">
                            {selectedCampaign.publishDate} ~ {selectedCampaign.expiryDate}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">{language === "tr" ? "Kampanya İçeriği" : "About the Deal"}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                          {selectedCampaign.content}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">{language === "tr" ? "Katılım ve Kampanya Şartları" : "Terms & Conditions"}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                          {selectedCampaign.terms}
                        </p>
                      </div>

                      {selectedCampaign.contactInfo && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{selectedCampaign.contactInfo}</span>
                        </div>
                      )}

                      {/* Gallery in Detail Modal */}
                      {selectedCampaign.gallery && selectedCampaign.gallery.length > 0 && (
                        <div className="space-y-2 text-left">
                          <h4 className="text-xs font-bold text-slate-950 uppercase tracking-wider font-mono">
                            {language === "tr" ? "📸 Kampanya Görselleri" : "📸 Campaign Gallery"}
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {selectedCampaign.gallery.map((img, i) => (
                              <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-150 relative group">
                                <img src={img} className="w-full h-full object-cover" alt="Gallery Item" />
                                <div 
                                  onClick={() => window.open(img, "_blank")}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-zoom-in"
                                >
                                  <Eye className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTION REGION */}
                      <div className="pt-4 border-t border-slate-150 flex flex-col gap-4">
                        
                        {/* Type: Code distribution */}
                        {selectedCampaign.type === "kod" && (
                          <div className="space-y-3 text-center">
                            {(() => {
                              const claimLog = codesLog.find(log => log.campaignId === selectedCampaign.id && log.userId === activeUser?.id);
                              if (claimLog) {
                                return (
                                  <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded-xl space-y-2">
                                    <div className="text-[10px] font-bold uppercase font-mono tracking-wider">{language === "tr" ? "KAMPANYA KODUNUZ" : "YOUR DEAL CODE"}</div>
                                    <div className="text-lg font-black font-mono tracking-widest bg-white py-2 rounded-lg border border-emerald-250 select-all">
                                      {claimLog.code}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{language === "tr" ? "Alım Tarihi:" : "Claimed at:"} {claimLog.claimedAt}</div>
                                  </div>
                                );
                              } else {
                                return (
                                  <>
                                    <p className="text-[10px] text-slate-500">
                                      {language === "tr" 
                                        ? "* Butona bastığınızda sizin adınıza tek kullanımlık benzersiz kampanya kodu üretilecektir."
                                        : "* Clicking below will generate a unique one-time code registered to your account."}
                                    </p>
                                    <button
                                      onClick={() => handleClaimCode(selectedCampaign)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      <Gift className="h-4 w-4" />
                                      {language === "tr" ? "🎁 Kampanya Kodunu Al" : "🎁 Claim Deal Code"}
                                    </button>
                                  </>
                                );
                              }
                            })()}
                          </div>
                        )}

                        {/* Type: Link */}
                        {selectedCampaign.type === "link" && selectedCampaign.url && (
                          <button
                            onClick={() => window.open(selectedCampaign.url, "_blank")}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {language === "tr" ? "🔗 Kampanyaya Git" : "🔗 Go to Campaign Webpage"}
                          </button>
                        )}

                        {/* Go to Company Profile if it matches directory */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCampaign(null);
                              if (onNavigateToTab) onNavigateToTab("directory");
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                          >
                            🏢 {language === "tr" ? "Firma Profiline Git" : "Go to Company Profile"}
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- ADMIN VIEW -------------------- */}
      {mode === "admin" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-550 text-amber-500" />
                {language === "tr" ? "Kurumsal Kampanyalar & İş Birlikleri Yönetimi" : "Campaign & Cooperation Management"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bu alandan üyelere özel kampanyaları oluşturabilir, üretilen kodları izleyebilir ve kurumsal ortaklık başvurularını değerlendirebilirsiniz.
              </p>
            </div>

            {!showAddEditForm && adminSubTab === "campaigns" && (
              <button
                onClick={() => {
                  setEditCampaignId(null);
                  clearCampaignForm();
                  setShowAddEditForm(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                {language === "tr" ? "Kampanya Ekle" : "Add Campaign"}
              </button>
            )}
          </div>

          {/* Sub Navigation */}
          {!showAddEditForm && (
            <div className="flex gap-2 border-b border-slate-200 pb-px">
              <button
                onClick={() => setAdminSubTab("campaigns")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  adminSubTab === "campaigns" 
                    ? "border-emerald-600 text-emerald-800" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {language === "tr" ? "Kampanya Listesi" : "Campaigns"} ({campaigns.length})
              </button>
              <button
                onClick={() => setAdminSubTab("codes")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  adminSubTab === "codes" 
                    ? "border-emerald-600 text-emerald-800" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {language === "tr" ? "Üretilen Kodlar" : "Generated Codes"} ({codesLog.length})
              </button>
              <button
                onClick={() => setAdminSubTab("applications")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  adminSubTab === "applications" 
                    ? "border-emerald-600 text-emerald-800" 
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {language === "tr" ? "İş Birliği Başvuruları" : "Cooperation Requests"} ({applications.length})
              </button>
            </div>
          )}

          {/* ADD / EDIT CAMPAIGN FORM */}
          {showAddEditForm && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                <h3 className="font-extrabold text-sm text-slate-800">
                  {editCampaignId ? (language === "tr" ? "Kampanyayı Düzenle" : "Edit Campaign") : (language === "tr" ? "Yeni Kampanya Oluştur" : "Create New Campaign")}
                </h3>
                <button
                  onClick={() => { setShowAddEditForm(false); setEditCampaignId(null); }}
                  className="p-1  hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Kampanya Başlığı *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Atiker Sıralı Otogaz %15 İndirim"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Firma Adı *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Atiker A.Ş."
                      value={formCompanyName}
                      onChange={(e) => setFormCompanyName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kısa Açıklama (Listelemede görünecek özet) *</label>
                  <input 
                    type="text"
                    required
                    placeholder="LPGPORTAL üyelerine özel tüm Atiker kitlerinde geçerli..."
                    value={formShortDescription}
                    onChange={(e) => setFormShortDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kampanya İçeriği (Detay metni) *</label>
                  <textarea 
                    required
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Kampanya detayları, montaj süreçleri..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Katılım Koşulları ve Şartlar *</label>
                  <textarea 
                    required
                    rows={3}
                    value={formTerms}
                    onChange={(e) => setFormTerms(e.target.value)}
                    placeholder="Diğer indirimlerle birleştirilemez..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>

                {/* Görsel ve Galeri Yükleme Alanı */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-2 text-left">
                    <label className="font-bold text-slate-700 block">📷 Kampanya Kapak Görseli (PNG, JPG, JPEG, WEBP)</label>
                    <input 
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setFormCoverImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs font-sans text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {formCoverImage && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-200 group mt-2">
                        <img src={formCoverImage} className="w-full h-full object-cover" alt="Cover Preview" />
                        <button
                          type="button"
                          onClick={() => setFormCoverImage("")}
                          className="absolute top-1 right-1 bg-red-650 bg-red-650 text-white p-1 rounded-full hover:bg-red-700 transition cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="font-bold text-slate-700 block">📸 Kampanya Galerisi (Birden Fazla Yüklenebilir)</label>
                    <input 
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach((file: any) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setFormGallery(prev => [...prev, reader.result as string]);
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                      className="w-full text-xs font-sans text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {formGallery.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formGallery.map((img, index) => (
                          <div key={index} className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200 group">
                            <img src={img} className="w-full h-full object-cover" alt="Gallery Preview" />
                            <button
                              type="button"
                              onClick={() => setFormGallery(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-0.5 right-0.5 bg-red-650 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition cursor-pointer"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Kampanya Türü *</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                    >
                      <option value="bilgilendirme">Bilgilendirme Kampanyası</option>
                      <option value="kod">Kampanya Kodu Dağıtımı</option>
                      <option value="link">Kampanyaya Git</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Kampanya Yönlendirme URL'i (Sadece 'Kampanyaya Git' için)</label>
                    <input 
                      type="url"
                      placeholder="https://..."
                      disabled={formType !== "link"}
                      required={formType === "link"}
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Son Geçerlilik Tarihi *</label>
                    <input 
                      type="date"
                      required
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Görünürlük (Kullanıcı Rolü Yetkilendirmesi) *</label>
                    <select
                      multiple
                      value={formAllowedRoles}
                      onChange={(e) => {
                        const opts = Array.from(e.target.selectedOptions, (o: any) => o.value);
                        setFormAllowedRoles(opts);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans min-h-[80px]"
                    >
                      <option value="all">Herkese Göster</option>
                      <option value="vehicle_owner">Sadece Araç Sahiplerine Göster</option>
                      <option value="dealer">Sadece Firma/Bayi Üyelerine Göster</option>
                      <option value="engineer">Sadece Mühendislere Göster</option>
                      <option value="manufacturer">Sadece Kit Üreticilerine Göster</option>
                    </select>
                    <span className="text-[9px] text-slate-400 mt-1 block">* Birden fazla seçmek için CTRL tuşuna basılı tutun.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">İletişim / Destek Bilgisi</label>
                    <input 
                      type="text"
                      placeholder="Tel: 444 0 285"
                      value={formContactInfo}
                      onChange={(e) => setFormContactInfo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Durum *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer font-sans"
                    >
                      <option value="Yayında">Yayında (Aktif)</option>
                      <option value="Taslak">Taslak</option>
                      <option value="Pasif">Pasif</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddEditForm(false); setEditCampaignId(null); }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl cursor-pointer shadow-sm"
                  >
                    {editCampaignId ? "Güncelle ve Kaydet" : "Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADMIN SUB-TAB: CAMPAIGN LIST */}
          {!showAddEditForm && adminSubTab === "campaigns" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono uppercase text-[10px]">
                      <th className="p-3">Kampanya Başlığı</th>
                      <th className="p-3">Firma</th>
                      <th className="p-3">Tür</th>
                      <th className="p-3">Görünürlük</th>
                      <th className="p-3">Son Tarih</th>
                      <th className="p-3 text-center">Durum</th>
                      <th className="p-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{camp.title}</td>
                        <td className="p-3 text-slate-600">{camp.companyName}</td>
                        <td className="p-3 font-mono">
                          {camp.type === "kod" && <span className="bg-amber-50 text-amber-800 border border-amber-100 px-1.5 py-0.5 rounded text-[10px]">🎁 Kod</span>}
                          {camp.type === "link" && <span className="bg-blue-50 text-blue-800 border border-blue-100 px-1.5 py-0.5 rounded text-[10px]">🔗 Yönlendirme</span>}
                          {camp.type === "bilgilendirme" && <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">ℹ️ Bilgi</span>}
                        </td>
                        <td className="p-3 text-[10px]">
                          {camp.allowedRoles.join(", ")}
                        </td>
                        <td className="p-3 text-slate-500">{camp.expiryDate}</td>
                        <td className="p-3 text-center">
                          {camp.status === "Yayında" && <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold">Yayında</span>}
                          {camp.status === "Taslak" && <span className="bg-slate-100 text-slate-650 border border-slate-200 px-2.5 py-0.5 rounded-full font-bold">Taslak</span>}
                          {camp.status === "Pasif" && <span className="bg-rose-50 text-rose-800 border border-rose-100 px-2.5 py-0.5 rounded-full font-bold">Pasif</span>}
                          {camp.status === "Süresi Doldu" && <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-0.5 rounded-full font-bold">Süresi Doldu</span>}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditClick(camp)}
                              className="p-1 rounded hover:bg-slate-100 text-emerald-700 cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(camp.id)}
                              className="p-1 rounded hover:bg-slate-100 text-rose-600 cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB: CLAIMED CODES LOG */}
          {adminSubTab === "codes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">
                  Üyeler tarafından talep edilen aktif ve geçmiş tüm kampanya kodlarının dökümü.
                </span>
                <button
                  onClick={handleExportCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel/CSV Dışa Aktar
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono uppercase text-[10px]">
                        <th className="p-3">Kullanıcı Adı</th>
                        <th className="p-3">Kullanıcı Tipi</th>
                        <th className="p-3">Kampanya Adı</th>
                        <th className="p-3">Üretilen Kod</th>
                        <th className="p-3">Kod Alma Tarihi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {codesLog.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">{log.userName}</td>
                          <td className="p-3 text-slate-500 font-mono text-[10px] uppercase">{log.userRole}</td>
                          <td className="p-3 text-slate-650">{log.campaignTitle}</td>
                          <td className="p-3 font-mono">
                            <span className="bg-emerald-50 text-emerald-800 font-bold border border-emerald-150 px-2 py-0.5 rounded">
                              {log.code}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{log.claimedAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN SUB-TAB: PARTNERSHIP APPLICATIONS */}
          {adminSubTab === "applications" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              {applications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Şu an değerlendirme bekleyen herhangi bir kurumsal başvuru bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-bold font-mono uppercase text-[10px]">
                        <th className="p-3">Firma</th>
                        <th className="p-3">Yetkili</th>
                        <th className="p-3">Tür</th>
                        <th className="p-3">Detaylar / Mesaj</th>
                        <th className="p-3 text-center">Durum</th>
                        <th className="p-3 text-center">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-800">
                            {app.companyName}
                            {app.website && (
                              <a href={app.website} target="_blank" rel="noreferrer" className="block text-[10px] text-emerald-600 hover:underline">
                                {app.website}
                              </a>
                            )}
                          </td>
                          <td className="p-3 text-slate-650">
                            <div>{app.authorizedName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{app.phone} / {app.email}</div>
                          </td>
                          <td className="p-3 font-mono text-[10px] uppercase">{app.campaignType}</td>
                          <td className="p-3 text-slate-500 max-w-xs truncate" title={app.message || app.description}>
                            <strong>Firma:</strong> {app.description} <br />
                            <strong>Mesaj:</strong> {app.message || "-"}
                          </td>
                          <td className="p-3 text-center">
                            {app.status === "Beklemede" && <span className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded font-bold">Beklemede</span>}
                            {app.status === "Onaylandı" && <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded font-bold">Onaylandı</span>}
                            {app.status === "Reddedildi" && <span className="bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded font-bold">Reddedildi</span>}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {app.status === "Beklemede" && (
                                <>
                                  <button
                                    onClick={() => handleApproveApplication(app.id)}
                                    className="p-1 rounded hover:bg-slate-100 text-emerald-700 cursor-pointer"
                                    title="Onayla"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectApplication(app.id)}
                                    className="p-1 rounded hover:bg-slate-100 text-rose-600 cursor-pointer"
                                    title="Reddet"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteApplication(app.id)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
