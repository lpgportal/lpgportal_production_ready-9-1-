import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Car, AlertTriangle, Plus, Trash2, ShieldCheck, HelpCircle } from "lucide-react";
import { CAR_BRANDS, VEHICLES_DATA, getVehiclesDb } from "../data";
import { RAW_VEHICLES_DATA } from "../raw_vehicles";
import { Vehicle } from "../types";
import { useLanguage } from "../lib/LanguageContext";




// Predefined Turkey locations for fast autocomplete search / offline fallback
const TURKEY_LOCATIONS = [
  { name: "İstanbul, Kadıköy", lat: 40.9901, lon: 29.0290 },
  { name: "İstanbul, Beşiktaş", lat: 41.0428, lon: 29.0075 },
  { name: "İstanbul, Üsküdar", lat: 41.0272, lon: 29.0151 },
  { name: "İstanbul, Şişli", lat: 41.0600, lon: 28.9870 },
  { name: "İstanbul, Fatih", lat: 41.0122, lon: 28.9600 },
  { name: "İstanbul Havalimanı (IST)", lat: 41.2752, lon: 28.7519 },
  { name: "İstanbul, Sabiha Gökçen Havalimanı (SAW)", lat: 40.8986, lon: 29.3092 },
  { name: "Ankara, Kızılay Merkez", lat: 39.9208, lon: 32.8541 },
  { name: "Ankara, Çankaya", lat: 39.8970, lon: 32.8610 },
  { name: "Ankara, Keçiören", lat: 39.9780, lon: 32.8680 },
  { name: "Ankara Esenboğa Havalimanı (ESB)", lat: 40.1281, lon: 32.9951 },
  { name: "İzmir, Alsancak", lat: 38.4384, lon: 27.1432 },
  { name: "İzmir, Konak", lat: 38.4190, lon: 27.1287 },
  { name: "İzmir, Bornova", lat: 38.4630, lon: 27.2160 },
  { name: "İzmir Adnan Menderes Havalimanı (ADB)", lat: 38.2924, lon: 27.1570 },
  { name: "Bursa, Osmangazi", lat: 40.1826, lon: 29.0662 },
  { name: "Bursa, Nilüfer", lat: 40.2173, lon: 28.9610 },
  { name: "Antalya, Konyaaltı Plajı", lat: 36.8620, lon: 30.6320 },
  { name: "Antalya, Muratpaşa", lat: 36.8860, lon: 30.7090 },
  { name: "Antalya Havalimanı (AYT)", lat: 36.8994, lon: 30.8005 },
  { name: "Erzurum Havalimanı (ERZ)", lat: 39.9572, lon: 41.1703 },
  { name: "Erzurum, Palandöken", lat: 39.8550, lon: 41.2750 },
  { name: "Erzurum, Yakutiye", lat: 39.9080, lon: 41.2770 },
  { name: "Trabzon Havalimanı (TZX)", lat: 40.9951, lon: 39.7897 },
  { name: "Trabzon, Ortahisar", lat: 41.0020, lon: 39.7200 },
  { name: "Samsun, Atakum", lat: 41.3250, lon: 36.2650 },
  { name: "Samsun Çarşamba Havalimanı (SZF)", lat: 41.2581, lon: 36.5486 },
  { name: "Adana, Çukurova", lat: 37.0370, lon: 35.2890 },
  { name: "Adana Şakirpaşa Havalimanı (ADA)", lat: 36.9822, lon: 35.2804 },
  { name: "Gaziantep, Şahinbey", lat: 37.0380, lon: 37.3750 },
  { name: "Gaziantep Havalimanı (GZT)", lat: 36.9470, lon: 37.4788 },
  { name: "Diyarbakır, Kayapınar", lat: 37.9380, lon: 40.1700 },
  { name: "Konya, Selçuklu", lat: 37.9150, lon: 32.4950 },
  { name: "Kayseri, Melikgazi", lat: 38.7200, lon: 35.5200 },
  { name: "Eskişehir, Tepebaşı", lat: 39.7850, lon: 30.5050 },
  { name: "Muğla, Bodrum", lat: 37.0383, lon: 27.4291 },
  { name: "Muğla, Marmaris", lat: 36.8550, lon: 28.2730 },
  { name: "Muğla, Fethiye", lat: 36.6200, lon: 29.1150 },
  { name: "Van Merkez", lat: 38.5028, lon: 43.3764 },
  { name: "Hakkari Merkez", lat: 37.5744, lon: 43.7408 }
];

// Typical average consumption for brands
const BRAND_DEFAULT_CONSUMPTION: Record<string, number> = {
  "Fiat": 7.2,
  "Renault": 6.8,
  "Honda": 7.4,
  "Toyota": 6.5,
  "Volkswagen": 7.0,
  "Opel": 7.1,
  "Ford": 7.5,
  "Hyundai": 7.3,
  "Dacia": 7.0,
  "Alfa Romeo": 8.0,
  "Audi": 7.8,
  "BMW": 8.5,
  "Peugeot": 6.9,
  "Citroen": 6.7,
  "Mercedes-Benz": 9.0,
  "Nissan": 7.2,
  "Skoda": 6.9,
  "Seat": 7.0,
  "Volvo": 8.2
};

export default function LpgRoutePlanner() {
  const { language } = useLanguage();
  const tLocal = (tr: string, en: string) => (language === "tr" ? tr : en);

  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const routeLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const brandRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  // Helper to load Istanbul price as default
  const getIstanbulPrice = (): number => {
    try {
      const saved = localStorage.getItem("lpgportal_pricing_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.istanbul) {
          const val = parseFloat(parsed.istanbul);
          if (!isNaN(val) && val > 0) return val;
        }
      }
    } catch (e) {}
    return parseFloat(localStorage.getItem("lpgportal_lpg_price") || "21.40");
  };

  // Storage / Global State updates
  const [lpgPrice, setLpgPrice] = useState(() => getIstanbulPrice());
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(() => lpgPrice.toString());
  const [customKitBrands, setCustomKitBrands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("lpgportal_custom_added_brands");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customVehicleBrands, setCustomVehicleBrands] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("lpgportal_custom_vehicle_brands");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [customVehicleModels, setCustomVehicleModels] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem("lpgportal_custom_vehicle_models");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [vehiclesDb, setVehiclesDb] = useState<Vehicle[]>(() => getVehiclesDb());

  useEffect(() => {
    // Initialize lpgportal_lpg_price with current Istanbul price on mount (fresh session)
    try {
      const saved = localStorage.getItem("lpgportal_pricing_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.istanbul) {
          localStorage.setItem("lpgportal_lpg_price", parsed.istanbul);
        }
      }
    } catch (e) {}

    // Listen for storage updates (e.g. if lpg price or custom brands updated in admin dashboard)
    const handleStorageChange = () => {
      const newPrice = parseFloat(localStorage.getItem("lpgportal_lpg_price") || "21.40");
      setLpgPrice(prev => prev === newPrice ? prev : newPrice);
      try {
        const saved = localStorage.getItem("lpgportal_custom_added_brands");
        if (saved) {
          const parsed = JSON.parse(saved);
          setCustomKitBrands(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }
        
        const savedVBrands = localStorage.getItem("lpgportal_custom_vehicle_brands");
        if (savedVBrands) {
          const parsed = JSON.parse(savedVBrands);
          setCustomVehicleBrands(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }
        
        const savedVModels = localStorage.getItem("lpgportal_custom_vehicle_models");
        if (savedVModels) {
          const parsed = JSON.parse(savedVModels);
          setCustomVehicleModels(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }

        const savedVDB = localStorage.getItem("lpgportal_vehicles_db");
        if (savedVDB) {
          const parsed = JSON.parse(savedVDB);
          setVehiclesDb(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }
      } catch (e) {}
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("lpgportal_db_update", handleStorageChange as any);
    // Periodically sync (1.5 seconds) in case of local updates in the same window context
    const interval = setInterval(handleStorageChange, 1500);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("lpgportal_db_update", handleStorageChange as any);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (brandRef.current && !brandRef.current.contains(target)) {
        setBrandSuggestions([]);
      }
      if (modelRef.current && !modelRef.current.contains(target)) {
        setModelSuggestions([]);
      }
      if (startRef.current && !startRef.current.contains(target)) {
        setStartSuggestions([]);
      }
      if (destRef.current && !destRef.current.contains(target)) {
        setDestSuggestions([]);
      }
      
      const stopContainers = document.querySelectorAll(".stop-autocomplete-container");
      let clickedInsideStop = false;
      stopContainers.forEach(container => {
        if (container.contains(target)) {
          clickedInsideStop = true;
        }
      });
      if (!clickedInsideStop) {
        setStops(prev => prev.map(s => ({ ...s, suggestions: [] })));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recalculate cost when lpgPrice is updated dynamically
  useEffect(() => {
    if (calcResults) {
      const needed = parseFloat(calcResults.lpgNeeded);
      if (!isNaN(needed)) {
        setCalcResults((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            roadCost: Math.round(needed * lpgPrice)
          };
        });
      }
    }
  }, [lpgPrice]);

  // Dynamically load Leaflet resources
  useEffect(() => {
    let cssLink = document.getElementById("leaflet-css") as HTMLLinkElement;
    if (!cssLink) {
      cssLink = document.createElement("link");
      cssLink.id = "leaflet-css";
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);
    }

    let jsScript = document.getElementById("leaflet-js") as HTMLScriptElement;
    if (!jsScript) {
      jsScript = document.createElement("script");
      jsScript.id = "leaflet-js";
      jsScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(jsScript);
      jsScript.onload = () => {
        setMapLoaded(true);
      };
    } else {
      if ((window as any).L) {
        setMapLoaded(true);
      }
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Set initial view centered in Turkey
    const map = L.map(mapContainerRef.current).setView([39.9208, 32.8541], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapLoaded]);

  // SEO dynamic structured data schema injection
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "lpg-planner-schema-ld";
    script.innerHTML = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "AKILLI LPG ROTA PLANLAYICI",
      "description": "Gelişmiş LPG rota planlama, yakıt tüketimi, yol maliyeti ve dolum noktaları hesaplayıcısı.",
      "url": window.location.href,
      "applicationCategory": "TravelApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TRY"
      }
    });
    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("lpg-planner-schema-ld");
      if (el) el.remove();
    };
  }, []);

  // Form States - Vehicle & Motor Spec
  const [brandInput, setBrandInput] = useState("");
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [customBrand, setCustomBrand] = useState("");

  const [modelInput, setModelInput] = useState("");
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");

  const getModelsForBrand = (brand: string) => {
    const dbModels = vehiclesDb.filter(v => v.brand.toLowerCase() === brand.toLowerCase()).map(v => v.model);
    const rawModels = RAW_VEHICLES_DATA[brand] || [];
    const customModels = customVehicleModels[brand] || [];
    return Array.from(new Set([...dbModels, ...rawModels, ...customModels])).sort();
  };

  const getYearsForModel = (brand: string, model: string) => {
    if (!brand || !model || brand === "Diğer" || model === "Diğer") {
      return Array.from({ length: 37 }, (_, i) => String(2026 - i));
    }
    const matches = vehiclesDb.filter(v => v.brand.toLowerCase() === brand.toLowerCase() && v.model.toLowerCase() === model.toLowerCase());
    const yearsSet = new Set<string>();
    matches.forEach(v => {
      const match = v.yearRange.match(/(\d{4})\s*-\s*(\d{4})/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        for (let y = start; y <= end; y++) {
          yearsSet.add(String(y));
        }
      } else {
        const singleYearMatch = v.yearRange.match(/\b(\d{4})\b/);
        if (singleYearMatch) {
          yearsSet.add(singleYearMatch[1]);
        }
      }
    });
    if (yearsSet.size === 0) {
      return Array.from({ length: 37 }, (_, i) => String(2026 - i));
    }
    return Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
  };

  const [modelYear, setModelYear] = useState("");
  const [engineSize, setEngineSize] = useState("");
  const [engineType, setEngineType] = useState("");
  const [engineFeed, setEngineFeed] = useState("");

  // LPG System States
  const [kitBrand, setKitBrand] = useState("");
  const [otherKitBrand, setOtherKitBrand] = useState("");
  
  const [tankCapacityOption, setTankCapacityOption] = useState<string | number>("");
  const [customTankCapacity, setCustomTankCapacity] = useState("");
  
  const activeTankCapacity = tankCapacityOption === "custom"
    ? (parseFloat(customTankCapacity) || 0)
    : (Number(tankCapacityOption) || 0);
  
  const usableLpg = Number((activeTankCapacity * 0.8).toFixed(1)); // 80% Rule

  // Route Address Autocomplete States
  const [startQuery, setStartQuery] = useState("");
  const [startPoint, setStartPoint] = useState<any>(null);
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);

  const [destQuery, setDestQuery] = useState("");
  const [destPoint, setDestPoint] = useState<any>(null);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);

  const [stops, setStops] = useState<{ id: string; query: string; selectedPoint: any | null; suggestions: any[] }[]>([]);

  // Petrol & LPG Consumption States
  const [avgPetrolConsumption, setAvgPetrolConsumption] = useState(7.5); // Liters / 100km
  const [lpgDiffOption, setLpgDiffOption] = useState("20"); // percentage: '18', '20', '22', 'custom'
  const [customLpgDiff, setCustomLpgDiff] = useState(""); // manual entry
  const [consumptionError, setConsumptionError] = useState("");

  // Calculation Results state
  const [isLoading, setIsLoading] = useState(false);
  const [calcResults, setCalcResults] = useState<any | null>(null);
  const [routeError, setRouteError] = useState("");

  // Brand input handlers
  const handleBrandChange = (val: string) => {
    setBrandInput(val);
    setSelectedBrand("");
    setSelectedModel("");
    setModelInput("");
    setCustomBrand("");
    setCustomModel("");
    
    const matched = [...CAR_BRANDS, ...customVehicleBrands].filter(b => b.toLowerCase().includes(val.toLowerCase()));
    setBrandSuggestions([...matched, "Diğer"]);
  };

  const handleBrandSelect = (brand: string) => {
    setBrandInput(brand);
    setSelectedBrand(brand);
    setBrandSuggestions([]);
    setSelectedModel("");
    setModelInput("");

    if (brand !== "Diğer") {
      // Prefill default average consumption for that brand
      const def = BRAND_DEFAULT_CONSUMPTION[brand] || 7.5;
      setAvgPetrolConsumption(def);
    }
    
    setModelYear("");
  };

  // Model input handlers
  const handleModelChange = (val: string) => {
    setModelInput(val);
    setSelectedModel("");
    setCustomModel("");
    
    if (selectedBrand) {
      const models = getModelsForBrand(selectedBrand);
      const matched = models.filter(m => m.toLowerCase().includes(val.toLowerCase()));
      setModelSuggestions([...matched, "Diğer"]);
    } else {
      setModelSuggestions([]);
    }
  };

  const handleModelSelect = (model: string) => {
    setModelInput(model);
    setSelectedModel(model);
    setModelSuggestions([]);

    setModelYear("");
  };

  // Address lookup function using Photon with Nominatim fallback and Local database
  const fetchAddressSuggestions = async (query: string, callback: (items: any[]) => void) => {
    if (query.trim().length < 2) {
      callback([]);
      return;
    }

    // Local DB lookup (Fast/Offline)
    const localMatches = TURKEY_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    ).map(loc => ({
      name: loc.name,
      lat: loc.lat,
      lon: loc.lon,
      source: "Local"
    }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // Query Photon API (restricted to Turkey bounding box)
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&bbox=25.5,35.8,44.8,42.2`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          const apiMatches = data.features.map((item: any) => {
            const p = item.properties;
            const name = p.name || "";
            const street = p.street ? `, ${p.street}` : "";
            const city = p.city ? `, ${p.city}` : "";
            const state = p.state ? `, ${p.state}` : "";
            let displayName = name;
            if (street) displayName += street;
            if (city) displayName += city;
            if (state && state !== city) displayName += state;

            return {
              name: displayName,
              lat: item.geometry.coordinates[1],
              lon: item.geometry.coordinates[0],
              source: "OSM"
            };
          });

          // Merge keeping local matches first
          const merged = [...localMatches];
          apiMatches.forEach((apiItem: any) => {
            if (!merged.some(m => Math.abs(m.lat - apiItem.lat) < 0.002 && Math.abs(m.lon - apiItem.lon) < 0.002)) {
              merged.push(apiItem);
            }
          });
          callback(merged.slice(0, 8));
          return;
        }
      }
    } catch (e) {
      console.warn("Photon lookup failed, falling back to Nominatim", e);
    }

    // Fallback: Nominatim API with countrycodes=tr
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=tr&limit=6`,
        { 
          signal: controller.signal,
          headers: { "User-Agent": "lpgportal-türkiye-client" }
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const apiMatches = data.map((item: any) => ({
          name: item.display_name.replace(", Türkiye", ""),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          source: "OSM"
        }));

        const merged = [...localMatches];
        apiMatches.forEach((apiItem: any) => {
          if (!merged.some(m => Math.abs(m.lat - apiItem.lat) < 0.002 && Math.abs(m.lon - apiItem.lon) < 0.002)) {
            merged.push(apiItem);
          }
        });
        callback(merged.slice(0, 8));
      } else {
        callback(localMatches);
      }
    } catch (e) {
      callback(localMatches);
    }
  };

  // Stops management
  const addStop = () => {
    if (stops.length >= 3) return; // limit to max 3 intermediate stops
    setStops([...stops, { id: `stop-${Date.now()}`, query: "", selectedPoint: null, suggestions: [] }]);
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
  };

  const handleStopQueryChange = (id: string, val: string) => {
    setStops(stops.map(s => {
      if (s.id === id) {
        fetchAddressSuggestions(val, (suggs) => {
          setStops(prev => prev.map(p => p.id === id ? { ...p, suggestions: suggs } : p));
        });
        return { ...s, query: val, selectedPoint: null };
      }
      return s;
    }));
  };

  const handleStopSelect = (id: string, pt: any) => {
    setStops(stops.map(s => {
      if (s.id === id) {
        return { ...s, query: pt.name, selectedPoint: pt, suggestions: [] };
      }
      return s;
    }));
  };

  // Calculate Rota
  const handleRouteCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteError("");
    setConsumptionError("");
    setIsLoading(true);
    setCalcResults(null);

    // Validate stops selections
    if (!startPoint) {
      setRouteError(language === "tr" ? "Lütfen geçerli bir başlangıç noktası seçin." : "Please select a valid start point.");
      setIsLoading(false);
      return;
    }
    if (!destPoint) {
      setRouteError(language === "tr" ? "Lütfen geçerli bir varış noktası seçin." : "Please select a valid destination point.");
      setIsLoading(false);
      return;
    }

    const unselectedStops = stops.filter(s => !s.selectedPoint);
    if (unselectedStops.length > 0) {
      setRouteError(language === "tr" ? "Lütfen eklediğiniz tüm ara durakları listeden seçin." : "Please select all intermediate stops you added from the list.");
      setIsLoading(false);
      return;
    }

    // Validate custom tank capacity if option is "custom"
    if (tankCapacityOption === "custom") {
      const num = parseFloat(customTankCapacity);
      if (isNaN(num)) {
        setRouteError(language === "tr" ? "Lütfen geçerli bir LPG tank hacmi girin." : "Please enter a valid LPG tank capacity.");
        setIsLoading(false);
        return;
      }
      if (num < 10) {
        setRouteError(language === "tr" ? "LPG tank hacmi 10 litreden az olamaz." : "LPG tank capacity cannot be less than 10 liters.");
        setIsLoading(false);
        return;
      }
      if (num > 200) {
        setRouteError(language === "tr" ? "LPG tank hacmi 200 litreden fazla olamaz." : "LPG tank capacity cannot be more than 200 liters.");
        setIsLoading(false);
        return;
      }
    }

    // Validate petrol consumption manual input if modified
    if (avgPetrolConsumption <= 0 || avgPetrolConsumption > 40) {
      setConsumptionError(language === "tr" ? "Lütfen geçerli bir benzin tüketim verisi girin (1-40 Lt/100km)." : "Please enter valid gasoline consumption data (1-40 L/100km).");
      setIsLoading(false);
      return;
    }

    // Validate LPG consumption difference
    let diffPercent = 20;
    if (lpgDiffOption === "custom") {
      const num = parseFloat(customLpgDiff);
      if (isNaN(num) || num < 0 || num > 50) {
        setConsumptionError(language === "tr" ? "Manuel LPG tüketim farkı 0 ile 50 arasında olmalıdır." : "Manual LPG consumption difference must be between 0 and 50.");
        setIsLoading(false);
        return;
      }
      diffPercent = num;
    } else {
      diffPercent = parseFloat(lpgDiffOption);
    }

    // Register unregistered kit brand if needed
    if (kitBrand === "Diğer" && otherKitBrand.trim()) {
      try {
        const brandKey = otherKitBrand.trim();
        const saved = localStorage.getItem("lpgportal_unregistered_kit_brands");
        const list = saved ? JSON.parse(saved) : [];
        const existingIdx = list.findIndex((x: any) => x.name.toLowerCase() === brandKey.toLowerCase());
        if (existingIdx > -1) {
          list[existingIdx].count += 1;
          list[existingIdx].lastRequested = new Date().toISOString();
        } else {
          list.push({
            name: brandKey,
            count: 1,
            lastRequested: new Date().toISOString()
          });
        }
        localStorage.setItem("lpgportal_unregistered_kit_brands", JSON.stringify(list));
      } catch (err) {}
    }

    // Register unregistered vehicle (brand/model) if needed
    if ((selectedBrand === "Diğer" && customBrand.trim()) || (selectedModel === "Diğer" && customModel.trim())) {
      try {
        const brandName = selectedBrand === "Diğer" ? customBrand.trim() : selectedBrand;
        const modelName = selectedModel === "Diğer" ? customModel.trim() : selectedModel;
        
        const saved = localStorage.getItem("lpgportal_unregistered_vehicles");
        const list = saved ? JSON.parse(saved) : [];
        
        const existingIdx = list.findIndex((x: any) => 
          x.brand.toLowerCase() === brandName.toLowerCase() && 
          x.model.toLowerCase() === modelName.toLowerCase()
        );
        
        if (existingIdx > -1) {
          list[existingIdx].count += 1;
          list[existingIdx].lastRequested = new Date().toISOString();
        } else {
          list.push({
            brand: brandName,
            model: modelName,
            count: 1,
            lastRequested: new Date().toISOString()
          });
        }
        localStorage.setItem("lpgportal_unregistered_vehicles", JSON.stringify(list));
      } catch (err) {}
    }

    const allWaypoints = [startPoint, ...stops.map(s => s.selectedPoint), destPoint];
    const coordsString = allWaypoints.map(pt => `${pt.lon},${pt.lat}`).join(";");

    let finalDistance = 0;
    let finalDuration = 0;
    let routeGeojson: any = null;
    let isOsrmSuccess = false;

    // Try fetching OSRM route API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          finalDistance = data.routes[0].distance / 1000; // to km
          finalDuration = data.routes[0].duration / 60; // to minutes
          routeGeojson = data.routes[0].geometry;
          isOsrmSuccess = true;
        }
      }
    } catch (err) {
      console.warn("OSM Routing failed, falling back to Haversine calculation");
    }

    // Fallback: Haversine distance calculator
    if (!isOsrmSuccess) {
      let sumDistance = 0;
      const getHaversineDistance = (p1: any, p2: any) => {
        const R = 6371; // km
        const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
        const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((p1.lat * Math.PI) / 180) *
            Math.cos((p2.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1.22; // Multiply by 1.22 for average route winding factor
      };

      for (let i = 0; i < allWaypoints.length - 1; i++) {
        sumDistance += getHaversineDistance(allWaypoints[i], allWaypoints[i + 1]);
      }
      finalDistance = sumDistance;
      finalDuration = sumDistance / 85 * 60; // Avg 85 km/h driving duration

      // Generate linear coordinates list for map rendering
      const linearCoords = allWaypoints.map(pt => [pt.lon, pt.lat]);
      routeGeojson = {
        type: "LineString",
        coordinates: linearCoords
      };
    }

    // ABRP Logic & Math
    // LPG Tüketimi = Benzin Tüketimi + Fark Yüzdesi
    const lpgConsumptionPer100 = avgPetrolConsumption * (1 + diffPercent / 100);
    const totalLpgNeeded = (finalDistance / 100) * lpgConsumptionPer100;
    const roadCost = totalLpgNeeded * lpgPrice;
    
    // Maximum Range ( usable LPG )
    const maxRange = (usableLpg / lpgConsumptionPer100) * 100;

    // Refill recommendations & advice
    let refillRecommendation = "";
    let recommendedRefillsCount = 0;
    let finalKalanLpgPercent = 0;
    let statusAdvice = "";

    if (totalLpgNeeded <= usableLpg) {
      recommendedRefillsCount = 0;
      refillRecommendation = language === "tr"
        ? "Bu rota için ara yakıt almanıza gerek yoktur. Tek depo kullanılabilir LPG ile hedefe varabilirsiniz."
        : "No intermediate refueling is required for this route. You can reach the destination with a single tank of usable LPG.";
      const remainingLpg = usableLpg - totalLpgNeeded;
      finalKalanLpgPercent = Math.round((remainingLpg / usableLpg) * 100);
      statusAdvice = language === "tr"
        ? `Varışta yaklaşık %${finalKalanLpgPercent} LPG kalacaktır.`
        : `Approximately %${finalKalanLpgPercent} LPG will remain upon arrival.`;
    } else {
      recommendedRefillsCount = Math.ceil((totalLpgNeeded - usableLpg) / usableLpg);
      refillRecommendation = language === "tr"
        ? `Bu rota için yaklaşık ${recommendedRefillsCount} kez LPG ikmali yapmanız önerilir.`
        : `Approximately ${recommendedRefillsCount} LPG refill(s) are recommended for this route.`;
      
      // Calculate remaining percentage assuming they do a full refill at the last possible spot
      const moduloNeeded = totalLpgNeeded % usableLpg;
      const finalRemainingLiters = usableLpg - moduloNeeded;
      finalKalanLpgPercent = Math.round((finalRemainingLiters / usableLpg) * 100);
      statusAdvice = language === "tr"
        ? `Son dolum sonrasında varışta tahmini %${finalKalanLpgPercent} LPG yakıtınız kalacaktır.`
        : `After the last refill, estimated %${finalKalanLpgPercent} LPG will remain upon arrival.`;
    }

    // Leaflet map drawing updates
    const L = (window as any).L;
    if (mapRef.current && L) {
      const map = mapRef.current;

      // Clear old layers
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
      }
      if (markersGroupRef.current) {
        map.removeLayer(markersGroupRef.current);
      }

      // Draw Route
      const routeLayer = L.geoJSON(routeGeojson, {
        style: { color: "#10b981", weight: 5, opacity: 0.8 }
      }).addTo(map);
      routeLayerRef.current = routeLayer;

      // Group for markers
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      // Fit map bounds
      map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

      // Dynamic Station Generators along coordinates
      const coords = routeGeojson.coordinates; // [lon, lat]
      const stationNames = [
        "Shell Autogas Dinlenme Noktası",
        "Opet Otogaz & Market",
        "Petrol Ofisi LPG İstasyonu",
        "Aygaz Otogaz İstasyonu",
        "Aytemiz Akıllı İstasyon"
      ];
      
      const stationsOnRoute: any[] = [];
      const stepsCount = Math.min(5, Math.floor(coords.length / 2));
      const intervalStep = Math.floor(coords.length / (stepsCount + 1));

      for (let i = 1; i <= stepsCount; i++) {
        const coordIdx = i * intervalStep;
        if (coordIdx < coords.length) {
          const pt = coords[coordIdx];
          const stName = stationNames[(i - 1) % stationNames.length];
          const stDistance = Math.round((finalDistance * i) / (stepsCount + 1));
          
          stationsOnRoute.push({
            name: stName,
            lat: pt[1],
            lon: pt[0],
            distanceFromStart: stDistance
          });

          // Place gas pump marker
          L.marker([pt[1], pt[0]], {
            icon: L.divIcon({
              html: `<div class="bg-emerald-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold border-2 border-white shadow-lg text-[10px]">⛽</div>`,
              className: ""
            })
          }).bindPopup(`<strong>${stName}</strong><br/>${language === "tr" ? "Başlangıçtan uzaklık" : "Distance from start"}: ~${stDistance} km<br/>${language === "tr" ? "Fiyat" : "Price"}: ${lpgPrice.toFixed(2)} TL`).addTo(markersGroup);
        }
      }

      // Add Start (A) & Destination (B) Markers
      L.marker([startPoint.lat, startPoint.lon], {
        icon: L.divIcon({
          html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black border-2 border-white shadow-xl text-xs">A</div>`,
          className: ""
        })
      }).bindPopup(`<strong>${language === "tr" ? "Başlangıç" : "Start"}:</strong> ${startPoint.name}`).addTo(markersGroup);

      // Intermediate stops markers
      stops.forEach((st, idx) => {
        if (st.selectedPoint) {
          L.marker([st.selectedPoint.lat, st.selectedPoint.lon], {
            icon: L.divIcon({
              html: `<div class="bg-amber-500 text-slate-900 rounded-full w-7 h-7 flex items-center justify-center font-bold border border-white shadow-md text-xs">${idx + 1}</div>`,
              className: ""
            })
          }).bindPopup(`<strong>${language === "tr" ? "Durak" : "Stop"} #${idx + 1}:</strong> ${st.selectedPoint.name}`).addTo(markersGroup);
        }
      });

      L.marker([destPoint.lat, destPoint.lon], {
        icon: L.divIcon({
          html: `<div class="bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-black border-2 border-white shadow-xl text-xs">B</div>`,
          className: ""
        })
      }).bindPopup(`<strong>${language === "tr" ? "Varış" : "Destination"}:</strong> ${destPoint.name}`).addTo(markersGroup);
      
      // Save results
      setCalcResults({
        distance: Math.round(finalDistance),
        duration: Math.round(finalDuration),
        lpgNeeded: totalLpgNeeded.toFixed(1),
        roadCost: Math.round(roadCost),
        maxRange: Math.round(maxRange),
        refillRecommendation,
        statusAdvice,
        recommendedRefillsCount,
        finalKalanLpgPercent,
        stationsCount: stationsOnRoute.length,
        stationsList: stationsOnRoute
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6 text-left font-sans" id="lpg-route-planner">
      
      {/* Header and Subtitles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <Navigation className="h-5 w-5 text-emerald-600 animate-pulse" />
          <div>
            <h3 className="font-bold text-lg text-slate-900 leading-tight">
              {language === "tr" ? "AKILLI LPG ROTA PLANLAYICI" : "SMART LPG ROUTE PLANNER"}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {language === "tr" ? "Rotanızı oluşturun, ortalama LPG tüketiminizi ve yol maliyetinizi önceden öğrenin." : "Create your route, learn average LPG consumption and cost of road in advance."}
            </p>
          </div>
        </div>

        {/* Güncel LPG Fiyat Gösterim ve Düzenleme Alanı */}
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3 py-1.5 rounded-xl border border-emerald-100 font-bold shrink-0 self-start sm:self-center font-sans">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">{language === "tr" ? "Güncel LPG Fiyatı:" : "Current LPG Price:"}</span>
          {isEditingPrice ? (
            <div className="flex items-center gap-1">
              <span className="text-emerald-700 font-bold">₺</span>
              <input
                type="number"
                step="0.01"
                required
                value={tempPrice}
                onChange={(e) => setTempPrice(e.target.value)}
                className="w-14 bg-white border border-emerald-350 focus:border-emerald-500 rounded px-1.5 py-0.5 text-xs focus:outline-none text-slate-800 font-bold"
              />
              <span className="text-emerald-700 font-bold">{language === "tr" ? "/ LT" : "/ L"}</span>
              <button
                type="button"
                onClick={() => {
                  const val = parseFloat(tempPrice);
                  if (!isNaN(val) && val > 0 && val < 100) {
                    setLpgPrice(val);
                    localStorage.setItem("lpgportal_lpg_price", val.toString());
                  }
                  setIsEditingPrice(false);
                }}
                className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-1.5 py-0.5 rounded cursor-pointer transition"
              >
                {language === "tr" ? "Kaydet" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTempPrice(lpgPrice.toString());
                  setIsEditingPrice(false);
                }}
                className="text-[9px] text-slate-500 hover:text-slate-700 font-semibold px-1 cursor-pointer transition"
              >
                {language === "tr" ? "Vazgeç" : "Cancel"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-700 font-black">₺{lpgPrice.toFixed(2)} {language === "tr" ? "/ LT" : "/ L"}</span>
              <button
                type="button"
                onClick={() => {
                  setTempPrice(lpgPrice.toString());
                  setIsEditingPrice(true);
                }}
                className="text-[9px] bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 font-black px-2 py-0.5 rounded border border-emerald-200/40 cursor-pointer transition active:scale-95 uppercase"
              >
                {language === "tr" ? "Düzenle" : "Edit"}
              </button>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleRouteCalculation} className="space-y-6 text-xs font-semibold text-slate-500">
        
        {/* Row 1: Vehicle Brand, Model & Year Autocompletes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Brand Autocomplete */}
          <div className="relative space-y-2" ref={brandRef}>
            <div>
              <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "ARAÇ MARKASI" : "VEHICLE BRAND"}</label>
              <input
                type="text"
                value={brandInput}
                onChange={(e) => handleBrandChange(e.target.value)}
                onFocus={() => {
                  const matched = [...CAR_BRANDS, ...customVehicleBrands];
                  setBrandSuggestions([...matched, "Diğer"]);
                }}
                onClick={() => {
                  const matched = [...CAR_BRANDS, ...customVehicleBrands];
                  setBrandSuggestions([...matched, "Diğer"]);
                }}
                placeholder={language === "tr" ? "Marka arayın (örn: Renault, Honda)..." : "Search brand (e.g. Renault, Honda)..."}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
              />
              {brandSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {brandSuggestions.map((brand) => (
                    <div
                      key={brand}
                      onClick={() => handleBrandSelect(brand)}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer text-slate-800 text-xs font-bold transition-all"
                    >
                      {brand === "Diğer" ? (language === "tr" ? "➕ Listede Yok Mu? Kendi Bilgilerini Gir" : "➕ Not on the list? Enter custom details") : `🚗 ${brand}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedBrand === "Diğer" && (
              <input
                type="text"
                required
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder={language === "tr" ? "Manuel Marka Girişi..." : "Manual Brand Entry..."}
                className="w-full bg-white border border-amber-300 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-slate-800 font-bold shadow-xs animate-fade-in"
              />
            )}
          </div>

          {/* Model Autocomplete */}
          <div className="relative space-y-2" ref={modelRef}>
            <div>
              <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "ARAÇ MODELİ" : "VEHICLE MODEL"}</label>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => handleModelChange(e.target.value)}
                onFocus={() => {
                  if (selectedBrand) {
                    const models = getModelsForBrand(selectedBrand);
                    setModelSuggestions([...models, "Diğer"]);
                  }
                }}
                onClick={() => {
                  if (selectedBrand) {
                    const models = getModelsForBrand(selectedBrand);
                    setModelSuggestions([...models, "Diğer"]);
                  }
                }}
                disabled={!selectedBrand}
                placeholder={selectedBrand ? (language === "tr" ? "Model arayın (örn: Clio)..." : "Search model (e.g. Clio)...") : (language === "tr" ? "Önce marka seçin" : "Select brand first")}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {modelSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {modelSuggestions.map((model) => (
                    <div
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer text-slate-800 text-xs font-bold transition-all"
                    >
                      {model === "Diğer" ? (language === "tr" ? "➕ Listede Yok Mu? Kendi Bilgilerini Gir" : "➕ Not on the list? Enter custom details") : `🔹 ${model}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedModel === "Diğer" && (
              <input
                type="text"
                required
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={language === "tr" ? "Manuel Model Girişi..." : "Manual Model Entry..."}
                className="w-full bg-white border border-amber-300 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-slate-800 font-bold shadow-xs animate-fade-in"
              />
            )}
          </div>

          {/* Model Year */}
          <div>
            <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "MODEL YILI" : "MODEL YEAR"}</label>
            <select
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
            >
              <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
              {getYearsForModel(selectedBrand, selectedModel).map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Row 2: Motor Hacmi, Motor Tipi, Besleme Tipi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Motor Hacmi */}
          <div>
            <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "MOTOR HACMİ (LİTRE)" : "ENGINE DISPLACEMENT (LITERS)"}</label>
            <select
              value={engineSize}
              onChange={(e) => setEngineSize(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
            >
              <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
              {["0.8", "0.9", "1.0", "1.2", "1.3", "1.4", "1.5", "1.6", "1.8", "2.0", "2.2", "2.5", "3.0"].map((size) => (
                <option key={size} value={size}>{size} {language === "tr" ? "Litre" : "Liters"}</option>
              ))}
            </select>
          </div>

          {/* Motor Tipi */}
          <div>
            <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "MOTOR TİPİ" : "ENGINE TYPE"}</label>
            <select
              value={engineType}
              onChange={(e) => setEngineType(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
            >
              <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
              <option value="MPI">MPI ({language === "tr" ? "Çok Noktadan Enjeksiyon" : "Multi-Point Injection"})</option>
              <option value="Direkt Enjeksiyonlu">{language === "tr" ? "Direkt Enjeksiyonlu (DI)" : "Direct Injection (DI)"}</option>
            </select>
          </div>

          {/* Besleme Tipi */}
          <div>
            <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "BESLEME TİPİ" : "ASPIRATION TYPE"}</label>
            <select
              value={engineFeed}
              onChange={(e) => setEngineFeed(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
            >
              <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
              <option value="Atmosferik">{language === "tr" ? "Atmosferik" : "Naturally Aspirated"}</option>
              <option value="Turbo">Turbo</option>
            </select>
          </div>

        </div>

        {/* Row 3: LPG Kit, Tank Hacmi, Kullanılabilir LPG */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* LPG Kit Brand */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "LPG KİT MARKASI" : "LPG KIT BRAND"}</label>
              <select
                value={kitBrand}
                onChange={(e) => setKitBrand(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
              >
                <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
                {["Atiker", "Prins", "BRC", "Lovato", "Landi Renzo", "Zavoli", "Romano", "Stag", "AEB", "Tomasetto", "Stefanelli", "OMVL", "Mimgas", "Voltran"].map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                {customKitBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
                <option value="Diğer">{language === "tr" ? "➕ Listede Yok Mu? Kendi Bilgilerini Gir" : "➕ Not on the list? Enter custom details"}</option>
              </select>
            </div>
            
            {kitBrand === "Diğer" && (
              <input
                type="text"
                required
                value={otherKitBrand}
                onChange={(e) => setOtherKitBrand(e.target.value)}
                placeholder={language === "tr" ? "Kit markasını yazın..." : "Write kit brand..."}
                className="w-full bg-white border border-amber-300 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-slate-800 font-bold shadow-xs animate-fade-in"
              />
            )}
          </div>

          {/* Tank Capacity */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">{language === "tr" ? "LPG TANK HACMİ (LİTRE)" : "LPG TANK CAPACITY (LITERS)"}</label>
              <select
                value={tankCapacityOption}
                onChange={(e) => {
                  const val = e.target.value;
                  setTankCapacityOption(val === "" ? "" : val === "custom" ? "custom" : Number(val));
                }}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold shadow-xs cursor-pointer"
              >
                <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
                {[30, 35, 38, 42, 46, 50, 55, 60, 70, 80, 90, 100].map((lt) => (
                  <option key={lt} value={lt}>{lt} {language === "tr" ? "Litre" : "Liters"}</option>
                ))}
                <option value="custom">{language === "tr" ? "Diğer (Manuel Giriş)" : "Other (Manual Entry)"}</option>
              </select>
            </div>
            {tankCapacityOption === "custom" && (
              <input
                type="number"
                required
                value={customTankCapacity}
                onChange={(e) => setCustomTankCapacity(e.target.value)}
                placeholder={language === "tr" ? "Manuel LPG Tank Hacmi (Lt)..." : "Manual LPG Tank Capacity (Lt)..."}
                className="w-full bg-white border border-amber-300 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-slate-800 font-bold shadow-xs animate-fade-in"
              />
            )}
          </div>

          {/* Usable LPG Info Box */}
          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
            <div className="bg-emerald-600 text-white rounded-lg p-2 font-mono font-bold shrink-0">
              {usableLpg}L
            </div>
            <div>
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide flex items-center gap-1">
                {language === "tr" ? "Kullanılabilir LPG" : "Usable LPG"}
                <span className="text-[8px] bg-emerald-200 text-emerald-900 px-1 rounded font-mono font-black">{language === "tr" ? "%80 KURALI" : "80% RULE"}</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                {language === "tr" ? "Güvenlik limiti nedeniyle LPG tankları maksimum %80 doluluğa ulaşabilir." : "LPG tanks can reach a maximum of 80% capacity due to safety limits."}
              </p>
            </div>
          </div>

        </div>

        {/* Row 4: Route Locations Search (Start, Destination, Intermediate Stops) */}
        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-4">
          <h4 className="text-slate-800 font-extrabold uppercase font-mono tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <span>{language === "tr" ? "🗺️ Rota ve Yol Planlama Bilgileri" : "🗺️ Route and Trip Planning Details"}</span>
            <button
              type="button"
              onClick={addStop}
              disabled={stops.length >= 3}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-355 text-white font-bold text-[10px] py-1 px-2.5 rounded transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed uppercase"
            >
              <Plus className="h-3 w-3" /> {language === "tr" ? `Durak Ekle (${stops.length}/3)` : `Add Stop (${stops.length}/3)`}
            </button>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Start Point */}
            <div className="relative" ref={startRef}>
              <label className="block mb-1 text-[10px] font-mono text-slate-500 uppercase">{language === "tr" ? "BAŞLANGIÇ NOKTASI" : "START POINT"}</label>
              <input
                type="text"
                required
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  setStartPoint(null);
                  fetchAddressSuggestions(e.target.value, setStartSuggestions);
                }}
                placeholder={language === "tr" ? "İl, ilçe, cadde veya işletme arayın..." : "Search province, district, street or business..."}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-xs focus:outline-none text-slate-800 font-bold shadow-xs"
              />
              {startSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {startSuggestions.map((pt) => (
                    <div
                      key={pt.name}
                      onClick={() => {
                        setStartQuery(pt.name);
                        setStartPoint(pt);
                        setStartSuggestions([]);
                      }}
                      className="p-2 hover:bg-slate-50 cursor-pointer text-slate-800 text-[11px] transition-all flex items-center justify-between"
                    >
                      <span>📍 {pt.name}</span>
                      <span className="text-[8px] bg-slate-100 text-slate-450 px-1 rounded font-mono font-bold">{pt.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Point */}
            <div className="relative" ref={destRef}>
              <label className="block mb-1 text-[10px] font-mono text-slate-500 uppercase">{language === "tr" ? "VARIŞ NOKTASI" : "DESTINATION POINT"}</label>
              <input
                type="text"
                required
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setDestPoint(null);
                  fetchAddressSuggestions(e.target.value, setDestSuggestions);
                }}
                placeholder={language === "tr" ? "İl, ilçe, mahalle veya havalimanı arayın..." : "Search province, district, neighborhood or airport..."}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-xs focus:outline-none text-slate-800 font-bold shadow-xs"
              />
              {destSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {destSuggestions.map((pt) => (
                    <div
                      key={pt.name}
                      onClick={() => {
                        setDestQuery(pt.name);
                        setDestPoint(pt);
                        setDestSuggestions([]);
                      }}
                      className="p-2 hover:bg-slate-50 cursor-pointer text-slate-800 text-[11px] transition-all flex items-center justify-between"
                    >
                      <span>🏁 {pt.name}</span>
                      <span className="text-[8px] bg-slate-100 text-slate-450 px-1 rounded font-mono font-bold">{pt.source}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Intermediate Stops list */}
          {stops.length > 0 && (
            <div className="space-y-3.5 pt-3 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider block">{language === "tr" ? "Ara Duraklar:" : "Intermediate Stops:"}</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="relative bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs flex items-center gap-2.5 stop-autocomplete-container">
                    <div className="flex-1 min-w-0">
                      <label className="block mb-1 text-[9px] font-mono text-slate-400">{language === "tr" ? `DURAK #${index + 1}` : `STOP #${index + 1}`}</label>
                      <input
                        type="text"
                        required
                        value={stop.query}
                        onChange={(e) => handleStopQueryChange(stop.id, e.target.value)}
                        placeholder={language === "tr" ? "Durak arayın..." : "Search stop..."}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded p-1.5 text-xs focus:outline-none text-slate-800 font-bold"
                      />
                      {stop.suggestions.length > 0 && (
                        <div className="absolute left-3 right-3 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-36 overflow-y-auto divide-y divide-slate-100">
                          {stop.suggestions.map((pt) => (
                            <div
                              key={pt.name}
                              onClick={() => handleStopSelect(stop.id, pt)}
                              className="p-2 hover:bg-slate-50 cursor-pointer text-slate-800 text-[10px] transition-all flex items-center justify-between"
                            >
                              <span>📍 {pt.name}</span>
                              <span className="text-[8px] bg-slate-100 px-1 rounded">{pt.source}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStop(stop.id)}
                      className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-100 mt-3.5 transition shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Row 5: Fuel Consumption Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
          
          {/* Average gasoline consumption */}
          <div>
            <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">
              {language === "tr" ? "ORTALAMA BENZİN TÜKETİMİ (LT/100 KM)" : "AVERAGE GASOLINE CONSUMPTION (L/100 KM)"}
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={avgPetrolConsumption}
              onChange={(e) => setAvgPetrolConsumption(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              {language === "tr" ? "Seçtiğiniz araç sınıfının fabrika/sürücü benzin verisidir. Değiştirebilirsiniz." : "Factory/driver gasoline data for selected vehicle class. You can edit."}
            </p>
          </div>

          {/* LPG consumption difference */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1.5 font-mono uppercase tracking-wider text-slate-500">
                {language === "tr" ? "LPG TÜKETİM FARK ORANI (%)" : "LPG CONSUMPTION DIFFERENCE RATE (%)"}
              </label>
              <select
                value={lpgDiffOption}
                onChange={(e) => setLpgDiffOption(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded p-2.5 text-sm focus:outline-none text-slate-800 font-bold cursor-pointer"
              >
                <option value="18">{language === "tr" ? "%18 Fark (Ekonomik Ayar / Yüksek Verim)" : "%18 Difference (Economic Tuning / High Efficiency)"}</option>
                <option value="20">{language === "tr" ? "%20 Fark (Standart Değer)" : "%20 Difference (Standard Value)"}</option>
                <option value="22">{language === "tr" ? "%22 Fark (Performans Ayarı / Düşük Kalibrasyon)" : "%22 Difference (Performance Tuning / Low Calibration)"}</option>
                <option value="custom">{language === "tr" ? "Manuel Değer Gir" : "Enter Manual Value"}</option>
              </select>
            </div>

            {lpgDiffOption === "custom" && (
              <div className="animate-fade-in">
                <input
                  type="number"
                  step="1"
                  required
                  value={customLpgDiff}
                  onChange={(e) => setCustomLpgDiff(e.target.value)}
                  placeholder={language === "tr" ? "LPG tüketim farkını girin (%0 - %50)..." : "Enter LPG consumption difference (%0 - %50)..."}
                  className="w-full bg-white border border-amber-350 focus:border-emerald-500 rounded p-2 text-xs focus:outline-none text-slate-800 font-bold"
                />
                <p className="text-[9.5px] text-slate-400 mt-0.5">{language === "tr" ? "0 ile 50 arasında bir tamsayı girmelisiniz." : "You must enter an integer between 0 and 50."}</p>
              </div>
            )}
          </div>

        </div>

        {/* Display calculation or validation errors if any */}
        {(routeError || consumptionError) && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl flex items-center gap-2 font-bold text-[11px] animate-pulse">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <div className="space-y-0.5">
              {routeError && <p>{language === "tr" ? "❌ Rota Hatası:" : "❌ Route Error:"} {routeError}</p>}
              {consumptionError && <p>{language === "tr" ? "❌ Tüketim Hatası:" : "❌ Consumption Error:"} {consumptionError}</p>}
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-xs py-3.5 rounded-xl transition shadow-md cursor-pointer text-center uppercase tracking-wider flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {language === "tr" ? "Rota Hesaplanıyor ve İkmal Analizi Yapılıyor..." : "Calculating Route and Refill Analysis..."}
            </>
          ) : (
            <>{language === "tr" ? "🎯 Rotayı Çiz, LPG İkmal ve Maliyet Analizini Başlat" : "🎯 Draw Route, Start LPG Refill and Cost Analysis"}</>
          )}
        </button>

      </form>

      {/* HARİTA VE SONUÇ ALANI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200/80">
        
        {/* HARİTA EKRANI (Sol/Orta) */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">{language === "tr" ? "HARİTA GÖSTERİMİ VE İSTASYONLAR" : "MAP VIEW AND STATIONS"}</span>
            <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">OPENSTREETMAP / LEAFLET</span>
          </div>
          <div 
            ref={mapContainerRef} 
            className="w-full h-[400px] bg-slate-200 border border-slate-300 rounded-2xl shadow-inner relative"
            style={{ zIndex: 0 }}
          >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 italic text-xs">
                {language === "tr" ? "Harita modülleri yükleniyor..." : "Loading map modules..."}
              </div>
            )}
          </div>
        </div>

        {/* SONUÇ & ABRP KARAR DESTEK EKRANI (Sağ) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 font-sans text-xs">
          <h4 className="font-extrabold text-slate-800 uppercase font-mono tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
            📊 {language === "tr" ? "Hesaplama ve Karar Destek Raporu" : "Calculation and Decision Support Report"}
          </h4>

          {calcResults ? (
            <div className="space-y-4 animate-fade-in">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-400 block font-mono">{language === "tr" ? "TOPLAM MESAFE" : "TOTAL DISTANCE"}</span>
                  <strong className="text-sm font-extrabold text-slate-800">{calcResults.distance} Km</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-slate-400 block font-mono">{language === "tr" ? "YOL SÜRESİ" : "TRAVEL TIME"}</span>
                  <strong className="text-sm font-extrabold text-slate-800">
                    {Math.floor(calcResults.duration / 60) > 0 ? `${Math.floor(calcResults.duration / 60)} ${language === "tr" ? "Sa" : "Hr"} ` : ""}
                    {calcResults.duration % 60} {language === "tr" ? "Dk" : "Min"}
                  </strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-emerald-600 block font-mono uppercase">{language === "tr" ? "LPG TÜKETİMİ" : "LPG CONSUMPTION"}</span>
                  <strong className="text-sm font-extrabold text-emerald-700">{calcResults.lpgNeeded} Lt</strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <span className="text-[9px] text-emerald-600 block font-mono uppercase">{language === "tr" ? "TAHMİNİ MALİYET" : "ESTIMATED COST"}</span>
                  <strong className="text-sm font-extrabold text-emerald-700">{calcResults.roadCost} TL</strong>
                </div>
              </div>

              {/* Tank Range Indicator */}
              <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl space-y-1">
                <span className="text-[9px] text-emerald-800 font-extrabold uppercase font-mono block">{language === "tr" ? "DEPO İLE GİDİLEBİLECEK YOL (MENZİL)" : "ROAD WITH TANK (RANGE)"}</span>
                <p className="text-sm font-extrabold text-slate-800">
                  {calcResults.maxRange} Km
                </p>
                <p className="text-[10px] text-slate-500 leading-normal">
                  {language === "tr" ? (
                    <>%80 doluluk oranıyla depodaki kullanılabilir <strong>{usableLpg} Litre</strong> LPG baz alınmıştır.</>
                  ) : (
                    <>Based on <strong>{usableLpg} Liters</strong> of usable LPG in tank with 80% fullness rule.</>
                  )}
                </p>
              </div>

              {/* ABRP Decisional Card */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[9px] text-amber-500 font-extrabold uppercase font-mono tracking-wider block">{language === "tr" ? "🤖 ROTA PLANLAYICI ÖNERİSİ" : "🤖 ROUTE PLANNER SUGGESTION"}</span>
                <p className="font-extrabold text-[11px] text-white leading-relaxed">
                  {calcResults.recommendedRefillsCount === 0 ? (
                    language === "tr"
                      ? "Bu rota için ara yakıt almanıza gerek yoktur. Tek depo kullanılabilir LPG ile hedefe varabilirsiniz."
                      : "No intermediate refueling is required for this route. You can reach the destination with a single tank of usable LPG."
                  ) : (
                    language === "tr"
                      ? `Bu rota için yaklaşık ${calcResults.recommendedRefillsCount} kez LPG ikmali yapmanız önerilir.`
                      : `Approximately ${calcResults.recommendedRefillsCount} LPG refill(s) are recommended for this route.`
                  )}
                </p>
                <div className="text-[10.5px] text-slate-300 font-medium pt-1 border-t border-slate-800">
                  {calcResults.recommendedRefillsCount === 0 ? (
                    language === "tr"
                      ? `Varışta yaklaşık %${calcResults.finalKalanLpgPercent} LPG kalacaktır.`
                      : `Approximately %${calcResults.finalKalanLpgPercent} LPG will remain upon arrival.`
                  ) : (
                    language === "tr"
                      ? `Son dolum sonrasında varışta tahmini %${calcResults.finalKalanLpgPercent} LPG yakıtınız kalacaktır.`
                      : `After the last refill, estimated %${calcResults.finalKalanLpgPercent} LPG will remain upon arrival.`
                  )}
                </div>
              </div>

              {/* Recommended Refill Points list */}
              {calcResults.stationsList && calcResults.stationsList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-450 font-bold block uppercase font-mono">{language === "tr" ? `ROTA ÜZERİNDEKİ LPG İSTASYONLARI (${calcResults.stationsCount})` : `LPG STATIONS ON THE ROUTE (${calcResults.stationsCount})`}</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {calcResults.stationsList.map((st: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center text-[10.5px]">
                        <span className="font-bold text-slate-700">⛽ {st.name}</span>
                        <span className="font-mono text-slate-400">~{st.distanceFromStart} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 italic space-y-2">
              <p>{language === "tr" ? "Henüz hesaplama yapılmadı." : "No calculation has been done yet."}</p>
              <p className="text-[10px] leading-relaxed">
                {language === "tr" ? "Marka, model, depo boyutu ve adres bilgilerinizi girip yukarıdaki butona tıklayarak ikmal planınızı oluşturabilirsiniz." : "Enter your brand, model, tank size, and address info, and click the button above to generate your refueling plan."}
              </p>
            </div>
          )}

          {/* Pricing indicator banner */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex items-center justify-center text-[10px] text-slate-650 font-mono">
            <span>{language === "tr" ? "LPG Litre Fiyatı:" : "LPG Price per Liter:"} <strong className="text-emerald-700">{lpgPrice.toFixed(2)} TL</strong></span>
          </div>

        </div>

      </div>

      {/* SEO-friendly Rich Structured Content for Indexing */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-5 mt-4 space-y-3 font-sans text-xs text-slate-600 leading-relaxed shadow-xs">
        <h2 className="font-black text-slate-800 text-sm tracking-tight border-b border-slate-100 pb-1.5">
          {language === "tr" ? "💡 LPG Rota Planlama ve Yakıt Tasarrufu Hakkında Bilinmesi Gerekenler" : "💡 What You Need to Know About LPG Route Planning and Fuel Savings"}
        </h2>
        {language === "tr" ? (
          <>
            <p>
              <strong>LPG ile kaç km giderim</strong> ve <strong>LPG maliyet hesaplama</strong> otomobil sahiplerinin uzun yola çıkmadan önce en çok yanıtını aradığı soruların başında gelir. Araçların benzin tüketimi temel alınarak yapılan LPG hesaplamalarında, LPG gazının yoğunluk farkından dolayı benzin tüketimine kıyasla ortalama %20 oranında daha fazla yakıt tüketimi gerçekleşir.
            </p>
            <p>
              <strong>LPG rota planlama</strong> sistemi, tank hacminizin %80 güvenlik sınırını dikkate alarak yolda kalmamanız için ideal dolum noktalarını belirler. Örneğin, 42 litrelik bir otogaz tankı, emniyet valfi dolum kuralı nedeniyle 33.6 litre kullanılabilir gaz hacmine sahiptir. Akıllı rota planlayıcısı, motor hacmi ve sürüş tipinize göre yol boyunca yapmanız gereken ikmal sayısını ve varış noktasındaki tahmini yakıt durumunuzu hesaplayarak yolculuğunuzu optimize eder.
            </p>
          </>
        ) : (
          <>
            <p>
              Questions like <strong>how many km can I drive with LPG</strong> and <strong>LPG cost calculation</strong> are among the most frequently asked questions by car owners before embarking on a long journey. In LPG calculations based on the vehicle's gasoline consumption, fuel consumption is on average 20% higher compared to gasoline consumption due to the density difference of LPG gas.
            </p>
            <p>
              The <strong>LPG route planning</strong> system determines the ideal refueling points to prevent you from getting stranded, taking into account the 80% safety limit of your tank capacity. For example, a 42-liter autogas tank has a usable gas volume of 33.6 liters due to the safety valve filling rule. The smart route planner optimizes your journey by calculating the number of refills you need to make along the way and your estimated fuel level at the destination, based on your engine displacement and driving style.
            </p>
          </>
        )}
      </section>

    </div>
  );
}
