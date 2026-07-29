
export interface SmsConfig {
  provider: string;
  apiUser?: string;
  apiPassword?: string;
  apiKey?: string;
  header?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsAdapter {
  sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult>;
}

// ----------------------------------------------------
// PROVIDER ADAPTERS (Adapter Pattern)
// ----------------------------------------------------

export class ProviderA_SmsAdapter implements SmsAdapter {
  public async sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult> {
    console.log(`[ProviderA SMS] Sending to ${phoneNumber}: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, messageId: "MOCK-Sms-PA-" + Math.floor(Math.random() * 900000 + 100000) };
  }
}

export class ProviderB_SmsAdapter implements SmsAdapter {
  public async sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult> {
    console.log(`[ProviderB SMS] Sending to ${phoneNumber}: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { success: true, messageId: "MOCK-Sms-PB-" + Math.floor(Math.random() * 900000 + 100000) };
  }
}

export class ProviderC_SmsAdapter implements SmsAdapter {
  public async sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult> {
    console.log(`[ProviderC SMS] Sending to ${phoneNumber}: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return { success: true, messageId: "MOCK-Sms-PC-" + Math.floor(Math.random() * 900000 + 100000) };
  }
}

export class NetgsmSmsAdapter implements SmsAdapter {
  public async sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult> {
    console.log(`[Netgsm SMS] Sending to ${phoneNumber}: ${message}`);
    const user = config.apiUser || process.env.NETGSM_USER || "";
    const password = config.apiPassword || process.env.NETGSM_PASSWORD || "";
    const header = config.header || process.env.NETGSM_HEADER || "LPGPORTAL";

    if (!user || !password) {
      console.warn("Netgsm credentials missing. Running simulated send.");
      return { success: true, messageId: "MOCK-Netgsm-" + Date.now() };
    }

    try {
      const queryParams = new URLSearchParams({
        user,
        password,
        no: "90" + phoneNumber,
        msg: message,
        msgheader: header,
        dil: "TR"
      });

      const response = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${queryParams.toString()}`);
      const text = await response.text();

      if (text.startsWith("00")) {
        return { success: true, messageId: text.split(" ")[1] || "OK" };
      } else {
        return { success: false, error: `Netgsm error response: ${text}` };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class TwilioSmsAdapter implements SmsAdapter {
  public async sendSms(phoneNumber: string, message: string, config: SmsConfig): Promise<SmsSendResult> {
    console.log(`[Twilio SMS] Sending to ${phoneNumber}: ${message}`);
    const accountSid = config.apiUser || process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = config.apiPassword || process.env.TWILIO_AUTH_TOKEN || "";
    const fromNumber = config.header || process.env.TWILIO_PHONE_NUMBER || "";

    if (!accountSid || !authToken) {
      console.warn("Twilio credentials missing. Running simulated send.");
      return { success: true, messageId: "MOCK-Twilio-" + Date.now() };
    }

    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(accountSid + ":" + authToken).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: "+90" + phoneNumber,
          From: fromNumber,
          Body: message
        }).toString()
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.sid };
      } else {
        const text = await response.text();
        return { success: false, error: `Twilio API error: ${text}` };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

// ----------------------------------------------------
// ADAPTER FACTORY
// ----------------------------------------------------

export class SmsAdapterFactory {
  public static getAdapter(providerName: string): SmsAdapter {
    switch (providerName) {
      case "ProviderB":
        return new ProviderB_SmsAdapter();
      case "ProviderC":
        return new ProviderC_SmsAdapter();
      case "Netgsm":
        return new NetgsmSmsAdapter();
      case "Twilio":
        return new TwilioSmsAdapter();
      case "ProviderA":
      default:
        return new ProviderA_SmsAdapter();
    }
  }
}

// ----------------------------------------------------
// HELPER: READ CONFIG FROM FALLBACK DATABASE OR ENV
// ----------------------------------------------------

export function loadSmsConfig(): SmsConfig {
  if (typeof window !== "undefined") {
    try {
      const config = localStorage.getItem("lpgportal_sms_config");
      if (config) return JSON.parse(config);
    } catch (e) {}
  } else {
    try {
      const req = typeof require !== "undefined" ? require : null;
      if (req) {
        const fs = req("fs");
        const path = req("path");
        const dbPath = path.join(process.cwd(), "prisma", "fallback_db.json");
        if (fs.existsSync(dbPath)) {
          const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
          if (db.lpgportal_sms_config && typeof db.lpgportal_sms_config === "object" && !Array.isArray(db.lpgportal_sms_config)) {
            return db.lpgportal_sms_config;
          }
        }
      }
    } catch (e) {
      console.error("Error reading SMS configuration from fallback DB:", e);
    }
  }
  return {
    provider: "NetGSM",
    apiUser: "",
    apiPassword: "",
    apiKey: "",
    header: "LPGPORTAL"
  };
}
