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

// Initialize global memory DB cache
window.lpgportal_db = {};


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

