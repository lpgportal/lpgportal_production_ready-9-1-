import React, { useState } from "react";
import { Flame, Calculator, TrendingUp, HelpCircle, Check, ArrowDown } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import SavingsCalculator from "./SavingsCalculator";

export default function NewsCenter() {
  const { language, t } = useLanguage();

  const newsItems = language === "tr" ? [
    {
      id: "n1",
      title: "Türkiye'de LPG Kullanan Otomobil Oranı %38'i Aşarak Lider Kaldı",
      date: "9 Haziran 2026",
      source: "TÜİK Otomotiv Verileri",
      summary: "Türkiye İstatistik Kurumu verilerine göre trafikteki her 10 binek araçtan yaklaşık 4'ü otogaz kullanıyor. Tasarruf oranının yüksekliği ve yaygın şebeke, LPG'yi dizelin önüne taşıdı.",
      badge: "İstatistik"
    },
    {
      id: "n2",
      title: "Dacia ECO-G Fabrikasyon LPG Modelleri Satış Rekorları Kırıyor",
      date: "4 Haziran 2026",
      source: "Sektör Bülteni",
      summary: "Sandero ve Duster modellerinde yer alan 1.0 TCe ECO-G fabrikasyon lpg motorlu araçlar, Avrupa ve Türkiye genelinde sıfır kilometre otomobil satışlarında %40 pazar payı yakaladı.",
      badge: "Sektör"
    },
    {
      id: "n3",
      title: "Avrupa Birliği Euro 7 Emisyon Kurallarında LPG ve CNG'yi Destekliyor",
      date: "25 Mayıs 2026",
      source: "AB Çevre Ajansı",
      summary: "Alternatif gaz yakıtlarının, kömür ve ağır dizellere kıyasla %95 daha az partikül (PM10) ve çok daha az azot oksit (NOx) salınımı yapması nedeniyle vergi muafiyetleri uzatılıyor.",
      badge: "Çevre"
    }
  ] : [
    {
      id: "n1",
      title: "Ratio of LPG Vehicles in Turkey Surpasses 38%, Leading the Pack",
      date: "June 9, 2026",
      source: "TUIK Automotive Metrics",
      summary: "Based on Turkish Statistical Institute updates, almost 4 out of every 10 passenger cars are running on autogas. Outstanding savings and network coverage placed LPG ahead of diesel.",
      badge: "Statistics"
    },
    {
      id: "n2",
      title: "Dacia ECO-G Factory LPG Assemblies Crash Sales Records",
      date: "June 4, 2026",
      source: "Sectoral Bulletin",
      summary: "The 1.0 TCe ECO-G factory integrated engines fitted in Sandero and Duster captured solid 40% passenger vehicle market share inside European and Turkish regions.",
      badge: "Sector"
    },
    {
      id: "n3",
      title: "European Union Euro 7 Emission Mandates Advocate For LPG and CNG",
      date: "May 25, 2026",
      source: "EU Environment Agency",
      summary: "Alternative gas options yield 95% less particulate matter (PM10) and significantly less nitrogen oxides (NOX) relative to coal-fuel, hence tax reliefs are extended.",
      badge: "Ecology"
    }
  ];

  return (
    <div className="bg-white text-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-100">
          {language === "tr" ? "Modül 4: Haber Merkezi & İnteraktif Tasarruf Robotu" : "Module 4: News Feed & Interactive Savings Robot"}
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
          {language === "tr" ? "LPG Sektör Haberleri ve Tasarruf Analizi" : "LPG Market News & Fuel Economy"}
        </h2>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm font-sans">
          {language === "tr"
            ? "Akaryakıt tasarrufunuzu güncel fiyatlarla kuruşu kuruşuna hesaplayın ve LPG dünyasındaki en son gelişmeleri yakından takip edin."
            : "Estimate your alternative fuel savings strictly with current market values, and read curated daily market insights."
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Savings Calculator Simulator (7 cols) */}
        <div className="lg:col-span-7">
          <SavingsCalculator />
        </div>

        {/* Right Side: Industry News Briefings (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Flame className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-slate-900 font-sans">
              {language === "tr" ? "Sektörel Haber Bülteni" : "Market Insights Feed"}
            </h3>
          </div>

          <div className="space-y-4">
            {newsItems.map((news) => (
              <div key={news.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-100/50 transition">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2">
                  <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-emerald-700 font-bold uppercase">{news.badge}</span>
                  <span>{news.date} • {news.source}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition mb-1.5 leading-snug">
                  {news.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {news.summary}
                </p>
              </div>
            ))}
          </div>

          {/* LPG Environmental Facts Column */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 font-sans">
              {language === "tr" ? "♻️ Çevre Dostu Otogaz Gerçekleri" : "♻️ Eco-Friendly Autogas Mandates"}
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex gap-2 items-start">
                <div className="p-0.5 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 font-bold mt-0.5"><Check className="h-3 w-3" /></div>
                <p>
                  <strong className="text-slate-800">{language === "tr" ? "NOx Azalımı:" : "NOx Mitigation:"}</strong>{" "}
                  {language === "tr"
                    ? "LPG, dizel motorlara kıyasla %96 daha az Azot Oksit (NOx) salınımı gerçekleştirir."
                    : "LPG emits 96% less Nitrogen Oxides (NOx) relative to traditional heavy passenger diesel units."
                  }
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <div className="p-0.5 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 font-bold mt-0.5"><Check className="h-3 w-3" /></div>
                <p>
                  <strong className="text-slate-800">{language === "tr" ? "Karbon Ayak İzi:" : "Carbon Footprint:"}</strong>{" "}
                  {language === "tr"
                    ? "Benzine kıyasla %15 daha düşük CO2 (Karbondioksit) emisyon oranı sağlar."
                    : "Produces up to 15% lower Carbon Dioxide emissions (CO2) compared directly to pump gasoline."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
