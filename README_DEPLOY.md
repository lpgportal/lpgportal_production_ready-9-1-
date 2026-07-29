# LPGPORTAL CANLI ORTAMA (PRODUCTION) GEÇİŞ VE KURULUM REHBERİ

Bu döküman, LPGPORTAL projesinin yerel test ortamından gerçek kullanıcıların erişebileceği canlı sunuculara (Vercel, PostgreSQL, Cloudflare) taşınması ve gerekli bulut servisleri entegrasyonlarının yapılması için hazırlanmıştır.

---

## 1. KULLANILAN BULUT SERVİSLERİ VE HESAPLAR

Canlıya çıkış öncesinde aşağıdaki servislerden kurumsal hesapların açılması ve API anahtarlarının temin edilmesi gerekmektedir:

1.  **PostgreSQL Veritabanı:** Supabase, Neon.tech, AWS RDS veya Heroku üzerinden bir PostgreSQL veritabanı kurulmalıdır.
2.  **Netgsm (SMS Gateway):** Türkiye içi OTP, doğrulama ve bildirim SMS'leri için Netgsm aboneliği ve API erişim izni gerekmektedir.
3.  **Resend (E-posta):** Hoş geldin, teklif, sipariş ve sistem e-postalarının yüksek teslimat oranıyla iletilmesi için Resend hesabı ve alan adı (DNS) doğrulaması.
4.  **Cloudflare R2 (Nesne Depolama):** Logo, ürün ve teknik görsellerin yerel depolama sınırlarına takılmadan saklanması için S3 uyumlu R2 depolama alanı.
5.  **PayTR (Ödeme Geçidi):** Kredi kartı tahsilatları ve kupon indirimlerinin doğrulanması için PayTR sanal POS üyeliği.
6.  **Vercel / Cloud Run (Hosting):** Sunucu ve istemci kodunun barındırılacağı hosting platformu.

---

## 2. ADIM ADIM DEPLOYMENT PROSEDÜRÜ

### Adım 1: Veritabanı Kurulumu ve Şema Yükleme
PostgreSQL veritabanı bağlantı adresinizi temin ettikten sonra, veritabanı tablolarını ve ilişkilerini oluşturmak için şu adımları izleyin:

*   **Yöntem A (SQL Script):** PostgreSQL arayüzünüzden (pgAdmin, DBeaver veya veritabanı konsolu) `prisma/migrations/01_init.sql` dosyasındaki SQL komutlarını çalıştırın.
*   **Yöntem B (Prisma CLI):**
    ```bash
    # Bağımlılıkları yükleyin
    npm install
    # Şemayı veritabanına uygulayın (Push)
    npx prisma db push
    ```

### Adım 2: Environment Variables (.env) Yapılandırması
Proje kök dizinindeki `.env.example` dosyasını `.env` olarak kopyalayın ve aşağıdaki alanları gerçek API anahtarlarınız ile doldurun:

```env
DATABASE_URL="postgresql://kullanici:sifre@host:5432/veritabanı?schema=public"
NETGSM_USER="netgsm_kullanici_adiniz"
NETGSM_PASSWORD="netgsm_sifreniz"
RESEND_API_KEY="re_resend_api_anahtariniz"
R2_ACCESS_KEY="cloudflare_access_key"
R2_SECRET_KEY="cloudflare_secret_key"
R2_BUCKET_NAME="r2_bucket_adiniz"
PAYTR_MERCHANT_ID="paytr_uye_isyeri_no"
PAYTR_MERCHANT_KEY="paytr_isyeri_anahtari"
PAYTR_MERCHANT_SALT="paytr_isyeri_parolasi"
APP_URL="https://lpgportal.com"
```

### Adım 3: Cloudflare R2 CORS ve Public Domain Ayarları
Yüklenen firma logolarının ve görsellerin tarayıcıdan sorunsuz çekilebilmesi için R2 panelinden:
1.  **CORS Policy:** Tarayıcıdan dosya yükleme (PUT/POST) isteklerine izin verecek CORS kurallarını tanımlayın.
2.  **Public Access:** R2 Bucket ayarlarından bir alt alan adı (örn: `cdn.lpgportal.com`) bağlayarak dosyaları genel erişime açın.

### Adım 4: PayTR Webhook Callback Yapılandırması
PayTR yönetim panelindeki **"Bildirim URL Ayarları"** sekmesine gidin ve webhook callback adresinizi şu şekilde tanımlayın:
`https://lpgportal.com/api/payment/paytr-callback`

---

## 3. LİNT VE DERLEME (BUILD)
Canlıya çıkmadan önce uygulamanın hata vermeden derlendiğini doğrulamak için:
```bash
# Projeyi derleyin
npm run build
# Sunucuyu başlatın
npm run start
```
Vercel üzerinde barındırırken, build komutu olarak `npm run build` ve output directory olarak `dist` seçilmelidir.
