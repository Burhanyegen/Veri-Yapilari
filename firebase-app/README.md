# SADEM — Dijital Menü (Firebase Sürümü · Tamamen Ücretsiz)

Sadem Meyhane'nin QR menüsünün **Firebase** üzerinde çalışan, aylık ücreti olmayan sürümü. Bir meyhane menüsünün trafiği Firebase'in ücretsiz limitlerinin çok altında kalır; **kredi kartı da istemez**.

- Müşteri menüsü: `https://PROJE-ID.web.app`
- Yönetici paneli: `https://PROJE-ID.web.app/admin`

Özellikler Node sürümüyle aynıdır: ürün/fiyat/kategori yönetimi, fotoğraf (otomatik küçültülür), "tükendi" işareti, QR sayfası, panelden şifre değiştirme, boş menüde tek tıkla örnek menü yükleme.

## Kurulum (bir kere yapılır, ~15 dakika)

### 1. Firebase projesi aç
1. [console.firebase.google.com](https://console.firebase.google.com) → Google hesabınla gir → **Create a project**
2. İsim ver (ör. `sadem-menu`) → Google Analytics'i **kapatabilirsin** → oluştur.

### 2. Firestore'u aç (veritabanı)
1. Sol menü **Build → Firestore Database → Create database**
2. Konum: `europe-west1` (veya `eur3`) → **Production mode** ile başlat.
   (Güvenlik kuralları zaten bu klasörde hazır; deploy'da otomatik yüklenir.)

### 3. Girişi aç ve yönetici hesabını ekle
1. Sol menü **Build → Authentication → Get started**
2. **Sign-in method** sekmesi → **Email/Password** → etkinleştir → kaydet.
3. **Users** sekmesi → **Add user** → yönetici e-postası + güçlü bir şifre gir.
   (Panele bu bilgilerle gireceksin.)

### 4. Web uygulaması yapılandırmasını kopyala
1. Sol üstteki dişli ⚙️ → **Project settings** → **General** → aşağıda **Your apps** → **`</>`** (Web) simgesi → uygulama ekle (isim: `menu`, Hosting kutusunu işaretlemene gerek yok).
2. Karşına çıkan `firebaseConfig = { ... }` nesnesini kopyala.
3. Bu klasördeki **`public/js/firebase-config.js`** dosyasını aç, içindeki örnek değerlerin yerine kendi değerlerini yapıştır.

### 5. Yayınla
Bilgisayarında bir kere ([Node.js](https://nodejs.org) kurulu olmalı):

```bash
npm install -g firebase-tools
firebase login
```

Sonra bu klasörde (`firebase-app`):

```bash
firebase deploy --project PROJE-ID
```

(`PROJE-ID` = Firebase konsolunda Project settings'te yazan Project ID.)

Çıktıda `Hosting URL: https://PROJE-ID.web.app` görünür — **siten yayında**.

### 6. İlk kullanım
1. `https://PROJE-ID.web.app/admin` → 3. adımdaki e-posta/şifre ile gir.
2. Menü boşsa **"Örnek menüyü yükle"** düğmesiyle başla, sonra panelden düzenle.
3. **QR Kod** sekmesinden QR'ı yazdır, masalara koy.

## Güncelleme

Kodda/tasarımda değişiklik olursa aynı komut yeterli:
```bash
firebase deploy --project PROJE-ID
```
Menü verisi Firestore'da durur; deploy veriyi etkilemez.

## Nasıl çalışıyor? (teknik özet)

- **Firebase Hosting** — statik sayfalar (`public/`): menü ve yönetici paneli
- **Firestore** — `categories` ve `products` koleksiyonları; okuma herkese açık, yazma sadece giriş yapmış yöneticiye (`firestore.rules`)
- **Firebase Auth** — e-posta/şifre ile yönetici girişi
- **Fotoğraflar** — tarayıcıda 640px'e küçültülüp JPEG olarak doğrudan ürün kaydının içinde saklanır (ayrı depolama hizmeti gerekmez)
- **QR kodu** — `api.qrserver.com` ile anlık üretilir

## Ücretsiz limitler yeter mi?

Firestore ücretsiz kotası günde 50.000 okuma / 20.000 yazmadır. Menü sayfasının her açılışı ürün sayısı kadar okuma yapar; günde yüzlerce müşteri açsa bile kotanın küçük bir kısmı kullanılır. Hosting kotası (10 GB depolama / günlük 360 MB trafik) de bu ölçek için fazlasıyla yeterlidir.

## Sorun giderme

- **"Missing or insufficient permissions"** → 2. adımdaki Firestore kurulmamış ya da kurallar yüklenmemiş; `firebase deploy` komutunu tekrar çalıştır.
- **Panelde giriş olmuyor** → Authentication'da Email/Password etkin mi, kullanıcı ekli mi kontrol et.
- **Sayfa boş** → `public/js/firebase-config.js` içindeki config değerlerinin doğru yapıştırıldığından emin ol (tarayıcı konsolunda hata görünür).
