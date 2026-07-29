import React, { useState, useEffect } from "react";
import { DbUser, addSystemLog, sendLpgNotification } from "../lib/membership";
import { sanitizeHtml, escapeHtml, isPotentialSqlInjection } from "../lib/security";
import { useLanguage } from "../lib/LanguageContext";
import { 
  Wrench, 
  Send, 
  User, 
  PhoneOff, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  X, 
  PlusCircle, 
  MapPin, 
  Sliders, 
  Eye, 
  Share2, 
  Check, 
  Trash, 
  Search, 
  Filter, 
  ShieldCheck, 
  Award, 
  Calendar, 
  Clock, 
  UserCheck, 
  ThumbsUp, 
  ThumbsDown, 
  Plus, 
  AlertTriangle,
  Upload,
  Video,
  FileText
} from "lucide-react";

interface SupportCenterProps {
  activeUser: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

// Interfaces
export interface ExpertProfile {
  id: string;
  name: string;
  expertise: string;
  experience: string;
  brands: string[];
  city: string;
  about: string;
  certificates: string[];
  photo: string;
  seller_id: string; // bound to the engineer/dealer who created it
  created_at: string;
  status: "Aktif" | "Pasif";
}

export interface ContactRequest {
  id: string;
  expertId: string;
  expertName: string;
  senderName: string;
  senderRole: string;
  senderPhone: string;
  senderEmail: string;
  subject: string;
  message: string;
  vehicleInfo: string;
  city: string;
  createdAt: string;
  smsSent: boolean;
  emailSent: boolean;
  panelSent: boolean;
}

export interface FaultRequest {
  id: string;
  carBrand: string;
  carModel: string;
  carYear: string;
  lpgBrand: string;
  city: string;
  district: string;
  title: string;
  description: string;
  photo: string;
  video?: string;
  creatorId: string; // "guest" or user ID
  creatorName: string;
  creatorPhone: string; // stored hidden
  creatorEmail: string; // stored hidden
  status: "Yeni Talep" | "İnceleniyor" | "Çözüm Gönderildi" | "Kullanıcı Onayladı" | "Tamamlandı" | "Kapatıldı";
  createdAt: string;
}

export interface TechnicalSolution {
  id: string;
  requestId: string;
  resolverId: string;
  resolverName: string;
  subject: string;
  solution: string;
  cost: number;
  duration: string;
  createdAt: string;
  userDecision: "Kabul Et" | "Reddet" | "Daha Sonra Karar Ver" | "Beklemede";
}

// Preset assets for easy illustration
const DEMO_PHOTOS = {
  expert1: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300",
  expert2: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300",
  expert3: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
  fault1: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=350",
  fault2: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=350",
  fault3: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&q=80&w=350"
};

export default function SupportCenter({ activeUser, onNavigateToTab }: SupportCenterProps) {
  const { language, translateEntity } = useLanguage();
  const tLocal = (tr: string, en: string) => language === "en" ? en : tr;

  // Main Subtabs: "profiles" (Ustalar), "faults" (Arızalar), "my_activities" (Taleplerim), "admin"
  const [activeSubTab, setActiveSubTab] = useState<"profiles" | "faults" | "my_activities" | "admin">("profiles");

  // State
  const [expertProfiles, setExpertProfiles] = useState<ExpertProfile[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [faultRequests, setFaultRequests] = useState<FaultRequest[]>([]);
  const [technicalSolutions, setTechnicalSolutions] = useState<TechnicalSolution[]>([]);

  // Simulation log for global SMS / Email transmissions
  const [notificationLogs, setNotificationLogs] = useState<{
    id: string;
    type: "SMS" | "E-Posta" | "Sistem Bildirimi";
    recipientName: string;
    message: string;
    timestamp: string;
  }[]>([]);

  // Filters
  const [profilesSearch, setProfilesSearch] = useState("");
  const [profilesCity, setProfilesCity] = useState("Hepsi");
  const [faultsSearch, setFaultsSearch] = useState("");
  const [faultsCity, setFaultsCity] = useState("Hepsi");

  // Creation State - Expert Profile
  const [profileName, setProfileName] = useState("");
  const [profileExpertise, setProfileExpertise] = useState("");
  const [profileExperience, setProfileExperience] = useState("");
  const [profileBrands, setProfileBrands] = useState("");
  const [profileCitySelected, setProfileCitySelected] = useState(tLocal("Ankara", "Ankara"));
  const [profileAbout, setProfileAbout] = useState("");
  const [profileCertificates, setProfileCertificates] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(DEMO_PHOTOS.expert1);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Creation State - Contact Request Modal
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactVehicleInfo, setContactVehicleInfo] = useState("");
  const [contactCity, setContactCity] = useState("");

  // Creation State - Fault Request
  const [faultCarBrand, setFaultCarBrand] = useState("");
  const [faultCarModel, setFaultCarModel] = useState("");
  const [faultCarYear, setFaultCarYear] = useState("");
  const [faultLpgBrand, setFaultLpgBrand] = useState("");
  const [faultCitySelected, setFaultCitySelected] = useState(tLocal("Ankara", "Ankara"));
  const [faultDistrict, setFaultDistrict] = useState("");
  const [faultTitle, setFaultTitle] = useState("");
  const [faultDescription, setFaultDescription] = useState("");
  const [faultPhoto, setFaultPhoto] = useState(DEMO_PHOTOS.fault1);
  const [faultVideo, setFaultVideo] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [showFaultForm, setShowFaultForm] = useState(false);

  // Creation State - Technical Solution Proposal Modal
  const [selectedFault, setSelectedFault] = useState<FaultRequest | null>(null);
  const [solutionSubject, setSolutionSubject] = useState("");
  const [solutionInfo, setSolutionInfo] = useState("");
  const [solutionCost, setSolutionCost] = useState("");
  const [solutionDuration, setSolutionDuration] = useState("");

  // Feedbacks
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Load and Init Database
  useEffect(() => {
    // 1. Expert Profiles
    const savedProfiles = localStorage.getItem("lpgportal_expert_profiles");
    if (savedProfiles) {
      setExpertProfiles(JSON.parse(savedProfiles));
    } else {
            const defaultProfiles: ExpertProfile[] = [];
      localStorage.setItem("lpgportal_expert_profiles", JSON.stringify(defaultProfiles));
      setExpertProfiles(defaultProfiles);
    }

    // 2. Fault Requests
    const savedFaults = localStorage.getItem("lpgportal_fault_requests");
    if (savedFaults) {
      setFaultRequests(JSON.parse(savedFaults));
    } else {
      const defaultFaults: FaultRequest[] = [];
      localStorage.setItem("lpgportal_fault_requests", JSON.stringify(defaultFaults));
      setFaultRequests(defaultFaults);
    }

    // 3. Technical Solutions
    const savedSolutions = localStorage.getItem("lpgportal_tech_solutions");
    if (savedSolutions) {
      setTechnicalSolutions(JSON.parse(savedSolutions));
    } else {
      const defaultSolutions: TechnicalSolution[] = [];
      localStorage.setItem("lpgportal_tech_solutions", JSON.stringify(defaultSolutions));
      setTechnicalSolutions(defaultSolutions);
    }

    // 4. Contact Requests
    const savedContacts = localStorage.getItem("lpgportal_contact_requests");
    if (savedContacts) {
      setContactRequests(JSON.parse(savedContacts));
    }

    // 5. Notification Logs
    const savedNotificationLogs = localStorage.getItem("lpgportal_notification_logs");
    if (savedNotificationLogs) {
      setNotificationLogs(JSON.parse(savedNotificationLogs));
    } else {
      const defaultLogs = [
        {
          id: "log_1",
          type: "System" as any,
          recipientName: "Ahmet Erten",
          message: "Yeni arıza talebiniz 'Sabahları İlk Çalıştırmada...' başarıyla oluşturuldu.",
          timestamp: new Date().toISOString()
        }
      ];
      setNotificationLogs(defaultLogs);
    }
  }, []);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        if (key === "lpgportal_expert_profiles") setExpertProfiles(value);
        if (key === "lpgportal_fault_requests") setFaultRequests(value);
        if (key === "lpgportal_tech_solutions") setTechnicalSolutions(value);
        if (key === "lpgportal_contact_requests") setContactRequests(value);
        if (key === "lpgportal_notification_logs") setNotificationLogs(value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  useEffect(() => {
    if (selectedFault) {
      const updated = faultRequests.find(f => f.id === selectedFault.id);
      if (updated) {
        setSelectedFault(updated);
      }
    }
  }, [faultRequests]);

  // Save states helper
  const saveState = (key: string, data: any, setter: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    setter(data);
  };

  // Log SMS / Email simulation
  const triggerSimulationNotifications = (recipientName: string, message: string) => {
    const newLogs = [
      {
        id: "nt_" + Date.now() + "_1",
        type: "SMS" as const,
        recipientName,
        message: `📢 [LPGPORTAL SMS BİLDİRİMİ]: Sayın ${recipientName}, ${message}`,
        timestamp: new Date().toISOString()
      },
      {
        id: "nt_" + Date.now() + "_2",
        type: "E-Posta" as const,
        recipientName,
        message: `📧 [LPGPORTAL E-POSTA]: Sayın ${recipientName}, size iletilen mesaj şöyledir: ${message}. Detaylar için sisteminize giriş yapınız.`,
        timestamp: new Date().toISOString()
      },
      {
        id: "nt_" + Date.now() + "_3",
        type: "Sistem Bildirimi" as const,
        recipientName,
        message: `🔔 Destek Merkezi Bildirimi: ${message}`,
        timestamp: new Date().toISOString()
      }
    ];

    const currentLogs = [...newLogs, ...notificationLogs];
    setNotificationLogs(currentLogs);
    localStorage.setItem("lpgportal_notification_logs", JSON.stringify(currentLogs));
  };

  // BÖLÜM 1: USTA / MÜHENDİS PROFİL EKLEME
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!profileName || !profileExpertise || !profileExperience || !profileBrands) {
      setErrorMsg("Lütfen zorunlu yıldızlı alanları doldurunuz.");
      return;
    }

    // SQL Injection check
    if (
      isPotentialSqlInjection(profileName) || 
      isPotentialSqlInjection(profileExpertise) || 
      isPotentialSqlInjection(profileExperience) || 
      isPotentialSqlInjection(profileBrands) ||
      isPotentialSqlInjection(profileAbout)
    ) {
      setErrorMsg("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      return;
    }

    const cleanProfileName = escapeHtml(profileName.trim());
    const cleanExpertise = escapeHtml(profileExpertise.trim());
    const cleanAbout = sanitizeHtml(profileAbout.trim());

    const newProfile: ExpertProfile = {
      id: "exp_" + Date.now(),
      name: cleanProfileName,
      expertise: cleanExpertise,
      experience: profileExperience,
      brands: profileBrands.split(",").map(b => b.trim()).filter(b => b.length > 0),
      city: profileCitySelected,
      about: cleanAbout,
      certificates: profileCertificates ? profileCertificates.split(",").map(c => c.trim()).filter(c => c.length > 0) : [],
      photo: profilePhoto,
      seller_id: activeUser ? activeUser.id : "guest_expert",
      created_at: new Date().toISOString(),
      status: "Aktif"
    };

    const updated = [newProfile, ...expertProfiles];
    saveState("lpgportal_expert_profiles", updated, setExpertProfiles);

    // Reset Form
    setProfileName("");
    setProfileExpertise("");
    setProfileExperience("");
    setProfileBrands("");
    setProfileAbout("");
    setProfileCertificates("");
    setProfilePhoto(DEMO_PHOTOS.expert1);
    setShowProfileForm(false);
    setSuccessMsg("Usta/Uzman profiliniz başarıyla oluşturuldu! Artık sistemde listelenmektesiniz.");
  };

  // USTA / UZMANLA İLETİŞİME GEÇ (Contact submission)
  const handleSendContactRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpert) return;

    const newRequest: ContactRequest = {
      id: "cnt_" + Date.now(),
      expertId: selectedExpert.id,
      expertName: selectedExpert.name,
      senderName: activeUser ? activeUser.name : "Sektör Ziyaretçisi",
      senderRole: activeUser ? activeUser.role : "Ziyaretçi",
      senderPhone: activeUser ? activeUser.phone : "GİZLİ",
      senderEmail: activeUser ? activeUser.email : "GİZLİ",
      subject: contactSubject,
      message: contactMessage,
      vehicleInfo: contactVehicleInfo,
      city: contactCity || "Belirtilmemiş",
      createdAt: new Date().toISOString(),
      smsSent: true,
      emailSent: true,
      panelSent: true
    };

    const updated = [newRequest, ...contactRequests];
    saveState("lpgportal_contact_requests", updated, setContactRequests);

    // Simulate notifications sent to the Expert
    triggerSimulationNotifications(
      selectedExpert.name,
      `Destek Merkezi üzerinden size yeni bir iletişim talebi gönderildi! Gönderen: ${newRequest.senderName} (${newRequest.vehicleInfo})`
    );

    // Reset Form & Close Modal
    setContactSubject("");
    setContactMessage("");
    setContactVehicleInfo("");
    setContactCity("");
    setSelectedExpert(null);
    setSuccessMsg(`${selectedExpert.name} isimli uzmana talebiniz güvenle iletildi! Kendisine SMS, E-Posta ve Sistem üzerinden bildirim gönderildi. İletişim bilgileriniz gizli tutulmaktadır.`);
  };

  // BÖLÜM 2: ARIZA & DESTEK TALEBİ OLUŞTURMA
  const handleCreateFault = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!faultCarBrand || !faultCarModel || !faultTitle || !faultDescription) {
      setErrorMsg("Lütfen aracınızın marka, model bilgilerini ve arıza açıklamasını tam giriniz.");
      return;
    }

    // SQL Injection check
    if (
      isPotentialSqlInjection(faultTitle) || 
      isPotentialSqlInjection(faultDescription) || 
      isPotentialSqlInjection(faultCarBrand) || 
      isPotentialSqlInjection(faultCarModel) ||
      isPotentialSqlInjection(guestName) ||
      isPotentialSqlInjection(guestEmail)
    ) {
      setErrorMsg("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      addSystemLog("SQLi Şüphesi", "Arıza destek formunda şüpheli SQLi girdisi engellendi.");
      return;
    }

    // XSS Sanitization & HTML Escaping
    const cleanTitle = escapeHtml(faultTitle.trim());
    const cleanDesc = sanitizeHtml(faultDescription.trim());
    const cleanBrand = escapeHtml(faultCarBrand.trim());
    const cleanModel = escapeHtml(faultCarModel.trim());
    const cleanGuestName = escapeHtml(guestName.trim());
    const cleanGuestEmail = escapeHtml(guestEmail.trim());

    // Capture guest information if user is not signed in
    const finalCreatorName = activeUser ? activeUser.name : (cleanGuestName || "Anonim Ziyaretçi");
    const finalCreatorPhone = activeUser ? activeUser.phone : (guestPhone || "Bilinmiyor");
    const finalCreatorEmail = activeUser ? activeUser.email : (cleanGuestEmail || "Bilinmiyor");

    const newFault: FaultRequest = {
      id: "flt_" + Date.now(),
      carBrand: cleanBrand,
      carModel: cleanModel,
      carYear: faultCarYear || "Belirtilmedi",
      lpgBrand: faultLpgBrand || "Belirtilmedi",
      city: faultCitySelected,
      district: faultDistrict || "Merkez",
      title: cleanTitle,
      description: cleanDesc,
      photo: faultPhoto,
      video: faultVideo || undefined,
      creatorId: activeUser ? activeUser.id : "guest_" + Math.random().toString(36).substring(2, 5),
      creatorName: finalCreatorName,
      creatorPhone: finalCreatorPhone,
      creatorEmail: finalCreatorEmail,
      status: "Yeni Talep",
      createdAt: new Date().toISOString()
    };

    const updated = [newFault, ...faultRequests];
    saveState("lpgportal_fault_requests", updated, setFaultRequests);

    // Notify admin in system notifications
    sendLpgNotification(
      "user_admin",
      "⚠️ Yeni Arıza Destek Talebi",
      `Yeni bir arıza destek talebi oluşturuldu: ${newFault.title} (${newFault.carBrand} ${newFault.carModel})`,
      "teklif",
      "all",
      true
    );

    // Reset Form
    setFaultCarBrand("");
    setFaultCarModel("");
    setFaultCarYear("");
    setFaultLpgBrand("");
    setFaultDistrict("");
    setFaultTitle("");
    setFaultDescription("");
    setFaultVideo("");
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setShowFaultForm(false);

    // Notify user & send alert logs
    triggerSimulationNotifications(
      finalCreatorName,
      `Arıza destek talebiniz ('${newFault.title}') başarıyla sisteme kaydedildi. LPG ustalarımız tarafından incelendiğinde bilgilendirileceksiniz.`
    );

    setSuccessMsg("Arıza / destek talebiniz başarıyla yayınlandı! Sektördeki uzman ve bayilerimiz konuyu inceleyerek size kapalı teknik çözümler iletecektir. Çözüm geldiğinde SMS ve E-posta ile bilgilendirileceksiniz.");
  };

  // BÖLÜM 2: TEKNİK ÇÖZÜM GÖNDERME
  const handleSendTechnicalSolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFault) return;

    const priceNum = parseFloat(solutionCost);
    if (!solutionSubject || !solutionInfo || isNaN(priceNum) || priceNum <= 0) {
      alert("Lütfen tüm alanları geçerli değerlerle doldurunuz.");
      return;
    }

    // SQL Injection check
    if (isPotentialSqlInjection(solutionSubject) || isPotentialSqlInjection(solutionInfo)) {
      alert("Güvenlik Uyarısı: Şüpheli karakterler tespit edildi.");
      return;
    }

    // XSS Sanitization & HTML Escaping
    const cleanSubject = escapeHtml(solutionSubject.trim());
    const cleanInfo = sanitizeHtml(solutionInfo.trim());

    const newSolution: TechnicalSolution = {
      id: "tsol_" + Date.now(),
      requestId: selectedFault.id,
      resolverId: activeUser ? activeUser.id : "guest_expert",
      resolverName: activeUser ? (activeUser.company_name || activeUser.name) : "Uzman Usta",
      subject: cleanSubject,
      solution: cleanInfo,
      cost: priceNum,
      duration: solutionDuration || "1 Gün",
      createdAt: new Date().toISOString(),
      userDecision: "Beklemede"
    };

    const updatedSolutions = [newSolution, ...technicalSolutions];
    saveState("lpgportal_tech_solutions", updatedSolutions, setTechnicalSolutions);

    // Update Fault status to "Çözüm Gönderildi"
    const updatedFaults = faultRequests.map(fr => {
      if (fr.id === selectedFault.id) {
        return { ...fr, status: "Çözüm Gönderildi" as const };
      }
      return fr;
    });
    saveState("lpgportal_fault_requests", updatedFaults, setFaultRequests);

    // Simulate notification to the car owner
    triggerSimulationNotifications(
      selectedFault.creatorName,
      `Arıza talebinize ('${selectedFault.title}') ${newSolution.resolverName} tarafından yeni bir teknik çözüm önerisi ve fiyat teklifi iletildi!`
    );

    // Reset Form & Close Modal
    setSolutionSubject("");
    setSolutionInfo("");
    setSolutionCost("");
    setSolutionDuration("");
    setSelectedFault(null);
    setSuccessMsg("Teknik çözüm öneriniz ve fiyat teklifiniz kapalı sistem üzerinden güvenle araç sahibine ulaştırıldı! İletişim bilgileriniz sistem ve KVKK gereği gizli tutulmaktadır.");
  };

  // ARAÇ SAHİBİNİN ÇÖZÜM DEĞERLENDİRMESİ (Accept / Reject / Decide Later)
  const handleEvaluateSolution = (solutionId: string, decision: "Kabul Et" | "Reddet" | "Daha Sonra Karar Ver") => {
    const updatedSolutions = technicalSolutions.map(sol => {
      if (sol.id === solutionId) {
        return { ...sol, userDecision: decision };
      }
      return sol;
    });
    saveState("lpgportal_tech_solutions", updatedSolutions, setTechnicalSolutions);

    // If accepted, update the linked fault request status as well
    const associatedSol = technicalSolutions.find(s => s.id === solutionId);
    if (associatedSol) {
      const targetRequest = faultRequests.find(fr => fr.id === associatedSol.requestId);

      if (decision === "Kabul Et") {
        const updatedFaults = faultRequests.map(fr => {
          if (fr.id === associatedSol.requestId) {
            return { ...fr, status: "Kullanıcı Onayladı" as const };
          }
          return fr;
        });
        saveState("lpgportal_fault_requests", updatedFaults, setFaultRequests);

        if (targetRequest) {
          triggerSimulationNotifications(
            associatedSol.resolverName,
            `Arıza talebine gönderdiğiniz teknik çözüm teklifi araç sahibi (${targetRequest.creatorName}) tarafından kabul edilmiştir! Detaylar için panelinizi inceleyin.`
          );
        }
        alert("Teklifi onayladınız! İlgili ustaya SMS/E-Posta bildirimi iletilmiştir. Sistem aracılığıyla sizinle detaylı randevulaşma sağlanacaktır.");
      } else if (decision === "Reddet") {
        if (targetRequest) {
          triggerSimulationNotifications(
            associatedSol.resolverName,
            `Teklifiniz araç sahibi tarafından değerlendirilmiş ve reddedilmiştir.`
          );
        }
      }
    }
  };

  // GİZLİLİK SHIELD: Get hidden user contact info or format nicely
  const getHiddenContact = (original: string) => {
    if (!original || original.toLowerCase() === "gizli" || original.toLowerCase() === "bilinmiyor") {
      return "Sistemde Gizli 🔒";
    }
    return original.substring(0, 6) + " ** **" + original.substring(original.length - 2);
  };

  // Image Helper reads Base64 with size, extension, and MIME validation
  const handleImageReader = (e: React.ChangeEvent<HTMLInputElement>, target: "expert" | "fault") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // File Size limit: 5MB
      const maxSizeBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        alert(language === "tr" ? "Hata: Dosya boyutu 5 MB limitini aşamaz." : "Error: File size cannot exceed 5 MB.");
        return;
      }

      // Extension Check
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        alert(language === "tr" ? "Hata: Yalnızca JPG, JPEG, PNG, WEBP resim dosyaları kabul edilir." : "Error: Only JPG, JPEG, PNG, WEBP images are allowed.");
        return;
      }

      // MIME Type Check
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!allowedMimes.includes(file.type)) {
        alert(language === "tr" ? "Hata: Geçersiz MIME tipi. Yalnızca resim dosyaları kabul edilir." : "Error: Invalid MIME type. Only images are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          if (target === "expert") setProfilePhoto(reader.result);
          if (target === "fault") setFaultPhoto(reader.result);
          addSystemLog("Dosya Yükleme", `Destek dosyası yüklendi: ${file.name} (Boyut: ${(file.size / 1024).toFixed(1)} KB)`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter computations
  const filteredExperts = expertProfiles.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(profilesSearch.toLowerCase()) || 
                        p.expertise.toLowerCase().includes(profilesSearch.toLowerCase()) || 
                        p.brands.some(b => b.toLowerCase().includes(profilesSearch.toLowerCase()));
    const matchCity = profilesCity === "Hepsi" || p.city === profilesCity;
    return matchSearch && matchCity && p.status === "Aktif";
  });

  const filteredFaults = faultRequests.filter(fr => {
    const matchSearch = fr.title.toLowerCase().includes(faultsSearch.toLowerCase()) || 
                        fr.description.toLowerCase().includes(faultsSearch.toLowerCase()) || 
                        fr.carBrand.toLowerCase().includes(faultsSearch.toLowerCase()) || 
                        fr.lpgBrand.toLowerCase().includes(faultsSearch.toLowerCase());
    const matchCity = faultsCity === "Hepsi" || fr.city === faultsCity;
    return matchSearch && matchCity;
  });

  // Authorization check for faults tab: "Sadece Mühendis/Usta, Firma veya Admin görebilir."
  const isAuthorizedToSeeFaultsList = activeUser && (
    activeUser.role === "engineer" || 
    activeUser.role === "dealer" || 
    activeUser.role === "admin"
  );

  // Total items or stats for admin dashboard
  const totalAcceptedOffers = technicalSolutions.filter(s => s.userDecision === "Kabul Et").length;
  const totalCompletedFaults = faultRequests.filter(f => f.status === "Tamamlandı" || f.status === "Kapatıldı").length;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 p-3 sm:p-6" id="support-center-app-root">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HERO SECTION */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-teal-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>

          <div className="relative space-y-3 max-w-2xl">
            <span className="bg-teal-500/20 text-teal-300 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border border-teal-500/30 inline-flex items-center gap-1.5">
              <Wrench className="h-4 w-4 animate-spin-slow" /> {tLocal("TEKNİK İLETİŞİM & ARIZA KOORDİNASYONU", "TECHNICAL COMMUNICATION & FAULT COORDINATION")}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {tLocal("LPG Destek & Çözüm Merkezi", "LPG Support & Solutions Center")}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-semibold">
              {tLocal("Sektör profesyonelleri ile araç sahiplerini buluşturan güvenli arıza platformu. Tüm telefon ve e-posta bilgileri gizli tutulur, çözümler dijital portal üzerinden tekliflendirilir.", "A secure troubleshooting platform connecting industry professionals with vehicle owners. All phone and email details are kept confidential; solutions are quoted digitally through the portal.")}
            </p>
          </div>

          {/* SUBTAB BAR */}
          <div className="flex flex-wrap gap-2 pt-8 border-t border-slate-100/10 mt-6" id="support-center-nav-tabs">
            <button
              onClick={() => { setActiveSubTab("profiles"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === "profiles" 
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/20" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              👨‍🔧 {tLocal("LPG Uzman & Usta Rehberi", "LPG Expert & Master Directory")}
            </button>

            <button
              onClick={() => { setActiveSubTab("faults"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === "faults" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
              }`}
            >
              🚗 {tLocal("LPG Arıza & Destek Havuzu", "LPG Fault & Support Pool")}
            </button>

            <button
              onClick={() => { setActiveSubTab("my_activities"); setSuccessMsg(""); setErrorMsg(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeSubTab === "my_activities" 
                  ? "bg-amber-600 text-white shadow-md" 
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-800"
              }`}
            >
              📂 {tLocal("Taleplerim & Dosyalarım", "My Requests & Files")}
            </button>

            {activeUser?.role === "admin" && (
              <button
                onClick={() => { setActiveSubTab("admin"); setSuccessMsg(""); setErrorMsg(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border border-teal-500/20 ${
                  activeSubTab === "admin" 
                    ? "bg-teal-900 text-teal-100 shadow-md" 
                    : "bg-teal-950 text-teal-400 hover:bg-teal-900"
                }`}
              >
                🔒 {tLocal("Yönetici Destek Paneli", "Executive Support Board")}
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK STATUS INDICATORS */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-start gap-3 animate-fade-in">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="font-extrabold block">{tLocal("Başarılı!", "Success!")}</strong>
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-800 flex items-start gap-3 animate-shake">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}


        {/* ========================================= */}
        {/* SUBTAB 1: LPG UZMAN & USTA PROFİLLERİ */}
        {/* ========================================= */}
        {activeSubTab === "profiles" && (
          <div className="space-y-6" id="profiles-view-section">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={tLocal("LPG Ustası, unvanı veya BRC, Prins gibi markalarda ara...", "Search LPG master, title, or brands like BRC, Prins...")}
                    value={profilesSearch}
                    onChange={(e) => setProfilesSearch(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-2 px-9 rounded-xl border border-slate-200 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                {/* City Filter */}
                <select
                  value={profilesCity}
                  onChange={(e) => setProfilesCity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-2 text-xs font-semibold rounded-xl focus:border-teal-500 text-slate-700 cursor-pointer"
                >
                  <option value="Hepsi">📍 {tLocal("Tüm İller", "All Cities")}</option>
                  <option value={tLocal("İstanbul", "Istanbul")}>{tLocal("İstanbul", "Istanbul")}</option>
                  <option value={tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}>{tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}</option>
                  <option value={tLocal("İzmir", "Izmir")}>{tLocal("İzmir", "Izmir")}</option>
                </select>
              </div>

              {/* Add Profile Trigger */}
              {(activeUser?.role === "engineer" || activeUser?.role === "dealer" || activeUser?.role === "admin") ? (
                <button
                  onClick={() => setShowProfileForm(!showProfileForm)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>{showProfileForm ? tLocal("Kapat", "Close") : tLocal("Usta Profili Ekle", "Add Expert Profile")}</span>
                </button>
              ) : (
                <div className="text-[10px] text-slate-400 bg-slate-100 p-2 rounded-xl border border-slate-200 max-w-xs leading-tight">
                  🔒 {tLocal("Sadece", "Only")} <strong>{tLocal("Mühendis / Usta", "Engineer / Master")}</strong> {tLocal("veya", "or")} <strong>{tLocal("Firma", "Dealer")}</strong> {tLocal("üyeleri uzman tanıtım profili ekleyebilir.", "members can add an expert profile.")}
                </div>
              )}
            </div>

            {/* EXPERT PROFILE EXPLANATORY NOTE */}
            {showProfileForm && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md max-w-2xl mx-auto space-y-4 animate-fade-in">
                <div className="border-b border-rose-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-600" /> {tLocal("Yeni Teknik Usta Tanıtım Profili", "New Technical Master Introduction Profile")}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {tLocal("Araç sahiplerinin size ulaşabileceği, deneyiminizi ve yetkili sertifikalarınızı paylaştığınız vitrininizdir.", "This is your showcase template where vehicle owners can discover you and reach out.")}
                  </p>
                </div>

                <form onSubmit={handleCreateProfile} className="space-y-4 text-xs font-medium text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Ad Soyad / Firma Yetkilisi *", "Full Name / Authorized Contact *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Hakan Usta", "e.g. Master Hakan")}
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Deneyim Süresi *", "Experience Duration *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: 15 Yıl / 20 Yıl", "e.g. 15 Years / 20 Years")}
                        value={profileExperience}
                        onChange={(e) => setProfileExperience(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Uzmanlık Alanı / Unvan *", "Expertise / Title *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Atiker LPG Ayarı & Kalibrasyon", "e.g. Atiker LPG Tuning & Calibration")}
                        value={profileExpertise}
                        onChange={(e) => setProfileExpertise(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Bulunduğu Şehir *", "City *")}</label>
                      <select
                        value={profileCitySelected}
                        onChange={(e) => setProfileCitySelected(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs cursor-pointer text-slate-800"
                      >
                        <option value={tLocal("İstanbul", "Istanbul")}>{tLocal("İstanbul", "Istanbul")}</option>
                        <option value={tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}>{tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}</option>
                        <option value={tLocal("İzmir", "Izmir")}>{tLocal("İzmir", "Izmir")}</option>
                        <option value="Bursa">Bursa</option>
                        <option value="Kocaeli">Kocaeli</option>
                        <option value="Adana">Adana</option>
                        <option value="Antalya">Antalya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Çalıştığı/Anlaştığı LPG Markaları (Virgülle Ayırın) *", "Associated LPG Brands (Comma Separated) *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: BRC, Atiker, Prins, Lovato", "e.g. BRC, Atiker, Prins, Lovato")}
                        value={profileBrands}
                        onChange={(e) => setProfileBrands(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold">{tLocal("Sahip Olduğunuz Sertifikalar (Virgülle Ayırın)", "Your Certificates (Comma Separated)")}</label>
                      <input
                        type="text"
                        placeholder={tLocal("Örn: TSE LPG Projelendirme, MMO Yetki Belgesi", "e.g. TSE LPG Projecting, MMO Authorization Cert")}
                        value={profileCertificates}
                        onChange={(e) => setProfileCertificates(e.target.value)}
                        className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold">{tLocal("Usta Hakkında Tanıtım Açıklaması", "Bio & Introduction Description")}</label>
                    <textarea
                      rows={3}
                      placeholder={tLocal("Ustalık geçmişiniz, sunmuş olduğunuz özel test cihazları ve garanti imkanlarını açıklayınız...", "Explain your craftsmanship background, special testing systems, and guarantees...")}
                      value={profileAbout}
                      onChange={(e) => setProfileAbout(e.target.value)}
                      className="w-full bg-slate-50 p-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <label className="block font-bold mb-1">{tLocal("Profil Fotoğrafı Yükle", "Upload Profile Photo")}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageReader(e, "expert")}
                        className="text-[11px] block text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-end gap-3 items-center">
                      <span className="text-[10px] text-slate-500">{tLocal("Hazır Profil Fotoğrafı:", "Preset Profile Photo:")}</span>
                      <img 
                        src={profilePhoto} 
                        alt={tLocal("Önizleme", "Preview")} 
                        className="h-12 w-12 rounded-full object-cover border-2 border-teal-500/30" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowProfileForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                    >
                      {tLocal("İptal", "Cancel")}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      {tLocal("Profili Kaydet ve Yayınla", "Save & Publish Profile")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* EXPERT PROFILES LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperts.length === 0 ? (
                <div className="col-span-1 md:col-span-3 bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                  <User className="h-12 w-12 text-slate-350 mx-auto mb-2" />
                  {tLocal("Aradığınız kriterlere uygun aktif usta bulunamadı. Filtreleri temizlemeyi deneyin.", "No active master matching your criteria was found. Try clearing filters.")}
                </div>
              ) : (
                filteredExperts.map((expert) => (
                  <div 
                    key={expert.id} 
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Person header */}
                      <div className="flex gap-3 items-start">
                        <img 
                          src={expert.photo} 
                          alt={expert.name} 
                          className="h-14 w-14 rounded-full object-cover border-2 border-teal-500/20 shadow-xs shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {tLocal("LPG UZMANI", "LPG EXPERT")}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{expert.name}</h4>
                          <span className="text-slate-500 text-xs font-semibold block leading-tight">{translateEntity(expert, "expertise")}</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {translateEntity(expert, "about") || tLocal("Kullanıcı tarafından tanıtım açıklaması eklenmemiştir.", "No introduction description provided.")}
                      </p>

                      {/* Specs block */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-[11px] font-sans">
                        <div>
                          <span className="text-slate-400 block font-bold">{tLocal("TECRÜBE", "EXPERIENCE")}</span>
                          <span className="font-extrabold text-slate-700">{translateEntity(expert, "experience")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">{tLocal("HİZMET YERİ", "LOCATION")}</span>
                          <span className="font-extrabold text-teal-700 flex items-center gap-0.5">
                            📍 {expert.city}
                          </span>
                        </div>
                      </div>

                      {/* Brands tag lists */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">{tLocal("ÇALIŞTIĞI MARKALAR", "AUTHORIZED BRANDS")}</span>
                        <div className="flex flex-wrap gap-1">
                          {expert.brands.map((brand, bIdx) => (
                            <span 
                              key={bIdx} 
                              className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md"
                            >
                              {brand}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Certificates if any */}
                      {expert.certificates.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-slate-400 block font-bold">{tLocal("BELGELER & LİSANSLAR", "CERTIFICATES & LICENSES")}</span>
                          <div className="space-y-1">
                            {expert.certificates.slice(0, 2).map((cert, cIdx) => (
                              <span 
                                key={cIdx} 
                                className="text-[10px] text-slate-600 flex items-center gap-1 font-semibold"
                              >
                                <Award className="h-3 w-3 text-emerald-600 shrink-0" />
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Section with Contact Privacy shield */}
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold" title={tLocal("Telefon ve E-posta gizliliği korunmaktadır.", "Phone and email privacy is protected.")}>
                        <PhoneOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{tLocal("İletişim Gizli", "Private Contact")} 🔒</span>
                      </div>

                      <button
                        onClick={() => setSelectedExpert(expert)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{tLocal("İletişime Geç", "Contact Master")}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* CONTACT MODAL */}
            {selectedExpert && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 relative shadow-2xl space-y-4">
                  <button
                    onClick={() => setSelectedExpert(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[10px] bg-teal-50 border border-teal-200 text-teal-800 px-2.5 py-1 rounded font-extrabold uppercase tracking-wide">
                      {tLocal("GÜVENLİ İLETİŞİM FORMU", "SECURE CONTACT FORM")}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 pt-1">
                      {selectedExpert.name} {tLocal("ile İletişime Geçin", "Contact")}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {tLocal("Sohbet talebiniz ve araç detaylarınız uzmana anında SMS, E-posta ve portal bildirimi olarak ulaştırılır. Kişisel cep numaranız gizli tutulmaktadır.", "Your contact message and vehicle details will be routed directly to the master via SMS, Email, and portal alerts. Your personal phone number stays hidden.")}
                    </p>
                  </div>

                  <form onSubmit={handleSendContactRequest} className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Konu *", "Subject *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Rölantide Titreme ve Lpg Ayarı Hakkında", "e.g., Engine Shake during Idle or LPG Calibration assistance")}
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-600">{tLocal("Araç Bilgisi (Yıl-Marka-Model) *", "Vehicle Details (Year-Make-Model) *")}</label>
                        <input
                          type="text"
                          required
                          placeholder={tLocal("Örn: 2015 Opel Astra", "e.g. 2015 Opel Astra")}
                          value={contactVehicleInfo}
                          onChange={(e) => setContactVehicleInfo(e.target.value)}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-600">{tLocal("Bulunduğunuz Şehir *", "Your City *")}</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: İstanbul"
                          value={contactCity}
                          onChange={(e) => setContactCity(e.target.value)}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Detaylı Mesajınız *", "Detailed Message *")}</label>
                      <textarea
                        required
                        rows={4}
                        placeholder={tLocal("Ustam merhaba, aracımda yaşadığım problem şu şekildedir...", "Hello master, the problem with my car is...")}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-xs text-slate-800 leading-normal"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer shadow-sm transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>{tLocal("Güvenli Talebi Gönder", "Send Secure Message Request")}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* SUBTAB 2: LPG ARIZA & DESTEK TALEPLERİ */}
        {/* ========================================= */}
        {activeSubTab === "faults" && (
          <div className="space-y-6" id="faults-view-section">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={tLocal("Arızalı araç, lpg markası veya uyumsuzluklarda ara...", "Search by vehicle, lpg brand or fault details...")}
                    value={faultsSearch}
                    onChange={(e) => setFaultsSearch(e.target.value)}
                    className="w-full bg-slate-50 text-xs py-2 px-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                {/* City Filter */}
                <select
                  value={faultsCity}
                  onChange={(e) => setFaultsCity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 p-2 text-xs font-semibold rounded-xl focus:border-indigo-500 text-slate-700 cursor-pointer"
                >
                  <option value="Hepsi">📍 {tLocal("Tüm İller", "All Cities")}</option>
                  <option value={tLocal("İstanbul", "Istanbul")}>{tLocal("İstanbul", "Istanbul")}</option>
                  <option value={tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}>{tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}</option>
                  <option value={tLocal("İzmir", "Izmir")}>{tLocal("İzmir", "Izmir")}</option>
                </select>
              </div>

              {/* Submit Fault Trigger */}
              <button
                onClick={() => setShowFaultForm(!showFaultForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <PlusCircle className="h-5 w-5" />
                <span>{showFaultForm ? tLocal("Havuzu İncele (Kapat)", "Browse Pool (Close)") : tLocal("Arıza Destek Talebi Aç", "Open Fault Support Request")}</span>
              </button>
            </div>

            {/* FAULT FORM (OPEN TO ALL) */}
            {showFaultForm && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md max-w-3xl mx-auto space-y-6 animate-fade-in">
                <div className="border-b border-rose-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <Plus className="h-5 w-5 text-indigo-600" /> {tLocal("Yeni Arıza & Destek Talebi Oluştur", "Create New Fault & Support Request")}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {tLocal("Yaşadığınız motor sarsıntısı, yakıt fazlalığı, sabaha geç çalışma gibi arızalar için teknik talep açın.", "Open a technical ticket for issues like engine shaking, high fuel consumption, or hard cold morning starts.")}
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowFaultForm(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    {tLocal("Kapat", "Close")}
                  </button>
                </div>

                <form onSubmit={handleCreateFault} className="space-y-4 text-xs font-semibold text-slate-700">
                  {/* Guest block if unauthorized / not signed in */}
                  {!activeUser && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <span className="text-amber-800 font-bold block text-[11px] uppercase">
                        ⚠️ {tLocal("ZİYARETÇİ OLARAK ARIZA YAYINLIYORSUNUZ", "POSTING SUPPORT TICKET AS GUEST")}
                      </span>
                      <p className="text-[11px] text-slate-600 leading-normal font-medium">
                        {tLocal("Sisteme üyeliğiniz olmadığı için, ustaların size çözümleri ulaştırabilmesi ve SMS/E-Posta bildirimleri için aşağıdaki formu doldurunuz. Cep numaranız şifrelidir, asla üçüncü şahıslara gösterilmez.", "Since you are not registered, fill the following fields so masters can reach you with solutions and SMS/Email alerts. Your phone number is encrypted and kept private.")}
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="block text-slate-500">{tLocal("Ad Soyadınız *", "Your Full Name *")}</label>
                          <input
                            type="text"
                            required
                            placeholder={tLocal("Örn: Salih Can", "e.g. John Doe")}
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-250 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500">{tLocal("Telefon Numaranız *", "Your Phone Number *")}</label>
                          <input
                            type="tel"
                            required
                            placeholder={tLocal("Örn: 05553332211", "e.g. 05553332211")}
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-250 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-slate-500">{tLocal("E-Posta Adresiniz *", "Your Email Address *")}</label>
                          <input
                            type="email"
                            required
                            placeholder="salih@gmail.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full bg-white p-2 border border-slate-250 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Araç Markası *", "Vehicle Make *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Ford", "e.g. Ford")}
                        value={faultCarBrand}
                        onChange={(e) => setFaultCarBrand(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Araç Modeli *", "Vehicle Model *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Focus 1.6", "e.g. Focus 1.6")}
                        value={faultCarModel}
                        onChange={(e) => setFaultCarModel(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Model Yılı", "Model Year")}</label>
                      <input
                        type="number"
                        placeholder={tLocal("Örn: 2013", "e.g. 2013")}
                        value={faultCarYear}
                        onChange={(e) => setFaultCarYear(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("LPG Beyin/Kit Markası", "LPG ECU/Kit Brand")}</label>
                      <input
                        type="text"
                        placeholder={tLocal("Örn: BRC Comfort", "e.g. BRC Comfort")}
                        value={faultLpgBrand}
                        onChange={(e) => setFaultLpgBrand(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Yaşadığınız Şehir *", "Your City *")}</label>
                      <select
                        value={faultCitySelected}
                        onChange={(e) => setFaultCitySelected(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 cursor-pointer"
                      >
                        <option value={tLocal("İstanbul", "Istanbul")}>{tLocal("İstanbul", "Istanbul")}</option>
                        <option value={tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}>{tLocal(tLocal("Ankara", "Ankara"), tLocal("Ankara", "Ankara"))}</option>
                        <option value={tLocal("İzmir", "Izmir")}>{tLocal("İzmir", "Izmir")}</option>
                        <option value="Bursa">Bursa</option>
                        <option value="Kocaeli">Kocaeli</option>
                        <option value="Adana">Adana</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Bulunduğunuz İlçe *", "Your District *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Bornova", "e.g. Bornova")}
                        value={faultDistrict}
                        onChange={(e) => setFaultDistrict(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Video Linki (Opsiyonel)", "Video Link (Optional)")}</label>
                      <input
                        type="url"
                        placeholder={tLocal("Örn: youtube.com/watch?v=...", "e.g. youtube.com/watch?v=...")}
                        value={faultVideo}
                        onChange={(e) => setFaultVideo(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">{tLocal("Arızayı Özetleyen Başlık *", "Fault Summary Title *")}</label>
                    <input
                      type="text"
                      required
                      placeholder={tLocal("Örn: Viteste Titreme, Stop Etme ve Yüksek Gaz Sarfiyatı", "e.g., Shaking in Gear, Engine Stall and High Fuel Consumption")}
                      value={faultTitle}
                      onChange={(e) => setFaultTitle(e.target.value)}
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs text-slate-850 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-600">{tLocal("Hatalı Çalışma & Arıza Açıklaması *", "Incorrect Operation & Fault Description *")}</label>
                    <textarea
                      required
                      rows={4}
                      placeholder={tLocal("Ustalara yol göstermesi için: Benzinde sorun var mı? Hangi viteste yapıyor? Arızayı gidermek için daha önce neler değişti?", "To guide mechanics: Is there an issue on gasoline? In which gear does it occur? What parts were replaced recently?")}
                      value={faultDescription}
                      onChange={(e) => setFaultDescription(e.target.value)}
                      className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs leading-normal font-medium text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="col-span-2">
                      <label className="block font-bold mb-1">{tLocal("Arıza Fotoğrafı veya Parça Resmi Ekle", "Add Fault Photo or Part Picture")}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageReader(e, "fault")}
                        className="text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-end">
                      <img 
                        src={faultPhoto} 
                        alt={tLocal("Arıza önizleme", "Trouble preview")} 
                        className="h-16 w-24 object-cover rounded-lg border border-indigo-200" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowFaultForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl cursor-pointer"
                    >
                      {tLocal("İptal", "Cancel")}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                    >
                      {tLocal("Arıza Talebini Havuza Gönder", "Send Fault Request to Pool")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* AUTHORIZATION RESTRICTION WALL (BÖLÜM 2 CRITICAL CLAUSE) */}
            {/* "ARIZA TALEPLERİNİ GÖREBİLECEKLER Sadece: LPG Mühendisi / Usta, Firma (Bayi / Usta), Admin" */}
            {!isAuthorizedToSeeFaultsList ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
                <div className="h-14 w-14 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <Sliders className="h-7 w-7" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800 uppercase tracking-tight">{tLocal("Onaylı Usta / Firma Havuzu Girişi 🔒", "Verified Master / Dealer Pool Access 🔒")}</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  {tLocal("Gizlilik ve Meslek Etiği sözleşmesi gereği, diğer araç sahiplerinin açtığı arıza detaylarını, teknik ayrıntıları ve videoları yalnızca sistemde doğrulanmış LPG Mühendisleri, Sertifikalı Ustalar ve Leke Bayileri (Firmalar) görüntüleyebilir.", "Due to Privacy and Professional Ethics policies, detailed fault summaries, technical analyses, and diagnostics videos are restricted to authenticated LPG Engineers, Certified Masters, and Dealerships.")}
                </p>
                
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab("giris");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    {tLocal("Usta Olarak Giriş Yap / Üye Ol", "Login as Mechanic / Sign Up")}
                  </button>
                  <div className="text-slate-400 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl text-[11px] flex items-center justify-center">
                    {tLocal("Giriş Rolünüzü en üst menüden değiştirebilirsiniz.", "You can toggle your active user role from the top navbar simulator.")}
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-6">
                  <p className="text-[11px] text-slate-400 font-medium">
                    {tLocal("Kendi oluşturduğunuz destek ve arıza talebinize gelen teknik çözümleri takip etmek için aşağıdaki Taleplerim & Dosyalarım sekmesine tıklayabilirsiniz.", "To view replies and solutions sent to your own support requests, click the 'My Requests & Files' tab below.")}
                  </p>
                  <button
                    onClick={() => setActiveSubTab("my_activities")}
                    className="text-indigo-600 hover:underline text-xs font-bold pt-2 cursor-pointer"
                  >
                    {tLocal("Kendi Taleplerimi İncele &raquo;", "Review My Own Requests &raquo;")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <span>{tLocal("Yetkilendirilmiş Usta/Firma Erişim Alanı: Havuzdaki tüm aktif arızaları görebilir ve çözüm teklif edebilirsiniz.", "Authorized Master/Dealer Area: You can see all active entries in the pool and propose technical solutions.")}</span>
                </div>

                {/* ARCHIVE FAULTS LIST */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {filteredFaults.length === 0 ? (
                    <div className="col-span-1 md:col-span-3 bg-white p-12 text-center rounded-2xl text-slate-400">
                      {tLocal("Süzgeçlerinizle eşleşen aktif arıza talebi bulunamadı.", "No active fault requests match your filter selection.")}
                    </div>
                  ) : (
                    filteredFaults.map((fr) => {
                      const associatedSols = technicalSolutions.filter(s => s.requestId === fr.id);
                      
                      return (
                        <div key={fr.id} className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between">
                          <div className="p-4 space-y-4">
                            {/* Car info heading */}
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                  {fr.carBrand} {fr.carModel} ({fr.carYear})
                                </span>
                                <h4 className="font-extrabold text-sm text-slate-800 line-clamp-2 pt-1.5" title={fr.title}>
                                  {translateEntity(fr, "title")}
                                </h4>
                              </div>
                              <span className={`text-[9px] p-1 px-2 shrink-0 font-bold rounded-full ${
                                fr.status === "Yeni Talep" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                fr.status === "İnceleniyor" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                fr.status === "Çözüm Gönderildi" ? "bg-purple-50 text-purple-700 border border-purple-200 text-shadow-xs" :
                                fr.status === "Kullanıcı Onayladı" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {tLocal(fr.status, fr.status === "Yeni Talep" ? "New Ticket" : fr.status === "İnceleniyor" ? "Under Review" : fr.status === "Çözüm Gönderildi" ? "Solution Sent" : fr.status === "Kullanıcı Onayladı" ? "User Approved" : fr.status)}
                              </span>
                            </div>

                            {/* Image body */}
                            <div className="h-32 bg-slate-100 rounded-xl overflow-hidden relative">
                              <img 
                                src={fr.photo} 
                                alt={fr.title} 
                                className="h-full w-full object-cover" 
                                referrerPolicy="no-referrer"
                              />
                              {fr.video && (
                                <span className="absolute bottom-2 right-2 bg-red-600/90 text-white p-1 rounded text-[9px] font-bold flex items-center gap-0.5">
                                  <Video className="h-2.5 w-2.5" /> {tLocal("EKLİ VİDEO VAR", "VIDEO ATTACHED")}
                                </span>
                              )}
                              <span className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-[9px] font-mono font-medium">
                                📍 {fr.city} / {fr.district}
                              </span>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                              {translateEntity(fr, "description")}
                            </p>

                            {/* System Status logs */}
                            <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] space-y-1 font-semibold text-slate-500 border border-slate-100">
                              <div className="flex justify-between items-center">
                                <span>{tLocal("LPG Kit Markası:", "LPG Kit Brand:")}</span>
                                <strong className="text-slate-700">{fr.lpgBrand}</strong>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>{tLocal("Talep Sahibi:", "Request Owner:")}</span>
                                <strong className="text-slate-700">{fr.creatorName}</strong>
                              </div>
                              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-slate-400">
                                <span>{tLocal("Sistem Kaydı:", "System Entry:")}</span>
                                <span>{new Date(fr.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Technical Solution list or triggers */}
                          <div className="bg-slate-50 p-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400">
                              {associatedSols.length} {tLocal("Çözüm Önerisi Var", "Diagnostic Solution(s)")}
                            </span>

                            <button
                              onClick={() => setSelectedFault(fr)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center gap-1 justify-center shadow-xs"
                            >
                              <Wrench className="h-3 w-3" />
                              <span>{tLocal("Teknik Çözüm Gönder", "Send Diagnostic Solution")}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* SEND TECHNICAL SOLUTION FORM MODAL */}
            {selectedFault && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 relative shadow-2xl space-y-4">
                  <button
                    onClick={() => setSelectedFault(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded font-extrabold uppercase tracking-wide">
                      {tLocal("KAPALI ÇÖZÜM & FİYAT TEKLİFİ VERME FORMU", "PRIVATE SOLUTION & COST PROPOSAL FORM")}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 pt-1">
                      {translateEntity(selectedFault, "title")}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {tLocal("Sunduğunuz teknik yol haritası ve tahmini bütçe, araç sahibine doğrudan ulaştırılacaktır. İletişim bilgileriniz gizli kalarak işleminiz tescillenecektir.", "Your technical roadmap and predicted budget will be directly delivered to the car owner. Your contact details remain confidential and encrypted.")}
                    </p>
                  </div>

                  <form onSubmit={handleSendTechnicalSolution} className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Teknik Çözüm Başlığı / Kısa Teşhis *", "Technical Solution Title / Quick Diagnose *")}</label>
                      <input
                        type="text"
                        required
                        placeholder={tLocal("Örn: Regülatör Basınç Diyafram Değişimi & Sıcaklık Sensör Kalibrasyonu", "e.g., Regulator Pressure Diaphragm Replacement & Temp Sensor Calibration")}
                        value={solutionSubject}
                        onChange={(e) => setSolutionSubject(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-600">{tLocal("Detaylı Çözüm Adımları & Ustanın Tavsiyesi *", "Detailed Solution Steps & Expert Advice *")}</label>
                      <textarea
                        required
                        rows={4}
                        placeholder={tLocal("Bu arıza genellikle Isı Müşürünün yanlış okunması veya regülatör iğnesinin aşınmasından kaynaklanır. Servisimize geldiğinizde...", "This issue usually results from misreading the heating sensor or regulator needle wear. When you visit our shop...")}
                        value={solutionInfo}
                        onChange={(e) => setSolutionInfo(e.target.value)}
                        className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs leading-normal font-medium text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-slate-600">{tLocal("Tahmini Maliyet (İşçilik + Parça) (TL) *", "Estimated Cost (Labor + Parts) (TL) *")}</label>
                        <input
                          type="number"
                          required
                          min={1}
                          placeholder={tLocal("Örn: 1500", "e.g. 1500")}
                          value={solutionCost}
                          onChange={(e) => setSolutionCost(e.target.value)}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-600">{tLocal("Tahmini Onarım Süresi *", "Estimated Fixing Duration *")}</label>
                        <input
                          type="text"
                          required
                          placeholder={tLocal("Örn: 2 Saat / Yarım Gün", "e.g., 2 Hours / Half Day")}
                          value={solutionDuration}
                          onChange={(e) => setSolutionDuration(e.target.value)}
                          className="w-full bg-slate-50 p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wide cursor-pointer shadow-sm transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>{tLocal("Çözüm Önerisini ve Teklifi Gönder", "Send Solution Proposal & Quote")}</span>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* SUBTAB 3: TALEPLERİM & DOSYALARIM sekmesi */}
        {/* ========================================= */}
        {activeSubTab === "my_activities" && (
          <div className="space-y-6" id="my_activities-view-section">
            
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-black text-slate-850">{tLocal("Destek Paneli Özeti: Gelen Yanıtlar ve Gizli Talepler", "Support Panel Overview: Answers & Private Inquiries")}</h2>
              <p className="text-xs text-slate-500 mt-1">
                {tLocal("Kendi göndermiş olduğunuz tüm arıza destek taleplerini, usta iletişim mesajlarını ve bunlara verilen gizli çözümleri bu alandan takip edebilirsiniz.", "Follow all the fault support inquiries you posted, master response messages, and secure diagnostic keys from this console.")}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: My Fault Requests & Proposals (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* section: my fault requests list */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider">{tLocal("Açtığım Arıza & Destek Talepleri", "Inquiries Opened By Me")}</h3>
                  
                  {faultRequests.filter(fr => activeUser ? fr.creatorId === activeUser.id : fr.creatorId.startsWith("guest_")).length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-slate-400 font-medium text-xs text-center">
                       {tLocal("Kayıtlı arıza talebiniz bulunamadı. Yeni bir talep açmak için 'LPG Arıza & Destek Havuzu' sekmesine göz atın.", "No support tickets found registered under your user. Tap LPG Fault & Support Pool to create one.")}
                    </div>
                  ) : (
                    faultRequests.filter(fr => activeUser ? fr.creatorId === activeUser.id : fr.creatorId.startsWith("guest_")).map((fr) => {
                      const associatedSols = technicalSolutions.filter(s => s.requestId === fr.id);
                      
                      return (
                        <div key={fr.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded uppercase">
                                ARTIK {fr.carBrand} {fr.carModel} ({fr.carYear})
                              </span>
                              <h4 className="font-bold text-sm text-slate-800 pt-1">{translateEntity(fr, "title")}</h4>
                            </div>
                            <span className="font-mono text-[10px] text-slate-400">
                              {tLocal("Kayıt:", "Registered:")} {new Date(fr.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US")}
                            </span>
                          </div>

                          <div className="flex gap-4 text-xs">
                            <img 
                              src={fr.photo} 
                              alt={fr.title} 
                              className="h-20 w-32 object-cover rounded-lg border border-slate-100 shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="space-y-1 flex-1">
                              <p className="text-slate-600 line-clamp-3 leading-normal">{translateEntity(fr, "description")}</p>
                              <div className="pt-1 flex gap-2">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                                  Kit: {fr.lpgBrand}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  fr.status === "Yeni Talep" ? "bg-blue-50 text-blue-700 font-extrabold" :
                                  fr.status === "İnceleniyor" ? "bg-amber-50 text-amber-700" :
                                  fr.status === "Çözüm Gönderildi" ? "bg-violet-50 text-violet-700" :
                                  fr.status === "Kullanıcı Onayladı" ? "bg-emerald-50 text-emerald-700" :
                                  "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {tLocal("Durum:", "Status:")} {tLocal(fr.status, fr.status === "Yeni Talep" ? "New Ticket" : fr.status === "İnceleniyor" ? "Under Review" : fr.status === "Çözüm Gönderildi" ? "Solution Sent" : fr.status === "Kullanıcı Onayladı" ? "User Approved" : fr.status)}
                                </span>

                                {fr.status !== "Tamamlandı" && fr.status !== "Kapatıldı" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = faultRequests.map(x => x.id === fr.id ? { ...x, status: "Tamamlandı" } as any : x);
                                      saveState("lpgportal_fault_requests", updated, setFaultRequests);
                                      triggerSimulationNotifications(fr.creatorName, `Tebrikler! Destek talebinizi 'Tamamlandı' (Çözüldü) olarak işaretlediniz.`);
                                    }}
                                    className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg cursor-pointer transition flex items-center gap-1 shrink-0"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    <span>{tLocal("Sorunum Çözüldü", "My Issue is Resolved")}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Technical offers received for THIS fault */}
                          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-150">
                            <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                              <Wrench className="h-4 w-4 text-emerald-600" />
                              <span>{tLocal("Gelen Çözüm Teklifleri (", "Diagnostic Offers Received (")}{associatedSols.length} {tLocal("Adet)", "Unit(s)")}</span>
                            </h5>
                            
                            {associatedSols.length === 0 ? (
                              <p className="text-[11px] text-slate-400">{tLocal("Ustalarımız talebinizi inceliyor. Kısa süre içinde çözümler listelenecektir.", "Our workshops are reviewing your inquiry. Diagnostic replies will appear shortly.")}</p>
                            ) : (
                              <div className="space-y-4">
                                {associatedSols.map((sol) => (
                                  <div key={sol.id} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded">
                                          {tLocal("Teklif Sahibi: ", "Service Provider: ")}{sol.resolverName}
                                        </span>
                                        <h6 className="font-bold text-xs text-slate-800 pt-1.5">{translateEntity(sol, "subject")}</h6>
                                      </div>
                                      
                                      <div className="text-right">
                                        <span className="font-extrabold text-sm text-slate-900 block">{sol.cost.toLocaleString(language === "tr" ? "tr-TR" : "en-US")} TL</span>
                                        <span className="text-[10px] text-slate-400 block font-mono">{tLocal("Tahmini Süre: ", "Est. Duration: ")}{translateEntity(sol, "duration")}</span>
                                      </div>
                                    </div>

                                    <p className="text-[11px] text-slate-600 leading-normal pl-2 border-l-2 border-slate-200">
                                      {translateEntity(sol, "solution")}
                                    </p>

                                    {/* USER INTERACTIVE ACTIONS FOR FAULT EVALUATION */}
                                    {/* (Kabul Et, Reddet, Sonra Karar Ver) */}
                                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2.5 border-t border-slate-100">
                                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-bold">
                                        <PhoneOff className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span>{tLocal("Güvenli İletişim 🔒", "Secure Communication 🔒")}</span>
                                      </div>

                                      <div className="flex flex-wrap gap-1.5 justify-end">
                                        {sol.userDecision === "Beklemede" ? (
                                          <>
                                            <button
                                              onClick={() => handleEvaluateSolution(sol.id, "Kabul Et")}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-0.5 cursor-pointer"
                                            >
                                              <ThumbsUp className="h-3 w-3" /> {tLocal("Kabul Et", "Accept")}
                                            </button>
                                            <button
                                              onClick={() => handleEvaluateSolution(sol.id, "Reddet")}
                                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold py-1 px-3 rounded-lg flex items-center gap-0.5 cursor-pointer border border-rose-200"
                                            >
                                              <ThumbsDown className="h-3 w-3" /> {tLocal("Reddet", "Reject")}
                                            </button>
                                            <button
                                              onClick={() => handleEvaluateSolution(sol.id, "Daha Sonra Karar Ver")}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer border border-slate-200"
                                            >
                                              {tLocal("Karar Ver", "Decide")}
                                            </button>
                                          </>
                                        ) : (
                                          <div className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                                            sol.userDecision === "Kabul Et" ? "bg-emerald-100 text-emerald-800" :
                                            sol.userDecision === "Reddet" ? "bg-rose-100 text-rose-800" :
                                            "bg-amber-100 text-amber-800"
                                          }`}>
                                            {tLocal("Kararınız: ", "Your Status: ")} <strong>{tLocal(sol.userDecision, sol.userDecision === "Kabul Et" ? "Approved" : sol.userDecision === "Reddet" ? "Rejected" : "Decide Later")}</strong>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Simulated notification box and active panel (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* section: my direct messages */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-xs uppercase text-slate-700 tracking-wider flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-teal-600" />
                    <span>{tLocal("Ustalara Gönderdiğim Mesajlar", "Messages Sent to Experts")}</span>
                  </h3>

                  {contactRequests.length === 0 ? (
                    <p className="text-[11px] text-slate-400">{tLocal("Gönderilmiş doğrudan mesaj bulunamadı.", "No outgoing messages found.")}</p>
                  ) : (
                    <div className="space-y-3">
                      {contactRequests.map((req) => (
                        <div key={req.id} className="bg-slate-50 border border-slate-150 p-3 rounded-xl space-y-2 text-xs font-semibold">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>{tLocal("Sohbet Talebi", "Inquiry Chat Request")}</span>
                            <span>{new Date(req.createdAt).toLocaleDateString(language === "tr" ? "tr-TR" : "en-US")}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{tLocal("Kime:", "To:")}</span>
                            <strong className="text-slate-800">{req.expertName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{tLocal("Konu: ", "Subject: ")}{translateEntity(req, "subject")}</span>
                            <p className="text-slate-600 font-normal leading-normal text-[11px] pt-1">
                              {translateEntity(req, "message")}
                            </p>
                          </div>
                          <div className="bg-emerald-50 text-[9px] text-emerald-800 p-1.5 rounded-md flex items-center gap-1 font-mono">
                            <Check className="h-3 w-3 text-emerald-600" />
                            {tLocal("SMS ve Mail ile İletildi", "Delivered via SMS & Email")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* section: sms and email simulations */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-sm space-y-3 font-mono">
                  <div className="flex justify-between items-center text-[11px] text-teal-400 border-b border-slate-800 pb-2">
                    <span className="font-sans uppercase font-bold tracking-wider">📞 {tLocal("GSM & E-POSTA SİMÜLATÖRÜ", "GSM & EMAIL SIMULATOR")}</span>
                    <span className="bg-teal-500/20 px-1.5 py-0.5 rounded text-[10px]">{tLocal("AKTİF", "ACTIVE")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal">
                    {tLocal("LPGPORTAL gizli iletişim altyapısı, tarafların cep telefon numaralarını gizleyerek, arka planda anlık SMS ve E-posta yönlendirmesi yapar. Bu loglarda simüle edilen gönderimlerini gerçek zamanlı izleyebilirsiniz:", "LPG PORTAL privacy-protection router hides phone numbers of both parties and executes background SMS/Email relays. Live simulation logs can be analyzed below:")}
                  </p>

                  <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin">
                    {notificationLogs.map((log) => (
                      <div key={log.id} className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>{log.type} &raquo; ALICI: {log.recipientName}</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300 font-sans leading-relaxed break-words">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {activeSubTab === "admin" && activeUser?.role === "admin" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-8 animate-fade-in" id="admin-panel-section">
            <div className="border-b border-indigo-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <Sliders className="h-6 w-6 text-teal-600" /> {tLocal("Destek Merkezi Yönetim Konsolu (Admin)", "Support Center Management Console (Admin)")}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {tLocal("Portal içerisindeki usta profillerini, arızaları ve teklif kalibrasyonlarını denetleyin, sızdırmazlık onaylarını sürdürün.", "Moderate technician profiles, faults, and calibration quotes within the portal, maintain compliance tests.")}
                </p>
              </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tLocal("Uzman Profilleri", "Expert Profiles")}</span>
                <span className="text-2xl font-black text-slate-800 block pt-1">{expertProfiles.length}</span>
                <span className="text-[9px] text-emerald-600 block pt-0.5 font-bold">100% {tLocal("Aktif", "Active")}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tLocal("Arıza Talepleri", "Fault Requests")}</span>
                <span className="text-2xl font-black text-slate-800 block pt-1">{faultRequests.length}</span>
                <span className="text-[9px] text-rose-600 block pt-0.5 font-bold">{faultRequests.filter(f => f.status === "Yeni Talep").length} {tLocal("Beklemede", "Pending")}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tLocal("Çözüm Teklifleri", "Solution Offers")}</span>
                <span className="text-2xl font-black text-slate-800 block pt-1">{technicalSolutions.length}</span>
                <span className="text-[9px] text-emerald-600 block pt-0.5 font-bold">{tLocal("Kapalı Sistem", "Closed System")}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tLocal("Kabul Edilen", "Accepted Requests")}</span>
                <span className="text-2xl font-black text-emerald-700 block pt-1">{totalAcceptedOffers}</span>
                <span className="text-[9px] text-slate-400 block pt-0.5 font-sans">{tLocal("Müşteri onayladı", "Approved by customer")}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{tLocal("Tamamlanan", "Completed Requests")}</span>
                <span className="text-2xl font-black text-indigo-700 block pt-1">{totalCompletedFaults}</span>
                <span className="text-[9px] text-indigo-600 block pt-0.5 font-bold">{tLocal("Kapatıldı", "Closed")}</span>
              </div>
            </div>

            {/* TABULAR LOG DATA ACCORDING TO REQ */}
            <div className="space-y-6">
              
              {/* Box 1: Uzman Profilleri */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3.5 px-5 font-bold text-xs flex justify-between items-center">
                  <span>{tLocal("Ustalar, Firmalar & Teknik Uzman Profilleri", "Technicians, Companies & Expert Profiles")}</span>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">{expertProfiles.length} {tLocal("Kayıt", "Records")}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 font-medium">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">{tLocal("Ad Soyad", "Full Name")}</th>
                        <th className="p-3">{tLocal("Uzmanlık Alanı", "Field of Expertise")}</th>
                        <th className="p-3">{tLocal("Şehir", "City")}</th>
                        <th className="p-3">{tLocal("Tecrübe", "Experience")}</th>
                        <th className="p-3">{tLocal("Üye ID", "Member ID")}</th>
                        <th className="p-3">{tLocal("Durum", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expertProfiles.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="p-3 pl-5 font-bold text-slate-800">{p.name}</td>
                          <td className="p-3 text-slate-600">{p.expertise}</td>
                          <td className="p-3 font-semibold">{p.city}</td>
                          <td className="p-3 font-mono">{p.experience}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-400">{p.seller_id}</td>
                          <td className="p-3">
                            <span className="bg-emerald-100 text-emerald-800 p-1 px-2 rounded-full text-[9px] font-bold">{tLocal("Aktif", "Active")}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 2: Arıza Talepleri */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3.5 px-5 font-bold text-xs flex justify-between items-center">
                  <span>{tLocal("Arıza ve Destek Talepleri Portföyü", "Fault and Support Requests Portfolio")}</span>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">{faultRequests.length} {tLocal("Talep", "Requests")}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 font-medium">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">{tLocal("Araç Bilgisi", "Vehicle Info")}</th>
                        <th className="p-3">{tLocal("Arıza Başlığı", "Fault Title")}</th>
                        <th className="p-3">{tLocal("LPG Markası", "LPG Brand")}</th>
                        <th className="p-3">{tLocal("Konum", "Location")}</th>
                        <th className="p-3">{tLocal("Tlf/E-Posta (Yalnızca Admin Görebilir)", "Phone/Email (Admin Only)")}</th>
                        <th className="p-3">{tLocal("Statü", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faultRequests.map(fr => (
                        <tr key={fr.id} className="hover:bg-slate-50/70">
                          <td className="p-3 pl-5 font-bold text-slate-800">{fr.carBrand} {fr.carModel} ({fr.carYear})</td>
                          <td className="p-3 text-slate-600 truncate max-w-xs" title={fr.title}>{fr.title}</td>
                          <td className="p-3 font-semibold text-indigo-700">{fr.lpgBrand}</td>
                          <td className="p-3 text-slate-500">{fr.city} / {fr.district}</td>
                          <td className="p-3 text-rose-700 font-mono text-[10px]">{fr.creatorPhone} <br/> {fr.creatorEmail}</td>
                          <td className="p-3">
                            <select
                              value={fr.status}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                const updated = faultRequests.map(x => x.id === fr.id ? { ...x, status: val } : x);
                                saveState("lpgportal_fault_requests", updated, setFaultRequests);
                                triggerSimulationNotifications(fr.creatorName, `Yönetici arıza talebinizin statüsünü '${val}' olarak güncelledi.`);
                              }}
                              className="bg-slate-100 border border-slate-200 text-xs text-slate-800 font-bold rounded py-1 px-2 focus:outline-none cursor-pointer"
                            >
                              <option value="Yeni Talep">{tLocal("Yeni Talep", "New Request")}</option>
                              <option value="İnceleniyor">{tLocal("İnceleniyor", "Under Review")}</option>
                              <option value="Çözüm Gönderildi">{tLocal("Çözüm Gönderildi", "Solution Offered")}</option>
                              <option value="Kullanıcı Onayladı">{tLocal("Kullanıcı Onayladı", "User Confirmed")}</option>
                              <option value="Tamamlandı">{tLocal("Tamamlandı", "Completed")}</option>
                              <option value="Kapatıldı">{tLocal("Kapatıldı", "Closed")}</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 3: Teknik Çözüm Teklifleri */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3.5 px-5 font-bold text-xs flex justify-between items-center">
                  <span>{tLocal("Teknik Çözüm Teklifleri, Kabul & Tamamlanma Durumları", "Technical Solution Offers & Confirmation Statuses")}</span>
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded text-[10px]">{technicalSolutions.length} {tLocal("Teklif", "Offers")}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 font-medium">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-5">{tLocal("Usta / Bayi", "Technician / Dealer")}</th>
                        <th className="p-3">{tLocal("Arıza ID / Talep Konusu", "Fault ID / Request Subject")}</th>
                        <th className="p-3">{tLocal("Çözüm Özeti", "Solution Summary")}</th>
                        <th className="p-3">{tLocal("Maliyet (TL)", "Cost (TL)")}</th>
                        <th className="p-3">{tLocal("Süre", "Duration")}</th>
                        <th className="p-3">{tLocal("Müşteri Süzgeci", "Customer Decision")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {technicalSolutions.map(sol => (
                        <tr key={sol.id} className="hover:bg-slate-50/70">
                          <td className="p-3 pl-5 font-bold text-slate-800">{sol.resolverName}</td>
                          <td className="p-3 text-[11px] font-mono text-slate-400">
                            ID: {sol.requestId} <br/>
                            <span className="text-slate-600 font-sans font-semibold">{sol.subject}</span>
                          </td>
                          <td className="p-3 text-slate-600 truncate max-w-xs">{sol.solution}</td>
                          <td className="p-3 text-slate-900 font-bold">{sol.cost.toLocaleString("tr-TR")} TL</td>
                          <td className="p-3 font-mono">{sol.duration}</td>
                          <td className="p-3">
                            <span className={`p-1 px-2 rounded-full font-bold text-[9px] ${
                              sol.userDecision === "Kabul Et" ? "bg-emerald-100 text-emerald-800" :
                              sol.userDecision === "Reddet" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {sol.userDecision === "Kabul Et" ? tLocal("Kabul Edildi", "Accepted") : 
                               sol.userDecision === "Reddet" ? tLocal("Reddedildi", "Rejected") : 
                               tLocal("Beklemede", "Pending")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
