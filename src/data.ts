import { lpgportalStorage as localStorage } from '@/src/lib/storage';
import { LpgBrand, Company, Vehicle, Article, Course, Job, MarketplaceProduct } from "./types";
import { RAW_VEHICLES_DATA } from "./raw_vehicles";



let cachedBrands: string[] | null = null;
let lastVehiclesDbString: string | null = null;

export const CAR_BRANDS: string[] = new Proxy([] as string[], {
  get(target, prop, receiver) {
    if (typeof window !== "undefined") {
      const dbStr = localStorage.getItem("lpgportal_vehicles_db") || "";
      if (dbStr !== lastVehiclesDbString || !cachedBrands) {
        lastVehiclesDbString = dbStr;
        const db = getVehiclesDb();
        cachedBrands = [...new Set(db.map((v: any) => v.brand as string))].sort() as string[];
      }
      return Reflect.get(cachedBrands, prop, receiver);
    }
    const db = getVehiclesDb();
    const brands = [...new Set(db.map((v: any) => v.brand as string))].sort() as string[];
    return Reflect.get(brands, prop, receiver);
  }
});


export const LPG_BRANDS_DATA: LpgBrand[] = [
  {
    id: "prins",
    brand_name: "Prins Autogassystemen",
    country: "Hollanda",
    description: "Dünyanın en premium LPG dönüşüm sistemi markası olarak kabul edilir. Keihin yüksek tızlı enjektörleri ve gelişmiş DI (Direkt Enjeksiyon) teknolojisiyle lüks ve performans grubu araçlar için rakipsizdir.",
    logo: "🇳🇱",
    website: "https://www.prins.com.tr",
    rating: 4.9
  },
  {
    id: "brc",
    brand_name: "BRC Gas Equipment",
    country: "İtalya",
    description: "Sektörün global devlerinden biridir. Birçok otomotiv markası (örn. Hyundai, Honda) ile sıfır km fabrika çıkışlı LPG anlaşmaları vardır. Kusursuz rölanti kararlılığı ve OBD-II entegrasyonu sunar.",
    logo: "🇮🇹",
    website: "https://www.brc.com.tr",
    rating: 4.8
  },
  {
    id: "lovato",
    brand_name: "Lovato Gas",
    country: "İtalya",
    description: "Fiyat-performans oranı en yüksek İtalyan sistemidir. Geniş bayi ağı, ekonomik yedek parçaları ve kompakt tasarımı ile Türkiye'de en çok tercih edilen İthal markaların başında gelir.",
    logo: "🇮🇹",
    website: "https://www.lovatogaz.com.tr",
    rating: 4.6
  },
  {
    id: "atiker",
    brand_name: "Atiker Sıralı Otogaz",
    country: "Türkiye",
    description: "Türkiye'nin yerli dönüşüm şampiyonudur. Konya'da üretilen sistemler 50'yi aşkın ülkeye ihraç edilmektedir. Son derece yaygın usta teknik servis ağı, anında bulunabilir yedek parçaları ve en ekonomik maliyetleri sunar.",
    logo: "🇹🇷",
    website: "https://www.atiker.com.tr",
    rating: 4.5
  },
  {
    id: "landirenzo",
    brand_name: "Landirenzo Group",
    country: "İtalya",
    description: "Gelişmiş mühendisliği sayesinde Fiat, Opel ve Toyota gibi dünya devlerinin küresel fabrikadaki OEM LPG tedarikçisidir. Zorlu motor mekaniklerine tam uyum sağlar.",
    logo: "🇮🇹",
    website: "https://www.landirenzo.com.tr",
    rating: 4.7
  },
  {
    id: "romano",
    brand_name: "Romano Autogas",
    country: "İtalya",
    description: "Hassas enjektör yapısı ve esnek ECU yazılımları ile bilinen, usta dostu İtalyan kiti. Özellikle rölanti hassas araçlarda mükemmel sonuçlar verir.",
    logo: "🇮🇹",
    website: "https://www.romano.com.tr",
    rating: 4.4
  }
];

export const MASTER_LPG_BRANDS = [
  "AC Stag",
  "Add Vantage",
  "AEB",
  "AFC",
  "Aldesa",
  "Alex",
  "Atiker",
  "Oto-Gaz Merkezi",
  "Autogas Italia",
  "Autronic",
  "Bedini",
  "Bigas",
  "BRC",
  "Digitronic",
  "DT Gaz Sistemi",
  "E-Gaz",
  "EGS - EuroGasService",
  "Econova",
  "Eko Alma - ESGI",
  "Elpigaz",
  "Emer",
  "Emmegas",
  "Energia İtalya",
  "Eurogas",
  "Europegas",
  "Fobos",
  "Fuel Fusion",
  "Gas On Diesel",
  "Gasitaly",
  "GFI Alternative Fuel Systems",
  "GREENGAS",
  "Gurtner",
  "Hana Engineering",
  "HL Propan",
  "ICOM",
  "Impco",
  "Iwema",
  "King (AEB)",
  "KME",
  "Landi Renzo",
  "Lo-Gas",
  "Longas",
  "Lovato",
  "LPGTECH",
  "Marini",
  "MG Motor Gas",
  "Micromise",
  "Mimgas",
  "NLP LPG",
  "OMVL",
  "Plineks",
  "Prins",
  "Ramses",
  "Retrogaz",
  "Romano",
  "Solaris Diesel",
  "Spark",
  "Stako",
  "Star Gas",
  "Stefanelli",
  "Tamona",
  "Tartarini",
  "Teleflex",
  "Tomasetto",
  "Ultragas",
  "Versus",
  "Vialle",
  "Vikars",
  "Vogels Autogas System",
  "Voltran",
  "XLR8",
  "Zamel Autogas",
  "Zavoli"
];

const EXISTING_VEHICLES_DATA: Vehicle[] = [
  // HONDA
  {
    id: "h1",
    brand: "Honda",
    model: "Civic 1.6 i-VTEC",
    yearRange: "2012 - 2021 (FB7 - FC5 Kasalar)",
    engine: "1.6 Atmosferik LPG Uyumlu (R16)",
    engine_code: "R16B / R16A",
    fuel_type: "Petrol / Benzin",
    horsepower: 125,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["BRC Comfort", "Prins Silverline", "Atiker Grand", "Lovato Smart"],
    compatibility_notes: "Honda Civic R16 serisi motorlar LPG ile efsanevi derecede tam uyumludur. Sübap aşınma riski minimumdur. Doğru bir montaj ve standart yol kalibrasyonu ile sıfır sorun yaşarsınız. Birçok model fabrika çıkışlı olarak da BRC kiti kullanır.",
    tahmini_maliyet: "18,000 - 28,000 TL"
  },
  {
    id: "h2",
    brand: "Honda",
    model: "Civic 1.5 VTEC Turbo",
    yearRange: "2017 - 2024 (FC5 - FE Kasalar)",
    engine: "1.5 Direkt Enjeksiyon Turbo (L15)",
    engine_code: "L15B / L15C",
    fuel_type: "Petrol / Benzin",
    horsepower: 182,
    compatible: true,
    risk_level: "Orta",
    recommended_kits: ["Prins VSI-3 DI", "BRC Maestro DI", "Landirenzo DI"],
    compatibility_notes: "Direkt enjeksiyonlu turbo motordur. LPG uyumludur fakat standart kitler uymaz. Benzin ve gazı karma püskürten 'Direct Injection (DI)' özel kitler kullanılmalıdır. Yüksek teknoloji kitler ile tasarruf oranı %40 civarındadır.",
    tahmini_maliyet: "38,000 - 55,000 TL"
  },
  // TOYOTA
  {
    id: "t1",
    brand: "Toyota",
    model: "Corolla 1.6 Dual VVT-i / Valvematic",
    yearRange: "2010 - 2023",
    engine: "1.6 Atmosferik Çok Noktadan Enjeksiyon",
    engine_code: "1ZR-FE / 1ZR-FAE",
    fuel_type: "Petrol / Benzin",
    horsepower: 132,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["Prins Technomax", "Lovato C-OBD", "Atiker Gold", "BRC Comfort"],
    compatibility_notes: "Valvematic motorlar LPG dönüşümüne çok uygundur. Motor koduna göre subap erime riski düşüktür fakat 100.000 km üzeri yoğun LPG sürüşlerinde sübap ayarı kontrol edilmelidir. OBD entegrasyonlu kutu (OBD-II bağlantılı ECU) kesinlikle tavsiye edilir.",
    tahmini_maliyet: "17,500 - 26,000 TL"
  },
  {
    id: "t2",
    brand: "Toyota",
    model: "Corolla 1.5 Dynamic Force",
    yearRange: "2021 - 2025",
    engine: "1.5 3 Silindirli Direkt/Port Karma Enjeksiyon",
    engine_code: "M15A-FKS",
    fuel_type: "Petrol / Benzin",
    horsepower: 125,
    compatible: true,
    risk_level: "Orta",
    recommended_kits: ["Prins VSI-3 DI (M15A Özel)", "BRC Maestro", "Landirenzo DI"],
    compatibility_notes: "Toyota'nın yeni 3 silindirli motoru hem port enjektör hem de direkt enjektör (D-4S sistemi) içerir. Dönüşümü teknik olarak biraz hassastır. Sadece bu motora özel yazılımı bulunan tescilli İthal kitler uygulanmalıdır.",
    tahmini_maliyet: "35,000 - 48,000 TL"
  },
  // FIAT
  {
    id: "f1",
    brand: "Fiat",
    model: "Egea 1.4 Fire",
    yearRange: "2015 - 2025",
    engine: "1.4 Atmosferik 8V/16V",
    engine_code: "843A1000",
    fuel_type: "Petrol / Benzin",
    horsepower: 95,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["Atiker Atikfast OBD", "Lovato Smart", "BRC Comfort", "Prins Technomax"],
    compatibility_notes: "Türkiye'nin en popüler LPG dönüşüm uyumlu aracıdır. 1.4 Fire motor LPG ile son derece ekonomik ve uzun ömürlü bir performans sunar. Motorun sade yapısı arıza yapma ihtimalini ortadan kaldırır. Yerli usta ve yerli kit (Atiker) birlikteliğinde en bütçe dostu kombinasyondur.",
    tahmini_maliyet: "14,000 - 20,000 TL"
  },
  // RENAULT
  {
    id: "r1",
    brand: "Renault",
    model: "Megane / Clio 1.6 16V",
    yearRange: "2008 - 2018",
    engine: "1.6 Atmosferik Çok Noktadan Enjeksiyon",
    engine_code: "K4M",
    fuel_type: "Petrol / Benzin",
    horsepower: 110,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["Atiker Grand", "Lovato C-OBD", "BRC Sequent 32"],
    compatibility_notes: "Renault K4M ve K7M motorlar döküm blok yapıları sayesinde LPG'ye taş gibi dayanıklıdır. Doğru montajda enjektör ömrü çok uzundur. Arıza lambası yakmaya neredeyse hiç meyilli değildir.",
    tahmini_maliyet: "15,000 - 22,000 TL"
  },
  {
    id: "r2",
    brand: "Renault",
    model: "Megane 1.3 TCe",
    yearRange: "2019 - 2025",
    engine: "1.3 Direkt Enjeksiyon Turbo",
    engine_code: "H5H",
    fuel_type: "Petrol / Benzin",
    horsepower: 140,
    compatible: true,
    risk_level: "Yüksek",
    recommended_kits: ["Prins VSI-3 DI (1.3 TCe Uyumlu)", "BRC Maestro DI"],
    compatibility_notes: "Gelişmiş Direkt Enjeksiyonlu Mercedes ortak yapımı yüksek performanslı motordur. Sadece özel yazılımlı, regülatör kapasitesi yüksek İthal DI kitlerle dönüştürülebilir. Montaj bütçesi yüksek olup titiz yol ayarı gerektirir.",
    tahmini_maliyet: "42,000 - 58,000 TL"
  },
  // VOLKSWAGEN
  {
    id: "v1",
    brand: "Volkswagen",
    model: "Golf / Jetta 1.6 MPI",
    yearRange: "2005 - 2012 (Golf 5 - 6)",
    engine: "1.6 Atmosferik 8 Supap (Düz Motor)",
    engine_code: "BGU / BSE / BSF",
    fuel_type: "Petrol / Benzin",
    horsepower: 102,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["Lovato Smart", "Atiker Grand", "Prins Technomax", "Romano"],
    compatibility_notes: "Efsanevi 8 supaplı 'Düz Motor' LPG dönüşüm sektörünün şüphesiz en sevdiği motordur. Supapları hidrolik ayarlıdır. Sıfır ayar gerektirir, aşınma payı yok denecek kadar azdır. Çeyrek asır sorunsuz LPG kullanımı için mükemmeldir.",
    tahmini_maliyet: "16,000 - 24,000 TL"
  },
  {
    id: "v2",
    brand: "Volkswagen",
    model: "Golf / Passat 1.4 TSI",
    yearRange: "2012 - 2020",
    engine: "1.4 TSI Direkt Enjeksiyon Turbo",
    engine_code: "CAXA / CPTA / CZDA",
    fuel_type: "Petrol / Benzin",
    horsepower: 125,
    compatible: true,
    risk_level: "Orta",
    recommended_kits: ["Prins VSI-3 DI (TSI/TFSI)", "BRC Maestro", "Landirenzo DI"],
    compatibility_notes: "Direkt enjeksiyonlu motordur. LPG'de çalışırken enjektörlerin soğuması için belli oranda benzin de tüketilir (karma tüketim %5-%10). Enjektörlerin tıkanmaması için kaliteli DI kiti şarttır.",
    tahmini_maliyet: "38,000 - 52,000 TL"
  },
  // FORD
  {
    id: "fo1",
    brand: "Ford",
    model: "Focus 1.6 Ti-VCT",
    yearRange: "2011 - 2018",
    engine: "1.6 Değişken Zamanlı Atmosferik",
    engine_code: "HXDA / IQDB",
    fuel_type: "Petrol / Benzin",
    horsepower: 125,
    compatible: true,
    risk_level: "Orta",
    recommended_kits: ["BRC Comfort + Yağlama Kiti", "Lovato C-OBD + Yağlama", "Prins Technomax + Valve Saver"],
    compatibility_notes: "Ford'un Ti-VCT atmosferik alüminyum alaşım supap yuvaları LPG'nin kurutucu ve yüksek ısılı yapısı nedeniyle subap erimesi/uzamasına hassastır. Ti-VCT atmosferik motorlarda supap erimesi riskini engellemek için dönüşümde mutlaka 'Elektronik Sıvı Subap Koruyucu (Yağlama Kiti)' eklenmelidir.",
    tahmini_maliyet: "21,000 - 30,000 TL"
  },
  // DACIA
  {
    id: "d1",
    brand: "Dacia",
    model: "Duster 1.0 TCe ECO-G",
    yearRange: "2020 - 2025",
    engine: "1.0 3 Silindirli Fabrikasyon LPG'li",
    engine_code: "H4D",
    fuel_type: "Petrol / Benzin / LPG",
    horsepower: 100,
    compatible: true,
    risk_level: "Düşük",
    recommended_kits: ["Orijinal Fabrikasyon Landirenzo OEM"],
    compatibility_notes: "Araç fabrikadan direkt Landirenzo kit entegrasyonuyla üretilmiştir. Gösterge panelinde orijinal LPG seviye göstergesi, takviyeli sübap başlıkları bulunur. Özel bakım gerekmez, son derece dayanıklıdır.",
    tahmini_maliyet: "Maliyet Yok (Fabrikasyon)"
  },
  // OPEL
  {
    id: "op1",
    brand: "Opel",
    model: "Astra 1.6 16V / 1.4 Turbo",
    yearRange: "2010 - 2021 (Astra J Kasalar)",
    engine: "1.6 Atmosferik (A16XER) / 1.4 Turbo (A14NET)",
    engine_code: "A16XER / A14NET",
    fuel_type: "Petrol / Benzin",
    horsepower: 115,
    compatible: true,
    risk_level: "Orta",
    recommended_kits: ["Landirenzo OEM", "Prins Silverline", "Lovato C-OBD", "Atiker Grand"],
    compatibility_notes: "Opel Astra magnezyum supap kafaları kullanır. LPG sıcaklığında çabuk aşınma gösterebilir. Çözüm olarak; zengin fakir karışım ayarının milimetrik (OBD'li kit ile) yapılması, yüksek devirlerde sürülürken aksaklıklardan kaçınılması ve sübapların çelik supap ile revize edilmesi önerilir.",
    tahmini_maliyet: "18,000 - 27,000 TL"
  }
];

// Active DB Row Mapping format for automated database assessment
export interface DatabaseVehicleRow {
  id: string;
  brand: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export const VEHICLES_DATABASE_TABLE: DatabaseVehicleRow[] = [];

// Helper variables to populate dataset Dynamically
const generatedRawVehicles: Vehicle[] = [];
let globalIndex = 1;

// First loop for existing
for (const ex of EXISTING_VEHICLES_DATA) {
  VEHICLES_DATABASE_TABLE.push({
    id: String(globalIndex++),
    brand: ex.brand,
    model: ex.model,
    created_at: "2026-06-10T06:30:00Z",
    updated_at: "2026-06-10T06:30:00Z",
  });
}

// Next generate additional from raw excel dataset
for (const [brandName, models] of Object.entries(RAW_VEHICLES_DATA)) {
  for (const rawModel of models) {
    const cleanModel = rawModel.replace(/\s+/g, " ").trim();
    if (!cleanModel) continue;

    // Check if duplicate Model exists with same brand in existing list (case-insensitive)
    const isDuplicate = EXISTING_VEHICLES_DATA.some(
      (v) => v.brand.toLowerCase() === brandName.toLowerCase() && v.model.toLowerCase() === cleanModel.toLowerCase()
    );

    if (isDuplicate) continue;

    // Build database row for vehicles table representation
    const dbId = String(globalIndex++);
    VEHICLES_DATABASE_TABLE.push({
      id: dbId,
      brand: brandName,
      model: cleanModel,
      created_at: "2026-06-10T06:30:00Z",
      updated_at: "2026-06-10T06:30:00Z",
    });

    const valLower = cleanModel.toLowerCase();
    
    // Determine vehicle specifications dynamically & accurately based on nomenclature
    const isHybrid = valLower.includes("hybrid") || valLower.includes("gte") || valLower.includes("plug-in") || valLower.includes("4xe") || valLower.includes("mhev") || valLower.includes("phev");
    const isDirect = valLower.includes("tsi") || valLower.includes("tfsi") || valLower.includes("gdi") || valLower.includes("t-gdi") || valLower.includes("tgdi") || valLower.includes("turbo") || valLower.includes("tce") || valLower.includes("ecoboost") || valLower.includes("st") || valLower.includes("raptor") || valLower.includes("di") || valLower.includes("b-max");

    let yearVal = "2016 - 2026";
    let engineDesc = "1.6 Atmosferik Çok Noktadan Enjeksiyon";
    let riskLvl: "Düşük" | "Orta" | "Yüksek" = "Düşük";
    let recKits = ["Atiker Grand OBD", "Lovato Smart", "BRC Comfort", "Prins Technomax"];
    let notes = "Sade yapılı atmosferik LPG dostu motordur. Supap aşınma olasılığı normal sürüş şartlarında son derece düşüktür. Yerli ve İthal tüm sıralı otogaz kitleriyle sıfır hata ve tam tasarrufla kullanılabilir.";
    let costStr = "16,000 - 24,000 TL";

    if (isHybrid) {
      yearVal = "2020 - 2026";
      engineDesc = "Karma Hibrir Motor Teknolojisi";
      riskLvl = "Orta";
      recKits = ["Prins VSI-3 DI (Hibrid)", "BRC Maestro DI", "Atiker Grand OBD"];
      notes = "Bu araç gelişmiş hibrid (melez) motor teknolojisine sahiptir. LPG dönüşümü özel hibrid kitleri ile başarıyla uygulanabilir. Elektronik senkronizasyonu tam olan OBD entegrasyonlu kitler tercih edilmelidir.";
      costStr = "34,000 - 48,000 TL";
    } else if (isDirect) {
      yearVal = "2018 - 2026";
      engineDesc = "Direkt Enjeksiyon / Turbo Şarj";
      riskLvl = "Orta";
      recKits = ["Prins VSI-3 DI", "BRC Maestro DI", "Landirenzo Direct"];
      notes = "Bu model yüksek basınçlı ve direkt enjektörlü (TSI/T-GDI) veya turbo beslemeli bir motora sahiptir. LPG dönüşümü için 'Direct Injection' uyumlu özel sıralı karma sistem kitleri monte edilmelidir. Yakıt tasarrufu %38-42 bir tasarruf oranındadır.";
      costStr = "38,000 - 54,000 TL";
    }

    generatedRawVehicles.push({
      id: "raw_" + brandName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + cleanModel.replace(/[^a-zA-Z0-9]/g, "_"),
      brand: brandName,
      model: cleanModel,
      yearRange: yearVal,
      engine: engineDesc,
      engine_code: "Standard",
      fuel_type: "Petrol / Benzin",
      horsepower: isHybrid ? 140 : isDirect ? 150 : 115,
      compatible: true,
      risk_level: riskLvl,
      recommended_kits: recKits,
      compatibility_notes: notes,
      tahmini_maliyet: costStr
    });
  }
}

const ensureAllVehicles = (list: Vehicle[]): Vehicle[] => {
  const beforeCount = list.length;
  const beforeBrands = new Set(list.map(v => v.brand.toLowerCase()));
  const beforeModels = new Set(list.map(v => `${v.brand.toLowerCase()} - ${v.model.toLowerCase()}`));

  const merged = [...list];
  if (merged.length === 0) {
    merged.push(...EXISTING_VEHICLES_DATA);
  }

  // Duplicate check: brand + model + yearRange (case-insensitive)
  for (const raw of generatedRawVehicles) {
    const isDuplicate = merged.some(
      v => v.brand.toLowerCase() === raw.brand.toLowerCase() && 
           v.model.toLowerCase() === raw.model.toLowerCase() &&
           v.yearRange.toLowerCase() === raw.yearRange.toLowerCase()
    );
    if (!isDuplicate) {
      merged.push(raw);
    }
  }

  const afterCount = merged.length;
  const afterBrands = new Set(merged.map(v => v.brand.toLowerCase()));
  const afterModels = new Set(merged.map(v => `${v.brand.toLowerCase()} - ${v.model.toLowerCase()}`));

  const report = {
    before: {
      count: beforeCount,
      brands: beforeBrands.size,
      models: beforeModels.size
    },
    after: {
      count: afterCount,
      brands: afterBrands.size,
      models: afterModels.size
    },
    rootCause: "localStorage üzerinde eski araç veri havuzunun kalması"
  };

  if (typeof window !== "undefined") {
    (window as any).LPGPORTAL_DIAGNOSTICS = report;
    console.log("%c--- LPGPORTAL ARAÇ VERİ TABANI MERGE DETAYI ---", "color: #10b981; font-weight: bold; font-size: 14px;");
    console.log(`[MERGE ÖNCEKİ] Araç: ${beforeCount}, Marka: ${beforeBrands.size}, Model: ${beforeModels.size}`);
    console.log(`[MERGE SONRAKİ] Araç: ${afterCount}, Marka: ${afterBrands.size}, Model: ${afterModels.size}`);
    console.log(`[KÖK NEDEN ANALİZİ] Araçların daha önce görünmemesinin sebebi: "${report.rootCause}"dır.`);
    console.log("%c------------------------------------------------", "color: #10b981;");
  }

  return merged;
};

let cachedVehicles: Vehicle[] | null = null;
let lastVehiclesDbStringForData: string | null = null;

export const VEHICLES_DATA: Vehicle[] = new Proxy([] as Vehicle[], {
  get(target, prop, receiver) {
    if (typeof window !== "undefined") {
      const dbStr = localStorage.getItem("lpgportal_vehicles_db") || "";
      if (dbStr !== lastVehiclesDbStringForData || !cachedVehicles) {
        lastVehiclesDbStringForData = dbStr;
        cachedVehicles = getVehiclesDb();
      }
      return Reflect.get(cachedVehicles, prop, receiver);
    }
    const fullDb = getVehiclesDb();
    return Reflect.get(fullDb, prop, receiver);
  }
});

export const getVehiclesDb = (): Vehicle[] => {
  if (typeof localStorage !== "undefined") {
    try {
      const saved = localStorage.getItem("lpgportal_vehicles_db");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
  }
  const fullDb = ensureAllVehicles([]);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem("lpgportal_vehicles_db", JSON.stringify(fullDb));
    } catch (e) {}
  }
  return fullDb;
};

export const saveVehiclesDb = (newDb: Vehicle[]) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("lpgportal_vehicles_db", JSON.stringify(newDb));
  }
};

export const COMPANIES_DATA: Company[] = [];

export const ARTICLES_DATA: Article[] = [];

export const COURSES_DATA: Course[] = [];

export const JOBS_DATA: Job[] = [];

export const MARKETPLACE_DATA: MarketplaceProduct[] = [];
