-- 1. Create Custom Types / Check Constraints mimicking Enums
-- PostgreSQL Roles check
-- PostgreSQL MembershipStatus check

-- Create User Table
CREATE TABLE IF NOT EXISTS "User" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'visitor' CHECK ("role" IN ('visitor', 'vehicle_owner', 'dealer', 'engineer', 'manufacturer', 'admin')),
    "membershipType" VARCHAR(255) NOT NULL,
    "membershipFee" DOUBLE PRECISION NOT NULL,
    "membershipStart" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membershipEnd" TIMESTAMP WITH TIME ZONE NOT NULL,
    "membershipStatus" VARCHAR(50) NOT NULL DEFAULT 'OnayBekliyor' CHECK ("membershipStatus" IN ('Aktif', 'Pasif', 'SuresiDolmus', 'Beklemede', 'Iptal', 'OnayBekliyor', 'AskiyaAlindi')),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Custom fields
    "companyName" VARCHAR(255),
    "authorizedName" VARCHAR(255),
    "taxInfo" VARCHAR(100),
    "website" VARCHAR(255),
    "city" VARCHAR(100),
    "district" VARCHAR(100),
    "expertise" VARCHAR(255),
    "brandName" VARCHAR(255),
    "authorizedPerson" VARCHAR(255),
    "productCategories" TEXT,
    "workingBrands" TEXT[] DEFAULT '{}',

    -- KVKK Consent
    "kvkkApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "privacyPolicyApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "termsApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "marketingApproved" BOOLEAN NOT NULL DEFAULT FALSE,
    "approvalDate" TIMESTAMP WITH TIME ZONE,
    "ipAddress" VARCHAR(45),

    -- Logo
    "logoUrl" VARCHAR(500),
    "noLogo" BOOLEAN NOT NULL DEFAULT TRUE,
    "logoType" VARCHAR(50) NOT NULL DEFAULT 'auto'
);

-- Create Invoice Table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membershipType" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL -- 'Ödendi', 'İade', 'İptal'
);

-- Create Company Table
CREATE TABLE IF NOT EXISTS "Company" (
    "id" VARCHAR(255) PRIMARY KEY,
    "companyName" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255),
    "description" TEXT,
    "logo" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Pasif'
    "approvedStatus" VARCHAR(50) NOT NULL DEFAULT 'Onay Bekliyor', -- 'Onaylandı', 'Onay Bekliyor', 'Reddedildi'
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "ownerId" VARCHAR(255) REFERENCES "User"("id") ON DELETE SET NULL
);

-- Create Product Table
CREATE TABLE IF NOT EXISTS "Product" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "category" VARCHAR(100) NOT NULL,
    "condition" VARCHAR(50) NOT NULL, -- 'Sıfır', '2. El'
    "conditionDetail" VARCHAR(100) NOT NULL, -- 'Sıfır', 'Çok İyi', etc.
    "original" VARCHAR(10) NOT NULL, -- 'Evet', 'Hayır'
    "brand" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "images" TEXT[] DEFAULT '{}',
    "sellerId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Onay Bekliyor',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Table
CREATE TABLE IF NOT EXISTS "Order" (
    "id" VARCHAR(255) PRIMARY KEY,
    "productId" VARCHAR(255) NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "buyerId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "buyerName" VARCHAR(255) NOT NULL,
    "buyerPhone" VARCHAR(50) NOT NULL,
    "buyerEmail" VARCHAR(255) NOT NULL,
    "buyerRole" VARCHAR(50) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Onay Bekliyor', -- 'Onay Bekliyor', etc.
    "sellerId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "sellerName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Article Table
CREATE TABLE IF NOT EXISTS "Article" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" VARCHAR(255) NOT NULL,
    "image" VARCHAR(500),
    "tags" VARCHAR(100)[] DEFAULT '{}',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL,
    "seoTitle" VARCHAR(255),
    "seoDescription" VARCHAR(255),
    "seoKeywords" VARCHAR(255)[] DEFAULT '{}',
    "openGraphSupport" BOOLEAN NOT NULL DEFAULT TRUE,
    "googleNewsReady" BOOLEAN NOT NULL DEFAULT TRUE,
    "socialShareText" TEXT
);

-- Create Bulletin Table
CREATE TABLE IF NOT EXISTS "Bulletin" (
    "id" VARCHAR(255) PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "lpgBrand" VARCHAR(100) NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" VARCHAR(255) NOT NULL,
    "authorTitle" VARCHAR(255),
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "tags" VARCHAR(100)[] DEFAULT '{}',
    "content" TEXT NOT NULL,
    "targetMotor" VARCHAR(255),
    "compatibilityStatus" VARCHAR(255),
    "knownIssues" TEXT,
    "recommendedKits" VARCHAR(255)[] DEFAULT '{}',
    "nozzleRecommendation" VARCHAR(50),
    "regulatorRecommendation" VARCHAR(50),
    "calibrationNotes" TEXT,
    "seoTitle" VARCHAR(255),
    "seoDescription" VARCHAR(255),
    "seoKeywords" VARCHAR(255)[] DEFAULT '{}',
    "openGraphSupport" BOOLEAN NOT NULL DEFAULT TRUE,
    "googleNewsReady" BOOLEAN NOT NULL DEFAULT TRUE,
    "socialShareText" TEXT
);

-- Create Notification Table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL, -- 'all' or specific User ID
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL, -- 'teklif', 'mesaj', 'siparis', etc.
    "channel" VARCHAR(50) NOT NULL, -- 'sms', 'email', 'panel', 'all'
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create SmsLog Table
CREATE TABLE IF NOT EXISTS "SmsLog" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) REFERENCES "User"("id") ON DELETE SET NULL,
    "phone" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL, -- 'Gönderildi', 'Hata', 'Beklemede'
    "error" TEXT
);

-- Create EmailLog Table
CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) REFERENCES "User"("id") ON DELETE SET NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL, -- 'Gönderildi', 'Hata', 'Beklemede'
    "error" TEXT
);

-- Create Payment Table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" VARCHAR(255) PRIMARY KEY,
    "userId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" VARCHAR(50) NOT NULL, -- 'Başarılı', 'Başarısız', 'İade', 'İptal'
    "transactionId" VARCHAR(255) UNIQUE,
    "method" VARCHAR(100) NOT NULL DEFAULT 'Kredi Kartı',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "couponCode" VARCHAR(100)
);

-- Create Coupon Table
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" VARCHAR(255) PRIMARY KEY,
    "code" VARCHAR(100) UNIQUE NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    "expiry" TIMESTAMP WITH TIME ZONE,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usesCount" INTEGER NOT NULL DEFAULT 0
);

-- Create SupportTicket Table
CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" VARCHAR(255) PRIMARY KEY,
    "creatorId" VARCHAR(255),
    "creatorName" VARCHAR(255) NOT NULL,
    "creatorPhone" VARCHAR(50) NOT NULL,
    "creatorEmail" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Yeni Talep', -- 'Yeni Talep', etc.
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Review Table
CREATE TABLE IF NOT EXISTS "Review" (
    "id" VARCHAR(255) PRIMARY KEY,
    "companyId" VARCHAR(255) NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
    "userName" VARCHAR(255) NOT NULL,
    "userRole" VARCHAR(50) NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create ExpertProfile Table
CREATE TABLE IF NOT EXISTS "ExpertProfile" (
    "id" VARCHAR(255) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "expertise" VARCHAR(255) NOT NULL,
    "experience" VARCHAR(50) NOT NULL,
    "brands" VARCHAR(100)[] DEFAULT '{}',
    "city" VARCHAR(100) NOT NULL,
    "about" TEXT NOT NULL,
    "certificates" VARCHAR(255)[] DEFAULT '{}',
    "photo" VARCHAR(500),
    "userId" VARCHAR(255) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'Aktif', -- 'Aktif', 'Pasif'
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for speed
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_company_city" ON "Company"("city");
CREATE INDEX IF NOT EXISTS "idx_product_seller" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_order_buyer" ON "Order"("buyerId");
CREATE INDEX IF NOT EXISTS "idx_order_seller" ON "Order"("sellerId");
CREATE INDEX IF NOT EXISTS "idx_notification_user" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_sms_log_phone" ON "SmsLog"("phone");
CREATE INDEX IF NOT EXISTS "idx_email_log_email" ON "EmailLog"("email");
