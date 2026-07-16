const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `urun-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(
      path.extname(file.originalname).toLowerCase()
    );
    cb(ok ? null : new Error('Sadece resim dosyası yüklenebilir (jpg, png, webp, gif).'), ok);
  },
});

function deleteImage(image) {
  if (!image) return;
  const file = path.join(UPLOAD_DIR, path.basename(image));
  fs.unlink(file, () => {});
}

function parsePrice(raw) {
  const price = parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(price) && price >= 0 ? price : null;
}

// ---- Giriş / Çıkış ----

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  res.render('admin/login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).render('admin/login', { error: 'Kullanıcı adı veya şifre hatalı.' });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Bundan sonraki tüm rotalar giriş ister
router.use(requireLogin);

// ---- Panel ----

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
  const products = db
    .prepare(
      `SELECT p.*, c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       ORDER BY c.sort_order, c.name, p.name`
    )
    .all();
  res.render('admin/dashboard', {
    categories,
    products,
    username: req.session.username,
    msg: req.query.msg || null,
    error: req.query.error || null,
  });
});

// ---- Ürünler ----

router.get('/products/new', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
  res.render('admin/product-form', { product: null, categories, error: null });
});

router.get('/products/:id/edit', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin?error=Ürün bulunamadı');
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
  res.render('admin/product-form', { product, categories, error: null });
});

function renderFormError(res, req, message) {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
  const product = req.params.id
    ? db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    : null;
  return res.status(400).render('admin/product-form', { product, categories, error: message });
}

router.post('/products/new', upload.single('image'), (req, res) => {
  const { name, description, category_id, available } = req.body;
  const price = parsePrice(req.body.price);
  if (!name || !name.trim() || price === null) {
    if (req.file) deleteImage(req.file.filename);
    return renderFormError(res, req, 'Ürün adı ve geçerli bir fiyat zorunludur.');
  }
  db.prepare(
    'INSERT INTO products (category_id, name, description, price, image, available) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    category_id,
    name.trim(),
    (description || '').trim(),
    price,
    req.file ? req.file.filename : null,
    available ? 1 : 0
  );
  res.redirect('/admin?msg=Ürün eklendi');
});

router.post('/products/:id/edit', upload.single('image'), (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.redirect('/admin?error=Ürün bulunamadı');

  const { name, description, category_id, available } = req.body;
  const price = parsePrice(req.body.price);
  if (!name || !name.trim() || price === null) {
    if (req.file) deleteImage(req.file.filename);
    return renderFormError(res, req, 'Ürün adı ve geçerli bir fiyat zorunludur.');
  }

  let image = product.image;
  if (req.file) {
    deleteImage(product.image);
    image = req.file.filename;
  } else if (req.body.remove_image) {
    deleteImage(product.image);
    image = null;
  }

  db.prepare(
    'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image = ?, available = ? WHERE id = ?'
  ).run(category_id, name.trim(), (description || '').trim(), price, image, available ? 1 : 0, product.id);
  res.redirect('/admin?msg=Ürün güncellendi');
});

router.post('/products/:id/delete', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (product) {
    deleteImage(product.image);
    db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  }
  res.redirect('/admin?msg=Ürün silindi');
});

router.post('/products/:id/price', (req, res) => {
  const price = parsePrice(req.body.price);
  if (price === null) return res.redirect('/admin?error=Geçersiz fiyat');
  db.prepare('UPDATE products SET price = ? WHERE id = ?').run(price, req.params.id);
  res.redirect('/admin?msg=Fiyat güncellendi');
});

router.post('/products/:id/toggle', (req, res) => {
  db.prepare('UPDATE products SET available = 1 - available WHERE id = ?').run(req.params.id);
  res.redirect('/admin');
});

// ---- Kategoriler ----

router.get('/categories', (req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id ORDER BY c.sort_order, c.name`
    )
    .all();
  res.render('admin/categories', { categories, error: req.query.error || null });
});

router.post('/categories', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.redirect('/admin/categories?error=Kategori adı boş olamaz');
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories').get().m;
  db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(name, max + 1);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/rename', (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.redirect('/admin/categories?error=Kategori adı boş olamaz');
  db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, req.params.id);
  res.redirect('/admin/categories');
});

router.post('/categories/:id/move', (req, res) => {
  const dir = req.body.dir === 'up' ? -1 : 1;
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order, name').all();
  const idx = cats.findIndex((c) => c.id === Number(req.params.id));
  const swapIdx = idx + dir;
  if (idx !== -1 && swapIdx >= 0 && swapIdx < cats.length) {
    const upd = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      cats.forEach((c, i) => upd.run(i + 1, c.id)); // sıralamayı normalize et
      upd.run(swapIdx + 1, cats[idx].id);
      upd.run(idx + 1, cats[swapIdx].id);
    });
    tx();
  }
  res.redirect('/admin/categories');
});

router.post('/categories/:id/delete', (req, res) => {
  const images = db
    .prepare('SELECT image FROM products WHERE category_id = ? AND image IS NOT NULL')
    .all(req.params.id);
  images.forEach((row) => deleteImage(row.image));
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.redirect('/admin/categories');
});

// ---- QR Kod ----

router.get('/qr', async (req, res) => {
  const menuUrl = `${req.protocol}://${req.get('host')}/`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { width: 400, margin: 2 });
  res.render('admin/qr', { qrDataUrl, menuUrl });
});

// Multer ve diğer hataları yakala
router.use((err, req, res, next) => {
  res.redirect('/admin?error=' + encodeURIComponent(err.message || 'Bir hata oluştu'));
});

module.exports = router;
