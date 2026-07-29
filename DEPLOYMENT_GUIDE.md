# LPG PORTAL – SUNUCU KURULUM VE DAĞITIM REHBERİ (DEPLOYMENT GUIDE)

Bu rehber, LPG PORTAL uygulamasının herhangi bir temiz **Ubuntu 20.04/22.04 LTS VPS** veya Cloud sunucusu üzerine sıfırdan kurulup yayına alınması (production ready) için gerekli tüm adımları içermektedir.

---

## 📋 Gereksinimler
- **İşletim Sistemi:** Ubuntu 20.04 veya 22.04 LTS
- **Minimum Donanım:** 1 vCPU, 1 GB RAM, 15 GB Disk
- **Alan Adı (Domain):** Uygulamanın yönlendirileceği ve SSL kurulacak bir alan adı (örn: `lpgportal.com`)

---

## 🛠️ Kurulum Adımları

### 1. Ubuntu Sistem Güncellemesi
Öncelikle sunucudaki tüm paket listesini güncelleyelim ve kurulu paketleri yükseltelim:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Node.js ve NPM Kurulumu
LPG PORTAL, kararlı çalışan LTS sürümü olan **Node.js v20** gerektirir. NodeSource depoları üzerinden Node.js ve NPM kurulumunu yapalım:
```bash
# NodeSource v20 LTS reposunu sisteme ekleme
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js kurulumu (NPM otomatik kurulacaktır)
sudo apt-get install -y nodejs

# Versiyon kontrolü
node -v  # v20.x.x çıktısı vermelidir
npm -v   # 10.x.x çıktısı vermelidir
```

### 3. Uygulama Dosyalarının Yüklenmesi
Hazırladığınız `lpgportal_production_ready.zip` arşivini sunucuya yükleyin (SCP, SFTP veya FTP ile). Ardından `/var/www/lpgportal` dizinine açın:
```bash
# Zip paketini açmak için unzip kurulması (eğer yüklü değilse)
sudo apt install unzip -y

# Uygulama dizini oluşturma
sudo mkdir -p /var/www/lpgportal
sudo chown -R $USER:$USER /var/www/lpgportal

# Dosyaları çıkartma
unzip lpgportal_production_ready.zip -d /var/www/lpgportal
cd /var/www/lpgportal
```

### 4. Ortam Değişkenlerinin Yapılandırılması (.env)
Sunucuda `.env.example` dosyasını temel alarak gerçek `.env` dosyasını oluşturun ve bilgileri düzenleyin:
```bash
cp .env.example .env
nano .env
```
Dosya içerisindeki `DATABASE_URL` (PostgreSQL kullanıyorsanız), `GEMINI_API_KEY`, ve entegrasyon bilgilerini (PayTR, Netgsm, Resend vb.) doldurun. Kaydetmek için `CTRL+O`, kapatmak için `CTRL+X` tuşlayın.

### 5. Bağımlılıkların Kurulması (Install Script)
Uygulama bağımlılıklarını kurmak ve Prisma şemasını senkronize etmek için hazırlanan otomatik kurulum betiğini çalıştırın:
```bash
chmod +x install.sh
./install.sh
```

*(Not: `install.sh` betiği sırasıyla `npm install` çalıştırır, Prisma şemasını veritabanı ile eşitler ve gerekli veritabanı tablolarını hazırlar.)*

### 6. Derleme / Build Alma
Frontend assetlerini ve NodeJS Express backend sunucusunu production modunda derlemek için build betiğini tetikleyin:
```bash
npm run build
```
Bu komut sonucunda:
- İstemci (Vite + React) kodları `dist` altına derlenir.
- Express sunucu kodları (`server.ts`) `dist/server.cjs` adıyla tek bir dosya halinde paketlenir.

### 7. PM2 (Process Manager) Kurulumu ve Servis Başlatma
Uygulamanın sunucuda arka planda sürekli çalışması ve çökme durumlarında otomatik olarak yeniden başlatılması için **PM2** kuralım:
```bash
# PM2'yu global olarak kurun
sudo npm install -g pm2

# start.sh dosyasını çalıştırılabilir yapın
chmod +x start.sh

# Uygulamayı PM2 üzerinde start.sh ile başlatın
./start.sh
```
PM2'nun sunucu yeniden başlatıldığında (reboot) otomatik olarak devreye girmesi için şu komutları uygulayın:
```bash
# PM2 başlangıç betiğini oluşturma
pm2 startup

# Yukarıdaki komutun size vereceği sudo env PATH... ile başlayan komutu kopyalayıp terminale yapıştırıp çalıştırın.
# Örnek: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Mevcut PM2 süreç listesini kaydetme
pm2 save
```

### 8. NGINX Reverse Proxy Kurulumu
Uygulamayı port numarası girmeden (direkt 80 ve 443 portlarından) dış dünyaya açmak için Nginx web sunucusunu ters proxy olarak yapılandırın:
```bash
# Nginx kurulumu
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```
Nginx varsayılan konfigürasyonunu düzenleyin:
```bash
sudo nano /etc/nginx/sites-available/default
```
İçeriği tamamen silip aşağıdaki blokla değiştirin (alan adınızı yazmayı unutmayın):
```nginx
server {
    listen 80;
    server_name lpgportal.com www.lpgportal.com; # Kendi alan adınızı yazın

    location / {
        proxy_pass http://125.0.0.1:3000; # Express backend portu
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Dosya yükleme limitini artırma (Maks 10MB)
        client_max_body_size 10M;
    }
}
```
Kaydedip kapatın. Konfigürasyonu test edin ve Nginx'i yeniden başlatın:
```bash
sudo nginx -t  # "syntax is ok" ve "test is successful" görmelisiniz
sudo systemctl restart nginx
```

### 9. Let's Encrypt SSL Kurulumu
Güvenli HTTPS bağlantısı için ücretsiz SSL sertifikası kurun:
```bash
# Certbot ve Nginx eklentisinin kurulması
sudo apt install certbot python3-certbot-nginx -y

# SSL sertifikası alma (Aşağıdaki komutta alan adınızı güncelleyin)
sudo certbot --nginx -d lpgportal.com -d www.lpgportal.com
```
Certbot size yönlendirme yapıp yapmayacağını soracaktır. Ziyaretçileri HTTPS'e otomatik yönlendirmek için **Redirect (2)** seçeneğini işaretleyin. Certbot, Nginx konfigürasyonunu otomatik olarak güncelleyecektir.

Sertifikanın otomatik yenilenmesi (auto-renew) varsayılan olarak certbot cronjob'ı tarafından arka planda otomatik olarak kontrol edilecektir:
```bash
sudo certbot renew --dry-run # Doğrulama testi
```

Tebrikler! LPG PORTAL artık HTTPS protokolü üzerinden güvenli ve yüksek performanslı şekilde sunucunuzda yayındadır!

---

## 📈 PM2 Yönetim Kısayolları
- **Durum İzleme:** `pm2 status`
- **Canlı Loglar:** `pm2 logs lpgportal`
- **Yeniden Başlatma:** `pm2 restart lpgportal`
- **Durdurma:** `pm2 stop lpgportal`
- **Performans İzleme:** `pm2 monit`
