import fs from "fs";
import path from "path";

export interface EmailConfig {
  provider: string;
  apiKey?: string;
  fromEmail?: string;
  fromName?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAdapter {
  sendEmail(to: string, subject: string, htmlContent: string, config: EmailConfig): Promise<EmailSendResult>;
}

// ----------------------------------------------------
// PROVIDER ADAPTERS (Adapter Pattern)
// ----------------------------------------------------

export class ProviderA_EmailAdapter implements EmailAdapter {
  public async sendEmail(to: string, subject: string, htmlContent: string, config: EmailConfig): Promise<EmailSendResult> {
    console.log(`[ProviderA Email] Sending to ${to} | Subject: ${subject}`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, messageId: "MOCK-Email-PA-" + Math.floor(Math.random() * 900000 + 100000) };
  }
}

export class ProviderB_EmailAdapter implements EmailAdapter {
  public async sendEmail(to: string, subject: string, htmlContent: string, config: EmailConfig): Promise<EmailSendResult> {
    console.log(`[ProviderB Email] Sending to ${to} | Subject: ${subject}`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { success: true, messageId: "MOCK-Email-PB-" + Math.floor(Math.random() * 900000 + 100000) };
  }
}

export class ResendEmailAdapter implements EmailAdapter {
  public async sendEmail(to: string, subject: string, htmlContent: string, config: EmailConfig): Promise<EmailSendResult> {
    console.log(`[Resend Email] Sending to ${to} | Subject: ${subject}`);
    const apiKey = config.apiKey || process.env.RESEND_API_KEY || "";
    const fromEmail = config.fromEmail || process.env.RESEND_FROM_EMAIL || "LPG PORTAL <info@lpgportal.com>";

    if (!apiKey) {
      console.warn("Resend API Key missing. Running simulated send.");
      return { success: true, messageId: "MOCK-Resend-" + Date.now() };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to,
          subject,
          html: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok && data.id) {
        return { success: true, messageId: data.id };
      } else {
        return { success: false, error: data.message || "Unknown Resend API error" };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

export class BrevoEmailAdapter implements EmailAdapter {
  public async sendEmail(to: string, subject: string, htmlContent: string, config: EmailConfig): Promise<EmailSendResult> {
    console.log(`[Brevo Email] Sending to ${to} | Subject: ${subject}`);
    const apiKey = config.apiKey || process.env.BREVO_API_KEY || "";
    const fromEmail = config.fromEmail || "info@lpgportal.com";
    const fromName = config.fromName || "LPG PORTAL";

    if (!apiKey) {
      console.warn("Brevo API Key missing. Running simulated send.");
      return { success: true, messageId: "MOCK-Brevo-" + Date.now() };
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, messageId: data.messageId };
      } else {
        const text = await response.text();
        return { success: false, error: `Brevo error: ${text}` };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}

// ----------------------------------------------------
// ADAPTER FACTORY
// ----------------------------------------------------

export class EmailAdapterFactory {
  public static getAdapter(providerName: string): EmailAdapter {
    switch (providerName) {
      case "ProviderB":
        return new ProviderB_EmailAdapter();
      case "Resend":
        return new ResendEmailAdapter();
      case "Brevo":
        return new BrevoEmailAdapter();
      case "ProviderA":
      default:
        return new ProviderA_EmailAdapter();
    }
  }
}

// ----------------------------------------------------
// HELPER: READ CONFIG FROM FALLBACK DATABASE OR ENV
// ----------------------------------------------------

export function loadEmailConfig(): EmailConfig {
  try {
    const dbPath = path.join(process.cwd(), "prisma", "fallback_db.json");
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      if (db.lpgportal_email_config && typeof db.lpgportal_email_config === "object" && !Array.isArray(db.lpgportal_email_config)) {
        return db.lpgportal_email_config;
      }
    }
  } catch (e) {
    console.error("Error reading Email configuration from fallback DB:", e);
  }
  return {
    provider: process.env.EMAIL_PROVIDER || "ProviderA",
    apiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.RESEND_FROM_EMAIL || "LPG PORTAL <info@lpgportal.com>",
    fromName: "LPG PORTAL"
  };
}
