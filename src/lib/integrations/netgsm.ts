/**
 * Netgsm SMS Gateway Integration Provider
 * Designed for production environment using environment variables.
 * Automatically logs all SMS records for Admin audit.
 */

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class NetgsmService {
  private static user = process.env.NETGSM_USER || "";
  private static password = process.env.NETGSM_PASSWORD || "";
  private static header = process.env.NETGSM_HEADER || "LPGPORTAL";

  /**
   * Sends an SMS message to a specific GSM number.
   * Phone format must be 10 digits (e.g. 5xxxxxxxxx) without leading zero.
   */
  public static async sendSms(
    phoneNumber: string,
    message: string,
    userId?: string
  ): Promise<SmsSendResult> {
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    const finalPhone = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : cleanPhone;

    if (finalPhone.length !== 10) {
      return { success: false, error: "Geçersiz telefon numarası formatı. Numara 10 haneli olmalıdır." };
    }

    // Check if configuration is missing
    if (!this.user || !this.password) {
      console.warn("Netgsm API bilgileri eksik. SMS gönderimi simüle edilerek loglanıyor.");
      await this.logSmsToConsoleOrDatabase(finalPhone, message, "Gönderildi (Simüle)", userId);
      return { success: true, messageId: "SIM-" + Date.now() };
    }

    try {
      // Netgsm HTTP GET API integration
      // Reference: https://www.netgsm.com.tr/dokuman/http-get-api.php
      const queryParams = new URLSearchParams({
        user: this.user,
        password: this.password,
        no: "90" + finalPhone,
        msg: message,
        msgheader: this.header,
        dil: "TR"
      });

      const response = await fetch(`https://api.netgsm.com.tr/sms/send/get/?${queryParams.toString()}`);
      const text = await response.text();

      // Netgsm returns: "00 <messageCode>" on success, or error code
      if (text.startsWith("00")) {
        const messageId = text.split(" ")[1] || "OK";
        await this.logSmsToConsoleOrDatabase(finalPhone, message, "Gönderildi", userId);
        return { success: true, messageId };
      } else {
        const errorMsg = `Netgsm Error Code: ${text}`;
        await this.logSmsToConsoleOrDatabase(finalPhone, message, "Hata", userId, errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (e: any) {
      await this.logSmsToConsoleOrDatabase(finalPhone, message, "Hata", userId, e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * Generates a 6-digit OTP verification code for login or registry.
   */
  public static generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Writes SMS events to LocalStorage logs or backend Database logger
   */
  private static async logSmsToConsoleOrDatabase(
    phone: string,
    message: string,
    status: string,
    userId?: string,
    error?: string
  ): Promise<void> {
    console.log(`[SMS Log] Recipient: ${phone} | Status: ${status} | Msg: ${message}`);
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem("lpgportal_sent_sms_logs") || "[]");
      const newLog = {
        id: "sms_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        userId: userId || "guest",
        phone,
        message,
        sentAt: new Date().toISOString(),
        status,
        error
      };
      localStorage.setItem("lpgportal_sent_sms_logs", JSON.stringify([newLog, ...logs].slice(0, 500)));
    }
  }
}
