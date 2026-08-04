declare global {
  interface Window {
    lpgportal_db: Record<string, string>;
  }
}

// Memory database storage cache initialization
if (typeof window !== "undefined") {
  if (!window.lpgportal_db) {
    window.lpgportal_db = {};
  }
}

export const lpgportalStorage = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    
    const isSessionKey = key === "lpgportal_active_user" || key === "lpgportal_active_user_sig";
    
    // For business data keys starting with "lpgportal_" (excluding local-only session keys)
    if (key.startsWith("lpgportal_") && !isSessionKey) {
      return window.lpgportal_db[key] || null;
    }
    
    // Fallback to native localStorage for other keys (like theme, language context, active user)
    return window.localStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (typeof window === "undefined") return;

    const isSessionKey = key === "lpgportal_active_user" || key === "lpgportal_active_user_sig";

    if (key.startsWith("lpgportal_") && !isSessionKey) {
      window.lpgportal_db[key] = String(value);

      // Parse value to submit
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
      }

      // Sync to database
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
        });
      return;
    }

    window.localStorage.setItem(key, value);
  },

  removeItem(key: string): void {
    if (typeof window === "undefined") return;

    const isSessionKey = key === "lpgportal_active_user" || key === "lpgportal_active_user_sig";

    if (key.startsWith("lpgportal_") && !isSessionKey) {
      delete window.lpgportal_db[key];

      fetch("/api/db/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LpgPortal-Secure": "true"
        },
        body: JSON.stringify({ key, value: null })
      }).catch(err => {
        console.error(`Failed to sync removeItem for ${key} to DB:`, err);
      });
      return;
    }

    window.localStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === "undefined") return;
    
    // Clear business-critical memory cache
    window.lpgportal_db = {};
    
    // Clean actual localStorage non-business items
    window.localStorage.clear();
  }
};
