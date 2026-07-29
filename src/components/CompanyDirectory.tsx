import React, { useState, useEffect, useMemo } from "react";
import { COMPANIES_DATA } from "../data";
import { Company, Review } from "../types";
import { useLanguage } from "../lib/LanguageContext";
import { 
  MapPin, Search, Star, Phone, Globe, Mail, ChevronRight, 
  MessageSquare, Award, Compass, Plus, Check, Info, ArrowUpDown,
  Bell, Lock, Shield, Settings, RefreshCw, AlertTriangle, AlertCircle, Upload
} from "lucide-react";
import { DbUser, getUsers, saveUsers, getRoleDisplayName, addSystemLog } from "../lib/membership";
import { renderCompanyLogo, getAutoLogoColor, getCompanyInitials } from "../lib/logoUtils";
import { sanitizeHtml, escapeHtml, isPotentialSqlInjection } from "../lib/security";
import { TURKEY_DISTRICTS_DATA } from "../lib/turkey_districts";

interface CompanyDirectoryProps {
  activeUser?: DbUser | null;
  onUpdateActiveUser?: (updatedUser: DbUser) => void;
}

// Helper to determine remaining membership days
const getRemainingDays = (dateStr: string): number => {
  const diffTime = new Date(dateStr).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Turkey 81 Province Capital Coordinates
const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
  "Adana": { lat: 37.00, lng: 35.32 },
  "Adıyaman": { lat: 37.76, lng: 38.27 },
  "Afyonkarahisar": { lat: 38.75, lng: 30.54 },
  "Ağrı": { lat: 39.72, lng: 43.05 },
  "Amasya": { lat: 40.65, lng: 35.83 },
  "Ankara": { lat: 39.93, lng: 32.85 },
  "Antalya": { lat: 36.88, lng: 30.69 },
  "Artvin": { lat: 41.18, lng: 41.82 },
  "Aydın": { lat: 37.84, lng: 27.84 },
  "Balıkesir": { lat: 39.64, lng: 27.88 },
  "Bilecik": { lat: 40.14, lng: 29.98 },
  "Bingöl": { lat: 38.88, lng: 40.49 },
  "Bitlis": { lat: 38.40, lng: 42.11 },
  "Bolu": { lat: 40.73, lng: 31.61 },
  "Burdur": { lat: 37.72, lng: 30.29 },
  "Bursa": { lat: 40.18, lng: 29.06 },
  "Çanakkale": { lat: 40.15, lng: 26.41 },
  "Çankırı": { lat: 40.60, lng: 33.62 },
  "Çorum": { lat: 40.55, lng: 34.95 },
  "Denizli": { lat: 37.77, lng: 29.09 },
  "Diyarbakır": { lat: 37.91, lng: 40.24 },
  "Edirne": { lat: 41.68, lng: 26.56 },
  "Elazığ": { lat: 38.68, lng: 39.22 },
  "Erzincan": { lat: 39.75, lng: 39.49 },
  "Erzurum": { lat: 39.90, lng: 41.27 },
  "Eskişehir": { lat: 39.78, lng: 30.52 },
  "Gaziantep": { lat: 37.06, lng: 37.38 },
  "Giresun": { lat: 40.91, lng: 38.39 },
  "Gümüşhane": { lat: 40.46, lng: 39.48 },
  "Hakkari": { lat: 37.58, lng: 43.74 },
  "Hatay": { lat: 36.20, lng: 36.16 },
  "Isparta": { lat: 37.76, lng: 30.55 },
  "Mersin": { lat: 36.80, lng: 34.63 },
  "İstanbul": { lat: 41.01, lng: 28.97 },
  "İzmir": { lat: 38.42, lng: 27.14 },
  "Kars": { lat: 40.61, lng: 43.10 },
  "Kastamonu": { lat: 41.38, lng: 33.78 },
  "Kayseri": { lat: 38.73, lng: 35.48 },
  "Kırklareli": { lat: 41.73, lng: 27.22 },
  "Kırşehir": { lat: 39.14, lng: 34.16 },
  "Kocaeli": { lat: 40.76, lng: 29.92 },
  "Konya": { lat: 37.87, lng: 32.48 },
  "Kütahya": { lat: 39.42, lng: 29.98 },
  "Malatya": { lat: 38.35, lng: 38.31 },
  "Manisa": { lat: 38.61, lng: 27.43 },
  "Kahramanmaraş": { lat: 37.58, lng: 36.93 },
  "Mardin": { lat: 37.32, lng: 40.72 },
  "Muğla": { lat: 37.21, lng: 28.36 },
  "Muş": { lat: 38.74, lng: 41.50 },
  "Nevşehir": { lat: 38.62, lng: 34.71 },
  "Niğde": { lat: 37.97, lng: 34.68 },
  "Ordu": { lat: 40.98, lng: 37.88 },
  "Rize": { lat: 41.02, lng: 40.52 },
  "Sakarya": { lat: 40.77, lng: 30.40 },
  "Samsun": { lat: 41.29, lng: 36.33 },
  "Siirt": { lat: 37.93, lng: 41.94 },
  "Sinop": { lat: 42.02, lng: 35.15 },
  "Sivas": { lat: 39.75, lng: 37.01 },
  "Tekirdağ": { lat: 40.98, lng: 27.51 },
  "Tokat": { lat: 40.31, lng: 36.55 },
  "Trabzon": { lat: 41.00, lng: 39.72 },
  "Tunceli": { lat: 39.11, lng: 39.54 },
  "Şanlıurfa": { lat: 37.15, lng: 38.79 },
  "Uşak": { lat: 38.68, lng: 29.40 },
  "Van": { lat: 38.50, lng: 43.37 },
  "Yozgat": { lat: 39.81, lng: 34.80 },
  "Zonguldak": { lat: 41.45, lng: 31.79 },
  "Aksaray": { lat: 38.36, lng: 34.03 },
  "Bayburt": { lat: 40.25, lng: 40.22 },
  "Karaman": { lat: 37.17, lng: 33.22 },
  "Kırıkkale": { lat: 39.84, lng: 33.51 },
  "Batman": { lat: 37.88, lng: 41.13 },
  "Şırnak": { lat: 37.51, lng: 42.45 },
  "Bartın": { lat: 41.63, lng: 32.33 },
  "Ardahan": { lat: 41.11, lng: 42.70 },
  "Iğdır": { lat: 39.91, lng: 44.04 },
  "Yalova": { lat: 40.65, lng: 29.27 },
  "Karabük": { lat: 41.20, lng: 32.62 },
  "Kilis": { lat: 36.71, lng: 37.11 },
  "Osmaniye": { lat: 37.07, lng: 36.24 },
  "Düzce": { lat: 40.84, lng: 31.16 }
};

const ALL_81_CITIES = Object.keys(CITY_COORDINATES).sort((a, b) => a.localeCompare(b, "tr"));




// Haversine formula for distance in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Convert latitude & longitude coordinates to visual percentage variables for standard Turkey map
function getMapCoordinates(lat: number, lng: number) {
  // Turkey boundary coordinates
  const minLat = 35.5; // Southernmost
  const maxLat = 42.5; // Northernmost
  const minLng = 25.5; // Westernmost
  const maxLng = 45.0; // Easternmost

  let left = ((lng - minLng) / (maxLng - minLng)) * 100;
  let top = (1 - (lat - minLat) / (maxLat - minLat)) * 100;

  // Clamping within bounds
  left = Math.max(5, Math.min(95, left));
  top = Math.max(5, Math.min(95, top));

  return { left: `${left}%`, top: `${top}%` };
}

// Automatic Geocoder for storing coordinates dynamically
function geocodeAddress(city: string, district: string, address: string) {
  const base = CITY_COORDINATES[city] || { lat: 39.0, lng: 35.0 };
  
  let districtHash = 0;
  const targetDistrict = district || "";
  for (let i = 0; i < targetDistrict.length; i++) {
    districtHash += targetDistrict.charCodeAt(i);
  }
  let addressHash = 0;
  const targetAddress = address || "";
  for (let i = 0; i < targetAddress.length; i++) {
    addressHash += targetAddress.charCodeAt(i);
  }

  // Fractional offsets derived from names to avoid overlaps
  const latOffset = ((districtHash % 120) - 60) / 1100 + ((addressHash % 70) - 35) / 4500;
  const lngOffset = ((addressHash % 120) - 60) / 1100 + ((districtHash % 70) - 35) / 4500;

  return {
    latitude: base.lat + latOffset,
    longitude: base.lng + lngOffset,
    latOffset: latOffset,
    lngOffset: lngOffset
  };
}

export default function CompanyDirectory({ activeUser, onUpdateActiveUser }: CompanyDirectoryProps) {
  const { language, t, translateEntity } = useLanguage();
  const [selectedCity, setSelectedCity] = useState("Hepsi");
  const [selectedBrand, setSelectedBrand] = useState("Hepsi");
  const [selectedDistrict, setSelectedDistrict] = useState("Hepsi");
  const [selectedType, setSelectedType] = useState("Hepsi"); // "Hepsi", "Premium", "Standart"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState<"recommended" | "rating" | "alphabetical" | "proximity">("recommended");
  const [activeTab, setActiveTab] = useState<"list" | "register">("list");

  // Local user list to track admin adjustments and synchronized membership checks
  const [users, setUsers] = useState<DbUser[]>(() => getUsers());

  // Sync active user session locally
  const [sessionUser, setSessionUser] = useState<DbUser | null>(activeUser || null);

  // Simulation mode for expiry notifications [null, 30, 15, 7, 1]
  const [simulatedDaysLeft, setSimulatedDaysLeft] = useState<number | null>(null);

  // Registration feedback notification state
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // User location states
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(() => {
    return localStorage.getItem("lpg_loc_declined") !== "true";
  });

  // Load companies
  const [companyList, setCompanyList] = useState<Company[]>(() => {
    let list: Company[] = [];
    const saved = localStorage.getItem("lpgportal_companies");
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    if (!list || list.length === 0) {
      list = COMPANIES_DATA;
    }

    const currentUsers = getUsers();
    
    // Ensure status properties exist and map dynamic status based on owner expiration
    const initialMapped = list.map(c => {
      let updated = { ...c };
      if (!updated.approved_status) {
        updated.approved_status = "Onaylandı";
      }
      if (!updated.status) {
        updated.status = "Aktif";
      }
      
      // Seed default company owners for demo purposes
      if (updated.id === "c1" && !updated.owner_id) {
        updated.owner_id = "user_dealer_1";
      }
      if (updated.id === "c4" && !updated.owner_id) {
        updated.owner_id = "user_mfr_expired";
      }
      
      if (updated.owner_id) {
        const owner = currentUsers.find(u => u.id === updated.owner_id);
        if (owner) {
          const isOwnerExpired = owner.membership_status === "Süresi Dolmuş" || new Date(owner.membership_end) < new Date();
          if (isOwnerExpired) {
            updated.status = "Pasif";
          } else if (owner.membership_status === "Aktif" && updated.approved_status === "Onaylandı") {
            updated.status = "Aktif";
          }
        }
      }
      return updated;
    });

    localStorage.setItem("lpgportal_companies", JSON.stringify(initialMapped));
    return initialMapped;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
    // Select first active/approved company as fallback
    const firstActive = companyList.find(c => c.approved_status === "Onaylandı" && c.status === "Aktif");
    return firstActive?.id || companyList[0]?.id || null;
  });

  // Review state
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  // New Company Registration Form State
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCity, setNewCompanyCity] = useState("İstanbul");
  const [newCompanyDistrict, setNewCompanyDistrict] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyWebsite, setNewCompanyWebsite] = useState("");
  const [newCompanyDesc, setNewCompanyDesc] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState("");
  const [newCompanyNoLogo, setNewCompanyNoLogo] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const getUserAuthorizedBrands = (): string[] => {
    if (!sessionUser) return [];
    const allCurrentUsers = getUsers();
    const matchedUser = allCurrentUsers.find(u => u.id === sessionUser.id);
    const userToUse = matchedUser || sessionUser;
    return userToUse.working_brands || [];
  };

  const brandsList = [
    "Atiker", "BRC", "Prins", "Lovato", "Landirenzo", "Landi Renzo", "Romano", "OMVL", "Zavoli",
    "AC Stag", "Add Vantage", "AEB", "AFC", "Aldesa", "Alex", "Oto-Gaz Merkezi", "Autogas Italia", "Autronic", 
    "Bedini", "Bigas", "Digitronic", "DT Gaz Sistemi", "E-Gaz", "EGS - EuroGasService", "Econova", "Eko Alma - ESGI", 
    "Elpigaz", "Emer", "Emmegas", "Energia İtalya", "Eurogas", "Europegas", "Fobos", "Fuel Fusion", "Gas On Diesel", 
    "Gasitaly", "GFI Alternative Fuel Systems", "GREENGAS", "Gurtner", "Hana Engineering", "HL Propan", "ICOM", "Impco", 
    "Iwema", "King (AEB)", "KME", "Lo-Gas", "Longas", "LPGTECH", "Marini", "MG Motor Gas", "Micromise", "Mimgas", 
    "NLP LPG", "Plineks", "Ramses", "Retrogaz", "Solaris Diesel", "Spark", "Stako", "Star Gas", "Stefanelli", 
    "Tamona", "Tartarini", "Teleflex", "Tomasetto", "Ultragas", "Versus", "Vialle", "Vikars", "Vogels Autogas System", 
    "Voltran", "XLR8", "Zamel Autogas"
  ];

  // Helper inside component to update state and cache
  const updateCompanyList = (newList: Company[]) => {
    if (sessionUser && sessionUser.role !== "admin") {
      const allowedBrands = getUserAuthorizedBrands();
      const userComps = newList.filter(c => c.owner_id === sessionUser.id);
      for (const comp of userComps) {
        const invalidBrands = comp.featuredBrands.filter(b => !allowedBrands.includes(b));
        if (invalidBrands.length > 0) {
          alert(
            language === "tr"
              ? "Bu kit üreticisi için yetkiniz bulunmamaktadır.\nLütfen üyelik bilgilerinizde kayıtlı LPG markalarını kullanınız.\nMarka güncellemesi yapmak için profil bilgilerinizi güncelleyiniz."
              : "You do not have authorization for this kit manufacturer.\nPlease use the LPG brands registered in your membership details.\nTo update brands, please update your profile details."
          );
          return;
        }
      }
    }
    setCompanyList(newList);
    localStorage.setItem("lpgportal_companies", JSON.stringify(newList));
  };

  // Sync sessionUser state when prop activeUser changes, and sync company visibility statuses immediately
  useEffect(() => {
    if (activeUser) {
      setSessionUser(activeUser);
    } else {
      const saved = localStorage.getItem("lpgportal_active_user");
      if (saved) {
        try { setSessionUser(JSON.parse(saved)); } catch (e) {}
      } else {
        setSessionUser(null);
      }
    }
    setUsers(getUsers());
  }, [activeUser]);

  useEffect(() => {
    if (activeTab === "register") {
      const allowedBrands = getUserAuthorizedBrands();
      const filtered = allowedBrands.filter(b => b !== "Diğer");
      setSelectedBrands(filtered);
    }
  }, [activeTab, sessionUser]);

  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.key === "lpgportal_companies") {
        setCompanyList(customEvent.detail.value);
      }
    };
    window.addEventListener("lpgportal_db_update", handleDbUpdate);
    return () => window.removeEventListener("lpgportal_db_update", handleDbUpdate);
  }, []);

  // Synchronize company statuses whenever user db or company list is parsed
  const syncCompaniesAndUsers = () => {
    const currentUsers = getUsers();
    setUsers(currentUsers);
    
    if (sessionUser) {
      const refreshedSession = currentUsers.find(u => u.id === sessionUser.id);
      if (refreshedSession) {
        setSessionUser(refreshedSession);
      }
    }

    const refreshedCompanies = companyList.map(c => {
      let updated = { ...c };
      if (c.owner_id) {
        const owner = currentUsers.find(u => u.id === c.owner_id);
        if (owner) {
          const isOwnerExpired = owner.membership_status === "Süresi Dolmuş" || new Date(owner.membership_end) < new Date();
          if (isOwnerExpired || owner.membership_status === "Pasif" || owner.membership_status === "Askıya Alındı" || owner.membership_status === "İptal" || owner.membership_status === "Beklemede" || owner.membership_status === "Onay Bekliyor") {
            updated.status = "Pasif" as const;
          } else if (owner.membership_status === "Aktif" && c.approved_status === "Onaylandı") {
            updated.status = "Aktif" as const;
          }
        }
      }
      return updated;
    });

    const hasChanges = JSON.stringify(refreshedCompanies) !== JSON.stringify(companyList);
    if (hasChanges) {
      setCompanyList(refreshedCompanies);
      localStorage.setItem("lpgportal_companies", JSON.stringify(refreshedCompanies));
    }
  };

  useEffect(() => {
    syncCompaniesAndUsers();
  }, [activeTab]);

  // Get dynamic districts lists for dropdown search
  const dynamicDistricts = React.useMemo(() => {
    if (selectedCity === "Hepsi") return ["Hepsi"];
    const districts = TURKEY_DISTRICTS_DATA[selectedCity] || [selectedCity + " Merkez"];
    return ["Hepsi", ...districts];
  }, [selectedCity]);

  // Request browser location permission
  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setSortCriteria("proximity");
          setShowLocationPrompt(false);
        },
        (error) => {
          console.warn("Location permission refused or error: ", error);
          setShowLocationPrompt(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setShowLocationPrompt(false);
    }
  };

  // Filter companies based on criteria
  const filteredCompanies = companyList.filter((comp) => {
    // Session states
    const isOwner = sessionUser && comp.owner_id === sessionUser.id;
    const isAdmin = sessionUser && sessionUser.role === "admin";

    // STRICTLY approved and active companies are visible on the map/list to general users
    const isVisible = isAdmin || isOwner || (comp.approved_status === "Onaylandı" && comp.status === "Aktif");
    if (!isVisible) return false;

    const cityMatch = selectedCity === "Hepsi" || comp.city === selectedCity;
    const brandMatch = selectedBrand === "Hepsi" || comp.featuredBrands.includes(selectedBrand);
    
    const cleanDist = comp.district.toLowerCase();
    const districtMatch = selectedDistrict === "Hepsi" || cleanDist.includes(selectedDistrict.toLowerCase());

    const typeMatch = selectedType === "Hepsi" || 
      (selectedType === "Premium" && comp.premium_status) ||
      (selectedType === "Standart" && !comp.premium_status);

    const textMatch =
      comp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());

    return cityMatch && brandMatch && districtMatch && typeMatch && textMatch;
  });

  // Sort filtered companies
  const sortedCompanies = React.useMemo(() => {
    const arr = [...filteredCompanies];
    if (sortCriteria === "proximity" && userLocation) {
      return arr.sort((a, b) => {
        const latA = a.latitude || (41.01 + (a.latOffset || 0));
        const lngA = a.longitude || (28.97 + (a.lngOffset || 0));
        const latB = b.latitude || (41.01 + (b.latOffset || 0));
        const lngB = b.longitude || (28.97 + (b.lngOffset || 0));

        const distA = calculateDistance(userLocation.lat, userLocation.lng, latA, lngA);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, latB, lngB);
        return distA - distB;
      });
    }

    if (sortCriteria === "rating") {
      return arr.sort((a, b) => b.rating - a.rating);
    }

    if (sortCriteria === "alphabetical") {
      return arr.sort((a, b) => a.company_name.localeCompare(b.company_name, "tr"));
    }

    return arr; // Default database indexing order
  }, [filteredCompanies, sortCriteria, userLocation]);

  const selectedCompany = companyList.find((c) => c.id === selectedCompanyId) || sortedCompanies[0];

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName || !newReviewComment || !selectedCompanyId) return;

    // SQL Injection check
    if (isPotentialSqlInjection(newReviewName) || isPotentialSqlInjection(newReviewComment)) {
      alert("Güvenlik Uyarısı: Şüpheli karakterler tespit edildi.");
      return;
    }

    // XSS Sanitization & HTML Escaping
    const cleanReviewName = escapeHtml(newReviewName.trim());
    const cleanReviewComment = sanitizeHtml(newReviewComment.trim());

    const newReview: Review = {
      id: "r_" + Date.now(),
      userName: cleanReviewName,
      rating: newReviewRating,
      comment: cleanReviewComment,
      created_at: new Date().toISOString().split("T")[0]
    };

    const updated = companyList.map((c) => {
      if (c.id === selectedCompanyId) {
        const updatedReviews = [newReview, ...c.reviews];
        const totalRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const newAvg = parseFloat((totalRating / updatedReviews.length).toFixed(1));
        return {
          ...c,
          reviews: updatedReviews,
          rating: newAvg
        };
      }
      return c;
    });

    updateCompanyList(updated);

    setNewReviewName("");
    setNewReviewComment("");
    setNewReviewRating(5);
  };

  // Form Submission for New Company
  const handleRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName || !newCompanyCity || !newCompanyAddress) return;

    // Security & Role check rules
    const isAdmin = sessionUser && sessionUser.role === "admin";
    const isDealerOrMfr = isAdmin || (sessionUser && (sessionUser.role === "dealer" || sessionUser.role === "manufacturer"));
    const isExpired = !isAdmin && sessionUser && (sessionUser.membership_status === "Süresi Dolmuş" || new Date(sessionUser.membership_end) < new Date());

    if (!sessionUser) {
      alert("Firma ekleyebilmek için lütfen kurumsal hesabınızla üye girişi yapın.");
      return;
    }

    if (!isDealerOrMfr || isExpired) {
      alert("Bu işlem için yetkiniz bulunmamaktadır.");
      return;
    }

    // Validate selectedBrands against user's working_brands
    if (sessionUser.role !== "admin") {
      const allowedBrands = getUserAuthorizedBrands();
      const invalidBrands = selectedBrands.filter(b => !allowedBrands.includes(b));
      if (invalidBrands.length > 0) {
        alert(
          language === "tr"
            ? "Bu kit üreticisi için yetkiniz bulunmamaktadır.\nLütfen üyelik bilgilerinizde kayıtlı LPG markalarını kullanınız.\nMarka güncellemesi yapmak için profil bilgilerinizi güncelleyiniz."
            : "You do not have authorization for this kit manufacturer.\nPlease use the LPG brands registered in your membership details.\nTo update brands, please update your profile details."
        );
        return;
      }
    }

    // SQL Injection check
    if (
      isPotentialSqlInjection(newCompanyName) || 
      isPotentialSqlInjection(newCompanyCity) || 
      isPotentialSqlInjection(newCompanyDistrict) || 
      isPotentialSqlInjection(newCompanyAddress) ||
      isPotentialSqlInjection(newCompanyPhone) ||
      isPotentialSqlInjection(newCompanyEmail) ||
      isPotentialSqlInjection(newCompanyWebsite) ||
      isPotentialSqlInjection(newCompanyDesc)
    ) {
      alert("Güvenlik Uyarısı: Giriş alanlarında geçersiz karakterler tespit edildi.");
      return;
    }
    // XSS Sanitization & HTML Escaping
    const cleanCompanyName = escapeHtml(newCompanyName.trim());
    const cleanAddress = escapeHtml(newCompanyAddress.trim());
    const cleanPhone = escapeHtml(newCompanyPhone.trim());
    const cleanEmail = escapeHtml(newCompanyEmail.trim());
    const cleanWebsite = escapeHtml(newCompanyWebsite.trim());
    const cleanDesc = sanitizeHtml(newCompanyDesc.trim());

    // Trigger deterministic Geocoder
    const geo = geocodeAddress(newCompanyCity, newCompanyDistrict, newCompanyAddress);

    const newComp: Company = {
      id: "c_" + Date.now(),
      company_name: cleanCompanyName,
      city: newCompanyCity,
      district: `${newCompanyDistrict || "Merkez"}`,
      address: cleanAddress,
      phone: cleanPhone || "0 (212) 555 01 00",
      email: cleanEmail || "destek@firmamiz.com",
      website: cleanWebsite || "www.firmamiz.com",
      description: cleanDesc || "TSE standartlarında sızdırmazlık ve montaj garantili teknik servis ofisi.",
      premium_status: isPremium,
      rating: 5.0,
      logo: newCompanyNoLogo ? "" : (newCompanyLogo || (isPremium ? "⭐" : "🔧")),
      logo_type: newCompanyNoLogo ? "auto" : "real",
      featuredBrands: selectedBrands.length > 0 ? selectedBrands : ["Atiker", "BRC"],
      latOffset: geo.latOffset,
      lngOffset: geo.lngOffset,
      latitude: geo.latitude,
      longitude: geo.longitude,
      owner_id: sessionUser.id,
      approved_status: "Onay Bekliyor", // Starts as pending approval
      status: "Pasif", // Passive until approved by admin
      reviews: []
    };

    const updatedList = [newComp, ...companyList];
    updateCompanyList(updatedList);
    setSelectedCompanyId(newComp.id);

    // Reset Form
    setNewCompanyName("");
    setNewCompanyDistrict("");
    setNewCompanyAddress("");
    setNewCompanyPhone("");
    setNewCompanyEmail("");
    setNewCompanyWebsite("");
    setNewCompanyDesc("");
    setNewCompanyLogo("");
    setNewCompanyNoLogo(false);
    setIsPremium(false);
    setSelectedBrands([]);

    // Turn on registration success notice and head back to the directory listing
    setRegistrationSuccess(true);
    setActiveTab("list");
  };

  const handleBrandCheckboxChange = (brand: string) => {
    if (sessionUser && sessionUser.role !== "admin") {
      const allowedBrands = getUserAuthorizedBrands();
      if (!allowedBrands.includes(brand)) {
        alert(
          language === "tr"
            ? "Bu kit üreticisi için yetkiniz bulunmamaktadır.\nLütfen üyelik bilgilerinizde kayıtlı LPG markalarını kullanınız.\nMarka güncellemesi yapmak için profil bilgilerinizi güncelleyiniz."
            : "You do not have authorization for this kit manufacturer.\nPlease use the LPG brands registered in your membership details.\nTo update brands, please update your profile details."
        );
        return;
      }
    }

    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleRenewMembership = () => {
    if (!sessionUser) return;
    const currentUsers = getUsers();
    const updated = currentUsers.map(u => {
      if (u.id === sessionUser.id) {
        // Extend membership by 1 year and set status back to active
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        
        return {
          ...u,
          membership_status: "Aktif" as const,
          membership_end: nextYear.toISOString().split("T")[0]
        };
      }
      return u;
    });
    
    saveUsers(updated);
    setUsers(updated);
    
    const renewed = updated.find(u => u.id === sessionUser.id);
    if (renewed) {
      setSessionUser(renewed);
      if (onUpdateActiveUser) {
        onUpdateActiveUser(renewed);
      }
    }
    
    // Simulate notification removal
    setSimulatedDaysLeft(null);
    alert("Üyeliğiniz başarıyla 1 yıl uzatıldı ve tüm ilanlarınız yeniden aktifleştirildi!");
    
    // Sync company items state
    setTimeout(() => {
      syncCompaniesAndUsers();
    }, 50);
  };

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto">
      
      {/* EXPIRED MEMBERSHIP OR NEAR EXPIRY WARNING BANNERS (OTOMATİK BİLDİRİMLER) */}
      {(() => {
        const daysLeft = sessionUser ? getRemainingDays(sessionUser.membership_end) : 999;
        const matchedNotificationDays = [1, 7, 15, 30];
        const effectiveDaysLeft = simulatedDaysLeft !== null ? simulatedDaysLeft : daysLeft;
        const showExpiryNotification = sessionUser && 
          (sessionUser.role === "dealer" || sessionUser.role === "manufacturer") && 
          (matchedNotificationDays.includes(effectiveDaysLeft));

        if (!showExpiryNotification) return null;

        return (
          <div className="bg-amber-50 border-2 border-amber-250 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-6 animate-fade-in shadow-xs">
            <div className="flex gap-3">
              <div className="bg-amber-100 text-amber-900 p-2.5 rounded-lg self-start">                <h5 className="text-sm font-black text-slate-955 flex items-center gap-1.5">
                  <span>{language === "tr" ? "⚠️ Otomatik Üyelik Bildirimi" : "⚠️ Automated Membership Alert"}</span>
                  <span className="bg-amber-200 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                    {effectiveDaysLeft === 30 ? (language === "tr" ? "30 Gün Kala" : "30 Days Left") : 
                     effectiveDaysLeft === 15 ? (language === "tr" ? "15 Gün Kala" : "15 Days Left") : 
                     effectiveDaysLeft === 7 ? (language === "tr" ? "7 Gün Kala" : "7 Days Left") : 
                     (language === "tr" ? "1 Gün Kala" : "1 Day Left")}
                  </span>
                </h5>
                <p className="text-xs text-slate-700 font-semibold leading-relaxed mt-1">
                  {language === "tr" 
                    ? "Firma üyeliğinizin süresi yakında sona erecektir. Firma Rehberi görünürlüğünüzün devam etmesi için üyeliğinizi yenileyiniz."
                    : "Your company membership is expiring soon. Please renew your membership to maintain your listing in the Company Directory."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRenewMembership}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{language === "tr" ? "Üyeliğimi Yenile" : "Renew My Membership"}</span>
            </button>
          </div>
        );
      })()}

      {/* Registration success feedback notice */}
      {registrationSuccess && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex items-center justify-between gap-3 mb-6 animate-fade-in shadow-xs animate-pulse">
          <div className="flex gap-2.5">
            <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg">
              <Check className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                {language === "tr" ? "Servis Başvurunuz Başarıyla Kaydedildi!" : "Service Registration Submitted Successfully!"}
              </h4>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                {language === "tr" ? (
                  <>Yeni servis kaydınız veri tabanına geçici olarak eklendi. Haritada ve aramalarda görünmesi için şu an <strong>Yönetici Onayı Beklemektedir</strong>.</>
                ) : (
                  <>Your new service listing has been added to the database. It is currently <strong>Pending Administrator Approval</strong> to appear on the map and searches.</>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRegistrationSuccess(false)}
            className="text-slate-400 hover:text-slate-650 font-bold p-1"
          >
            ✕
          </button>
        </div>
      )}



      {/* Location Access Prompt Banner */}
      {showLocationPrompt && !userLocation && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fade-in shadow-xs">
          <div className="flex gap-2.5">
            <div className="bg-emerald-100 text-emerald-800 p-2 rounded-lg self-start">
              <Compass className="h-5 w-5 text-emerald-700 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {language === "tr" 
                  ? "Size en yakın LPG servislerini gösterebilmemiz için konum bilginize erişmek istiyoruz." 
                  : "We would like to access your location to show you the nearest autogas service centers."}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === "tr" 
                  ? "Konum tabanlı mesafe hesaplama ve haritaya odaklanma sistemi için izin vermeyi tercih edebilirsiniz." 
                  : "You can choose to authorize location access for distance calculation and map focusing."}
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={requestUserLocation}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>{language === "tr" ? "📍 Konum İznini Onayla" : "📍 Grant Location Permission"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLocationPrompt(false);
                localStorage.setItem("lpg_loc_declined", "true");
              }}
              className="text-slate-500 hover:text-slate-700 text-xs px-2.5 py-2 font-semibold"
            >
              {language === "tr" ? "Gizle" : "Hide"}
            </button>
          </div>
        </div>
      )}

      {/* Header of Section */}
      <div className="text-center mb-8">
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
          {language === "tr" ? "TSE Belgeli Firma & Bayi Rehberi (81 İl Uyumlu)" : "TSE Certified Installer & Dealer Directory (81 Provinces Complete)"}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          {language === "tr" ? "Yetkili LPG Dönüşüm Servisleri" : "Authorized LPG Conversion Centers"}
        </h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm font-sans">
          {language === "tr"
            ? "Sadece sızdırmazlık test yetkisi, MMO ve liyakat belgelerine sahip lisanslı dönüşüm ve ayar mühendisliği ofislerini listelemekteyiz."
            : "We display only official licensed conversion and engineering offices having regulatory seals, gas leakage test permits, and MMO technical credentials."
          }
        </p>
      </div>

      {/* Grid Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 font-sans">
        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono">
            {language === "tr" ? "Şehir Seçin" : "Select City"}
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedDistrict("Hepsi"); // Reset district filter
            }}
            className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm cursor-pointer"
          >
            <option value="Hepsi">{language === "tr" ? "Hepsi (Tüm İller)" : "All (81 Provinces)"}</option>
            {ALL_81_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono">
            {language === "tr" ? "İlçe Seçin" : "Select District"}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            disabled={selectedCity === "Hepsi"}
            className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer"
          >
            {selectedCity === "Hepsi" ? (
              <option value="Hepsi">{language === "tr" ? "Önce Şehir Seçin" : "Select City First"}</option>
            ) : (
              dynamicDistricts.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono">
            {language === "tr" ? "LPG Marka Yetkisi" : "LPG Brand Certification"}
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm cursor-pointer"
          >
            <option value="Hepsi">{language === "tr" ? "Hepsi" : "All"}</option>
            {brandsList.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono">
            {language === "tr" ? "Firma Tipi" : "Company Type"}
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm cursor-pointer"
          >
            <option value="Hepsi">{language === "tr" ? "Tüm Firmalar" : "All Companies"}</option>
            <option value="Premium">{language === "tr" ? "Premium Yıldızlılar" : "Premium Stars"}</option>
            <option value="Standart">{language === "tr" ? "Standart Servisler" : "Standard Services"}</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono">
            {language === "tr" ? "Detaylı Kelime Ara" : "Detailed Word Search"}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === "tr" ? "Firma ismi, ilçe veya açıklama..." : "Company name, district, or description..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded pl-9 pr-4 p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1.5 font-mono flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> {language === "tr" ? "Sıralama Kriteri" : "Sorting Criterion"}
          </label>
          <div className="flex gap-2">
            <select
              value={sortCriteria}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "proximity" && !userLocation) {
                  requestUserLocation();
                } else {
                  setSortCriteria(val as any);
                }
              }}
              className="w-full bg-white border border-slate-200 rounded p-2 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 shadow-sm cursor-pointer"
            >
              <option value="recommended">{language === "tr" ? "Varsayılan Önerilen" : "Default Recommended"}</option>
              <option value="rating">{language === "tr" ? "Yüksek Müşteri Puanı" : "Highest Customer Rating"}</option>
              <option value="alphabetical">{language === "tr" ? "İsim Alfabesine Göre (A-Z)" : "Alphabetical Order (A-Z)"}</option>
              <option value="proximity">{language === "tr" ? "📍 Konuma Göre Yakınlık Sıralaması" : "📍 Distance Proximity via GPS"}</option>
            </select>
            {!userLocation && (
              <button
                type="button"
                onClick={requestUserLocation}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-350 p-2 rounded text-xs font-bold transition flex items-center whitespace-nowrap gap-1 cursor-pointer text-slate-800"
              >
                📍 {language === "tr" ? "GPS Aktifleştir" : "Enable GPS"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Company Card list & Register Tab Switch (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Tab Button Headers */}
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <div className="flex gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "list"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                🔍 {language === "tr" ? `Servis Listesi (${sortedCompanies.length})` : `Service Centers (${sortedCompanies.length})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                🏢 {language === "tr" ? "Yeni Firma Ekle" : "Add New Center"}
              </button>
            </div>
          </div>

          {activeTab === "list" && (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 animate-fade-in">
              {sortedCompanies.length === 0 ? (
                <div className="p-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Info className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  {language === "tr" 
                    ? "Aradığınız filtre kriterlerinde veya ilde kayıtlı liyakat belgeli servis bulunamadı." 
                    : "No certified services found with the requested filter criteria or province."}
                </div>
              ) : (
                sortedCompanies.map((comp) => {
                  const compLat = comp.latitude || (41.01 + (comp.latOffset || 0));
                  const compLng = comp.longitude || (28.97 + (comp.lngOffset || 0));
                  const distance = userLocation 
                    ? calculateDistance(userLocation.lat, userLocation.lng, compLat, compLng) 
                    : null;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompanyId(comp.id)}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        selectedCompany?.id === comp.id
                          ? "bg-emerald-50/70 border-emerald-500 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50/50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <div className="flex gap-2">
                          {renderCompanyLogo(comp, "w-10 h-10 text-base font-extrabold shadow-sm border border-slate-100", false)}
                          <div>
                            <h5 className="font-bold text-sm text-slate-900 flex flex-wrap items-center gap-1.5 animate-fade-in">
                              {translateEntity(comp, "company_name")}
                              {comp.premium_status && (
                                <span className="bg-emerald-100 text-[8px] text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase border border-emerald-250">PREMIUM</span>
                              )}
                              {comp.approved_status === "Onay Bekliyor" && (
                                <span className="bg-amber-100 text-[8.5px] text-amber-850 font-extrabold px-1.5 py-0.5 rounded border border-amber-250">
                                  {language === "tr" ? "Onay Bekliyor" : "Pending Approval"}
                                </span>
                              )}
                              {comp.status === "Pasif" && (
                                <span className="bg-rose-100 text-[8.5px] text-rose-800 font-extrabold px-1.5 py-0.5 rounded border border-rose-250">
                                  {language === "tr" ? "Pasif (Üyelik Dolmuş)" : "Passive (Expired)"}
                                </span>
                              )}
                            </h5>
                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                              {comp.city} / {comp.district.split(" / ")[0]}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1">
                          <div className="flex items-center text-yellow-600 text-xs font-bold gap-0.5 bg-yellow-50 p-1 px-1.5 rounded border border-yellow-101">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span>{comp.rating}</span>
                          </div>
                          {distance !== null && (
                            <span className="text-[10px] bg-blue-50 text-blue-750 font-bold p-1 px-1.5 rounded border border-blue-100 whitespace-nowrap animate-fade-in">
                              📍 {distance.toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-3">
                        {comp.featuredBrands.map((brand) => (
                          <span key={brand} className="text-[9px] bg-slate-100 border border-slate-150 px-2 py-0.5 rounded text-slate-600 font-semibold font-mono">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "register" && (() => {
            const isAdmin = sessionUser && sessionUser.role === "admin";
            const isDealerOrMfr = isAdmin || (sessionUser && (sessionUser.role === "dealer" || sessionUser.role === "manufacturer"));
            const isExpired = !isAdmin && sessionUser && (sessionUser.membership_status === "Süresi Dolmuş" || new Date(sessionUser.membership_end) < new Date());
            
            if (!sessionUser) {
              return (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-205 text-center space-y-4 font-sans py-12 animate-fade-in w-full">
                  <Lock className="h-10 w-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-950">
                    {language === "tr" ? "Firma Eklemek İçin Oturum Açın" : "Log In to Add a Company"}
                  </h4>
                  <p className="text-xs text-slate-655 max-w-sm mx-auto leading-relaxed">
                    {language === "tr" 
                      ? "Firma Rehberi'ne yeni teknik servis veya kit üretici bayisi eklemek için sisteme kurumsal profilinizle giriş yapmanız gerekmektedir." 
                      : "To add a new service center or kit manufacturer to the Company Directory, you must log in with a corporate profile."}
                  </p>
                  <p className="text-[11px] text-slate-655 bg-slate-100 p-3 rounded-lg border border-slate-205 mt-2 font-semibold">
                    {language === "tr" ? (
                      <>Sisteme giriş yapmak için üst menüdeki <strong>Üye Girişi / Kurumsal</strong> butonuna tıklayıp kurumsal hesabınızla oturum açabilir veya yeni bir kurumsal üyelik oluşturabilirsiniz.</>
                    ) : (
                      <>To log in, click the <strong>Member Login / Corporate</strong> button in the top menu and sign in with your corporate account, or create a new corporate membership.</>
                    )}
                  </p>
                </div>
              );
            }

            if (!isDealerOrMfr) {
              return (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-250 text-center space-y-4 font-sans py-12 animate-fade-in w-full">
                  <Shield className="h-10 w-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-950 font-sans">
                    {language === "tr" ? "Sadece Kurumsal Üyeler Ekleyebilir" : "Only Corporate Members Can Add Companies"}
                  </h4>
                  <p className="text-xs text-slate-655 max-w-sm mx-auto leading-relaxed">
                    {language === "tr" 
                      ? (<>Firma ekleyebilmeniz için üyelik rolünüzün <strong>Firma (Bayi / Usta)</strong> veya <strong>Kit Üreticisi</strong> olması gerekmektedir.</>) 
                      : (<>To add a company, your membership role must be <strong>Company (Dealer / Master)</strong> or <strong>Kit Manufacturer</strong>.</>)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === "tr" ? "Mevcut rolünüz:" : "Your current role:"} <span className="font-bold underline">{getRoleDisplayName(sessionUser.role)}</span>
                  </p>
                </div>
              );
            }

            if (isExpired) {
              return (
                <div className="bg-rose-50/70 p-6 rounded-2xl border-2 border-rose-200 text-center space-y-5 font-sans py-12 shadow-xs animate-fade-in w-full">
                  <AlertCircle className="h-12 w-12 text-rose-600 mx-auto animate-bounce" />
                  <div className="space-y-1.5">
                    <h4 className="text-base font-black text-rose-955 font-sans">
                      {language === "tr" ? "Firma Ekleme İşlemi Engellendi" : "Adding Company Action Blocked"}
                    </h4>
                    <p className="text-xs text-rose-800 font-bold max-w-sm mx-auto leading-relaxed">
                      {language === "tr" 
                        ? "Üyelik süreniz sona ermiştir. Firma ekleme işlemi yapabilmek için üyeliğinizi yenilemeniz gerekmektedir." 
                        : "Your membership has expired. You need to renew your membership to add a company."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRenewMembership}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 w-full rounded-xl text-xs transition duration-150 cursor-pointer shadow-md flex items-center justify-center gap-1.5 animate-pulse"
                  >
                    <RefreshCw className="h-4 w-4 animate-spin" style={{ animationDuration: "4s" }} />
                    <span>{language === "tr" ? "Üyeliğimi Yenile" : "Renew My Membership"}</span>
                  </button>
                </div>
              );
            }

            return (
              <form onSubmit={handleRegisterCompany} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 creative-form-shadow space-y-4 max-h-[600px] overflow-y-auto">
              <div className="border-b border-slate-200 pb-2 mb-2">
                <span className="text-sm font-bold text-slate-900 block font-sans">
                  {language === "tr" ? "🏢 Yeni LPG Servis Başvurusu" : "🏢 New LPG Service Application"}
                </span>
                <p className="text-[11px] text-slate-500">
                  {language === "tr" ? "Mühendislik firmasını haritaya yerleştirin ve sisteme ekleyin." : "Place your engineering company on the map and add it to the directory."}
                </p>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  {language === "tr" ? "Firma Adı (Kurumsal Marka)*" : "Company Name (Corporate Brand)*"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "tr" ? "Örn: Anadolu Otogaz Mühendislik" : "e.g. Autogas Engineering"}
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {language === "tr" ? "Şehir (İl)*" : "City (Province)*"}
                  </label>
                  <select
                    value={newCompanyCity}
                    onChange={(e) => setNewCompanyCity(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                  >
                    {ALL_81_CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {language === "tr" ? "İlçe*" : "District*"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "tr" ? "Örn: Kadıköy" : "e.g. Kadikoy"}
                    value={newCompanyDistrict}
                    onChange={(e) => setNewCompanyDistrict(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  {language === "tr" ? "Tam Açık Adres*" : "Full Address*"}
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder={language === "tr" ? "Örn: Fenerbahçe Mah. Bağdat Caddesi No:123 Kadıköy" : "e.g. Fenerbahce Mah. Bagdat Caddesi No:123 Kadikoy"}
                  value={newCompanyAddress}
                  onChange={(e) => setNewCompanyAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                />
              </div>

              {/* Real-time Simulated Geocoding Indicator Panel */}
              <div className="bg-emerald-50/80 border border-emerald-150 p-3 rounded-lg text-xs space-y-1">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  {language === "tr" ? "⚡ Otomatik Geocoding Algoritması" : "⚡ Automatic Geocoding Algorithm"}
                </span>
                <p className="text-slate-600 text-[10px] leading-snug">
                  {language === "tr" 
                    ? "Adresiniz girildikçe coğrafi enlem/boylam kesişimleri ve harita pin koordinatları otomatik üretilir." 
                    : "As you enter your address, geographic coordinates and map pin locations are automatically calculated."}
                </p>
                <div className="font-mono text-[10px] flex justify-between bg-white/70 p-1.5 rounded border border-emerald-100 text-slate-700 mt-1">
                  <span>{language === "tr" ? "Enlem" : "Latitude"}: <strong>{geocodeAddress(newCompanyCity, newCompanyDistrict, newCompanyAddress).latitude.toFixed(5)}</strong></span>
                  <span>{language === "tr" ? "Boylam" : "Longitude"}: <strong>{geocodeAddress(newCompanyCity, newCompanyDistrict, newCompanyAddress).longitude.toFixed(5)}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {language === "tr" ? "Telefon" : "Phone"}
                  </label>
                  <input
                    type="text"
                    placeholder={language === "tr" ? "Örn: 0 (216) 333 44 55" : "e.g. +90 (216) 333 44 55"}
                    value={newCompanyPhone}
                    onChange={(e) => setNewCompanyPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    {language === "tr" ? "E-posta" : "Email"}
                  </label>
                  <input
                    type="email"
                    placeholder={language === "tr" ? "Örn: iletisim@firma.com" : "e.g. contact@company.com"}
                    value={newCompanyEmail}
                    onChange={(e) => setNewCompanyEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  {language === "tr" ? "Web Sitesi" : "Website"}
                </label>
                <input
                  type="text"
                  placeholder={language === "tr" ? "Örn: www.firmamiz.com" : "e.g. www.company.com"}
                  value={newCompanyWebsite}
                  onChange={(e) => setNewCompanyWebsite(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  {language === "tr" ? "Firma Açıklaması" : "Company Description"}
                </label>
                <textarea
                  rows={2}
                  placeholder={language === "tr" ? "LPG sızdırmazlık, kalibrasyon, 10 yıllık tank değişimi ve yetki alanlarımız..." : "Autogas sealing, calibration, 10-year tank replacements, and specialized areas..."}
                  value={newCompanyDesc}
                  onChange={(e) => setNewCompanyDesc(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">
                  {language === "tr" ? "Firma Logosu Yükle" : "Upload Company Logo"}
                </label>
                
                <div className="flex items-center gap-2 mb-3 bg-white p-2.5 rounded border border-slate-200 shadow-xs">
                  <input
                    id="new_comp_no_logo_checkbox"
                    type="checkbox"
                    checked={newCompanyNoLogo}
                    onChange={(e) => {
                      setNewCompanyNoLogo(e.target.checked);
                      if (e.target.checked) {
                        setNewCompanyLogo(""); // Reset uploaded logo
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="new_comp_no_logo_checkbox" className="text-xs font-bold text-slate-900 cursor-pointer select-none flex items-center gap-1.5">
                    {language === "tr" ? "Firma Logom Yok" : "I Don't Have a Company Logo"}
                  </label>
                </div>

                {!newCompanyNoLogo && (
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center transition-all hover:border-emerald-500">
                    {newCompanyLogo ? (
                      <div className="flex flex-col items-center gap-2 w-full text-center">
                        <img src={newCompanyLogo} alt={language === "tr" ? "Yüklenen Logo Önizleme" : "Uploaded Logo Preview"} className="w-16 h-16 object-cover rounded-full border border-slate-200 shadow-xs" />
                        <button
                          type="button"
                          onClick={() => setNewCompanyLogo("")}
                          className="text-[10px] text-rose-600 hover:underline font-bold"
                        >
                          {language === "tr" ? "Logoyu Kaldır" : "Remove Logo"}
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full py-2">
                        <Upload className="h-5 w-5 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-505 text-slate-500 font-medium">{language === "tr" ? "Logonuzu Seçin (Resim Dosyası)" : "Select Your Logo (Image File)"}</span>
                        <input
                          type="file"
                          required={!newCompanyNoLogo}
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Size check: 5MB
                              const maxSize = 5 * 1024 * 1024;
                              if (file.size > maxSize) {
                                alert(language === "tr" ? "Hata: Dosya boyutu 5 MB limitini aşamaz." : "Error: File size cannot exceed 5 MB.");
                                return;
                              }

                              // Extension check
                              const ext = file.name.split(".").pop()?.toLowerCase();
                              if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
                                alert(language === "tr" ? "Hata: Yalnızca JPG, JPEG, PNG, WEBP resim dosyaları kabul edilir." : "Error: Only JPG, JPEG, PNG, WEBP images are allowed.");
                                return;
                              }

                              // MIME type check
                              if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
                                alert(language === "tr" ? "Hata: Geçersiz resim formatı." : "Error: Invalid image format.");
                                return;
                              }

                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewCompanyLogo(reader.result as string);
                                addSystemLog("Dosya Yükleme", `Firma logosu yüklendi: ${file.name} (Boyut: ${(file.size / 1024).toFixed(1)} KB)`);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {newCompanyNoLogo && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg flex items-center gap-3 animate-fade-in">
                    <div 
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-xs border border-white/20 select-none shrink-0"
                      style={{ backgroundColor: getAutoLogoColor(newCompanyName || "Yeni Firma") }}
                    >
                      {getCompanyInitials(newCompanyName || "Yeni Firma")}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug">
                    {language === "tr" 
                      ? "Firma ismi / ünvanının baş harfine özel ve kalıcı bir renk/harf logosu atanacaktır." 
                      : "A unique and permanent letter/color logo will be assigned based on the first letter of the company name."}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-2">
                  {language === "tr" ? "Yetkili Olunan LPG Kit Markaları" : "Authorized Autogas Kit Brands"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {brandsList.map(brand => (
                    <label key={brand} className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-205 select-none hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandCheckboxChange(brand)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="premium_toggle"
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="premium_toggle" className="text-xs font-bold text-slate-900 cursor-pointer select-none">
                  {language === "tr" ? "⭐ Yıldızlı Premium Statüsünde Kaydet" : "⭐ Save as Starred Premium Status"}
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer text-center font-sans animate-fade-in"
              >
                {language === "tr" ? "Başvuruyu Kaydet ve Gönder (Onay Bekleyecek)" : "Save and Submit Application (Pending Approval)"}
              </button>
            </form>
          );
        })()}

        </div>

        {/* Dynamic Turkey Map Viewport + Active Card Details Panels (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-6">
            
            {/* STYLIZED TURKEY MAP VISUALIZER */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center text-[11px] font-sans">
                <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  {language === "tr" ? "Canlı Sürücü ve Teknisyen Konum Haritası (Türkiye)" : "Live Driver and Technician Location Map (Turkey)"}
                </span>
                <span className="text-slate-400 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded border text-slate-700">
                  {selectedCity === "Hepsi" 
                    ? (language === "tr" ? "Bölge: Türkiye (TR)" : "Region: Turkey (TR)") 
                    : `${language === "tr" ? "Bölge:" : "Region:"} ${selectedCity}`}
                </span>
              </div>
              
              {/* Map Canvas Frame */}
              <div className="h-60 sm:h-72 lg:h-80 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-slate-100 overflow-hidden flex items-center justify-center p-4">
                {/* Visual Grid Overlays */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:16px_16px]"></div>
                
                {/* Minimalist Map Center Emblem */}
                <div className="absolute opacity-[0.06] font-bold font-mono text-center text-[150px] leading-none pointer-events-none text-slate-600 select-none">
                  TR
                </div>

                {/* Major Geo Center Annotations */}
                <div className="absolute left-[20%] top-[40%] text-center pointer-events-none opacity-30 select-none">
                  <span className="text-[10px] text-slate-505 text-slate-500 font-black tracking-widest font-sans">EGE</span>
                </div>
                <div className="absolute left-[45%] top-[25%] text-center pointer-events-none opacity-30 select-none">
                  <span className="text-[10px] text-slate-505 text-slate-500 font-black tracking-widest font-sans">{language === "tr" ? "KARADENİZ" : "BLACK SEA"}</span>
                </div>
                <div className="absolute left-[54%] top-[48%] text-center pointer-events-none opacity-30 select-none">
                  <span className="text-[10px] text-slate-505 text-slate-500 font-black tracking-widest font-sans">{language === "tr" ? "İÇ ANADOLU" : "CENTRAL ANATOLIA"}</span>
                </div>
                <div className="absolute left-[50%] top-[75%] text-center pointer-events-none opacity-30 select-none">
                  <span className="text-[10px] text-slate-505 text-slate-500 font-black tracking-widest font-sans">{language === "tr" ? "AKDENİZ" : "MEDITERRANEAN"}</span>
                </div>
                <div className="absolute left-[78%] top-[55%] text-center pointer-events-none opacity-30 select-none">
                  <span className="text-[10px] text-slate-505 text-slate-500 font-black tracking-widest font-sans">{language === "tr" ? "DOĞU TR" : "EASTERN TR"}</span>
                </div>

                {/* USER LOCATION VISPIN */}
                {userLocation && (() => {
                  const { left, top } = getMapCoordinates(userLocation.lat, userLocation.lng);
                  return (
                    <div
                      className="absolute cursor-pointer z-40"
                      style={{ left, top }}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2 group">
                        <div className="absolute inline-flex h-9 w-9 -left-2.5 -top-2.5 rounded-full bg-blue-400 opacity-60 animate-ping"></div>
                        <div className="p-2 rounded-full bg-blue-600 border-2 border-white shadow-xl text-white">
                          <Compass className="h-3.5 w-3.5" />
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-blue-900 border border-blue-500 text-white text-[10px] p-2 rounded-lg shadow-lg font-bold pointer-events-none whitespace-nowrap">
                          📍 {language === "tr" ? "Sizin Konumunuz" : "Your Location"} ({userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)})
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* DYNAMIC MAP PINS FOR FILTERED COMPANIES */}
                {filteredCompanies.map((comp) => {
                  const lat = comp.latitude || (41.01 + (comp.latOffset || 0));
                  const lng = comp.longitude || (28.97 + (comp.lngOffset || 0));
                  const { left, top } = getMapCoordinates(lat, lng);
                  const isSelected = selectedCompany?.id === comp.id;

                  return (
                    <div
                      key={comp.id}
                      className={`absolute cursor-pointer transition-all duration-300 group ${
                        isSelected ? "z-30 scale-125" : "z-20 hover:scale-110"
                      }`}
                      style={{ left, top }}
                      onClick={() => setSelectedCompanyId(comp.id)}
                    >
                      <div className="relative -translate-x-1/2 -translate-y-1/2">
                        {isSelected && (
                          <div className="absolute inline-flex h-7 w-7 -left-1.5 -top-1.5 rounded-full bg-emerald-400 opacity-75 animate-ping"></div>
                        )}
                        <div className={`p-1.5 rounded-full shadow-lg text-white border transition-all ${
                          isSelected 
                            ? "bg-emerald-600 border-white scale-110" 
                            : "bg-slate-800/90 border-slate-200"
                        }`}>
                          <MapPin className="h-3 w-3" />
                        </div>

                        {/* Interactive map Pin Info display (hover & details) */}
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900/95 text-white text-[10px] p-2.5 rounded-lg shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap hidden group-hover:block ${
                          isSelected ? "!block" : ""
                        }`}>
                          <div className="font-extrabold flex items-center gap-1.5 text-slate-100">
                            {renderCompanyLogo(comp, "w-4 h-4 text-[8.5px] font-black shadow-xs", true)}
                            <span>{translateEntity(comp, "company_name")}</span>
                          </div>
                          <div className="text-slate-300 mt-0.5 font-sans">{comp.city} / {comp.district.split(" / ")[0]}</div>
                          <div className="text-emerald-400 font-mono mt-0.5">{comp.phone}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Map Footer Bar Card */}
              <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600">
                <span className="font-semibold text-slate-850 text-slate-700">
                  {selectedCompany 
                    ? `${language === "tr" ? "🎯 Seçili Servis" : "🎯 Selected Service"}: ${translateEntity(selectedCompany, "company_name")}` 
                    : (language === "tr" ? "LPG Servisi Seçin" : "Select an Autogas Service")}
                </span>
                <span className="font-mono text-slate-400 font-semibold">
                  {language === "tr" ? "Toplam Pin" : "Total Pins"}: {filteredCompanies.length}
                </span>
              </div>
            </div>

            {selectedCompany ? (
              <div className="space-y-6">
                
                {/* Active company details */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      {renderCompanyLogo(selectedCompany, "w-14 h-14 text-2xl font-black shadow-xs border border-slate-250", false)}
                      <div>
                        <h3 className="text-xl font-bold font-sans text-slate-900">{translateEntity(selectedCompany, "company_name")}</h3>
                        <span className="text-emerald-700 text-xs font-mono flex items-center gap-1 mt-1 font-semibold">
                          <Award className="h-4 w-4 text-emerald-600" />
                          {language === "tr" ? "Hizmet Yeterlilik Belgeli (HYB) Montaj Bayisi" : "Certified Service Quality (TSE / HYB) Installation Center"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Brand verification alert if user has unauthorized brands in this profile */}
                  {(() => {
                    if (sessionUser && selectedCompany.owner_id === sessionUser.id && sessionUser.role !== "admin") {
                      const allowedBrands = getUserAuthorizedBrands();
                      const invalidBrands = selectedCompany.featuredBrands.filter(b => !allowedBrands.includes(b));
                      if (invalidBrands.length > 0) {
                        return (
                          <div className="bg-rose-50 border-2 border-rose-250 p-4 rounded-xl flex gap-3 text-xs text-rose-800 font-sans shadow-xs items-center">
                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                            <div>
                              <strong className="block text-rose-900 font-bold mb-0.5">
                                {language === "tr" ? "⚠️ Yetkisiz Marka Uyarısı" : "⚠️ Unauthorized Brand Warning"}
                              </strong>
                              <span>
                                {language === "tr"
                                  ? "Firma profilinizde üyelik bilgileriniz ile eşleşmeyen LPG markaları tespit edildi. Lütfen profilinizi güncelleyiniz."
                                  : "LPG brands that do not match your membership details were detected in your company profile. Please update your profile."}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <p className="text-slate-700 text-sm leading-relaxed">{translateEntity(selectedCompany, "description")}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-200 text-slate-600 text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-600 stroke-2 text-slate-750" />
                      <span className="font-semibold text-slate-800">{selectedCompany.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-600 stroke-2 text-slate-755" />
                      <span>{selectedCompany.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-600 stroke-2 text-slate-755" />
                      <span className="hover:text-emerald-700 cursor-pointer text-emerald-600 font-medium">{selectedCompany.website}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600 stroke-2 text-slate-755" />
                      <span>{selectedCompany.address}</span>
                    </div>
                  </div>
                </div>

                {/* Review listing & rating forms */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                      {language === "tr" ? "Müşteri Değerlendirmeleri" : "Customer Reviews"} ({selectedCompany.reviews.length})
                    </h4>
                    <div className="flex items-center font-bold text-yellow-600 text-xs gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span>{selectedCompany.rating} / 5 {language === "tr" ? "Yıldız" : "Stars"}</span>
                    </div>
                  </div>

                  <form onSubmit={handleAddReview} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-900 block">{language === "tr" ? "Bu Firma Hakkında Yorum Yaz" : "Write a Review About This Company"}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">{language === "tr" ? "Adınız Soyadınız" : "Your Full Name"}</label>
                        <input
                          type="text"
                          required
                          placeholder={language === "tr" ? "Örn: Erhan Demir" : "e.g. John Doe"}
                          value={newReviewName}
                          onChange={(e) => setNewReviewName(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800 shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">{language === "tr" ? "Değerlendirme Puanı" : "Rating Score"}</label>
                        <select
                          value={newReviewRating}
                          onChange={(e) => setNewReviewRating(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800 shadow-xs animate-none"
                        >
                          <option value="5">{language === "tr" ? "⭐⭐⭐⭐⭐ - Kusursuz Kalibrasyon & Hizmet" : "⭐⭐⭐⭐⭐ - Flawless Calibration & Service"}</option>
                          <option value="4">{language === "tr" ? "⭐⭐⭐⭐ - Çok İyi" : "⭐⭐⭐⭐ - Very Good"}</option>
                          <option value="3">{language === "tr" ? "⭐⭐⭐ - Ortalama" : "⭐⭐⭐ - Average"}</option>
                          <option value="2">{language === "tr" ? "⭐⭐ - Geliştirilmeli" : "⭐⭐ - Needs Improvement"}</option>
                          <option value="1">{language === "tr" ? "⭐ - Yetersiz" : "⭐ - Poor"}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-1">{language === "tr" ? "Görüş ve Değerlendirmeleriniz" : "Your Comments and Review"}</label>
                      <textarea
                        required
                        rows={2}
                        placeholder={language === "tr" ? "Montaj süreci, gaz kalibrasyonu ve usta ilgisi hakkında detaylı bilgi yazın..." : "Write detailed feedback about the installation process, gas calibration, and technician attention..."}
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2 text-xs text-slate-800 shadow-xs"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition duration-150 cursor-pointer shadow-xs"
                    >
                      {language === "tr" ? "Yorumu Yayınla" : "Publish Review"}
                    </button>
                  </form>

                  {/* Comments lists */}
                  <div className="space-y-4 divide-y divide-slate-100 max-h-[250px] overflow-y-auto pr-2 scrollbar-none">
                    {selectedCompany.reviews.length === 0 ? (
                      <div className="text-center text-slate-400 py-4 text-xs italic">
                        {language === "tr" ? "Henüz yorum yapılmamış. İlk yorumu siz yazın!" : "No reviews yet. Be the first to write a review!"}
                      </div>
                    ) : (
                      selectedCompany.reviews.map((rev) => (
                        <div key={rev.id} className="pt-4 first:pt-0 space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">{rev.userName}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400">{rev.created_at}</span>
                            </div>
                            <div className="flex text-yellow-600 gap-0.5">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-600 text-xs leading-relaxed italic">"{translateEntity(rev, "comment")}"</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 border border-dashed border-slate-200 rounded-xl p-10 bg-slate-50/50">
                <MapPin className="h-12 w-12 mb-2 text-slate-300" />
                <span>{language === "tr" ? "Detaylarını görmek için servis seçin." : "Select a service center to view its details."}</span>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
