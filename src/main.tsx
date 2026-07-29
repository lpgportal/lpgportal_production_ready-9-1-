import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import './index.css';

declare global {
  interface Window {
    lpgportal_db: Record<string, string>;
  }
}

// ----------------------------------------------------
// LOCALSTORAGE INTERCEPTION & DB BRIDGE CACHE
// ----------------------------------------------------
const originalGetItem = Storage.prototype.getItem;
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;
const originalClear = Storage.prototype.clear;

window.lpgportal_db = {};
(window as any).lpgportal_pending_sync = {};

Storage.prototype.getItem = function (key: string) {
  if (this === window.localStorage && key.startsWith("lpgportal_")) {
    if (window.lpgportal_db && key in window.lpgportal_db) {
      return window.lpgportal_db[key];
    }
    return null;
  }
  return originalGetItem.call(this, key);
};

Storage.prototype.setItem = function (key: string, value: string) {
  if (this === window.localStorage && key.startsWith("lpgportal_")) {
    window.lpgportal_db[key] = String(value);
    (window as any).lpgportal_pending_sync[key] = String(value);

    // Sync to backend DB asynchronously
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      parsedValue = value;
    }

    fetch("/api/db/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LpgPortal-Secure": "true"
      },
      body: JSON.stringify({ key, value: parsedValue })
    })
      .then(res => res.json())
      .then(resData => {
        if ((window as any).lpgportal_pending_sync[key] === String(value)) {
          delete (window as any).lpgportal_pending_sync[key];
        }
        if (resData && resData.translatedValue) {
          window.lpgportal_db[key] = JSON.stringify(resData.translatedValue);
          window.dispatchEvent(
            new CustomEvent("lpgportal_db_update", {
              detail: { key, value: resData.translatedValue }
            })
          );
        }
      })
      .catch(err => {
        console.error(`Failed to sync setItem for ${key} to DB:`, err);
        if ((window as any).lpgportal_pending_sync[key] === String(value)) {
          delete (window as any).lpgportal_pending_sync[key];
        }
      });
    return;
  }
  originalSetItem.call(this, key, value);
};

Storage.prototype.removeItem = function (key: string) {
  if (this === window.localStorage && key.startsWith("lpgportal_")) {
    delete window.lpgportal_db[key];
    (window as any).lpgportal_pending_sync[key] = "DELETED";

    fetch("/api/db/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LpgPortal-Secure": "true"
      },
      body: JSON.stringify({ key, value: null })
    })
      .then(() => {
        if ((window as any).lpgportal_pending_sync[key] === "DELETED") {
          delete (window as any).lpgportal_pending_sync[key];
        }
      })
      .catch(err => {
        console.error(`Failed to sync removeItem for ${key} to DB:`, err);
        if ((window as any).lpgportal_pending_sync[key] === "DELETED") {
          delete (window as any).lpgportal_pending_sync[key];
        }
      });
    return;
  }
  originalRemoveItem.call(this, key);
};

Storage.prototype.clear = function () {
  if (this === window.localStorage) {
    window.lpgportal_db = {};
    // Notify backend to clear/reset?
    // Wait, typically clear is not used for our business keys, but keep it robust
    fetch("/api/db/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LpgPortal-Secure": "true"
      },
      body: JSON.stringify({ key: "clear_all", value: null })
    }).catch(err => {
      console.error("Failed to sync clear to DB:", err);
    });
    return;
  }
  originalClear.call(this);
};

// Clean up real localStorage of any existing business-critical keys
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("lpgportal_") && key !== "lpgportal_canli_gecis_v6") {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => {
    originalRemoveItem.call(localStorage, k);
  });
} catch (e) {
  console.error("Failed to clean real localStorage on startup:", e);
}

// ----------------------------------------------------
// RENDER & MOUNT SCREEN WITH SECURE LOADER
// ----------------------------------------------------
const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

// Render Splash Screen
root.render(
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    gap: '20px'
  }}>
    <div style={{
      width: '48px',
      height: '48px',
      border: '4px solid #1e293b',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '0.025em' }}>
      📢 LPG PORTAL Güvenli Bağlantı Kuruluyor...
    </div>
  </div>
);

// Fetch all database state from server, populate memory db, then boot App
fetch('/api/db/get-all', {
  headers: {
    'X-LpgPortal-Secure': 'true'
  }
})
  .then(res => res.json())
  .then(data => {
    // Populate cache db
    for (const key in data) {
      window.lpgportal_db[key] = JSON.stringify(data[key]);
    }

    root.render(
      <StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </StrictMode>
    );
  })
  .catch(err => {
    console.error("Failed to fetch database from server, using local fallback:", err);
    root.render(
      <StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </StrictMode>
    );
  });

