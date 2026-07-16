# SADEM — Eski Usül Meyhane · Dijital Menü

Sadem Meyhane (Özlüce / Bursa) için dijital QR menü sistemi. Müşteriler menüyü telefondan görüntüler; işletme sahibi yönetici panelinden ürünleri, fiyatları ve kategorileri kendisi yönetir.

## Özellikler

- 📱 Mobil öncelikli, marka kimliğine uygun müşteri menüsü (`/`)
- 🔐 Kullanıcı adı + şifre korumalı yönetici paneli (`/admin`)
- 💰 Panelden satır içi hızlı fiyat güncelleme
- 🍽️ Ürün ekleme / düzenleme / silme, fotoğraf yükleme
- 🚫 Tek tıkla "Tükendi" işaretleme (menüde soluk görünür)
- 🗂️ Kategori yönetimi (ekle, yeniden adlandır, sırala, sil)
- 📷 QR kod sayfası — yazdırıp masalara koyun
- 🔑 Panelden şifre değiştirme
- 💾 Tüm veriler tek dosyada kalıcı (SQLite, `menu.db`)

## Kurulum

> **Gereksinim:** [Node.js](https://nodejs.org) 22.5 veya üzeri. Ek derleme aracı gerekmez.

```bash
cd menu-app
npm install
npm start
```

- Menü: http://localhost:3000
- Yönetici paneli: http://localhost:3000/admin

İlk açılış: kullanıcı adı **admin**, şifre **admin123**.
**⚠️ İlk girişten hemen sonra panel üstündeki "Şifre" bağlantısından şifrenizi değiştirin.**

## İşletme Sahibi İçin Kullanım

| Ne yapmak istiyorsunuz? | Nasıl? |
|---|---|
| Fiyat değiştirmek | Panelde ürünün yanındaki fiyat kutusuna yeni fiyatı yazın → **Kaydet** |
| Ürün tükendi | Ürünün yanındaki **Mevcut ✓** düğmesine basın (tekrar basınca geri gelir) |
| Yeni ürün eklemek | **+ Yeni Ürün** → adı, fiyatı, kategoriyi girin, isterseniz fotoğraf yükleyin |
| Ürün silmek / düzenlemek | Ürün satırındaki **Düzenle** veya **Sil** |
| Kategori eklemek / sıralamak | Üst menüden **Kategoriler** → ekleyin, ↑↓ ile sıralayın |
| Masalara QR koymak | Üst menüden **QR Kod** → sayfayı yazdırın (Ctrl+P) |
| Şifre değiştirmek | Üst menüden **Şifre** |

Fiyatları `250` veya `249,50` biçiminde yazabilirsiniz; menüde otomatik `₺` ile gösterilir.

## Yedekleme

Tüm menü verisi `menu-app/menu.db` dosyasındadır. Bu dosyayı kopyalamak tam yedek almak demektir. Yüklenen fotoğraflar `public/uploads/` klasöründedir — onu da yedekleyin.

## İnternete Açarken (QR'ın dışarıdan çalışması için)

Menüye müşterilerin kendi telefonundan erişebilmesi için uygulamanın internette bir adreste yayınlanması gerekir (ör. bir VPS, ya da Railway/Render gibi bir Node.js barındırma hizmeti). Yayınlarken:

1. `SESSION_SECRET` ortam değişkenine uzun rastgele bir değer verin (oturumlar sunucu yeniden başlasa da geçerli kalır):
   ```bash
   SESSION_SECRET="uzun-rastgele-bir-anahtar" PORT=3000 npm start
   ```
2. HTTPS kullanın (barındırma hizmetleri genelde otomatik sağlar).
3. `/admin/qr` sayfası QR kodu her zaman o anki adrese göre üretir — site yayına girdikten sonra QR'ı oradan yazdırın.

## Teknolojiler

Node.js · Express · SQLite (Node yerleşik `node:sqlite` modülü) · EJS · express-session · bcryptjs · multer · qrcode

## Notlar

- İlk çalıştırmada veritabanı örnek menüyle doldurulur; panelden tamamen özelleştirilebilir.
- Fotoğraflar en fazla 5 MB, sadece resim dosyası (jpg/png/webp/gif) kabul edilir.
- Logo yazı tipi (Playfair Display) internetten yüklenir; internet yoksa şık bir yedek serif kullanılır.
