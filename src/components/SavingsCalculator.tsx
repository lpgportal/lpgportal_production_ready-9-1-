import React, { useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";

export default function SavingsCalculator() {
  const { language } = useLanguage();

  // Calculator States matching NewsCenter defaults
  const [benzinPrice, setBenzinPrice] = useState(43.50);
  const [lpgPrice, setLpgPrice] = useState(21.40);
  const [avgConsumption, setAvgConsumption] = useState(8.0); // lt per 100km
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [kitCost, setKitCost] = useState(20000);

  // Math for LPG
  // LPG density is lower, so consumption lt/100km rises by ~15-20% compared to gasoline. Calculated with +20%.
  const lpgConsumption = avgConsumption * 1.2;

  // Monthly costs
  const monthlyBenzinCost = (monthlyKm / 100) * avgConsumption * benzinPrice;
  const monthlyLpgCost = (monthlyKm / 100) * lpgConsumption * lpgPrice;
  const monthlySavings = monthlyBenzinCost - monthlyLpgCost;
  const annualSavings = monthlySavings * 12;

  const amortizationMonths = monthlySavings > 0 ? parseFloat((kitCost / monthlySavings).toFixed(1)) : 999;

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6 text-left">
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <Calculator className="h-5 w-5 text-emerald-600" />
        <h3 className="font-bold text-lg text-slate-900 font-sans">
          {language === "tr" ? "Benzin / LPG Tasarruf Hesaplama Robotu" : "Benzene / LPG Fuel Economy Calculator"}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500 font-sans">
        <div>
          <label className="block mb-2 font-mono uppercase tracking-wider text-slate-500">
            {language === "tr" ? "Benzin Litre Fiyatı (TL)" : "Gasoline Price / Liter (TL)"}
          </label>
          <input
            type="number"
            step="0.01"
            value={benzinPrice}
            onChange={(e) => setBenzinPrice(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-3 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
          />
        </div>

        <div>
          <label className="block mb-2 font-mono uppercase tracking-wider text-slate-500">
            {language === "tr" ? "LPG Litre Fiyatı (TL)" : "LPG Price / Liter (TL)"}
          </label>
          <input
            type="number"
            step="0.01"
            value={lpgPrice}
            onChange={(e) => setLpgPrice(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-3 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
          />
        </div>

        <div>
          <label className="block mb-2 font-mono uppercase tracking-wider text-slate-500">
            {language === "tr" ? "Ortalama Benzin Tüketimi (Lt/100 Km)" : "Average Benzene Cons. (Liters/100 Km)"}
          </label>
          <input
            type="number"
            step="0.1"
            value={avgConsumption}
            onChange={(e) => setAvgConsumption(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-3 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
          />
        </div>

        <div>
          <label className="block mb-2 font-mono uppercase tracking-wider text-slate-500">
            {language === "tr" ? "Ortalama Aylık Mesafe (Km)" : "Average Monthly Distance (Km)"}
          </label>
          <input
            type="number"
            value={monthlyKm}
            onChange={(e) => setMonthlyKm(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-3 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block mb-2 font-mono uppercase tracking-wider text-slate-500">
            {language === "tr" ? "LPG Dönüşüm/Kit Montaj Bütçe Maliyeti (TL)" : "LPG Conversion / Kit Assembly Cost (TL)"}
          </label>
          <input
            type="number"
            value={kitCost}
            onChange={(e) => setKitCost(Number(e.target.value))}
            className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-3 text-sm focus:outline-none text-slate-800 font-bold shadow-xs"
          />
        </div>
      </div>

      {/* Results dashboard display visualizer */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-center shadow-xs font-sans">
        <div className="p-3 bg-red-50/50 border border-red-100 rounded-lg">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
            {language === "tr" ? "Mevcut Benzin Maliyeti" : "Current Petrol Cost"}
          </span>
          <p className="text-sm font-semibold text-slate-400">{language === "tr" ? "Aylık" : "Monthly"}</p>
          <p className="text-xl font-bold text-red-600 mt-1">{monthlyBenzinCost.toLocaleString("tr-TR", {maximumFractionDigits:0})} TL</p>
        </div>
        
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600">
            {language === "tr" ? "Yeni LPG Maliyeti" : "New Predicted LPG Cost"}
          </span>
          <p className="text-sm font-semibold text-emerald-700">
            {language === "tr" ? "Aylık *(+20% Tüketimle)" : "Monthly *(at +20% consumption)"}
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{monthlyLpgCost.toLocaleString("tr-TR", {maximumFractionDigits:0})} TL</p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-700">
            {language === "tr" ? "Net Tasarrufunuz" : "Net Saved Amount"}
          </span>
          <p className="text-sm font-semibold text-slate-600">{language === "tr" ? "Yıllık" : "Annual"}</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">~{(annualSavings).toLocaleString("tr-TR", {maximumFractionDigits:0})} TL</p>
        </div>
      </div>

      {/* Amortization info banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-center shadow-xs font-sans">
        <div className="bg-emerald-600 text-white p-2 rounded-lg font-bold">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs text-slate-500">
            {language === "tr" ? "Söz Konusu Dönüşümün Geri Kazanım Süresi (Amortisman):" : "Amortization & Payback Break-even Timeline:"}
          </p>
          <p className="text-base font-bold text-slate-900 mt-0.5">
            {language === "tr" ? (
              <>Kit kendini sadece <strong className="text-emerald-700 font-extrabold">{amortizationMonths} Ayda</strong> amorti ediyor!</>
            ) : (
              <>The LPG system pays for itself in just <strong className="text-emerald-700 font-extrabold">{amortizationMonths} Months</strong>!</>
            )}
          </p>
          <span className="text-[10px] text-slate-400 italic block mt-0.5">
            {language === "tr"
              ? "*(Bu hesaplama sonrasında aracınızı her sürdüğünüz kilometre size net kazanç sağlayacaktır.)"
              : "*(Every single kilometer driven after payback converts directly into pure cost savings.)"
            }
          </span>
        </div>
      </div>
    </div>
  );
}
