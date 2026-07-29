// React-based Role-based Membership and Subscription State Engine
// This manages custom user data, database schemas, local persistence, mock database seeding, and admin panel stats.
import { hashPassword } from "./security";

export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: "visitor" | "vehicle_owner" | "dealer" | "engineer" | "manufacturer" | "admin";
  membership_type: string;
  membership_fee: number;
  membership_start: string;
  membership_end: string;
  membership_status: "Aktif" | "Pasif" | "Süresi Dolmuş" | "Beklemede" | "İptal" | "Onay Bekliyor" | "Askıya Alındı";
  created_at: string;
  
  // Custom Registration Fields per Role requirements in USER_REQUEST:
  // dealer (Firma)
  company_name?: string;
  authorized_name?: string;
  tax_info?: string;
  website?: string;
  city?: string;
  district?: string;

  // engineer (LPG Mühendisi / Usta)
  expertise?: string; // Uzmanlık Alanı
  
  // working brands check for dealer/engineer
  working_brands?: string[];

  // manufacturer (Kit Üreticisi)
  brand_name?: string;
  authorized_person?: string;
  product_categories?: string;

  // KVKK and Consent Log Fields
  kvkk_approved?: boolean;
  privacy_policy_approved?: boolean;
  terms_approved?: boolean;
  marketing_approved?: boolean;
  approval_date?: string;
  ip_address?: string;

  // Logo system
  logo_url?: string;
  no_logo?: boolean;
  logo_type?: "real" | "auto";

  // Single Session Tracking & Audit Trail
  active_session_id?: string;
  last_login_time?: string;
  last_login_ip?: string;
  last_login_device?: string;
}

export interface FaturaHistory {
  id: string;
  userId: string;
  amount: number;
  date: string;
  membership_type: string;
  status: "Ödendi" | "İade" | "İptal" | "Beklemede" | "Reddedildi" | "İnceleniyor" | "Eksik Evrak";
  payment_method?: "Kredi Kartı" | "Havale/EFT" | "Ücretsiz Kod";
  admin_note?: string;
  userName?: string;
  companyName?: string;
  roleDisplayName?: string;
  packageName?: string;
  dekont_status?: "Yok" | "Bekliyor" | "İnceleniyor" | "Onaylandı" | "Reddedildi" | "Eksik Evrak";
  dekont_url?: string;
}

export interface FreePromoCode {
  code: string;
  used: boolean;
  usedByUserId?: string;
  usedByUserName?: string;
  usedByUserEmail?: string;
  usedAt?: string;
  usedByIp?: string;
}

export const INITIAL_FREE_PROMO_CODES: FreePromoCode[] = [
  { code: "8B3K9L2P", used: false },
  { code: "X7M4N1V9", used: false },
  { code: "D2C6R5TF", used: false },
  { code: "J9H3W8QZ", used: false },
  { code: "V5B1N7MK", used: false },
  { code: "L4P9S2JD", used: false },
  { code: "G6F3H8YT", used: false },
  { code: "Q2W7E4RT", used: false },
  { code: "Z8X5C9VB", used: false },
  { code: "Y1U6I3OP", used: false },
  { code: "M9N4B2VC", used: false },
  { code: "K7L3J8HG", used: false },
  { code: "D5S2A9QW", used: false },
  { code: "R4T6Y1UI", used: false },
  { code: "P3O9I8UY", used: false },
  { code: "N2M5B6VC", used: false },
  { code: "H8G4F1DS", used: false },
  { code: "W7Q2E9RT", used: false },
  { code: "J1K6L4PZ", used: false },
  { code: "V9C3X8BN", used: false }
];

export function getFreePromoCodes(): FreePromoCode[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_free_promo_codes");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return INITIAL_FREE_PROMO_CODES;
    }
  }
  localStorage.setItem("lpgportal_free_promo_codes", JSON.stringify(INITIAL_FREE_PROMO_CODES));
  return INITIAL_FREE_PROMO_CODES;
}

export function saveFreePromoCodes(codes: FreePromoCode[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lpgportal_free_promo_codes", JSON.stringify(codes));
}

// ----------------------------------------------------
// MOCK USERS & DATABASE SEEDING
// ----------------------------------------------------

export const DEFAULT_USERS: DbUser[] = [
  {
    id: "user_admin",
    name: "Kerem Kar (Yönetici)",
    email: "admin@lpgportal.com",
    phone: "0555 999 8877",
    password: "419a60d3a0ec51eeaf975d21742940b0b959ff16824da99107c220a4585c5bcc",
    role: "admin",
    membership_type: "Sistem Yönetici Lisansı",
    membership_fee: 0,
    membership_start: "2025-01-01T00:00:00Z",
    membership_end: "2030-01-01T00:00:00Z",
    membership_status: "Aktif",
    created_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "user_test_kit",
    name: "Kit Üretici Test Hesabı",
    email: "kit@lpgportal.com",
    phone: "0555 111 2233",
    password: "5ca3473c3f5629c7675a271e6dcaecd6475b000faa965a11f146ae2340988949",
    role: "manufacturer",
    membership_type: "Kit Üretici Küresel Lisans",
    membership_fee: 5000,
    membership_start: "2025-01-01T00:00:00Z",
    membership_end: "2030-01-01T00:00:00Z",
    membership_status: "Aktif",
    created_at: "2025-01-01T00:00:00Z",
    brand_name: "Test Kit",
    authorized_person: "Kit Test Yöneticisi",
    product_categories: "LPG Kitleri, Regülatörler"
  },
  {
    id: "user_test_servis",
    name: "Servis Test Hesabı",
    email: "servis@lpgportal.com",
    phone: "0555 444 5566",
    password: "b3658dee3092063d39d08fd9437f71583f077804b5a8faa66689c219c6ff240a",
    role: "dealer",
    membership_type: "Kurumsal Bayi & Atölye Lisansı",
    membership_fee: 1750,
    membership_start: "2025-01-01T00:00:00Z",
    membership_end: "2030-01-01T00:00:00Z",
    membership_status: "Aktif",
    created_at: "2025-01-01T00:00:00Z",
    company_name: "Test Servis",
    authorized_name: "Servis Test Yöneticisi",
    tax_info: "Üsküdar V.D. - 1234567890",
    website: "www.testservis.com",
    city: "İstanbul",
    district: "Üsküdar"
  }
];

export const DEFAULT_INVOICES: FaturaHistory[] = [];

// Helper to initialize database in localStorage
export function initializeDb() {
  if (typeof window === "undefined") return;
  
  if (!localStorage.getItem("lpgportal_users")) {
    localStorage.setItem("lpgportal_users", JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem("lpgportal_invoices")) {
    localStorage.setItem("lpgportal_invoices", JSON.stringify(DEFAULT_INVOICES));
  }
  if (!localStorage.getItem("lpgportal_free_promo_codes")) {
    localStorage.setItem("lpgportal_free_promo_codes", JSON.stringify(INITIAL_FREE_PROMO_CODES));
  }
}

// Get all users
export function getUsers(): DbUser[] {
  initializeDb();
  const usersJson = localStorage.getItem("lpgportal_users");
  return usersJson ? JSON.parse(usersJson) : DEFAULT_USERS;
}

// Get invoices
export function getInvoices(): FaturaHistory[] {
  initializeDb();
  const invJson = localStorage.getItem("lpgportal_invoices");
  return invJson ? JSON.parse(invJson) : DEFAULT_INVOICES;
}

// Save users
export function saveUsers(users: DbUser[]) {
  const normalizePhone = (phone: string): string => {
    const digits = (phone || "").replace(/\D/g, "");
    return digits.slice(-10);
  };

  // Validate duplicates
  for (let i = 0; i < users.length; i++) {
    const u1 = users[i];
    const u1PhoneNorm = normalizePhone(u1.phone);
    for (let j = i + 1; j < users.length; j++) {
      const u2 = users[j];
      if (u1.email.toLowerCase().trim() === u2.email.toLowerCase().trim()) {
        throw new Error("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır.");
      }
      if (u1PhoneNorm && u1PhoneNorm === normalizePhone(u2.phone)) {
        throw new Error("Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır.");
      }
    }
  }

  localStorage.setItem("lpgportal_users", JSON.stringify(users));
}

// Save invoices
export function saveInvoices(invoices: FaturaHistory[]) {
  localStorage.setItem("lpgportal_invoices", JSON.stringify(invoices));
}

// Map role code to Turkey Display Name
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "visitor": return "Ziyaretçi";
    case "vehicle_owner": return "Araç Sahibi";
    case "dealer": return "Firma (Bayi / Usta)";
    case "engineer": return "LPG Mühendisi / Usta";
    case "manufacturer": return "Kit Üreticisi";
    case "admin": return "Sistem Yöneticisi";
    default: return role;
  }
}

// Map display name to role code
export function getRoleFromDisplayName(displayName: string): "visitor" | "vehicle_owner" | "dealer" | "engineer" | "manufacturer" {
  if (displayName.includes("Ziyaretçi") || displayName.includes("visitor")) return "visitor";
  if (displayName.includes("Araç Sahibi") || displayName.includes("vehicle_owner")) return "vehicle_owner";
  if (displayName.includes("Firma") || displayName.includes("dealer")) return "dealer";
  if (displayName.includes("Mühendis") || displayName.includes("engineer") || displayName.includes("Uzman") || displayName.includes("Usta")) return "engineer";
  if (displayName.includes("Üretici") || displayName.includes("manufacturer")) return "manufacturer";
  return "visitor";
}

export interface PricingConfig {
  vehicle_owner: number;
  engineer: number;
  dealer: number;
  manufacturer: number;
}

export const INITIAL_PRICING: PricingConfig = {
  vehicle_owner: 500,
  engineer: 1000,
  dealer: 1750,
  manufacturer: 5000,
};

export function getPricingConfig(): PricingConfig {
  if (typeof window === "undefined") return INITIAL_PRICING;
  const saved = localStorage.getItem("lpgportal_prices");
  if (saved) {
    try {
      return { ...INITIAL_PRICING, ...JSON.parse(saved) };
    } catch (e) {
      return INITIAL_PRICING;
    }
  }
  localStorage.setItem("lpgportal_prices", JSON.stringify(INITIAL_PRICING));
  return INITIAL_PRICING;
}

export function savePricingConfig(config: PricingConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lpgportal_prices", JSON.stringify(config));
}

// Get pricing based on role
export function getRolePrice(role: string): { amount: number; displayPrice: string; title: string } {
  const config = getPricingConfig();
  switch (role) {
    case "vehicle_owner":
      return { amount: config.vehicle_owner, displayPrice: `${config.vehicle_owner.toLocaleString('tr-TR')} TL / Yıl`, title: "Yıllık Standart Otogaz Üyeliği" };
    case "dealer":
      return { amount: config.dealer, displayPrice: `${config.dealer.toLocaleString('tr-TR')} TL / Yıl`, title: "Kurumsal Bayi & Atölye Lisansı" };
    case "engineer":
      return { amount: config.engineer, displayPrice: `${config.engineer.toLocaleString('tr-TR')} TL / Yıl`, title: "LPG Mühendisi & Tekniker Paket" };
    case "manufacturer":
      return { amount: config.manufacturer, displayPrice: `${config.manufacturer.toLocaleString('tr-TR')} TL / Yıl`, title: "Kit Üretici Küresel Lisans" };
    default:
      return { amount: 0, displayPrice: "0 TL", title: "Ücretsiz Ziyaretçi" };
  }
}

export interface UsedCoupon {
  code: string;
  usedByUserId: string;
  usedByUserName: string;
  companyName: string;
  usedAt: string;
  registeredAt: string;
}

export function getUsedCoupons(): UsedCoupon[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_used_coupons");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function saveUsedCoupons(coupons: UsedCoupon[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lpgportal_used_coupons", JSON.stringify(coupons));
}

export function getRemainingDays(endDateStr: string): number {
  if (!endDateStr) return 0;
  const end = new Date(endDateStr).getTime();
  const now = Date.now();
  const diffTime = end - now;
  // Math.ceil to give the correct number of days remaining
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export interface ReminderNotification {
  sms: string;
  emailSubject: string;
  emailContent: string;
  panel: string;
}

export function getRemindersForUser(user: DbUser): ReminderNotification {
  const fallback: ReminderNotification = { 
    sms: "—", 
    emailSubject: "—", 
    emailContent: "—", 
    panel: "" 
  };
  
  if (!user || user.role === "admin" || user.role === "visitor") {
    return fallback;
  }
  
  const remaining = getRemainingDays(user.membership_end);
  const name = user.name;
  
  if (remaining <= 0) {
    return {
      sms: `Üyeliğiniz sona ermiştir. Hizmetlerden tekrar yararlanabilmek için üyeliğinizi yenileyebilirsiniz.`,
      emailSubject: `LPG PORTAL Üyeliğiniz Sona Erdi`,
      emailContent: `Sayın ${name},\n\nÜyeliğiniz sona ermiştir. Hizmetlerden tekrar yararlanabilmek için üyeliğinizi yenileyebilirsiniz.`,
      panel: `Üyeliğiniz sona ermiştir. Hizmetlerden tekrar yararlanabilmek için üyeliğinizi yenileyebilirsiniz.`
    };
  }

  if (remaining === 1) {
    return {
      sms: `⚠️ Önemli Uyarı\n\nÜyeliğiniz yarın sona erecektir. Üyeliğinizi yenilemezseniz bazı özelliklere erişiminiz kısıtlanacaktır.`,
      emailSubject: `LPG PORTAL Üyeliğinizin Süresi Dolmak Üzere`,
      emailContent: `Sayın ${name},\n\nÜyeliğiniz yarın sona erecektir. Üyeliğinizi yenilemezseniz bazı özelliklere erişiminiz kısıtlanacaktır.`,
      panel: `⚠️ Önemli Uyarı: Üyeliğiniz yarın sona erecektir. Üyeliğinizi yenilemezseniz bazı özelliklere erişiminiz kısıtlanacaktır.`
    };
  }

  // Exact 3, 5, or 15 days or thresholds
  let effectiveDays = remaining;
  if (remaining !== 3 && remaining !== 5 && remaining !== 15) {
    // Determine last sent threshold
    if (remaining <= 3) {
      effectiveDays = 3;
    } else if (remaining <= 5) {
      effectiveDays = 5;
    } else if (remaining <= 15) {
      effectiveDays = 15;
    } else {
      return fallback;
    }
  }

  return {
    sms: `Merhaba ${name},\n\nLPG PORTAL üyeliğinizin süresi ${effectiveDays} gün sonra sona erecektir.\nHizmetlerinizin kesintiye uğramaması için üyeliğinizi yenileyebilirsiniz.\nwww.lpgportal.com`,
    emailSubject: `LPG PORTAL Üyeliğinizin Süresi Dolmak Üzere`,
    emailContent: `Sayın ${name},\n\nAktif LPG PORTAL üyeliğinizin süresi ${effectiveDays} gün sonra sona erecektir.\n\nÜyeliğinizi yenileyerek:\n* Firma Rehberi erişiminizi\n* Teknik Bülten erişiminizi\n* Eğitim içeriklerinizi\n* Market özelliklerinizi\n* Teklif ve Destek Sistemi erişiminizi\n\nkesintisiz kullanmaya devam edebilirsiniz.`,
    panel: `🔔 Üyeliğinizin bitmesine ${effectiveDays} gün kaldı.\nŞimdi yenileyerek hizmetlerin kesintiye uğramasını önleyebilirsiniz.`
  };
}

export interface ManualNotificationEntry {
  id: string;
  sentAt: string;        // Gönderim Zamanı (ISO String)
  senderAdmin: string;   // Gönderen Yönetici Adı
  targetAudience: string;// Hedef Kitle Etiketi (Örn: "LPG Mühendisleri")
  channels: string[];    // Kullanılan Kanallar (Örn: ["Panel", "SMS"])
  title: string;         // Başlık
  message: string;       // Mesaj İçeriği
  expirationDate?: string; // Son Kullanma Tarihi (Opsiyonel)
  priority: "Düşük" | "Normal" | "Yüksek"; // Öncelik Seviyesi
  status: "Gönderildi" | "Hata"; // Gönderim Durumu
}

// ----------------------------------------------------
// COHERENT SYSTEM LOGGING (SİSTEM HAREKETLERİ LOGLARIMIZ)
// ----------------------------------------------------
export interface SystemLog {
  id: string;
  user: string;
  date: string;
  time: string;
  actionType: string;
  details: string;
}

export function getSystemLogs(): SystemLog[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_system_logs");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function addSystemLog(actionType: string, details: string, userMailOrName?: string) {
  if (typeof window === "undefined") return;
  const logs = getSystemLogs();
  const now = new Date();
  const formatTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const formatDate = now.toLocaleDateString('tr-TR');
  const newLog: SystemLog = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    user: userMailOrName || "Ziyaretçi",
    date: formatDate,
    time: formatTime,
    actionType,
    details
  };
  localStorage.setItem("lpgportal_system_logs", JSON.stringify([newLog, ...logs].slice(0, 500)));
}

// ----------------------------------------------------
// CENTRAL NOTIFICATION HUB & NOTIFICATION HISTORY
// ----------------------------------------------------
export interface CentralNotification {
  id: string;
  userId: string; // "all" for General announcements, or specific user ID
  title: string;
  message: string;
  type: "teklif" | "mesaj" | "siparis" | "uyari" | "duyuru";
  channel: "sms" | "email" | "panel" | "all"; 
  createdAt: string;
  read: boolean;
}

export interface NotificationLog {
  id: string;
  userId: string;
  title: string;
  message: string;
  channel: "sms" | "email" | "panel" | "all";
  sentAt: string;
  status: "Gönderildi" | "Hata";
}

export function getCentralNotifications(): CentralNotification[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_central_notifications");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  const defaultNotifs: CentralNotification[] = [
    {
      id: "notif_1",
      userId: "user_dealer_1",
      title: "Yeni Teklif Talebi",
      message: "Ankara bölgesinde Fiat Egea aracına LPG montajı için yeni bir teklif talebi bulunmaktadır.",
      type: "teklif",
      channel: "panel",
      createdAt: new Date().toISOString(),
      read: false
    },
    {
      id: "notif_2",
      userId: "all",
      title: "Sistem Bakım Duyurusu",
      message: "LPG PORTAL veritabanı optimizasyon çalışması nedeniyle bu gece 02:00 - 04:00 saatleri arasında kesintiler yaşanabilir.",
      type: "duyuru",
      channel: "all",
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      read: false
    }
  ];
  localStorage.setItem("lpgportal_central_notifications", JSON.stringify(defaultNotifs));
  return defaultNotifs;
}

export function getNotificationLogs(): NotificationLog[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_sent_notification_logs");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function addCentralNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: CentralNotification["type"], 
  channel: CentralNotification["channel"] = "panel"
) {
  if (typeof window === "undefined") return;
  const notifs = getCentralNotifications();
  const newNotif: CentralNotification = {
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    userId,
    title,
    message,
    type,
    channel,
    createdAt: new Date().toISOString(),
    read: false
  };
  localStorage.setItem("lpgportal_central_notifications", JSON.stringify([newNotif, ...notifs]));
  
  // Save Notification Log for Admin verification
  const logs = getNotificationLogs();
  const newLog: NotificationLog = {
    id: "sent_log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    userId,
    title,
    message,
    channel,
    sentAt: new Date().toISOString(),
    status: "Gönderildi"
  };
  localStorage.setItem("lpgportal_sent_notification_logs", JSON.stringify([newLog, ...logs].slice(0, 500)));
}

export function sendLpgNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: CentralNotification["type"] = "duyuru", 
  channel: CentralNotification["channel"] = "panel",
  isMandatory: boolean = false
) {
  if (typeof window === "undefined") return;
  
  // If not mandatory, confirm user's notification preferences
  if (!isMandatory && userId !== "all") {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user && user.marketing_approved === false) {
      // User turned off marketing & optional communication, skip this notification
      return;
    }
  }

  addCentralNotification(userId, title, message, type, channel);
}

export function markNotificationAsRead(notifId: string) {
  if (typeof window === "undefined") return;
  const notifs = getCentralNotifications();
  const updated = notifs.map(n => n.id === notifId ? { ...n, read: true } : n);
  localStorage.setItem("lpgportal_central_notifications", JSON.stringify(updated));
}

export function markAllNotificationsAsRead(userId: string) {
  if (typeof window === "undefined") return;
  const notifs = getCentralNotifications();
  const updated = notifs.map(n => (n.userId === userId || n.userId === "all") ? { ...n, read: true } : n);
  localStorage.setItem("lpgportal_central_notifications", JSON.stringify(updated));
}

export function clearNotifications(userId: string) {
  if (typeof window === "undefined") return;
  const notifs = getCentralNotifications();
  const updated = notifs.filter(n => n.userId !== userId && n.userId !== "all");
  localStorage.setItem("lpgportal_central_notifications", JSON.stringify(updated));
}

// ----------------------------------------------------
// AUTOMATIC BACKUP AND DATABASE RESTORE ENGINE
// ----------------------------------------------------
export interface DbBackup {
  id: string;
  createdAt: string;
  recordsCount: {
    users: number;
    companies: number;
    products: number;
    invoices: number;
  };
  dataPayload: string;
}

export function getBackups(): DbBackup[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("lpgportal_db_backups");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function restoreBackup(backupId: string): boolean {
  if (typeof window === "undefined") return false;
  const backups = getBackups();
  const backup = backups.find(b => b.id === backupId);
  if (!backup) return false;
  try {
    const payload = JSON.parse(backup.dataPayload);
    if (payload.users) localStorage.setItem("lpgportal_users", JSON.stringify(payload.users));
    if (payload.companies) localStorage.setItem("lpgportal_companies", JSON.stringify(payload.companies));
    if (payload.products) localStorage.setItem("lpgportal_products", JSON.stringify(payload.products));
    if (payload.invoices) localStorage.setItem("lpgportal_invoices", JSON.stringify(payload.invoices));
    if (payload.orders) localStorage.setItem("lpgportal_orders", JSON.stringify(payload.orders));
    if (payload.quote_requests) localStorage.setItem("lpgportal_quote_requests", JSON.stringify(payload.quote_requests));
    return true;
  } catch (e) {
    return false;
  }
}

export function createAutomaticBackup(): DbBackup | null {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem("lpgportal_users") ? JSON.parse(localStorage.getItem("lpgportal_users")!) : [];
  const c = localStorage.getItem("lpgportal_companies") ? JSON.parse(localStorage.getItem("lpgportal_companies")!) : [];
  const p = localStorage.getItem("lpgportal_products") ? JSON.parse(localStorage.getItem("lpgportal_products")!) : [];
  const inv = localStorage.getItem("lpgportal_invoices") ? JSON.parse(localStorage.getItem("lpgportal_invoices")!) : [];
  const ord = localStorage.getItem("lpgportal_orders") ? JSON.parse(localStorage.getItem("lpgportal_orders")!) : [];
  const qr = localStorage.getItem("lpgportal_quote_requests") ? JSON.parse(localStorage.getItem("lpgportal_quote_requests")!) : [];
  
  const payload = {
    users: u,
    companies: c,
    products: p,
    invoices: inv,
    orders: ord,
    quote_requests: qr
  };

  const backups = getBackups();
  const newBackup: DbBackup = {
    id: "backup_" + Date.now(),
    createdAt: new Date().toISOString(),
    recordsCount: {
      users: u.length,
      companies: c.length,
      products: p.length,
      invoices: inv.length
    },
    dataPayload: JSON.stringify(payload)
  };

  const updatedBackups = [newBackup, ...backups].slice(0, 10);
  localStorage.setItem("lpgportal_db_backups", JSON.stringify(updatedBackups));
  localStorage.setItem("lpgportal_last_backup_date", newBackup.createdAt);
  
  return newBackup;
}

export function getLastBackupDate(): string {
  if (typeof window === "undefined") return "—";
  return localStorage.getItem("lpgportal_last_backup_date") || "Giriş Yapıldığında Otomatik Tetiklendi";
}

export function formatDisplayName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  
  // Filter out parenthesized roles or extra notes (e.g. "(Yönetici)", "(Mühendis)")
  const nameParts = parts.filter(p => !p.startsWith("(") && !p.endsWith(")"));
  if (nameParts.length === 0) return name;
  
  let formatted = nameParts[0];
  if (nameParts.length > 1) {
    formatted += " " + nameParts.slice(1).map(p => {
      if (!p) return "";
      let firstChar = p.charAt(0);
      if (firstChar === "i" || firstChar === "İ") return "İ";
      if (firstChar === "ı" || firstChar === "I") return "I";
      return firstChar.toUpperCase();
    }).map(c => c + ".").join(" ");
  }
  return formatted;
}



