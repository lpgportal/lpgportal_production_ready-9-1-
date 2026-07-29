export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: "Ziyaretçi" | "Araç Sahibi" | "Firma" | "Uzman" | "Yönetici";
}

export interface LpgBrand {
  id: string;
  brand_name: string;
  country: string;
  description: string;
  logo: string;
  website: string;
  rating: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  premium_status: boolean;
  rating: number;
  reviews: Review[];
  logo: string;
  logo_type?: "real" | "auto";
  featuredBrands: string[]; // Brands they install, e.g. ["Prins", "BRC", "Atiker"]
  latOffset: number; // for the interactive mockup map
  lngOffset: number; // for the interactive mockup map
  latitude?: number;
  longitude?: number;
  owner_id?: string;
  approved_status?: "Onay Bekliyor" | "Onaylandı" | "Reddedildi";
  status?: "Aktif" | "Pasif";
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  yearRange: string;
  engine: string;
  engine_code: string;
  fuel_type: string;
  horsepower: number;
  compatible: boolean;
  risk_level: "Düşük" | "Orta" | "Yüksek";
  recommended_kits: string[];
  compatibility_notes: string;
  tahmini_maliyet: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string;
  author: string;
  authorTitle: string;
  category: "Teknik Bilgi" | "Arıza Çözümleri" | "Sektör Haberleri" | "Yasal Mevzuat";
  created_at: string;
  views: number;
  likes: number;
  comments: {
    id: string;
    userName: string;
    userRole: string;
    comment: string;
    created_at: string;
  }[];
}

export interface Consultation {
  id: string;
  userName: string;
  vehicleInfo: string;
  expertName: string;
  subject: string;
  status: "Atandı" | "Devam Ediyor" | "Cevaplandı";
  chatHistory: { sender: "user" | "expert"; text: string; date: string }[];
  isPremium: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  video_url: string;
  duration: string;
  certificate: boolean;
  modules_count: number;
  instructor: string;
}

export interface Job {
  id: string;
  company_name: string;
  title: string;
  city: string;
  salary: string;
  description: string;
  employment_type: string;
  created_at: string;
}

export interface MarketplaceProduct {
  id: string;
  seller_name: string;
  product_name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  image: string;
  condition: "Sıfır" | "2. El";
}

export interface QuoteRequest {
  id: string;
  userId?: string; // Storing the logged-in user's ID
  userName: string;
  userFirstName?: string;
  userLastName?: string;
  userPhone: string;
  userEmail?: string;
  userCity: string;
  userDistrict?: string;
  brand: string;
  model: string;
  year: string;
  engine: string;
  fuelType?: string;
  preferredBrand: string;
  kilometer?: string;
  status: string; // e.g. "Beklemede" | "İnceleniyor" | "Teklif Hazırlanıyor" | "Teklif Gönderildi" | "Tamamlandı" | "İptal Edildi"
  created_at: string;
  updated_at?: string; // Last updated timestamp
  offers: QuoteOffer[];
  admin_reply?: string; // Reply from Admin
  admin_notes?: string; // Private internal notes for admin
  attachments?: { name: string; url: string; size: string }[]; // Uploaded files
}

export interface QuoteOffer {
  id: string;
  companyId: string;
  companyName: string;
  companyContactName?: string;
  companyPhone?: string;
  companyEmail?: string;
  kitBrandProposed: string;
  price: number;
  warrantyYears: number;
  warrantyInfo?: string;
  installationDuration?: string;
  installmentOptions: string;
  notes: string;
  rating: number;
  created_at: string;
  status?: string; // "Beklemede" | "Onaylandı" | "Reddedildi"
}

export interface LocalProduct extends MarketplaceProduct {
  status: "Onay Bekliyor" | "Yayında" | "Reddedildi" | "Satıldı" | "Pasif" | "Düzeltme Bekliyor";
  condition_detail: "Sıfır" | "Çok İyi" | "İyi" | "Orta" | "Yıpranmış";
  original: "Evet" | "Hayır";
  brand: string;
  city: string;
  district: string;
  images: string[];
  seller_id: string;
  seller_phone?: string;
  seller_email?: string;
  created_at: string;
  views?: number;
}

export interface OrderRequest {
  id: string;
  productId: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerRole: string;
  qty: number;
  totalPrice: number;
  status: "Onay Bekliyor" | "Onaylandı" | "Reddedildi" | "Satıldı";
  sellerId: string;
  sellerName: string;
  createdAt: string;
}

export interface FeedbackRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  userPhone: string;
  type: string; // e.g. "Talep" | "Şikayet" | "Öneri" | "Teknik Destek" | "Hata Bildirimi" | "Diğer"
  priority: string; // e.g. "Düşük" | "Normal" | "Yüksek" | "Acil"
  title: string;
  description: string;
  status: string; // e.g. "Yeni Kayıt" | "İnceleniyor" | "İşleme Alındı" | "Ek Bilgi Bekleniyor" | "Çözüldü" | "Kapatıldı" | "Reddedildi"
  created_at: string;
  updated_at: string;
  adminReply?: string; // Yönetici Cevabı
  internalNotes?: string; // İç Not
  attachments: { name: string; type: string; base64?: string; size: string; url?: string }[];
  comments: FeedbackComment[];
}

export interface FeedbackComment {
  id: string;
  sender: "user" | "admin";
  senderName: string;
  message: string;
  created_at: string;
  attachments?: { name: string; type: string; base64?: string; size: string }[];
}

