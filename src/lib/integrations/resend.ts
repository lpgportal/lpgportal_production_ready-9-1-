/**
 * Resend Email Gateway Integration Provider
 * Configured dynamically through environment variables.
 * Contains structural HTML email templates for all key business flows.
 */

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class ResendService {
  private static apiKey = process.env.RESEND_API_KEY || "";
  private static fromEmail = process.env.RESEND_FROM_EMAIL || "LPG PORTAL <info@lpgportal.com>";

  /**
   * General purpose send email function calling Resend API
   */
  public static async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    userId?: string
  ): Promise<EmailSendResult> {
    if (!this.apiKey) {
      console.warn("Resend API Key eksik. E-posta gönderimi simüle edilerek loglanıyor.");
      await this.logEmailToConsoleOrDatabase(to, subject, htmlContent, "Gönderildi (Simüle)", userId);
      return { success: true, messageId: "EMAIL-" + Date.now() };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html: htmlContent
        })
      });

      const data = await response.json();
      if (response.ok && data.id) {
        await this.logEmailToConsoleOrDatabase(to, subject, htmlContent, "Gönderildi", userId);
        return { success: true, messageId: data.id };
      } else {
        const errorMsg = data.message || "Bilinmeyen Resend hatası.";
        await this.logEmailToConsoleOrDatabase(to, subject, htmlContent, "Hata", userId, errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (e: any) {
      await this.logEmailToConsoleOrDatabase(to, subject, htmlContent, "Hata", userId, e.message);
      return { success: false, error: e.message };
    }
  }

  // ----------------------------------------------------
  // HTML TEMPLATES FOR BUSINESS EVENTS
  // ----------------------------------------------------

  public static getWelcomeTemplate(name: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">LPG PORTAL'a Hoş Geldiniz!</h2>
        <p>Merhaba <strong>${name}</strong>,</p>
        <p>Türkiye'nin en büyük otogaz dönüşüm ve alternatif yakıt platformuna üyeliğiniz başarıyla oluşturulmuştur.</p>
        <p>Üyeliğiniz sayesinde firma rehberinde yer alabilir, yedek parça marketimizden alışveriş yapabilir, teklif ve destek taleplerini izleyebilirsiniz.</p>
        <br/>
        <a href="https://www.lpgportal.com" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hemen Giriş Yapın</a>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;"/>
        <p style="font-size: 11px; color: #718096;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      </div>
    `;
  }

  public static getPasswordResetTemplate(name: string, resetLink: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px;">Şifre Sıfırlama Talebi</h2>
        <p>Merhaba <strong>${name}</strong>,</p>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki linke tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
        <br/>
        <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
        <p style="margin-top: 20px; font-size: 12px; color: #4a5568;">Bu işlem sizin tarafınızdan yapılmadıysa, e-postayı dikkate almayınız.</p>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;"/>
        <p style="font-size: 11px; color: #718096;">LPG PORTAL Güvenlik Servisi</p>
      </div>
    `;
  }

  public static getQuoteNotificationTemplate(name: string, carDetails: string, offerDetails: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Yeni Fiyat Teklifi Alındı</h2>
        <p>Merhaba <strong>${name}</strong>,</p>
        <p>Teklif Al sistemine girmiş olduğunuz <strong>${carDetails}</strong> aracınız için yeni bir blind fiyat teklifi sunulmuştur.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; border-radius: 0 8px 8px 0;">
          <strong>Teklif Detayları:</strong><br/>
          ${offerDetails}
        </div>
        <p>Teklifi onaylamak veya reddetmek için portal hesabınıza giriş yapabilirsiniz.</p>
        <br/>
        <a href="https://www.lpgportal.com/teklif-al" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Teklifleri İncele</a>
      </div>
    `;
  }

  public static getOrderNotificationTemplate(buyerName: string, productDetails: string, totalAmount: number): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">Yeni Sipariş Alındı! (B2B Market)</h2>
        <p>Merhaba,</p>
        <p>Yedek parça marketinde listelediğiniz ürünler için <strong>${buyerName}</strong> tarafından yeni bir sipariş verilmiştir.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0284c7; margin: 15px 0; border-radius: 0 8px 8px 0;">
          <strong>Sipariş İçeriği:</strong><br/>
          ${productDetails}<br/>
          <strong>Toplam Tutar:</strong> ${totalAmount.toLocaleString('tr-TR')} TL
        </div>
        <p>Siparişi onaylamak ve kargo sürecini başlatmak için satıcı panelinize erişebilirsiniz.</p>
        <br/>
        <a href="https://www.lpgportal.com/market" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Siparişleri Yönet</a>
      </div>
    `;
  }

  public static getMembershipApprovalTemplate(name: string, status: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Kurumsal Üyelik Durum Güncellemesi</h2>
        <p>Sayın <strong>${name}</strong>,</p>
        <p>LPG PORTAL ekibi tarafından yapılan idari denetimler sonucunda, kurumsal profilinizin durumu <strong>"${status}"</strong> olarak güncellenmiştir.</p>
        <p>Güncel profilinize giriş yaparak lisans özelliklerini kullanmaya başlayabilirsiniz.</p>
        <br/>
        <a href="https://www.lpgportal.com/uyelik" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hesabıma Git</a>
      </div>
    `;
  }

  public static getMembershipWarningTemplate(name: string, daysLeft: number): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #eab308; border-bottom: 2px solid #eab308; padding-bottom: 10px;">⚠️ Üyelik Paketinizin Süresi Doluyor</h2>
        <p>Sayın <strong>${name}</strong>,</p>
        <p>LPG PORTAL aktif kurumsal paketinizin süresinin dolmasına <strong>${daysLeft} gün</strong> kalmıştır.</p>
        <p>Hizmetlerinizin (Firma rehberi görünürlüğü, parça ilanları, teklif alma sistemi) kesintiye uğramaması için üyeliğinizi yenilemenizi rica ederiz.</p>
        <br/>
        <a href="https://www.lpgportal.com/uyelik" style="background-color: #eab308; color: #0f172a; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hemen Yenile</a>
      </div>
    `;
  }

  public static getSystemAnnouncementTemplate(title: string, message: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">📢 Sektörel Duyuru: ${title}</h2>
        <p>Merhaba Değerli Üyemiz,</p>
        <p style="line-height: 1.6; font-size: 14px;">${message}</p>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #e2e8f0;"/>
        <p style="font-size: 11px; color: #718096;">LPG PORTAL İletişim Koordinatörlüğü</p>
      </div>
    `;
  }

  /**
   * Log email events locally
   */
  private static async logEmailToConsoleOrDatabase(
    email: string,
    subject: string,
    body: string,
    status: string,
    userId?: string,
    error?: string
  ): Promise<void> {
    console.log(`[Email Log] Recipient: ${email} | Subject: ${subject} | Status: ${status}`);
    if (typeof window !== "undefined") {
      const logs = JSON.parse(localStorage.getItem("lpgportal_sent_email_logs") || "[]");
      const newLog = {
        id: "email_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        userId: userId || "guest",
        email,
        subject,
        body,
        sentAt: new Date().toISOString(),
        status,
        error
      };
      localStorage.setItem("lpgportal_sent_email_logs", JSON.stringify([newLog, ...logs].slice(0, 500)));
    }
  }
}
