import React from "react";
import { useLanguage } from "../lib/LanguageContext";
import { DbUser } from "../lib/membership";
import { 
  Info, 
  Target, 
  Compass, 
  Layers, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe2
} from "lucide-react";

interface AboutUsProps {
  activeUser: DbUser | null;
  onNavigateToTab?: (tab: string) => void;
}

export default function AboutUs({ activeUser, onNavigateToTab }: AboutUsProps) {
  const { language } = useLanguage();

  const handleModuleClick = (tab: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(tab);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fade-in" id="about-us-view">
      
      {/* 1. HERO HEADER AREA */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-[10px] text-emerald-700 bg-emerald-50/80 ring-1 ring-emerald-600/10 px-3 py-1 rounded-full uppercase font-mono tracking-widest leading-none inline-block">
          {language === "tr" ? "BİZ KİMİZ?" : "WHO ARE WE?"}
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {language === "tr" ? "Hakkımızda" : "About Us"}
        </h1>
        <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
          {language === "tr"
            ? "LPG PORTAL; araç sahiplerini, LPG dönüşüm firmalarını, kit üreticilerini, mühendisleri, ustaları ve sektör profesyonellerini tek çatı altında buluşturmak amacıyla oluşturulmuş bağımsız bir dijital sektörel platformdur."
            : "LPG PORTAL is an independent digital sector platform built to connect car owners, autogas conversion centers, kit manufacturers, engineers, masters, and industry professionals under one unified roof."
          }
        </p>
      </div>

      {/* 2. VISION & MISSION CARDS (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vizyon */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 text-emerald-500 group-hover:scale-110 transition duration-500">
            <Target className="w-48 h-48" />
          </div>
          <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/25">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black tracking-tight">{language === "tr" ? "Vizyonumuz" : "Our Vision"}</h3>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            {language === "tr"
              ? "Türkiye'nin ve dünyanın en kapsamlı LPG ve alternatif yakıt platformu olmak."
              : "To become Turkey's and the global market's most comprehensive LPG and alternative fuel digital ecosystem."
            }
          </p>
        </div>

        {/* Misyon */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-5 text-emerald-600 group-hover:scale-110 transition duration-500">
            <Compass className="w-48 h-48" />
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{language === "tr" ? "Misyonumuz" : "Our Mission"}</h3>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
            {language === "tr"
              ? "LPG sektöründeki tüm paydaşları dijital ortamda güvenli, şeffaf ve sürdürülebilir bir yapıda buluşturmak."
              : "Connecting all stakeholders in the autogas and alternative fuels sector safely, transparently, and sustainably within an optimized digital layout."
            }
          </p>
        </div>
      </div>

      {/* 3. CORE OBJECTIVES & VALUES */}
      <div className="bg-slate-50 border border-slate-205 rounded-3xl p-6 sm:p-8 space-y-8">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {language === "tr" ? "Platformun Öncelikli Amaçları" : "Core Objectives of the Platform"}
          </h3>
          <p className="text-xs text-slate-500">
            {language === "tr" 
              ? "LPG PORTAL olarak sektörel şeffaflığı ve kalite standartlarını yükseltmeyi amaçlıyoruz." 
              : "We strive to increase service trust quality indices and secure overall transparency."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Amaç 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Güvenilir Bilgi" : "Reliable Information"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "LPG sektörüne yönelik doğrulanmış usta tavsiyeleri, teknik standartlar ve bağımsız montaj verileri sunmak."
                  : "Providing verified autogas technician recommendations, technical standards, and independent installation logs."}
              </p>
            </div>
          </div>

          {/* Amaç 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Doğru Eşleşme" : "Accurate Matching"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "Araç sahiplerini kendi marka, bütçe ve lokasyonlarına en uygun yetkili LPG dönüşüm montaj firmalarıyla buluşturmak."
                  : "Connecting vehicle owners with the most compatible certified autogas conversion centers based on brand, budget, and location."}
              </p>
            </div>
          </div>

          {/* Amaç 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Montajda Şeffaflık" : "Installation Transparency"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "LPG dönüşüm süreçlerini ve kör ihale şeffaf teklif platformu ile marka listelerini kullanıcıların denetlemesine açmak."
                  : "Making autogas conversion workflows and pricing lists transparent and accessible to users through our blind quoting platform."}
              </p>
            </div>
          </div>

          {/* Amaç 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Teknik Bilgi Katılımı" : "Technical Knowledge Sharing"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "Usta ve mühendis formülleri, kalibrasyon kılavuzları ve teknik blog kütüphaneleri ile bilgi birikimini güçlendirmek."
                  : "Empowering the collective knowledge index with technician and engineer formulas, calibration guides, and technical blog libraries."}
              </p>
            </div>
          </div>

          {/* Amaç 5 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Kariyer & Gelişim" : "Career & Development"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "Sektör teknisyenleri için eğitim akademisi, sınav modülleri ve yetkilendirilmiş eleman istihdam imkanları sağlamak."
                  : "Providing learning academies, testing modules, and certified technician employment pipelines for field professionals."}
              </p>
            </div>
          </div>

          {/* Amaç 6 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                {language === "tr" ? "Geniş Hub Ekosistemi" : "Broad Hub Ecosystem"}
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {language === "tr"
                  ? "LPG yedek parça pazarı, OEM kit filtreleri ve tescilli servis sertifikasyon süreçlerini entegre etmek."
                  : "Integrating the autogas spare parts marketplace, OEM kit components, and certified service verification workflows."}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 4. MODULAR ECOSYSTEM VISUALIZER */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Layers className="h-8 w-8 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-black text-slate-900">
            {language === "tr" ? "Hepsi Bir Arada Entegre Ekosistem" : "Unified Component Architecture"}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            {language === "tr"
              ? "Her modül, bağımsız otogaz ekosisteminin verimli çalışmasını destekleyecek şekilde tasarlanmıştır."
              : "Our modules function synchronously, forming a reliable ecosystem for alternative fuels."
            }
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Firma Rehberi */}
          <button
            type="button"
            onClick={() => handleModuleClick("companies")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              📁 {language === "tr" ? "Firma Rehberi" : "Company Directory"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Marka ve konuma göre yetkili servis listeleri." : "Certified service listings by brand and location."}
            </p>
          </button>

          {/* LPG Uyumluluk Sistemi */}
          <button
            type="button"
            onClick={() => handleModuleClick("compatibility")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              ⚙️ {language === "tr" ? "LPG Uyumluluk Sistemi" : "Compatibility Analyzer"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Aracınıza hangi kitlerin uyduğunu analiz edin." : "Analyze which autogas kits fit your specific vehicle."}
            </p>
          </button>

          {/* Teklif Platformu */}
          <button
            type="button"
            onClick={() => handleModuleClick("teklif")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              🤝 {language === "tr" ? "Teklif Platformu" : "Blind Quoting"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Gizlilik korumalı montaj fiyat teklifi toplama." : "Privacy-protected quoting for autogas installation."}
            </p>
          </button>

          {/* Destek Merkezi */}
          <button
            type="button"
            onClick={() => handleModuleClick("supportCenter")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              🛡️ {language === "tr" ? "Destek Merkezi" : "Support Center"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Mühendis & usta onaylı anlık soru-cevap." : "Instant Q&A verified by engineers and masters."}
            </p>
          </button>

          {/* Eğitim ve Kariyer */}
          <button
            type="button"
            onClick={() => handleModuleClick("phase2")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              🎓 {language === "tr" ? "Eğitim ve Kariyer" : "Training & Career"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Teknisyen sertifikasyon ve iş arama panelleri." : "Technician certification and job board panels."}
            </p>
          </button>

          {/* Haber ve Bülten */}
          <button
            type="button"
            onClick={() => handleModuleClick("blogSpace")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              📰 {language === "tr" ? "Haber & Bülten Merkezi" : "News & Bulletins"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Yönetmelikler, yakıt olayları ve bültenler." : "Regulations, fuel incidents, and newsletters."}
            </p>
          </button>

          {/* Market */}
          <button
            type="button"
            onClick={() => handleModuleClick("marketplace")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              🛒 {language === "tr" ? "LPG Market" : "Spare Parts"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Orijinal yedek parça ve montaj filtreleri." : "Original spare parts and installation filters."}
            </p>
          </button>

          {/* İletişim */}
          <button
            type="button"
            onClick={() => handleModuleClick("contact")}
            className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 text-left transition shadow-xs cursor-pointer space-y-2 group"
          >
            <span className="text-xs font-extrabold text-slate-900 block group-hover:text-emerald-600 transition">
              ✉️ {language === "tr" ? "İletişim Kanalı" : "Contact Desk"}
            </span>
            <p className="text-[10px] text-slate-400">
              {language === "tr" ? "Her türlü teknik ve kurumsal iş birliği." : "All kinds of technical and corporate partnerships."}
            </p>
          </button>
        </div>
      </div>

    </div>
  );
}
