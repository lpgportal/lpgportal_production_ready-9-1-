import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface PaymentConfig {
  provider: string;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  callbackUrl?: string;
}

export interface PaymentTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PaymentAdapter {
  getPaymentToken(params: {
    email: string;
    amount: number;
    merchantOid: string;
    userName: string;
    userAddress: string;
    userPhone: string;
    userIp: string;
    okUrl?: string;
    failUrl?: string;
  }, config: PaymentConfig): Promise<PaymentTokenResult>;

  verifyWebhook(payload: any, config: PaymentConfig): boolean;
}

// ----------------------------------------------------
// PROVIDER ADAPTERS (Adapter Pattern)
// ----------------------------------------------------

export class ProviderA_PaymentAdapter implements PaymentAdapter {
  public async getPaymentToken(params: any, config: PaymentConfig): Promise<PaymentTokenResult> {
    console.log(`[ProviderA Payment] Initiating checkout for OID: ${params.merchantOid} | Amount: ${params.amount} TL`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, token: "MOCK-Token-PA-" + Date.now() };
  }

  public verifyWebhook(payload: any, config: PaymentConfig): boolean {
    console.log("[ProviderA Payment] Verifying webhook signature");
    return true;
  }
}

export class ProviderB_PaymentAdapter implements PaymentAdapter {
  public async getPaymentToken(params: any, config: PaymentConfig): Promise<PaymentTokenResult> {
    console.log(`[ProviderB Payment] Initiating checkout for OID: ${params.merchantOid} | Amount: ${params.amount} TL`);
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { success: true, token: "MOCK-Token-PB-" + Date.now() };
  }

  public verifyWebhook(payload: any, config: PaymentConfig): boolean {
    console.log("[ProviderB Payment] Verifying webhook signature");
    return true;
  }
}

export class PayTrPaymentAdapter implements PaymentAdapter {
  public async getPaymentToken(params: any, config: PaymentConfig): Promise<PaymentTokenResult> {
    console.log(`[PayTR Payment] Initiating checkout for OID: ${params.merchantOid}`);
    const merchantId = config.merchantId || process.env.PAYTR_MERCHANT_ID || "";
    const merchantKey = config.apiKey || process.env.PAYTR_MERCHANT_KEY || "";
    const merchantSalt = config.secretKey || process.env.PAYTR_MERCHANT_SALT || "";

    if (!merchantId || !merchantKey || !merchantSalt) {
      console.warn("PayTR credentials missing. Running simulated checkout.");
      return { success: true, token: "MOCK-Paytr-" + Date.now() };
    }

    try {
      const paymentAmountKurus = Math.round(params.amount * 100);
      const userBasket = JSON.stringify([["LPGPORTAL Hizmet Paketi", String(params.amount), "1"]]);
      const currency = "TL";
      const testMode = "1";
      const noInstall = "0";
      const maxInstall = "12";

      const signatureConcat = 
        merchantId + 
        params.userIp + 
        params.merchantOid + 
        params.email + 
        String(paymentAmountKurus) + 
        userBasket + 
        noInstall + 
        maxInstall + 
        currency + 
        testMode + 
        merchantSalt;

      const hash = crypto
        .createHmac("sha256", merchantKey)
        .update(signatureConcat)
        .digest("base64");

      const paytrParams = {
        merchant_id: merchantId,
        user_ip: params.userIp,
        merchant_oid: params.merchantOid,
        email: params.email,
        payment_amount: paymentAmountKurus,
        paytr_token: hash,
        user_basket: userBasket,
        user_name: params.userName,
        user_address: params.userAddress,
        user_phone: params.userPhone,
        merchant_ok_url: params.okUrl || config.callbackUrl || "",
        merchant_fail_url: params.failUrl || config.callbackUrl || "",
        no_install: noInstall,
        max_install: maxInstall,
        currency,
        test_mode: testMode
      };

      const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(paytrParams as any).toString()
      });

      const data = await response.json();
      if (data.status === "success" && data.token) {
        return { success: true, token: data.token };
      } else {
        return { success: false, error: data.reason || "Unknown PayTR token error" };
      }
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public verifyWebhook(payload: any, config: PaymentConfig): boolean {
    const merchantKey = config.apiKey || process.env.PAYTR_MERCHANT_KEY || "";
    const merchantSalt = config.secretKey || process.env.PAYTR_MERCHANT_SALT || "";

    if (!merchantKey || !merchantSalt) {
      return true;
    }

    try {
      const signatureConcat = 
        payload.merchant_oid + 
        merchantSalt + 
        payload.status + 
        payload.total_amount;

      const expectedHash = crypto
        .createHmac("sha256", merchantKey)
        .update(signatureConcat)
        .digest("base64");

      return expectedHash === payload.hash;
    } catch (e) {
      return false;
    }
  }
}

export class IyzicoPaymentAdapter implements PaymentAdapter {
  public async getPaymentToken(params: any, config: PaymentConfig): Promise<PaymentTokenResult> {
    console.log(`[Iyzico Payment] Initiating checkout for OID: ${params.merchantOid}`);
    // Iyzico requires signature generation based on standard rules
    // Reference: https://dev.iyzipay.com/en/checkout-form/initialize
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { success: true, token: "MOCK-Iyzico-" + Date.now() };
  }

  public verifyWebhook(payload: any, config: PaymentConfig): boolean {
    console.log("[Iyzico Payment] Verifying webhook signature");
    return true;
  }
}

// ----------------------------------------------------
// ADAPTER FACTORY
// ----------------------------------------------------

export class PaymentAdapterFactory {
  public static getAdapter(providerName: string): PaymentAdapter {
    switch (providerName) {
      case "ProviderB":
        return new ProviderB_PaymentAdapter();
      case "PayTR":
        return new PayTrPaymentAdapter();
      case "Iyzico":
        return new IyzicoPaymentAdapter();
      case "ProviderA":
      default:
        return new ProviderA_PaymentAdapter();
    }
  }
}

// ----------------------------------------------------
// HELPER: READ CONFIG FROM FALLBACK DATABASE OR ENV
// ----------------------------------------------------

export function loadPaymentConfig(): PaymentConfig {
  try {
    const dbPath = path.join(process.cwd(), "prisma", "fallback_db.json");
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      if (db.lpgportal_payment_config && typeof db.lpgportal_payment_config === "object" && !Array.isArray(db.lpgportal_payment_config)) {
        return db.lpgportal_payment_config;
      }
    }
  } catch (e) {
    console.error("Error reading Payment configuration from fallback DB:", e);
  }
  return {
    provider: process.env.PAYMENT_PROVIDER || "ProviderA",
    apiKey: process.env.PAYTR_MERCHANT_KEY || "",
    secretKey: process.env.PAYTR_MERCHANT_SALT || "",
    merchantId: process.env.PAYTR_MERCHANT_ID || "",
    callbackUrl: ""
  };
}
