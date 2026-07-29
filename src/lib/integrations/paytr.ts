import crypto from "crypto";

/**
 * PayTR Payment Gateway Integration Provider
 * Configured via environment variables.
 * Implements iframe token generation and callback signature verification.
 */

export interface PayTrTokenRequest {
  email: string;
  paymentAmount: number; // in TL (will be multiplied by 100 for Kuruş internally)
  merchantOid: string; // unique order/invoice id
  userName: string;
  userAddress: string;
  userPhone: string;
  merchantOkUrl: string; // redirect URL after success
  merchantFailUrl: string; // redirect URL after failure
  userIp: string;
}

export interface PayTrTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PayTrCallbackPayload {
  merchant_oid: string;
  status: "success" | "failed";
  total_amount: string;
  hash: string;
  failed_reason_code?: string;
  failed_reason_msg?: string;
}

export class PayTrService {
  private static merchantId = process.env.PAYTR_MERCHANT_ID || "";
  private static merchantKey = process.env.PAYTR_MERCHANT_KEY || "";
  private static merchantSalt = process.env.PAYTR_MERCHANT_SALT || "";

  /**
   * Generates a payment token from PayTR to initialize the Secure Iframe Checkout
   */
  public static async getPaymentIframeToken(
    params: PayTrTokenRequest
  ): Promise<PayTrTokenResult> {
    if (!this.merchantId || !this.merchantKey || !this.merchantSalt) {
      console.warn("PayTR API bilgileri eksik. Token simüle ediliyor.");
      await this.logTransaction(params.merchantOid, params.paymentAmount, "Beklemede", "Simüle Token Talebi");
      return { success: true, token: "MOCK_PAYTR_TOKEN_" + Date.now() };
    }

    try {
      // PayTR parameters mapping
      const paymentAmountKurus = Math.round(params.paymentAmount * 100);
      const userBasket = JSON.stringify([["LPGPORTAL Hizmet Paketi", String(params.paymentAmount), "1"]]);
      
      // PayTR Signature Formula:
      // hash = base64_encode(hash_hmac('sha256', merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_install + max_install + currency + test_mode + merchant_salt, merchant_key))
      const currency = "TL";
      const testMode = "1"; // 1 for Test Mode, 0 for Live
      const noInstall = "0"; // 0 to show installments, 1 to hide
      const maxInstall = "12"; // maximum installment limit

      const signatureConcat = 
        this.merchantId + 
        params.userIp + 
        params.merchantOid + 
        params.email + 
        String(paymentAmountKurus) + 
        userBasket + 
        noInstall + 
        maxInstall + 
        currency + 
        testMode + 
        this.merchantSalt;

      const hash = crypto
        .createHmac("sha256", this.merchantKey)
        .update(signatureConcat)
        .digest("base64");

      const paytrParams = {
        merchant_id: this.merchantId,
        user_ip: params.userIp,
        merchant_oid: params.merchantOid,
        email: params.email,
        payment_amount: paymentAmountKurus,
        paytr_token: hash,
        user_basket: userBasket,
        user_name: params.userName,
        user_address: params.userAddress,
        user_phone: params.userPhone,
        merchant_ok_url: params.merchantOkUrl,
        merchant_fail_url: params.merchantFailUrl,
        no_install: noInstall,
        max_install: maxInstall,
        currency,
        test_mode: testMode
      };

      // Call PayTR Gateway API
      const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(paytrParams as any).toString()
      });

      const data = await response.json();
      if (data.status === "success" && data.token) {
        await this.logTransaction(params.merchantOid, params.paymentAmount, "Beklemede", "Token Alındı");
        return { success: true, token: data.token };
      } else {
        const errorMsg = data.reason || "Bilinmeyen PayTR Token hatası.";
        await this.logTransaction(params.merchantOid, params.paymentAmount, "Başarısız", errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (e: any) {
      await this.logTransaction(params.merchantOid, params.paymentAmount, "Başarısız", e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * Validates PayTR Webhook Callback hash signature to prevent fraud spoofing
   */
  public static verifyCallbackSignature(
    payload: PayTrCallbackPayload
  ): boolean {
    if (!this.merchantId || !this.merchantKey || !this.merchantSalt) {
      // Mock mode passes validation silently
      return true;
    }

    try {
      // Callback Signature Formula:
      // expected_hash = base64_encode(hash_hmac('sha256', merchant_oid + merchant_salt + status + total_amount, merchant_key))
      const signatureConcat = 
        payload.merchant_oid + 
        this.merchantSalt + 
        payload.status + 
        payload.total_amount;

      const expectedHash = crypto
        .createHmac("sha256", this.merchantKey)
        .update(signatureConcat)
        .digest("base64");

      return expectedHash === payload.hash;
    } catch (e) {
      return false;
    }
  }

  /**
   * Logs transaction history in memory logs or DB
   */
  public static async logTransaction(
    merchantOid: string,
    amount: number,
    status: string,
    details?: string
  ): Promise<void> {
    console.log(`[PayTR Log] OID: ${merchantOid} | Amount: ${amount} TL | Status: ${status} | Detail: ${details || ""}`);
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem("lpgportal_paytr_transactions") || "[]");
      const newLog = {
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        merchantOid,
        amount,
        status,
        details,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("lpgportal_paytr_transactions", JSON.stringify([newLog, ...logs].slice(0, 500)));
    }
  }
}
