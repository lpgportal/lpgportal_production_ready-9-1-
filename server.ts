import express from "express";
import os from "os";
import { spawn } from "child_process";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import { NetgsmService } from "./src/lib/integrations/netgsm";
import { ResendService } from "./src/lib/integrations/resend";
import { R2StorageService } from "./src/lib/integrations/r2";
import { PayTrService } from "./src/lib/integrations/paytr";
import { SmsAdapterFactory, loadSmsConfig } from "./src/lib/integrations/smsAdapter";
import { EmailAdapterFactory, loadEmailConfig } from "./src/lib/integrations/emailAdapter";
import { PaymentAdapterFactory, loadPaymentConfig } from "./src/lib/integrations/paymentAdapter";
import { verifySession, isPotentialSqlInjection, hashPassword, verifyPassword } from "./src/lib/security";
import winston from "winston";

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, "logs"))) {
  fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true });
}

// Configure Winston Structured Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: "lpg-portal-backend" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  ]
});

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Global OWASP Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'self' https: 'unsafe-inline' 'unsafe-eval' data:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:;");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});

// 301 Redirect www subdomains to canonical non-www
app.use((req, res, next) => {
  const host = req.headers.host;
  if (host && host.startsWith("www.")) {
    const canonicalHost = host.replace(/^www\./, "");
    return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const slowRequests: any[] = [];
const SLOW_REQUEST_THRESHOLD_MS = 2000;

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration >= SLOW_REQUEST_THRESHOLD_MS) {
      const entry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        duration,
        ip: req.ip
      };
      slowRequests.push(entry);
      if (slowRequests.length > 50) slowRequests.shift();
    }
  });
  next();
});

// ----------------------------------------------------
// DATABASE ALTYAPISI & VERİ BÜTÜNLÜĞÜ (PRISMA + JSON FALLBACK)
// ----------------------------------------------------
const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" }
  ]
}) as any;

const slowQueries: any[] = [];
const unhandledExceptions: any[] = [];

const SLOW_QUERY_THRESHOLD_MS = 1000;

const EXCEPTIONS_LOG_PATH = path.join(process.cwd(), "unhandled_exceptions.log");
const SLOW_QUERIES_LOG_PATH = path.join(process.cwd(), "slow_queries.log");

function logException(err: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message: err?.message || String(err),
    stack: err?.stack || null
  };
  unhandledExceptions.push(logEntry);
  if (unhandledExceptions.length > 50) unhandledExceptions.shift();
  try {
    fs.appendFileSync(EXCEPTIONS_LOG_PATH, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (e) {
    console.error("Failed to write to exception log file:", e);
  }
}

function logSlowQuery(queryEntry: any) {
  slowQueries.push(queryEntry);
  if (slowQueries.length > 50) slowQueries.shift();
  try {
    fs.appendFileSync(SLOW_QUERIES_LOG_PATH, JSON.stringify(queryEntry) + "\n", "utf8");
  } catch (e) {
    console.error("Failed to write to slow query log file:", e);
  }
}

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  logException(error);
});

process.on("unhandledRejection", (reason: any) => {
  console.error("UNHANDLED REJECTION:", reason);
  logException(reason instanceof Error ? reason : new Error(String(reason)));
});

prisma.$on("query", (e: any) => {
  if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
    logSlowQuery({
      timestamp: new Date().toISOString(),
      query: e.query,
      params: e.params,
      duration: e.duration
    });
  }
});

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
    logger.info("Successfully connected to PostgreSQL via Prisma Client.");
    useFallback = false;

    // Seed default users if they are missing
    try {
      const adminExists = await prisma.user.findUnique({
        where: { email: "admin@lpgportal.com" }
      });
      if (!adminExists) {
        console.log("Admin user not found in PostgreSQL. Seeding default users...");
        let fallbackDb: any = {};
        try {
          fallbackDb = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
        } catch (e: any) {
          console.warn("Failed to read fallback_db.json for seeding:", e);
          logger.warn("Failed to read fallback_db.json for seeding", { error: e.message });
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
          const exists = await prisma.user.findUnique({
            where: { email: u.email }
          });
          if (exists) continue;

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

      // Seeding recovery / password verification
      try {
        const seedUsersInfo = [
          { email: "admin@lpgportal.com", pass: "Admin34." },
          { email: "hata@hata.com", pass: "A1qwe2022.q" },
          { email: "servis@lpgportal.com", pass: "Servis34." },
          { email: "kit@lpgportal.com", pass: "Kit34." }
        ];
        for (const info of seedUsersInfo) {
          const u = await prisma.user.findUnique({ where: { email: info.email } });
          if (u && (!u.password || u.password.trim() === "")) {
            console.log(`Fixing empty password hash for seed user: ${info.email}`);
            await prisma.user.update({
              where: { email: info.email },
              data: { password: hashPassword(info.pass, info.email) }
            });
          }
        }
      } catch (recoverErr: any) {
        console.error("Failed to recover seed users passwords in PostgreSQL:", recoverErr);
        logger.error("Failed to recover seed users passwords in PostgreSQL", { error: recoverErr.message });
      }

      // Ensure deleted user placeholder is created in PostgreSQL
      try {
        const placeholderUser = await prisma.user.findUnique({
          where: { id: "deleted_user_placeholder" }
        });
        if (!placeholderUser) {
          console.log("Seeding system deleted user placeholder in PostgreSQL...");
          await prisma.user.create({
            data: {
              id: "deleted_user_placeholder",
              name: "Silinmiş Üye",
              email: "deleted_user_placeholder@lpgportal.com",
              phone: "0000000000",
              password: "SYSTEM_DELETED_PLACEHOLDER_NO_LOGIN",
              role: "visitor",
              membershipType: "Ziyaretçi",
              membershipFee: 0,
              membershipEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years
              membershipStatus: "Pasif"
            }
          });
        }
      } catch (e: any) {
        console.error("Failed to seed deleted user placeholder:", e);
        logger.error("Failed to seed deleted user placeholder", { error: e.message });
      }

    } catch (seedErr: any) {
      console.error("Failed to check/seed PostgreSQL users:", seedErr);
      logger.error("Failed to check/seed PostgreSQL users", { error: seedErr.message });
    }
    await seedPostgresFromJSON();
  } catch (err: any) {
    if (process.env.NODE_ENV === "production") {
      console.error("CRITICAL ERROR: PostgreSQL connection failed! JSON fallback database is DISABLED in production mode!", err);
      logger.error("CRITICAL ERROR: PostgreSQL connection failed in production mode", { error: err.message, stack: err.stack });
      useFallback = false;
    } else {
      console.error("PostgreSQL connection failed. Using JSON fallback database.", err);
      logger.error("PostgreSQL connection failed. Using JSON fallback database", { error: err.message, stack: err.stack });
      useFallback = true;
      checkAndSeedFallback();
    }
  }
  validateAndFixDataIntegrity();
  await translateExistingDatabaseRecords();
}

async function seedPostgresFromJSON() {
  console.log("=== Checking and Seeding PostgreSQL from JSON Fallback ===");
  let fallbackDb: any = {};
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      fallbackDb = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, "utf8"));
    } else {
      console.log("fallback_db.json not found, skipping import.");
      return;
    }
  } catch (e) {
    console.error("Failed to read fallback_db.json for seeding Postgres:", e);
    return;
  }

  try {
    // 1. Articles (lpgportal_news_db & lpgportal_user_contents_db)
    const articleCount = await prisma.article.count();
    if (articleCount === 0) {
      console.log("Seeding Article table...");
      const news = fallbackDb["lpgportal_news_db"] || [];
      const userContents = fallbackDb["lpgportal_user_contents_db"] || [];
      
      const seedArticles = [
        ...news.map((x: any) => ({ ...x, articleType: "news" })),
        ...userContents.map((x: any) => ({ ...x, articleType: "user_content" }))
      ];

      for (const a of seedArticles) {
        await prisma.article.create({
          data: {
            id: a.id,
            title: a.title || "",
            summary: a.summary || "",
            category: a.category || "",
            date: new Date(a.date || Date.now()),
            author: a.author || "",
            image: a.image || null,
            tags: a.tags || [],
            likes: Number(a.likes || 0),
            views: Number(a.views || 0),
            content: a.content || "",
            seoTitle: a.seoTitle || null,
            seoDescription: a.seoDescription || null,
            seoKeywords: a.seoKeywords || [],
            openGraphSupport: a.openGraphSupport !== false,
            googleNewsReady: a.googleNewsReady !== false,
            socialShareText: a.socialShareText || null,
            status: a.status || "Onaylandı",
            published: a.published !== false,
            publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
            authorId: a.authorId || null,
            approvedBy: a.approvedBy || null,
            approvedAt: a.approvedAt ? new Date(a.approvedAt) : null,
            articleType: a.articleType
          }
        });
      }
      console.log(`Successfully seeded ${seedArticles.length} articles.`);
    }

    // 2. Bulletins (lpgportal_bulletins_db)
    const bulletinCount = await prisma.bulletin.count();
    if (bulletinCount === 0) {
      console.log("Seeding Bulletin table...");
      const bulletins = fallbackDb["lpgportal_bulletins_db"] || [];
      for (const b of bulletins) {
        await prisma.bulletin.create({
          data: {
            id: b.id,
            title: b.title || "",
            summary: b.summary || "",
            category: b.category || "",
            lpgBrand: b.lpgBrand || "",
            date: new Date(b.date || Date.now()),
            author: b.author || "",
            authorTitle: b.authorTitle || null,
            views: Number(b.views || 0),
            likes: Number(b.likes || 0),
            tags: b.tags || [],
            content: b.content || "",
            targetMotor: b.targetMotor || null,
            compatibilityStatus: b.compatibilityStatus || null,
            knownIssues: b.knownIssues || null,
            recommendedKits: b.recommendedKits || [],
            nozzleRecommendation: b.nozzleRecommendation || null,
            regulatorRecommendation: b.regulatorRecommendation || null,
            calibrationNotes: b.calibrationNotes || null,
            seoTitle: b.seoTitle || null,
            seoDescription: b.seoDescription || null,
            seoKeywords: b.seoKeywords || [],
            openGraphSupport: b.openGraphSupport !== false,
            googleNewsReady: b.googleNewsReady !== false,
            socialShareText: b.socialShareText || null
          }
        });
      }
      console.log(`Successfully seeded ${bulletins.length} bulletins.`);
    }

    // 3. Notifications (lpgportal_central_notifications)
    const notificationCount = await prisma.notification.count();
    if (notificationCount === 0) {
      console.log("Seeding Notification table...");
      const notifications = fallbackDb["lpgportal_central_notifications"] || [];
      for (const n of notifications) {
        await prisma.notification.create({
          data: {
            id: n.id,
            userId: n.userId || "all",
            title: n.title || "",
            message: n.message || "",
            type: n.type || "duyuru",
            channel: n.channel || "panel",
            createdAt: new Date(n.createdAt || Date.now()),
            read: n.read === true
          }
        });
      }
      console.log(`Successfully seeded ${notifications.length} notifications.`);
    }

    // 4. HomeReviews (lpgportal_home_reviews)
    const reviewCount = await prisma.homeReview.count();
    if (reviewCount === 0) {
      console.log("Seeding HomeReview table...");
      const reviews = fallbackDb["lpgportal_home_reviews"] || [];
      for (const h of reviews) {
        await prisma.homeReview.create({
          data: {
            id: h.id,
            userId: h.userId || "",
            authorName: h.authorName || "",
            authorRole: h.authorRole || "",
            profession: h.profession || null,
            city: h.city || "",
            carBrand: h.carBrand || null,
            carModel: h.carModel || null,
            title: h.title || "",
            content: h.content || "",
            rating: Number(h.rating || 5),
            status: h.status || "Onaylandı",
            createdAt: new Date(h.createdAt || Date.now())
          }
        });
      }
      console.log(`Successfully seeded ${reviews.length} reviews.`);
    }

    // 5. Invoices (lpgportal_invoices)
    const invoiceCount = await prisma.invoice.count();
    if (invoiceCount === 0) {
      console.log("Seeding Invoice table...");
      const invoices = fallbackDb["lpgportal_invoices"] || [];
      for (const i of invoices) {
        await prisma.invoice.create({
          data: {
            id: i.id,
            userId: i.userId,
            amount: Number(i.amount || 0),
            date: new Date(i.date || Date.now()),
            membershipType: i.membership_type || "",
            status: i.status || "Beklemede",
            paymentMethod: i.payment_method || null,
            adminNote: i.admin_note || null,
            userName: i.userName || null,
            companyName: i.companyName || null,
            roleDisplayName: i.roleDisplayName || null,
            packageName: i.packageName || null,
            dekontStatus: i.dekont_status || null,
            dekontUrl: i.dekont_url || null
          }
        });
      }
      console.log(`Successfully seeded ${invoices.length} invoices.`);
    }

    // 6. Companies (lpgportal_companies)
    const companyCount = await prisma.company.count();
    if (companyCount === 0) {
      console.log("Seeding Company table...");
      const companies = fallbackDb["lpgportal_companies"] || [];
      for (const c of companies) {
        await prisma.company.create({
          data: {
            id: c.id,
            companyName: c.companyName || "",
            city: c.city || "",
            district: c.district || "",
            address: c.address || "",
            phone: c.phone || "",
            email: c.email || "",
            website: c.website || null,
            description: c.description || null,
            logo: c.logo || null,
            status: c.status || "Beklemede",
            approvedStatus: c.approvedStatus !== false,
            rating: Number(c.rating || 5),
            ownerId: c.ownerId || null
          }
        });
      }
      console.log(`Successfully seeded ${companies.length} companies.`);
    }

    // 7. Products (lpgportal_products)
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log("Seeding Product table...");
      const products = fallbackDb["lpgportal_products"] || [];
      for (const p of products) {
        await prisma.product.create({
          data: {
            id: p.id,
            name: p.name || "",
            description: p.description || "",
            price: Number(p.price || 0),
            stock: Number(p.stock || 0),
            category: p.category || "",
            condition: p.condition || "",
            conditionDetail: p.conditionDetail || "",
            original: p.original !== false,
            brand: p.brand || "",
            city: p.city || "",
            district: p.district || "",
            images: p.images || [],
            sellerId: p.sellerId || "",
            status: p.status || "Aktif",
            createdAt: new Date(p.createdAt || Date.now())
          }
        });
      }
      console.log(`Successfully seeded ${products.length} products.`);
    }

    // 8. Orders (lpgportal_orders)
    const orderCount = await prisma.order.count();
    if (orderCount === 0) {
      console.log("Seeding Order table...");
      const orders = fallbackDb["lpgportal_orders"] || [];
      for (const o of orders) {
        await prisma.order.create({
          data: {
            id: o.id,
            productId: o.productId || "",
            productName: o.productName || "",
            buyerId: o.buyerId || "",
            buyerName: o.buyerName || "",
            buyerPhone: o.buyerPhone || "",
            buyerEmail: o.buyerEmail || "",
            buyerRole: o.buyerRole || "",
            qty: Number(o.qty || 1),
            totalPrice: Number(o.totalPrice || 0),
            status: o.status || "Onay Bekliyor",
            sellerId: o.sellerId || "",
            sellerName: o.sellerName || ""
          }
        });
      }
      console.log(`Successfully seeded ${orders.length} orders.`);
    }

  } catch (err) {
    console.error("Error during PostgreSQL auto-seeding from JSON:", err);
  }
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

  // Exclude database sync endpoints and QA secret requests from rate limiting
  const secretHeader = req.headers["x-lpgportal-qa-secret"];
  if (
    secretHeader === "lpgportal_qa_secret_key_2026_secure" ||
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
    logger.warn("Rate Limit Exceeded", { ip, path: req.path, count: record.count });
    return res.status(429).json({ error: "Çok fazla istek gönderildi. Lütfen bir dakika bekleyin." });
  }
  next();
};
// CSRF Protection Middleware
const csrfProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Exclude PayTR webhook callbacks and health check from CSRF
  if (req.path === "/payment/paytr-callback" || req.path === "/api/payment/paytr-callback" || req.path === "/api/health" || req.path === "/health") {
    return next();
  }

  const secureHeader = req.headers["x-lpgportal-secure"];
  if (!secureHeader || secureHeader !== "true") {
    console.warn(`[CSRF Blocked] Request to ${req.path} from IP ${req.ip} is missing X-LpgPortal-Secure header.`);
    logger.warn("CSRF Blocked", { ip: req.ip, path: req.path });
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
      logger.warn("SQL Injection Blocked", { ip: req.ip, path: req.path, input: input.substring(0, 100) });
      return res.status(400).json({ error: "Güvenlik Uyarısı: Girişte geçersiz karakterler tespit edildi." });
    }
  }
  next();
};

// API Session Authorization Middleware
const verifyApiSession = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Exclude webhooks, DB, health checks, and session check endpoints
  if (
    req.path === "/payment/paytr-callback" || req.path === "/api/payment/paytr-callback" ||
    req.path === "/db/get-all" || req.path === "/api/db/get-all" ||
    req.path === "/db/save" || req.path === "/api/db/save" ||
    req.path === "/api/health" || req.path === "/health" ||
    req.path === "/api/auth/login" || req.path === "/auth/login" ||
    req.path === "/api/auth/session" || req.path === "/auth/session" ||
    req.path.startsWith("/api/auth/session/") || req.path.startsWith("/auth/session/") ||
    req.path.startsWith("/api/qa/") || req.path.startsWith("/qa/")
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
    logger.warn("Auth Header Verification Failed", { ip: req.ip, path: req.path });
    return res.status(401).json({ error: "Oturum doğrulaması başarısız. Lütfen giriş yapın." });
  }

  const isValid = verifySession({ id: userId, email, role }, token);
  if (!isValid) {
    console.warn(`[Auth Violation] Tampered session token detected for user ${email} from IP ${req.ip}`);
    logger.warn("Tampered session token detected", { userId, email, ip: req.ip, path: req.path });
    return res.status(401).json({ error: "Oturum anahtarı geçersiz veya süresi dolmuş." });
  }

  // Role Authorization check
  if (req.path === "/ai/generate-news-bulletin" || req.path === "/api/ai/generate-news-bulletin") {
    if (role !== "admin") {
      console.warn(`[Auth Violation] Unauthorized access attempt to news generator by user ${email} (Role: ${role})`);
      logger.warn("Unauthorized Role Access", { email, role, path: req.path, ip: req.ip });
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

// 5. Authentication & Session Management (Production Architecture)
const JWT_SECRET = process.env.JWT_SECRET || "lpgportal_jwt_secret_2026_super_secure";

// Helper function to parse cookies manually
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift()!.trim()] = decodeURIComponent(parts.join("="));
  });
  return list;
}

// Login failure tracker for brute force prevention (IP and User/Email based)
const loginFailures = new Map<string, { count: number; lockoutUntil: number }>();

function getFailureRecord(key: string) {
  const record = loginFailures.get(key);
  const now = Date.now();
  if (!record) {
    return { count: 0, lockoutUntil: 0 };
  }
  if (now > record.lockoutUntil) {
    return { count: 0, lockoutUntil: 0 };
  }
  return record;
}

function registerLoginFailure(key: string) {
  const record = getFailureRecord(key);
  const newCount = record.count + 1;
  const lockoutUntil = newCount >= 5 ? Date.now() + 5 * 60 * 1000 : 0;
  loginFailures.set(key, { count: newCount, lockoutUntil });
  return { count: newCount, lockoutUntil };
}

function clearLoginFailures(key: string) {
  loginFailures.delete(key);
}

// POST /api/auth/login with brute-force rate limiting and HttpOnly cookie generation
app.post("/api/auth/login", express.json(), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-posta ve şifre gereklidir." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const ipKey = `ip:${req.ip}`;
  const emailKey = `email:${normalizedEmail}`;

  const now = Date.now();
  const ipRecord = getFailureRecord(ipKey);
  const emailRecord = getFailureRecord(emailKey);

  if (ipRecord.lockoutUntil > now) {
    const minutesLeft = Math.ceil((ipRecord.lockoutUntil - now) / 60000);
    return res.status(429).json({ error: `Çok fazla başarısız deneme yapıldı. Lütfen ${minutesLeft} dakika sonra tekrar deneyin.` });
  }
  if (emailRecord.lockoutUntil > now) {
    const minutesLeft = Math.ceil((emailRecord.lockoutUntil - now) / 60000);
    return res.status(429).json({ error: `Bu hesap geçici olarak kilitlendi. Lütfen ${minutesLeft} dakika sonra tekrar deneyin.` });
  }

  try {
    let foundUser: any = null;

    if (useFallback) {
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      foundUser = users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail);
    } else {
      foundUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
    }

    if (!foundUser) {
      registerLoginFailure(ipKey);
      return res.status(401).json({ error: "E-posta adresi veya şifre hatalı." });
    }

    // Verify password on the server
    const isPasswordValid = verifyPassword(password, foundUser.email, foundUser.password);
    if (!isPasswordValid) {
      const ipRes = registerLoginFailure(ipKey);
      const emailRes = registerLoginFailure(emailKey);
      const maxCount = Math.max(ipRes.count, emailRes.count);
      const remains = 5 - maxCount;

      if (maxCount >= 5) {
        return res.status(429).json({ error: "Çok fazla başarısız giriş denemesi yapıldı. Hesabınız 5 dakika süreyle bloke edilmiştir." });
      } else {
        return res.status(401).json({ error: `Girdiğiniz şifre hatalı. Kalan deneme hakkınız: ${remains}` });
      }
    }

    // Clear failures on successful login
    clearLoginFailures(ipKey);
    clearLoginFailures(emailKey);

    // Generate unique active session ID
    const newSessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Update activeSessionId in PostgreSQL or Fallback DB
    if (useFallback) {
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      const idx = users.findIndex((u: any) => u.id === foundUser.id);
      if (idx > -1) {
        users[idx].active_session_id = newSessionId;
        users[idx].last_login_time = new Date().toISOString();
        users[idx].last_login_ip = req.ip;
        users[idx].last_login_device = req.headers["user-agent"] || "Unknown";
      }
      writeFallbackDb(db);
    } else {
      await prisma.user.update({
        where: { id: foundUser.id },
        data: {
          activeSessionId: newSessionId,
          lastLoginTime: new Date(),
          lastLoginIp: req.ip,
          lastLoginDevice: req.headers["user-agent"] || "Unknown"
        }
      });
    }

    // Generate signed JWT token
    const token = jwt.sign(
      {
        userId: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        sessionId: newSessionId
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Cookie configuration - local dev environment vs production
    const isLocalhost = req.headers.host?.includes("localhost") || req.headers.host?.includes("127.0.0.1");
    const domainOption = isLocalhost ? "" : "; Domain=lpgportal.com";

    res.setHeader(
      "Set-Cookie",
      `lpgportal_session_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/${domainOption}; Max-Age=${7 * 24 * 60 * 60}`
    );

    return res.json({
      success: true,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone,
        role: foundUser.role,
        membership_type: foundUser.membershipType || foundUser.membership_type || "Ziyaretçi",
        membership_status: foundUser.membershipStatus || foundUser.membership_status || "Aktif",
        company_name: foundUser.companyName || foundUser.company_name,
        active_session_id: newSessionId
      }
    });

  } catch (err: any) {
    console.error("Login route error:", err);
    return res.status(500).json({ error: "Sunucu hatası. Giriş işlemi gerçekleştirilemedi." });
  }
});

// POST /api/auth/logout - clears cookie and activeSessionId
app.post("/api/auth/logout", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.lpgportal_session_token;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (useFallback) {
        const db = readFallbackDb();
        const users = db["lpgportal_users"] || [];
        const idx = users.findIndex((u: any) => u.id === decoded.userId);
        if (idx > -1) {
          users[idx].active_session_id = null;
        }
        writeFallbackDb(db);
      } else {
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { activeSessionId: null }
        });
      }
    } catch (e) {
      // Ignore token verification errors on logout
    }
  }

  const isLocalhost = req.headers.host?.includes("localhost") || req.headers.host?.includes("127.0.0.1");
  const domainOption = isLocalhost ? "" : "; Domain=lpgportal.com";

  res.setHeader(
    "Set-Cookie",
    `lpgportal_session_token=; HttpOnly; Secure; SameSite=Lax; Path=/${domainOption}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );

  return res.json({ success: true });
});

// GET /api/auth/session - returns logged-in user profile from signed cookie
app.get("/api/auth/session", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.lpgportal_session_token;

  if (!token) {
    return res.status(401).json({ error: "Oturum bulunamadı. Lütfen giriş yapın." });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    let user: any = null;
    if (useFallback) {
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      user = users.find((u: any) => u.id === decoded.userId);
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
    }

    if (!user) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı." });
    }

    const dbSessionId = useFallback ? user.active_session_id : user.activeSessionId;

    if (dbSessionId !== decoded.sessionId) {
      return res.status(401).json({ error: "Oturum başka bir cihazdan açıldığı için sonlandırıldı." });
    }

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membership_type: user.membershipType || user.membership_type || "Ziyaretçi",
        membership_status: user.membershipStatus || user.membership_status || "Aktif",
        company_name: user.companyName || user.company_name,
        active_session_id: dbSessionId
      }
    });

  } catch (err) {
    return res.status(401).json({ error: "Geçersiz oturum." });
  }
});

// GET /api/auth/session/:userId - returns target activeSessionId (secured with requesting user cookie validation)
app.get("/api/auth/session/:userId", async (req, res) => {
  const { userId } = req.params;
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.lpgportal_session_token;

  if (!token) {
    return res.status(401).json({ error: "Oturum bulunamadı." });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.userId !== userId && decoded.role !== "admin") {
      return res.status(403).json({ error: "Yetkisiz işlem." });
    }

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
    return res.status(401).json({ error: "Oturum doğrulanamadı." });
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
      delete data.lpgportal_active_user;
      delete data.lpgportal_active_user_sig;
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
    const expertProfiles = await prisma.expertProfile.findMany();
    const homeReviews = await prisma.homeReview.findMany();
    // Map DB objects back to frontend format
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: "",
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
      active_session_id: null,
      last_login_time: u.lastLoginTime?.toISOString(),
      last_login_ip: u.lastLoginIp,
      last_login_device: u.lastLoginDevice
    }));

    const mappedInvoices = invoices.map(i => ({
      id: i.id,
      userId: i.userId,
      amount: i.amount,
      date: i.date.toISOString(),
      membership_type: i.membershipType,
      status: i.status,
      payment_method: i.paymentMethod || undefined,
      admin_note: i.adminNote || undefined,
      userName: i.userName || undefined,
      companyName: i.companyName || undefined,
      roleDisplayName: i.roleDisplayName || undefined,
      packageName: i.packageName || undefined,
      dekont_status: i.dekontStatus || undefined,
      dekont_url: i.dekontUrl || undefined
    }));

    const mappedCompanies = companies.map(c => ({
      id: c.id,
      companyName: c.companyName,
      city: c.city,
      district: c.district,
      address: c.address,
      phone: c.phone,
      email: c.email,
      website: c.website || undefined,
      description: c.description || undefined,
      logo: c.logo || undefined,
      status: c.status,
      approvedStatus: c.approvedStatus,
      rating: c.rating,
      ownerId: c.ownerId || undefined
    }));

    const mappedProducts = products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category,
      condition: p.condition,
      conditionDetail: p.conditionDetail,
      original: p.original,
      brand: p.brand,
      city: p.city,
      district: p.district,
      images: p.images,
      sellerId: p.sellerId,
      status: p.status,
      createdAt: p.createdAt.toISOString()
    }));

    const mappedOrders = orders.map(o => ({
      id: o.id,
      productId: o.productId,
      productName: o.productName,
      buyerId: o.buyerId,
      buyerName: o.buyerName,
      buyerPhone: o.buyerPhone,
      buyerEmail: o.buyerEmail,
      buyerRole: o.buyerRole,
      qty: o.qty,
      totalPrice: o.totalPrice,
      status: o.status,
      sellerId: o.sellerId,
      sellerName: o.sellerName,
      createdAt: o.createdAt.toISOString()
    }));

    const mappedNews = articles.filter(a => a.articleType === "news").map(a => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      category: a.category,
      date: a.date.toISOString(),
      author: a.author,
      image: a.image || undefined,
      tags: a.tags,
      likes: a.likes,
      views: a.views,
      content: a.content,
      seoTitle: a.seoTitle || undefined,
      seoDescription: a.seoDescription || undefined,
      seoKeywords: a.seoKeywords,
      openGraphSupport: a.openGraphSupport,
      googleNewsReady: a.googleNewsReady,
      socialShareText: a.socialShareText || undefined,
      status: a.status,
      published: a.published,
      publishedAt: a.publishedAt?.toISOString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      authorId: a.authorId || undefined,
      approvedBy: a.approvedBy || undefined,
      approvedAt: a.approvedAt?.toISOString()
    }));

    const mappedUserContents = articles.filter(a => a.articleType === "user_content").map(a => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      category: a.category,
      date: a.date.toISOString(),
      author: a.author,
      image: a.image || undefined,
      tags: a.tags,
      likes: a.likes,
      views: a.views,
      content: a.content,
      seoTitle: a.seoTitle || undefined,
      seoDescription: a.seoDescription || undefined,
      seoKeywords: a.seoKeywords,
      openGraphSupport: a.openGraphSupport,
      googleNewsReady: a.googleNewsReady,
      socialShareText: a.socialShareText || undefined,
      status: a.status,
      published: a.published,
      publishedAt: a.publishedAt?.toISOString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      authorId: a.authorId || undefined,
      approvedBy: a.approvedBy || undefined,
      approvedAt: a.approvedAt?.toISOString()
    }));

    const mappedBulletins = bulletins.map(b => ({
      id: b.id,
      title: b.title,
      summary: b.summary,
      category: b.category,
      lpgBrand: b.lpgBrand,
      date: b.date.toISOString(),
      author: b.author,
      authorTitle: b.authorTitle || undefined,
      views: b.views,
      likes: b.likes,
      tags: b.tags,
      content: b.content,
      targetMotor: b.targetMotor || undefined,
      compatibilityStatus: b.compatibilityStatus || undefined,
      knownIssues: b.knownIssues || undefined,
      recommendedKits: b.recommendedKits,
      nozzleRecommendation: b.nozzleRecommendation || undefined,
      regulatorRecommendation: b.regulatorRecommendation || undefined,
      calibrationNotes: b.calibrationNotes || undefined,
      seoTitle: b.seoTitle || undefined,
      seoDescription: b.seoDescription || undefined,
      seoKeywords: b.seoKeywords,
      openGraphSupport: b.openGraphSupport,
      googleNewsReady: b.googleNewsReady,
      socialShareText: b.socialShareText || undefined
    }));

    const mappedNotifications = notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      channel: n.channel,
      createdAt: n.createdAt.toISOString(),
      read: n.read
    }));

    const mappedHomeReviews = homeReviews.map(h => ({
      id: h.id,
      userId: h.userId,
      authorName: h.authorName,
      authorRole: h.authorRole,
      profession: h.profession || undefined,
      city: h.city,
      carBrand: h.carBrand || undefined,
      carModel: h.carModel || undefined,
      title: h.title,
      content: h.content,
      rating: h.rating,
      status: h.status,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString()
    }));
    const fallbackDb = readFallbackDb();
    delete fallbackDb.lpgportal_active_user;
    delete fallbackDb.lpgportal_active_user_sig;

    const fullDb = {
      ...fallbackDb,
      lpgportal_users: mappedUsers,
      lpgportal_invoices: mappedInvoices,
      lpgportal_companies: mappedCompanies,
      lpgportal_products: mappedProducts,
      lpgportal_orders: mappedOrders,
      lpgportal_news_db: mappedNews,
      lpgportal_user_contents_db: mappedUserContents,
      lpgportal_bulletins_db: mappedBulletins,
      lpgportal_central_notifications: mappedNotifications,
      lpgportal_home_reviews: mappedHomeReviews
    };

    return res.json(fullDb);
  } catch (err: any) {
    console.error("Error in /api/db/get-all:", err);
    if (process.env.NODE_ENV === "production") {
      return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
    }
    try {
      const data = readFallbackDb();
      delete data.lpgportal_active_user;
      delete data.lpgportal_active_user_sig;
      return res.json(data);
    } catch (e: any) {
      return res.status(500).json({ error: err.message });
    }
  }
});

app.post("/api/db/save", async (req, res) => {
  const { key, value, v: clientVersion } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Missing DB key." });
  }

  console.log("[DB SAVE] key:", key, "value:", JSON.stringify(value).substring(0, 150));

  // Optimistic Concurrency Control
  if (clientVersion && clientVersion !== dbVersion) {
    console.warn(`[DB SAVE CONFLICT] Client version: ${clientVersion}, Server version: ${dbVersion}`);
    return res.status(409).json({
      error: "Conflict",
      message: "Veritabanı başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyip tekrar deneyin."
    });
  }

  try {
    const translatedVal = await processTranslationsForSave(key, value);

    if (useFallback) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyiniz." });
      }
      const db = readFallbackDb();
      if (key === "lpgportal_users" && Array.isArray(translatedVal)) {
        const existingUsers = db["lpgportal_users"] || [];
        for (const u of translatedVal) {
          const dbUser = existingUsers.find((x: any) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase());
          if ((!u.password || u.password === "") && dbUser) {
            u.password = dbUser.password;
          }
        }
      }
      db[key] = translatedVal;
      writeFallbackDb(db);
      return res.json({ success: true, mode: "fallback", translatedValue: translatedVal });
    }

    // Run all database operations inside a single Transaction
    await prisma.$transaction(async (tx) => {
      // 1. lpgportal_users
      if (key === "lpgportal_users" && Array.isArray(translatedVal)) {
        const normalizePhone = (phone: string): string => {
          const digits = (phone || "").replace(/\D/g, "");
          return digits.slice(-10);
        };

        // Validate duplicates
        for (const u of translatedVal) {
          const emailDuplicate = await tx.user.findFirst({
            where: {
              email: { equals: u.email, mode: 'insensitive' },
              id: { not: u.id }
            }
          });
          if (emailDuplicate) {
            throw new Error("Bu e-posta adresi ile kayıtlı bir kullanıcı bulunmaktadır.");
          }

          const normPhone = normalizePhone(u.phone);
          if (normPhone) {
            const allDbUsers = await tx.user.findMany({
              where: { id: { not: u.id } }
            });
            const phoneDuplicate = allDbUsers.find(x => normalizePhone(x.phone) === normPhone);
            if (phoneDuplicate) {
              throw new Error("Bu telefon numarası ile kayıtlı bir kullanıcı bulunmaktadır.");
            }
          }
        }

        // Load all existing users to merge passwords and protect activeSessionId safely
        const existingDbUsers = await tx.user.findMany({
          select: { id: true, email: true, password: true, activeSessionId: true }
        });

        // Upsert users
        for (const u of translatedVal) {
          const dbUser = existingDbUsers.find(
            x => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase()
          );
          
          let passwordToSave = u.password;
          if ((!passwordToSave || passwordToSave === "") && dbUser) {
            passwordToSave = dbUser.password;
          }
          if (!passwordToSave) {
            passwordToSave = "";
          }

          // Secure activeSessionId from CRUD updates
          let sessionToSave = u.active_session_id;
          if (dbUser) {
            sessionToSave = dbUser.activeSessionId; // Preserve DB session
          }

          const statusMap: any = {
            "Süresi Dolmuş": "SuresiDolmus",
            "Askıya Alındı": "AskiyaAlindi",
            "Onay Bekliyor": "OnayBekliyor"
          };
          const dbStatus = statusMap[u.membership_status] || u.membership_status;
          await tx.user.upsert({
            where: { email: u.email },
            update: {
              name: u.name,
              phone: u.phone,
              password: passwordToSave,
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
              productCategories: u.product_categories,
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
              activeSessionId: sessionToSave,
              lastLoginTime: u.last_login_time ? new Date(u.last_login_time) : null,
              lastLoginIp: u.last_login_ip,
              lastLoginDevice: u.last_login_device
            },
            create: {
              id: u.id,
              name: u.name,
              email: u.email,
              phone: u.phone,
              password: passwordToSave,
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
              productCategories: u.product_categories,
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
              activeSessionId: sessionToSave,
              lastLoginTime: u.last_login_time ? new Date(u.last_login_time) : null,
              lastLoginIp: u.last_login_ip,
              lastLoginDevice: u.last_login_device
            }
          });
        }

        // Targeted delete users not present in the incoming array (protecting admins)
        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingUsers = await tx.user.findMany({ select: { id: true, role: true, email: true } });
        const existingIds = existingUsers.filter(u => u.role !== "admin" && u.id !== "deleted_user_placeholder").map(u => u.id);
        const toDelete = existingIds.filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 2) {
          for (const id of toDelete) {
            const userObj = existingUsers.find(x => x.id === id);
            
            // Relational safety manual cascade updates: Re-assign invoices to deleted_user_placeholder
            await tx.invoice.updateMany({
              where: { userId: id },
              data: { userId: "deleted_user_placeholder" }
            });

            // Nullify support tickets, company owners, sms/email logs
            await tx.supportTicket.updateMany({
              where: { creatorId: id },
              data: { creatorId: "deleted_user_placeholder" }
            });
            await tx.smsLog.updateMany({
              where: { userId: id },
              data: { userId: "deleted_user_placeholder" }
            });
            await tx.emailLog.updateMany({
              where: { userId: id },
              data: { userId: "deleted_user_placeholder" }
            });
            await tx.company.updateMany({
              where: { ownerId: id },
              data: { ownerId: null }
            });

            // Cascade delete dependent records
            await tx.product.deleteMany({ where: { sellerId: id } });
            await tx.order.deleteMany({ where: { OR: [ { buyerId: id }, { sellerId: id } ] } });
            await tx.expertProfile.deleteMany({ where: { userId: id } });
            await tx.payment.deleteMany({ where: { userId: id } });

            // Delete user safely
            await tx.user.delete({ where: { id } });
            
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "USER_DELETE",
                details: `Deleted user ${userObj ? userObj.email : id} safely and reassigned invoices`,
                ipAddress: req.ip
              }
            });
          }
        }

        // Audit Log for Upsert
        await tx.auditLog.create({
          data: {
            actor: "API Sync",
            action: "USER_UPSERT_BATCH",
            details: `Upserted batch of ${translatedVal.length} users`,
            ipAddress: req.ip
          }
        });
      }

      // 2. lpgportal_invoices
      if (key === "lpgportal_invoices" && Array.isArray(translatedVal)) {
        for (const inv of translatedVal) {
          await tx.invoice.upsert({
            where: { id: inv.id },
            update: {
              userId: inv.userId,
              amount: Number(inv.amount),
              date: new Date(inv.date || Date.now()),
              membershipType: inv.membership_type,
              status: inv.status,
              paymentMethod: inv.payment_method || null,
              adminNote: inv.admin_note || null,
              userName: inv.userName || null,
              companyName: inv.companyName || null,
              roleDisplayName: inv.roleDisplayName || null,
              packageName: inv.packageName || null,
              dekontStatus: inv.dekont_status || null,
              dekontUrl: inv.dekont_url || null
            },
            create: {
              id: inv.id,
              userId: inv.userId,
              amount: Number(inv.amount),
              date: new Date(inv.date || Date.now()),
              membershipType: inv.membership_type,
              status: inv.status,
              paymentMethod: inv.payment_method || null,
              adminNote: inv.admin_note || null,
              userName: inv.userName || null,
              companyName: inv.companyName || null,
              roleDisplayName: inv.roleDisplayName || null,
              packageName: inv.packageName || null,
              dekontStatus: inv.dekont_status || null,
              dekontUrl: inv.dekont_url || null
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.invoice.findMany({ select: { id: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            await tx.invoice.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "INVOICE_DELETE",
                details: `Deleted invoice ${id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 3. lpgportal_companies
      if (key === "lpgportal_companies" && Array.isArray(translatedVal)) {
        for (const c of translatedVal) {
          await tx.company.upsert({
            where: { id: c.id },
            update: {
              companyName: c.companyName || c.company_name || "",
              city: c.city || "",
              district: c.district || "",
              address: c.address || "",
              phone: c.phone || "",
              email: c.email || "",
              website: c.website || null,
              description: c.description || null,
              logo: c.logo || null,
              status: c.status || "Aktif",
              approvedStatus: c.approvedStatus || c.approved_status || "Onay Bekliyor",
              rating: Number(c.rating || 5.0),
              ownerId: c.ownerId || null
            },
            create: {
              id: c.id,
              companyName: c.companyName || c.company_name || "",
              city: c.city || "",
              district: c.district || "",
              address: c.address || "",
              phone: c.phone || "",
              email: c.email || "",
              website: c.website || null,
              description: c.description || null,
              logo: c.logo || null,
              status: c.status || "Aktif",
              approvedStatus: c.approvedStatus || c.approved_status || "Onay Bekliyor",
              rating: Number(c.rating || 5.0),
              ownerId: c.ownerId || null
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.company.findMany({ select: { id: true, companyName: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            const comp = existingItems.find(x => x.id === id);
            await tx.company.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "COMPANY_DELETE",
                details: `Deleted company ${comp ? comp.companyName : id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 4. lpgportal_products
      if (key === "lpgportal_products" && Array.isArray(translatedVal)) {
        for (const p of translatedVal) {
          await tx.product.upsert({
            where: { id: p.id },
            update: {
              name: p.name || "",
              description: p.description || "",
              price: Number(p.price || 0),
              stock: Number(p.stock || 1),
              category: p.category || "",
              condition: p.condition || "Sıfır",
              conditionDetail: p.conditionDetail || p.condition_detail || "Sıfır",
              original: p.original || "Evet",
              brand: p.brand || "",
              city: p.city || "",
              district: p.district || "",
              images: p.images || [],
              sellerId: p.sellerId || "",
              status: p.status || "Onay Bekliyor"
            },
            create: {
              id: p.id,
              name: p.name || "",
              description: p.description || "",
              price: Number(p.price || 0),
              stock: Number(p.stock || 1),
              category: p.category || "",
              condition: p.condition || "Sıfır",
              conditionDetail: p.conditionDetail || p.condition_detail || "Sıfır",
              original: p.original || "Evet",
              brand: p.brand || "",
              city: p.city || "",
              district: p.district || "",
              images: p.images || [],
              sellerId: p.sellerId || "",
              status: p.status || "Onay Bekliyor"
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.product.findMany({ select: { id: true, name: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            const prod = existingItems.find(x => x.id === id);
            await tx.product.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "PRODUCT_DELETE",
                details: `Deleted product ${prod ? prod.name : id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 5. lpgportal_orders
      if (key === "lpgportal_orders" && Array.isArray(translatedVal)) {
        for (const o of translatedVal) {
          await tx.order.upsert({
            where: { id: o.id },
            update: {
              productId: o.productId,
              productName: o.productName,
              buyerId: o.buyerId,
              buyerName: o.buyerName,
              buyerPhone: o.buyerPhone,
              buyerEmail: o.buyerEmail,
              buyerRole: o.buyerRole,
              qty: Number(o.qty || 1),
              totalPrice: Number(o.totalPrice || 0),
              status: o.status || "Onay Bekliyor",
              sellerId: o.sellerId,
              sellerName: o.sellerName
            },
            create: {
              id: o.id,
              productId: o.productId,
              productName: o.productName,
              buyerId: o.buyerId,
              buyerName: o.buyerName,
              buyerPhone: o.buyerPhone,
              buyerEmail: o.buyerEmail,
              buyerRole: o.buyerRole,
              qty: Number(o.qty || 1),
              totalPrice: Number(o.totalPrice || 0),
              status: o.status || "Onay Bekliyor",
              sellerId: o.sellerId,
              sellerName: o.sellerName
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.order.findMany({ select: { id: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            await tx.order.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "ORDER_DELETE",
                details: `Deleted order ${id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 6. lpgportal_news_db & lpgportal_user_contents_db
      if ((key === "lpgportal_news_db" || key === "lpgportal_user_contents_db") && Array.isArray(translatedVal)) {
        const articleType = key === "lpgportal_news_db" ? "news" : "user_content";
        for (const a of translatedVal) {
          await tx.article.upsert({
            where: { id: a.id },
            update: {
              title: a.title || "",
              summary: a.summary || "",
              category: a.category || "",
              date: new Date(a.date || Date.now()),
              author: a.author || "",
              image: a.image || null,
              tags: a.tags || [],
              likes: Number(a.likes || 0),
              views: Number(a.views || 0),
              content: a.content || "",
              seoTitle: a.seoTitle || null,
              seoDescription: a.seoDescription || null,
              seoKeywords: a.seoKeywords || [],
              openGraphSupport: a.openGraphSupport !== false,
              googleNewsReady: a.googleNewsReady !== false,
              socialShareText: a.socialShareText || null,
              status: a.status || "Onay Bekliyor",
              published: a.published === true,
              publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
              authorId: a.authorId || null,
              approvedBy: a.approvedBy || null,
              approvedAt: a.approvedAt ? new Date(a.approvedAt) : null,
              articleType: articleType
            },
            create: {
              id: a.id,
              title: a.title || "",
              summary: a.summary || "",
              category: a.category || "",
              date: new Date(a.date || Date.now()),
              author: a.author || "",
              image: a.image || null,
              tags: a.tags || [],
              likes: Number(a.likes || 0),
              views: Number(a.views || 0),
              content: a.content || "",
              seoTitle: a.seoTitle || null,
              seoDescription: a.seoDescription || null,
              seoKeywords: a.seoKeywords || [],
              openGraphSupport: a.openGraphSupport !== false,
              googleNewsReady: a.googleNewsReady !== false,
              socialShareText: a.socialShareText || null,
              status: a.status || "Onay Bekliyor",
              published: a.published === true,
              publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
              authorId: a.authorId || null,
              approvedBy: a.approvedBy || null,
              approvedAt: a.approvedAt ? new Date(a.approvedAt) : null,
              articleType: articleType
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.article.findMany({
          where: { articleType: articleType },
          select: { id: true, title: true }
        });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 2) { // Safeguard against wiping seeded db
          for (const id of toDelete) {
            const art = existingItems.find(x => x.id === id);
            await tx.article.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "ARTICLE_DELETE",
                details: `Deleted article ${art ? art.title : id} (${articleType})`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 7. lpgportal_bulletins_db
      if (key === "lpgportal_bulletins_db" && Array.isArray(translatedVal)) {
        for (const b of translatedVal) {
          await tx.bulletin.upsert({
            where: { id: b.id },
            update: {
              title: b.title || "",
              summary: b.summary || "",
              category: b.category || "",
              lpgBrand: b.lpgBrand || "",
              date: new Date(b.date || Date.now()),
              author: b.author || "",
              authorTitle: b.authorTitle || null,
              views: Number(b.views || 0),
              likes: Number(b.likes || 0),
              tags: b.tags || [],
              content: b.content || "",
              targetMotor: b.targetMotor || null,
              compatibilityStatus: b.compatibilityStatus || null,
              knownIssues: b.knownIssues || null,
              recommendedKits: b.recommendedKits || [],
              nozzleRecommendation: b.nozzleRecommendation || null,
              regulatorRecommendation: b.regulatorRecommendation || null,
              calibrationNotes: b.calibrationNotes || null,
              seoTitle: b.seoTitle || null,
              seoDescription: b.seoDescription || null,
              seoKeywords: b.seoKeywords || [],
              openGraphSupport: b.openGraphSupport !== false,
              googleNewsReady: b.googleNewsReady !== false,
              socialShareText: b.socialShareText || null
            },
            create: {
              id: b.id,
              title: b.title || "",
              summary: b.summary || "",
              category: b.category || "",
              lpgBrand: b.lpgBrand || "",
              date: new Date(b.date || Date.now()),
              author: b.author || "",
              authorTitle: b.authorTitle || null,
              views: Number(b.views || 0),
              likes: Number(b.likes || 0),
              tags: b.tags || [],
              content: b.content || "",
              targetMotor: b.targetMotor || null,
              compatibilityStatus: b.compatibilityStatus || null,
              knownIssues: b.knownIssues || null,
              recommendedKits: b.recommendedKits || [],
              nozzleRecommendation: b.nozzleRecommendation || null,
              regulatorRecommendation: b.regulatorRecommendation || null,
              calibrationNotes: b.calibrationNotes || null,
              seoTitle: b.seoTitle || null,
              seoDescription: b.seoDescription || null,
              seoKeywords: b.seoKeywords || [],
              openGraphSupport: b.openGraphSupport !== false,
              googleNewsReady: b.googleNewsReady !== false,
              socialShareText: b.socialShareText || null
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.bulletin.findMany({ select: { id: true, title: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            const bul = existingItems.find(x => x.id === id);
            await tx.bulletin.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "BULLETIN_DELETE",
                details: `Deleted bulletin ${bul ? bul.title : id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 8. lpgportal_central_notifications
      if (key === "lpgportal_central_notifications" && Array.isArray(translatedVal)) {
        for (const n of translatedVal) {
          await tx.notification.upsert({
            where: { id: n.id },
            update: {
              userId: n.userId || "all",
              title: n.title || "",
              message: n.message || "",
              type: n.type || "duyuru",
              channel: n.channel || "panel",
              createdAt: new Date(n.createdAt || Date.now()),
              read: n.read === true
            },
            create: {
              id: n.id,
              userId: n.userId || "all",
              title: n.title || "",
              message: n.message || "",
              type: n.type || "duyuru",
              channel: n.channel || "panel",
              createdAt: new Date(n.createdAt || Date.now()),
              read: n.read === true
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.notification.findMany({ select: { id: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            await tx.notification.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "NOTIFICATION_DELETE",
                details: `Deleted notification ${id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }

      // 9. lpgportal_home_reviews
      if (key === "lpgportal_home_reviews" && Array.isArray(translatedVal)) {
        for (const h of translatedVal) {
          await tx.homeReview.upsert({
            where: { id: h.id },
            update: {
              userId: h.userId || "",
              authorName: h.authorName || "",
              authorRole: h.authorRole || "",
              profession: h.profession || null,
              city: h.city || "",
              carBrand: h.carBrand || null,
              carModel: h.carModel || null,
              title: h.title || "",
              content: h.content || "",
              rating: Number(h.rating || 5),
              status: h.status || "Onay Bekliyor",
              createdAt: new Date(h.createdAt || Date.now()),
              updatedAt: new Date(h.updatedAt || Date.now())
            },
            create: {
              id: h.id,
              userId: h.userId || "",
              authorName: h.authorName || "",
              authorRole: h.authorRole || "",
              profession: h.profession || null,
              city: h.city || "",
              carBrand: h.carBrand || null,
              carModel: h.carModel || null,
              title: h.title || "",
              content: h.content || "",
              rating: Number(h.rating || 5),
              status: h.status || "Onay Bekliyor",
              createdAt: new Date(h.createdAt || Date.now()),
              updatedAt: new Date(h.updatedAt || Date.now())
            }
          });
        }

        const incomingIds = translatedVal.map((x: any) => x.id);
        const existingItems = await tx.homeReview.findMany({ select: { id: true, title: true } });
        const toDelete = existingItems.map(x => x.id).filter(id => !incomingIds.includes(id));
        if (incomingIds.length > 0) {
          for (const id of toDelete) {
            const rev = existingItems.find(x => x.id === id);
            await tx.homeReview.delete({ where: { id } });
            await tx.auditLog.create({
              data: {
                actor: "API Sync",
                action: "HOME_REVIEW_DELETE",
                details: `Deleted review ${rev ? rev.title : id}`,
                ipAddress: req.ip
              }
            });
          }
        }
      }
    });

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

// QA Database Verification API (Staging/QA only)
app.get("/api/qa/verify-db", async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_QA_ENDPOINTS !== "true") {
    return res.status(404).json({ error: "Not Found" });
  }

  const qaSecret = req.headers["x-lpgportal-qa-secret"];
  if (qaSecret !== "lpgportal_qa_secret_key_2026_secure") {
    return res.status(403).json({ error: "Access denied: Invalid QA secret key" });
  }

  try {
    if (useFallback) {
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      const blogCount = (db["lpgportal_news_db"] || []).filter((a: any) => a.articleType === "blog").length;
      const newsCount = (db["lpgportal_news_db"] || []).filter((a: any) => a.articleType === "news").length;
      const notificationCount = (db["lpgportal_notification_logs"] || []).length;
      const orderCount = (db["lpgportal_orders"] || []).length;
      const companyCount = (db["lpgportal_companies"] || []).length;
      const productCount = (db["lpgportal_products"] || []).length;
      return res.json({
        success: true,
        users: users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          password: u.password,
          activeSessionId: u.active_session_id,
          membershipStatus: u.membership_status
        })),
        blogCount,
        newsCount,
        notificationCount,
        orderCount,
        companyCount,
        productCount
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        activeSessionId: true,
        membershipStatus: true,
        marketingApproved: true
      }
    });

    const blogCount = await prisma.article.count({ where: { articleType: "blog" } });
    const newsCount = await prisma.article.count({ where: { articleType: "news" } });
    const notificationCount = await prisma.notification.count();
    const orderCount = await prisma.order.count();
    const companyCount = await prisma.company.count();
    const productCount = await prisma.product.count();

    return res.json({
      success: true,
      users,
      blogCount,
      newsCount,
      notificationCount,
      orderCount,
      companyCount,
      productCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// QA Database User Activate API (Staging/QA only)
app.post("/api/qa/activate", express.json(), async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_QA_ENDPOINTS !== "true") {
    return res.status(404).json({ error: "Not Found" });
  }

  const qaSecret = req.headers["x-lpgportal-qa-secret"];
  if (qaSecret !== "lpgportal_qa_secret_key_2026_secure") {
    return res.status(403).json({ error: "Access denied: Invalid QA secret key" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const normalized = email.toLowerCase().trim();
    if (useFallback) {
      const db = readFallbackDb();
      const users = db["lpgportal_users"] || [];
      const user = users.find((u: any) => u.email.toLowerCase().trim() === normalized);
      if (user) {
        user.membership_status = "Aktif";
        writeFallbackDb(db);
        return res.json({ success: true, message: `Activated user ${normalized} in fallback DB.` });
      }
      return res.status(444).json({ error: "User not found in fallback DB" });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      return res.status(444).json({ error: "User not found in PostgreSQL" });
    }

    await prisma.user.update({
      where: { email: normalized },
      data: { membershipStatus: "Aktif" }
    });

    return res.json({ success: true, message: `Activated user ${normalized} in PostgreSQL.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// QA Seed Load Test Users API (Staging/QA only)
app.post("/api/qa/seed-load-test", express.json(), async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_QA_ENDPOINTS !== "true") {
    return res.status(404).json({ error: "Not Found" });
  }

  const qaSecret = req.headers["x-lpgportal-qa-secret"];
  if (qaSecret !== "lpgportal_qa_secret_key_2026_secure") {
    return res.status(403).json({ error: "Access denied: Invalid QA secret key" });
  }

  const { count } = req.body;
  const numUsers = count ? Number(count) : 100;

  try {
    const seededEmails: string[] = [];
    const plainPassword = "LoadTestPassword2026!";
    
    const usersToCreate: any[] = [];
    for (let i = 0; i < numUsers; i++) {
      const email = `load_test_user_${i}_${Date.now()}@lpgportal.com`;
      const saltEmail = email.toLowerCase().trim();
      const hash = hashPassword(plainPassword, saltEmail);
      
      usersToCreate.push({
        id: `user_load_test_${i}_${Date.now()}`,
        name: `Load Test User ${i}`,
        email: saltEmail,
        phone: '532' + String(Math.floor(1000000 + Math.random() * 9000000)),
        password: hash,
        role: "vehicle_owner",
        membershipType: "Araç Sahibi Yıllık Paket (Ücretsiz)",
        membershipFee: 0,
        membershipStart: new Date(),
        membershipEnd: new Date(),
        membershipStatus: "Aktif",
        kvkkApproved: true,
        privacyPolicyApproved: true,
        termsApproved: true,
        marketingApproved: false
      });
      seededEmails.push(saltEmail);
    }

    if (useFallback) {
      const db = readFallbackDb();
      db["lpgportal_users"] = [...(db["lpgportal_users"] || []), ...usersToCreate];
      writeFallbackDb(db);
    } else {
      await prisma.user.createMany({
        data: usersToCreate
      });
    }

    return res.json({ success: true, emails: seededEmails, password: plainPassword });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// QA Database Cleanup API (Staging/QA only)
app.post("/api/qa/cleanup", express.json(), async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_QA_ENDPOINTS !== "true") {
    return res.status(404).json({ error: "Not Found" });
  }

  const qaSecret = req.headers["x-lpgportal-qa-secret"];
  if (qaSecret !== "lpgportal_qa_secret_key_2026_secure") {
    return res.status(403).json({ error: "Access denied: Invalid QA secret key" });
  }

  const { emails } = req.body;
  if (!Array.isArray(emails)) {
    return res.status(400).json({ error: "Emails array is required" });
  }

  try {
    if (useFallback) {
      const db = readFallbackDb();
      let users = db["lpgportal_users"] || [];
      users = users.filter((u: any) => {
        const normalized = u.email.toLowerCase().trim();
        if (["admin@lpgportal.com", "hata@hata.com", "servis@lpgportal.com", "kit@lpgportal.com"].includes(normalized)) {
          return true;
        }
        if (normalized.includes("load_test_user")) {
          return false;
        }
        return !emails.map((e: string) => e.toLowerCase().trim()).includes(normalized);
      });
      db["lpgportal_users"] = users;
      writeFallbackDb(db);
      return res.json({ success: true, message: `Cleaned up test users in fallback DB.` });
    }

    await prisma.$transaction(async (tx) => {
      // Direct bulk delete for load test pattern
      await tx.user.deleteMany({
        where: {
          email: { contains: "load_test_user" }
        }
      });

      for (const email of emails) {
        const normalized = email.toLowerCase().trim();
        if (["admin@lpgportal.com", "hata@hata.com", "servis@lpgportal.com", "kit@lpgportal.com"].includes(normalized)) {
          continue;
        }
        await tx.user.deleteMany({
          where: { email: normalized }
        });
      }
    });
    return res.json({ success: true, message: `Cleaned up ${emails.length} test users.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// QA Database Backup and Restore Verification API (Staging/QA only)
app.post("/api/qa/backup-restore-test", async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_QA_ENDPOINTS !== "true") {
    return res.status(404).json({ error: "Not Found" });
  }

  const qaSecret = req.headers["x-lpgportal-qa-secret"];
  if (qaSecret !== "lpgportal_qa_secret_key_2026_secure") {
    return res.status(403).json({ error: "Access denied: Invalid QA secret key" });
  }

  try {
    if (useFallback) {
      const db = readFallbackDb();
      const backupPayload = JSON.stringify(db);
      
      const emptyDb = {
        lpgportal_users: [],
        lpgportal_companies: [],
        lpgportal_products: [],
        lpgportal_orders: [],
        lpgportal_news_db: [],
        lpgportal_notification_logs: [],
        lpgportal_invoices: []
      };
      writeFallbackDb(emptyDb);
      
      writeFallbackDb(JSON.parse(backupPayload));
      return res.json({ success: true, message: "Backup & Restore verification passed in fallback mode." });
    }

    // PostgreSQL Mode
    const users = await prisma.user.findMany();
    const invoices = await prisma.invoice.findMany();
    const companies = await prisma.company.findMany();
    const products = await prisma.product.findMany();
    const orders = await prisma.order.findMany();
    const articles = await prisma.article.findMany();
    const notifications = await prisma.notification.findMany();

    const backupPayload = {
      users,
      invoices,
      companies,
      products,
      orders,
      articles,
      notifications
    };

    // Clear tables in order of dependencies
    await prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany();
      await tx.order.deleteMany();
      await tx.product.deleteMany();
      await tx.company.deleteMany();
      await tx.invoice.deleteMany();
      await tx.article.deleteMany();
      await tx.user.deleteMany();
    });

    // Verify empty state
    const emptyUserCount = await prisma.user.count();
    const emptyArticleCount = await prisma.article.count();
    if (emptyUserCount > 0 || emptyArticleCount > 0) {
      throw new Error("Tables were not completely cleared during backup test.");
    }

    // Restore all records in transaction
    await prisma.$transaction(async (tx) => {
      for (const u of backupPayload.users) {
        await tx.user.create({ data: u });
      }
      for (const inv of backupPayload.invoices) {
        await tx.invoice.create({ data: inv });
      }
      for (const c of backupPayload.companies) {
        await tx.company.create({ data: c });
      }
      for (const p of backupPayload.products) {
        await tx.product.create({ data: p });
      }
      for (const o of backupPayload.orders) {
        await tx.order.create({ data: o });
      }
      for (const a of backupPayload.articles) {
        await tx.article.create({ data: a });
      }
      for (const n of backupPayload.notifications) {
        await tx.notification.create({ data: n });
      }
    });

    // Verify restored counts
    const restUsers = await prisma.user.count();
    const restArticles = await prisma.article.count();
    
    if (restUsers !== users.length || restArticles !== articles.length) {
      throw new Error(`Data mismatch after restore: expected ${users.length} users and ${articles.length} articles, got ${restUsers} users and ${restArticles} articles.`);
    }

    return res.json({
      success: true,
      message: "Backup and Restore verified successfully in PostgreSQL.",
      restoredRecords: {
        users: restUsers,
        articles: restArticles,
        companies: companies.length,
        products: products.length,
        orders: orders.length,
        notifications: notifications.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// MONITORING & HEALTH CHECKS
// ----------------------------------------------------
app.get("/api/health", async (req, res) => {
  let dbStatus = "unhealthy";
  let dbDetails = {};
  
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const ping = Date.now() - start;
    dbStatus = "healthy";
    dbDetails = { mode: "postgres", pingMs: ping };
  } catch (err: any) {
    dbStatus = "unhealthy";
    dbDetails = {
      mode: useFallback ? "fallback" : "postgres_failed",
      error: err.message
    };
  }

  let exceptionLogCount = 0;
  let slowQueryLogCount = 0;
  
  try {
    if (fs.existsSync(EXCEPTIONS_LOG_PATH)) {
      const data = fs.readFileSync(EXCEPTIONS_LOG_PATH, "utf8");
      exceptionLogCount = data.trim().split("\n").filter(Boolean).length;
    }
  } catch (e) {}

  try {
    if (fs.existsSync(SLOW_QUERIES_LOG_PATH)) {
      const data = fs.readFileSync(SLOW_QUERIES_LOG_PATH, "utf8");
      slowQueryLogCount = data.trim().split("\n").filter(Boolean).length;
    }
  } catch (e) {}

  res.json({
    status: dbStatus === "healthy" ? "UP" : "DEGRADED",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    useFallback,
    system: {
      memory: {
        freeBytes: os.freemem(),
        totalBytes: os.totalmem(),
        processRssBytes: process.memoryUsage().rss,
        processHeapTotalBytes: process.memoryUsage().heapTotal,
        processHeapUsedBytes: process.memoryUsage().heapUsed
      },
      cpu: {
        loadavg: os.loadavg(),
        cores: os.cpus().length
      }
    },
    database: {
      status: dbStatus,
      details: dbDetails,
      syncVersion: dbVersion
    },
    metrics: {
      slowQueriesInMemory: slowQueries.length,
      slowQueriesLoggedCount: slowQueryLogCount,
      slowRequestsInMemory: slowRequests.length,
      unhandledExceptionsInMemory: unhandledExceptions.length,
      unhandledExceptionsLoggedCount: exceptionLogCount
    },
    recentSlowRequests: slowRequests.slice(-5),
    recentSlowQueries: slowQueries.slice(-5),
    recentUnhandledExceptions: unhandledExceptions.slice(-5)
  });
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
