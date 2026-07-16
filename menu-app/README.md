# 🍇 Meyhane Menü Sistemi

Yeni nesil meyhane için dijital menü. Müşteriler menüyü telefondan QR kod ile görüntüler; yönetici, panelden ürün ekler/siler, fiyat değiştirir, fotoğraf yükler ve ürünleri "tükendi" olarak işaretler.

## Özellikler

- 📱 Mobil öncelikli, QR uyumlu müşteri menüsü (`/`)
- 🔐 Kullanıcı adı + şifre ile korunan yönetici paneli (`/admin`)
- 🗂️ Kategori yönetimi (ekle, yeniden adlandır, sırala, sil)
- 🍽️ Ürün yönetimi: ekle, düzenle, sil, fotoğraf yükle
- 💰 Panelden satır içi hızlı fiyat güncelleme
- 🚫 Tek tıkla "Tükendi" işaretleme (menüde soluk görünür)
- 📷 QR kod sayfası (`/admin/qr`) — yazdırıp masalara koyun
- 💾 Veriler SQLite dosyasında kalıcıdır (`menu.db`)

## Kurulum

```bash
cd menu-app
npm install
npm start
```

- Menü: http://localhost:3000
- Yönetici paneli: http://localhost:3000/admin

## Varsayılan Yönetici Hesabı

| Kullanıcı adı | Şifre |
|---|---|
| `admin` | `admin123` |

> ⚠️ Gerçek kullanımda ilk iş olarak şifreyi değiştirin. Şifre `users` tablosunda bcrypt ile hash'lenmiş tutulur; yeni şifre için örnek:
> ```bash
> node -e "const db=require('./db');const b=require('bcryptjs');db.prepare('UPDATE users SET password_hash=? WHERE username=?').run(b.hashSync('YENI_SIFRE',10),'admin');console.log('güncellendi')"
> ```

## Teknolojiler

Node.js · Express · SQLite (better-sqlite3) · EJS · express-session · bcryptjs · multer · qrcode

## Notlar

- İlk çalıştırmada veritabanı örnek kategoriler ve ürünlerle doldurulur (seed). Panelden hepsini değiştirebilirsiniz.
- Fotoğraflar `public/uploads/` klasörüne kaydedilir (en fazla 5 MB, sadece resim).
- Sunucuyu internete açarken `SESSION_SECRET` ortam değişkeni ayarlamanız önerilir.
