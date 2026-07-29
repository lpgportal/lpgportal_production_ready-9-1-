import React from "react";
import { Company } from "../types";

/**
 * Automatic Logo & Avatar Utility Generator for LPGPORTAL
 * Generates high-resolution vector styled letter logos with persistent, deterministic colors based on company name.
 */

export function getAutoLogoColor(name: string): string {
  if (!name) return "#059669"; // Emerald default
  
  const cleanName = name.trim().replace(/^(Örn:\s*)/i, "");
  
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // High-fidelity modern palette for professional brand identity
  const palette = [
    "#4f46e5", // Indigo
    "#0284c7", // Sky
    "#0d9488", // Teal
    "#059669", // Emerald
    "#ea580c", // Orange
    "#e11d48", // Rose
    "#7c3aed", // Violet
    "#2563eb", // Blue
    "#b45309", // Amber
    "#0891b2", // Cyan
    "#475569", // Slate
    "#115e59", // Deep Teal
    "#854d0e", // Antique Gold
    "#1e293b"  // Dark Slate
  ];
  
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

export function getCompanyInitials(name: string): string {
  if (!name) return "?";
  const clean = name.trim().replace(/^(Örn:\s*)/i, "");
  return clean[0]?.toUpperCase() || "?";
}

/**
 * Renders the logo dynamically.
 * If a real custom logo exists (base64 image data or url), shows that.
 * Otherwise, generates a beautiful dynamic initials-based avatar with a deterministic background color.
 */
export function renderCompanyLogo(
  company: Partial<Company> & { company_name: string; id: string; logo?: string; logo_type?: "real" | "auto" },
  sizeClass: string = "w-10 h-10 text-sm",
  isRounded: boolean = true
) {
  const isAutoLogo = !company.logo || 
                     company.logo_type === "auto" || 
                     company.logo === "⭐" || 
                     company.logo === "🔧" || 
                     company.logo === "🛡️" || 
                     company.logo === "🌴" || 
                     company.logo === "☀️";
  
  if (isAutoLogo) {
    const color = getAutoLogoColor(company.company_name);
    const initials = getCompanyInitials(company.company_name);
    return (
      <div 
        className={`${sizeClass} flex items-center justify-center text-white font-extrabold uppercase shadow-inner border border-white/20 select-none shrink-0 ${
          isRounded ? "rounded-full" : "rounded-lg"
        }`}
        style={{ backgroundColor: color }}
        title={`${company.company_name} (Sistem Logosu)`}
      >
        {initials}
      </div>
    );
  }

  // If it's base64 or URL, render as image
  if (
    company.logo.startsWith("data:image/") || 
    company.logo.startsWith("http://") || 
    company.logo.startsWith("https://") || 
    company.logo.includes("/") || 
    company.logo.length > 5
  ) {
    return (
      <img
        src={company.logo}
        alt={company.company_name}
        className={`${sizeClass} object-cover shrink-0 ${
          isRounded ? "rounded-full" : "rounded-lg"
        } border border-slate-200 shadow-xs`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback to emoji or simple icon
  return (
    <div className={`${sizeClass} bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-800 shrink-0 ${
      isRounded ? "rounded-full" : "rounded-lg"
    }`}>
      {company.logo}
    </div>
  );
}
