import express from "express";
import os from "os";
import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { NetgsmService } from "./src/lib/integrations/netgsm";
import { ResendService } from "./src/lib/integrations/resend";
import { R2StorageService } from "./src/lib/integrations/r2";
import { PayTrService } from "./src/lib/integrations/paytr";
import { SmsAdapterFactory, loadSmsConfig } from "./src/lib/integrations/smsAdapter";
import { EmailAdapterFactory, loadEmailConfig } from "./src/lib/integrations/emailAdapter";
import { PaymentAdapterFactory, loadPaymentConfig } from "./src/lib/integrations/paymentAdapter";
import { verifySession, isPotentialSqlInjection, hashPassword } from "./src/lib/security";

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ----------------------------------------------------
// DATABASE ALTYAPISI & VERİ BÜTÜNLÜĞÜ (PRISMA + JSON FALLBACK)
// ----------------------------------------------------
const prisma = new PrismaClient();
let useFallback = true;
const FALLBACK_DB_PATH = path.join(process.cwd(), "prisma", "fallback_db.json");
let fallbackDbCache: any = null;
let dbVersion = Date.now().toString();

function readFallbackDb(): any {
  if (fallbackDbCache) return fallbackDbCache;
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    seedFallbackDb();
  }
  try {
    const data = fs.readFileSync(FALLBACK_DB_PATH, "utf8");
    fallbackDbCache = JSON.parse(data);
    return fallbackDbCache;
  } catch (e) {
    console.error("Error reading fallback JSON database. Re-seeding.", e);
    seedFallbackDb();
    fallbackDbCache = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
    return fallbackDbCache;
  }
}

function writeFallbackDb(data: any) {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
    fallbackDbCache = data;
    dbVersion = Date.now().toString();
  } catch (e) {
    console.error("Error writing fallback JSON database:", e);
  }
}

function seedFallbackDb() {
  const initialDb: any = {};
  
  // Seed default users (with stretched v2 hashes computed dynamically)
  initialDb["lpgportal_users"] = [
    {
      id: "user_admin",
      name: "Kerem Kar (Yönetici)",
      email: "admin@lpgportal.com",
      phone: "0555 999 8877",
      password: hashPassword("Admin34.", "admin@lpgportal.com"),
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
      password: hashPassword("Kit34.", "kit@lpgportal.com"),
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
      password: hashPassword("Servis34.", "servis@lpgportal.com"),
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

  initialDb["lpgportal_home_reviews"] = [
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

  initialDb["lpgportal_free_promo_codes"] = [
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

  initialDb["lpgportal_prices"] = {
    vehicle_owner: 500,
    engineer: 1000,
    dealer: 1750,
    manufacturer: 5000,
  };

  const otherKeys = [
    "lpgportal_invoices",
    "lpgportal_companies",
    "lpgportal_products",
    "lpgportal_orders",
    "lpgportal_news_db",
    "lpgportal_bulletins_db",
    "lpgportal_user_contents_db",
    "lpgportal_writer_notifications",
    "lpgportal_expert_profiles",
    "lpgportal_expert_profiles_db",
    "lpgportal_fault_requests",
    "lpgportal_tech_solutions",
    "lpgportal_contact_requests",
    "lpgportal_notification_logs",
    "lpgportal_sent_sms_logs",
    "lpgportal_sent_email_logs",
    "lpgportal_paytr_transactions",
    "lpgportal_central_notifications",
    "lpgportal_sent_notification_logs",
    "lpgportal_favorites",
    "lpgportal_user_certificates",
    "lpgportal_jobs",
    "lpgportal_videos",
    "lpgportal_questions",
    "lpgportal_podcasts",
    "lpgportal_quote_requests",
    "lpgportal_quote_audit_logs",
    "lpgportal_quote_notifications",
    "lpgportal_used_coupons",
    "lpgportal_manual_notifications",
    "lpgportal_system_logs",
    "lpgportal_ad_inquiries",
    "lpgportal_ad_notifications",
    "lpgportal_contact_config",
    "lpgportal_contact_messages",
    "lpgportal_contact_notifications",
    "lpgportal_calibration_library_db",
    "lpgportal_download_logs_db",
    "lpgportal_db_backups",
    "lpgportal_pricing_data",
    "lpgportal_feedback_requests"
  ];
  for (const k of otherKeys) {
    initialDb[k] = [];
  }

  initialDb["lpgportal_ads_db"] = [
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

  writeFallbackDb(initialDb);
  console.log("Seeded fallback database with default entries.");
}

async function initDatabase() {
  const dbFolder = path.join(process.cwd(), "prisma");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("username:password")) {
    console.log("DATABASE_URL is not configured or placeholder.");
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL ERROR: DATABASE_URL is missing or invalid. JSON fallback database is DISABLED in production mode!");
      useFallback = false;
      return;
    }
    console.log("Switching to JSON fallback database.");
    useFallback = true;
    checkAndSeedFallback();
    validateAndFixDataIntegrity();
    await translateExistingDatabaseRecords();
    return;
  }
  try {
    await prisma.$connect();
    console.log("Successfully connected to PostgreSQL via Prisma Client.");
    useFallback = false;

    // Seed default users if PostgreSQL is empty
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log("PostgreSQL database is empty. Seeding default users...");
        let fallbackDb: any = {};
        try {
          fallbackDb = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
        } catch (e) {
          console.warn("Failed to read fallback_db.json for seeding:", e);
        }
        const defaultUsers = fallbackDb["lpgportal_users"] || [
          {
            id: "user_admin",
            name: "Kerem Kar (Yönetici)",
            email: "admin@lpgportal.com",
            phone: "0555 999 8877",
            password: hashPassword("Admin34.", "admin@lpgportal.com"),
            role: "admin",
            membership_status: "Aktif"
          }
        ];

        for (const u of defaultUsers) {
          const statusMap: any = {
            "Süresi Dolmuş": "SuresiDolmus",
            "Askıya Alındı": "AskiyaAlindi",
            "Onay Bekliyor": "OnayBekliyor"
          };
          const dbStatus = statusMap[u.membership_status] || u.membership_status || "Aktif";
          await prisma.user.create({
            data: {
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              password: u.password,
              role: u.role,
              membershipType: u.membership_type || "Ziyaretçi",
              membershipFee: Number(u.membership_fee || 0),
              membershipStart: new Date(u.membership_start || Date.now()),
              membershipEnd: new Date(u.membership_end || Date.now()),
              membershipStatus: dbStatus,
              companyName: u.company_name,
              authorizedName: u.authorized_name,
              taxInfo: u.tax_info,
              website: u.website,
              city: u.city,
              district: u.district,
              expertise: u.expertise,
              brandName: u.brandName || u.brand_name,
              authorizedPerson: u.authorizedPerson || u.authorized_person,
              productCategories: u.productCategories || u.product_categories,
              workingBrands: u.working_brands || [],
              kvkkApproved: !!u.kvkk_approved,
              privacyPolicyApproved: !!u.privacy_policy_approved,
              termsApproved: !!u.terms_approved,
              marketingApproved: !!u.marketing_approved,
              logoUrl: u.logo_url,
              noLogo: !!u.no_logo,
              logoType: u.logo_type || "auto",
              activeSessionId: u.active_session_id,
              lastLoginIp: u.last_login_ip,
              lastLoginDevice: u.last_login_device
            }
          });
        }
        console.log("PostgreSQL default users seeded successfully.");
      }
    } catch (seedErr) {
      console.error("Failed to check/seed PostgreSQL users:", seedErr);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL ERROR: PostgreSQL connection failed! JSON fallback database is DISABLED in production mode!", err);
      useFallback = false;
    } else {
      console.error("PostgreSQL connection failed. Using JSON fallback database.", err);
      useFallback = true;
      checkAndSeedFallback();
    }
  }
  validateAndFixDataIntegrity();
  await translateExistingDatabaseRecords();
}

function checkAndSeedFallback() {
  if (!fs.existsSync(FALLBACK_DB_PATH)) {
    seedFallbackDb();
  } else {
    try {
      const data = fs.readFileSync(FALLBACK_DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      if (!parsed || Object.keys(parsed).length === 0) {
        seedFallbackDb();
      }
    } catch (e) {
      seedFallbackDb();
    }
  }
}

function validateAndFixDataIntegrity() {
  console.log("[Data Integrity Check] Scanning database relations...");
  if (useFallback) {
    let db: any = {};
    try {
      db = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
    } catch (e) {
      return;
    }

    const users = db["lpgportal_users"] || [];
    const companies = db["lpgportal_companies"] || [];
    const products = db["lpgportal_products"] || [];
    const orders = db["lpgportal_orders"] || [];
    const invoices = db["lpgportal_invoices"] || [];
    const supportTickets = db["lpgportal_fault_requests"] || [];
    const expertProfiles = db["lpgportal_expert_profiles"] || [];

    let fixedCount = 0;

    // 1. Company - User relation: owner_id must point to existing user
    const validUserIds = new Set(users.map((u: any) => u.id));
    const cleanedCompanies = companies.map((c: any) => {
      if (c.owner_id && !validUserIds.has(c.owner_id)) {
        console.warn(`[Data Integrity] Orphaned company owner detected: ${c.owner_id} for company ${c.id}. Clearing owner_id.`);
        fixedCount++;
        return { ...c, owner_id: null };
      }
      return c;
    });

    // 2. Product - User relation: seller_id must point to existing user
    const cleanedProducts = products.filter((p: any) => {
      if (p.seller_id && !validUserIds.has(p.seller_id)) {
        console.warn(`[Data Integrity] Orphaned product seller detected: ${p.seller_id} for product ${p.id}. Deleting product.`);
        fixedCount++;
        return false;
      }
      return true;
    });

    // 3. Order - User & Product relation: buyerId, sellerId, productId must exist
    const validProductIds = new Set(cleanedProducts.map((p: any) => p.id));
    const cleanedOrders = orders.filter((o: any) => {
      if (!validUserIds.has(o.buyerId) || !validUserIds.has(o.sellerId) || !validProductIds.has(o.productId)) {
        console.warn(`[Data Integrity] Orphaned order relation detected: buyer ${o.buyerId}, seller ${o.sellerId}, product ${o.productId} for order ${o.id}. Deleting order.`);
        fixedCount++;
        return false;
      }
      return true;
    });

    // 4. Invoice - User relation: userId must exist
    const cleanedInvoices = invoices.filter((inv: any) => {
      if (!validUserIds.has(inv.userId)) {
        console.warn(`[Data Integrity] Orphaned invoice userId detected: ${inv.userId} for invoice ${inv.id}. Deleting invoice.`);
        fixedCount++;
        return false;
      }
      return true;
    });

    // 5. Support Ticket - User relation: creatorId must be guest or point to existing user
    const cleanedTickets = supportTickets.map((t: any) => {
      if (t.creatorId && t.creatorId !== "guest" && !validUserIds.has(t.creatorId)) {
        console.warn(`[Data Integrity] Orphaned ticket creator detected: ${t.creatorId} for ticket ${t.id}. Changing to guest.`);
        fixedCount++;
        return { ...t, creatorId: "guest" };
      }
      return t;
    });

    // 6. Expert Profile - User relation: userId must exist
    const cleanedExpertProfiles = expertProfiles.filter((ep: any) => {
      if (!validUserIds.has(ep.userId)) {
        console.warn(`[Data Integrity] Orphaned expert profile userId detected: ${ep.userId} for expert ${ep.id}. Deleting expert profile.`);
        fixedCount++;
        return false;
      }
      return true;
    });
    // Ensure all configuration and template keys exist
    if (!db["lpgportal_sms_config"]) {
      db["lpgportal_sms_config"] = { provider: "ProviderA", apiUser: "", apiPassword: "", apiKey: "", header: "LPGPORTAL" };
      fixedCount++;
    }
    if (!db["lpgportal_email_config"]) {
      db["lpgportal_email_config"] = { provider: "ProviderA", apiKey: "", fromEmail: "info@lpgportal.com", fromName: "LPG PORTAL" };
      fixedCount++;
    }
    if (!db["lpgportal_payment_config"]) {
      db["lpgportal_payment_config"] = { provider: "ProviderA", apiKey: "", secretKey: "", merchantId: "", callbackUrl: "http://localhost:3000/api/payment/paytr-callback" };
      fixedCount++;
    }
    if (!db["lpgportal_sms_templates"] || db["lpgportal_sms_templates"].length === 0) {
      db["lpgportal_sms_templates"] = [
        { id: "tpl-sms-otp", name: "OTP Doğrulama Kodu", body: "LPG PORTAL: Giriş doğrulama kodunuz: {code}" },
        { id: "tpl-sms-welcome", name: "Hoş Geldiniz Bildirimi", body: "Sayın {name}, LPG PORTAL platformuna kaydınız başarıyla tamamlanmıştır." },
        { id: "tpl-sms-quote", name: "Yeni Teklif Bildirimi", body: "LPG PORTAL: {car} aracınız için yeni bir fiyat teklifi sunulmuştur. Detaylar için panele giriş yapabilirsiniz." }
      ];
      fixedCount++;
    }
    if (!db["lpgportal_email_templates"] || db["lpgportal_email_templates"].length === 0) {
      db["lpgportal_email_templates"] = [
        { id: "tpl-email-welcome", name: "Hoş Geldiniz", subject: "LPG PORTAL'a Hoş Geldiniz!", body: "Merhaba {name},\n\nLPG PORTAL ailesine katıldığınız için teşekkür ederiz." },
        { id: "tpl-email-reset", name: "Şifre Sıfırlama", subject: "Şifre Sıfırlama Talebi", body: "Merhaba {name},\n\nŞifrenizi sıfırlamak için lütfen bu bağlantıyı kullanın: {link}" }
      ];
      fixedCount++;
    }

    if (fixedCount > 0) {
      db["lpgportal_companies"] = cleanedCompanies;
      db["lpgportal_products"] = cleanedProducts;
      db["lpgportal_orders"] = cleanedOrders;
      db["lpgportal_invoices"] = cleanedInvoices;
      db["lpgportal_fault_requests"] = cleanedTickets;
      db["lpgportal_expert_profiles"] = cleanedExpertProfiles;
      writeFallbackDb(db);
      console.log(`[Data Integrity Check] Automated cleanup finished. Fixed ${fixedCount} orphaned/inconsistent records.`);
    } else {
      console.log("[Data Integrity Check] Database is clean. No anomalies detected.");
    }
  } else {
    console.log("[Data Integrity Check] PostgreSQL foreign keys enforce schema integrity automatically.");
  }
}

function addServerSystemLog(actionType: string, details: string, userMailOrName?: string) {
  const now = new Date();
  const formatTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const formatDate = now.toLocaleDateString('tr-TR');
  const newLog = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    user: userMailOrName || "Sunucu/Sistem",
    date: formatDate,
    time: formatTime,
    actionType,
    details
  };
  
  if (useFallback) {
    const db = readFallbackDb();
    const logs = db["lpgportal_system_logs"] || [];
    db["lpgportal_system_logs"] = [newLog, ...logs].slice(0, 500);
    writeFallbackDb(db);
  }
}

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API Client successfully initialized.");
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined or is a placeholder. Using fallback engine for AI features.");
}

// Initialize database
initDatabase();

// ----------------------------------------------------
// LOCALIZATION & TRANSLATION ENGINE (TR / EN)
// ----------------------------------------------------

function detectLanguage(text: string): "tr" | "en" {
  if (!text || typeof text !== "string") return "tr";
  const trChars = (text.match(/[ışğçöüİŞĞÇÖÜ]/g) || []).length;
  const trWords = (text.match(/\b(ve|veya|bir|bu|için|olan|en|ile|da|de|lpg|otogaz|usta|firma|hakkında|destek|teklif|ayar|türkçe|sistem|haber|yorum|bülten|makale)\b/gi) || []).length;
  const enWords = (text.match(/\b(the|and|or|a|an|of|for|with|about|support|quote|service|company|news|bulletin|system|english|comment|settings|article)\b/gi) || []).length;
  if (trChars > 0 || trWords > enWords) {
    return "tr";
  }
  if (enWords > trWords) {
    return "en";
  }
  return "tr";
}

function getOfflineTranslation(text: string, targetLang: "tr" | "en"): string {
  if (!text) return "";
  const clean = text.trim();
  const trToEn: Record<string, string> = {
    "Ana Sayfa": "Home",
    "LPG Uyumluluk": "LPG Compatibility",
    "Firma Rehberi": "Company Directory",
    "Teklif Al": "Get Quote",
    "Destek Merkezi": "Support Center",
    "İletişim": "Contact",
    "Haber & Bülten": "News & Bulletins",
    "Eğitim & Kariyer": "Training & Career",
    "Market": "Marketplace",
    "Hesabım": "My Account",
    "Çıkış Yap": "Sign Out",
    "Ziyaretçi": "Visitor",
    "Araç Sahibi": "Vehicle Owner",
    "Firma": "Dealer",
    "Uzman": "Engineer",
    "Yönetici": "Admin",
    "Aktif": "Active",
    "Pasif": "Passive",
    "Onay Bekliyor": "Pending Approval",
    "Yayınlandı": "Published",
    "Reddedildi": "Rejected",
    "Onaylandı": "Approved",
    "Yeni Talep": "New Ticket",
    "İnceleniyor": "Under Review",
    "Çözüm Gönderildi": "Solution Sent",
    "Kullanıcı Onayladı": "User Approved",
    "Tamamlandı": "Completed",
    "Kapatıldı": "Closed"
  };
  const enToTr: Record<string, string> = {};
  for (const [k, v] of Object.entries(trToEn)) {
    enToTr[v.toLowerCase()] = k;
  }
  if (targetLang === "en") {
    if (trToEn[clean]) return trToEn[clean];
    return `[EN] ${text}`;
  } else {
    if (enToTr[clean.toLowerCase()]) return enToTr[clean.toLowerCase()];
    return `[TR] ${text}`;
  }
}

async function translateText(text: string, targetLang: "tr" | "en"): Promise<string> {
  if (!text || typeof text !== "string" || text.trim() === "") return "";
  if (!ai) {
    return getOfflineTranslation(text, targetLang);
  }
  try {
    const prompt = `You are an expert translator. Translate the following text into ${targetLang === "tr" ? "Turkish" : "English"}. Do not add any explanation, meta-commentary, or markdown blocks around the response; return ONLY the raw translated text. Keep all html tags, markdown format, and technical terms intact.\n\nText to translate:\n${text}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });
    const resultText = response.text || "";
    return resultText.trim() || getOfflineTranslation(text, targetLang);
  } catch (error) {
    console.error("Gemini translation call failed, using offline fallback:", error);
    return getOfflineTranslation(text, targetLang);
  }
}

async function translateFieldVal(val: any, targetLang: "tr" | "en"): Promise<any> {
  if (typeof val === "string") {
    return await translateText(val, targetLang);
  } else if (Array.isArray(val)) {
    const res = [];
    for (const x of val) {
      if (typeof x === "string") {
        res.push(await translateText(x, targetLang));
      } else {
        res.push(x);
      }
    }
    return res;
  }
  return val;
}

function detectLanguageOfVal(val: any): "tr" | "en" {
  if (typeof val === "string") {
    return detectLanguage(val);
  } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
    return detectLanguage(val[0]);
  }
  return "tr";
}

async function processTranslationsForSave(key: string, value: any): Promise<any> {
  if (!Array.isArray(value)) return value;
  
  let translatableFields: string[] = [];
  if (key === "lpgportal_user_contents_db" || key === "lpgportal_news_db" || key === "lpgportal_bulletins_db") {
    translatableFields = ["title", "summary", "content"];
  } else if (key === "lpgportal_companies") {
    translatableFields = ["description", "company_name"];
  } else if (key === "lpgportal_home_reviews") {
    translatableFields = ["title", "content"];
  } else if (key === "lpgportal_fault_requests") {
    translatableFields = ["title", "description"];
  } else if (key === "lpgportal_tech_solutions") {
    translatableFields = ["subject", "solution"];
  } else if (key === "lpgportal_expert_profiles") {
    translatableFields = ["expertise", "about"];
  } else if (key === "lpgportal_quote_requests") {
    translatableFields = ["notes", "admin_reply", "admin_notes"];
  } else if (key === "lpgportal_podcasts") {
    translatableFields = ["title", "description"];
  } else if (key === "lpgportal_questions") {
    translatableFields = ["question_text", "options"];
  } else if (key === "lpgportal_videos") {
    translatableFields = ["title", "description"];
  } else if (key === "lpgportal_writer_notifications" || key === "lpgportal_central_notifications" || key === "lpgportal_notification_logs") {
    translatableFields = ["title", "message"];
  } else if (key === "lpgportal_feedback_requests") {
    translatableFields = ["title", "description", "adminReply"];
  }
  
  if (translatableFields.length === 0) return value;
  
  const oldDb = readFallbackDb();
  const oldList = oldDb[key] || [];
  
  const updatedValue = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || !item.id) {
      updatedValue.push(item);
      continue;
    }
    
    const oldItem = oldList.find((x: any) => x.id === item.id);
    let newItem = { ...item };
    
    for (const field of translatableFields) {
      const val = item[field];
      const valTr = item[`${field}_tr`] !== undefined ? item[`${field}_tr`] : item[field];
      const valEn = item[`${field}_en`] !== undefined ? item[`${field}_en`] : item[field];
      
      const oldValTr = oldItem ? oldItem[`${field}_tr`] : undefined;
      const oldValEn = oldItem ? oldItem[`${field}_en`] : undefined;
      
      let finalTr = valTr;
      let finalEn = valEn;
      
      const trChanged = oldItem && JSON.stringify(valTr) !== JSON.stringify(oldValTr);
      const enChanged = oldItem && JSON.stringify(valEn) !== JSON.stringify(oldValEn);
      const isNew = !oldItem;
      
      if (isNew) {
        if (valTr && !valEn) {
          finalTr = valTr;
          finalEn = await translateFieldVal(valTr, "en");
        } else if (valEn && !valTr) {
          finalEn = valEn;
          finalTr = await translateFieldVal(valEn, "tr");
        } else if (val && !valTr && !valEn) {
          const detected = detectLanguageOfVal(val);
          if (detected === "tr") {
            finalTr = val;
            finalEn = await translateFieldVal(val, "en");
          } else {
            finalEn = val;
            finalTr = await translateFieldVal(val, "tr");
          }
        }
      } else {
        if (trChanged && !enChanged) {
          finalEn = await translateFieldVal(valTr, "en");
        } else if (enChanged && !trChanged) {
          finalTr = await translateFieldVal(valEn, "tr");
        } else if (!valTr && !valEn && val) {
          const detected = detectLanguageOfVal(val);
          if (detected === "tr") {
            finalTr = val;
            finalEn = await translateFieldVal(val, "en");
          } else {
            finalEn = val;
            finalTr = await translateFieldVal(val, "tr");
          }
        }
      }
      
      newItem[`${field}_tr`] = finalTr;
      newItem[`${field}_en`] = finalEn;
      newItem[field] = finalTr || val;
    }
    
    // Nested reviews in companies
    if (key === "lpgportal_companies" && Array.isArray(item.reviews)) {
      const updatedReviews = [];
      const oldReviews = oldItem ? oldItem.reviews || [] : [];
      for (const rev of item.reviews) {
        const oldRev = oldReviews.find((r: any) => r.id === rev.id);
        let newRev = { ...rev };
        const valComment = rev.comment;
        const valCommentTr = rev.comment_tr !== undefined ? rev.comment_tr : rev.comment;
        const valCommentEn = rev.comment_en !== undefined ? rev.comment_en : rev.comment;
        
        const oldCommentTr = oldRev ? oldRev.comment_tr : undefined;
        const oldCommentEn = oldRev ? oldRev.comment_en : undefined;
        
        let finalCommentTr = valCommentTr;
        let finalCommentEn = valCommentEn;
        
        const commTrChanged = oldRev && valCommentTr !== oldCommentTr;
        const commEnChanged = oldRev && valCommentEn !== oldCommentEn;
        const commIsNew = !oldRev;
        
        if (commIsNew) {
          if (valCommentTr && !valCommentEn) {
            finalCommentEn = await translateText(valCommentTr, "en");
          } else if (valCommentEn && !valCommentTr) {
            finalCommentTr = await translateText(valCommentEn, "tr");
          } else if (valComment) {
            const det = detectLanguage(valComment);
            if (det === "tr") {
              finalCommentTr = valComment;
              finalCommentEn = await translateText(valComment, "en");
            } else {
              finalCommentEn = valComment;
              finalCommentTr = await translateText(valComment, "tr");
            }
          }
        } else {
          if (commTrChanged && !commEnChanged) {
            finalCommentEn = await translateText(valCommentTr, "en");
          } else if (commEnChanged && !commTrChanged) {
            finalCommentTr = await translateText(valCommentEn, "tr");
          }
        }
        newRev.comment_tr = finalCommentTr;
        newRev.comment_en = finalCommentEn;
        newRev.comment = finalCommentTr || valComment;
        updatedReviews.push(newRev);
      }
      newItem.reviews = updatedReviews;
    }

    // Nested comments in feedback requests
    if (key === "lpgportal_feedback_requests" && Array.isArray(item.comments)) {
      const updatedComments = [];
      const oldComments = oldItem ? oldItem.comments || [] : [];
      for (const comm of item.comments) {
        const oldComm = oldComments.find((c: any) => c.id === comm.id);
        let newComm = { ...comm };
        const valMsg = comm.message;
        const valMsgTr = comm.message_tr !== undefined ? comm.message_tr : comm.message;
        const valMsgEn = comm.message_en !== undefined ? comm.message_en : comm.message;
        
        const oldMsgTr = oldComm ? oldComm.message_tr : undefined;
        const oldMsgEn = oldComm ? oldComm.message_en : undefined;
        
        let finalMsgTr = valMsgTr;
        let finalMsgEn = valMsgEn;
        
        const commTrChanged = oldComm && valMsgTr !== oldMsgTr;
        const commEnChanged = oldComm && valMsgEn !== oldMsgEn;
        const commIsNew = !oldComm;
        
        if (commIsNew) {
          if (valMsgTr && !valMsgEn) {
            finalMsgEn = await translateText(valMsgTr, "en");
          } else if (valMsgEn && !valMsgTr) {
            finalMsgTr = await translateText(valMsgEn, "tr");
          } else if (valMsg) {
            const detected = detectLanguage(valMsg);
            if (detected === "tr") {
              finalMsgTr = valMsg;
              finalMsgEn = await translateText(valMsg, "en");
            } else {
              finalMsgEn = valMsg;
              finalMsgTr = await translateText(valMsg, "tr");
            }
          }
        } else {
          if (commTrChanged && !commEnChanged) {
            finalMsgEn = await translateText(valMsgTr, "en");
          } else if (commEnChanged && !commTrChanged) {
            finalMsgTr = await translateText(valMsgEn, "tr");
          }
        }
        newComm.message_tr = finalMsgTr;
        newComm.message_en = finalMsgEn;
        newComm.message = finalMsgTr || valMsg;
        updatedComments.push(newComm);
      }
      newItem.comments = updatedComments;
    }
    
    // Nested offers in quote requests
    if (key === "lpgportal_quote_requests" && Array.isArray(item.offers)) {
      const updatedOffers = [];
      const oldOffers = oldItem ? oldItem.offers || [] : [];
      for (const off of item.offers) {
        const oldOff = oldOffers.find((o: any) => o.id === off.id);
        let newOff = { ...off };
        
        const valNotes = off.notes;
        const valNotesTr = off.notes_tr !== undefined ? off.notes_tr : off.notes;
        const valNotesEn = off.notes_en !== undefined ? off.notes_en : off.notes;
        
        let finalNotesTr = valNotesTr;
        let finalNotesEn = valNotesEn;
        
        const notesTrChanged = oldOff && valNotesTr !== oldOff.notes_tr;
        const notesEnChanged = oldOff && valNotesEn !== oldOff.notes_en;
        const notesIsNew = !oldOff;
        
        if (notesIsNew) {
          if (valNotesTr && !valNotesEn) {
            finalNotesEn = await translateText(valNotesTr, "en");
          } else if (valNotesEn && !valNotesTr) {
            finalNotesTr = await translateText(valNotesEn, "tr");
          } else if (valNotes) {
            const det = detectLanguage(valNotes);
            if (det === "tr") {
              finalNotesTr = valNotes;
              finalNotesEn = await translateText(valNotes, "en");
            } else {
              finalNotesEn = valNotes;
              finalNotesTr = await translateText(valNotes, "tr");
            }
          }
        } else {
          if (notesTrChanged && !notesEnChanged) {
            finalNotesEn = await translateText(valNotesTr, "en");
          } else if (notesEnChanged && !notesTrChanged) {
            finalNotesTr = await translateText(valNotesEn, "tr");
          }
        }
        newOff.notes_tr = finalNotesTr;
        newOff.notes_en = finalNotesEn;
        newOff.notes = finalNotesTr || valNotes;
        updatedOffers.push(newOff);
      }
      newItem.offers = updatedOffers;
    }
    
    updatedValue.push(newItem);
  }
  
  return updatedValue;
}

async function translateExistingDatabaseRecords() {
  console.log("[Localization Scan] Scanning database for untranslated records...");
  
  let db: any = {};
  try {
    db = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
  } catch (e) {
    console.error("Failed to read fallback DB for localization check:", e);
    return;
  }
  
  let updatedCount = 0;
  const keysToScan = [
    { key: "lpgportal_user_contents_db", fields: ["title", "summary", "content"] },
    { key: "lpgportal_news_db", fields: ["title", "summary", "content"] },
    { key: "lpgportal_bulletins_db", fields: ["title", "summary", "content"] },
    { key: "lpgportal_companies", fields: ["description", "company_name"] },
    { key: "lpgportal_home_reviews", fields: ["title", "content"] },
    { key: "lpgportal_fault_requests", fields: ["title", "description"] },
    { key: "lpgportal_tech_solutions", fields: ["subject", "solution"] },
    { key: "lpgportal_expert_profiles", fields: ["expertise", "about"] },
    { key: "lpgportal_quote_requests", fields: ["notes", "admin_reply", "admin_notes"] },
    { key: "lpgportal_podcasts", fields: ["title", "description"] },
    { key: "lpgportal_questions", fields: ["question_text", "options"] },
    { key: "lpgportal_videos", fields: ["title", "description"] },
    { key: "lpgportal_writer_notifications", fields: ["title", "message"] },
    { key: "lpgportal_central_notifications", fields: ["title", "message"] },
    { key: "lpgportal_notification_logs", fields: ["title", "message"] },
    { key: "lpgportal_manual_notifications", fields: ["title", "message"] },
    { key: "lpgportal_feedback_requests", fields: ["title", "description", "adminReply"] }
  ];
  
  for (const scan of keysToScan) {
    const list = db[scan.key];
    if (Array.isArray(list) && list.length > 0) {
      let keyUpdated = false;
      const newList = [];
      for (const item of list) {
        if (!item || typeof item !== "object" || !item.id) {
          newList.push(item);
          continue;
        }
        
        let newItem = { ...item };
        let itemUpdated = false;
        
        for (const field of scan.fields) {
          const val = item[field];
          const fieldTr = `${field}_tr`;
          const fieldEn = `${field}_en`;
          
          if (val !== undefined) {
            if (item[fieldTr] === undefined || item[fieldEn] === undefined) {
              const detected = detectLanguageOfVal(val);
              if (item[fieldTr] === undefined) {
                newItem[fieldTr] = detected === "tr" ? val : await translateFieldVal(val, "tr");
              }
              if (item[fieldEn] === undefined) {
                newItem[fieldEn] = detected === "en" ? val : await translateFieldVal(val, "en");
              }
              itemUpdated = true;
            }
          }
        }
        
        // Nested reviews in companies
        if (scan.key === "lpgportal_companies" && Array.isArray(item.reviews)) {
          const newReviews = [];
          for (const rev of item.reviews) {
            let newRev = { ...rev };
            if (rev.comment !== undefined && (rev.comment_tr === undefined || rev.comment_en === undefined)) {
              const det = detectLanguage(rev.comment);
              if (rev.comment_tr === undefined) {
                newRev.comment_tr = det === "tr" ? rev.comment : await translateText(rev.comment, "tr");
              }
              if (rev.comment_en === undefined) {
                newRev.comment_en = det === "en" ? rev.comment : await translateText(rev.comment, "en");
              }
              itemUpdated = true;
            }
            newReviews.push(newRev);
          }
          newItem.reviews = newReviews;
        }
        
        // Nested offers in quote requests
        if (scan.key === "lpgportal_quote_requests" && Array.isArray(item.offers)) {
          const newOffers = [];
          for (const off of item.offers) {
            let newOff = { ...off };
            if (off.notes !== undefined && (off.notes_tr === undefined || off.notes_en === undefined)) {
              const det = detectLanguage(off.notes);
              if (off.notes_tr === undefined) {
                newOff.notes_tr = det === "tr" ? off.notes : await translateText(off.notes, "tr");
              }
              if (off.notes_en === undefined) {
                newOff.notes_en = det === "en" ? off.notes : await translateText(off.notes, "en");
              }
              itemUpdated = true;
            }
            newOffers.push(newOff);
          }
          newItem.offers = newOffers;
        }
        
        newList.push(newItem);
        if (itemUpdated) {
          keyUpdated = true;
          updatedCount++;
        }
      }
      if (keyUpdated) {
        db[scan.key] = newList;
      }
    }
  }
  
  if (updatedCount > 0) {
    writeFallbackDb(db);
    console.log(`[Localization Scan] Successfully translated ${updatedCount} existing records and updated fallback database.`);
  } else {
    console.log("[Localization Scan] No untranslated records found. Existing content database is fully localized.");
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// In-Memory Rate Limiter to protect expensive AI routes from abuse (DoW Protection)
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 25; // 25 requests/minute

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Read real IP from Cloudflare header or default
  const ip = (req.headers["cf-connecting-ip"] as string) || 
             (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || 
             req.ip || 
             req.socket.remoteAddress || 
             "unknown";
             
  const now = Date.now();

  // Exclude database sync endpoints from rate limiting to prevent client DB bridge block
  if (
    req.path === "/db/get-all" || req.path === "/api/db/get-all" ||
    req.path === "/db/save" || req.path === "/api/db/save"
  ) {
    return next();
  }

  let record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRequestCounts.set(ip, record);
  } else {
    record.count++;
  }

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[Rate Limit Exceeded] Blocked request from IP: ${ip} to path: ${req.path}`);
    return res.status(429).json({ error: "Çok fazla istek gönderildi. Lütfen bir dakika bekleyin." });
  }
  next();
};

// CSRF Protection Middleware
const csrfProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Exclude PayTR webhook callbacks from CSRF
  if (req.path === "/payment/paytr-callback" || req.path === "/api/payment/paytr-callback") {
    return next();
  }

  const secureHeader = req.headers["x-lpgportal-secure"];
  if (!secureHeader || secureHeader !== "true") {
    console.warn(`[CSRF Blocked] Request to ${req.path} from IP ${req.ip} is missing X-LpgPortal-Secure header.`);
    return res.status(403).json({ error: "Güvenlik Doğrulaması Başarısız (CSRF Koruması)." });
  }
  next();
};

// SQL Injection Filter Middleware
const sqlInjectionFilter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const inputsToCheck = [
    ...Object.values(req.body || {}),
    ...Object.values(req.query || {})
  ];

  for (const input of inputsToCheck) {
    if (typeof input === "string" && isPotentialSqlInjection(input)) {
      console.warn(`[SQLi Blocked] Suspicious SQL Injection pattern detected in request to ${req.path} from IP ${req.ip}`);
      return res.status(400).json({ error: "Güvenlik Uyarısı: Girişte geçersiz karakterler tespit edildi." });
    }
  }
  next();
};

// API Session Authorization Middleware
const verifyApiSession = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Exclude webhooks, DB, and session check endpoints
  if (
    req.path === "/payment/paytr-callback" || req.path === "/api/payment/paytr-callback" ||
    req.path === "/db/get-all" || req.path === "/api/db/get-all" ||
    req.path === "/db/save" || req.path === "/api/db/save" ||
    req.path.startsWith("/api/auth/session/") || req.path.startsWith("/auth/session/")
  ) {
    return next();
  }

  // Exclude public AI endpoints
  if (
    req.path === "/ai/diagnose" || req.path === "/api/ai/diagnose" || 
    req.path === "/ai/technical-assistant" || req.path === "/api/ai/technical-assistant"
  ) {
    return next();
  }

  const userId = req.headers["x-lpgportal-user-id"] as string;
  const email = req.headers["x-lpgportal-user-email"] as string;
  const role = req.headers["x-lpgportal-user-role"] as string;
  const token = req.headers["x-lpgportal-session-token"] as string;

  if (!userId || !email || !role || !token) {
    console.warn(`[Auth Blocked] Missing authorization headers for request to ${req.path} from IP ${req.ip}`);
    return res.status(401).json({ error: "Oturum doğrulaması başarısız. Lütfen giriş yapın." });
  }

  const isValid = verifySession({ id: userId, email, role }, token);
  if (!isValid) {
    console.warn(`[Auth Violation] Tampered session token detected for user ${email} from IP ${req.ip}`);
    return res.status(401).json({ error: "Oturum anahtarı geçersiz veya süresi dolmuş." });
  }

  // Role Authorization check
  if (req.path === "/ai/generate-news-bulletin" || req.path === "/api/ai/generate-news-bulletin") {
    if (role !== "admin") {
      console.warn(`[Auth Violation] Unauthorized access attempt to news generator by user ${email} (Role: ${role})`);
      return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmamaktadır." });
    }
  }

  next();
};

app.use("/api/", rateLimiter);
app.use("/api/", csrfProtection);
app.use("/api/", sqlInjectionFilter);
app.use("/api/", verifyApiSession);

/**
 * Endpoint for AI Diagnostics (Yapay Zeka Destekli Arıza Teşhisi)
 * Takes vehicle information (brand, model, engine) + symptom description
 */
app.post("/api/ai/diagnose", async (req, res) => {
  const { brand, model, year, engine, symptom } = req.body;

  if (!symptom) {
    return res.status(400).json({ error: "Lütfen bir arıza veya şikayet belirtin." });
  }

  const prompt = `Sen Türkiye'nin en büyük LPG portalı olan LPG PORTAL'ın uzman Yapay Zeka Destekli LPG Teknik Arıza Teşhis Servisisin.
Aşağıda bilgileri verilen aracın LPG sistemindeki arızasını analiz et.

Araç Bilgileri:
- Marka: ${brand || "Belirtilmedi"}
- Model: ${model || "Belirtilmedi"}
- Yıl: ${year || "Belirtilmedi"}
- Motor/Güç: ${engine || "Belirtilmedi"}
- Şikayet/Semptom: "${symptom}"

Lütfen profesyonel bir usta ve teknik mühendis diliyle, Türkçe dilinde detaylı bir teşhis raporu hazırla. Rapor şu bölümlerden oluşmalı:
1. Olası Kök Nedenler (En az 3 spesifik neden listele, örn. regülatör basınç hatası, LPG enjektör tıkanıklığı, maf sensörü, LPG filtresi tıkanıklığı vs.)
2. Risk Sınıfı (Düşük, Orta veya Yüksek olarak sınıflandırıp gerekçesini yaz)
3. Çözüm Önerileri (Adım adım ustanın ve araç sahibinin ne yapması gerektiğini açıkla)
4. Değişmesi veya Kontrol Edilmesi Gereken Parçalar
5. Teknik Servis Tavsiyesi (Yakındaki bir LPG dönüşüm servisine gitmenin neden kritik olduğunu vurgula)

Yanıtını profesyonelce biçimlendirilmiş Markdown formatında ver.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      const text = response.text || "Diagnostic analysis could not be generated.";
      return res.json({ result: text, isFallback: false });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/diagnose:", error);
      return res.json({
        result: getFallbackDiagnosis(brand, model, symptom),
        isFallback: true,
        errorMessage: error.message
      });
    }
  } else {
    // Return friendly, structured fallback response
    return res.json({
      result: getFallbackDiagnosis(brand, model, symptom),
      isFallback: true
    });
  }
});

/**
 * Endpoint for AI Technical Assistant (Yapay Zeka Teknik Asistan)
 * Custom engineered for LPG technicians, bayiler, and dealers.
 */
app.post("/api/ai/technical-assistant", async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Soru kısmı boş bırakılamaz." });
  }

  const prompt = `Sen LPG PORTAL platformunun "Yapay Zeka Teknik Asistanı"sın. Rolün; LPG montaj bayilerine, ustalara, kalibrasyon uzmanlarına ve dükkan sahiplerine kılavuzluk etmek, karmaşık teknik sorunlarda veya standart montaj kurallarında (örn. ECE R-67.01 standartları, sızdırmazlık testleri, enjektör nozul çapı hesaplama, regülatör basınç kalibrasyonu, OBD bağlantıları) onlara profesyonel dökümantasyon ve teknik destek sunmaktır.

Soru/Sorun:
"${question}"

Bağlamsal Bilgi (varsa): ${context || "Yok"}

Lütfen doğrudan teknik terimler, milimetre ölçüleri, bar basınç seviyeleri, kablo şemaları mantığı ve ECE standartlarına atıfta bulunarak tamamen teknik, profesyonel ve kılavuz niteliğinde Türkçe bir cevap hazırla. Markdown formatını kullan.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2, // lower temperature for precise technical facts
        },
      });
      return res.json({ result: response.text || "Cevap üretilemedi." });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/technical-assistant:", error);
      return res.json({
        result: getFallbackTechnicalAssistantAnswer(question),
        isFallback: true,
        errorMessage: error.message
      });
    }
  } else {
    return res.json({
      result: getFallbackTechnicalAssistantAnswer(question),
      isFallback: true
    });
  }
});

/**
 * Endpoint for AI News & Bulletin Content Generation (AI ile İçerik Oluştur)
 */
app.post("/api/ai/generate-news-bulletin", async (req, res) => {
  const { type, title, category, extraDetails } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: "Lütfen başlık ve kategori bilgilerini sağlayın." });
  }

  const prompt = `Sen Türkiye'nin en büyük otogaz platformu olan LPG PORTAL portalının profesyonel editörü ve bülten şefisin.
Aşağıdaki parametreleri kullanarak üst düzey, SEO uyumlu ve son derece bilgilendirici bir ${type === "news" ? "HABER" : "TEKNİK BÜLTEN"} içeriği üret.

Parametreler:
- Tür: ${type === "news" ? "Haber" : "Teknik Bülten"}
- Kategori: ${category}
- Başlık: "${title}"
- Ek Detaylar (Araç, Motor, LPG Markası vb.): ${extraDetails || "Belirtilmemiş"}

Senden mutlaka geçerli bir JSON objesi üretmeni istiyorum. Lütfen JSON dışında hiçbir açıklama veya metin YAZMA. Sadece ham JSON string'i döndür. JSON şeması şu şekilde olmalıdır ve anahtarlar tamamen eşleşmelidir:

{
  "title": "Üretilen makale veya bülten başlığı",
  "summary": "1-2 cümlelik dikkat çekici özet",
  "content": "Detaylı, profesyonel paragrafları, '###' alt başlıkları veya maddeleri içeren zengin makale gövdesi (en az 300 kelime Türkçe)",
  "seoTitle": "Etkileyici SEO Başlığı (maksimum 60 karakter)",
  "seoDescription": "Arama motorları için açıklama metni (maksimum 160 karakter)",
  "seoKeywords": ["anahtar", "kelimeler", "lpg", "otogaz"],
  "tags": ["etiket1", "etiket2"],
  "socialShareText": "Facebook/Twitter/LinkedIn için paylaşım ve özet tanıtım metni",
  "trouble": "${type !== "news" && category === "Arıza ve Çözüm Merkezi" ? "Arıza şikayeti tanımı" : ""}",
  "possibleCauses": ${type !== "news" && category === "Arıza ve Çözüm Merkezi" ? '["Olası neden 1", "Olası neden 2"]' : "[]"},
  "technicalSolution": "${type !== "news" && category === "Arıza ve Çözüm Merkezi" ? "Adım adım teknik çözüm prosedürü" : ""}",
  "compatibilityStatus": "${type !== "news" && category === "Motor Bazlı Teknik Rehberler" ? "Uyum seviyesi (örn. %100 uyumlu, çelik subap gerekir vb.)" : ""}",
  "knownIssues": "${type !== "news" && category === "Motor Bazlı Teknik Rehberler" ? "Bilinen olası lpg kaynaklı sorunlar" : ""}",
  "recommendedKits": ${type !== "news" ? '["Örnek Kit 1 OBD", "Örnek Kit 2 DI"]' : '["Orijinal Atiker", "BRC Comfort"]'},
  "nozzleRecommendation": "${type !== "news" && category === "Motor Bazlı Teknik Rehberler" ? "Nozul çapı önerisi (örn: 2.2 mm)" : ""}",
  "regulatorRecommendation": "${type !== "news" && category === "Motor Bazlı Teknik Rehberler" ? "Regülatör basınç seviyesi önerisi (örn: 1.1 bar)" : ""}",
  "calibrationNotes": "${type !== "news" && category === "Motor Bazlı Teknik Rehberler" ? "Ustalara yönelik ince ayar ve LTFT/STFT kalibrasyon tüyoları" : ""}",
  "vehicleBrand": "${category === "Yeni Araçlar ve LPG Uyumluluğu" ? "Araç Markası" : ""}",
  "vehicleModel": "${category === "Yeni Araçlar ve LPG Uyumluluğu" ? "Araç Modeli" : ""}",
  "motorType": "${category === "Yeni Araçlar ve LPG Uyumluluğu" ? "Motor Tipi (örn: 1.0 TCe)" : ""}",
  "injectionSystem": "${category === "Yeni Araçlar ve LPG Uyumluluğu" ? "Enjeksiyon Tipi (Direkt, Sıralı vb.)" : ""}",
  "expertOpinion": "${category === "Yeni Araçlar ve LPG Uyumluluğu" ? "Mühendislerin ve tecrübeli ustaların bu araçla ilgili nihai tavsiye görüşü" : ""}"
}

Lütfen tamamen Türkçe dilinde, Türkçe teknik terminolojiye (LTFT, STFT , enjektör ms, sızdırmazlık, ECE R-67.01 vb.) uygun olarak doldur. JSON geçerliliğini bozacak tırnak işaretlerinden kaçın veya onları kaçış karakteriyle koru.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text.trim());
      return res.json({ success: true, data: parsedData, isFallback: false });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ai/generate-news-bulletin:", error);
      const fallbackData = generateFallbackContent(type, title, category, extraDetails);
      return res.json({ success: true, data: fallbackData, isFallback: true, errorMessage: error.message });
    }
  } else {
    const fallbackData = generateFallbackContent(type, title, category, extraDetails);
    return res.json({ success: true, data: fallbackData, isFallback: true });
  }
});

// Helper function to synthesize rich fallback content offline
function generateFallbackContent(type: string, title: string, category: string, extra: string) {
  const currentYear = new Date().getFullYear();
  const dateStr = `${currentYear}-06-09`;

  const basicSummary = `"${title}" başlığı altındaki gelişmeler ve teknik detaylar, LPG PORTAL editör ekibi tarafından detaylıca incelendi.`;
  
  let basicContent = `### ${title}\n\nLPG sektöründeki son gelişmeler ve regülasyonlar çerçevesinde, "${title}" uzman mühendislerimizce masaya yatırıldı. Sektörümüzün geleceği, alternatif temiz yakıt teknolojilerinin yaygınlaşması ve TSE tescilli dönüşüm standartlarının artması ile doğrudan ilişkilidir.\n\n### Detaylı Değerlendirme\n\nİlgili konuda yapılan testlerde ve saha çalışmalarında, özellikle montaj hassasiyetinin, enjektör nozul boru boylarının ve doğru kalibrasyonun hayati rol oynadığı saptanmıştır. Mühendis ekibimizin montaj atölyelerinden topladığı verilere göre, bu yenilik otogaz dönüşüm süreçlerinde önemli bir verimlilik artışı sağlayacaktır.\n\n### Dikkat Edilmesi Gereken Hususlar\n\n*   **Kaliteli Malzeme Kullanımı:** Standart dışı malzemeler ve sızdırmazlık zafiyetleri maliyet tasarrufunu azaltır.\n*   **Garantili Sistem Tercihi:** Dönüşüm ve yedek parça değişimlerinde fatura ve TSE/HYB evraklarının tescili şarttır.\n*   **Yol Testi & ECU Ayarı:** OBD'li kitlerin veri akış hızı düzenli olarak rölantide ve yük altında trim takibiyle kalibre edilmelidir.`;

  let trouble = "";
  let possibleCauses: string[] = [];
  let technicalSolution = "";
  let compatibilityStatus = "";
  let knownIssues = "";
  let nozzleRecommendation = "";
  let regulatorRecommendation = "";
  let calibrationNotes = "";
  let vehicleBrand = "";
  let vehicleModel = "";
  let motorType = "";
  let injectionSystem = "";
  let expertOpinion = "";
  const recommendedKits = ["Prins VSI-3", "Lovato C-OBD II", "Atiker Grand OBD"];

  if (category === "Arıza ve Çözüm Merkezi") {
    trouble = title;
    possibleCauses = [
      "LPG regülatör diyaframının sızdırmazlık veya basınç kaçırma zafiyeti",
      "Gaz fazı ve sıvı fazı filtrelerinin uzun süreli kullanım sonucu tıkanması",
      "MAP sensörünün sinyal hattındaki parazitlenme veya soket temassızlığı"
    ];
    technicalSolution = "İlk etapta gaz filtresi sökülerek partikül seviyesi kontrol edilmeli, ardından bilgisayarla ECU'ya bağlanıp MAP basınç eğrisi (1.0 bar referansında) incelenmelidir. Regülatör diyafram basıncı stabil değilse diyafram seti veya regülatör komple yenilenmelidir.";
  } else if (category === "Motor Bazlı Teknik Rehberler") {
    compatibilityStatus = "%100 Tam Uyumlu (Subap yağlama seti tavsiye edilir)";
    knownIssues = "Yüksek devirlerde subap aşınması riskini azaltmak amacıyla yakıt haritası devir sınırı optimize edilmelidir.";
    nozzleRecommendation = "2.2 mm Pirinç Nozul";
    regulatorRecommendation = "1.15 Bar Sıralı Basınç";
    calibrationNotes = "Rölantide gaz enjeksiyon süresi 3.8 ms ile 4.2 ms arasına çekilmeli, LTFT trim düzeltmesi maksimum %3 sapma gösterecek şekilde yol ayarı tamamlanmalıdır.";
  } else if (category === "Yeni Araçlar ve LPG Uyumluluğu") {
    vehicleBrand = "Chery / Toyota";
    vehicleModel = "Omoda 5 / Corolla";
    motorType = "1.5 T-GDI / 1.5 Dynamic Force";
    injectionSystem = "Direkt Enjeksiyon / Dual Port Sıralı";
    expertOpinion = "Bu motor tipi yüksek basınç altında çalıştığından direkt enjeksiyon destekli kitlerin (örn. Prins VSI-3 DI) tercih edilmesi sürüş konforu ve sıfır arıza lambası için elzemdir.";
  }

  return {
    title,
    summary: basicSummary,
    content: basicContent,
    seoTitle: `${title} | LPG PORTAL Dijital Bilgi Arşivi`,
    seoDescription: `${title} gelişmesi, teknik özellikleri, uzman yorumları ve merak edilen her şey Türkiye'nin en büyük LPG portalında.`,
    seoKeywords: ["lpg otogaz", "teknik bülten", "lpg rehberi", "arıza çözümü", category.toLowerCase()],
    tags: [category.replace(/\s+/g, ""), "otogaz", "teknoloji"],
    socialShareText: `📣 Sektörümüzde yeni gelişme: "${title}" hakkında merak ettiğiniz tüm teknik analizler ve usta yorumları şimdi sayfamızda! Detayları kaçırmayın.`,
    trouble,
    possibleCauses,
    technicalSolution,
    compatibilityStatus,
    knownIssues,
    recommendedKits,
    nozzleRecommendation,
    regulatorRecommendation,
    calibrationNotes,
    vehicleBrand,
    vehicleModel,
    motorType,
    injectionSystem,
    expertOpinion
  };
}

// Fallback logic for offline / no-API key states

function getFallbackDiagnosis(brand: string, model: string, symptom: string): string {
  const symptomLower = symptom.toLowerCase();
  let rootCauses = "";
  let parts = "";
  let risk = "Orta";
  let steps = "";

  if (symptomLower.includes("tekle") || symptomLower.includes("patlatma") || symptomLower.includes("titre")) {
    rootCauses = `*   **Ateşleme Sistemi Zafiyeti:** LPG, benzine göre daha yüksek bir tutuşma sıcaklığı gerektirir. Buji, buji kabloları veya ateşleme bobinindeki en küçük yıpranma benzinde hissettirmezken LPG'de teklemeye neden olur.
*   **LPG Enjektör Kalibrasyon Sapması:** Enjektörlerin milisaniye (ms) bazında düzensiz püskürtme yapması silindir içi karışım dengesini bozar.
*   **Regülatör Basınç Düzensizliği:** Regülarörün vakum hortumundaki kaçaklar veya diyafram yıpranması nedeniyle gaz basıncı dalgalanıyor olabilir.`;
    parts = `*   Ateşleme Bujileri ve Bobinler (Özellikle LPG uyumlu tek tırnak buji tavsiye edilir)
*   LPG Enjektör Kütüğü (Nozul çapları ve debi kontrolü)
*   Regülatör Diyaframı ve Vakum Bağlantıları`;
    risk = "Orta";
    steps = `1.  Aracın öncelikle ateşleme sistemini (bujiler ve bobinler) kontrol ettirin. Bobin voltaj testleri yaptırılmalıdır.
2.  LPG yazılımı üzerinden enjektör çalışma milisaniyelerini (yakıt haritası) izleyin. Benzinden LPG'ye geçişteki ms değişimlerini dengeleyin.
3.  LPG filtresini (sıvı faz ve gaz faz filtreleri) en son ne zaman değiştirdiğinizi kontrol edin (her 10.000 km'de bir değişmelidir).`;
  } else if (symptomLower.includes("benzine") || symptomLower.includes("geç") || symptomLower.includes("stop")) {
    rootCauses = `*   **Regülatör Isınma Sorunu (Isı Sensörü Hatası):** Regülatör sıcaklığı yeterli düzeye ulaşmadığı için sistem kendini korumaya alıp benzine geri çeviriyor olabilir. Antifriz eksikliği veya kalorifer hortum bağlantı hatası buna sebep olur.
*   **Basınç Düşüşü (MAP Sensörü veya Regülatör):** Ani hızlanmalarda gaz basıncı çok düştüğünde sistem otomatik olarak güvence amacıyla benzine geçer.
*   **LPG Solenoid Valf Tıkanıklığı:** Tank üzerindeki veya motor bölümündeki kesici valfler pislik kaplamışsa akış kısıtlanır ve basınç düşer.`;
    parts = `*   MAP Sensörü (Manifold Absolute Pressure)
*   Regülatör Isı Müşürü / Sıcaklık Sensörü
*   LPG Kesici Solenoid Valf Filtresi`;
    risk = "Yüksek (Ani stop riski trafiği tehlikeye atabilir)";
    steps = `1.  LPG ECU yazılımına bağlanarak "Gaz Basıncı" değerini canlı olarak izleyin. Gaza yüklendiğinizde basınç 1.00 barın altına düşüyorsa regülatör veya filtre tıkanıklığı vardır.
2.  Motor soğutma suyu seviyesini ve antifrizi kontrol edin. Regülatör buzlanma yapıyorsa gazı buharlaştıramaz.
3.  MAP sensöründen gelen vakum hortumunu yırtılma veya yerinden çıkma ihtimaline karşı gözle fiziksel olarak inceleyin.`;
  } else {
    rootCauses = `*   **Filtre Tıkanması:** Gaz ve sıvı faz LPG filtrelerinin tıkanmış olması yakıt miktarını kısıtlar.
*   **ECU Kalibrasyon Bozukluğu:** Hava/yakıt oranının (LTFT ve STFT değerlerinin) +/- %10 eşiğinin dışına taşması.
*   **Hava Emiş Sistemi Kaçakları:** Manifold contalarından veya LPG nozul diplerinden hava sızması (fakir karışım oluşturur).`;
    parts = `*   LPG Filtre Seti (Filtrelerin düzenli değişimi elzemdir)
*   Gaz Ayarı Kalibrasyon Parametreleri (ECU)
*   Nozul Bağlantı Contaları ve Manifold Vakum Hortumları`;
    risk = "Düşük";
    steps = `1.  LPG servis istasyonunda bilgisayarlı kalibrasyon (Yol Ayarı) yaptırarak LTFT / STFT trim değerlerini eşitleyin.
2.  Sızıntı spreyi yardımıyla nozul girişlerinde, rekorlarda sızıntı olup olmadığını kontrol edin.
3.  Aracın benzin değerlerini sıfırlamak için 50-100 km benzinde sürüş yaptıktan sonra LPG ayarı yapılmasını talep edin.`;
  }

  return `### 🛠️ LPG PORTAL Yapay Zeka Arıza Teşhis Raporu (Çevrimdışı Sürüm)

*Analiz Edilen Model: ${brand ? `${brand} ${model || ""}` : "Genel LPG'li Araç"}*
*Semptom: "${symptom}"*

> Bu rapor, yapay zeka çevrimdışı teşhis algoritması tarafından oluşturulmuştur. En sık karşılaşılan LPG arızaları ve sektörel usta tecrübelerine göre derlenmiştir.

---

#### 1. Olası Kök Nedenler
${rootCauses}

---

#### 2. Risk Sınıfı
*   **Risk Derecesi:** **${risk}**
*   *Açıklama:* Bu arıza doğrudan sürüş konforunu ve motor sağlığını (özellikle subap erimesi veya fakir karışım nedeniyle motor aşınmasını) etkileyebilir.

---

#### 3. Çözüm Önerileri & Adımlar
${steps}

---

#### 4. Kontrol Edilmesi veya Değişmesi Gereken Parçalar
${parts}

---

#### 5. 📍 Yakın Servis ve Mühendislik Tavsiyesi
Bu belirtiler genellikle donanım kalibrasyonu ve sızdırmazlık testleri gerektirir. Güvenliğiniz için **platformumuzdaki TSE Hizmet Yeterlilik Belgesi (HYB) onaylı en yakın firmalara** (Firma Rehberi sekmesinden ulaşabilirsiniz) müracaat ederek gaz kaçak kontrolü ve bilgisayarlı LPG ayarı yaptırmanız kesinlikle tavsiye edilir.`;
}

function getFallbackTechnicalAssistantAnswer(question: string): string {
  const q = question.toLowerCase();
  
  if (q.includes("nozul") || q.includes("çap") || q.includes("enjektör") || q.includes("mm")) {
    return `### 📐 LPG Enjektör Nozul Çapı Hesaplama Kılavuzu

LPG kalibrasyonunda doğru nozul çapı seçimi, aracın motor gücü (Beygir Gücü - HP) ve silindir sayısına göre belirlenir. Yanlış çap seçimi, yüksek ms sürelerine veya rölantide tekleme/zengin karışım problemlerine yol açar.

#### 1. Silindir Başına Beygir Gücü (HP) Hesaplama:
Silindir başına düşen gücü bulmak için toplam beygir gücünü silindir sayısına bölün:
*   *Örnek:* 1.6 16V 100 HP 4 Silindir bir araçta: \`100 / 4 = 25 HP / Silindir\`.

#### 2. Standart Nozul Çapı Seçim Tablosu (1.0 - 1.2 Bar Regülatör Basıncı İçin):
*   **15 - 20 HP (Silindir Başı):** 1.8 mm Nozul
*   **20 - 27 HP (Silindir Başı):** 2.0 mm Nozul *(örn. standard 1.6 atmosferik motorlar)*
*   **28 - 35 HP (Silindir Başı):** 2.2 mm - 2.4 mm Nozul
*   **36 - 45 HP (Silindir Başı):** 2.6 mm - 2.8 mm Nozul
*   **45 HP ve üzeri:** 3.0 mm + veya yüksek performanslı kırmızı/mavi enjektörler tipi (Han, Lovato KP vb.)

#### 3. Altın Kurallar:
1.  **LPG Enjeksiyon Süresi:** Rölantide, motor sıcakken LPG enjeksiyon süresi **3.5 ms ile 4.5 ms** arasında olmalıdır.
    *   Eğer süre *4.8 ms üzerindeyse* -> Nozul çapı küçük kalmıştır, **genişletilmelidir**.
    *   Eğer süre *3.0 ms altındaysa* -> Nozul çapı büyük kalmıştır, **küçültülmelidir** veya regülatör basıncı kısılmalıdır (ideal rölanti benzin süresi ile ilişkilendirilerek).
2.  **Basınç:** Standart sıralı sistemlerde ideal regülatör çalışma basıncı rölantide vakumlu şekilde **1.00 ile 1.20 bar** arasıdır.`;
  }
  
  if (q.includes("ayar") || q.includes("kalibrasyon") || q.includes("ltft") || q.includes("stft")) {
    return `### 💻 OBD II ve Yakıt Trimleri (LTFT/STFT) Gaz Ayarı Metodolojisi

LPG ayarının kusursuz olması için benzin ECU'sunun (Sinyal Kontrol Ünitesi) yakıt düzeltme değerlerinin gözlemlenmesi şarttır. LTFT (Uzun Vadeli Yakıt Trimi) ve STFT (Kısa Vadeli Yakıt Trimi) değerleri takip edilmelidir.

#### 1. Hedef Parametreler:
*   **İdeal Toplam Trim (LTFT + STFT):** **%0 ile %5** arasında olmalıdır.
*   **Fakir Karışım Sınırı:** Trim toplamı **>%10'un** üzerine çıkarsa (pozitif trim), benzin ECU'su ortamda hava çok, yakıt az diye algılar ve yakıtı arttırmaya çalışır. Araçta rölanti düzensizliği ve motor arıza lambası oluşur.
*   **Zengin Karışım Sınırı:** Trim toplamı **<% -10'un** altına inerse (negatif trim), ECU ortamda gaz fazla diye algılar ve yakıtı kısmaya çalışır.

#### 2. Adım Adım Yol Ayarı Prosedürü:
1.  İlk olarak araç benzinde çalışırken rölanti ve sürüş esnasındaki LTFT değerini kaydedin.
2.  LPG'ye geçin. Aynı sürüş profillerinde (2000 devir, 3000 devir, rampa yukarı) LTFT/STFT toplamının benzindeki değerlerden sapmamasını sağlayın.
3.  Eğer rampa yukarı giderken STFT fırlıyorsa, LPG haritasındaki o yük hücresindeki (ms/devir kesişimi) değerleri **LPG yüzdesini arttırarak (%5-10)** yukarı çekin.
4.  Rölantide fan açtığında veya klima açıldığında tekleme oluyorsa rölanti yük satırlarını optimize edin.`;
  }

  return `### 📘 LPG PORTAL Teknik Asistan Yanıtı (Çevrimdışı Mod)

İlettiğiniz teknik soru için sektör standartları, ECE R-67.01 montaj kuralları ve usta bültenleri incelenmiştir:

**Teknik Değerlendirme:**
LPG montajı ve kalibrasyonu esnasında karşılaşılan bu durum genellikle yakıt besleme hattı basıncı, enjektör debisi veya elektrik bağlantı şemasındaki parazitlerden kaynaklanır.

1.  **Montaj Standartları Uyumu:** Regülatörün kalorifer peteği seviyesinden aşağıda yer alıp almadığını kontrol edin. Yukarıda yer alıyorsa su devridaimi zayıf kalır ve regülatör yeterince ısınmaz.
2.  **Enjektör Hortum Boyları:** Emme manifoldu nozulları ile LPG enjektör kütüğü arasındaki hortum boylarının **eşit olması (maksimum 15 cm)** gazın silindire ulaşma süresindeki gecikmeleri (gecikme kaynaklı silindir teklemesini) engeller.
3.  **Hortum Açısı:** Nozulların emme manifolduna delme açısı subapa doğru, gaz akış yönünde yaklaşık **45 derece** olmalıdır. Doksan derecelik dik delmeler hava akışını bozar ve türbülansa neden olur.

*Daha spesifik bir teknik döküman için sorunuza 'nozul çapı', 'regülatör basıncı', 'OBD ayarı' gibi anahtar kelimeler ekleyerek genişletebilirsiniz.*`;
}

// ----------------------------------------------------
// PRODUCTION API INTEGRATION ROUTES
// ----------------------------------------------------
// 1. Adapter-based Payment Gateway Routes
app.post("/api/payment/paytr-token", async (req, res) => {
  const { email, amount, merchantOid, userName, userAddress, userPhone, okUrl, failUrl } = req.body;
  const userIp = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!email || !amount || !merchantOid) {
    return res.status(400).json({ error: "Eksik parametreler." });
  }

  const config = loadPaymentConfig();
  const adapter = PaymentAdapterFactory.getAdapter(config.provider);

  const result = await adapter.getPaymentToken({
    email,
    amount: Number(amount),
    merchantOid,
    userName: userName || "Müşteri",
    userAddress: userAddress || "Türkiye",
    userPhone: userPhone || "05000000000",
    okUrl: okUrl || `${process.env.APP_URL || "http://localhost:3000"}/payment-success`,
    failUrl: failUrl || `${process.env.APP_URL || "http://localhost:3000"}/payment-fail`,
    userIp
  }, config);

  // Log transaction to fallback JSON database for admin display
  const newLog = {
    id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    merchantOid,
    amount: Number(amount),
    status: result.success ? "Beklemede" : "Başarısız",
    details: result.success ? `Token Alındı (${config.provider})` : result.error,
    createdAt: new Date().toISOString()
  };

  const db = readFallbackDb();
  db["lpgportal_paytr_transactions"] = [newLog, ...(db["lpgportal_paytr_transactions"] || [])].slice(0, 500);
  writeFallbackDb(db);

  return res.json(result);
});

app.post("/api/payment/paytr-callback", async (req, res) => {
  const payload = req.body;
  const config = loadPaymentConfig();
  const adapter = PaymentAdapterFactory.getAdapter(config.provider);
  const isValid = adapter.verifyWebhook(payload, config);

  if (!isValid) {
    return res.status(400).send("PAYMENT SIGNATURE INVALID");
  }

  const db = readFallbackDb();
  if (payload.status === "success") {
    const newLog = {
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      merchantOid: payload.merchant_oid,
      amount: Number(payload.total_amount) / 100,
      status: "Başarılı",
      details: `${config.provider} Webhook Onaylandı`,
      createdAt: new Date().toISOString()
    };
    db["lpgportal_paytr_transactions"] = [newLog, ...(db["lpgportal_paytr_transactions"] || [])].slice(0, 500);
  } else {
    const reason = payload.failed_reason_msg || "Ödeme başarısız.";
    const newLog = {
      id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      merchantOid: payload.merchant_oid,
      amount: Number(payload.total_amount) / 100,
      status: "Başarısız",
      details: reason,
      createdAt: new Date().toISOString()
    };
    db["lpgportal_paytr_transactions"] = [newLog, ...(db["lpgportal_paytr_transactions"] || [])].slice(0, 500);
  }
  writeFallbackDb(db);

  return res.send("OK");
});

// 2. Cloudflare R2 Object Storage Routes
app.post("/api/storage/upload", async (req, res) => {
  const { fileBase64, fileName, contentType } = req.body;

  if (!fileBase64 || !fileName || !contentType) {
    return res.status(400).json({ error: "Eksik dosya verileri." });
  }

  try {
    // 1. File Size validation: Max 5MB
    const base64Data = fileBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const maxSizeBytes = 5 * 1024 * 1024;
    if (buffer.length > maxSizeBytes) {
      console.warn(`[Blocked Upload] File size exceeds 5MB limit. Size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);
      return res.status(400).json({ error: "Hata: Dosya boyutu 5 MB limitini aşamaz." });
    }

    // 2. Extension validation against whitelist
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    const allowedMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg', 'image/jpg'],
      'jpeg': ['image/jpeg', 'image/jpg'],
      'png': ['image/png'],
      'webp': ['image/webp'],
      'pdf': ['application/pdf'],
      'txt': ['text/plain'],
      'zip': ['application/zip', 'application/x-zip-compressed'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'mp3': ['audio/mpeg', 'audio/mp3'],
      'wav': ['audio/wav', 'audio/x-wav'],
      'm4a': ['audio/mp4', 'audio/x-m4a'],
      'fpd': ['application/octet-stream', 'text/plain'],
      'afcp': ['application/octet-stream', 'text/plain']
    };

    if (!allowedMimeTypes[ext]) {
      console.warn(`[Blocked Upload] Ext not in whitelist: .${ext} (Filename: ${fileName})`);
      return res.status(400).json({ error: "Hata: Desteklenmeyen veya zararlı dosya uzantısı." });
    }

    // 3. MIME Type validation
    const cleanMime = contentType.toLowerCase().trim();
    if (!allowedMimeTypes[ext].includes(cleanMime)) {
      console.warn(`[Blocked Upload] MIME type mismatch for .${ext}: ${cleanMime}`);
      return res.status(400).json({ error: "Hata: MIME tipi ve dosya uzantısı uyuşmuyor." });
    }

    // 4. File name sanitization to prevent directory traversal / execution
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();

    console.log(`[R2 Upload Approved] File: ${safeName} | Size: ${(buffer.length / 1024).toFixed(1)} KB`);
    const result = await R2StorageService.uploadFile(fileBase64, safeName, contentType);
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

app.post("/api/storage/delete", async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: "Silinecek dosya URL'si belirtilmedi." });
  }

  const result = await R2StorageService.deleteFile(fileUrl);
  return res.json(result);
});

// 3. Adapter-based SMS Gateway Routes
app.post("/api/sms/send", async (req, res) => {
  const { phone, message, userId } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: "Telefon numarası ve mesaj zorunludur." });
  }

  // Clean phone number format
  const cleanPhone = phone.replace(/\D/g, "");
  const finalPhone = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone;

  if (finalPhone.length !== 10) {
    return res.status(400).json({ error: "Geçersiz telefon numarası formatı. Numara 10 haneli olmalıdır." });
  }

  const config = loadSmsConfig();
  const adapter = SmsAdapterFactory.getAdapter(config.provider);
  const result = await adapter.sendSms(finalPhone, message, config);

  // Write log to DB
  const newLog = {
    id: "sms_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    userId: userId || "guest",
    phone: finalPhone,
    message,
    sentAt: new Date().toISOString(),
    status: result.success ? "Gönderildi" : "Hata",
    error: result.error
  };

  const db = readFallbackDb();
  db["lpgportal_sent_sms_logs"] = [newLog, ...(db["lpgportal_sent_sms_logs"] || [])].slice(0, 500);
  writeFallbackDb(db);

  return res.json(result);
});

// 4. Adapter-based E-posta Gateway Routes
app.post("/api/email/send", async (req, res) => {
  const { to, subject, type, params, userId } = req.body;

  if (!to || !subject || !type) {
    return res.status(400).json({ error: "Alıcı, konu ve şablon tipi belirtilmelidir." });
  }

  let htmlContent = "";
  switch (type) {
    case "welcome":
      htmlContent = ResendService.getWelcomeTemplate(params?.name || "Değerli Üye");
      break;
    case "reset":
      htmlContent = ResendService.getPasswordResetTemplate(params?.name || "Değerli Üye", params?.link || "#");
      break;
    case "quote":
      htmlContent = ResendService.getQuoteNotificationTemplate(params?.name || "Değerli Üye", params?.car || "", params?.offer || "");
      break;
    case "order":
      htmlContent = ResendService.getOrderNotificationTemplate(params?.buyerName || "Alıcı", params?.product || "", Number(params?.amount || 0));
      break;
    case "approval":
      htmlContent = ResendService.getMembershipApprovalTemplate(params?.name || "Değerli Üye", params?.status || "Onaylandı");
      break;
    case "warning":
      htmlContent = ResendService.getMembershipWarningTemplate(params?.name || "Değerli Üye", Number(params?.days || 0));
      break;
    case "announcement":
      htmlContent = ResendService.getSystemAnnouncementTemplate(params?.title || "Duyuru", params?.message || "");
      break;
    default:
      htmlContent = `<p>${params?.message || "LPGPORTAL Bildirimi"}</p>`;
  }

  const config = loadEmailConfig();
  const adapter = EmailAdapterFactory.getAdapter(config.provider);
  const result = await adapter.sendEmail(to, subject, htmlContent, config);

  // Write log to DB
  const newLog = {
    id: "email_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    userId: userId || "guest",
    email: to,
    subject,
    body: htmlContent,
    sentAt: new Date().toISOString(),
    status: result.success ? "Gönderildi" : "Hata",
    error: result.error
  };

  const db = readFallbackDb();
  db["lpgportal_sent_email_logs"] = [newLog, ...(db["lpgportal_sent_email_logs"] || [])].slice(0, 500);
  writeFallbackDb(db);

  return res.json(result);
});

// 5. Database Sync Endpoints (PostgreSQL with Local Fallback)
app.get("/api/auth/session/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    if (useFallback) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
      }
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      const user = users.find((u: any) => u.id === userId);
      return res.json({ active_session_id: user?.active_session_id || null });
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeSessionId: true }
      });
      return res.json({ active_session_id: user?.activeSessionId || null });
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
    }
    return res.status(500).json({ error: err.message });
  }
});

app.get("/api/db/get-all", async (req, res) => {
  const clientVersion = req.query.v;
  if (clientVersion && clientVersion === dbVersion) {
    return res.json({ upToDate: true });
  }
  res.setHeader("X-LpgPortal-Version", dbVersion);
  try {
    if (useFallback) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
      }
      const data = readFallbackDb();
      return res.json(data);
    }

    // Fetch from all Prisma tables
    const users = await prisma.user.findMany();
    const invoices = await prisma.invoice.findMany();
    const companies = await prisma.company.findMany();
    const products = await prisma.product.findMany();
    const orders = await prisma.order.findMany();
    const articles = await prisma.article.findMany();
    const bulletins = await prisma.bulletin.findMany();
    const notifications = await prisma.notification.findMany();
    const smsLogs = await prisma.smsLog.findMany();
    const emailLogs = await prisma.emailLog.findMany();
    const payments = await prisma.payment.findMany();
    const coupons = await prisma.coupon.findMany();
    const supportTickets = await prisma.supportTicket.findMany();
    const expertProfiles = await prisma.expertProfile.findMany();
    const homeReviews = await prisma.homeReview.findMany();

    // Map DB objects back to frontend format
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: u.password,
      role: u.role,
      membership_type: u.membershipType,
      membership_fee: u.membershipFee,
      membership_start: u.membershipStart.toISOString(),
      membership_end: u.membershipEnd.toISOString(),
      membership_status: u.membershipStatus === "SuresiDolmus" ? "Süresi Dolmuş" : u.membershipStatus === "AskiyaAlindi" ? "Askıya Alındı" : u.membershipStatus === "OnayBekliyor" ? "Onay Bekliyor" : u.membershipStatus,
      company_name: u.companyName,
      authorized_name: u.authorizedName,
      tax_info: u.taxInfo,
      website: u.website,
      city: u.city,
      district: u.district,
      expertise: u.expertise,
      brand_name: u.brandName,
      authorized_person: u.authorizedPerson,
      product_categories: u.productCategories,
      working_brands: u.workingBrands,
      kvkk_approved: u.kvkkApproved,
      privacy_policy_approved: u.privacyPolicyApproved,
      terms_approved: u.termsApproved,
      marketing_approved: u.marketingApproved,
      approval_date: u.approvalDate?.toISOString(),
      ip_address: u.ipAddress,
      logo_url: u.logoUrl,
      no_logo: u.noLogo,
      logo_type: u.logoType,
      active_session_id: u.activeSessionId,
      last_login_time: u.lastLoginTime?.toISOString(),
      last_login_ip: u.lastLoginIp,
      last_login_device: u.lastLoginDevice
    }));

    const fallbackDb = readFallbackDb();
    const fullDb = {
      ...fallbackDb,
      lpgportal_users: mappedUsers
    };

    return res.json(fullDb);
  } catch (err: any) {
    console.error("Error in /api/db/get-all:", err);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
    }
    try {
      const data = readFallbackDb();
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: err.message });
    }
  }
});

app.post("/api/db/save", async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Missing DB key." });
  }

  console.log("[DB SAVE] key:", key, "value:", JSON.stringify(value).substring(0, 150));

  try {
    const translatedVal = await processTranslationsForSave(key, value);

    if (useFallback) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
      }
      if (key === "lpgportal_users" && Array.isArray(translatedVal)) {
        const normalizePhone = (phone: string): string => {
          const digits = (phone || "").replace(/\D/g, "");
          return digits.slice(-10);
        };

        const existingDb = readFallbackDb();
        const existingUsers = existingDb["lpgportal_users"] || [];
        for (const u of translatedVal) {
          const normPhone = normalizePhone(u.phone);
          const emailMatch = existingUsers.find((x: any) => x.id !== u.id && x.email.toLowerCase().trim() === u.email.toLowerCase().trim());
          if (emailMatch) {
            return res.status(400).json({ error: "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır." });
          }
          if (!normPhone) continue;
          const phoneMatch = existingUsers.find((x: any) => x.id !== u.id && normalizePhone(x.phone) === normPhone);
          if (phoneMatch) {
            return res.status(400).json({ error: "Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır." });
          }
        }
      }
      const db = readFallbackDb();
      db[key] = translatedVal;
      writeFallbackDb(db);
      return res.json({ success: true, mode: "fallback", translatedValue: translatedVal });
    }

    if (key === "lpgportal_users" && Array.isArray(translatedVal)) {
      const normalizePhone = (phone: string): string => {
        const digits = (phone || "").replace(/\D/g, "");
        return digits.slice(-10);
      };

      // Backend validation: check for duplicates in Postgres mode
      for (const u of translatedVal) {
        const emailDuplicate = await prisma.user.findFirst({
          where: {
            email: { equals: u.email, mode: 'insensitive' },
            id: { not: u.id }
          }
        });
        if (emailDuplicate) {
          return res.status(400).json({ error: "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır." });
        }

        const normPhone = normalizePhone(u.phone);
        if (normPhone) {
          const allDbUsers = await prisma.user.findMany({
            where: { id: { not: u.id } }
          });
          const phoneDuplicate = allDbUsers.find(x => normalizePhone(x.phone) === normPhone);
          if (phoneDuplicate) {
            return res.status(400).json({ error: "Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır." });
          }
        }
      }

      // Prune users that are deleted in frontend (non-admin to prevent accidents)
      const userIds = translatedVal.map(u => u.id);
      await prisma.user.deleteMany({
        where: {
          id: { notIn: userIds },
          role: { not: "admin" }
        }
      });

      for (const u of translatedVal) {
        const statusMap: any = {
          "Süresi Dolmuş": "SuresiDolmus",
          "Askıya Alındı": "AskiyaAlindi",
          "Onay Bekliyor": "OnayBekliyor"
        };
        const dbStatus = statusMap[u.membership_status] || u.membership_status;
        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            name: u.name,
            phone: u.phone,
            password: u.password,
            role: u.role,
            membershipType: u.membership_type || "Ziyaretçi",
            membershipFee: Number(u.membership_fee || 0),
            membershipStart: new Date(u.membership_start || Date.now()),
            membershipEnd: new Date(u.membership_end || Date.now()),
            membershipStatus: dbStatus,
            companyName: u.company_name,
            authorizedName: u.authorized_name,
            taxInfo: u.tax_info,
            website: u.website,
            city: u.city,
            district: u.district,
            expertise: u.expertise,
            brandName: u.brandName,
            authorizedPerson: u.authorizedPerson,
            productCategories: u.productCategories,
            workingBrands: u.working_brands || [],
            kvkkApproved: !!u.kvkk_approved,
            privacyPolicyApproved: !!u.privacy_policy_approved,
            termsApproved: !!u.terms_approved,
            marketingApproved: !!u.marketing_approved,
            approvalDate: u.approval_date ? new Date(u.approval_date) : null,
            ipAddress: u.ip_address,
            logoUrl: u.logo_url,
            noLogo: !!u.no_logo,
            logoType: u.logo_type || "auto",
            activeSessionId: u.active_session_id,
            lastLoginTime: u.last_login_time ? new Date(u.last_login_time) : null,
            lastLoginIp: u.last_login_ip,
            lastLoginDevice: u.last_login_device
          },
          create: {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            password: u.password || "",
            role: u.role,
            membershipType: u.membership_type || "Ziyaretçi",
            membershipFee: Number(u.membership_fee || 0),
            membershipStart: new Date(u.membership_start || Date.now()),
            membershipEnd: new Date(u.membership_end || Date.now()),
            membershipStatus: dbStatus,
            companyName: u.company_name,
            authorizedName: u.authorized_name,
            taxInfo: u.tax_info,
            website: u.website,
            city: u.city,
            district: u.district,
            expertise: u.expertise,
            brandName: u.brandName,
            authorizedPerson: u.authorizedPerson,
            productCategories: u.productCategories,
            workingBrands: u.working_brands || [],
            kvkkApproved: !!u.kvkk_approved,
            privacyPolicyApproved: !!u.privacy_policy_approved,
            termsApproved: !!u.terms_approved,
            marketingApproved: !!u.marketing_approved,
            approvalDate: u.approval_date ? new Date(u.approval_date) : null,
            ipAddress: u.ip_address,
            logoUrl: u.logo_url,
            noLogo: !!u.no_logo,
            logoType: u.logo_type || "auto",
            activeSessionId: u.active_session_id,
            lastLoginTime: u.last_login_time ? new Date(u.last_login_time) : null,
            lastLoginIp: u.last_login_ip,
            lastLoginDevice: u.last_login_device
          }
        });
      }
    }

    const db = readFallbackDb();
    db[key] = translatedVal;
    writeFallbackDb(db);

    return res.json({ success: true, mode: "postgres", translatedValue: translatedVal });
  } catch (err: any) {
    console.error("Error in /api/db/save:", err);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
    }
    try {
      const translatedVal = await processTranslationsForSave(key, value).catch(() => value);
      const db = readFallbackDb();
      db[key] = translatedVal;
      writeFallbackDb(db);
      return res.json({ success: true, mode: "fallback_error", translatedValue: translatedVal });
    } catch (e: any) {
      return res.status(500).json({ error: err.message });
    }
  }
});


// ----------------------------------------------------
// VITE CLIENT INTEGRATION
// ----------------------------------------------------

function getLocalIpAddress(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name];
    if (netInterface) {
      for (const net of netInterface) {
        if (net.family === "IPv4" && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return null;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Started Vite Dev Middleware.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static files from /dist.");
  }

  app.listen(PORT, "0.0.0.0", async () => {
    const localIp = getLocalIpAddress();
    console.log(`\nLPG PORTAL Full-stack server active at:`);
    console.log(`  > Local:   http://localhost:${PORT}`);
    if (localIp) {
      console.log(`  > Network: http://${localIp}:${PORT}`);
    } else {
      console.log(`  > Network: (No active network IP found)`);
    }

    // Start Secure Tunneling ONLY in development mode
    if (process.env.NODE_ENV !== "production") {
      console.log(`  > Secure Tunneling: Initiating connection to the public web...`);

      // Start LocalTunnel
      try {
        const localtunnelModule = await import("localtunnel");
        const localtunnel = localtunnelModule.default;
        const tunnel = await localtunnel({ port: PORT });
        console.log(`  > Public (LocalTunnel):  ${tunnel.url}`);
        (globalThis as any).localtunnelUrl = tunnel.url;

        tunnel.on("error", (err) => {
          console.error("Localtunnel error:", err);
        });
        tunnel.on("close", () => {
          console.log("Localtunnel closed.");
        });
      } catch (e) {
        console.log("  > Public (LocalTunnel):  Failed to start LocalTunnel");
      }

      // Start Cloudflare Tunnel
      try {
        const cloudflaredModule = await import("cloudflared");
        const cloudflaredBin = cloudflaredModule.bin;
        const cfTunnel = spawn(cloudflaredBin, ["tunnel", "--url", `http://localhost:${PORT}`]);
        cfTunnel.stderr.on("data", (data) => {
          const str = data.toString();
          if (str.includes("trycloudflare.com")) {
            const match = str.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
            if (match) {
              console.log(`  > Public (Cloudflare):   ${match[0]}\n`);
              (globalThis as any).cloudflareUrl = match[0];
            }
          }
        });
        cfTunnel.on("error", (err) => {
          console.log("  > Public (Cloudflare):   Failed to spawn Cloudflare process", err);
        });
      } catch (e) {
        console.log("  > Public (Cloudflare):   Failed to start Cloudflare Tunnel");
      }
    }
  });
}

startServer();
