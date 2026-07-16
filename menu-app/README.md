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

## İnternete Açma (QR'ın müşteri telefonlarında çalışması için)

Adım adım yayın rehberi için **[DEPLOY.md](DEPLOY.md)** dosyasına bakın (Railway ile ~10 dakikada yayına alınır).

Desteklenen ortam değişkenleri:

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `PORT` | Sunucu portu | `3000` |
| `SESSION_SECRET` | Oturum imzalama anahtarı (üretimde mutlaka ayarlayın) | her açılışta rastgele |
| `DB_PATH` | SQLite dosyasının yolu (kalıcı disk için) | `menu-app/menu.db` |
| `UPLOAD_DIR` | Fotoğraf klasörü (kalıcı disk için) | `menu-app/public/uploads` |

## Teknolojiler

Node.js · Express · SQLite (Node yerleşik `node:sqlite` modülü) · EJS · express-session · bcryptjs · multer · qrcode

## Notlar

- İlk çalıştırmada veritabanı örnek menüyle doldurulur; panelden tamamen özelleştirilebilir.
- Fotoğraflar en fazla 5 MB, sadece resim dosyası (jpg/png/webp/gif) kabul edilir.
- Logo yazı tipi (Playfair Display) internetten yüklenir; internet yoksa şık bir yedek serif kullanılır.
