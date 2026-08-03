import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { createContext, useContext, useState, useEffect } from "react";



export type Language = "tr" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateEntity: <T extends Record<string, any>>(obj: T, field: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Detector logic: If Turkish user/browser -> TR, otherwise EN
const detectDefaultLanguage = (): Language => {
  const stored = localStorage.getItem("lpgportal_lang");
  if (stored === "tr" || stored === "en") return stored as Language;

  // Browser language check
  const isTrLocale = navigator.languages
    ? navigator.languages.some(lang => lang.toLowerCase().startsWith("tr"))
    : (navigator.language || "").toLowerCase().startsWith("tr");

  // Timezone check as country-proxy (Istanbul/Turkey timezones)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const isTrTz = tz.toLowerCase().includes("istanbul") || 
                  tz.toLowerCase().includes("turkey") || 
                  tz.toLowerCase().includes("europe/istanbul");

  return (isTrLocale || isTrTz) ? "tr" : "en";
};

// Static Translation Dictionary
const DICTIONARY: Record<string, { tr: string; en: string }> = {
  // Navigation Menu
  "nav.dashboard": { tr: "Ana Sayfa", en: "Home" },
  "nav.compatibility": { tr: "LPG Uyumluluk", en: "LPG Compatibility" },
  "nav.companies": { tr: "Firma Rehberi", en: "Company Directory" },
  "nav.teklif": { tr: "Teklif Al", en: "Get Quote" },
  "nav.supportCenter": { tr: "Destek Merkezi", en: "Support Center" },
  "nav.contact": { tr: "İletişim", en: "Contact" },
  "nav.blogSpace": { tr: "Haber & Bülten", en: "News & Bulletins" },
  "nav.phase2": { tr: "Eğitim & Kariyer", en: "Training & Career" },
  "nav.marketplace": { tr: "Market", en: "Marketplace" },
  "nav.member_panel": { tr: "Üye Paneli", en: "Member Portal" },
  "nav.my_account": { tr: "Hesabım", en: "My Account" },
  "nav.login_register": { tr: "Giriş / Üye Ol", en: "Login / Register" },
  "nav.logout": { tr: "Çıkış Yap", en: "Sign Out" },
  "nav.prices_banner": { tr: "LPG PORTAL Güncel Fiyatlar", en: "LPG PORTAL Real-time Prices" },
  "nav.istanbul": { tr: "İstanbul", en: "Istanbul" },
  "nav.ankara": { tr: "Ankara", en: "Ankara" },
  "nav.izmir": { tr: "İzmir", en: "Izmir" },
  "nav.savings": { tr: "LPG Tasarrufu", en: "LPG Savings" },
  "nav.between": { tr: "Arası", en: "Up To" },
  "nav.login_role": { tr: "Giriş Rolü", en: "Login Role" },
  "nav.role_visitor": { tr: "Ziyaretçi (Ücretsiz)", en: "Visitor (Free)" },
  "nav.role_owner": { tr: "Araç Sahibi", en: "Vehicle Owner" },
  "nav.role_dealer": { tr: "Firma (Bayi / Usta)", en: "Dealer (Service Center)" },
  "nav.role_engineer": { tr: "LPG Mühendisi / Usta", en: "LPG Engineer / Inspector" },
  "nav.role_manufacturer": { tr: "Kit Üreticisi", en: "Kit Manufacturer" },

  // Home Page
  "home.hero_title": { tr: "Türkiye'nin Güvenilir LPG Dönüşüm Portalı", en: "Turkey's Trusted LPG Conversion Portal" },
  "home.hero_desc": { tr: "Aracınızın motor koduna göre %100 uyumlu LPG kitlerini sorgulayın, bölgenizdeki TSE Hizmet Yeterlilik Belgeli yetkili montaj bayilerinden korumalı kör ihale (blind) yöntemiyle anında fiyat teklifi toplayın.", en: "Find 100% compatible LPG kits based on your engine code. Securely collect certified quotes from authorized local service centers using our private blind-bid platform." },
  "home.check_compatibility": { tr: "LPG Uyumluluk Sorgula", en: "Check LPG Compatibility" },
  "home.explore_directory": { tr: "Firma Rehberini İncele", en: "Explore Company Directory" },
  "home.active_users": { tr: "Aktif Kullanıcı", en: "Active Users" },
  "home.authorized_bayi": { tr: "Yetkili Bayi & Usta", en: "Authorized Dealers" },
  "home.success_rate": { tr: "Kusursuz Dönüşüm Oranı", en: "Successful Conversions" },
  "home.verified_reviews": { tr: "Doğrulanmış Müşteri Yorumu", en: "Verified Reviews" },
  "home.savings_calculator": { tr: "LPG Yakıt Tasarrufu Hesaplama", en: "LPG Fuel Savings Calculator" },
  "home.calc_sub": { tr: "Mevcut benzin tüketiminizi girerek, yıllık lpg tasarrufunuzu ve amortisman sürenizi anında görün.", en: "Enter your gasoline consumption to instantly view your annual savings and kit amortization payback period." },
  "home.annual_mil": { tr: "Yıllık Ortalama Kilometre (KM)", en: "Average Annual Kilometre (KM)" },
  "home.gas_cons": { tr: "Yüz Kilometrede Ortalama Benzin Tüketimi (Litre/100 KM)", en: "Average Gasoline Consumption (Liters/100 KM)" },
  "home.gas_price": { tr: "Benzincide Güncel Litre Fiyatı", en: "Current Gasoline Price / Liter" },
  "home.lpg_price": { tr: "LPG İstasyonunda Güncel Litre Fiyatı", en: "Current LPG Price / Liter" },
  "home.kit_cost_est": { tr: "Düşünülen Ortalama Kit Montaj Bedeli (Örn: 22000)", en: "Estimated Kit & Installation Cost (e.g. 22000)" },
  "home.calc_results": { tr: "Hesaplama Sonuçları (Yıllık Tasarrufunuz)", en: "Calculated Savings Report" },
  "home.gas_cost_ann": { tr: "Yıllık Benzin Masrafı", en: "Annual Gasoline Cost" },
  "home.lpg_cost_ann": { tr: "Yıllık Tahmini LPG Masrafı (Krank Isınma Entegrasyonuyla)", en: "Annual Predicted LPG Cost (Including Warmups)" },
  "home.net_savings": { tr: "Yıllık Net Para Tasarrufunuz", en: "Annual Net Money Saved" },
  "home.payback_period": { tr: "Amortisman ve Yatırım Geri Dönüş Süresi", en: "Amortization & Payback Time" },
  "home.months": { tr: "Ay", en: "months" },
  "home.amort_warn": { tr: "Açıklama: Sıralı sistem motorlar ilk çalıştırmada motor suyu 35°C sıcaklığa ulaşana kadar benzin tüketir. Hesaplamaya bu simülasyon dahil edilmiştir.", en: "Note: Sequential gas injection systems consume petrol on cold startups until the cooling water expands to 35°C. This starter simulation is factored on the estimation." },
  "home.co2_reduction": { tr: "Yıllık CO2 Karbon Salınımı Azalımı", en: "Annual Carbon Emission (CO2) Reduction" },
  "home.eco_badge": { tr: "LPG çevre dostudur! Karbon ayak izinizi bu oranda azaltarak çevreye katkıda bulunun.", en: "LPG is green! Reduce your carbon footprint with environment-friendly alternative fuels." },

  // News and Articles
  "blog.news_center": { tr: "Haberler & Teknik Bültenler", en: "News & Technical Bulletins" },
  "blog.subtitle": { tr: "TSE tebliğleri, yeni araç uyumluluğu, Prins/Atiker yazılım güncellemeleri ve Valvematic/T-GDI enjektör montaj rehberlerini inceleyin.", en: "Read authorized TSE mandates, new car mechanical validations, software updates, and advanced fuel enjector manuals." },
  "blog.search_placeholder": { tr: "Bülten veya haberlerde aratın...", en: "Search newsletters and publications..." },
  "blog.category_filter": { tr: "Kategoriler", en: "Categories" },
  "blog.views": { tr: "Okunma", en: "views" },
  "blog.likes": { tr: "Beğeni", en: "likes" },
  "blog.comments": { tr: "Yorumlar", en: "Comments" },
  "blog.all_categories": { tr: "Tüm Kategoriler", en: "All Categories" },
  "blog.technical_news": { tr: "Teknik Bilgi", en: "Technical Information" },
  "blog.troubleshooting": { tr: "Arıza Çözümleri", en: "Troubleshooting" },
  "blog.industry_news": { tr: "Sektör Haberleri", en: "Industry News" },
  "blog.regulations": { tr: "Yasal Mevzuat", en: "Legislation / Rules" },
  "blog.create_article": { tr: "Yeni Bülten/Haber Ekle (Mühendis & Yönetici)", en: "Add New Bulletin/Article (Admin & Engineer)" },
  "blog.title_tr": { tr: "Türkçe Başlık", en: "Turkish Title" },
  "blog.title_en": { tr: "İngilizce Başlık", en: "English Title" },
  "blog.summary_tr": { tr: "Türkçe Özet", en: "Turkish Summary" },
  "blog.summary_en": { tr: "İngilizce Özet", en: "English Summary" },
  "blog.content_tr": { tr: "Türkçe İçerik (Markdown)", en: "Turkish Content (Markdown)" },
  "blog.content_en": { tr: "İngilizce İçerik (Markdown)", en: "English Content (Markdown)" },
  "blog.author_name": { tr: "Yazar Adı Soyadı", en: "Author Full Name" },
  "blog.author_title": { tr: "Yazar Ünvanı", en: "Author Job Title / Credentials" },
  "blog.submit_article": { tr: "Bülteni Yayınla", en: "Publish Bulletin" },
  "blog.validation_error": { tr: "Lütfen başlık, içerik ve yazar bilgilerini eksiksiz (TR ve EN) doldurunuz.", en: "Please fill in all title, content, and author details (both TR and EN)." },
  "blog.success_saved": { tr: "Bülten başarıyla yayınlandı! Çift dilli olarak ilgili bülten listesine eklenmiştir.", en: "Bulletin published successfully in dual languages!" },

  // Company Directory
  "company.directory_title": { tr: "Yetkili Otogaz Dönüşüm Firmaları", en: "Authorized Conversion Service Directory" },
  "company.directory_sub": { tr: "Tüm bayi ve montaj merkezleri TSE Hizmet Yeterlilik Belgesi (HYB) sahibi, Makine Mühendisleri Odası tescilli mühendis istihdam eden yasal kurumlardır.", en: "All list entities possess official TSE Service Adequacy validations, and employ certified mechanical engineers." },
  "company.search_placeholder": { tr: "Şehir, ilçe ya da firma adı arayın...", en: "Search by city, district, or business name..." },
  "company.city_select": { tr: "Tüm Şehirler", en: "All Cities" },
  "company.brand_select": { tr: "Kit Markasına Göre", en: "By Kit Brand" },
  "company.premium_status": { tr: "Kurumsal Gold Bayi", en: "Premium Gold Corporate" },
  "company.unverified": { tr: "TSE Onay Sürecinde", en: "TSE Approval Pending" },
  "company.address": { tr: "Adres", en: "Address" },
  "company.phone": { tr: "Telefon", en: "Phone" },
  "company.email": { tr: "E-Posta", en: "Email" },
  "company.website": { tr: "Web Sitesi", en: "Website" },
  "company.brands": { tr: "Yetkili Olduğu Markalar", en: "Authorized Brands" },
  "company.reviews": { tr: "Değerlendirmeler & Yorumlar", en: "Customer Ratings & Reviews" },
  "company.add_review": { tr: "Yorum Yap", en: "Write a Review" },
  "company.submit_review": { tr: "Yorumu Gönder", en: "Submit Review" },
  "company.map_view": { tr: "Bölge Bayileri Harita Simülasyonu", en: "Dealers Region Map Simulation" },
  "company.map_info": { tr: "Firmaların konumu tescilli adres koordinatlarında harita üzerinde işaretlenmiştir.", en: "Business locations marked on interactive coordinates." },

  // Compatibility System
  "compat.title": { tr: "LPG Motor Uyumluluk Sorgulama", en: "LPG Engine Compatibility Checker" },
  "compat.sub": { tr: "Gelişmiş motor kod veritabanımız üzerinden aracınızın direkt enjeksiyon, turbo besleme, subap alaşımı ve LPG uyumluluk derecesini sorgulayın.", en: "Lookup direct injection, turbocharger mechanics, valve alloy ratings, and exact kit fits based on your vehicle code database." },
  "compat.search_brand": { tr: "Araç Markası Seçiniz", en: "Select Vehicle Brand" },
  "compat.search_model": { tr: "Model Girin veya Seçin", en: "Enter or Select Model" },
  "compat.sub_model": { tr: "Aratın...", en: "Search..." },
  "compat.no_results": { tr: "Eşleşen araç bilgisi bulunamadı. Lütfen filtreyi güncelleyin veya yeni talep gönderin.", en: "No matching vehicle found in database. Update search parameters or request support." },
  "compat.results_title": { tr: "LPG UYUM RAPORU", en: "LPG COMPATIBILITY REPORT" },
  "compat.engine_type": { tr: "Motor Yapısı", en: "Engine Intake / Build" },
  "compat.engine_code": { tr: "Motor Kodu", en: "Engine Code" },
  "compat.horsepower": { tr: "Güç Değeri (HP)", en: "Horsepower (HP)" },
  "compat.status_compatible": { tr: "%100 UYUMLU", en: "100% COMPATIBLE" },
  "compat.status_sub": { tr: "Uyumlu", en: "Compatible" },
  "compat.risk_level": { tr: "Sibop Hasar Risk Derecesi", en: "Valve Loss Risk Index" },
  "compat.recommended_kits": { tr: "Uyumlu Tavsiye Edilen Kitler", en: "Recommended Compatible Kits" },
  "compat.est_cost": { tr: "Mühendislik Dahil Montör Maliyeti", en: "Dealers Direct Assembly Cost" },
  "compat.get_quote_btn": { tr: "Bu Araç İçin Bölgesel Fiyat Teklifleri Topla", en: "Collect Local Blind Prices For This Car" },
  "compat.danger_notice": { tr: "Açıklama: Yüksek risk derecesine sahip araç Dönüşümlerinde subap erimelerini engellemek amacıyla 'Elektronik Sıvı Subap Yağlama Sistemi' montajı zorunludur.", en: "Notice: High-risk valve vehicles require an electronic valve-saver lubricating fluid kit for thermodynamic protection." },

  // Quoting (Teklif Al)
  "quote.title": { tr: "LPG Dönüşüm Teklifi Al", en: "Get LPG Conversion Offer" },
  "quote.sub": { tr: "İletişim bilgilerinizi sonuna kadar gizleyen kör ihale (blind bidding) altyapısı ile sadece birkaç saniyede teklif toplamaya başlayın.", en: "Collect price offers via our secure double-sided blind bidding engine. Your contact numbers stay hidden until matched." },
  "quote.owner_tab": { tr: "Araç Sahibi Paneli", en: "Vehicle Owner View" },
  "quote.company_tab": { tr: "Firma Teklif Paneli", en: "Dealer Bidding View" },
  "quote.admin_tab": { tr: "Yönetici Match Paneli", en: "Management Matcher" },
  "quote.form_firstName": { tr: "Adınız", en: "First Name" },
  "quote.form_lastName": { tr: "Soyadınız", en: "Last Name" },
  "quote.form_phone": { tr: "Telefon Numarası", en: "Active Phone Number" },
  "quote.form_email": { tr: "E-Posta Adresi", en: "Email Address" },
  "quote.form_brand": { tr: "Araç Markası", en: "Vehicle Brand" },
  "quote.form_model": { tr: "Araç Modeli", en: "Vehicle Model" },
  "quote.form_year": { tr: "Model Yılı", en: "Model Year" },
  "quote.form_fuel": { tr: "Yakıt Türü", en: "Engine Fuel Type" },
  "quote.form_km": { tr: "Mevcut Kilometre", en: "Current Kilometre" },
  "quote.form_engine": { tr: "Motor Hacmi / Tipi", en: "Engine Displacement / Type" },
  "quote.form_city": { tr: "Teklif Alınacak İl", en: "Target Province / City" },
  "quote.form_district": { tr: "İlçe", en: "District / County" },
  "quote.preferred_kit_brands": { tr: "İstediğiniz Özel Marka(lar)", en: "Preferred LPG Kit Brands" },
  "quote.fark_etmez": { tr: "Fark Etmez (Usta Tavsiyesi)", en: "No Preference (Dealers Advice)" },
  "quote.submit_btn": { tr: "Teklif Talebini Gönder (Bilgiler Korumalıdır)", en: "Submit Quote Request (Secure Bidding)" },
  "quote.active_quotes": { tr: "Gönderdiğiniz Taleplerim & Gelen Teklifler", en: "Your Active Requests & Received Offers" },
  "quote.total_requests": { tr: "Sistem Geneli Talep Havuzu", en: "Total Pool Requests" },
  "quote.empty_requests": { tr: "Henüz bir teklif talebi göndermediniz. Soldaki form aracılığıyla hemen ilk talebinizi oluşturun!", en: "You don't have any active quote requests. Fill in the form on the left!" },
  "quote.awaiting_bids": { tr: "Şehir bayileri bu araca blind fiyat çalışıyor. Milisaniyeler içinde ilk teklifler simulatif olarak listeye eklenecektir...", en: "Local service centers are working on your blind bid. Automated simulations will append offers shortly..." },
  "quote.incoming_offers": { tr: "GELEN BLIND TEKLİFLER", en: "INCOMING BLIND BIDS" },
  "quote.offer_price": { tr: "Montaj Fiyatı", en: "Installation Cost" },
  "quote.offer_warranty": { tr: "Garanti Süresi", en: "Warranty Period" },
  "quote.offer_duration": { tr: "Montaj Süresi", en: "Assembly Duration" },
  "quote.installment_options": { tr: "Taksit ve Ödeme", en: "Installment Perks" },
  "quote.notes": { tr: "Usta Açıklaması", en: "Technician Notes" },
  "quote.status_label": { tr: "Durum", en: "Status" },
  "quote.btn_approve_offer": { tr: "Teklifi Onayla", en: "Approve Offer" },
  "quote.btn_reject_offer": { tr: "Yoksay", en: "Dismiss" },
  "quote.approved_offer_notice": { tr: "Tebrikler! Bu teklifi onayladınız. Karşılıklı iletişim bilgilerinin güvenli SMS ile teslim edilmesi için Admin onay işlemi bekleniyor.", en: "Congratulations! You approved this offer. Awaiting administrator matching to deliver double-sided contact details." },

  // Trainings and Careers (Eğitim & Kariyer)
  "edu.title": { tr: "LPG PORTAL Akademi & Kariyer Merkezi", en: "LPG PORTAL Academy & Career Hub" },
  "edu.sub": { tr: "TSE standartlarında lpg sızdırmazlık kalibrasyonu, direkt enjeksiyon montaj eğitimleri, sınav merkezleri ve mesleki kariyer ilan havuzu.", en: "TSE calibration standards, direct injection assembly certificates, online testing chambers, and professional LPG job listings." },
  "edu.tab_courses": { tr: "Akademi Eğitim Modülleri", en: "Academy Video Seminars" },
  "edu.tab_exams": { tr: "Sertifikasyon Sınav Odası", en: "Certification Testing Room" },
  "edu.tab_jobs": { tr: "Sektörel Kariyer İlanları", en: "Sector Job Openings" },
  "edu.instructor": { tr: "Eğitmen", en: "Instructor" },
  "edu.duration": { tr: "Süre", en: "Duration" },
  "edu.price": { tr: "Ücret", en: "Tuition Price" },
  "edu.unlocked_badge": { tr: "Yetkinizle İzlenebilir", en: "Unlocked With Your Plan" },
  "edu.exam_intro": { tr: "LPG Yetkili Montör ve Sızdırmazlık Mühendisi Sertifikasyon Sınavı", en: "LPG Authorized Assembly & Gas Leakage Inspector Certification" },
  "edu.exam_desc": { tr: "LPG montajı yapan personellerin standartlara uyum yeterliliğini tescil eden yasal sınav simülatörüdür. 5 sorudan en az 4 tanesini doğru yanıtlayarak adınıza kayıtlı dijital tescil sertifikasını anında üretebilirsiniz.", en: "Test your installation proficiency according to official technical rules. Get 4 out of 5 quiz challenges correct to instantly issue your custom verified PDF-ready certificate!" },
  "edu.start_exam": { tr: "Sınavı Başlat", en: "Launch Examination" },
  "edu.exam_score": { tr: "Skorunuz", en: "Your Score" },
  "edu.success_pass": { tr: "Tebrikler! Sınavı Başarıyla Geçtiniz.", en: "Congratulations! You successfully passed the exam." },
  "edu.cert_ready": { tr: "Adınıza Hazırlanmış Sertifika İndirilmeye Hazır:", en: "Your personalized accreditation certificate is ready:" },
  "edu.download_cert": { tr: "Sertifikayı Bilgisayara İndir (MMO / TSE Geçerli)", en: "Download PDF Certificate (TSE Validated)" },
  "edu.next_question": { tr: "Sonraki Soru", en: "Next Question" },
  "edu.jobs_count": { tr: "Aktif Sektörel İlan Bulundu", en: "Active Expert Openings" },
  "edu.apply_job": { tr: "Hızlı Başvuru Yap", en: "Fast Application" },

  // Marketplace (Market)
  "market.title": { tr: "LPG Orijinal Yedek Parça Pazaryeri", en: "LPG Genuine spare-parts Marketplace" },
  "market.sub": { tr: "Sıfır ambalajlı regülatörler, filtreler, LPG tankları (10 yıl garantili), manyetik LPG seviye saatleri ve orijinal ECU üniteleri usta güvencesiyle.", en: "Brand new replacement regulators, filters, gas tanks, level gauge dials, and brand-associated ECUs with technician verification support." },
  "market.search_placeholder": { tr: "Ürün ara...", en: "Search products..." },
  "market.all_items": { tr: "Tüm Ürünler", en: "All Spare Parts" },
  "market.add_cart": { tr: "Sepete Ekle", en: "Add to Basket" },
  "market.condition_new": { tr: "Sıfır Ürün", en: "Brand New" },
  "market.condition_used": { tr: "İkinci El", en: "Pre-owned" },
  "market.seller": { tr: "Satıcı Usta", en: "Authorized Merchant" },
  "market.cart_title": { tr: "Alışveriş Sepetiniz", en: "Shopping Cart Checkout" },
  "market.cart_empty": { tr: "Sepetiniz henüz boş.", en: "Your basket is currently empty." },
  "market.checkout": { tr: "Güvenli Sipariş Ver & Öde", en: "Secure Checkout & Pay" },

  // Membership & Portal systems
  "member.portal_title": { tr: "Kurumsal Üyelik & Yönetim Portalı", en: "Corporate Membership & Portal Space" },
  "member.active_status": { tr: "Hesap Durumu: AKTİF", en: "Account Status: ACTIVE" },
  "member.plan_type": { tr: "Mevcut Tarifesi", en: "Subscribed Tier" },
  "member.upgrade_plan": { tr: "Tarifeyi Yukselt", en: "Upgrade Package" },
  "member.invoices": { tr: "Fatura Geçmişi", en: "Billing History" },
  "member.register_title": { tr: "Yeni Kayıt Oluştur", en: "Create New Account" },
  "member.login_title": { tr: "Giriş Yap", en: "Sign In as Registered Member" },
  "member.already_have": { tr: "Zaten üye misiniz? Giriş yapın", en: "Already a member? Sign in" },
  "member.dont_have": { tr: "Hesabınız yok mu? Hemen ücretsiz kayıt olun", en: "Don't have an account? Sign up instant and free" },

  // KVKK / Legal Pages
  "legal.back_btn": { tr: "Ana Sayfaya Geri Dön", en: "Return to Main Site" },
  "legal.kvkk_title": { tr: "LPG PORTAL KVKK Aydınlatma Metni", en: "LPG PORTAL Clarification on Personal Data (KVKK)" },
  "legal.privacy_title": { tr: "Gizlilik ve Güvenlik Politikası", en: "Privacy & Security Policy" },
  "legal.terms_title": { tr: "Kullanım Şartları ve Sorumluluk Reddi", en: "Terms of Use & Disclaimer" },
  "legal.cookies_title": { tr: "Çerez Politikası ve İzin Tercihleri", en: "Cookies Policy & Consent Settings" },

  // Company Directory districts list
  "common.all_districts": { tr: "Tüm İlçeler", en: "All Districts" },
  "common.city_label": { tr: "Şehir", en: "City" },
  "common.district_label": { tr: "İlçe", en: "District" },
  "common.sub_engine": { tr: "Motor: Direkt Enjeksiyonlu", en: "Engine: Direct Injection" }
};

// Simple helper translations mapping for dynamically loaded Turkish fields to English fields
const DYNAMIC_MAPPING: Record<string, string> = {
  // Common terms
  "Hollanda": "Netherlands",
  "İtalya": "Italy",
  "Türkiye": "Turkey",
  "İstanbul": "Istanbul",
  "Ankara": "Ankara",
  "İzmir": "Izmir",
  "Bursa": "Bursa",
  "Antalya": "Antalya",
  "Düşük": "Low",
  "Orta": "Medium",
  "Yüksek": "High",
  "Benzin": "Gasoline (Petrol)",
  "Benzin / Hibrit": "Petrol / Hybrid",
  "Sıfır": "Brand New",
  "2. El": "Second Hand",
  "Atandı": "Assigned",
  "Devam Ediyor": "In Progress",
  "Cevaplandı": "Answered",
  "Teklifler Geldi": "Offers Received",
  "Beklemede": "Pending Action",
  "Firma Teklif Verdi": "Dealer Submitted Bids",
  "Kullanıcı Onayladı": "User Approved",
  "Eşleştirildi": "Matched & Contact Exchanged",
  "Tamamlandı": "Completed & Certified",
  "Teknik Bilgi": "Technical Bulletins",
  "Arıza Çözümleri": "Troubleshooting Guides",
  "Sektör Haberleri": "Industry Bulletins",
  "Yasal Mevzuat": "Official Mandates",
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => detectDefaultLanguage());

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("lpgportal_lang", lang);
  };

  // Safe fallback translator
  const t = (key: string): string => {
    const translation = DICTIONARY[key];
    if (translation) {
      return language === "tr" ? translation.tr : translation.en;
    }
    return key;
  };

  // Custom translation function to check if dynamic text has a mapping or should look for _tr/en properties
  const translateEntity = <T extends Record<string, any>>(obj: T, field: string): string => {
    if (!obj) return "";
    
    // Check if distinct localized keys exist (e.g. title_tr / title_en or titleTr / titleEn)
    const enField = `${field}_en`;
    const trField = `${field}_tr`;
    if (language === "en" && obj[enField] !== undefined) {
      return String(obj[enField] || "");
    }
    if (language === "tr" && obj[trField] !== undefined) {
      return String(obj[trField] || "");
    }

    // Direct match fallback
    const val = obj[field];
    if (typeof val !== "string") return String(val || "");

    if (language === "en") {
      // Check if this particular string has a dynamic map item
      if (DYNAMIC_MAPPING[val]) {
        return DYNAMIC_MAPPING[val];
      }

      // Check common translations for vehicle notes and bulletins to make sure they are translated nicely
      if (val.includes("Sade yapılı atmosferik LPG dostu motordur")) {
        return "Simple atmospheric naturally aspirated engine. Extremely easy and secure to convert. Valve loss risk is low under normal driving conditions.";
      }
      if (val.includes("Bu araç gelişmiş hibrid")) {
        return "This vehicle features advanced hybrid engine technology. Perfect conversion is fully achievable with specialized hybrid OBD-synced-kits.";
      }
      if (val.includes("Bu model yüksek basınçlı ve direkt enjektörlü")) {
        return "This high-pressure Direct Injection (TSI/T-GDI) turbocharger engine requires DI-associated sequential gas fuel kits. Saves around 38-42% fuel.";
      }
      if (val.includes("Türkiye'nin en popüler LPG dönüşüm uyumlu aracıdır")) {
        return "Turkey's most popular fuel-efficient LPG conversion vehicle. The 1.4 Fire engine is incredibly durable and budget-friendly with local Atiker systems.";
      }
      if (val.includes("Ankara'nın LPG kalibrasyon ve montaj merkezidir")) {
        return "Integrated expert center of Ankara. Grand Atiker Golden dealer, providing professional emission certification and live pressure diagnostics.";
      }
      if (val.includes("25 yıldır Maslak Sanayi'de hizmet veren")) {
        return "25 years of prestige in Maslak. Certified with TSE Service Quality. Expert on direct injection (TSI, TCe, Puretech, GDI) premium gas setups.";
      }
      if (val.includes("Nilüfer bölgesinde Atiker")) {
        return "Fast express filter updates, tank replacement compliance, and mechanical tune-ups inside Nilüfer district.";
      }
      if (val.includes("1.5 VTEC Turbo Civic aracımı Prins VSI-3 DI montajı")) {
        return "Converted my civic. Extremely great performance identical to petrol, fuel bill cut on half. Thanks maslak team.";
      }
      if (val.includes("Egea 1.4 Fire aracıma Atiker Grand")) {
        return "Fabulous economy daily driving 100km. Real road diagnostics and engine calibrations.";
      }
      if (val.includes("10 yıllık tank değişim sürem")) {
        return "Changed my 10year state tank in under 1 hour with full official certifications prepared for vehicle appraisal.";
      }
      if (val.includes("Dönüşüm kararı alan araç sahiplerinin")) {
        return "Which kit is best? Premium Dutch Prins? OEM Italian BRC? Or domestic Champion Atiker? Key differences examined.";
      }
      if (val.includes("Yeni bir araba aldınız veya yakıt maliyetleriniz")) {
        return "You converted or want to convert your vehicle. But there are dozens of brands in local industrial districts. Let's compare and choose the right option.";
      }
      if (val.includes("Konya fabrikalarında üretilen yerli")) {
        return "Manufactured inside high-tech plants of Konya, exported to more than 50 nations. Vastly available spare pieces and extremely budget-friendly.";
      }
      if (val.includes("Atiker Grand OBD sıralı otogaz")) {
        return "Original factory replacement diagnostic ECU module supporting automatic system calibrators.";
      }
      if (val.includes("Yeni üretim tarihli sıfır Atiker simit")) {
        return "Fresh manufacturing date horizontal donut LPG gas tank with 10 years certified durability.";
      }
      if (val.includes("Atiker sıralı otogaz beyinlerinin motor yükünü")) {
        return "Map manifold absolute sensors to read direct engine loads precisely with Zero error codes.";
      }
      if (val.includes("Atiker Grand regülatörünün")) {
        return "Stabilizing output pressure parameters to prevent vehicle shivering on low RPM gears.";
      }
      if (val.includes("Atiker Grand regülatörünün çıkış basıncı")) {
        return "What is the recommended output regulator pressure for stabilized idle levels?";
      }

      // Pre-seeded News 1: Tank Longevity
      if (val.includes("TSE ve MMO Genelge Değişikliği: LPG Tank Ömür Tescili 10 Yıla Sabitlendi")) {
        return "TSE and MMO Directive Amendment: LPG Tank Useful Life Settled at 10 Years";
      }
      if (val.includes("Cumhurbaşkanlığı ve Sanayi Bakanlığı koordinasyonunda, LPG tank sızdırmazlık onaylarının")) {
        return "Under coordination of Ministry of Industry and Presidency, LPG tank seal appraisals and 10-year periodic useful life tescil has been finalized on Official Gazette.";
      }

      // Pre-seeded News 2: June Discount
      if (val.includes("LPG ve Akaryakıtta Haziran İndirimi: Litre Başına 1.25 TL Vergi Ayarlaması")) {
        return "June Discount on LPG and Alternative Fuels: 1.25 TL Tax Relief Per Liter";
      }
      if (val.includes("Enerji Piyasası Düzenleme Kurumu (EPDK) tarafından yapılan son toplantıda")) {
        return "At the latest council held by the Energy Market Regulatory Authority (EPDK), autogas pump sales rates were rolled back following refinery margin controls.";
      }

      // Pre-seeded News 3: Chery Omoda 5
      if (val.includes("Yeni Chery Omoda 5 T-GDI Motor LPG Uyum ve Dönüşüm Analizi")) {
        return "New Chery Omoda 5 T-GDI Engine LPG Compatibility & Conversion Analysis";
      }
      if (val.includes("Türkiye'de satış rekorları kıran Chery modellerinin direkt enjeksiyonlu")) {
        return "Direct injection turbo ACTECO T-GDI engine blocks of major selling Chery SUV models have been officially tested under liquid and vapor DI autogas kits.";
      }
    }

    return val;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translateEntity }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
