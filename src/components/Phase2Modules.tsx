import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { 
  GraduationCap, 
  Briefcase, 
  Award, 
  CheckCircle, 
  Video, 
  ArrowRight, 
  UserPlus, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Play, 
  ShieldCheck, 
  Printer, 
  Users, 
  Check, 
  X, 
  FileText, 
  ChevronRight, 
  Plus, 
  Search, 
  Lock,
  Headphones,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  UploadCloud,
  Clock,
  User,
  Calendar,
  Sparkles,
  BarChart2
} from "lucide-react";
import { DbUser } from "../lib/membership";

interface Phase2ModulesProps {
  activeUser: DbUser | null;
  onNavigateToTab: (tab: string, role?: "vehicle_owner" | "dealer" | "engineer" | "manufacturer") => void;
}

// Custom interface for Extended Jobs
interface PortalJob {
  id: string;
  company_name: string;
  title: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  salary?: string;
  description: string;
  employment_type: string;
  created_at: string;
  status: "Aktif" | "Pasif";
  owner_id: string;
}

// Custom interface for dynamic Kit Brands
interface KitBrand {
  id: string;
  name: string;
  logoText: string;
  origin: string;
  colorClass: string;
}

// Custom interface for Video Education
interface TrainingVideo {
  id: string;
  title: string;
  description: string;
  category: "Montaj" | "Hata Teşhis" | "Yazılım & OBD" | "Mekanik Kalibrasyon";
  video_url: string; // Embed/Code/Mock path
  image_url: string; // Thumbnail
  brand: string;
  instructor: string;
  duration: string;
}

// Custom interface for dynamic Exam questions
interface ExamQuestion {
  id: string;
  video_id: string;
  question_text: string;
  type: "multiple" | "true_false";
  options: string[]; // empty for true/false
  correct_index: number; // 0 for True, 1 for False, or multiple-choice index
}

// Default seeded Kit Brands
const DEFAULT_KIT_BRANDS: KitBrand[] = [
  { id: "brc", name: "BRC", logoText: "🇮🇹 BRC Gas", origin: "İtalya", colorClass: "border-red-500 text-red-600 bg-red-50/20" },
  { id: "zavoli", name: "Zavoli", logoText: "🇮🇹 Zavoli", origin: "İtalya", colorClass: "border-amber-500 text-amber-600 bg-amber-50/20" },
  { id: "prins", name: "Prins", logoText: "🇳🇱 Prins", origin: "Hollanda", colorClass: "border-blue-500 text-blue-600 bg-blue-50/20" },
  { id: "atiker", name: "Atiker", logoText: "🇹🇷 Atiker", origin: "Türkiye", colorClass: "border-sky-500 text-sky-600 bg-sky-50/20" },
  { id: "lovato", name: "Lovato", logoText: "🇮🇹 Lovato", origin: "İtalya", colorClass: "border-emerald-500 text-emerald-600 bg-emerald-50/20" },
  { id: "landirenzo", name: "Landirenzo", logoText: "🇮🇹 Landirenzo", origin: "İtalya", colorClass: "border-green-600 text-green-700 bg-green-50/10" },
  { id: "romano", name: "Romano", logoText: "🇮🇹 Romano", origin: "İtalya", colorClass: "border-purple-500 text-purple-600 bg-purple-50/20" },
  { id: "omvl", name: "OMVL", logoText: "🇮🇹 OMVL", origin: "İtalya", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "ac_stag", name: "AC Stag", logoText: "🇵🇱 AC Stag", origin: "Polonya", colorClass: "border-rose-500 text-rose-650 bg-rose-50/20" },
  { id: "add_vantage", name: "Add Vantage", logoText: "🇳🇱 Add Vantage", origin: "Hollanda", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "aeb", name: "AEB", logoText: "🇮🇹 AEB", origin: "İtalya", colorClass: "border-indigo-500 text-indigo-600 bg-indigo-50/20" },
  { id: "afc", name: "AFC", logoText: "🇮🇹 AFC", origin: "İtalya", colorClass: "border-purple-500 text-purple-600 bg-purple-50/20" },
  { id: "aldesa", name: "Aldesa", logoText: "🇹🇷 Aldesa", origin: "Türkiye", colorClass: "border-amber-500 text-amber-600 bg-amber-50/20" },
  { id: "alex", name: "Alex", logoText: "🇵🇱 Alex", origin: "Polonya", colorClass: "border-emerald-500 text-emerald-600 bg-emerald-50/20" },
  { id: "oto_gaz_merkezi", name: "Oto-Gaz Merkezi", logoText: "🇹🇷 Oto-Gaz Merkezi", origin: "Türkiye", colorClass: "border-pink-500 text-pink-600 bg-pink-50/20" },
  { id: "autogas_inter", name: "Autogas Italia", logoText: "🇮🇹 Autogas Italia", origin: "İtalya", colorClass: "border-cyan-500 text-cyan-600 bg-cyan-50/20" },
  { id: "autronic", name: "Autronic", logoText: "🇮🇹 Autronic", origin: "İtalya", colorClass: "border-fuchsia-500 text-fuchsia-600 bg-fuchsia-50/20" },
  { id: "bedini", name: "Bedini", logoText: "🇮🇹 Bedini", origin: "İtalya", colorClass: "border-orange-500 text-orange-600 bg-orange-50/20" },
  { id: "bigas", name: "Bigas", logoText: "🇮🇹 Bigas", origin: "İtalya", colorClass: "border-purple-500 text-purple-600 bg-purple-50/20" },
  { id: "digitronic", name: "Digitronic", logoText: "🇩🇪 Digitronic", origin: "Almanya", colorClass: "border-blue-500 text-blue-600 bg-blue-50/20" },
  { id: "dt_gaz_sistemi", name: "DT Gaz Sistemi", logoText: "🇵🇱 DT Gaz Sistemi", origin: "Polonya", colorClass: "border-lime-500 text-lime-600 bg-lime-50/20" },
  { id: "e_gaz", name: "E-Gaz", logoText: "🇮🇹 E-Gaz", origin: "İtalya", colorClass: "border-yellow-600 text-yellow-700 bg-yellow-50/20" },
  { id: "egs_eurogasservice", name: "EGS - EuroGasService", logoText: "🇮🇹 EGS - EuroGasService", origin: "İtalya", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "econova", name: "Econova", logoText: "🇩🇪 Econova", origin: "Almanya", colorClass: "border-stone-500 text-stone-600 bg-stone-50/20" },
  { id: "eko_alma_esgi", name: "Eko Alma - ESGI", logoText: "🇩🇪 Eko Alma - ESGI", origin: "Almanya", colorClass: "border-amber-500 text-amber-600 bg-amber-50/20" },
  { id: "elpigaz", name: "Elpigaz", logoText: "🇵🇱 Elpigaz", origin: "Polonya", colorClass: "border-rose-500 text-rose-600 bg-rose-50/20" },
  { id: "emer", name: "Emer", logoText: "🇮🇹 Emer", origin: "İtalya", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "emmegas", name: "Emmegas", logoText: "🇮🇹 Emmegas", origin: "İtalya", colorClass: "border-violet-500 text-violet-600 bg-violet-50/20" },
  { id: "energia_italya", name: "Energia İtalya", logoText: "🇮🇹 Energia İtalya", origin: "İtalya", colorClass: "border-violet-600 text-violet-700 bg-violet-50/20" },
  { id: "eurogas", name: "Eurogas", logoText: "🇳🇱 Eurogas", origin: "Hollanda", colorClass: "border-blue-500 text-blue-600 bg-blue-50/20" },
  { id: "europegas", name: "Europegas", logoText: "🇵🇱 Europegas", origin: "Polonya", colorClass: "border-emerald-500 text-emerald-600 bg-emerald-50/20" },
  { id: "fobos", name: "Fobos", logoText: "🇧🇬 Fobos", origin: "Bulgaristan", colorClass: "border-amber-600 text-amber-700 bg-amber-50/20" },
  { id: "fuel_fusion", name: "Fuel Fusion", logoText: "🇵🇱 Fuel Fusion", origin: "Polonya", colorClass: "border-rose-600 text-rose-700 bg-rose-50/20" },
  { id: "gas_on_diesel", name: "Gas On Diesel", logoText: "🇬🇧 Gas On Diesel", origin: "Birleşik Krallık", colorClass: "border-sky-500 text-sky-600 bg-sky-50/20" },
  { id: "gasitaly", name: "Gasitaly", logoText: "🇮🇹 Gasitaly", origin: "İtalya", colorClass: "border-neutral-500 text-neutral-600 bg-neutral-50/20" },
  { id: "gfi_alternative", name: "GFI Alternative Fuel Systems", logoText: "🇺🇸 GFI Alternative Fuel Systems", origin: "ABD", colorClass: "border-indigo-500 text-indigo-600 bg-indigo-50/20" },
  { id: "greengas", name: "GREENGAS", logoText: "🇮🇹 GREENGAS", origin: "İtalya", colorClass: "border-emerald-600 text-emerald-700 bg-emerald-50/20" },
  { id: "gurtner", name: "Gurtner", logoText: "🇫🇷 Gurtner", origin: "Fransa", colorClass: "border-indigo-600 text-indigo-700 bg-indigo-50/20" },
  { id: "hana_engineering", name: "Hana Engineering", logoText: "🇰🇷 Hana Engineering", origin: "Güney Kore", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "hl_propan", name: "HL Propan", logoText: "🇨🇿 HL Propan", origin: "Çekya", colorClass: "border-blue-500 text-blue-600 bg-blue-50/20" },
  { id: "icom", name: "ICOM", logoText: "🇮🇹 ICOM", origin: "İtalya", colorClass: "border-emerald-500 text-emerald-600 bg-emerald-50/20" },
  { id: "impco", name: "Impco", logoText: "🇺🇸 Impco", origin: "ABD", colorClass: "border-slate-500 text-slate-600 bg-slate-50/20" },
  { id: "iwema", name: "Iwema", logoText: "🇳🇱 Iwema", origin: "Hollanda", colorClass: "border-sky-500 text-sky-600 bg-sky-50/20" },
  { id: "king_aeb", name: "King (AEB)", logoText: "🇮🇹 King (AEB)", origin: "İtalya", colorClass: "border-indigo-600 text-indigo-700 bg-indigo-50/20" },
  { id: "kme", name: "KME", logoText: "🇵🇱 KME", origin: "Polonya", colorClass: "border-amber-500 text-amber-600 bg-amber-50/20" },
  { id: "landirenzo_space", name: "Landi Renzo", logoText: "🇮🇹 Landi Renzo", origin: "İtalya", colorClass: "border-lime-600 text-lime-700 bg-lime-50/20" },
  { id: "lo_gas", name: "Lo-Gas", logoText: "🇮🇹 Lo-Gas", origin: "İtalya", colorClass: "border-orange-500 text-orange-600 bg-orange-50/20" },
  { id: "longas", name: "Longas", logoText: "🇮🇹 Longas", origin: "İtalya", colorClass: "border-cyan-600 text-cyan-700 bg-cyan-50/20" },
  { id: "lpgtech", name: "LPGTECH", logoText: "🇵🇱 LPGTECH", origin: "Polonya", colorClass: "border-rose-500 text-rose-600 bg-rose-50/20" },
  { id: "marini", name: "Marini", logoText: "🇮🇹 Marini", origin: "İtalya", colorClass: "border-zinc-500 text-zinc-650 bg-zinc-50/20" },
  { id: "mg_motor_gas", name: "MG Motor Gas", logoText: "🇮🇹 MG Motor Gas", origin: "İtalya", colorClass: "border-violet-500 text-violet-600 bg-violet-50/20" },
  { id: "micromise", name: "Micromise", logoText: "🇬🇧 Micromise", origin: "Birleşik Krallık", colorClass: "border-indigo-400 text-indigo-600 bg-indigo-50/20" },
  { id: "mimgas", name: "Mimgas", logoText: "🇹🇷 Mimgas", origin: "Türkiye", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "nlp_lpg", name: "NLP LPG", logoText: "🇹🇷 NLP LPG", origin: "Türkiye", colorClass: "border-emerald-500 text-emerald-650 bg-emerald-50/20" },
  { id: "plineks", name: "Plineks", logoText: "🇵🇱 Plineks", origin: "Polonya", colorClass: "border-red-500 text-red-650 bg-red-50/20" },
  { id: "ramses", name: "Ramses", logoText: "🇹🇷 Ramses", origin: "Türkiye", colorClass: "border-cyan-500 text-cyan-600 bg-cyan-50/20" },
  { id: "retrogaz", name: "Retrogaz", logoText: "🇹🇷 Retrogaz", origin: "Türkiye", colorClass: "border-yellow-600 text-yellow-700 bg-yellow-50/20" },
  { id: "solaris_diesel", name: "Solaris Diesel", logoText: "🇵🇱 Solaris Diesel", origin: "Polonya", colorClass: "border-blue-600 text-blue-700 bg-blue-50/20" },
  { id: "spark", name: "Spark", logoText: "🇹🇷 Spark", origin: "Türkiye", colorClass: "border-teal-500 text-teal-600 bg-teal-50/20" },
  { id: "stako", name: "Stako", logoText: "🇵🇱 Stako", origin: "Polonya", colorClass: "border-zinc-500 text-zinc-650 bg-zinc-50/20" },
  { id: "star_gas", name: "Star Gas", logoText: "🇮🇹 Star Gas", origin: "İtalya", colorClass: "border-indigo-500 text-indigo-600 bg-indigo-50/20" },
  { id: "stefanelli", name: "Stefanelli", logoText: "🇮🇹 Stefanelli", origin: "İtalya", colorClass: "border-pink-500 text-pink-600 bg-pink-50/20" },
  { id: "tamona", name: "Tamona", logoText: "🇱🇹 Tamona", origin: "Litvanya", colorClass: "border-indigo-500 text-indigo-650 bg-indigo-50/20" },
  { id: "tartarini", name: "Tartarini", logoText: "🇮🇹 Tartarini", origin: "İtalya", colorClass: "border-amber-600 text-amber-700 bg-amber-50/20" },
  { id: "teleflex", name: "Teleflex", logoText: "🇳🇱 Teleflex", origin: "Hollanda", colorClass: "border-blue-500 text-blue-600 bg-blue-50/20" },
  { id: "tomasetto", name: "Tomasetto", logoText: "🇮🇹 Tomasetto", origin: "İtalya", colorClass: "border-red-500 text-red-650 bg-red-50/10" },
  { id: "ultragas", name: "Ultragas", logoText: "🇹🇷 Ultragas", origin: "Türkiye", colorClass: "border-fuchsia-500 text-fuchsia-600 bg-fuchsia-50/20" },
  { id: "versus", name: "Versus", logoText: "🇵🇱 Versus", origin: "Polonya", colorClass: "border-indigo-500 text-indigo-600 bg-indigo-50/20" },
  { id: "vialle", name: "Vialle", logoText: "🇳🇱 Vialle", origin: "Hollanda", colorClass: "border-emerald-600 text-emerald-700 bg-emerald-50/20" },
  { id: "vikars", name: "Vikars", logoText: "🇹🇷 Vikars", origin: "Türkiye", colorClass: "border-stone-500 text-stone-650 bg-stone-50/20" },
  { id: "vogels_autogas", name: "Vogels Autogas System", logoText: "🇳🇱 Vogels Autogas System", origin: "Hollanda", colorClass: "border-teal-500 text-teal-650 bg-teal-50/20" },
  { id: "voltran", name: "Voltran", logoText: "🇹🇷 Voltran", origin: "Türkiye", colorClass: "border-orange-500 text-orange-650 bg-orange-50/20" },
  { id: "xlr8", name: "XLR8", logoText: "🇺🇸 XLR8", origin: "ABD", colorClass: "border-pink-500 text-pink-650 bg-pink-50/20" },
  { id: "zamel_autogas", name: "Zamel Autogas", logoText: "🇵🇱 Zamel Autogas", origin: "Polonya", colorClass: "border-emerald-500 text-emerald-650 bg-emerald-50/20" }
];

const DEFAULT_VIDEOS: TrainingVideo[] = [];

// Initial pre-seeded exam questions
const DEFAULT_QUESTIONS: ExamQuestion[] = [];

interface Podcast {
  id: string;
  title: string;
  description: string;
  category: "Sektör Röportajları" | "Teknik Eğitim Podcastleri" | "Kit Üreticisi Yayınları" | "Usta Deneyimleri" | "Sektör Gündemi" | "LPG Teknoloji Sohbetleri";
  speaker: string;
  duration: string;
  cover_url: string;
  audio_url: string;
  publisher_name: string;
  publisher_role: "admin" | "manufacturer";
  status: "approved" | "pending";
  created_at: string;
  listens: number;
  duration_listened_total: number;
}

const DEFAULT_PODCASTS: Podcast[] = [];

export default function Phase2Modules({ activeUser, onNavigateToTab }: Phase2ModulesProps) {
  const { language, t, translateEntity } = useLanguage();

  const tLocal = (trVal: string, enVal: string) => {
    return language === "tr" ? trVal : enVal;
  };

  const [activeTab, setActiveTab] = useState<"education" | "podcast" | "careers" | "adminPanel">("education");
  
  // Storage states
  const [brands, setBrands] = useState<KitBrand[]>([]);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Podcast states
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  
  // Audio Player states
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(true);

  // New Podcast Form states
  const [showPodcastForm, setShowPodcastForm] = useState(false);
  const [podTitle, setPodTitle] = useState("");
  const [podDesc, setPodDesc] = useState("");
  const [podCategory, setPodCategory] = useState<Podcast["category"]>("Sektör Röportajları");
  const [podSpeaker, setPodSpeaker] = useState("");
  const [podDuration, setPodDuration] = useState("");
  const [podCoverUrl, setPodCoverUrl] = useState("");
  const [podAudioUrl, setPodAudioUrl] = useState("");
  const [podFormError, setPodFormError] = useState("");
  const [podFormSuccess, setPodFormSuccess] = useState("");

  // Simulated drag-drop/upload state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Search and Category filters
  const [podSearch, setPodSearch] = useState("");
  const [selectedPodCategory, setSelectedPodCategory] = useState<string>("Tümü");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Sub-tabs / Active selectors
  const [selectedBrand, setSelectedBrand] = useState<KitBrand | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [activeAccessError, setActiveAccessError] = useState<string | null>(null);

  // Active quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean; verified: boolean } | null>(null);
  const [issuedCert, setIssuedCert] = useState<any | null>(null);

  // Job posting inputs & state
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobFirma, setJobFirma] = useState("");
  const [jobPozisyon, setJobPozisyon] = useState("");
  const [jobTanim, setJobTanim] = useState("");
  const [jobSehir, setJobSehir] = useState("");
  const [jobIlce, setJobIlce] = useState("");
  const [jobTel, setJobTel] = useState("");
  const [jobEposta, setJobEposta] = useState("");
  const [jobMaas, setJobMaas] = useState("");
  const [jobCalisma, setJobCalisma] = useState<string>("Tam Zamanlı");
  const [jobFormError, setJobFormError] = useState("");

  // Simulated applies
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  // Video upload form inputs (Manufacturer only)
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [newVidTitle, setNewVidTitle] = useState("");
  const [newVidDesc, setNewVidDesc] = useState("");
  const [newVidCat, setNewVidCat] = useState<"Montaj" | "Hata Teşhis" | "Yazılım & OBD" | "Mekanik Kalibrasyon">("Montaj");
  const [newVidUrl, setNewVidUrl] = useState("");
  const [newVidImage, setNewVidImage] = useState("");
  const [newVidBrand, setNewVidBrand] = useState("");
  const [newVidInstructor, setNewVidInstructor] = useState("");
  const [newVidFormError, setNewVidFormError] = useState("");

  // Exam question creation form (Manufacturer only)
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestText, setNewQuestText] = useState("");
  const [newQuestType, setNewQuestType] = useState<"multiple" | "true_false">("multiple");
  const [newQuestOptA, setNewQuestOptA] = useState("");
  const [newQuestOptB, setNewQuestOptB] = useState("");
  const [newQuestOptC, setNewQuestOptC] = useState("");
  const [newQuestOptD, setNewQuestOptD] = useState("");
  const [newQuestCorrect, setNewQuestCorrect] = useState<number>(0);
  const [newQuestFormError, setNewQuestFormError] = useState("");

  // Admin Brand creation form
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState("İtalya");
  const [newBrandColor, setNewBrandColor] = useState("border-emerald-500 text-emerald-600 bg-emerald-50/20");
  const [adminFormError, setAdminFormError] = useState("");

  // Admin filter search
  const [adminBrandFilter, setAdminBrandFilter] = useState("Tümü");

  // Load resources from localStorage
  useEffect(() => {
    // 1. Brands
    const storedBrands = localStorage.getItem("lpgportal_brands_extended");
    let currentBrands = DEFAULT_KIT_BRANDS;
    if (storedBrands) {
      try {
        const parsed = JSON.parse(storedBrands);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedNames = new Set(parsed.map(p => p.name.toLowerCase().trim()));
          const missing = DEFAULT_KIT_BRANDS.filter(b => !parsedNames.has(b.name.toLowerCase().trim()));
          currentBrands = [...parsed, ...missing];
        }
      } catch (e) {}
    }
    setBrands(currentBrands);
    localStorage.setItem("lpgportal_brands_extended", JSON.stringify(currentBrands));
    
    // Save legacy flat brand list to ensure syncing with register
    const flatList = currentBrands.map(b => b.name);
    localStorage.setItem("lpgportal_brands", JSON.stringify(flatList));

    // 2. Videos
    const storedVideos = localStorage.getItem("lpgportal_videos");
    if (storedVideos) {
      setVideos(JSON.parse(storedVideos));
    } else {
      setVideos(DEFAULT_VIDEOS);
      localStorage.setItem("lpgportal_videos", JSON.stringify(DEFAULT_VIDEOS));
    }

    // 3. Questions
    const storedQuestions = localStorage.getItem("lpgportal_questions");
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    } else {
      setQuestions(DEFAULT_QUESTIONS);
      localStorage.setItem("lpgportal_questions", JSON.stringify(DEFAULT_QUESTIONS));
    }

    // 4. Jobs
    const storedJobs = localStorage.getItem("lpgportal_jobs");
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    } else {
      // Convert legacy jobs to new richer structure
      const seededExtendedJobs: PortalJob[] = [
        {
          id: "j1",
          company_name: "Yıldız Otogaz Mühendislik",
          title: "Sıralı Otogaz Kurulum Ustası (Maslak)",
          city: "İstanbul",
          district: "Sarıyer",
          phone: "0212 285 4040",
          email: "maslak@lpgotogaz.com",
          salary: "45,000 - 60,000 TL",
          description: "Maslak Sanayi dükkanımızda görev alacak, özellikle İthal Prins ve BRC sistemlerinin montajına hakim, manifold delme ve elektrik tesisat lehimlemesinde tecrübeli usta aramaktayız. SGK + Yemek + Prim imkanları.",
          employment_type: tLocal("Tam Zamanlı", "Full Time"),
          created_at: "2026-06-05",
          status: "Aktif",
          owner_id: "user_dealer_1"
        },
        {
          id: "j2",
          company_name: "Atiker İç Anadolu Distribütörü",
          title: "Gezici Teknik Destek ve Yol Kalibrasyon Elemanı",
          city: "Ankara",
          district: "Ostim",
          phone: "0332 342 5555",
          email: "destek@atiker.com",
          salary: "40,000 - 52,000 TL",
          description: "Ostim şubemize gelen LPG'li araçların arıza tespiti (MAP arızaları, zengin/fakir karışım tekleme çözümleri) yapacak, enjektör debi kontrolüne hakim, bilgisayarlı yol kalibrasyonu sertifikası olan çalışma arkadaşları arıyoruz.",
          employment_type: tLocal("Tam Zamanlı", "Full Time"),
          created_at: "2026-06-08",
          status: "Aktif",
          owner_id: "user_mfr_1"
        }
      ];
      setJobs(seededExtendedJobs);
      localStorage.setItem("lpgportal_jobs", JSON.stringify(seededExtendedJobs));
    }

    // 5. User Certificates
    const storedCerts = localStorage.getItem("lpgportal_user_certificates");
    if (storedCerts) {
      setCertificates(JSON.parse(storedCerts));
    } else {
      setCertificates([]);
    }

    // 6. Podcasts
    const storedPodcasts = localStorage.getItem("lpgportal_podcasts");
    if (storedPodcasts) {
      setPodcasts(JSON.parse(storedPodcasts));
    } else {
      setPodcasts(DEFAULT_PODCASTS);
      localStorage.setItem("lpgportal_podcasts", JSON.stringify(DEFAULT_PODCASTS));
    }

    // 7. Favorites
    const storedFavorites = localStorage.getItem("lpgportal_favorites");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    } else {
      setFavorites([]);
    }

    // Prefill firm name if user is dealer/mfr when writing jobs
    if (activeUser) {
      if (activeUser.company_name) {
        setJobFirma(activeUser.company_name);
      } else {
        setJobFirma(activeUser.name);
      }
      setJobEposta(activeUser.email);
      setJobTel(activeUser.phone);
    }
  }, [activeUser]);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { key, value } = customEvent.detail;
        if (key === "lpgportal_videos") setVideos(value);
        if (key === "lpgportal_questions") setQuestions(value);
        if (key === "lpgportal_podcasts") setPodcasts(value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  // Audio elements control and binding
  useEffect(() => {
    if (audioElement) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioElement.currentTime);
      };
      const handleLoadedMetadata = () => {
        setDuration(audioElement.duration || 0);
      };
      const handleAudioEnded = () => {
        setIsPlaying(false);
        if (playingId) {
          const finishedPod = podcasts.find(p => p.id === playingId);
          if (finishedPod) {
            handleRegisterListen(finishedPod.id, finishedPod.duration);
          }
        }
      };

      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.addEventListener("ended", handleAudioEnded);

      return () => {
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
        audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audioElement.removeEventListener("ended", handleAudioEnded);
      };
    }
  }, [audioElement, playingId, podcasts]);

  // Toggle Favorite
  const handleToggleFavorite = (podId: string) => {
    let updated: string[];
    if (favorites.includes(podId)) {
      updated = favorites.filter(id => id !== podId);
    } else {
      updated = [...favorites, podId];
    }
    setFavorites(updated);
    localStorage.setItem("lpgportal_favorites", JSON.stringify(updated));
  };

  // Play / Pause toggler for specific podcast
  const handlePlayPodcast = (pod: Podcast) => {
    if (playingId === pod.id) {
      // Toggle play state
      if (isPlaying) {
        setIsPlaying(false);
        if (audioElement) {
          audioElement.pause();
        }
      } else {
        setIsPlaying(true);
        if (audioElement) {
          audioElement.play().catch(e => console.log("Oynatma hatası:", e));
        }
      }
    } else {
      // Pause any existing playing audio
      if (audioElement) {
        audioElement.pause();
      }

      setPlayingId(pod.id);
      setIsPlaying(true);
      setCurrentTime(0);

      // Create a new Audio object
      const audio = new Audio(pod.audio_url);
      audio.volume = isMuted ? 0 : volume;
      setAudioElement(audio);

      // Play immediately
      audio.play().catch(e => console.log("İlk yükleme oynatılamadı:", e));

      // Increment listens count immediately on play start (simulating listener action)
      const updatedList = podcasts.map(p => {
        if (p.id === pod.id) {
          return {
            ...p,
            listens: (p.listens || 0) + 1,
            duration_listened_total: (p.duration_listened_total || 0) + Math.floor(Math.random() * 200 + 40)
          };
        }
        return p;
      });
      setPodcasts(updatedList);
      localStorage.setItem("lpgportal_podcasts", JSON.stringify(updatedList));
    }
  };

  // Skip Forward 15s or 30s
  const handleForward = () => {
    if (audioElement) {
      audioElement.currentTime = Math.min(audioElement.currentTime + 15, duration);
      setCurrentTime(audioElement.currentTime);
    }
  };

  // Rewind 15s or 30s
  const handleRewind = () => {
    if (audioElement) {
      audioElement.currentTime = Math.max(audioElement.currentTime - 15, 0);
      setCurrentTime(audioElement.currentTime);
    }
  };

  // Seek on range slider click
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioElement) {
      audioElement.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : val;
    }
  };

  const handleMuteToggle = () => {
    const revisedMuted = !isMuted;
    setIsMuted(revisedMuted);
    if (audioElement) {
      audioElement.volume = revisedMuted ? 0 : volume;
    }
  };

  // Register real listen completed stats
  const handleRegisterListen = (podId: string, durationStr: string) => {
    let durSec = 300;
    if (durationStr.includes(":")) {
      const parts = durationStr.split(":");
      durSec = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    const simulatedListenTime = Math.floor(durSec * (0.5 + Math.random() * 0.5));

    const updated = podcasts.map(p => {
      if (p.id === podId) {
        return {
          ...p,
          duration_listened_total: (p.duration_listened_total || 0) + simulatedListenTime
        };
      }
      return p;
    });

    setPodcasts(updated);
    localStorage.setItem("lpgportal_podcasts", JSON.stringify(updated));
  };

  // Approve a pending podcast (Admin Only)
  const handleApprovePodcast = (podId: string) => {
    const updated = podcasts.map(p => {
      if (p.id === podId) {
        return { ...p, status: "approved" as const };
      }
      return p;
    });
    setPodcasts(updated);
    localStorage.setItem("lpgportal_podcasts", JSON.stringify(updated));
  };

  // Delete/Reject a podcast
  const handleDeletePodcast = (podId: string) => {
    const updated = podcasts.filter(p => p.id !== podId);
    setPodcasts(updated);
    localStorage.setItem("lpgportal_podcasts", JSON.stringify(updated));
    if (playingId === podId) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingId(null);
      setIsPlaying(false);
      setSelectedPodcast(null);
    }
  };

  // Form submit for Podcast upload
  const handleAddPodcast = (e: React.FormEvent) => {
    e.preventDefault();
    setPodFormError("");
    setPodFormSuccess("");

    if (!podTitle.trim()) { setPodFormError("Podcast başlığı zorunludur."); return; }
    if (!podDesc.trim()) { setPodFormError("Podcast açıklaması zorunludur."); return; }
    if (!podCategory) { setPodFormError("Kategori seçimi zorunludur."); return; }
    if (!podSpeaker.trim()) { setPodFormError("Konuşmacı (konuk/uzman) alanı zorunludur."); return; }
    if (!podDuration.trim()) { setPodFormError("Süre bilgisi zorunludur (örn: 14:15)."); return; }
    
    // Duration validation format MM:SS or HH:MM:SS
    const durationRegex = /^(\d+:)?\d+:\d+$/;
    if (!durationRegex.test(podDuration.trim())) {
      setPodFormError("Süre formatı geçersiz. Örnek: 15:30 veya 1:04:12");
      return;
    }

    if (!podCoverUrl.trim()) { setPodFormError("Kapak görseli linki/seçimi zorunludur."); return; }

    const isUserAdmin = activeUser?.role === "admin";
    const initialStatus = isUserAdmin ? "approved" : "pending";

    const newPodcast: Podcast = {
      id: "pod-" + Date.now(),
      title: podTitle.trim(),
      description: podDesc.trim(),
      category: podCategory,
      speaker: podSpeaker.trim(),
      duration: podDuration.trim(),
      cover_url: podCoverUrl.trim() || "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400",
      audio_url: podAudioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      publisher_name: activeUser?.company_name || activeUser?.name || "LPG Marka Temsilcisi",
      publisher_role: isUserAdmin ? "admin" : "manufacturer",
      status: initialStatus,
      created_at: new Date().toISOString().split("T")[0],
      listens: 0,
      duration_listened_total: 0
    };

    const updated = [...podcasts, newPodcast];
    setPodcasts(updated);
    localStorage.setItem("lpgportal_podcasts", JSON.stringify(updated));

    if (isUserAdmin) {
      setPodFormSuccess("Podcastiniz başarıyla yüklendi ve doğrudan yayına alındı!");
    } else {
      setPodFormSuccess("Podcastiniz başarıyla yüklendi! Yönetici onayından sonra yayına alınacaktır.");
    }

    // Reset Form fields
    setPodTitle("");
    setPodDesc("");
    setPodSpeaker("");
    setPodDuration("");
    setPodCoverUrl("");
    setPodAudioUrl("");
    setUploadedFileName(null);
    setUploadedFileSize(null);

    setTimeout(() => {
      setShowPodcastForm(false);
      setPodFormSuccess("");
    }, 2500);
  };

  // Auth Redirect check triggers
  const handleAuthNav = (action: "login" | "register") => {
    if (action === "login") {
      onNavigateToTab("giris");
    } else {
      onNavigateToTab("giris", "vehicle_owner"); // switch to register step
    }
  };

  // Click handler on training brand cards
  const handleBrandClick = (brand: KitBrand) => {
    setActiveAccessError(null);
    setSelectedVideo(null);
    setQuizResult(null);
    setIssuedCert(null);

    if (!activeUser) {
      return; // Handled by upper validation
    }

    // Admin passes unconditionally
    if (activeUser.role === "admin") {
      setSelectedBrand(brand);
      return;
    }

    // Others: check brand matching and working_brands
    const normBrandName = brand.name.toLowerCase().replace(/\s/g, "");
    const isUserBrand =
      (activeUser.brand_name && activeUser.brand_name.toLowerCase().replace(/\s/g, "") === normBrandName) ||
      (activeUser.working_brands || []).some(b => b.toLowerCase().replace(/\s/g, "") === normBrandName);

    if (isUserBrand) {
      setSelectedBrand(brand);
    } else {
      setActiveAccessError(`"Bu eğitim içeriğine erişim yetkiniz bulunmamaktadır."`);
    }
  };

  // Video submit (Manufacturer only)
  const handleVideoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setNewVidFormError("");

    if (!newVidTitle || !newVidDesc || !newVidUrl) {
      setNewVidFormError("Lütfen zorunlu alanları doldurun.");
      return;
    }

    // Determine target brand based on user profile (restricted to their own, except admin)
    const targetBrand = activeUser?.role === "admin" ? newVidBrand : (activeUser?.brand_name || "BRC");

    const newVideoItem: TrainingVideo = {
      id: "v_" + Date.now(),
      title: newVidTitle,
      description: newVidDesc,
      category: newVidCat,
      video_url: newVidUrl.includes("http") ? newVidUrl : "https://www.youtube.com/embed/dQw4w9WgXcQ",
      image_url: newVidImage || "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200",
      brand: targetBrand,
      instructor: newVidInstructor || activeUser?.name || "Kit Yetkilisi",
      duration: "30 Dakika"
    };

    const updatedVideos = [...videos, newVideoItem];
    setVideos(updatedVideos);
    localStorage.setItem("lpgportal_videos", JSON.stringify(updatedVideos));

    // Reset fields
    setNewVidTitle("");
    setNewVidDesc("");
    setNewVidUrl("");
    setNewVidImage("");
    setNewVidInstructor("");
    setShowVideoForm(false);
  };

  // Exam Question submit
  const handleQuestionAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setNewQuestFormError("");

    if (!newQuestText || !selectedVideo) {
      setNewQuestFormError("Soru metni ve bağlı eğitim videosu zorunludur.");
      return;
    }

    let optionsArray: string[] = [];
    if (newQuestType === "multiple") {
      if (!newQuestOptA || !newQuestOptB) {
        setNewQuestFormError("Çoktan seçmeli soru için en az A ve B seçenekleri zorunludur.");
        return;
      }
      optionsArray = [newQuestOptA, newQuestOptB, newQuestOptC || "Boş", newQuestOptD || "Boş"];
    } else {
      optionsArray = ["Doğru", "Yanlış"];
    }

    const newQuestItem: ExamQuestion = {
      id: "q_" + Date.now(),
      video_id: selectedVideo.id,
      question_text: newQuestText,
      type: newQuestType,
      options: optionsArray,
      correct_index: newQuestCorrect
    };

    const updatedQuests = [...questions, newQuestItem];
    setQuestions(updatedQuests);
    localStorage.setItem("lpgportal_questions", JSON.stringify(updatedQuests));

    // Reset
    setNewQuestText("");
    setNewQuestOptA("");
    setNewQuestOptB("");
    setNewQuestOptC("");
    setNewQuestOptD("");
    setNewQuestCorrect(0);
    setShowQuestionForm(false);
  };

  // Take exam submission
  const handleQuizSubmit = (videoId: string) => {
    const videoQuestions = questions.filter(q => q.video_id === videoId);
    if (videoQuestions.length === 0) return;

    let correctCount = 0;
    videoQuestions.forEach(q => {
      if (quizAnswers[q.id] !== undefined && quizAnswers[q.id] === q.correct_index) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / videoQuestions.length) * 100);
    const hasPassed = score === 100; // Require 100% logic or standard success criteria

    setQuizResult({
      score,
      passed: hasPassed,
      verified: true
    });

    if (hasPassed && activeUser) {
      // Issue dynamic certificate
      const certId = `CERT-${selectedBrand?.name || "EXT"}-${Math.floor(10000 + Math.random() * 90000)}`;
      const newCertificate = {
        id: certId,
        user_name: `${activeUser.name} ${activeUser.authorized_name || ""}`.trim(),
        brand: selectedBrand?.name || "LPG Ustası",
        course_title: selectedVideo?.title || "Teorik Kalibrasyon Eğitimi",
        achievement_date: new Date().toLocaleDateString("tr-TR"),
        userId: activeUser.id
      };

      const revisedCerts = [...certificates, newCertificate];
      setCertificates(revisedCerts);
      localStorage.setItem("lpgportal_user_certificates", JSON.stringify(revisedCerts));
      setIssuedCert(newCertificate);
    }
  };

  const deleteVideo = (vidId: string) => {
    const freshVids = videos.filter(v => v.id !== vidId);
    setVideos(freshVids);
    localStorage.setItem("lpgportal_videos", JSON.stringify(freshVids));
    if (selectedVideo?.id === vidId) {
      setSelectedVideo(null);
    }
  };

  // Job form submissions
  const handleJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJobFormError("");

    if (!jobFirma || !jobPozisyon || !jobTanim || !jobSehir || !jobIlce || !jobTel || !jobEposta) {
      setJobFormError("Lütfen tüm zorunlu alanları eksiksiz doldurun.");
      return;
    }

    if (editingJobId) {
      const refreshedJobs = jobs.map(j => {
        if (j.id === editingJobId) {
          return {
            ...j,
            company_name: jobFirma,
            title: jobPozisyon,
            description: jobTanim,
            city: jobSehir,
            district: jobIlce,
            phone: jobTel,
            email: jobEposta,
            salary: jobMaas || undefined,
            employment_type: jobCalisma
          };
        }
        return j;
      });
      setJobs(refreshedJobs);
      localStorage.setItem("lpgportal_jobs", JSON.stringify(refreshedJobs));
      setEditingJobId(null);
    } else {
      const newJobItem: PortalJob = {
        id: "job_" + Date.now(),
        company_name: jobFirma,
        title: jobPozisyon,
        description: jobTanim,
        city: jobSehir,
        district: jobIlce,
        phone: jobTel,
        email: jobEposta,
        salary: jobMaas || undefined,
        employment_type: jobCalisma,
        created_at: new Date().toISOString().split("T")[0],
        status: "Aktif",
        owner_id: activeUser?.id || "anonymous"
      };
      const refreshedJobs = [...jobs, newJobItem];
      setJobs(refreshedJobs);
      localStorage.setItem("lpgportal_jobs", JSON.stringify(refreshedJobs));
    }

    // Restore presets
    setJobPozisyon("");
    setJobTanim("");
    setJobSehir("");
    setJobIlce("");
    setJobMaas("");
    setShowJobForm(false);
  };

  const handleEditJob = (job: PortalJob) => {
    setEditingJobId(job.id);
    setJobFirma(job.company_name);
    setJobPozisyon(job.title);
    setJobTanim(job.description);
    setJobSehir(job.city);
    setJobIlce(job.district);
    setJobTel(job.phone);
    setJobEposta(job.email);
    setJobMaas(job.salary || "");
    setJobCalisma(job.employment_type);
    setShowJobForm(true);
  };

  const handleToggleJobStatus = (jobId: string) => {
    const updated = jobs.map(j => {
      if (j.id === jobId) {
        return { ...j, status: j.status === "Aktif" ? "Pasif" as const : "Aktif" as const };
      }
      return j;
    });
    setJobs(updated);
    localStorage.setItem("lpgportal_jobs", JSON.stringify(updated));
  };

  const handleDeleteJob = (jobId: string) => {
    const updated = jobs.filter(j => j.id !== jobId);
    setJobs(updated);
    localStorage.setItem("lpgportal_jobs", JSON.stringify(updated));
  };

  // Admin section: dynamically add a Kit Brand
  const handleAddNewBrand = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError("");

    if (!newBrandName) {
      setAdminFormError("Lütfen marka adını belirtin.");
      return;
    }

    if (brands.some(b => b.name.toLowerCase() === newBrandName.toLowerCase())) {
      setAdminFormError("Bu marka zaten mevcut.");
      return;
    }

    const newBrandItem: KitBrand = {
      id: "brand_" + Date.now(),
      name: newBrandName,
      logoText: `⚙️ ${newBrandName}`,
      origin: newBrandOrigin,
      colorClass: newBrandColor
    };

    const updatedBrands = [...brands, newBrandItem];
    setBrands(updatedBrands);
    localStorage.setItem("lpgportal_brands_extended", JSON.stringify(updatedBrands));

    // Save flat representation too for legacy mapping integrations
    const flatList = updatedBrands.map(b => b.name);
    localStorage.setItem("lpgportal_brands", JSON.stringify(flatList));

    setNewBrandName("");
    setShowBrandForm(false);
  };

  const handleApplySimulated = (jobId: string) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs([...appliedJobs, jobId]);
    }
  };

  // Helper check for role requirements (strictly requires membership_status === "Aktif" and correct role)
  const canPublishJobs = activeUser && 
    (activeUser.role === "dealer" || activeUser.role === "manufacturer" || activeUser.role === "admin") && 
    (activeUser.membership_status === "Aktif" || activeUser.role === "admin");
  const isManufacturer = activeUser && (activeUser.role === "manufacturer" || activeUser.role === "admin");

  return (
    <div className="bg-slate-50 text-slate-800 p-0 rounded-2xl border border-slate-200/80 shadow-md max-w-5xl mx-auto overflow-hidden font-sans">
      
      {/* Visual Accent Header Bar */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-800 p-6 sm:p-8 text-white relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px] pointer-events-none" />
        
        <span className="bg-emerald-500/20 backdrop-blur-xs text-emerald-300 text-[10px] font-bold tracking-widest px-3 py-1 rounded-full border border-emerald-500/30 font-mono uppercase inline-block">
          {tLocal("Usta Sertifikasyon, Eğitim & Kariyer Merkezi", "Technician Certification, Training & Career Hub")}
        </span>
        <h2 className="text-2xl sm:text-3.5xl font-black mt-3 tracking-tight text-white leading-tight font-sans">
          {tLocal("LPG Profesyonel Akademi", "LPG Professional Academy")}
        </h2>
        <p className="text-emerald-100/80 mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed">
          {tLocal("Teknisyen ve montajcılar için onaylı marka eğitim programları, usta düzeyinde sertifikalı sınavlar ve endüstriyel bayiler ortak iş ilanı kariyer merkezi.", "Approved brand training courses for installers, expert licensing exam simulators, and industrial dealership joint vacancy lists.")}
        </p>

        {/* Global tab options */}
        <div className="flex flex-wrap gap-2.5 mt-6 border-t border-white/10 pt-5 relative z-10">
          <button
            id="tab-edu"
            onClick={() => { setActiveTab("education"); setSelectedBrand(null); setSelectedVideo(null); setActiveAccessError(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "education"
                ? "bg-white text-emerald-950 shadow-sm"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>{tLocal("🎓 Eğitimler & Sınavlar", "🎓 Trainings & Exams")}</span>
          </button>

          <button
            id="tab-podcast"
            onClick={() => { setActiveTab("podcast"); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "podcast"
                ? "bg-white text-emerald-950 shadow-sm"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>{tLocal("🎙️ Podcast Merkezi", "🎙️ Podcast Hub")}</span>
          </button>

          <button
            id="tab-careers"
            onClick={() => { setActiveTab("careers"); setShowJobForm(false); setEditingJobId(null); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "careers"
                ? "bg-white text-emerald-950 shadow-sm"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>{tLocal("💼 LPG Sektor İş İlanları", "💼 LPG Industry Vacancies")}</span>
          </button>

          {activeUser && activeUser.role === "admin" && (
            <button
              id="tab-admin"
              onClick={() => { setActiveTab("adminPanel"); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer border ${
                activeTab === "adminPanel"
                  ? "bg-amber-550 bg-amber-500 border-amber-600 text-slate-950 shadow-sm font-black"
                  : "bg-amber-500/20 text-amber-205 text-amber-300 border-amber-500/20 hover:bg-amber-500/30"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{tLocal("🛠️ Yönetici Paneli", "🛠️ Admin Portal")}</span>
            </button>
          )}
        </div>
      </div>

      {/* CORE WRAPPER BODY CONTAINER */}
      <div className="p-6 bg-white min-h-[450px]">
        
        {/* ======================================================== */}
        {/* TAB 1: EDUCATION & CERTIFICATION SYSTEMS */}
        {/* ======================================================== */}
        {activeTab === "education" && (
          <div className="space-y-6">
            
            {/* Condition A: User has not signed in */}
            {!activeUser ? (
              <div className="max-w-md mx-auto text-center py-10 px-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm my-6">
                <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">{tLocal("Erişim Engellendi", "Access Denied")}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  "Bu alana erişebilmek için giriş yapmanız gerekmektedir."
                </p>
                <div className="mt-5 flex gap-3 justify-center">
                  <button
                    onClick={() => handleAuthNav("login")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-xs cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                  <button
                    onClick={() => handleAuthNav("register")}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-705 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition border border-slate-200 cursor-pointer"
                  >
                    Kayıt Ol
                  </button>
                </div>
              </div>
            ) : (
              <div>
                
                {/* Condition B: Logged In, show selection of Brands or show selection of items */}
                {!selectedBrand ? (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">
                          LPG Marka Eğitim Alanları
                        </h4>
                        <span className="text-xs text-emerald-600 font-serif italic bg-emerald-50 px-3 py-1 rounded">
                          Hesabınıza Tanımlı: <strong>{activeUser.brand_name || "Mevcut Değil (Ziyaretçi/Araç Sahibi)"}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Sadece tescilli yetki markanıza özel dökümantasyon ve sınavlara girebilirsiniz. Lütfen girmek istediğiniz eğitim kiti markasını seçin:
                      </p>
                    </div>

                    {activeAccessError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2 animate-fade-in font-sans">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block">{tLocal("Erişim Hatası", "Access Error")}</strong>
                          {activeAccessError}
                        </div>
                      </div>
                    )}

                    {/* Kit Markaları Grid rendering */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {brands.map((br) => {
                        const normBrandName = br.name.toLowerCase().replace(/\s/g, "");
                        const isUserBrand = activeUser.role === "admin" || 
                          (activeUser.brand_name && activeUser.brand_name.toLowerCase().replace(/\s/g, "") === normBrandName) ||
                          (activeUser.working_brands || []).some(b => b.toLowerCase().replace(/\s/g, "") === normBrandName);
                        return (
                          <div
                            key={br.id}
                            onClick={() => handleBrandClick(br)}
                            className={`p-5 rounded-2xl border text-center cursor-pointer transition flex flex-col justify-between items-center min-h-[140px] relative ${
                              isUserBrand 
                                ? "bg-white hover:bg-emerald-50/20 hover:border-emerald-500/80 hover:shadow-md border-slate-250 border-slate-200 shadow-xs" 
                                : "bg-slate-100/60 border-slate-200 text-slate-400 opacity-70"
                            }`}
                          >
                            {!isUserBrand && (
                              <div className="absolute top-2.5 right-2.5 text-slate-400">
                                <Lock className="h-3.5 w-3.5" />
                              </div>
                            )}
                            
                            <span className="text-2.5xl block my-2 select-none font-mono font-bold tracking-widest uppercase">
                              {br.name === "BRC" ? "🔴 BRC" : 
                               br.name === "Zavoli" ? "🟡 Zavoli" : 
                               br.name === "Prins" ? "👑 Prins" : 
                               br.name === "Atiker" ? "🔵 Atiker" : 
                               br.name === "Lovato" ? "🟢 Lovato" : 
                               br.name === "Landirenzo" ? "⚡ Landi" : 
                               br.name === "Romano" ? "⚙️ Romano" : 
                               br.name === "OMVL" ? "💎 OMVL" : br.logoText}
                            </span>
                            
                            <div>
                              <strong className="block text-xs font-bold text-slate-900 mt-1">{br.name} Akademi</strong>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{br.origin}</span>
                            </div>

                            <div className="mt-3 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                              {isUserBrand ? "Girişe Açık" : "Yetki Yok"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Workspace of selected brand training videos and examinations
                  <div className="space-y-6">
                    
                    {/* Header back button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <button
                          onClick={() => { setSelectedBrand(null); setSelectedVideo(null); setQuizResult(null); setIssuedCert(null); }}
                          className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          &larr; LPG Markalarına Geri Dön
                        </button>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-2 font-sans flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-mono">{selectedBrand.name}</span>
                          Akademisi Eğitim Müfredatı
                        </h3>
                      </div>

                      {/* Manufacturer upload trigger & button */}
                      {isManufacturer && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowVideoForm(!showVideoForm); setShowQuestionForm(false); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus className="h-4 w-4" />
                            Yeni Eğitim Videosu Yükle
                          </button>
                          {selectedVideo && (
                            <button
                              onClick={() => { setShowQuestionForm(!showQuestionForm); setShowVideoForm(false); }}
                              className="bg-teal-650 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Soru Ekle
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* VİDEO YÜKLEME FORMU */}
                    {showVideoForm && (
                      <form onSubmit={handleVideoUpload} className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-250 border-emerald-200 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-emerald-200/50 pb-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 font-mono flex items-center gap-1.5">
                            <Video className="h-4 w-4 text-emerald-600" />
                            Yeni Video Dökümanı Girişi
                          </h4>
                          <button type="button" onClick={() => setShowVideoForm(false)} className="text-emerald-800 hover:text-emerald-950">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {newVidFormError && <p className="text-xs text-rose-600 font-bold">{newVidFormError}</p>}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal("Eğitim Başlığı", "Training Title")}<strong className="text-rose-600">*</strong></label>
                            <input 
                              type="text" 
                              required
                              placeholder={tLocal("Örn: Lovato Smart Enjektör Kalibrasyonu", "e.g. Lovato Smart Injector Calibration")} 
                              value={newVidTitle}
                              onChange={(e) => setNewVidTitle(e.target.value)}
                              className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-emerald-500"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Kategori <strong className="text-rose-600">*</strong></label>
                            <select
                              value={newVidCat}
                              onChange={(e: any) => setNewVidCat(e.target.value)}
                              className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200"
                            >
                              <option value="Montaj">Montaj Teknolojisi</option>
                              <option value="Hata Teşhis">{tLocal("Hata Teşhis & Arızalar", "Diagnostics & Troubleshooting")}</option>
                              <option value="Yazılım & OBD">{tLocal("Yazılım & OBD Kalibrasyon", "Software & OBD Calibration")}</option>
                              <option value="Mekanik Kalibrasyon">Mekanik Kalibrasyon</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">{tLocal("Eğitim Açıklaması", "Training Description")}<strong className="text-rose-600">*</strong></label>
                          <textarea 
                            required
                            rows={3}
                            placeholder={tLocal("Montaj kılavuzları, usta uyulması gereken emniyet limitleri ve kalibrasyon parametreleri dökümantasyonu...", "Installation manuals, safety limits for technicians, and calibration parameters documentation...")}
                            value={newVidDesc}
                            onChange={(e) => setNewVidDesc(e.target.value)}
                            className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal("Video Kaynağı / YouTube Embed Link", "Video Source / YouTube Embed Link")}<strong className="text-rose-600">*</strong></label>
                            <input 
                              type="text" 
                              required
                              placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                              value={newVidUrl}
                              onChange={(e) => setNewVidUrl(e.target.value)}
                              className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal("Kapak Görseli Linki (Opsiyonel)", "Cover Image Link (Optional)")}</label>
                            <input 
                              type="text" 
                              placeholder="https://images.unsplash.com/..." 
                              value={newVidImage}
                              onChange={(e) => setNewVidImage(e.target.value)}
                              className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal("Eğitmen İsmi (Opsiyonel)", "Instructor Name (Optional)")}</label>
                            <input 
                              type="text" 
                              placeholder={tLocal("Eğitmen Mühendis veya Teknik Yetkili", "Instructor Engineer or Technical Specialist")} 
                              value={newVidInstructor}
                              onChange={(e) => setNewVidInstructor(e.target.value)}
                              className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200"
                            />
                          </div>

                          {activeUser?.role === "admin" && (
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block">{tLocal("Yüklenecek Marka (Sadece Admin)", "Brand to Assign (Admin Only)")}</label>
                              <select
                                value={newVidBrand}
                                onChange={(e) => setNewVidBrand(e.target.value)}
                                className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200 cursor-pointer"
                              >
                                <option value="">{tLocal("-- Marka Seç (Admin) --", "-- Select Brand (Admin) --")}</option>
                                {brands.map(b => (
                                  <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowVideoForm(false)} className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer">
                            İptal
                          </button>
                          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                            Eğitimi Yayınla
                          </button>
                        </div>
                      </form>
                    )}

                    {/* SINAV SORUSU EKLEME FORMU */}
                    {showQuestionForm && selectedVideo && (
                      <form onSubmit={handleQuestionAdd} className="bg-teal-50/50 p-5 rounded-2xl border border-teal-200 space-y-4 shadow-sm animate-fade-in text-xs">
                        <div className="flex justify-between items-center border-b border-teal-200/50 pb-2">
                          <h4 className="font-bold uppercase tracking-wider text-teal-950 font-mono flex items-center gap-1.5">
                            <Award className="h-4.5 w-4.5 text-teal-600" />
                            Eğitime Sınav Sorusu Ekleme ({selectedVideo.title})
                          </h4>
                          <button type="button" onClick={() => setShowQuestionForm(false)} className="text-teal-800 hover:text-teal-950">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {newQuestFormError && <p className="text-xs text-rose-600 font-bold">{newQuestFormError}</p>}

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">Soru Metni <strong className="text-rose-600">*</strong></label>
                          <input 
                            type="text" 
                            required
                            placeholder={tLocal("Soru cümlesi veya teknik problem tanımı...", "Question sentence or technical problem definition...")} 
                            value={newQuestText}
                            onChange={(e) => setNewQuestText(e.target.value)}
                            className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">Soru Tipi</label>
                            <select
                              value={newQuestType}
                              onChange={(e: any) => setNewQuestType(e.target.value)}
                              className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                            >
                              <option value="multiple">{tLocal("Çoktan Seçmeli (A, B, C, D)", "Multiple Choice (A, B, C, D)")}</option>
                              <option value="true_false">{tLocal("Doğru / Yanlış (True / False)", "True / False")}</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 block">{tLocal("Doğru Seçenek İndeksi", "Correct Option Index")}<strong className="text-rose-600">*</strong></label>
                            <select
                              value={newQuestCorrect}
                              onChange={(e) => setNewQuestCorrect(Number(e.target.value))}
                              className="w-full bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer"
                            >
                              {newQuestType === "multiple" ? (
                                <>
                                  <option value={0}>{tLocal("A Seçeneği", "A Option")}</option>
                                  <option value={1}>{tLocal("B Seçeneği", "B Option")}</option>
                                  <option value={2}>{tLocal("C Seçeneği", "C Option")}</option>
                                  <option value={3}>{tLocal("D Seçeneği", "D Option")}</option>
                                </>
                              ) : (
                                <>
                                  <option value={0}>{tLocal("Seçenek 1 (Doğru)", "Option 1 (Correct)")}</option>
                                  <option value={1}>{tLocal("Seçenek 2 (Yanlış)", "Option 2 (Incorrect)")}</option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>

                        {newQuestType === "multiple" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-100">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">{tLocal("A Seçeneği", "A Option")}<strong className="text-rose-600">*</strong></label>
                              <input 
                                type="text" 
                                required
                                placeholder={tLocal("Cevap seçeneği A...", "Answer choice A...")} 
                                value={newQuestOptA} 
                                onChange={(e) => setNewQuestOptA(e.target.value)}
                                className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">{tLocal("B Seçeneği", "B Option")}<strong className="text-rose-600">*</strong></label>
                              <input 
                                type="text" 
                                required
                                placeholder={tLocal("Cevap seçeneği B...", "Answer choice B...")} 
                                value={newQuestOptB} 
                                onChange={(e) => setNewQuestOptB(e.target.value)}
                                className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">{tLocal("C Seçeneği (Opsiyonel)", "C Option (Optional)")}</label>
                              <input 
                                type="text" 
                                placeholder={tLocal("Cevap seçeneği C...", "Answer choice C...")} 
                                value={newQuestOptC} 
                                onChange={(e) => setNewQuestOptC(e.target.value)}
                                className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 block">{tLocal("D Seçeneği (Opsiyonel)", "D Option (Optional)")}</label>
                              <input 
                                type="text" 
                                placeholder={tLocal("Cevap seçeneği D...", "Answer choice D...")} 
                                value={newQuestOptD} 
                                onChange={(e) => setNewQuestOptD(e.target.value)}
                                className="w-full bg-slate-50 text-xs p-2 rounded border border-slate-200"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowQuestionForm(false)} className="px-4 py-2 bg-white text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer">
                            İptal
                          </button>
                          <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer">
                            Soruyu Sınava Ekle
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Brand Videos & Content list layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left side list of brand videos */}
                      <div className="lg:col-span-5 space-y-3">
                        <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-mono">Eğitim Videoları ({videos.filter(v => v.brand.toLowerCase() === selectedBrand.name.toLowerCase()).length})</span>
                        
                        <div className="space-y-3">
                          {videos.filter(v => v.brand.toLowerCase() === selectedBrand.name.toLowerCase()).length === 0 ? (
                            <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                              Henüz bu marka için yüklenmiş eğitim bulunmamaktadır.
                            </div>
                          ) : (
                            videos.filter(v => v.brand.toLowerCase() === selectedBrand.name.toLowerCase()).map((v) => (
                              <div
                                key={v.id}
                                onClick={() => { setSelectedVideo(v); setQuizResult(null); setQuizAnswers({}); setIssuedCert(null); }}
                                className={`p-4 rounded-xl border cursor-pointer text-left transition flex gap-3 items-start ${
                                  selectedVideo?.id === v.id
                                    ? "bg-emerald-50 border-emerald-400 shadow-xs"
                                    : "bg-white border-slate-200/80 hover:bg-slate-50"
                                }`}
                              >
                                <img src={v.image_url} alt={translateEntity(v, "title")} className="w-16 h-16 rounded-md object-cover bg-slate-100 border border-slate-200/50 shrink-0 select-none" referrerPolicy="no-referrer" />
                                <div className="space-y-1">
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">{v.category}</span>
                                  <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{translateEntity(v, "title")}</h5>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{v.duration} • {v.instructor}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right side Active Video display, Quiz assessment & Certification Frame */}
                      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-xs">
                        {selectedVideo ? (
                          <div className="space-y-6">
                            
                            {/* Video detail block */}
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold">{selectedVideo.category}</span>
                                {isManufacturer && (
                                  <button
                                    onClick={() => deleteVideo(selectedVideo.id)}
                                    className="text-rose-450 text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Müfredattan Çıkar
                                  </button>
                                )}
                              </div>
                              <h4 className="text-base sm:text-lg font-extrabold text-slate-955 mt-1">{translateEntity(selectedVideo, "title")}</h4>
                              <p className="text-xs text-slate-650 mt-1 lines-clamp-4 leading-relaxed">{translateEntity(selectedVideo, "description")}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-mono">{tLocal("Eğitmen:", "Instructor:")}<strong>{selectedVideo.instructor}</strong></p>
                            </div>

                            {/* Simulated Video Frame Component with Play controls */}
                            <div className="bg-slate-950 border border-slate-800 aspect-video rounded-xl overflow-hidden flex flex-col justify-center items-center text-center p-6 relative group shadow-sm">
                              <div className="absolute inset-x-0 top-0 bg-slate-900/40 backdrop-blur-xs p-3 flex justify-between items-center text-[9px] text-slate-300 pointer-events-none">
                                <span>{tLocal("Lisanslı Video Akışı", "Licensed Video Stream")}</span>
                                <span className="text-emerald-400 font-bold font-mono">● {selectedVideo.duration} {tLocal("DERS SÜRESİ", "COURSE DURATION")}</span>
                              </div>
                              
                              {/* Overlay background placeholder with play button */}
                              <div className="h-12 w-12 bg-white/10 group-hover:bg-emerald-600/20 text-white rounded-full flex items-center justify-center transition shadow-md border border-white/20 hover:scale-105 cursor-pointer">
                                <Play className="h-6 w-6 text-emerald-400 fill-emerald-400" />
                              </div>
                              <p className="font-bold text-xs text-slate-100 mt-3">{translateEntity(selectedVideo, "title")}</p>
                              <p className="text-[9px] text-slate-400 max-w-xs mt-1 leading-normal select-none">
                                Video ders tescilli usta kütüphanesidir. Sınava girmek için videoyu ve dökümanı dikkatle inceleyin.
                              </p>
                              
                              <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 p-2 flex items-center justify-between pointer-events-none">
                                <div className="h-1 bg-emerald-500 w-2/3 rounded-full" />
                                <span className="text-[9px] text-slate-300 font-mono font-bold">{tLocal("100% İzleme Standardı", "100% Viewing Standard")}</span>
                              </div>
                            </div>

                            {/* EXAMINATION PORTAL */}
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                              <div className="flex items-center gap-1.5 border-b border-rose-100 border-slate-200 pb-2">
                                <Award className="h-5 w-5 text-emerald-600" />
                                <h4 className="font-black text-sm text-slate-900 font-sans tracking-tight">{tLocal("Akademi Eğitim Sonu Sertifikasyon Sınavı", "Academy Course-End Certification Exam")}</h4>
                              </div>

                              {questions.filter(q => q.video_id === selectedVideo.id).length === 0 ? (
                                <div className="text-center p-4 text-slate-500 text-xs">
                                  Henüz bu video için bir değerlendirme sınavı atanmamıştır.
                                </div>
                              ) : (
                                <div className="space-y-5">
                                  {questions.filter(q => q.video_id === selectedVideo.id).map((q, idx) => (
                                    <div key={q.id} className="space-y-2 text-xs bg-white p-3.5 rounded-xl border border-slate-100 shadow-xs">
                                      <p className="font-bold text-slate-800 leading-normal">
                                        <span className="text-emerald-700">Soru {idx + 1}:</span> {translateEntity(q, "question_text")}
                                      </p>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {(() => {
                                          const optionsList = (language === "en" && q.options_en) ? q.options_en : (q.options_tr || q.options || []);
                                          return optionsList.map((opt: string, optIdx: number) => {
                                            const isSelected = quizAnswers[q.id] === optIdx;
                                            return (
                                              <button
                                                type="button"
                                                key={optIdx}
                                                onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                                                className={`p-2.5 rounded-lg border text-left cursor-pointer transition text-[11px] leading-snug flex items-start gap-1 ${
                                                  isSelected
                                                    ? "bg-emerald-600 border-emerald-600 text-white font-bold"
                                                    : "bg-slate-55 bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                              >
                                                <span className="font-bold uppercase font-mono mr-1">{optIdx === 0 ? "A" : optIdx === 1 ? "B" : optIdx === 2 ? "C" : "D"}.</span>
                                                <span>{opt}</span>
                                              </button>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Action display for Exam outcomes */}
                                  {quizResult === null ? (
                                    <button
                                      type="button"
                                      onClick={() => handleQuizSubmit(selectedVideo.id)}
                                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg shadow-sm font-sans tracking-wide transition cursor-pointer"
                                    >
                                      Sınavı Bitir ve Sertifikamı Düzenle
                                    </button>
                                  ) : (
                                    <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-left shadow-xs">
                                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">{tLocal("Sınav Başarı Karnesi", "Exam Success Report Card")}</span>
                                      <p className="text-base font-black mt-0.5 text-emerald-800">Doğruluk Dereceniz: %{quizResult.score}</p>
                                      
                                      {quizResult.passed ? (
                                        <div className="mt-3 bg-emerald-50 text-emerald-900 p-3 rounded-lg border border-emerald-100 flex items-start gap-2 animate-fade-in">
                                          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                            <strong className="block font-bold">{tLocal("🎉 Sertifika Kazanıldı!", "🎉 Certificate Earned!")}</strong>
                                            Tebrikler, tüm teknik sorulara hatasız cevap vererek üst düzey montaj ve teşhis yetki belgesi almaya hak kazandınız.
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="mt-3 bg-rose-50 text-rose-800 p-3 rounded-lg border border-rose-200 flex items-start gap-2">
                                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                          <div>
                                            <strong className="block font-bold">{tLocal("Başarısız Skor", "Unsuccessful Score")}</strong>
                                            Yetkilendirme lisansı için tüm sorulara doğru cevap vermeniz veya 100% başarı standardına ulaşmanız gerekir. Lütfen dökümanı tekrar inceleyin ve sınavı tekrarlayın.
                                            <button 
                                              type="button" 
                                              onClick={() => { setQuizResult(null); setQuizAnswers({}); }} 
                                              className="mt-2 block underline text-rose-950 font-bold hover:text-rose-900 cursor-pointer text-[10px]"
                                            >
                                              Sınavı Tekrar Başlat &raquo;
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                </div>
                              )}
                            </div>

                            {/* CERTIFICATE BEAUTIFUL UI PANEL */}
                            {issuedCert && (
                              <div className="mt-6 border border-amber-300 bg-amber-50/10 p-5 sm:p-7 rounded-2xl relative shadow-md overflow-hidden text-center select-none animate-reveal font-sans">
                                
                                <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                                
                                <span className="font-mono text-[9px] text-amber-600 font-bold tracking-widest uppercase block mb-3">{tLocal("T.C. LPG PORTAL AKADEMİ SEÇKİN SERTİFİKASI", "T.C. LPG PORTAL ACADEMY ELITE CERTIFICATE")}</span>
                                
                                {/* Luxury borders simulating real certificate frame */}
                                <div className="border border-double border-amber-300 p-6 sm:p-8 rounded-lg bg-white relative">
                                  <div className="absolute top-2.5 right-2.5 left-2.5 bottom-2.5 border border-slate-100 pointer-events-none" />
                                  
                                  <Award className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                                  <h5 className="font-serif text-xl sm:text-2xl text-slate-900 font-extrabold tracking-tight uppercase">{tLocal("BAŞARI VE YETKİLENDİRME SERTİFİKASI", "CERTIFICATE OF ACHIEVEMENT AND AUTHORIZATION")}</h5>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mt-2">TECHNICAL ACCREDITATION RECORD</p>
                                  
                                  <div className="my-6 border-b border-slate-100 pb-5 space-y-1">
                                    <span className="text-[11px] text-slate-500 tracking-wider font-serif">{tLocal("Sayın", "Dear")}</span>
                                    <h6 className="text-lg sm:text-xl font-serif font-black text-emerald-900 underline underline-offset-4 decoration-amber-400 capitalize">{issuedCert.user_name}</h6>
                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                                      LPG PORTAL Akademi bünyesinde verilen ve tescilli kit üreticisi <strong className="font-bold text-slate-900">{issuedCert.brand}</strong>{tLocal("firması tarafından tasarlanan", "designed by the company")}<strong>{issuedCert.course_title}</strong> mesleki kalibratörlük programını başarıyla tamamlamıştır.
                                    </p>
                                  </div>

                                  <div className="flex flex-col sm:flex-row justify-between items-center text-left text-[11px] text-slate-500 font-mono gap-4">
                                    <div>
                                      <span>Marka:</span> <strong className="text-slate-800">{issuedCert.brand}</strong><br />
                                      <span>Tarih:</span> <strong className="text-slate-800">{issuedCert.achievement_date}</strong>
                                    </div>
                                    <div className="text-right sm:text-right">
                                      <span>Kimlik No:</span> <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">{issuedCert.id}</strong><br />
                                      <span className="text-[8px] text-emerald-600">{tLocal("● SİSTEMDE KAYITLI", "● REGISTERED IN SYSTEM")}</span>
                                    </div>
                                  </div>

                                  <div className="mt-6 text-center">
                                    <span className="text-[9px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase font-bold font-mono">{tLocal("LPG PORTAL Yetki Mührü", "LPG PORTAL Authority Stamp")}</span>
                                  </div>
                                </div>

                                <div className="mt-4 flex gap-2.5 justify-center">
                                  <button
                                    onClick={() => window.print()}
                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <Printer className="h-3.5 w-3.5" />
                                    Yazıcıdan Çıktı Al
                                  </button>
                                  <button
                                    onClick={() => setIssuedCert(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                                  >
                                    Kapat
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        ) : (
                          <div className="py-14 text-center text-slate-400 text-xs space-y-2 select-none">
                            <GraduationCap className="h-10 w-10 text-emerald-600/30 mx-auto" />
                            <p>{tLocal("Eğitim videolarına erişmek, sınavları tamamlamak ve sertifika kazanmak için soldan eğitim konusu seçiniz.", "Please select a training topic from the left to access training videos, complete exams, and earn certificates.")}</p>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: PODCAST MERKEZİ (PODCAST CENTRE) */}
        {/* ======================================================== */}
        {activeTab === "podcast" && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            {/* Header section with custom description and Add Podcast button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="bg-teal-550 bg-teal-50 text-teal-800 text-[10px] sm:text-xs font-black tracking-widest px-3 py-1 rounded-full border border-teal-200 uppercase inline-block">
                  🎙️ Dijital Ses Kütüphanesi
                </span>
                <h3 className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight mt-1">
                  Podcast Merkezi
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  LPG sektörüne özel röportajlar, teknik eğitimler, uzman görüşleri ve sektör gündemi.
                </p>
              </div>

              {activeUser && (activeUser.role === "admin" || activeUser.role === "manufacturer") && (
                <button
                  onClick={() => {
                    setShowPodcastForm(!showPodcastForm);
                    setPodFormError("");
                    setPodFormSuccess("");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap shadow-xs cursor-pointer"
                >
                  {showPodcastForm ? <X className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                  <span>{showPodcastForm ? "Formu Kapat" : "Yeni Podcast Yükle"}</span>
                </button>
              )}
            </div>

            {/* ADMIN PENDING APPROVALS & STATISTICS SECTION */}
            {activeUser && activeUser.role === "admin" && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-650 text-emerald-600" />
                    Yönetici Denetim & İstatistikleri
                  </h4>
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-100">
                    Sadece Yönetici
                  </span>
                </div>

                {/* Statistics Box */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-205 border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("TOPLAM DİNLENME SAYISI", "TOTAL LISTENING COUNT")}</span>
                    <span className="text-2xl font-black text-slate-900 block mt-1">
                      {podcasts.reduce((acc, p) => acc + (p.listens || 0), 0)} <span className="text-xs text-slate-400 font-normal">defa</span>
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-205 border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("ORTALAMA DİNLENME SÜRESİ", "AVERAGE LISTENING DURATION")}</span>
                    <span className="text-2xl font-black text-slate-900 block mt-1 mb-1">
                      {(() => {
                        const totalListens = podcasts.reduce((acc, p) => acc + (p.listens || 0), 0);
                        const totalDurationSec = podcasts.reduce((acc, p) => acc + (p.duration_listened_total || 0), 0);
                        if (totalListens === 0) return "0 sn";
                        const avgSec = Math.round(totalDurationSec / totalListens);
                        if (avgSec < 60) return `${avgSec} sn`;
                        return `${Math.round(avgSec / 60)} dk ${avgSec % 60} sn`;
                      })()}
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-205 border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("EN ÇOK DİNLENEN PODCAST", "MOST LISTENED PODCAST")}</span>
                    {(() => {
                      const mostListened = [...podcasts].sort((a, b) => b.listens - a.listens)[0];
                      if (!mostListened) return <span className="text-xs text-slate-400 block mt-1">Veri yok</span>;
                      return (
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-850 text-slate-800 line-clamp-1 max-w-[150px]" title={translateEntity(mostListened, "title")}>
                            {translateEntity(mostListened, "title")}
                          </span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600 shrink-0">
                            {mostListened.listens} dinleme
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Pending Approvals Queue */}
                {(() => {
                  const pending = podcasts.filter(p => p.status === "pending");
                  if (pending.length === 0) return null;
                  return (
                    <div className="space-y-2.5 pt-1.5">
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded inline-block border border-amber-200/50">
                        🔔 Onay Bekleyen Yayın İstekleri ({pending.length})
                      </span>
                      <div className="space-y-2 bg-amber-50/10 border border-amber-250 p-3 rounded-xl border-amber-200">
                        {pending.map(p => (
                          <div key={p.id} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                            <div className="flex gap-2.5 items-center">
                              <img src={p.cover_url} className="h-10 w-10 object-cover rounded-lg shrink-0 border" alt={translateEntity(p, "title")} />
                              <div>
                                <h5 className="font-bold text-xs text-slate-900">{translateEntity(p, "title")}</h5>
                                <p className="text-[10px] text-slate-500">
                                  Yükleyen: <strong className="text-slate-700">{p.publisher_name}</strong>{tLocal("• Konuşmacı:", "• Speaker:")}<strong>{p.speaker}</strong> • Kategori: <strong>{p.category}</strong>
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handleApprovePodcast(p.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition shadow-xs"
                              >
                                Onayla ve Yayınla
                              </button>
                              <button
                                onClick={() => handleDeletePodcast(p.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer transition"
                              >
                                Reddet / Sil
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PODCAST UPLOAD FORM ROW (FADE-IN ANIMATION) */}
            {showPodcastForm && activeUser && (activeUser.role === "admin" || activeUser.role === "manufacturer") && (
              <form onSubmit={handleAddPodcast} className="bg-indigo-50/30 border border-indigo-100 p-6 rounded-2.5xl rounded-3xl space-y-4 animate-fade-in shadow-xs">
                <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2.5">
                  <h4 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-600" />
                    Yeni Podcast Yayını Hazırlama Formu
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowPodcastForm(false)}
                    className="text-indigo-400 hover:text-indigo-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {podFormError && <p className="text-xs text-rose-600 font-black flex items-center gap-1">⚠️ {podFormError}</p>}
                {podFormSuccess && <p className="text-xs text-emerald-600 font-black flex items-center gap-1">✅ {podFormSuccess}</p>}

                {/* FORM FLUID GRID CONTAINER */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Column Fields */}
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">{tLocal("Podcast Başlığı", "Podcast Title")}<strong className="text-rose-600">*</strong></label>
                      <input 
                        type="text"
                        value={podTitle}
                        onChange={(e) => setPodTitle(e.target.value)}
                        placeholder={tLocal("Örn: LPG Teknolojilerinde Sıcaklık Dengeleyici Akıllı Kitler", "e.g. Temperature Compensating Smart Kits in LPG Technologies")}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-200 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">{tLocal("Konuşmacı (Uzman / Kurum)", "Speaker (Specialist / Institution)")}<strong className="text-rose-600">*</strong></label>
                      <input
                        type="text"
                        value={podSpeaker}
                        onChange={(e) => setPodSpeaker(e.target.value)}
                        placeholder={tLocal("Örn: Ahmet Yılmaz (Kalibrasyon Başmühendisi)", "e.g. Ahmet Yilmaz (Head Calibration Engineer)")}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-200 bg-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">Kategori <strong className="text-rose-600">*</strong></label>
                        <select
                          value={podCategory}
                          onChange={(e) => setPodCategory(e.target.value as Podcast["category"])}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-200 bg-white"
                          required
                        >
                          <option value="Sektör Röportajları">{tLocal("🎤 Sektör Röportajları", "🎤 Industry Interviews")}</option>
                          <option value="Teknik Eğitim Podcastleri">{tLocal("🔧 Teknik Eğitim Podcastleri", "🔧 Technical Training Podcasts")}</option>
                          <option value="Kit Üreticisi Yayınları">{tLocal("🏭 Kit Üreticisi Yayınları", "🏭 Kit Manufacturer Broadcasts")}</option>
                          <option value="Usta Deneyimleri">👨🔧 Usta Deneyimleri</option>
                          <option value="Sektör Gündemi">{tLocal("📈 Sektör Gündemi", "📈 Industry Agenda")}</option>
                          <option value="LPG Teknoloji Sohbetleri">🚗 LPG Teknoloji Sohbetleri</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">{tLocal("Süre (Dakika:Saniye)", "Duration (Minutes:Seconds)")}<strong className="text-rose-600">*</strong></label>
                        <input
                          type="text"
                          value={podDuration}
                          onChange={(e) => setPodDuration(e.target.value)}
                          placeholder={tLocal("Örn: 18:45", "e.g. 18:45")}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-300 border-slate-200 bg-white"
                          required
                        />
                        <span className="text-[9px] text-slate-400 block mt-0.5">{tLocal("Format: MM:SS (Örn: 08:30)", "Format: MM:SS (e.g. 08:30)")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">{tLocal("Açıklama", "Description")}<strong className="text-rose-600">*</strong></label>
                      <textarea
                        value={podDesc}
                        onChange={(e) => setPodDesc(e.target.value)}
                        placeholder={tLocal("Dinleyicilere podcast içeriği ve ele alınan teknik konular hakkında kısa bir açıklama sunun.", "Provide listeners with a brief description of the podcast content and the technical topics discussed.")}
                        rows={3}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-200 bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Image and File attachments */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">{tLocal("Kapak Görseli Linki", "Cover Image Link")}<strong className="text-rose-600">*</strong></label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={podCoverUrl}
                          onChange={(e) => setPodCoverUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-205 border-slate-200 bg-white"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const unsp = [
                              "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400",
                              "https://images.unsplash.com/photo-1484755560695-a4c73004ffd6?w=400",
                              "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400",
                              "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=400",
                              "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=400",
                              "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400"
                            ];
                            const randomImg = unsp[Math.floor(Math.random() * unsp.length)];
                            setPodCoverUrl(randomImg);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-150 text-indigo-700 border border-indigo-200 font-bold px-3 text-[10px] rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap"
                        >
                          Rastgele Kapak Seç
                        </button>
                      </div>
                      {podCoverUrl && (
                        <div className="mt-1 flex gap-2 items-center">
                          <img src={podCoverUrl} className="h-10 w-10 rounded-lg object-cover border" alt={tLocal("Kapak önizleme", "Cover preview")} />
                          <span className="text-[10px] text-slate-500 font-mono">{tLocal("Görsel seçildi ✓", "Image selected ✓")}</span>
                        </div>
                      )}
                    </div>

                    {/* DRAG AND DROP AUDIO FILE UPLOAD */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ses Dosyası Yükleme (MP3, WAV, M4A) <strong className="text-rose-600">*</strong>
                      </label>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            const file = e.dataTransfer.files[0];
                            const ext = file.name.split(".").pop()?.toLowerCase();
                            if (ext && ["mp3", "wav", "m4a"].includes(ext)) {
                              if (file.size <= 200 * 1024 * 1024) {
                                setUploadedFileName(file.name);
                                setUploadedFileSize(file.size);
                                const blobUrl = URL.createObjectURL(file);
                                setPodAudioUrl(blobUrl);
                                setPodFormError("");
                              } else {
                                setPodFormError("Dosya boyutu 200 MB sınırını aşamaz.");
                              }
                            } else {
                              setPodFormError("Desteklenmeyen dosya biçimi. Yalnızca MP3, WAV veya M4A yükleyebilirsiniz.");
                            }
                          }
                        }}
                        className={`border-2 border-dashed p-5 rounded-2xl text-center transition cursor-pointer ${
                          isDragging ? "border-indigo-650 border-indigo-500 bg-indigo-50/50" : "border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          id="pod-audio-file"
                          type="file"
                          accept=".mp3,.wav,.m4a"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const ext = file.name.split(".").pop()?.toLowerCase();
                              if (ext && ["mp3", "wav", "m4a"].includes(ext)) {
                                if (file.size <= 200 * 1024 * 1024) {
                                  setUploadedFileName(file.name);
                                  setUploadedFileSize(file.size);
                                  const blobUrl = URL.createObjectURL(file);
                                  setPodAudioUrl(blobUrl);
                                  setPodFormError("");
                                } else {
                                  setPodFormError("Dosya boyutu 200 MB sınırını aşamaz.");
                                }
                              } else {
                                setPodFormError("Desteklenmeyen dosya biçimi. Yalnızca MP3, WAV veya M4A yüklenebilir.");
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <label htmlFor="pod-audio-file" className="block cursor-pointer space-y-1">
                          <UploadCloud className="h-7 w-7 text-slate-400 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">{tLocal("Dosyaları buraya sürükleyin veya göz atın", "Drag files here or browse")}</p>
                          <p className="text-[10px] text-slate-400">Desteklenen: MP3, WAV, M4A (Maks. 200 MB)</p>
                        </label>
                      </div>

                      {uploadedFileName && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border flex items-center justify-between animate-fade-in">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 text-xs text-[10px] font-mono uppercase">
                              {uploadedFileName.split(".").pop()}
                            </span>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-800 truncate" title={uploadedFileName}>
                                {uploadedFileName}
                              </p>
                              <p className="text-[9px] text-slate-500 font-mono">
                                {(uploadedFileSize! / (1024 * 1024)).toFixed(2)} MB • Yüklemeye hazır ✓
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFileName(null);
                              setUploadedFileSize(null);
                              setPodAudioUrl("");
                            }}
                            className="text-slate-400 hover:text-rose-600 transition shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPodcastForm(false)}
                    className="bg-slate-100 hover:bg-slate-205 border border-slate-200 text-slate-750 font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-6 rounded-xl transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>{tLocal("Yüklemeyi Tamamla", "Complete Upload")}</span>
                  </button>
                </div>
              </form>
            )}

            {/* SELECTION OF SELECTED DETAILED PODCAST WITH BUILT-IN AUDIO PLAYER */}
            {selectedPodcast && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-teal-500/10 via-transparent to-transparent pointer-events-none" />
                
                {/* Back button */}
                <div className="flex justify-between items-center relative z-10">
                  <button
                    onClick={() => setSelectedPodcast(null)}
                    className="text-slate-400 hover:text-white font-bold text-xs flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full transition cursor-pointer border border-white/5"
                  >
                    ← Listeye Geri Dön
                  </button>

                  <span className="text-[10px] bg-teal-500/15 text-teal-300 font-black tracking-widest px-3 py-1 rounded-full border border-teal-500/30 uppercase font-mono">
                    {selectedPodcast.category}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  
                  {/* Left column: Large Cover and Detailed Player */}
                  <div className="space-y-4 flex flex-col justify-center">
                    <div className="relative aspect-video rounded-2xl overflow-hidden group border border-white/5 shadow-inner">
                      <img
                        src={selectedPodcast.cover_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        alt={translateEntity(selectedPodcast, "title")}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">{tLocal("KONUŞMACI / YAYINCI", "SPEAKER / PUBLISHER")}</span>
                          <h4 className="font-bold text-sm text-white">{selectedPodcast.speaker}</h4>
                        </div>
                      </div>
                    </div>

                    {/* MODERN INTERACTIVE AUDIO PLAYER (▶️ Play, ⏸️ Pause, ⏩ Fast Forward, ⏪ Rewind) */}
                    <div className="bg-slate-950/50 backdrop-blur-md p-4 sm:p-5 rounded-2.5xl rounded-3xl border border-white/5 space-y-3">
                      {/* Tracking playing status */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                          {playingId === selectedPodcast.id && isPlaying ? (
                            <>
                              <span className="flex h-2 w-2 relative shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              Şu An Oynatılıyor
                            </>
                          ) : (
                            <span className="text-slate-500">{tLocal("Oynatmaya Hazır", "Ready to Play")}</span>
                          )}
                        </span>
                        <span>{selectedPodcast.duration}</span>
                      </div>

                      {/* Seekable custom slider */}
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={playingId === selectedPodcast.id ? currentTime : 0}
                          onChange={handleSeek}
                          disabled={playingId !== selectedPodcast.id}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>
                            {playingId === selectedPodcast.id 
                              ? `${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, "0")}`
                              : "0:00"
                            }
                          </span>
                          <span>
                            {playingId === selectedPodcast.id && duration
                              ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
                              : selectedPodcast.duration
                            }
                          </span>
                        </div>
                      </div>

                      {/* Controllers row: ⏪ Rewind, Play/Pause, ⏩ Fast Forward */}
                      <div className="flex justify-center items-center gap-6 pt-1">
                        <button
                          onClick={handleRewind}
                          disabled={playingId !== selectedPodcast.id}
                          className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="15 Saniye Geri Sar"
                        >
                          <SkipBack className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => handlePlayPodcast(selectedPodcast)}
                          className={`p-4 rounded-full text-slate-950 font-black transition cursor-pointer scale-110 active:scale-95 ${
                            playingId === selectedPodcast.id && isPlaying 
                              ? "bg-amber-400 hover:bg-amber-500 text-slate-950" 
                              : "bg-emerald-500 hover:bg-emerald-600 text-white"
                          }`}
                          title={playingId === selectedPodcast.id && isPlaying ? "Duraklat" : "Oynat"}
                        >
                          {playingId === selectedPodcast.id && isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </button>

                        <button
                          onClick={handleForward}
                          disabled={playingId !== selectedPodcast.id}
                          className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title={tLocal("15 Saniye İleri Sar", "15 Seconds Fast Forward")}
                        >
                          <SkipForward className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Sound Controller bar (Volume and Muted) */}
                      <div className="flex items-center gap-2 justify-center pt-2 border-t border-white/5">
                        <button onClick={handleMuteToggle} className="text-slate-400 hover:text-white transition">
                          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 font-mono w-6">
                          {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Content details, Favorite toggle and Sharing */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight leading-tight">
                          {translateEntity(selectedPodcast, "title")}
                        </h3>
                        {/* Favoriye Ekle / Kaydet (Add to Favorites) */}
                        <button
                          onClick={() => handleToggleFavorite(selectedPodcast.id)}
                          className="bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/5 transition flex items-center justify-center shrink-0 cursor-pointer"
                          title={favorites.includes(selectedPodcast.id) ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                        >
                          <style>{`
                            .star-active { fill: #f59e0b; color: #f59e0b; }
                            .star-inactive { color: #94a3b8; }
                          `}</style>
                          <svg
                            id="pod-star-icon"
                            data-testid="star-icon"
                            style={{ width: "20px", height: "20px" }}
                            className={favorites.includes(selectedPodcast.id) ? "star-active" : "star-inactive"}
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            strokeWidth="2.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("YAYINLAYAN KURULUŞ", "PUBLISHING ORGANIZATION")}</span>
                          <span className="text-xs font-extrabold text-white">{selectedPodcast.publisher_name}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("YAYIN TARİHİ", "PUBLISH DATE")}</span>
                          <span className="text-xs font-mono text-slate-300">{selectedPodcast.created_at}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">YAYIN FORMATI</span>
                          <span className="text-xs font-mono text-emerald-400">{tLocal("Yüksek Kalite Stereo", "High Quality Stereo")}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("TOPLAM DİNLENME", "TOTAL LISTENS")}</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">{selectedPodcast.listens || 32} dinlenme</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-350 leading-relaxed text-slate-300">
                        {translateEntity(selectedPodcast, "description")}
                      </p>
                    </div>

                    {/* SOCIAL SHARING BUTTONS */}
                    <div className="space-y-2 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{tLocal("PODCASTİ SOSYAL MEDYADA PAYLAŞ", "SHARE PODCAST ON SOCIAL MEDIA")}</span>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* WhatsApp share */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${translateEntity(selectedPodcast, "title")} - LPG PORTAL Podcast Merkezinde Dinle: ${window.location.href}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-bold text-[10px] py-1.5 px-3 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-xs mr-0.5">💬</span> WhatsApp
                        </a>

                        {/* X / Twitter share */}
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${translateEntity(selectedPodcast, "title")} - LPG PORTAL Podcasti #lpg #otogaz`)}&url=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-xs mr-0.5">𝕏</span> X (Twitter)
                        </a>

                        {/* LinkedIn Share */}
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://lpgportal.com/podcasts/" + selectedPodcast.id)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#0077B5]/10 hover:bg-[#0077B5]/20 border border-[#0077B5]/30 text-[#0077B5] font-bold text-[10px] py-1.5 px-3 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-xs mr-0.5">💼</span> LinkedIn
                        </a>

                        {/* Facebook Share */}
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] font-bold text-[10px] py-1.5 px-3 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="text-xs mr-0.5">👥</span> Facebook
                        </a>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* FILTERS & SEARCH ROW */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-205 border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              
              {/* Text Search element */}
              <div className="relative md:col-span-4">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={podSearch}
                  onChange={(e) => setPodSearch(e.target.value)}
                  placeholder={tLocal("Başlık, açıklama veya konuşmacı ara...", "Search title, description or speaker...")}
                  className="w-full text-xs bg-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-205 border-slate-200 font-sans focus:ring-1 focus:ring-emerald-500"
                />
                {podSearch && (
                  <button onClick={() => setPodSearch("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-650 text-xs">
                    Temizle
                  </button>
                )}
              </div>

              {/* Category selector dropdown */}
              <div className="md:col-span-5 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-550 text-slate-500 shrink-0 select-none">Kategori:</span>
                <select
                  value={selectedPodCategory}
                  onChange={(e) => setSelectedPodCategory(e.target.value)}
                  className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-205 border-slate-200"
                >
                  <option value="Tümü">All / Hepsi</option>
                  <option value="Sektör Röportajları">{tLocal("🎤 Sektör Röportajları", "🎤 Industry Interviews")}</option>
                  <option value="Teknik Eğitim Podcastleri">{tLocal("🔧 Teknik Eğitim Podcastleri", "🔧 Technical Training Podcasts")}</option>
                  <option value="Kit Üreticisi Yayınları">{tLocal("🏭 Kit Üreticisi Yayınları", "🏭 Kit Manufacturer Broadcasts")}</option>
                  <option value="Usta Deneyimleri">👨🔧 Usta Deneyimleri</option>
                  <option value="Sektör Gündemi">{tLocal("📈 Sektör Gündemi", "📈 Industry Agenda")}</option>
                  <option value="LPG Teknoloji Sohbetleri">🚗 LPG Teknoloji Sohbetleri</option>
                </select>
              </div>

              {/* Show only favorites toggle */}
              <div className="md:col-span-3 flex justify-end">
                <button
                  id="btn-favorites-filter"
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`w-full md:w-auto text-xs font-bold py-2.5 px-4 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    showOnlyFavorites 
                      ? "bg-amber-500 border-amber-600 text-slate-950 font-extrabold" 
                      : "bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {showOnlyFavorites ? "★ Favoriler Filtrelendi" : "☆ Sadece Favorilerim"}
                </button>
              </div>

            </div>

            {/* PODCAST CARDS GRID DISPLAY */}
            {(() => {
              // Filter active approved podcasts
              const filtered = podcasts.filter(p => {
                // Ensure approved to regular users. Pending podcasts only visible if user is admin
                const isApproved = p.status === "approved";
                const isAdminSeeingPending = activeUser?.role === "admin";
                if (!isApproved && !isAdminSeeingPending) return false;

                // Match Category
                if (selectedPodCategory !== "Tümü" && p.category !== selectedPodCategory) return false;

                // Match Favorites
                if (showOnlyFavorites && !favorites.includes(p.id)) return false;

                // Match query
                if (podSearch) {
                  const query = podSearch.toLowerCase();
                  const inTitle = translateEntity(p, "title").toLowerCase().includes(query);
                  const inDesc = translateEntity(p, "description").toLowerCase().includes(query);
                  const inSpk = p.speaker.toLowerCase().includes(query);
                  const inPub = p.publisher_name.toLowerCase().includes(query);
                  return inTitle || inDesc || inSpk || inPub;
                }

                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 bg-slate-50 border rounded-2.5xl rounded-3xl border-slate-200">
                    <Headphones className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">{tLocal("Aranan kriterlere uygun podcast bulunamadı.", "No podcasts found matching the searched criteria.")}</p>
                    {showOnlyFavorites && (
                      <button 
                        onClick={() => setShowOnlyFavorites(false)}
                        className="text-xs text-indigo-650 hover:underline mt-1 font-bold text-indigo-600 cursor-pointer"
                      >
                        Tümünü görmek için favori filtresini kaldırın.
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
                  {filtered.map((pod) => {
                    const isFav = favorites.includes(pod.id);
                    const isCurrentlyPlaying = playingId === pod.id && isPlaying;
                    return (
                      <div 
                        id={`pod-card-${pod.id}`}
                        key={pod.id} 
                        className={`bg-white rounded-3xl border transition duration-300 hover:shadow-md flex flex-col justify-between overflow-hidden relative ${
                          isCurrentlyPlaying ? "border-emerald-500 ring-1 ring-emerald-500/50" : "border-slate-100"
                        }`}
                      >
                        <div>
                          {/* Card top banner image */}
                          <div className="relative aspect-video w-full overflow-hidden shrink-0">
                            <img src={pod.cover_url} className="w-full h-full object-cover" alt={translateEntity(pod, "title")} />
                            
                            {/* Overlay category badge */}
                            <span className="absolute top-3 left-3 text-[9px] font-black tracking-wider uppercase text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                              {pod.category}
                            </span>

                            {/* Status badge for pending approval */}
                            {pod.status === "pending" && (
                              <span className="absolute top-3 right-3 text-[9px] font-black uppercase text-slate-950 bg-amber-400 px-2 py-0.5 rounded border border-amber-500">
                                Onay Bekliyor
                              </span>
                            )}

                            {/* Floating Favorite icon button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(pod.id);
                              }}
                              className="absolute bottom-3 right-3 p-1.5 rounded-full bg-slate-950/80 backdrop-blur-xs text-white border border-white/10 hover:scale-110 transition cursor-pointer"
                              title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                            >
                              <svg 
                                style={{ width: "14px", height: "14px" }} 
                                className={isFav ? "star-active" : "text-white"} 
                                viewBox="0 0 24 24" 
                                fill={isFav ? "#f59e0b" : "none"} 
                                stroke={isFav ? "#f59e0b" : "currentColor"} 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                          </div>

                          {/* Detail block */}
                          <div className="p-4 sm:p-5 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                              <span className="flex items-center gap-0.5 font-bold text-slate-500">
                                <User className="h-3 w-3" />
                                {pod.speaker}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 font-semibold text-slate-500">
                                <Clock className="h-3 w-3" />
                                {pod.duration} dk
                              </span>
                            </div>

                            <h4 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer" onClick={() => setSelectedPodcast(pod)}>
                              {pod.title}
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {pod.description}
                            </p>
                          </div>
                        </div>

                        {/* Action footer */}
                        <div className="px-4 pb-4.5 pt-0 border-t border-slate-50 flex items-center justify-between sm:gap-2">
                          <span className="text-[9px] text-slate-400 font-bold block truncate max-w-[150px]">
                            Kuruluş: <strong className="text-slate-600 block sm:inline">{pod.publisher_name}</strong>
                          </span>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedPodcast(pod)}
                              className="bg-slate-100 hover:bg-slate-205 text-slate-700 font-bold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 cursor-pointer transition whitespace-nowrap"
                            >
                              Detayları Gör
                            </button>
                            <button
                              onClick={() => handlePlayPodcast(pod)}
                              className={`font-extrabold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition flex items-center gap-1 whitespace-nowrap ${
                                isCurrentlyPlaying 
                                  ? "bg-amber-400 hover:bg-amber-500 text-slate-950" 
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                              }`}
                            >
                              {isCurrentlyPlaying ? (
                                <>
                                  <Pause className="h-3 w-3" />
                                  <span>Durdur</span>
                                </>
                              ) : (
                                <>
                                  <Play className="h-3 w-3" />
                                  <span>Oynat</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PORTAL JOBS CENTER (LPG SEKTÖR İŞ İLANLARI) */}
        {/* ======================================================== */}
        {activeTab === "careers" && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 font-sans tracking-tight flex items-center gap-1.5">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  LPG Sektörü Kurumsal Kariyer ve Eleman Arama Havuzu
                </h3>
                <p className="text-xs text-slate-500">
                  LPG Yetkili bayileri, servis istasyonları ve kit üreticilerinin usta, mühendis, teknik tecrübeli eleman ilanları paneli.
                </p>
              </div>

              {/* Only AUTHORIZED roles see the option to post, block is checked dynamically too */}
              <button
                onClick={() => {
                  setShowJobForm(!showJobForm);
                  setEditingJobId(null);
                  if (activeUser) {
                    if (activeUser.company_name) {
                      setJobFirma(activeUser.company_name);
                    } else {
                      setJobFirma(activeUser.name);
                    }
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>{tLocal("Yeni İlan Yayınla", "Publish New Job")}</span>
              </button>
            </div>

            {/* Unauthenticated / Unauthorized block triggers standard message output */}
            {/* User Request specifies authorized is only: Firma (dealer) & Kit Üreticisi (manufacturer) */}
            {showJobForm && !canPublishJobs && (
              <div className="p-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-slate-900 rounded-2xl flex items-start gap-3 animate-fade-in my-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5 font-sans">
                  <strong className="font-black text-rose-700 block uppercase tracking-wider">{tLocal("Yetkisiz Erişim Sınırı", "Unauthorized Access Limit")}</strong>
                  <p className="font-semibold text-rose-900 leading-relaxed text-xs">
                    {activeUser ? (
                      activeUser.membership_status === "Pasif" ? (
                        "Üyeliğiniz şu anda PASİF konumdadır. Pasif üyeler sistemde yeni iş ilanı yayınlayamaz. Hesabınızı aktifleştirmek için lütfen Üyelik Paneline giderek durumunuzu aktif hale getirin."
                      ) : activeUser.membership_status === "Onay Bekliyor" ? (
                        "Kurumsal üyeliğiniz şu anda ONAY BEKLİYOR durumundadır. Ön onay süreci tamamlandığında iş ilanları yayınlayabilirsiniz."
                      ) : (
                        `Mevcut hesap durumunuz (${activeUser.membership_status}) sebebiyle iş ilanı yayınlamanız engellenmiştir.`
                      )
                    ) : (
                      "Bu alan için yetkili değilsiniz. İş ilanı yayınlama yetkisi yalnızca aktif Kurumsal ve Kit Üreticisi hesaplarına tanımlanmıştır."
                    )}
                  </p>
                  <div className="pt-2 flex gap-2">
                    {!activeUser && (
                      <button onClick={() => onNavigateToTab("giris")} className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white py-1 px-3.5 rounded transition cursor-pointer">
                        Kurumsal Üye Girişi &raquo;
                      </button>
                    )}
                    {activeUser && (activeUser.membership_status === "Pasif" || activeUser.membership_status === "Askıya Alındı") && (
                      <button onClick={() => onNavigateToTab("giris")} className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3.5 rounded transition cursor-pointer">
                        Hesap Panelini Aç &raquo;
                      </button>
                    )}
                    <button onClick={() => { setShowJobForm(false); }} className="text-[10px] font-bold bg-white border border-rose-200 text-slate-700 py-1 px-3 rounded transition cursor-pointer">
                      Yayıncı Formunu Kapat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Authorized creation / editing form */}
            {showJobForm && canPublishJobs && (
              <form onSubmit={handleJobSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 shadow-inner text-xs">
                <div className="flex justify-between items-center border-b border-slate-250 pb-2">
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-800 font-mono flex items-center gap-1">
                    <Plus className="h-4 w-4 text-emerald-600" />
                    {editingJobId ? "İş İlanını Güncelleme Formu" : "Yeni Kariyer Personel İlanı Havuzu"}
                  </h4>
                  <button type="button" onClick={() => setShowJobForm(false)} className="text-slate-500 hover:text-slate-850">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {jobFormError && <p className="text-xs text-rose-600 font-bold">{jobFormError}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Yayıncı / Firma Adı", "Publisher / Company Name")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: Maslak Otogaz Ltd.", "e.g. Maslak Autogas Ltd.")} 
                      value={jobFirma}
                      onChange={(e) => setJobFirma(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Aranan Pozisyon / Ünvan", "Desired Position / Title")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: İleri Düzey OBD Kalibrasyon Ustası", "e.g. Advanced OBD Calibration Technician")} 
                      value={jobPozisyon}
                      onChange={(e) => setJobPozisyon(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">{tLocal("İş Tanımı ve Kriterler", "Job Description & Criteria")}<strong className="text-rose-600">*</strong></label>
                  <textarea 
                    required
                    rows={4}
                    placeholder={tLocal("Montaj atölyemizde görev alacak, manifold delme, regülatör su devri hatası çözümlerine vakıf, usta belgesi olan eleman aramaktayız...", "We are looking for a staff member who has a technician certificate, to work in our installation workshop, knowledgeable in manifold drilling, regulator water cycle error solutions...")} 
                    value={jobTanim}
                    onChange={(e) => setJobTanim(e.target.value)}
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 focus:outline-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Şehir", "City")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: İstanbul", "e.g. Istanbul")} 
                      value={jobSehir}
                      onChange={(e) => setJobSehir(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("İlçe", "District")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: Sarıyer", "e.g. Sariyer")} 
                      value={jobIlce}
                      onChange={(e) => setJobIlce(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Çalışma Şekli", "Working Type")}<strong className="text-rose-600">*</strong></label>
                    <select
                      value={jobCalisma}
                      onChange={(e: any) => setJobCalisma(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200 cursor-pointer text-slate-700"
                    >
                      <option value={tLocal("Tam Zamanlı", "Full Time")}>{tLocal("Tam Zamanlı", "Full Time")}</option>
                      <option value={tLocal("Yarı Zamanlı", "Part Time")}>{tLocal("Yarı Zamanlı", "Part Time")}</option>
                      <option value="Stajyer">Stajyer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("İrtibat Telefon", "Contact Phone")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: 0532 999 8877", "e.g. 0532 999 8877")} 
                      value={jobTel}
                      onChange={(e) => setJobTel(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">E-posta <strong className="text-rose-600">*</strong></label>
                    <input 
                      type="email" 
                      required
                      placeholder={tLocal("Örn: iletisim@atolyemiz.com", "e.g. contact@ourworkshop.com")} 
                      value={jobEposta}
                      onChange={(e) => setJobEposta(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Maaş Bilgisi (Opsiyonel)", "Salary Information (Optional)")}</label>
                    <input 
                      type="text" 
                      placeholder={tLocal("Örn: SGK + Yemek + 55,000 TL", "e.g. SGK + Food + 55,000 TL")} 
                      value={jobMaas}
                      onChange={(e) => setJobMaas(e.target.value)}
                      className="w-full bg-white p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowJobForm(false)} className="px-4.5 py-2 bg-white text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer">
                    İptal
                  </button>
                  <button type="submit" className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer">
                    {editingJobId ? "Güncelle" : "Yayınla"}
                  </button>
                </div>
              </form>
            )}

            {/* List of Job postings */}
            <div className="space-y-4">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-widest font-mono">AKTİF İLANLAR ({jobs.filter(j => j.status === "Aktif").length})</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => {
                  const alreadyApplied = appliedJobs.includes(job.id);
                  const isOwner = activeUser && (job.owner_id === activeUser.id || activeUser.role === "admin");
                  
                  return (
                    <div 
                      key={job.id} 
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between shadow-xs transition duration-150 ${
                        job.status === "Pasif" 
                          ? "bg-slate-50 border-slate-200 opacity-60 text-slate-400" 
                          : "bg-white hover:border-slate-350 border-slate-200/80 hover:shadow-md"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-1.5">
                          <div>
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                              {job.employment_type}
                            </span>
                            <h4 className="font-black text-sm text-slate-900 mt-2 leading-tight">{job.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-1">{job.company_name} • {job.city}/{job.district}</p>
                          </div>
                          
                          {/* Salary indicator badge */}
                          {job.salary && (
                            <span className="text-xs text-emerald-700 font-black font-mono shrink-0 bg-emerald-50 px-2 py-1 rounded">
                              {job.salary}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-650 leading-relaxed line-clamp-3">{job.description}</p>
                        
                        {/* Interactive contact details */}
                        <div className="bg-slate-50 p-2 text-[10px] text-slate-650 font-mono rounded-lg border border-slate-100 space-y-1">
                          <div>📍 {job.city}, {job.district}</div>
                          <div>📞 Telefon: {job.phone}</div>
                          <div>✉️ E-posta: {job.email}</div>
                          {job.status === "Pasif" && <div className="text-rose-550 text-rose-600 font-bold">{tLocal("⚠️ BU İLAN YAYINDAN KALDIRILMIŞTIR (PASİF)", "⚠️ THIS POSTING HAS BEEN REMOVED (PASSIVE)")}</div>}
                        </div>
                      </div>

                      {/* Controls depending on relationship to owner */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                        
                        {/* Owner / Admin commands: can edit and toggle status */}
                        {isOwner ? (
                          <div className="flex gap-1.5 w-full justify-end">
                            <button
                              type="button"
                              onClick={() => handleToggleJobStatus(job.id)}
                              className={`px-3 py-1.5 rounded-lg font-bold border transition text-[10px] flex items-center gap-1 cursor-pointer ${
                                job.status === "Aktif"
                                  ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {job.status === "Aktif" ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Pasife Al
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  Yayına Al (Aktif)
                                </>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleEditJob(job)}
                              className="px-3 py-1.5 rounded-lg font-black bg-emerald-50 text-emerald-800 border border-emerald-250 hover:bg-emerald-105 border-emerald-200 flex items-center gap-1 text-[10px] cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Düzenle
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job.id)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 flex items-center gap-1 text-[10px] cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Sil
                            </button>
                          </div>
                        ) : (
                          // Standard users apply
                          <button
                            type="button"
                            disabled={alreadyApplied || job.status === "Pasif"}
                            onClick={() => handleApplySimulated(job.id)}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1 cursor-pointer shadow-xs ${
                              alreadyApplied
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                                : job.status === "Pasif"
                                ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-default"
                                : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-800"
                            }`}
                          >
                            {alreadyApplied ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{tLocal("Başvurunuz Ulaştı", "Your Application Received")}</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                                <span>{tLocal("Hemen Başvur", "Apply Now")}</span>
                              </>
                            )}
                          </button>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ADMIN WORKSPACE (YÖNETİCİ GÖSTERGE PANELİ) */}
        {/* ======================================================== */}
        {activeTab === "adminPanel" && activeUser && activeUser.role === "admin" && (
          <div className="space-y-6 animate-fade-in text-xs">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 font-sans tracking-tight flex items-center gap-1.5">
                  <ShieldCheck className="h-5·w-5 text-amber-600" />
                  Eğitim, Sertifika ve Kariyer Yönetim Sistemi
                </h3>
                <p className="text-xs text-slate-500">
                  LPG PORTAL bünyesindeki tüm videoları, sınav sorularını, kazanılan yetki sertifikalarını ve iş ilanlarını tek ekrandan kontrol edin.
                </p>
              </div>

              {/* Add dynamic brand trigger */}
              <button
                onClick={() => setShowBrandForm(!showBrandForm)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <Plus className="h-4 w-4" />
                <span>{tLocal("Yeni Kit Markası Tanımla", "Define New Kit Brand")}</span>
              </button>
            </div>

            {/* BRAND OLUSTURMA FORMU */}
            {showBrandForm && (
              <form onSubmit={handleAddNewBrand} className="bg-amber-50/30 p-5 rounded-2xl border border-amber-250 border-amber-300 space-y-4 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950 font-mono flex items-center gap-1">
                    <Plus className="h-4 w-4 text-amber-600" />
                    Yeni Kit Üretici Markası Ekleme Formu
                  </h4>
                  <button type="button" onClick={() => setShowBrandForm(false)} className="text-amber-800 hover:text-amber-950">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {adminFormError && <p className="text-xs text-rose-600 font-bold">{adminFormError}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Marka Adı", "Brand Name")}<strong className="text-rose-600">*</strong></label>
                    <input 
                      type="text" 
                      required
                      placeholder={tLocal("Örn: Romano / OMVL", "e.g. Romano / OMVL")} 
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-amber-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">{tLocal("Menşei Ülke", "Country of Origin")}</label>
                    <input
                      type="text"
                      placeholder={tLocal("Örn: İtalya", "e.g. Italy")}
                      value={newBrandOrigin}
                      onChange={(e) => setNewBrandOrigin(e.target.value)}
                      className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Kart Tema Rengi</label>
                    <select
                      value={newBrandColor}
                      onChange={(e) => setNewBrandColor(e.target.value)}
                      className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-200 cursor-pointer"
                    >
                      <option value="border-red-500 text-red-600 bg-red-50/20">{tLocal("Kırmızı Tema (BRC gibi)", "Red Theme (like BRC)")}</option>
                      <option value="border-blue-500 text-blue-600 bg-blue-50/20">Mavi Tema (Prins gibi)</option>
                      <option value="border-amber-500 text-amber-600 bg-amber-50/20">{tLocal("Sarı Tema (Zavoli gibi)", "Yellow Theme (like Zavoli)")}</option>
                      <option value="border-emerald-500 text-emerald-600 bg-emerald-50/20">{tLocal("Zümrüt Tema (Lovato gibi)", "Emerald Theme (like Lovato)")}</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowBrandForm(false)} className="px-4.5 py-2 bg-white text-slate-700 font-bold rounded-lg border border-slate-200 cursor-pointer">
                    İptal
                  </button>
                  <button type="submit" className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded-lg cursor-pointer">
                    Kaydet & Markayı Yayınla
                  </button>
                </div>
              </form>
            )}

            {/* Quick Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-1">
                <Video className="h-5 w-5 text-emerald-600 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Toplam Videolar</span>
                <strong className="text-xl font-bold text-slate-900">{videos.length}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-1">
                <Briefcase className="h-5 w-5 text-emerald-600 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">{tLocal("İş İlanları", "Job Postings")}</span>
                <strong className="text-xl font-bold text-slate-900">{jobs.length}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-1">
                <Award className="h-5 w-5 text-emerald-600 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Sertifikalar</span>
                <strong className="text-xl font-bold text-slate-900">{certificates.length}</strong>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center space-y-1">
                <Users className="h-5 w-5 text-emerald-600 mx-auto" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block">Aktif Markalar</span>
                <strong className="text-xl font-bold text-slate-900">{brands.length}</strong>
              </div>
            </div>

            {/* Content monitoring sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left side: Uploaded educational modules grouped by brand */}
              <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 font-mono">{tLocal("Eğitimler ve Videolar", "Trainings & Videos")}</h4>
                  <select
                    value={adminBrandFilter}
                    onChange={(e) => setAdminBrandFilter(e.target.value)}
                    className="bg-slate-50 text-[10px] font-bold p-1 border border-slate-200 rounded font-mono"
                  >
                    <option value="Tümü">{tLocal("Tüm Markalar", "All Brands")}</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {videos
                    .filter(v => adminBrandFilter === "Tümü" || v.brand.toLowerCase() === adminBrandFilter.toLowerCase())
                    .map((v) => (
                      <div key={v.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 border-slate-200 flex justify-between items-start gap-1">
                        <div>
                          <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold uppercase">{v.brand}</span>
                          <h5 className="font-bold text-xs text-slate-900 mt-1">{v.title}</h5>
                          <p className="text-[10px] text-slate-500 mt-0.5">{v.instructor} • {v.category}</p>
                        </div>
                        <button
                          onClick={() => deleteVideo(v.id)}
                          className="bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 p-1.5 rounded transition cursor-pointer shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right side: Issued Certifications logs log list view */}
              <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 font-mono">{tLocal("Verilen Yetkilendirme Belgesi Kayıtları", "Issued Authorization Certificate Records")}</h4>
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{certificates.length} Sertifika</span>
                </div>

                {certificates.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-mono">
                    Henüz sınav geçirerek sertifika hak kazanan bir teknisyen bulunmamaktadır.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {certificates.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-150 border-slate-100 font-mono text-[10px] space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-800 capitalize font-bold">{c.user_name}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 rounded">{c.id}</span>
                        </div>
                        <div className="text-slate-500">
                          <span>Marka: <strong>{c.brand}</strong></span> • <span>{tLocal("Eğitim:", "Training:")}<strong>{c.course_title}</strong></span>
                        </div>
                        <div className="text-[9px] text-slate-400 flex justify-between items-center">
                          <span>Başarı Tarihi: {c.achievement_date}</span>
                          <span className="text-emerald-600 font-bold">{tLocal("● DOĞRULANMIŞ LİSANS", "● VERIFIED LICENSE")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Row showing careers postings inside administrator cockpit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 font-mono pb-2 border-b border-slate-100">
                Yayındaki Sektör İş İlanları Rapor Değerlendirmesi
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-2.5 font-bold text-slate-500">{tLocal("FİRMA ADI", "COMPANY NAME")}</th>
                      <th className="p-2.5 font-bold text-slate-500">{tLocal("ARANAN POZİSYON", "DESIRED POSITION")}</th>
                      <th className="p-2.5 font-bold text-slate-500">{tLocal("ŞEHİR / İLÇE", "CITY / DISTRICT")}</th>
                      <th className="p-2.5 font-bold text-slate-500">{tLocal("HAKEDİŞ MAAŞ", "EARNED SALARY")}</th>
                      <th className="p-2.5 font-bold text-slate-500 text-center">X DURUM</th>
                      <th className="p-2.5 font-bold text-slate-500 text-right">KOMUTLAR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{j.company_name}</td>
                        <td className="p-2.5 text-slate-755 text-slate-700">{j.title}</td>
                        <td className="p-2.5 text-slate-600">{j.city} / {j.district}</td>
                        <td className="p-2.5 text-emerald-700 font-bold">{j.salary || "Hassas (Belirtilmemiş)"}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                            j.status === "Aktif" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleToggleJobStatus(j.id)}
                            className="text-emerald-700 hover:underline bg-slate-100 p-1 rounded cursor-pointer"
                          >
                            Kilit Değiştir
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(j.id)}
                            className="text-rose-600 hover:underline bg-rose-50 p-1 rounded cursor-pointer"
                          >
                            Sil
                          </button>
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

    </div>
  );
}
