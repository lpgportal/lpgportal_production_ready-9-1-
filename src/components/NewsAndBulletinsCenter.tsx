import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { 


  Flame, 
  Search, 
  Sparkles, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Calendar, 
  ThumbsUp, 
  Eye, 
  Share2, 
  PenTool, 
  Send, 
  Database, 
  Layers, 
  Tag, 
  Globe, 
  Check, 
  Wrench, 
  Sliders, 
  AlertTriangle,
  RotateCcw,
  Download,
  Lock,
  Unlock,
  FileCode,
  BarChart2
} from "lucide-react";

// Pre-seeded high-fidelity news database
const INITIAL_NEWS_DATABASE: any[] = [];

const INITIAL_BULLETINS_DATABASE: any[] = [];

interface NewsAndBulletinsCenterProps {
  activeUser?: {
    id: string;
    role: string;
    email: string;
    name?: string;
    [key: string]: any;
  } | null;
}

export default function NewsAndBulletinsCenter({ activeUser }: NewsAndBulletinsCenterProps = {}) {
  const { language, t, translateEntity } = useLanguage();

  const tLocal = (trVal: string, enVal: string) => {
    return language === "tr" ? trVal : enVal;
  };

  // Modes: "news" (Haberler), "technical" (Teknik Bültenler), "library" (Kütüphane), "author" (Yazar Stüdyosu), "archive" (Dijital Arşiv)
  const [activeMode, setActiveMode] = useState<"news" | "technical" | "library" | "author" | "archive">("news");

  // User submitted contents database
  const [userContentsDb, setUserContentsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_user_contents_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const seeded = [
      {
        id: "uc-1",
        title: "2026 Toyota Corolla 1.5 Dynamic Force LPG Dönüşüm Tavsiyeleri",
        category: "Teknik Bilgi",
        summary: "Toyota Corolla'nın en son nesil üç silindirli enjeksiyonlu motorunun LPG montaj tüyoları ve sızdırmazlık standartları.",
        content: "### Giriş\nToyota 1.5 Dynamic Force motor, yüksek ısıl verimlilik ve sıkıştırma oranıyla dikkat çeken üç silindirli bir yapıdır.\n\n### Montaj Detayı\nBu motorlarda stabilite elde etmek için yüksek hızlı LPG enjektörleri ve minimum gaz yolu hortum boyu tercih edilmelidir. LTFT ve STFT değerleri mutlaka sürüş testi esnasında kalibre edilmelidir. Çelik subap koruma sisteminin entegre edilmesi uzun ömürlü kullanım için tavsiye edilir.",
        tags: ["toyota", "corolla", "dynamic-force", "ustarehber"],
        imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=600&auto=format&fit=crop",
        isCoverImage: true,
        status: "Revizyon İstendi",
        revisionNotes: "Lütfen enjektör milisaniye (ms) grafik değerlerini ve nozul çapı önerilerini de metne dahil ediniz.",
        authorName: "Ahmet Yılmaz",
        authorRole: "LPG Mühendisi / Usta",
        authorEmail: "ahmet@ustam.com",
        createdAt: "2026-06-11",
        views: 45,
        likes: 12,
        facebookShares: 2,
        linkedinShares: 4,
        whatsappShares: 8,
        twitterShares: 1,
        linkCopied: 5
      },
      {
        id: "uc-2",
        title: "Atiker Grand LPG Kitlerinde Yazılım Güncellemesi Duyurusu",
        category: "Duyuru",
        summary: "Atiker Grand serisi ECU üniteleri için rölanti devri dalgalanmalarını gideren yeni v3.4 firmware güncellemesi yayında.",
        content: "Atiker Ar-Ge departmanı tarafından geliştirilen v3.4 yazılım güncellemesi, özellikle 4 silindirli atmosferik motorlarda klima açıldığında meydana gelen anlık rölanti dalgalanmalarını optimize etmek amacıyla yayınlanmıştır. Bayilerimizin tüm yeni montajlarda bu firmware sürümünü yüklemesi önemle duyurulur.",
        tags: ["atiker", "grand", "firmware", "guncelleme"],
        imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
        isCoverImage: true,
        status: "Yayınlandı",
        authorName: "Mehmet Demir",
        authorRole: "Kit Üreticisi",
        authorEmail: "m.demir@atiker.com.tr",
        createdAt: "2026-06-10",
        views: 128,
        likes: 34,
        facebookShares: 10,
        linkedinShares: 12,
        whatsappShares: 22,
        twitterShares: 8,
        linkCopied: 14
      }
    ];
    localStorage.setItem("lpgportal_user_contents_db", JSON.stringify(seeded));
    return seeded;
  });

  // Sync state modifications dynamically back to local storage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_user_contents_db", JSON.stringify(userContentsDb));
    }
  }, [userContentsDb]);

  // Advertisements Database state and sync effect
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

  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("lpgportal_ads_db");
      if (saved) {
        try {
          setAdsDb(JSON.parse(saved));
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

  // Content creation state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isEditingContentId, setIsEditingContentId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Haber");
  const [selectedBrandForBulletin, setSelectedBrandForBulletin] = useState(() => {
    return activeUser?.role === "manufacturer" ? (activeUser.brand_name || "BRC") : "BRC";
  });
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=600&auto=format&fit=crop");
  const [newIsCoverImage, setNewIsCoverImage] = useState(true);

  // States for Yazılım ve Kalibrasyon Kütüphanesi Kaydı
  const [libCarBrand, setLibCarBrand] = useState("");
  const [libCarModel, setLibCarModel] = useState("");
  const [libModelYear, setLibModelYear] = useState("");
  const [libEngineVolume, setLibEngineVolume] = useState("");
  const [libEngineCode, setLibEngineCode] = useState("");
  const [libSoftwareVersion, setLibSoftwareVersion] = useState("");
  const [libEcuCode, setLibEcuCode] = useState("");
  const [libCompatibleKit, setLibCompatibleKit] = useState("");
  const [libFileName, setLibFileName] = useState("");

  // Simulation states
  const [isImageEnhancing, setIsImageEnhancing] = useState(false);
  const [imageEnhanceSteps, setImageEnhanceSteps] = useState<string[]>([]);
  const [activeEnhanceStep, setActiveEnhanceStep] = useState("");
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [revisionTargetId, setRevisionTargetId] = useState<string | null>(null);

  // Local image upload & drag-and-drop states
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isOptimizingFile, setIsOptimizingFile] = useState(false);

  // Notifications state
  const [notificationsDb, setNotificationsDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_writer_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const initNotifications = [
      {
        id: "notif-1",
        userName: "Ahmet Yılmaz",
        type: "panel",
        title: "Revizyon İstendi",
        message: "2026 Toyota Corolla makaleniz için yönetici revizyon talebinde bulundu: 'Lütfen enjektör milisaniye (ms) grafik değerlerini ve nozul çapı önerilerini de metne dahil ediniz.'",
        date: "2026-06-12 14:32"
      },
      {
        id: "notif-2",
        userName: "Mehmet Demir",
        type: "email",
        title: "İçerik Yayınlandı",
        message: "Atiker Grand LPG Kitlerinde Yazılım Güncellemesi Duyurusu başlıklı içeriğiniz başarıyla onaylandı ve yayınlandı.",
        date: "2026-06-11 10:15"
      },
      {
        id: "notif-3",
        userName: "Mehmet Demir",
        type: "sms",
        title: "Onay Bildirimi",
        message: "LPG PORTAL: Atiker Grand basligindaki iceriginiz onaylanarak yayina alinmistir.",
        date: "2026-06-11 10:15"
      }
    ];
    localStorage.setItem("lpgportal_writer_notifications", JSON.stringify(initNotifications));
    return initNotifications;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_writer_notifications", JSON.stringify(notificationsDb));
    }
  }, [notificationsDb]);

  const sendNotifications = (userName: string, userEmail: string, title: string, status: string, notes?: string) => {
    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    
    // Create SMS, Email, and Panel Notification objects
    const emailNotif = {
      id: `notif-email-${Date.now()}`,
      userName,
      type: "email",
      title: `E-Posta: [LPG PORTAL] İçerik Durumu: ${status}`,
      message: `Sayın ${userName}, '${title}' başlıklı yazınızın durumu '${status}' olarak güncellenmiştir.${notes ? ` Yönetici Notu: ${notes}` : ""}`,
      date: dateStr
    };

    const smsNotif = {
      id: `notif-sms-${Date.now()}`,
      userName,
      type: "sms",
      title: "SMS Gönderildi",
      message: `LPG PORTAL: Sayin ${userName.toUpperCase()}, '${title.substring(0, 20)}...' baslikli iceriginizin durumu '${status.toUpperCase()}' olarak guncellenmistir. Detaylar her zamanki gibi portalda mevcuttur.`,
      date: dateStr
    };

    const panelNotif = {
      id: `notif-panel-${Date.now()}`,
      userName,
      type: "panel",
      title: `Sistem Bildirimi: ${status}`,
      message: `'${title}' başlıklı yazınızın durumu '${status}' olarak değiştirildi.${notes ? ` Revizyon Gerekçesi: ${notes}` : ""}`,
      date: dateStr
    };

    setNotificationsDb(prev => [panelNotif, emailNotif, smsNotif, ...prev]);
    showToast(`Kullanıcıya E-Posta, SMS ve Panel Bildirimi gönderildi.`);
  };

  // State & helpers for AI assistance, validation, submission and translation
  const [aiAssistTopic, setAiAssistTopic] = useState("");
  const [isAiAssisting, setIsAiAssisting] = useState(false);

  const translateRoleAndMembership = (role?: string) => {
    if (!role) return tLocal("Ziyaretçi", "Visitor");
    switch (role) {
      case "admin": return "Yönetici (Admin)";
      case "vehicle_owner": return "Araç Sahibi (Üye)";
      case "engineer": return "LPG Mühendisi / Usta";
      case "dealer": return "Firma (Bayi / Servis)";
      case "manufacturer": return "Kit Üreticisi";
      case "visitor": return "Ziyaretçi (Ziyaretçi Üye)";
      default: return role;
    }
  };

  const handleSaveAndSubmitContent = () => {
    if (!newTitle.trim()) {
      alert("Lütfen içerik başlığını giriniz.");
      return;
    }
    if (!newSummary.trim()) {
      alert("Lütfen içerik özetini giriniz.");
      return;
    }
    if (!newContent.trim()) {
      alert("Lütfen içerik metnini giriniz.");
      return;
    }

    // Direct access or system security hole check for "Teknik Bülten"
    if (newCategory === "Teknik Bülten" && activeUser?.role !== "manufacturer" && activeUser?.role !== "admin") {
      alert("Bu kategori için içerik oluşturma yetkiniz bulunmamaktadır.");
      showToast("Bu kategori için içerik oluşturma yetkiniz bulunmamaktadır.");
      return;
    }

    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const tagsArray = newTags.split(",").map(t => t.trim()).filter(Boolean);

    // Dynamic brand mapping
    const detectedBrand = activeUser?.role === "manufacturer" 
      ? (activeUser.brand_name || "BRC") 
      : (activeUser?.role === "admin" && newCategory === "Teknik Bülten" ? selectedBrandForBulletin : "Genel");
    const detectedMfgAccount = activeUser?.role === "manufacturer" ? activeUser.name : (activeUser?.role === "admin" ? "Admin" : "Yazar");

    if (isEditingContentId) {
      setUserContentsDb(prev => prev.map(item => {
        if (item.id === isEditingContentId) {
          // Extra validation on edit to prevent raw bypass
          if (newCategory === "Teknik Bülten" && activeUser?.role !== "manufacturer" && activeUser?.role !== "admin") {
            alert("Bu kategori için içerik oluşturma yetkiniz bulunmamaktadır.");
            return item;
          }
          return {
            ...item,
            title: newTitle,
            category: newCategory,
            summary: newSummary,
            content: newContent,
            tags: tagsArray,
            imageUrl: newImageUrl,
            isCoverImage: newIsCoverImage,
            status: activeUser?.role === "admin" ? "Yayınlandı" : "Onay Bekliyor",
            createdAt: dateStr,
            lpgBrand: detectedBrand,
            manufacturerAccount: detectedMfgAccount,
            // Calibration Library fields
            carBrand: libCarBrand,
            carModel: libCarModel,
            modelYear: libModelYear,
            engineVolume: libEngineVolume,
            engineCode: libEngineCode,
            softwareVersion: libSoftwareVersion,
            ecuCode: libEcuCode,
            compatibleKit: libCompatibleKit,
            fileName: libFileName
          };
        }
        return item;
      }));
      
      showToast("İçeriğiniz başarıyla güncellendi ve yeniden onaya sunuldu!");
      setIsCreatorOpen(false);
      setIsEditingContentId(null);
      
      // Reset fields
      setLibCarBrand("");
      setLibCarModel("");
      setLibModelYear("");
      setLibEngineVolume("");
      setLibEngineCode("");
      setLibSoftwareVersion("");
      setLibEcuCode("");
      setLibCompatibleKit("");
      setLibFileName("");
    } else {
      const newId = `uc-${Date.now()}`;
      const newItem = {
        id: newId,
        title: newTitle,
        category: newCategory,
        summary: newSummary,
        content: newContent,
        tags: tagsArray,
        imageUrl: newImageUrl,
        isCoverImage: newIsCoverImage,
        authorName: activeUser?.name || "Ahmet Yurt",
        authorEmail: activeUser?.email || "yazar@lpgportal.com",
        authorRole: translateRoleAndMembership(activeUser?.role),
        status: activeUser?.role === "admin" ? "Yayınlandı" : "Onay Bekliyor",
        createdAt: dateStr,
        views: 0,
        likes: 0,
        facebookShares: 0,
        linkedinShares: 0,
        whatsappShares: 0,
        twitterShares: 0,
        linkCopied: 0,
        lpgBrand: detectedBrand,
        manufacturerAccount: detectedMfgAccount,
        published: activeUser?.role === "admin",
        publishedAt: activeUser?.role === "admin" ? dateStr : null,
        updatedAt: dateStr,
        authorId: activeUser?.email || "yazar@lpgportal.com",
        approvedBy: null,
        approvedAt: null,
        // Calibration Library fields
        carBrand: libCarBrand,
        carModel: libCarModel,
        modelYear: libModelYear,
        engineVolume: libEngineVolume,
        engineCode: libEngineCode,
        softwareVersion: libSoftwareVersion,
        ecuCode: libEcuCode,
        compatibleKit: libCompatibleKit,
        fileName: libFileName
      };

      setUserContentsDb(prev => [newItem, ...prev]);
      
      sendNotifications(
        activeUser?.name || "Ahmet Yurt",
        activeUser?.email || "yazar@lpgportal.com",
        newTitle,
        "Onay Bekliyor (Yazar Tarafından İletildi)"
      );

      setIsCreatorOpen(false);
      setShowSubmissionSuccess(true);
      
      // Reset fields
      setLibCarBrand("");
      setLibCarModel("");
      setLibModelYear("");
      setLibEngineVolume("");
      setLibEngineCode("");
      setLibSoftwareVersion("");
      setLibEcuCode("");
      setLibCompatibleKit("");
      setLibFileName("");
    }
  };

  const processAndOptimizeImage = (file: File) => {
    // Format check: JPG, JPEG, PNG, WEBP
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const isAllowedExtension = ["jpg", "jpeg", "png", "webp"].includes(fileExtension || "");
    
    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      alert("Desteklenen formatlar: JPG, JPEG, PNG, WEBP");
      showToast("Hata: Geçersiz dosya formatı. Sadece JPG, JPEG, PNG, WEBP desteklenir.");
      return;
    }

    // Size limit check: 5MB
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      alert("Maksimum dosya boyutu 5 MB olmalıdır.");
      showToast("Hata: Maksimum dosya boyutu 5 MB olmalıdır.");
      return;
    }

    setIsOptimizingFile(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Professional reference standard: 16:9 ratio, 1200x675 px
        const targetWidth = 1200;
        const targetHeight = 675;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Soft white background in case source has transparent pixels
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // Proportional sizing - cover crop strategy with no stretching/distortion
          const imgRatio = img.width / img.height;
          const targetRatio = targetWidth / targetHeight;

          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;

          if (imgRatio > targetRatio) {
            // Wider image: crop horizontally
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
          } else {
            // Taller image: crop vertically
            sourceHeight = img.width / targetRatio;
            sourceY = (img.height - sourceHeight) / 2;
          }

          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Web compression and optimization (JPEG format with highly performant quality ratio)
          const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          setNewImageUrl(optimizedDataUrl);
          
          setIsOptimizingFile(false);
          showToast("Görsel 16:9 (1200x675 px) oranında otomatik olarak optimize edildi ve sıkıştırıldı!");
        } else {
          setIsOptimizingFile(false);
        }
      };
      
      img.onerror = () => {
        setIsOptimizingFile(false);
        showToast("Hata: Görsel dosyası yüklenemedi.");
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      setIsOptimizingFile(false);
      showToast("Hata: Dosya yüklenirken okuma hatası oluştu.");
    };

    reader.readAsDataURL(file);
  };

  const handleImageEnhance = () => {
    setIsImageEnhancing(true);
    setImageEnhanceSteps([]);
    const steps = [
      "AI işlemcisi başlatıldı: Görsel kalitesi ve netliği artırılıyor (Netlik artırma)...",
      "Yapay zeka akıllı kontrast optimizasyonu uyguluyor (Kontrast optimizasyonu)...",
      "Gelişmiş gürültü azaltma (Gürültü azaltma) algoritması devrede...",
      "Görsel çözünürlüğü profesyonel haber kapak standartlarına (1200x675 px) ölçekleniyor (Kapak görseli uyumluluğu)...",
      "Web optimizasyonu: Kalite kaybı minimum seviyede tutularak sıkıştırılıyor (Web optimizasyonu & Kalite iyileştirme)...",
      "Kapak görseli uyumluluğu ve 16:9 çerçeve yerleşimi tamamlandı."
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        setActiveEnhanceStep(step);
        setImageEnhanceSteps(prev => [...prev, step]);
        if (index === steps.length - 1) {
          setTimeout(() => {
            setIsImageEnhancing(false);
            showToast("Görsel yapay zeka ile başarıyla optimize edildi!");
          }, 800);
        }
      }, (index + 1) * 700);
    });
  };
  
  // Database States with social counters
  const [newsDb, setNewsDb] = useState(() => {
    if (typeof window === "undefined") return INITIAL_NEWS_DATABASE;
    
    let approvedUserNews: any[] = [];
    const userContentsSaved = localStorage.getItem("lpgportal_user_contents_db");
    if (userContentsSaved) {
      try {
        const parsedUserContents = JSON.parse(userContentsSaved);
        approvedUserNews = parsedUserContents
          .filter((item: any) => item.status === "Yayınlandı" && item.category !== "Teknik Bülten")
          .map((item: any) => ({
            id: item.id === "uc-1" ? "news-toyota-2026" : item.id === "uc-2" ? "tb-atiker-grand-firm" : item.id,
            title: item.title,
            summary: item.summary,
            category: item.category,
            date: item.createdAt,
            author: item.authorName,
            image: item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300",
            tags: item.tags || ["üye", "lpgportal"],
            likes: item.likes || 0,
            views: item.views || 0,
            content: item.content,
            facebookShares: item.facebookShares || 0,
            linkedinShares: item.linkedinShares || 0,
            whatsappShares: item.whatsappShares || 0,
            twitterShares: item.twitterShares || 0,
            linkCopied: item.linkCopied || 0,
            lpgBrand: item.lpgBrand || "BRC Türkiye",
            manufacturerAccount: item.manufacturerAccount || item.authorName,
            status: item.status || "Yayınlandı",
            published: item.published !== undefined ? item.published : true,
            publishedAt: item.publishedAt || item.createdAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt || item.createdAt,
            authorId: item.authorId || item.authorEmail,
            approvedBy: item.approvedBy || "Admin",
            approvedAt: item.approvedAt || item.createdAt
          }));
      } catch (e) {
        console.error(e);
      }
    }

    const saved = localStorage.getItem("lpgportal_news_db");
    let baseNews = INITIAL_NEWS_DATABASE;
    if (saved) {
      try {
        baseNews = JSON.parse(saved);
      } catch (e) {
        baseNews = INITIAL_NEWS_DATABASE;
      }
    }
    
    const mappedBaseNews = baseNews.map((item: any) => ({
      facebookShares: Math.floor(Math.random() * 8) + 1,
      linkedinShares: Math.floor(Math.random() * 5) + 1,
      whatsappShares: Math.floor(Math.random() * 12) + 2,
      twitterShares: Math.floor(Math.random() * 6) + 1,
      linkCopied: Math.floor(Math.random() * 15) + 3,
      ...item
    }));

    const merged = [...approvedUserNews];
    mappedBaseNews.forEach((item: any) => {
      if (!merged.some(x => x.id === item.id)) {
        merged.push(item);
      }
    });

    localStorage.setItem("lpgportal_news_db", JSON.stringify(merged));
    return merged;
  });

  const [bulletinsDb, setBulletinsDb] = useState(() => {
    if (typeof window === "undefined") return INITIAL_BULLETINS_DATABASE;

    let approvedUserBulletins: any[] = [];
    const userContentsSaved = localStorage.getItem("lpgportal_user_contents_db");
    if (userContentsSaved) {
      try {
        const parsedUserContents = JSON.parse(userContentsSaved);
        approvedUserBulletins = parsedUserContents
          .filter((item: any) => item.status === "Yayınlandı" && item.category === "Teknik Bülten")
          .map((item: any) => ({
            id: item.id === "uc-1" ? "news-toyota-2026" : item.id === "uc-2" ? "tb-atiker-grand-firm" : item.id,
            title: item.title,
            summary: item.summary,
            category: item.category,
            date: item.createdAt,
            author: item.authorName,
            image: item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300",
            tags: item.tags || ["üye", "lpgportal"],
            likes: item.likes || 0,
            views: item.views || 0,
            content: item.content,
            facebookShares: item.facebookShares || 0,
            linkedinShares: item.linkedinShares || 0,
            whatsappShares: item.whatsappShares || 0,
            twitterShares: item.twitterShares || 0,
            linkCopied: item.linkCopied || 0,
            lpgBrand: item.lpgBrand || "BRC Türkiye",
            manufacturerAccount: item.manufacturerAccount || item.authorName,
            status: item.status || "Yayınlandı",
            published: item.published !== undefined ? item.published : true,
            publishedAt: item.publishedAt || item.createdAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt || item.createdAt,
            authorId: item.authorId || item.authorEmail,
            approvedBy: item.approvedBy || "Admin",
            approvedAt: item.approvedAt || item.createdAt
          }));
      } catch (e) {
        console.error(e);
      }
    }

    const saved = localStorage.getItem("lpgportal_bulletins_db");
    let baseBulletins = INITIAL_BULLETINS_DATABASE;
    if (saved) {
      try {
        baseBulletins = JSON.parse(saved);
      } catch (e) {
        baseBulletins = INITIAL_BULLETINS_DATABASE;
      }
    }

    const mappedBaseBulletins = baseBulletins.map((item: any) => ({
      facebookShares: Math.floor(Math.random() * 4) + 1,
      linkedinShares: Math.floor(Math.random() * 8) + 1,
      whatsappShares: Math.floor(Math.random() * 15) + 3,
      twitterShares: Math.floor(Math.random() * 4) + 1,
      linkCopied: Math.floor(Math.random() * 20) + 5,
      ...item
    }));

    const merged = [...approvedUserBulletins];
    mappedBaseBulletins.forEach((item: any) => {
      if (!merged.some(x => x.id === item.id)) {
        merged.push(item);
      }
    });

    localStorage.setItem("lpgportal_bulletins_db", JSON.stringify(merged));
    return merged;
  });

  // Share States & Toasts
  const [shareTarget, setShareTarget] = useState<{ item: any; type: "news" | "bulletin" } | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3000);
  };

  // Sync state modifications dynamically back to local storage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_news_db", JSON.stringify(newsDb));
    }
  }, [newsDb]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_bulletins_db", JSON.stringify(bulletinsDb));
    }
  }, [bulletinsDb]);

  // Dynamic synchronization effect to ensure newsDb & bulletinsDb mirror any change to userContentsDb
  React.useEffect(() => {
    const approvedUserNews = userContentsDb
      .filter((item: any) => item.status === "Yayınlandı" && item.category !== "Teknik Bülten")
      .map((item: any) => ({
        id: item.id === "uc-1" ? "news-toyota-2026" : item.id === "uc-2" ? "tb-atiker-grand-firm" : item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        date: item.createdAt,
        author: item.authorName,
        image: item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300",
        tags: item.tags || ["üye", "lpgportal"],
        likes: item.likes || 0,
        views: item.views || 0,
        content: item.content,
        facebookShares: item.facebookShares || 0,
        linkedinShares: item.linkedinShares || 0,
        whatsappShares: item.whatsappShares || 0,
        twitterShares: item.twitterShares || 0,
        linkCopied: item.linkCopied || 0,
        lpgBrand: item.lpgBrand || "BRC Türkiye",
        manufacturerAccount: item.manufacturerAccount || item.authorName,
        status: item.status || "Yayınlandı",
        published: item.published !== undefined ? item.published : true,
        publishedAt: item.publishedAt || item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        authorId: item.authorId || item.authorEmail,
        approvedBy: item.approvedBy || "Admin",
        approvedAt: item.approvedAt || item.createdAt
      }));

    setNewsDb(prev => {
      const baseNews = prev.filter((item: any) => {
        const isUserItem = item.id.startsWith("uc-") || item.id === "news-toyota-2026" || item.id === "tb-atiker-grand-firm";
        return !isUserItem;
      });
      const merged = [...approvedUserNews];
      baseNews.forEach((item: any) => {
        if (!merged.some(x => x.id === item.id)) {
          merged.push(item);
        }
      });
      return merged;
    });

    const approvedUserBulletins = userContentsDb
      .filter((item: any) => item.status === "Yayınlandı" && item.category === "Teknik Bülten")
      .map((item: any) => ({
        id: item.id === "uc-1" ? "news-toyota-2026" : item.id === "uc-2" ? "tb-atiker-grand-firm" : item.id,
        title: item.title,
        summary: item.summary,
        category: item.category,
        date: item.createdAt,
        author: item.authorName,
        image: item.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300",
        tags: item.tags || ["üye", "lpgportal"],
        likes: item.likes || 0,
        views: item.views || 0,
        content: item.content,
        facebookShares: item.facebookShares || 0,
        linkedinShares: item.linkedinShares || 0,
        whatsappShares: item.whatsappShares || 0,
        twitterShares: item.twitterShares || 0,
        linkCopied: item.linkCopied || 0,
        lpgBrand: item.lpgBrand || "BRC Türkiye",
        manufacturerAccount: item.manufacturerAccount || item.authorName,
        status: item.status || "Yayınlandı",
        published: item.published !== undefined ? item.published : true,
        publishedAt: item.publishedAt || item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
        authorId: item.authorId || item.authorEmail,
        approvedBy: item.approvedBy || "Admin",
        approvedAt: item.approvedAt || item.createdAt
      }));

    setBulletinsDb(prev => {
      const baseBulletins = prev.filter((item: any) => {
        const isUserItem = item.id.startsWith("uc-") || item.id === "news-toyota-2026" || item.id === "tb-atiker-grand-firm";
        return !isUserItem;
      });
      const merged = [...approvedUserBulletins];
      baseBulletins.forEach((item: any) => {
        if (!merged.some(x => x.id === item.id)) {
          merged.push(item);
        }
      });
      return merged;
    });
  }, [userContentsDb]);

  // Software & Calibration Library Database States
  const INITIAL_LIBRARY_DATABASE = [
    {
      id: "lib-1",
      kit_brand: "BRC",
      car_brand: "Fiat",
      car_model: "Egea",
      model_year: "2024",
      engine_volume: "1.4 Fire",
      fuel_type: "Benzin/LPG",
      engine_code: "843A1000",
      ecu_code: "SQ32-11",
      compatible_kit: "BRC Sequent 32 OBD",
      software_version: "V2.10.4",
      update_date: "2026-05-10",
      short_desc: "Fiat Egea 1.4 Fire motorlar için optimize edilmiş soğuk motor geçiş ve MAP kalibrasyon haritası.",
      update_notes: "MAP haritası zengin karışım rölanti dalgalanması için optimize edildi. Soğuk havada benzinden LPG'ye geçiş süresi 25 saniyeye düşürüldü.",
      technical_notes: "Regülatör sıcaklığı 35 dereceye ulaştığında geçiş aktif olur. Enjektör nozul boyutu 1.8mm olarak seçilmelidir. MAP basıncı 1.15 bar olarak ayarlanmalıdır.",
      file_name: "brc_sequent32_egea_1.4_v2104.fpd",
      approved: true,
      author_id: "mfr-brc",
      author_brand: "BRC",
      downloads: 142,
      last_download: "2026-06-15",
      created_at: "2026-05-10"
    },
    {
      id: "lib-2",
      kit_brand: "Atiker",
      car_brand: "Toyota",
      car_model: "Corolla",
      model_year: "2023",
      engine_volume: "1.5 Dynamic Force",
      fuel_type: "Benzin/LPG",
      engine_code: "M15A-FKS",
      ecu_code: "ATK-OBD-V32",
      compatible_kit: "Atiker Grand OBD 3 Cylinder",
      software_version: "V3.2.1",
      update_date: "2026-06-01",
      short_desc: "Toyota Corolla 1.5 Dynamic Force 3 silindirli motor uyumlu kalibrasyon dosyası.",
      update_notes: "Üç silindir motor yapısındaki rölanti sarsıntısı MAP parametreleri ve enjeksiyon offset değerleri ile dengelendi. LTFT/STFT dengesi %2 limitlerinde tutuldu.",
      technical_notes: "Romano enjektör seçilerek 2.0ms minimum enjeksiyon süresi girilmelidir. Gaz kesme (Cut-off) çıkışında zenginleşme offseti 0.15ms artırıldı.",
      file_name: "atiker_grand_corolla1.5_v321.afcp",
      approved: true,
      author_id: "mfr-atiker",
      author_brand: "Atiker",
      downloads: 95,
      last_download: "2026-06-16",
      created_at: "2026-06-01"
    },
    {
      id: "lib-3",
      kit_brand: "Prins",
      car_brand: "Chery",
      car_model: "Omoda 5",
      model_year: "2025",
      engine_volume: "1.6 T-GDI",
      fuel_type: "Benzin/LPG",
      engine_code: "SQRE4T15C",
      ecu_code: "VSI-3-DI-V12",
      compatible_kit: "Prins VSI-3 DI Turbo",
      software_version: "V1.0.8",
      update_date: "2026-06-15",
      short_desc: "Chery Omoda 5 T-GDI Direkt Enjeksiyonlu motor için yeni yazılım güncellemesi.",
      update_notes: "Benzin tüketim stratejisi (petrol contribution) yüksek devirlerde (%5'e) optimize edildi. Yüksek basınç pompası koruma döngüsü eklendi.",
      technical_notes: "Chery 1.6 T-GDI ACTECO motorlarda yüksek enjeksiyon basıncı nedeniyle DI kit montaj kılavuzuna harfiyen uyulmalı, regülatör vakum bağlantısı manifolddan doğrudan alınmalıdır.",
      file_name: "prins_vsi3di_omoda5_v108.fpd",
      approved: false,
      author_id: "mfr-prins",
      author_brand: "Prins",
      downloads: 0,
      last_download: null,
      created_at: "2026-06-15"
    }
  ];

  const [libraryDb, setLibraryDb] = useState<any[]>(() => {
    if (typeof window === "undefined") return INITIAL_LIBRARY_DATABASE;
    const saved = localStorage.getItem("lpgportal_calibration_library_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_LIBRARY_DATABASE;
      }
    }
    localStorage.setItem("lpgportal_calibration_library_db", JSON.stringify(INITIAL_LIBRARY_DATABASE));
    return INITIAL_LIBRARY_DATABASE;
  });

  const [downloadLogs, setDownloadLogs] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("lpgportal_download_logs_db");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const initialLogs = [
      {
        id: "dl-1",
        file_id: "lib-1",
        file_title: "Fiat Egea 1.4 Fire motorlar için optimize edilmiş soğuk motor geçiş ve MAP kalibrasyon haritası.",
        user_id: "u-dealer1",
        user_name: "Kamil Usta",
        company_name: "Kamil Oto Gaz",
        date: "2026-06-15",
        time: "14:35",
        ip_address: "85.105.45.22"
      },
      {
        id: "dl-2",
        file_id: "lib-2",
        file_title: "Toyota Corolla 1.5 Dynamic Force 3 silindirli motor uyumlu kalibrasyon dosyası.",
        user_id: "u-dealer2",
        user_name: "Mehmet Demir",
        company_name: "Demir Otogaz Servisi",
        date: "2026-06-16",
        time: "09:12",
        ip_address: "85.105.12.189"
      }
    ];
    localStorage.setItem("lpgportal_download_logs_db", JSON.stringify(initialLogs));
    return initialLogs;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_calibration_library_db", JSON.stringify(libraryDb));
    }
  }, [libraryDb]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lpgportal_download_logs_db", JSON.stringify(downloadLogs));
    }
  }, [downloadLogs]);

  // Active Item Selectors
  const [selectedNewsId, setSelectedNewsId] = useState<string>("news-a1");
  const [selectedBulletinId, setSelectedBulletinId] = useState<string>("tb-2026-001");

  // Automatically increment views on selection
  React.useEffect(() => {
    if (!selectedNewsId) return;
    setNewsDb(prev => {
      const isAlreadyViewedKey = `viewed_news_${selectedNewsId}`;
      if (sessionStorage.getItem(isAlreadyViewedKey)) return prev;
      sessionStorage.setItem(isAlreadyViewedKey, "1");
      
      const next = prev.map(n => {
        if (n.id === selectedNewsId) {
          return { ...n, views: (n.views || 0) + 1 };
        }
        return n;
      });
      return next;
    });
  }, [selectedNewsId]);

  React.useEffect(() => {
    if (!selectedBulletinId) return;
    setBulletinsDb(prev => {
      const isAlreadyViewedKey = `viewed_bulletin_${selectedBulletinId}`;
      if (sessionStorage.getItem(isAlreadyViewedKey)) return prev;
      sessionStorage.setItem(isAlreadyViewedKey, "1");
      
      const next = prev.map(b => {
        if (b.id === selectedBulletinId) {
          return { ...b, views: (b.views || 0) + 1 };
        }
        return b;
      });
      return next;
    });
  }, [selectedBulletinId]);

  const handleShareAction = (
    platform: "facebook" | "linkedin" | "whatsapp" | "twitter" | "instagram" | "copy",
    item: any,
    type: "news" | "bulletin"
  ) => {
    const shareUrl = `https://lpgportal.com/${type === "news" ? "haber" : "bulten"}/${item.id}`;
    const title = translateEntity(item, "title") || item.title;
    const summary = translateEntity(item, "summary") || item.summary;

    if (type === "news") {
      setNewsDb(prev => {
        const next = prev.map(n => {
          if (n.id === item.id) {
            const updated = { ...n };
            if (platform === "facebook") updated.facebookShares = (updated.facebookShares || 0) + 1;
            else if (platform === "linkedin") updated.linkedinShares = (updated.linkedinShares || 0) + 1;
            else if (platform === "whatsapp") updated.whatsappShares = (updated.whatsappShares || 0) + 1;
            else if (platform === "twitter") updated.twitterShares = (updated.twitterShares || 0) + 1;
            else if (platform === "instagram" || platform === "copy") updated.linkCopied = (updated.linkCopied || 0) + 1;
            return updated;
          }
          return n;
        });
        localStorage.setItem("lpgportal_news_db", JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("lpgportal_db_update", { detail: { key: "lpgportal_news_db", value: next } }));
        window.dispatchEvent(new Event("storage"));
        return next;
      });
    } else {
      setBulletinsDb(prev => {
        const next = prev.map(b => {
          if (b.id === item.id) {
            const updated = { ...b };
            if (platform === "facebook") updated.facebookShares = (updated.facebookShares || 0) + 1;
            else if (platform === "linkedin") updated.linkedinShares = (updated.linkedinShares || 0) + 1;
            else if (platform === "whatsapp") updated.whatsappShares = (updated.whatsappShares || 0) + 1;
            else if (platform === "twitter") updated.twitterShares = (updated.twitterShares || 0) + 1;
            else if (platform === "instagram" || platform === "copy") updated.linkCopied = (updated.linkCopied || 0) + 1;
            return updated;
          }
          return b;
        });
        localStorage.setItem("lpgportal_bulletins_db", JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("lpgportal_db_update", { detail: { key: "lpgportal_bulletins_db", value: next } }));
        window.dispatchEvent(new Event("storage"));
        return next;
      });
    }

    // Visitor simulation mechanism with 1-3 seconds random delay
    const randomDelay = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
      if (type === "news") {
        setNewsDb(prev => {
          const next = prev.map(n => {
            if (n.id === item.id) {
              return { ...n, views: (n.views || 0) + 1 };
            }
            return n;
          });
          localStorage.setItem("lpgportal_news_db", JSON.stringify(next));
          window.dispatchEvent(new CustomEvent("lpgportal_db_update", { detail: { key: "lpgportal_news_db", value: next } }));
          window.dispatchEvent(new Event("storage"));
          return next;
        });
      } else {
        setBulletinsDb(prev => {
          const next = prev.map(b => {
            if (b.id === item.id) {
              return { ...b, views: (b.views || 0) + 1 };
            }
            return b;
          });
          localStorage.setItem("lpgportal_bulletins_db", JSON.stringify(next));
          window.dispatchEvent(new CustomEvent("lpgportal_db_update", { detail: { key: "lpgportal_bulletins_db", value: next } }));
          window.dispatchEvent(new Event("storage"));
          return next;
        });
      }
      showToast(tLocal("Ziyaretçi Simülasyonu: Paylaşılan linkten 1 yeni organik ziyaretçi geldi.", "Visitor Simulation: 1 new organic visitor arrived from the shared link."));
    }, randomDelay);

    if (platform === "facebook") {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title + "\n\n" + summary)}`;
      window.open(fbUrl, "_blank");
      showToast("Facebook paylaşım ekranı açıldı.");
    } else if (platform === "linkedin") {
      const lnUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(lnUrl, "_blank");
      showToast("LinkedIn paylaşım ekranı açıldı.");
    } else if (platform === "whatsapp") {
      const msg = `LPG PORTAL'da yayınlanan bu ${type === "news" ? "habere" : "bültene"} göz atın:\n\n${title}\n\n${shareUrl}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");
      showToast("WhatsApp paylaşım ekranı açıldı.");
    } else if (platform === "twitter") {
      const msg = `${title}\n\n${shareUrl}`;
      const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`;
      window.open(twUrl, "_blank");
      showToast("X (Twitter) paylaşım ekranı açıldı.");
    } else if (platform === "instagram") {
      const copyText = `${title}\n\n${shareUrl}`;
      navigator.clipboard.writeText(copyText).then(() => {
        showToast("İçerik panoya kopyalandı.");
      }).catch(() => {
        showToast("Kopyalama başarısız oldu.");
      });
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Bağlantı panoya kopyalandı.");
      }).catch(() => {
        showToast("Kopyalama başarısız oldu.");
      });
    }
  };

  // Advanced Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBrand, setSearchBrand] = useState("Hepsi");
  const [searchModel, setSearchModel] = useState("");
  const [searchMotorCode, setSearchMotorCode] = useState("");
  const [searchLpgBrand, setSearchLpgBrand] = useState("Hepsi");
  const [searchProductType, setSearchProductType] = useState("Hepsi");
  const [searchBulletinNo, setSearchBulletinNo] = useState("");
  const [searchCategory, setSearchCategory] = useState("Hepsi");
  const [searchDateRange, setSearchDateRange] = useState("Hepsi");

  // Library specific search states
  const [searchModelYear, setSearchModelYear] = useState("");
  const [searchEcuCode, setSearchEcuCode] = useState("");
  const [searchCompatibleKit, setSearchCompatibleKit] = useState("");
  const [searchSoftwareVersion, setSearchSoftwareVersion] = useState("");

  // Library Upload Form States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadKitBrand, setUploadKitBrand] = useState("BRC");
  const [uploadCarBrand, setUploadCarBrand] = useState("");
  const [uploadCarModel, setUploadCarModel] = useState("");
  const [uploadModelYear, setUploadModelYear] = useState("");
  const [uploadEngineVolume, setUploadEngineVolume] = useState("");
  const [uploadFuelType, setUploadFuelType] = useState("Benzin/LPG");
  const [uploadEngineCode, setUploadEngineCode] = useState("");
  const [uploadEcuCode, setUploadEcuCode] = useState("");
  const [uploadCompatibleKit, setUploadCompatibleKit] = useState("");
  const [uploadSoftwareVersion, setUploadSoftwareVersion] = useState("");
  const [uploadUpdateDate, setUploadUpdateDate] = useState("");
  const [uploadShortDesc, setUploadShortDesc] = useState("");
  const [uploadUpdateNotes, setUploadUpdateNotes] = useState("");
  const [uploadTechnicalNotes, setUploadTechnicalNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");

  // Library details and stats selection states
  const [selectedLibFile, setSelectedLibFile] = useState<any | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedStatsFileId, setSelectedStatsFileId] = useState<string | null>(null);

  // AI Creator Modal States
  const [isAiCreatorOpen, setIsAiCreatorOpen] = useState(false);
  const [aiType, setAiType] = useState<"news" | "bulletin">("news");
  const [aiTitle, setAiTitle] = useState("");
  const [aiSelectedCategory, setAiSelectedCategory] = useState("Sektör Haberleri");
  const [aiExtraDetails, setAiExtraDetails] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccessMsg, setGenerationSuccessMsg] = useState("");

  // Comment Form States (Haberler & Bültenler için ortak)
  const [commentName, setCommentName] = useState("");
  const [commentRole, setCommentRole] = useState(tLocal("Araç Sahibi", "Vehicle Owner"));
  const [commentText, setCommentText] = useState("");

  // Category Constants
  const HABER_CATEGORIES = [
    "Hepsi",
    "Haber",
    "Blog Yazısı",
    "Podcast",
    "Eğitim İçeriği",
    "Sektör Haberleri",
    "LPG ve Akaryakıt Fiyatları",
    "Yeni Araçlar ve LPG Uyumluluğu",
    "Marka ve Ürün Haberleri",
    "Bayi ve Servis Haberleri",
    "Teknoloji Haberleri",
    "Fuarlar ve Organizasyonlar"
  ];

  const BULTEN_CATEGORIES = [
    "Hepsi",
    "Teknik Bülten",
    "Üretici Teknik Bültenleri",
    "Montaj Prosedürleri",
    "Teknik Servis Duyuruları",
    "Ürün Güncellemeleri",
    "Arıza ve Çözüm Merkezi",
    "Teknik Eğitim Dokümanları",
    "Motor Bazlı Teknik Rehberler"
  ];

  const BRAND_FILTERS = [
    "Hepsi", "Prins", "BRC", "Lovato", "Landirenzo", "Landi Renzo", "Atiker", "Romano", "AEB", "Hana", "Hana Engineering", "Tomasetto", "OMVL", "Zavoli",
    "AC Stag", "Add Vantage", "AFC", "Aldesa", "Alex", "Oto-Gaz Merkezi", "Autogas Italia", "Autronic", "Bedini", "Bigas", 
    "Digitronic", "DT Gaz Sistemi", "E-Gaz", "EGS - EuroGasService", "Econova", "Eko Alma - ESGI", "Elpigaz", "Emer", 
    "Emmegas", "Energia İtalya", "Eurogas", "Europegas", "Fobos", "Fuel Fusion", "Gas On Diesel", "Gasitaly", 
    "GFI Alternative Fuel Systems", "GREENGAS", "Gurtner", "HL Propan", "ICOM", "Impco", "Iwema", "King (AEB)", 
    "KME", "Lo-Gas", "Longas", "LPGTECH", "Marini", "MG Motor Gas", "Micromise", "Mimgas", "NLP LPG", "Plineks", 
    "Ramses", "Retrogaz", "Solaris Diesel", "Spark", "Stako", "Star Gas", "Stefanelli", "Tamona", "Teleflex", 
    "Ultragas", "Versus", "Vialle", "Vikars", "Vogels Autogas System", "Voltran", "XLR8", "Zamel Autogas", "Diğer"
  ];
  const PRODUCT_TYPES = ["Hepsi", "ECU", "Regülatör", "Enjektör", "Tank", "Multivalf", "Sensör", "Filtre"];

  // Reset all search criteria
  const handleResetSearch = () => {
    setSearchQuery("");
    setSearchBrand("Hepsi");
    setSearchModel("");
    setSearchMotorCode("");
    setSearchLpgBrand("Hepsi");
    setSearchProductType("Hepsi");
    setSearchBulletinNo("");
    setSearchCategory("Hepsi");
    setSearchDateRange("Hepsi");
    setSearchModelYear("");
    setSearchEcuCode("");
    setSearchCompatibleKit("");
    setSearchSoftwareVersion("");
  };

  // Switch category list based on type in AI generator
  const handleAiTypeChange = (type: "news" | "bulletin") => {
    setAiType(type);
    if (type === "news") {
      setAiSelectedCategory("Sektör Haberleri");
    } else {
      setAiSelectedCategory("Üretici Teknik Bültenleri");
    }
  };

  // Filter Functions
  const getFilteredNews = () => {
    return newsDb.filter(item => {
      // Basic text search
      const textMatch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category Match
      const categoryMatch = searchCategory === "Hepsi" || item.category === searchCategory;

      // Vehicle Brand Match (specifically for "Yeni Araçlar ve LPG Uyumluluğu")
      const vehicleBrandMatch = searchBrand === "Hepsi" || (item.vehicleBrand && item.vehicleBrand.toLowerCase().includes(searchBrand.toLowerCase()));

      // Vehicle Model Match
      const vehicleModelMatch = searchModel === "" || (item.vehicleModel && item.vehicleModel.toLowerCase().includes(searchModel.toLowerCase()));

      // Motor code match
      const motorCodeMatch = searchMotorCode === "" || (item.motorType && item.motorType.toLowerCase().includes(searchMotorCode.toLowerCase()));

      // Product Type match
      const productTypeMatch = searchProductType === "Hepsi" || item.tags.some(t => t.toLowerCase().includes(searchProductType.toLowerCase())) || item.title.toLowerCase().includes(searchProductType.toLowerCase());

      return textMatch && categoryMatch && vehicleBrandMatch && vehicleModelMatch && motorCodeMatch && productTypeMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });
  };

  const getFilteredBulletins = () => {
    return bulletinsDb.filter(item => {
      // Basic text
      const textMatch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const categoryMatch = searchCategory === "Hepsi" || item.category === searchCategory;

      // LPG Brand
      const lpgBrandMatch = searchLpgBrand === "Hepsi" || (item.lpgBrand && item.lpgBrand.toLowerCase() === searchLpgBrand.toLowerCase());

      // Technical Bulletin Number or ID
      const bNoMatch = searchBulletinNo === "" || item.id.toLowerCase().includes(searchBulletinNo.toLowerCase());

      // Motor code match
      const motorCodeMatch = searchMotorCode === "" || (item.targetMotor && item.targetMotor.toLowerCase().includes(searchMotorCode.toLowerCase()));

      const hasPassedBase = textMatch && categoryMatch && lpgBrandMatch && bNoMatch && motorCodeMatch;
      if (!hasPassedBase) return false;

      // --- BRAND ACCESS CONTROL ENGINE ---
      // Anonymous, visitors and vehicle owners cannot see any bulletins
      if (!activeUser || activeUser.role === "visitor" || activeUser.role === "vehicle_owner") {
        return false;
      }

      // Admins can see all bulletins
      if (activeUser.role === "admin") {
        return true;
      }

      // Manufacturers can only see their own brand
      if (activeUser.role === "manufacturer") {
        const mfrBrand = activeUser.brand_name || "";
        return item.lpgBrand && item.lpgBrand.toLowerCase().replace(/\s/g, "") === mfrBrand.toLowerCase().replace(/\s/g, "");
      }

      // Dealers and engineers can only see if it's in their working_brands
      const userBrands = activeUser.working_brands || [];
      const cleanUserBrands = userBrands.map(b => b.toLowerCase().replace(/\s/g, ""));
      if (!item.lpgBrand) return false;
      return cleanUserBrands.includes(item.lpgBrand.toLowerCase().replace(/\s/g, ""));
    }).sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || 0).getTime();
      return dateB - dateA;
    });
  };

  const getFilteredLibrary = () => {
    return libraryDb.filter(item => {
      // 1. Role-based visibility
      if (!activeUser) return false;
      const userRole = activeUser.role;
      if (userRole === "admin") {
        // Admin sees all files
      } else if (userRole === "manufacturer") {
        // Manufacturer sees approved files + their own pending files
        const mfrBrand = activeUser.brand_name || "";
        const isOwnFile = item.author_brand && item.author_brand.toLowerCase().trim() === mfrBrand.toLowerCase().trim();
        if (!item.approved && !isOwnFile) {
          return false;
        }
      } else if (userRole === "dealer") {
        // Dealer only sees approved files
        if (!item.approved) return false;
      } else {
        // Other roles can't see anything
        return false;
      }

      // 2. Filter criteria
      const textMatch = searchQuery === "" || 
        (item.short_desc && item.short_desc.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (item.update_notes && item.update_notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.technical_notes && item.technical_notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const lpgBrandMatch = searchLpgBrand === "Hepsi" || 
        (item.kit_brand && item.kit_brand.toLowerCase() === searchLpgBrand.toLowerCase());

      const carBrandMatch = searchBrand === "Hepsi" || 
        (item.car_brand && item.car_brand.toLowerCase() === searchBrand.toLowerCase());

      const carModelMatch = searchModel === "" || 
        (item.car_model && item.car_model.toLowerCase().includes(searchModel.toLowerCase()));

      const modelYearMatch = searchModelYear === "" || 
        (item.model_year && item.model_year.toLowerCase().includes(searchModelYear.toLowerCase()));

      const engineCodeMatch = searchMotorCode === "" || 
        (item.engine_code && item.engine_code.toLowerCase().includes(searchMotorCode.toLowerCase()));

      const ecuCodeMatch = searchEcuCode === "" || 
        (item.ecu_code && item.ecu_code.toLowerCase().includes(searchEcuCode.toLowerCase()));

      const compatibleKitMatch = searchCompatibleKit === "" || 
        (item.compatible_kit && item.compatible_kit.toLowerCase().includes(searchCompatibleKit.toLowerCase()));

      const softwareVersionMatch = searchSoftwareVersion === "" || 
        (item.software_version && item.software_version.toLowerCase().includes(searchSoftwareVersion.toLowerCase()));

      return textMatch && lpgBrandMatch && carBrandMatch && carModelMatch && modelYearMatch && engineCodeMatch && ecuCodeMatch && compatibleKitMatch && softwareVersionMatch;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at || a.update_date || 0).getTime();
      const dateB = new Date(b.created_at || b.update_date || 0).getTime();
      return dateB - dateA;
    });
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) {
      alert("Lütfen bir dosya seçiniz.");
      return;
    }
    
    const mfrBrand = activeUser?.role === "manufacturer" ? (activeUser.brand_name || "Atiker") : uploadKitBrand;
    const newId = `lib-${Date.now()}`;
    const newFile = {
      id: newId,
      kit_brand: mfrBrand,
      car_brand: uploadCarBrand,
      car_model: uploadCarModel,
      model_year: uploadModelYear,
      engine_volume: uploadEngineVolume,
      fuel_type: uploadFuelType,
      engine_code: uploadEngineCode,
      ecu_code: uploadEcuCode,
      compatible_kit: uploadCompatibleKit,
      software_version: uploadSoftwareVersion,
      update_date: uploadUpdateDate,
      short_desc: uploadShortDesc,
      update_notes: uploadUpdateNotes,
      technical_notes: uploadTechnicalNotes,
      file_name: uploadFileName,
      approved: activeUser?.role === "admin",
      author_id: activeUser?.id || "unknown",
      author_brand: mfrBrand,
      downloads: 0,
      last_download: null,
      created_at: new Date().toISOString().split('T')[0]
    };

    setLibraryDb(prev => [newFile, ...prev]);
    setIsUploadOpen(false);

    // Clear form
    setUploadCarBrand("");
    setUploadCarModel("");
    setUploadModelYear("");
    setUploadEngineVolume("");
    setUploadFuelType("Benzin/LPG");
    setUploadEngineCode("");
    setUploadEcuCode("");
    setUploadCompatibleKit("");
    setUploadSoftwareVersion("");
    setUploadUpdateDate(new Date().toISOString().split('T')[0]);
    setUploadShortDesc("");
    setUploadUpdateNotes("");
    setUploadTechnicalNotes("");
    setUploadFile(null);
    setUploadFileName("");

    showToast(activeUser?.role === "admin" ? "Dosya başarıyla yüklendi ve yayınlandı." : "Dosya başarıyla yüklendi, yönetici onayı bekleniyor.");
  };

  const handleDownloadFile = (item: any) => {
    if (!activeUser) {
      alert("Dosya indirmek için oturum açmalısınız.");
      return;
    }
    const userRole = activeUser.role;
    if (userRole !== "dealer" && userRole !== "manufacturer" && userRole !== "admin") {
      alert("Bu dosyayı indirmek için yetkiniz bulunmamaktadır.");
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const simulatedIp = `85.105.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    
    const newLog = {
      id: `dl-${Date.now()}`,
      file_id: item.id,
      file_title: item.short_desc,
      user_id: activeUser.id,
      user_name: activeUser.name || activeUser.email,
      company_name: activeUser.company_name || activeUser.brand_name || "Bireysel Kullanıcı",
      date: dateStr,
      time: timeStr,
      ip_address: simulatedIp
    };

    setDownloadLogs(prev => [newLog, ...prev]);

    setLibraryDb(prev => prev.map(f => {
      if (f.id === item.id) {
        return {
          ...f,
          downloads: (f.downloads || 0) + 1,
          last_download: dateStr
        };
      }
      return f;
    }));

    const dummyContent = `LPGPORTAL SECURE ECU FILE\nFile: ${item.file_name}\nKit Brand: ${item.kit_brand}\nCar Brand: ${item.car_brand}\nECU Code: ${item.ecu_code}\nDate: ${dateStr}\nDownloaded by: ${activeUser.name || activeUser.email}\nCompany: ${activeUser.company_name || activeUser.brand_name || "Bireysel Kullanıcı"}\nSignature: LPGPORTAL_OK_2026`;
    const blob = new Blob([dummyContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`${item.file_name} başarıyla indirildi.`);
  };

  const handleAdminApprove = (item: any) => {
    setLibraryDb(prev => prev.map(f => {
      if (f.id === item.id) {
        return { ...f, approved: true };
      }
      return f;
    }));

    const authorName = item.kit_brand + " Yetkilisi";
    const authorEmail = `${item.kit_brand.toLowerCase()}@lpgportal.com`;

    sendNotifications(
      authorName,
      authorEmail,
      `${item.kit_brand} ${item.ecu_code} Yazılım Dosyası`,
      "Onaylandı"
    );

    showToast("Yazılım dosyası onaylandı ve kütüphanede yayınlandı!");
  };

  const handleAdminReject = (id: string) => {
    setLibraryDb(prev => prev.filter(f => f.id !== id));
    showToast("Yazılım dosyası reddedildi ve sistemden silindi.");
  };

  // Aggregate collections for consolidated Digital Archive Search
  const getAllSearchArchiveResults = () => {
    const matchedNews = getFilteredNews().map(n => ({ ...n, originType: "Haber" }));
    const matchedBulletins = getFilteredBulletins().map(b => ({ ...b, originType: "Teknik Bülten" }));
    return [...matchedNews, ...matchedBulletins].sort((a, b) => b.date.localeCompare(a.date));
  };

  // Find currently selected structures
  const activeNews = newsDb.find(n => n.id === selectedNewsId) || newsDb[0];
  
  const activeBulletin = (() => {
    // Get all authorized bulletins
    const authBulletins = bulletinsDb.filter(b => {
      if (!activeUser || activeUser.role === "visitor" || activeUser.role === "vehicle_owner") {
        return false;
      }
      if (activeUser.role === "admin") {
        return true;
      }
      if (activeUser.role === "manufacturer") {
        const mfrBrand = activeUser.brand_name || "";
        return b.lpgBrand && b.lpgBrand.toLowerCase().replace(/\s/g, "") === mfrBrand.toLowerCase().replace(/\s/g, "");
      }
      // Dealer or engineer
      const userBrands = activeUser.working_brands || [];
      const cleanUserBrands = userBrands.map(brandVal => brandVal.toLowerCase().replace(/\s/g, ""));
      if (!b.lpgBrand) return false;
      return cleanUserBrands.includes(b.lpgBrand.toLowerCase().replace(/\s/g, ""));
    });

    if (authBulletins.length === 0) return null;

    // Try to find the selected one within the authorized ones
    const foundAuth = authBulletins.find(b => b.id === selectedBulletinId);
    return foundAuth || authBulletins[0];
  })();

  // Like Handlers
  const handleLikeNews = (id: string) => {
    setNewsDb(prev => prev.map(n => n.id === id ? { ...n, likes: n.likes + 1 } : n));
  };

  const handleLikeBulletin = (id: string) => {
    setBulletinsDb(prev => prev.map(b => b.id === id ? { ...b, likes: b.likes + 1 } : b));
  };

  // Comment submits
  const handleAddComment = (e: React.FormEvent, targetType: "news" | "bulletin", itemId: string) => {
    e.preventDefault();
    if (!commentName || !commentText) return;

    const newComment = {
      id: "comment_" + Date.now(),
      userName: commentName,
      userRole: commentRole,
      comment: commentText,
      created_at: new Date().toISOString().split("T")[0]
    };

    if (targetType === "news") {
      setNewsDb(prev => prev.map(n => {
        if (n.id === itemId) {
          return { ...n, comments: [...n.comments, newComment] };
        }
        return n;
      }));
    } else {
      setBulletinsDb(prev => prev.map(b => {
        if (b.id === itemId) {
          return { ...b, comments: [...b.comments, newComment] };
        }
        return b;
      }));
    }

    setCommentText("");
  };

  // Real backend or fallback automated creation call
  const handleAiContentGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle) return;

    setIsGenerating(true);
    setGenerationSuccessMsg("");

    try {
      const userSig = localStorage.getItem("lpgportal_active_user_sig") || "";
      const response = await fetch("/api/ai/generate-news-bulletin", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-LpgPortal-Secure": "true",
          "X-LpgPortal-User-Id": activeUser?.id || "",
          "X-LpgPortal-User-Email": activeUser?.email || "",
          "X-LpgPortal-User-Role": activeUser?.role || "",
          "X-LpgPortal-Session-Token": userSig
        },
        body: JSON.stringify({
          type: aiType,
          title: aiTitle,
          category: aiSelectedCategory,
          extraDetails: aiExtraDetails
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const item = resData.data;
        const completeItem = {
          ...item,
          id: aiType === "news" ? `news-ai-${Date.now()}` : `tb-ai-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          author: "Yapay Zeka Editörü",
          authorTitle: "LPG PORTAL AI Sistemi",
          likes: 5,
          views: 12,
          comments: []
        };

        if (aiType === "news") {
          setNewsDb(prev => [completeItem, ...prev]);
          setSelectedNewsId(completeItem.id);
          setActiveMode("news");
        } else {
          setBulletinsDb(prev => [completeItem, ...prev]);
          setSelectedBulletinId(completeItem.id);
          setActiveMode("technical");
        }

        setGenerationSuccessMsg("İçerik, SEO Başlığı, Meta Etiketleri ve Sosyal Medya Şablonu dahil olmak üzere başarıyla üretildi!");
        setAiTitle("");
        setAiExtraDetails("");
        setTimeout(() => {
          setIsAiCreatorOpen(false);
          setGenerationSuccessMsg("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredNewsList = getFilteredNews();
  const filteredBulletinsList = getFilteredBulletins();
  const filteredLibraryList = getFilteredLibrary();
  const archiveList = getAllSearchArchiveResults();

  return (
    <div id="news-bulletins-center-root" className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Banner Ad */}
      {(() => {
        const topAd = adsDb.find(a => a.position === "top" && a.active);
        if (!topAd) return null;
        return (
          <div className="mb-6 rounded-xl overflow-hidden shadow-xs border border-slate-200">
            <a href={topAd.clickUrl} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-95">
              <img 
                src={topAd.imageUrl} 
                alt={topAd.title} 
                className="w-full h-auto max-h-[120px] sm:max-h-[160px] object-cover"
              />
            </a>
          </div>
        );
      })()}

      {/* Module Title Section */}
      <div className="text-center mb-8 border-b border-slate-100 pb-5">
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-150 flex items-center justify-center w-fit mx-auto gap-1">
          <Layers className="h-3.5 w-3.5" />
          {tLocal("Türkiye LPG Sektörü Dijital Arşiv & Referans kütüphanesi", "Turkey LPG Industry Digital Archive & Reference Library")}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight font-sans">
          {tLocal("Haberler & Teknik Bültenler Bilgi Enstitüsü", "News & Technical Bulletins Knowledge Hub")}
        </h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm">
          {tLocal("Sadece haber kentsel akışı değil; sızdırmazlık genelgelerinden, Valvematic veya T-GDI motor montaj standartlarına uzanan profesyonel sektörel arşivi tek ekranda arayın ve yönetin.", "More than just daily news; query and control official regulations, Valvematic standards, or T-GDI multi-fuel calibrations in our integrated tech index.")}
        </p>

        {/* Global Hub Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-4xl mx-auto gap-1.5 bg-slate-100 p-1 rounded-xl mt-6">
          <button
            type="button"
            onClick={() => { setActiveMode("news"); handleResetSearch(); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "news" 
                ? "bg-white text-emerald-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>{tLocal("Haberler", "News")}</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveMode("technical"); handleResetSearch(); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "technical" 
                ? "bg-white text-emerald-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>{tLocal("Teknik Bültenler", "Technical Bulletins")}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode("library"); handleResetSearch(); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "library" 
                ? "bg-white text-emerald-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>{tLocal("Yazılım ve Kalibrasyon Kütüphanesi", "Software & Calibration Library")}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode("author"); handleResetSearch(); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "author" 
                ? "bg-white text-emerald-700 shadow-xs font-sans" 
                : "text-slate-600 hover:text-slate-900 font-sans"
            }`}
          >
            <PenTool className="h-4 w-4" />
            <span>{tLocal("İçeriklerim & Yazarlık", "My Creator Console")}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode("archive"); handleResetSearch(); }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === "archive" 
                ? "bg-white text-emerald-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{tLocal("Dijital Arşiv", "Digital Archive")}</span>
          </button>
        </div>
      </div>

      {/* ADVANCED MULTI-PARAMETER SEARCH MODULE PANEL */}
      <div className="bg-slate-50 border border-slate-250/70 border-slate-200 rounded-xl p-5 mb-8 text-left">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider font-sans">
              {tLocal("Gelişmiş Bilgi ve Referans Filtreleri (Arama Sistemi)", "Advanced Knowledge & Reference Filters (Search System)")}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetSearch}
            className="text-[11px] text-slate-500 hover:text-emerald-700 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tLocal("Temizle", "Clear")}
          </button>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeMode === "library" ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4 text-xs font-semibold text-slate-600`}>
          
          {activeMode === "library" ? (
            <>
              {/* Parameter 1: General Query Input */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Metin Arama (Açıklama, Notlar)", "Full-text Search (Desc, Notes)")}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={tLocal("Örn: soğuk geçiş, zengin...", "e.g., cold transition...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>
              {/* Parameter 2: Kit Markası */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("LPG Kit Markası", "LPG Kit Brand")}</label>
                <select
                  value={searchLpgBrand}
                  onChange={(e) => setSearchLpgBrand(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  {BRAND_FILTERS.map(brand => (
                    <option key={brand} value={brand}>{brand === "Hepsi" ? tLocal("🔍 Tümü", "🔍 All") : brand}</option>
                  ))}
                </select>
              </div>
              {/* Parameter 3: Araç Markası */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Araç Markası", "Vehicle Make")}</label>
                <select
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="Hepsi">{tLocal("🔍 Marka Seçin (Tümü)", "🔍 Select Model (All)")}</option>
                  <option value="Chery">Chery</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Dacia">Dacia</option>
                  <option value="Fiat">Fiat</option>
                  <option value="Renault">Renault</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Hyundai">Hyundai</option>
                </select>
              </div>
              {/* Parameter 4: Araç Modeli */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Araç Modeli", "Vehicle Model")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: Egea, Corolla...", "e.g. Egea, Corolla...")}
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
              {/* Parameter 5: Model Yılı */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Model Yılı", "Model Year")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: 2024...", "e.g., 2024...")}
                  value={searchModelYear}
                  onChange={(e) => setSearchModelYear(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
              {/* Parameter 6: Motor Kodu */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Motor Kodu", "Engine Code")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: 843A1000...", "e.g., 843A1000...")}
                  value={searchMotorCode}
                  onChange={(e) => setSearchMotorCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
              {/* Parameter 7: ECU Kodu */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("ECU Kodu", "ECU Code")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: SQ32-11...", "e.g., SQ32-11...")}
                  value={searchEcuCode}
                  onChange={(e) => setSearchEcuCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
              {/* Parameter 8: Uyumlu LPG Kiti */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Uyumlu LPG Kiti", "Compatible LPG Kit")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: Sequent 32...", "e.g., Sequent 32...")}
                  value={searchCompatibleKit}
                  onChange={(e) => setSearchCompatibleKit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
              {/* Parameter 9: Yazılım Versiyonu */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Yazılım Versiyonu", "Software Version")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: V2.10.4...", "e.g., V2.10.4...")}
                  value={searchSoftwareVersion}
                  onChange={(e) => setSearchSoftwareVersion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>
            </>
          ) : (
            <>
              {/* Parameter 1: General Query Input */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Metin Arama (Haber/Bülten Gövdesi)", "Full-text Search (Body/Content)")}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={tLocal("Örn: subap, tank, Prins...", "e.g., valve, tank, Prins...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 pl-8 focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Parameter 2: Vehicle Brand */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium font-sans">{tLocal("Araç Markası", "Vehicle Make")}</label>
                <select
                  value={searchBrand}
                  onChange={(e) => setSearchBrand(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="Hepsi">{tLocal("🔍 Marka Seçin (Tümü)", "🔍 Select Model (All)")}</option>
                  <option value="Chery">Chery</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Honda">Honda</option>
                  <option value="Dacia">Dacia</option>
                  <option value="Fiat">Fiat</option>
                  <option value="Renault">Renault</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Hyundai">Hyundai</option>
                </select>
              </div>

              {/* Parameter 3: Vehicle Model */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium uppercase font-mono tracking-wider">{tLocal("Model", "Model")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: Omoda 5, Corolla, Civic...", "e.g., Omoda 5, Corolla, Civic...")}
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Parameter 4: Motor Code / Type */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Motor Kodu / Tipi", "Engine Code / Type")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: T-GDI, Valvematic, TSI...", "e.g., T-GDI, Valvematic, TSI...")}
                  value={searchMotorCode}
                  onChange={(e) => setSearchMotorCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Parameter 5: LPG Brand Filter */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("LPG Markası", "LPG Brand")}</label>
                <select
                  value={searchLpgBrand}
                  onChange={(e) => setSearchLpgBrand(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  {BRAND_FILTERS.map(brand => (
                    <option key={brand} value={brand}>{brand === "Hepsi" ? tLocal("🔍 Tümü", "🔍 All") : brand}</option>
                  ))}
                </select>
              </div>

              {/* Parameter 6: Product Type Tag */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Ürün Tipi (Malzeme)", "Material Category")}</label>
                <select
                  value={searchProductType}
                  onChange={(e) => setSearchProductType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  {PRODUCT_TYPES.map(type => (
                    <option key={type} value={type}>{type === "Hepsi" ? tLocal("🔍 Tümü", "🔍 All") : type}</option>
                  ))}
                </select>
              </div>

              {/* Parameter 7: Technical Bulletin No */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Teknik Bülten No", "Technical Bulletin ID")}</label>
                <input
                  type="text"
                  placeholder={tLocal("Örn: tb-2026-001", "e.g., tb-2026-001")}
                  value={searchBulletinNo}
                  onChange={(e) => setSearchBulletinNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Parameter 8: Selective Categories (Context switchable) */}
              <div className="space-y-1">
                <label className="block text-slate-500 font-medium">{tLocal("Kategori", "Category")}</label>
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                >
                  <option value="Hepsi">{tLocal("🔍 Tümü", "🔍 All")}</option>
                  {activeMode === "news" ? (
                    HABER_CATEGORIES.filter(c => c !== "Hepsi").map(cat => (
                      <option key={cat} value={cat}>{tLocal(cat, cat)}</option>
                    ))
                  ) : (
                    BULTEN_CATEGORIES.filter(c => c !== "Hepsi").map(cat => (
                      <option key={cat} value={cat}>{tLocal(cat, cat)}</option>
                    ))
                  )}
                </select>
              </div>
            </>
          )}

        </div>

        {/* AI GEN TRIGGER & TOTAL INDICATOR PANEL */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-200 rounded-xl p-3 mt-4 gap-3">
          <div className="text-[11px] text-slate-500 text-left">
            {tLocal("🎯 Filtrelerle eşleşen: ", "🎯 Matching filters: ")}<strong className="text-emerald-700">
              {activeMode === "news" ? filteredNewsList.length : activeMode === "technical" ? filteredBulletinsList.length : activeMode === "library" ? filteredLibraryList.length : archiveList.length} {tLocal("döküman", "documents")}
            </strong> {tLocal("bulundu.", "found.")}
          </div>

          {/* AI content generator modal button */}
          <button
            type="button"
            onClick={() => {
              // Rule: Check role permission
              const allowedRoles = ["admin", "vehicle_owner", "engineer", "dealer", "manufacturer"];
              const userRole = activeUser?.role || "visitor";
              if (!activeUser || !allowedRoles.includes(userRole)) {
                showToast(tLocal("İçerik oluşturabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.", "An active membership plan is required to publish or generate documents."));
                alert(tLocal("İçerik oluşturabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.", "An active membership plan is required to publish or generate documents."));
                return;
              }
              
              // Reset edit states
              setIsEditingContentId(null);
              setNewTitle("");
              setNewCategory("Haber");
              setNewSummary("");
              setNewContent("");
              setNewTags("");
              setNewImageUrl("https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=600&auto=format&fit=crop");
              setNewIsCoverImage(true);
              setIsCreatorOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer font-sans"
          >
            <PenTool className="h-4 w-4" />
            {tLocal("İçerik / Bülten Yaz", "Write Article / Bulletin")}
          </button>
        </div>
      </div>

      {/* POPUP MODAL: DİNAMİK İÇERİK ve TEKNİK BÜLTEN ÜRETİCİ FORM stüdyosu */}
      {isCreatorOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl relative text-left scrollbar-none max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-emerald-600" />
                  {isEditingContentId 
                    ? tLocal("İçeriği Düzenle & Revize Et", "Edit & Revise Document") 
                    : tLocal("Yeni Sektörel İçerik & Teknik Bülten Yaz", "Write New Sector Article & Technical Bulletin")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tLocal("Yazar olarak portal standartlarında makaleler ve emisyon sızdırmazlık onaylı teknik bültenler yayınlayın.", "Publish portal-standard articles and gas-emission certified technical bulletins as an active contributor.")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatorOpen(false)}
                className="text-slate-400 hover:text-slate-650 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* AI Assistant Section / Expandable Panel */}
            <div className="bg-emerald-50/50 border border-emerald-150/80 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider font-mono mb-2">
                <Sparkles className="h-4 w-4 text-emerald-600 animate-spin" />
                ✨ {tLocal("Yapay Zeka (Gemini 2.5) ile Taslak Hazırla", "Draft Document with Artificial Intelligence (Gemini 2.5)")}
              </h4>
              <p className="text-[11px] text-slate-650 leading-relaxed max-w-xl">
                {tLocal("Yazmak istediğiniz ana fikri veya başlığı girin. Modelimiz; seçilen kategoriye uygun başlık, özet, detaylı teknik içerik, SEO metotları ve etiketleri saniyeler içinde oluşturacaktır.", "Enter the core concept or draft title. Our LLM will format a structural title, summary, technical checklist, and SEO attributes optimized for indexing in seconds.")}
              </p>
              
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  placeholder={tLocal("Fikrinizi girin (Örn: Honda Civic 1.5 i-VTEC LPG ayarı, 2.2 mm nozul çapı)", "Enter your topic idea (e.g., Honda Civic 1.5 i-VTEC calibration, 2.2 mm nozzle sizing)")}
                  value={aiAssistTopic}
                  onChange={(e) => setAiAssistTopic(e.target.value)}
                  className="bg-white border border-emerald-150 rounded-lg p-2 text-xs flex-1 focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
                />
                <button
                  type="button"
                  disabled={isAiAssisting}
                  onClick={async (e) => {
                    if (!aiAssistTopic) {
                      showToast(tLocal("Lütfen önce bir konu veya ilham verici fikir girin.", "Please enter a topic or a guiding idea first."));
                      return;
                    }
                    setIsAiAssisting(true);
                    try {
                      const userSig = localStorage.getItem("lpgportal_active_user_sig") || "";
                      const response = await fetch("/api/ai/generate-news-bulletin", {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "X-LpgPortal-Secure": "true",
                          "X-LpgPortal-User-Id": activeUser?.id || "",
                          "X-LpgPortal-User-Email": activeUser?.email || "",
                          "X-LpgPortal-User-Role": activeUser?.role || "",
                          "X-LpgPortal-Session-Token": userSig
                        },
                        body: JSON.stringify({
                          type: newCategory === "Teknik Bülten" ? "bulletin" : "news",
                          title: aiAssistTopic,
                          category: newCategory,
                          extraDetails: "Sektörel ve usta gözünden teknik detaylar içeren, LTFT, STFT grafiklerine ve sızdırmazlık genelgesine atıfta bulunan geniş bir yazı olması."
                        })
                      });
                      const resData = await response.json();
                      if (resData.success && resData.data) {
                        const item = resData.data;
                        setNewTitle(item.title || aiAssistTopic);
                        setNewSummary(item.summary || "LPG PORTAL Dijital kütüphanesi için üretilen özel içerik özeti.");
                        setNewContent(item.content || "Seçilen sektörel konu hakkında detaylı analiz...");
                        setNewTags(item.tags ? item.tags.join(", ") : "lpg, otogaz, sektorel");
                        showToast(tLocal("Yapay zeka başlık, özet, içerik ve etiketleri başarıyla doldurdu!", "AI successfully drafted the title, summary, text, and metadata tags!"));
                      } else {
                        showToast(tLocal("Sunucu yanıtı alınamadı, yerel şablon dolduruluyor...", "Server reply failed, loading offline local design profile..."));
                        setNewTitle(aiAssistTopic);
                        setNewSummary("LPG PORTAL arşivi için güncel konu özeti.");
                        setNewContent("Bu konuyla ilgili makale yakında onaylanacaktır. Detaylar ve enjektör milisaniye rehberleri mevcuttur.");
                        setNewTags("lpg, sektorel, donusum");
                      }
                    } catch (err) {
                      showToast(tLocal("Lokal şablon aktif edildi.", "Local default template has been activated."));
                      setNewTitle(aiAssistTopic);
                      setNewSummary("LPG PORTAL arşivi için güncel konu özeti.");
                    } finally {
                      setIsAiAssisting(false);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  {isAiAssisting ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{tLocal("Sentezleniyor...", "Synthesizing...")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Taslak Sentezle</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MAIN FORM */}
            <form onSubmit={handleSaveAndSubmitContent} className="space-y-4 text-xs font-semibold text-slate-600">
              
              {/* Row 1: Title and Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-500 mb-1">{tLocal("İçerik / Duyuru Başlığı *", "Content / Announcement Title *")}</label>
                  <input
                    type="text"
                    required
                    placeholder={tLocal("Örn: Atiker Grand ECU Rölanti Dalgalanması Çözümü", "e.g. Atiker Grand ECU Idle Fluctuation Solution")}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Kategori Sektör Sınıfı *", "Category Sector Class *")}</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-slate-800 cursor-pointer"
                  >
                    {["Haber", "Blog Yazısı", "Teknik Bülten", "Podcast", "Eğitim İçeriği", "Yazılım ve Kalibrasyon Kütüphanesi Kaydı"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yazılım ve Kalibrasyon Kütüphanesi Kaydı Sub-Form */}
              {newCategory === "Yazılım ve Kalibrasyon Kütüphanesi Kaydı" && (
                <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">
                    <span>⚙️</span> Kalibrasyon Kütüphane Kaydı Parametreleri
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Araç Markası *", "Vehicle Brand *")}</label>
                      <input type="text" required placeholder={tLocal("Örn: Fiat", "e.g. Fiat")} value={libCarBrand} onChange={(e) => setLibCarBrand(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Araç Modeli *", "Vehicle Model *")}</label>
                      <input type="text" required placeholder={tLocal("Örn: Egea", "e.g. Egea")} value={libCarModel} onChange={(e) => setLibCarModel(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Model Yılı *", "Model Year *")}</label>
                      <input type="text" required placeholder={tLocal("Örn: 2024", "e.g. 2024")} value={libModelYear} onChange={(e) => setLibModelYear(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">Motor Hacmi *</label>
                      <input type="text" required placeholder={tLocal("Örn: 1.4 Fire", "e.g. 1.4 Fire")} value={libEngineVolume} onChange={(e) => setLibEngineVolume(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Motor Kodu *</label>
                      <input type="text" required placeholder={tLocal("Örn: 843A1000", "e.g. 843A1000")} value={libEngineCode} onChange={(e) => setLibEngineCode(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Yazılım Versiyonu *", "Software Version *")}</label>
                      <input type="text" required placeholder={tLocal("Örn: V1.0.8", "e.g. V1.0.8")} value={libSoftwareVersion} onChange={(e) => setLibSoftwareVersion(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">ECU Kodu</label>
                      <input type="text" placeholder={tLocal("Örn: SQ32", "e.g. SQ32")} value={libEcuCode} onChange={(e) => setLibEcuCode(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Uyumlu Kit Markası", "Compatible Kit Brand")}</label>
                      <input type="text" placeholder="Örn: BRC" value={libCompatibleKit} onChange={(e) => setLibCompatibleKit(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">{tLocal("Dosya Adı", "File Name")}</label>
                      <input type="text" placeholder={tLocal("Örn: egea_fire_brc.fpd", "e.g. egea_fire_brc.fpd")} value={libFileName} onChange={(e) => setLibFileName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 font-bold" />
                    </div>
                  </div>
                </div>
              )}

              {/* LPG Brand for Technical Bulletin */}
              {newCategory === "Teknik Bülten" && (
                <div id="tech-bulletin-brand-panel" className="bg-emerald-50/55 border border-emerald-150 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 text-[11px] tracking-wide">
                    <span>🏭</span> TEKNİK BÜLTEN MARKA EŞLEŞTİRME PARAMETRELİ GEÇİŞ KONTROLÜ
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-650 mb-1 text-xs font-bold">{tLocal("İlişkili LPG Kit Markası *", "Associated LPG Kit Brand *")}</label>
                      {activeUser?.role === "manufacturer" ? (
                        <input
                          type="text"
                          disabled
                          value={activeUser.brand_name || "BRC"}
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-extrabold cursor-not-allowed text-xs"
                        />
                      ) : (
                        <select
                          value={selectedBrandForBulletin}
                          onChange={(e) => setSelectedBrandForBulletin(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 font-extrabold cursor-pointer text-xs focus:ring-emerald-500 focus:outline-none"
                        >
                          {["BRC", "Zavoli", "Prins", "Atiker", "Lovato", "Landi Renzo", "OMVL", "Romano", "AC Stag", "Diğer"].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed">
                        {activeUser?.role === "manufacturer" 
                          ? "Firma tescilli markanız sistem tarafından kilitli olarak bültene bağlanmıştır." 
                          : "Yönetici yetkisi ile bültenin ilişkilendirileceği tescilli LPG markasını seçiniz."
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-slate-650 mb-1 text-xs font-bold">{tLocal("Erişim Sınıfı Yetkilendirmesi", "Access Class Authorization")}</label>
                      <input
                        type="text"
                        disabled
                        value={activeUser?.role === "manufacturer" 
                          ? `Yalnızca "${activeUser.brand_name || "Atiker"}" Tescilli Bayileri & Ustaları` 
                          : `Seçilen "${selectedBrandForBulletin}" Markasının Tüm Bayileri & Ustaları`
                        }
                        className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-600 font-semibold cursor-not-allowed text-xs"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-normal leading-relaxed">
                        Bu ayar marka bazlı yetkilendirme motoru tarafından zorunlu olarak denetlenir.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 2: Summary */}
              <div>
                <label className="block text-slate-500 mb-1">{tLocal("Kısa Özet veya Giriş Metni * (Haber Kartında Listelenecek)", "Short Summary or Intro Text * (To be Listed in News Card)")}</label>
                <textarea
                  rows={2}
                  required
                  placeholder={tLocal("Dökümanın aramalarda özet kartında çıkacak olan 2-3 cümlelik açıklaması.", "The 2-3 sentence explanation of the document that will appear in the search summary card.")}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800 font-normal"
                />
              </div>

              {/* Row 3: Content Body */}
              <div>
                <label className="block text-slate-500 mb-1">{tLocal("İçerik Metni * (Detaylar, Usta Kodları, Grafikler ve Çözümler)", "Content Text * (Details, Tech Codes, Charts, and Solutions)")}</label>
                <textarea
                  rows={6}
                  required
                  placeholder={tLocal("Buraya makale içeriğini veya bülten detaylarını girin...", "Enter article content or bulletin details here...")}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-slate-800 font-mono font-normal leading-relaxed text-xs"
                />
              </div>

              {/* Row 4: Tags */}
              <div>
                <label className="block text-slate-500 mb-1">{tLocal("Etiketler (Virgülle ayırın)", "Tags (Separate with commas)")}</label>
                <input
                  type="text"
                  placeholder="atiker, ecu, rolanti, afr, 2026-genelgesi"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Row 5: Image Setup and AI Enhancer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-extrabold text-slate-700 tracking-wider uppercase block border-b border-slate-200 pb-1.5">
                  🖼️ Görsel ve Kapak Ayarları (AI Destekli Medya)
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image URL / Selection */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-550 mb-0.5 text-slate-500">{tLocal("Görsel URL veya Şablon Linki", "Image URL or Template Link")}</label>
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none text-slate-850"
                      />
                    </div>

                    {/* NEW SECTION: Bilgisayardan Görsel Yükle */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-slate-700 font-extrabold text-xs">
                        Bilgisayardan Görsel Yükle
                      </label>
                      
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            processAndOptimizeImage(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center cursor-pointer min-h-[140px] relative ${
                          isDraggingFile
                            ? "bg-slate-900/10 border-emerald-500 text-emerald-600"
                            : "bg-white border-slate-300 hover:border-slate-400 text-slate-500"
                        }`}
                        onClick={() => {
                          const fileInput = document.getElementById("localImageFileInput");
                          if (fileInput) fileInput.click();
                        }}
                        id="image-drag-drop-zone"
                      >
                        <input
                          type="file"
                          id="localImageFileInput"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              processAndOptimizeImage(e.target.files[0]);
                            }
                          }}
                        />

                        {isOptimizingFile ? (
                          <div className="flex flex-col items-center space-y-2">
                            <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-[10px] font-bold text-emerald-600 animate-pulse">Otomatik Optimize Ediliyor...</span>
                            <span className="text-[9px] text-slate-400">{tLocal("Esneme engelleniyor, 16:9 oranına ölçekleniyor...", "Stretching is prevented, scaling to 16:9 ratio...")}</span>
                          </div>
                        ) : (
                          <div className="space-y-1 flex flex-col items-center justify-center">
                            <span className="text-xl">📤</span>
                            <div className="text-xs font-bold text-slate-705">
                              {tLocal("Sürükleyip bırakın veya", "Drag and drop or")} <span className="text-emerald-600 underline">{tLocal("dosya seçin", "select file")}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-normal max-w-[200px]">
                              Desteklenen Formatlar: <strong>JPG, JPEG, PNG, WEBP</strong> (Maksimum 5 MB)
                            </p>
                            <p className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-semibold">
                              Öneri: 16:9 Kapak Oranı (1200x675 px)
                            </p>
                            {uploadedFileName && (
                              <div className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded truncate max-w-[220px] font-mono font-bold mt-1">
                                Seçildi: {uploadedFileName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Cover choice */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        type="checkbox"
                        id="isCoverCheckbox"
                        checked={newIsCoverImage}
                        onChange={(e) => setNewIsCoverImage(e.target.checked)}
                        className="h-3.5 w-3.5 text-emerald-600 rounded border-slate-300"
                      />
                      <label htmlFor="isCoverCheckbox" className="text-[11px] text-slate-600 select-none cursor-pointer font-bold">
                        Görseli Kapak Resmi (Top Banner) Olarak Belirle
                      </label>
                    </div>
                  </div>

                  {/* Visual Preview / AI Enhancer */}
                  <div className="border border-slate-200 rounded-lg bg-white p-2.5 flex flex-col justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative h-18 w-28 bg-slate-100 rounded border overflow-hidden flex-shrink-0">
                        <img
                          src={newImageUrl}
                          alt={tLocal("Görsel Önizleme", "Image Preview")}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">Önizleme</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">{tLocal("Çözünürlük standardı", "Resolution standard")}</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block">LPG PORTAL Full-Sized Auto</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">✓ SEO Web-Ready</span>
                      </div>
                    </div>

                    {/* AI image enhance trigger button */}
                    <button
                      type="button"
                      disabled={isImageEnhancing}
                      onClick={handleImageEnhance}
                      className="mt-3 w-full bg-emerald-50 hover:bg-emerald-100/85 disabled:bg-slate-100 border border-emerald-250/50 text-emerald-700 text-xs py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition font-bold cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-spin" />
                      {isImageEnhancing ? "Görsel Akıllı İyileştiriliyor..." : "AI ile Görseli İyileştir"}
                    </button>
                  </div>
                </div>

                {/* Simulated enhance steps timeline */}
                {isImageEnhancing && (
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] space-y-1">
                    <div className="text-white border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>⚡ LPG PORTAL GRAPHICS PIPELINE PRO</span>
                      <span className="animate-pulse text-emerald-500">● AGENT ENGAGED</span>
                    </div>
                    {imageEnhanceSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-2.5 items-center">
                        <span className="text-emerald-600">[{idx + 1}]</span>
                        <span>{step}</span>
                        {idx === imageEnhanceSteps.length - 1 && <span className="animate-ping text-white">|</span>}
                      </div>
                    ))}
                    {activeEnhanceStep && (
                      <div className="text-slate-300 font-sans italic text-[10px] pl-4 mt-1 border-l border-emerald-500">
                        Yürütülüyor: {activeEnhanceStep}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Triggers */}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition cursor-pointer"
                >
                  Kapat & İptal Et
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{tLocal("İncelemeye Gönder", "Submit for Review")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION CARD: ONAY BEKLEME BİLGİLENDİRME PANEL KARTI */}
      {showSubmissionSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl text-center">
            <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Başarıyla İncelemeye Gönderildi!
            </h3>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              İçeriğiniz başarıyla oluşturulmuş ve yönetici incelemesine gönderilmiştir. Onay süreci tamamlandıktan sonra Haber & Bülten sayfasında yayınlanacaktır.
            </p>
            <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 font-mono block">
                📧 E-posta, 📱 SMS ve 🔔 Panel Bildirimleriniz gönderildi.
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSubmissionSuccess(false);
                  setActiveMode("author"); // Route user to "İçeriklerim" segment
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Anladım, İçeriklerime Git
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER LAYOUTS ACCORDING TO CURRENT TAB --- */}

      {/* MODE 1: HABERLER MERKEZİ (NEWS CENTER) */}
      {activeMode === "news" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: News list (5 cols) */}
          <div className="lg:col-span-5 space-y-4 max-h-[720px] overflow-y-auto pr-2">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Güncel Haber akışı
            </h3>
            
            {filteredNewsList.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-400 text-xs">
                Filtrelere uygun haber dökümanı bulunamadı.
              </div>
            ) : (
              filteredNewsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNewsId(item.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    selectedNewsId === item.id
                      ? "bg-emerald-50/60 border-emerald-500 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex gap-3">
                    {item.image && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-50 shadow-3xs">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-[10px] text-emerald-800 font-bold uppercase tracking-wider font-mono mb-1.5">
                        <span>{item.category}</span>
                        <span className="text-slate-400 font-normal">{item.date}</span>
                      </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                    {translateEntity(item, "title")}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed font-sans">
                    {translateEntity(item, "summary")}
                  </p>
                    </div>
                  </div>
                  
                  {/* Tags represent list */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tg, i) => (
                      <span key={i} className="text-[9px] bg-slate-100 text-slate-500 font-medium px-1.5 py-0.5 rounded font-sans">
                        #{tg}
                      </span>
                    ))}
                  </div>

                  {/* Foot specs */}
                  <div className="pt-2 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Yazar: {item.author}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {item.views}</span>
                      <span className="flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /> {item.likes}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareTarget({ item, type: "news" });
                        }}
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-extrabold transition px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100/60 rounded cursor-pointer"
                      >
                        <Share2 className="h-2.5 w-2.5" />
                        <span>{tLocal("Paylaş", "Share")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Active Article Reader & SEO metrics (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 text-left max-h-[720px] overflow-y-auto">
            {activeNews ? (
              <div className="space-y-6">
                
                {/* News content container */}
                <div className="border-b border-slate-200 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {translateEntity({ category: activeNews.category }, "category")}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">{activeNews.date}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight leading-tight">
                    {translateEntity(activeNews, "title")}
                  </h1>
                  <p className="text-xs text-slate-500 mt-2">
                    {language === "tr" ? "Döküman No:" : "Document Reference:"}{" "}
                    <strong className="font-mono">{activeNews.id.toUpperCase()}</strong> |{" "}
                    {language === "tr" ? "Yazar:" : "Author:"} {activeNews.author}
                  </p>

                  {/* Yüklenen görsel başlığın hemen altında */}
                  {activeNews.image && (
                    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 mt-3 shadow-xs">
                      <img 
                        src={activeNews.image} 
                        alt={translateEntity(activeNews, "title")} 
                        className="w-full h-auto max-h-[380px] object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Sub sections dynamically for vehicle uyumluk news */}
                {activeNews.category === "Yeni Araçlar ve LPG Uyumluluğu" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs font-sans">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                      <Flame className="h-4 w-4 text-emerald-600" />
                      {language === "tr" ? "Yapay Zeka & Mühendislik Uyum Matrisi" : "AI & Engineering Compatibility Matrix"}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">
                          {language === "tr" ? "Araç Segmenti" : "Vehicle Segment"}
                        </span>
                        <p className="font-bold text-slate-800">{activeNews.vehicleBrand} {activeNews.vehicleModel}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">
                          {language === "tr" ? "Enjeksiyon Sistemi" : "Fuel Injection System"}
                        </span>
                        <p className="font-bold text-slate-800">{activeNews.injectionSystem} ({activeNews.motorType})</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">
                          {language === "tr" ? "LPG Uyum Seviyesi" : "LPG Compatibility"}
                        </span>
                        <p className="font-extrabold text-emerald-700">
                          {language === "tr" ? activeNews.compatibilityLevel : translateEntity({ level: activeNews.compatibilityLevel }, "level")}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">
                          {language === "tr" ? "Tavsiye Edilen Kitler" : "Recommended Kits"}
                        </span>
                        <p className="font-bold text-slate-800">{activeNews.recommendedKits?.join(", ")}</p>
                      </div>
                    </div>
                    
                    {activeNews.technicalAnalysis && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 mt-1">
                        <strong className="text-slate-700">{language === "tr" ? "Teknik Analiz:" : "Technical Analysis:"}</strong>{" "}
                        {translateEntity(activeNews, "technicalAnalysis")}
                      </div>
                    )}
                    {activeNews.expertOpinion && (
                      <div className="text-xs text-slate-600 bg-emerald-50/55 p-2.5 rounded border border-emerald-100/50">
                        <strong className="text-emerald-800">{language === "tr" ? "Uzman Görüşü:" : "Expert Opinion:"}</strong>{" "}
                        {translateEntity(activeNews, "expertOpinion")}
                      </div>
                    )}
                  </div>
                )}

                {/* News content splits */}
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-4 font-sans">
                  {translateEntity(activeNews, "content").split("\n\n").map((para, idx) => {
                    if (para.startsWith("###")) {
                      return <h3 key={idx} className="text-base font-extrabold text-slate-900 border-l-2 border-emerald-600 pl-2 pt-1">{para.replace("###", "")}</h3>;
                    }
                    if (para.startsWith("*") || para.startsWith("-")) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
                          {para.split("\n").map((item, i) => (
                            <li key={i}>{item.replace(/^[\*\-]\s+/, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx}>{para}</p>;
                  })}
                </div>

                {/* Engagement Area */}
                <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">{tLocal("Bu haber kütüphane dökümanını faydalı buldunuz mu?", "Did you find this news library document helpful?")}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleLikeNews(activeNews.id)}
                      className="bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{tLocal("Faydalı", "Helpful")} ({activeNews.likes})</span>
                    </button>
                  </div>
                </div>

                {/* Bu Haberi Paylaş - Social Media Sharing Tray */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs font-sans text-left">
                  <div className="text-xs font-black text-slate-700 tracking-tight flex items-center gap-1.5 uppercase tracking-wider">
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{tLocal("Bu Haberi Paylaş", "Share This News")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => handleShareAction("facebook", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-blue-200 hover:text-blue-600 cursor-pointer shadow-2xs"
                      title={tLocal("Facebook'ta Paylaş", "Share on Facebook")}
                    >
                      <span className="text-sm select-none">📘</span>
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("linkedin", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-sky-200 hover:text-sky-600 cursor-pointer shadow-2xs"
                      title={tLocal("LinkedIn'de Paylaş", "Share on LinkedIn")}
                    >
                      <span className="text-sm select-none">💼</span>
                      <span>LinkedIn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("whatsapp", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600 cursor-pointer shadow-2xs"
                      title={tLocal("WhatsApp'ta Paylaş", "Share on WhatsApp")}
                    >
                      <span className="text-sm select-none">🟢</span>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("twitter", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-slate-800/30 hover:text-slate-900 cursor-pointer shadow-2xs"
                      title={tLocal("X (Twitter)'da Paylaş", "Share on X (Twitter)")}
                    >
                      <strong className="text-sm select-none font-sans">𝕏</strong>
                      <span>X</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("instagram", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-pink-200 hover:text-pink-600 cursor-pointer shadow-2xs"
                      title="Copy for Instagram"
                    >
                      <span className="text-sm select-none">📸</span>
                      <span>Instagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("copy", activeNews, "news")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
                      title={tLocal("Bağlantıyı Kopyala", "Copy Link")}
                    >
                      <span className="text-xs select-none">🔗</span>
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* SEO INSPECTOR SUB-PANEL - REAL TIME SIMULATOR */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    SEO Altyapısı & Arama Motoru Metrikleri
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {/* Google Snippet Representation */}
                    <div className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg space-y-1 text-left">
                      <span className="text-[10px] text-slate-400 font-mono">{tLocal("Google Arama Motoru Görünümü (Snippet Preview)", "Google Search Engine View (Snippet Preview)")}</span>
                      <p className="text-sm font-sans font-medium text-emerald-700 hover:underline leading-tight truncate">
                        {activeNews.seoTitle || `${activeNews.title} | LPG PORTAL`}
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block">https://lpgportal.com/haber/{activeNews.id}</span>
                      <p className="text-[11px] text-slate-500 leading-snug truncate">
                        {activeNews.seoDescription || activeNews.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-mono">{tLocal("SEO ANAHTAR KELİMELERİ", "SEO KEYWORDS")}</span>
                        <p className="font-bold text-slate-700 mt-0.5 font-mono text-[10px] leading-relaxed">
                          {activeNews.seoKeywords?.join(", ") || "lpg otogaz, sanayi, muayene"}
                        </p>
                      </div>
                      <div className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 block font-mono">SOCIAL SHARE OUTLINE</span>
                        <p className="font-medium text-slate-600 italic mt-0.5 line-clamp-2 leading-tight">
                          {activeNews.socialShareText || activeNews.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-1 items-center text-[10px] font-mono font-bold text-slate-500">
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 shadow-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Open Graph Metadatası Aktif
                      </span>
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 shadow-xs">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Google News Sitemap İndeksi Sıkıştırıldı
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment Board */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                    Haber Yorumları ({activeNews.comments?.length || 0})
                  </h4>

                  <form onSubmit={(e) => handleAddComment(e, "news", activeNews.id)} className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
                    <span className="font-bold text-emerald-800 text-left block">{tLocal("Makaleye Yorum Bırakın", "Leave a Comment on the Article")}</span>
                    
                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{tLocal("Adınız Soyadınız", "Your Name and Surname")}</label>
                        <input
                          type="text"
                          required
                          placeholder={tLocal("Örn: Hasan Y.", "e.g. Hasan Y.")}
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{tLocal("Sektörel Rolünüz", "Your Sector Role")}</label>
                        <select
                          value={commentRole}
                          onChange={(e) => setCommentRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value={tLocal("Araç Sahibi", "Vehicle Owner")}>{tLocal("Araç Sahibi", "Vehicle Owner")}</option>
                          <option value={tLocal("Ziyaretçi", "Visitor")}>{tLocal("Ziyaretçi", "Visitor")}</option>
                          <option value="Firma (Usta)">{tLocal("Firma / Montör Usta", "Company / Installation Technician")}</option>
                          <option value="Uzman">{tLocal("Mekatronik Uzmanı", "Mechatronics Specialist")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[10px] text-slate-400 mb-1">{tLocal("Görüşünüz", "Your Review / Feedback")}</label>
                      <textarea
                        required
                        rows={2}
                        placeholder={tLocal("Yasal muayene tank ömrü veya Chery uyumu ile ilgili sorunuzu veya tecrübenizi buraya düzgünce yazın...", "Write your question or experience about legal inspection tank life or Chery compatibility here nicely...")}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>{tLocal("Gönder", "Send")}</span>
                    </button>
                  </form>

                  {/* Rendering comments list */}
                  <div className="space-y-3 text-left">
                    {activeNews.comments?.map(comm => (
                      <div key={comm.id} className="bg-white rounded-lg border border-slate-150 p-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{comm.userName}</span>
                            <span className="bg-slate-100 text-slate-505 text-slate-500 px-1.5 py-0.5 rounded uppercase font-mono font-bold text-[9px]">
                              {comm.userRole}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono">{comm.created_at}</span>
                        </div>
                        <p className="text-xs text-slate-655 text-slate-600 border-l border-emerald-500 pl-2">
                          {comm.comment}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                Okumak istediğiniz haberi soldaki listeden seçin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: TEKNİK BÜLTEN MERKEZİ (TECHNICAL BULLETINS) */}
      {activeMode === "technical" && (
        (!activeUser || activeUser.role === "visitor" || activeUser.role === "vehicle_owner") ? (
          <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-lg space-y-5">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-rose-650 my-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{tLocal("Yetkisiz Erişim", "Unauthorized Access")}</h3>
            <p className="text-sm text-slate-650 leading-relaxed font-semibold max-w-lg mx-auto p-1">
              Teknik Bültenler yalnızca ilgili LPG markalarının yetkili bayileri, servisleri, ustaları ve kit üreticileri için sunulan özel teknik içeriklerdir.
            </p>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-450 font-bold tracking-wide">
                Bu alana erişebilmek için uygun üyelik paketine sahip olmanız gerekmektedir.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel: Bulletins List (5 cols) */}
          <div className="lg:col-span-5 space-y-4 max-h-[720px] overflow-y-auto pr-2">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest font-mono mb-2">
              Bayi ve Teknisyen Sektör Bültenleri
            </h3>

            {filteredBulletinsList.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-400 text-xs">
                Filtrelere uygun teknik bülten dökümanı bulunamadı.
              </div>
            ) : (
              filteredBulletinsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedBulletinId(item.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                    selectedBulletinId === item.id
                      ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex gap-3">
                    {item.image && (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700/20 bg-slate-50 shadow-3xs">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider font-mono mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={selectedBulletinId === item.id ? "text-emerald-400" : "text-emerald-700"}>
                            {item.category}
                          </span>
                          {(item.category === "Teknik Bülten" || item.category === "Üretici Teknik Bültenleri") && (
                            <span className="bg-emerald-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md font-sans uppercase shadow-xs">
                              🏭 Resmi Teknik Bülten
                            </span>
                          )}
                        </div>
                        <span className={selectedBulletinId === item.id ? "text-slate-405 text-slate-300 font-mono" : "text-slate-400 font-mono font-normal"}>
                          {item.id.toUpperCase()}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-sm leading-snug">
                        {item.title}
                      </h4>
                      <p className={`text-xs line-clamp-2 mt-1.5 leading-relaxed ${selectedBulletinId === item.id ? "text-slate-200" : "text-slate-650 text-slate-600"}`}>
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.lpgBrand && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded font-sans">
                        Sistem: {item.lpgBrand}
                      </span>
                    )}
                    {item.tags.slice(0, 2).map((tg, i) => (
                      <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${selectedBulletinId === item.id ? "bg-slate-700 text-slate-300" : "bg-slate-105 bg-slate-100 text-slate-500"}`}>
                        #{tg}
                      </span>
                    ))}
                  </div>

                  <div className={`pt-2 mt-3 border-t text-[10px] flex items-center justify-between ${selectedBulletinId === item.id ? "border-slate-700 text-slate-400" : "border-slate-100 text-slate-400"}`}>
                    <span>Yayın: {item.date}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-400">Okunma: {item.views}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareTarget({ item, type: "bulletin" });
                        }}
                        className={`flex items-center gap-0.5 font-bold transition px-1.5 py-0.5 rounded cursor-pointer ${
                          selectedBulletinId === item.id
                            ? "bg-slate-700 text-emerald-300 hover:text-emerald-200"
                            : "bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        <Share2 className="h-2.5 w-2.5" />
                        <span>{tLocal("Paylaş", "Share")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Active Technical Bulletin Reader (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-6 text-left max-h-[720px] overflow-y-auto">
            {activeBulletin ? (
              <div className="space-y-6">
                
                {/* Header segment */}
                <div className="border-b border-slate-200 pb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-white text-[9px] font-mono font-bold px-2.5 py-0.5 rounded tracking-widest">
                      {activeBulletin.id.toUpperCase()}
                    </span>
                    <span className="bg-emerald-55 bg-emerald-50 border border-emerald-150 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded font-sans">
                      {activeBulletin.category}
                    </span>
                    {(activeBulletin.category === "Teknik Bülten" || activeBulletin.category === "Üretici Teknik Bültenleri") && (
                      <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span>🏭</span> Resmi Teknik Bülten
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 font-sans tracking-tight leading-tight">
                    {activeBulletin.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 items-center mt-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{activeBulletin.author} ({activeBulletin.authorTitle || "Resmi Kit Üreticisi"})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{activeBulletin.date}</span>
                    </div>
                  </div>

                  {/* Teknik Bülten Görseli başlığın hemen altında */}
                  {activeBulletin.image && (
                    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 mt-3 shadow-xs">
                      <img 
                        src={activeBulletin.image} 
                        alt={activeBulletin.title} 
                        className="w-full h-auto max-h-[380px] object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* MARKA BİLGİSİ VE OTOMATİK ÜRETİCİ HESAP GÖSTERİMİ */}
                {(activeBulletin.category === "Teknik Bülten" || activeBulletin.category === "Üretici Teknik Bültenleri") && (
                  <div className="bg-emerald-50/50 border border-emerald-150 text-emerald-900 rounded-xl p-4.5 space-y-2.5 text-xs font-sans shadow-2xs my-4">
                    <div className="font-extrabold text-emerald-800 tracking-tight flex items-center gap-1.5 text-[12px]">
                      <span>🏭</span> Resmi Teknik Bülten
                    </div>
                    <div className="text-slate-700 space-y-1.5 pl-5 border-l-2 border-emerald-500/30">
                      <div>
                        <span className="font-semibold text-slate-400 font-mono text-[9.5px] block uppercase tracking-wider">{tLocal("Kit Markası", "Kit Brand")}</span>
                        <span className="font-extrabold text-[12.5px] text-slate-900">{activeBulletin.lpgBrand || "BRC Türkiye"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 font-mono text-[9.5px] block uppercase tracking-wider">{tLocal("Yayınlayan (Üretici Hesabı)", "Publisher (Manufacturer Account)")}</span>
                        <span className="font-extrabold text-[12px] text-slate-800">{activeBulletin.manufacturerAccount || activeBulletin.author || "BRC Türkiye"}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-400 font-mono text-[9.5px] block uppercase tracking-wider">{tLocal("Yayın Tarihi", "Publish Date")}</span>
                        <span className="font-semibold text-slate-700 font-mono">{activeBulletin.date}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Arıza ve Çözüm özel kutusu */}
                {activeBulletin.category === "Arıza ve Çözüm Merkezi" && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs text-xs">
                    <div className="bg-red-50 text-red-800 border-b border-red-100 p-3 font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertTriangle className="h-4.5 w-4.5 text-red-600 flex-shrink-0" />
                      Saha Arıza Teşhis Raporu
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <strong className="text-slate-700 block mb-1">{tLocal("Müşteri Şikayeti (Arıza Durumu):", "Customer Complaint (Trouble Status):")}</strong>
                        <p className="text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded italic">
                          "{activeBulletin.trouble}"
                        </p>
                      </div>

                      {activeBulletin.possibleCauses && (
                        <div>
                          <strong className="text-slate-700 block mb-1">{tLocal("Saha Ustası Olası Sebepler listesi:", "Field Technician Possible Causes List:")}</strong>
                          <ul className="list-disc pl-5 space-y-1 text-slate-605 text-slate-600">
                            {activeBulletin.possibleCauses.map((cause, idx) => (
                              <li key={idx}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeBulletin.technicalSolution && (
                        <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-100/50 mt-1">
                          <strong className="text-emerald-900 block mb-1 uppercase tracking-wider text-[10px] font-mono">{tLocal("Usta Tavsiyeli Çözüm Prosedürü:", "Technician Recommended Solution Procedure:")}</strong>
                          <p className="text-slate-700 leading-relaxed font-sans font-medium">
                            {activeBulletin.technicalSolution}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Motor Bazlı Teknik Rehber özel kutusu */}
                {activeBulletin.category === "Motor Bazlı Teknik Rehberler" && (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs text-xs">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-150 pb-1.5">
                      <Wrench className="h-4 w-4 text-emerald-600" />
                      Motor Mekatronik İnce Ayar Kılavuzu
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">{tLocal("Hedef Ünite", "Target Unit")}</span>
                        <p className="font-extrabold text-slate-800">{activeBulletin.targetMotor}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">Uyum Seviyesi</span>
                        <p className="font-bold text-emerald-700">{activeBulletin.compatibilityStatus}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">{tLocal("Enjektör Nozul Önerisi", "Injector Nozzle Suggestion")}</span>
                        <p className="font-mono font-bold text-slate-850">{activeBulletin.nozzleRecommendation || "2.2 mm"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-mono uppercase tracking-wider text-[9px]">{tLocal("Regülatör Basınç Önerisi", "Regulator Pressure Suggestion")}</span>
                        <p className="font-mono font-bold text-slate-850">{activeBulletin.regulatorRecommendation || "1.1 bar"}</p>
                      </div>
                    </div>

                    {activeBulletin.knownIssues && (
                      <div className="bg-amber-50/50 text-amber-900 border border-amber-100 p-2.5 rounded">
                        <strong>Kronik Bulgular / Dikkat:</strong> {activeBulletin.knownIssues}
                      </div>
                    )}
                    {activeBulletin.calibrationNotes && (
                      <div className="bg-slate-50 text-slate-705 text-slate-700 p-2.5 rounded border border-slate-150 font-sans leading-relaxed">
                        <strong className="text-slate-800 block mb-1 uppercase tracking-wider font-mono text-[9px]">{tLocal("Yol Kalibrasyon Teknik Notları:", "Road Calibration Technical Notes:")}</strong>
                        {activeBulletin.calibrationNotes}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub Content */}
                <div className="text-sm text-slate-705 text-slate-700 leading-relaxed whitespace-pre-line space-y-4">
                  {activeBulletin.content.split("\n\n").map((para, idx) => {
                    if (para.startsWith("###")) {
                      return <h3 key={idx} className="text-base font-extrabold text-slate-900 border-l-2 border-emerald-600 pl-2 pt-1">{para.replace("###", "")}</h3>;
                    }
                    if (para.startsWith("*") || para.startsWith("-")) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 my-2">
                          {para.split("\n").map((item, i) => (
                            <li key={i}>{item.replace(/^[\*\-]\s+/, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx}>{para}</p>;
                  })}
                </div>

                {/* Engagement Line */}
                <div className="bg-white border border-slate-205 border-slate-200 rounded-lg p-3.5 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">{tLocal("Bu bülten montaj veya teşhiste faydalı oldu mu?", "Was this bulletin helpful in installation or diagnosis?")}</span>
                  <button
                    type="button"
                    onClick={() => handleLikeBulletin(activeBulletin.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition shadow-xs"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{tLocal("Faydalı Buldum", "I Found it Helpful")} ({activeBulletin.likes})</span>
                  </button>
                </div>

                {/* Bu Bülteni Paylaş - Social Media Sharing Tray */}
                <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs font-sans text-left">
                  <div className="text-xs font-black text-slate-700 tracking-tight flex items-center gap-1.5 uppercase tracking-wider">
                    <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{tLocal("Bu Bülteni Paylaş", "Share This Bulletin")}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => handleShareAction("facebook", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-blue-200 hover:text-blue-600 cursor-pointer shadow-2xs"
                      title={tLocal("Facebook'ta Paylaş", "Share on Facebook")}
                    >
                      <span className="text-sm select-none">📘</span>
                      <span>Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("linkedin", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-sky-200 hover:text-sky-600 cursor-pointer shadow-2xs"
                      title={tLocal("LinkedIn'de Paylaş", "Share on LinkedIn")}
                    >
                      <span className="text-sm select-none">💼</span>
                      <span>LinkedIn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("whatsapp", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600 cursor-pointer shadow-2xs"
                      title={tLocal("WhatsApp'ta Paylaş", "Share on WhatsApp")}
                    >
                      <span className="text-sm select-none">🟢</span>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("twitter", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-slate-800/30 hover:text-slate-900 cursor-pointer shadow-2xs"
                      title={tLocal("X (Twitter)'da Paylaş", "Share on X (Twitter)")}
                    >
                      <strong className="text-sm select-none font-sans">𝕏</strong>
                      <span>X</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("instagram", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 border border-slate-200 text-slate-700 transition hover:border-pink-200 hover:text-pink-600 cursor-pointer shadow-2xs"
                      title="Copy for Instagram"
                    >
                      <span className="text-sm select-none">📸</span>
                      <span>Instagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareAction("copy", activeBulletin, "bulletin")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
                      title={tLocal("Bağlantıyı Kopyala", "Copy Link")}
                    >
                      <span className="text-xs select-none">🔗</span>
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* SEO METRIC PANEL */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs text-xs">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                    <Globe className="h-4 w-4 text-emerald-600" />
                    Bülten SEO Çerçevesi & Open Graph Dökümantasyonu
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-slate-400 font-mono">Google News Snippet Layout</span>
                    <p className="text-sm font-sans font-medium text-emerald-700 hover:underline leading-tight truncate">
                      {activeBulletin.seoTitle || `${activeBulletin.title}`}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block">https://lpgportal.com/bulten/{activeBulletin.id}</span>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {activeBulletin.seoDescription || activeBulletin.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left pt-1">
                    <div className="p-2 bg-slate-50/50 rounded font-mono text-[9px] text-slate-500">
                      <strong>KEYWORDS:</strong> {activeBulletin.seoKeywords?.join(", ") || "lpg teknik, usta bülteni"}
                    </div>
                    <div className="p-2 bg-slate-50/50 rounded text-[10px] text-slate-500 italic line-clamp-2 leading-tight">
                      <strong>{tLocal("PAYLAŞIM:", "SHARE:")}</strong> {activeBulletin.socialShareText}
                    </div>
                  </div>
                </div>

                {/* Comment segment */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-base text-slate-905 text-slate-900 flex items-center gap-1.5">
                    Teknisyen Geri Bildirimleri & Yorumlar ({activeBulletin.comments?.length || 0})
                  </h4>

                  <form onSubmit={(e) => handleAddComment(e, "bulletin", activeBulletin.id)} className="space-y-3 bg-white p-4 rounded-lg border border-slate-200 text-xs shadow-xs">
                    <span className="font-bold text-emerald-800 text-left block">{tLocal("Teknik Görüş Bildirin", "Provide Technical Feedback")}</span>

                    <div className="grid grid-cols-2 gap-2 text-left">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{tLocal("Adınız Soyadınız", "Your Name and Surname")}</label>
                        <input
                          type="text"
                          required
                          placeholder={tLocal("Örn: Master Usta Selami", "e.g. Master Tech Selami")}
                          value={commentName}
                          onChange={(e) => setCommentName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">{tLocal("Sektörel Ünvan", "Sector Title")}</label>
                        <select
                          value={commentRole}
                          onChange={(e) => setCommentRole(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="Firma (Usta)">{tLocal("Firma / Atölye Ustası", "Company / Workshop Technician")}</option>
                          <option value="Uzman">{tLocal("LPG Proje Mühendisi", "LPG Project Engineer")}</option>
                          <option value={tLocal("Araç Sahibi", "Vehicle Owner")}>{tLocal("Sürücü / Araç Sahibi", "Driver / Vehicle Owner")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[10px] text-slate-401 text-slate-400 mb-1">{tLocal("Teknik Soru veya Tecrübe Notu", "Technical Question or Experience Note")}</label>
                      <textarea
                        required
                        rows={2}
                        placeholder={tLocal("Kalibrasyon milisaniyeleri, nozul açısı veya Prins firmware hatası ile ilgili deneyiminizi belirtin...", "State your experience regarding calibration milliseconds, nozzle angle, or Prins firmware error...")}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-205 border-slate-200 rounded p-1.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded flex items-center gap-1 text-[11px] transition shadow-xs cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>{tLocal("Gönder", "Send")}</span>
                    </button>
                  </form>

                  {/* Comments lists */}
                  <div className="space-y-3 text-left">
                    {activeBulletin.comments?.map(comm => (
                      <div key={comm.id} className="bg-white rounded-lg border border-slate-150 p-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{comm.userName}</span>
                            <span className="bg-slate-100 text-slate-655 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] font-mono">
                              {comm.userRole}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono">{comm.created_at}</span>
                        </div>
                        <p className="text-xs text-slate-655 text-slate-600 border-l border-emerald-500 pl-2 font-mono">
                          {comm.comment}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400">
                Okumak istediğiniz bülteni soldaki listeden seçin.
              </div>
            )}
          </div>
        </div>
      )
    )}

      {/* MODE 5: YAZILIM VE KALİBRASYON KÜTÜPHANESİ (SOFTWARE & CALIBRATION LIBRARY) */}
      {activeMode === "library" && (
        (!activeUser || (activeUser.role !== "manufacturer" && activeUser.role !== "dealer" && activeUser.role !== "admin")) ? (
          <div className="max-w-2xl mx-auto my-12 bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-lg space-y-5">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-rose-650 my-2">
              <Lock className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{tLocal("Yetkisiz Erişim", "Unauthorized Access")}</h3>
            <p className="text-sm text-slate-650 leading-relaxed font-semibold max-w-lg mx-auto p-1">
              {tLocal("Bu alan yalnızca yetkili LPG kit üreticileri ve kayıtlı LPG servisleri için erişime açıktır.", "This area is only open to authorized LPG kit manufacturers and registered LPG services.")}
            </p>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-450 font-bold tracking-wide">
                {tLocal("Lütfen uygun bir üyelik hesabı ile giriş yapınız.", "Please log in with an appropriate membership account.")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-left animate-fade-in">
            {/* Header / Intro section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-905 text-slate-900 flex items-center gap-1.5">
                  <FileCode className="h-5 w-5 text-emerald-600" />
                  {tLocal("Yazılım ve Kalibrasyon Kütüphanesi", "Software & Calibration Library")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tLocal("Kit üreticilerinin LPG dönüşüm sistemleri için hazırladığı güvenli yazılım ve kalibrasyon kütüphanesi.", "Secure software and calibration library prepared by kit manufacturers for LPG conversion systems.")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeUser.role === "manufacturer" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        // Prepopulate Kit Markası
                        setUploadKitBrand(activeUser.brand_name || "Atiker");
                        setUploadUpdateDate(new Date().toISOString().split('T')[0]);
                        setIsUploadOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer font-sans"
                    >
                      <FileCode className="h-4 w-4" />
                      {tLocal("+ Yeni Dosya Yükle", "+ Upload New File")}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        // Open stats modal / panel
                        const mfrBrand = activeUser.brand_name || "";
                        const myFiles = libraryDb.filter(f => f.kit_brand.toLowerCase() === mfrBrand.toLowerCase());
                        if (myFiles.length > 0) {
                          setSelectedStatsFileId(myFiles[0].id);
                        } else {
                          setSelectedStatsFileId(null);
                        }
                        setIsStatsOpen(true);
                      }}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer font-sans"
                    >
                      <BarChart2 className="h-4 w-4" />
                      {tLocal("İndirme İstatistiklerim", "My Download Statistics")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ADMIN PENDING APPROVAL PANEL IN LIBRARY */}
            {activeUser.role === "admin" && libraryDb.some(f => !f.approved) && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="bg-amber-600 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded">{tLocal("ADMIN ONAY PANELİ", "ADMIN APPROVAL PANEL")}</span>
                  <h4 className="font-extrabold text-sm text-slate-100 flex items-center gap-1">{tLocal("Onay Bekleyen Yazılım/Kalibrasyon Dosyaları", "Pending Software/Calibration Files")}</h4>
                </div>
                <div className="space-y-3">
                  {libraryDb.filter(f => !f.approved).map(file => (
                    <div key={file.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-950 border border-emerald-900 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded font-mono text-[10px]">
                            {file.kit_brand}
                          </span>
                          <span className="text-white font-black text-sm">{file.car_brand} {file.car_model} - {file.software_version}</span>
                        </div>
                        <p className="text-slate-400 italic">"{file.short_desc}"</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ECU: {file.ecu_code} | Uyumlu Kit: {file.compatible_kit} | Dosya: {file.file_name}
                        </div>
                      </div>
                      <div className="flex gap-2 self-stretch sm:self-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLibFile(file);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Detaylar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminApprove(file)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Onayla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminReject(file.id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN FILES LIST GRID */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-widest font-mono">
                {tLocal("Yazılım ve Kalibrasyon Dosyaları", "Software and Calibration Files")}
              </h4>

              {filteredLibraryList.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-655 text-slate-600">
                  <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-extrabold text-sm">{tLocal("Kriterlerinize uygun dosya bulunamadı.", "No files matching your criteria were found.")}</p>
                  <p className="text-xs text-slate-450 mt-1">{tLocal("Lütfen arama filtrelerini temizleyerek aramayı genişletiniz.", "Please clear the search filters to expand your query.")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLibraryList.map(file => (
                    <div key={file.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-500/30 transition duration-150 relative overflow-hidden text-xs text-slate-800">
                      
                      {/* Kit Brand / Status badge */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-lg font-mono text-[11px] border border-emerald-200 shadow-2xs">
                          {file.kit_brand}
                        </span>
                        
                        {!file.approved ? (
                          <span className="bg-amber-100 border border-amber-200 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono">
                            {tLocal("Onay Bekliyor", "Pending")}
                          </span>
                        ) : (
                          <span className="bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md font-mono">
                            {tLocal("Yayında", "Published")}
                          </span>
                        )}
                      </div>

                      {/* File Card Title & Body */}
                      <div className="space-y-2 text-left">
                        <h4 className="font-black text-sm text-slate-900 leading-snug">
                          {file.car_brand} {file.car_model} ({file.model_year})
                        </h4>
                        
                        <p className="text-slate-600 font-normal italic line-clamp-2 leading-relaxed">
                          "{file.short_desc}"
                        </p>

                        <div className="bg-white border border-slate-150 rounded-lg p-3 space-y-1.5 font-mono text-[10.5px] text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-400">ECU Kodu:</span>
                            <span className="font-bold text-slate-800">{file.ecu_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{tLocal("Yazılım Sürümü:", "Software Version:")}</span>
                            <span className="font-bold text-slate-850 text-slate-800">{file.software_version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Uyumlu Kit:</span>
                            <span className="font-semibold text-slate-750 text-slate-700 text-right truncate max-w-[150px]">{file.compatible_kit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Motor Kodu:</span>
                            <span className="font-semibold text-slate-700">{file.engine_code}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col gap-2.5">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span>{file.update_date}</span>
                          <span>{file.downloads || 0} indirme</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLibFile(file)}
                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-xl text-center transition cursor-pointer"
                          >
                            {tLocal("Detayları Gör", "View Details")}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{tLocal("İndir", "Download")}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )
      )}

      {/* MODE 3: DİJİTAL ARŞİV (DIGITAL ARCHIVE TIMELINE & BENTO TILES) */}
      {activeMode === "archive" && (
        <div className="space-y-6 text-left">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-black text-lg text-slate-905 text-slate-900 flex items-center gap-1.5">
              <Database className="h-5 w-5 text-emerald-600" />
              LPG PORTAL Sektörel Dijital Bilgi Arşivi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Geçmişten günümüze yayınlanmış olan tüm makaleler, sızdırmazlık tebliğleri, yeni araç analizleri ve arıza çözüm bültenleri tek bir kronolojik akışta eşleştirildi.
            </p>
          </div>

          {archiveList.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-500">
              <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-extrabold text-sm">{tLocal("Girdiğiniz arama parametrelerine uygun arşiv tescili bulunamadı.", "No archive registration matching your search parameters was found.")}</p>
              <p className="text-xs text-slate-400 mt-1">{tLocal("Lütfen marka, model, motor kodu veya malzeme filtresini temizleyerek aramayı genişletiniz.", "Please widen your search by clearing the brand, model, engine code, or material filter.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {archiveList.map((doc, idx) => {
                const isNews = doc.originType === "Haber";
                return (
                  <div 
                    key={doc.id} 
                    className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-500/30 transition duration-150 relative overflow-hidden"
                  >
                    {/* Origin marker corner */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs ${
                        isNews ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white"
                      }`}>
                        {doc.originType}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-2">
                        <span>{doc.date}</span>
                        <span>•</span>
                        <span>{doc.id.toUpperCase()}</span>
                      </div>

                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest block mb-1">
                        {doc.category}
                      </span>

                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 transition">
                        {doc.title}
                      </h4>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {doc.summary}
                      </p>

                      {/* Extracted specifications if any */}
                      {doc.targetMotor && (
                        <div className="mt-3 bg-white p-2.5 rounded border border-slate-150 text-[11px] font-semibold text-slate-700">
                          ⚙️ <span className="font-mono text-[10px]">Motor:</span> {doc.targetMotor}
                        </div>
                      )}
                      {doc.vehicleBrand && (
                        <div className="mt-3 bg-white p-2.5 rounded border border-slate-150 text-[11px] font-semibold text-slate-700">
                          🚘 <span className="font-mono text-[10px]">{tLocal("Araç:", "Vehicle:")}</span> {doc.vehicleBrand} {doc.vehicleModel}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-205 border-slate-200 flex items-center justify-between">
                      <span className="text-[10.5px] text-slate-500 text-slate-400">Yazar: {doc.author}</span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          if (isNews) {
                            setActiveMode("news");
                            setSelectedNewsId(doc.id);
                          } else {
                            setActiveMode("technical");
                            setSelectedBulletinId(doc.id);
                          }
                          // Scroll to reader panel nicely
                          const rootElem = document.getElementById("news-bulletins-center-root");
                          if (rootElem) rootElem.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                      >
                        Dökümanı Oku
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODE 4: YAZARLIK & İÇERİKLERİM (AUTHOR STUDIO & CONTENT MANAGEMENT) */}
      {activeMode === "author" && (
        <div className="space-y-6 text-left animate-fade-in">
          
          {/* Welcome Dashboard */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute right-0 top-0 bottom-0 opacity-15 overflow-hidden pointer-events-none select-none">
              <PenTool className="h-44 w-44 -mr-10 -mt-5 text-emerald-400 rotate-12" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest font-mono px-2 py-0.5 rounded shadow">
                  {translateRoleAndMembership(activeUser?.role)}
                </span>
                <span className="text-[11px] text-emerald-300 font-bold font-mono animate-pulse">
                  ● LPG PORTAL Aktif Yazar Stüdyosu
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                Hoş Geldiniz, {activeUser?.name || "Değerli Yazarımız"}
              </h3>
              <p className="text-xs text-slate-305 text-slate-300 max-w-xl">
                Sektörün nitelikli gelişimine katkıda bulunmak için hazırladığınız teknik dökümanlar, haberler ve pratik arıza bültenleri aşağıda listelenmektedir.
              </p>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2.5 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  const allowedRoles = ["admin", "vehicle_owner", "engineer", "dealer", "manufacturer"];
                  const userRole = activeUser?.role || "visitor";
                  if (!activeUser || !allowedRoles.includes(userRole)) {
                    showToast("İçerik oluşturabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                    alert("İçerik oluşturabilmek için aktif üyelik paketine sahip olmanız gerekmektedir.");
                    return;
                  }
                  
                  // Reset edit states
                  setIsEditingContentId(null);
                  setNewTitle("");
                  setNewCategory("Haber");
                  setNewSummary("");
                  setNewContent("");
                  setNewTags("");
                  setNewImageUrl("https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=600&auto=format&fit=crop");
                  setNewIsCoverImage(true);
                  setIsCreatorOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow"
              >
                <PenTool className="h-4 w-4" />
                İçerik / Bülten Yaz
              </button>
            </div>
          </div>

          {/* MANUFACTURER ANALYTICAL SUMMARY (TEKNİK BÜLTEN ANALİZ & MARKA ANALİTİĞİ) */}
          {activeUser?.role === "manufacturer" && (() => {
            const mBrand = activeUser.brand_name || "Atiker";
            // Filter bulletins belonging to this brand
            const myBulletins = bulletinsDb.filter(b => b.lpgBrand?.toLowerCase().trim() === mBrand.toLowerCase().trim());
            const myUserConts = userContentsDb.filter(c => c.category === "Teknik Bülten" && c.lpgBrand?.toLowerCase().trim() === mBrand.toLowerCase().trim());
            
            const totalBulletins = myBulletins.length;
            const totalViews = myBulletins.reduce((sum, b) => sum + (b.views || 0), 0) + (totalBulletins * 243); // add organic factor
            
            // Generate some nice, high-fidelity mock access statistics by city/region
            const cityStats = [
              { city: "Ankara", count: Math.round(totalViews * 0.35), pct: "35%" },
              { city: "İstanbul", count: Math.round(totalViews * 0.28), pct: "28%" },
              { city: "İzmir", count: Math.round(totalViews * 0.15), pct: "15%" },
              { city: "Bursa", count: Math.round(totalViews * 0.12), pct: "12%" },
              { city: "Adana", count: Math.round(totalViews * 0.10), pct: "10%" },
            ];
            
            // Sort popular bulletins
            const popularBulletins = [...myBulletins, ...myUserConts.filter(c => c.status === "Yayınlandı")].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 3);

            return (
              <div id="mfr-analytical-dashboard" className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl text-white space-y-6 shadow-xl relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4 relative z-10">
                  <div>
                    <h3 className="text-base font-black flex items-center gap-2 tracking-tight text-white font-sans">
                      <span>📊</span> {mBrand.toUpperCase()} Resmî Marka Analiz & Bülten İstatistik Raporu
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sisteme kalıcı olarak bağlı profiliniz esasıyla toplanan anlık performans ve erişim verileri.
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                    Marka: {mBrand}
                  </span>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1 text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">{tLocal("Toplam Yayınlanan Bülten", "Total Published Bulletins")}</span>
                    <strong className="text-2xl text-white font-black block font-sans">{totalBulletins} Adet</strong>
                    <span className="text-[9.5px] text-emerald-400 font-medium block">{tLocal("✓ Canlıda Yayında", "✓ Live in Production")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1 text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">{tLocal("Toplam Erişim & Okunma", "Total Access & Reads")}</span>
                    <strong className="text-2xl text-emerald-400 font-black block font-mono">{totalViews.toLocaleString('tr-TR')}</strong>
                    <span className="text-[9.5px] text-slate-400 font-medium block">{tLocal("👀 Tekil Teknisyen Okumaları", "👀 Unique Technician Reads")}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1 text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">{tLocal("Sertifikalı Usta & Bayi", "Certified Technician & Dealer")}</span>
                    <strong className="text-2xl text-white font-black block font-sans">184 Bayi</strong>
                    <span className="text-[9.5px] text-emerald-400 font-medium block">🏢 {mBrand} Yetkili Ağı</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1 text-left">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">{tLocal("Analiz Güncelleme", "Analysis Update")}</span>
                    <strong className="text-base text-white font-black block font-mono">Anlık (2026-Real)</strong>
                    <span className="text-[9.5px] text-slate-400 font-medium block">{tLocal("⚡ Tam Güvenli Entegrasyon", "⚡ Fully Secure Integration")}</span>
                  </div>
                </div>

                {/* City Stats and Popular Bulletins Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10 text-left">
                  {/* City Access Stats (5 cols) */}
                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 md:col-span-5 space-y-3.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 border-b border-white/5 pb-2">
                      📍 İl ve Bölgelere Göre Bülten Erişimi
                    </h4>
                    <div className="space-y-3">
                      {cityStats.map(c => (
                        <div key={c.city} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-200">{c.city}</span>
                            <span className="font-mono text-[10.5px] text-emerald-400 font-extrabold">{c.count.toLocaleString('tr-TR')} ({c.pct})</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: c.pct }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Bulletins (7 cols) */}
                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 md:col-span-7 space-y-3.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 border-b border-white/5 pb-2">
                      🔥 En Popüler Teknik Bültenler
                    </h4>
                    <div className="space-y-2.5">
                      {popularBulletins.length === 0 ? (
                        <div className="text-xs text-slate-450 italic p-4 text-center">{tLocal("Henüz yayınlanmış bülten bulunmuyor.", "There are no bulletins published yet.")}</div>
                      ) : (
                        popularBulletins.map((b, idx) => (
                          <div key={b.id} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-lg border border-white/8 hover:bg-white/10 transition">
                            <div className="space-y-0.5 max-w-[80%] text-left">
                              <span className="text-[9px] bg-emerald-950 border border-emerald-900 text-emerald-400 font-extrabold px-1.5 rounded uppercase font-mono">
                                SIRA {idx + 1}
                              </span>
                              <h5 className="text-[11.5px] font-bold text-white truncate">{b.title}</h5>
                            </div>
                            <div className="text-right">
                              <span className="text-[11.5px] font-mono text-emerald-400 font-extrabold block">{(b.views || 0 + (idx === 0 ? 1200 : idx === 1 ? 840 : 250)).toLocaleString('tr-TR')}</span>
                              <span className="text-[9px] text-slate-400 block font-sans">Okunma</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Panel: My Content (12 cols) */}
            <div className="lg:col-span-12 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="font-extrabold text-sm text-slate-850 uppercase tracking-widest font-sans flex items-center gap-1.5">
                  📁 Kaleme Aldığım İçerikler ({userContentsDb.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">Durable Storage Active</span>
              </div>

              {userContentsDb.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-16 text-center text-slate-400">
                  <PenTool className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="font-extrabold text-sm">{tLocal("Henüz bir içerik yazısı eklemediniz.", "You haven't added any content posts yet.")}</p>
                  <p className="text-xs text-slate-400 mt-1">{tLocal("Sektör yararına ilk bülteninizi oluşturmak için sağ üstteki yazma butonuna dokunun.", "Click the write button on the top right to create your first bulletin for the benefit of the industry.")}</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {userContentsDb.map((item) => {
                    // Decide badge color
                    let badgeCol = "bg-amber-50 text-amber-700 border-amber-150";
                    if (item.status === "İnceleniyor") badgeCol = "bg-blue-50 text-blue-700 border-blue-150";
                    if (item.status === "Onaylandı") badgeCol = "bg-emerald-50 text-emerald-700 border-emerald-150";
                    if (item.status === "Yayınlandı") badgeCol = "bg-emerald-500 text-white border-emerald-650";
                    if (item.status === "Revizyon İstendi") badgeCol = "bg-indigo-55 bg-indigo-50 text-indigo-700 border-indigo-200";
                    if (item.status === "Reddedildi") badgeCol = "bg-rose-50 text-rose-700 border-rose-150";

                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-500/35 hover:shadow-xs transition relative">
                        
                        {/* Header Status badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
                              {item.category}
                            </span>
                            {item.category === "Teknik Bülten" && (
                              <span className="bg-emerald-600 text-white text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded shadow-2xs flex items-center gap-1">
                                <span>🏭</span> Resmi Teknik Bülten
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-semibold">{item.createdAt}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeCol}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>

                        <h5 className="font-extrabold text-sm text-slate-900 mb-1.5">{item.title}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">{item.summary}</p>
                        
                        {/* Stats if published */}
                        {(item.status === "Yayınlandı" || item.status === "Onaylandı") && (
                          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 font-semibold w-fit mb-3">
                            <span className="flex items-center gap-0.5">👁️ {item.views} {tLocal("Görüntülenme", "Views")}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">👍 {item.likes} {tLocal("Beğeni", "Likes")}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">🔗 {item.facebookShares + item.linkedinShares + item.whatsappShares + item.twitterShares} {tLocal("Paylaşım", "Shares")}</span>
                          </div>
                        )}

                        {/* Admin revision notes block */}
                        {item.status === "Revizyon İstendi" && item.revisionNotes && (
                          <div className="bg-indigo-55 bg-indigo-50/65 border border-indigo-200 rounded-lg p-3.5 text-xs text-indigo-900 mb-3 space-y-1">
                            <div className="flex items-center gap-1 text-indigo-800 font-extrabold uppercase font-mono text-[10px]">
                              <AlertTriangle className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{tLocal("Yönetici Revizyon Geri Bildirimi:", "Admin Revision Feedback:")}</span>
                            </div>
                            <p className="italic bg-white p-2 rounded border border-indigo-100 font-sans leading-relaxed text-[11px]">
                              "{item.revisionNotes}"
                            </p>
                          </div>
                        )}

                        {/* Actions for revision */}
                        <div className="flex justify-between items-center pt-3.5 border-t border-slate-100 mt-2">
                          <span className="text-[10.5px] text-slate-400 font-semibold">
                            Yazar: {item.authorName} ({item.authorRole})
                          </span>

                          <div className="flex gap-2">
                            {/* Let users edit and resubmit if revision requested */}
                            {item.status === "Revizyon İstendi" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingContentId(item.id);
                                  setNewTitle(item.title);
                                  setNewCategory(item.category);
                                  setNewSummary(item.summary);
                                  setNewContent(item.content);
                                  setNewTags(item.tags ? item.tags.join(", ") : "");
                                  setNewImageUrl(item.imageUrl || "");
                                  setNewIsCoverImage(!!item.isCoverImage);
                                  setIsCreatorOpen(true);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer font-sans"
                              >
                                <PenTool className="h-3.5 w-3.5" />
                                Düzenle ve Yeniden Gönder
                              </button>
                            )}

                            {/* View Content Detail button */}
                            <button
                              type="button"
                              onClick={() => {
                                alert(`[İÇERİK DETAY ÖNİZLEMESİ]\n\nBaşlık: ${item.title}\nKategori: ${item.category}\nDurum: ${item.status}\n\nİçerik Metni:\n${item.content}`);
                              }}
                              className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/70 rounded-lg transition font-sans cursor-pointer"
                            >
                              Yazıyı Önizle
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>



          </div>



        </div>
      )}



      {/* Share Actions Overlay Dialog Modal */}
      {shareTarget && (
        <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in text-left" onClick={() => setShareTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full space-y-4 shadow-2xl relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 font-sans uppercase">
                <Share2 className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span>{tLocal("Bu İçeriği Paylaş", "Share This Content")}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShareTarget(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold font-mono text-base transition-all p-1"
              >
                ✕
              </button>
            </div>
            
            <div className="text-xs space-y-1">
              <span className="text-slate-400 font-mono font-bold uppercase tracking-wider text-[9px] block">{tLocal("Başlık", "Title")}</span>
              <p className="font-extrabold text-slate-800 line-clamp-3 leading-snug font-sans bg-slate-50 p-2.5 rounded border border-slate-100">
                {translateEntity(shareTarget.item, "title") || shareTarget.item.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-extrabold font-sans pt-1">
              {/* Facebook */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("facebook", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-blue-700 transition cursor-pointer shadow-3xs hover:scale-102"
              >
                <span className="text-base select-none">📘</span>
                <span>Facebook</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("linkedin", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-sky-200 hover:bg-sky-50/50 text-sky-700 transition cursor-pointer shadow-3xs hover:scale-102"
              >
                <span className="text-base select-none">💼</span>
                <span>LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("whatsapp", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 text-emerald-700 transition cursor-pointer shadow-3xs hover:scale-102"
              >
                <span className="text-base select-none">🟢</span>
                <span>WhatsApp</span>
              </button>

              {/* X (Twitter) */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("twitter", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-slate-800/30 hover:bg-slate-50 text-slate-850 transition cursor-pointer shadow-3xs hover:scale-102"
              >
                <strong className="text-base select-none font-mono">𝕏</strong>
                <span>X / Twitter</span>
              </button>

              {/* Instagram */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("instagram", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-slate-200 hover:border-pink-200 hover:bg-pink-50/55 text-pink-700 transition cursor-pointer shadow-3xs hover:scale-102"
              >
                <span className="text-base select-none">📸</span>
                <span>{tLocal("Kopyala ve Instagram'da Paylaş", "Copy and Share on Instagram")}</span>
              </button>

              {/* Bağlantıyı Kopyala */}
              <button
                type="button"
                onClick={() => {
                  handleShareAction("copy", shareTarget.item, shareTarget.type);
                  setShareTarget(null);
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-xl border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-3xs hover:scale-101"
              >
                <span>🔗</span>
                <span>{tLocal("Bağlantı Adresini Kopyala", "Copy Link Address")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIBRARY FILE UPLOAD FORM */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-emerald-600" />
                  {tLocal("Yeni Yazılım / Kalibrasyon Dosyası Yükle", "Upload New Software / Calibration File")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tLocal("LPG ECU firmware, harita ve yama dosyalarınızı güvenli şekilde yükleyin.", "Securely upload LPG ECU firmware, maps, and patch files.")}
                </p>
              </div>
              <button type="button" onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-650 font-bold text-lg p-1">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Kit Markası *", "Kit Brand *")}</label>
                  {activeUser?.role === "manufacturer" ? (
                    <input type="text" disabled value={activeUser.brand_name || ""} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-extrabold cursor-not-allowed text-xs" />
                  ) : (
                    <select value={uploadKitBrand} onChange={(e) => setUploadKitBrand(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 font-extrabold cursor-pointer text-xs focus:ring-emerald-500 focus:outline-none">
                      {BRAND_FILTERS.filter(b => b !== "Hepsi").map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Araç Markası *", "Vehicle Brand *")}</label>
                  <input type="text" required placeholder={tLocal("Örn: Fiat, Toyota...", "e.g. Fiat, Toyota...")} value={uploadCarBrand} onChange={(e) => setUploadCarBrand(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Araç Modeli *", "Vehicle Model *")}</label>
                  <input type="text" required placeholder={tLocal("Örn: Egea, Corolla...", "e.g. Egea, Corolla...")} value={uploadCarModel} onChange={(e) => setUploadCarModel(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Model Yılı *", "Model Year *")}</label>
                  <input type="text" required placeholder={tLocal("Örn: 2024", "e.g. 2024")} value={uploadModelYear} onChange={(e) => setUploadModelYear(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Motor Hacmi *", "Engine Volume *")}</label>
                  <input type="text" required placeholder={tLocal("Örn: 1.4 Fire, 1.6 T-GDI", "e.g. 1.4 Fire, 1.6 T-GDI")} value={uploadEngineVolume} onChange={(e) => setUploadEngineVolume(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Yakıt Tipi *", "Fuel Type *")}</label>
                  <select value={uploadFuelType} onChange={(e) => setUploadFuelType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs cursor-pointer">
                    <option value="Benzin/LPG">Benzin/LPG</option>
                    <option value="Direkt Enjeksiyon (DI)">Direkt Enjeksiyon (DI)</option>
                    <option value="Hibrit/LPG">Hibrit/LPG</option>
                    <option value="Diesel/LPG">Diesel/LPG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Motor Kodu *", "Engine Code *")}</label>
                  <input type="text" required placeholder={tLocal("Örn: 843A1000", "e.g. 843A1000")} value={uploadEngineCode} onChange={(e) => setUploadEngineCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("ECU Kodu *", "ECU Code *")}</label>
                  <input type="text" required placeholder="Örn: SQ32-11" value={uploadEcuCode} onChange={(e) => setUploadEcuCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Uyumlu LPG Kiti *", "Compatible LPG Kit *")}</label>
                  <input type="text" required placeholder="Örn: BRC Sequent 32" value={uploadCompatibleKit} onChange={(e) => setUploadCompatibleKit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Yazılım Versiyonu *", "Software Version *")}</label>
                  <input type="text" required placeholder="Örn: V2.10.4" value={uploadSoftwareVersion} onChange={(e) => setUploadSoftwareVersion(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">{tLocal("Güncelleme Tarihi *", "Update Date *")}</label>
                  <input type="date" required value={uploadUpdateDate} onChange={(e) => setUploadUpdateDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{tLocal("Kısa Açıklama *", "Short Description *")}</label>
                <textarea required rows={2} placeholder={tLocal("Örn: Fiat Egea 1.4 Fire motorlar için rölanti düzenleme haritası.", "e.g. Idle regulation map for Fiat Egea 1.4 Fire engines.")} value={uploadShortDesc} onChange={(e) => setUploadShortDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-normal" />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{tLocal("Güncelleme Notu *", "Update Note *")}</label>
                <textarea required rows={2} placeholder={tLocal("Örn: Rölanti dalgalanması MAP parametreleri ile giderilmiştir.", "e.g. Idle fluctuation resolved with MAP parameters.")} value={uploadUpdateNotes} onChange={(e) => setUploadUpdateNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-normal" />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{tLocal("Teknik Notlar *", "Technical Notes *")}</label>
                <textarea required rows={2} placeholder={tLocal("Örn: Regülatör basıncı 1.15 bar, nozullar 1.8mm olmalıdır.", "e.g. Regulator pressure should be 1.15 bar, nozzles 1.8mm.")} value={uploadTechnicalNotes} onChange={(e) => setUploadTechnicalNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-xs font-normal" />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <label className="block text-slate-700 font-extrabold text-xs mb-2">
                  {tLocal("Yazılım / Kalibrasyon Dosyası Seçin (.fpd veya .afcp) *", "Select Software / Calibration File (.fpd or .afcp) *")}
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (ext !== 'fpd' && ext !== 'afcp') {
                        alert('Sadece .fpd ve .afcp uzantılı dosyalara izin verilir.');
                        return;
                      }
                      setUploadFile(file);
                      setUploadFileName(file.name);
                    }
                  }}
                  onClick={() => {
                    const fileInput = document.getElementById("libFileInput");
                    if (fileInput) fileInput.click();
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center cursor-pointer min-h-[120px] ${
                    isDraggingFile ? "bg-slate-900/10 border-emerald-500 text-emerald-600" : "bg-white border-slate-300 hover:border-slate-400 text-slate-500"
                  }`}
                >
                  <input type="file" id="libFileInput" accept=".fpd,.afcp" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const ext = file.name.split('.').pop()?.toLowerCase();
                      if (ext !== 'fpd' && ext !== 'afcp') {
                        alert('Sadece .fpd ve .afcp uzantılı dosyalara izin verilir.');
                        return;
                      }
                      setUploadFile(file);
                      setUploadFileName(file.name);
                    }
                  }} />
                  <div className="space-y-1 flex flex-col items-center justify-center">
                    <span className="text-xl">📤</span>
                    <div className="text-xs font-bold text-slate-705">
                      {uploadFileName ? (
                        <span className="text-emerald-700 font-mono text-xs">{uploadFileName}</span>
                      ) : (
                        <span>{tLocal("Sürükleyip bırakın veya", "Drag and drop or")} <span className="text-emerald-600 underline">{tLocal("dosya seçin", "select file")}</span></span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Desteklenen formatlar: <strong>.fpd, .afcp</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3.5">
                <button type="button" onClick={() => setIsUploadOpen(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 transition cursor-pointer">
                  Vazgeç
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>{tLocal("Dosyayı Gönder", "Send File")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIBRARY FILE DETAIL */}
      {selectedLibFile && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left" onClick={() => setSelectedLibFile(null)}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[10px] font-mono">
                  {selectedLibFile.kit_brand}
                </span>
                <h3 className="font-black text-xl text-slate-900 mt-2 font-sans tracking-tight leading-tight">
                  {selectedLibFile.car_brand} {selectedLibFile.car_model} ({selectedLibFile.model_year})
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {tLocal("Dosya Adı: ", "File Name: ")} <strong className="text-slate-700">{selectedLibFile.file_name}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setSelectedLibFile(null)} className="text-slate-400 hover:text-slate-650 font-bold text-lg p-1">✕</button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              
              {/* Specifications Matrix */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans shadow-2xs">
                <div className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 uppercase tracking-wider text-[10px]">
                  {tLocal("Motor ve Sistem Bilgileri", "Engine & System Specifications")}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("Motor Hacmi", "Engine Volume")}</span>
                    <p className="font-bold text-slate-800">{selectedLibFile.engine_volume}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("Yakıt Tipi", "Fuel Type")}</span>
                    <p className="font-bold text-slate-800">{selectedLibFile.fuel_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("Motor Kodu", "Engine Code")}</span>
                    <p className="font-mono font-bold text-slate-800">{selectedLibFile.engine_code}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("ECU Kodu", "ECU Code")}</span>
                    <p className="font-mono font-bold text-slate-800">{selectedLibFile.ecu_code}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("Yazılım Sürümü", "Software Version")}</span>
                    <p className="font-mono font-bold text-slate-800">{selectedLibFile.software_version}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[9px] uppercase tracking-wider">{tLocal("Uyumlu LPG Kiti", "Compatible LPG Kit")}</span>
                    <p className="font-bold text-slate-800">{selectedLibFile.compatible_kit}</p>
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">{tLocal("Kısa Açıklama", "Short Description")}</span>
                <p className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg text-slate-700 leading-relaxed font-medium">
                  {selectedLibFile.short_desc}
                </p>
              </div>

              {/* Update Notes */}
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">{tLocal("Güncelleme Notları", "Update Notes")}</span>
                <p className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedLibFile.update_notes}
                </p>
              </div>

              {/* Technical Notes */}
              <div>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">{tLocal("Teknisyen İçin Teknik Notlar", "Technical Notes for Technicians")}</span>
                <p className="p-3 bg-slate-50/70 border border-slate-150 rounded-lg text-slate-700 leading-relaxed whitespace-pre-line font-sans font-medium">
                  {selectedLibFile.technical_notes}
                </p>
              </div>

              {/* Download metadata */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-3">
                <span>{tLocal("Yayın Tarihi: ", "Publish Date: ")} {selectedLibFile.update_date}</span>
                <span>{selectedLibFile.downloads || 0} {tLocal("indirme", "downloads")}</span>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 border-t border-slate-150 pt-3.5 mt-2">
                {activeUser?.role === "admin" && !selectedLibFile.approved && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleAdminApprove(selectedLibFile);
                        setSelectedLibFile(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
                    >
                      Onayla & Yayınla
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAdminReject(selectedLibFile.id);
                        setSelectedLibFile(null);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
                    >
                      Reddet
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedLibFile(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-650 text-slate-600 transition cursor-pointer"
                >
                  Kapat
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadFile(selectedLibFile);
                    setSelectedLibFile(null);
                  }}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>{tLocal("Dosyayı İndir", "Download File")}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUFACTURER DOWNLOAD STATISTICS */}
      {isStatsOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left" onClick={() => setIsStatsOpen(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-4xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-black text-xl text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-emerald-600" />
                  {tLocal("Yüklenen Dosya İndirme İstatistikleri", "Uploaded File Download Statistics")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {tLocal("Yüklediğiniz dosyaların hangi bayiler tarafından, ne zaman indirildiğini takip edin.", "Track when and by which dealers your uploaded files were downloaded.")}
                </p>
              </div>
              <button type="button" onClick={() => setIsStatsOpen(false)} className="text-slate-400 hover:text-slate-650 font-bold text-lg p-1">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs text-slate-700">
              
              {/* Left Side: File List (4 cols) */}
              <div className="md:col-span-4 space-y-2 border-r border-slate-100 pr-4 max-h-[500px] overflow-y-auto">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-2">{tLocal("Dosyalarınız", "Your Files")}</span>
                {(() => {
                  const mfrBrand = activeUser?.brand_name || "";
                  const myFiles = libraryDb.filter(f => f.kit_brand.toLowerCase() === mfrBrand.toLowerCase());
                  
                  if (myFiles.length === 0) {
                    return <div className="text-slate-400 italic text-center py-4">{tLocal("Yüklenmiş dosyanız bulunmamaktadır.", "You have no uploaded files.")}</div>;
                  }
                  
                  return myFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedStatsFileId(file.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                        selectedStatsFileId === file.id
                          ? "bg-emerald-50 border-emerald-500 shadow-3xs"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="font-extrabold text-[11px] text-slate-900 truncate">
                        {file.car_brand} {file.car_model}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                        {file.file_name}
                      </div>
                      <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500 font-mono">
                        <span>{file.update_date}</span>
                        <span className="font-bold text-emerald-700">{file.downloads || 0} indirme</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Right Side: Download Logs Details (8 cols) */}
              <div className="md:col-span-8 space-y-4 max-h-[500px] overflow-y-auto">
                {selectedStatsFileId ? (() => {
                  const file = libraryDb.find(f => f.id === selectedStatsFileId);
                  const logs = downloadLogs.filter(l => l.file_id === selectedStatsFileId);
                  
                  if (!file) return null;

                  return (
                    <div className="space-y-4">
                      {/* File summary */}
                      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                        <div className="font-bold text-slate-900 text-xs">{file.car_brand} {file.car_model} ({file.model_year}) - {file.software_version}</div>
                        <div className="text-slate-500">{file.short_desc}</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-200/60 mt-1">
                          <span>{tLocal("Toplam İndirme: ", "Total Downloads: ")} <strong className="text-emerald-700">{file.downloads || 0}</strong></span>
                          <span>{tLocal("Son İndirme: ", "Last Download: ")} <strong className="text-slate-700">{file.last_download || "-"}</strong></span>
                        </div>
                      </div>

                      {/* Logs table */}
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-2">{tLocal("İndirme Geçmişi & Firma Listesi", "Download Logs & Companies")}</span>
                      
                      {logs.length === 0 ? (
                        <div className="text-slate-400 italic text-center py-8">{tLocal("Bu dosya henüz indirilmemiştir.", "This file has not been downloaded yet.")}</div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                          <table className="w-full text-left font-sans text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-200">
                                <th className="p-3">{tLocal("Firma Adı", "Company Name")}</th>
                                <th className="p-3">{tLocal("İndiren", "Downloaded By")}</th>
                                <th className="p-3">{tLocal("Tarih & Saat", "Date & Time")}</th>
                                <th className="p-3">{tLocal("IP Adresi", "IP Address")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/50 bg-white">
                              {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition text-[10.5px]">
                                  <td className="p-3 font-extrabold text-slate-800">{log.company_name}</td>
                                  <td className="p-3 text-slate-600">{log.user_name}</td>
                                  <td className="p-3 font-mono text-slate-500">{log.date} {log.time}</td>
                                  <td className="p-3 font-mono text-slate-500">{log.ip_address}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <div className="text-slate-400 italic text-center py-20">
                    {tLocal("İndirme detaylarını görmek için soldan bir dosya seçin.", "Select a file from the left to view download logs.")}
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end border-t border-slate-150 pt-3.5 mt-4">
              <button
                type="button"
                onClick={() => setIsStatsOpen(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Banner Ad */}
      {(() => {
        const bottomAd = adsDb.find(a => a.position === "bottom" && a.active);
        if (!bottomAd) return null;
        return (
          <div className="mt-8 rounded-xl overflow-hidden shadow-xs border border-slate-200">
            <a href={bottomAd.clickUrl} target="_blank" rel="noopener noreferrer" className="block transition hover:opacity-95">
              <img 
                src={bottomAd.imageUrl} 
                alt={bottomAd.title} 
                className="w-full h-auto max-h-[120px] sm:max-h-[160px] object-cover"
              />
            </a>
          </div>
        );
      })()}

      {/* Dynamic Toast popup indicator */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white font-black text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in z-55">
          <span className="bg-emerald-600 text-white p-1 rounded-full text-[10px] leading-none">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

    </div>
  );
}
