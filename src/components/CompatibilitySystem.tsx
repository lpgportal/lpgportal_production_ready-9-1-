import React, { useState } from "react";
import { VEHICLES_DATA, CAR_BRANDS, getVehiclesDb } from "../data";
import { Vehicle } from "../types";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

interface CompatibilityProps {
  onPrepopulateQuote: (brand: string, model: string, year: string, engine: string) => void;
}

export default function CompatibilitySystem({ onPrepopulateQuote }: CompatibilityProps) {
  const { language, t, translateEntity } = useLanguage();
  const [vehiclesDb, setVehiclesDb] = React.useState<Vehicle[]>(() => getVehiclesDb());
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [customYear, setCustomYear] = useState("");
  const [customEngine, setCustomEngine] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);

  const carBrands = React.useMemo(() => {
    return Array.from(new Set(vehiclesDb.map(v => v.brand))).sort();
  }, [vehiclesDb]);

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

  React.useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem("lpgportal_vehicles_db");
        if (saved) {
          const parsed = JSON.parse(saved);
          setVehiclesDb(prev => JSON.stringify(prev) === JSON.stringify(parsed) ? prev : parsed);
        }
      } catch (e) {}
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("lpgportal_db_update", handleSync as any);
    const interval = setInterval(handleSync, 1500);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("lpgportal_db_update", handleSync as any);
      clearInterval(interval);
    };
  }, []);

  // Filter models based on chosen brand
  const brandVehicles = vehiclesDb.filter(
    (v) => v.brand.toLowerCase() === selectedBrand.toLowerCase()
  );

  const handleSearch = () => {
    if (!selectedBrand) return;

    if (selectedModelId === "custom") {
      // Dynamic simulated result based on typical Turkish market features
      const isDirect = customEngine.toLowerCase().includes("direkt") || customEngine.toLowerCase().includes("tsi") || customEngine.toLowerCase().includes("tce") || customEngine.toLowerCase().includes("gdi") || customEngine.toLowerCase().includes("turbo") || customEngine.toLowerCase().includes("direct");
      
      const simulatedVehicle: Vehicle = {
        id: "simulated_" + Date.now(),
        brand: selectedBrand === "custom" ? (customBrand || (language === "tr" ? "Özel Marka" : "Custom Brand")) : selectedBrand,
        model: customModel || (language === "tr" ? "Özel Model" : "Custom Model"),
        yearRange: customYear,
        engine: customEngine || "1.6 Atmosferik / Turbo",
        engine_code: language === "tr" ? "Bilinmiyor" : "Unknown",
        fuel_type: "Benzin/Petrol",
        horsepower: 110,
        compatible: true,
        risk_level: isDirect ? "Orta" : "Düşük",
        recommended_kits: isDirect 
          ? ["Prins VSI-3 DI", "BRC Maestro DI", "Landirenzo Direct"]
          : ["Atiker Grand", "Lovato Smart", "BRC Comfort"],
        compatibility_notes: isDirect
          ? (language === "tr" 
              ? "Bu motor tipi Direkt Enjeksiyon barındırıyor veya aşırı beslemelidir. Uygulama yapılabilir ancak enjektörlerin soğutulması için karma sistem (LPG yanarken az miktarda benzin tüketen) 'DI' kit montajı zorunludur. Tasarruf oranınız yaklaşık %38-42 bandında kalacaktır."
              : "This engine features Direct Injection or high pressure turbo charging. Conversion is fully supported, but a special dual-fuel 'DI' kit utilizing brief petrol cycles to cool the direct gas injectors is mandatory. Saving ratio remains steady at approximately 38-42%.")
          : (language === "tr"
              ? "Sade yapıdaki atmosferik lpg dostu motordur. Supap aşınma olasılığı normal sürüş şartlarında son derece düşüktür. Yerli ve İthal tüm sıralı otogaz kitleriyle sıfır hata ve tam tasarrufla kullanılabilir."
              : "Simple atmospheric LPG-friendly engine. Risk of valve wear under normal driving conditions is extremely low. Reliable with all local or imported sequential autogas kits at maximum efficiency."),
        tahmini_maliyet: isDirect ? "36,000 - 54,000 TL" : "15,000 - 24,000 TL"
      };
      setFoundVehicle(simulatedVehicle);
    } else {
      const match = vehiclesDb.find((v) => v.id === selectedModelId);
      setFoundVehicle(match || null);
    }
    setShowResult(true);
  };

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto" id="lpg-compat-sys">
      <div className="text-center mb-8">
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
          {language === "tr" ? "Modül 1: Araç LPG Uyumluluk Sistemi" : "Module 1: Vehicle LPG Compatibility System"}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          {language === "tr" ? "Aracınız LPG Dönüşümüne Uyumlu mu?" : "Is Your Vehicle LPG Compatible?"}
        </h2>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm">
          {language === "tr" 
            ? "Marka, model ve motor tipinizi girerek LPG uyumluluğunu, usta ekibinin teknik notlarını ve maliyet tahmini raporunu anında edinin."
            : "Enter your brand, model, and engine variant to instantly retrieve LPG compatibility, technical notes, and estimated assembly costs."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60 p-6 rounded-xl border border-slate-200/80">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {language === "tr" ? "1. Marka Seçin" : "1. Choose Brand"}
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBrand(val);
              if (val === "custom") {
                setSelectedModelId("custom");
              } else {
                setSelectedModelId("");
              }
              setSelectedYear("");
              setShowResult(false);
            }}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-800 rounded-lg p-3 text-sm focus:outline-none transition shadow-sm cursor-pointer"
          >
            <option value="">{language === "tr" ? "-- Marka Seçin --" : "-- Choose Brand --"}</option>
            {carBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
            <option value="custom">
              {language === "tr" ? "➕ Listede Yok Mu? Kendi Bilgilerini Gir" : "➕ Not on the list? Enter custom details"}
            </option>
          </select>

          {selectedBrand && selectedBrand !== "custom" && (
            <div className="mt-4 animate-fade-in">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {language === "tr" ? "2. Model Seçin" : "2. Choose Model"}
              </label>
              <select
                value={selectedModelId}
                onChange={(e) => {
                  setSelectedModelId(e.target.value);
                  setSelectedYear("");
                  setShowResult(false);
                }}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-800 rounded-lg p-3 text-sm focus:outline-none transition shadow-sm cursor-pointer"
              >
                <option value="">{language === "tr" ? "-- Model Seçin --" : "-- Choose Model --"}</option>
                {brandVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.model} ({v.yearRange.split(" (")[0]})
                  </option>
                ))}
                <option value="custom">
                  {language === "tr" ? "➕ Listede Yok Mu? Kendi Bilgilerini Gir" : "➕ Not on the list? Enter custom details"}
                </option>
              </select>
            </div>
          )}

          {selectedBrand && selectedModelId && selectedModelId !== "custom" && (
            <div className="mt-4 animate-fade-in">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {language === "tr" ? "3. Yıl Seçin" : "3. Choose Year"}
              </label>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setShowResult(false);
                }}
                className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-800 rounded-lg p-3 text-sm focus:outline-none transition shadow-sm cursor-pointer"
              >
                <option value="">{language === "tr" ? "-- Yıl Seçin --" : "-- Choose Year --"}</option>
                {getYearsForModel(selectedBrand, brandVehicles.find(v => v.id === selectedModelId)?.model || "").map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          {selectedModelId === "custom" ? (
            <div className="space-y-4 animate-fade-in bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-left">
              <span className="text-xs font-semibold text-emerald-700">
                {language === "tr" ? "Özel Sürüm Detayları" : "Custom Variant Details"}
              </span>
              {selectedBrand === "custom" && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {language === "tr" ? "Marka Adı" : "Brand Name"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "tr" ? "Örn: Tesla, BYD, Porsche" : "e.g. Tesla, BYD, Porsche"}
                    value={customBrand}
                    onChange={(e) => {
                      setCustomBrand(e.target.value);
                      setShowResult(false);
                    }}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-sm focus:outline-none text-slate-800 font-bold"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  {language === "tr" ? "Model Adı" : "Model Name"}
                </label>
                <input
                  type="text"
                  placeholder={language === "tr" ? "Örn: Civic, Megane, Focus" : "e.g. Civic, Megane, Focus"}
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-sm focus:outline-none text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {language === "tr" ? "Üretim Yılı" : "Year of Production"}
                  </label>
                  <input
                    type="number"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-sm focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {language === "tr" ? "Motor Tipi" : "Engine Variant"}
                  </label>
                  <select
                    value={customEngine}
                    onChange={(e) => setCustomEngine(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-lg p-2 text-sm focus:outline-none text-slate-800 cursor-pointer"
                  >
                    <option value="">{language === "tr" ? "-- Seçin --" : "-- Choose --"}</option>
                    <option value="Atmosferik Çok Noktadan">
                      {language === "tr" ? "Atmosferik (MPI/VTEC/VVT-i)" : "Atmospheric (MPI/VTEC/VVT-i)"}
                    </option>
                    <option value="Direkt Enjeksiyon Turbo">
                      {language === "tr" ? "Direkt Enjeksiyon Turbo (TSI/TCe/DI)" : "Direct Injection Turbo (TSI/TCe/DI)"}
                    </option>
                    <option value="Eski Nesil Karbüratörlü">
                      {language === "tr" ? "Karbüratörlü / Tek Nokta" : "Carbureted / Single Point"}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center border-l border-slate-200 p-4">
              <Sparkles className="h-10 w-10 text-emerald-600 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-slate-400">
                {language === "tr" 
                  ? "SEO Arama Terimleri: Toyota Corolla LPG olur mu?, Honda Civic LPG uyumluluğu, 1.4 Fire Egea en iyi lpg kiti" 
                  : "Quick Search: Best LPG kit for civic or cololla models, GDI turbo LPG setups"
                }
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2 mt-4 text-center">
          <button
            onClick={handleSearch}
            disabled={!selectedBrand || !selectedModelId || (selectedModelId !== "custom" && !selectedYear)}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {language === "tr" ? "Uyumluluk Analizini Başlat" : "Launch Compatibility Check"}
          </button>
        </div>
      </div>

      {showResult && foundVehicle && (
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-xs animate-fade-in text-left">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-4 mb-4 gap-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-mono">
                {language === "tr" ? "Araç Kimlik Raporu" : "Vehicle Identity Report"}
              </span>
              <h3 className="text-2xl font-bold text-slate-950">
                {foundVehicle.brand} {foundVehicle.model}
              </h3>
              <p className="text-slate-600 text-xs shadow-xs p-1">
                {language === "tr" ? "Uyumlu Dönem: " : "Compatible Period: "}
                <strong className="text-slate-800">{foundVehicle.yearRange}</strong> | 
                {language === "tr" ? " Motor: " : " Engine: "}
                <strong className="text-slate-800">
                  {foundVehicle.id.includes("simulated_") 
                    ? (language === "tr" ? "Çok Noktadan Enjeksiyon" : "Multi-point Injection")
                    : (language === "tr" ? "Direkt Enjeksiyonlu" : "Direct Injection Setup")
                  }
                </strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {language === "tr" ? "Mühendis ve Usta Kalibrasyon Notu:" : "Expert Calibration and Engineering Manual:"}
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed bg-white p-4 rounded-lg border border-slate-200">
                  {translateEntity(foundVehicle, "compatibility_notes")}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  {language === "tr" ? "Önerilen Otogaz Kit Modelleri:" : "Recommended Autogas Kit Models:"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {foundVehicle.recommended_kits.map((kit, i) => (
                    <span
                      key={i}
                      className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md font-semibold cursor-default hover:border-emerald-500 hover:text-emerald-700 transition shadow-sm"
                    >
                      🛠️ {kit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-between shadow-xs">
              <div>
                <span className="text-xs text-slate-400 uppercase font-mono block mb-1">
                  {language === "tr" ? "Maliyet Hesaplama" : "Cost Calculation"}
                </span>
                <div className="flex items-center text-emerald-600 font-bold text-xl mb-3">
                  <span>{language === "tr" ? "15.000 TL - 65.000 TL" : "$450 - $1,950 USD"}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  {language === "tr"
                    ? "Tahmini maliyet; kit fiyatı, sızdırmazlık raporu, proje tescil, tank emniyet valfi ve montaj işçilik bedellerini içeren Türkiye ortalamasıdır."
                    : "Estimated average expenses covering kit cost, legal leakage registration, certification, and labor inside Turkey."
                  }
                </p>
              </div>

              <button
                onClick={() => onPrepopulateQuote(
                  foundVehicle.brand,
                  foundVehicle.model,
                  selectedModelId === "custom" ? customYear : selectedYear,
                  foundVehicle.engine
                )}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all duration-150 transform hover:scale-[1.02] cursor-pointer"
              >
                <span>{language === "tr" ? "Hemen Teklif Al (Teklif Al'a Gönder)" : "Get Offer Now (Send to Bidding Form)"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
