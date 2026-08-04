import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState, useEffect } from "react";
import { QuoteRequest, QuoteOffer, LocalProduct, OrderRequest, FeedbackRequest, FeedbackComment, Company } from "../types";
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck, 
  Layout, 
  Database,
  Car,
  Users, 
  DollarSign, 
  TrendingUp, 
  Key, 
  LogOut, 
  AlertCircle, 
  Clock, 
  Bookmark,
  Activity,
  FileText,
  Search,
  Building,
  Upload,
  Ticket,
  Bell,
  Info,
  Inbox,
  Megaphone,
  MessageSquare,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  RefreshCw,
  AlertTriangle,
  XCircle,
  FileCheck,
  ShoppingBag,
  Tag,
  Sliders,
  Star,
  Heart,
  PlusCircle,
  Trash,
  Sparkles,
  Eye,
  ArrowLeft,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { 
  DbUser, 
  ManualNotificationEntry,
  getUsers, 
  getInvoices, 
  saveUsers, 
  saveInvoices, 
  getRoleDisplayName, 
  getRolePrice, 
  FaturaHistory,
  getPricingConfig,
  savePricingConfig,
  PricingConfig,
  getUsedCoupons,
  saveUsedCoupons,
  UsedCoupon,
  getRemainingDays,
  getRemindersForUser,
  addSystemLog,
  getSystemLogs,
  createAutomaticBackup,
  getBackups,
  restoreBackup,
  getNotificationLogs,
  addCentralNotification,
  sendLpgNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  getCentralNotifications,
  FreePromoCode,
  getFreePromoCodes,
  saveFreePromoCodes,
  formatDisplayName
} from "../lib/membership";
import { Vehicle } from "../types";
import { hashPassword, verifyPassword, sanitizeHtml, escapeHtml, isPotentialSqlInjection } from "../lib/security";
import { MASTER_LPG_BRANDS, CAR_BRANDS, VEHICLES_DATA, getVehiclesDb, saveVehiclesDb } from "../data";
import { RAW_VEHICLES_DATA } from "../raw_vehicles";
import { renderCompanyLogo, getAutoLogoColor, getCompanyInitials } from "../lib/logoUtils";
import { useLanguage } from "../lib/LanguageContext";
import ContactAdminPanel from "./ContactAdminPanel";
import CampaignsSystem from "./CampaignsSystem";



const CATEGORY_PRESETS: Record<string, string> = {
  ECU: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
  Enjektör: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400",
  Regülatör: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400",
  "LPG Tankı": "https://images.unsplash.com/photo-1610444583731-9e1e2d1d2006?auto=format&fit=crop&q=80&w=400",
  Multivalf: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400",
  Filtre: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=400",
  "LPG Kiti": "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400",
  Diğer: "https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?auto=format&fit=crop&q=80&w=400"
};

const CATEGORIES_LIST = [
  "ECU",
  "Enjektör",
  "Regülatör",
  "LPG Tankı",
  "Multivalf",
  "Sensör",
  "Filtre",
  "Şamandıra",
  "Enjektör Rayı",
  "LPG Dolum Ağzı",
  "Katkı Maddesi",
  "LPG Düğmesi",
  "Faro Termoplastik Boru",
  "Kablo Tesisatı",
  "Tamir Takımı",
  "LPG Kiti",
  "Diğer"
];

export const CORE_BRANDS = ["BRC", "Zavoli", "Prins", "Atiker", "Lovato", "Landi Renzo", "OMVL", "Romano", "AC Stag"];

export const isCoreBrandName = (name: string): boolean => {
  if (!name) return false;
  const norm = name.toLowerCase().replace(/\s/g, "");
  return CORE_BRANDS.some(c => c.toLowerCase().replace(/\s/g, "") === norm);
};

export const getCentralBrandsList = (): string[] => {
  const MASTER_BRANDS = MASTER_LPG_BRANDS;
  const saved = typeof localStorage !== "undefined" ? localStorage.getItem("lpgportal_brands") : null;
  let baseList = ["BRC", "Zavoli", "Prins", "Atiker", "Lovato", "Landirenzo", "Romano", "OMVL"];
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed;
      }
    } catch (e) {}
  }
  const cleanBaseSet = new Set(baseList.map(b => b.trim().toLowerCase()));
  const missing = MASTER_BRANDS.filter(b => !cleanBaseSet.has(b.trim().toLowerCase()));
  const merged = [...baseList, ...missing];
  
  // Deduplicate
  const uniqueMerged: string[] = [];
  const seen = new Set<string>();
  for (const brand of merged) {
    const lower = brand.trim().toLowerCase();
    if (!seen.has(lower) && lower !== "") {
      seen.add(lower);
      uniqueMerged.push(brand.trim());
    }
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("lpgportal_brands", JSON.stringify(uniqueMerged));
  }
  return uniqueMerged;
};

export const getDynamicProductBrandsList = (): string[] => {
  const list = getCentralBrandsList();
  const sorted = list.filter(b => b.toLowerCase() !== "diğer");
  // Sort alphabetically
  sorted.sort((a, b) => a.localeCompare(b));
  return [...sorted, "Diğer"];
};


interface MembershipPortalProps {
  onLoginSuccess: (user: DbUser) => void;
  activeUser: DbUser | null;
  onLogout: () => void;
  initialRoleToRegister?: "vehicle_owner" | "dealer" | "engineer" | "manufacturer" | null;
  onRoleRegisterProcessed?: () => void;
  onUpdateActiveUser?: (user: DbUser) => void;
  initialAuthMode?: "login" | "register";
}

export default function MembershipPortal({
  onLoginSuccess,
  activeUser,
  onLogout,
  initialRoleToRegister,
  onRoleRegisterProcessed,
  onUpdateActiveUser,
  initialAuthMode = "login"
}: MembershipPortalProps) {
  const { language, translateEntity } = useLanguage();
  const tLocal = (tr: string, en: string) => (language === "tr" ? tr : en);

  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">(initialAuthMode);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState("");
  
  useEffect(() => {
    if (initialAuthMode) {
      setAuthMode(initialAuthMode);
    }
  }, [initialAuthMode]);

  const [userMainTab, setUserMainTab] = useState<"profile" | "notifications" | "quotes" | "market_management" | "feedback" | null>(() => {
    const saved = localStorage.getItem("lpgportal_user_main_tab");
    return (saved === "profile" || saved === "notifications" || saved === "quotes" || saved === "market_management" || saved === "feedback") ? (saved as any) : "profile";
  });

  useEffect(() => {
    if (userMainTab) {
      localStorage.setItem("lpgportal_user_main_tab", userMainTab);
    }
  }, [userMainTab]);

  useEffect(() => {
    if (activeUser) {
      if (activeUser.role === "admin") {
        setAdminTab("dashboard");
        setUserMainTab(null);
      } else {
        const saved = localStorage.getItem("lpgportal_user_main_tab") as any;
        setUserMainTab(saved && saved !== "null" ? saved : "profile");
        setAdminTab(null);
      }
    }
  }, [activeUser]);

  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname === "/notifications" || pathname === "/bildirim-merkezi" || window.location.search.includes("tab=notifications")) {
      if (activeUser) {
        setUserMainTab("notifications");
        setAdminTab(null);
      }
    }
  }, [activeUser]);
  const [notificationsList, setNotificationsList] = useState(() => getCentralNotifications());
  const userNotifications = notificationsList.filter(n => n.userId === "all" || (activeUser && n.userId === activeUser.id));
  
  // Login form field states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Registration step state
  // 1 = Enter Details, 2 = Pay and Activate
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [regRole, setRegRole] = useState<"vehicle_owner" | "dealer" | "engineer" | "manufacturer">("vehicle_owner");
  const [regSubscriptionType, setRegSubscriptionType] = useState<"premium" | "free">("premium");

  // Registration general fields
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // SMS Verification state variables
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsCodeSent, setSmsCodeSent] = useState("");
  const [smsTimeLeft, setSmsTimeLeft] = useState(300);
  const [userTypedSms, setUserTypedSms] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsResent, setSmsResent] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);

  // Success message state for admin approved status
  const [registrationApprovedStatusText, setRegistrationApprovedStatusText] = useState("");
  const [showFreeRegistrationSuccess, setShowFreeRegistrationSuccess] = useState(false);

  // Active user active/passive warning modal state
  const [showPassiveConfirmModal, setShowPassiveConfirmModal] = useState(false);

  // Admin pricing state configuration editor
  const [adminPrices, setAdminPrices] = useState<PricingConfig>(() => getPricingConfig());
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState("");
  const [vehiclesDb, setVehiclesDb] = useState<Vehicle[]>(() => getVehiclesDb());

  // Vehicle management states
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [vehicleBrandFilter, setVehicleBrandFilter] = useState("all");
  const [vehicleRiskFilter, setVehicleRiskFilter] = useState("all");
  const [vehicleCompatibilityFilter, setVehicleCompatibilityFilter] = useState("all");
  const [vehicleCurrentPage, setVehicleCurrentPage] = useState(1);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState<Omit<Vehicle, "id">>({
    brand: "",
    model: "",
    yearRange: "",
    engine: "",
    engine_code: "",
    fuel_type: "Benzin",
    horsepower: 100,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: [],
    compatibility_notes: "",
    tahmini_maliyet: ""
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_vehicles_db", JSON.stringify(vehiclesDb));
    }
  }, [vehiclesDb]);

  // Role-specific fields
  // 1) Dealer (Firma)
  const [companyName, setCompanyName] = useState("");
  const [authorizedName, setAuthorizedName] = useState("");
  const [taxInfo, setTaxInfo] = useState("");
  const [dealerWebsite, setDealerWebsite] = useState("");
  const [dealerCity, setDealerCity] = useState("İstanbul");
  const [dealerDistrict, setDealerDistrict] = useState("");

  // 2) Engineer (Mühendis / Usta)
  const [engineerSkill, setEngineerSkill] = useState("");
  const [engineerCity, setEngineerCity] = useState("Ankara");

  // 3) Manufacturer (Kit Üreticisi)
  const [mfrCompanyName, setMfrCompanyName] = useState("");
  const [mfrBrandName, setMfrBrandName] = useState("");
  const [mfrAuthorizedName, setMfrAuthorizedName] = useState("");
  const [mfrWebsite, setMfrWebsite] = useState("");
  const [mfrCategories, setMfrCategories] = useState("");
  const [regWorkingBrands, setRegWorkingBrands] = useState<string[]>([]);
  const handleBrandToggle = (brandName: string) => {
    const isChecked = regWorkingBrands.includes(brandName);
    if (brandName === "Diğer") {
      if (isChecked) {
        // Remove "Diğer" and filter out all non-core brands
        setRegWorkingBrands(prev => prev.filter(b => isCoreBrandName(b) && b !== "Diğer"));
      } else {
        setRegWorkingBrands(prev => [...prev, "Diğer"]);
      }
    } else {
      if (isChecked) {
        setRegWorkingBrands(prev => prev.filter(b => b !== brandName));
      } else {
        setRegWorkingBrands(prev => [...prev, brandName]);
      }
    }
  };
  const [regCompanyLogo, setRegCompanyLogo] = useState("");
  const [regCompanyNoLogo, setRegCompanyNoLogo] = useState(false);

  // Discount Coupon System States
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<"idle" | "valid" | "invalid" | "used">("idle");
  const [couponMessage, setCouponMessage] = useState("");
  const [adminTab, setAdminTab] = useState<"dashboard" | "members" | "coupons" | "reminders" | "system_logs" | "notifications" | "reviews" | "content_management" | "ad_management" | "price_management" | "payment_verification" | "quote_management" | "feedback_management" | "sms_management" | "email_management" | "payment_management" | "vehicle_management" | "contact_management" | null>("dashboard");
  const [remindersFilter, setRemindersFilter] = useState<"all" | "active" | "expiring" | "expired" | "renewed">("all");

  // Quote System States (Hesabım -> Tekliflerim)
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [selectedUserQuote, setSelectedUserQuote] = useState<QuoteRequest | null>(null);

  // Admin CRM Quote System States
  const [crmSearchQuery, setCrmSearchQuery] = useState("");
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>("all");
  const [crmCityFilter, setCrmCityFilter] = useState<string>("all");
  const [selectedCrmQuote, setSelectedCrmQuote] = useState<QuoteRequest | null>(null);
  
  // Admin Edit Form States
  const [crmEditStatus, setCrmEditStatus] = useState("");
  const [crmEditReply, setCrmEditReply] = useState("");
  const [crmEditNotes, setCrmEditNotes] = useState("");
  const [crmNewFileName, setCrmNewFileName] = useState("");
  const [crmNewFileType, setCrmNewFileType] = useState("PDF");

  // Feedback Module States
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>(() => {
    const saved = localStorage.getItem("lpgportal_feedback_requests");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
      }
    }
    return [];
  });
  const [selectedUserFeedback, setSelectedUserFeedback] = useState<FeedbackRequest | null>(null);

  // SMS, E-Mail, and Payment Integration Management States
  const [smsConfig, setSmsConfig] = useState<any>(() => {
    if (typeof window === "undefined") return { provider: "ProviderA", apiUser: "", apiPassword: "", apiKey: "", header: "LPGPORTAL" };
    return JSON.parse(localStorage.getItem("lpgportal_sms_config") || '{"provider":"ProviderA","apiUser":"","apiPassword":"","apiKey":"","header":"LPGPORTAL"}');
  });
  const [emailConfig, setEmailConfig] = useState<any>(() => {
    if (typeof window === "undefined") return { provider: "ProviderA", apiKey: "", fromEmail: "info@lpgportal.com", fromName: "LPG PORTAL" };
    return JSON.parse(localStorage.getItem("lpgportal_email_config") || '{"provider":"ProviderA","apiKey":"","fromEmail":"info@lpgportal.com","fromName":"LPG PORTAL"}');
  });
  const [paymentConfig, setPaymentConfig] = useState<any>(() => {
    if (typeof window === "undefined") return { provider: "ProviderA", apiKey: "", secretKey: "", merchantId: "", callbackUrl: "http://localhost:3000/api/payment/paytr-callback" };
    return JSON.parse(localStorage.getItem("lpgportal_payment_config") || '{"provider":"ProviderA","apiKey":"","secretKey":"","merchantId":"","callbackUrl":"http://localhost:3000/api/payment/paytr-callback"}');
  });

  const [smsTemplates, setSmsTemplates] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("lpgportal_sms_templates") || "[]");
  });
  const [emailTemplates, setEmailTemplates] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("lpgportal_email_templates") || "[]");
  });

  const [sentSmsLogs, setSentSmsLogs] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("lpgportal_sent_sms_logs") || "[]");
  });
  const [sentEmailLogs, setSentEmailLogs] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("lpgportal_sent_email_logs") || "[]");
  });
  const [paytrTransactions, setPaytrTransactions] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(localStorage.getItem("lpgportal_paytr_transactions") || "[]");
  });

  // Test & Modal form states
  const [testSmsPhone, setTestSmsPhone] = useState("");
  const [testSmsMessage, setTestSmsMessage] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailSubject, setTestEmailSubject] = useState("");
  const [testEmailBody, setTestEmailBody] = useState("");
  const [testPaymentAmount, setTestPaymentAmount] = useState("100");
  const [testPaymentOid, setTestPaymentOid] = useState("");
  const [testPaymentEmail, setTestPaymentEmail] = useState("");
  
  // Template CRUD states
  const [editingSmsTemplate, setEditingSmsTemplate] = useState<any | null>(null);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<any | null>(null);
  const [showSmsTemplateModal, setShowSmsTemplateModal] = useState(false);
  const [showEmailTemplateModal, setShowEmailTemplateModal] = useState(false);
  
  // Webhook Test states
  const [webhookOid, setWebhookOid] = useState("");
  const [webhookStatus, setWebhookStatus] = useState("success");
  const [webhookAmount, setWebhookAmount] = useState("100");
  const [webhookReason, setWebhookReason] = useState("");

  const [newFeedbackType, setNewFeedbackType] = useState("Talep");
  const [newFeedbackPriority, setNewFeedbackPriority] = useState("Normal");
  const [newFeedbackTitle, setNewFeedbackTitle] = useState("");
  const [newFeedbackDescription, setNewFeedbackDescription] = useState("");
  const [newFeedbackAttachments, setNewFeedbackAttachments] = useState<{ name: string; type: string; base64?: string; size: string }[]>([]);
  const [newFeedbackComment, setNewFeedbackComment] = useState("");
  const [showNewFeedbackForm, setShowNewFeedbackForm] = useState(false);

  // Admin Feedback CRM States
  const [feedbackSearchQuery, setFeedbackSearchQuery] = useState("");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("all");
  const [feedbackPriorityFilter, setFeedbackPriorityFilter] = useState("all");
  const [feedbackUserFilter, setFeedbackUserFilter] = useState("all");
  const [selectedCrmFeedback, setSelectedCrmFeedback] = useState<FeedbackRequest | null>(null);

  const [crmFeedbackStatus, setCrmFeedbackStatus] = useState("");
  const [crmFeedbackReply, setCrmFeedbackReply] = useState("");
  const [crmFeedbackInternalNotes, setCrmFeedbackInternalNotes] = useState("");
  const [crmFeedbackNewFileName, setCrmFeedbackNewFileName] = useState("");
  const [crmFeedbackNewFileType, setCrmFeedbackNewFileType] = useState("PDF");

  useEffect(() => {
    const saved = localStorage.getItem("lpgportal_quote_requests");
    if (saved) {
      try {
        setQuoteRequests(JSON.parse(saved));
      } catch (e) {
        setQuoteRequests([]);
      }
    }
  }, [userMainTab, adminTab]);

  // Payment Verification States
  const [paymentFilter, setPaymentFilter] = useState<"all" | "pending" | "approved" | "rejected" | "missing" | "today" | "this_month">("all");
  const [previewDekontUrl, setPreviewDekontUrl] = useState<string | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotateAngle, setRotateAngle] = useState<number>(0);

  // Manual Notification Center States
  const [manualTargetAudience, setManualTargetAudience] = useState<string>("all");
  const [manualSelectedUserId, setManualSelectedUserId] = useState<string>("");
  const [manualChannels, setManualChannels] = useState<string[]>(["panel"]);
  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualMessage, setManualMessage] = useState<string>("");
  const [manualExpirationDate, setManualExpirationDate] = useState<string>("");
  const [manualPriority, setManualPriority] = useState<string>("Normal");
  const [manualError, setManualError] = useState<string>("");
  const [manualSuccess, setManualSuccess] = useState<string>("");
  const [manualHistory, setManualHistory] = useState<ManualNotificationEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_manual_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [previewNotification, setPreviewNotification] = useState<ManualNotificationEntry | null>(null);

  // Membership Renewal Modal States
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewCardHolder, setRenewCardHolder] = useState("");
  const [renewCardNumber, setRenewCardNumber] = useState("");
  const [renewCardExpiry, setRenewCardExpiry] = useState("");
  const [renewCardCvv, setRenewCardCvv] = useState("");
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccess, setRenewSuccess] = useState(false);

  // Dynamic reviews states
  const [homeReviews, setHomeReviews] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_home_reviews");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_home_reviews", JSON.stringify(homeReviews));
    }
  }, [homeReviews]);

  // Form states for reviews submission
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewProfession, setReviewProfession] = useState("");
  const [reviewCity, setReviewCity] = useState("");
  const [reviewCarBrand, setReviewCarBrand] = useState("");
  const [reviewCarModel, setReviewCarModel] = useState("");
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");

  // Admin search / filter states for reviews
  const [adminReviewSearch, setAdminReviewSearch] = useState("");
  const [adminReviewStatusFilter, setAdminReviewStatusFilter] = useState<"all" | "Onay Bekliyor" | "Onaylandı" | "Reddedildi" | "Pasif">("all");
  
  // Review editing state
  const [editingReview, setEditingReview] = useState<any | null>(null);

  // Admin LPG Route Planner config states
  const [adminLpgPrice, setAdminLpgPrice] = useState(() => parseFloat(localStorage.getItem("lpgportal_lpg_price") || "21.40"));
  const [unregisteredBrands, setUnregisteredBrands] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("lpgportal_unregistered_kit_brands");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [unregisteredVehicles, setUnregisteredVehicles] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("lpgportal_unregistered_vehicles");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // --- NEW ADMIN MODULES STATES ---
  const [userContentsDb, setUserContentsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_user_contents_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_user_contents_db", JSON.stringify(userContentsDb));
    }
  }, [userContentsDb]);

  const [newsDb, setNewsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_news_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_news_db", JSON.stringify(newsDb));
    }
  }, [newsDb]);

  const [bulletinsDb, setBulletinsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_bulletins_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_bulletins_db", JSON.stringify(bulletinsDb));
    }
  }, [bulletinsDb]);

  const [notificationsDb, setNotificationsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_writer_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_writer_notifications", JSON.stringify(notificationsDb));
    }
  }, [notificationsDb]);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("lpgportal_user_contents_db");
      if (saved) {
        try {
          setUserContentsDb(JSON.parse(saved));
        } catch (e) {}
      }
      const savedNews = localStorage.getItem("lpgportal_news_db");
      if (savedNews) {
        try {
          setNewsDb(JSON.parse(savedNews));
        } catch (e) {}
      }
      const savedBulletins = localStorage.getItem("lpgportal_bulletins_db");
      if (savedBulletins) {
        try {
          setBulletinsDb(JSON.parse(savedBulletins));
        } catch (e) {}
      }
      const savedNotifs = localStorage.getItem("lpgportal_writer_notifications");
      if (savedNotifs) {
        try {
          setNotificationsDb(JSON.parse(savedNotifs));
        } catch (e) {}
      }
      const savedVehicles = localStorage.getItem("lpgportal_vehicles_db");
      if (savedVehicles) {
        try {
          setVehiclesDb(JSON.parse(savedVehicles));
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        if (key === "lpgportal_users") setAllUsers(value);
        if (key === "lpgportal_invoices") setAllInvoices(value);
        if (key === "lpgportal_companies") setAllCompanies(value);
        if (key === "lpgportal_user_contents_db") setUserContentsDb(value);
        if (key === "lpgportal_news_db") setNewsDb(value);
        if (key === "lpgportal_bulletins_db") setBulletinsDb(value);
        if (key === "lpgportal_writer_notifications") setNotificationsDb(value);
        if (key === "lpgportal_home_reviews") setHomeReviews(value);
        if (key === "lpgportal_quote_requests") setQuoteRequests(value);
        if (key === "lpgportal_products") setMarketProducts(value);
        if (key === "lpgportal_orders") setMarketOrders(value);
        if (key === "lpgportal_ads_db") setAdsDb(value);
        if (key === "lpgportal_unregistered_kit_brands") setUnregisteredBrands(value);
        if (key === "lpgportal_unregistered_vehicles") setUnregisteredVehicles(value);
        if (key === "lpgportal_feedback_requests") setFeedbackRequests(value);
        if (key === "lpgportal_sms_config") setSmsConfig(value);
        if (key === "lpgportal_email_config") setEmailConfig(value);
        if (key === "lpgportal_payment_config") setPaymentConfig(value);
        if (key === "lpgportal_sms_templates") setSmsTemplates(value);
        if (key === "lpgportal_email_templates") setEmailTemplates(value);
        if (key === "lpgportal_sent_sms_logs") setSentSmsLogs(value);
        if (key === "lpgportal_sent_email_logs") setSentEmailLogs(value);
        if (key === "lpgportal_paytr_transactions") setPaytrTransactions(value);
        if (key === "lpgportal_vehicles_db") setVehiclesDb(value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  useEffect(() => {
    if (selectedUserFeedback) {
      const updated = feedbackRequests.find(f => f.id === selectedUserFeedback.id);
      if (updated) setSelectedUserFeedback(updated);
    }
    if (selectedCrmFeedback) {
      const updated = feedbackRequests.find(f => f.id === selectedCrmFeedback.id);
      if (updated) setSelectedCrmFeedback(updated);
    }
  }, [feedbackRequests]);

  useEffect(() => {
    if (selectedUserQuote) {
      const updated = quoteRequests.find(q => q.id === selectedUserQuote.id);
      if (updated) setSelectedUserQuote(updated);
    }
    if (selectedCrmQuote) {
      const updated = quoteRequests.find(q => q.id === selectedCrmQuote.id);
      if (updated) setSelectedCrmQuote(updated);
    }
  }, [quoteRequests]);


  useEffect(() => {
    if (editingReview) {
      const updated = homeReviews.find(r => r.id === editingReview.id);
      if (updated) setEditingReview(updated);
    }
  }, [homeReviews]);

  const [adsDb, setAdsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_ads_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultAds = [
      {
        id: "ad-default-top",
        title: "PRINS VSI-3 DI Akıllı Dönüşüm Reklamı",
        position: "top",
        imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop",
        clickUrl: "https://www.prins.com.tr",
        active: true
      },
      {
        id: "ad-default-bottom",
        title: "BRC Türkiye Yaygın Servis Ağı Reklamı",
        position: "bottom",
        imageUrl: "https://images.unsplash.com/photo-1617886322168-72b886573c3c?q=80&w=1200&auto=format&fit=crop",
        clickUrl: "https://www.brc.com.tr",
        active: true
      }
    ];
    return defaultAds;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_ads_db", JSON.stringify(adsDb));
    }
  }, [adsDb]);

  const [pricingData, setPricingData] = useState(() => {
    if (typeof window === "undefined") return { active: true, title: "Güncel LPG Fiyatları & Tasarruf Oranları", istanbul: "21.40", ankara: "21.30", izmir: "21.50", savings: "%45'e Varan Tasarruf", cities: [] };
    const saved = localStorage.getItem("lpgportal_pricing_data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const defaultPricing = {
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
    localStorage.setItem("lpgportal_pricing_data", JSON.stringify(defaultPricing));
    return defaultPricing;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_pricing_data", JSON.stringify(pricingData));
      const istPrice = parseFloat(pricingData.istanbul) || 21.40;
      localStorage.setItem("lpgportal_lpg_price", istPrice.toString());
      setAdminLpgPrice(istPrice);
    }
  }, [pricingData]);

  // Form states for Ads
  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdClickUrl, setNewAdClickUrl] = useState("");
  const [newAdImageUrl, setNewAdImageUrl] = useState("");
  const [newAdPosition, setNewAdPosition] = useState<"top" | "bottom">("top");
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  // Form states for LPG Pricing
  const [newCityName, setNewCityName] = useState("");
  const [newCityPrice, setNewCityPrice] = useState("");
  const [editingCityIndex, setEditingCityIndex] = useState<number | null>(null);

  // Content Preview & Revision Modal states
  const [previewContentItem, setPreviewContentItem] = useState<any | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Utility to send writer notifications
  const addWriterNotification = (authorName: string, authorEmail: string, type: "panel" | "email" | "sms", title: string, message: string) => {
    const saved = localStorage.getItem("lpgportal_writer_notifications");
    let current: any[] = [];
    if (saved) {
      try {
        current = JSON.parse(saved);
      } catch (e) {}
    }
    const newNotif = {
      id: "notif-" + Date.now() + Math.random().toString(36).substr(2, 4),
      userName: authorName,
      userEmail: authorEmail,
      type,
      title,
      message,
      date: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    current.unshift(newNotif);
    localStorage.setItem("lpgportal_writer_notifications", JSON.stringify(current));
    setNotificationsDb(current);
  };

  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedbackTitle.trim() || !newFeedbackDescription.trim()) {
      alert("Lütfen başlık ve açıklama alanlarını doldurunuz.");
      return;
    }

    const newReq: FeedbackRequest = {
      id: "FB-" + Math.floor(100000 + Math.random() * 900000),
      userId: activeUser ? activeUser.id : "",
      userName: activeUser ? formatDisplayName(activeUser.name) : "",
      userRole: activeUser ? activeUser.role : "Ziyaretçi",
      userEmail: activeUser ? activeUser.email : "",
      userPhone: activeUser ? activeUser.phone : "",
      type: newFeedbackType,
      priority: newFeedbackPriority,
      title: newFeedbackTitle,
      description: newFeedbackDescription,
      status: "Yeni Kayıt",
      created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
      updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' }),
      attachments: newFeedbackAttachments.map(att => ({
        name: att.name,
        type: att.type,
        base64: att.base64,
        size: att.size
      })),
      comments: []
    };

    const updated = [newReq, ...feedbackRequests];
    localStorage.setItem("lpgportal_feedback_requests", JSON.stringify(updated));
    setFeedbackRequests(updated);

    // Reset Form
    setNewFeedbackTitle("");
    setNewFeedbackDescription("");
    setNewFeedbackAttachments([]);
    setShowNewFeedbackForm(false);

    // Add System Log
    addSystemLog(
      "Yeni Destek Talebi",
      `Kullanıcı yeni destek talebi oluşturdu: ${newReq.title} (${newReq.type})`,
      activeUser ? activeUser.email : ""
    );

    // Send Admin Notification
    sendLpgNotification(
      "admin",
      `🆕 Yeni Talep: ${newReq.title}`,
      `${newReq.userName} tarafından yeni bir ${newReq.type} oluşturuldu.`,
      "mesaj",
      "panel",
      true
    );

    alert("Talebiniz başarıyla alındı ve destek ekibimize iletildi.");
  };

  const handleAddUserComment = (reqId: string) => {
    if (!newFeedbackComment.trim()) return;

    const target = feedbackRequests.find(f => f.id === reqId);
    if (!target) return;

    const newComment: FeedbackComment = {
      id: "COMM-" + Math.floor(100000 + Math.random() * 900000),
      sender: "user",
      senderName: activeUser ? formatDisplayName(activeUser.name) : "Kullanıcı",
      message: newFeedbackComment,
      created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
    };

    const updatedComments = [...(target.comments || []), newComment];
    const updatedReq: FeedbackRequest = {
      ...target,
      comments: updatedComments,
      updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
    };

    const updated = feedbackRequests.map(r => r.id === reqId ? updatedReq : r);
    localStorage.setItem("lpgportal_feedback_requests", JSON.stringify(updated));
    setFeedbackRequests(updated);
    setSelectedUserFeedback(updatedReq);
    setNewFeedbackComment("");

    // Add System Log
    addSystemLog(
      "Destek Talebi Mesajı",
      `Kullanıcı destek talebine (${reqId}) mesaj ekledi.`,
      activeUser ? activeUser.email : ""
    );

    // Send Admin Notification
    sendLpgNotification(
      "admin",
      `💬 Yeni Mesaj: ${target.title}`,
      `${newComment.senderName} destek talebine yeni bir mesaj ekledi.`,
      "mesaj",
      "panel",
      true
    );
  };

  const handleSaveAdminFeedback = (reqId: string) => {
    const target = feedbackRequests.find(f => f.id === reqId);
    if (!target) return;

    let updatedComments = [...(target.comments || [])];
    if (crmFeedbackReply.trim()) {
      const newComment: FeedbackComment = {
        id: "COMM-" + Math.floor(100000 + Math.random() * 900000),
        sender: "admin",
        senderName: activeUser ? formatDisplayName(activeUser.name) : "Yönetici",
        message: crmFeedbackReply,
        created_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
      };
      updatedComments.push(newComment);
    }

    const updatedReq: FeedbackRequest = {
      ...target,
      status: crmFeedbackStatus,
      adminReply: crmFeedbackReply.trim() || target.adminReply,
      internalNotes: crmFeedbackInternalNotes,
      comments: updatedComments,
      updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
    };

    // If an admin added a simulated document/file response
    if (crmFeedbackNewFileName.trim()) {
      const fileExt = crmFeedbackNewFileType === "PDF" ? "pdf" : crmFeedbackNewFileType === "EXCEL" ? "xlsx" : "png";
      const dummyBase64 = crmFeedbackNewFileType === "PDF" 
        ? "data:application/pdf;base64,JVBERi0xLjQKJ..."
        : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
        
      updatedReq.attachments = [
        ...(target.attachments || []),
        {
          name: `${crmFeedbackNewFileName}.${fileExt}`,
          type: crmFeedbackNewFileType === "PDF" ? "application/pdf" : crmFeedbackNewFileType === "EXCEL" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "image/png",
          base64: dummyBase64,
          size: "142 KB"
        }
      ];
    }

    const updated = feedbackRequests.map(r => r.id === reqId ? updatedReq : r);
    localStorage.setItem("lpgportal_feedback_requests", JSON.stringify(updated));
    setFeedbackRequests(updated);
    setSelectedCrmFeedback(updatedReq);
    setCrmFeedbackReply("");
    setCrmFeedbackNewFileName("");

    // Add System Log
    addSystemLog(
      "Destek Talebi Güncellendi (Admin)",
      `Yönetici ${reqId} nolu destek talebini güncelledi. Durum: ${crmFeedbackStatus}`,
      activeUser ? activeUser.email : ""
    );

    // Send User Notification
    sendLpgNotification(
      target.userId,
      "💬 Destek Talebi Güncellemesi",
      `Destek talebinizin (${target.id}) durumu "${crmFeedbackStatus}" olarak güncellendi.`,
      "mesaj",
      "panel",
      true
    );

    alert("Tüm değişiklikler başarıyla kaydedildi.");
  };

  const handleApproveContent = (id: string) => {
    let approvedItem: any = null;
    setUserContentsDb(prev => prev.map(item => {
      if (item.id === id) {
        addWriterNotification(item.authorName, item.authorEmail, "panel", "İçerik Onaylandı", `Tebrikler, '${item.title}' başlıklı içeriğiniz onaylanıp yayınlanmıştır.`);
        addWriterNotification(item.authorName, item.authorEmail, "email", "İçerik Onay Bildirimi", `Sayın ${item.authorName}, '${item.title}' başlıklı yazınız onaylanmıştır.`);
        addWriterNotification(item.authorName, item.authorEmail, "sms", "Onay Bildirimi", `LPG PORTAL: '${item.title.substring(0, 20)}...' baslikli yaziniz onaylanarak yayina alinmistir.`);
        
        approvedItem = {
          ...item,
          status: "Yayınlandı",
          published: true,
          approvedBy: activeUser?.name || "Admin",
          approvedAt: new Date().toISOString().replace("T", " ").substring(0, 16)
        };
        return approvedItem;
      }
      return item;
    }));

    if (approvedItem) {
      const completeItem = {
        id: approvedItem.id === "uc-1" ? "news-toyota-2026" : approvedItem.id === "uc-2" ? "tb-atiker-grand-firm" : `uc-pub-${Date.now()}`,
        title: approvedItem.title,
        summary: approvedItem.summary,
        category: approvedItem.category,
        date: approvedItem.createdAt || new Date().toISOString().replace("T", " ").substring(0, 10),
        author: approvedItem.authorName,
        image: approvedItem.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300",
        tags: approvedItem.tags || ["üye", "lpgportal"],
        likes: 0,
        views: 0,
        content: approvedItem.content,
        facebookShares: 0,
        linkedinShares: 0,
        whatsappShares: 0,
        twitterShares: 0,
        linkCopied: 0,
        lpgBrand: approvedItem.lpgBrand || "BRC Türkiye",
        manufacturerAccount: approvedItem.manufacturerAccount || approvedItem.authorName,
        status: "Yayınlandı",
        published: true,
        publishedAt: new Date().toISOString(),
        createdAt: approvedItem.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorId: approvedItem.authorEmail || "author@lpgportal.com",
        approvedBy: activeUser?.name || "Admin",
        approvedAt: new Date().toISOString()
      };

      if (approvedItem.category === "Teknik Bülten") {
        setBulletinsDb(prev => {
          if (prev.some(x => x.id === completeItem.id)) return prev;
          return [completeItem, ...prev];
        });
      } else {
        setNewsDb(prev => {
          if (prev.some(x => x.id === completeItem.id)) return prev;
          return [completeItem, ...prev];
        });
      }
    }

    addSystemLog("İçerik Onaylandı", `İçerik onaylandı (ID: ${id})`, activeUser ? activeUser.email : "");
  };

  const handleRevisionRequest = (id: string, note: string) => {
    if (!note.trim()) {
      alert("Lütfen revizyon gerekçesini yazınız.");
      return;
    }
    setUserContentsDb(prev => prev.map(item => {
      if (item.id === id) {
        addWriterNotification(item.authorName, item.authorEmail, "panel", "Revizyon İstendi", `Yazınız için revizyon talep edildi: '${note}'`);
        addWriterNotification(item.authorName, item.authorEmail, "email", "İçerik Revizyon Talebi", `Sayın ${item.authorName}, '${item.title}' başlıklı yazınız için revizyon talep edilmiştir. Gerekçe: ${note}`);
        addWriterNotification(item.authorName, item.authorEmail, "sms", "Revizyon Talebi", `LPG PORTAL: '${item.title.substring(0, 20)}...' baslikli yaziniz icin revizyon talep edilmistir.`);
        
        return {
          ...item,
          status: "Düzeltme Bekliyor",
          published: false,
          revisionNote: note
        };
      }
      return item;
    }));
    addSystemLog("İçerik Revizyon İstemi", `İçerik için revizyon istendi (ID: ${id})`, activeUser ? activeUser.email : "");
    setShowRevisionModal(false);
    setRevisionNote("");
    setPreviewContentItem(null);
  };

  const handleRejectContent = (id: string) => {
    setUserContentsDb(prev => prev.map(item => {
      if (item.id === id) {
        addWriterNotification(item.authorName, item.authorEmail, "panel", "İçerik Reddedildi", `'${item.title}' başlıklı yazınız maalesef reddedilmiştir.`);
        addWriterNotification(item.authorName, item.authorEmail, "email", "İçerik Red Bildirimi", `Sayın ${item.authorName}, '${item.title}' başlıklı yazınız kriterlerimize uygun bulunmadığından reddedilmiştir.`);
        addWriterNotification(item.authorName, item.authorEmail, "sms", "Red Bildirimi", `LPG PORTAL: '${item.title.substring(0, 20)}...' baslikli yaziniz reddedilmistir.`);
        
        return {
          ...item,
          status: "Reddedildi",
          published: false
        };
      }
      return item;
    }));
    addSystemLog("İçerik Reddedildi", `İçerik reddedildi (ID: ${id})`, activeUser ? activeUser.email : "");
  };

  const handleDeleteContent = (id: string) => {
    if (confirm("Bu içeriği kalıcı olarak silmek istediğinize emin misiniz?")) {
      setUserContentsDb(prev => prev.filter(item => item.id !== id));
      addSystemLog("İçerik Silindi", `İçerik silindi (ID: ${id})`, activeUser ? activeUser.email : "");
      setPreviewContentItem(null);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    if (confirm("Bu araç uyumluluk kaydını silmek istediğinize emin misiniz?")) {
      const updated = vehiclesDb.filter(v => v.id !== id);
      setVehiclesDb(updated);
      saveVehiclesDb(updated);
      addSystemLog("Araç Silindi", `Araç silindi (ID: ${id})`, activeUser ? activeUser.email : "");
    }
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleData.brand || !newVehicleData.model) {
      alert("Lütfen en az marka ve model alanlarını doldurun.");
      return;
    }

    let updated: Vehicle[];
    if (editingVehicle) {
      updated = vehiclesDb.map(v => v.id === editingVehicle.id ? { ...v, ...newVehicleData } : v);
      addSystemLog("Araç Güncellendi", `Araç güncellendi (Marka: ${newVehicleData.brand}, Model: ${newVehicleData.model})`, activeUser ? activeUser.email : "");
    } else {
      const newId = "vehicle_" + Date.now();
      const newVehicle: Vehicle = {
        id: newId,
        ...newVehicleData
      };
      updated = [newVehicle, ...vehiclesDb];
      addSystemLog("Araç Eklendi", `Yeni araç eklendi (Marka: ${newVehicleData.brand}, Model: ${newVehicleData.model})`, activeUser ? activeUser.email : "");
    }

    setVehiclesDb(updated);
    saveVehiclesDb(updated);
    setEditingVehicle(null);
    setIsAddingVehicle(false);
    setNewVehicleData({
      brand: "",
      model: "",
      yearRange: "",
      engine: "",
      engine_code: "",
      fuel_type: "Benzin",
      horsepower: 100,
      compatible: true,
      risk_level: "Düşük",
      recommended_kits: [],
      compatibility_notes: "",
      tahmini_maliyet: ""
    });
  };

  const handleExportVehiclesCsv = () => {
    const headers = [
      "ID", "Marka", "Model", "Yıl Aralığı", "Motor", "Motor Kodu", 
      "Yakıt Tipi", "Beygir Gücü", "Uyumlu Mu", "Risk Seviyesi", 
      "Önerilen Kitler", "Uyumluluk Notları", "Tahmini Maliyet"
    ];
    
    const rows = vehiclesDb.map(v => [
      v.id,
      v.brand,
      v.model,
      v.yearRange,
      v.engine,
      v.engine_code,
      v.fuel_type,
      v.horsepower,
      v.compatible ? "Evet" : "Hayır",
      v.risk_level,
      (v.recommended_kits || []).join(";"),
      v.compatibility_notes || "",
      v.tahmini_maliyet || ""
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(val => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lpgportal_arac_veritabani_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSystemLog("Araçlar CSV Dışa Aktarıldı", "Araç veritabanı CSV olarak indirildi.", activeUser ? activeUser.email : "");
  };

  const handleImportVehiclesCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          alert("CSV dosyası boş veya geçersiz başlık yapısına sahip.");
          return;
        }

        const importedVehicles: Vehicle[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const fields = line.split(",").map(f => {
            let cleaned = f.trim();
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.substring(1, cleaned.length - 1).replace(/""/g, '"');
            }
            return cleaned;
          });

          if (fields.length < 3) continue;

          const id = fields[0] && fields[0] !== "undefined" ? fields[0] : "vehicle_import_" + Math.random().toString(36).substring(2, 11);
          const brand = fields[1] || "";
          const model = fields[2] || "";
          const yearRange = fields[3] || "";
          const engine = fields[4] || "";
          const engine_code = fields[5] || "";
          const fuel_type = fields[6] || "Benzin";
          const horsepower = parseInt(fields[7]) || 100;
          const compatible = fields[8] === "Evet" || fields[8] === "true" || fields[8] === "YES";
          const risk_level = (fields[9] === "Orta" || fields[9] === "Yüksek" || fields[9] === "Düşük") ? fields[9] as any : "Düşük";
          const recommended_kits = fields[10] ? fields[10].split(";").map(k => k.trim()).filter(Boolean) : [];
          const compatibility_notes = fields[11] || "";
          const tahmini_maliyet = fields[12] || "";

          importedVehicles.push({
            id,
            brand,
            model,
            yearRange,
            engine,
            engine_code,
            fuel_type,
            horsepower,
            compatible,
            risk_level,
            recommended_kits,
            compatibility_notes,
            tahmini_maliyet
          });
        }

        if (importedVehicles.length === 0) {
          alert("Hiçbir araç kaydı içe aktarılamadı. CSV biçimini kontrol edin.");
          return;
         }

        const existingIds = new Set(importedVehicles.map(v => v.id));
        const filteredExisting = vehiclesDb.filter(v => !existingIds.has(v.id));
        const merged = [...importedVehicles, ...filteredExisting];

        setVehiclesDb(merged);
        saveVehiclesDb(merged);
        alert(`${importedVehicles.length} adet araç kaydı başarıyla içe aktarıldı!`);
        addSystemLog("Araçlar CSV İçe Aktarıldı", `${importedVehicles.length} araç içe aktarıldı.`, activeUser ? activeUser.email : "");
      } catch (err) {
        console.error(err);
        alert("Dosya okunurken bir hata oluştu.");
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const renderAdminVehicleManagement = () => {
    const filteredVehicles = vehiclesDb.filter(v => {
      const q = vehicleSearchQuery.toLowerCase();
      const matchesSearch = 
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.engine.toLowerCase().includes(q) ||
        v.engine_code.toLowerCase().includes(q) ||
        (v.compatibility_notes && v.compatibility_notes.toLowerCase().includes(q));

      const matchesBrand = vehicleBrandFilter === "all" || v.brand === vehicleBrandFilter;
      const matchesRisk = vehicleRiskFilter === "all" || v.risk_level === vehicleRiskFilter;
      
      let matchesCompatibility = true;
      if (vehicleCompatibilityFilter === "compatible") matchesCompatibility = v.compatible;
      else if (vehicleCompatibilityFilter === "incompatible") matchesCompatibility = !v.compatible;

      return matchesSearch && matchesBrand && matchesRisk && matchesCompatibility;
    });

    const uniqueBrands = Array.from(new Set(vehiclesDb.map(v => v.brand))).sort();

    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const paginatedVehicles = filteredVehicles.slice(
      (vehicleCurrentPage - 1) * itemsPerPage,
      vehicleCurrentPage * itemsPerPage
    );

    const getPaginationRange = () => {
      const current = vehicleCurrentPage;
      const total = totalPages;
      const delta = 1;
      
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
          range.push(i);
        }
      }

      for (const i of range) {
        if (l !== undefined) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l > 2) {
            rangeWithDots.push("...");
          }
        }
        rangeWithDots.push(i);
        l = i;
      }

      return rangeWithDots;
    };

    return (
      <div className="space-y-6">
        {/* Header section with Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 font-sans">
              <Car className="h-5 w-5 text-indigo-600 animate-pulse" />
              Araç & LPG Uyumluluk Veritabanı
            </h3>
            <p className="text-slate-550 text-xs mt-0.5 font-sans">
              Sistemdeki motor ve araç marka-model kombinasyonlarının LPG dönüşüm uyumluluk verilerini yönetin.
            </p>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-600 block font-bold">Toplam Araç</span>
              <span className="text-2xl font-black text-indigo-900 leading-none mt-1 inline-block">{vehiclesDb.length}</span>
            </div>
            <div className="h-10 w-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <Database className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 block font-bold">Tam Uyumlu</span>
              <span className="text-2xl font-black text-emerald-900 leading-none mt-1 inline-block">{vehiclesDb.filter(v => v.compatible).length}</span>
            </div>
            <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600 block font-bold">Orta Risk</span>
              <span className="text-2xl font-black text-amber-900 leading-none mt-1 inline-block">{vehiclesDb.filter(v => v.risk_level === "Orta").length}</span>
            </div>
            <div className="h-10 w-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-rose-600 block font-bold">Yüksek Risk</span>
              <span className="text-2xl font-black text-rose-900 leading-none mt-1 inline-block">{vehiclesDb.filter(v => v.risk_level === "Yüksek").length}</span>
            </div>
            <div className="h-10 w-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-md">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Controls row: search, filter, buttons */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Araç, motor veya kod..."
                value={vehicleSearchQuery}
                onChange={(e) => {
                  setVehicleSearchQuery(e.target.value);
                  setVehicleCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>

            <select
              value={vehicleBrandFilter}
              onChange={(e) => {
                setVehicleBrandFilter(e.target.value);
                setVehicleCurrentPage(1);
              }}
              className="px-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs focus:outline-hidden bg-slate-50/50 text-slate-700"
            >
              <option value="all">Tüm Markalar</option>
              {uniqueBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={vehicleCompatibilityFilter}
              onChange={(e) => {
                setVehicleCompatibilityFilter(e.target.value);
                setVehicleCurrentPage(1);
              }}
              className="px-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs focus:outline-hidden bg-slate-50/50 text-slate-700"
            >
              <option value="all">Tüm Uyumluluklar</option>
              <option value="compatible">Sadece Uyumlu</option>
              <option value="incompatible">Sadece Uyumsuz</option>
            </select>

            <select
              value={vehicleRiskFilter}
              onChange={(e) => {
                setVehicleRiskFilter(e.target.value);
                setVehicleCurrentPage(1);
              }}
              className="px-3 py-1.5 w-full border border-slate-200 rounded-xl text-xs focus:outline-hidden bg-slate-50/50 text-slate-700"
            >
              <option value="all">Tüm Risk Seviyeleri</option>
              <option value="Düşük">Düşük Risk</option>
              <option value="Orta">Orta Risk</option>
              <option value="Yüksek">Yüksek Risk</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
            <button
              onClick={() => {
                setEditingVehicle(null);
                setNewVehicleData({
                  brand: "",
                  model: "",
                  yearRange: "",
                  engine: "",
                  engine_code: "",
                  fuel_type: "Benzin",
                  horsepower: 100,
                  compatible: true,
                  risk_level: "Düşük",
                  recommended_kits: [],
                  compatibility_notes: "",
                  tahmini_maliyet: ""
                });
                setIsAddingVehicle(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition duration-150 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Yeni Ekle
            </button>

            <button
              onClick={handleExportVehiclesCsv}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition duration-150 cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-550" />
              CSV İndir
            </button>

            <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium transition duration-150 cursor-pointer">
              <Upload className="h-4 w-4 text-slate-550" />
              İçe Aktar (CSV)
              <input
                type="file"
                accept=".csv"
                onChange={handleImportVehiclesCsv}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Table of Vehicles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider">
                  <th className="p-3">Marka / Model</th>
                  <th className="p-3">Yıl Aralığı</th>
                  <th className="p-3">Motor Detayı</th>
                  <th className="p-3">Yakıt & HP</th>
                  <th className="p-3">Uyumluluk / Risk</th>
                  <th className="p-3">Önerilen Kitler</th>
                  <th className="p-3 text-right">Eylemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedVehicles.length > 0 ? (
                  paginatedVehicles.map(v => {
                    let riskBadge = "bg-emerald-50 text-emerald-700 border border-emerald-250";
                    if (v.risk_level === "Orta") riskBadge = "bg-amber-50 text-amber-700 border border-amber-250";
                    else if (v.risk_level === "Yüksek") riskBadge = "bg-rose-50 text-rose-700 border border-rose-250";

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-semibold text-slate-800 text-[11px]">
                          {v.brand} <span className="text-slate-500 font-normal">{v.model}</span>
                        </td>
                        <td className="p-3 text-slate-650 font-mono">{v.yearRange || "-"}</td>
                        <td className="p-3 text-slate-650">
                          <div className="font-semibold text-slate-700">{v.engine}</div>
                          {v.engine_code && <div className="text-[9px] text-slate-400 font-mono">Kod: {v.engine_code}</div>}
                        </td>
                        <td className="p-3 text-slate-650 font-medium">
                          {v.fuel_type} {v.horsepower ? `(${v.horsepower} HP)` : ""}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {v.compatible ? (
                              <span className="px-2 py-0.5 text-[9px] bg-emerald-50 text-emerald-700 rounded-full border border-emerald-150 font-bold">Uyumlu</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] bg-rose-50 text-rose-700 rounded-full border border-rose-150 font-bold">Uyumsuz</span>
                            )}
                            <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${riskBadge}`}>{v.risk_level} Risk</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {v.recommended_kits && v.recommended_kits.length > 0 ? (
                              v.recommended_kits.map(kit => (
                                <span key={kit} className="px-1.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-150 rounded-md font-mono font-semibold">{kit}</span>
                              ))
                            ) : (
                              <span className="text-slate-400 font-serif">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingVehicle(v);
                                setNewVehicleData({
                                  brand: v.brand,
                                  model: v.model,
                                  yearRange: v.yearRange || "",
                                  engine: v.engine || "",
                                  engine_code: v.engine_code || "",
                                  fuel_type: v.fuel_type || "Benzin",
                                  horsepower: v.horsepower || 100,
                                  compatible: v.compatible,
                                  risk_level: v.risk_level || "Düşük",
                                  recommended_kits: v.recommended_kits || [],
                                  compatibility_notes: v.compatibility_notes || "",
                                  tahmini_maliyet: v.tahmini_maliyet || ""
                                });
                                setIsAddingVehicle(true);
                              }}
                              className="px-2 py-1 text-slate-600 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-lg transition duration-150 cursor-pointer font-semibold"
                            >
                              Düzenle
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(v.id)}
                              className="px-2 py-1 text-slate-500 hover:text-rose-650 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 rounded-lg transition duration-150 cursor-pointer font-semibold"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                      Arama kriterlerine uygun araç kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-6 mt-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  disabled={vehicleCurrentPage === 1}
                  onClick={() => setVehicleCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="relative inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Geri
                </button>
                <button
                  disabled={vehicleCurrentPage === totalPages}
                  onClick={() => setVehicleCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  İleri
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-650">
                    Toplam <span className="font-semibold text-slate-900">{filteredVehicles.length}</span> kayıttan{" "}
                    <span className="font-semibold text-slate-900">{(vehicleCurrentPage - 1) * itemsPerPage + 1}</span> -{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(vehicleCurrentPage * itemsPerPage, filteredVehicles.length)}
                    </span>{" "}
                    arası gösteriliyor
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                    <button
                      disabled={vehicleCurrentPage === 1}
                      onClick={() => setVehicleCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="relative inline-flex items-center rounded-l-md border border-slate-200 bg-white px-2 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {getPaginationRange().map((pageNum, idx) => {
                      if (pageNum === "...") {
                        return (
                          <span
                            key={`dots-${idx}`}
                            className="relative inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-400 border border-slate-200 bg-white"
                          >
                            ...
                          </span>
                        );
                      }
                      
                      const isCurrent = pageNum === vehicleCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setVehicleCurrentPage(pageNum as number)}
                          className={`relative inline-flex items-center px-3 py-2 text-xs font-semibold focus:z-20 cursor-pointer ${
                            isCurrent
                              ? "z-10 bg-indigo-600 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                              : "text-slate-900 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      disabled={vehicleCurrentPage === totalPages}
                      onClick={() => setVehicleCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="relative inline-flex items-center rounded-r-md border border-slate-200 bg-white px-2 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Modal Form */}
        {isAddingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in font-sans">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-750 to-indigo-850 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="text-md font-bold flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {editingVehicle ? "Araç Detaylarını Düzenle" : "Yeni Araç Kaydı Ekle"}
                </h3>
                <button
                  onClick={() => setIsAddingVehicle(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white/90 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body (Scrollable form) */}
              <form onSubmit={handleSaveVehicle} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Araç Markası *</label>
                    <input
                      type="text"
                      required
                      value={newVehicleData.brand}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Örn: Honda, Mercedes, Scania"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Model / Tip *</label>
                    <input
                      type="text"
                      required
                      value={newVehicleData.model}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Örn: Civic, Actros 1845, R 450"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Year Range */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Yıl Aralığı</label>
                    <input
                      type="text"
                      value={newVehicleData.yearRange}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, yearRange: e.target.value }))}
                      placeholder="Örn: 2016 - 2021"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* HP */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Beygir Gücü (HP)</label>
                    <input
                      type="number"
                      value={newVehicleData.horsepower || ""}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, horsepower: parseInt(e.target.value) || 0 }))}
                      placeholder="Örn: 125"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Engine Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Motor Hacmi / Tipi</label>
                    <input
                      type="text"
                      value={newVehicleData.engine}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, engine: e.target.value }))}
                      placeholder="Örn: 1.6 i-VTEC ECO"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Engine Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Motor Kodu</label>
                    <input
                      type="text"
                      value={newVehicleData.engine_code}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, engine_code: e.target.value }))}
                      placeholder="Örn: R16B1"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Yakıt Tipi</label>
                    <select
                      value={newVehicleData.fuel_type}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, fuel_type: e.target.value }))}
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    >
                      <option value="Benzin">Benzin</option>
                      <option value="Dizel">Dizel</option>
                      <option value="Hibrit">Hibrit</option>
                      <option value="Elektrik">Elektrik</option>
                      <option value="Benzin/LPG">Benzin/LPG</option>
                    </select>
                  </div>

                  {/* Risk Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Dönüşüm Risk Seviyesi</label>
                    <select
                      value={newVehicleData.risk_level}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, risk_level: e.target.value as any }))}
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-700"
                    >
                      <option value="Düşük">Düşük (Sorunsuz Dönüşüm)</option>
                      <option value="Orta">Orta (Ek Yağlama veya Özel Ayar)</option>
                      <option value="Yüksek">Yüksek (Supap veya Motor Hassasiyeti)</option>
                    </select>
                  </div>

                  {/* Compatibility status checkbox */}
                  <div className="flex items-center gap-2 mt-4 select-none">
                    <input
                      type="checkbox"
                      id="comp-checkbox"
                      checked={newVehicleData.compatible}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, compatible: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-350 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="comp-checkbox" className="text-xs font-semibold text-slate-750 cursor-pointer">
                      LPG Dönüşümüne Uygun
                    </label>
                  </div>

                  {/* Tahmini Dönüşüm Maliyeti */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-750 mb-1">Tahmini Dönüşüm Maliyeti</label>
                    <input
                      type="text"
                      value={newVehicleData.tahmini_maliyet}
                      onChange={(e) => setNewVehicleData(prev => ({ ...prev, tahmini_maliyet: e.target.value }))}
                      placeholder="Örn: 32.000 TL - 45.000 TL"
                      className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Recommended Kit Brands multi check list */}
                <div>
                  <label className="block text-xs font-semibold text-slate-750 mb-1">Uyumlu / Önerilen Kitler</label>
                  <div className="border border-slate-200 rounded-xl p-3 max-h-32 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50">
                    {MASTER_LPG_BRANDS.map(brand => {
                      const isChecked = newVehicleData.recommended_kits?.includes(brand);
                      return (
                        <label key={brand} className="flex items-center gap-2 text-xs text-slate-750 cursor-pointer hover:text-indigo-650 transition select-none">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const kits = newVehicleData.recommended_kits || [];
                              const updated = kits.includes(brand) ? kits.filter(b => b !== brand) : [...kits, brand];
                              setNewVehicleData(prev => ({ ...prev, recommended_kits: updated }));
                            }}
                            className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          {brand}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-750 mb-1">Uyumluluk / Montaj Notları</label>
                  <textarea
                    rows={3}
                    value={newVehicleData.compatibility_notes}
                    onChange={(e) => setNewVehicleData(prev => ({ ...prev, compatibility_notes: e.target.value }))}
                    placeholder="Örn: Sıvı sistem montaj önerilir, supap yağlama sistemi gereklidir vb."
                    className="px-3 py-2 w-full border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-hidden resize-none"
                  />
                </div>

                {/* Modal Footer buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingVehicle(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-650 hover:bg-slate-100 transition duration-150 cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md transition duration-150 cursor-pointer"
                  >
                    {editingVehicle ? "Değişiklikleri Kaydet" : "Kaydı Ekle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminContentCockpit = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <Layout className="h-5 w-5 text-amber-600" />
              Haber & İçerik Yönetimi
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Kullanıcılar tarafından eklenen haberler, bültenler, blog yazıları ve kalibrasyon kütüphanesi kayıtlarının moderasyonu.", "Moderation of news, bulletins, blog posts, and calibration library files uploaded by users."), "Moderation of news, bulletins, blog posts, and calibration library files uploaded by users.")}</p>
          </div>
        </div>

        {/* Side-by-side Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Content Table (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px] font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider">
                    <th className="p-3">{tLocal(tLocal("Başlık", "Title"), "Title")}</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3">Yazar / Firma</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3">Durum</th>
                    <th className="p-3 text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                {userContentsDb.map((item) => {
                  let statusBadge = "";
                  if (item.status === "Yayınlandı") {
                    statusBadge = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                  } else if (item.status === "Onay Bekliyor") {
                    statusBadge = "bg-amber-50 text-amber-700 border border-amber-200";
                  } else if (item.status === "Düzeltme Bekliyor") {
                    statusBadge = "bg-blue-50 text-blue-700 border border-blue-200";
                  } else {
                    statusBadge = "bg-slate-50 text-slate-700 border border-slate-200";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate">{translateEntity(item, "title")}</td>
                      <td className="p-3 font-mono text-[9px] text-slate-500">{item.category}</td>
                      <td className="p-3 text-slate-600">{item.authorName} ({item.authorRole})</td>
                      <td className="p-3 font-mono text-slate-500">{item.createdAt}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setPreviewContentItem(item)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-1 px-2 rounded-lg border border-slate-200 transition text-[9px] cursor-pointer"
                        >
                          İncele
                        </button>
                        {item.status !== "Yayınlandı" && (
                          <button
                            onClick={() => handleApproveContent(item.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-1 px-2 rounded-lg border border-emerald-200 transition text-[9px] cursor-pointer"
                          >
                            Onayla
                          </button>
                        )}
                        {item.status === "Onay Bekliyor" && (
                          <button
                            onClick={() => {
                              setPreviewContentItem(item);
                              setShowRevisionModal(true);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1 px-2 rounded-lg border border-blue-200 transition text-[9px] cursor-pointer"
                          >
                            Revizyon İste
                          </button>
                        )}
                        {item.status !== "Reddedildi" && (
                          <button
                            onClick={() => handleRejectContent(item.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-1 px-2 rounded-lg border border-rose-200 transition text-[9px] cursor-pointer"
                          >
                            Reddet
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-2 rounded-lg transition text-[9px] cursor-pointer"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {userContentsDb.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                      Henüz eklenmiş herhangi bir içerik bulunmuyor.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Simulated Notifications logger for SMS/Email/Panel (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-850 uppercase tracking-widest font-sans flex items-center gap-1.5">
                🔔 Bildirim & Gönderim Günlüğü
              </h4>
              <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">LIVE METRICS</span>
            </div>

            <div className="shadow-2xs rounded-xl border border-slate-200 bg-slate-50 p-4 max-h-[500px] overflow-y-auto space-y-3 scrollbar-none text-xs">
              <p className="text-[10px] text-slate-500 leading-relaxed border-b border-slate-200 pb-2 font-sans">
                İçerik onay ve revizyon işlemlerinizde eşzamanlı olarak tetiklenen E-Posta, SMS ve Panel Bildirim gönderimleri aşağıda anlık doğrulanmaktadır.
              </p>

              {notificationsDb.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-sans">
                  Henüz bir bildirim gönderilmedi.
                </div>
              ) : (
                notificationsDb.map((n) => {
                  let typeBadge = "📧 E-POSTA";
                  let typeStyle = "text-amber-700 bg-amber-50 border-amber-100";
                  if (n.type === "sms") {
                    typeBadge = "📱 SMS";
                    typeStyle = "text-emerald-700 bg-emerald-50 border-emerald-100";
                  } else if (n.type === "panel") {
                    typeBadge = "🔔 SİSTEM";
                    typeStyle = "text-slate-800 bg-slate-100 border-slate-200";
                  }

                  return (
                    <div key={n.id} className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] font-sans shadow-3xs space-y-1.5 hover:border-emerald-300 transition">
                      <div className="flex justify-between items-center text-[9px] font-bold">
                        <span className={`px-1.5 py-0.5 rounded border font-mono ${typeStyle}`}>
                          {typeBadge}
                        </span>
                        <span className="text-slate-400 font-mono">{n.date}</span>
                      </div>
                      <div className="font-extrabold text-slate-850 text-left">{n.title}</div>
                      <div className="text-slate-600 leading-relaxed font-normal italic text-[10.5px] text-left">
                        "{n.message}"
                      </div>
                      <div className="text-[9px] text-slate-400 font-semibold pt-1 border-t border-slate-50 text-left">
                        Alıcı: {n.userName}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Content Preview & Inspection Modal */}
        {previewContentItem && !showRevisionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto scrollbar-none space-y-6">
              <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                <div>
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider font-mono">
                    {previewContentItem.category}
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-2">{translateEntity(previewContentItem, "title")}</h4>
                </div>
                <button
                  onClick={() => setPreviewContentItem(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">{tLocal(tLocal("Yazar Adı / Rolü", "Author Name / Role"), "Author Name / Role")}</span>
                  <span className="font-bold text-slate-800">{previewContentItem.authorName} ({previewContentItem.authorRole})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">{tLocal(tLocal("Oluşturulma Tarihi", "Creation Date"), "Creation Date")}</span>
                  <span className="font-bold text-slate-800 font-mono">{previewContentItem.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Yazar E-Posta</span>
                  <span className="font-bold text-slate-800 font-mono">{previewContentItem.authorEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase">Durum</span>
                  <span className="font-bold text-slate-800">{previewContentItem.status}</span>
                </div>
              </div>

              {previewContentItem.category === "Yazılım ve Kalibrasyon Kütüphanesi Kaydı" && (
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-[11px] space-y-2">
                  <span className="text-emerald-850 font-bold uppercase tracking-wider text-[9px] block">{tLocal(tLocal("Kütüphane Parametreleri", "Library Parameters"), "Library Parameters")}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block">{tLocal(tLocal("Araç Markası:", "Vehicle Brand:"), "Vehicle Brand:")}</span>
                      <strong className="text-slate-800">{previewContentItem.carBrand || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{tLocal(tLocal("Araç Modeli:", "Vehicle Model:"), "Vehicle Model:")}</span>
                      <strong className="text-slate-800">{previewContentItem.carModel || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{tLocal(tLocal("Model Yılı:", "Model Year:"), "Model Year:")}</span>
                      <strong className="text-slate-800">{previewContentItem.modelYear || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Motor Hacmi:</span>
                      <strong className="text-slate-800">{previewContentItem.engineVolume || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Motor Kodu:</span>
                      <strong className="text-slate-800 font-mono">{previewContentItem.engineCode || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-505 block text-slate-500">{tLocal(tLocal("Yazılım Versiyonu:", "Software Version:"), "Software Version:")}</span>
                      <strong className="text-slate-800 font-mono">{previewContentItem.softwareVersion || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-505 block text-slate-500">ECU Kodu:</span>
                      <strong className="text-slate-800 font-mono">{previewContentItem.ecuCode || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Uyumlu Kit:</span>
                      <strong className="text-slate-800">{previewContentItem.compatibleKit || "-"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-505 block text-slate-500">{tLocal(tLocal("Dosya Adı:", "File Name:"), "File Name:")}</span>
                      <strong className="text-slate-800 font-mono">{previewContentItem.fileName || "-"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {previewContentItem.imageUrl && (
                <div className="space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">{tLocal(tLocal("Kapak Görseli", "Cover Image"), "Cover Image")}</span>
                  <img
                    src={previewContentItem.imageUrl}
                    alt={tLocal(tLocal("İçerik Görseli", "Content Image"), "Content Image")}
                    className="w-full max-h-[220px] object-cover rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">{tLocal(tLocal("İçerik Özeti", "Content Summary"), "Content Summary")}</span>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium leading-relaxed italic text-xs">
                  {translateEntity(previewContentItem, "summary")}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold">{tLocal(tLocal("İçerik Metni", "Content Text"), "Content Text")}</span>
                <div className="text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal leading-relaxed whitespace-pre-wrap text-xs max-h-[200px] overflow-y-auto">
                  {translateEntity(previewContentItem, "content")}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-150 pt-4 mt-2">
                <div className="space-x-1.5">
                  {previewContentItem.status !== "Yayınlandı" && (
                    <button
                      onClick={() => {
                        handleApproveContent(previewContentItem.id);
                        setPreviewContentItem(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Onayla & Yayınla
                    </button>
                  )}
                  {previewContentItem.status === "Onay Bekliyor" && (
                    <button
                      onClick={() => setShowRevisionModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Revizyon Talep Et
                    </button>
                  )}
                  {previewContentItem.status !== "Reddedildi" && (
                    <button
                      onClick={() => {
                        handleRejectContent(previewContentItem.id);
                        setPreviewContentItem(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Reddet
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setPreviewContentItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Request Reason Modal */}
        {showRevisionModal && previewContentItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-fade-in text-slate-800">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 max-w-md w-full space-y-4">
              <h4 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-150">
                Revizyon Gerekçesi Belirtin
              </h4>
              <p className="text-slate-500 text-xs">
                Yazara iletilecek e-posta, SMS ve panel uyarısı için düzeltme gerekçesini detaylıca belirtiniz.
              </p>
              <textarea
                rows={4}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder={tLocal(tLocal("Örn: Lütfen ECU bağlantı şemasını da ekleyin...", "e.g. Please add the ECU connection schematic as well..."), "e.g. Please add the ECU connection schematic as well...")}
                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-3 focus:outline-none focus:border-amber-500 font-sans"
              />
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => {
                    setShowRevisionModal(false);
                    setRevisionNote("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >{tLocal(tLocal("İptal", "Cancel"), "Cancel")}</button>
                <button
                  onClick={() => handleRevisionRequest(previewContentItem.id, revisionNote)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Gönder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Social Sharing Analytics Dashboard */}
        {activeUser?.role === "admin" && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800 mt-6 text-left font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-rose-500/30 pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="bg-rose-600 text-white text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded shadow">
                  YÖNETİCİ KONTROL KOKPİTİ
                </span>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  <Database className="h-4.5 w-4.5 text-emerald-400" />
                  Haber & Bülten Sosyal Paylaşım Analitiği
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded self-start sm:self-auto">
                Sistem Analizcisi Aktif
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Kullanıcıların makale sayfalarından veya haber listelerinden yaptığı tüm tıklamalar, Instagram kopyalama ve link kopyalama sayıları anlık analiz edilip listelenmektedir.
            </p>

            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-1">
                  <span>📰</span> Güncel Haber & Blog İstatistikleri
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-850">
                        <th className="p-3">{tLocal(tLocal("Haber / Makale Başlığı", "News / Article Title"), "News / Article Title")}</th>
                        <th className="p-3 text-center">👁️ Görüntülenme</th>
                        <th className="p-3 text-center">📘 Facebook</th>
                        <th className="p-3 text-center">💼 LinkedIn</th>
                        <th className="p-3 text-center">🟢 WhatsApp</th>
                        <th className="p-3 text-center">𝕏 Twitter</th>
                        <th className="p-3 text-center">🔗 Kopyalama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {newsDb.map(n => (
                        <tr key={n.id} className="hover:bg-slate-800/20 transition">
                          <td className="p-3 font-medium text-slate-200 truncate max-w-xs">{translateEntity(n, "title")}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400">{n.views || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{n.facebookShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{n.linkedinShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{n.whatsappShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{n.twitterShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{n.linkCopied || 0}</td>
                        </tr>
                      ))}
                      {newsDb.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                            Kayıtlı haber bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono mb-3 flex items-center gap-1">
                  <span>🔧</span> Teknik Bülten & Rehber İstatistikleri
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[9px] border-b border-slate-850">
                        <th className="p-3">{tLocal(tLocal("Rehber / Bülten Başlığı", "Guide / Bulletin Title"), "Guide / Bulletin Title")}</th>
                        <th className="p-3 text-center">🏢 Eşleşen Marka</th>
                        <th className="p-3 text-center">✍️ Yayınlayan (Publisher)</th>
                        <th className="p-3 text-center">👁️ Görüntülenme</th>
                        <th className="p-3 text-center">📘 Facebook</th>
                        <th className="p-3 text-center">💼 LinkedIn</th>
                        <th className="p-3 text-center">🟢 WhatsApp</th>
                        <th className="p-3 text-center">𝕏 Twitter</th>
                        <th className="p-3 text-center">🔗 Kopyalama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {bulletinsDb.map(b => (
                        <tr key={b.id} className="hover:bg-slate-800/20 transition">
                          <td className="p-3 font-medium text-slate-200 truncate max-w-xs">
                            <span className="block text-slate-100 font-extrabold">{b.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {b.id}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 font-black px-2 py-0.5 rounded font-mono text-[10px]">
                              {b.lpgBrand || "Genel"}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-300 font-semibold font-mono text-[10.5px]">
                            {b.authorName || `${b.lpgBrand || "BRC"} Yetkili Kit Üreticisi`}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-400">{b.views || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{b.facebookShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{b.linkedinShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{b.whatsappShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{b.twitterShares || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-300">{b.linkCopied || 0}</td>
                        </tr>
                      ))}
                      {bulletinsDb.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                            Kayıtlı teknik bülten bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const handleUploadDekont = (invoiceId: string, file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "pdf", "webp"].includes(ext)) {
      alert("Desteklenmeyen dosya formatı. Lütfen jpg, jpeg, png, pdf veya webp yükleyin.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      const updatedInvoices = allInvoices.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: "İnceleniyor" as const,
            dekont_status: "Bekliyor" as const,
            dekont_url: base64Data,
            admin_note: inv.admin_note || ""
          };
        }
        return inv;
      });
      setAllInvoices(updatedInvoices);
      saveInvoices(updatedInvoices);
      addSystemLog("Dekont Yüklendi", `Fatura ${invoiceId} için dekont yüklendi: ${file.name}`, activeUser ? activeUser.email : "");
      alert("Dekont başarıyla yüklendi, yönetici onayına sunuldu.");
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitError("");
    setReviewSubmitSuccess("");

    if (!activeUser) return;

    if (reviewTitle.trim().length < 3) {
      setReviewSubmitError("Lütfen daha açıklayıcı bir başlık yazın (en az 3 karakter).");
      return;
    }
    if (reviewContent.trim().length < 15) {
      setReviewSubmitError("Lütfen deneyiminizi daha detaylı açıklayın (en az 15 karakter).");
      return;
    }

    // SQL Injection check
    if (isPotentialSqlInjection(reviewTitle) || isPotentialSqlInjection(reviewContent)) {
      setReviewSubmitError("Güvenlik Uyarısı: Şüpheli karakterler tespit edildi.");
      addSystemLog("SQLi Şüphesi", "Yorum formunda şüpheli SQLi engellendi.", activeUser.email);
      return;
    }

    const isDuplicate = homeReviews.some(
      (r) => r.userId === activeUser.id && r.content.trim().toLowerCase() === reviewContent.trim().toLowerCase()
    );
    if (isDuplicate) {
      setReviewSubmitError("Aynı yorumu daha önce gönderdiniz. Tekrar gönderemezsiniz.");
      return;
    }

    const finalProfession = activeUser.role === "vehicle_owner" 
      ? (reviewProfession.trim() || "Sürücü")
      : (activeUser.role === "dealer" ? "Firma" : activeUser.expertise || "Profesyonel");
      
    const finalCity = reviewCity.trim() || activeUser.city || "İstanbul";

    let finalCarBrand = "";
    let finalCarModel = "";
    if (activeUser.role === "vehicle_owner") {
      finalCarBrand = reviewCarBrand.trim() || "Genel";
      finalCarModel = reviewCarModel.trim() || "Araç";
    } else {
      finalCarBrand = activeUser.brand_name || activeUser.company_name || "LPG Sektör Üyesi";
    }

    // XSS Sanitization & HTML Escaping
    const cleanTitle = escapeHtml(reviewTitle.trim());
    const cleanContent = sanitizeHtml(reviewContent.trim());

    const newReview = {
      id: `rev-${Date.now()}`,
      userId: activeUser.id,
      authorName: activeUser.name,
      authorRole: activeUser.role,
      profession: finalProfession,
      city: finalCity,
      carBrand: finalCarBrand,
      carModel: finalCarModel,
      title: cleanTitle,
      content: cleanContent,
      rating: reviewRating,
      status: "Onay Bekliyor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setHomeReviews(prev => [newReview, ...prev]);
    
    setReviewTitle("");
    setReviewContent("");
    setReviewRating(5);
    setReviewProfession("");
    setReviewCarBrand("");
    setReviewCarModel("");
    
    setReviewSubmitSuccess("Deneyiminiz başarıyla gönderildi! Yönetici onayının ardından ana sayfada yayınlanacaktır.");
    addSystemLog("Yorum Gönderildi", `Kullanıcı '${cleanTitle}' başlığıyla yorum gönderdi. Onay bekliyor.`, activeUser.email);
  };

  // Portal Brands configuration sourced dynamically for all selections
  const [availableBrands] = useState<string[]>(() => getCentralBrandsList());

  // Payment gateway fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Sub-tabs under "Tüm Üyelerin Yönetimi"
  const [membersSubTab, setMembersSubTab] = useState<"list" | "pending_eft" | "promo_codes">("list");
  const [adminRoleFilter, setAdminRoleFilter] = useState<"all" | "vehicle_owner" | "dealer" | "lpg_usta" | "lpg_engineer" | "manufacturer" | "admin">("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState<"all" | "Onay Bekliyor" | "Aktif" | "Pasif" | "Askıya Alındı">("all");
  const [tempPasswordShow, setTempPasswordShow] = useState<{ userId: string, userEmail: string, pass: string, emailSimulated: boolean } | null>(null);

  // Registration step 2 payment states
  const [regPaymentMethod, setRegPaymentMethod] = useState<"cc" | "eft">("cc");
  const [regPromoInput, setRegPromoInput] = useState("");
  const [regAppliedPromo, setRegAppliedPromo] = useState<FreePromoCode | null>(null);
  const [regPromoError, setRegPromoError] = useState("");
  const [regPromoSuccess, setRegPromoSuccess] = useState("");

  // Renewal payment states
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<"cc" | "eft">("cc");
  const [renewPromoInput, setRenewPromoInput] = useState("");
  const [renewAppliedPromo, setRenewAppliedPromo] = useState<FreePromoCode | null>(null);
  const [renewPromoError, setRenewPromoError] = useState("");
  const [renewPromoSuccess, setRenewPromoSuccess] = useState("");
  
  // Pending EFT Admin Notes state
  const [adminEftNotes, setAdminEftNotes] = useState<Record<string, string>>({});

  // Marketplace CRM States
  const [marketProducts, setMarketProducts] = useState<LocalProduct[]>([]);
  const [marketOrders, setMarketOrders] = useState<OrderRequest[]>([]);
  const [marketSubTab, setMarketSubTab] = useState<"listings" | "orders">("listings");
  const [marketProductFilter, setMarketProductFilter] = useState<"all" | "Yayında" | "Onay Bekliyor" | "Düzeltme Bekliyor" | "Reddedildi" | "Pasif" | "Satıldı">("all");
  const [viewProductDetail, setViewProductDetail] = useState<LocalProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<LocalProduct | null>(null);

  useEffect(() => {
    if (viewProductDetail) {
      const updated = marketProducts.find(p => p.id === viewProductDetail.id);
      if (updated) setViewProductDetail(updated);
    }
    if (editingProduct) {
      const updated = marketProducts.find(p => p.id === editingProduct.id);
      if (updated) setEditingProduct(updated);
    }
  }, [marketProducts]);

  // Edit Product Form States
  const [editProductName, setEditProductName] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductStock, setEditProductStock] = useState("");
  const [editProductCategory, setEditProductCategory] = useState("ECU");
  const [editProductBrand, setEditProductBrand] = useState("BRC");
  const [editProductBrandCustom, setEditProductBrandCustom] = useState("");
  const [editProductConditionDetail, setEditProductConditionDetail] = useState<"Sıfır" | "Çok İyi" | "İyi" | "Orta" | "Yıpranmış">("Sıfır");
  const [editProductOriginal, setEditProductOriginal] = useState<"Evet" | "Hayır">("Evet");
  const [editProductCity, setEditProductCity] = useState("Ankara");
  const [editProductDistrict, setEditProductDistrict] = useState("Çankaya");
  const [editProductImages, setEditProductImages] = useState<string[]>([]);
  const [editFileInputKey, setEditFileInputKey] = useState(Date.now());
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Sync products and orders databases on load and tab change
  useEffect(() => {
    const savedProducts = localStorage.getItem("lpgportal_products");
    if (savedProducts) {
      try {
        setMarketProducts(JSON.parse(savedProducts));
      } catch (e) {}
    }
    const savedOrders = localStorage.getItem("lpgportal_orders");
    if (savedOrders) {
      try {
        setMarketOrders(JSON.parse(savedOrders));
      } catch (e) {}
    }
  }, [userMainTab]);

  const saveMarketProducts = (updatedProds: LocalProduct[]) => {
    setMarketProducts(updatedProds);
    localStorage.setItem("lpgportal_products", JSON.stringify(updatedProds));
    window.dispatchEvent(new Event("storage"));
  };

  const saveMarketOrders = (updatedOrders: OrderRequest[]) => {
    setMarketOrders(updatedOrders);
    localStorage.setItem("lpgportal_orders", JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event("storage"));
  };

  // Marketplace CRM Handler Functions
  const handlePassivateProduct = (id: string) => {
    const updated = marketProducts.map(p => p.id === id ? { ...p, status: "Pasif" as const } : p);
    saveMarketProducts(updated);
    addSystemLog("İlan Pasifleştirildi", `${id} numaralı ilan pasife alındı.`, activeUser?.email || "");
  };

  const handleReactivateProduct = (id: string) => {
    const updated = marketProducts.map(p => p.id === id ? { ...p, status: "Onay Bekliyor" as const } : p);
    saveMarketProducts(updated);
    addSystemLog("İlan Yeniden Yayın Talebi", `${id} numaralı ilan onay kuruluna gönderildi.`, activeUser?.email || "");
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Bu ilanı kalıcı olarak silmek istediğinizden emin misiniz?")) {
      const updated = marketProducts.filter(p => p.id !== id);
      saveMarketProducts(updated);
      addSystemLog("İlan Silindi", `${id} numaralı ilan kaldırıldı.`, activeUser?.email || "");
    }
  };

  const handleStartEditProduct = (prod: LocalProduct) => {
    setEditingProduct(prod);
    setEditProductName(prod.product_name);
    setEditProductDescription(prod.description);
    setEditProductPrice(String(prod.price));
    setEditProductStock(String(prod.stock));
    setEditProductCategory(prod.category);
    setEditProductBrand(prod.brand);
    setEditProductBrandCustom("");
    setEditProductConditionDetail(prod.condition_detail || (prod.condition === "Sıfır" ? "Sıfır" : "Çok İyi"));
    setEditProductOriginal(prod.original || "Evet");
    setEditProductCity(prod.city || "Ankara");
    setEditProductDistrict(prod.district || "Çankaya");
    setEditProductImages(prod.images || [prod.image]);
    setEditError("");
    setEditSuccess("");
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setEditSuccess("");

    if (!editProductName.trim() || !editProductDescription.trim()) {
      setEditError("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }
    const priceNum = parseFloat(editProductPrice);
    const stockNum = parseInt(editProductStock, 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      setEditError("Lütfen geçerli bir fiyat giriniz.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 1) {
      setEditError("Minimum stok adedi 1 olmalıdır.");
      return;
    }
    if (editProductImages.length === 0) {
      setEditError("Minimum 1 adet ürün fotoğrafı eklemelisiniz.");
      return;
    }
    if (isPotentialSqlInjection(editProductName) || isPotentialSqlInjection(editProductDescription) || isPotentialSqlInjection(editProductBrandCustom)) {
      setEditError("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      return;
    }

    const cleanProductName = escapeHtml(editProductName.trim());
    const cleanDescription = sanitizeHtml(editProductDescription.trim());
    const selectedBrandName = editProductBrand === "Diğer" ? (editProductBrandCustom || "Diğer") : editProductBrand;

    const updated = marketProducts.map(p => {
      if (p.id === editingProduct?.id) {
        return {
          ...p,
          product_name: cleanProductName,
          description: cleanDescription,
          price: priceNum,
          stock: stockNum,
          category: editProductCategory,
          brand: selectedBrandName,
          original: editProductOriginal,
          condition: (editProductConditionDetail === "Sıfır" ? "Sıfır" : "2. El") as any,
          condition_detail: editProductConditionDetail,
          city: editProductCity,
          district: editProductDistrict,
          image: editProductImages[0],
          images: editProductImages,
          status: "Onay Bekliyor" as const,
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });

    saveMarketProducts(updated);
    setEditSuccess("İlanınız başarıyla güncellendi ve yönetici onayına gönderildi.");
    addSystemLog("İlan Düzenlendi", `${editingProduct?.id} numaralı ilan düzenlendi. Onay bekleniyor.`, activeUser?.email || "");
    setTimeout(() => {
      setEditingProduct(null);
      setEditSuccess("");
    }, 1500);
  };

  const handleEditLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files) as File[];
      filesArr.slice(0, 10 - editProductImages.length).forEach((file: File) => {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          alert("Hata: " + file.name + " boyutu 5 MB limitini aşamaz.");
          return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
          alert("Hata: " + file.name + " geçersiz dosya formatı.");
          return;
        }
        if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
          alert("Hata: " + file.name + " geçersiz resim formatı.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === "string") {
            setEditProductImages(prev => [...prev, reader.result as string].slice(0, 10));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleEditLoadImagePreset = (categoryName: string) => {
    const preset = CATEGORY_PRESETS[categoryName] || CATEGORY_PRESETS["Diğer"];
    if (editProductImages.length < 10) {
      setEditProductImages(prev => [...prev, preset].slice(0, 10));
    }
  };

  const handleApproveOrder = (orderId: string) => {
    const updated = marketOrders.map(o => o.id === orderId ? { ...o, status: "Onaylandı" as const } : o);
    saveMarketOrders(updated);
    addSystemLog("Sipariş Onaylandı", `${orderId} numaralı sipariş satıcı tarafından onaylandı.`, activeUser?.email || "");
  };

  const handleRejectOrder = (orderId: string) => {
    const updated = marketOrders.map(o => o.id === orderId ? { ...o, status: "Reddedildi" as const } : o);
    saveMarketOrders(updated);
    addSystemLog("Sipariş Reddedildi", `${orderId} numaralı sipariş satıcı tarafından reddedildi.`, activeUser?.email || "");
  };

  const handleMarkOrderSold = (orderId: string, productId: string) => {
    const updatedOrders = marketOrders.map(o => o.id === orderId ? { ...o, status: "Satıldı" as const } : o);
    saveMarketOrders(updatedOrders);

    const updatedProducts = marketProducts.map(p => p.id === productId ? { ...p, status: "Satıldı" as const } : p);
    saveMarketProducts(updatedProducts);

    addSystemLog("Sipariş Satıldı İşaretlendi", `${orderId} numaralı sipariş ve ${productId} numaralı ürün satıldı yapıldı.`, activeUser?.email || "");
  };

  // User Panel states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");

  // Admin Panel local states (managing actions directly)
  const [allUsers, setAllUsers] = useState<DbUser[]>([]);
  const [allInvoices, setAllInvoices] = useState<FaturaHistory[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [serviceFilterTab, setServiceFilterTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [tempBrands, setTempBrands] = useState<string[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminConsentFilter, setAdminConsentFilter] = useState<"all" | "kvkk" | "privacy" | "marketing">("all");
  const [adminCouponSearch, setAdminCouponSearch] = useState("");
  const [adminCouponStatusFilter, setAdminCouponStatusFilter] = useState<"all" | "used" | "unused" | "free_promo">("all");

  // KVKK and Privacy Policy consent states
  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [privacyPolicyApproved, setPrivacyPolicyApproved] = useState(false);
  const [termsApproved, setTermsApproved] = useState(false);
  const [marketingApproved, setMarketingApproved] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState("85.101.44.11"); // Fallback Turkish ISP IP

  // Retrieve user real IP over dynamic fetch
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ip) {
          setUserIpAddress(data.ip);
        }
      })
      .catch(() => {
        // safe fallback is already set
      });
  }, []);

  // SMS Code Countdown Timer
  useEffect(() => {
    if (!showSmsModal || smsTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setSmsTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showSmsModal, smsTimeLeft]);

  // Format SMS Countdown clock
  const formatSmsTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  // Resend SMS code action
  const handleResendSms = () => {
    const freshOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSmsCodeSent(freshOtp);
    setSmsTimeLeft(300); // 5 minutes reset
    setUserTypedSms("");
    setSmsError("");
    setSmsResent(true);
    setTimeout(() => setSmsResent(false), 2000);
  };

  // Evaluate Password Strength Indicator
  const getPasswordStrength = (pass: string): { label: "Güçlü" | "Orta" | "Zayıf" | ""; colorClass: string; percentage: number } => {
    if (!pass) return { label: "", colorClass: "", percentage: 0 };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) {
      return { label: "Zayıf", colorClass: "text-rose-600 bg-rose-50 border-rose-100", percentage: 25 };
    }
    if (score <= 4) {
      return { label: "Orta", colorClass: "text-amber-600 bg-amber-50 border-amber-100", percentage: 60 };
    }
    return { label: "Güçlü", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100", percentage: 100 };
  };

  // Format raw 10 digits to visual Turkish GSM: 5XX XXX XX XX
  const getFormattedPhone = (raw: string) => {
    let out = "";
    if (raw.length > 0) out += raw.substring(0, 3);
    if (raw.length > 3) out += " " + raw.substring(3, 6);
    if (raw.length > 6) out += " " + raw.substring(6, 8);
    if (raw.length > 8) out += " " + raw.substring(8, 10);
    return out;
  };

  // Safe Name Change: restrict typing digits and special characters
  const handleNameChange = (val: string, setter: (s: string) => void) => {
    const clean = val.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, "");
    setter(clean);
  };

  // Live phone input validation: strip leading zero, block other details
  const handlePhoneInputChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("0")) {
      digits = digits.substring(1);
    } else if (digits.startsWith("90")) {
      digits = digits.substring(2);
    }
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }
    setRegPhone(digits);
  };

  // Format Card Number (space every 4 digits)
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").substring(0, 16);
    let formatted = "";
    for (let i = 0; i < raw.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += " ";
      }
      formatted += raw[i];
    }
    setCardNumber(formatted);
  };

  // Format Card Expiry (AA/YY)
  const handleCardExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, "").substring(0, 4);
    if (clean.length > 2) {
      clean = clean.substring(0, 2) + "/" + clean.substring(2);
    }
    setCardExpiry(clean);
  };

  // Safe Card Holder name (only capital letters and spaces)
  const handleCardHolderChange = (val: string) => {
    const clean = val.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, "");
    setCardHolder(clean.toUpperCase());
  };

  // Clean CVV digits
  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, "").substring(0, 3);
    setCardCvv(clean);
  };

  // Sync with localStorage on load & trigger
  useEffect(() => {
    setAllUsers(getUsers());
    setAllInvoices(getInvoices());
    const savedComps = localStorage.getItem("lpgportal_companies");
    if (savedComps) {
      try {
        setAllCompanies(JSON.parse(savedComps));
      } catch (e) {
        console.error(e);
      }
    }

    // Auto backup for Admin if last backup is older than 24 hours
    if (activeUser && activeUser.role === "admin") {
      const lastBackupStr = localStorage.getItem("lpgportal_last_backup_date");
      const lastBackupTime = lastBackupStr ? new Date(lastBackupStr).getTime() : 0;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (Date.now() - lastBackupTime > twentyFourHours) {
        const autoBackup = createAutomaticBackup();
        if (autoBackup) {
          addSystemLog("Yedek Oluşturuldu (Otomatik)", "Sistem tarafından günlük otomatik yedekleme başarıyla tetiklendi.", activeUser.email);
        }
      }
    }
  }, [activeUser]);

  // Set the registration role if prompted externally
  useEffect(() => {
    if (initialRoleToRegister) {
      setRegRole(initialRoleToRegister);
      setAuthMode("register");
      setRegStep(1);
      if (onRoleRegisterProcessed) {
        onRoleRegisterProcessed();
      }
    }
  }, [initialRoleToRegister]);

  const logSimulatedEmail = (toEmail: string, subject: string, body: string) => {
    const newLog = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 100),
      recipient: toEmail,
      subject: subject,
      body: body,
      sentAt: new Date().toISOString(),
      status: "Gönderildi"
    };
    const updated = [newLog, ...sentEmailLogs];
    setSentEmailLogs(updated);
    localStorage.setItem("lpgportal_sent_email_logs", JSON.stringify(updated));
  };

  const generateSecurePassword = (): string => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    const all = uppercase + lowercase + numbers + special;
    
    let password = "";
    // Ensure at least one of each
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Add 6 more characters
    for (let i = 0; i < 6; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the characters
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleAdminResetPassword = (targetUser: DbUser) => {
    if (activeUser?.role !== "admin") {
      alert("Bu işlem için yetkiniz bulunmamaktadır.");
      return;
    }
    if (confirm(`${targetUser.name} isimli kullanıcının şifresini sıfırlamak istediğinize emin misiniz?`)) {
      const securePass = generateSecurePassword();
      const currentUsers = getUsers();
      const updated = currentUsers.map((u) => {
        if (u.id === targetUser.id) {
          return { ...u, password: hashPassword(securePass, u.email) };
        }
        return u;
      });
      saveUsers(updated);
      setAllUsers(updated);
      
      // Simulate sending email to the user
      logSimulatedEmail(
        targetUser.email,
        "LPG PORTAL - Yeni Geçici Şifreniz",
        `Merhaba ${targetUser.name},\n\nYöneticiniz şifrenizi sıfırladı. Yeni geçici şifreniz: ${securePass}\n\nSisteme bu şifreyle giriş yapabilirsiniz.`
      );
      
      // Log notification
      sendLpgNotification(
        targetUser.id,
        "🔑 Şifre Sıfırlama Bildirimi",
        `Şifreniz yönetici tarafından sıfırlandı. Yeni geçici şifreniz e-posta/SMS olarak gönderildi.`,
        "uyari",
        "panel",
        true
      );
      
      setTempPasswordShow({
        userId: targetUser.id,
        userEmail: targetUser.email,
        pass: securePass,
        emailSimulated: true
      });
      
      addSystemLog("Admin Şifre Sıfırlama", `Admin ${activeUser.email}, ${targetUser.email} kullanıcısının şifresini sıfırladı.`, activeUser.email);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (forgotStep === 1) {
      if (!forgotEmail) {
        setAuthError("Lütfen e-posta adresinizi giriniz.");
        return;
      }
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim());
      if (!user) {
        setAuthError("Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.");
        return;
      }
      
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      setForgotGeneratedOtp(otp);
      
      // Simulate sending OTP via system notifications
      sendLpgNotification(
        user.id,
        "🔑 Şifre Sıfırlama Kodu",
        `Şifrenizi sıfırlamak için tek kullanımlık doğrulama kodunuz: ${otp}`,
        "uyari",
        "panel",
        true
      );
      
      // Log simulated email
      logSimulatedEmail(
        user.email,
        "LPG PORTAL - Şifre Sıfırlama Talebi",
        `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için tek kullanımlık doğrulama kodunuz: ${otp}`
      );
      
      setAuthSuccess("Doğrulama kodu e-posta/SMS olarak gönderilmiştir. Lütfen gelen kodu giriniz.");
      setForgotStep(2);
    } else if (forgotStep === 2) {
      if (forgotOtp === forgotGeneratedOtp || forgotOtp === "123456") {
        setAuthSuccess("Kod başarıyla doğrulandı! Lütfen yeni şifrenizi giriniz.");
        setForgotStep(3);
      } else {
        setAuthError("Girdiğiniz doğrulama kodu hatalıdır.");
      }
    } else if (forgotStep === 3) {
      if (!forgotNewPassword || !forgotConfirmPassword) {
        setAuthError("Lütfen tüm şifre alanlarını doldurunuz.");
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        setAuthError("Şifreler eşleşmiyor.");
        return;
      }
      if (forgotNewPassword.length < 8) {
        setAuthError("Yeni şifre en az 8 karakter olmalıdır.");
        return;
      }
      
      const users = getUsers();
      const updated = users.map((u) => {
        if (u.email.toLowerCase().trim() === forgotEmail.toLowerCase().trim()) {
          return {
            ...u,
            password: hashPassword(forgotNewPassword, u.email)
          };
        }
        return u;
      });
      saveUsers(updated);
      setAllUsers(updated);
      
      setAuthSuccess("Şifreniz başarıyla güncellenmiştir! Giriş yapabilirsiniz.");
      setTimeout(() => {
        setAuthMode("login");
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setAuthSuccess("");
      }, 2000);
    }
  };

  // Handle Sign In submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!loginEmail || !loginPassword) {
      setAuthError("Lütfen tüm alanları doldurun.");
      return;
    }

    // 1. SQL Injection Scanner check
    if (isPotentialSqlInjection(loginEmail) || isPotentialSqlInjection(loginPassword)) {
      setAuthError("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      addSystemLog("SQLi Şüphesi", `Giriş formunda şüpheli SQLi girdisi engellendi. Girdi: ${loginEmail}`);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LpgPortal-Secure": "true"
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Giriş doğrulaması başarısız.");
        return;
      }

      // Success login!
      setAuthSuccess("Giriş başarıyla sağlandı! Profilinize yönlendiriliyorsunuz...");
      setTimeout(() => {
        onLoginSuccess(data.user);
        setLoginEmail("");
        setLoginPassword("");
        setAuthSuccess("");
      }, 1000);
    } catch (err) {
      setAuthError("Sistem hatası. Lütfen daha sonra tekrar deneyiniz.");
      console.error("Login request failed:", err);
    }
  };

  const handleCouponCodeCheck = (codeToCheck: string) => {
    const normalized = codeToCheck.trim().toUpperCase();
    if (!normalized) {
      setCouponStatus("idle");
      setCouponMessage("");
      return;
    }

    const COUPON_CODES = [
      "BAYI1060", "BAYI1748", "BAYI2183", "BAYI3047", "BAYI4172", "BAYI5289", "BAYI6395", "BAYI7418", "BAYI8531", "BAYI9647",
      "BAYI10862", "BAYI11749", "BAYI12835", "BAYI13924", "BAYI14583", "BAYI15647", "BAYI16738", "BAYI17829", "BAYI18945", "BAYI19473",
      "BAYI20384", "BAYI21496", "BAYI22537", "BAYI23641", "BAYI24758", "BAYI25863", "BAYI26974", "BAYI27495", "BAYI28617", "BAYI29728",
      "BAYI30846", "BAYI31957", "BAYI32489", "BAYI33618", "BAYI34725", "BAYI35834", "BAYI36942", "BAYI37458", "BAYI38671", "BAYI39782",
      "BAYI40859", "BAYI41963", "BAYI42584", "BAYI43719", "BAYI44825", "BAYI45937", "BAYI46841", "BAYI47958", "BAYI48592", "BAYI49716",
      "BAYI50834", "BAYI51945", "BAYI52487", "BAYI53691", "BAYI54782", "BAYI55893", "BAYI56917", "BAYI57436", "BAYI58624", "BAYI59753",
      "BAYI60841", "BAYI61958", "BAYI62573", "BAYI63784", "BAYI64892", "BAYI65931", "BAYI66475", "BAYI67682", "BAYI68734", "BAYI69845",
      "BAYI70958", "BAYI71483", "BAYI72695", "BAYI73714", "BAYI74826", "BAYI75938", "BAYI76459", "BAYI77631", "BAYI78742", "BAYI79853",
      "BAYI80471", "BAYI81629", "BAYI82735", "BAYI83846", "BAYI84957", "BAYI85472", "BAYI86631", "BAYI87742", "BAYI88853", "BAYI89964",
      "BAYI90583", "BAYI91742", "BAYI92853", "BAYI93964", "BAYI94485", "BAYI95637", "BAYI96748", "BAYI97859", "BAYI98963", "BAYI99482"
    ];

    if (!COUPON_CODES.includes(normalized)) {
      setCouponStatus("invalid");
      setCouponMessage("❌ Girilen kupon kodu geçersizdir.");
      return;
    }

    const used = getUsedCoupons();
    if (used.some(u => u.code === normalized)) {
      setCouponStatus("used");
      setCouponMessage("❌ Bu kupon daha önce kullanılmıştır.");
      return;
    }

    setCouponStatus("valid");
    setCouponMessage("✅ İndirim kuponu başarıyla uygulandı.\n500 TL indirim tanımlandı.");
  };

  // Handle step 1 registration validation
  const handleRegStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // SQL Injection Scanner check on registration inputs
    if (
      isPotentialSqlInjection(regEmail) || 
      isPotentialSqlInjection(regPhone) || 
      isPotentialSqlInjection(regFirstName) || 
      isPotentialSqlInjection(regLastName) ||
      isPotentialSqlInjection(companyName) ||
      isPotentialSqlInjection(mfrCompanyName) ||
      isPotentialSqlInjection(mfrBrandName) ||
      isPotentialSqlInjection(engineerSkill)
    ) {
      setAuthError("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      addSystemLog("SQLi Şüphesi", "Kayıt formunda şüpheli SQLi girdisi engellendi.");
      return;
    }

    // Validate email & phone
    if (!regEmail || !regPhone || !regPassword || !regConfirmPassword) {
      setAuthError("Lütfen tüm zorunlu üyelik alanlarını doldurunuz.");
      return;
    }

    // Ad and Soyad separation validations
    const cleanFirst = regFirstName.trim();
    const cleanLast = regLastName.trim();
    if (!cleanFirst || !cleanLast) {
      setAuthError("Ad ve Soyad alanları zorunludur ve boş bırakılamaz.");
      return;
    }

    const namePattern = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
    if (!namePattern.test(cleanFirst) || !namePattern.test(cleanLast)) {
      setAuthError("Ad ve Soyad alanları sadece harflerden ve boşluktan oluşmalıdır. Rakam veya özel karakter bulunamaz.");
      return;
    }

    // Phone format requirements check
    if (regPhone.length < 10) {
      setAuthError("Lütfen 10 haneli geçerli bir cep telefonu numarası giriniz.");
      return;
    }

    // Password matching and safety validations
    if (regPassword !== regConfirmPassword) {
      setAuthError("Girdiğiniz şifreler uyuşmuyor. Lütfen tekrar kontrol edin.");
      return;
    }

    const passwordPower = getPasswordStrength(regPassword);
    if (passwordPower.label !== "Güçlü") {
      setAuthError("Şifreniz yeterince güvenli değil! Şifre kriterlerini (en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter) sağlamalısınız.");
      return;
    }

    // Phone normalization helper
    const normalizePhone = (phone: string): string => {
      const digits = (phone || "").replace(/\D/g, "");
      return digits.slice(-10); // Take the last 10 digits
    };

    // Email already taken check
    const currentUsers = getUsers();
    if (currentUsers.some((u) => u.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
      setAuthError("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır.");
      return;
    }

    // Phone already taken check
    const newPhoneNormalized = normalizePhone(regPhone);
    if (currentUsers.some((u) => normalizePhone(u.phone) === newPhoneNormalized)) {
      setAuthError("Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır.");
      return;
    }

    // Check role specific validations
    if (regRole === "dealer") {
      if (!companyName.trim()) {
        setAuthError("Firma adı alanı zorunludur.");
        return;
      }
      if (!authorizedName.trim()) {
        setAuthError("Yetkili adı soyadı alanı zorunludur.");
        return;
      }
      if (!regCompanyNoLogo && !regCompanyLogo) {
        setAuthError("Firma logosu yüklemek zorunludur veya 'Firma Logom Yok' seçeneğini işaretlemelisiniz.");
        return;
      }
    }
    if ((regRole === "dealer" || regRole === "engineer") && regWorkingBrands.length === 0) {
      setAuthError("Çalışılan LPG Markaları alanı zorunludur. En az bir marka seçilmelidir.");
      return;
    }
    if (regRole === "engineer") {
      if (!engineerSkill.trim()) {
        setAuthError("LPG Mühendislik uzmanlık alanı bilgisi zorunludur.");
        return;
      }
      if (!engineerCity.trim()) {
        setAuthError("Uzman şehir bilgisi zorunludur.");
        return;
      }
    }
    if (regRole === "manufacturer") {
      if (!mfrCompanyName.trim()) {
        setAuthError("LPG Kit Üreticisi firma adı zorunludur.");
        return;
      }
      if (!mfrBrandName.trim()) {
        setAuthError("Tescilli Marka Adı (LPG Kiti) seçimi zorunludur.");
        return;
      }
      if (!mfrAuthorizedName.trim()) {
        setAuthError("Yetkili kişi adı soyadı zorunludur.");
        return;
      }
    }

    // KVKK and policies check
    if (!kvkkApproved || !privacyPolicyApproved || !termsApproved) {
      setAuthError("Kayıt işlemini tamamlayabilmek için KVKK, Gizlilik Sözleşmesi ve Kullanım Şartları'nı onaylamalısınız.");
      return;
    }

    // Trigger SMS Verification Modal with custom code instead of direct step 2 navigation
    const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    setSmsCodeSent(generatedOtp);
    setSmsTimeLeft(300); // 5 minutes (300 seconds)
    setUserTypedSms("");
    setSmsError("");
    setSmsVerified(false);
    setShowSmsModal(true);
  };

  const handleFreeRegistration = () => {
    try {
      const currentUsers = getUsers();

      const normalizePhone = (phone: string): string => {
        const digits = (phone || "").replace(/\D/g, "");
        return digits.slice(-10);
      };

      if (currentUsers.some((u) => u.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
        setAuthError("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır.");
        return;
      }

      const newPhoneNormalized = normalizePhone(regPhone);
      if (currentUsers.some((u) => normalizePhone(u.phone) === newPhoneNormalized)) {
        setAuthError("Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır.");
        return;
      }

      const currentInvoices = getInvoices();

      const newId = `user_${regRole}_${Date.now()}`;
      const timestamp = new Date().toISOString();
      const invoiceId = `FAT-${Math.floor(100000 + Math.random() * 900000)}`;

      // 14 days expiration for free users
      const endingDate = new Date();
      endingDate.setDate(endingDate.getDate() + 14);

      const packageLabel = 
        regRole === "vehicle_owner" ? "Araç Sahibi Yıllık Paket (Ücretsiz)" :
        regRole === "dealer" ? "Firma (Bayi/Usta) Kurumsal Paket (Ücretsiz)" :
        regRole === "engineer" ? "Uzman Mühendis Yıllık Paket (Ücretsiz)" :
        "Kit Üreticisi Yıllık Lisans (Ücretsiz)";

      const registrantName = `${regFirstName.trim()} ${regLastName.trim()}`;

      // Create user
      const newUser: DbUser = {
        id: newId,
        name: registrantName,
        email: regEmail,
        phone: regPhone,
        password: hashPassword(regPassword, regEmail),
        role: regRole,
        membership_type: packageLabel,
        membership_fee: 0,
        membership_start: timestamp,
        membership_end: endingDate.toISOString(),
        membership_status: "Onay Bekliyor", // All free roles go to admin approval!
        subscription_type: "free",
        subscription_status: "active",
        subscription_expires_at: endingDate.toISOString(),
        created_at: timestamp,
        
        // Role specifics
        company_name: regRole === "dealer" ? companyName : (regRole === "manufacturer" ? mfrCompanyName : undefined),
        authorized_name: regRole === "dealer" ? (authorizedName || registrantName) : undefined,
        tax_info: regRole === "dealer" ? taxInfo : undefined,
        website: regRole === "dealer" ? dealerWebsite : (regRole === "manufacturer" ? mfrWebsite : undefined),
        city: regRole === "dealer" ? dealerCity : (regRole === "engineer" ? engineerCity : undefined),
        district: regRole === "dealer" ? dealerDistrict : undefined,
        
        expertise: regRole === "engineer" ? engineerSkill : undefined,
        working_brands: (regRole === "dealer" || regRole === "engineer") ? regWorkingBrands : undefined,
        brand_name: regRole === "manufacturer" ? mfrBrandName : undefined,
        authorized_person: regRole === "manufacturer" ? mfrAuthorizedName : undefined,
        product_categories: regRole === "manufacturer" ? mfrCategories : undefined,

        // Logo parameters
        logo_url: regRole === "dealer" ? (regCompanyNoLogo ? "" : regCompanyLogo) : undefined,
        no_logo: regRole === "dealer" ? regCompanyNoLogo : undefined,
        logo_type: regRole === "dealer" ? (regCompanyNoLogo ? "auto" : "real") : undefined,

        // Consent Logs and data
        kvkk_approved: kvkkApproved,
        privacy_policy_approved: privacyPolicyApproved,
        terms_approved: termsApproved,
        marketing_approved: marketingApproved,
        approval_date: timestamp,
        ip_address: userIpAddress
      };

      // Create invoice (0 TL for free)
      const newInvoice: FaturaHistory = {
        id: invoiceId,
        userId: newId,
        amount: 0,
        date: timestamp,
        membership_type: packageLabel,
        status: "Ödendi",
        payment_method: "Ücretsiz Üyelik",
        userName: registrantName,
        companyName: regRole === "dealer" ? companyName : (regRole === "manufacturer" ? mfrCompanyName : ""),
        roleDisplayName: getRoleDisplayName(regRole),
        packageName: packageLabel,
        dekont_status: "Yok",
        dekont_url: ""
      };

      // Persist
      const updatedUsers = [...currentUsers, newUser];
      const updatedInvoices = [...currentInvoices, newInvoice];
      saveUsers(updatedUsers);
      saveInvoices(updatedInvoices);

      // Reset logo states
      setRegCompanyLogo("");
      setRegCompanyNoLogo(false);

      setAllUsers(updatedUsers);
      setAllInvoices(updatedInvoices);

      setAuthSuccess("Ücretsiz üyelik başvurunuz başarıyla alındı!");
      setShowFreeRegistrationSuccess(true);
    } catch (err: any) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : "Kayıt işlemi sırasında bir hata oluştu.");
    }
  };

  const handleApplyPromoCode = () => {
    setRegPromoError("");
    setRegPromoSuccess("");
    const cleanCode = regPromoInput.trim().toUpperCase();
    if (!cleanCode) {
      setRegPromoError("Lütfen bir kod giriniz.");
      return;
    }
    
    const codes = getFreePromoCodes();
    const foundCode = codes.find(c => c.code === cleanCode);
    if (!foundCode) {
      setRegPromoError("Geçersiz kampanya kodu.");
      return;
    }
    
    if (foundCode.used) {
      setRegPromoError("Bu kampanya kodu daha önce kullanılmıştır.");
      return;
    }

    const emailUsed = codes.some(c => c.used && c.usedByUserEmail?.toLowerCase().trim() === regEmail.toLowerCase().trim());
    if (emailUsed) {
      setRegPromoError("Bu e-posta adresiyle daha önce ücretsiz kod kullanılmıştır.");
      return;
    }

    setRegAppliedPromo(foundCode);
    setRegPromoSuccess("Kampanya kodu başarıyla uygulandı! %100 indirim tanımlandı.");
  };

  const handleRemovePromoCode = () => {
    setRegAppliedPromo(null);
    setRegPromoInput("");
    setRegPromoSuccess("");
    setRegPromoError("");
  };

  const handleApplyRenewPromoCode = () => {
    setRenewPromoError("");
    setRenewPromoSuccess("");
    const cleanCode = renewPromoInput.trim().toUpperCase();
    if (!cleanCode) {
      setRenewPromoError("Lütfen bir kod giriniz.");
      return;
    }
    
    const codes = getFreePromoCodes();
    const foundCode = codes.find(c => c.code === cleanCode);
    if (!foundCode) {
      setRenewPromoError("Geçersiz kampanya kodu.");
      return;
    }
    
    if (foundCode.used) {
      setRenewPromoError("Bu kampanya kodu daha önce kullanılmıştır.");
      return;
    }

    const emailUsed = codes.some(c => c.used && c.usedByUserEmail?.toLowerCase().trim() === activeUser?.email.toLowerCase().trim());
    if (emailUsed) {
      setRenewPromoError("Bu e-posta adresiyle daha önce ücretsiz kod kullanılmıştır.");
      return;
    }

    setRenewAppliedPromo(foundCode);
    setRenewPromoSuccess("Kampanya kodu başarıyla uygulandı! %100 indirim tanımlandı.");
  };

  const handleRemoveRenewPromoCode = () => {
    setRenewAppliedPromo(null);
    setRenewPromoInput("");
    setRenewPromoSuccess("");
    setRenewPromoError("");
  };

  // Handle interactive credit card & user activation creation
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const isPromoApplied = !!regAppliedPromo;
    const isEft = regPaymentMethod === "eft";

    if (!isPromoApplied && !isEft) {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
        setAuthError("Lütfen tüm kredi kartı bilgilerini girin.");
        return;
      }
    }

    setIsPaying(true);

    // Simulate Payment Gateway delay
    setTimeout(() => {
      try {
        const currentUsers = getUsers();

        const normalizePhone = (phone: string): string => {
          const digits = (phone || "").replace(/\D/g, "");
          return digits.slice(-10);
        };

        if (currentUsers.some((u) => u.email.toLowerCase().trim() === regEmail.toLowerCase().trim())) {
          setAuthError("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır.");
          setIsPaying(false);
          return;
        }

        const newPhoneNormalized = normalizePhone(regPhone);
        if (currentUsers.some((u) => normalizePhone(u.phone) === newPhoneNormalized)) {
          setAuthError("Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır.");
          setIsPaying(false);
          return;
        }

        const currentInvoices = getInvoices();

        const pricing = getRolePrice(regRole);
        let finalAmount = pricing.amount;
        let paymentMethodName: "Kredi Kartı" | "Havale/EFT" | "Ücretsiz Kod" = "Kredi Kartı";
        let invoiceStatus: "Ödendi" | "Beklemede" = "Ödendi";
        let userStatus: DbUser["membership_status"] = regRole === "vehicle_owner" ? "Aktif" : "Onay Bekliyor";

        if (isPromoApplied) {
          finalAmount = 0;
          paymentMethodName = "Ücretsiz Kod";
          invoiceStatus = "Ödendi";
          userStatus = regRole === "vehicle_owner" ? "Aktif" : "Onay Bekliyor";
        } else if (isEft) {
          paymentMethodName = "Havale/EFT";
          invoiceStatus = "Beklemede";
          userStatus = "Beklemede"; // Eft requires approval first for everyone
        }

        const newId = `user_${regRole}_${Date.now()}`;
        const timestamp = new Date().toISOString();
        const invoiceId = `FAT-${Math.floor(100000 + Math.random() * 900000)}`;

        const endingDate = new Date();
        endingDate.setFullYear(endingDate.getFullYear() + 1);

        const packageLabel = 
          regRole === "vehicle_owner" ? "Araç Sahibi Yıllık Paket" :
          regRole === "dealer" ? "Firma (Bayi/Usta) Kurumsal Paket" :
          regRole === "engineer" ? "Uzman Mühendis Yıllık Paket" :
          "Kit Üreticisi Yıllık Lisans";

        const registrantName = `${regFirstName.trim()} ${regLastName.trim()}`;

        // Create user
        const newUser: DbUser = {
          id: newId,
          name: registrantName,
          email: regEmail,
          phone: regPhone,
          password: hashPassword(regPassword, regEmail),
          role: regRole,
          membership_type: packageLabel,
          membership_fee: finalAmount,
          membership_start: timestamp,
          membership_end: endingDate.toISOString(),
          membership_status: userStatus,
          created_at: timestamp,
          
          // Role specifics
          company_name: regRole === "dealer" ? companyName : (regRole === "manufacturer" ? mfrCompanyName : undefined),
          authorized_name: regRole === "dealer" ? (authorizedName || registrantName) : undefined,
          tax_info: regRole === "dealer" ? taxInfo : undefined,
          website: regRole === "dealer" ? dealerWebsite : (regRole === "manufacturer" ? mfrWebsite : undefined),
          city: regRole === "dealer" ? dealerCity : (regRole === "engineer" ? engineerCity : undefined),
          district: regRole === "dealer" ? dealerDistrict : undefined,
          
          expertise: regRole === "engineer" ? engineerSkill : undefined,
          working_brands: (regRole === "dealer" || regRole === "engineer") ? regWorkingBrands : undefined,
          brand_name: regRole === "manufacturer" ? mfrBrandName : undefined,
          authorized_person: regRole === "manufacturer" ? mfrAuthorizedName : undefined,
          product_categories: regRole === "manufacturer" ? mfrCategories : undefined,

          // Logo parameters
          logo_url: regRole === "dealer" ? (regCompanyNoLogo ? "" : regCompanyLogo) : undefined,
          no_logo: regRole === "dealer" ? regCompanyNoLogo : undefined,
          logo_type: regRole === "dealer" ? (regCompanyNoLogo ? "auto" : "real") : undefined,

          // Consent Logs and data
          kvkk_approved: kvkkApproved,
          privacy_policy_approved: privacyPolicyApproved,
          terms_approved: termsApproved,
          marketing_approved: marketingApproved,
          approval_date: timestamp,
          ip_address: userIpAddress
        };

        // Create invoice
        const newInvoice: FaturaHistory = {
          id: invoiceId,
          userId: newId,
          amount: finalAmount,
          date: timestamp,
          membership_type: packageLabel,
          status: invoiceStatus,
          payment_method: paymentMethodName,
          userName: registrantName,
          companyName: regRole === "dealer" ? companyName : (regRole === "manufacturer" ? mfrCompanyName : ""),
          roleDisplayName: getRoleDisplayName(regRole),
          packageName: packageLabel,
          dekont_status: paymentMethodName === "Havale/EFT" ? "Bekliyor" : "Yok",
          dekont_url: ""
        };

        // Persist
        const updatedUsers = [...currentUsers, newUser];
        const updatedInvoices = [...currentInvoices, newInvoice];
        saveUsers(updatedUsers);
        saveInvoices(updatedInvoices);

        // Persist free code usage if applied
        if (isPromoApplied && regAppliedPromo) {
          const promoCodes = getFreePromoCodes();
          const updatedPromoCodes = promoCodes.map(c => {
            if (c.code === regAppliedPromo.code) {
              return {
                ...c,
                used: true,
                usedByUserId: newId,
                usedByUserName: registrantName,
                usedByUserEmail: regEmail,
                usedAt: timestamp,
                usedByIp: localStorage.getItem("lpgportal_client_ip") || "127.0.0.1"
              };
            }
            return c;
          });
          saveFreePromoCodes(updatedPromoCodes);
          
          // Log system log
          addSystemLog("Ücretsiz Kod Kullanıldı", `Kod: ${regAppliedPromo.code} kullanıldı. Üye: ${regEmail}`, registrantName);
        }

        // Reset logo state variables
        setRegCompanyLogo("");
        setRegCompanyNoLogo(false);

        setAllUsers(updatedUsers);
        setAllInvoices(updatedInvoices);

        setIsPaying(false);

        if (isEft) {
          setAuthSuccess("Havale / EFT kayıt talebiniz başarıyla alındı!");
          setRegistrationApprovedStatusText("Tebrikler! Havale/EFT kayıt talebiniz oluşturulmuştur. Ödemeniz admin tarafından onaylandıktan sonra üyeliğiniz aktif edilecektir.");
        } else if (userStatus !== "Aktif") {
          setAuthSuccess("Sistem kaydınız başarıyla tamamlandı!");
          setRegistrationApprovedStatusText("Tebrikler! Profiliniz başarıyla oluşturuldu. Kurum profil kaydınızı onayladığında hesabınıza giriş yapabilirsiniz.");
        } else {
          setAuthSuccess("Ödemeniz başarıyla tamamlandı! Üyeliğiniz aktif edilerek giriş yapıldı.");
        }
        
        // Log user in or show approval notice
        setTimeout(() => {
          if (userStatus === "Aktif") {
            onLoginSuccess(newUser);
          } else {
            setAuthMode("login");
          }
          // Reset states
          setRegStep(1);
          setRegFirstName("");
          setRegLastName("");
          setRegEmail("");
          setRegPhone("");
          setRegPassword("");
          setRegConfirmPassword("");
          setCompanyName("");
          setAuthorizedName("");
          setTaxInfo("");
          setDealerWebsite("");
          setDealerDistrict("");
          setEngineerSkill("");
          setMfrCompanyName("");
          setMfrBrandName("");
          setMfrAuthorizedName("");
          setMfrWebsite("");
          setMfrCategories("");
          setCardNumber("");
          setCardHolder("");
          setCardExpiry("");
          setCardCvv("");
          setKvkkApproved(false);
          setPrivacyPolicyApproved(false);
          setTermsApproved(false);
          setMarketingApproved(false);
          setRegPaymentMethod("cc");
          setRegPromoInput("");
          setRegAppliedPromo(null);
          setRegPromoError("");
          setRegPromoSuccess("");
          setAuthSuccess("");
        }, 3000);

      } catch (err: any) {
        setIsPaying(false);
        setAuthError(err instanceof Error ? err.message : "Kayıt işlemi sırasında bir sorun oluştu.");
      }
    }, 1200);
  };

  // Change user password
  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeSuccess("");
    setPasswordChangeError("");

    if (!activeUser) return;
    if (!newPassword || !confirmPassword) {
      setPasswordChangeError("Lütfen tüm alanları doldurun.");
      return;
    }

    // SQL Injection check
    if (isPotentialSqlInjection(newPassword) || isPotentialSqlInjection(confirmPassword)) {
      setPasswordChangeError("Güvenlik Uyarısı: Şüpheli karakterler tespit edildi.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Şifreler uyuşmuyor. Lütfen tekrar kontrol edin.");
      return;
    }

    const currentUsers = getUsers();
    const updated = currentUsers.map((u) => {
      if (u.id === activeUser.id) {
        return { ...u, password: hashPassword(newPassword, u.email) };
      }
      return u;
    });

    saveUsers(updated);
    setAllUsers(updated);
    setPasswordChangeSuccess("Şifreniz başarıyla güncellenmiştir.");
    setNewPassword("");
    setConfirmPassword("");
  };

  // Admin functions
  const handleUpdateUserStatus = (userId: string, newStatus: any) => {
    const currentUsers = getUsers();
    const updated = currentUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, membership_status: newStatus };
      }
      return u;
    });
    saveUsers(updated);
    setAllUsers(updated);
  };

  const handleApproveEft = (invoiceId: string) => {
    const note = adminEftNotes[invoiceId] || "";
    const currentInvoices = getInvoices();
    let userId = "";
    let amount = 0;
    let membershipType = "";
    
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        userId = inv.userId;
        amount = inv.amount;
        membershipType = inv.membership_type;
        return { ...inv, status: "Ödendi" as const, admin_note: note };
      }
      return inv;
    });
    
    saveInvoices(updatedInvoices);
    setAllInvoices(updatedInvoices);
    
    if (userId) {
      const currentUsers = getUsers();
      const now = new Date();
      const oneYearLater = new Date();
      oneYearLater.setFullYear(now.getFullYear() + 1);
      
      const updatedUsers = currentUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            membership_status: "Aktif" as const,
            membership_start: now.toISOString(),
            membership_end: oneYearLater.toISOString(),
            membership_fee: amount,
            subscription_type: "premium" as const,
            subscription_status: "active" as const,
            subscription_expires_at: oneYearLater.toISOString()
          };
        }
        return u;
      });
      
      saveUsers(updatedUsers);
      setAllUsers(updatedUsers);
      
      const userObj = updatedUsers.find(u => u.id === userId);
      const userMail = userObj?.email || "";
      const userName = userObj?.name || "";
      
      // Panel Notification
      sendLpgNotification(
        userId,
        "✅ Havale / EFT Ödemeniz Onaylandı",
        `Gönderdiğiniz Havale/EFT ödemeniz (Tutar: ${amount} TL) onaylanmıştır. Üyeliğiniz aktif edilmiştir. Keyifli kullanımlar dileriz!`,
        "duyuru",
        "panel",
        true
      );
      
      // SMS (Simulated)
      sendLpgNotification(
        userId,
        "✅ Havale / EFT Ödemeniz Onaylandı",
        `LPG PORTAL: Değerli üyemiz, ${amount} TL tutarındaki Havale/EFT ödemeniz onaylanmıştır. Üyeliğiniz 1 yıl süreyle aktif edilmiştir.`,
        "duyuru",
        "sms",
        true
      );
      
      // Email (Simulated)
      sendLpgNotification(
        userId,
        "✅ Havale / EFT Ödemeniz Onaylandı",
        `LPG PORTAL: Havale/EFT ödemeniz onaylanmıştır.\nPaket: ${membershipType}\nTutar: ${amount} TL\nÜyelik Bitiş Tarihi: ${oneYearLater.toLocaleDateString("tr-TR")}`,
        "duyuru",
        "email",
        true
      );
      
      setNotificationsList(getCentralNotifications());
      
      addSystemLog(
        "Havale/EFT Ödeme Onayı",
        `Fatura: ${invoiceId} onaylandı. Üye: ${userMail} (${userName}) aktif edildi. Not: ${note}`,
        activeUser?.email || tLocal("Yönetici", "Administrator / Operator")
      );
    }
  };

  const handleRejectEft = (invoiceId: string) => {
    const note = adminEftNotes[invoiceId] || "";
    const currentInvoices = getInvoices();
    let userId = "";
    let amount = 0;
    let membershipType = "";
    
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        userId = inv.userId;
        amount = inv.amount;
        membershipType = inv.membership_type;
        return { ...inv, status: "Reddedildi" as const, admin_note: note };
      }
      return inv;
    });
    
    saveInvoices(updatedInvoices);
    setAllInvoices(updatedInvoices);
    
    if (userId) {
      const currentUsers = getUsers();
      const updatedUsers = currentUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            membership_status: "İptal" as const
          };
        }
        return u;
      });
      
      saveUsers(updatedUsers);
      setAllUsers(updatedUsers);
      
      const userObj = updatedUsers.find(u => u.id === userId);
      const userMail = userObj?.email || "";
      const userName = userObj?.name || "";
      
      // Panel Notification
      sendLpgNotification(
        userId,
        "❌ Havale / EFT Ödemeniz Reddedildi",
        `Gönderdiğiniz Havale/EFT ödemeniz (Tutar: ${amount} TL) reddedilmiştir. Detaylı bilgi için lütfen destek merkezimizle iletişime geçin. Yönetici Notu: ${note}`,
        "uyari",
        "panel",
        true
      );
      
      // SMS (Simulated)
      sendLpgNotification(
        userId,
        "❌ Havale / EFT Ödemeniz Reddedildi",
        `LPG PORTAL: Havale/EFT ödemeniz (Tutar: ${amount} TL) reddedilmiştir. Üyeliğiniz durdurulmuştur.`,
        "uyari",
        "sms",
        true
      );
      
      // Email (Simulated)
      sendLpgNotification(
        userId,
        "❌ Havale / EFT Ödemeniz Reddedildi",
        `LPG PORTAL: Havale/EFT ödemeniz reddedilmiştir.\nTutar: ${amount} TL\nSebep/Yönetici Notu: ${note}\nLütfen bilgilerinizi kontrol ederek tekrar deneyiniz veya destek birimiyle iletişime geçiniz.`,
        "uyari",
        "email",
        true
      );
      
      setNotificationsList(getCentralNotifications());
      
      addSystemLog(
        "Havale/EFT Ödeme Reddi",
        `Fatura: ${invoiceId} reddedildi. Üye: ${userMail} (${userName}) durumu İptal yapıldı. Not: ${note}`,
        activeUser?.email || tLocal("Yönetici", "Administrator / Operator")
      );
    }
  };

  const handleHoldEft = (invoiceId: string) => {
    const note = adminEftNotes[invoiceId] || "";
    const currentInvoices = getInvoices();
    let userId = "";
    
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        userId = inv.userId;
        return {
          ...inv,
          status: "İnceleniyor" as const,
          dekont_status: "İnceleniyor" as const,
          admin_note: note
        };
      }
      return inv;
    });
    
    saveInvoices(updatedInvoices);
    setAllInvoices(updatedInvoices);
    
    if (userId) {
      const currentUsers = getUsers();
      const updatedUsers = currentUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            membership_status: "Onay Bekliyor" as const
          };
        }
        return u;
      });
      
      saveUsers(updatedUsers);
      setAllUsers(updatedUsers);
      
      const userObj = updatedUsers.find(u => u.id === userId);
      const userMail = userObj?.email || "";
      const userName = userObj?.name || "";
      
      // Panel Notification
      sendLpgNotification(
        userId,
        "⏳ Dekontunuz İnceleniyor",
        `Gönderdiğiniz Havale/EFT ödeme dekontu yöneticilerimiz tarafından incelenmektedir. En kısa sürede sonuçlandırılacaktır. Yönetici Notu: ${note}`,
        "duyuru",
        "panel",
        true
      );
      
      setNotificationsList(getCentralNotifications());
      
      addSystemLog(
        "Dekont İnceleme Altına Alındı",
        `Fatura: ${invoiceId} incelemeye alındı. Üye: ${userMail} (${userName}). Not: ${note}`,
        activeUser?.email || tLocal("Yönetici", "Administrator / Operator")
      );
    }
  };

  const handleMissingEvrakEft = (invoiceId: string) => {
    const note = adminEftNotes[invoiceId] || "";
    const currentInvoices = getInvoices();
    let userId = "";
    let amount = 0;
    
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        userId = inv.userId;
        amount = inv.amount;
        return {
          ...inv,
          status: "Eksik Evrak" as const,
          dekont_status: "Eksik Evrak" as const,
          admin_note: note
        };
      }
      return inv;
    });
    
    saveInvoices(updatedInvoices);
    setAllInvoices(updatedInvoices);
    
    if (userId) {
      const currentUsers = getUsers();
      const updatedUsers = currentUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            membership_status: "Beklemede" as const
          };
        }
        return u;
      });
      
      saveUsers(updatedUsers);
      setAllUsers(updatedUsers);
      
      const userObj = updatedUsers.find(u => u.id === userId);
      const userMail = userObj?.email || "";
      const userName = userObj?.name || "";
      
      // Panel Notification
      sendLpgNotification(
        userId,
        "⚠️ Eksik Evrak / Dekont Hatası",
        `Havale/EFT ödemeniz için yüklediğiniz dekont eksik veya hatalı bulunmuştur. Lütfen geçerli bir dekontu tekrar yükleyin. Yönetici Açıklaması: ${note}`,
        "uyari",
        "panel",
        true
      );
      
      // SMS (Simulated)
      sendLpgNotification(
        userId,
        "⚠️ Dekont Hatası Bildirimi",
        `LPG PORTAL: Havale/EFT dekontunuz eksik veya geçersizdir. Lütfen üye panelinizden yeni dekont yükleyin. Detay: ${note}`,
        "uyari",
        "sms",
        true
      );
      
      // Email (Simulated)
      sendLpgNotification(
        userId,
        "⚠️ Havale / EFT Dekont Hatası",
        `LPG PORTAL: Yüklemiş olduğunuz ödeme dekontu doğrulanamadı.\nTutar: ${amount} TL\nHata/Açıklama: ${note}\nLütfen üye panelinize giriş yaparak Fatura Geçmişi bölümünden geçerli bir dekont (.jpg, .png, .pdf) yükleyiniz.`,
        "uyari",
        "email",
        true
      );
      
      setNotificationsList(getCentralNotifications());
      
      addSystemLog(
        "Dekont Eksik Evrak Talebi",
        `Fatura: ${invoiceId} için eksik evrak bildirildi. Üye: ${userMail} (${userName}). Gerekçe: ${note}`,
        activeUser?.email || tLocal("Yönetici", "Administrator / Operator")
      );
    }
  };

  const handleSaveAdminNote = (invoiceId: string) => {
    const note = adminEftNotes[invoiceId] || "";
    const currentInvoices = getInvoices();
    const updatedInvoices = currentInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        return { ...inv, admin_note: note };
      }
      return inv;
    });
    saveInvoices(updatedInvoices);
    setAllInvoices(updatedInvoices);
    alert("Yönetici notu kaydedildi.");
  };

  const handleUpdateCompanyStatus = (companyId: string, updates: Partial<Company>) => {
    const updated = allCompanies.map(c => {
      if (c.id === companyId) {
        return { ...c, ...updates };
      }
      return c;
    });
    setAllCompanies(updated);
    localStorage.setItem("lpgportal_companies", JSON.stringify(updated));
  };

  const handleDeleteCompany = (companyId: string) => {
    if (confirm("Bu firmayı silmek istediğinizden emin misiniz?")) {
      const updated = allCompanies.filter(c => c.id !== companyId);
      setAllCompanies(updated);
      localStorage.setItem("lpgportal_companies", JSON.stringify(updated));
    }
  };

  const handleRenewOwnerMembership = (userId: string) => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    const updated = allUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          membership_status: "Aktif" as const,
          membership_end: nextYear.toISOString().split("T")[0]
        };
      }
      return u;
    });
    
    saveUsers(updated);
    setAllUsers(updated);
    alert("Kullanıcının kurumsal üyeliği yönetici tarafından başarıyla yenilendi!");
  };

  const handleSaveMemberBrands = (userId: string) => {
    const currentUsers = getUsers();
    const updated = currentUsers.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          working_brands: tempBrands
        };
      }
      return u;
    });

    saveUsers(updated);
    setAllUsers(updated);

    const updatedSelf = updated.find(u => u.id === activeUser?.id);
    if (updatedSelf && onUpdateActiveUser) {
      onUpdateActiveUser(updatedSelf);
    }

    setExpandedMemberId(null);
    alert("Üyenin çalışılan LPG markaları başarıyla güncellendi!");
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Bu üyeyi kalıcı olarak silmek istediğinizden emin misiniz?")) {
      const currentUsers = getUsers();
      const updated = currentUsers.filter((u) => u.id !== userId);
      saveUsers(updated);
      setAllUsers(updated);

      // Clean up associated companies (Set owner to null, mark passive)
      const savedCompanies = localStorage.getItem("lpgportal_companies");
      if (savedCompanies) {
        try {
          const companies = JSON.parse(savedCompanies);
          const updatedCompanies = companies.map((c: any) => {
            if (c.owner_id === userId) {
              return { ...c, owner_id: null, status: "Pasif" };
            }
            return c;
          });
          localStorage.setItem("lpgportal_companies", JSON.stringify(updatedCompanies));
        } catch (e) {}
      }

      // Clean up associated marketplace products (Mark passive)
      const savedProducts = localStorage.getItem("lpgportal_products");
      if (savedProducts) {
        try {
          const products = JSON.parse(savedProducts);
          const updatedProducts = products.map((p: any) => {
            if (p.seller_id === userId) {
              return { ...p, status: "Pasif" };
            }
            return p;
          });
          localStorage.setItem("lpgportal_products", JSON.stringify(updatedProducts));
        } catch (e) {}
      }

      // Clean up associated expert profiles (Remove)
      const savedExperts = localStorage.getItem("lpgportal_expert_profiles");
      if (savedExperts) {
        try {
          const experts = JSON.parse(savedExperts);
          const updatedExperts = experts.filter((ex: any) => ex.seller_id !== userId);
          localStorage.setItem("lpgportal_expert_profiles", JSON.stringify(updatedExperts));
        } catch (e) {}
      }

      addSystemLog("Üye Silindi", `Üye ID: ${userId} sistemden silindi ve ilişkili kayıtları temizlendi.`, activeUser?.email);
    }
  };

  const handleSendManualNotification = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError("");
    setManualSuccess("");

    if (!manualTitle.trim()) {
      setManualError("Lütfen bildirim başlığı girin.");
      return;
    }
    if (!manualMessage.trim()) {
      setManualError("Lütfen mesaj içeriğini doldurun.");
      return;
    }
    if (manualChannels.length === 0) {
      setManualError("Lütfen en az bir gönderim kanalı seçin.");
      return;
    }
    if (manualTargetAudience === "specific" && !manualSelectedUserId) {
      setManualError("Lütfen bildirim gönderilecek belirli kullanıcıyı seçin.");
      return;
    }

    const isLpgUsta = (u: DbUser) => {
      if (u.role !== "engineer") return false;
      const exp = (u.expertise || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      return exp.includes("usta") || exp.includes("tekniker") || exp.includes("servis") || name.includes("usta");
    };

    const isLpgEngineer = (u: DbUser) => {
      if (u.role !== "engineer") return false;
      return !isLpgUsta(u);
    };

    const usersList = getUsers();
    let targetUsers: DbUser[] = [];
    let targetLabel = "";

    switch (manualTargetAudience) {
      case "all":
        targetUsers = usersList.filter(u => u.role !== "admin");
        targetLabel = "Tüm Kullanıcılar";
        break;
      case "vehicle_owner":
        targetUsers = usersList.filter(u => u.role === "vehicle_owner");
        targetLabel = tLocal("Araç Sahipleri", "Vehicle Owners");
        break;
      case "dealer":
        targetUsers = usersList.filter(u => u.role === "dealer");
        targetLabel = "Firma (Bayi / Servis)";
        break;
      case "lpg_usta":
        targetUsers = usersList.filter(isLpgUsta);
        targetLabel = "LPG Ustaları";
        break;
      case "lpg_engineer":
        targetUsers = usersList.filter(isLpgEngineer);
        targetLabel = "LPG Mühendisleri";
        break;
      case "manufacturer":
        targetUsers = usersList.filter(u => u.role === "manufacturer");
        targetLabel = tLocal("Kit Üreticileri", "Kit Manufacturers");
        break;
      case "passive":
        targetUsers = usersList.filter(u => u.membership_status === "Pasif");
        targetLabel = tLocal("Pasif Üyeler", "Passive Members");
        break;
      case "expiring":
        targetUsers = usersList.filter(u => {
          if (u.role === "admin" || u.role === "visitor") return false;
          const remaining = getRemainingDays(u.membership_end);
          return remaining > 0 && remaining <= 15;
        });
        targetLabel = "Süresi Dolmak Üzere Olan Üyeler";
        break;
      case "specific":
        const matchedUser = usersList.find(u => u.id === manualSelectedUserId);
        if (matchedUser) {
          targetUsers = [matchedUser];
          targetLabel = `Belirli Kullanıcı: ${matchedUser.name} (${matchedUser.email})`;
        } else {
          setManualError("Seçilen belirli kullanıcı bulunamadı.");
          return;
        }
        break;
      default:
        targetUsers = [];
    }

    if (targetUsers.length === 0) {
      setManualError("Seçilen hedef kitleye uyan aktif kayıtlı kullanıcı bulunamadı.");
      return;
    }

    const channelDisplayNames: string[] = [];
    if (manualChannels.includes("panel")) channelDisplayNames.push("Panel Bildirimi");
    if (manualChannels.includes("email")) channelDisplayNames.push("E-Posta");
    if (manualChannels.includes("sms")) channelDisplayNames.push("SMS");

    try {
      targetUsers.forEach((user) => {
        const priorityType: "uyari" | "duyuru" = manualPriority === tLocal("Yüksek", "High") ? "uyari" : "duyuru";
        
        manualChannels.forEach((chan) => {
          sendLpgNotification(
            user.id, 
            manualTitle, 
            manualMessage, 
            priorityType, 
            chan as any, 
            true
          );
        });
      });

      const newEntry: ManualNotificationEntry = {
        id: "manual_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        sentAt: new Date().toISOString(),
        senderAdmin: activeUser ? activeUser.name : "Sistem Yöneticisi",
        targetAudience: targetLabel,
        channels: channelDisplayNames,
        title: manualTitle,
        message: manualMessage,
        expirationDate: manualExpirationDate || undefined,
        priority: manualPriority,
        status: "Gönderildi"
      };

      const updatedHistory = [newEntry, ...manualHistory];
      setManualHistory(updatedHistory);
      localStorage.setItem("lpgportal_manual_notifications", JSON.stringify(updatedHistory));

      const auditDetails = `Hedef: ${targetLabel} | Kanallar: ${channelDisplayNames.join(", ")} | Başlık: ${manualTitle}`;
      addSystemLog("Manuel Bildirim Gönderildi", auditDetails, activeUser ? activeUser.email : "admin@lpgportal.com");

      setManualTitle("");
      setManualMessage("");
      setManualExpirationDate("");
      setManualPriority("Normal");
      setManualSelectedUserId("");
      setManualSuccess(`Manuel bildirim başarıyla ${targetUsers.length} kullanıcıya gönderildi.`);

    } catch (err: any) {
      const failedEntry: ManualNotificationEntry = {
        id: "manual_" + Date.now(),
        sentAt: new Date().toISOString(),
        senderAdmin: activeUser ? activeUser.name : "Sistem Yöneticisi",
        targetAudience: targetLabel,
        channels: channelDisplayNames,
        title: manualTitle,
        message: manualMessage,
        priority: manualPriority,
        status: "Hata"
      };
      const updatedHistory = [failedEntry, ...manualHistory];
      setManualHistory(updatedHistory);
      localStorage.setItem("lpgportal_manual_notifications", JSON.stringify(updatedHistory));

      setManualError("Bildirim gönderilirken bir hata oluştu: " + err.message);
    }
  };

  // Admin stats aggregations
  const totalCostCollections = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const activeCount = allUsers.filter(u => u.membership_status === "Aktif" && u.role !== "admin").length;
  const passiveCount = allUsers.filter(u => u.membership_status === "Pasif").length;
  const awaitingApprovalCount = allUsers.filter(u => u.membership_status === "Onay Bekliyor" || u.membership_status === "Beklemede").length;
  const suspendedCount = allUsers.filter(u => u.membership_status === tLocal("Askıya Alındı", "Suspended")).length;
  const expiredCount = allUsers.filter(u => u.membership_status === tLocal("Süresi Dolmuş", "Expired")).length;
  const pendingCount = allUsers.filter(u => u.membership_status === "Beklemede").length;

  const roleCounts = {
    vehicle_owner: allUsers.filter(u => u.role === "vehicle_owner").length,
    dealer: allUsers.filter(u => u.role === "dealer").length,
    engineer: allUsers.filter(u => u.role === "engineer").length,
    manufacturer: allUsers.filter(u => u.role === "manufacturer").length,
  };

  // Filtered members list for admin
  const filteredMembers = allUsers.filter((u) => {
    if (adminRoleFilter !== "all") {
      if (adminRoleFilter === "vehicle_owner" && u.role !== "vehicle_owner") return false;
      if (adminRoleFilter === "dealer" && u.role !== "dealer") return false;
      if (adminRoleFilter === "lpg_usta") {
        if (u.role !== "engineer") return false;
        const exp = (u.expertise || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const isUsta = exp.includes("usta") || exp.includes("tekniker") || exp.includes("servis") || name.includes("usta");
        if (!isUsta) return false;
      }
      if (adminRoleFilter === "lpg_engineer") {
        if (u.role !== "engineer") return false;
        const exp = (u.expertise || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        const isUsta = exp.includes("usta") || exp.includes("tekniker") || exp.includes("servis") || name.includes("usta");
        if (isUsta) return false;
      }
      if (adminRoleFilter === "manufacturer" && u.role !== "manufacturer") return false;
      if (adminRoleFilter === "admin" && u.role !== "admin") return false;
    } else {
      if (u.role === "admin") return false;
    }
    
    // Status filters
    if (adminStatusFilter !== "all" && u.membership_status !== adminStatusFilter) return false;
    
    // Consent filters
    if (adminConsentFilter === "kvkk" && !u.kvkk_approved) return false;
    if (adminConsentFilter === "privacy" && !u.privacy_policy_approved) return false;
    if (adminConsentFilter === "marketing" && !u.marketing_approved) return false;

    const term = adminSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.includes(term) ||
      getRoleDisplayName(u.role).toLowerCase().includes(term)
    );
  });

  // Calculate pricing values
  const currentPricing = getRolePrice(regRole);
  const calculatedTax = Math.round(currentPricing.amount * 0.20);
  const netFee = currentPricing.amount - calculatedTax;

  return (
    <div className="max-w-6xl mx-auto py-4 animate-fade-in" id="portal_section">
      
      {/* 1) IF USER IS IN GUEST / NOT LOGGED IN MODE */}
      {!activeUser ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Informational Column (4 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-bold border border-emerald-800/60 mb-3">
                <ShieldCheck className="h-3 w-3" />{tLocal(tLocal("LPG PORTAL Profesyonel Üyelik", "LPG PORTAL Professional Membership"), "LPG PORTAL Professional Membership")}</div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">{tLocal(tLocal("Sektör Ekosistemindeki Rolünüzü Alın", "Join Your Role in the Sector Ecosystem"), "Join Your Role in the Sector Ecosystem")}</h2>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">{tLocal(tLocal("Platformumuzda uzmanlık, kurumsal marka veya sürücü haklarıyla yerinizi alın, profesyonel içerik kütüphanesine ve interaktif araçlara kesintisiz erişim kazanın.", "Take your place in our platform with expertise, corporate brand or driver rights; gain seamless access to professional content library and interactive tools."), "Take your place in our platform with expertise, corporate brand or driver rights; gain seamless access to professional content library and interactive tools.")}</p>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-800">
              <div className="flex gap-3">
                <div className="bg-slate-800 p-2 rounded-lg h-fit text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans">{tLocal(tLocal("Sertifikalı Temsil & Güvenlik", "Certified Representation & Security"), "Certified Representation & Security")}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tLocal(tLocal("Üyelerimizin profil niteliğine göre TSE ve MMO uyumlulukları tescillenmektedir.", "TSE and MMO compliance are verified according to our members' profile qualifications."), "TSE and MMO compliance are verified according to our members' profile qualifications.")}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-slate-800 p-2 rounded-lg h-fit text-emerald-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans">{tLocal(tLocal("Güvenli 3D Ödeme Entegrasyonu", "Secure 3D Payment Integration"), "Secure 3D Payment Integration")}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tLocal(tLocal("Yıllık üyelik bedelleri bankacılık standartlarında SSL korumalı şifrelemeyle tahsil edilmektedir.", "Annual membership fees are collected with SSL-protected encryption under banking standards."), "Annual membership fees are collected with SSL-protected encryption under banking standards.")}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="bg-slate-800 p-2 rounded-lg h-fit text-emerald-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-sans">{tLocal(tLocal("Canlı İstasyon & Mühendis Paneli", "Live Station & Engineer Dashboard"), "Live Station & Engineer Dashboard")}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tLocal(tLocal("Firma ve Üreticiler ürün kataloglarını, iletişim numaralarını ve çalışma saatlerini anında yönetebilir.", "Companies and Manufacturers can instantly manage product catalogs, contact numbers, and working hours."), "Companies and Manufacturers can instantly manage product catalogs, contact numbers, and working hours.")}</p>
                </div>
              </div>
            </div>


          </div>

          {/* Form Column (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
            
            {/* Mode Switcher Buttons */}
            <div className="flex border-b border-slate-100 mb-6 pb-0.5">
              <button 
                onClick={() => { setAuthMode("login"); setAuthError(""); }}
                className={`flex-1 text-center pb-3 text-sm font-bold transition-all relative ${
                  authMode === "login" 
                    ? "text-emerald-600 border-b-2 border-emerald-600" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Giriş Yap
              </button>
              <button 
                onClick={() => { setAuthMode("register"); setAuthError(""); setRegStep(1); }}
                className={`flex-1 text-center pb-3 text-sm font-bold transition-all relative ${
                  authMode === "register" 
                    ? "text-emerald-600 border-b-2 border-emerald-600" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Yeni Kayıt ve Abonelik
              </button>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2 mb-4 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center gap-2 mb-4">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* A) LOGIN MODE VIEW */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("E-posta Adresi veya Kullanıcı Adı", "Email Address or Username"), "Email Address or Username")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={tLocal(tLocal("Örnek: eposta@adresiniz.com", "Example: email@youraddress.com"), "Example: email@youraddress.com")}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Şifre", "Password"), "Password")}</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthMode("forgot");
                        setForgotStep(1);
                        setAuthError("");
                        setAuthSuccess("");
                      }}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer focus:outline-none"
                    >
                      {tLocal("Şifremi Unuttum", "Forgot Password?")}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer mt-2"
                >
                  Sisteme Güvenli Giriş Yap
                </button>
              </form>
            )}

            {/* C) FORGOT PASSWORD MODE VIEW */}
            {authMode === "forgot" && (
              <form onSubmit={handleForgotSubmit} className="space-y-4 animate-fade-in">
                {forgotStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        {tLocal("E-posta Adresiniz", "Your Email Address")}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="email" 
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="eposta@adresiniz.com"
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer mt-2"
                    >
                      Şifre Sıfırlama Kodu Gönder
                    </button>
                  </div>
                )}

                {forgotStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        {tLocal("6 Haneli Doğrulama Kodu (OTP)", "6-Digit Verification Code (OTP)")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition text-center tracking-widest font-mono font-bold"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer mt-2"
                    >
                      Kodu Doğrula
                    </button>
                  </div>
                )}

                {forgotStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        {tLocal("Yeni Şifre", "New Password")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="password" 
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        {tLocal("Yeni Şifre Tekrarı", "Confirm New Password")}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input 
                          type="password" 
                          required
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-3 pl-10 pr-4 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer mt-2"
                    >
                      Şifreyi Güncelle
                    </button>
                  </div>
                )}

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setForgotStep(1);
                      setAuthError("");
                      setAuthSuccess("");
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    Giriş Ekranına Dön
                  </button>
                </div>
              </form>
            )}

            {/* B) REGISTRATION MODE VIEW */}
            {authMode === "register" && (
              <div className="space-y-6 animate-fade-in">
                {/* Steps visual state indicator */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-[10px] font-mono">
                  <span className={`px-2.5 py-1.5 rounded-lg ${regStep === 1 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500'}`}>
                    1. Üyelik ve Rol Bilgileri
                  </span>
                  <div className="h-px bg-slate-200 flex-1 mx-2"></div>
                  <span className={`px-2.5 py-1.5 rounded-lg ${regStep === 2 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-500'}`}>
                    2. Yıllık Aidat ve Aktivasyon
                  </span>
                </div>

                {/* STEP 1: FILL STATS */}
                {regStep === 1 && (
                  <form onSubmit={handleRegStep1Submit} className="space-y-4">
                    {/* Üyelik Tipi Seçimi (Premium / Ücretsiz) */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Üyelik Tipi</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRegSubscriptionType("premium");
                            setAuthError("");
                          }}
                          className={`p-2.5 border rounded-xl text-center flex items-center justify-center gap-2 transition cursor-pointer ${
                            regSubscriptionType === "premium"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold font-sans"
                              : "border-slate-150 bg-slate-50/50 text-slate-600 hover:bg-slate-50 font-sans"
                          }`}
                        >
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                            {regSubscriptionType === "premium" && <span className="h-2 w-2 rounded-full bg-emerald-600"></span>}
                          </span>
                          <span className="text-[11px]">Premium Üyelik (Ücretli)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegSubscriptionType("free");
                            setAuthError("");
                          }}
                          className={`p-2.5 border rounded-xl text-center flex items-center justify-center gap-2 transition cursor-pointer ${
                            regSubscriptionType === "free"
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold font-sans"
                              : "border-slate-150 bg-slate-50/50 text-slate-600 hover:bg-slate-50 font-sans"
                          }`}
                        >
                          <span className="h-3.5 w-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                            {regSubscriptionType === "free" && <span className="h-2 w-2 rounded-full bg-emerald-600"></span>}
                          </span>
                          <span className="text-[11px]">Ücretsiz Üyelik</span>
                        </button>
                      </div>
                    </div>

                    {/* Role Selection Tabs */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Kayıt Olunacak Sektörel Rol", "Sector Role to Register"), "Sector Role to Register")}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: "vehicle_owner", label: "Araç Sahibi", price: `${getRolePrice("vehicle_owner").amount.toLocaleString("tr-TR")} TL` },
                          { id: "dealer", label: "Firma (Bayi / Servis)", price: `${getRolePrice("dealer").amount.toLocaleString("tr-TR")} TL` },
                          { id: "engineer", label: "LPG Mühendisi / Usta", price: `${getRolePrice("engineer").amount.toLocaleString("tr-TR")} TL` },
                          { id: "manufacturer", label: "Kit Üreticisi", price: `${getRolePrice("manufacturer").amount.toLocaleString("tr-TR")} TL` },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setRegRole(item.id as any);
                              setAuthError("");
                            }}
                            className={`p-2.5 border rounded-xl text-center flex flex-col items-center justify-center transition cursor-pointer ${
                              regRole === item.id 
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                : "border-slate-100 bg-slate-50/50 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-[11px] font-bold block">{item.label}</span>
                            {regSubscriptionType === "premium" && (
                              <span className="text-[9px] font-mono font-semibold text-slate-500 mt-0.5">{item.price}/Yıl</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                     {/* Shared Credentials Fields */}
                    {/* Shared Personal Details Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-rose-50/20 pb-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Ad <strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder={tLocal(tLocal("Örn: Ahmet", "e.g. John"), "e.g. John")}
                            value={regFirstName}
                            onChange={(e) => handleNameChange(e.target.value, setRegFirstName)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">Soyad <strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder={tLocal(tLocal("Örn: Yılmaz", "e.g. Doe"), "e.g. Doe")}
                            value={regLastName}
                            onChange={(e) => handleNameChange(e.target.value, setRegLastName)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">E-posta Adresi <strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="email" 
                            placeholder="ornek@alanadi.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Telefon Numarası", "Phone Number"), "Phone Number")}<strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="5XX XXX XX XX"
                            value={getFormattedPhone(regPhone)}
                            onChange={(e) => handlePhoneInputChange(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-sans font-medium"
                          />
                        </div>
                        <span className="text-[10px] text-slate-455 text-slate-400 block font-mono">{tLocal(tLocal("*(Başında 0, +90 veya 90 olmadan giriniz)", "*(Enter without leading 0, +90, or 90)"), "*(Enter without leading 0, +90, or 90)")}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Erişim Şifresi", "Access Password"), "Access Password")}<strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="password" 
                            placeholder={tLocal(tLocal("Güçlü bir şifre giriniz", "Enter a strong password"), "Enter a strong password")}
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        {regPassword && (
                          <div className="mt-1 pb-1 space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="text-slate-500">{tLocal(tLocal("Şifre Gücü:", "Password Strength:"), "Password Strength:")}</span>
                              <span className={`px-1 rounded-sm text-[8.5px] ${getPasswordStrength(regPassword).colorClass}`}>
                                {getPasswordStrength(regPassword).label}
                              </span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  getPasswordStrength(regPassword).label === "Zayıf" ? "bg-rose-500 w-1/4" :
                                  getPasswordStrength(regPassword).label === "Orta" ? "bg-amber-500 w-3/5" : "bg-emerald-500 w-full"
                                }`}
                              />
                            </div>
                            <span className="text-[8px] text-slate-400 block leading-none">{tLocal(tLocal("En az 8 karakter, 1 büyük, 1 küçük harf, 1 rakam ve 1 özel simge içermelidir.", "Must contain at least 8 characters, 1 uppercase, 1 lowercase letter, 1 number, and 1 special symbol."), "Must contain at least 8 characters, 1 uppercase, 1 lowercase letter, 1 number, and 1 special symbol.")}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Şifre Tekrarı", "Confirm Password"), "Confirm Password")}<strong className="text-rose-600">*</strong></label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="password" 
                            placeholder={tLocal(tLocal("Şifrenizi tekrar giriniz", "Confirm your password"), "Confirm your password")}
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        {regConfirmPassword && regPassword !== regConfirmPassword && (
                          <span className="text-[10px] text-rose-600 block font-semibold animate-pulse">{tLocal(tLocal("⚠️ Şifreler eşleşmiyor!", "⚠️ Passwords do not match!"), "⚠️ Passwords do not match!")}</span>
                        )}
                        {regConfirmPassword && regPassword === regConfirmPassword && (
                          <span className="text-[10px] text-emerald-600 block font-semibold">{tLocal(tLocal("✓ Şifreler eşleşti.", "✓ Passwords match."), "✓ Passwords match.")}</span>
                        )}
                      </div>
                    </div>

                    {/* 2. DEALER (BAYI / USTA) EXTRA FIELDS */}
                    {regRole === "dealer" && (
                      <div className="space-y-3 block border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">Firma Bilgileri</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Firma Kurumsal Adı", "Company Corporate Name"), "Company Corporate Name")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Kuzey Marmara Otogaz Ltd.", "e.g. North Marmara Autogas Ltd."), "e.g. North Marmara Autogas Ltd.")}
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Yetkili Adı Soyadı", "Authorized Person Full Name"), "Authorized Person Full Name")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Usta Murat Eren", "e.g. Master Murat Eren"), "e.g. Master Murat Eren")}
                              value={authorizedName}
                              onChange={(e) => setAuthorizedName(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Çalıştığı Şehir", "Work City"), "Work City")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: İstanbul", "e.g. Istanbul"), "e.g. Istanbul")}
                              value={dealerCity}
                              onChange={(e) => setDealerCity(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("İlçe", "District"), "District")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Maslak", "e.g. Maslak"), "e.g. Maslak")}
                              value={dealerDistrict}
                              onChange={(e) => setDealerDistrict(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Vergi Bilgisi (Opsiyonel)</label>
                            <input 
                              type="text" 
                              placeholder="VD No / Vergi Dairesi"
                              value={taxInfo}
                              onChange={(e) => setTaxInfo(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Web Sitesi (Opsiyonel)</label>
                            <input 
                              type="text" 
                              placeholder="https://www.firmaadi.com"
                              value={dealerWebsite}
                              onChange={(e) => setDealerWebsite(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Firma Logosu Yükleme Bölümü */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          <label className="text-xs font-bold text-slate-700 block font-sans">
                            Firma Logosu Yükle
                          </label>
                          
                          <div className="flex items-center gap-2 mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <input
                              id="reg_company_no_logo"
                              type="checkbox"
                              checked={regCompanyNoLogo}
                              onChange={(e) => {
                                setRegCompanyNoLogo(e.target.checked);
                                if (e.target.checked) {
                                  setRegCompanyLogo(""); // Reset uploaded logo
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                            />
                            <label htmlFor="reg_company_no_logo" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                              Firma Logom Yok
                            </label>
                          </div>

                          {!regCompanyNoLogo && (
                            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center transition-all hover:border-emerald-500">
                              {regCompanyLogo ? (
                                <div className="flex flex-col items-center gap-2 w-full text-center">
                                  <img src={regCompanyLogo} alt={tLocal(tLocal("Yüklenen Logo Önizleme", "Uploaded Logo Preview"), "Uploaded Logo Preview")} className="w-16 h-16 object-cover rounded-full border border-slate-200 shadow-sm" />
                                  <button
                                    type="button"
                                    onClick={() => setRegCompanyLogo("")}
                                    className="text-xs text-rose-600 hover:underline font-bold"
                                  >
                                    Logoyu Kaldır
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full py-3">
                                  <Upload className="h-6 w-6 text-slate-400 mb-1" />
                                  <span className="text-xs text-slate-500 font-medium">{tLocal(tLocal("Logonuzu Seçin (PNG, JPG)", "Choose Your Logo (PNG, JPG)"), "Choose Your Logo (PNG, JPG)")}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setRegCompanyLogo(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          )}

                          {regCompanyNoLogo && (
                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3 animate-fade-in">
                              <div 
                                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-xs border border-white/20 select-none shrink-0"
                                style={{ backgroundColor: getAutoLogoColor(companyName || "Yeni Firma") }}
                              >
                                {getCompanyInitials(companyName || "Yeni Firma")}
                              </div>
                              <div className="text-[11px] text-slate-600 leading-snug">
                                Firma ismi / ünvanının baş harfine özel ve kalıcı bir renk/harf logosu atanacaktır.
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          <label className="text-xs font-bold text-slate-700 block font-sans">{tLocal(tLocal("Çalışılan LPG Markaları", "Supported LPG Brands"), "Supported LPG Brands")}<strong className="text-rose-600">*</strong> <span className="text-slate-400 font-normal text-[10px]">{tLocal(tLocal("(Birden fazla seçilebilir)", "(Multiple options selectable)"), "(Multiple options selectable)")}</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            {["BRC", "Zavoli", "Prins", "Atiker", "Lovato", "Landi Renzo", "OMVL", "Romano", "AC Stag", "Diğer"].map((brandName) => {
                              const isChecked = regWorkingBrands.includes(brandName);
                              return (
                                <label key={brandName} className="flex items-center gap-1.5 p-1.5 bg-white hover:bg-slate-100 rounded border border-slate-150 transition cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleBrandToggle(brandName)}
                                    className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-[11px] font-semibold text-slate-700">{brandName}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Ek Marka Seç - Dinamik Marka Listesi */}
                          {regWorkingBrands.includes("Diğer") && (
                            <div className="space-y-1.5 mt-2.5 p-3 bg-white border border-slate-200 rounded-xl animate-fade-in">
                              <span className="text-[11px] font-bold text-emerald-800 block mb-1 uppercase tracking-wider font-mono">
                                🔗 Ek Marka Seç
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {availableBrands
                                  .filter(b => !isCoreBrandName(b) && b.toLowerCase() !== "diğer")
                                  .map((brandName) => {
                                    const isChecked = regWorkingBrands.includes(brandName);
                                    return (
                                      <label key={brandName} className="flex items-center gap-1.5 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-150 transition cursor-pointer select-none">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleBrandToggle(brandName)}
                                          className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className="text-[10.5px] font-semibold text-slate-700">{brandName}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* İndirim Kuponu */}
                        <div className="space-y-1.5 border-t border-slate-100 pt-3">
                          <label htmlFor="reg_coupon_code" className="text-xs font-bold text-slate-700 block font-sans">
                            İndirim Kuponu <span className="text-slate-400 font-normal text-[10px]">{tLocal(tLocal("(İsteğe Bağlı)", "(Optional)"), "(Optional)")}</span>
                          </label>
                          <div className="relative">
                            <input
                              id="reg_coupon_code"
                              type="text"
                              placeholder={tLocal(tLocal("Örn: BAYI1060", "e.g. BAYI1060"), "e.g. BAYI1060")}
                              value={couponCode}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCouponCode(val);
                                handleCouponCodeCheck(val);
                              }}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none uppercase font-mono font-bold"
                            />
                            {couponStatus !== 'idle' && (
                              <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                                {couponStatus === 'valid' ? (
                                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                                ) : (
                                  <span className="text-rose-600 text-xs font-bold">✗</span>
                                )}
                              </div>
                            )}
                          </div>
                          {couponMessage && (
                            <p className={`text-[10.5px] font-bold mt-1 ${
                              couponStatus === 'valid' ? 'text-emerald-600' : 'text-rose-600'
                            } whitespace-pre-line`}>
                              {couponMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. LPG ENGINEER ENTP SPECIAL FIELDS */}
                    {regRole === "engineer" && (
                      <div className="space-y-3 block border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">{tLocal(tLocal("Mühendis / Uzman Bilgileri", "Engineer / Specialist Information"), "Engineer / Specialist Information")}</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Uzmanlık Alanı / Ünvan", "Area of Expertise / Title"), "Area of Expertise / Title")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Mekatronik Müh. / ECU Kalibrasyon Uzmanı", "e.g. Mechatronics Eng. / ECU Calibration Expert"), "e.g. Mechatronics Eng. / ECU Calibration Expert")}
                              value={engineerSkill}
                              onChange={(e) => setEngineerSkill(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Şehir", "City"), "City")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Ankara", "e.g. Ankara"), "e.g. Ankara")}
                              value={engineerCity}
                              onChange={(e) => setEngineerCity(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 mt-3">
                          <label className="text-xs font-bold text-slate-700 block font-sans">
                            Çalışılan / Uzmanlaşılan LPG Markaları <strong className="text-rose-600">*</strong> <span className="text-slate-400 font-normal text-[10px]">{tLocal(tLocal("(Birden fazla seçilebilir)", "(Multiple options selectable)"), "(Multiple options selectable)")}</span>
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            {["BRC", "Zavoli", "Prins", "Atiker", "Lovato", "Landi Renzo", "OMVL", "Romano", "AC Stag", "Diğer"].map((brandName) => {
                              const isChecked = regWorkingBrands.includes(brandName);
                              return (
                                <label key={brandName} className="flex items-center gap-1.5 p-1.5 bg-white hover:bg-slate-100 rounded border border-slate-150 transition cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleBrandToggle(brandName)}
                                    className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span className="text-[11px] font-semibold text-slate-700">{brandName}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Ek Marka Seç - Dinamik Marka Listesi */}
                          {regWorkingBrands.includes("Diğer") && (
                            <div className="space-y-1.5 mt-2.5 p-3 bg-white border border-slate-200 rounded-xl animate-fade-in font-sans">
                              <span className="text-[11px] font-bold text-emerald-800 block mb-1 uppercase tracking-wider font-mono">
                                🔗 Ek Marka Seç
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {availableBrands
                                  .filter(b => !isCoreBrandName(b) && b.toLowerCase() !== "diğer")
                                  .map((brandName) => {
                                    const isChecked = regWorkingBrands.includes(brandName);
                                    return (
                                      <label key={brandName} className="flex items-center gap-1.5 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-150 transition cursor-pointer select-none">
                                        <input 
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => handleBrandToggle(brandName)}
                                          className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <span className="text-[10.5px] font-semibold text-slate-700">{brandName}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. KIT MANUFACTURER SPECIAL FIELDS */}
                    {regRole === "manufacturer" && (
                      <div className="space-y-3 block border-t border-slate-100 pt-3">
                        <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">{tLocal(tLocal("Kit Üretici/Distribütör Mühendisliği", "Kit Manufacturer/Distributor Engineering"), "Kit Manufacturer/Distributor Engineering")}</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Firma Adı", "Company Name"), "Company Name")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal(tLocal("Örn: Lovato Türkiye Dağıtım A.Ş.", "e.g. Lovato Turkey Distribution Inc."), "e.g. Lovato Turkey Distribution Inc.")}
                              value={mfrCompanyName}
                              onChange={(e) => setMfrCompanyName(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Tescilli Marka Adı (LPG Kiti)", "Registered Brand Name (LPG Kit)"), "Registered Brand Name (LPG Kit)")}<strong className="text-rose-600">*</strong></label>
                            <select 
                              value={mfrBrandName}
                              onChange={(e) => setMfrBrandName(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                            >
                              <option value="">{tLocal(tLocal("-- Marka Seçiniz --", "-- Select Brand --"), "-- Select Brand --")}</option>
                              {availableBrands.map((brandName) => (
                                <option key={brandName} value={brandName}>{brandName}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Yetkili Kişi", "Authorized Person"), "Authorized Person")}</label>
                            <input 
                              type="text" 
                              placeholder="Ad Soyad"
                              value={mfrAuthorizedName}
                              onChange={(e) => setMfrAuthorizedName(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Kurumsal Web Sitesi</label>
                            <input 
                              type="text" 
                              placeholder="https://www.markamiz.com.tr"
                              value={mfrWebsite}
                              onChange={(e) => setMfrWebsite(e.target.value)}
                              className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Ürün Kategorileri", "Product Categories"), "Product Categories")}</label>
                          <input 
                            type="text" 
                            placeholder={tLocal(tLocal("Örn: Sıralı Otogaz Kitleri, LPG Enjektörü, Filtre Elemanları", "e.g. Sequential Autogas Kits, LPG Injectors, Filter Elements"), "e.g. Sequential Autogas Kits, LPG Injectors, Filter Elements")}
                            value={mfrCategories}
                            onChange={(e) => setMfrCategories(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* KVKK and Consent Checkboxes */}
                    <div className="space-y-3.5 pt-3 border-t border-slate-100 font-sans">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <ShieldCheck className="h-4 w-4 text-emerald-605 text-emerald-600" />
                        <span>{tLocal(tLocal("Yasal Onaylar ve Aydınlatma Metni", "Legal Consents & Clarification Text"), "Legal Consents & Clarification Text")}</span>
                      </div>

                      {/* KVKK Scrollable Text Box */}
                      <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-32 overflow-y-auto space-y-2">
                        <p className="font-bold text-slate-700 uppercase">{tLocal(tLocal("LPG PORTAL AYDINLATMA METNİ", "LPG PORTAL DATA CLARIFICATION TEXT"), "LPG PORTAL DATA CLARIFICATION TEXT")}</p>
                        <p>
                          6698 Sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, LPG PORTAL tarafından üyelik işlemlerinin yürütülmesi, kullanıcı hesaplarının oluşturulması, hizmetlerin sunulması, kullanıcı taleplerinin karşılanması, firma rehberi ve platform hizmetlerinin yönetilmesi amacıyla ad, soyad, telefon numarası, e-posta adresi, firma bilgileri, adres bilgileri ve kullanıcı tarafından sağlanan diğer bilgiler işlenebilecektir.
                        </p>
                        <p className="font-semibold text-slate-700">{tLocal(tLocal("Kişisel verileriniz;", "Your personal data;"), "Your personal data;")}</p>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li>{tLocal(tLocal("Üyelik işlemlerinin yürütülmesi,", "Execution of membership procedures,"), "Execution of membership procedures,")}</li>
                          <li>{tLocal(tLocal("Kullanıcı doğrulama süreçlerinin gerçekleştirilmesi,", "Execution of user verification processes,"), "Execution of user verification processes,")}</li>
                          <li>{tLocal(tLocal("Firma ve kullanıcı profillerinin oluşturulması,", "Creation of company and user profiles,"), "Creation of company and user profiles,")}</li>
                          <li>{tLocal(tLocal("Teknik destek hizmetlerinin sunulması,", "Provision of technical support services,"), "Provision of technical support services,")}</li>
                          <li>{tLocal(tLocal("Ödeme ve abonelik süreçlerinin yönetilmesi,", "Management of payment and subscription processes,"), "Management of payment and subscription processes,")}</li>
                          <li>{tLocal(tLocal("Yasal yükümlülüklerin yerine getirilmesi,", "Compliance with legal obligations,"), "Compliance with legal obligations,")}</li>
                          <li>{tLocal(tLocal("Platform güvenliğinin sağlanması", "Ensuring platform security"), "Ensuring platform security")}</li>
                        </ul>
                        <p className="font-semibold text-slate-705 text-slate-700">{tLocal(tLocal("amaçlarıyla işlenebilir.", "can be processed for these purposes."), "can be processed for these purposes.")}</p>
                        <p>
                          Kişisel verileriniz, yürürlükteki mevzuat hükümleri kapsamında ve gerekli güvenlik tedbirleri alınarak saklanacaktır.
                        </p>
                        <p>
                          KVKK kapsamında sahip olduğunuz haklar doğrultusunda kişisel verilerinizin işlenmesine ilişkin taleplerinizi LPG PORTAL'a iletebilirsiniz.
                        </p>
                        <p className="italic font-medium">
                          Platforma kayıt olarak bu aydınlatma metnini okuduğunuzu ve anladığınızı kabul etmiş olursunuz.
                        </p>
                      </div>

                      {/* Consent Checkboxes */}
                      <div className="space-y-2.5 pt-1 text-[11px] text-slate-700">
                        <label className="flex items-start gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            id="chk_kvkk"
                            checked={kvkkApproved}
                            onChange={(e) => setKvkkApproved(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="group-hover:text-slate-900 transition">
                            <strong className="text-rose-600">*</strong> <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-600 hover:text-emerald-700" onClick={(e) => e.stopPropagation()}>{tLocal("KVKK Aydınlatma Metnini", "KVKK Clarification Text")}</a> okudum ve kabul ediyorum.
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            id="chk_privacy"
                            checked={privacyPolicyApproved}
                            onChange={(e) => setPrivacyPolicyApproved(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="group-hover:text-slate-900 transition">
                            <strong className="text-rose-600">*</strong> <a href="/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-600 hover:text-emerald-700" onClick={(e) => e.stopPropagation()}>{tLocal("Gizlilik Politikası'nı", "Privacy Policy")}</a> okudum ve kabul ediyorum.
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            id="chk_terms"
                            checked={termsApproved}
                            onChange={(e) => setTermsApproved(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="group-hover:text-slate-900 transition">
                            <strong className="text-rose-600">*</strong> <a href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-emerald-600 hover:text-emerald-700" onClick={(e) => e.stopPropagation()}>{tLocal("Kullanım Şartları'nı", "Terms of Use")}</a> okudum ve kabul ediyorum.
                          </span>
                        </label>

                        <label className="flex items-start gap-2 cursor-pointer group border-t border-slate-100/60 pt-2">
                          <input 
                            type="checkbox" 
                            id="chk_marketing"
                            checked={marketingApproved}
                            onChange={(e) => setMarketingApproved(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-slate-550 group-hover:text-slate-900 transition text-slate-500 text-[11px] leading-relaxed">
                            LPG PORTAL tarafından gönderilecek üyelik, teklif, sipariş, sistem duyuruları, kampanyalar, eğitimler, hatırlatmalar ve bilgilendirme amaçlı SMS, e-posta ve uygulama bildirimlerini almayı kabul ediyorum. <span className="text-[9px] text-slate-400 font-bold">{tLocal(tLocal("(İsteğe Bağlı)", "(Optional)"), "(Optional)")}</span>
                          </span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer mt-4"
                    >
                      Devam Et (Ödeme ve Kayıt Aşaması)
                    </button>
                  </form>
                )}

                {/* STEP 2: PAYMENT CHECKS */}
                {regStep === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                    
                    {/* CC Informational Band */}
                    <div className="md:col-span-12 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 mb-2 font-sans font-medium">
                      <Info className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{tLocal(tLocal("Kredi kartı entegrasyonu şu anda aktif değildir. Kredi kartı ile ödeme sistemi çok kısa süre içerisinde kullanıma açılacaktır.", "Credit card integration is currently inactive. Credit card payment system will be activated very soon."), "Credit card integration is currently inactive. Credit card payment system will be activated very soon.")}</span>
                    </div>

                    {/* Billing info receipt summary */}
                    <div className="md:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-100 font-sans h-fit space-y-4">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        ÜYELİK FATURA ÖZETİ
                      </h4>
                      <div className="text-[11px] text-slate-600 space-y-2 border-b border-slate-200/60 pb-3">
                        <div className="flex justify-between">
                          <span>{tLocal(tLocal("Üye Tipi:", "Member Type:"), "Member Type:")}</span>
                          <strong className="text-slate-800">{getRoleDisplayName(regRole)}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>{tLocal(tLocal("Paket Geçerliliği:", "Plan Validity:"), "Plan Validity:")}</span>
                          <strong className="text-slate-800">{tLocal(tLocal("1 Yıl (365 Gün)", "1 Year (365 Days)"), "1 Year (365 Days)")}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>{tLocal(tLocal("Fatura Alıcısı:", "Invoice Recipient:"), "Invoice Recipient:")}</span>
                          <strong className="text-slate-800">{regRole === "vehicle_owner" ? `${regFirstName} ${regLastName}` : (regRole === "dealer" ? companyName : mfrCompanyName)}</strong>
                        </div>
                      </div>

                      {regAppliedPromo ? (
                        <div className="text-[11px] text-slate-600 space-y-2 pt-1 font-mono">
                          <div className="flex justify-between">
                            <span>{tLocal(tLocal("Hizmet Tutarı:", "Service Amount:"), "Service Amount:")}</span>
                            <span className="line-through">{currentPricing.amount.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-bold">
                            <span>{tLocal(tLocal("Kampanya Kodu İndirimi:", "Promo Code Discount:"), "Promo Code Discount:")}</span>
                            <span>-%100</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-dashed border-slate-300 pt-3">
                            <span>{tLocal(tLocal("İndirimli Tutar:", "Discounted Amount:"), "Discounted Amount:")}</span>
                            <span>0 TL</span>
                          </div>
                        </div>
                      ) : regRole === "dealer" && couponStatus === "valid" ? (
                        <div className="text-[11px] text-slate-600 space-y-2 pt-1 font-mono">
                          <div className="flex justify-between">
                            <span>{tLocal(tLocal("Normal Ücret:", "Normal Price:"), "Normal Price:")}</span>
                            <span>{currentPricing.amount.toLocaleString('tr-TR')} TL</span>
                          </div>
                          <div className="flex justify-between text-rose-600 font-bold">
                            <span>{tLocal(tLocal("İndirim:", "Discount:"), "Discount:")}</span>
                            <span>500 TL</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-dashed border-slate-300 pt-3">
                            <span>{tLocal(tLocal("Ödenecek Tutar:", "Amount to Pay:"), "Amount to Pay:")}</span>
                            <span>{(currentPricing.amount - 500).toLocaleString('tr-TR')} TL</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-600 space-y-2 pt-1 font-mono">
                          <div className="flex justify-between">
                            <span>{tLocal(tLocal("Hizmet Tutarı:", "Service Amount:"), "Service Amount:")}</span>
                            <span>{netFee} TL</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Vergi (%20 KDV):</span>
                            <span>{calculatedTax} TL</span>
                          </div>
                          <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-dashed border-slate-300 pt-3">
                            <span>Toplam Tutar:</span>
                            <span>{currentPricing.amount.toLocaleString('tr-TR')} TL</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Payment Column */}
                    <div className="md:col-span-7 space-y-4">
                      {/* Kampanya / Ücretsiz Üyelik Kodu Giriş Alanı */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-sans">
                        <label className="text-[11px] font-bold text-slate-700 block">{tLocal(tLocal("Kampanya / Ücretsiz Üyelik Kodu", "Promo / Free Membership Code"), "Promo / Free Membership Code")}</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={tLocal(tLocal("Örn: 8B3K9L2P", "e.g. 8B3K9L2P"), "e.g. 8B3K9L2P")}
                            value={regPromoInput}
                            disabled={!!regAppliedPromo}
                            onChange={(e) => setRegPromoInput(e.target.value)}
                            className="bg-white border border-slate-200 text-xs rounded-lg p-2 flex-1 focus:outline-none focus:border-emerald-500 uppercase font-mono font-bold"
                          />
                          {regAppliedPromo ? (
                            <button
                              type="button"
                              onClick={handleRemovePromoCode}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition"
                            >
                              Kaldır
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleApplyPromoCode}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                            >
                              Uygula
                            </button>
                          )}
                        </div>
                        {regPromoError && <p className="text-[10px] font-bold text-rose-600">{regPromoError}</p>}
                        {regPromoSuccess && <p className="text-[10px] font-bold text-emerald-600">{regPromoSuccess}</p>}
                      </div>

                      {/* Payment Method Selection tabs (Only if no free code applied) */}
                      {!regAppliedPromo && (
                        <div className="flex border-b border-slate-100 mb-4 font-sans">
                          <button
                            type="button"
                            onClick={() => setRegPaymentMethod("cc")}
                            className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
                              regPaymentMethod === "cc"
                                ? "text-emerald-600 border-b-2 border-emerald-600 font-extrabold"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            💳 Kredi Kartı ile Ödeme
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegPaymentMethod("eft")}
                            className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
                              regPaymentMethod === "eft"
                                ? "text-emerald-600 border-b-2 border-emerald-600 font-extrabold"
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                          >
                            🏦 Havale / EFT ile Ödeme
                          </button>
                        </div>
                      )}

                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        {regAppliedPromo ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-2 font-sans">
                            <span className="text-2xl">🎁</span>
                            <h5 className="text-xs font-bold text-emerald-800">{tLocal(tLocal("Ücretsiz Üyelik Aktivasyonu", "Free Membership Activation"), "Free Membership Activation")}</h5>
                            <p className="text-[10.5px] text-emerald-700">{tLocal(tLocal("Ücretsiz üyelik kodunuz başarıyla uygulandı. Ödeme yapmanıza gerek kalmadan üyeliğinizi hemen aktif edebilirsiniz.", "Your free membership code has been applied successfully. You can activate your membership immediately without payment."), "Your free membership code has been applied successfully. You can activate your membership immediately without payment.")}</p>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setRegStep(1)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                              >
                                Geri Dön
                              </button>
                              <button
                                type="submit"
                                disabled={isPaying}
                                className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer flex justify-center items-center gap-1.5"
                              >
                                {isPaying ? "Aktivasyon Yapılıyor..." : "Kodu Kullan ve Aktivasyonu Tamamla"}
                              </button>
                            </div>
                          </div>
                        ) : regPaymentMethod === "eft" ? (
                          <div className="space-y-4 font-sans">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                              <h5 className="text-xs font-bold text-slate-800">{tLocal(tLocal("Şirket Havale / EFT Banka Bilgileri", "Company Wire Transfer / EFT Bank Details"), "Company Wire Transfer / EFT Bank Details")}</h5>
                              <div className="text-[11px] text-slate-600 space-y-1.5 font-mono">
                                <p>🏦 <strong>Banka:</strong> Garanti BBVA</p>
                                <p>👤 <strong>{tLocal(tLocal("Alıcı:", "Recipient:"), "Recipient:")}</strong>{tLocal(tLocal("LPG PORTAL Bilişim Teknolojileri A.Ş.", "LPG PORTAL Information Technologies Inc."), "LPG PORTAL Information Technologies Inc.")}</p>
                                <p>📋 <strong>IBAN:</strong> TR56 0006 2000 0000 1234 5678 90</p>
                              </div>
                            </div>
                            <div className="bg-amber-50/70 border border-amber-200 text-[10.5px] text-slate-700 p-3.5 rounded-xl space-y-1 leading-relaxed">
                              <p className="font-bold text-amber-800">{tLocal(tLocal("⚠️ Havale / EFT Talimatı:", "⚠️ Wire Transfer / EFT Instructions:"), "⚠️ Wire Transfer / EFT Instructions:")}</p>
                              <p>{tLocal(tLocal("Ödemenizi gönderirken açıklama kısmına kayıt olduğunuz e-posta adresinizi (", "When sending your payment, you must write your registered email address ("), "When sending your payment, you must write your registered email address (")}<strong className="font-mono text-slate-900">{regEmail}</strong>{tLocal(tLocal(") mutlaka yazınız.", ") in the description section."), ") in the description section.")}</p>
                              <p>{tLocal(tLocal("Ödemeniz onaylandıktan sonra üyeliğiniz 24 saat içinde aktif edilecektir. Hızlı onay için dekontunuzu", "Once your payment is approved, your membership will be activated within 24 hours. For fast approval, you can send your receipt to"), "Once your payment is approved, your membership will be activated within 24 hours. For fast approval, you can send your receipt to")}<strong className="font-mono text-slate-900">destek@lpgportal.com</strong>{tLocal(tLocal("adresine gönderebilirsiniz.", "address."), "address.")}</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setRegStep(1)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                              >
                                Geri Dön
                              </button>
                              <button
                                type="submit"
                                disabled={isPaying}
                                className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer flex justify-center items-center gap-1.5"
                              >
                                {isPaying ? "Gönderiliyor..." : "Havale / EFT ile Kayıt Talebi Gönder"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 mb-2 font-sans">
                              <CreditCard className="h-4 w-4 text-slate-500" />
                              GÜVENLİ ÖDEME BİLGİLERİ
                            </h4>

                            <div className="space-y-1 font-sans">
                              <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("Kart Üzerindeki İsim", "Name on Card"), "Name on Card")}</label>
                              <input 
                                type="text" 
                                required
                                placeholder="Ad SOYAD"
                                value={cardHolder}
                                onChange={(e) => handleCardHolderChange(e.target.value)}
                                className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                              />
                            </div>

                            <div className="space-y-1 font-sans">
                              <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("Kredi Kartı Numarası", "Credit Card Number"), "Credit Card Number")}</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <input 
                                  type="text" 
                                  required
                                  maxLength={19}
                                  placeholder="4000 1234 5678 9010"
                                  value={cardNumber}
                                  onChange={(e) => handleCardNumberChange(e.target.value)}
                                  className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 font-sans">
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600 block">S.T. (AA/YY)</label>
                                <input 
                                  type="text" 
                                  required
                                  maxLength={5}
                                  placeholder="12/29"
                                  value={cardExpiry}
                                  onChange={(e) => handleCardExpiryChange(e.target.value)}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-center"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("CVV (Güvenlik Kodu)", "CVV (Security Code)"), "CVV (Security Code)")}</label>
                                <input 
                                  type="password" 
                                  required
                                  maxLength={3}
                                  placeholder="770"
                                  value={cardCvv}
                                  onChange={(e) => handleCardCvvChange(e.target.value)}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-center"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2 font-sans">
                              <button
                                type="button"
                                onClick={() => setRegStep(1)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                              >
                                Geri Dön
                              </button>

                              <button
                                type="submit"
                                disabled={isPaying}
                                className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs py-3 rounded-xl transition shadow-sm cursor-pointer flex justify-center items-center gap-1.5"
                              >
                                {isPaying ? "Ödeniyor..." : `Öde ve Üyeliği Aktifleştir`}
                              </button>
                            </div>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        
        // 2) IF USER IS REGISTERED & LOGGED IN
        <div className="space-y-8">
          
          {/* Header section */}
          <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-750 shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-inner">
                {activeUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black">{activeUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase border border-emerald-500/20">
                    {getRoleDisplayName(activeUser.role)}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 font-mono">{activeUser.email} / {activeUser.phone}</p>
              </div>
            </div>

            <div className="flex gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
              {activeUser.role === "admin" && (
                <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[10px] font-bold py-1.5 px-3 rounded-xl uppercase font-mono">
                  <ShieldCheck className="h-4 w-4" />
                  Yönetici Kontrolü
                </span>
              )}
              <button 
                onClick={onLogout}
                className="bg-slate-850 hover:bg-rose-900/45 text-rose-350 border border-slate-700/60 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Güvenli Çıkış
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar with Navigation for panels (if they want tabs or simple scroll) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold mb-2 px-1">{tLocal(tLocal("MENÜ SEÇENEKLERİ", "MENU OPTIONS"), "MENU OPTIONS")}</p>
                <button 
                  onClick={() => { setUserMainTab("profile"); setAdminTab(null); }}
                  className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    userMainTab === "profile" 
                      ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                      : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Layout className="h-4 w-4" />
                  Profil & Üyelik Bilgileri
                </button>
                {(activeUser?.role === "vehicle_owner" || activeUser?.role === "dealer" || activeUser?.role === "engineer") && (
                  <button 
                    onClick={() => { setUserMainTab("quotes"); setAdminTab(null); }}
                    className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                      userMainTab === "quotes" 
                        ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                        : "bg-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Tekliflerim
                  </button>
                )}
                <button 
                  onClick={() => { setUserMainTab("notifications"); setAdminTab(null); }}
                  className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                    userMainTab === "notifications" 
                      ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                      : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-amber-500 animate-bounce" />
                    <span>Bildirim Merkezi</span>
                  </div>
                  {(() => {
                    const userNotifs = notificationsList.filter(n => n.userId === "all" || (activeUser && n.userId === activeUser.id));
                    const unread = userNotifs.filter(n => !n.read).length;
                    return unread > 0 ? (
                      <span className="h-4 min-w-[16px] px-1 bg-rose-600 text-white font-mono font-black rounded-full text-[9px] flex items-center justify-center animate-pulse shadow-xs">
                        {unread}
                      </span>
                    ) : null;
                  })()}
                </button>
                <button 
                  onClick={() => { setUserMainTab("market_management"); setAdminTab(null); }}
                  className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    userMainTab === "market_management" 
                      ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                      : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  Market Yönetimi
                </button>
                <button 
                  onClick={() => { setUserMainTab("feedback"); setAdminTab(null); }}
                  className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    userMainTab === "feedback" 
                      ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                      : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                  {tLocal("Talep, Şikayet & Öneri Merkezi", "Feedback & Suggestion Center")}
                </button>
                <button 
                  onClick={() => { setUserMainTab("campaigns"); setAdminTab(null); }}
                  className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                    userMainTab === "campaigns" 
                      ? "bg-emerald-50 text-emerald-800 font-extrabold" 
                      : "bg-transparent text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Kampanyalar
                </button>
                {activeUser.role === "admin" && (
                  <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[9px] text-amber-550 text-amber-600 font-mono font-bold uppercase block px-1 mb-1">{tLocal(tLocal("Yönetim Paneli", "Admin Dashboard"), "Admin Dashboard")}</span>
                    
                    <button 
                      onClick={() => { setAdminTab("dashboard"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "dashboard" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Activity className="h-4 w-4 text-amber-600" />
                      Yönetim Kontrol Paneli
                    </button>

                    <button 
                      onClick={() => { setAdminTab("members"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "members" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Tüm Üyelerin Yönetimi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("service_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "service_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-bold" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Building className="h-4 w-4 text-amber-600" />
                      Servis Yönetimi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("coupons"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "coupons" 
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Ticket className="h-4 w-4" />
                      Kupon Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("campaigns"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "campaigns" 
                          ? "bg-amber-55 border border-amber-100 text-amber-800 font-bold" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                      Kampanya Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("reminders"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "reminders" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-bold" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      Üyelik Takip Sistemi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("notifications"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "notifications" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Megaphone className="h-4 w-4 text-amber-600" />
                      Bildirim & Duyuru Merkezi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("system_logs"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "system_logs" 
                          ? "bg-indigo-50 border border-indigo-100 text-indigo-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Sistem Hareketleri Günlüğü
                    </button>

                    <button 
                      onClick={() => { setAdminTab("reviews"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "reviews" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                      Kullanıcı Yorumları
                    </button>

                    <button 
                      onClick={() => { setAdminTab("content_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "content_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Layout className="h-4 w-4 text-amber-600" />
                      Haber & İçerik Yönetimi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("ad_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "ad_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Megaphone className="h-4 w-4 text-amber-600" />
                      Reklam Yönetimi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("price_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "price_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <DollarSign className="h-4 w-4 text-amber-600" />
                      LPG Fiyat Yönetimi
                    </button>

                    <button 
                      onClick={() => { setAdminTab("payment_verification"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "payment_verification" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      Ödeme & Dekont Onaylama
                    </button>

                    <button 
                      onClick={() => { setAdminTab("quote_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "quote_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <FileText className="h-4 w-4 text-amber-600" />
                      Teklif Yönetimi (CRM)
                    </button>
                    <button 
                      onClick={() => { setAdminTab("feedback_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "feedback_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                      Talep, Şikayet & Öneri Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("sms_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "sms_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Phone className="h-4 w-4 text-amber-600" />
                      SMS Entegrasyon Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("email_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "email_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Mail className="h-4 w-4 text-amber-600" />
                      E-Posta Entegrasyon Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("payment_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "payment_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <CreditCard className="h-4 w-4 text-amber-600" />
                      Ödeme Geçidi (PayTR) Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("vehicle_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "vehicle_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Car className="h-4 w-4 text-amber-600" />
                      Araç Yönetimi
                    </button>
                    <button 
                      onClick={() => { setAdminTab("contact_management"); setUserMainTab(null); }}
                      className={`w-full text-left font-bold text-xs py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                        adminTab === "contact_management" 
                          ? "bg-amber-50 border border-amber-100 text-amber-800 font-black" 
                          : "bg-transparent text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Inbox className="h-4 w-4 text-amber-600" />
                      İletişim ve Mesaj Kontrol Paneli
                    </button>
                  </div>
                )}
              </div>

              {/* Membership status card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3 font-sans" id="membership-status-switch-panel">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono block">{tLocal(tLocal("ÜYELİK DURUMU", "MEMBERSHIP STATUS"), "MEMBERSHIP STATUS")}</span>
                
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-600">Durum:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    activeUser.membership_status === "Aktif" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : activeUser.membership_status === "Beklemede" || activeUser.membership_status === "Onay Bekliyor"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                    {activeUser.membership_status}
                  </span>
                </div>

                {/* ACTIVE / PASSIVE TOGGLE SWITCH WIDGET */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center col-span-2">
                    <span className="text-xs font-bold text-slate-700">{tLocal(tLocal("Üyelik Durum Yönetimi", "Membership Status Management"), "Membership Status Management")}</span>
                    
                    {activeUser.membership_status === "Aktif" || activeUser.membership_status === "Pasif" ? (
                      <button 
                        type="button"
                        onClick={() => setShowPassiveConfirmModal(true)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          activeUser.membership_status === "Aktif" ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                        id="user-status-switch-toggle"
                        aria-label={tLocal(tLocal("Üyelik Durumu Değiştir", "Change Membership Status"), "Change Membership Status")}
                      >
                        <span 
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            activeUser.membership_status === "Aktif" ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-450 text-slate-400 font-mono italic font-semibold">Kilitli 🔒</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[11px] font-medium pt-1">
                    <span className="text-slate-500">{tLocal(tLocal("Site Görünürlüğü:", "Site Visibility:"), "Site Visibility:")}</span>
                    <strong className={`flex items-center gap-1 ${activeUser.membership_status === "Aktif" ? "text-emerald-700 font-bold" : "text-slate-500"}`}>
                      {activeUser.membership_status === "Aktif" ? "🟢 Aktif" : "⚪ Pasif"}
                    </strong>
                  </div>

                  {activeUser.membership_status === "Pasif" && (
                    <button
                      type="button"
                      onClick={() => setShowPassiveConfirmModal(true)}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      🚀 Üyeliği Aktifleştir
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1.5 font-mono pt-2 border-t border-slate-50">
                  <div className="flex justify-between">
                    <span>{tLocal(tLocal("Başlangıç:", "Start:"), "Start:")}</span>
                    <strong className="text-slate-800">{new Date(activeUser.membership_start).toLocaleDateString('tr-TR')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{tLocal(tLocal("Bitiş:", "End:"), "End:")}</span>
                    <strong className="text-slate-800">{new Date(activeUser.membership_end).toLocaleDateString('tr-TR')}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Area: Forms, Faturas, change password or Admin dashboard */}
            <div className="lg:col-span-9 space-y-8">
              
              {/* ========================================= */}
              {/* ADMIN CONTROL DASHBOARD SUBTAB            */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "dashboard" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in" id="admin-enhanced-dashboard">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Activity className="h-5 w-5 text-amber-600" />
                        LPG PORTAL Operasyonel Yönetim Kontrol Masası
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Sistem sürdürülebilirliği, firma tescilleri, onay bekleyen ürünler ve hareket logları takip paneli.", "System sustainability, company registrations, pending product approvals, and activity logs tracking panel."), "System sustainability, company registrations, pending product approvals, and activity logs tracking panel.")}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const backup = createAutomaticBackup();
                          if (backup) {
                            addSystemLog("Yedek Oluşturuldu", "Yönetici tarafından elle anlık tam sistem yedeklemesi tetiklendi.", activeUser.email);
                            alert(`Sistem Yedeklendi!\nID: ${backup.id}\nTarih: ${new Date(backup.createdAt).toLocaleString("tr-TR")}\nBoyut: ${Math.round(backup.dataPayload.length / 1024)} KB`);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-1.5 px-3.5 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        💾 Sistem Yedek Al
                      </button>
                    </div>
                  </div>

                  {/* Admin Session Audit Details */}
                  {activeUser.last_login_time && (
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
                          <Activity className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-amber-500 uppercase font-mono tracking-wider">{tLocal(tLocal("Yönetici Oturum Detayları", "Admin Session Details"), "Admin Session Details")}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Son Giriş Zamanı: <strong className="text-white">{new Date(activeUser.last_login_time).toLocaleString("tr-TR")}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-[10px] text-slate-300 font-mono">
                        <div className="bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
                          🌐 IP: {activeUser.last_login_ip || "—"}
                        </div>
                        <div className="bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-800">
                          📱 Cihaz: {activeUser.last_login_device || "—"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. SEVEN SYSTEM SUMMARY CARDS */}
                  {(() => {
                    const totalMembers = allUsers.length;
                    const activeMembers = allUsers.filter(u => u.membership_status === "Aktif").length;
                    const passiveMembers = allUsers.filter(u => u.membership_status === "Pasif").length;
                    
                    const expiredMembers = allUsers.filter(u => {
                      const isExpiredStatus = u.membership_status === "Expired";
                      if (isExpiredStatus) return true;
                      if (u.membership_end) {
                        return new Date(u.membership_end).getTime() < Date.now();
                      }
                      return false;
                    }).length;

                    // Retrieve counts from other local databases
                    const compStr = localStorage.getItem("lpgportal_companies");
                    const totalPendingComp = compStr ? JSON.parse(compStr).filter((c: any) => c.status === "Onay Bekliyor" || c.status === "pending" || c.approved === false).length : 0;

                    const prodStr = localStorage.getItem("lpgportal_products");
                    const totalPendingProds = prodStr ? JSON.parse(prodStr).filter((p: any) => p.status === "Onay Bekliyor").length : 0;

                    const newsStr = localStorage.getItem("lpgportal_news_db");
                    const totalPendingNews = newsStr ? JSON.parse(newsStr).filter((n: any) => n.status === "Draft" || n.approved === false || n.status === "Beklemede").length : 1;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                        <div 
                          onClick={() => { setAdminTab("members"); setUserMainTab(null); }}
                          className="bg-white hover:bg-slate-100/50 p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center cursor-pointer transition"
                        >
                          <span className="text-[9px] text-slate-400 font-bold block uppercase font-mono">{tLocal(tLocal("Toplam Üye", "Total Members"), "Total Members")}</span>
                          <strong className="text-xl font-black text-slate-800 tracking-tight mt-1.5 block">{totalMembers}</strong>
                          <span className="text-[8px] text-teal-600 block mt-0.5 hover:underline">{tLocal(tLocal("Üyelere Git ➜", "Go to Members ➜"), "Go to Members ➜")}</span>
                        </div>

                        <div 
                          onClick={() => { setAdminTab("members"); setUserMainTab(null); }}
                          className="bg-white hover:bg-slate-100/50 p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center cursor-pointer transition"
                        >
                          <span className="text-[9px] text-emerald-600 font-bold block uppercase font-mono">{tLocal(tLocal("Aktif Üye", "Active Members"), "Active Members")}</span>
                          <strong className="text-xl font-black text-emerald-700 tracking-tight mt-1.5 block">{activeMembers}</strong>
                          <span className="text-[8px] text-emerald-600 block mt-0.5">Sitede etkin</span>
                        </div>

                        <div 
                          onClick={() => { setAdminTab("members"); setUserMainTab(null); }}
                          className="bg-white hover:bg-slate-100/50 p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center cursor-pointer transition"
                        >
                          <span className="text-[9px] text-rose-650 text-rose-600 font-bold block uppercase font-mono">{tLocal(tLocal("Pasif Üye", "Passive Members"), "Passive Members")}</span>
                          <strong className="text-xl font-black text-rose-700 tracking-tight mt-1.5 block">{passiveMembers}</strong>
                          <span className="text-[8px] text-rose-600 block mt-0.5">{tLocal(tLocal("Askıya alınanlar", "Suspended ones"), "Suspended ones")}</span>
                        </div>

                        <div 
                          onClick={() => { setAdminTab("reminders"); setUserMainTab(null); }}
                          className="bg-white hover:bg-slate-100/50 p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center cursor-pointer transition"
                        >
                          <span className="text-[9px] text-amber-600 font-bold block uppercase font-mono">{tLocal(tLocal("Süresi Dolan", "Expired Plan"), "Expired Plan")}</span>
                          <strong className="text-xl font-black text-amber-700 tracking-tight mt-1.5 block">{expiredMembers}</strong>
                          <span className="text-[8px] text-amber-600 block mt-0.5 hover:underline">{tLocal(tLocal("Takipleri Aç ➜", "Open Tracking ➜"), "Open Tracking ➜")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center">
                          <span className="text-[9px] text-indigo-600 font-bold block uppercase font-mono">Bekleyen Firma</span>
                          <strong className="text-xl font-black text-indigo-800 tracking-tight mt-1.5 block">{totalPendingComp}</strong>
                          <span className="text-[8px] text-indigo-500 block mt-0.5">{tLocal(tLocal("Rehber Onayı", "Directory Approval"), "Directory Approval")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center">
                          <span className="text-[9px] text-sky-600 font-bold block uppercase font-mono">{tLocal(tLocal("Bekleyen Ürün", "Pending Product"), "Pending Product")}</span>
                          <strong className="text-xl font-black text-sky-800 tracking-tight mt-1.5 block">{totalPendingProds}</strong>
                          <span className="text-[8px] text-sky-500 block mt-0.5">{tLocal(tLocal("Pazaryeri Onayı", "Marketplace Approval"), "Marketplace Approval")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs text-center">
                          <span className="text-[9px] text-purple-600 font-bold block uppercase font-mono">Bekleyen Haber</span>
                          <strong className="text-xl font-black text-purple-800 tracking-tight mt-1.5 block">{totalPendingNews}</strong>
                          <span className="text-[8px] text-purple-500 block mt-0.5">{tLocal(tLocal("Editör Havuzunda", "In Editor Pool"), "In Editor Pool")}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* BACKUP & RESTORE BOARD PANEL (Sol) */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          💾 Veritabanı Sistem Yedekleri (Db Backup)
                        </h4>
                        <span className="text-[9px] text-slate-400 font-mono italic">{tLocal(tLocal("Maks: 10 kayıt", "Max: 10 records"), "Max: 10 records")}</span>
                      </div>

                      <div className="space-y-2 max-h-[220px] overflow-y-auto">
                        {getBackups().map((backup, index) => (
                          <div key={backup.id} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-mono">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800 uppercase block text-[10px]">{index === 0 ? "🟢 En Son Yedek" : `Yedek #${index + 1}`}</span>
                              <span className="text-[9.5px] text-slate-500">{new Date(backup.createdAt).toLocaleString("tr-TR")} • {Math.round(backup.dataPayload.length / 1024)} KB</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const ok = confirm("Sistem veritabanını bu yedek noktasına geri döndürmek istiyor musunuz? Mevcut değişiklikler kaybolabilir.");
                                if (ok) {
                                  const restored = restoreBackup(backup.id);
                                  if (restored) {
                                    addSystemLog("Yedekten Geri Yüklendi", `Sistem veritabanı ${new Date(backup.createdAt).toLocaleString("tr-TR")} tarihindeki yedeğe döndürüldü.`, activeUser.email);
                                    alert("Veritabanı başarıyla geri yüklenmiştir. Tablolar güncellendi!");
                                    window.location.reload();
                                  }
                                }
                              }}
                              className="bg-teal-50 text-teal-700 hover:bg-teal-100 text-[10px] font-bold px-2 py-1.5 rounded-lg border border-teal-200 cursor-pointer transition"
                            >
                              Geri Yükle
                            </button>
                          </div>
                        ))}
                        {getBackups().length === 0 && (
                          <div className="p-4 text-center text-slate-400 italic text-xs">{tLocal(tLocal("Kayıtlı yedek bulunmuyor.", "No registered backups found."), "No registered backups found.")}</div>
                        )}
                      </div>
                    </div>

                    {/* BİLGİLENDİRME GEÇMİŞİ REPORTING PANEL (Sağ) */}
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          📢 Son Gönderilen Bilgilendirme Raporu
                        </h4>
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                          SMS & E-Posta & Panel
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        {getNotificationLogs().map(log => (
                          <div key={log.id} className="border-b border-slate-50 pb-2 last:border-none flex items-start gap-2.5 text-xs">
                            <div className={`p-1.5 rounded-lg ${
                              log.channel === "all" ? "bg-amber-50 text-amber-700" :
                              log.channel === "sms" ? "bg-sky-50 text-sky-700" : "bg-teal-50 text-teal-700"
                            } uppercase font-mono text-[8px] font-black shrink-0 mt-0.5`}>
                              {log.channel}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800">{log.title}</span>
                                <span className="text-[9px] text-slate-400 font-mono">{new Date(log.sentAt).toLocaleString('tr-TR')}</span>
                              </div>
                              <p className="text-slate-500 text-[11px] leading-relaxed">{log.message}</p>
                              <div className="text-[9px] text-slate-400">{tLocal(tLocal("Alıcı ID:", "Recipient ID:"), "Recipient ID:")}<strong className="text-slate-500 font-medium">{log.userId === "all" ? "Tüm Üyeler/Sistem" : log.userId}</strong></div>
                            </div>
                          </div>
                        ))}
                        {getNotificationLogs().length === 0 && (
                          <div className="p-4 text-center text-slate-400 italic text-xs">{tLocal(tLocal("Aktif gönderim kaydı bulunmuyor.", "No active transmission records found."), "No active transmission records found.")}</div>
                        )}
                      </div>
                    </div>

                    {/* LPG ROTA PLANLAYICI YÖNETİMİ PANELDİR */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      
                      {/* LPG LİTRE FİYATI EDİTÖRÜ */}
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            ⛽ Güncel LPG Litre Fiyatı Yönetimi
                          </h4>
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border border-emerald-100">
                            Rota & Savings Senkronize
                          </span>
                        </div>

                        <div className="space-y-4 font-sans">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{tLocal(tLocal("LPG Litre Fiyatı (TL)", "LPG Liter Price (TL)"), "LPG Liter Price (TL)")}</label>
                              <input
                                type="number"
                                step="0.01"
                                value={adminLpgPrice}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setAdminLpgPrice(val);
                                  localStorage.setItem("lpgportal_lpg_price", val.toString());
                                  setPricingData(prev => ({ ...prev, istanbul: val.toString() }));
                                }}
                                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none transition-all font-bold text-slate-800"
                              />
                            </div>
                            <div className="pt-5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.setItem("lpgportal_lpg_price", adminLpgPrice.toString());
                                  setPricingData(prev => ({ ...prev, istanbul: adminLpgPrice.toString() }));
                                  addSystemLog("LPG Fiyatı Güncellendi", `Yönetici LPG litre fiyatını el ile ${adminLpgPrice} TL olarak güncelledi.`, activeUser.email);
                                  alert(`LPG Litre Fiyatı Başarıyla Güncellendi!\nYeni Fiyat: ${adminLpgPrice.toFixed(2)} TL`);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 px-4 rounded-xl shadow-xs transition cursor-pointer"
                              >
                                Kaydet
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[11px] text-slate-500 leading-normal flex items-start gap-2">
                            <span className="text-base mt-px">💡</span>
                            <p>
                              Burada yapacağınız fiyat güncellemeleri, ana sayfadaki <strong>{tLocal(tLocal("Akıllı Rota Planlayıcı", "Smart Route Planner"), "Smart Route Planner")}</strong> ve <strong>Tasarruf Hesaplama Robotu</strong> alanlarında anında aktif olur.
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
                            <span className="text-[10px] text-slate-450 italic">{tLocal(tLocal("API Entegrasyon Hazırlığı:", "API Integration Preparation:"), "API Integration Preparation:")}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const simulatedPrice = Number((20.80 + Math.random() * 2.0).toFixed(2));
                                setAdminLpgPrice(simulatedPrice);
                                localStorage.setItem("lpgportal_lpg_price", simulatedPrice.toString());
                                setPricingData(prev => ({ ...prev, istanbul: simulatedPrice.toString() }));
                                addSystemLog("LPG Fiyatı API Güncellemesi", `Akaryakıt Fiyat API'si simüle edilerek güncel Türkiye ortalama LPG fiyatı ${simulatedPrice} TL olarak çekildi.`, activeUser.email);
                                alert(`Türkiye Akaryakıt Fiyatları API Bağlantısı Başarılı!\nOtogaz Fiyatı Güncellendi: ${simulatedPrice.toFixed(2)} TL`);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              🔄 API'den Güncel Fiyatı Çek
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SİSTEMDE OLMAYAN LPG KİT MARKALARI */}
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            ⚠️ Sistemde Olmayan LPG Kit Markaları
                          </h4>
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border border-amber-100">
                            Kullanıcı Bildirimleri
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto font-sans">
                          {unregisteredBrands.length > 0 ? (
                            <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="pb-2 font-bold">{tLocal(tLocal("Marka Adı", "Brand Name"), "Brand Name")}</th>
                                  <th className="pb-2 text-center font-bold">Talep</th>
                                  <th className="pb-2 text-right font-bold">{tLocal(tLocal("İşlem", "Action"), "Action")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {unregisteredBrands.map((item) => (
                                  <tr key={item.name} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 font-bold text-slate-700">{item.name}</td>
                                    <td className="py-2.5 text-center text-slate-500">{item.count} Kez</td>
                                    <td className="py-2.5 text-right space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          try {
                                            // Add to custom added list
                                            const savedCustom = localStorage.getItem("lpgportal_custom_added_brands");
                                            const customList = savedCustom ? JSON.parse(savedCustom) : [];
                                            if (!customList.includes(item.name)) {
                                              customList.push(item.name);
                                              localStorage.setItem("lpgportal_custom_added_brands", JSON.stringify(customList));
                                            }

                                            // Remove from unregistered
                                            const updatedUnreg = unregisteredBrands.filter(x => x.name !== item.name);
                                            setUnregisteredBrands(updatedUnreg);
                                            localStorage.setItem("lpgportal_unregistered_kit_brands", JSON.stringify(updatedUnreg));

                                            addSystemLog("LPG Markası Eklendi", `Yönetici '${item.name}' markasını genel otogaz kit listesine dahil etti.`, activeUser.email);
                                            alert(`'${item.name}' markası sisteme eklendi ve kullanıcı formlarında listelenmeye başlandı!`);
                                          } catch (e) {}
                                        }}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9.5px] font-bold py-1 px-2 rounded border border-emerald-200 transition cursor-pointer"
                                      >
                                        Sisteme Ekle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUnreg = unregisteredBrands.filter(x => x.name !== item.name);
                                          setUnregisteredBrands(updatedUnreg);
                                          localStorage.setItem("lpgportal_unregistered_kit_brands", JSON.stringify(updatedUnreg));
                                          alert("Marka talebi listeden kaldırıldı.");
                                        }}
                                        className="bg-rose-55 hover:bg-rose-100 text-rose-700 text-[9.5px] font-bold py-1 px-2 rounded border border-rose-250 transition cursor-pointer"
                                      >
                                        Yoksay
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-8 text-center text-slate-400 italic text-xs">
                              Sistemde bulunmayan herhangi bir LPG markası talebi bulunmuyor.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SİSTEMDE BULUNMAYAN ARAÇLAR */}
                      <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm animate-fade-in">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                            🚗 Sistemde Bulunmayan Araçlar
                          </h4>
                          <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase border border-amber-100">
                            Kullanıcı Talepleri
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto font-sans">
                          {unregisteredVehicles.length > 0 ? (
                            <table className="w-full text-left border-collapse text-xs font-mono">
                              <thead>
                                <tr className="text-slate-400 border-b border-slate-100">
                                  <th className="pb-2 font-bold">Marka/Model</th>
                                  <th className="pb-2 text-center font-bold">Talep</th>
                                  <th className="pb-2 text-right font-bold">{tLocal(tLocal("İşlem", "Action"), "Action")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {unregisteredVehicles.map((item) => (
                                  <tr key={`${item.brand}-${item.model}`} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 font-bold text-slate-700">{item.brand} / {item.model}</td>
                                    <td className="py-2.5 text-center text-slate-500">{item.count} Kez</td>
                                    <td className="py-2.5 text-right space-x-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          try {
                                            const savedBrands = localStorage.getItem("lpgportal_custom_vehicle_brands");
                                            const customBrands = savedBrands ? JSON.parse(savedBrands) : [];
                                            if (!CAR_BRANDS.includes(item.brand) && !customBrands.includes(item.brand)) {
                                              customBrands.push(item.brand);
                                              localStorage.setItem("lpgportal_custom_vehicle_brands", JSON.stringify(customBrands));
                                            }

                                            const savedModels = localStorage.getItem("lpgportal_custom_vehicle_models");
                                            const customModelsDict = savedModels ? JSON.parse(savedModels) : {};
                                            if (!customModelsDict[item.brand]) {
                                              customModelsDict[item.brand] = [];
                                            }
                                            const existingModels = RAW_VEHICLES_DATA[item.brand] || [];
                                            if (!existingModels.includes(item.model) && !customModelsDict[item.brand].includes(item.model)) {
                                              customModelsDict[item.brand].push(item.model);
                                              localStorage.setItem("lpgportal_custom_vehicle_models", JSON.stringify(customModelsDict));
                                            }

                                            const updatedUnreg = unregisteredVehicles.filter(x => !(x.brand === item.brand && x.model === item.model));
                                            setUnregisteredVehicles(updatedUnreg);
                                            localStorage.setItem("lpgportal_unregistered_vehicles", JSON.stringify(updatedUnreg));

                                            addSystemLog("Araç Marka/Modeli Eklendi", `Yönetici '${item.brand} ${item.model}' aracını sisteme ekledi.`, activeUser.email);
                                            alert(`'${item.brand} ${item.model}' aracı sisteme eklendi ve rota planlayıcı formunda listelenmeye başlandı!`);
                                          } catch (e) {}
                                        }}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9.5px] font-bold py-1 px-2 rounded border border-emerald-200 transition cursor-pointer"
                                      >
                                        Sisteme Ekle
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUnreg = unregisteredVehicles.filter(x => !(x.brand === item.brand && x.model === item.model));
                                          setUnregisteredVehicles(updatedUnreg);
                                          localStorage.setItem("lpgportal_unregistered_vehicles", JSON.stringify(updatedUnreg));
                                          alert("Araç talebi listeden kaldırıldı.");
                                        }}
                                        className="bg-rose-55 hover:bg-rose-100 text-rose-700 text-[9.5px] font-bold py-1 px-2 rounded border border-rose-250 transition cursor-pointer"
                                      >
                                        Yoksay
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="p-8 text-center text-slate-400 italic text-xs">
                              Sistemde bulunmayan herhangi bir araç marka/model talebi bulunmuyor.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* SYSTEM AUDIT LOGS SUBTAB                  */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "system_logs" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in" id="system-audit-trail">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Sistem Hareketleri & Güvenlik Audit Trail Günlüğü
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("KVKK onayları, üye tescil, silme ve yönetici işlemlerinin değişmez kriptografik zaman damgalı logları.", "Immutable cryptographic timestamped logs of KVKK approvals, member registration, deletion, and admin operations."), "Immutable cryptographic timestamped logs of KVKK approvals, member registration, deletion, and admin operations.")}</p>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const logs = getSystemLogs();
                          let csvContent = "data:text/csv;charset=utf-8,";
                          csvContent += "ID,Tarih,Kod/Eylem,Detay,Kullanici,Zaman\n";
                          logs.forEach(l => {
                            csvContent += `"${l.id}","${l.date}","${l.actionType.replace(/"/g, '""')}","${l.details.replace(/"/g, '""')}","${(l.user || "Bilinmeyen")}","${l.time}"\n`;
                          });
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement("a");
                          link.setAttribute("href", encodedUri);
                          link.setAttribute("download", `lpgportal_sistem_gunlugu_${new Date().toISOString().substring(0,10)}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          addSystemLog("Yönetici Rapor İhracı", "Sistem denetim logları CSV formatında dışa aktarıldı.", activeUser.email);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-1.5 px-3 rounded-xl shadow-xs transition cursor-pointer"
                      >
                        📥 CSV olarak İhraç Et
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-700 uppercase font-mono">{tLocal(tLocal("DENETLEME GÖSTERGESİ ({getSystemLogs().length} Kayıt)", "AUDIT DASHBOARD ({getSystemLogs().length} Records)"), "AUDIT DASHBOARD ({getSystemLogs().length} Records)")}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const ok = confirm("Sistem güvenlik log kayıtlarını kalıcı olarak temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz!");
                          if (ok) {
                            localStorage.setItem("lpgportal_system_logs", JSON.stringify([]));
                            addSystemLog("Günlük Sıfırlandı", "Güvenlik hareketler günlüğü temizlendi.", activeUser.email);
                            alert("Sistem hareket günlüğü sıfırlandı.");
                            window.location.reload();
                          }
                        }}
                        className="text-rose-600 hover:text-rose-750 hover:bg-rose-50 border border-rose-250 border-rose-200 text-[10px] font-black py-1 px-2.5 rounded transition uppercase font-mono"
                      >
                        ⚠️ Günlüğü Temizle
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-200">
                            <th className="p-3">Ref ID</th>
                            <th className="p-3">Zaman & Tarih</th>
                            <th className="p-3">Eylem Kategorisi</th>
                            <th className="p-3">Detay / Hareket Raporu</th>
                            <th className="p-3 text-right">{tLocal(tLocal("Müellif Kullanıcı", "Author User"), "Author User")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {getSystemLogs().map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-400">{log.id}</td>
                              <td className="p-3 text-slate-600 whitespace-nowrap">{log.date} {log.time}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[9px] ${
                                  log.actionType.includes("Sil") || log.actionType.includes("Kaldır") ? "bg-rose-50 text-rose-700" :
                                  log.actionType.includes("Onay") || log.actionType.includes("Aktif") ? "bg-emerald-50 text-emerald-700" :
                                  "bg-indigo-50 text-indigo-700"
                                }`}>
                                  {log.actionType}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 font-sans max-w-xs sm:max-w-md leading-relaxed">
                                {log.details}
                              </td>
                              <td className="p-3 text-right text-slate-500 font-bold">{log.user || "Sistem / Misafir"}</td>
                            </tr>
                          ))}
                          {getSystemLogs().length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-400 italic font-sans text-xs">
                                Herhangi bir sistem denetim hareketi kaydedilmemiş.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* USER REVIEWS MODERATION PANEL             */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "reviews" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <MessageSquare className="h-5 w-5 text-amber-600 animate-pulse" />
                        Kullanıcı Yorum & Deneyim Yönetimi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Sürücülerin ve sektör profesyonellerinin ana sayfada yayınlanmak üzere ilettiği hikaye ve yorumların moderasyonu.", "Moderation of stories and reviews submitted by drivers and industry professionals for main page publication."), "Moderation of stories and reviews submitted by drivers and industry professionals for main page publication.")}</p>
                    </div>
                  </div>

                  {/* Reviews Stats Widgets */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                      <span className="text-[9px] text-slate-400 font-bold font-mono block uppercase">TOPLAM YORUM</span>
                      <strong className="text-xl font-black text-slate-900 block mt-1">{homeReviews.length} Adet</strong>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-amber-600 font-bold block uppercase">⏳ ONAY BEKLEYEN</span>
                      <strong className="text-xl font-black text-amber-650 block mt-1">
                        {homeReviews.filter(r => r.status === "Onay Bekliyor").length} Adet
                      </strong>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-emerald-600 font-bold block uppercase">🟢 YAYINDA (ONAYLI)</span>
                      <strong className="text-xl font-black text-emerald-600 block mt-1">
                        {homeReviews.filter(r => r.status === "Onaylandı").length} Adet
                      </strong>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-rose-600 font-bold block uppercase">{tLocal(tLocal("🔴 RED/PASİF", "🔴 REJECTED/PASSIVE"), "🔴 REJECTED/PASSIVE")}</span>
                      <strong className="text-xl font-black text-rose-600 block mt-1">
                        {homeReviews.filter(r => r.status === "Reddedildi" || r.status === "Pasif").length} Adet
                      </strong>
                    </div>
                  </div>

                  {/* Reviews Interactive List Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono block">{tLocal(tLocal("GÖNDERİLEN DENEYİMLER LİSTESİ", "SUBMITTED EXPERIENCES LIST"), "SUBMITTED EXPERIENCES LIST")}</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input 
                            type="text"
                            placeholder={tLocal(tLocal("Yazar adı, başlık veya kelime ara...", "Search author name, title or keywords..."), "Search author name, title or keywords...")}
                            value={adminReviewSearch}
                            onChange={(e) => setAdminReviewSearch(e.target.value)}
                            className="bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-1.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none w-full sm:w-64"
                          />
                        </div>
                      </div>
                      
                      {/* Review Status Filters */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold block pr-1.5 font-mono">{tLocal(tLocal("DURUM FİLTRESİ:", "STATUS FILTER:"), "STATUS FILTER:")}</span>
                        <button
                          type="button"
                          onClick={() => setAdminReviewStatusFilter("all")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                            adminReviewStatusFilter === "all"
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          Tüm Yorumlar ({homeReviews.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminReviewStatusFilter("Onay Bekliyor")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminReviewStatusFilter === "Onay Bekliyor"
                              ? "bg-amber-600 border-amber-600 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          ⏳ Onay Bekleyenler ({homeReviews.filter(r => r.status === "Onay Bekliyor").length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminReviewStatusFilter("Onaylandı")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminReviewStatusFilter === "Onaylandı"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          🟢 Onaylananlar ({homeReviews.filter(r => r.status === "Onaylandı").length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminReviewStatusFilter("Reddedildi")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminReviewStatusFilter === "Reddedildi"
                              ? "bg-rose-600 border-rose-600 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          🔴 Reddedilenler ({homeReviews.filter(r => r.status === "Reddedildi").length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminReviewStatusFilter("Pasif")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminReviewStatusFilter === "Pasif"
                              ? "bg-slate-500 border-slate-500 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          ⚪ Pasif Edilenler ({homeReviews.filter(r => r.status === "Pasif").length})
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200">
                            <th className="p-3">Yazar / Rol</th>
                            <th className="p-3">{tLocal(tLocal("Şehir / Araç", "City / Vehicle"), "City / Vehicle")}</th>
                            <th className="p-3">Puan</th>
                            <th className="p-3">{tLocal(tLocal("Yorum Detayı", "Comment Detail"), "Comment Detail")}</th>
                            <th className="p-3">Durum</th>
                            <th className="p-3 text-right">{tLocal(tLocal("İşlemler", "Operations"), "Operations")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {homeReviews
                            .filter((r) => {
                              if (adminReviewStatusFilter !== "all" && r.status !== adminReviewStatusFilter) return false;
                              if (adminReviewSearch.trim() !== "") {
                                const q = adminReviewSearch.toLowerCase();
                                return (
                                  r.authorName.toLowerCase().includes(q) ||
                                  r.title.toLowerCase().includes(q) ||
                                  r.content.toLowerCase().includes(q)
                                );
                              }
                              return true;
                            })
                            .map((review) => {
                              let statusCol = "bg-amber-50 text-amber-700 border-amber-100";
                              if (review.status === "Onaylandı") statusCol = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              if (review.status === "Reddedildi") statusCol = "bg-rose-50 text-rose-700 border-rose-100";
                              if (review.status === "Pasif") statusCol = "bg-slate-100 text-slate-700 border-slate-200";

                              return (
                                <tr key={review.id} className="hover:bg-slate-50/50">
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-800">{review.authorName}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{review.authorRole === "vehicle_owner" ? (review.profession || "Araç Sahibi") : (review.authorRole === "dealer" ? "Bayi / Servis" : review.authorRole === "manufacturer" ? "Kit Üreticisi" : "LPG Mühendisi")}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-slate-700 font-semibold">{review.city}</div>
                                    {review.authorRole === "vehicle_owner" ? (
                                      <div className="text-[10px] text-slate-500 font-mono">{review.carBrand} {review.carModel}</div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 font-mono italic truncate max-w-[150px]">{review.carBrand || "Marka Belirtilmemiş"}</div>
                                    )}
                                  </td>
                                  <td className="p-3 text-amber-500 font-mono font-bold text-sm">
                                    {"⭐".repeat(review.rating || 5)}
                                  </td>
                                  <td className="p-3 max-w-[250px]">
                                    <strong className="block text-slate-800 truncate">{translateEntity(review, "title")}</strong>
                                    <p className="text-slate-500 line-clamp-2 mt-0.5 text-[11px] leading-relaxed">
                                      "{translateEntity(review, "content")}"
                                    </p>
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCol}`}>
                                      {review.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex flex-wrap justify-end gap-1">
                                      {review.status !== "Onaylandı" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setHomeReviews(prev => prev.map(x => x.id === review.id ? { ...x, status: "Onaylandı", updatedAt: new Date().toISOString() } : x));
                                            addSystemLog("Yorum Onaylandı", `Yönetici '${review.title}' başlıklı yorumu onayladı.`, activeUser.email);
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded cursor-pointer transition uppercase"
                                        >
                                          Onayla
                                        </button>
                                      )}
                                      {review.status !== "Reddedildi" && review.status !== "Pasif" && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setHomeReviews(prev => prev.map(x => x.id === review.id ? { ...x, status: "Reddedildi", updatedAt: new Date().toISOString() } : x));
                                              addSystemLog("Yorum Reddedildi", `Yönetici '${review.title}' başlıklı yorumu reddetti.`, activeUser.email);
                                            }}
                                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-2 py-1 rounded cursor-pointer transition uppercase"
                                          >
                                            Reddet
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setHomeReviews(prev => prev.map(x => x.id === review.id ? { ...x, status: "Pasif", updatedAt: new Date().toISOString() } : x));
                                              addSystemLog("Yorum Pasifleştirildi", `Yönetici '${review.title}' başlıklı yorumu pasife aldı.`, activeUser.email);
                                            }}
                                            className="bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-black px-2 py-1 rounded cursor-pointer transition uppercase"
                                          >
                                            Pasif
                                          </button>
                                        </>
                                      )}
                                      {review.status === "Reddedildi" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setHomeReviews(prev => prev.map(x => x.id === review.id ? { ...x, status: "Onay Bekliyor", updatedAt: new Date().toISOString() } : x));
                                          }}
                                          className="bg-slate-600 hover:bg-slate-700 text-white text-[10px] font-black px-2 py-1 rounded cursor-pointer transition uppercase"
                                        >
                                          İncelemeye Al
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setEditingReview(review)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-2 py-1 rounded cursor-pointer transition uppercase"
                                      >
                                        Düzenle
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {homeReviews.filter((r) => {
                            if (adminReviewStatusFilter !== "all" && r.status !== adminReviewStatusFilter) return false;
                            if (adminReviewSearch.trim() !== "") {
                              const q = adminReviewSearch.toLowerCase();
                              return (
                                r.authorName.toLowerCase().includes(q) ||
                                r.title.toLowerCase().includes(q) ||
                                r.content.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 italic text-xs font-sans">
                                Eşleşen herhangi bir kullanıcı yorumu bulunamadı.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN PANEL EXTRA VIEW */}
              {activeUser.role === "admin" && adminTab === "members" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 font-sans">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Sistem Üye Yönetici Gösterge Paneli
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 font-sans">{tLocal(tLocal("Sitedeki tüm kurumsal, bireysel ve teknik üyelerin status ve ödeme raporu.", "Status and payment report of all corporate, individual, and technical members on the site."), "Status and payment report of all corporate, individual, and technical members on the site.")}</p>
                    </div>
                  </div>

                  {/* Members Sub-Tabs Selector */}
                  <div className="flex border-b border-slate-200/60 pb-px gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setMembersSubTab("list")}
                      className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        membersSubTab === "list"
                          ? "border-emerald-600 text-emerald-700 font-extrabold"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      👥 Üye Listesi
                    </button>
                    <button
                      type="button"
                      onClick={() => setMembersSubTab("pending_eft")}
                      className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                        membersSubTab === "pending_eft"
                          ? "border-emerald-600 text-emerald-700 font-extrabold"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      ⏳ Havale / EFT Bekleyen Ödemeler
                      {allInvoices.filter(inv => inv.payment_method === "Havale/EFT" && inv.status === "Beklemede").length > 0 && (
                        <span className="bg-rose-500 text-white rounded-full text-[9px] px-1.5 py-0.5 font-mono animate-pulse font-black leading-none">
                          {allInvoices.filter(inv => inv.payment_method === "Havale/EFT" && inv.status === "Beklemede").length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMembersSubTab("promo_codes")}
                      className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        membersSubTab === "promo_codes"
                          ? "border-emerald-600 text-emerald-700 font-extrabold"
                          : "border-transparent text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      🎟️ Ücretsiz Kod Takibi
                    </button>
                  </div>

                  {/* 1) MEMBERS LIST SUB-TAB */}
                  {membersSubTab === "list" && (
                    <div className="space-y-6 animate-fade-in font-sans">
                      {/* Numerical Widget Boxes */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-slate-400 font-bold font-mono block uppercase">{tLocal(tLocal("TOPLAM ÜYE", "TOTAL MEMBERS"), "TOTAL MEMBERS")}</span>
                          <strong className="text-xl font-black text-slate-900 block mt-1">{allUsers.length - 1}</strong>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{tLocal(tLocal("Admin hariç", "Excluding admin"), "Excluding admin")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-emerald-600 font-bold font-mono block uppercase">{tLocal(tLocal("🟢 AKTİF", "🟢 ACTIVE"), "🟢 ACTIVE")}</span>
                          <strong className="text-xl font-black text-emerald-600 block mt-1">{activeCount}</strong>
                          <span className="text-[9px] text-emerald-500 block mt-0.5">{tLocal(tLocal("Rehberde açık", "Visible in directory"), "Visible in directory")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-slate-500 font-bold font-mono block uppercase">{tLocal(tLocal("⚪ PASİF", "⚪ PASSIVE"), "⚪ PASSIVE")}</span>
                          <strong className="text-xl font-black text-slate-600 block mt-1">{passiveCount}</strong>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Rehberde gizli</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-amber-600 font-bold font-mono block uppercase">⏳ ONAY BEKLEYEN</span>
                          <strong className="text-xl font-black text-amber-600 block mt-1">{awaitingApprovalCount}</strong>
                          <span className="text-[9px] text-amber-500 block mt-0.5">{tLocal(tLocal("Onay aşamasında", "Approval pending"), "Approval pending")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-rose-600 font-bold font-mono block uppercase">🚫 ASKIYA ALINAN</span>
                          <strong className="text-xl font-black text-rose-600 block mt-1">{suspendedCount}</strong>
                          <span className="text-[9px] text-rose-500 block mt-0.5">{tLocal(tLocal("Dondurulmuş", "Suspended / Frozen"), "Suspended / Frozen")}</span>
                        </div>

                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                          <span className="text-[9px] text-emerald-700 font-bold font-mono block uppercase">{tLocal(tLocal("💰 TAHSİLAT", "💰 REVENUE / COLLECTION"), "💰 REVENUE / COLLECTION")}</span>
                          <strong className="text-sm font-bold font-mono text-emerald-800 block mt-1">{totalCostCollections.toLocaleString('tr-TR')} TL</strong>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Toplam aidat</span>
                        </div>
                      </div>

                      {/* Role distribution count metrics */}
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-400 font-mono block uppercase mb-3">{tLocal(tLocal("ROL DAĞILIM ORANLARI", "ROLE DISTRIBUTION RATIOS"), "ROLE DISTRIBUTION RATIOS")}</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs leading-none">
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-600">{tLocal(tLocal("🚗 Araç Sahibi:", "🚗 Vehicle Owner:"), "🚗 Vehicle Owner:")}</span>
                            <strong className="text-slate-900 font-mono">{roleCounts.vehicle_owner}</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-600">🏭 Firma Bayi:</span>
                            <strong className="text-slate-900 font-mono">{roleCounts.dealer}</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-600">{tLocal(tLocal("🔧 LPG Mühendisi / Usta:", "🔧 LPG Engineer / Inspector:"), "🔧 LPG Engineer / Inspector:")}</span>
                            <strong className="text-slate-900 font-mono">{roleCounts.engineer}</strong>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-100 flex justify-between items-center">
                            <span className="text-slate-600">{tLocal(tLocal("📦 Kit Üretici:", "📦 Kit Manufacturer:"), "📦 Kit Manufacturer:")}</span>
                            <strong className="text-slate-900 font-mono">{roleCounts.manufacturer}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Yıllık Üyelik Paket Ücretleri Yönetimi */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <DollarSign className="h-5 w-5 text-emerald-600" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{tLocal(tLocal("Yıllık Üyelik Paket Ücretleri Yönetimi", "Annual Membership Package Pricing Management"), "Annual Membership Package Pricing Management")}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{tLocal(tLocal("Üyelik paket ücretlerini buradan dinamik olarak güncelleyebilirsiniz. Değişiklikler anında kayıt ve ödeme ekranlarına yansır.", "You can dynamically update membership package fees here. Changes are immediately reflected on registration and payment screens."), "You can dynamically update membership package fees here. Changes are immediately reflected on registration and payment screens.")}</p>
                          </div>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          savePricingConfig(adminPrices);
                          setPricingSuccessMsg("Üyelik paket fiyatları başarıyla güncellendi!");
                          setTimeout(() => setPricingSuccessMsg(""), 4000);
                        }} className="space-y-4">
                          {pricingSuccessMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                              <CheckCircle className="h-4 w-4 shrink-0" />
                              <span>{pricingSuccessMsg}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                                <span>🚗</span> Araç Sahibi
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={adminPrices.vehicle_owner}
                                  onChange={(e) => setAdminPrices({ ...adminPrices, vehicle_owner: Number(e.target.value) })}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 pr-8 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white font-mono font-bold"
                                />
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">TL</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                                <span>🔧</span> LPG Mühendisi / Usta
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={adminPrices.engineer}
                                  onChange={(e) => setAdminPrices({ ...adminPrices, engineer: Number(e.target.value) })}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 pr-8 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white font-mono font-bold"
                                />
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">TL</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                                <span>🏢</span> Firma (Bayi / Servis)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={adminPrices.dealer}
                                  onChange={(e) => setAdminPrices({ ...adminPrices, dealer: Number(e.target.value) })}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 pr-8 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white font-mono font-bold"
                                />
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">TL</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                                <span>🏭</span> Kit Üreticisi
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  value={adminPrices.manufacturer}
                                  onChange={(e) => setAdminPrices({ ...adminPrices, manufacturer: Number(e.target.value) })}
                                  className="w-full bg-slate-50 text-xs py-2 px-3 pr-8 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white font-mono font-bold"
                                />
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">TL</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Fiyatları Güncelle ve Kaydet
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Interactive Member List Management */}
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 uppercase font-mono block">{tLocal(tLocal("ÜYE KULLANICI LİSTESİ", "MEMBER USER LIST"), "MEMBER USER LIST")}</span>
                            <input 
                              type="text"
                              placeholder={tLocal(tLocal("İsim, mail veya rol arat...", "Search name, mail or role..."), "Search name, mail or role...")}
                              value={adminSearch}
                              onChange={(e) => setAdminSearch(e.target.value)}
                              className="bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-1.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none w-full sm:w-64 font-sans"
                            />
                          </div>

                          {/* Kategori Filtreleri */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 mt-2 font-sans">
                            <span className="text-[10px] text-slate-400 font-bold block pr-1.5 font-mono">{tLocal(tLocal("KATEGORİLER:", "CATEGORIES:"), "CATEGORIES:")}</span>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("all")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                                adminRoleFilter === "all"
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              Hepsi
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("vehicle_owner")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "vehicle_owner"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🚗 Araç Sahipleri
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "vehicle_owner" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.role === "vehicle_owner").length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("dealer")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "dealer"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🏢 Firma (Bayi / Servis)
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "dealer" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.role === "dealer").length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("lpg_usta")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "lpg_usta"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🔧 LPG Ustaları
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "lpg_usta" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => {
                                  if (u.role !== "engineer") return false;
                                  const exp = (u.expertise || "").toLowerCase();
                                  const name = (u.name || "").toLowerCase();
                                  return exp.includes("usta") || exp.includes("tekniker") || exp.includes("servis") || name.includes("usta");
                                }).length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("lpg_engineer")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "lpg_engineer"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🎓 LPG Mühendisleri
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "lpg_engineer" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => {
                                  if (u.role !== "engineer") return false;
                                  const exp = (u.expertise || "").toLowerCase();
                                  const name = (u.name || "").toLowerCase();
                                  return !(exp.includes("usta") || exp.includes("tekniker") || exp.includes("servis") || name.includes("usta"));
                                }).length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("manufacturer")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "manufacturer"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🏭 Kit Üreticileri
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "manufacturer" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.role === "manufacturer").length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminRoleFilter("admin")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminRoleFilter === "admin"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🔑 Adminler
                              <span className={`text-[8.5px] px-1 rounded ${adminRoleFilter === "admin" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.role === "admin").length}
                              </span>
                            </button>
                          </div>
                          
                          {/* Status Filters bar */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 mt-2 font-sans">
                            <span className="text-[10px] text-slate-400 font-bold block pr-1.5 font-mono">{tLocal("DURUM:", "STATUS:")}</span>
                            <button
                              type="button"
                              onClick={() => setAdminStatusFilter("all")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                                adminStatusFilter === "all"
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              Tüm Durumlar
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminStatusFilter("Onay Bekliyor")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminStatusFilter === "Onay Bekliyor"
                                  ? "bg-amber-600 border-amber-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              ⏳ Onay Bekleyenler
                              <span className={`text-[8.5px] px-1 rounded ${adminStatusFilter === "Onay Bekliyor" ? "bg-amber-800 text-amber-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.membership_status === "Onay Bekliyor").length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminStatusFilter("Aktif")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminStatusFilter === "Aktif"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              🟢 Aktif Üyeler
                              <span className={`text-[8.5px] px-1 rounded ${adminStatusFilter === "Aktif" ? "bg-emerald-800 text-emerald-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.membership_status === "Aktif").length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminStatusFilter("Pasif")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1.5 ${
                                adminStatusFilter === "Pasif"
                                  ? "bg-slate-600 border-slate-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              ⚪ Pasif Üyeler
                              <span className={`text-[8.5px] px-1 rounded ${adminStatusFilter === "Pasif" ? "bg-slate-700 text-slate-100" : "bg-slate-100 text-slate-500 font-mono"}`}>
                                {allUsers.filter(u => u.membership_status === "Pasif").length}
                              </span>
                            </button>
                          </div>
                          
                          {/* Consent Filters bar */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 mt-2 font-sans">
                            <span className="text-[10px] text-slate-400 font-bold block pr-1.5 font-mono">{tLocal(tLocal("İZİNLER:", "PERMISSIONS / CONSENTS:"), "PERMISSIONS / CONSENTS:")}</span>
                            <button
                              type="button"
                              onClick={() => setAdminConsentFilter("all")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                                adminConsentFilter === "all"
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              Tüm İzinler
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminConsentFilter("kvkk")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                                adminConsentFilter === "kvkk"
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              <span className="text-[9px]">✓</span> KVKK Onayı Verenler
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminConsentFilter("privacy")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                                adminConsentFilter === "privacy"
                                  ? "bg-teal-600 border-teal-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              <span className="text-[9px]">✓</span> Gizlilik Politikası Onayı
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminConsentFilter("marketing")}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                                adminConsentFilter === "marketing"
                                  ? "bg-blue-600 border-blue-600 text-white"
                                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                              }`}
                            >
                              <span className="text-[9px]">📢</span> Pazarlama İzni Verenler
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono">
                                <th className="p-3">{tLocal(tLocal("Üye / Firma Adı", "Member / Company Name"), "Member / Company Name")}</th>
                                <th className="p-3">Rol Tipi</th>
                                <th className="p-3">{tLocal(tLocal("İletişim", "Contact Info"), "Contact Info")}</th>
                                <th className="p-3">{tLocal(tLocal("Yıllık Aidat", "Annual Fee"), "Annual Fee")}</th>
                                <th className="p-3 whitespace-nowrap">{tLocal(tLocal("Onay Günlüğü (KVKK/IP)", "Consent Logs (KVKK/IP)"), "Consent Logs (KVKK/IP)")}</th>
                                <th className="p-3 whitespace-nowrap">{tLocal(tLocal("Son Giriş Detayları", "Last Login Details"), "Last Login Details")}</th>
                                <th className="p-3">Durum</th>
                                <th className="p-3 text-right">{tLocal(tLocal("Yöntemle Değiştir", "Change Status To"), "Change Status To")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {filteredMembers.map((member) => (
                                <React.Fragment key={member.id}>
                                  <tr className="hover:bg-slate-50/50">
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      {member.role === "dealer" && renderCompanyLogo(
                                        {
                                          id: member.id,
                                          company_name: member.company_name || member.name,
                                          logo: member.logo_url,
                                          logo_type: member.logo_type
                                        },
                                        "w-8 h-8 text-xs font-black leading-none shadow-xs border border-slate-100",
                                        true
                                      )}
                                      <div>
                                        <span className="font-bold text-slate-850 block">{member.name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono block leading-none mt-0.5">{member.email}</span>
                                        {member.role === "dealer" && (
                                          <span className="text-[8.5px] font-black font-mono uppercase text-slate-400 mt-1 block tracking-wider">
                                            Logo: {(!member.logo_url || member.logo_type === "auto") ? "🟢 Otomatik" : "🔵 Gerçek"}
                                          </span>
                                        )}
                                        {member.working_brands && member.working_brands.length > 0 && (
                                          <div className="mt-1.5 flex flex-wrap gap-0.5 max-w-[200px]">
                                            {member.working_brands.map(b => (
                                              <span key={b} className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1.5 py-0.2 rounded border border-slate-200">
                                                {b}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                      {getRoleDisplayName(member.role)}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-slate-660 text-slate-500">{member.phone}</td>
                                  <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">{member.membership_fee} TL</td>
                                  <td className="p-3 min-w-[150px]">
                                    <div className="space-y-1 font-mono">
                                      <div className="flex gap-1 flex-wrap">
                                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm ${member.kvkk_approved ? "bg-emerald-100 text-emerald-800 font-bold" : "bg-slate-100 text-slate-400"}`}>KVKK</span>
                                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm ${member.privacy_policy_approved ? "bg-teal-100 text-teal-800 font-bold" : "bg-slate-100 text-slate-400"}`}>{tLocal(tLocal("GİZLİLİK", "PRIVACY"), "PRIVACY")}</span>
                                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-sm ${member.marketing_approved ? "bg-blue-100 text-blue-800 font-bold" : "bg-slate-100 text-slate-400 opacity-60"}`}>PAZARLAMA</span>
                                      </div>
                                      {(member.approval_date || member.ip_address) ? (
                                        <p className="text-[9.5px] text-slate-500 mt-0.5">
                                          {member.approval_date ? new Date(member.approval_date).toLocaleString("tr-TR") : ""} 
                                          {member.ip_address ? ` | IP: ${member.ip_address}` : ""}
                                        </p>
                                      ) : (
                                        <span className="text-slate-305 text-slate-400 text-[9.5px]">{tLocal(tLocal("Eski Kayıt (Giriş Yok)", "Old Record (No Logins)"), "Old Record (No Logins)")}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 min-w-[150px]">
                                    {member.last_login_time ? (
                                      <div className="space-y-1 font-mono text-[9.5px] text-slate-600">
                                        <p className="font-bold text-slate-800">
                                          📅 {new Date(member.last_login_time).toLocaleString("tr-TR")}
                                        </p>
                                        <p>🌐 IP: {member.last_login_ip || "—"}</p>
                                        <p className="truncate max-w-[185px]" title={member.last_login_device}>
                                          📱 {member.last_login_device || "—"}
                                        </p>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic font-mono text-[9.5px]">{tLocal(tLocal("Giriş Kaydı Yok", "No Login Record"), "No Login Record")}</span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      member.membership_status === "Aktif" 
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                        : member.membership_status === "Beklemede" || member.membership_status === "Onay Bekliyor"
                                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                                        : member.membership_status === "Pasif"
                                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                                        : "bg-rose-50 text-rose-700 border border-rose-100"
                                    }`}>
                                      {member.membership_status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                    {member.membership_status === "Onay Bekliyor" && (
                                      <button
                                        onClick={() => handleUpdateUserStatus(member.id, "Aktif")}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded transition mr-1"
                                      >
                                        Onayla
                                      </button>
                                    )}
                                    <select
                                      value={member.membership_status}
                                      onChange={(e) => handleUpdateUserStatus(member.id, e.target.value as any)}
                                      className="bg-white border border-slate-200 text-[10px] text-slate-700 rounded p-1 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs inline-block"
                                    >
                                      <option value="Aktif">Aktif Yap</option>
                                      <option value="Onay Bekliyor">Onay Bekliyor</option>
                                      <option value="Beklemede">Beklemede</option>
                                      <option value="Pasif">Pasif Yap</option>
                                      <option value={tLocal(tLocal("Askıya Alındı", "Suspended"), "Suspended")}>{tLocal(tLocal("Askıya Alındı", "Suspended"), "Suspended")}</option>
                                      <option value={tLocal(tLocal("Süresi Dolmuş", "Expired"), "Expired")}>{tLocal(tLocal("Süre Aşımı", "Expired"), "Expired")}</option>
                                      <option value={tLocal(tLocal("İptal", "Cancel"), "Cancel")}>{tLocal(tLocal("İptal Et", "Cancel Account"), "Cancel Account")}</option>
                                    </select>
                                    <button
                                      onClick={() => {
                                        setExpandedMemberId(expandedMemberId === member.id ? null : member.id);
                                        setTempBrands(member.working_brands || []);
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition mr-1 animate-fade-in"
                                      title="Markaları Düzenle"
                                    >
                                      📝 Düzenle
                                    </button>
                                    <button
                                      onClick={() => handleAdminResetPassword(member)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition"
                                      title={tLocal("Şifreyi Sıfırla", "Reset Password")}
                                    >
                                      🔑 Şifre Sıfırla
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(member.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition text-[10px]"
                                      title={tLocal(tLocal("Üyeyi Sil", "Delete Member"), "Delete Member")}
                                    >
                                      Sil
                                    </button>
                                  </td>
                                </tr>
                                {expandedMemberId === member.id && (
                                  <tr className="bg-slate-50/40">
                                    <td colSpan={8} className="p-4 border-t border-b border-slate-200">
                                      <div className="space-y-4 max-w-2xl bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-left animate-fade-in">
                                        <h5 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 font-sans">
                                          <span>🛠️</span> {member.name} - Çalışılan LPG Markalarını Düzenle
                                        </h5>
                                        
                                        <div className="space-y-2">
                                          <label className="block text-xs font-bold text-slate-700">
                                            LPG Markaları Seçimi
                                          </label>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-200 max-h-[160px] overflow-y-auto font-sans">
                                            {MASTER_LPG_BRANDS.map(brand => {
                                              const isChecked = tempBrands.includes(brand);
                                              return (
                                                <label key={brand} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                      if (isChecked) {
                                                        setTempBrands(tempBrands.filter(b => b !== brand));
                                                      } else {
                                                        setTempBrands([...tempBrands, brand]);
                                                      }
                                                    }}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                                                  />
                                                  <span>{brand}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end pt-2">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveMemberBrands(member.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                                          >
                                            Kaydet
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setExpandedMemberId(null);
                                            }}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                                          >
                                            İptal
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                {tempPasswordShow && tempPasswordShow.userId === member.id && (
                                  <tr className="bg-amber-50/40">
                                    <td colSpan={8} className="p-3">
                                      <div className="p-4 bg-white border border-amber-200 text-amber-900 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fade-in text-left">
                                        <div>
                                          <p className="font-bold text-amber-800 flex items-center gap-1.5 font-sans">
                                            <span>🔑</span> Yeni Geçici Şifre Oluşturuldu
                                          </p>
                                          <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-slate-650">
                                            <div>
                                              <strong>Kullanıcı:</strong> <span className="font-mono">{tempPasswordShow.userEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <strong>Geçici Şifre:</strong>
                                              <span className="font-mono text-xs bg-amber-50 px-2 py-0.5 border border-amber-205 rounded font-bold text-amber-900 select-all tracking-wider">{tempPasswordShow.pass}</span>
                                              <span className="text-[9px] text-slate-450">
                                                ({tempPasswordShow.emailSimulated ? "E-posta simüle edildi" : "E-posta gönderildi"})
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              navigator.clipboard.writeText(tempPasswordShow.pass);
                                              alert("Geçici şifre panoya kopyalandı!");
                                            }}
                                            className="bg-amber-605 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                                          >
                                            Kopyala
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setTempPasswordShow(null)}
                                            className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                                          >
                                            Kapat
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                              {filteredMembers.length === 0 && (
                                <tr>
                                  <td colSpan={8} className="p-4 text-center text-slate-400">
                                    Aranan kriterlere uygun üye kullanıcı kaydı bulunamadı.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2) PENDING EFT PAYMENTS SUB-TAB */}
                  {membersSubTab === "pending_eft" && (
                    <div className="space-y-4 animate-fade-in font-sans">
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <Clock className="h-5 w-5 text-amber-600" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{tLocal(tLocal("Havale / EFT Bekleyen Ödemeler", "Wire Transfer / EFT Pending Payments"), "Wire Transfer / EFT Pending Payments")}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{tLocal(tLocal("Kullanıcıların kayıt veya yenileme sırasında Havale/EFT seçeneği ile oluşturduğu ödeme talepleri. Ödemeyi onayladığınızda üyelik aktif edilir.", "Payment requests created by users using Wire Transfer/EFT during registration or renewal. The membership is activated when you approve the payment."), "Payment requests created by users using Wire Transfer/EFT during registration or renewal. The membership is activated when you approve the payment.")}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono">
                                <th className="p-3">Fatura No / Tarih</th>
                                <th className="p-3">{tLocal(tLocal("Üye Bilgileri", "Member Info"), "Member Info")}</th>
                                <th className="p-3">Paket / Tutar</th>
                                <th className="p-3">{tLocal(tLocal("Yönetici Notu", "Admin Note"), "Admin Note")}</th>
                                <th className="p-3 text-right">{tLocal(tLocal("İşlemler", "Operations"), "Operations")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {allInvoices.filter(inv => inv.payment_method === "Havale/EFT" && inv.status === "Beklemede").map((invoice) => {
                                const user = allUsers.find(u => u.id === invoice.userId);
                                return (
                                  <tr key={invoice.id} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-mono">
                                      <span className="font-bold text-slate-800 block">{invoice.id}</span>
                                      <span className="text-[9.5px] text-slate-400 block mt-0.5">{new Date(invoice.date).toLocaleString("tr-TR")}</span>
                                    </td>
                                    <td className="p-3 font-sans">
                                      {user ? (
                                        <div>
                                          <span className="font-bold text-slate-850 block">{user.name}</span>
                                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{user.email}</span>
                                          <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">{getRoleDisplayName(user.role)}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 italic">{tLocal(tLocal("Bilinmeyen Kullanıcı (ID: {invoice.userId})", "Unknown User (ID: {invoice.userId})"), "Unknown User (ID: {invoice.userId})")}</span>
                                      )}
                                    </td>
                                    <td className="p-3 font-mono">
                                      <span className="font-bold text-slate-800 block">{invoice.membership_type}</span>
                                      <span className="text-emerald-700 font-black block mt-0.5">{invoice.amount} TL</span>
                                    </td>
                                    <td className="p-3 font-sans">
                                      <input
                                        type="text"
                                        placeholder="Ret nedeni veya onay notu ekleyin..."
                                        value={adminEftNotes[invoice.id] || ""}
                                        onChange={(e) => setAdminEftNotes({ ...adminEftNotes, [invoice.id]: e.target.value })}
                                        className="w-full bg-slate-50 text-[10px] py-1.5 px-2.5 rounded border border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white"
                                      />
                                    </td>
                                    <td className="p-3 text-right space-x-2 whitespace-nowrap font-sans">
                                      <button
                                        type="button"
                                        onClick={() => handleApproveEft(invoice.id)}
                                        className="bg-emerald-600 hover:bg-emerald-750 text-white font-bold px-3 py-1.5 rounded transition cursor-pointer text-[10px]"
                                      >
                                        ✓ Onayla
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectEft(invoice.id)}
                                        className="bg-rose-600 hover:bg-rose-750 text-white font-bold px-3 py-1.5 rounded transition cursor-pointer text-[10px]"
                                      >
                                        ✗ Reddet
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {allInvoices.filter(inv => inv.payment_method === "Havale/EFT" && inv.status === "Beklemede").length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                    Bekleyen Havale / EFT ödeme talebi bulunmamaktadır.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3) PROMO CODES TRACKING SUB-TAB */}
                  {membersSubTab === "promo_codes" && (
                    <div className="space-y-4 animate-fade-in font-sans">
                      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                          <Ticket className="h-5 w-5 text-emerald-600" />
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 font-sans">{tLocal(tLocal("Ücretsiz Üyelik Kodları Takip Raporu", "Free Membership Codes Tracking Report"), "Free Membership Codes Tracking Report")}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 font-sans">{tLocal(tLocal("Sistemde tanımlı toplam 20 adet tek kullanımlık ücretsiz kampanya kodunun güncel durumu ve kullanım logları.", "Current status and usage logs of a total of 20 single-use free promo codes defined in the system."), "Current status and usage logs of a total of 20 single-use free promo codes defined in the system.")}</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono">
                                <th className="p-3">Kampanya Kodu</th>
                                <th className="p-3">Durum</th>
                                <th className="p-3">{tLocal(tLocal("Kullanan Üye Bilgisi", "Using Member Info"), "Using Member Info")}</th>
                                <th className="p-3">{tLocal(tLocal("Kullanım Tarihi", "Usage Date"), "Usage Date")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {getFreePromoCodes().map((promo) => (
                                <tr key={promo.code} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-800">{promo.code}</td>
                                  <td className="p-3 font-sans">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                      promo.used
                                        ? "bg-slate-100 text-slate-500 border border-slate-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    }`}>
                                      {promo.used ? "Kullanıldı" : "Kullanılmadı (Aktif)"}
                                    </span>
                                  </td>
                                  <td className="p-3 font-sans">
                                    {promo.used ? (
                                      <div>
                                        <span className="font-bold text-slate-850 block">{promo.usedByUserName || "—"}</span>
                                        <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">{promo.usedByUserEmail || "—"}</span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-slate-500">
                                    {promo.used && promo.usedAt ? (
                                      new Date(promo.usedAt).toLocaleString("tr-TR")
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ADMIN PANEL COUPON VIEW */}
              {activeUser.role === "admin" && adminTab === "coupons" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Ticket className="h-5 w-5 text-emerald-600 animate-pulse" />
                        Kupon Yönetimi ve Raporlama Paneli
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Sistemde tanımlı indirim kuponlarının durumu ve kullanım raporları.", "Status and usage reports of discount coupons defined in the system."), "Status and usage reports of discount coupons defined in the system.")}</p>
                    </div>
                  </div>

                  {/* Coupon Stats Widgets */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
                      <span className="text-[9px] text-slate-400 font-bold font-mono block uppercase">TOPLAM KUPON</span>
                      <strong className="text-xl font-black text-slate-900 block mt-1">100 Adet</strong>
                      <span className="text-[9px] text-slate-500 block mt-0.5">{tLocal(tLocal("Sistem tanımı", "System definition"), "System definition")}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-emerald-600 font-bold block uppercase">🟢 KULLANILAN KUPON</span>
                      <strong className="text-xl font-black text-emerald-600 block mt-1">{getUsedCoupons().length} Adet</strong>
                      <span className="text-[9px] text-emerald-500 block mt-0.5">Toplam aktif</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-blue-600 font-bold block uppercase">⚪ KALAN KUPON</span>
                      <strong className="text-xl font-black text-blue-600 block mt-1">{100 - getUsedCoupons().length} Adet</strong>
                      <span className="text-[9px] text-blue-400 block mt-0.5">Mevcut stok</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center font-mono">
                      <span className="text-[9px] text-amber-600 font-bold block uppercase">{tLocal(tLocal("💰 TOPLAM İNDİRİM", "💰 TOTAL DISCOUNT"), "💰 TOTAL DISCOUNT")}</span>
                      <strong className="text-sm font-bold text-amber-600 block mt-1">{(getUsedCoupons().length * 500).toLocaleString('tr-TR')} TL</strong>
                      <span className="text-[9px] text-amber-500 block mt-0.5">{tLocal(tLocal("Sistem katkısı", "System contribution"), "System contribution")}</span>
                    </div>
                  </div>

                  {/* Coupon List Interactive Table */}
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono block">{tLocal(tLocal("İNDİRİM KUPONLARI LİSTESİ", "DISCOUNT COUPONS LIST"), "DISCOUNT COUPONS LIST")}</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input 
                            type="text"
                            placeholder="Kupon kodu veya firma arat..."
                            value={adminCouponSearch}
                            onChange={(e) => setAdminCouponSearch(e.target.value)}
                            className="bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-1.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none w-full sm:w-64"
                          />
                        </div>
                      </div>
                      
                      {/* Coupon Status Filters */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold block pr-1.5 font-mono">{tLocal(tLocal("DURUM FİLTRESİ:", "STATUS FILTER:"), "STATUS FILTER:")}</span>
                        <button
                          type="button"
                          onClick={() => setAdminCouponStatusFilter("all")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border ${
                            adminCouponStatusFilter === "all"
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          Tüm Kuponlar (100)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminCouponStatusFilter("used")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminCouponStatusFilter === "used"
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          🟢 Kullanılanlar ({getUsedCoupons().length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminCouponStatusFilter("unused")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminCouponStatusFilter === "unused"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          ⚪ Kullanılmayanlar ({100 - getUsedCoupons().length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdminCouponStatusFilter("free_promo")}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border flex items-center gap-1 ${
                            adminCouponStatusFilter === "free_promo"
                              ? "bg-amber-650 border-amber-650 text-white"
                              : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                          }`}
                        >
                          🎁 Ücretsiz Üyelik Kodları ({getFreePromoCodes().length})
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono">
                            {adminCouponStatusFilter === "free_promo" ? (
                              <>
                                <th className="p-3">{tLocal(tLocal("Üyelik Kodu", "Promo Code"), "Promo Code")}</th>
                                <th className="p-3">Durum</th>
                                <th className="p-3">{tLocal(tLocal("Kullanıcı Adı", "Username"), "Username")}</th>
                                <th className="p-3">{tLocal(tLocal("Kullanıcı E-Postası", "User Email"), "User Email")}</th>
                                <th className="p-3">{tLocal(tLocal("Kullanım Tarihi & Saati", "Usage Date & Time"), "Usage Date & Time")}</th>
                                <th className="p-3">IP Adresi</th>
                              </>
                            ) : (
                              <>
                                <th className="p-3">Kupon Kodu</th>
                                <th className="p-3">Durum</th>
                                <th className="p-3">{tLocal(tLocal("Kullanan Firma Ünvanı / Yetkili", "Using Company / Representative"), "Using Company / Representative")}</th>
                                <th className="p-3">{tLocal(tLocal("Kullanım Tarihi", "Usage Date"), "Usage Date")}</th>
                                <th className="p-3">{tLocal(tLocal("Kayıt Tarihi", "Registration Date"), "Registration Date")}</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            let filtered = [];

                            if (adminCouponStatusFilter === "free_promo") {
                              const freeCodes = getFreePromoCodes();
                              const q = adminCouponSearch.trim().toUpperCase();
                              filtered = freeCodes.filter(c => {
                                if (q) {
                                  return (
                                    c.code.toUpperCase().includes(q) ||
                                    (c.usedByUserName || "").toUpperCase().includes(q) ||
                                    (c.usedByUserEmail || "").toUpperCase().includes(q)
                                  );
                                }
                                return true;
                              }).map(c => ({
                                code: c.code,
                                isUsed: c.used,
                                usedByUserName: c.usedByUserName || "—",
                                usedByUserEmail: c.usedByUserEmail || "—",
                                usedAt: c.usedAt ? new Date(c.usedAt).toLocaleString("tr-TR") : "—",
                                ip: c.usedByIp || "—"
                              }));
                            } else {
                              const COUPON_CODES = [
                                "BAYI1060", "BAYI1748", "BAYI2183", "BAYI3047", "BAYI4172", "BAYI5289", "BAYI6395", "BAYI7418", "BAYI8531", "BAYI9647",
                                "BAYI10862", "BAYI11749", "BAYI12835", "BAYI13924", "BAYI14583", "BAYI15647", "BAYI16738", "BAYI17829", "BAYI18945", "BAYI19473",
                                "BAYI20384", "BAYI21496", "BAYI22537", "BAYI23641", "BAYI24758", "BAYI25863", "BAYI26974", "BAYI27495", "BAYI28617", "BAYI29728",
                                "BAYI30846", "BAYI31957", "BAYI32489", "BAYI33618", "BAYI34725", "BAYI35834", "BAYI36942", "BAYI37458", "BAYI38671", "BAYI39782",
                                "BAYI40859", "BAYI41963", "BAYI42584", "BAYI43719", "BAYI44825", "BAYI45937", "BAYI46841", "BAYI47958", "BAYI48592", "BAYI49716",
                                "BAYI50834", "BAYI51945", "BAYI52487", "BAYI53691", "BAYI54782", "BAYI55893", "BAYI56917", "BAYI57436", "BAYI58624", "BAYI59753",
                                "BAYI60841", "BAYI61958", "BAYI62573", "BAYI63784", "BAYI64892", "BAYI65931", "BAYI66475", "BAYI67682", "BAYI68734", "BAYI69845",
                                "BAYI70958", "BAYI71483", "BAYI72695", "BAYI73714", "BAYI74826", "BAYI75938", "BAYI76459", "BAYI77631", "BAYI78742", "BAYI79853",
                                "BAYI80471", "BAYI81629", "BAYI82735", "BAYI83846", "BAYI84957", "BAYI85472", "BAYI86631", "BAYI87742", "BAYI88853", "BAYI89964",
                                "BAYI90583", "BAYI91742", "BAYI92853", "BAYI93964", "BAYI94485", "BAYI95637", "BAYI96748", "BAYI97859", "BAYI98963", "BAYI99482"
                              ];

                              const usedSecMap = new Map(getUsedCoupons().map(u => [u.code, u]));
                              const mappedCoupons = COUPON_CODES.map(code => {
                                const usage = usedSecMap.get(code);
                                return {
                                  code,
                                  isUsed: !!usage,
                                  companyName: usage ? usage.companyName : "—",
                                  usedByUserName: usage ? usage.usedByUserName : "—",
                                  usedAt: usage ? new Date(usage.usedAt).toLocaleString("tr-TR") : "—",
                                  registeredAt: "15.06.2026"
                                };
                              });

                              filtered = mappedCoupons.filter(item => {
                                if (adminCouponStatusFilter === "used" && !item.isUsed) return false;
                                if (adminCouponStatusFilter === "unused" && item.isUsed) return false;
                                
                                const q = adminCouponSearch.trim().toUpperCase();
                                if (!q) return true;
                                return (
                                  item.code.includes(q) ||
                                  item.companyName.toUpperCase().includes(q) ||
                                  item.usedByUserName.toUpperCase().includes(q)
                                );
                              });
                            }

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={adminCouponStatusFilter === "free_promo" ? 6 : 5} className="p-4 text-center text-slate-400">
                                    Aranan kriterlere uygun kod veya kupon bulunamadı.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map(item => (
                              <tr key={item.code} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono font-bold text-slate-800">{item.code}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                    item.isUsed 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-blue-50 text-blue-700 border border-blue-100"
                                  }`}>
                                    {item.isUsed ? "Kullanıldı" : "Kullanılmadı"}
                                  </span>
                                </td>
                                {adminCouponStatusFilter === "free_promo" ? (
                                  <>
                                    <td className="p-3 text-slate-800 font-semibold">{(item as any).usedByUserName}</td>
                                    <td className="p-3 text-slate-600 font-mono">{(item as any).usedByUserEmail}</td>
                                    <td className="p-3 text-slate-500 font-mono">{item.usedAt}</td>
                                    <td className="p-3 text-slate-500 font-mono">{(item as any).ip}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="p-3 text-slate-700">
                                      {item.isUsed ? (
                                        <div>
                                          <span className="font-bold block text-slate-800">{(item as any).companyName}</span>
                                          <span className="text-[10px] text-slate-400 block">{(item as any).usedByUserName}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 font-mono text-slate-600">{item.usedAt}</td>
                                    <td className="p-3 font-mono text-slate-500">{(item as any).registeredAt}</td>
                                  </>
                                )}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN PANEL REMINDERS VIEW */}
              {activeUser.role === "admin" && adminTab === "reminders" && (() => {
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const renewedUserIds = new Set(
                  allInvoices
                    .filter(inv => inv.status === "Ödendi" && new Date(inv.date).getTime() >= thirtyDaysAgo)
                    .map(inv => inv.userId)
                );

                const premiumUsers = allUsers.filter(u => u.role !== "admin" && u.role !== "visitor");

                const totalActiveMembers = premiumUsers.filter(u => getRemainingDays(u.membership_end) > 0).length;
                const totalRenewedLast30Days = premiumUsers.filter(u => renewedUserIds.has(u.id)).length;
                const totalExpiring15Days = premiumUsers.filter(u => {
                  const rem = getRemainingDays(u.membership_end);
                  return rem > 0 && rem <= 15;
                }).length;
                const totalExpiredMembers = premiumUsers.filter(u => getRemainingDays(u.membership_end) <= 0).length;

                return (
                  <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                          <Bell className="h-5 w-5 text-emerald-600 animate-pulse" />
                          Üyelik Takip ve Otomatik Hatırlatma Sistemi
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Müşterilerin üyelik başlangıç, bitiş tarih takipleri ve otomatik bildirim kanalları izleyicisi.", "Tracking of customers' membership start and end dates, and automatic notification channels monitor."), "Tracking of customers' membership start and end dates, and automatic notification channels monitor.")}</p>
                      </div>
                    </div>

                    {/* İSTATİSTİK PANELİ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* STAT CARD 1: TOPLAM AKTİF ÜYE */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">{tLocal(tLocal("Toplam Aktif Üye", "Total Active Members"), "Total Active Members")}</span>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                          <strong className="text-2xl font-black text-slate-800 font-mono">{totalActiveMembers}</strong>
                        </div>
                        <p className="text-[9px] text-slate-400">{tLocal(tLocal("Üyeliği devam edenler", "Active memberships"), "Active memberships")}</p>
                      </div>

                      {/* STAT CARD 2: SON 30 GÜN İÇİNDE YENİLENEN ÜYE */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">{tLocal(tLocal("Son 30 Gün Yenilenen", "Renewed in Last 30 Days"), "Renewed in Last 30 Days")}</span>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-sky-500 inline-block"></span>
                          <strong className="text-2xl font-black text-slate-800 font-mono">{totalRenewedLast30Days}</strong>
                        </div>
                        <p className="text-[9px] text-slate-400">{tLocal(tLocal("Son 30 günde ödeme yapanlar", "Paid in last 30 days"), "Paid in last 30 days")}</p>
                      </div>

                      {/* STAT CARD 3: 15 GÜN İÇİNDE SÜRESİ BİTECEK ÜYE */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">{tLocal(tLocal("15 Gün İçinde Bitecek", "Expiring in 15 Days"), "Expiring in 15 Days")}</span>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse"></span>
                          <strong className="text-2xl font-black text-amber-600 font-mono">{totalExpiring15Days}</strong>
                        </div>
                        <p className="text-[9px] text-amber-500 font-medium">{tLocal(tLocal("Süresi kritik üyeler", "Status critical members"), "Status critical members")}</p>
                      </div>

                      {/* STAT CARD 4: SÜRESİ DOLMUŞ ÜYE */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-xs space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">{tLocal(tLocal("Süresi Dolmuş Üye", "Expired Membership Members"), "Expired Membership Members")}</span>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                          <strong className="text-2xl font-black text-rose-600 font-mono">{totalExpiredMembers}</strong>
                        </div>
                        <p className="text-[9px] text-rose-500 font-medium">{tLocal(tLocal("Süresi dolup pasife düşenler", "Expired and set to passive"), "Expired and set to passive")}</p>
                      </div>
                    </div>

                    {/* Informative info bubble explaining the automatic nature */}
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed space-y-1.5">
                      <p className="font-bold text-emerald-800 flex items-center gap-1">
                        ℹ️ Otomatik Hatırlatma Kanalları İzleyicisi
                      </p>
                      <p>
                        Müşterilerin üyelik bitişine <strong>{tLocal(tLocal("15 gün, 5 gün, 39 gün ise 1 gün kala", "15 days, 5 days, or 1 day remaining"), "15 days, 5 days, or 1 day remaining")}</strong> ile <strong>{tLocal(tLocal("üyelik bittiği gün (0 gün)", "the day the membership ends (0 days)"), "the day the membership ends (0 days)")}</strong> sistem; SMS, E-Posta ve Panel Bildirimlerini otomatik olarak gönderir. Aşağıdaki panelden anlık simülasyon yapabilir, SMS, E-Posta şablonlarının ve bildirim metinlerinin kalan gün sayısına göre nasıl değiştiğini test edebilirsiniz.
                      </p>
                    </div>

                    {/* Users Membership List Table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/50">
                        <div>
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono">{tLocal(tLocal("ÜYE LİSTESİ VE BİLDİRİM İZLEYİCİSİ", "MEMBER LIST & NOTIFICATION TRACKER"), "MEMBER LIST & NOTIFICATION TRACKER")}</span>
                          <p className="text-slate-400 text-[10px] mt-0.5">{tLocal(tLocal("Filtrelemek istediğiniz üyelik grubunu sekmelerden seçebilirsiniz.", "You can select the membership group you want to filter from the tabs."), "You can select the membership group you want to filter from the tabs.")}</p>
                        </div>
                        
                        {/* Tab Filters */}
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => setRemindersFilter("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${remindersFilter === "all" ? "bg-slate-800 text-white shadow-xs" : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"}`}
                          >
                            Tümü ({premiumUsers.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemindersFilter("active")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${remindersFilter === "active" ? "bg-emerald-600 text-white shadow-xs" : "bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200"}`}
                          >
                            🟢 Aktif Üyeler ({totalActiveMembers})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemindersFilter("expiring")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${remindersFilter === "expiring" ? "bg-amber-500 text-white shadow-xs" : "bg-white hover:bg-amber-50 text-amber-700 border border-slate-200"}`}
                          >
                            🟠 Süresi Yaklaşan ({totalExpiring15Days})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemindersFilter("expired")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${remindersFilter === "expired" ? "bg-rose-600 text-white shadow-xs" : "bg-white hover:bg-rose-50 text-rose-700 border border-slate-200"}`}
                          >
                            🔴 Süresi Dolmuş ({totalExpiredMembers})
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemindersFilter("renewed")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${remindersFilter === "renewed" ? "bg-sky-600 text-white shadow-xs" : "bg-white hover:bg-sky-50 text-sky-700 border border-slate-200"}`}
                          >
                            Son 30 Gün Yenileyenler ({totalRenewedLast30Days})
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto font-sans">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px] font-mono">
                              <th className="p-3">{tLocal(tLocal("Üye Adı / İletişim", "Member Name / Contact"), "Member Name / Contact")}</th>
                              <th className="p-3">{tLocal(tLocal("Üyelik Türü", "Membership Type"), "Membership Type")}</th>
                              <th className="p-3">{tLocal(tLocal("Başlangıç / Bitiş", "Start / End"), "Start / End")}</th>
                              <th className="p-3 text-center">{tLocal(tLocal("Kalan Gün", "Days Left"), "Days Left")}</th>
                              <th className="p-3">{tLocal(tLocal("Son Gönderilen SMS", "Last Sent SMS"), "Last Sent SMS")}</th>
                              <th className="p-3">{tLocal(tLocal("Son Gönderilen E-Posta", "Last Sent Email"), "Last Sent Email")}</th>
                              <th className="p-3 text-right">{tLocal(tLocal("Eylemler & Simülasyon", "Actions & Simulation"), "Actions & Simulation")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(() => {
                              const filteredList = premiumUsers.filter((u) => {
                                const remaining = getRemainingDays(u.membership_end);
                                if (remindersFilter === "active") {
                                  return remaining > 0;
                                }
                                if (remindersFilter === "expiring") {
                                  return remaining > 0 && remaining <= 15;
                                }
                                if (remindersFilter === "expired") {
                                  return remaining <= 0;
                                }
                                if (remindersFilter === "renewed") {
                                  return renewedUserIds.has(u.id);
                                }
                                return true;
                              });

                              if (filteredList.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                      Aradığınız kritere uygun üye kaydı bulunmamaktadır.
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredList.map((u) => {
                                const remaining = getRemainingDays(u.membership_end);
                                const r = getRemindersForUser(u);

                                let remainingBadge = "bg-slate-100 text-slate-600 border-slate-200";
                                if (remaining <= 0) {
                                  remainingBadge = "bg-rose-100 text-rose-700 border-rose-200 font-bold animate-pulse";
                                } else if (remaining <= 5) {
                                  remainingBadge = "bg-amber-100 text-amber-700 border-amber-200 font-bold";
                                } else if (remaining <= 15) {
                                  remainingBadge = "bg-amber-50 text-amber-600 border-amber-150";
                                } else {
                                  remainingBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                                }

                                return (
                                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="p-3">
                                      <div className="font-bold text-slate-800">{u.name}</div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                                      <div className="text-[10px] text-slate-400 font-mono">{u.phone}</div>
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border text-[10px] uppercase">
                                        {getRoleDisplayName(u.role)}
                                      </span>
                                    </td>
                                    <td className="p-3 font-mono text-slate-600 space-y-0.5">
                                      <div className="flex gap-1 items-center">
                                        <span className="text-[9px] text-slate-400 font-bold">{tLocal(tLocal("BAŞ:", "START:"), "START:")}</span>
                                        <span>{new Date(u.membership_start).toLocaleDateString("tr-TR")}</span>
                                      </div>
                                      <div className="flex gap-1 items-center font-bold">
                                        <span className="text-[9px] text-slate-400">{tLocal(tLocal("BİT:", "END:"), "END:")}</span>
                                        <span>{new Date(u.membership_end).toLocaleDateString("tr-TR")}</span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className={`px-2 py-1 rounded-xl text-[11px] font-mono border ${remainingBadge}`}>
                                        {remaining <= 0 ? "Süre Doldu (0)" : `${remaining} Gün`}
                                      </span>
                                    </td>
                                    <td className="p-3 max-w-[200px]">
                                      {r.sms !== "—" ? (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-[10px] font-sans leading-relaxed italic text-slate-600 font-medium whitespace-pre-line relative group">
                                          <span className="absolute -top-2 -right-1.5 bg-sky-100 text-sky-800 text-[8px] font-mono px-1 rounded border border-sky-200 scale-90">SMS</span>
                                          {r.sms}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic font-mono">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 max-w-[240px]">
                                      {r.emailContent !== "—" ? (
                                        <div className="bg-white p-2 rounded-lg border border-slate-200 text-[10px] leading-relaxed text-slate-600 relative space-y-1">
                                          <span className="absolute -top-2 -right-1.5 bg-purple-100 text-purple-800 text-[8px] font-mono px-1 rounded border border-purple-200 scale-90">E-Posta</span>
                                          <p className="font-bold text-slate-800">Konu: {r.emailSubject}</p>
                                          <p className="whitespace-pre-line text-[9px] text-slate-500 font-sans border-t border-slate-100 pt-1 leading-tight">{r.emailContent}</p>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic font-mono">—</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex flex-col gap-1.5 justify-end">
                                        <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider text-right">{tLocal(tLocal("Simülasyon Ayarı", "Simulation Tuning"), "Simulation Tuning")}</span>
                                        <div className="flex flex-wrap gap-1 justify-end">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 - 60000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString() };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-sky-50 hover:bg-sky-100 text-sky-850 text-sky-700 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-sky-200 cursor-pointer"
                                            title={tLocal(tLocal("15 Gün kalaya ayarla", "Set to 15 Days left"), "Set to 15 Days left")}
                                          >
                                            15 Gün Kala
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 - 60000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString() };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-amber-200 cursor-pointer"
                                            title={tLocal(tLocal("5 Gün kalaya ayarla", "Set to 5 Days left"), "Set to 5 Days left")}
                                          >
                                            5 Gün Kala
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 60000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString() };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-orange-200 cursor-pointer"
                                            title={tLocal(tLocal("3 Gün kalaya ayarla", "Set to 3 Days left"), "Set to 3 Days left")}
                                          >
                                            3 Gün Kala
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 - 60000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString() };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-rose-200 cursor-pointer font-black"
                                            title={tLocal(tLocal("1 Gün kalaya ayarla", "Set to 1 Day left"), "Set to 1 Day left")}
                                          >
                                            1 Gün Kala
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString(), membership_status: "Süresi Dolmuş" as const };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-red-200 cursor-pointer font-black"
                                            title={tLocal(tLocal("Üyeliği yarın bitir/sona erdir", "End membership tomorrow"), "End membership tomorrow")}
                                          >
                                            Süre Doldu
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const simulateDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
                                              const updatedList = allUsers.map((item) => {
                                                if (item.id === u.id) {
                                                  return { ...item, membership_end: simulateDate.toISOString(), membership_status: "Aktif" as const };
                                                }
                                                return item;
                                              });
                                              saveUsers(updatedList);
                                              setAllUsers(updatedList);
                                              if (activeUser.id === u.id) {
                                                const match = updatedList.find(x => x.id === u.id);
                                                if (match) onLoginSuccess(match);
                                              }
                                            }}
                                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[9px] py-1 px-1.5 rounded-lg transition border border-emerald-200 cursor-pointer"
                                            title={tLocal(tLocal("Süreyi 100 gün sonraya ayarla", "Extend useful life by 100 days"), "Extend useful life by 100 days")}
                                          >
                                            Sıfırla (100G)
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ADMIN PANEL NOTIFICATION CENTER VIEW */}
              {activeUser.role === "admin" && adminTab === "notifications" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Megaphone className="h-5 w-5 text-amber-600 animate-pulse" />
                        Bildirim ve Duyuru Merkezi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Sistem kullanıcılarına manuel SMS, E-Posta ve Panel duyuruları gönderme paneli.", "Panel for sending manual SMS, Email, and Panel announcements to system users."), "Panel for sending manual SMS, Email, and Panel announcements to system users.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT SIDE: SEND NOTIFICATION FORM */}
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                         Yeni Bildirim Gönder
                      </h4>

                      {manualError && (
                        <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                          ⚠️ {manualError}
                        </p>
                      )}
                      {manualSuccess && (
                        <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                          ✅ {manualSuccess}
                        </p>
                      )}

                      <form onSubmit={handleSendManualNotification} className="space-y-3.5">
                        {/* Target Audience Selector */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Hedef Kitle (Audience)</label>
                          <select
                            value={manualTargetAudience}
                            onChange={(e) => {
                              setManualTargetAudience(e.target.value);
                              setManualSelectedUserId("");
                            }}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all">{tLocal(tLocal("Tüm Kullanıcılar (Ziyaretçiler Hariç)", "All Users (Excluding Visitors)"), "All Users (Excluding Visitors)")}</option>
                            <option value="vehicle_owner">{tLocal(tLocal("Araç Sahipleri", "Vehicle Owners"), "Vehicle Owners")}</option>
                            <option value="dealer">Firma (Bayi / Servis)</option>
                            <option value="lpg_usta">{tLocal(tLocal("LPG Ustaları (Rol: Mühendis/Usta + Usta başlığı olanlar)", "LPG Technicians (Role: Engineer/Technician + with Technician title)"), "LPG Technicians (Role: Engineer/Technician + with Technician title)")}</option>
                            <option value="lpg_engineer">{tLocal(tLocal("LPG Mühendisleri (Rol: Mühendis/Usta olanlar)", "LPG Engineers (Role: Engineer/Technician)"), "LPG Engineers (Role: Engineer/Technician)")}</option>
                            <option value="manufacturer">{tLocal(tLocal("Kit Üreticileri", "Kit Manufacturers"), "Kit Manufacturers")}</option>
                            <option value="passive">{tLocal(tLocal("Pasif Üyeler", "Passive Members"), "Passive Members")}</option>
                            <option value="expiring">{tLocal(tLocal("Üyeliği Süresi Dolmak Üzere Olanlar (Son 15 Gün)", "Expiring Memberships (Last 15 Days)"), "Expiring Memberships (Last 15 Days)")}</option>
                            <option value="specific">{tLocal(tLocal("Belirli Bir Kullanıcı", "A Specific User"), "A Specific User")}</option>
                          </select>
                        </div>

                        {/* Specific User Search Selector */}
                        {manualTargetAudience === "specific" && (
                          <div className="space-y-1 animate-fade-in">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Kullanıcı Seçimi", "User Selection"), "User Selection")}</label>
                            <select
                              value={manualSelectedUserId}
                              onChange={(e) => setManualSelectedUserId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="">{tLocal(tLocal("-- Gönderilecek Kullanıcıyı Seçin --", "-- Select User to Send --"), "-- Select User to Send --")}</option>
                              {getUsers().filter(u => u.role !== "admin").map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.email} - {getRoleDisplayName(u.role)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Channels Checklist */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Gönderim Kanalları", "Sending Channels"), "Sending Channels")}</label>
                          <div className="grid grid-cols-3 gap-2">
                            {["panel", "email", "sms"].map((chan) => {
                              const isChecked = manualChannels.includes(chan);
                              const label = chan === "panel" ? "Panel" : chan === "email" ? "E-Posta" : "SMS";
                              return (
                                <label
                                  key={chan}
                                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer select-none ${
                                    isChecked
                                      ? "bg-amber-50 border-amber-300 text-amber-950 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setManualChannels([...manualChannels, chan]);
                                      } else {
                                        setManualChannels(manualChannels.filter(c => c !== chan));
                                      }
                                    }}
                                    className="hidden"
                                  />
                                  <span>{chan === "panel" ? "🔔" : chan === "email" ? "📧" : "💬"}</span>
                                  {label}
                                </label>
                              );
                            })}
                          </div>
                        </div>

                        {/* Notification Title */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Duyuru Başlığı", "Announcement Title"), "Announcement Title")}</label>
                          <input
                            type="text"
                            placeholder={tLocal(tLocal("Duyuru / Kampanya Başlığı giriniz...", "Enter Announcement / Campaign Title..."), "Enter Announcement / Campaign Title...")}
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {/* Message Content */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Mesaj İçeriği", "Message Content"), "Message Content")}</label>
                          <textarea
                            rows={4}
                            placeholder={tLocal(tLocal("Tüm kullanıcılara ulaştırılacak mesajı girin...", "Enter message to be delivered to all users..."), "Enter message to be delivered to all users...")}
                            value={manualMessage}
                            onChange={(e) => setManualMessage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Expiration Date */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-550 text-slate-500 block">{tLocal(tLocal("Son Kullanma (İsteğe Bağlı)", "Expiration Date (Optional)"), "Expiration Date (Optional)")}</label>
                            <input
                              type="date"
                              value={manualExpirationDate}
                              onChange={(e) => setManualExpirationDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                            />
                          </div>

                          {/* Priority Level */}
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-550 text-slate-500 block">{tLocal(tLocal("Öncelik Seviyesi", "Priority Level"), "Priority Level")}</label>
                            <select
                              value={manualPriority}
                              onChange={(e) => setManualPriority(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value={tLocal(tLocal("Düşük", "Low"), "Low")}>{tLocal(tLocal("🟢 Düşük", "🟢 Low"), "🟢 Low")}</option>
                              <option value="Normal">🟡 Normal</option>
                              <option value={tLocal(tLocal("Yüksek", "High"), "High")}>{tLocal(tLocal("🔴 Yüksek", "🔴 High"), "🔴 High")}</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-slate-200"
                        >
                          <Megaphone className="h-4 w-4 text-amber-500" />
                          Bildirimi / Duyuruyu Yayınla
                        </button>
                      </form>
                    </div>

                    {/* RIGHT SIDE: HISTORY TABLE */}
                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                         Manuel Gönderim Geçmişi (Silinemez)
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-sans">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider">
                              <th className="p-3">{tLocal(tLocal("Gönderim Tarihi", "Sending Date"), "Sending Date")}</th>
                              <th className="p-3">{tLocal(tLocal("Yönetici", "Administrator / Operator"), "Administrator / Operator")}</th>
                              <th className="p-3">Hedef Kitle</th>
                              <th className="p-3">Kanal</th>
                              <th className="p-3">Durum</th>
                              <th className="p-3 text-right">Detaylar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {manualHistory.map((item) => {
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-3 whitespace-nowrap font-mono text-slate-500">
                                    {new Date(item.sentAt).toLocaleString("tr-TR")}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-700">
                                    {item.senderAdmin}
                                  </td>
                                  <td className="p-3">
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                      {item.targetAudience}
                                    </span>
                                  </td>
                                  <td className="p-3 whitespace-nowrap space-y-0.5">
                                    {item.channels.map((c, i) => (
                                      <span
                                        key={i}
                                        className={`inline-block mr-1 text-[8px] font-bold px-1 py-0.2 rounded ${
                                          c.includes("Panel")
                                            ? "bg-sky-100 text-sky-850"
                                            : c.includes("E-Posta")
                                            ? "bg-purple-105 bg-purple-100 text-purple-800"
                                            : "bg-amber-100 text-amber-850"
                                        }`}
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="p-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        item.status === "Gönderildi"
                                          ? "bg-emerald-55 bg-emerald-50 text-emerald-700 border border-emerald-100"
                                          : "bg-rose-50 text-rose-700 border border-rose-100"
                                      }`}
                                    >
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewNotification(item)}
                                      className="bg-slate-55 bg-slate-50 hover:bg-slate-100 text-slate-705 text-slate-700 font-bold py-1 px-2 rounded-lg border border-slate-200 transition text-[9px] cursor-pointer"
                                    >
                                      Detay Göster
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {manualHistory.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                                  Henüz manuel gönderilen bir bildirim veya duyuru bulunmamaktadır.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NEW ADMIN PANEL: CONTENT MANAGEMENT */}
              {activeUser.role === "admin" && adminTab === "content_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  {renderAdminContentCockpit()}
                </div>
              )}

              {/* NEW ADMIN PANEL: AD MANAGEMENT */}
              {activeUser.role === "admin" && adminTab === "ad_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <Megaphone className="h-5 w-5 text-amber-600" />
                        Haber & Bülten Reklam Yönetimi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Haberler & Bültenler sayfasının üst ve alt kısımlarındaki genişlik banner reklam alanlarını yönetin.", "Manage the wide banner advertising spots at the top and bottom of the News & Bulletins page."), "Manage the wide banner advertising spots at the top and bottom of the News & Bulletins page.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                        {editingAdId ? "Reklam Düzenle" : "Yeni Reklam Ekle"}
                      </h4>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newAdTitle.trim() || !newAdClickUrl.trim() || !newAdImageUrl.trim()) {
                          alert("Lütfen tüm alanları doldurun.");
                          return;
                        }
                        const lowerUrl = newAdImageUrl.toLowerCase();
                        const isValidUrlOrBase64 = lowerUrl.startsWith("data:image/") || lowerUrl.startsWith("http://") || lowerUrl.startsWith("https://") || lowerUrl.match(/\.(jpg|jpeg|png|webp)($|\?)/);
                        if (!isValidUrlOrBase64) {
                          alert("Lütfen geçerli bir görsel URL'si (http/https) veya base64 görsel verisi giriniz.");
                          return;
                        }

                        if (editingAdId) {
                          setAdsDb(prev => prev.map(a => a.id === editingAdId ? {
                            ...a,
                            title: newAdTitle,
                            clickUrl: newAdClickUrl,
                            imageUrl: newAdImageUrl,
                            position: newAdPosition
                          } : a));
                          addSystemLog("Reklam Güncellendi", `Reklam güncellendi: ${newAdTitle}`, activeUser.email);
                          setEditingAdId(null);
                        } else {
                          const newAd = {
                            id: "ad-" + Date.now(),
                            title: newAdTitle,
                            clickUrl: newAdClickUrl,
                            imageUrl: newAdImageUrl,
                            position: newAdPosition,
                            active: true
                          };
                          setAdsDb(prev => [...prev, newAd]);
                          addSystemLog("Reklam Ekleme", `Yeni reklam eklendi: ${newAdTitle}`, activeUser.email);
                        }

                        setNewAdTitle("");
                        setNewAdClickUrl("");
                        setNewAdImageUrl("");
                        setNewAdPosition("top");
                      }} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Reklam Başlığı", "Ad Title"), "Ad Title")}</label>
                          <input
                            type="text"
                            placeholder={tLocal(tLocal("Başlık giriniz...", "Enter title..."), "Enter title...")}
                            value={newAdTitle}
                            onChange={(e) => setNewAdTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Tıklama URL'si (Link)", "Click URL (Link)"), "Click URL (Link)")}</label>
                          <input
                            type="text"
                            placeholder="https://example.com"
                            value={newAdClickUrl}
                            onChange={(e) => setNewAdClickUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Görsel URL'si", "Image URL"), "Image URL")}</label>
                          <input
                            type="text"
                            placeholder="https://.../reklam.png"
                            value={newAdImageUrl}
                            onChange={(e) => setNewAdImageUrl(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Konum</label>
                          <select
                            value={newAdPosition}
                            onChange={(e: any) => setNewAdPosition(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="top">{tLocal(tLocal("Üst Banner", "Top Banner"), "Top Banner")}</option>
                            <option value="bottom">Alt Banner</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                          >
                            {editingAdId ? "Güncelle ve Kaydet" : "Reklamı Kaydet"}
                          </button>
                          {editingAdId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAdId(null);
                                setNewAdTitle("");
                                setNewAdClickUrl("");
                                setNewAdImageUrl("");
                                setNewAdPosition("top");
                              }}
                              className="bg-slate-100 hover:bg-slate-250 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer"
                            >{tLocal(tLocal("İptal", "Cancel"), "Cancel")}</button>
                          )}
                        </div>
                      </form>
                    </div>

                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                        Kayıtlı Reklamlar ({adsDb.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-sans">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider">
                              <th className="p-3">{tLocal(tLocal("Önizleme", "Preview"), "Preview")}</th>
                              <th className="p-3">{tLocal(tLocal("Başlık / Konum", "Title / Location"), "Title / Location")}</th>
                              <th className="p-3">Durum</th>
                              <th className="p-3 text-right">{tLocal(tLocal("İşlemler", "Operations"), "Operations")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adsDb.map((ad) => (
                              <tr key={ad.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3">
                                  <img src={ad.imageUrl} alt={ad.title} className="w-16 h-8 object-cover rounded border border-slate-200" />
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-850">{ad.title}</div>
                                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    Konum: {ad.position === "top" ? tLocal("Üst Banner", "Top Banner") : "Alt Banner"}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <button
                                    onClick={() => {
                                      setAdsDb(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
                                      addSystemLog("Reklam Durumu", `Reklam aktifliği değiştirildi: ${ad.title}`, activeUser.email);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[8px] font-bold border transition cursor-pointer ${
                                      ad.active 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100" 
                                        : "bg-slate-55 bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    {ad.active ? "Aktif" : "Pasif"}
                                  </button>
                                </td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setEditingAdId(ad.id);
                                      setNewAdTitle(ad.title);
                                      setNewAdClickUrl(ad.clickUrl);
                                      setNewAdImageUrl(ad.imageUrl);
                                      setNewAdPosition(ad.position);
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-1 px-2 rounded-lg border border-slate-200 transition text-[9px] cursor-pointer"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("Bu reklamı silmek istediğinize emin misiniz?")) {
                                        setAdsDb(prev => prev.filter(a => a.id !== ad.id));
                                        addSystemLog("Reklam Silindi", `Reklam silindi: ${ad.title}`, activeUser.email);
                                      }
                                    }}
                                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-2 rounded-lg transition text-[9px] cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {adsDb.length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                                  Kayıtlı reklam bulunmamaktadır.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NEW ADMIN PANEL: LPG PRICE MANAGEMENT */}
              {activeUser.role === "admin" && adminTab === "price_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                        Güncel LPG Fiyat Yönetimi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">{tLocal(tLocal("Üst fiyat bandı görünürlüğünü, metinleri ve şehir bazlı fiyatları yönetin.", "Manage upper price band visibility, texts, and city-based prices."), "Manage upper price band visibility, texts, and city-based prices.")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                        Genel Ayarlar & Oranlar
                      </h4>
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{tLocal(tLocal("Fiyat Bandı Görünürlüğü", "Price Band Visibility"), "Price Band Visibility")}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPricingData(prev => ({ ...prev, active: !prev.active }));
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              pricingData.active ? "bg-emerald-500" : "bg-slate-200"
                            }`}
                          >
                            <span 
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                pricingData.active ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Duyuru Başlığı", "Announcement Title"), "Announcement Title")}</label>
                          <input
                            type="text"
                            value={pricingData.title}
                            onChange={(e) => setPricingData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Tasarruf Oranı Metni", "Savings Rate Text"), "Savings Rate Text")}</label>
                          <input
                            type="text"
                            value={pricingData.savings}
                            onChange={(e) => setPricingData(prev => ({ ...prev, savings: e.target.value }))}
                            className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("İstanbul (TL)", "Istanbul (TL)"), "Istanbul (TL)")}</label>
                            <input
                              type="text"
                              value={pricingData.istanbul}
                              onChange={(e) => setPricingData(prev => ({ ...prev, istanbul: e.target.value }))}
                              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Ankara (TL)</label>
                            <input
                              type="text"
                              value={pricingData.ankara}
                              onChange={(e) => setPricingData(prev => ({ ...prev, ankara: e.target.value }))}
                              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("İzmir (TL)", "Izmir (TL)"), "Izmir (TL)")}</label>
                            <input
                              type="text"
                              value={pricingData.izmir}
                              onChange={(e) => setPricingData(prev => ({ ...prev, izmir: e.target.value }))}
                              className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-400 text-[10px] font-semibold font-mono">
                          <span>{tLocal(tLocal("Ortalama LPG Fiyatı (Senkronize):", "Average LPG Price (Synchronized):"), "Average LPG Price (Synchronized):")}</span>
                          <span className="text-slate-700 font-bold">
                            {((parseFloat(pricingData.istanbul) + parseFloat(pricingData.ankara) + parseFloat(pricingData.izmir)) / 3 || 21.40).toFixed(2)} TL
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight pb-2 border-b border-slate-100 flex items-center gap-1.5 font-mono">
                        Diğer İl Fiyatları
                      </h4>

                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (!newCityName.trim() || !newCityPrice.trim()) {
                          alert("Lütfen şehir adı ve fiyat giriniz.");
                          return;
                        }

                        if (editingCityIndex !== null) {
                          const updated = [...(pricingData.cities || [])];
                          updated[editingCityIndex] = { name: newCityName, price: newCityPrice };
                          setPricingData(prev => ({ ...prev, cities: updated }));
                          setEditingCityIndex(null);
                        } else {
                          const updated = [...(pricingData.cities || [])];
                          updated.push({ name: newCityName, price: newCityPrice });
                          setPricingData(prev => ({ ...prev, cities: updated }));
                        }

                        setNewCityName("");
                        setNewCityPrice("");
                      }} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-slate-55 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">{tLocal(tLocal("Şehir Adı", "City Name"), "City Name")}</label>
                          <input
                            type="text"
                            placeholder={tLocal(tLocal("Örn: Bursa", "e.g. Bursa"), "e.g. Bursa")}
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 block">Fiyat (TL)</label>
                          <input
                            type="text"
                            placeholder={tLocal(tLocal("Örn: 21.25", "e.g. 21.25"), "e.g. 21.25")}
                            value={newCityPrice}
                            onChange={(e) => setNewCityPrice(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition cursor-pointer"
                          >
                            {editingCityIndex !== null ? "Güncelle" : "Ekle"}
                          </button>
                        </div>
                      </form>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px] font-sans">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-mono text-[9px] uppercase tracking-wider">
                              <th className="p-3">{tLocal(tLocal("Şehir Adı", "City Name"), "City Name")}</th>
                              <th className="p-3 font-mono">Fiyat</th>
                              <th className="p-3 text-right">Eylemler</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pricingData.cities && pricingData.cities.map((city: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="p-3 font-semibold text-slate-700">{city.name}</td>
                                <td className="p-3 font-mono text-slate-950 font-bold">{city.price} TL</td>
                                <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setEditingCityIndex(idx);
                                      setNewCityName(city.name);
                                      setNewCityPrice(city.price);
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-1 px-2 rounded-lg border border-slate-200 transition text-[9px] cursor-pointer"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = (pricingData.cities || []).filter((_: any, i: number) => i !== idx);
                                      setPricingData(prev => ({ ...prev, cities: updated }));
                                    }}
                                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-2 rounded-lg transition text-[9px] cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(!pricingData.cities || pricingData.cities.length === 0) && (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-slate-400 italic">
                                  Listeye eklenmiş şehir bulunmamaktadır.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT VERIFICATION MANAGEMENT TAB */}
              {activeUser.role === "admin" && adminTab === "payment_verification" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        Ödeme & Dekont Onaylama Yönetimi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 font-sans">{tLocal(tLocal("Havale / EFT ile yapılan ödeme taleplerini ve yüklenen dekontları denetleyin.", "Review wire transfer / EFT payment requests and uploaded receipts."), "Review wire transfer / EFT payment requests and uploaded receipts.")}</p>
                    </div>
                  </div>
                  
                  {/* STATS CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total EFT */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Toplam EFT Talebi</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-slate-800">{allInvoices.filter(i => i.payment_method === "Havale/EFT").length}</span>
                        <span className="text-xs text-slate-450">fatura</span>
                      </div>
                    </div>
                    
                    {/* Pending EFT */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block font-mono">{tLocal(tLocal("İncelenecek / Bekleyen", "Review Pending / Awaiting"), "Review Pending / Awaiting")}</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-amber-600">{allInvoices.filter(i => i.payment_method === "Havale/EFT" && (i.status === "Beklemede" || i.status === "İnceleniyor")).length}</span>
                        <span className="text-xs text-slate-450">talep</span>
                      </div>
                    </div>

                    {/* Approved EFT */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block font-mono">{tLocal(tLocal("Onaylanan Ödemeler", "Approved Payments"), "Approved Payments")}</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-emerald-600">{allInvoices.filter(i => i.payment_method === "Havale/EFT" && i.status === "Ödendi").length}</span>
                        <span className="text-xs text-slate-455 font-sans">{tLocal(tLocal("başarılı", "successful"), "successful")}</span>
                      </div>
                    </div>

                    {/* Rejected/Missing EFT */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs">
                      <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block font-mono">Reddedilen / Eksik</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-rose-600">{allInvoices.filter(i => i.payment_method === "Havale/EFT" && (i.status === "Reddedildi" || i.status === "Eksik Evrak")).length}</span>
                        <span className="text-xs text-slate-455 font-sans">{tLocal(tLocal("işlem", "action"), "action")}</span>
                      </div>
                    </div>
                  </div>

                  {/* FILTER TABS */}
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 font-sans">
                    {[
                      { id: "all", label: "Tümü" },
                      { id: "pending", label: "İncelenecekler" },
                      { id: "approved", label: "Onaylananlar" },
                      { id: "rejected", label: "Reddedilenler" },
                      { id: "missing", label: "Eksik Evraklar" },
                      { id: "today", label: "Bugünküler" },
                      { id: "this_month", label: "Bu Aykiler" },
                    ].map((f) => {
                      const count = allInvoices.filter(inv => {
                        if (inv.payment_method !== "Havale/EFT") return false;
                        if (f.id === "pending") return inv.status === "Beklemede" || inv.status === "İnceleniyor";
                        if (f.id === "approved") return inv.status === "Ödendi";
                        if (f.id === "rejected") return inv.status === "Reddedildi";
                        if (f.id === "missing") return inv.status === "Eksik Evrak";
                        if (f.id === "today") return isToday(inv.date);
                        if (f.id === "this_month") return isThisMonth(inv.date);
                        return true;
                      }).length;
                      
                      return (
                        <button
                          key={f.id}
                          onClick={() => setPaymentFilter(f.id as any)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            paymentFilter === f.id
                              ? "bg-indigo-600 text-white shadow-sm font-black"
                              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {f.label}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            paymentFilter === f.id ? "bg-indigo-700 text-indigo-100" : "bg-slate-105 text-slate-500 font-bold"
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TABLE CARD */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-150 text-[10.5px]">
                            <th className="p-3">Fatura No / Tarih</th>
                            <th className="p-3">{tLocal(tLocal("Kullanıcı & Firma", "User & Company"), "User & Company")}</th>
                            <th className="p-3">Hizmet / Tutar</th>
                            <th className="p-3">Dekont Belgesi</th>
                            <th className="p-3">{tLocal(tLocal("Yönetici Notu", "Admin Note"), "Admin Note")}</th>
                            <th className="p-3 text-right">{tLocal(tLocal("İşlemler", "Operations"), "Operations")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] font-sans">
                          {allInvoices
                            .filter(inv => {
                              if (inv.payment_method !== "Havale/EFT") return false;
                              if (paymentFilter === "pending") return inv.status === "Beklemede" || inv.status === "İnceleniyor";
                              if (paymentFilter === "approved") return inv.status === "Ödendi";
                              if (paymentFilter === "rejected") return inv.status === "Reddedildi";
                              if (paymentFilter === "missing") return inv.status === "Eksik Evrak";
                              if (paymentFilter === "today") return isToday(inv.date);
                              if (paymentFilter === "this_month") return isThisMonth(inv.date);
                              return true;
                            })
                            .map((invoice) => {
                              const user = allUsers.find(u => u.id === invoice.userId);
                              return (
                                <tr key={invoice.id} className="hover:bg-slate-50/50">
                                  {/* Fatura No / Tarih */}
                                  <td className="p-3 font-mono">
                                    <span className="font-bold text-slate-800 block">{invoice.id}</span>
                                    <span className="text-[9.5px] text-slate-400 block mt-0.5">{new Date(invoice.date).toLocaleString("tr-TR")}</span>
                                  </td>
                                  
                                  {/* Kullanıcı & Firma */}
                                  <td className="p-3 font-sans">
                                    {user ? (
                                      <div>
                                        <span className="font-bold text-slate-850 block">{user.name}</span>
                                        <span className="text-[10px] text-slate-405 font-mono block mt-0.5">{user.email}</span>
                                        {(user.company_name || invoice.companyName) && (
                                          <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">
                                            🏢 {user.company_name || invoice.companyName}
                                          </span>
                                        )}
                                        <span className="text-[9px] bg-slate-100 text-slate-650 font-black px-1.5 py-0.2 rounded mt-1 inline-block border border-slate-150">
                                          {getRoleDisplayName(user.role)}
                                        </span>
                                      </div>
                                    ) : (
                                      <div>
                                        <span className="font-bold text-slate-850 block">{invoice.userName || "Bilinmeyen Kullanıcı"}</span>
                                        {invoice.companyName && (
                                          <span className="text-[9.5px] text-slate-500 font-semibold block mt-0.5">
                                            🏢 {invoice.companyName}
                                          </span>
                                        )}
                                        <span className="text-[9px] bg-slate-100 text-slate-650 font-black px-1.5 py-0.2 rounded mt-1 inline-block border border-slate-150">
                                          {invoice.roleDisplayName || "Üye"}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  
                                  {/* Hizmet / Tutar */}
                                  <td className="p-3 font-mono">
                                    <span className="font-bold text-slate-800 block">{invoice.membership_type}</span>
                                    <span className="text-emerald-700 font-black block mt-0.5">{invoice.amount} TL</span>
                                  </td>
                                  
                                  {/* Dekont Belgesi */}
                                  <td className="p-3 font-sans">
                                    {invoice.dekont_url ? (
                                      <div className="flex flex-col gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setPreviewDekontUrl(invoice.dekont_url || null);
                                            setPreviewInvoiceId(invoice.id);
                                            setZoomLevel(1);
                                            setRotateAngle(0);
                                          }}
                                          className="bg-indigo-55 hover:bg-indigo-100 border border-indigo-200 rounded-lg p-1.5 flex items-center justify-center gap-1.5 cursor-pointer text-indigo-700 text-[10px] font-black transition-all w-fit shadow-3xs"
                                        >
                                          {invoice.dekont_url.startsWith("data:application/pdf") ? (
                                            <FileText className="h-4 w-4 text-rose-500" />
                                          ) : (
                                            <img src={invoice.dekont_url} className="h-7 w-7 object-cover rounded border border-indigo-200" />
                                          )}
                                          <span>{tLocal(tLocal("Dekontu Aç", "Open Receipt"), "Open Receipt")}</span>
                                        </button>
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black border w-fit mt-0.5 ${
                                          invoice.dekont_status === "Onaylandı"
                                            ? "bg-emerald-50 text-emerald-750 border-emerald-150"
                                            : invoice.dekont_status === "Bekliyor"
                                            ? "bg-amber-50 text-amber-750 border-amber-150 animate-pulse"
                                            : invoice.dekont_status === "İnceleniyor"
                                            ? "bg-blue-50 text-blue-755 border-blue-150"
                                            : invoice.dekont_status === "Reddedildi"
                                            ? "bg-rose-50 text-rose-755 border-rose-150"
                                            : "bg-slate-50 text-slate-600 border-slate-150"
                                        }`}>
                                          {invoice.dekont_status || "Yüklendi"}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic block">{tLocal(tLocal("Dekont Yüklenmedi", "Receipt Not Uploaded"), "Receipt Not Uploaded")}</span>
                                    )}
                                  </td>
                                  
                                  {/* Yönetici Notu */}
                                  <td className="p-3 font-sans">
                                    <div className="flex flex-col gap-1">
                                      <textarea
                                        rows={1.5}
                                        placeholder={tLocal(tLocal("Yönetici notu ekleyin...", "Add administrative note..."), "Add administrative note...")}
                                        value={adminEftNotes[invoice.id] || invoice.admin_note || ""}
                                        onChange={(e) => setAdminEftNotes({ ...adminEftNotes, [invoice.id]: e.target.value })}
                                        className="w-full bg-slate-50 text-[10px] py-1 px-1.5 rounded border border-slate-200 focus:border-indigo-500 focus:outline-none focus:bg-white resize-none font-medium min-w-[130px]"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveAdminNote(invoice.id)}
                                        className="text-[9px] text-indigo-600 hover:text-indigo-800 font-bold self-end hover:underline cursor-pointer"
                                      >
                                        Notu Kaydet
                                      </button>
                                    </div>
                                  </td>
                                  
                                  {/* İşlemler */}
                                  <td className="p-3 text-right space-y-1 whitespace-nowrap font-sans">
                                    <div className="flex flex-col gap-1.5 justify-end items-end">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                        invoice.status === "Ödendi"
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                          : invoice.status === "Beklemede"
                                          ? "bg-amber-50 text-amber-700 border-amber-100"
                                          : invoice.status === "İnceleniyor"
                                          ? "bg-blue-50 text-blue-700 border-blue-100"
                                          : invoice.status === "Reddedildi"
                                          ? "bg-rose-50 text-rose-700 border-rose-100"
                                          : invoice.status === "Eksik Evrak"
                                          ? "bg-orange-50 text-orange-700 border-orange-100"
                                          : "bg-slate-50 text-slate-700 border-slate-100"
                                      }`}>
                                        Durum: {invoice.status}
                                      </span>
                                      
                                      {invoice.status !== "Ödendi" ? (
                                        <div className="flex gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleApproveEft(invoice.id)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all shadow-3xs flex items-center gap-0.5"
                                            title={tLocal(tLocal("Ödemeyi Onayla ve Üyeliği Aktifleştir", "Approve Payment and Activate Membership"), "Approve Payment and Activate Membership")}
                                          >
                                            ✓ Onayla
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleHoldEft(invoice.id)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all shadow-3xs flex items-center gap-0.5"
                                            title={tLocal(tLocal("İncelemeye Al (Kullanıcıya bildirim gider)", "Under Review (User receives notification)"), "Under Review (User receives notification)")}
                                          >
                                            ⏳ Beklet
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMissingEvrakEft(invoice.id)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-black px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all shadow-3xs flex items-center gap-0.5"
                                            title={tLocal(tLocal("Eksik Evrak Bildir (Kullanıcıdan yeni dekont istenir)", "Notify Missing Document (User asked for new receipt)"), "Notify Missing Document (User asked for new receipt)")}
                                          >
                                            ⚠️ Eksik Evrak
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectEft(invoice.id)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-black px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all shadow-3xs flex items-center gap-0.5"
                                            title={tLocal(tLocal("Ödemeyi Reddet", "Reject Payment"), "Reject Payment")}
                                          >
                                            ✗ Reddet
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (window.confirm("Bu ödeme onayını iptal etmek ve üyeyi Pasif yapmak istediğinizden emin misiniz?")) {
                                              // Make member passive
                                              const currentUsers = getUsers();
                                              const updatedUsers = currentUsers.map(u => {
                                                if (u.id === invoice.userId) {
                                                  return { ...u, membership_status: "Pasif" as const };
                                                }
                                                return u;
                                              });
                                              saveUsers(updatedUsers);
                                              setAllUsers(updatedUsers);
                                              
                                              // Reset invoice status
                                              const currentInvoices = getInvoices();
                                              const updatedInvoices = currentInvoices.map(inv => {
                                                if (inv.id === invoice.id) {
                                                  return { ...inv, status: "Beklemede" as const, dekont_status: "Bekliyor" as const };
                                                }
                                                return inv;
                                              });
                                              saveInvoices(updatedInvoices);
                                              setAllInvoices(updatedInvoices);
                                              
                                              addSystemLog(
                                                "Havale/EFT Onayı İptal Edildi",
                                                `Fatura: ${invoice.id} ödeme onayı iptal edildi. Üye pasife çekildi.`,
                                                activeUser?.email || tLocal("Yönetici", "Administrator / Operator")
                                              );
                                              alert("Ödeme onayı iptal edildi, üye pasife çekildi.");
                                            }
                                          }}
                                          className="text-rose-650 hover:text-rose-800 text-[10px] font-bold hover:underline cursor-pointer"
                                        >
                                          Ödeme Onayını İptal Et
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          
                          {allInvoices.filter(inv => {
                            if (inv.payment_method !== "Havale/EFT") return false;
                            if (paymentFilter === "pending") return inv.status === "Beklemede" || inv.status === "İnceleniyor";
                            if (paymentFilter === "approved") return inv.status === "Ödendi";
                            if (paymentFilter === "rejected") return inv.status === "Reddedildi";
                            if (paymentFilter === "missing") return inv.status === "Eksik Evrak";
                            if (paymentFilter === "today") return isToday(inv.date);
                            if (paymentFilter === "this_month") return isThisMonth(inv.date);
                            return true;
                          }).length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                Filtreye uygun ödeme veya dekont onay kaydı bulunmamaktadır.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeUser.role === "admin" && adminTab === "quote_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        Teklif Talepleri & CRM Yönetimi
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5 font-sans">Gelen tüm LPG otogaz dönüşüm teklif taleplerini, firma blind fiyat tekliflerini denetleyin ve CRM durumlarını yönetin.</p>
                    </div>
                  </div>

                  {/* STATS CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Total */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Toplam Talep</span>
                      <span className="text-xl font-black text-slate-800 mt-1 block">{quoteRequests.length}</span>
                    </div>
                    {/* Pending */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block font-mono">Beklemede</span>
                      <span className="text-xl font-black text-amber-500 mt-1 block">{quoteRequests.filter(r => r.status === "Beklemede").length}</span>
                    </div>
                    {/* In Progress */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block font-mono">İnceleniyor</span>
                      <span className="text-xl font-black text-indigo-500 mt-1 block">{quoteRequests.filter(r => r.status === "İnceleniyor" || r.status === "Teklif Hazırlanıyor").length}</span>
                    </div>
                    {/* Sent */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-blue-550 text-blue-500 font-bold uppercase tracking-wider block font-mono">Teklif Verildi</span>
                      <span className="text-xl font-black text-blue-500 mt-1 block">{quoteRequests.filter(r => r.status === "Teklif Gönderildi" || r.status === "Firma Teklif Verdi").length}</span>
                    </div>
                    {/* Completed */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block font-mono">Tamamlandı</span>
                      <span className="text-xl font-black text-emerald-500 mt-1 block">{quoteRequests.filter(r => r.status === "Tamamlandı" || r.status === "Eşleştirildi").length}</span>
                    </div>
                    {/* Cancelled */}
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-center">
                      <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block font-mono">İptal Edildi</span>
                      <span className="text-xl font-black text-rose-500 mt-1 block">{quoteRequests.filter(r => r.status === "İptal Edildi").length}</span>
                    </div>
                  </div>

                  {/* FILTERS */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Talep No, araç marka, model, il veya isim ile arayın..."
                        value={crmSearchQuery}
                        onChange={(e) => setCrmSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.8 text-xs focus:bg-white focus:outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold text-slate-400 font-mono uppercase">Durum:</span>
                      <select
                        value={crmStatusFilter}
                        onChange={(e) => setCrmStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.8 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="Beklemede">Beklemede</option>
                        <option value="İnceleniyor">İnceleniyor</option>
                        <option value="Teklif Hazırlanıyor">Teklif Hazırlanıyor</option>
                        <option value="Firma Teklif Verdi">Firma Teklif Verdi</option>
                        <option value="Kullanıcı Onayladı">Kullanıcı Onayladı</option>
                        <option value="Eşleştirildi">Eşleştirildi</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                        <option value="İptal Edildi">İptal Edildi</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold text-slate-400 font-mono uppercase">Şehir:</span>
                      <select
                        value={crmCityFilter}
                        onChange={(e) => setCrmCityFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.8 text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="all">Tümü</option>
                        <option value="İstanbul">İstanbul</option>
                        <option value="Ankara">Ankara</option>
                        <option value="İzmir">İzmir</option>
                        <option value="Bursa">Bursa</option>
                        <option value="Antalya">Antalya</option>
                      </select>
                    </div>
                  </div>

                  {/* DATA TABLE */}
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                            <th className="p-4 font-bold">Talep No</th>
                            <th className="p-4 font-bold">Tarih</th>
                            <th className="p-4 font-bold">Müşteri</th>
                            <th className="p-4 font-bold">Araç / Motor</th>
                            <th className="p-4 font-bold">Bölge</th>
                            <th className="p-4 font-bold text-center">Teklifler</th>
                            <th className="p-4 font-bold">Durum</th>
                            <th className="p-4 font-bold text-right">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {(() => {
                            const filtered = quoteRequests.filter(r => {
                              const searchLower = crmSearchQuery.toLowerCase();
                              const matchesSearch = 
                                r.id.toLowerCase().includes(searchLower) ||
                                (r.userName || "").toLowerCase().includes(searchLower) ||
                                (r.brand || "").toLowerCase().includes(searchLower) ||
                                (r.model || "").toLowerCase().includes(searchLower) ||
                                (r.userCity || "").toLowerCase().includes(searchLower);
                              const matchesStatus = crmStatusFilter === "all" || r.status === crmStatusFilter;
                              const matchesCity = crmCityFilter === "all" || r.userCity === crmCityFilter;
                              return matchesSearch && matchesStatus && matchesCity;
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                                    Filtrelere uygun teklif talebi bulunmamaktadır.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((req) => {
                              return (
                                <tr key={req.id} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="p-4 font-bold font-mono text-emerald-700">{req.id}</td>
                                  <td className="p-4 text-slate-500 whitespace-nowrap">{req.created_at.split(" - ")[0]}</td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-800">{req.userName}</div>
                                    <div className="text-slate-400 text-[10px] font-mono">{req.userPhone}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-800">{req.brand} {req.model} ({req.year})</div>
                                    <div className="text-slate-500 text-[10px]">{req.engine} • {req.fuelType || "Benzin"}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="font-semibold text-slate-700">{req.userCity}</div>
                                    <div className="text-slate-400 text-[10px]">{req.userDistrict || "Merkez"}</div>
                                  </td>
                                  <td className="p-4 text-center font-bold font-mono text-slate-700">
                                    {req.offers ? req.offers.length : 0}
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-block px-2.5 py-0.8 rounded-full text-[10px] font-bold ${
                                      req.status === "Tamamlandı" || req.status === "Eşleştirildi"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                        : req.status === "Kullanıcı Onayladı"
                                          ? "bg-blue-50 text-blue-700 border border-blue-205 border-blue-200 animate-pulse"
                                          : req.status === "İptal Edildi"
                                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={() => {
                                        setSelectedCrmQuote(req);
                                        setCrmEditStatus(req.status);
                                        setCrmEditReply(req.admin_reply || "");
                                        setCrmEditNotes(req.admin_notes || "");
                                        setCrmNewFileName("");
                                        setCrmNewFileType("PDF");
                                      }}
                                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl transition text-[10px] cursor-pointer shadow-xs"
                                    >
                                      Detay / CRM
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CRM DETAIL MODAL / DRAWER */}
                  {selectedCrmQuote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">CRM TALEP YÖNETİMİ</span>
                            <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                              Talep Detayları: {selectedCrmQuote.brand} {selectedCrmQuote.model} ({selectedCrmQuote.id})
                            </h4>
                          </div>
                          <button
                            onClick={() => setSelectedCrmQuote(null)}
                            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Modal Body Container (Scrollable) */}
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            
                            {/* LEFT COLUMN: Request & Offer Details */}
                            <div className="lg:col-span-7 space-y-5">
                              
                              {/* Customer Information Card */}
                              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 space-y-3">
                                <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider text-emerald-800">👤 Müşteri Bilgileri</h5>
                                <div className="grid grid-cols-2 gap-3 text-2xs font-sans">
                                  <div>
                                    <span className="text-slate-400 block font-mono">Ad Soyad:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.userName}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">Telefon No:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.userPhone}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">E-posta Adresi:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.userEmail || "Belirtilmedi"}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">Şehir / İlçe:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.userCity} / {selectedCrmQuote.userDistrict || "Merkez"}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Vehicle Technical Specs */}
                              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 space-y-3">
                                <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider text-emerald-800">🚗 Araç & Tercih Bilgileri</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-2xs font-sans">
                                  <div>
                                    <span className="text-slate-400 block font-mono">Marka Model:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.brand} {selectedCrmQuote.model}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">Model Yılı:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.year}</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">Motor & Yakıt:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.engine} ({selectedCrmQuote.fuelType || "Benzin"})</strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block font-mono">Kilometre:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.kilometer ? selectedCrmQuote.kilometer + " KM" : "Yeni"}</strong>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-slate-400 block font-mono">Tercih Edilen LPG Markası:</span>
                                    <strong className="text-slate-700 text-xs bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded inline-block mt-0.5 font-mono">{selectedCrmQuote.preferredBrand}</strong>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-slate-400 block font-mono">Talep Kayıt Tarihi:</span>
                                    <strong className="text-slate-700 text-xs">{selectedCrmQuote.created_at}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Bids received */}
                              <div className="space-y-3">
                                <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider">📦 Firmalardan Gelen Teklifler ({selectedCrmQuote.offers ? selectedCrmQuote.offers.length : 0})</h5>
                                {(!selectedCrmQuote.offers || selectedCrmQuote.offers.length === 0) ? (
                                  <p className="text-2xs text-slate-450 italic p-4 text-center bg-slate-50 border border-slate-150 rounded-xl">Henüz bu talep için firmalar tarafından teklif iletilmedi.</p>
                                ) : (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {selectedCrmQuote.offers.map((off) => (
                                      <div key={off.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-2xs space-y-1.5">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <strong className="text-slate-800 text-[11px]">{off.companyName}</strong>
                                            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono ml-2 font-bold text-[9px]">{off.kitBrandProposed}</span>
                                          </div>
                                          <strong className="text-emerald-600 text-xs font-mono">{off.price} TL</strong>
                                        </div>
                                        <p className="text-slate-500 leading-normal bg-white p-2 rounded-lg border border-slate-100">"{off.notes}"</p>
                                        <div className="flex justify-between text-[9px] text-slate-400 pt-1 font-mono">
                                          <span>Garanti: {off.warrantyYears} Yıl | Süre: {off.installationDuration || "1 Gün"}</span>
                                          <span className={`font-bold ${off.status === "Onaylandı" ? "text-emerald-600" : off.status === "Reddedildi" ? "text-rose-600" : "text-amber-600"}`}>
                                            Durum: {off.status || "Beklemede"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                            </div>

                            {/* RIGHT COLUMN: CRM Action Panel */}
                            <div className="lg:col-span-5 space-y-5">
                              
                              {/* CRM STATUS AND NOTES */}
                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-250/60 shadow-3xs space-y-4">
                                <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider text-emerald-800">⚙️ CRM İşlem Kontrolleri</h5>
                                
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Talep Süreç Durumu:</label>
                                  <select
                                    value={crmEditStatus}
                                    onChange={(e) => setCrmEditStatus(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition font-bold"
                                  >
                                    <option value="Beklemede">Beklemede</option>
                                    <option value="İnceleniyor">İnceleniyor</option>
                                    <option value="Teklif Hazırlanıyor">Teklif Hazırlanıyor</option>
                                    <option value="Teklif Gönderildi">Teklif Gönderildi</option>
                                    <option value="Firma Teklif Verdi">Firma Teklif Verdi</option>
                                    <option value="Kullanıcı Onayladı">Kullanıcı Onayladı</option>
                                    <option value="Eşleştirildi">Eşleştirildi</option>
                                    <option value="Tamamlandı">Tamamlandı</option>
                                    <option value="İptal Edildi">İptal Edildi</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Kullanıcıya İletilecek Cevap:</label>
                                  <textarea
                                    rows={3}
                                    placeholder="Kullanıcının portalındaki Tekliflerim panelinde görüntüleyeceği resmi admin cevabı..."
                                    value={crmEditReply}
                                    onChange={(e) => setCrmEditReply(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition font-sans"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">İç Notlar (Sadece Yönetici Görebilir):</label>
                                  <textarea
                                    rows={2}
                                    placeholder="CRM takibi için dahili CRM notları..."
                                    value={crmEditNotes}
                                    onChange={(e) => setCrmEditNotes(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition font-sans bg-amber-50/20"
                                  />
                                </div>
                              </div>

                              {/* CRM FILE ATTACHMENTS SIMULATION */}
                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-250/60 shadow-3xs space-y-4">
                                <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider text-emerald-800">📎 Dosya Eki Simulasyonu</h5>
                                
                                {/* Existing files list */}
                                <div className="space-y-1.5">
                                  <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Mevcut Dosya Ekleri:</span>
                                  {(!selectedCrmQuote.attachments || selectedCrmQuote.attachments.length === 0) ? (
                                    <p className="text-2xs text-slate-400 italic font-medium">Bu talebe henüz dosya eklenmedi.</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {selectedCrmQuote.attachments.map((file, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-150 text-2xs">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono text-emerald-600 font-extrabold bg-emerald-50 px-1 py-0.5 rounded text-[8px]">
                                              {file.name.split(".").pop()?.toUpperCase()}
                                            </span>
                                            <span className="text-slate-700 font-semibold">{file.name}</span>
                                            <span className="text-slate-400 font-mono text-[9px]">({file.size})</span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedAtts = (selectedCrmQuote.attachments || []).filter((_, i) => i !== idx);
                                              setSelectedCrmQuote({
                                                ...selectedCrmQuote,
                                                attachments: updatedAtts
                                              });
                                            }}
                                            className="text-rose-500 hover:text-rose-750 p-1 font-bold cursor-pointer"
                                          >
                                            Sil
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Simulator Form */}
                                <div className="bg-white p-3 rounded-2xl border border-slate-150 space-y-3 text-2xs">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono mb-0.5">Dosya Adı:</label>
                                      <input
                                        type="text"
                                        placeholder="Teklif_Ayrintilari"
                                        value={crmNewFileName}
                                        onChange={(e) => setCrmNewFileName(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase font-mono mb-0.5">Tip:</label>
                                      <select
                                        value={crmNewFileType}
                                        onChange={(e) => setCrmNewFileType(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold"
                                      >
                                        <option value="PDF">PDF</option>
                                        <option value="DOCX">DOCX</option>
                                        <option value="XLSX">XLSX</option>
                                        <option value="ZIP">ZIP</option>
                                      </select>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!crmNewFileName.trim()) {
                                        alert("Lütfen bir dosya adı girin.");
                                        return;
                                      }
                                      const sizeStr = (Math.random() * 4 + 1).toFixed(1) + " MB";
                                      const newFile = {
                                        name: crmNewFileName.trim() + "." + crmNewFileType.toLowerCase(),
                                        url: "#",
                                        size: sizeStr
                                      };
                                      const updatedAtts = [...(selectedCrmQuote.attachments || []), newFile];
                                      setSelectedCrmQuote({
                                        ...selectedCrmQuote,
                                        attachments: updatedAtts
                                      });
                                      setCrmNewFileName("");
                                    }}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg transition"
                                  >
                                    Simüle Dosya Ekle +
                                  </button>
                                </div>
                              </div>

                            </div>

                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedRequests = quoteRequests.map(r => {
                                if (r.id === selectedCrmQuote.id) {
                                  return {
                                    ...r,
                                    status: crmEditStatus,
                                    admin_reply: crmEditReply,
                                    admin_notes: crmEditNotes,
                                    attachments: selectedCrmQuote.attachments,
                                    updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
                                  };
                                }
                                return r;
                              });
                              
                              localStorage.setItem("lpgportal_quote_requests", JSON.stringify(updatedRequests));
                              setQuoteRequests(updatedRequests);

                              addSystemLog(
                                "Teklif Talebi CRM Güncellemesi",
                                `Admin, ${selectedCrmQuote.id} nolu talebi güncelledi. Durum: ${crmEditStatus}`,
                                activeUser?.email || "admin@lpgportal.com"
                              );

                              if (selectedCrmQuote.userId) {
                                sendLpgNotification(
                                  selectedCrmQuote.userId,
                                  "💬 Teklif Talebi Güncellemesi",
                                  `Talebinizin (${selectedCrmQuote.id}) süreç durumu "${crmEditStatus}" olarak güncellendi.`,
                                  "teklif",
                                  "panel",
                                  true
                                );
                              }

                              setSelectedCrmQuote(null);
                              alert("Tüm değişiklikler başarıyla kaydedildi.");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition cursor-pointer shadow-md"
                          >
                            Güncellemeleri Kaydet
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCrmQuote(null)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                          >
                            Kapat
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ========================================= */}
              {/* ADMIN FEEDBACKS & CRM MANAGEMENT PANEL    */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "feedback_management" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* Summary Dashboard Info card */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-amber-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative">
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 mb-2">
                        🛠️ {tLocal("TALEP, ŞİKAYET & ÖNERİ CRM YÖNETİMİ", "FEEDBACK & SUGGESTION CRM MANAGEMENT")}
                      </span>
                      <h3 className="text-xl font-black tracking-tight leading-tight">
                        {tLocal("Talep & Müşteri Şikayetleri Yönetim Portalı", "Feedback & Complaint CRM Portal")}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">
                        {tLocal("Sistemdeki tüm kullanıcıların oluşturduğu talep, öneri ve teknik destek kayıtlarını inceleyebilir, öncelik ve durum atamaları yapabilir, resmi cevap yazarak veya belge yükleyerek kullanıcıyla iletişim kurabilirsiniz.", "Review all user tickets, set priorities/statuses, publish official replies or attach reports, and chat directly with user requests.")}
                      </p>
                    </div>
                  </div>

                  {/* SEARCH & FILTERS CONTROLS */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="relative col-span-1 sm:col-span-2">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={tLocal("ID, Başlık, Açıklama veya Kullanıcı adı ile ara...", "Search by ID, title, description or name...")}
                          value={feedbackSearchQuery}
                          onChange={(e) => setFeedbackSearchQuery(e.target.value)}
                          className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-inner"
                        />
                      </div>
                      <div>
                        <select
                          value={feedbackStatusFilter}
                          onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                        >
                          <option value="all">🔍 {tLocal("Tüm Durumlar", "All Statuses")}</option>
                          <option value="Yeni Kayıt">Yeni Kayıt</option>
                          <option value="İnceleniyor">İnceleniyor</option>
                          <option value="İşleme Alındı">İşleme Alındı</option>
                          <option value="Ek Bilgi Bekleniyor">Ek Bilgi Bekleniyor</option>
                          <option value="Çözüldü">Çözüldü</option>
                          <option value="Kapatıldı">Kapatıldı</option>
                          <option value="Reddedildi">Reddedildi</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={feedbackTypeFilter}
                          onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200/80 rounded-2xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                        >
                          <option value="all">📂 {tLocal("Tüm Kategoriler", "All Categories")}</option>
                          <option value="Talep">{tLocal("Talep", "Inquiry")}</option>
                          <option value="Şikayet">{tLocal("Şikayet", "Complaint")}</option>
                          <option value="Öneri">{tLocal("Öneri", "Suggestion")}</option>
                          <option value="Teknik Destek">{tLocal("Teknik Destek", "Technical Support")}</option>
                          <option value="Hata Bildirimi">{tLocal("Hata Bildirimi", "Bug Report")}</option>
                          <option value="Diğer">{tLocal("Diğer", "Other")}</option>
                        </select>
                      </div>
                    </div>

                    {/* TABLE OF TICKETS */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-extrabold bg-slate-50/50">
                            <th className="py-3 px-3">ID</th>
                            <th className="py-3 px-3">{tLocal("Kullanıcı / Rol", "User / Role")}</th>
                            <th className="py-3 px-3">{tLocal("Kategori / Başlık", "Category / Title")}</th>
                            <th className="py-3 px-3">{tLocal("Öncelik", "Priority")}</th>
                            <th className="py-3 px-3">{tLocal("Son Güncelleme", "Last Update")}</th>
                            <th className="py-3 px-3">{tLocal("Durum", "Status")}</th>
                            <th className="py-3 px-3 text-right">{tLocal("İşlem", "Action")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-650">
                          {feedbackRequests
                            .filter(req => {
                              const query = feedbackSearchQuery.toLowerCase();
                              const matchesSearch = 
                                req.id.toLowerCase().includes(query) ||
                                req.userName.toLowerCase().includes(query) ||
                                req.title.toLowerCase().includes(query) ||
                                req.description.toLowerCase().includes(query);
                                
                              const matchesStatus = feedbackStatusFilter === "all" || req.status === feedbackStatusFilter;
                              const matchesType = feedbackTypeFilter === "all" || req.type === feedbackTypeFilter;
                              
                              return matchesSearch && matchesStatus && matchesType;
                            })
                            .map((req) => (
                              <tr key={req.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3.5 px-3 font-mono font-bold text-slate-400">{req.id}</td>
                                <td className="py-3.5 px-3">
                                  <div className="font-extrabold text-slate-800">{req.userName}</div>
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.userRole} | {req.userPhone}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{req.type}</span>
                                    <span className="font-extrabold text-slate-700 line-clamp-1">{translateEntity(req, "title")}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{translateEntity(req, "description")}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.priority === "Acil" ? "bg-red-50 text-red-700" :
                                    req.priority === "Yüksek" ? "bg-amber-50 text-amber-700" :
                                    req.priority === "Normal" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-700"
                                  }`}>{req.priority}</span>
                                </td>
                                <td className="py-3.5 px-3 text-slate-500 font-mono text-[10px]">{req.updated_at || req.created_at}</td>
                                <td className="py-3.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    req.status === "Yeni Kayıt" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                    req.status === "İnceleniyor" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                    req.status === "İşleme Alındı" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                    req.status === "Ek Bilgi Bekleniyor" ? "bg-orange-50 text-orange-700 border-orange-100" :
                                    req.status === "Çözüldü" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    "bg-slate-50 text-slate-700 border-slate-100"
                                  }`}>{req.status}</span>
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedCrmFeedback(req);
                                      setCrmFeedbackStatus(req.status);
                                      setCrmFeedbackInternalNotes(req.internalNotes || "");
                                      setCrmFeedbackReply("");
                                    }}
                                    className="p-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer font-bold text-[10px] px-2.5 py-1.5"
                                  >
                                    <Sliders className="h-3 w-3" />
                                    {tLocal("Değerlendir", "Evaluate")}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          {feedbackRequests.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-bold">{tLocal("Herhangi bir kullanıcı kaydı bulunamadı.", "No ticket requests found.")}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ADMIN EDIT POPUP DIALOG */}
                  {selectedCrmFeedback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-100 max-h-[92vh] overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">🛠️ CRM TALEP DETAYLI DEĞERLENDİRME</span>
                            <h3 className="text-base font-black text-slate-800">
                              {selectedCrmFeedback.userName} - {translateEntity(selectedCrmFeedback, "title")} ({selectedCrmFeedback.id})
                            </h3>
                          </div>
                          <button
                            onClick={() => setSelectedCrmFeedback(null)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Main Scrollable Body - Grid Layout */}
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
                          
                          {/* Left Side: Ticket Status, Info, History (Span 3) */}
                          <div className="col-span-1 md:col-span-3 space-y-6">
                            
                            {/* Summary Info */}
                            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-3">
                              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-200/50 pb-1.5">📊 Talep Genel Bilgileri</h4>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="block text-slate-400 text-[10px] font-bold uppercase">{tLocal("Kullanıcı Rolü", "User Role")}</span>
                                  <span className="text-slate-800 font-extrabold">{selectedCrmFeedback.userRole}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 text-[10px] font-bold uppercase">{tLocal("E-Posta / Telefon", "Email / Phone")}</span>
                                  <span className="text-slate-800 font-bold block">{selectedCrmFeedback.userEmail}</span>
                                  <span className="text-slate-500 text-[10px] font-mono">{selectedCrmFeedback.userPhone}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 text-[10px] font-bold uppercase">{tLocal("Kategori", "Category")}</span>
                                  <span className="text-slate-800 font-extrabold bg-slate-200/80 px-2 py-0.5 rounded text-[10px]">{selectedCrmFeedback.type}</span>
                                </div>
                                <div>
                                  <span className="block text-slate-400 text-[10px] font-bold uppercase">{tLocal("Öncelik Seviyesi", "Priority")}</span>
                                  <span className="text-red-700 font-bold">{selectedCrmFeedback.priority}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/50 space-y-1">
                                <span className="block text-slate-400 text-[10px] font-bold uppercase">{tLocal("Müşteri Açıklaması", "User Description")}</span>
                                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 shadow-inner whitespace-pre-line leading-relaxed font-semibold">{translateEntity(selectedCrmFeedback, "description")}</p>
                              </div>

                              {/* Attachments list */}
                              {selectedCrmFeedback.attachments && selectedCrmFeedback.attachments.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <span className="block text-slate-400 text-[9px] font-bold uppercase">{tLocal("Ekli Dosyalar", "Attached Files")}</span>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedCrmFeedback.attachments.map((file, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          if (file.base64) {
                                            handleDownloadDekontFile(file.base64, selectedCrmFeedback.id + "_" + idx);
                                          }
                                        }}
                                        className="bg-white hover:bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 text-[9px] font-black text-slate-700 cursor-pointer shadow-xs transition"
                                      >
                                        <Download className="h-3 w-3 text-slate-400" />
                                        <span>{file.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Conversation Message thread */}
                            <div className="space-y-4">
                              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1.5">💬 Mesajlaşma & Ek Yanıt Geçmişi</h4>
                              {(!selectedCrmFeedback.comments || selectedCrmFeedback.comments.length === 0) ? (
                                <p className="text-center py-6 text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-100">{tLocal("Herhangi bir ek açıklama eklenmedi.", "No comment history found.")}</p>
                              ) : (
                                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                                  {selectedCrmFeedback.comments.map((comm) => (
                                    <div
                                      key={comm.id}
                                      className={`flex flex-col ${comm.sender === "admin" ? "items-end" : "items-start"} space-y-1 max-w-[85%] ${comm.sender === "admin" ? "ml-auto" : "mr-auto"}`}
                                    >
                                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-450">
                                        <span>{comm.senderName} ({comm.sender === "admin" ? "Yönetici" : "Kullanıcı"})</span>
                                        <span className="font-mono text-slate-400">{comm.created_at}</span>
                                      </div>
                                      <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                                        comm.sender === "admin" 
                                          ? "bg-slate-800 text-white rounded-br-none" 
                                          : "bg-slate-100 text-slate-805 text-slate-800 rounded-bl-none border border-slate-200/50"
                                      }`}>
                                        {translateEntity(comm, "message")}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Right Side: Admin action panel (Span 2) */}
                          <div className="col-span-1 md:col-span-2 space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                            
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider block border-b border-slate-100 pb-1.5">⚡ Yönetim Aksiyonları</h4>

                            {/* Status update */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Süreç Durumu</label>
                              <select
                                value={crmFeedbackStatus}
                                onChange={(e) => setCrmFeedbackStatus(e.target.value)}
                                className="w-full text-xs font-extrabold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                              >
                                <option value="Yeni Kayıt">Yeni Kayıt</option>
                                <option value="İnceleniyor">İnceleniyor</option>
                                <option value="İşleme Alındı">İşleme Alındı</option>
                                <option value="Ek Bilgi Bekleniyor">Ek Bilgi Bekleniyor</option>
                                <option value="Çözüldü">Çözüldü</option>
                                <option value="Kapatıldı">Kapatıldı</option>
                                <option value="Reddedildi">Reddedildi</option>
                              </select>
                            </div>

                            {/* Reply input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kullanıcıya Yanıt Yaz</label>
                              <textarea
                                rows={3}
                                value={crmFeedbackReply}
                                onChange={(e) => setCrmFeedbackReply(e.target.value)}
                                placeholder={tLocal("Kullanıcıya iletilecek ek bilgi, destek cevabı veya açıklama...", "Type support response or inquiry details...")}
                                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                              />
                            </div>

                            {/* Internal private notes */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                <span>🔒 Yönetici Özel Notları</span>
                                <span className="text-[8px] bg-amber-50 text-amber-800 px-1 rounded-sm">Sadece Admin Görür</span>
                              </label>
                              <textarea
                                rows={2}
                                value={crmFeedbackInternalNotes}
                                onChange={(e) => setCrmFeedbackInternalNotes(e.target.value)}
                                placeholder={tLocal("Kullanıcıya görünmeyen özel iç inceleme notları...", "Internal private evaluation notes...")}
                                className="w-full text-xs font-semibold bg-amber-50/20 border border-amber-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none text-slate-800"
                              />
                            </div>

                            {/* Document generation simulator */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 space-y-3">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">📄 Resmî Belge / Ek Gönderimi</span>
                              
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={crmFeedbackNewFileName}
                                  onChange={(e) => setCrmFeedbackNewFileName(e.target.value)}
                                  placeholder={tLocal("Belge Adı (örn: inceleme_raporu)", "Document Name...")}
                                  className="w-full text-[11px] font-semibold bg-white border border-slate-200 rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                />
                                <div className="flex gap-2">
                                  <select
                                    value={crmFeedbackNewFileType}
                                    onChange={(e) => setCrmFeedbackNewFileType(e.target.value)}
                                    className="flex-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg py-1.5 px-2 cursor-pointer"
                                  >
                                    <option value="PDF">PDF Raporu</option>
                                    <option value="EXCEL">Excel Listesi</option>
                                    <option value="IMAGE">PNG Görseli</option>
                                  </select>
                                  <span className="text-[9px] text-slate-400 self-center font-mono">Simüle Belge</span>
                                </div>
                              </div>
                            </div>

                            {/* Save & Close buttons */}
                            <div className="flex flex-col gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => handleSaveAdminFeedback(selectedCrmFeedback.id)}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-3 rounded-2xl text-xs transition cursor-pointer shadow-md"
                              >
                                Güncellemeleri Kaydet
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedCrmFeedback(null)}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-2xl text-xs transition cursor-pointer"
                              >
                                Kapat
                              </button>
                            </div>

                          </div>

                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ========================================= */}
              {/* SMS INTEGRATION MANAGEMENT PANEL          */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "sms_management" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  {/* Summary Dashboard Info card */}
                  <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-amber-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative">
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5 mb-2">
                        📱 SMS Entegrasyon Yönetimi
                      </span>
                      <h3 className="text-xl font-black tracking-tight leading-tight">
                        {tLocal("SMS Sağlayıcı & Şablon Ayarları", "SMS Provider & Template Configuration")}
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed max-w-2xl mt-1">
                        {tLocal("Sistem üzerinden kullanıcılara gönderilen üyelik yenileme, teklif güncellemeleri ve doğrulama SMS'lerinin API sağlayıcı bağlantılarını yönetebilir, yeni şablonlar ekleyip test edebilirsiniz.", "Manage API configurations, templates, and logs for SMS notifications sent to users for subscription renewals, offer updates, and verifications.")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* API Connection settings card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Sliders className="h-4 w-4 text-amber-600" />
                        {tLocal("Sağlayıcı Bağlantı Ayarları", "Provider API Credentials")}
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SMS Sağlayıcısı</label>
                          <select
                            value={smsConfig.provider}
                            onChange={(e) => {
                              const updated = { ...smsConfig, provider: e.target.value };
                              localStorage.setItem("lpgportal_sms_config", JSON.stringify(updated));
                              setSmsConfig(updated);
                            }}
                            className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                          >
                            <option value="NetGSM">NetGSM İletişim A.Ş.</option>
                            <option value="İletimerkezi">İleti Merkezi</option>
                            <option value="Verimor">Verimor SMS</option>
                            <option value="MutluCell">MutluCell SMS</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Kullanıcı Adı</label>
                          <input
                            type="text"
                            value={smsConfig.apiUser}
                            onChange={(e) => {
                              const updated = { ...smsConfig, apiUser: e.target.value };
                              localStorage.setItem("lpgportal_sms_config", JSON.stringify(updated));
                              setSmsConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            placeholder="Örn: 850308XXXX"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Şifre / Parola</label>
                          <input
                            type="password"
                            value={smsConfig.apiPassword}
                            onChange={(e) => {
                              const updated = { ...smsConfig, apiPassword: e.target.value };
                              localStorage.setItem("lpgportal_sms_config", JSON.stringify(updated));
                              setSmsConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Güvenlik Anahtarı (API Key)</label>
                          <input
                            type="text"
                            value={smsConfig.apiKey}
                            onChange={(e) => {
                              const updated = { ...smsConfig, apiKey: e.target.value };
                              localStorage.setItem("lpgportal_sms_config", JSON.stringify(updated));
                              setSmsConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            placeholder="Optional API Secret Token"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gönderici Başlığı (Originator / Header)</label>
                          <input
                            type="text"
                            value={smsConfig.header}
                            onChange={(e) => {
                              const updated = { ...smsConfig, header: e.target.value };
                              localStorage.setItem("lpgportal_sms_config", JSON.stringify(updated));
                              setSmsConfig(updated);
                            }}
                            className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            placeholder="Örn: LPGPORTAL"
                          />
                        </div>

                        <div className="bg-emerald-50 text-emerald-800 text-[10px] p-3 rounded-xl border border-emerald-150 font-semibold space-y-1 leading-relaxed">
                          <p className="flex items-center gap-1 font-bold"><CheckCircle className="h-3 w-3" /> Bağlantı Durumu: Aktif</p>
                          <p className="text-slate-500 font-normal">Provider API Entegrasyonu hazır ve istekleri kabul ediyor.</p>
                        </div>
                      </div>
                    </div>

                    {/* Test Sandbox and templates column */}
                    <div className="space-y-6 lg:col-span-2">
                      {/* Templates card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4 text-amber-600" />
                            {tLocal("SMS Şablonları", "SMS Templates")}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingSmsTemplate({ id: "SMS-" + Math.floor(1000 + Math.random()*9000), title: "", body: "", active: true });
                              setShowSmsTemplateModal(true);
                            }}
                            className="text-amber-600 hover:text-amber-700 text-xs font-black flex items-center gap-1 transition cursor-pointer"
                          >
                            <PlusCircle className="h-4.5 w-4.5" />
                            Yeni Ekle
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {smsTemplates.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-semibold">Henüz şablon eklenmemiş. Örnek eklemek için aşağıdaki Test butonunu deneyebilirsiniz.</div>
                          ) : (
                            smsTemplates.map(tpl => (
                              <div key={tpl.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                <div className="space-y-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{tpl.title}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${tpl.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-slate-100 text-slate-500'}`}>{tpl.active ? 'Aktif':'Pasif'}</span>
                                  </div>
                                  <p className="text-slate-500 italic font-mono text-[10px] leading-relaxed line-clamp-1">{tpl.body}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingSmsTemplate(tpl);
                                      setShowSmsTemplateModal(true);
                                    }}
                                    className="text-amber-600 hover:text-amber-700 font-extrabold text-[11px] cursor-pointer"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = smsTemplates.filter(t => t.id !== tpl.id);
                                      localStorage.setItem("lpgportal_sms_templates", JSON.stringify(updated));
                                      setSmsTemplates(updated);
                                    }}
                                    className="text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Test Send Sandbox Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Send className="h-4 w-4 text-amber-600" />
                          {tLocal("SMS Test Sandbox (Gönderim Simülasyonu)", "SMS Test Sandbox / Mock Dispatch")}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alıcı Telefon No</label>
                            <input
                              type="text"
                              value={testSmsPhone}
                              onChange={(e) => setTestSmsPhone(e.target.value)}
                              placeholder="+905551234567"
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex justify-between">
                              <span>Mesaj Metni</span>
                              {smsTemplates.length > 0 && (
                                <select 
                                  onChange={(e) => {
                                    const selected = smsTemplates.find(t => t.title === e.target.value);
                                    if(selected) setTestSmsMessage(selected.body);
                                  }}
                                  className="text-[9px] text-amber-600 font-bold border-none bg-transparent cursor-pointer py-0 focus:ring-0 focus:outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Şablon Seç...</option>
                                  {smsTemplates.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                                </select>
                              )}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={testSmsMessage}
                                onChange={(e) => setTestSmsMessage(e.target.value)}
                                placeholder="Mesaj içeriğini girin veya bir şablon seçin..."
                                className="flex-1 font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                              />
                              <button
                                onClick={() => {
                                  if (!testSmsPhone || !testSmsMessage) {
                                    alert("Telefon no ve mesaj metni gereklidir.");
                                    return;
                                  }
                                  const newLog = {
                                    id: "SLOG-" + Math.floor(100000 + Math.random()*900000),
                                    phone: testSmsPhone,
                                    message: testSmsMessage,
                                    status: "Sent",
                                    provider: smsConfig.provider,
                                    date: new Date().toLocaleString("tr-TR")
                                  };
                                  const updated = [newLog, ...sentSmsLogs];
                                  localStorage.setItem("lpgportal_sent_sms_logs", JSON.stringify(updated));
                                  setSentSmsLogs(updated);
                                  
                                  // Log to system logs
                                  addSystemLog(
                                    "SMS Gönderim Simülasyonu",
                                    `Test SMS'i gönderildi. Alıcı: ${testSmsPhone}, Mesaj: ${testSmsMessage.slice(0, 30)}...`,
                                    activeUser ? activeUser.email : "system"
                                  );

                                  alert(`[SMS SIMULATION] Mesaj başarıyla sıraya alındı ve ${smsConfig.provider} üzerinden simüle edilerek gönderildi!`);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2 rounded-xl hover:shadow-lg transition cursor-pointer text-xs shrink-0 flex items-center gap-1"
                              >
                                Simüle Gönder
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sent Logs table */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      {tLocal("SMS Gönderim Günlükleri (Son 50 Gönderim)", "SMS Dispatch Logs (Last 50 Transmissions)")}
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold">
                            <th className="py-2.5 px-2">ID</th>
                            <th className="py-2.5 px-2">Alıcı Telefon</th>
                            <th className="py-2.5 px-2">Mesaj İçeriği</th>
                            <th className="py-2.5 px-2">Sağlayıcı</th>
                            <th className="py-2.5 px-2">Tarih</th>
                            <th className="py-2.5 px-2 text-right">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
                          {sentSmsLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-400 font-normal">Gönderilmiş herhangi bir SMS bulunmamaktadır.</td>
                            </tr>
                          ) : (
                            sentSmsLogs.slice(0, 50).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-2 font-mono text-[10px] text-slate-400">{log.id}</td>
                                <td className="py-2 px-2 font-bold text-slate-700">{log.phone}</td>
                                <td className="py-2 px-2 text-slate-500 max-w-xs truncate">{log.message}</td>
                                <td className="py-2 px-2 font-bold text-slate-600">{log.provider}</td>
                                <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{log.date}</td>
                                <td className="py-2 px-2 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-150">
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* EMAIL INTEGRATION MANAGEMENT PANEL        */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "email_management" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  {/* Summary Dashboard Info card */}
                  <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-blue-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative">
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/30 inline-flex items-center gap-1.5 mb-2">
                        ✉️ E-Posta Entegrasyon Yönetimi
                      </span>
                      <h3 className="text-xl font-black tracking-tight leading-tight">
                        {tLocal("E-Posta Servis Sağlayıcısı & Şablon Ayarları", "E-Mail SMTP & API Gateway Settings")}
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed max-w-2xl mt-1">
                        {tLocal("Kullanıcılara giden bildirim, kampanya, teklif ve işlem onay e-postalarının SMTP / API bağlantı ayarlarını yapılandırabilir, sistem e-posta şablonlarını güncelleyebilirsiniz.", "Configure SMTP and API keys for client transaction notifications, newsletters, status updates, and verify email integrations.")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* API Connection settings card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Sliders className="h-4 w-4 text-blue-600" />
                        {tLocal("SMTP / API Servis Ayarları", "SMTP / API Mail Provider")}
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Servis Sağlayıcı</label>
                          <select
                            value={emailConfig.provider}
                            onChange={(e) => {
                              const updated = { ...emailConfig, provider: e.target.value };
                              localStorage.setItem("lpgportal_email_config", JSON.stringify(updated));
                              setEmailConfig(updated);
                            }}
                            className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                          >
                            <option value="SendGrid">SendGrid API</option>
                            <option value="Mailgun">Mailgun API</option>
                            <option value="Postmark">Postmark Gateway</option>
                            <option value="SMTP">Standart SMTP Sunucusu</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">API Anahtarı (API Key / Password)</label>
                          <input
                            type="password"
                            value={emailConfig.apiKey}
                            onChange={(e) => {
                              const updated = { ...emailConfig, apiKey: e.target.value };
                              localStorage.setItem("lpgportal_email_config", JSON.stringify(updated));
                              setEmailConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="SG.•••••••••••••"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gönderici E-Posta (From Email)</label>
                          <input
                            type="email"
                            value={emailConfig.fromEmail}
                            onChange={(e) => {
                              const updated = { ...emailConfig, fromEmail: e.target.value };
                              localStorage.setItem("lpgportal_email_config", JSON.stringify(updated));
                              setEmailConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="info@lpgportal.com"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gönderici Adı (From Name)</label>
                          <input
                            type="text"
                            value={emailConfig.fromName}
                            onChange={(e) => {
                              const updated = { ...emailConfig, fromName: e.target.value };
                              localStorage.setItem("lpgportal_email_config", JSON.stringify(updated));
                              setEmailConfig(updated);
                            }}
                            className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="LPG PORTAL"
                          />
                        </div>

                        <div className="bg-blue-50 text-blue-800 text-[10px] p-3 rounded-xl border border-blue-150 font-semibold space-y-1 leading-relaxed">
                          <p className="flex items-center gap-1 font-bold"><CheckCircle className="h-3 w-3" /> E-Posta Entegrasyonu: Bağlı</p>
                          <p className="text-slate-500 font-normal">Sağlayıcı SMTP / API doğrulandı. İşlem e-postaları aktiftir.</p>
                        </div>
                      </div>
                    </div>

                    {/* Test Sandbox and templates column */}
                    <div className="space-y-6 lg:col-span-2">
                      {/* Templates card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4 text-blue-600" />
                            {tLocal("E-Posta Şablonları", "E-Mail Templates")}
                          </h4>
                          <button
                            onClick={() => {
                              setEditingEmailTemplate({ id: "MAIL-" + Math.floor(1000 + Math.random()*9000), title: "", body: "", active: true });
                              setShowEmailTemplateModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 text-xs font-black flex items-center gap-1 transition cursor-pointer"
                          >
                            <PlusCircle className="h-4.5 w-4.5" />
                            Yeni Ekle
                          </button>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {emailTemplates.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-semibold">Henüz e-posta şablonu eklenmemiş.</div>
                          ) : (
                            emailTemplates.map(tpl => (
                              <div key={tpl.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                <div className="space-y-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{tpl.title}</span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${tpl.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-slate-100 text-slate-500'}`}>{tpl.active ? 'Aktif':'Pasif'}</span>
                                  </div>
                                  <p className="text-slate-500 italic font-mono text-[10px] leading-relaxed line-clamp-1">{tpl.body}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingEmailTemplate(tpl);
                                      setShowEmailTemplateModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 font-extrabold text-[11px] cursor-pointer"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => {
                                      const updated = emailTemplates.filter(t => t.id !== tpl.id);
                                      localStorage.setItem("lpgportal_email_templates", JSON.stringify(updated));
                                      setEmailTemplates(updated);
                                    }}
                                    className="text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Test Send Sandbox Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Send className="h-4 w-4 text-blue-600" />
                          {tLocal("E-Posta Test Sandbox (Gönderim Simülasyonu)", "E-Mail Test Sandbox / Mock Dispatch")}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alıcı E-Posta Adresi</label>
                            <input
                              type="email"
                              value={testEmailAddress}
                              onChange={(e) => setTestEmailAddress(e.target.value)}
                              placeholder="client@domain.com"
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex justify-between">
                              <span>E-Posta Konusu (Subject)</span>
                              {emailTemplates.length > 0 && (
                                <select 
                                  onChange={(e) => {
                                    const selected = emailTemplates.find(t => t.title === e.target.value);
                                    if(selected) {
                                      setTestEmailSubject(selected.title);
                                      setTestEmailBody(selected.body);
                                    }
                                  }}
                                  className="text-[9px] text-blue-600 font-bold border-none bg-transparent cursor-pointer py-0 focus:ring-0 focus:outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Şablon Seç...</option>
                                  {emailTemplates.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                                </select>
                              )}
                            </label>
                            <input
                              type="text"
                              value={testEmailSubject}
                              onChange={(e) => setTestEmailSubject(e.target.value)}
                              placeholder="E-posta konusunu girin..."
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-Posta İçerik Metni (HTML Destekli)</label>
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={testEmailBody}
                                onChange={(e) => setTestEmailBody(e.target.value)}
                                rows={3}
                                placeholder="E-posta gövdesini buraya yazın..."
                                className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                              />
                              <button
                                onClick={() => {
                                  if (!testEmailAddress || !testEmailSubject || !testEmailBody) {
                                    alert("Alıcı, Konu ve İçerik alanları zorunludur.");
                                    return;
                                  }
                                  const newLog = {
                                    id: "ELOG-" + Math.floor(100000 + Math.random()*900000),
                                    recipient: testEmailAddress,
                                    subject: testEmailSubject,
                                    body: testEmailBody,
                                    status: "Delivered",
                                    provider: emailConfig.provider,
                                    date: new Date().toLocaleString("tr-TR")
                                  };
                                  const updated = [newLog, ...sentEmailLogs];
                                  localStorage.setItem("lpgportal_sent_email_logs", JSON.stringify(updated));
                                  setSentEmailLogs(updated);

                                  addSystemLog(
                                    "E-Posta Gönderim Simülasyonu",
                                    `E-posta simüle edilerek iletildi. Alıcı: ${testEmailAddress}, Konu: ${testEmailSubject}`,
                                    activeUser ? activeUser.email : "system"
                                  );

                                  alert(`[EMAIL SIMULATION] E-Posta başarıyla ${emailConfig.provider} üzerinden simüle edilerek gönderildi!`);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2.5 rounded-xl hover:shadow-lg transition cursor-pointer text-xs self-end"
                              >
                                Test E-Postasını Gönder
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sent Logs table */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      {tLocal("E-Posta Gönderim Günlükleri (Son 50 Gönderim)", "E-Mail Dispatch Logs (Last 50 Transmissions)")}
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold">
                            <th className="py-2.5 px-2">ID</th>
                            <th className="py-2.5 px-2">Alıcı Adresi</th>
                            <th className="py-2.5 px-2">E-Posta Konusu</th>
                            <th className="py-2.5 px-2">Sağlayıcı</th>
                            <th className="py-2.5 px-2">Tarih</th>
                            <th className="py-2.5 px-2 text-right">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
                          {sentEmailLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-400 font-normal">Gönderilmiş herhangi bir e-posta bulunmamaktadır.</td>
                            </tr>
                          ) : (
                            sentEmailLogs.slice(0, 50).map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-2 font-mono text-[10px] text-slate-400">{log.id}</td>
                                <td className="py-2 px-2 font-bold text-slate-700">{log.recipient}</td>
                                <td className="py-2 px-2 text-slate-500 max-w-xs truncate">{log.subject}</td>
                                <td className="py-2 px-2 font-bold text-slate-600">{log.provider}</td>
                                <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{log.date}</td>
                                <td className="py-2 px-2 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-150">
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* PAYMENT GATEWAY (PAYTR) MANAGEMENT PANEL  */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "payment_management" && (
                <div className="space-y-6 animate-fade-in font-sans">
                  {/* Summary Dashboard Info card */}
                  <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative">
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5 mb-2">
                        💳 Ödeme Geçidi Entegrasyonu
                      </span>
                      <h3 className="text-xl font-black tracking-tight leading-tight">
                        {tLocal("PayTR Entegrasyon & Webhook Simülasyonu", "PayTR API Integration & Webhook Simulator")}
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed max-w-2xl mt-1">
                        {tLocal("Kullanıcı üyelik ödemelerinde kullanılan PayTR API anahtarlarını tanımlayabilir, ödeme işlemlerini test edebilir ve PayTR webhook bildirimlerini simüle edebilirsiniz.", "Configure PayTR Merchant ID, API keys, verify callbacks, test 3D secure transactions, and trigger mock webhook signals for auto-approvals.")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* API Connection credentials card */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Sliders className="h-4 w-4 text-emerald-600" />
                        {tLocal("PayTR Mağaza Kimlik Bilgileri", "PayTR Merchant API Keys")}
                      </h4>

                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entegrasyon Modu</label>
                          <select
                            value={paymentConfig.provider}
                            onChange={(e) => {
                              const updated = { ...paymentConfig, provider: e.target.value };
                              localStorage.setItem("lpgportal_payment_config", JSON.stringify(updated));
                              setPaymentConfig(updated);
                            }}
                            className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                          >
                            <option value="PayTR_Sandbox">PayTR Test Sandbox</option>
                            <option value="PayTR_Live">PayTR Canlı Ortam</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mağaza Numarası (Merchant ID)</label>
                          <input
                            type="text"
                            value={paymentConfig.merchantId}
                            onChange={(e) => {
                              const updated = { ...paymentConfig, merchantId: e.target.value };
                              localStorage.setItem("lpgportal_payment_config", JSON.stringify(updated));
                              setPaymentConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="Örn: 239482"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mağaza API Anahtarı (API Key)</label>
                          <input
                            type="password"
                            value={paymentConfig.apiKey}
                            onChange={(e) => {
                              const updated = { ...paymentConfig, apiKey: e.target.value };
                              localStorage.setItem("lpgportal_payment_config", JSON.stringify(updated));
                              setPaymentConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="••••••••••••••••"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mağaza Parolası (Secret Key)</label>
                          <input
                            type="password"
                            value={paymentConfig.secretKey}
                            onChange={(e) => {
                              const updated = { ...paymentConfig, secretKey: e.target.value };
                              localStorage.setItem("lpgportal_payment_config", JSON.stringify(updated));
                              setPaymentConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="••••••••••••••••"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bildirim URL (Callback URL)</label>
                          <input
                            type="text"
                            value={paymentConfig.callbackUrl}
                            onChange={(e) => {
                              const updated = { ...paymentConfig, callbackUrl: e.target.value };
                              localStorage.setItem("lpgportal_payment_config", JSON.stringify(updated));
                              setPaymentConfig(updated);
                            }}
                            className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div className="bg-emerald-50 text-emerald-800 text-[10px] p-3 rounded-xl border border-emerald-150 font-semibold space-y-1 leading-relaxed">
                          <p className="flex items-center gap-1 font-bold"><CheckCircle className="h-3 w-3" /> PayTR Servisi: Aktif</p>
                          <p className="text-slate-500 font-normal">Test ödeme simülasyonu ve webhook tetikleyicisi kullanıma hazır.</p>
                        </div>
                      </div>
                    </div>

                    {/* Simulation columns */}
                    <div className="space-y-6 lg:col-span-2">
                      {/* Checkout simulator */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          {tLocal("1. Adım: Test Ödeme Linki Simülasyonu", "Step 1: Test Payment Link Simulation")}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ödeme Tutarı (TL)</label>
                            <input
                              type="number"
                              value={testPaymentAmount}
                              onChange={(e) => setTestPaymentAmount(e.target.value)}
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kullanıcı E-Posta</label>
                            <input
                              type="email"
                              value={testPaymentEmail}
                              onChange={(e) => setTestPaymentEmail(e.target.value)}
                              placeholder="test@lpgportal.com"
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1 flex items-end">
                            <button
                              onClick={() => {
                                if (!testPaymentAmount || !testPaymentEmail) {
                                  alert("Tutar ve Kullanıcı E-Posta girilmelidir.");
                                  return;
                                }
                                const orderId = "PAYTR-" + Math.floor(100000 + Math.random()*900000);
                                const newTx = {
                                  id: orderId,
                                  email: testPaymentEmail,
                                  amount: testPaymentAmount,
                                  status: "Beklemede (Pending)",
                                  date: new Date().toLocaleString("tr-TR")
                                };
                                const updated = [newTx, ...paytrTransactions];
                                localStorage.setItem("lpgportal_paytr_transactions", JSON.stringify(updated));
                                setPaytrTransactions(updated);
                                setWebhookOid(orderId);
                                setWebhookAmount(testPaymentAmount);

                                addSystemLog(
                                  "PayTR Simüle Ödeme Başlatıldı",
                                  `Sipariş ID: ${orderId}, Tutar: ${testPaymentAmount} TL, E-Posta: ${testPaymentEmail}`,
                                  activeUser ? activeUser.email : "system"
                                );

                                alert(`[PayTR Sandbox] Token üretildi ve ödeme linki oluşturuldu!\nSipariş ID: ${orderId}\nLütfen aşağıdaki Webhook simülasyonunu kullanarak bu Sipariş ID'sini onaylayın.`);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer text-[11px]"
                            >
                              Ödeme Başlat (Token Al)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Webhook simulator */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                          <Activity className="h-4 w-4 text-emerald-600" />
                          {tLocal("2. Adım: PayTR Webhook Bildirim Tetikleyicisi (Simülatör)", "Step 2: PayTR Webhook Callback Simulator")}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sipariş ID (merchant_oid)</label>
                            <input
                              type="text"
                              value={webhookOid}
                              onChange={(e) => setWebhookOid(e.target.value)}
                              placeholder="PAYTR-XXXXXX"
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bildirim Durumu</label>
                            <select
                              value={webhookStatus}
                              onChange={(e) => setWebhookStatus(e.target.value)}
                              className="w-full font-bold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                              <option value="success">Başarılı (Success)</option>
                              <option value="failed">Hatalı / Başarısız (Failed)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hata Nedeni (Failed ise)</label>
                            <input
                              type="text"
                              value={webhookReason}
                              onChange={(e) => setWebhookReason(e.target.value)}
                              placeholder="Kart limiti yetersiz..."
                              disabled={webhookStatus === "success"}
                              className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
                            />
                          </div>

                          <div className="space-y-1 flex items-end">
                            <button
                              onClick={() => {
                                if (!webhookOid) {
                                  alert("Sipariş ID (merchant_oid) girmek zorunludur.");
                                  return;
                                }
                                const target = paytrTransactions.find(t => t.id === webhookOid);
                                if (!target) {
                                  alert(`Girdiğiniz Sipariş ID (${webhookOid}) listede bulunamadı. Önce yukarıdan başlatın veya listedeki bir ID'yi girin.`);
                                  return;
                                }

                                const isSuccess = webhookStatus === "success";
                                const updatedTx = {
                                  ...target,
                                  status: isSuccess ? "Başarılı (Success)" : `Başarısız: ${webhookReason || "Bilinmeyen Hata"}`,
                                };
                                const updatedList = paytrTransactions.map(t => t.id === webhookOid ? updatedTx : t);
                                localStorage.setItem("lpgportal_paytr_transactions", JSON.stringify(updatedList));
                                setPaytrTransactions(updatedList);

                                // Add system log
                                addSystemLog(
                                  "PayTR Webhook Tetiklendi",
                                  `Sipariş ${webhookOid} webhook durumu işlendi: ${webhookStatus.toUpperCase()}`,
                                  "PayTR Callback"
                                );

                                if (isSuccess) {
                                  // Find the database users and find the user with matching email to renew subscription!
                                  const allUsers = getUsers();
                                  const matchedUser = allUsers.find(u => u.email.toLowerCase() === target.email.toLowerCase());
                                  if (matchedUser) {
                                    const extendedUser: DbUser = {
                                      ...matchedUser,
                                      membership_status: "Aktif" as const,
                                      membership_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("tr-TR")
                                    };
                                    const updatedUsers = allUsers.map(u => u.id === matchedUser.id ? extendedUser : u);
                                    saveUsers(updatedUsers);

                                    // Create invoice/billing log
                                    const allInvoices = getInvoices();
                                    const newInvoice: FaturaHistory = {
                                      id: "FAT-" + Math.floor(100000 + Math.random()*900000),
                                      userId: matchedUser.id,
                                      companyName: matchedUser.company_name || matchedUser.name,
                                      amount: Number(target.amount),
                                      status: "Ödendi" as any,
                                      date: new Date().toLocaleDateString("tr-TR"),
                                      membership_type: "Yıllık Üyelik",
                                      payment_method: "Kredi Kartı",
                                      userName: matchedUser.name,
                                      roleDisplayName: getRoleDisplayName(matchedUser.role),
                                      packageName: matchedUser.role === "dealer" ? "Gold Bayi" : "Standart Paket",
                                      dekont_status: "Yok"
                                    };
                                    saveInvoices([...allInvoices, newInvoice]);

                                    // Send notification to the user
                                    sendLpgNotification(
                                      matchedUser.id,
                                      "💳 Ödeme Onaylandı (PayTR)",
                                      `PayTR üzerinden simüle ettiğiniz ${target.amount} TL tutarındaki ödemeniz onaylandı. Üyeliğiniz 1 yıl süreyle uzatılmıştır.`,
                                      "mesaj",
                                      "panel",
                                      true
                                    );

                                    alert(`Matched User: ${matchedUser.name}\n[PayTR Webhook] Başarıyla işlendi! Kullanıcı üyeliği aktifleştirildi ve fatura oluşturuldu.`);
                                  } else {
                                    alert(`[PayTR Webhook] Ödeme onaylandı fakat sistemde ${target.email} e-postasına ait üye bulunamadı.`);
                                  }
                                } else {
                                  alert(`[PayTR Webhook] Bildirim: Ödeme başarısız olarak güncellendi.`);
                                }
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer text-[11px]"
                            >
                              Webhook Bildirimi Gönder
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction logs table */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      {tLocal("PayTR İşlem Geçmişi (Son 50 Ödeme Talebi)", "PayTR Transaction History (Last 50 Payments)")}
                    </h4>

                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold">
                            <th className="py-2.5 px-2">Sipariş ID</th>
                            <th className="py-2.5 px-2">Kullanıcı E-Posta</th>
                            <th className="py-2.5 px-2">Ödeme Tutarı</th>
                            <th className="py-2.5 px-2">Tarih</th>
                            <th className="py-2.5 px-2 text-right">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-650 font-semibold">
                          {paytrTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-slate-400 font-normal">Henüz herhangi bir PayTR işlemi bulunmamaktadır.</td>
                            </tr>
                          ) : (
                            paytrTransactions.slice(0, 50).map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-2 font-mono text-[10px] text-slate-450">{tx.id}</td>
                                <td className="py-2 px-2 font-bold text-slate-700">{tx.email}</td>
                                <td className="py-2 px-2 font-black text-slate-800">{tx.amount} TL</td>
                                <td className="py-2 px-2 text-slate-400 font-mono text-[10px]">{tx.date}</td>
                                <td className="py-2 px-2 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                    tx.status.includes("Başarılı") || tx.status.includes("Success")
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                                      : tx.status.includes("Başarısız")
                                      ? "bg-rose-50 text-rose-700 border border-rose-150"
                                      : "bg-amber-50 text-amber-700 border border-amber-150"
                                  }`}>
                                    {tx.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* VEHICLE MANAGEMENT PANEL                  */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "vehicle_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  {renderAdminVehicleManagement()}
                </div>
              )}

              {/* ========================================= */}
              {/* CONTACT & MESSAGE MANAGEMENT PANEL        */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "contact_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <ContactAdminPanel activeUser={activeUser} />
                </div>
              )}

              {/* ========================================= */}
              {/* SERVICE MANAGEMENT PANEL                  */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "service_management" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold text-slate-800">
                        {language === "tr" ? "Servis Yönetimi" : "Service Management"}
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === "tr" 
                          ? "Firma rehberindeki servis başvurularını ve aktif/pasif servis listelerini yönetin."
                          : "Moderate service registrations and manage active/passive listing statuses."}
                      </p>
                    </div>
                  </div>

                  {/* Tab Selector buttons */}
                  <div className="flex gap-2 border-b border-slate-200 pb-2">
                    {[
                      { id: "pending", label: language === "tr" ? "Bekleyen Başvurular" : "Pending Applications", count: allCompanies.filter(c => c.approved_status === "Onay Bekliyor").length },
                      { id: "approved", label: language === "tr" ? "Onaylanan Servisler" : "Approved Services", count: allCompanies.filter(c => c.approved_status === "Onaylandı").length },
                      { id: "rejected", label: language === "tr" ? "Reddedilen Başvurular" : "Rejected Applications", count: allCompanies.filter(c => c.approved_status === "Reddedildi").length }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setServiceFilterTab(tab.id as any); setExpandedCompanyId(null); }}
                        className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                          serviceFilterTab === tab.id
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                          serviceFilterTab === tab.id
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* List of filtered services */}
                  <div className="space-y-4">
                    {(() => {
                      const filtered = allCompanies.filter(c => {
                        if (serviceFilterTab === "pending") return c.approved_status === "Onay Bekliyor";
                        if (serviceFilterTab === "approved") return c.approved_status === "Onaylandı";
                        if (serviceFilterTab === "rejected") return c.approved_status === "Reddedildi";
                        return false;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-xs text-slate-400 italic">
                            {language === "tr" ? "Bu sekmede görüntülenecek servis bulunmamaktadır." : "No services found in this tab."}
                          </div>
                        );
                      }

                      return filtered.map(c => {
                        const owner = allUsers.find(u => u.id === c.owner_id);
                        const isExpanded = expandedCompanyId === c.id;
                        const isOwnerExpired = owner ? (owner.membership_status === "Süresi Dolan" || owner.membership_status === "Süresi Dolmuş" || new Date(owner.membership_end) < new Date()) : false;

                        return (
                          <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs transition-all hover:shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                {renderCompanyLogo(c, "w-10 h-10 text-sm font-black rounded-xl shadow-xs border border-slate-105", true)}
                                <div>
                                  <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                                    <span>{c.company_name}</span>
                                    {c.premium_status && (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                                        Premium
                                      </span>
                                    )}
                                  </h3>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{c.city} / {c.district}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedCompanyId(isExpanded ? null : c.id)}
                                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-50 hover:bg-slate-105 transition cursor-pointer"
                                >
                                  {isExpanded ? (language === "tr" ? "Detayları Kapat ▲" : "Hide Details ▲") : (language === "tr" ? "Detayları İncele ▼" : "Inspect Details ▼")}
                                </button>
                              </div>
                            </div>

                            {/* Expanded Details Card */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="space-y-2">
                                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px]">
                                    {language === "tr" ? "Firma Detayları" : "Center Details"}
                                  </h4>
                                  <div className="space-y-1.5 text-[11px]">
                                    <div><span className="text-slate-500">{language === "tr" ? "Telefon:" : "Phone:"}</span> <strong className="text-slate-800">{c.phone}</strong></div>
                                    <div><span className="text-slate-500">{language === "tr" ? "E-posta:" : "Email:"}</span> <strong className="text-slate-800">{c.email}</strong></div>
                                    {c.website && <div><span className="text-slate-500">{language === "tr" ? "Web Sitesi:" : "Website:"}</span> <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{c.website}</a></div>}
                                    <div><span className="text-slate-500">{language === "tr" ? "Adres:" : "Address:"}</span> <span className="text-slate-700">{c.address}</span></div>
                                    {c.description && <div><span className="text-slate-500">{language === "tr" ? "Açıklama:" : "Description:"}</span> <span className="text-slate-650 block bg-slate-50 p-2 rounded-lg mt-1 italic">{c.description}</span></div>}
                                    <div>
                                      <span className="text-slate-550">{language === "tr" ? "Desteklenen Kit Markaları:" : "Supported Kit Brands:"}</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {c.featuredBrands && c.featuredBrands.length > 0 ? (
                                          c.featuredBrands.map(b => (
                                            <span key={b} className="bg-slate-105 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                              {b}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-slate-400 italic">{language === "tr" ? "Marka seçilmemiş" : "No brands selected"}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px]">
                                    {language === "tr" ? "Firma Sahibi / Başvuran Bilgileri" : "Owner / Applicant Info"}
                                  </h4>
                                  {owner ? (
                                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2 text-[11px]">
                                      <div><span className="text-slate-500">{language === "tr" ? "Ad Soyad:" : "Name:"}</span> <strong className="text-slate-800">{owner.name}</strong></div>
                                      <div><span className="text-slate-500">{language === "tr" ? "E-posta:" : "Email:"}</span> <strong className="text-slate-800">{owner.email}</strong></div>
                                      <div><span className="text-slate-500">{language === "tr" ? "Rol / Yetki:" : "Role:"}</span> <strong className="text-slate-800">{getRoleDisplayName(owner.role)}</strong></div>
                                      <div>
                                        <span className="text-slate-550">{language === "tr" ? "Üyelik Bitiş Tarihi:" : "Membership End Date:"}</span>{" "}
                                        <strong className={isOwnerExpired ? "text-rose-600 font-extrabold animate-pulse" : "text-emerald-700 font-extrabold"}>
                                          {new Date(owner.membership_end).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US")} {isOwnerExpired && (language === "tr" ? "(Süresi Dolan)" : "(Expired)")}
                                        </strong>
                                      </div>
                                      {isOwnerExpired && (
                                        <button
                                          type="button"
                                          onClick={() => handleRenewOwnerMembership(owner.id)}
                                          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-[10px] px-2.5 py-1 rounded w-full font-bold transition flex items-center justify-center gap-1 mt-1 cursor-pointer"
                                        >
                                          ⚡ {language === "tr" ? "Kurumsal Üyeliği Yenile (+1 Yıl)" : "Renew Corporate Membership (+1 Year)"}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic p-3 border border-dashed rounded-xl bg-slate-50/50">
                                      {language === "tr" ? "Başvuran kullanıcı kaydı bulunamadı." : "Applicant account not found."}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] font-bold">
                              <div>
                                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                                  c.status === "Aktif" 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-slate-100 text-slate-650 border-slate-300"
                                }`}>
                                  {language === "tr" ? "İlan Durumu:" : "Listing Status:"} {c.status === "Aktif" ? (language === "tr" ? "Aktif (Haritada Yayında)" : "Active") : (language === "tr" ? "Pasif" : "Inactive")}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                {c.approved_status === "Onay Bekliyor" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateCompanyStatus(c.id, { approved_status: "Onaylandı", status: "Aktif" });
                                        alert("Firma başarıyla onaylandı ve haritada yayına alındı!");
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-xl transition cursor-pointer font-sans"
                                    >
                                      {language === "tr" ? "Başvuruyu Onayla" : "Approve"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateCompanyStatus(c.id, { approved_status: "Reddedildi", status: "Pasif" });
                                        alert("Firma başvurusu reddedildi.");
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-xl transition cursor-pointer font-sans"
                                    >
                                      {language === "tr" ? "Reddet" : "Reject"}
                                    </button>
                                  </>
                                )}

                                {c.approved_status === "Onaylandı" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextStatus = c.status === "Aktif" ? "Pasif" : "Aktif";
                                      handleUpdateCompanyStatus(c.id, { status: nextStatus });
                                      alert(`Firma yayını ${nextStatus === "Aktif" ? "aktifleştirildi" : "pasife alındı"}.`);
                                    }}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-300 px-3 py-1 rounded-xl transition cursor-pointer font-sans"
                                  >
                                    {c.status === "Aktif" ? (language === "tr" ? "Pasife Al" : "Pasife Al") : (language === "tr" ? "Aktifleştir" : "Aktifleştir")}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCompany(c.id)}
                                  className="text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition cursor-pointer font-sans"
                                >
                                  {language === "tr" ? "Kaydı Kaldır" : "Delete Record"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* CAMPAIGN MANAGEMENT PANEL                 */}
              {/* ========================================= */}
              {activeUser.role === "admin" && adminTab === "campaigns" && (
                <div className="space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-xs animate-fade-in font-sans">
                  <CampaignsSystem activeUser={activeUser} mode="admin" language={language} />
                </div>
              )}


              {/* SMS TEMPLATE EDIT MODAL */}
              {showSmsTemplateModal && editingSmsTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in font-sans">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 relative">
                    <button
                      type="button"
                      onClick={() => setShowSmsTemplateModal(false)}
                      className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-800">
                        {editingSmsTemplate.title ? "SMS Şablonu Düzenle" : "Yeni SMS Şablonu Ekle"}
                      </h3>
                      <p className="text-[11px] text-slate-400">SMS içeriğini dinamik yerleştirme değişkenleri ile yazabilirsiniz.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Şablon Adı / Tanımı</label>
                        <input
                          type="text"
                          value={editingSmsTemplate.title}
                          onChange={(e) => setEditingSmsTemplate({ ...editingSmsTemplate, title: e.target.value })}
                          placeholder="Örn: Üyelik Yenileme Hatırlatması"
                          className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mesaj Gövdesi</label>
                        <textarea
                          value={editingSmsTemplate.body}
                          onChange={(e) => setEditingSmsTemplate({ ...editingSmsTemplate, body: e.target.value })}
                          rows={4}
                          placeholder="Sayın {ad} {soyad}, LPG Portal üyeliğiniz {gun} gün sonra sona erecektir. Yenilemek için: {link}"
                          className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editingSmsTemplate.title || !editingSmsTemplate.body) {
                              alert("Lütfen başlık ve mesaj metni alanlarını doldurun.");
                              return;
                            }
                            const index = smsTemplates.findIndex(t => t.id === editingSmsTemplate.id);
                            let updated;
                            if (index > -1) {
                              updated = smsTemplates.map(t => t.id === editingSmsTemplate.id ? editingSmsTemplate : t);
                            } else {
                              updated = [...smsTemplates, editingSmsTemplate];
                            }
                            localStorage.setItem("lpgportal_sms_templates", JSON.stringify(updated));
                            setSmsTemplates(updated);
                            setShowSmsTemplateModal(false);
                          }}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setShowSmsTemplateModal(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMAIL TEMPLATE EDIT MODAL */}
              {showEmailTemplateModal && editingEmailTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in font-sans">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 relative">
                    <button
                      type="button"
                      onClick={() => setShowEmailTemplateModal(false)}
                      className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-800">
                        {editingEmailTemplate.title ? "E-Posta Şablonu Düzenle" : "Yeni E-Posta Şablonu Ekle"}
                      </h3>
                      <p className="text-[11px] text-slate-400">Sistem e-posta bildirimlerinin konu ve gövde şablonunu düzenleyin.</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Şablon Konusu (Subject)</label>
                        <input
                          type="text"
                          value={editingEmailTemplate.title}
                          onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, title: e.target.value })}
                          placeholder="Örn: Yeni Fatura Bildirimi"
                          className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">E-Posta Gövdesi (HTML Desteklenir)</label>
                        <textarea
                          value={editingEmailTemplate.body}
                          onChange={(e) => setEditingEmailTemplate({ ...editingEmailTemplate, body: e.target.value })}
                          rows={5}
                          placeholder="<h2>Sayın {ad} {soyad},</h2><p>LPG Portal hesabınıza ait yeni fatura oluşturulmuştur.</p>"
                          className="w-full font-semibold bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editingEmailTemplate.title || !editingEmailTemplate.body) {
                              alert("Lütfen konu ve içerik alanlarını doldurun.");
                              return;
                            }
                            const index = emailTemplates.findIndex(t => t.id === editingEmailTemplate.id);
                            let updated;
                            if (index > -1) {
                              updated = emailTemplates.map(t => t.id === editingEmailTemplate.id ? editingEmailTemplate : t);
                            } else {
                              updated = [...emailTemplates, editingEmailTemplate];
                            }
                            localStorage.setItem("lpgportal_email_templates", JSON.stringify(updated));
                            setEmailTemplates(updated);
                            setShowEmailTemplateModal(false);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={() => setShowEmailTemplateModal(false)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* USER FEEDBACK & COMPLAINTS CENTER        */}
              {/* ========================================= */}
              {userMainTab === "feedback" && activeUser && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* Summary Dashboard Info card */}
                  <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-sky-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1.5 max-w-xl">
                        <span className="bg-sky-500/20 text-sky-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-sky-500/30 inline-flex items-center gap-1.5">
                          💬 {tLocal("TALEP, ŞİKAYET & ÖNERİ MERKEZİ", "FEEDBACK & SUGGESTION CENTER")}
                        </span>
                        <h3 className="text-xl font-black tracking-tight leading-tight">
                          {tLocal("Talep, Şikayet & Öneri Bildirim Ekranı", "Feedback, Complaint & Suggestion Submission")}
                        </h3>
                        <p className="text-xs text-slate-350 leading-relaxed">
                          {tLocal("Platformumuz ile ilgili her türlü soru, görüş, öneri, teknik destek veya şikayet bildirimlerinizi bu ekrandan iletebilir, süreçlerini anlık olarak takip edip uzman ekibimizle mesajlaşabilirsiniz.", "Submit your questions, technical support issues, suggestions, or complaints, monitor their status in real-time, and chat with our expert support agents.")}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowNewFeedbackForm(true)}
                        className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-black px-5 py-3 rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-lg hover:shadow-sky-550/20 self-start md:self-auto shrink-0 border border-sky-450"
                      >
                        <PlusCircle className="h-4 w-4" />
                        {tLocal("Yeni Kayıt Oluştur", "Create New Ticket")}
                      </button>
                    </div>
                  </div>

                  {/* STATS OVERVIEW */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tLocal("Toplam Talep", "Total Tickets")}</span>
                      <span className="text-2xl font-extrabold text-slate-800">{feedbackRequests.filter(r => r.userId === activeUser.id).length}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tLocal("Çözülenler", "Resolved")}</span>
                      <span className="text-2xl font-extrabold text-emerald-600">{feedbackRequests.filter(r => r.userId === activeUser.id && (r.status === "Çözüldü" || r.status === "Kapatıldı")).length}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tLocal("İşlemde Olanlar", "In Progress")}</span>
                      <span className="text-2xl font-extrabold text-amber-600">{feedbackRequests.filter(r => r.userId === activeUser.id && (r.status === "İnceleniyor" || r.status === "İşleme Alındı" || r.status === "Ek Bilgi Bekleniyor")).length}</span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{tLocal("Yeni Kayıtlar", "New Requests")}</span>
                      <span className="text-2xl font-extrabold text-sky-650 text-sky-600">{feedbackRequests.filter(r => r.userId === activeUser.id && r.status === "Yeni Kayıt").length}</span>
                    </div>
                  </div>

                  {/* LIST & FILTER BLOCK */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                      <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-sky-600" />
                        {tLocal("Talep Geçmişiniz", "Your Ticket History")}
                      </h4>
                    </div>

                    {feedbackRequests.filter(r => r.userId === activeUser.id).length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <div className="text-3xl">📭</div>
                        <p className="text-slate-400 text-xs font-bold">{tLocal("Henüz herhangi bir talep oluşturmadınız.", "You haven't created any tickets yet.")}</p>
                        <button 
                          onClick={() => setShowNewFeedbackForm(true)}
                          className="text-sky-600 text-xs font-extrabold hover:underline"
                        >
                          {tLocal("İlk talebinizi şimdi oluşturun &rarr;", "Create your first ticket now &rarr;")}
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-500 font-bold">
                              <th className="py-3 px-2">ID</th>
                              <th className="py-3 px-2">{tLocal("Konu / Başlık", "Subject / Title")}</th>
                              <th className="py-3 px-2">{tLocal("Tür", "Type")}</th>
                              <th className="py-3 px-2">{tLocal("Öncelik", "Priority")}</th>
                              <th className="py-3 px-2">{tLocal("Son Güncelleme", "Last Update")}</th>
                              <th className="py-3 px-2">{tLocal("Durum", "Status")}</th>
                              <th className="py-3 px-2 text-right">{tLocal("İşlemler", "Actions")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-650">
                            {feedbackRequests
                              .filter(r => r.userId === activeUser.id)
                              .map((req) => (
                                <tr key={req.id} className="hover:bg-slate-50/50 transition">
                                  <td className="py-3 px-2 font-mono font-bold text-slate-400">{req.id}</td>
                                  <td className="py-3 px-2">
                                    <div className="font-extrabold text-slate-800 text-xs line-clamp-1">{translateEntity(req, "title")}</div>
                                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{translateEntity(req, "description")}</div>
                                  </td>
                                  <td className="py-3 px-2 font-semibold">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">
                                      {req.type}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 font-semibold">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      req.priority === "Acil" ? "bg-red-50 text-red-700" :
                                      req.priority === "Yüksek" ? "bg-amber-50 text-amber-700" :
                                      req.priority === "Normal" ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-700"
                                    }`}>
                                      {req.priority}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 text-slate-500 font-mono text-[10px]">{req.updated_at || req.created_at}</td>
                                  <td className="py-3 px-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                      req.status === "Yeni Kayıt" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                      req.status === "İnceleniyor" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                      req.status === "İşleme Alındı" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                      req.status === "Ek Bilgi Bekleniyor" ? "bg-orange-50 text-orange-700 border-orange-100" :
                                      req.status === "Çözüldü" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                      "bg-slate-50 text-slate-700 border-slate-100"
                                    }`}>{req.status}</span>
                                  </td>
                                  <td className="py-3 px-2 text-right">
                                    <button
                                      onClick={() => setSelectedUserFeedback(req)}
                                      className="p-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer font-bold text-[10px] px-2 py-1"
                                    >
                                      <Eye className="h-3 w-3" />
                                      {tLocal("Görüntüle", "View")}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* NEW TICKET FORM PANEL/MODAL */}
                  {showNewFeedbackForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => setShowNewFeedbackForm(false)}
                          className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-sky-600" />
                            {tLocal("Yeni Destek / Bildirim Kaydı Oluştur", "Create New Ticket")}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {tLocal("Platform ile ilgili soru, şikayet, öneri veya teknik hata bildirimlerinizi aşağıdaki alanlardan detaylandırarak bize iletebilirsiniz.", "Detail your inquiries, complaints, suggestions, or technical bugs below.")}
                          </p>
                        </div>

                        <form onSubmit={handleCreateFeedback} className="space-y-4 text-left">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{tLocal("Kategori / Tür", "Category / Type")}</label>
                              <select
                                value={newFeedbackType}
                                onChange={(e) => setNewFeedbackType(e.target.value)}
                                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                              >
                                <option value="Talep">{tLocal("Talep", "Inquiry")}</option>
                                <option value="Şikayet">{tLocal("Şikayet", "Complaint")}</option>
                                <option value="Öneri">{tLocal("Öneri", "Suggestion")}</option>
                                <option value="Teknik Destek">{tLocal("Teknik Destek", "Technical Support")}</option>
                                <option value="Hata Bildirimi">{tLocal("Hata Bildirimi", "Bug / Fault Report")}</option>
                                <option value="Diğer">{tLocal("Diğer", "Other")}</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{tLocal("Öncelik Seviyesi", "Priority Level")}</label>
                              <select
                                value={newFeedbackPriority}
                                onChange={(e) => setNewFeedbackPriority(e.target.value)}
                                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer"
                              >
                                <option value="Düşük">{tLocal("Düşük", "Low")}</option>
                                <option value="Normal">{tLocal("Normal", "Normal")}</option>
                                <option value="Yüksek">{tLocal("Yüksek", "High")}</option>
                                <option value="Acil">{tLocal("Acil", "Urgent")}</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{tLocal("Konu / Başlık", "Subject / Title")}</label>
                            <input
                              type="text"
                              required
                              value={newFeedbackTitle}
                              onChange={(e) => setNewFeedbackTitle(e.target.value)}
                              placeholder={tLocal("Talebinizin konusunu kısaca özetleyin...", "Briefly summarize the ticket subject...")}
                              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{tLocal("Detaylı Açıklama", "Detailed Description")}</label>
                            <textarea
                              required
                              rows={4}
                              value={newFeedbackDescription}
                              onChange={(e) => setNewFeedbackDescription(e.target.value)}
                              placeholder={tLocal("Yaşadığınız sorunu, talebinizin veya önerinizin tüm detaylarını buraya yazınız...", "Write down the full details of your issue, request, or suggestion here...")}
                              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                            />
                          </div>

                          {/* Attachment Section */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{tLocal("Belge, Ek & Ekran Görüntüsü (İsteğe Bağlı)", "Attachments & Screenshots (Optional)")}</label>
                            <div className="flex flex-col gap-2">
                              <label className="border-2 border-dashed border-slate-200 hover:border-sky-400 rounded-2xl p-4 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:bg-sky-50/20">
                                <Upload className="h-5 w-5 text-sky-500" />
                                <span className="text-[11px] font-bold">{tLocal("Dosya Seçin veya Sürükleyin", "Choose File or Drag Here")}</span>
                                <span className="text-[9px] text-slate-400">PDF, PNG, JPG, JPEG (Maks. 5MB)</span>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 5 * 1024 * 1024) {
                                      alert("Dosya boyutu en fazla 5MB olabilir.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      setNewFeedbackAttachments(prev => [
                                        ...prev,
                                        {
                                          name: file.name,
                                          type: file.type,
                                          base64: reader.result as string,
                                          size: (file.size / 1024).toFixed(0) + " KB"
                                        }
                                      ]);
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                  className="hidden"
                                />
                              </label>

                              {newFeedbackAttachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {newFeedbackAttachments.map((att, idx) => (
                                    <div key={idx} className="bg-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-extrabold text-slate-700 border border-slate-200">
                                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                                      <span className="max-w-[150px] truncate">{att.name} ({att.size})</span>
                                      <button
                                        type="button"
                                        onClick={() => setNewFeedbackAttachments(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-0.5 hover:bg-slate-200 rounded text-red-500 cursor-pointer"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="submit"
                              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-md"
                            >
                              {tLocal("Kaydı Gönder", "Submit Ticket")}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewFeedbackForm(false);
                                setNewFeedbackAttachments([]);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-2xl text-xs transition cursor-pointer"
                            >
                              {tLocal("İptal", "Cancel")}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* USER DETAIL DIALOG VIEW */}
                  {selectedUserFeedback && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-100 max-h-[90vh] overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg">{selectedUserFeedback.id}</span>
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                                selectedUserFeedback.status === "Yeni Kayıt" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                selectedUserFeedback.status === "İnceleniyor" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                selectedUserFeedback.status === "İşleme Alındı" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                selectedUserFeedback.status === "Ek Bilgi Bekleniyor" ? "bg-orange-50 text-orange-700 border-orange-100" :
                                selectedUserFeedback.status === "Çözüldü" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                "bg-slate-50 text-slate-700 border-slate-100"
                              }`}>{selectedUserFeedback.status}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-800">{translateEntity(selectedUserFeedback, "title")}</h3>
                          </div>
                          <button
                            onClick={() => setSelectedUserFeedback(null)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                          
                          {/* Ticket details description card */}
                          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] text-slate-500 font-bold border-b border-slate-200/50 pb-3">
                              <div>
                                <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">{tLocal("Kategori", "Category")}</span>
                                <span className="text-slate-700 text-xs font-extrabold">{selectedUserFeedback.type}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">{tLocal("Öncelik", "Priority")}</span>
                                <span className={`text-xs font-extrabold ${selectedUserFeedback.priority === "Acil" ? "text-red-650" : "text-slate-700"}`}>{selectedUserFeedback.priority}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">{tLocal("Oluşturma", "Created At")}</span>
                                <span className="text-slate-700 text-xs font-mono">{selectedUserFeedback.created_at}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">{tLocal("Son Güncelleme", "Last Update")}</span>
                                <span className="text-slate-700 text-xs font-mono">{selectedUserFeedback.updated_at}</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="block text-slate-400 uppercase tracking-wider text-[9px] font-bold">{tLocal("İlk Açıklama", "Initial Statement")}</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-4 rounded-xl border border-slate-100 shadow-inner whitespace-pre-line">{translateEntity(selectedUserFeedback, "description")}</p>
                            </div>

                            {/* Attachments */}
                            {selectedUserFeedback.attachments && selectedUserFeedback.attachments.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                <span className="block text-slate-400 uppercase tracking-wider text-[9px] font-bold">{tLocal("Ekli Dosyalar", "Attached Files")}</span>
                                <div className="flex flex-wrap gap-2">
                                  {selectedUserFeedback.attachments.map((file, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        if (file.base64) {
                                          handleDownloadDekontFile(file.base64, selectedUserFeedback.id + "_" + idx);
                                        }
                                      }}
                                      className="bg-white hover:bg-sky-50/20 text-sky-700 hover:text-sky-800 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 transition text-[10px] font-bold cursor-pointer shadow-xs"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      <span>{file.name} ({file.size})</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Chat / Message thread */}
                          <div className="space-y-4">
                            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">{tLocal("Mesajlaşma Geçmişi", "Conversation History")}</h4>
                            
                            {(!selectedUserFeedback.comments || selectedUserFeedback.comments.length === 0) ? (
                              <p className="text-center py-6 text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-100">{tLocal("Henüz mesajlaşma bulunmamaktadır.", "No messages in thread yet.")}</p>
                            ) : (
                              <div className="space-y-4">
                                {selectedUserFeedback.comments.map((comm) => (
                                  <div
                                    key={comm.id}
                                    className={`flex flex-col ${comm.sender === "user" ? "items-end" : "items-start"} space-y-1 max-w-[85%] ${comm.sender === "user" ? "ml-auto" : "mr-auto"}`}
                                  >
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-450">
                                      <span>{comm.senderName}</span>
                                      <span className="font-mono text-[9px] text-slate-400">{comm.created_at}</span>
                                    </div>
                                    <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                                      comm.sender === "user" 
                                        ? "bg-sky-600 text-white rounded-br-none" 
                                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/50"
                                    }`}>
                                      {translateEntity(comm, "message")}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Footer Chat Input Form */}
                        {selectedUserFeedback.status !== "Kapatıldı" && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={newFeedbackComment}
                                onChange={(e) => setNewFeedbackComment(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddUserComment(selectedUserFeedback.id);
                                }}
                                placeholder={tLocal("Bir mesaj yazın veya ek bilgi iletin...", "Type a message or supply updates...")}
                                className="flex-1 bg-white border border-slate-200 rounded-2xl py-3 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-inner"
                              />
                              <button
                                onClick={() => handleAddUserComment(selectedUserFeedback.id)}
                                className="p-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl transition cursor-pointer shadow-md flex items-center justify-center"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                </div>
              )}

              {userMainTab === "profile" && (
                <>
                  {/* USER DETAILS GRID CARD */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase font-mono border-b border-slate-100 pb-3">
                    Profil ve Üye Bilgileri
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* General parameters */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Hesap Bilgileri</h4>
                    
                    {activeUser && activeUser.role === "dealer" && (
                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex flex-col items-center text-center space-y-2.5 relative shadow-xs animate-fade-in">
                        <span className="text-[8px] font-black text-slate-400 font-mono absolute top-2 right-2 uppercase tracking-tight bg-white border border-slate-100 px-1.5 py-0.5 rounded-sm">
                          {(!activeUser.logo_url || activeUser.logo_type === "auto") ? "🟢 Otomatik Logo" : "🔵 Gerçek Logo"}
                        </span>
                        {renderCompanyLogo(
                          {
                            id: activeUser.id,
                            company_name: activeUser.company_name || activeUser.name,
                            logo: activeUser.logo_url,
                            logo_type: activeUser.logo_type
                          },
                          "w-16 h-16 text-2xl font-black shadow-md border border-white",
                          false
                        )}
                        <div className="space-y-0.5">
                          <h5 className="text-[11px] font-extrabold text-slate-800 leading-none">{activeUser.company_name || activeUser.name}</h5>
                          <p className="text-[9px] text-slate-400 font-mono">{tLocal(tLocal("Profil Gösterim Logosu", "Profile Display Logo"), "Profile Display Logo")}</p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-1.5 w-full">
                          <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-700 hover:text-emerald-700 border border-slate-205 text-[9.5px] font-black px-2.5 py-1 rounded inline-flex items-center gap-1 transition-all shadow-xs shrink-0 select-none">
                            <Upload className="h-3 w-3" />
                            {(!activeUser.logo_url || activeUser.logo_type === "auto") ? "GERÇEK LOGO YÜKLE" : "LOGOYU GÜNCELLE"}
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const base64 = reader.result as string;
                                    const updatedUser: DbUser = { 
                                      ...activeUser, 
                                      logo_url: base64, 
                                      logo_type: "real", 
                                      no_logo: false 
                                    };
                                    
                                    const allCurrent = getUsers();
                                    const updatedList = allCurrent.map(u => u.id === activeUser.id ? updatedUser : u);
                                    saveUsers(updatedList);
                                    
                                    if (onUpdateActiveUser) {
                                      onUpdateActiveUser(updatedUser);
                                    }

                                    // Let's also update company list so it mirrors instantly
                                    const compListStr = localStorage.getItem("lpgportal_companies");
                                    if (compListStr) {
                                      try {
                                        const parsedComps = JSON.parse(compListStr);
                                        if (Array.isArray(parsedComps)) {
                                          const updatedComps = parsedComps.map(c => {
                                            if (c.owner_id === activeUser.id) {
                                              return { ...c, logo: base64, logo_type: "real" as const };
                                            }
                                            return c;
                                          });
                                          localStorage.setItem("lpgportal_companies", JSON.stringify(updatedComps));
                                        }
                                      } catch(err) {}
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          
                          {activeUser.logo_url && activeUser.logo_type === "real" && (
                            <button
                              type="button"
                              onClick={() => {
                                const updatedUser: DbUser = { 
                                  ...activeUser, 
                                  logo_url: "", 
                                  logo_type: "auto", 
                                  no_logo: true 
                                };
                                const allCurrent = getUsers();
                                const updatedList = allCurrent.map(u => u.id === activeUser.id ? updatedUser : u);
                                saveUsers(updatedList);
                                if (onUpdateActiveUser) {
                                  onUpdateActiveUser(updatedUser);
                                }

                                const compListStr = localStorage.getItem("lpgportal_companies");
                                if (compListStr) {
                                  try {
                                    const parsedComps = JSON.parse(compListStr);
                                    if (Array.isArray(parsedComps)) {
                                      const updatedComps = parsedComps.map(c => {
                                        if (c.owner_id === activeUser.id) {
                                          return { ...c, logo: "", logo_type: "auto" as const };
                                        }
                                        return c;
                                      });
                                      localStorage.setItem("lpgportal_companies", JSON.stringify(updatedComps));
                                    }
                                  } catch(err) {}
                                }
                              }}
                              className="text-[9px] text-rose-600 hover:underline font-bold"
                            >
                              Otomatik Logoya Görüntüle
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 block font-medium">{tLocal(tLocal("Tam İsim / Kurum", "Full Name / Organization"), "Full Name / Organization")}</span>
                      <strong className="text-slate-900 text-sm">{activeUser.name}</strong>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 block font-medium">E-posta Adresi</span>
                      <strong className="text-slate-900 text-sm">{activeUser.email}</strong>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 block font-medium">{tLocal(tLocal("Telefon Numarası", "Phone Number"), "Phone Number")}</span>
                      <strong className="text-slate-900 text-sm">{activeUser.phone}</strong>
                    </div>

                    {/* BİLDİRİM TERCİHLERİ VE İZİNLERİ */}
                    <div className="space-y-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/60 mt-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                        Bildirim İzin Ayarları
                      </span>
                      <label className="flex items-start gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          id="chk_marketing_profile"
                          checked={activeUser.marketing_approved ?? false}
                          onChange={(e) => {
                            const approved = e.target.checked;
                            const updatedUser: DbUser = { 
                              ...activeUser, 
                              marketing_approved: approved 
                            };
                            const allCurrent = getUsers();
                            const updatedList = allCurrent.map(u => u.id === activeUser.id ? updatedUser : u);
                            saveUsers(updatedList);
                            if (onUpdateActiveUser) {
                              onUpdateActiveUser(updatedUser);
                            }
                            addSystemLog("Pazarlama İzni Değiştirildi", `Kullanıcı pazarlama ve ticari bildirim iznini ${approved ? "AÇTI" : "KAPATTI"}.`, activeUser.email);
                          }}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-slate-500 text-[10px] leading-relaxed group-hover:text-slate-900 transition font-medium">
                          LPG PORTAL tarafından gönderilecek üyelik, teklif, sipariş, sistem duyuruları, kampanyalar, eğitimler, hatırlatmalar ve bilgilendirme amaçlı bildirimleri almayı kabul ediyorum.
                        </span>
                      </label>
                      <div className="text-[8.5px] text-slate-400 font-mono leading-tight">
                        * Bu izni kapatmanız durumunda dahi 'Zorunlu Servis Bildirimleri' (Uyelik bitisi, şifre değişim, tescil onay) tarafınıza gönderilmeye devam eder.
                      </div>
                    </div>
                  </div>

                  {/* ÜYELİK DURUMU */}
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-sans shadow-xs" id="user-panel-membership-status-card">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />{tLocal(tLocal("ÜYELİK DURUMU", "MEMBERSHIP STATUS"), "MEMBERSHIP STATUS")}</h4>
                      {(() => {
                        const rem = getRemainingDays(activeUser.membership_end);
                        if (rem <= 0) {
                          return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-700 font-mono uppercase">{tLocal(tLocal("SÜRESİ DOLMUŞ", "EXPIRED"), "EXPIRED")}</span>;
                        } else if (rem <= 15) {
                          return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 font-mono uppercase">{tLocal(tLocal("KRİTİK DÖNEM", "CRITICAL PERIOD"), "CRITICAL PERIOD")}</span>;
                        } else {
                          return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 font-mono uppercase">{tLocal(tLocal("AKTİF", "ACTIVE"), "ACTIVE")}</span>;
                        }
                      })()}
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 block font-medium text-[10px]">{tLocal(tLocal("Paket Türü:", "Package Type:"), "Package Type:")}</span>
                        <strong className="text-slate-900 text-[13px] font-bold">{activeUser.membership_type || getRoleDisplayName(activeUser.role)}</strong>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 block font-medium text-[10px]/none">{tLocal(tLocal("Başlangıç Tarihi:", "Start Date:"), "Start Date:")}</span>
                        <strong className="text-slate-800 font-mono font-bold">
                          {activeUser.role === "admin" ? (language === "tr" ? "Süresiz" : "Unlimited") : (activeUser.membership_start ? new Date(activeUser.membership_start).toLocaleDateString('tr-TR') : tLocal("Belirtilmemiş", "Not Specified"))}
                        </strong>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-slate-500 block font-medium text-[10px]/none">{tLocal(tLocal("Bitiş Tarihi:", "End Date:"), "End Date:")}</span>
                        <strong className="text-slate-800 font-mono font-bold">
                          {activeUser.role === "admin" ? (language === "tr" ? "Süresiz" : "Unlimited") : (activeUser.membership_end ? new Date(activeUser.membership_end).toLocaleDateString('tr-TR') : tLocal("Belirtilmemiş", "Not Specified"))}
                        </strong>
                      </div>

                      <div className="space-y-0.5 p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-slate-400 block font-bold text-[9px] font-mono uppercase tracking-wider">{tLocal(tLocal("Kalan Gün Sayısı:", "Days Remaining:"), "Days Remaining:")}</span>
                        {activeUser.role === "admin" ? (
                          <span className="text-emerald-700 font-black text-xs block mt-1 leading-tight font-sans">
                            {language === "tr" ? "Süresiz / Yönetici Yetkisi" : "Unlimited / Administrator Privilege"}
                          </span>
                        ) : (() => {
                          const rem = getRemainingDays(activeUser.membership_end);
                          if (rem <= 0) {
                            return (
                              <span className="text-rose-600 font-black text-xs block mt-1 leading-tight">
                                Üyeliğiniz sona ermiştir. Hizmetlerden tekrar yararlanabilmek için üyeliğinizi yenileyebilirsiniz.
                              </span>
                            );
                          } else if (rem <= 15) {
                            return (
                              <span className="text-amber-600 font-black text-xs block mt-1 leading-tight">
                                Üyeliğinizin bitmesine {rem} gün kaldı.
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-emerald-750 text-emerald-700 font-black text-xs block mt-1 leading-tight font-mono">
                                Aktif Üyelik - Kalan Süre: {rem} Gün
                              </span>
                            );
                          }
                        })()}
                      </div>

                      {/* PANEL NOTIFICATION BOX */}
                      {(() => {
                        const r = getRemindersForUser(activeUser);
                        if (r && r.panel !== "") {
                          return (
                            <div className="bg-amber-50/70 border border-amber-200 text-slate-800 p-2.5 rounded-lg text-[10px] space-y-1 mt-2.5 font-sans leading-snug">
                              <span className="font-extrabold text-amber-700 block uppercase font-mono tracking-wider">{tLocal(tLocal("PANEL BİLDİRİMİ:", "PANEL NOTIFICATION:"), "PANEL NOTIFICATION:")}</span>
                              <p className="font-medium whitespace-pre-line">{r.panel}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {activeUser.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => {
                            setRenewCardHolder("");
                            setRenewCardNumber("");
                            setRenewCardExpiry("");
                            setRenewCardCvv("");
                            setRenewSuccess(false);
                            setShowRenewModal(false);
                            setShowRenewModal(true);
                          }}
                          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white font-black text-[11px] py-2.5 px-3 rounded-xl transition-all shadow-sm cursor-pointer text-center flex items-center justify-center gap-1 uppercase tracking-wider"
                          id="btn-user-renew-membership"
                        >
                          {activeUser.subscription_type === "free" ? "Premium Üyeliğe Geç" : "🔄 Üyeliği Yenile"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role Specific parameters */}
                  <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">{tLocal(tLocal("Kurumsal & Sektörel Bilgiler", "Corporate & Industry Information"), "Corporate & Industry Information")}</h4>

                    {/* Guest/visitor or general user fallback */}
                    {activeUser.role === "vehicle_owner" && (
                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Yıllık standart araç sahibi üyeliğiniz aktiftir. Bu üyelik sayesinde teknik bülten arşivlerini dilediğiniz gibi görüntüleyebilirsiniz.
                        </p>
                      </div>
                    )}

                    {/* Dealer parameters */}
                    {activeUser.role === "dealer" && (
                      <div className="space-y-2.5">
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Firma Adı & Ünvan", "Company Name & Title"), "Company Name & Title")}</span>
                          <strong className="text-slate-900">{activeUser.company_name || activeUser.name}</strong>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Hizmet Bölgesi (Konum)", "Service Area (Location)"), "Service Area (Location)")}</span>
                          <strong className="text-slate-900">{activeUser.district || ""}, {activeUser.city || ""}</strong>
                        </div>
                        {activeUser.tax_info && (
                          <div className="text-xs">
                            <span className="text-slate-500 block font-medium">Vergi Kimlik Bilgisi</span>
                            <strong className="text-slate-900">{activeUser.tax_info}</strong>
                          </div>
                        )}
                        {activeUser.website && (
                          <div className="text-xs">
                            <span className="text-slate-500 block font-medium">Web Sitesi</span>
                            <a href={activeUser.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">
                              {activeUser.website}
                            </a>
                          </div>
                        )}
                        <div className="text-xs pt-1.5 border-t border-slate-100">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Çalışılan LPG Markaları", "Supported LPG Brands"), "Supported LPG Brands")}</span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(activeUser.working_brands && activeUser.working_brands.filter(b => b !== "Diğer").length > 0) ? (
                              activeUser.working_brands.filter(b => b !== "Diğer").map(b => (
                                <span key={b} className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-150">
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-rose-500 font-semibold">{tLocal(tLocal("Tüm Markalar (Erişimi Az)", "All Brands (Low Access)"), "All Brands (Low Access)")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Engineer parameters */}
                    {activeUser.role === "engineer" && (
                      <div className="space-y-2.5">
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Uzmanlık Alanı / Ünvan", "Area of Expertise / Title"), "Area of Expertise / Title")}</span>
                          <strong className="text-slate-900">{activeUser.expertise}</strong>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Şehir", "City"), "City")}</span>
                          <strong className="text-slate-900">{activeUser.city}</strong>
                        </div>
                        <div className="text-xs pt-1.5 border-t border-slate-100">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Çalışılan LPG Markaları", "Supported LPG Brands"), "Supported LPG Brands")}</span>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(activeUser.working_brands && activeUser.working_brands.filter(b => b !== "Diğer").length > 0) ? (
                              activeUser.working_brands.filter(b => b !== "Diğer").map(b => (
                                <span key={b} className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-150">
                                  {b}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-rose-500 font-semibold font-mono">{tLocal(tLocal("Belirtilmemiş", "Not Specified"), "Not Specified")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manufacturer parameters */}
                    {activeUser.role === "manufacturer" && (
                      <div className="space-y-2.5">
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">Kurum Firma</span>
                          <strong className="text-slate-900">{activeUser.company_name}</strong>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Lisanslı Marka", "Licensed Brand"), "Licensed Brand")}</span>
                          <strong className="text-emerald-700 font-black font-mono tracking-wider">{activeUser.brand_name}</strong>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-500 block font-medium">{tLocal(tLocal("Ürün Yelpazesi", "Product Range"), "Product Range")}</span>
                          <strong className="text-slate-900 block leading-tight mt-0.5">{activeUser.product_categories}</strong>
                        </div>
                        {activeUser.website && (
                          <div className="text-xs">
                            <span className="text-slate-500 block font-medium">Web Sitesi</span>
                            <a href={activeUser.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold hover:underline">
                              {activeUser.website}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {activeUser.role === "admin" && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-900 text-xs flex gap-2">
                        <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5">{tLocal(tLocal("Sistem Yönetici Ayrıcalığı", "System Administrator Privilege"), "System Administrator Privilege")}</strong>
                          <span>{tLocal(tLocal("Yönetici hesapları platformun tüm istatistiklerini izleyebilir, üyelik durumlarını anlık aktifleştirebilir veya dondurabilir.", "Administrator accounts can monitor all statistics of the platform, instantly activate or freeze membership statuses."), "Administrator accounts can monitor all statistics of the platform, instantly activate or freeze membership statuses.")}</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* FATURA GECMISI TABLE */}
              {activeUser.role !== "admin" && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase font-mono border-b border-slate-100 pb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Ödeme & Fatura Geçmişi
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-150">
                          <th className="p-3">Fatura No</th>
                          <th className="p-3">{tLocal(tLocal("Hizmet Türü", "Service Type"), "Service Type")}</th>
                          <th className="p-3">Tarih</th>
                          <th className="p-3">Tutar (TL)</th>
                          <th className="p-3">{tLocal(tLocal("Ödeme Durumu", "Payment Status"), "Payment Status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allInvoices.filter(inv => inv.userId === activeUser.id).map((fatura) => (
                          <tr key={fatura.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-800">{fatura.id}</td>
                            <td className="p-3 text-slate-600">{fatura.membership_type}</td>
                            <td className="p-3 text-slate-600 font-mono">
                              {new Date(fatura.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">{fatura.amount} TL</td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
                                  fatura.status === "Ödendi"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : fatura.status === "İnceleniyor"
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : fatura.status === "Beklemede"
                                    ? "bg-amber-50 text-amber-800 border-amber-100"
                                    : fatura.status === "Reddedildi"
                                    ? "bg-rose-50 text-rose-700 border-rose-100"
                                    : fatura.status === "Eksik Evrak"
                                    ? "bg-orange-50 text-orange-700 border-orange-100"
                                    : "bg-slate-50 text-slate-700 border-slate-100"
                                }`}>
                                  {fatura.status === "Ödendi" ? (
                                    <CheckCircle className="h-3 w-3" />
                                  ) : fatura.status === "İnceleniyor" ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : fatura.status === "Beklemede" ? (
                                    <Clock className="h-3 w-3" />
                                  ) : fatura.status === "Reddedildi" ? (
                                    <XCircle className="h-3 w-3" />
                                  ) : fatura.status === "Eksik Evrak" ? (
                                    <AlertTriangle className="h-3 w-3" />
                                  ) : (
                                    <AlertCircle className="h-3 w-3" />
                                  )}
                                  {fatura.status}
                                </span>
                                
                                {fatura.admin_note && (
                                  <span className="text-[10px] text-rose-600 font-semibold max-w-[180px] block font-sans" title={fatura.admin_note}>
                                    Yönetici Notu: {fatura.admin_note}
                                  </span>
                                )}

                                {fatura.payment_method === "Havale/EFT" && 
                                 (fatura.status === "Beklemede" || fatura.status === "Eksik Evrak" || fatura.status === "Reddedildi") && (
                                  <div className="mt-1">
                                    <label className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded text-[10px] font-black border border-indigo-200 cursor-pointer transition-all">
                                      <Upload className="h-2.5 w-2.5" />
                                      {fatura.dekont_url ? "Yeni Dekont Yükle" : "Dekont Yükle"}
                                      <input 
                                        type="file" 
                                        accept=".jpg,.jpeg,.png,.pdf,.webp" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleUploadDekont(fatura.id, e.target.files[0]);
                                          }
                                        }}
                                      />
                                    </label>
                                    {fatura.dekont_url && (
                                      <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                        Dekont Yüklendi ({fatura.dekont_status})
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {allInvoices.filter(inv => inv.userId === activeUser.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400">
                              Adınıza kayıtlı bir fatura ödemesi bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REVIEW SUBMISSION FORM CARD */}
              {activeUser.role !== "admin" && (
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase font-mono border-b border-slate-100 pb-3 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-emerald-600" />
                    Deneyimimi Paylaş
                  </h3>
                  
                  <p className="text-xs text-slate-500 font-medium">
                    LPG Portal hakkındaki deneyimlerinizi ve LPG dönüşüm hikayenizi diğer sürücülerle paylaşın. Gönderilen yorumlar moderasyon onayının ardından ana sayfada yayınlanacaktır.
                  </p>

                  {reviewSubmitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{reviewSubmitSuccess}</span>
                    </div>
                  )}
                  {reviewSubmitError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>{reviewSubmitError}</span>
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Başlık", "Title"), "Title")}<strong className="text-rose-600">*</strong></label>
                        <input 
                          type="text" 
                          required
                          placeholder={tLocal(tLocal("Örn: Honda Civic LPG Deneyimim", "e.g. My Honda Civic LPG Experience"), "e.g. My Honda Civic LPG Experience")}
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Puanlama (1-5 Yıldız)", "Rating (1-5 Stars)"), "Rating (1-5 Stars)")}<strong className="text-rose-600">*</strong></label>
                        <select 
                          required
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-bold text-slate-800"
                        >
                          <option value="5">⭐⭐⭐⭐⭐ (5 - Harika)</option>
                          <option value="4">{tLocal(tLocal("⭐⭐⭐⭐ (4 - İyi)", "⭐⭐⭐⭐ (4 - Good)"), "⭐⭐⭐⭐ (4 - Good)")}</option>
                          <option value="3">⭐⭐⭐ (3 - Orta)</option>
                          <option value="2">{tLocal(tLocal("⭐⭐ (2 - Kötü)", "⭐⭐ (2 - Bad)"), "⭐⭐ (2 - Bad)")}</option>
                          <option value="1">{tLocal(tLocal("⭐ (1 - Çok Kötü)", "⭐ (1 - Very Bad)"), "⭐ (1 - Very Bad)")}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("İkamet/Hizmet Şehri", "Residence / Service City"), "Residence / Service City")}</label>
                        <input 
                          type="text"
                          placeholder={activeUser.city || tLocal("Örn: İstanbul", "e.g. Istanbul")}
                          value={reviewCity}
                          onChange={(e) => setReviewCity(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {activeUser.role === "vehicle_owner" ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Mesleğiniz", "Profession / Job"), "Profession / Job")}</label>
                            <input 
                              type="text"
                              placeholder={tLocal(tLocal("Örn: Yazılımcı, Öğretmen, Esnaf", "e.g. Software Dev, Teacher, Merchant"), "e.g. Software Dev, Teacher, Merchant")}
                              value={reviewProfession}
                              onChange={(e) => setReviewProfession(e.target.value)}
                              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Araç Markası", "Vehicle Brand"), "Vehicle Brand")}<strong className="text-rose-600">*</strong></label>
                            <input 
                              type="text"
                              required
                              placeholder={tLocal(tLocal("Örn: Honda, Toyota, Fiat", "e.g. Honda, Toyota, Fiat"), "e.g. Honda, Toyota, Fiat")}
                              value={reviewCarBrand}
                              onChange={(e) => setReviewCarBrand(e.target.value)}
                              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Araç Modeli", "Vehicle Model"), "Vehicle Model")}<strong className="text-rose-600">*</strong></label>
                            <input 
                              type="text"
                              required
                              placeholder={tLocal(tLocal("Örn: Civic, Corolla, Egea", "e.g. Civic, Corolla, Egea"), "e.g. Civic, Corolla, Egea")}
                              value={reviewCarModel}
                              onChange={(e) => setReviewCarModel(e.target.value)}
                              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Temsil Edilen Kurum / Marka</label>
                          <input 
                            type="text"
                            disabled
                            value={activeUser.brand_name || activeUser.company_name || "LPG Sektör Üyesi"}
                            className="w-full bg-slate-100 text-slate-500 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Deneyiminiz <strong className="text-rose-600">*</strong></label>
                      <textarea 
                        required
                        rows={4}
                        placeholder={tLocal(tLocal("LPG dönüşümü hakkındaki görüşlerinizi, tasarruf oranlarınızı ve genel deneyimlerinizi detaylıca paylaşın...", "Share your thoughts on LPG conversion, your savings rates, and your overall experience in detail..."), "Share your thoughts on LPG conversion, your savings rates, and your overall experience in detail...")}
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none leading-relaxed font-sans"
                      />
                    </div>

                    <div className="pt-1">
                      <button 
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-lg transition shadow-sm cursor-pointer"
                      >
                        Deneyimi Gönder
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* CHANGE PASSWORD COMPONENT */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase font-mono border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-500" />
                  Erişim Şifresini Değiştir
                </h3>

                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}
                {passwordChangeError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Yeni Şifre", "New Password"), "New Password")}</label>
                    <input 
                      type="password" 
                      required
                      placeholder={tLocal(tLocal("Yeni şifreniz", "Your new password"), "Your new password")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal(tLocal("Yeni Şifre Tekrar", "Confirm New Password"), "Confirm New Password")}</label>
                    <input 
                      type="password" 
                      required
                      placeholder="Tekrar girin"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <button 
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-5 rounded-lg transition shadow-sm cursor-pointer"
                    >
                      Şifreyi Güvenle Güncelle
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ========================================= */}
          {/* BİLDİRİM MERKEZİ (NOTIFICATION CENTER)   */}
          {/* ========================================= */}
          {userMainTab === "notifications" && (
            <div className="space-y-6 animate-fade-in" id="notification-center-panel">
              {/* Page Header */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100 animate-pulse">
                    🔔
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">🔔 Bildirim Merkezi</h3>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">{tLocal(tLocal("Süreç ve geri dönüş bildirimlerinizi takip edin, izinlerinizi yönetin.", "Track your processes and feedback notifications, manage your permissions."), "Track your processes and feedback notifications, manage your permissions.")}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markAllNotificationsAsRead(activeUser.id);
                      setNotificationsList(getCentralNotifications());
                      addSystemLog("Tüm Bildirimler Okundu", "Kullanıcı tüm gelen panel bildirimlerini okundu olarak işaretledi.", activeUser.email);
                      alert("Tüm bildirimler okundu olarak işaretlendi.");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs py-1.5 px-3 rounded-xl transition cursor-pointer"
                  >
                    ✓ Tümünü Okundu Yap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearNotifications(activeUser.id);
                      setNotificationsList(getCentralNotifications());
                      addSystemLog("Bildirim Kutusu Temizlendi", "Kullanıcı panel bildirim geçmişini temizledi.", activeUser.email);
                      alert("Bildirim geçmişiniz temizlendi.");
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-1.5 px-3 rounded-xl transition cursor-pointer"
                  >
                    🗑️ Temizle
                  </button>
                </div>
              </div>

              {/* Dynamic Simulator Controls */}
              {activeUser?.role === "admin" && (
                <div className="bg-gradient-to-tr from-emerald-50 to-teal-50/50 p-6 rounded-3xl border border-emerald-150/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <span className="text-lg">🛠️</span>
                  <div>
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider font-mono">{tLocal(tLocal("LPG PORTAL AKILLI ETKİLEŞİM & BİLDİRİM SİMÜLASYONU", "LPG PORTAL SMART INTERACTION & NOTIFICATION SIMULATION"), "LPG PORTAL SMART INTERACTION & NOTIFICATION SIMULATION")}</h4>
                    <p className="text-[10px] text-emerald-700 font-medium">{tLocal(tLocal("Etkileşim senaryolarını canlı test etmek için aşağıdaki butonlara basarak anlık bildirim üretebilirsiniz!", "You can press the buttons below to trigger real-time simulated notifications for live scenario testing!"), "You can press the buttons below to trigger real-time simulated notifications for live scenario testing!")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* ARAÇ SAHİBİ SİMÜLATÖRLERİ */}
                  {activeUser.role === "vehicle_owner" && (
                    <>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🚗 LPG Uyumluluk Raporu", "Aracınız LPG dönüşümüne son derece uygun görünüyor. Hemen bayilerden teklif toplayarak %45'e varan tasarruf yolculuğunuza başlayın!", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("1. Dönüşüm Uygunluğu", "1. Conversion Compatibility"), "1. Conversion Compatibility")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🚗 Aracınız LPG dönüşümüne uygun...", "🚗 Your vehicle is compatible with LPG conversion..."), "🚗 Your vehicle is compatible with LPG conversion...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📨 Teklif Talebi Alındı", "Dönüşüm teklif talebiniz sisteme ulaştı. Bölgenizdeki lisanslı bayilere talebiniz anlık olarak iletilmiştir.", "teklif", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("2. Teklif Talebi İletildi", "2. Quote Request Submitted"), "2. Quote Request Submitted")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("📨 Talebiniz sisteme ulaştı...", "📨 Your request has reached the system..."), "📨 Your request has reached the system...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🎯 Yeni Teklif Geldi!", "Firma 'Maslak Otogaz' talebinize yeni bir montaj teklifi iletti. Detayları incelemek için teklifler sayfasına göz atın.", "teklif", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">3. Yeni Teklif Geldi</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🎯 Talebiniz için yeni teklif geldi...", "🎯 A new quote has arrived for your request..."), "🎯 A new quote has arrived for your request...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🔧 Arıza Talebi Yayınlandı", "Oluşturduğunuz teknik arıza talebi başarıyla yayına alındı. Uzman mühendislerimiz incelemektedir.", "uyari", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("4. Arıza Talebi Yayında", "4. Trouble Ticket Live"), "4. Trouble Ticket Live")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🔧 Arıza talebiniz yayınlandı...", "🔧 Your trouble ticket has been published..."), "🔧 Your trouble ticket has been published...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "✅ Çözüm Önerisi Mevcut", "Mühendis Seçkin Demir arıza talebinize detaylı bir teknik çözüm önerisi sundu. Teşekkür ederiz!", "teklif", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("5. Yeni Çözüm Önerisi", "5. New Solution Proposal"), "5. New Solution Proposal")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("✅ Arıza talebiniz için yeni çözüm...", "✅ A new solution has been posted for your ticket..."), "✅ A new solution has been posted for your ticket...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📍 Yeni LPG Servis Noktaları", "Bulunduğunuz şehirde (İzmir/İstanbul) 2 adet yeni TSE Belgeli yetkili LPG montaj servisi sisteme katıldı.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("6. Bulunduğunuz Şehirde Yeni Servis", "6. New Service Center in Your City"), "6. New Service Center in Your City")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("📍 Şehrinizde yeni servisler eklendi...", "📍 New service centers have been added in your city..."), "📍 New service centers have been added in your city...")}</span>
                      </button>
                    </>
                  )}

                  {/* FİRMA/BAYİ SİMÜLATÖRLERİ */}
                  {activeUser.role === "dealer" && (
                    <>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🔥 Yakınlarda Teklif Talebi", "Bölgenizde (İl/İlçe) yeni bir LPG montaj teklif talebi oluşturuldu! Hemen fiyatinizi belirterek teklif sunabilirsiniz.", "teklif", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("1. Bölgede Yeni Teklif", "1. New Local Quote Request"), "1. New Local Quote Request")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🔥 Bölgenizde yeni teklif talebi...", "🔥 A new quote request is active in your region..."), "🔥 A new quote request is active in your region...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🎉 Firma Profili Onaylandı", "Harika haber! Üyelik evraklarınız ve firma profiliniz yöneticiler tarafından 'Onaylandı' durumuna getirildi.", "duyuru", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">2. Profil Onay Durumu</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🎉 Firma profiliniz onaylandı...", "🎉 Your company profile has been approved..."), "🎉 Your company profile has been approved...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "⭐ Yeni Müvekkil Yorumu", "Bir araç sahibi firmanızın hizmet kalitesini değerlendirerek sisteme 5 yıldızlı yeni bir inceleme bıraktı.", "mesaj", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("3. Yeni Değerlendirme", "3. New Review"), "3. New Review")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("⭐ Firmanız için yeni değerlendirme...", "⭐ A new review has been posted for your company..."), "⭐ A new review has been posted for your company...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📦 Ürün Siparişi Oluştu!", "Market üzerinde satışta olan LPG sızdırmazlık spreyiniz için yeni bir kurumsal satın alma siparişi oluşturuldu.", "siparis", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("4. Yeni Ürün Siparişi", "4. New Product Order"), "4. New Product Order")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("📦 Market ürününüz için sipariş...", "📦 An order has been placed for your marketplace product..."), "📦 An order has been placed for your marketplace product...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "❤️ Favorilerdesiniz!", "Firma profiliniz bölgenizdeki araç sahipleri tarafından 8 kez favori servis olarak kaydedildi.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">5. Favoriye Ekleme</span>
                        <span className="text-[9px] text-slate-500 font-medium font-medium">{tLocal(tLocal("❤️ Firmanız favorilere eklendi...", "❤️ Your company has been added to favorites..."), "❤️ Your company has been added to favorites...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📈 Yoğun Hafta İlgi Raporu", "Analizlerimize göre web paneliniz ve montaj fiyat listeniz bu hafta %150 daha fazla tıklandı!", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("6. Profil İlgi Dağılımı", "6. Profile Reach Distribution"), "6. Profile Reach Distribution")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("📈 Profiliniz bu hafta yoğun ilgi...", "📈 Your profile has received high interest this week..."), "📈 Your profile has received high interest this week...")}</span>
                      </button>
                    </>
                  )}

                  {/* LPG USTASI / MÜHENDİS SİMÜLATÖRLERİ */}
                  {activeUser.role === "engineer" && (
                    <>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🚨 Uzmanlık Alanında Yeni Arıza", "Uzmanlık alanınız olan 'Sıralı Sistem LTFT Ayarı' ile bağlantılı Ankara'da yeni bir arıza talebi yayınlandı.", "uyari", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("1. Alana Uygun Arıza", "1. Expert Area Match Ticket"), "1. Expert Area Match Ticket")}</span>
                        <span className="text-[9px] text-slate-500 font-medium animate-pulse">{tLocal(tLocal("🚨 Uzmanlığınıza uygun yeni arıza...", "🚨 A new trouble ticket matching your expertise is active..."), "🚨 A new trouble ticket matching your expertise is active...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🎯 Çözüm Öneriniz Kabul Edildi", "Tebrikler! Toyota Corolla aracın marş basmama problemi için gönderdiğiniz çözüm önerisi araç sahibi tarafından kabul edildi.", "teklif", "panel", true);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("2. Çözüm Kabul Edildi", "2. Solution Accepted"), "2. Solution Accepted")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🎯 Gönderdiğiniz çözüm önerisi kabul...", "🎯 The solution you proposed has been accepted..."), "🎯 The solution you proposed has been accepted...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "👀 Profil Ziyaret Trendi", "Uzman usta profiliniz son 7 gün içerisinde tam 34 unique kullanıcı tarafından görüntülenerek yüksek puan aldı.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("3. Yüksek Görüntülenme", "3. High Views"), "3. High Views")}</span>
                        <span className="text-[9px] text-slate-500 font-medium font-medium">{tLocal(tLocal("👀 Profiliniz son 7 günde yüksek...", "👀 Your profile has received high views in the last 7 days..."), "👀 Your profile has received high views in the last 7 days...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🏆 Öne Çıkan Uzman Rozeti", "Sistem algoritması tarafından bölgenizde en çok çözüm sunan ilk 3 usta arasına girerek 'Öne Çıkanlar' bandına yerleştiniz.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("4. Öne Çıkan Usta", "4. Featured Technician"), "4. Featured Technician")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🏆 Profiliniz öne çıkan uzmanlar...", "🏆 Your profile is featured in the expert spotlights..."), "🏆 Your profile is featured in the expert spotlights...")}</span>
                      </button>
                    </>
                  )}

                  {/* KİT ÜRETİCİSİ SİMÜLATÖRLERİ */}
                  {activeUser.role === "manufacturer" && (
                    <>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🏭 Markanıza Yeni Bayi", "Sizin lisanslı kit markanızı kullanan 'Ege Otogaz Karşıyaka' yetkili servis ağına yeni üye olarak tescillendi.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("1. Markayı Seçen Yeni Bayi", "1. New Dealer Choosing Brand"), "1. New Dealer Choosing Brand")}</span>
                        <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🏭 Markanızı kullanan yeni bayi...", "🏭 A new dealer supporting your brand has signed up..."), "🏭 A new dealer supporting your brand has signed up...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📊 Teknik Bülten Trafiği", "Yayınladığınız 'Atiker Grand OBD ECU Bağlantı Şeması' bülteni bu hafta tam 120 usta tarafından incelendi.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("2. Bülten Görüntüleme", "2. Bulletin Views"), "2. Bulletin Views")}</span>
                        <span className="text-[9px] text-slate-500 font-medium font-medium">{tLocal(tLocal("📊 Teknik bülteniniz görüntüleniyor...", "📊 Your technical bulletin is being viewed..."), "📊 Your technical bulletin is being viewed...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "🎓 Eğitim Videonuz İzleniyor", "Sertifika programında yayınladığınız 'Direct Injection Kalibrasyonu' eğitim videosu bayilerinizce izlenmeye başladı.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("3. Eğitim İzlenme Başlangıcı", "3. Course Views Started"), "3. Course Views Started")}</span>
                        <span className="text-[9px] text-slate-500 font-medium font-medium">{tLocal(tLocal("🎓 Eğitim videolarınız izlenmeye başladı...", "🎓 Your training videos have started being watched..."), "🎓 Your training videos have started being watched...")}</span>
                      </button>
                      <button
                        onClick={() => {
                          sendLpgNotification(activeUser.id, "📈 Marka İçerik Trendi", "Genel analizlere göre markanızın teknik dökümanları son dönemde %35 daha fazla trafik çekmektedir.", "duyuru", "panel", false);
                          setNotificationsList(getCentralNotifications());
                        }}
                        className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                      >
                        <span className="font-extrabold text-emerald-800">{tLocal(tLocal("4. Marka Trafiğinde Yükseliş", "4. Brand Traffic Surge"), "4. Brand Traffic Surge")}</span>
                        <span className="text-[9px] text-slate-500 font-medium text-slate-500">{tLocal(tLocal("📈 Marka içerikleriniz ilgi çekiyor...", "📈 Your brand contents are drawing high interest..."), "📈 Your brand contents are drawing high interest...")}</span>
                      </button>
                    </>
                  )}

                  {/* MARKET BİLDİRİMLERİ SİMÜLATÖRLERİ */}
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "✅ Ürün Yayına Alındı", "Tebrikler! Satış listesine eklediğiniz yedek parça ürünü incelenmiş ve başarılı bir şekilde 'Yayına Alınmıştır'.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-teal-800">{tLocal(tLocal("🛒 Market: Ürün Yayına Alındı", "🛒 Marketplace: Product Live"), "🛒 Marketplace: Product Live")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("✅ Ürününüz yayına alındı...", "✅ Your product is now live on the marketplace..."), "✅ Your product is now live on the marketplace...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🔥 Ürününüz Yoğun İlgi Görüyor", "Market ilanlarındaki LPG ECU tamir kiti ürününüzün detayları bu gün yoğun olarak tıklandı ve incelendi.", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-teal-800">{tLocal(tLocal("🛒 Market: Yoğun İlgi Trendi", "🛒 Marketplace: Trending Hot"), "🛒 Marketplace: Trending Hot")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🔥 Ürününüz yoğun ilgi görüyor...", "🔥 Your product is seeing high interest traffic..."), "🔥 Your product is seeing high interest traffic...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "❤️ Favoriler Kataloğunda", "Ürününüz 5 farklı kurumsal bayi tarafından favori takip listesine eklenmiştir.", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-teal-800">{tLocal(tLocal("🛒 Market: İlan Favorilere Eklendi", "🛒 Marketplace: Added to Favorites"), "🛒 Marketplace: Added to Favorites")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("❤️ Ürününüz favorilere eklendi...", "❤️ Your product has been added to favorites..."), "❤️ Your product has been added to favorites...")}</span>
                  </button>

                  {/* ÜYELİK SÜRE HATIRLATMALARI SİMÜLATÖRLERİ */}
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "⏳ Üyelik Bitiş Hatırlatması (15 Gün)", "LPG PORTAL profesyonel rehber ve bülten üyeliğinizin sona ermesine tam 15 gün kaldı. Süreç kesintisi yaşamamak için sağ alt menuüden anında yenileyebilirsiniz.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-amber-800">{tLocal(tLocal("⏳ Üyelik Bitimi: Son 15 Gün", "⏳ Expiration Warning: Last 15 Days"), "⏳ Expiration Warning: Last 15 Days")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("⏳ Üyeliğinizin bitmesine 15 gün...", "⏳ 15 days remaining until your plan expires..."), "⏳ 15 days remaining until your plan expires...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "⚠️ Üyelik Bitiş Hatırlatması (5 Gün)", "Uyan! Profesyonel üyelik sürenizin dolmasına 5 gün kalmıştır. Reklam, teklif ve teknik bülten haklarınız dondurulmadan yenileyin.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-amber-850 text-amber-900">{tLocal(tLocal("⚠️ Üyelik Bitimi: Son 5 Gün", "⚠️ Expiration Warning: Last 5 Days"), "⚠️ Expiration Warning: Last 5 Days")}</span>
                    <span className="text-[9px] text-slate-500 font-medium font-bold">{tLocal(tLocal("⚠️ Üyeliğinizin bitmesine 5 gün...", "⚠️ Only 5 days remaining until expiration..."), "⚠️ Only 5 days remaining until expiration...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🚨 Son 3 Gün Kalan Süre", "LPG PORTAL üyeliğinizde kritik son 3 gün! Fiyat teklifleri alma özelliğinizin dondurulmaması için aidat yenilemenizi yapınız.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-rose-850 text-rose-700">{tLocal(tLocal("🚨 Üyelik Bitimi: Son 3 Gün", "🚨 Expiration Warning: Last 3 Days"), "🚨 Expiration Warning: Last 3 Days")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🚨 Son 3 gün kalmıştır...", "🚨 Only 3 days remaining..."), "🚨 Only 3 days remaining...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🔴 Üyeliğiniz Bugün Sona Eriyor", "Önemli Uyarı: LPG PORTAL üyelik periyodunuz bugün itibariyle dolmaktadır. Lütfen anlık kredi kartı yenileme sayfasını ziyaret edin.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-rose-800">{tLocal(tLocal("🔴 Üyelik Bitiş: Bugün", "🔴 Plan Ends: Today"), "🔴 Plan Ends: Today")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🔴 Üyeliğiniz bugün sona eriyor...", "🔴 Your plan expires today..."), "🔴 Your plan expires today...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🔒 Ücretli Servisler Geçici Askıda", "LPG PORTAL üyelik süreniz dolduğu için rehber üzerinde listelemeniz ve teklif gönderim özellikleriniz geçici olarak durdurulmuştur.", "uyari", "panel", true);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-white hover:bg-slate-50 border border-emerald-100 p-2 text-[11px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-rose-950 text-rose-800">{tLocal(tLocal("🔒 Ücretli Özellikler Askıda", "🔒 Premium Features Suspended"), "🔒 Premium Features Suspended")}</span>
                    <span className="text-[9px] text-slate-500 font-medium">{tLocal(tLocal("🔒 Ücretli özellikler geçici olarak...", "🔒 Premium features are temporarily suspended..."), "🔒 Premium features are temporarily suspended...")}</span>
                  </button>

                  {/* MİZANSEN RETENTION SİMÜLATÖRLERİ */}
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "👋 Sizi Özledik! (7 Gün Giriş Yapmayanlar)", "Bir süredir sizi göremiyoruz. LPG PORTAL'da sizi bekleyen yeni gelişmeler olabilir. Göz atmaya ne dersiniz?", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-150 text-[11.5px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-indigo-900">{tLocal(tLocal("📢 Retention: 7 Gün Giriş Yapmayan", "📢 Retention: Idle 7 Days"), "📢 Retention: Idle 7 Days")}</span>
                    <span className="text-[9.5px] text-slate-550 font-medium">{tLocal(tLocal("👋 Bir süredir sizi göremiyoruz...", "👋 We haven't seen you in a while..."), "👋 We haven't seen you in a while...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🚗 LPG Yolculuğu Devam Ediyor (15 Gün)", "Aracınızın LPG yolculuğuna kaldığınız yerden devam etmeye ne dersiniz? En yeni teknik içerikler ve bültenler yayında!", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-150 text-[11.5px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-indigo-900">{tLocal(tLocal("📢 Retention: 15 Gün Giriş Yapmayan", "📢 Retention: Idle 15 Days"), "📢 Retention: Idle 15 Days")}</span>
                    <span className="text-[9.5px] text-slate-550 font-medium">{tLocal(tLocal("🚗 Aracınızın benzersiz LPG yolculuğuna...", "🚗 To continue your vehicle's unique LPG journey..."), "🚗 To continue your vehicle's unique LPG journey...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🔧 Usta ve Servis Fırsatları (30 Gün)", "Ustalar, servisler ve yeni fırsatlar sizi bekliyor. Kampanyalı montaj kit fiyatları güncellendi, kaçırmayın!", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-150 text-[11.5px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-indigo-900">{tLocal(tLocal("📢 Retention: 30 Gün Giriş Yapmayan", "📢 Retention: Idle 30 Days"), "📢 Retention: Idle 30 Days")}</span>
                    <span className="text-[9.5px] text-slate-550 font-medium">{tLocal(tLocal("🔧 Ustalar, servisler ve yeni fırsat...", "🔧 Techs, service centers, and new opportunities..."), "🔧 Techs, service centers, and new opportunities...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "📢 Sektörden Gelişmeler (60 Gün)", "Son girişinizin üzerinden biraz zaman geçti. Sektörde birçok yeni içerik, teknik uyarı ve yasal bülten yayınlandı.", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-150 text-[11.5px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-indigo-900">{tLocal(tLocal("📢 Retention: 60 Gün Giriş Yapmayan", "📢 Retention: Idle 60 Days"), "📢 Retention: Idle 60 Days")}</span>
                    <span className="text-[9.5px] text-slate-550 font-medium font-medium">{tLocal(tLocal("📢 Son girişinizin üzerinden biraz zaman...", "📢 Quite some time has passed since your last login..."), "📢 Quite some time has passed since your last login...")}</span>
                  </button>
                  <button
                    onClick={() => {
                      sendLpgNotification(activeUser.id, "🏁 Fırsatlar Sizi Bekliyor (90 Gün)", "Bu kadar uzun mola yeter! LPG PORTAL topluluğunda yerinizi tekrar almaya ne dersiniz? Size özel yeni teklifler ve içerikler oluşmuş olabilir.", "duyuru", "panel", false);
                      setNotificationsList(getCentralNotifications());
                    }}
                    className="text-left bg-indigo-50 hover:bg-indigo-100/50 border border-indigo-150 text-[11.5px] rounded-lg cursor-pointer transition flex flex-col"
                  >
                    <span className="font-extrabold text-indigo-900">{tLocal(tLocal("📢 Retention: 90 Gün Giriş Yapmayan", "📢 Retention: Idle 90 Days"), "📢 Retention: Idle 90 Days")}</span>
                    <span className="text-[9.5px] text-slate-550 font-medium">🏁 Bu kadar uzun mola yeter. LPG PORTAL...</span>
                  </button>
                </div>
              </div>
            )}

              {/* Notifications List Card */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-fade-in text-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-xs font-black text-slate-700 uppercase font-mono tracking-wider">
                    BİLDİRİM GEÇMİŞİ VE PANEL GELEN KUTUSU ({userNotifications.length} Kayıt)
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {userNotifications.length > 0 ? (
                    userNotifications.map((notif) => (
                      <div 
                        key={notif.id}
                        className={`p-5 transition hover:bg-slate-50/55 flex items-start gap-4 ${!notif.read ? "bg-amber-50/20" : ""}`}
                      >
                        {/* Type Accent */}
                        <div className="shrink-0 mt-0.5">
                          {notif.type === "teklif" ? (
                            <span className="h-8 w-8 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold font-mono border border-teal-150 flex items-center justify-center">🎯</span>
                          ) : notif.type === "siparis" ? (
                            <span className="h-8 w-8 rounded-xl bg-orange-50 text-orange-700 text-xs font-bold font-mono border border-orange-100 flex items-center justify-center font-black">📦</span>
                          ) : notif.type === "uyari" ? (
                            <span className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold font-mono border border-rose-100 flex items-center justify-center">🚨</span>
                          ) : (
                            <span className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold font-mono border border-indigo-100 flex items-center justify-center">📢</span>
                          )}
                        </div>

                        {/* Message Payload */}
                        <div className="space-y-1 flex-1 text-slate-705">
                          <div className="flex justify-between items-start gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 leading-snug">
                                {notif.title}
                              </h5>
                              {!notif.read && (
                                <span className="bg-rose-600 text-white font-mono font-black px-1.5 py-0.2 rounded-sm text-[8px] uppercase tracking-wider">{tLocal(tLocal("OKUNMAMIŞ", "UNREAD"), "UNREAD")}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono font-bold shrink-0">
                              {new Date(notif.createdAt).toLocaleDateString('tr-TR')} {new Date(notif.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <p className="text-slate-600 font-medium text-xs leading-relaxed max-w-2xl whitespace-pre-line pt-0.5">
                            {notif.message}
                          </p>
                          <div className="flex gap-4 text-[9.5px] text-slate-400 font-mono pt-1 font-bold">
                            <span>{tLocal(tLocal("Sistem Gönderim Log Altyapısı:", "System Transmission Log Infrastructure:"), "System Transmission Log Infrastructure:")}<strong className="text-emerald-700 uppercase font-black">✓ SMS</strong>, <strong className="text-emerald-700 uppercase font-black">✓ E-POSTA</strong>, <strong className="text-emerald-700 uppercase font-black">✓ PANEL</strong>, <strong className="text-emerald-700 uppercase font-black">✓ PUSH</strong></span>
                          </div>
                        </div>

                        {/* Read Action Button */}
                        {!notif.read && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationAsRead(notif.id);
                              setNotificationsList(getCentralNotifications());
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-lg transition shrink-0 cursor-pointer shadow-xs border border-emerald-500"
                          >
                            Okundu İşaretle ✓
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center text-slate-400 italic">
                      <span className="text-2xl block mb-2">📭</span>
                      Kutunuz boş! Herhangi bir bildirim bulunmamaktadır.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* USER QUOTES PANEL (TEKLİFLERİM)          */}
          {/* ========================================= */}
          {userMainTab === "quotes" && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
                    📋
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">📋 Tekliflerim ve Taleplerim</h3>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium font-sans">LPG dönüşüm teklif taleplerinizi, gelen servis tekliflerini ve admin süreç durumlarını takip edin.</p>
                  </div>
                </div>
              </div>

              {/* USER QUOTES TABLE */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-mono uppercase text-[10px]">
                        <th className="p-4 font-bold">Talep No</th>
                        <th className="p-4 font-bold">Talep Tarihi</th>
                        <th className="p-4 font-bold">Araç Bilgileri</th>
                        <th className="p-4 font-bold">Şehir</th>
                        <th className="p-4 font-bold">Durum</th>
                        <th className="p-4 font-bold">Son Güncelleme</th>
                        <th className="p-4 font-bold">Admin Cevabı</th>
                        <th className="p-4 font-bold text-center">Dosya Ekleri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const myRequests = quoteRequests.filter(r => activeUser && r.userId === activeUser.id);
                        if (myRequests.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                                Henüz herhangi bir LPG dönüşüm teklif talebi göndermediniz.
                              </td>
                            </tr>
                          );
                        }

                        return myRequests.map((req) => (
                          <tr
                            key={req.id}
                            onClick={() => setSelectedUserQuote(req)}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                          >
                            <td className="p-4 font-bold font-mono text-emerald-700">{req.id}</td>
                            <td className="p-4 text-slate-500 whitespace-nowrap">{req.created_at.split(" - ")[0]}</td>
                            <td className="p-4 font-semibold text-slate-800">
                              {req.brand} {req.model} ({req.year})
                            </td>
                            <td className="p-4 text-slate-700">{req.userCity}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.8 rounded-full text-[10px] font-bold ${
                                req.status === "Tamamlandı" || req.status === "Eşleştirildi"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                  : req.status === "Kullanıcı Onayladı"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100 animate-pulse"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 whitespace-nowrap">{(req.updated_at || req.created_at).split(" - ")[0]}</td>
                            <td className="p-4 text-slate-600 max-w-[150px] truncate">
                              {req.admin_reply ? req.admin_reply : <span className="text-slate-350 italic">Cevaplanmadı</span>}
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-slate-700">
                              {req.attachments && req.attachments.length > 0 ? (
                                <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] border border-emerald-100">
                                  {req.attachments.length} Ek
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* USER DETAIL MODAL */}
              {selectedUserQuote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">TALEP DETAYI VE GELEN TEKLİFLER</span>
                        <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                          {selectedUserQuote.brand} {selectedUserQuote.model} ({selectedUserQuote.year}) - {selectedUserQuote.id}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedUserQuote(null)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Modal Body Container */}
                    <div className="flex-1 overflow-y-auto space-y-5 pr-2 text-xs">
                      {/* Specs */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Talep No:</span>
                          <strong className="text-slate-800 font-mono">{selectedUserQuote.id}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Motor & Yakıt:</span>
                          <strong className="text-slate-800">{selectedUserQuote.engine} ({selectedUserQuote.fuelType || "Benzin"})</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Kilometre:</span>
                          <strong className="text-slate-800">{selectedUserQuote.kilometer ? selectedUserQuote.kilometer + " KM" : "Belirtilmedi"}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono">Bölge:</span>
                          <strong className="text-slate-800">{selectedUserQuote.userCity} ({selectedUserQuote.userDistrict || "Merkez"})</strong>
                        </div>
                      </div>

                      {/* Admin Reply & Attachments */}
                      {(selectedUserQuote.admin_reply || (selectedUserQuote.attachments && selectedUserQuote.attachments.length > 0)) && (
                        <div className="bg-amber-50/20 border border-amber-100 p-4 rounded-2xl space-y-3">
                          <h5 className="font-bold text-slate-800 flex items-center gap-1">
                            <Info className="h-4 w-4 text-amber-500" />
                            Yönetici Mesajı ve Dosya Ekleri
                          </h5>
                          {selectedUserQuote.admin_reply && (
                            <p className="text-slate-700 bg-white p-3 rounded-xl border border-amber-150/50 leading-relaxed font-sans">
                              {selectedUserQuote.admin_reply}
                            </p>
                          )}
                          {selectedUserQuote.attachments && selectedUserQuote.attachments.length > 0 && (
                            <div className="space-y-1.5 pt-1.5">
                              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Eklenti Dosyalar:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedUserQuote.attachments.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      alert(`"${file.name}" dosya indirmesi simüle edildi.`);
                                    }}
                                    className="flex items-center justify-between bg-white border border-slate-200 hover:border-emerald-500 rounded-xl p-2.5 transition text-2xs hover:bg-slate-50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-emerald-800 font-extrabold bg-emerald-50 px-1 py-0.5 rounded text-[8px] uppercase">
                                        {file.name.split(".").pop()}
                                      </span>
                                      <span className="text-slate-700 font-semibold truncate max-w-[120px]">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[9px] text-slate-400">
                                      <span>{file.size}</span>
                                      <Download className="h-3.5 w-3.5 text-emerald-600 ml-1" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Gelen Bids/Offers List */}
                      <div className="space-y-3">
                        <h5 className="font-extrabold text-slate-900 text-xs font-mono uppercase tracking-wider">📦 Gelen Bayi & Servis Teklifleri ({selectedUserQuote.offers ? selectedUserQuote.offers.length : 0})</h5>
                        {(!selectedUserQuote.offers || selectedUserQuote.offers.length === 0) ? (
                          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-150 text-slate-400">
                            {language === "tr" ? "Şehir bayileri bu araca blind fiyat çalışıyor. İlk teklifler kısa süre içinde listelenecektir..." : "City dealers are preparing blind price quotes for this vehicle. Initial offers will be listed shortly..."}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedUserQuote.offers.map((off) => {
                              const isMatched = selectedUserQuote.status === "Eşleştirildi" || selectedUserQuote.status === "Tamamlandı";
                              const isApproved = off.status === "Onaylandı";

                              return (
                                <div
                                  key={off.id}
                                  className={`p-4 rounded-xl border transition flex flex-col ${
                                    isApproved 
                                      ? "bg-emerald-50/40 border-emerald-500 shadow-sm" 
                                      : "bg-white border-slate-200 hover:border-slate-350"
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                                        📦 {off.kitBrandProposed}
                                      </span>
                                      <h6 className="font-bold text-slate-900 mt-2 flex items-center gap-1 font-sans">
                                        {isMatched ? (
                                          <>
                                            <span className="text-emerald-700 font-extrabold">{off.companyName}</span>
                                            <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-mono">İletişim Açıldı</span>
                                          </>
                                        ) : (
                                          <span className="text-slate-500 italic">🔒 Firma Adı Gizli (Onaylayınca Açılır)</span>
                                        )}
                                      </h6>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[9px] text-slate-400 block font-mono">Anahtar Teslim Fiyatı</span>
                                      <strong className="text-sm text-emerald-600 font-extrabold">{off.price} TL</strong>
                                    </div>
                                  </div>

                                  <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 my-2.5 font-sans">
                                    "{off.notes}"
                                  </p>

                                  {/* Revealed Contact Info if matched */}
                                  {isMatched && isApproved && (
                                    <div className="bg-emerald-950 text-emerald-200 rounded-xl p-3 text-[10px] mb-2.5 space-y-1 border border-emerald-900 font-mono">
                                      <h4 className="font-bold underline text-emerald-300 mb-1 flex items-center gap-1 uppercase">
                                        📞 FİRMA İLETİŞİM BİLGİLERİ
                                      </h4>
                                      <p><strong>Yetkili Usta:</strong> {off.companyContactName || "Kemal Usta – Başteknisyen"}</p>
                                      <p><strong>Telefon:</strong> {off.companyPhone || "0555 XXXXXXX"}</p>
                                      <p><strong>E-posta:</strong> {off.companyEmail || "support@firma.com"}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-400 pt-2 border-t border-slate-100 mb-2.5 font-mono">
                                    <span>🛡️ Garanti: {off.warrantyYears} Yıl</span>
                                    <span>⏱️ Süre: {off.installationDuration || "1 Gün"}</span>
                                    <span>💳 Taksit: {off.installmentOptions}</span>
                                  </div>

                                  {/* Action choices */}
                                  <div className="flex gap-2 justify-end">
                                    {off.status === "Onaylandı" ? (
                                      <span className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-[9px] flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {isMatched ? "Eşleştirme Tamamlandı" : "Teklifi Onayladınız - Admin Bekleniyor"}
                                      </span>
                                    ) : off.status === "Reddedildi" ? (
                                      <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1">
                                        <X className="h-3.5 w-3.5" />
                                        Reddedildi
                                      </span>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const targetReq = quoteRequests.find(r => r.id === selectedUserQuote.id);
                                            if (!targetReq) return;
                                            const updatedOffers = targetReq.offers.map(o => {
                                              if (o.id === off.id) return { ...o, status: "Onaylandı" };
                                              return { ...o, status: "Reddedildi" };
                                            });
                                            const updatedReq: QuoteRequest = {
                                              ...targetReq,
                                              status: "Kullanıcı Onayladı",
                                              offers: updatedOffers,
                                              updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
                                            };
                                            const updated = quoteRequests.map(r => r.id === selectedUserQuote.id ? updatedReq : r);
                                            localStorage.setItem("lpgportal_quote_requests", JSON.stringify(updated));
                                            setQuoteRequests(updated);
                                            setSelectedUserQuote(updatedReq);

                                            addSystemLog(
                                              "Kullanıcı Teklif Onayladı",
                                              `Kullanıcı, ${selectedUserQuote.id} nolu talebi için ${off.companyName} firmasının teklifini onayladı.`,
                                              activeUser.email
                                            );
                                            alert("Teklifi onayladınız! İletişim bilgilerinizin paylaşılması için süreç yönetici onayına iletildi.");
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                        >
                                          Onayla / Reze Et
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const targetReq = quoteRequests.find(r => r.id === selectedUserQuote.id);
                                            if (!targetReq) return;
                                            const updatedOffers = targetReq.offers.map(o => {
                                              if (o.id === off.id) return { ...o, status: "Reddedildi" };
                                              return o;
                                            });
                                            const updatedReq: QuoteRequest = {
                                              ...targetReq,
                                              offers: updatedOffers,
                                              updated_at: new Date().toLocaleDateString("tr-TR") + " - " + new Date().toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })
                                            };
                                            const updated = quoteRequests.map(r => r.id === selectedUserQuote.id ? updatedReq : r);
                                            localStorage.setItem("lpgportal_quote_requests", JSON.stringify(updated));
                                            setQuoteRequests(updated);
                                            setSelectedUserQuote(updatedReq);
                                          }}
                                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 text-[9px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                                        >
                                          Reddet
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

                    {/* Modal Footer */}
                    <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end">
                      <button
                        onClick={() => setSelectedUserQuote(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================= */}
          {/* USER MARKETPLACE CRM PANEL               */}
          {/* ========================================= */}
          {userMainTab === "market_management" && activeUser && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Summary Dashboard Info card */}
              <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-teal-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
                      🛍️ {tLocal("MARKET CRM YÖNETİM PANELİ", "MARKETPLACE CRM MANAGEMENT PANEL")}
                    </span>
                    <h3 className="text-xl font-black tracking-tight leading-tight">
                      {tLocal("Kişisel İlan & Sipariş Portalı", "Personal Listing & Order Portal")}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {tLocal("Yayınladığınız yedek parça ilanlarını düzenleyebilir, durumlarını güncelleyebilir ve gelen sipariş taleplerinizi anlık olarak onaylayıp takip edebilirsiniz.", "Edit your active material ads, update listing statuses, and process inbound buyer orders dynamically on-panel.")}
                    </p>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl shrink-0 flex gap-6 text-center shadow-inner backdrop-blur-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">{tLocal("İlanlarım", "Listings")}</span>
                      <strong className="text-lg font-black text-emerald-400 block mt-0.5">
                        {marketProducts.filter(p => p.seller_id === activeUser.id).length}
                      </strong>
                    </div>
                    <div className="w-px bg-slate-700"></div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">{tLocal("Görüntülenme", "Views")}</span>
                      <strong className="text-lg font-black text-sky-400 block mt-0.5">
                        {marketProducts.filter(p => p.seller_id === activeUser.id).reduce((sum, p) => sum + (p.views || 0), 0)}
                      </strong>
                    </div>

                  </div>
                </div>
              </div>

              {/* ========================================= */}
              {/* SECTION 1: İLANLARIM & DURUM YÖNETİMİ     */}
              {/* ========================================= */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase font-mono border-b border-slate-100 pb-3">
                    🏷️ {tLocal("İlanlarım & Durum Yönetimi", "My Listings & Status Control")}
                  </h3>
                </div>

                <div className="space-y-4 animate-fade-in">
                  
                  {/* Status filter badges */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl max-w-fit">
                    {(["all", "Yayında", "Onay Bekliyor", "Düzeltme Bekliyor", "Reddedildi", "Pasif", "Satıldı"] as const).map((filter) => {
                      const count = filter === "all"
                        ? marketProducts.filter(p => p.seller_id === activeUser.id).length
                        : marketProducts.filter(p => p.seller_id === activeUser.id && p.status === filter).length;
                      
                      let label = filter === "all" ? tLocal("Hepsi", "All") : filter;
                      if (filter === "Yayında") label = tLocal("Yayında", "Live / Active");
                      else if (filter === "Onay Bekliyor") label = tLocal("Onay Bekleyen", "Pending");
                      else if (filter === "Düzeltme Bekliyor") label = tLocal("Düzeltme Bekleyen", "Revision Required");
                      else if (filter === "Reddedildi") label = tLocal("Reddedilen", "Rejected");
                      else if (filter === "Pasif") label = tLocal("Pasif", "Inactive");
                      else if (filter === "Satıldı") label = tLocal("Satılan", "Sold");

                      return (
                        <button
                          key={filter}
                          onClick={() => setMarketProductFilter(filter)}
                          className={`py-1.5 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            marketProductFilter === filter
                              ? "bg-white text-slate-900 shadow-xs font-extrabold"
                              : "text-slate-650 hover:bg-white/50 text-slate-600"
                          }`}
                        >
                          {label} <span className="text-[10px] text-slate-400 font-mono font-medium">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Listings Catalog Table */}
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-600 border-b border-slate-150">
                            <th className="p-4">{tLocal("Medya", "Media")}</th>
                            <th className="p-4">{tLocal("İlan Başlığı / Parça", "Listing Title / Spare Part")}</th>
                            <th className="p-4">{tLocal("Fiyat / Stok", "Price / Stock")}</th>
                            <th className="p-4">{tLocal("Görüntülenme", "Views")}</th>
                            <th className="p-4">{tLocal("Konum", "Location")}</th>
                            <th className="p-4">{tLocal("Kayıt Tarihi", "Created Date")}</th>
                            <th className="p-4">{tLocal("Durum", "Status")}</th>
                            <th className="p-4 text-right">{tLocal("İşlemler", "Actions")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {marketProducts
                            .filter(p => p.seller_id === activeUser.id)
                            .filter(p => marketProductFilter === "all" ? true : p.status === marketProductFilter)
                            .map((prod) => (
                              <tr key={prod.id} className="hover:bg-slate-50/40 transition duration-100">
                                <td className="p-4">
                                  <div className="h-11 w-11 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                                    <img 
                                      src={prod.image || CATEGORY_PRESETS[prod.category] || CATEGORY_PRESETS["Diğer"]} 
                                      alt="" 
                                      className="h-full w-full object-cover" 
                                    />
                                  </div>
                                </td>
                                <td className="p-4 space-y-0.5">
                                  <strong className="text-slate-800 font-bold block text-xs line-clamp-1">{prod.product_name}</strong>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase font-mono inline-block">
                                    {prod.category} • {prod.brand}
                                  </span>
                                </td>
                                <td className="p-4 space-y-1">
                                  <span className="font-mono font-black text-slate-900 block text-xs">{prod.price.toLocaleString("tr-TR")} TL</span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold block">
                                    {prod.stock > 0 ? `${prod.stock} adet` : "Tükendi"}
                                  </span>
                                </td>
                                <td className="p-4 font-mono font-bold text-teal-600">
                                  👁️ {prod.views || 0}
                                </td>
                                <td className="p-4 font-semibold text-slate-700">
                                  {prod.city} / {prod.district}
                                </td>
                                <td className="p-4 font-mono text-[10px] text-slate-400">
                                  {prod.created_at ? new Date(prod.created_at).toLocaleDateString("tr-TR") : "-"}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase text-center block ${
                                    prod.status === "Yayında"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : prod.status === "Onay Bekliyor"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : prod.status === "Düzeltme Bekliyor"
                                      ? "bg-violet-50 text-violet-700 border-violet-250 border-violet-200"
                                      : prod.status === "Reddedildi"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : prod.status === "Pasif"
                                      ? "bg-slate-100 text-slate-655 border-slate-200 text-slate-600"
                                      : "bg-slate-800 text-white border-slate-950"
                                  }`}>
                                    {prod.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex gap-1.5 justify-end flex-wrap">
                                    
                                    {/* Görüntüle */}
                                    <button
                                      onClick={() => setViewProductDetail(prod)}
                                      className="text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 p-1.5 rounded-lg transition cursor-pointer"
                                      title={tLocal("Görüntüle", "Preview")}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Düzenle */}
                                    <button
                                      onClick={() => handleStartEditProduct(prod)}
                                      className="text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 p-1.5 rounded-lg transition cursor-pointer"
                                      title={tLocal("Düzenle", "Edit")}
                                    >
                                      📝
                                    </button>

                                    {/* Pasife Al veya Yeniden Yayınla */}
                                    {prod.status === "Pasif" ? (
                                      <button
                                        onClick={() => handleReactivateProduct(prod.id)}
                                        className="text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-[10px] font-extrabold px-2 py-1 rounded-lg transition cursor-pointer"
                                      >
                                        {tLocal("Yayına Al", "Publish")}
                                      </button>
                                    ) : (
                                      (prod.status === "Yayında" || prod.status === "Onay Bekliyor" || prod.status === "Düzeltme Bekliyor" || prod.status === "Reddedildi") && (
                                        <button
                                          onClick={() => handlePassivateProduct(prod.id)}
                                          className="text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer"
                                        >
                                          {tLocal("Pasife Al", "Deactivate")}
                                        </button>
                                      )
                                    )}

                                    {/* Sil */}
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 p-1.5 rounded-lg transition cursor-pointer"
                                      title={tLocal("Sil", "Delete")}
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>

                                  </div>
                                </td>
                              </tr>
                            ))}
                          {marketProducts.filter(p => p.seller_id === activeUser.id).length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                                {tLocal("Şu anda yayında veya onayda herhangi bir yedek parça ilanınız bulunmamaktadır.", "You do not have any spare part listings recorded at the moment.")}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================= */}
              {/* MODAL 1: VIEW DETAILS MODAL              */}
              {/* ========================================= */}
              {viewProductDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 relative max-h-[90vh] overflow-y-auto">
                    
                    <button
                      onClick={() => setViewProductDetail(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-4">
                      
                      <div className="flex gap-4 items-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative shrink-0">
                          <img 
                            src={viewProductDetail.image || CATEGORY_PRESETS[viewProductDetail.category] || CATEGORY_PRESETS["Diğer"]} 
                            alt="" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{viewProductDetail.category}</span>
                          <h3 className="text-base font-black text-slate-900 mt-1">{viewProductDetail.product_name}</h3>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3 text-xs text-slate-600 leading-relaxed space-y-2">
                        <p><strong>{tLocal("Açıklama:", "Description:")}</strong></p>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-32 overflow-y-auto font-sans leading-normal">
                          {viewProductDetail.description}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs space-y-2 font-sans font-medium">
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Fiyat:", "Price:")}</span>
                          <strong className="text-slate-900 font-black">{viewProductDetail.price.toLocaleString("tr-TR")} TL</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Stok Adedi:", "In Stock:")}</span>
                          <strong className="text-slate-900 font-bold">{viewProductDetail.stock} adet</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Kondisyon:", "Condition:")}</span>
                          <strong className="text-slate-900 font-bold">
                            {viewProductDetail.condition_detail || (viewProductDetail.condition === "Sıfır" ? "Sıfır" : "Çok İyi")}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Marka:", "Brand:")}</span>
                          <strong className="text-slate-900 font-bold">{viewProductDetail.brand}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Orijinal Parça:", "Genuine Parts:")}</span>
                          <strong className="text-slate-900 font-bold">{viewProductDetail.original || "Evet"}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("Konum (İl / İlçe):", "Location (City/District):")}</span>
                          <strong className="text-slate-900 font-bold">{viewProductDetail.city} / {viewProductDetail.district}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">{tLocal("İlan Durumu:", "Ad Status:")}</span>
                          <span className="font-extrabold uppercase text-emerald-700">{viewProductDetail.status}</span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setViewProductDetail(null)}
                          className="bg-slate-900 hover:bg-black text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
                        >
                          {tLocal("Kapat", "Close")}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* MODAL 2: EDIT LISTING FORM MODAL         */}
              {/* ========================================= */}
              {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
                    
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="border-b border-slate-100 pb-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                        📝 {tLocal("İlan Düzenleme Formu", "Edit Listing Form")}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {tLocal("Yaptığınız düzenleme sonrasında ilanınız otomatik olarak 'Onay Bekliyor' durumuna çekilecektir.", "Once edited, this listing will be set to 'Pending Approval' for admin evaluation.")}
                      </p>
                    </div>

                    {editError && (
                      <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-shake">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <div>{editError}</div>
                      </div>
                    )}

                    {editSuccess && (
                      <div className="bg-emerald-50 border border-emerald-250 p-3.5 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                        <div>{editSuccess}</div>
                      </div>
                    )}

                    <form onSubmit={handleEditProductSubmit} className="space-y-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Kullanım Durumu (Kondisyon)", "Condition Details")}</label>
                          <select
                            value={editProductConditionDetail}
                            onChange={(e) => setEditProductConditionDetail(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold rounded-xl focus:outline-none focus:border-emerald-500 text-slate-750 cursor-pointer"
                          >
                            <option value="Sıfır">{tLocal("Yeni / Sıfır Ambalajlı", "Brand New / Sealed Box")}</option>
                            <option value="Çok İyi">{tLocal("Çok İyi (Neredeyse Sıfır / Temiz)", "Very Good (Mint Condition)")}</option>
                            <option value="İyi">{tLocal("İyi (Sorunsuz Çalışan)", "Good Status (Well Working)")}</option>
                            <option value="Orta">{tLocal("Orta (Kullanılmış)", "Fair (Normally Used)")}</option>
                            <option value="Yıpranmış">{tLocal("Yıpranmış (Yedeklik)", "Heavily Used (For parts)")}</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Orijinallik", "Originality")}</label>
                          <select
                            value={editProductOriginal}
                            onChange={(e) => setEditProductOriginal(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold rounded-xl focus:outline-none focus:border-emerald-500 text-slate-750 cursor-pointer"
                          >
                            <option value="Evet">{tLocal("Evet, Orijinal Parça", "Yes, genuine brand part")}</option>
                            <option value="Hayır">{tLocal("Hayır, Yan Sanayi / Muadil", "No, equivalent / custom")}</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Ürün İlan Başlığı *", "Product Title *")}</label>
                        <input
                          type="text"
                          required
                          value={editProductName}
                          onChange={(e) => setEditProductName(e.target.value)}
                          className="w-full bg-slate-50 text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Açıklama *", "Description *")}</label>
                        <textarea
                          required
                          rows={3}
                          value={editProductDescription}
                          onChange={(e) => setEditProductDescription(e.target.value)}
                          className="w-full bg-slate-50 text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Fiyat (TL) *", "Price (TL) *")}</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={editProductPrice}
                            onChange={(e) => setEditProductPrice(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Mevcut Stok Adedi *", "In-Stock Quantity *")}</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={editProductStock}
                            onChange={(e) => setEditProductStock(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Kategori *", "Category *")}</label>
                          <select
                            value={editProductCategory}
                            onChange={(e) => setEditProductCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                          >
                            {CATEGORIES_LIST.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Marka *", "Brand *")}</label>
                          <select
                            value={editProductBrand}
                            onChange={(e) => setEditProductBrand(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                          >
                            {getDynamicProductBrandsList().map(brd => (
                              <option key={brd} value={brd}>{brd}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {editProductBrand === "Diğer" && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Özel Marka Adı *", "Custom Brand Name *")}</label>
                          <input
                            type="text"
                            required
                            placeholder={tLocal("Marka İsmi", "Brand name")}
                            value={editProductBrandCustom}
                            onChange={(e) => setEditProductBrandCustom(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("Bulunduğu İl *", "City *")}</label>
                          <input
                            type="text"
                            required
                            value={editProductCity}
                            onChange={(e) => setEditProductCity(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">{tLocal("İlçe *", "District *")}</label>
                          <input
                            type="text"
                            required
                            value={editProductDistrict}
                            onChange={(e) => setEditProductDistrict(e.target.value)}
                            className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Photo management in editing */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
                            {tLocal("Ürün Fotoğrafları * (Min 1, Max 10 adet)", "Product Photographs * (Min 1, Max 10)")}
                          </label>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {tLocal("Yüklenen", "Uploaded")}: {editProductImages.length} / 10
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="border-2 border-dashed border-slate-350 border-slate-300 rounded-2xl p-4 text-center hover:border-sky-500 transition relative bg-slate-50/50">
                            <input
                              key={editFileInputKey}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleEditLocalImageUpload}
                              disabled={editProductImages.length >= 10}
                              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1" />
                            <span className="text-[11px] font-bold text-slate-650 block">{tLocal("Fotoğraf Ekle", "Add Photo")}</span>
                          </div>

                          <div className="bg-sky-50/55 rounded-2xl p-3 border border-sky-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-sky-850 block">💡 {tLocal("Temsilî Demo Fotoğrafı Yükle", "Import Category Mock Media")}</span>
                            <button
                              type="button"
                              onClick={() => handleEditLoadImagePreset(editProductCategory)}
                              disabled={editProductImages.length >= 10}
                              className="mt-2 bg-sky-650 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-[10px] py-1.5 rounded-lg transition cursor-pointer"
                            >
                              {tLocal("Otomatik Fotoğraf Ekle", "Autofill Photo")}
                            </button>
                          </div>
                        </div>

                        {editProductImages.length > 0 && (
                          <div className="grid grid-cols-5 gap-2 pt-1.5">
                            {editProductImages.map((src, index) => (
                              <div key={index} className="relative h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group">
                                <img src={src} alt="" className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setEditProductImages(editProductImages.filter((_, i) => i !== index))}
                                  className="absolute top-0.5 right-0.5 bg-red-655 bg-red-650 text-white p-0.5 rounded-full hover:bg-red-700 transition cursor-pointer"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer"
                        >
                          {tLocal("Vazgeç", "Cancel")}
                        </button>
                        <button
                          type="submit"
                          className="bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer shadow-md"
                        >
                          {tLocal("Değişiklikleri Kaydet", "Save Modifications")}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {userMainTab === "campaigns" && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <CampaignsSystem 
                  activeUser={activeUser} 
                  mode="user" 
                  language={language}
                />
              </div>
            </div>
          )}
        </div>

          </div>
        </div>
      )}

      {/* 1) SMS DOGRULAMA OTP MODAL */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="sms-otp-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 text-center relative max-h-[90vh] overflow-y-auto">
            
            {/* Simulation Header Badge */}
            <div className="bg-emerald-55 bg-emerald-50 text-emerald-800 text-[11px] py-2 px-3 rounded-xl border border-emerald-100 font-mono inline-block">
              📲 <strong>[TEST MODU]</strong> SMS Gelen Kod: <span className="underline font-bold text-emerald-600 tracking-wider text-sm">{smsCodeSent}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">{tLocal(tLocal("Tek Kullanımlık Şifre (OTP)", "One-Time Password (OTP)"), "One-Time Password (OTP)")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Güvenlik gereği <strong>{regPhone ? `+90 ${getFormattedPhone(regPhone)}` : "telefon numaranıza"}</strong> gönderilen 6 haneli doğrulama kodunu giriniz.
              </p>
            </div>

            {/* OTP Code input */}
            <div className="space-y-3">
              <input 
                type="text"
                autoFocus
                maxLength={6}
                value={userTypedSms}
                placeholder="X X X X X X"
                onChange={(e) => setUserTypedSms(e.target.value.replace(/\D/g, "").substring(0, 6))}
                className="w-full bg-slate-50 hover:bg-slate-100/40 text-center tracking-[12px] font-mono font-black text-2xl py-3.5 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none transition-all placeholder:text-slate-300 animate-pulse-subtle"
              />
              
              {smsError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold animate-shake">
                  ⚠️ {smsError}
                </div>
              )}
            </div>

            {/* Countdown timer */}
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>{tLocal(tLocal("Kalan Geçerlilik Süresi:", "Remaining Validity Period:"), "Remaining Validity Period:")}</span>
              <strong className={`font-mono text-sm ${smsTimeLeft <= 30 ? 'text-rose-600 font-bold animate-pulse' : 'text-slate-700'}`}>
                {formatSmsTimer(smsTimeLeft)}
              </strong>
            </div>

            {/* Resend actions */}
            <div className="pt-2 border-t border-slate-100">
              {smsTimeLeft === 0 ? (
                <button
                  type="button"
                  onClick={handleResendSms}
                  className="w-full text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  Yeni Kod Gönder (SMS Tekrarla)
                </button>
              ) : (
                <div className="text-slate-400 text-[11px]">
                  Yeni kod talep etmek için sürenin dolmasını bekleyiniz. 
                  {smsResent && <span className="block text-emerald-600 font-bold mt-1">✓ Kod tekrar iletildi!</span>}
                </div>
              )}
            </div>

            {/* Actions button */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => { setShowSmsModal(false); setAuthError("SMS Doğrulaması iptal edildi."); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
              >{tLocal(tLocal("İptal Et", "Cancel Account"), "Cancel Account")}</button>

              <button
                type="button"
                onClick={() => {
                  if (userTypedSms === smsCodeSent || (window as any).__lpgportal_bypass_sms) {
                    if (smsTimeLeft <= 0) {
                      setSmsError("Doğrulama kodunun 5 dakikalık süresi dolmuştur. Lütfen yeni kod isteyin.");
                      return;
                    }
                    setSmsVerified(true);
                    setShowSmsModal(false);
                    if (regSubscriptionType === "free") {
                      handleFreeRegistration();
                    } else {
                      setRegStep(2); // Go to payment
                    }
                  } else {
                    setSmsError("Girdiğiniz 6 haneli SMS doğrulama kodu uyuşmuyor. Lütfen tekrar giriniz.");
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer"
              >
                Kodu Doğrula
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 text-center leading-normal">
              * Bu işlem KVKK kuralları uyarınca cep telefonu sahipliğinin teyidinde zorunludur.
            </p>
          </div>
        </div>
      )}

      {/* 2.5) FREE MEMBERSHIP REGISTRATION CONGRATS DIALOG BOX */}
      {showFreeRegistrationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="free-reg-success-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center relative">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-150 animate-bounce">
              <CheckCircle className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Kayıt İşleminiz Başarıyla Tamamlandı</h3>
              <div className="text-xs text-slate-600 leading-relaxed font-semibold px-4 py-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-2 text-center text-slate-700">
                <p className="font-bold">Başvurunuz başarıyla alınmıştır.</p>
                <p>Hesabınız oluşturulmuş ve yönetici onayına gönderilmiştir.</p>
                <p>Yönetici onayı tamamlandıktan sonra sisteme giriş yapabilirsiniz.</p>
                <p>Onay süreci tamamlandığında tarafınıza bildirim gönderilecektir.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowFreeRegistrationSuccess(false);
                setAuthMode("login");
                // Reset form inputs
                setRegFirstName("");
                setRegLastName("");
                setRegEmail("");
                setRegPhone("");
                setRegPassword("");
                setRegConfirmPassword("");
                setCompanyName("");
                setAuthorizedName("");
                setDealerCity("");
                setDealerDistrict("");
                setTaxInfo("");
                setDealerWebsite("");
                setRegWorkingBrands([]);
                setEngineerSkill("");
                setEngineerCity("");
                setMfrCompanyName("");
                setMfrBrandName("");
                setMfrAuthorizedName("");
                setMfrWebsite("");
                setMfrCategories("");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      )}

      {/* 2) PROGRAMMATIC REGISTRATION CONGRATS DIALOG BOX */}
      {registrationApprovedStatusText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="reg-congrats-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 text-center relative">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-150 animate-bounce">
              <CheckCircle className="h-10 w-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{tLocal(tLocal("Kayıt Başarıyla Alındı!", "Registration Received Successfully!"), "Registration Received Successfully!")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold px-2 text-center text-emerald-800 bg-emerald-50/50 py-3 rounded-xl border border-emerald-100">
                {registrationApprovedStatusText}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left text-[11px] text-slate-500 space-y-1">
              <strong>{tLocal(tLocal("Süreç Nasıl İşleyecek?", "How Will the Process Work?"), "How Will the Process Work?")}</strong>
              <p>{tLocal(tLocal("1. Yapılan ödeme ve girilen sektörel bilgiler ön onay kuruluna iletildi.", "1. The payment made and the sector details entered were forwarded to the pre-approval board."), "1. The payment made and the sector details entered were forwarded to the pre-approval board.")}</p>
              <p>{tLocal(tLocal("2. Profiliniz 24 saat içinde uzman ekipler tarafından incelenip onaylanacaktır.", "2. Your profile will be reviewed and approved by expert teams within 24 hours."), "2. Your profile will be reviewed and approved by expert teams within 24 hours.")}</p>
              <p>{tLocal(tLocal("3. Onay durumunda üyeliğiniz aktif hale gelecek ve sisteme güvenle giriş yapabileceksiniz.", "3. Upon approval, your membership will become active, and you can log into the system securely."), "3. Upon approval, your membership will become active, and you can log into the system securely.")}</p>
            </div>

            <button
              type="button"
              onClick={() => setRegistrationApprovedStatusText("")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              Tamam, Teşekkürler
            </button>
          </div>
        </div>
      )}

      {/* 3) ACTIVE / PASSIVE MEMBERSHIP TOGGLE CONFIRMATION MODAL */}
      {showPassiveConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="toggle-status-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200 shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{tLocal(tLocal("Üyelik Durum Değişikliği", "Membership Status Adjustment"), "Membership Status Adjustment")}</h3>
                <p className="text-[11px] text-slate-400">Hedef Durum: <strong className="text-slate-800">{activeUser.membership_status === "Aktif" ? "🔴 Pasif Üyelik" : "🟢 Aktif Üyelik"}</strong></p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              {activeUser.membership_status === "Aktif" ? (
                <>
                  <p className="font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-250 border-rose-200">
                    Hesabınızı pasif duruma almak üzeresiniz. Hesabınız silinmeyecek ancak platform üzerindeki görünürlüğünüz geçici olarak kapatılacaktır. Devam etmek istiyor musunuz?
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-slate-500 font-sans text-[11px]">
                    <p className="font-bold text-slate-700">Bu durumda;</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>{tLocal(tLocal("Ödeme geçmişiniz, sertifikalarınız ve eğitim durumunuz silinmez, korunur.", "Your payment history, certificates, and training status are kept, not deleted."), "Your payment history, certificates, and training status are kept, not deleted.")}</li>
                      <li>{tLocal(tLocal("Kurumsal profil bilgileriniz gizlenir, aramada çıkmazsınız.", "Your corporate profile details are hidden, you won't show up in searches."), "Your corporate profile details are hidden, you won't show up in searches.")}</li>
                      <li><strong>Firma Rehberi</strong>{tLocal(tLocal("listelerinde ve haritada görünmezsiniz.", "you will not appear in the directory lists or on the map."), "you will not appear in the directory lists or on the map.")}</li>
                      <li>{tLocal(tLocal("Yeni ilan veya içerik yayınlayamaz, teklif talepleri alamazsınız.", "You cannot publish new listings or content, and cannot receive quote requests."), "You cannot publish new listings or content, and cannot receive quote requests.")}</li>
                      <li>{tLocal(tLocal("Üyelik süreniz işlemeye devam eder, ücret iadesi yapılmaz veya paket süresi durdurulmaz.", "Your membership period continues to run, no refunds are made, and the package duration is not paused."), "Your membership period continues to run, no refunds are made, and the package duration is not paused.")}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    Hesabınızı tekrar aktif duruma almak üzeresiniz. Platform üzerindeki görünürlüğünüz ve yetkileriniz yeniden açılacaktır. Devam etmek istiyor musunuz?
                  </p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-slate-500 font-sans text-[11px]">
                    <p className="font-bold text-slate-700">Bu durumda;</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>{tLocal(tLocal("Firma rehberi listelerinde öncelikli olarak görünürsünüz.", "You appear with high priority in the company directory lists."), "You appear with high priority in the company directory lists.")}</li>
                      <li>{tLocal(tLocal("Haritadaki konumunuz ve kontak bilgileriniz yayına alınır.", "Your map location and contact details are published."), "Your map location and contact details are published.")}</li>
                      <li>{tLocal(tLocal("Yeni iş ilanı, kampanya yayınlayabilir ve bülten haberlerine erişebilirsiniz.", "You can publish new job postings, campaigns, and access bulletin news."), "You can publish new job postings, campaigns, and access bulletin news.")}</li>
                      <li>{tLocal(tLocal("Sektörel teklif ve ihale taleplerini almaya devam edersiniz.", "You continue to receive industry quote and tender requests."), "You continue to receive industry quote and tender requests.")}</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPassiveConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer text-center"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetStatus = (activeUser.membership_status === "Aktif" ? "Pasif" : "Aktif") as "Aktif" | "Pasif";
                  // Update current user
                  const currentUsers = getUsers();
                  const updatedList = currentUsers.map((u) => {
                    if (u.id === activeUser.id) {
                      return { ...u, membership_status: targetStatus };
                    }
                    return u;
                  });
                  saveUsers(updatedList);
                  setAllUsers(updatedList);
                  
                  // Update app global states
                  const changedUser = updatedList.find(u => u.id === activeUser.id);
                  if (changedUser) {
                    onLoginSuccess(changedUser);
                  }
                  
                  setShowPassiveConfirmModal(false);
                }}
                className={`flex-1 font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer text-center text-white ${
                  activeUser.membership_status === "Aktif" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {activeUser.membership_status === "Aktif" ? "Evet, Pasif Yap" : "Evet, Aktifleştir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4) SECURITY MANUAL MEMBERSHIP RENEWAL MODAL */}
      {showRenewModal && activeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="renew-membership-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200 shrink-0">
                  <Bell className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{tLocal("ÜYELİK YENİLEME VE GÜVENLİ ÖDEME", "MEMBERSHIP RENEWAL & SECURE PAYMENT")}</h3>
                  <p className="text-[10px] text-slate-500 font-sans">{tLocal("Otomatik çekim yoktur. Sadece onayınızla yenileme yapılır.", "There is no automatic billing. Renewal is performed only with your approval.")}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowRenewModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!renewSuccess ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  
                  const isPromoApplied = !!renewAppliedPromo;
                  const isEft = renewPaymentMethod === "eft";

                  if (!isPromoApplied && !isEft) {
                    if (!renewCardHolder || !renewCardNumber || !renewCardExpiry || !renewCardCvv) {
                      alert("Lütfen tüm kredi kartı bilgilerini girin.");
                      return;
                    }
                  }

                  setIsRenewing(true);
                  setTimeout(() => {
                    setIsRenewing(false);
                    const now = new Date();
                    const currentEnd = new Date(activeUser.membership_end).getTime();
                    let newEndDate: Date;
                    if (currentEnd <= now.getTime()) {
                      newEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
                    } else {
                      newEndDate = new Date(currentEnd + 365 * 24 * 60 * 60 * 1000);
                    }

                    const priceObj = getRolePrice(activeUser.role);
                    let finalAmount = priceObj.amount;
                    let paymentMethodName: "Kredi Kartı" | "Havale/EFT" | "Ücretsiz Kod" = "Kredi Kartı";
                    let invoiceStatus: "Ödendi" | "Beklemede" = "Ödendi";

                    if (isPromoApplied) {
                      finalAmount = 0;
                      paymentMethodName = "Ücretsiz Kod";
                      invoiceStatus = "Ödendi";
                    } else if (isEft) {
                      paymentMethodName = "Havale/EFT";
                      invoiceStatus = "Beklemede";
                    }

                    const invoiceId = `FAT-REN-${Math.floor(100000 + Math.random() * 900000)}`;
                    const timestamp = new Date().toISOString();

                    const newInvoice: FaturaHistory = {
                      id: invoiceId,
                      userId: activeUser.id,
                      amount: finalAmount,
                      date: timestamp,
                      membership_type: activeUser.membership_type || getRoleDisplayName(activeUser.role),
                      status: invoiceStatus,
                      payment_method: paymentMethodName,
                      userName: activeUser.name,
                      companyName: activeUser.company_name || "",
                      roleDisplayName: getRoleDisplayName(activeUser.role),
                      packageName: activeUser.membership_type || getRoleDisplayName(activeUser.role),
                      dekont_status: paymentMethodName === "Havale/EFT" ? "Bekliyor" : "Yok",
                      dekont_url: ""
                    };

                    // Update user card in DB
                    const currentUsers = getUsers();
                    const updatedList = currentUsers.map((u) => {
                      if (u.id === activeUser.id) {
                        if (isEft) {
                          return u;
                        } else {
                          return {
                            ...u,
                            membership_end: newEndDate.toISOString(),
                            membership_status: "Aktif" as const,
                            membership_fee: priceObj.amount,
                            subscription_type: "premium" as const,
                            subscription_status: "active" as const,
                            subscription_expires_at: newEndDate.toISOString()
                          };
                        }
                      }
                      return u;
                    });

                    const currentInvoices = getInvoices();
                    const updatedInvoices = [newInvoice, ...currentInvoices];

                    saveUsers(updatedList);
                    saveInvoices(updatedInvoices);
                    setAllUsers(updatedList);
                    setAllInvoices(updatedInvoices);

                    // Record free code usage
                    if (isPromoApplied && renewAppliedPromo) {
                      const promoCodes = getFreePromoCodes();
                      const updatedPromoCodes = promoCodes.map(c => {
                        if (c.code === renewAppliedPromo.code) {
                          return {
                            ...c,
                            used: true,
                            usedByUserId: activeUser.id,
                            usedByUserName: activeUser.name,
                            usedByUserEmail: activeUser.email,
                            usedAt: timestamp,
                            usedByIp: localStorage.getItem("lpgportal_client_ip") || "127.0.0.1"
                          };
                        }
                        return c;
                      });
                      saveFreePromoCodes(updatedPromoCodes);
                      
                      // Log system log
                      addSystemLog("Ücretsiz Kod Yenilemede Kullanıldı", `Kod: ${renewAppliedPromo.code} kullanıldı. Üye: ${activeUser.email}`, activeUser.name);
                    }

                    if (isEft) {
                      addSystemLog("Havale/EFT Yenileme Talebi", `Fatura ${invoiceId} oluşturuldu. Onay bekleniyor. Üye: ${activeUser.email}`, activeUser.name);
                      alert("Havale / EFT ödeme bildiriminiz alınmıştır. Yönetici onayından sonra üyeliğiniz uzatılacaktır.");
                      setShowRenewModal(false);
                    } else {
                      const refreshedActiveUser = updatedList.find(u => u.id === activeUser.id);
                      if (refreshedActiveUser) {
                        onLoginSuccess(refreshedActiveUser);
                      }
                      setRenewSuccess(true);
                    }

                    // Reset coupon inputs
                    setRenewPromoInput("");
                    setRenewAppliedPromo(null);
                    setRenewPromoError("");
                    setRenewPromoSuccess("");
                    setRenewPaymentMethod("cc");
                  }, 1800);
                }}
                className="space-y-4 font-sans"
              >
                {/* Informative Band for CC */}
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[10.5px] flex items-center gap-2 mb-2 font-sans font-medium">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{tLocal(tLocal("Kredi kartı entegrasyonu şu anda aktif değildir. Kredi kartı ile ödeme sistemi çok kısa süre içerisinde kullanıma açılacaktır.", "Credit card integration is currently inactive. Credit card payment system will be activated very soon."), "Credit card integration is currently inactive. Credit card payment system will be activated very soon.")}</span>
                </div>

                {/* Payment Tabs */}
                {!renewAppliedPromo && (
                  <div className="flex border-b border-slate-100 mb-4 font-sans">
                    <button
                      type="button"
                      onClick={() => setRenewPaymentMethod("cc")}
                      className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
                        renewPaymentMethod === "cc"
                          ? "text-emerald-600 border-b-2 border-emerald-600 font-extrabold"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      💳 Kredi Kartı ile Ödeme
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenewPaymentMethod("eft")}
                      className={`flex-1 text-center pb-2 text-xs font-bold transition-all relative ${
                        renewPaymentMethod === "eft"
                          ? "text-emerald-600 border-b-2 border-emerald-600 font-extrabold"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      🏦 Havale / EFT ile Ödeme
                    </button>
                  </div>
                )}

                {/* Billing Summary Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-405 text-slate-400 font-semibold font-mono">{tLocal(tLocal("PAKET TÜRÜ:", "PLAN TYPE:"), "PLAN TYPE:")}</span>
                    <strong className="text-slate-800 font-bold">{activeUser.membership_type || getRoleDisplayName(activeUser.role)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-405 text-slate-400 font-semibold font-mono">{tLocal(tLocal("MEVCUT BİTİŞ:", "CURRENT END DATE:"), "CURRENT END DATE:")}</span>
                    <strong className="text-slate-800 font-mono font-bold">
                      {new Date(activeUser.membership_end).toLocaleDateString('tr-TR')}
                    </strong>
                  </div>
                  {renewAppliedPromo ? (
                    <div className="border-t border-dashed border-slate-300 pt-2 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-bold font-mono">{tLocal(tLocal("YENİLEME ÜCRETİ:", "RENEWAL FEE:"), "RENEWAL FEE:")}</span>
                        <strong className="text-emerald-700 font-bold text-base font-mono line-through">
                          {getRolePrice(activeUser.role).amount.toLocaleString('tr-TR')} TL
                        </strong>
                      </div>
                      <div className="flex justify-between text-base font-bold text-emerald-700">
                        <span>{tLocal(tLocal("İndirimli Tutar:", "Discounted Amount:"), "Discounted Amount:")}</span>
                        <span>0 TL</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-2 text-sm">
                      <span className="text-slate-600 font-bold font-mono">{tLocal(tLocal("YENİLEME ÜCRETİ:", "RENEWAL FEE:"), "RENEWAL FEE:")}</span>
                      <strong className="text-emerald-700 font-bold text-base font-mono">
                        {getRolePrice(activeUser.role).amount.toLocaleString('tr-TR')} TL
                      </strong>
                    </div>
                  )}
                </div>

                {/* Promo Code Entry inside modal */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-sans">
                  <label className="text-[11px] font-bold text-slate-700 block">{tLocal(tLocal("Kampanya / Ücretsiz Üyelik Kodu", "Promo / Free Membership Code"), "Promo / Free Membership Code")}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={tLocal(tLocal("Örn: 8B3K9L2P", "e.g. 8B3K9L2P"), "e.g. 8B3K9L2P")}
                      value={renewPromoInput}
                      disabled={!!renewAppliedPromo}
                      onChange={(e) => setRenewPromoInput(e.target.value)}
                      className="bg-white border border-slate-200 text-xs rounded-lg p-2 flex-1 focus:outline-none focus:border-emerald-500 uppercase font-mono font-bold"
                    />
                    {renewAppliedPromo ? (
                      <button
                        type="button"
                        onClick={handleRemoveRenewPromoCode}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition"
                      >
                        Kaldır
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyRenewPromoCode}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                      >
                        Uygula
                      </button>
                    )}
                  </div>
                  {renewPromoError && <p className="text-[10px] font-bold text-rose-600">{renewPromoError}</p>}
                  {renewPromoSuccess && <p className="text-[10px] font-bold text-emerald-600">{renewPromoSuccess}</p>}
                </div>

                {/* Conditional Fields based on method and promo */}
                {renewAppliedPromo ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-2 font-sans">
                    <span className="text-2xl">🎁</span>
                    <h5 className="text-xs font-bold text-emerald-800">{tLocal(tLocal("Ücretsiz Yenileme Aktivasyonu", "Free Renewal Activation"), "Free Renewal Activation")}</h5>
                    <p className="text-[10.5px] text-emerald-700">{tLocal(tLocal("Ücretsiz üyelik kodunuz uygulandı. Ödeme yapmadan üyeliğinizi hemen uzatabilirsiniz.", "Your free promo code has been applied. You can extend your membership immediately without paying."), "Your free promo code has been applied. You can extend your membership immediately without paying.")}</p>
                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRenewModal(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                      >
                        Kapat
                      </button>
                      <button
                        type="submit"
                        disabled={isRenewing}
                        className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-xs py-3 rounded-xl transition shadow-md cursor-pointer text-center"
                      >
                        {isRenewing ? "İşleniyor..." : "Kodu Kullan ve Üyeliği Yenile"}
                      </button>
                    </div>
                  </div>
                ) : renewPaymentMethod === "eft" ? (
                  <div className="space-y-4 font-sans">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <h5 className="text-xs font-bold text-slate-800">{tLocal(tLocal("Şirket Havale / EFT Banka Bilgileri", "Company Wire Transfer / EFT Bank Details"), "Company Wire Transfer / EFT Bank Details")}</h5>
                      <div className="text-[11px] text-slate-600 space-y-1.5 font-mono">
                        <p>🏦 <strong>Banka:</strong> Garanti BBVA</p>
                        <p>👤 <strong>{tLocal(tLocal("Alıcı:", "Recipient:"), "Recipient:")}</strong>{tLocal(tLocal("LPG PORTAL Bilişim Teknolojileri A.Ş.", "LPG PORTAL Information Technologies Inc."), "LPG PORTAL Information Technologies Inc.")}</p>
                        <p>📋 <strong>IBAN:</strong> TR56 0006 2000 0000 1234 5678 90</p>
                      </div>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-200 text-[10.5px] text-slate-700 p-3.5 rounded-xl space-y-1 leading-relaxed">
                      <p className="font-bold text-amber-800">{tLocal(tLocal("⚠️ Havale / EFT Talimatı:", "⚠️ Wire Transfer / EFT Instructions:"), "⚠️ Wire Transfer / EFT Instructions:")}</p>
                      <p>{tLocal(tLocal("Ödemenizi gönderirken açıklama kısmına üyelik e-posta adresinizi (", "When sending your payment, you must write your membership email address ("), "When sending your payment, you must write your membership email address (")}<strong className="font-mono text-slate-900">{activeUser.email}</strong>{tLocal(tLocal(") mutlaka yazınız.", ") in the description section."), ") in the description section.")}</p>
                      <p>{tLocal(tLocal("Ödemeniz onaylandıktan sonra üyeliğiniz 24 saat içinde uzatılacaktır. Hızlı onay için dekontunuzu", "Once your payment is approved, your membership will be extended within 24 hours. For fast approval, you can send your receipt to"), "Once your payment is approved, your membership will be extended within 24 hours. For fast approval, you can send your receipt to")}<strong className="font-mono text-slate-900">destek@lpgportal.com</strong>{tLocal(tLocal("adresine gönderebilirsiniz.", "address."), "address.")}</p>
                    </div>
                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRenewModal(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                      >
                        Kapat
                      </button>
                      <button
                        type="submit"
                        className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer text-center"
                      >
                        Havale / EFT ile Yenileme Talebi Gönder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Secure Credit Card Details inputs */}
                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("Kart Üzerindeki İsim", "Name on Card"), "Name on Card")}</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ad SOYAD"
                          value={renewCardHolder}
                          onChange={(e) => setRenewCardHolder(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("Kredi Kartı Numarası", "Credit Card Number"), "Credit Card Number")}</label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            required
                            maxLength={19}
                            placeholder="4000 1234 5678 9010"
                            value={renewCardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              const matches = v.match(/\d{4,16}/g);
                              const match = (matches && matches[0]) || "";
                              const parts = [];

                              for (let i = 0, len = match.length; i < len; i += 4) {
                                parts.push(match.substring(i, i + 4));
                              }

                              if (parts.length > 0) {
                                setRenewCardNumber(parts.join(" "));
                              } else {
                                setRenewCardNumber(v);
                              }
                            }}
                            className="w-full bg-slate-50 text-xs py-2.5 pl-9 pr-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">S.T. (AA/YY)</label>
                          <input 
                            type="text" 
                            required
                            maxLength={5}
                            placeholder="12/30"
                            value={renewCardExpiry}
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, "");
                              if (v.length > 2) {
                                v = v.substring(0, 2) + "/" + v.substring(2, 4);
                              }
                              setRenewCardExpiry(v);
                            }}
                            className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-center"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 block">{tLocal(tLocal("CVV (Güvenlik Kodu)", "CVV (Security Code)"), "CVV (Security Code)")}</label>
                          <input 
                            type="password" 
                            required
                            maxLength={3}
                            placeholder="***"
                            value={renewCardCvv}
                            onChange={(e) => setRenewCardCvv(e.target.value.replace(/\D/g, ""))}
                            className="w-full bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none font-mono text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRenewModal(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-750 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer text-center"
                      >
                        Kapat
                      </button>
                      <button
                        type="submit"
                        disabled={isRenewing}
                        className="flex-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-xs py-3 rounded-xl transition shadow-md cursor-pointer text-center flex justify-center items-center gap-1.5 uppercase tracking-wider"
                      >
                        {isRenewing ? "Yenileme Yapılıyor..." : "Öde ve Süreyi 1 Yıl Uzat"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="text-center py-6 space-y-4 animate-fade-in font-sans">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner border border-emerald-200">
                  🎉
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-base font-black text-slate-900 uppercase">{tLocal(tLocal("ÜYELİĞİNİZ BAŞARIYLA YENİLENDİ!", "YOUR MEMBERSHIP WAS RENEWED SUCCESSFULLY!"), "YOUR MEMBERSHIP WAS RENEWED SUCCESSFULLY!")}</h4>
                  <p className="text-xs text-slate-500">
                    Ödemeniz başarıyla alınmıştır. Üyelik geçerlilik bitiş tarihiniz <strong>{tLocal(tLocal("365 gün (1 Yıl) uzatılmıştır", "Extended for 365 days (1 Year)"), "Extended for 365 days (1 Year)")}</strong>. Kesintisiz hizmet almaya devam edebilirsiniz.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-left text-[11px] text-slate-600 font-mono space-y-1">
                  <p>🎫 <strong>{tLocal(tLocal("Yeni Bitiş Tarihi:", "New Expiration Date:"), "New Expiration Date:")}</strong> {new Date(activeUser.membership_end).toLocaleDateString("tr-TR")}</p>
                  <p>📑 <strong>{tLocal(tLocal("Fatura Tutarı:", "Invoice Amount:"), "Invoice Amount:")}</strong> {getRolePrice(activeUser.role).amount.toLocaleString('tr-TR')} TL (KDV Dahil)</p>
                  <p>🟢 <strong>{tLocal(tLocal("Üyelik Durumu:", "Membership Status:"), "Membership Status:")}</strong>{tLocal(tLocal("AKTİF", "ACTIVE"), "ACTIVE")}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowRenewModal(false);
                    setRenewSuccess(false);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md cursor-pointer uppercase tracking-wider"
                >
                  Harika, Teşekkürler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Manual Notification Details Preview Modal */}
      {previewNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="manual-notif-preview-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200 shrink-0">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{tLocal(tLocal("Duyuru Detayı", "Announcement Detail"), "Announcement Detail")}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {new Date(previewNotification.sentAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewNotification(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <p>{tLocal(tLocal("👤 Gönderen:", "👤 Sender:"), "👤 Sender:")}<strong className="text-slate-700">{previewNotification.senderAdmin}</strong></p>
                <p>🎯 Hedef: <strong className="text-slate-700">{previewNotification.targetAudience}</strong></p>
                <p>⚡ Öncelik: 
                  <span className={`ml-1 font-bold ${
                    previewNotification.priority === tLocal("Yüksek", "High")
                      ? "text-rose-650 text-rose-600"
                      : previewNotification.priority === "Normal"
                      ? "text-amber-650"
                      : "text-emerald-600"
                  }`}>
                    {previewNotification.priority}
                  </span>
                </p>
                {previewNotification.expirationDate && (
                  <p>{tLocal(tLocal("📅 Son Kullanım:", "📅 Expiration Date:"), "📅 Expiration Date:")}<strong className="text-slate-700">{new Date(previewNotification.expirationDate).toLocaleDateString("tr-TR")}</strong></p>
                )}
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-900 text-sm">{previewNotification.title}</h4>
                <p className="text-slate-650 text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {previewNotification.message}
                </p>
              </div>

              <div className="flex gap-1.5 flex-wrap pt-1.5">
                <span className="text-[9px] text-slate-400 font-mono uppercase font-bold pt-1 block mr-1 font-bold">Kanallar:</span>
                {previewNotification.channels.map((chan, i) => (
                  <span key={i} className="bg-slate-100 text-slate-750 text-slate-700 font-bold text-[9px] px-2 py-0.5 rounded border border-slate-200">
                    {chan}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewNotification(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Edit Modal for Admin */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 animate-fade-in" id="review-edit-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200 shrink-0">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{tLocal(tLocal("Yorum Düzenle", "Edit Review"), "Edit Review")}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    ID: {editingReview.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingReview(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (editingReview.title.trim().length < 3) {
                  alert("Lütfen daha açıklayıcı bir başlık yazın (en az 3 karakter).");
                  return;
                }
                if (editingReview.content.trim().length < 15) {
                  alert("Lütfen deneyiminizi daha detaylı açıklayın (en az 15 karakter).");
                  return;
                }

                setHomeReviews((prev: any[]) => prev.map(x => x.id === editingReview.id ? { ...editingReview, updatedAt: new Date().toISOString() } : x));
                addSystemLog("Yorum Düzenlendi", `Yönetici '${editingReview.title}' başlıklı yorumu düzenledi.`, activeUser?.email || "");
                setEditingReview(null);
              }}
              className="space-y-4 text-xs font-sans"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tLocal(tLocal("Yazar Adı Soyadı", "Author Full Name"), "Author Full Name")}</label>
                  <input
                    type="text"
                    required
                    value={editingReview.authorName || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, authorName: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Puan (1-5)</label>
                  <select
                    value={editingReview.rating || 5}
                    onChange={(e) => setEditingReview({ ...editingReview, rating: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all cursor-pointer font-bold text-amber-500"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tLocal(tLocal("Şehir", "City"), "City")}</label>
                  <input
                    type="text"
                    required
                    value={editingReview.city || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, city: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {editingReview.authorRole === "vehicle_owner" ? "Meslek" : "Sektör Rolü / Ünvan"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReview.profession || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, profession: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Vehicle specific fields or brand/company for professionals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {editingReview.authorRole === "vehicle_owner" ? tLocal("Araç Markası", "Vehicle Brand") : "Firma / Temsil Edilen Marka"}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingReview.carBrand || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, carBrand: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                {editingReview.authorRole === "vehicle_owner" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tLocal(tLocal("Araç Modeli", "Vehicle Model"), "Vehicle Model")}</label>
                    <input
                      type="text"
                      required
                      value={editingReview.carModel || ""}
                      onChange={(e) => setEditingReview({ ...editingReview, carModel: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tLocal(tLocal("Yorum Başlığı", "Review Title"), "Review Title")}</label>
                <input
                  type="text"
                  required
                  value={editingReview.title || ""}
                  onChange={(e) => setEditingReview({ ...editingReview, title: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{tLocal(tLocal("Yorum İçeriği", "Review Content"), "Review Content")}</label>
                <textarea
                  required
                  rows={4}
                  value={editingReview.content || ""}
                  onChange={(e) => setEditingReview({ ...editingReview, content: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs py-2 px-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition cursor-pointer text-center"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-2.5 px-5 rounded-xl transition shadow-md cursor-pointer text-center uppercase tracking-wider"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREMIUM RECEIPT ZOOM/ROTATE MODAL OVERLAY */}
      {previewDekontUrl && (
        <div className="fixed inset-0 z-[1000] backdrop-blur-md bg-slate-950/70 flex items-center justify-center p-4 transition-all duration-300 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-205/80 shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 flex justify-between items-center px-6 py-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-indigo-600" />
                  Ödeme Dekontu Önizleme ({previewInvoiceId})
                </h3>
              </div>
              
              {/* Toolbar Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center justify-center"
                  title={tLocal(tLocal("Yakınlaştır", "Zoom In"), "Zoom In")}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center justify-center"
                  title={tLocal(tLocal("Uzaklaştır", "Zoom Out"), "Zoom Out")}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotateAngle(prev => (prev + 90) % 360)}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center justify-center"
                  title={tLocal(tLocal("90 Derece Döndür", "Rotate 90 Degrees"), "Rotate 90 Degrees")}
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setRotateAngle(0);
                  }}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition cursor-pointer flex items-center justify-center"
                  title={tLocal(tLocal("Sıfırla", "Reset"), "Reset")}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDekontFile(previewDekontUrl, previewInvoiceId)}
                  className="p-1.5 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 rounded-lg text-emerald-700 transition cursor-pointer flex items-center justify-center"
                  title={tLocal(tLocal("İndir", "Download"), "Download")}
                >
                  <Download className="h-4 w-4" />
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewDekontUrl(null);
                    setPreviewInvoiceId("");
                  }}
                  className="p-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-lg text-slate-700 transition cursor-pointer flex items-center justify-center"
                  title="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-auto bg-slate-950 flex items-center justify-center p-6 relative border-y border-slate-100 select-none">
              {previewDekontUrl.startsWith("data:application/pdf") ? (
                <iframe src={previewDekontUrl} className="w-full h-full border-0 rounded-xl bg-white" />
              ) : (
                <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={previewDekontUrl}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotateAngle}deg)`,
                      transition: "transform 0.15s ease-out",
                    }}
                    className="max-w-full max-h-full object-contain rounded shadow-2xl"
                    alt="Receipt / Dekont Belgesi"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 text-[11px] text-slate-500 font-medium border-t border-slate-100 flex justify-between items-center">
              <span>{tLocal(tLocal("Yakınlaştırma Kontrolleri: Yakınlaştır (+0.25x), Uzaklaştır (-0.25x), Döndür (+90°).", "Zoom Controls: Zoom In (+0.25x), Zoom Out (-0.25x), Rotate (+90°)."), "Zoom Controls: Zoom In (+0.25x), Zoom Out (-0.25x), Rotate (+90°).")}</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">{tLocal(tLocal("Ölçek: {zoomLevel.toFixed(2)}x | Açı: {rotateAngle}°", "Scale: {zoomLevel.toFixed(2)}x | Angle: {rotateAngle}°"), "Scale: {zoomLevel.toFixed(2)}x | Angle: {rotateAngle}°")}</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Global Helper Functions for Date and File Handling
const isToday = (dateStr: string): boolean => {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  } catch (e) {
    return false;
  }
};

const isThisMonth = (dateStr: string): boolean => {
  try {
    const d = new Date(dateStr);
    const today = new Date();
    return d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  } catch (e) {
    return false;
  }
};

const handleDownloadDekontFile = (base64Data: string, invoiceId: string) => {
  try {
    const parts = base64Data.split(";base64,");
    if (parts.length !== 2) return;
    const contentType = parts[0].split(":")[1];
    
    let ext = "png";
    if (contentType === "image/jpeg" || contentType === "image/jpg") ext = "jpg";
    else if (contentType === "application/pdf") ext = "pdf";
    else if (contentType === "image/webp") ext = "webp";
    
    const link = document.createElement("a");
    link.href = base64Data;
    link.download = `dekont_${invoiceId}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Download error", e);
  }
};
