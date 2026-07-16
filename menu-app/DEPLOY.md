# 🌐 İnternette Yayına Alma Rehberi

Menünün müşterilerin telefonunda (QR ile) açılabilmesi için uygulamanın internette bir adreste çalışması gerekir. Aşağıda en pratik yol olan **Railway** adım adım anlatılmıştır; alternatifler en altta.

> **Neden Railway?** GitHub'dan tek tıkla kurulur, kalıcı disk desteği vardır (menü verisi ve fotoğraflar silinmez), ayda ~5 USD. Ücretsiz planlar genelde kalıcı disk vermez — menü her yeniden başlatmada sıfırlanır, gerçek işletme için uygun değildir.

## Railway ile Yayın (önerilen)

### 1. Hesap aç
[railway.com](https://railway.com) → **Login** → **GitHub ile giriş yap** (repo'nun olduğu GitHub hesabıyla).

### 2. Projeyi oluştur
- **New Project** → **Deploy from GitHub repo** → `Burhanyegen/Veri-Yapilari` seç.
- Railway repo erişim izni isterse ver.

### 3. Servis ayarları
Oluşan servise tıkla → **Settings** sekmesi:
- **Root Directory**: `menu-app`
- **Branch**: yayınlamak istediğin dal (ör. `main` ya da mevcut çalışma dalı)

### 4. Kalıcı disk ekle (önemli!)
- Servise sağ tıkla (veya **⌘K / Ctrl+K**) → **Attach Volume**
- **Mount path**: `/data`

Bu disk olmadan her güncellemede menü ve fotoğraflar silinir.

### 5. Ortam değişkenleri
Servis → **Variables** sekmesine şunları ekle:

| Değişken | Değer |
|---|---|
| `DB_PATH` | `/data/menu.db` |
| `UPLOAD_DIR` | `/data/uploads` |
| `SESSION_SECRET` | uzun rastgele bir metin (aşağıya bak) |
| `NODE_ENV` | `production` |

`SESSION_SECRET` üretmek için kendi bilgisayarında:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Adres al
Servis → **Settings** → **Networking** → **Generate Domain**.
`https://....up.railway.app` gibi bir adres verir. (İstersen kendi alan adını da bağlayabilirsin: **Custom Domain**.)

### 7. Yayın sonrası ilk işler
1. `https://ADRESIN/admin` → `admin / admin123` ile gir.
2. **Şifre** sayfasından şifreyi hemen değiştir.
3. Menüyü düzenle (gerçek ürünler, fiyatlar, fotoğraflar).
4. **QR Kod** sayfasını aç → yazdır → masalara koy. QR artık internetteki adresi gösterir, her telefonda açılır.

### Güncelleme nasıl gider?
GitHub'daki dala her `git push` yaptığında Railway otomatik olarak yeniden yayınlar. Kalıcı disk sayesinde menü verisi ve fotoğraflar korunur.

## Alternatifler

- **Render** (render.com): Benzer kurulum; kalıcı disk için ücretli plan gerekir (Starter + Disk). Ücretsiz planında disk kalıcı DEĞİLDİR — sadece deneme için kullan.
- **Fly.io**: Daha ucuz olabilir ama kurulumu komut satırı ister (`fly launch` + volume).
- **Kendi sunucun (VPS)**: Hetzner/DigitalOcean gibi bir sunucuda `Dockerfile` ile çalıştırabilirsin:
  ```bash
  docker build -t sadem-menu .
  docker run -d -p 80:3000 -v sadem-data:/data \
    -e DB_PATH=/data/menu.db -e UPLOAD_DIR=/data/uploads \
    -e SESSION_SECRET="uzun-rastgele-anahtar" sadem-menu
  ```

## Sık Sorulanlar

- **Veri nerede duruyor?** Tek dosya: `DB_PATH` ile gösterilen SQLite dosyası. Fotoğraflar `UPLOAD_DIR` klasöründe. Volume'u yedeklersen her şeyi yedeklemiş olursun.
- **Site uyuyor mu?** Railway'de uygulama sürekli açık kalır. Ücretsiz denemelerde (Render free) uygulama uykuya dalar, ilk açılış 30-60 sn sürebilir.
- **HTTPS?** Railway/Render otomatik sağlar, ekstra bir şey yapmana gerek yok.
