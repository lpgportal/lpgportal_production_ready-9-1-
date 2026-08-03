import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { MARKETPLACE_DATA } from "../data";
import { MarketplaceProduct, LocalProduct, OrderRequest } from "../types";
import { DbUser, addSystemLog, addCentralNotification } from "../lib/membership";
import { sanitizeHtml, escapeHtml, isPotentialSqlInjection } from "../lib/security";
import { 


  ShoppingBag, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Heart, 
  PlusCircle, 
  Trash, 
  AlertTriangle, 
  Check, 
  X, 
  Tag, 
  Building, 
  MapPin, 
  Eye, 
  Upload, 
  Image as ImageIcon, 
  Mail, 
  Phone, 
  ShieldAlert, 
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Sliders,
  Bell,
  CheckSquare,
  Share2,
  Copy,
  ExternalLink,
  Linkedin,
  MessageSquare,
  Send,
  BarChart4
} from "lucide-react";

interface MarketplaceProps {
  activeUser?: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

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
  "Seviye Sensörü",
  "Anahtar",
  "Filtre",
  "MAP Sensörü",
  "Basınç Sensörü",
  "Dolum Ağzı",
  "Bakır Boru",
  "Faro Termoplastik Boru",
  "Kablo Tesisatı",
  "Tamir Takımı",
  "LPG Kiti",
  "Diğer"
];

const BRANDS_LIST = [
  "BRC",
  "AC Stag",
  "Prins",
  "Zavoli",
  "Atiker",
  "Lovato",
  "Landi Renzo",
  "OMVL",
  "Romano",
  "Diğer"
];

export interface ShareAnalytics {
  facebook: number;
  linkedin: number;
  whatsapp: number;
  copylink: number;
}

export default function Marketplace({ activeUser, onNavigateToTab }: MarketplaceProps) {
  const { language, t, translateEntity } = useLanguage();

  const tLocal = (trVal: string, enVal: string) => {
    return language === "tr" ? trVal : enVal;
  };

  const translateCondition = (cond: string) => {
    switch (cond) {
      case "Sıfır": return tLocal("Sıfır", "New");
      case "2. El": return tLocal("2. El", "Used");
      case "Hepsi": return tLocal("Hepsi", "All");
      default: return cond;
    }
  };

  const translateConditionDetail = (detail: string) => {
    switch (detail) {
      case "Sıfır": return tLocal("Sıfır", "Brand New");
      case "Çok İyi": return tLocal("Çok İyi", "Very Good (Mint)");
      case "İyi": return tLocal("İyi", "Good Status");
      case "Orta": return tLocal("Orta", "Fair (Used)");
      case "Yıpranmış": return tLocal("Yıpranmış", "Heavily Used");
      default: return detail;
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "Onay Bekliyor": return tLocal("Onay Bekliyor", "Pending Approval");
      case "Yayında": return tLocal("Yayında", "Live / Active");
      case "Reddedildi": return tLocal("Reddedildi", "Rejected");
      case "Satıldı": return tLocal("Satıldı", "Sold");
      case "Onaylandı": return tLocal("Onaylandı", "Approved");
      case "Pasif": return tLocal("Pasif", "Inactive");
      case "Düzeltme Bekliyor": return tLocal("Düzeltme Bekliyor", "Correction Needed");
      default: return status;
    }
  };

  const translateOriginality = (orig: string) => {
    switch (orig) {
      case "Evet": return tLocal("Evet", "Yes");
      case "Hayır": return tLocal("Hayır", "No");
      default: return orig;
    }
  };

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [chatFilter, setChatFilter] = useState<"active" | "completed" | "archived">("active");
  
  const [shareAnalytics, setShareAnalytics] = useState<ShareAnalytics>({
    facebook: 0,
    linkedin: 0,
    whatsapp: 0,
    copylink: 0
  });

  const [sharingProduct, setSharingProduct] = useState<LocalProduct | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  
  const [activeSubTab, setActiveSubTab] = useState<"browse" | "add_product" | "favorites" | "admin" | "stats" | "chats">("browse");
  
  // Peer-to-peer secure messaging & Seller statistics
  const [chatThreads, setChatThreads] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_market_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const defaultThreads = [
      {
        id: "conv01",
        productId: "p1",
        productName: "Atiker Grand OBD ECU (Elektronik Kontrol Ünitesi)",
        buyerId: "user_dealer_1",
        buyerName: "Ankara Otogaz Servisi",
        sellerId: "seller_system_1",
        sellerName: "Yıldız LPG Toptan",
        messages: [
          {
            senderId: "user_dealer_1",
            senderName: "Ankara Otogaz Servisi",
            text: "Usta selamlar, bu ECU Atiker Grand kitinin hangi yılına ait acaba?",
            timestamp: "2026-06-15 11:20"
          },
          {
            senderId: "seller_system_1",
            senderName: "Yıldız LPG Toptan",
            text: "Aleykümselam usta, 2025 son seri OBDII uyumlu sıfır üründür. 2 yıl Atiker garantilidir.",
            timestamp: "2026-06-15 11:45"
          }
        ]
      }
    ];
    localStorage.setItem("lpgportal_market_messages", JSON.stringify(defaultThreads));
    return defaultThreads;
  });

  const [activeChatThread, setActiveChatThread] = useState<any | null>(null);
  const [typedChatMessage, setTypedChatMessage] = useState("");

  const [showDeletionConfirm, setShowDeletionConfirm] = useState<{show: boolean; id: string; name: string} | null>(null);

  const [selectedCondition, setSelectedCondition] = useState<"Sıfır" | "2. El" | "Hepsi">("Hepsi");
  const [selectedCategory, setSelectedCategory] = useState("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  
  const [showPriceWarningModal, setShowPriceWarningModal] = useState(false);
  const [priceWarningProduct, setPriceWarningProduct] = useState<LocalProduct | null>(null);

  const [viewProductDetailModal, setViewProductDetailModal] = useState<LocalProduct | null>(null);

  const handleOpenDetailModal = (prod: LocalProduct) => {
    const updated = products.map(p => {
      if (p.id === prod.id) {
        return { ...p, views: (p.views || 0) + 1 };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("lpgportal_products", JSON.stringify(updated));
    setViewProductDetailModal({ ...prod, views: (prod.views || 0) + 1 });
  };

  const [formSaleType, setFormSaleType] = useState<"Sıfır" | "2. El">("Sıfır");
  const [formProductName, setFormProductName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formCategory, setFormCategory] = useState("ECU");
  const [formConditionDetail, setFormConditionDetail] = useState<"Sıfır" | "Çok İyi" | "İyi" | "Orta" | "Yıpranmış">("Sıfır");
  const [formOriginal, setFormOriginal] = useState<"Evet" | "Hayır">("Evet");
  const [formBrand, setFormBrand] = useState("BRC");
  const [formBrandCustom, setFormBrandCustom] = useState("");
  const [formCity, setFormCity] = useState("Ankara");
  const [formDistrict, setFormDistrict] = useState("Çankaya");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [adminFilterTab, setAdminFilterTab] = useState<"all" | "Onay Bekliyor" | "Yayında" | "Reddedildi" | "Satıldı">("Onay Bekliyor");

  useEffect(() => {
    const savedProducts = localStorage.getItem("lpgportal_products");
    let initialProductsList: LocalProduct[] = [];
    if (savedProducts) {
      try {
        initialProductsList = JSON.parse(savedProducts);
      } catch (e) {
        initialProductsList = [];
      }
    }

    if (initialProductsList.length === 0) {
      initialProductsList = MARKETPLACE_DATA.map((p, idx) => {
        const brandsMatch = BRANDS_LIST.find(b => p.product_name.toLowerCase().includes(b.toLowerCase())) || "Diğer";
        return {
          ...p,
          status: "Yayında" as const,
          condition_detail: (p.condition === "Sıfır" ? "Sıfır" : "Çok İyi") as any,
          original: "Evet" as const,
          brand: brandsMatch,
          city: idx % 2 === 0 ? "İstanbul" : "Ankara",
          district: idx % 2 === 0 ? "Şişli" : "Yenimahalle",
          images: [p.image || CATEGORY_PRESETS[p.category] || CATEGORY_PRESETS["Diğer"]],
          seller_id: "seller_system_" + (idx + 1),
          seller_phone: "+90 532 999 88 7" + idx,
          seller_email: "satici_taslak_" + idx + "@lpgportal.com",
          created_at: new Date(Date.now() - 3600 * 1000 * 24 * idx).toISOString()
        };
      });
      localStorage.setItem("lpgportal_products", JSON.stringify(initialProductsList));
    }
    setProducts(initialProductsList);

    const userSuffix = activeUser ? activeUser.id : "guest";
    const savedFavs = localStorage.getItem(`lpgportal_favs_${userSuffix}`);
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    } else {
      setFavorites([]);
    }



    const savedAnalytics = localStorage.getItem("lpgportal_share_analytics");
    if (savedAnalytics) {
      try {
        setShareAnalytics(JSON.parse(savedAnalytics));
      } catch (e) {}
    }
  }, [activeUser]);

  // Synchronize marketplace products and chats in real-time
  useEffect(() => {
    const handleStorage = () => {
      const savedProds = localStorage.getItem("lpgportal_products");
      if (savedProds) {
        try {
          const parsed = JSON.parse(savedProds);
          setProducts(prev => JSON.stringify(prev) === savedProds ? prev : parsed);
        } catch (e) {}
      }
      const savedChats = localStorage.getItem("lpgportal_market_messages");
      if (savedChats) {
        try {
          const parsed = JSON.parse(savedChats);
          setChatThreads(prev => {
            if (JSON.stringify(prev) === savedChats) return prev;
            // Also update activeChatThread if it's currently selected
            if (activeChatThread) {
              const updatedActive = parsed.find((t: any) => t.id === activeChatThread.id);
              if (updatedActive && JSON.stringify(updatedActive) !== JSON.stringify(activeChatThread)) {
                setActiveChatThread(updatedActive);
              }
            }
            return parsed;
          });
        } catch (e) {}
      }
    };

    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        const serialized = JSON.stringify(value);
        if (key === "lpgportal_products") {
          setProducts(prev => JSON.stringify(prev) === serialized ? prev : value);
        }
        if (key === "lpgportal_market_messages") {
          setChatThreads(prev => {
            if (JSON.stringify(prev) === serialized) return prev;
            if (activeChatThread) {
              const updatedActive = value.find((t: any) => t.id === activeChatThread.id);
              if (updatedActive && JSON.stringify(updatedActive) !== JSON.stringify(activeChatThread)) {
                setActiveChatThread(updatedActive);
              }
            }
            return value;
          });
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    const interval = setInterval(handleStorage, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("lpgportal_db_update", handleDbUpdate);
      clearInterval(interval);
    };
  }, [activeChatThread]);

  const saveFavoritesToLocalStorage = (newFavs: string[]) => {
    setFavorites(newFavs);
    const userSuffix = activeUser ? activeUser.id : "guest";
    localStorage.setItem(`lpgportal_favs_${userSuffix}`, JSON.stringify(newFavs));
  };

  const trackShare = (type: keyof ShareAnalytics) => {
    const newAnalytics = {
      ...shareAnalytics,
      [type]: (shareAnalytics[type] || 0) + 1
    };
    setShareAnalytics(newAnalytics);
    localStorage.setItem("lpgportal_share_analytics", JSON.stringify(newAnalytics));
  };

  // SEO: Dynamic Title, OpenGraph & Twitter Card Meta tag manager
  useEffect(() => {
    const p = viewProductDetailModal || sharingProduct;
    if (p) {
      const title = `${p.product_name} - LPGPORTAL Market`;
      const description = p.description || "Güvenli LPG Yedek Parça ve Dönüşüm Platformu";
      const url = `${window.location.origin}?tab=marketplace&product=${p.id}`;
      const image = p.image || '';

      const prevTitle = document.title;
      document.title = title;

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

      setMetaTag("description", false, description);
      setMetaTag("og:title", true, title);
      setMetaTag("og:description", true, description);
      setMetaTag("og:image", true, image);
      setMetaTag("og:url", true, url);
      setMetaTag("og:type", true, "product");
      setMetaTag("og:site_name", true, "LPGPORTAL");

      setMetaTag("twitter:card", false, "summary_large_image");
      setMetaTag("twitter:title", false, title);
      setMetaTag("twitter:description", false, description);
      setMetaTag("twitter:image", false, image);

      return () => {
        document.title = prevTitle;
      };
    }
  }, [viewProductDetailModal, sharingProduct]);

  useEffect(() => {
    if (copiedNotification) {
      const timer = setTimeout(() => {
        setCopiedNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copiedNotification]);

  useEffect(() => {
    if (activeUser) {
      if (activeUser.city) setFormCity(activeUser.city);
      if (activeUser.district) setFormDistrict(activeUser.district);
    }
  }, [activeUser, activeSubTab]);

  const isAuthToSeePrice = activeUser && (
    activeUser.role === "admin" ||
    (
      (
        activeUser.role === "vehicle_owner" ||
        activeUser.role === "dealer" ||
        activeUser.role === "engineer" ||
        activeUser.role === "manufacturer"
      ) && activeUser.membership_status === "Aktif" && activeUser.subscription_type !== "free"
    )
  );

  const toggleFavorite = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeUser) {
      alert(tLocal("İlanları favorilerinize eklemek için üye girişi yapmanız gerekmektedir.", "You must be logged in to add items to your favorites."));
      return;
    }
    if (favorites.includes(productId)) {
      const updated = favorites.filter(id => id !== productId);
      saveFavoritesToLocalStorage(updated);
    } else {
      const updated = [...favorites, productId];
      saveFavoritesToLocalStorage(updated);
    }
  };



  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadSuccessMessage("");
    setUploadErrorMessage("");

    if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
      alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
      return;
    }

    if (!formProductName.trim() || !formDescription.trim()) {
      setUploadErrorMessage("Lütfen tüm zorunlu alanları doldurunuz.");
      return;
    }

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 15);

    if (isNaN(priceNum) || priceNum <= 0) {
      setUploadErrorMessage("Lütfen geçerli bir fiyat giriniz.");
      return;
    }

    if (isNaN(stockNum) || stockNum < 1) {
      setUploadErrorMessage("Minimum stok adedi 1 olmalıdır.");
      return;
    }

    if (formImages.length === 0) {
      setUploadErrorMessage("Minimum 1 adet ürün fotoğrafı eklemelisiniz.");
      return;
    }

    // SQL Injection check
    if (isPotentialSqlInjection(formProductName) || isPotentialSqlInjection(formDescription) || isPotentialSqlInjection(formBrandCustom)) {
      setUploadErrorMessage("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      return;
    }

    // XSS Sanitization & HTML Escaping
    const cleanProductName = escapeHtml(formProductName.trim());
    const cleanDescription = sanitizeHtml(formDescription.trim());

    const newProdId = "prod_" + Date.now();
    const selectedBrandName = formBrand === "Diğer" ? (formBrandCustom || "Diğer") : formBrand;

    const newProduct: LocalProduct = {
      id: newProdId,
      seller_name: activeUser ? (activeUser.company_name || activeUser.name) : "Ziyaretçi Satıcı",
      seller_id: activeUser ? activeUser.id : "guest_uploader",
      seller_phone: activeUser ? activeUser.phone : "+90 555 111 00 00",
      seller_email: activeUser ? activeUser.email : "misafir@lpgportal.com",
      product_name: cleanProductName,
      category: formCategory,
      description: cleanDescription,
      price: priceNum,
      stock: stockNum,
      rating: 5.0,
      image: formImages[0],
      images: formImages,
      condition: formSaleType,
      condition_detail: formConditionDetail,
      original: formOriginal,
      brand: selectedBrandName,
      city: formCity,
      district: formDistrict,
      status: "Onay Bekliyor",
      created_at: new Date().toISOString()
    };

    const updatedProductsList = [newProduct, ...products];
    setProducts(updatedProductsList);
    localStorage.setItem("lpgportal_products", JSON.stringify(updatedProductsList));

    setFormProductName("");
    setFormDescription("");
    setFormPrice("");
    setFormStock("");
    setFormCategory("ECU");
    setFormBrand("BRC");
    setFormBrandCustom("");
    setFormImages([]);
    setFileInputKey(Date.now());

    setUploadSuccessMessage("Ürün ilanınız başarıyla oluşturuldu. Yayınlanabilmesi için yönetici onayı beklenmektedir. Onay sonrasında Market sayfasında görüntülenecektir.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files) as File[];
      filesArr.slice(0, 10 - formImages.length).forEach((file: File) => {
        // Size Check: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          alert("Hata: " + file.name + " boyutu 5 MB limitini aşamaz.");
          return;
        }

        // Extension check
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
          alert("Hata: " + file.name + " geçersiz dosya formatı. Yalnızca JPG, JPEG, PNG, WEBP resimleri kabul edilir.");
          return;
        }

        // MIME type check
        if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
          alert("Hata: " + file.name + " geçersiz resim formatı.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === "string") {
            setFormImages(prev => [...prev, reader.result as string].slice(0, 10));
            addSystemLog("Dosya Yükleme", `Market görseli yüklendi: ${file.name} (Boyut: ${(file.size / 1024).toFixed(1)} KB)`);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleLoadImagePreset = (categoryName: string) => {
    const preset = CATEGORY_PRESETS[categoryName] || CATEGORY_PRESETS["Diğer"];
    if (formImages.length < 10) {
      setFormImages(prev => [...prev, preset].slice(0, 10));
    }
  };



  const handleAdminApproveProduct = (id: string) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, status: "Yayında" as const };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("lpgportal_products", JSON.stringify(updated));
  };

  const handleAdminRejectProduct = (id: string) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, status: "Reddedildi" as const };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("lpgportal_products", JSON.stringify(updated));
  };

  const handleAdminMarkAsSoldProduct = (id: string) => {
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, status: "Satıldı" as const };
      }
      return p;
    });
    setProducts(updated);
    localStorage.setItem("lpgportal_products", JSON.stringify(updated));
  };

  const publishedProducts = products.filter(p => p.status === "Yayında");

  const filteredProducts = publishedProducts.filter(p => {
    if (selectedCondition !== "Hepsi") {
      if (selectedCondition === "Sıfır" && p.condition !== "Sıfır") return false;
      if (selectedCondition === "2. El" && p.condition !== "2. El") return false;
    }
    if (selectedCategory !== "Hepsi" && p.category !== selectedCategory) return false;
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.product_name.toLowerCase().includes(q);
      const categoryMatch = p.category.toLowerCase().includes(q);
      const descMatch = p.description.toLowerCase().includes(q);
      const brandMatch = p.brand.toLowerCase().includes(q);
      return nameMatch || categoryMatch || descMatch || brandMatch;
    }

    return true;
  });

  const adminNewCount = products.filter(p => p.status === "Onay Bekliyor").length;
  const adminActiveCount = products.filter(p => p.status === "Yayında").length;
  const adminRejectedCount = products.filter(p => p.status === "Reddedildi").length;
  const adminSoldProductsCount = products.filter(p => p.status === "Satıldı").length;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-3 sm:p-6" id="marketplace-root-container">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER COVER BANNER */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-teal-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>

          <div className="relative space-y-3 max-w-2xl">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> {tLocal("LPG PORTAL B2B & C2C GÜVENLİ PAZARYERİ", "LPG PORTAL B2B & C2C SECURE MARKETPLACE")}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {tLocal("Orijinal LPG Yedek Parça & Kit Pazarı", "Genuine LPG Spare Parts & Kit Marketplace")}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              {tLocal("Sektör profesyonelleri, LPG bayileri, mühendisler ve araç sahipleri için güvenli ticaret. Eklenen her ürün yönetici onaylıdır, kargo güvencesi ile kapınızda.", "Secure trade for industry professionals, LPG dealers, engineers, and vehicle owners. Every listed product is administrator-approved with buyer assurance.")}
            </p>
          </div>

          {/* INTERNAL ROUTING TABS */}
          <div className="flex flex-wrap gap-2 pt-8 border-t border-slate-100/10 mt-6" id="marketplace-tab-navigation">
            <button
              onClick={() => setActiveSubTab("browse")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === "browse" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🛍️ {tLocal("Ürün Vitrini", "Showcase")}
            </button>

            <button
              onClick={() => setActiveSubTab("favorites")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                activeSubTab === "favorites" 
                  ? "bg-rose-600 text-white shadow-md" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
              }`}
            >
              💖 {tLocal("Favorilerim", "My Favorites")}
              {favorites.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono border-2 border-slate-900">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
                  alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                } else {
                  setActiveSubTab("add_product");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === "add_product" 
                  ? "bg-sky-600 text-white shadow-md" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
              }`}
            >
              ➕ {tLocal("Ürün İlanı Ver", "Sell Product")}
            </button>

            {activeUser && (
              <button
                onClick={() => {
                  if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
                    alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                  } else {
                    setActiveSubTab("chats");
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                  activeSubTab === "chats" 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
                }`}
              >
                💬 {tLocal("Güvenli Mesajlaşma", "Closed Messaging")}
                {chatThreads.some(t => t.buyerId === activeUser.id || t.sellerId === activeUser.id) && (
                  <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold ml-1 animate-pulse">
                    {tLocal("Aktif", "Active")}
          </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ========================================= */}
        {activeSubTab === "browse" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="browse-showroom-grid">
            
            {/* Left sidebar filters / search (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Filter className="h-4 w-4 text-emerald-600" /> {tLocal("Filtrele & Ara", "Filter & Search")}
                  </h3>
                  {(selectedCondition !== "Hepsi" || selectedCategory !== "Hepsi" || searchQuery !== "") && (
                    <button
                      onClick={() => {
                        setSelectedCondition("Hepsi");
                        setSelectedCategory("Hepsi");
                        setSearchQuery("");
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      {tLocal("Sıfırla", "Reset")}
                    </button>
                  )}
                </div>

                {/* Search Text input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 block">{tLocal("Ürün / Marka İsminde Ara", "Search by Product / Brand")}</label>
                  <input
                    type="text"
                    placeholder={tLocal("Örn: ECU, Prins, Atiker...", "e.g. ECU, Prins, Atiker...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-2.5 px-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Condition filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{tLocal("Satış Tipi (Kondisyon)", "Sale Type (Condition)")}</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["Hepsi", "Sıfır", "2. El"] as const).map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => setSelectedCondition(cond)}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-center transition cursor-pointer ${
                          selectedCondition === cond
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {translateCondition(cond)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">{tLocal("Malzeme Arşiv Kategorisi", "Material Archive Category")}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2 text-xs font-semibold rounded-lg focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    <option value="Hepsi">{tLocal("🔍 Tüm Kategoriler", "🔍 All Categories")}</option>
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>🛠️ {cat}</option>
                    ))}
                  </select>
                </div>

                {/* Security Trust badge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 block">{tLocal("Güvenli Alışveriş", "Secure Trade")}</strong>
                    {tLocal("Ödemeler alıcı onayı sonrasında satıcıya aktarılır. KVKK kuralları aynen geçerlidir.", "Payments are released after buyer approval. Data protection terms fully apply.")}
                  </div>
                </div>
              </div>
            </div>

            {/* Product list grid display (9 cols) */}
            <div className="lg:col-span-9 space-y-4">
              
              {!isAuthToSeePrice && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs shadow-xs">
                  <Sliders className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 font-sans">
                    <strong className="font-extrabold uppercase">{tLocal("Fiyat Detayları Kısıtlanmıştır 🔒", "Price Details Restricted 🔒")}</strong>
                    <p>
                      {tLocal("Ürünlerin fiyatlarını görüntülemek, satın alma ve sipariş talepleri oluşturabilmek için Araç Sahibi, Firma, Mühendis veya Kit Üreticisi paketlerinden birine ait Aktif üyeliğe sahip olmanız gereklidir.", "To view product prices, initiate checkout or submit purchase orders, an Active membership with Vehicle Owner, Company, Engineer or Manufacturer tier is required.")}
                    </p>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => onNavigateToTab?.("giris")}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 px-3 rounded transition-all cursor-pointer text-[10px]"
                      >
                        {tLocal("Giriş Yap / Üye Ol »", "Log In / Register »")}
                      </button>
                      <button
                        onClick={() => onNavigateToTab?.("giris")}
                        className="bg-white border border-amber-300 text-slate-700 hover:bg-amber-100 font-bold py-1 px-3 rounded transition-all cursor-pointer text-[10px]"
                      >
                        {tLocal("Paketleri İncele", "View Tiers")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {filteredProducts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-500 shadow-sm">
                  <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-base text-slate-800">{tLocal("Uyuşan Ürün Bulunmadı", "No Matching Products Found")}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {tLocal("Arama kriterlerinizi veya filtrelerinizi daraltarak yeniden deneyin. Tüm ilanları görmek için filtreleri sıfırlayabilirsiniz.", "Refine your search parameters or query filters and try again. You can reset filters to view all listings.")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((prod) => {
                    const isFav = favorites.includes(prod.id);

                    return (
                      <div 
                        key={prod.id} 
                        onClick={() => handleOpenDetailModal(prod)}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group cursor-pointer animate-fade-in"
                      >
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(prod.id, e)}
                          className="absolute top-2.5 right-2.5 z-15 bg-white/95 text-slate-600 hover:text-rose-600 p-2 rounded-full border border-slate-200/60 shadow-xs transition cursor-pointer"
                          title={tLocal("Favorilerime Ekle", "Add to My Favorites")}
                        >
                          <Heart className={`h-4 w-4 transition-all ${isFav ? "fill-rose-500 text-rose-500 scale-110" : "text-slate-400 hover:scale-105"}`} />
                        </button>

                        <div className="h-44 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                          <img 
                            src={prod.image || CATEGORY_PRESETS[prod.category] || CATEGORY_PRESETS["Diğer"]} 
                            alt={prod.product_name} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none" 
                            referrerPolicy="no-referrer"
                          />

                          <div className="absolute bottom-2 left-2 flex gap-1">
                            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                              {translateCondition(prod.condition)}
                            </span>
                            {prod.original === "Evet" && (
                              <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-sans">
                                {tLocal("ORİJİNAL", "GENUINE")}
                              </span>
                            )}
                          </div>

                          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] px-2.5 py-0.5 rounded-full font-mono font-medium">
                            📍 {prod.city}
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold">
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase font-mono tracking-widest">{prod.category}</span>
                              <span className="text-slate-400 font-medium">{tLocal("Marka: ", "Brand: ")}<strong className="text-slate-700">{prod.brand}</strong></span>
                            </div>

                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-2 pt-1 h-10 group-hover:text-emerald-700 transition" title={prod.product_name}>
                              {prod.product_name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 pt-0.5 leading-normal">
                              {prod.description}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                              {isAuthToSeePrice ? (
                                <div className="space-y-0.5">
                                  <span className="text-[9px] text-slate-400 block font-bold">{tLocal("FİYAT", "PRICE")}</span>
                                  <span className="font-black text-sm text-slate-900">{prod.price.toLocaleString("tr-TR")} TL</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPriceWarningProduct(prod);
                                    setShowPriceWarningModal(true);
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] py-1.5 px-3 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer animate-pulse-light"
                                >
                                  🔐 {tLocal("Fiyatı Gör", "See Price")}
                                </button>
                              )}

                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                {prod.stock > 0 ? `${tLocal("Stok", "Stock")}: ${prod.stock} ${tLocal("Adet", "Pcs")}` : tLocal("Tükendi", "Out of stock")}
                              </span>
                            </div>

                             <div className="flex gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!activeUser) {
                                    alert(tLocal("Satıcıya soru sormak için üye girişi yapmanız gerekmektedir.", "You must be logged in to ask the seller a question."));
                                    return;
                                  }
                                  if (activeUser.subscription_type === "free" && activeUser.role !== "admin") {
                                    alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                                    return;
                                  }
                                  if (prod.seller_id === activeUser.id || prod.seller_name === activeUser.name) {
                                    alert(tLocal("Kendi ilanınıza soru soramazsınız.", "You cannot initiate a query for your own uploaded spare part."));
                                    return;
                                  }

                                  const sellerIdStr = prod.seller_id || "seller_system_1";
                                  const threadId = `conv_${activeUser.id}_${sellerIdStr}_${prod.id}`;
                                  let existing = chatThreads.find(t => t.id === threadId);
                                  
                                  if (!existing) {
                                    existing = {
                                      id: threadId,
                                      productId: prod.id,
                                      productName: prod.product_name,
                                      productImage: prod.image,
                                      productPrice: prod.price,
                                      buyerId: activeUser.id,
                                      buyerName: activeUser.name,
                                      sellerId: sellerIdStr,
                                      sellerName: prod.seller_name,
                                      status: "active",
                                      messages: [
                                        {
                                          senderId: "system",
                                          senderName: "LPGPORTAL",
                                          text: `${activeUser.name} ${tLocal("bu parça hakkında güvenli p2p teknik destek / satın alım görüşmesi başlattı. Sorularınızı aşağıdan ulaştırabilirsiniz.", "initiated a secure peer technical support session regarding this diagnostic/item. Ask questions freely inside the chatbox.")}`,
                                          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
                                        }
                                      ]
                                    };
                                    
                                    // Increment product chat count
                                    const updatedProds = products.map(p => {
                                      if (p.id === prod.id) {
                                        return { ...p, chat_count: (p.chat_count || 0) + 1 };
                                      }
                                      return p;
                                    });
                                    setProducts(updatedProds);
                                    localStorage.setItem("lpgportal_products", JSON.stringify(updatedProds));

                                    const updatedThreads = [existing, ...chatThreads];
                                    setChatThreads(updatedThreads);
                                    localStorage.setItem("lpgportal_market_messages", JSON.stringify(updatedThreads));
                                  }
                                  
                                  setActiveChatThread(existing);
                                  setActiveSubTab("chats");
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span>{tLocal("Satıcıya Sor", "Ask Seller")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSharingProduct(prod);
                                }}
                                className="bg-slate-50 hover:bg-slate-100 ring-1 ring-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs cursor-pointer transition flex items-center justify-center"
                                title={tLocal("Paylaş", "Share")}
                              >
                                <Share2 className="h-4 w-4 text-slate-500" />
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* SUBTAB 2: ADD PRODUCT SUBMIT FORM */}
        {/* ========================================= */}
        {activeSubTab === "add_product" && (
          (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") ? (
            <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto my-12 border border-slate-100 shadow-xl space-y-4 font-sans">
              <div className="text-4xl text-rose-500">⚠️</div>
              <h3 className="text-lg font-bold text-slate-800">Yetki Sınırı</h3>
              <p className="text-xs text-slate-600">Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 animate-fade-in max-w-3xl mx-auto" id="add-product-panel">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-sky-600" /> {tLocal("Ürün İlanı Yayınlama Formu", "Spare Part Listing Submission Form")}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {tLocal("E-ticaret pazar standartlarına uygun olarak ürün bilgilerinizi, teknik detayları ve fotoğraflarını eksiksiz doldurunuz.", "Please fill in your item variables, technical specs, and photos according to standard ecommerce parameters.")}
              </p>
            </div>

            {uploadSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-start gap-3 animate-fade-in">
                <CheckCircle className="h-6 w-6 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <strong className="font-extrabold block">{tLocal("Kayıt Başarıyla Alındı!", "Listing Submitted Successfully!")}</strong>
                  <p className="leading-relaxed">{uploadSuccessMessage}</p>
                </div>
              </div>
            )}

            {uploadErrorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 flex items-start gap-3 animate-shake">
                <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                <div>{uploadErrorMessage}</div>
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Satış Tipi", "Sale Type")}</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setFormSaleType("Sıfır"); setFormConditionDetail("Sıfır"); }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                        formSaleType === "Sıfır"
                          ? "bg-slate-950 border-slate-950 text-white"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      ✨ {tLocal("Sıfır (Yeni)", "Brand New")}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setFormSaleType("2. El"); setFormConditionDetail("Çok İyi"); }}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                        formSaleType === "2. El"
                          ? "bg-slate-950 border-slate-950 text-white"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      🔄 {tLocal("İkinci El", "Second Hand / Used")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Kullanım Durumu (Kondisyon)", "Hardware Condition Details")}</label>
                  <select
                    value={formConditionDetail}
                    onChange={(e) => setFormConditionDetail(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    {formSaleType === "Sıfır" ? (
                      <option value="Sıfır">{tLocal("Yeni / Sıfır Ambalajlı", "Brand New / Sealed Box")}</option>
                    ) : (
                      <>
                        <option value="Çok İyi">{tLocal("Çok İyi (Neredeyse Sıfır / Temiz)", "Very Good (Mint Condition)")}</option>
                        <option value="İyi">{tLocal("İyi (Sorunsuz Çalışan)", "Good Status (Well Working)")}</option>
                        <option value="Orta">{tLocal("Orta (Kullanılmış)", "Fair (Normally Used)")}</option>
                        <option value="Yıpranmış">{tLocal("Yıpranmış (Bakım İhtiyacı Olan / Yedeklik)", "Heavily Used (Needs Maintenance or for Parts)")}</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Ürün Adı *", "Product Name *")}</label>
                <input
                  type="text"
                  required
                  placeholder={tLocal("Örn: Atiker Gold SRL OBD Regülatör Beyni", "e.g. Atiker Gold SRL OBD Regulator Body")}
                  value={formProductName}
                  onChange={(e) => setFormProductName(e.target.value)}
                  className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Ürün Açıklaması *", "Product Description *")}</label>
                <textarea
                  required
                  rows={4}
                  placeholder={tLocal("Ürünün teknik özellikleri, araca uyumluluğu, parça numarası ve garanti durumunu detaylı belirtiniz...", "Clearly describe technical specifications, vehicle compatibility, part number, and warranty details...")}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Fiyat (TL) *", "Market Price (TL) *")}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Örn: 1850"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Mevcut Stok Adedi *", "In-Stock Quantity *")}</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Örn: 5"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Kategori *", "Category *")}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    {CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Marka *", "Brand *")}</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 text-slate-700 cursor-pointer"
                  >
                    {BRANDS_LIST.map(brd => (
                      <option key={brd} value={brd}>{brd}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Orijinallik", "Originality Certificate")}</label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormOriginal("Evet")}
                      className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-center transition cursor-pointer ${
                        formOriginal === "Evet"
                          ? "bg-emerald-600 border-emerald-600 text-white font-extrabold"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {tLocal("Evet", "Yes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormOriginal("Hayır")}
                      className={`py-2 px-3 text-[11px] font-bold rounded-xl border text-center transition cursor-pointer ${
                        formOriginal === "Hayır"
                          ? "bg-slate-900 border-slate-900 text-white font-extrabold"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {tLocal("Hayır", "No")}
                    </button>
                  </div>
                </div>
              </div>

              {formBrand === "Diğer" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Özel Marka Adı *", "Custom Brand Name *")}</label>
                  <input
                    type="text"
                    required
                    placeholder={tLocal("Lütfen marka ismi giriniz", "Please enter brand name")}
                    value={formBrandCustom}
                    onChange={(e) => setFormBrandCustom(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("Bulunduğu İl *", "State / City *")}</label>
                  <input
                    type="text"
                    required
                    placeholder={tLocal("Girdiğiniz konum", "Current city")}
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">{tLocal("İlçe *", "District *")}</label>
                  <input
                    type="text"
                    required
                    placeholder={tLocal("Örn: Çankaya, Kartal, Bornova...", "e.g. Cankaya, Kartal, Bornova...")}
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-3 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-700 block uppercase tracking-wider">
                    {tLocal("Ürün Fotoğrafları * (En az 1, en fazla 10 adet)", "Product Photographs * (Min 1, Max 10 items)")}
                  </label>
                  <span className={`text-xs font-mono font-bold ${formImages.length === 0 ? "text-red-500" : "text-slate-500"}`}>
                    {tLocal("Yüklenen", "Uploaded")}: {formImages.length} / 10
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-sky-500 transition relative bg-slate-50/50">
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleLocalImageUpload}
                      disabled={formImages.length >= 10}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-600 block">{tLocal("Fotoğrafları Sürükleyin veya Seçin", "Drag and Drop Photos or Click to Choose")}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">PNG, JPG, JPEG (Max. 5MB)</span>
                  </div>

                  <div className="bg-sky-50/50 rounded-2xl p-4 border border-sky-100 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-800 block">💡 {tLocal("Kolay Test Seçeneği", "Instant Demo Assistant")}</span>
                      <p className="text-[11px] text-slate-600 leading-normal mt-1">
                        {tLocal("Cihazınızda parça fotoğrafı yoksa kategoriye uygun yüksek çözünürlüklü temsilî ürün görsellerini aşağıdaki tuşa basarak doğrudan ilanınıza kurabilirsiniz!", "If you do not have a photo on hand, import suitable default high-res spare images corresponding to this categorisation instantly!")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLoadImagePreset(formCategory)}
                      disabled={formImages.length >= 10}
                      className="mt-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer"
                    >
                      {tLocal("Kategoriye Uygun Otomatik Fotoğraf Ekle", "Autofill Category Demo Photo")}
                    </button>
                  </div>
                </div>

                {formImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    {formImages.map((src, index) => (
                      <div key={index} className="relative h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
                        <img src={src} alt="Uploaded preview" className="h-full w-full object-cover" />
                        <div className="absolute top-1 left-1 bg-slate-900/85 text-white text-[9px] px-1 py-0.5 rounded font-bold font-mono">
                          {index + 1} {index === 0 && "★"}
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormImages(formImages.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckSquare className="h-4.5 w-4.5" />
                  <span>{tLocal("Onay Kuruluna Gönder ve Yayın Talebi Yarat", "Submit to Board for Moderation & Live Approval")}</span>
                </button>
              </div>

            </form>
          </div>
        ))}

        {/* ========================================= */}
        {/* SUBTAB 3: FAVORITES LIST PAGE */}
        {/* ========================================= */}
        {activeSubTab === "favorites" && (
          <div className="space-y-4 animate-fade-in" id="favorites-panel">
            <h2 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              💖 {tLocal("Favoriye Eklediğim Ürünler", "My Saved Favorites")} ({favorites.length})
            </h2>

            {favorites.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-500 shadow-sm">
                <Heart className="h-16 w-16 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-800">{tLocal("Favori Listeniz Boş", "Your Favorite List is Empty")}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {tLocal("Ürün vitrininde beğendiğiniz parçaların üzerindeki kalp sembollerine tıklayarak onları buraya hızlıca kaydedebilirsiniz.", "Click the heart buttons on any listing in the showroom catalog to bookmark them for easy retrieval here.")}
                </p>
                <button
                  onClick={() => setActiveSubTab("browse")}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
                >
                  {tLocal("Vitrin Ürünlerini İncele", "Explore Showroom Listings")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                {products
                  .filter(p => favorites.includes(p.id))
                  .map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => handleOpenDetailModal(prod)}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-xs transition duration-150 cursor-pointer relative"
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(prod.id, e)}
                        className="absolute top-2 right-2 z-10 bg-white/95 text-rose-500 p-1.5 rounded-full border border-slate-200/60 shadow-xs transition cursor-pointer"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>

                      <div className="h-32 bg-slate-150 flex items-center justify-center relative bg-slate-50">
                        <img 
                          src={prod.image || CATEGORY_PRESETS[prod.category] || CATEGORY_PRESETS["Diğer"]} 
                          alt={prod.product_name} 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 left-1 bg-slate-900/85 text-white text-[8px] px-1.5 py-0.5 rounded font-bold font-mono">
                          {translateCondition(prod.condition)}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] text-emerald-700 font-extrabold uppercase font-mono">{prod.category}</span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-2 h-8 pt-0.5">
                            {prod.product_name}
                          </h4>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          {isAuthToSeePrice ? (
                            <strong className="text-xs text-slate-900">{prod.price.toLocaleString("tr-TR")} TL</strong>
                          ) : (
                            <span className="text-[10px] text-emerald-700 italic font-bold">{tLocal("Fiyat Kısıtlı 🔒", "Restricted Price 🔒")}</span>
                          )}
                          <span className="text-[9px] text-slate-400 font-mono font-medium">{prod.city}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}






        {/* ========================================= */}
        {/* SUBTAB 7: CENTRAL PEER TO PEER SECURE CHAT */}
        {/* ========================================= */}
        {activeSubTab === "chats" && activeUser && (
          (activeUser.subscription_type === "free" && activeUser.role !== "admin") ? (
            <div className="bg-white rounded-3xl p-8 text-center max-w-md mx-auto my-12 border border-slate-100 shadow-xl space-y-4 font-sans">
              <div className="text-4xl text-rose-500">⚠️</div>
              <h3 className="text-lg font-bold text-slate-800">Yetki Sınırı</h3>
              <p className="text-xs text-slate-650 leading-relaxed">Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in" id="peer-to-peer-chat-room">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 font-sans font-medium">
                💬 {tLocal("Sektörel Güvenli İletişim & Yazışma Odası", "Sector Secure Communication & Chat Hub")}
              </h2>
              <p className="text-xs text-slate-500">
                {tLocal("LPGPORTAL kuralları gereği, telefon numaranız paylaşılmadan alıcı ve satıcılarla panel içi güvenle mesajlaşabilirsiniz. Görüşmeleriniz burada korunur.", "In compliance with LPGPORTAL guidelines, you can converse securely with buyers and dealers right on-panel without exposing your phone number.")}
              </p>
            </div>

            {(() => {
              const myConversations = chatThreads.filter(chat => {
                const isPart = chat.buyerId === activeUser.id || chat.sellerId === activeUser.id;
                if (!isPart) return false;
                
                // 1. deletedBy check
                const isDeleted = (chat.deletedBy || []).includes(activeUser.id);
                if (isDeleted) return false;
                
                // 2. Status matching: treat undefined status as "active"
                const currentStatus = chat.status || "active";
                return currentStatus === chatFilter;
              });

              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[480px]">
                  
                  {/* Left sidebar List of Conversations (Buyer or Seller) */}
                  <div className="md:col-span-4 border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 flex flex-col justify-between max-h-[550px] overflow-y-auto">
                    <div className="space-y-3">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase font-mono tracking-wider">{tLocal("SOHBETLERİM", "MY CHATS")}</span>
                      
                      {/* Chat status filter tabs */}
                      <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 text-[10px] font-black">
                        {(["active", "completed", "archived"] as const).map((filterOpt) => {
                          const isActive = chatFilter === filterOpt;
                          const label = filterOpt === "active" ? tLocal("Aktif", "Active") :
                                        filterOpt === "completed" ? tLocal("Tamamlandı", "Completed") :
                                                                    tLocal("Arşiv", "Archive");
                          return (
                            <button
                              key={filterOpt}
                              type="button"
                              onClick={() => {
                                setChatFilter(filterOpt);
                                setActiveChatThread(null);
                              }}
                              className={`flex-1 py-1.5 px-2 rounded-lg transition-all text-center cursor-pointer ${
                                isActive 
                                  ? "bg-white text-slate-900 shadow-xs" 
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-2">
                        {myConversations.map(chat => {
                          const isSellerRoleActive = chat.sellerId === activeUser.id;
                          const counterSideName = isSellerRoleActive ? chat.buyerName : chat.sellerName;
                          const isSelected = activeChatThread?.id === chat.id;

                          return (
                            <div
                              key={chat.id}
                              onClick={() => {
                                setActiveChatThread(chat);
                                setTypedChatMessage("");
                              }}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                                isSelected 
                                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                                  : "bg-white hover:bg-slate-100/65 border-slate-200 text-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10.5px]">
                                <span className="font-extrabold uppercase tracking-wide">
                                  {isSellerRoleActive ? "📥 " + tLocal("ALICI", "BUYER") : "📤 " + tLocal("SATICI/USTA", "SELLER/PRO")}
                                </span>
                                <span className={isSelected ? "text-indigo-200 text-[9px]" : "text-slate-400 text-[9px] font-mono"}>
                                  {chat.messages[chat.messages.length - 1]?.timestamp.split(' ')[1] || "12:00"}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs truncate leading-snug">{counterSideName}</h4>
                              <p className={`text-[10px] truncate ${isSelected ? "text-indigo-150" : "text-slate-500"}`}>
                                {chat.productName}
                              </p>
                            </div>
                          );
                        })}
                        {myConversations.length === 0 && (
                          <div className="p-8 text-center text-slate-400 italic text-xs">
                            {chatFilter === "active" 
                              ? tLocal("Kayıtlı aktif mesajlaşma bulunmuyor. Bir ilan üzerinden 'Satıcıya Sor' butonunu kullanarak doğrudan iletişime geçebilirsiniz.", "No active chat threads found. You can initiate conversation with any seller directly using the 'Ask Seller' action.")
                              : chatFilter === "completed"
                              ? tLocal("Tamamlanmış sohbet bulunmuyor.", "No completed chats found.")
                              : tLocal("Arşivlenmiş sohbet bulunmuyor.", "No archived chats found.")
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right pane: Active scrollable chat layout */}
                  <div className="md:col-span-8 border border-slate-200 rounded-2xl bg-white flex flex-col justify-between overflow-hidden max-h-[550px]">
                    {activeChatThread ? (
                      <>
                        {/* Conversation Header */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <span className="text-[9px] text-teal-700 font-black block font-mono uppercase">{tLocal("İlgili İlan Parçası", "Related Classified")}</span>
                            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">{activeChatThread.productName}</h3>
                          </div>
                          
                          <div className="flex gap-1.5 items-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToTab && onNavigateToTab("marketplace");
                                setActiveSubTab("browse");
                              }}
                              className="bg-white hover:bg-slate-100/50 border border-slate-200 font-bold text-[9.5px] text-slate-600 px-2 py-1.5 rounded transition uppercase cursor-pointer"
                            >
                              {tLocal("Ürünü Gör", "View Item")}
                            </button>
                            
                            {(activeChatThread.status || "active") !== "completed" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = chatThreads.map(t => {
                                    if (t.id === activeChatThread.id) {
                                      return { ...t, status: "completed" };
                                    }
                                    return t;
                                  });
                                  setChatThreads(updated);
                                  localStorage.setItem("lpgportal_market_messages", JSON.stringify(updated));
                                  
                                  window.dispatchEvent(new CustomEvent("lpgportal_db_update", {
                                    detail: { key: "lpgportal_market_messages", value: updated }
                                  }));

                                  setActiveChatThread(null);
                                }}
                                className="bg-emerald-55 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[9.5px] px-2 py-1.5 rounded transition uppercase cursor-pointer"
                              >
                                {tLocal("Tamamlandı", "Complete")}
                              </button>
                            )}

                            {(activeChatThread.status || "active") !== "archived" && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = chatThreads.map(t => {
                                    if (t.id === activeChatThread.id) {
                                      return { ...t, status: "archived" };
                                    }
                                    return t;
                                  });
                                  setChatThreads(updated);
                                  localStorage.setItem("lpgportal_market_messages", JSON.stringify(updated));

                                  window.dispatchEvent(new CustomEvent("lpgportal_db_update", {
                                    detail: { key: "lpgportal_market_messages", value: updated }
                                  }));

                                  setActiveChatThread(null);
                                }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[9.5px] px-2 py-1.5 rounded transition uppercase cursor-pointer"
                              >
                                {tLocal("Arşivle", "Archive")}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(tLocal("Bu görüşmeyi silmek istediğinize emin misiniz? Görüşme sizin için gizlenecektir.", "Are you sure you want to delete this conversation? It will be hidden for you."))) {
                                  const updated = chatThreads.map(t => {
                                    if (t.id === activeChatThread.id) {
                                      const deletedByList = t.deletedBy || [];
                                      if (!deletedByList.includes(activeUser.id)) {
                                        return { ...t, deletedBy: [...deletedByList, activeUser.id] };
                                      }
                                    }
                                    return t;
                                  });
                                  setChatThreads(updated);
                                  localStorage.setItem("lpgportal_market_messages", JSON.stringify(updated));

                                  window.dispatchEvent(new CustomEvent("lpgportal_db_update", {
                                    detail: { key: "lpgportal_market_messages", value: updated }
                                  }));

                                  setActiveChatThread(null);
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[9.5px] px-2 py-1.5 rounded transition uppercase cursor-pointer"
                            >
                              {tLocal("Sil", "Delete")}
                            </button>
                          </div>
                        </div>

                        {/* Message list scrolling screen */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 min-h-[300px]">
                          {activeChatThread.messages.map((ms: any, ind: number) => {
                            const isMe = ms.senderId === activeUser.id;

                            return (
                              <div key={ind} className={`flex flex-col max-w-[75%] gap-0.5 ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                <span className="text-[9px] text-slate-400 font-bold block">{ms.senderName}</span>
                                <div className={`p-3 rounded-2xl text-xs ${
                                  isMe 
                                    ? "bg-emerald-600 text-white rounded-br-none font-bold" 
                                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-none font-semibold"
                                }`}>
                                  {ms.text}
                                </div>
                                <span className="text-[8px] text-slate-400 font-mono mt-0.5">{ms.timestamp}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Send message textbar footer */}
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (activeUser?.subscription_type === "free" && activeUser?.role !== "admin") {
                            alert("Bu özelliği kullanabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                            return;
                          }
                          if (!typedChatMessage.trim()) return;

                          const newMsg = {
                            senderId: activeUser.id,
                            senderName: activeUser.name,
                            text: typedChatMessage,
                            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
                          };

                          const updatedThread = {
                            ...activeChatThread,
                            messages: [...activeChatThread.messages, newMsg]
                          };

                          const allUpdated = chatThreads.map(t => {
                            if (t.id === activeChatThread.id) {
                              return updatedThread;
                            }
                            return t;
                          });

                          setChatThreads(allUpdated);
                          localStorage.setItem("lpgportal_market_messages", JSON.stringify(allUpdated));
                          setActiveChatThread(updatedThread);
                          setTypedChatMessage("");

                          // Central Notification Hub trigger
                          addCentralNotification(
                            activeChatThread.sellerId === activeUser.id ? activeChatThread.buyerId : activeChatThread.sellerId,
                            "Yeni Mağaza Mesajı",
                            `${activeUser.name} size bir mesaj gönderdi: "${typedChatMessage.substring(0, 30)}..."`,
                            "mesaj",
                            "panel"
                          );

                          // Log System action
                          addSystemLog("Mesaj Gönderildi", `${activeChatThread.productName} ilanı için güvenli panel içi sohbet mesajı gönderildi.`, activeUser.email);
                        }} className="p-4 border-t border-slate-200 bg-white flex gap-2">
                          <input
                            type="text"
                            placeholder={tLocal("Mesajınızı usta veya satıcıya iletmek için yazın...", "Type your message to the pro or seller here...")}
                            value={typedChatMessage}
                            onChange={(e) => setTypedChatMessage(e.target.value)}
                            className="flex-1 bg-slate-50 text-xs py-2 px-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none font-medium text-slate-800"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl cursor-pointer transition font-bold text-xs flex items-center gap-1 shrink-0"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{tLocal("Gönder", "Send")}</span>
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col justify-center items-center p-8 text-center text-slate-400 space-y-3">
                        <MessageSquare className="h-16 w-16 text-slate-300 animate-bounce" />
                        <h4 className="font-bold text-sm text-slate-700">{tLocal("Güvenli Sektörel Yazışma Kanalı", "Secure Classified Chat Portal")}</h4>
                        <p className="text-xs text-slate-400 max-w-sm">
                          {tLocal("Yazışmaları görüntülemek, cevaplamak veya usta/satıcılar ile teknik detay konuşmak için sol taraftaki listelenen sohbetlerden birini seçin.", "Select any conversation listed on the left to verify specifications, bargain, or plan parts delivery safely with other portal members.")}
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </div>
        ))}

      </div>

      {/* ========================================= */}
      {/* 13. INTERACTIVE FAIL-SAFE DELETION SAFEGUARD OVERLAY */}
      {/* ========================================= */}
      {showDeletionConfirm && (
        <div className="fixed inset-0 z-55 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-600 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{tLocal("Kalıcı Kayıt Silme Onayı", "Permanent Deletion Confirmation")}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                "<span className="text-rose-600 font-bold">{showDeletionConfirm.name}</span>" {tLocal("isimli yedek parça ilan kaydını kalıcı olarak silmek istediğinizden emin misiniz?", "Are you sure you want to permanently delete this diagnostic/spare part classified?")}
              </p>
              <p className="text-[10px] text-slate-400 italic">{tLocal("Bu işlem veritabanından kalıcı olarak kaldırılacaktır ve geri alınamaz!", "This entry will be permanently redacted from the marketplace registry and cannot be reversed!")}</p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const updated = products.filter(p => p.id !== showDeletionConfirm.id);
                  setProducts(updated);
                  localStorage.setItem("lpgportal_products", JSON.stringify(updated));
                  
                  // Log delete action
                  addSystemLog("Kayıt Silindi", `${showDeletionConfirm.name} ilanı satıcı tarafından sistemden kalıcı olarak sıfırlandı.`, activeUser?.email || "Ziyaretçi");
                  
                  setShowDeletionConfirm(null);
                  alert(tLocal("İlan kaydı başarıyla silinmiştir.", "Classified listing successfully deleted."));
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Trash className="h-3.5 w-3.5" />
                {tLocal("Evet, Kalıcı Olarak Sil", "Yes, Delete Permanently")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeletionConfirm(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-750 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition"
              >
                {tLocal("İptal Et", "Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* OVERLAY DIALOG MODAL 1: PRICE WARNING */}
      {/* ========================================= */}
      {showPriceWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" id="price-lock-warning-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-6 relative">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border-2 border-emerald-100 mx-auto animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">{tLocal("Yetkisiz Fiyat Görüntüleme Sınırı", "Unauthorized Price Visibility Threshold")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold px-4 bg-slate-50 py-3 rounded-xl border border-slate-200">
                {tLocal("Bu ürünün fiyat bilgisini görüntüleyebilmek için aktif bir üyelik paketine sahip olmanız gerekmektedir.", "Please activate or upgrade your workshop membership packages to unlock verified classified price listings.")}
              </p>
            </div>

            <div className="text-[11px] text-slate-500 text-left space-y-1 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
              <span>💡 <strong>{tLocal("Fiyatları Görebilecek Üyelikler:", "Authorized Membership Roles:")}</strong></span>
              <p>• {tLocal("Araç Sahibi Üyeliği", "Vehicle Owner Member")}</p>
              <p>• {tLocal("Firma (Bayi/Usta) Üyeliği", "Workshop (Dealer/Mechanic) Member")}</p>
              <p>• {tLocal("LPG Mühendisi / Usta Üyeliği", "LPG Engineer / Pro Member")}</p>
              <p>• {tLocal("Kit Üreticisi Üyeliği", "Kit Manufacturer Member")}</p>
              <p>• {tLocal("Admin Yönetici Hesabı", "System Administrator Account")}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowPriceWarningModal(false); onNavigateToTab?.("giris"); }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-2.5 rounded-xl transition cursor-pointer text-center"
              >
                {tLocal("Paketleri İncele", "Browse Bundles")}
              </button>

              <button
                type="button"
                onClick={() => { setShowPriceWarningModal(false); onNavigateToTab?.("giris"); }}
                className="bg-slate-900 hover:bg-black text-white font-bold text-[11px] py-2.5 rounded-xl transition cursor-pointer text-center"
              >
                {tLocal("Giriş Yap", "Login / Register")}
              </button>

              <button
                type="button"
                onClick={() => setShowPriceWarningModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] py-2.5 rounded-xl transition cursor-pointer"
              >
                {tLocal("Kapat", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* OVERLAY DIALOG MODAL 4: SOCIAL MEDIA SHARE DIALOG */}
      {/* ========================================= */}
      {sharingProduct && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in" id="social-share-modal">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-150 space-y-6 relative animate-scale-up">
            
            <button
              type="button"
              onClick={() => setSharingProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition animate-fade-in"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Share2 className="h-6 w-6 animate-pulse-light" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-905 text-slate-900 tracking-tight">{tLocal("Ürünü Sosyal Medyada Paylaş", "Share Product Classified")}</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal">
                {sharingProduct.product_name} {tLocal("ilanını dilediğiniz platformda paylaşarak satış oranlarınızı yükseltin.", "classified to boost inbound customer traffic and mechanics inquiries.")}
              </p>
            </div>

            {/* Notification Toast */}
            {copiedNotification && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 animate-pulse-light font-bold">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{copiedNotification === "instagram" ? tLocal("Bağlantı panoya kopyalandı.", "Link copied to clipboard!") : tLocal("Ürün bağlantısı panoya kopyalandı.", "Target product URL copied to clipboard!")}</span>
              </div>
            )}

            {/* Share platform links */}
            <div className="space-y-3 pt-1">
              {/* Facebook */}
              <button
                type="button"
                onClick={() => {
                  trackShare("facebook");
                  const url = `${window.location.origin}?tab=marketplace&product=${sharingProduct.id}`;
                  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                  window.open(fbUrl, "_blank");
                }}
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[13px] inline-block w-4 text-center">f</span>
                  <span>{tLocal("Facebook'ta Paylaş", "Post to Facebook")}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => {
                  trackShare("linkedin");
                  const url = `${window.location.origin}?tab=marketplace&product=${sharingProduct.id}`;
                  const lnUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                  window.open(lnUrl, "_blank");
                }}
                className="w-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>{tLocal("LinkedIn'de Paylaş", "Share on LinkedIn")}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  trackShare("whatsapp");
                  const url = `${window.location.origin}?tab=marketplace&product=${sharingProduct.id}`;
                  const text = `${tLocal("Bu LPG ürününe göz atın:\n\n", "Check out this LPG kit/component:\n\n")}${sharingProduct.product_name}\n\n${url}`;
                  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                  window.open(waUrl, "_blank");
                }}
                className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-center inline-block w-4">💬</span>
                  <span>{tLocal("WhatsApp'ta Paylaş", "Send via WhatsApp")}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={() => {
                  trackShare("copylink");
                  const url = `${window.location.origin}?tab=marketplace&product=${sharingProduct.id}`;
                  const instaText = `${sharingProduct.product_name} \n${url}`;
                  navigator.clipboard.writeText(instaText);
                  setCopiedNotification("instagram");
                }}
                className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between hover:opacity-95 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-center inline-block w-4">📸</span>
                  <span>{tLocal("Kopyala ve Instagram'da Paylaş", "Copy Description & Share to Instagram")}</span>
                </div>
                <Copy className="h-3.5 w-3.5 opacity-80" />
              </button>

              {/* Bağlantıyı Kopyala */}
              <button
                type="button"
                onClick={() => {
                  trackShare("copylink");
                  const url = `${window.location.origin}?tab=marketplace&product=${sharingProduct.id}`;
                  navigator.clipboard.writeText(url);
                  setCopiedNotification("link");
                }}
                className="w-full bg-slate-705 bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Copy className="h-3.5 w-3.5" />
                  <span>{tLocal("Bağlantıyı Kopyala", "Copy Direct Share Link")}</span>
                </div>
                <div className="text-[10px] bg-slate-600 px-1.5 py-0.5 rounded text-slate-300 font-mono">LINK</div>
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-[10px] text-slate-400 leading-normal space-y-1">
              <span className="text-slate-500 font-extrabold uppercase tracking-wide block">🛡️ {tLocal("Güvenlik ve KVKK Uyum Güvencesi", "Privacy & Security Guarantee")}</span>
              <span>{tLocal("İlan paylaşıldığı takdirde, tarafsızlığı korumak amacıyla satıcının telefon numarası, e-posta adresi ve fiziksel adresi gibi hassas kişisel veriler tamamen gizli tutulmaktadır.", "Once shared externally, precise dealer telemetry (mobile phone, workspace email) remains masked for legal KVKK privacy compliance.")}</span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSharingProduct(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-4 py-2 rounded-xl transition cursor-pointer"
              >
                {tLocal("Kapat", "Close")}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================= */}
      {/* OVERLAY DIALOG MODAL 3: PRODUCT DETAIL DIALOG */}
      {/* ========================================= */}
      {viewProductDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in" id="product-detail-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setViewProductDetailModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-105 bg-slate-100 p-2 rounded-full cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
              
              <div className="space-y-3">
                <div className="h-56 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                  <img 
                    src={viewProductDetailModal.image || CATEGORY_PRESETS[viewProductDetailModal.category] || CATEGORY_PRESETS["Diğer"]} 
                    alt="" 
                    className="h-full w-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] py-0.5 px-2 rounded-md font-mono font-medium">
                    📍 {viewProductDetailModal.city}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {viewProductDetailModal.images?.map((subImg, idx) => (
                    <div 
                      key={idx} 
                      className={`h-12 bg-slate-100 rounded-lg overflow-hidden border cursor-pointer ${
                        viewProductDetailModal.image === subImg ? "border-emerald-600 ring-2 ring-emerald-500/10" : "border-slate-200"
                      }`}
                      onClick={() => {
                        setViewProductDetailModal({ ...viewProductDetailModal, image: subImg });
                      }}
                    >
                      <img src={subImg} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono tracking-widest leading-none inline-block">{viewProductDetailModal.category}</span>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {viewProductDetailModal.product_name}
                  </h3>
                  <div className="flex items-center text-amber-500 gap-1 text-xs font-semibold pt-1">
                    <Star className="h-4.5 w-4.5 fill-current" />
                    <span>{viewProductDetailModal.rating || 4.9} {tLocal("Memnuniyet Skoru", "Mechanic Satisfaction Score")}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed max-height-[100px] overflow-y-auto">
                  {viewProductDetailModal.description}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 space-y-1.5">
                  <div className="flex justify-between">
                    <span>{tLocal("Satış Tipi:", "Sales Method:")}</span>
                    <strong className="text-slate-800">{translateCondition(viewProductDetailModal.condition)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{tLocal("Kondisyon Durumu:", "Condition Rating:")}</span>
                    <strong className="text-slate-800">{translateConditionDetail(viewProductDetailModal.condition_detail || viewProductDetailModal.condition)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{tLocal("Orijinallik Tescili:", "Certificate Type:")}</span>
                    <strong className="text-slate-800">{translateOriginality(viewProductDetailModal.original)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{tLocal("Parça Markası:", "Manufactured Brand:")}</span>
                    <strong className="text-slate-800">{viewProductDetailModal.brand}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{tLocal("Lokasyon / Konum:", "Stock Location:")}</span>
                    <strong className="text-slate-800">{viewProductDetailModal.city} - {viewProductDetailModal.district}</strong>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1 text-slate-700 font-bold uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{tLocal("Satıcı Koordinatları", "Seller Coordinates")}</span>
                  </div>
                  <p><strong>{tLocal("Satıcı:", "Seller:")}</strong> {viewProductDetailModal.seller_name}</p>
                  <p className="italic text-emerald-700 font-medium">{tLocal("🔒 KVKK ve gizlilik standartları uyarınca satıcı telefon ve e-posta adresleri gizlenmiştir. İletişim, sipariş ve kargo panelleri üzerinden güvenli yürütülecektir.", "🔒 Dealer's direct phone and email are cryptographically masked in compliance with strict privacy standards. Transactions progress beautifully via in-app secure peer communications.")}</p>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  {isAuthToSeePrice ? (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono block">{tLocal("FİYAT", "PRICE")}</span>
                      <strong className="text-xl font-black text-slate-900">{viewProductDetailModal.price.toLocaleString("tr-TR")} TL</strong>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setViewProductDetailModal(null);
                        setPriceWarningProduct(viewProductDetailModal);
                        setShowPriceWarningModal(true);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-200 transition"
                    >
                      🔐 {tLocal("Fiyatı Gör (Üye Ol)", "View Price (Unlock Members)")}
                    </button>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setViewProductDetailModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-750 font-extrabold text-xs py-2.5 px-6 rounded-xl transition cursor-pointer"
                    >
                      {tLocal("Kapat", "Close")}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
