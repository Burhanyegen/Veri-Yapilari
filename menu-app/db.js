const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'menu.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price REAL NOT NULL,
    image TEXT,
    available INTEGER NOT NULL DEFAULT 1
  );
`);

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }

  const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
  if (catCount > 0) return;

  const insertCat = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)');
  const insertProd = db.prepare(
    'INSERT INTO products (category_id, name, description, price, available) VALUES (?, ?, ?, ?, 1)'
  );

  const menu = [
    ['Mezeler', [
      ['Beyaz Peynir', 'Ezine peyniri, kavun eşliğinde', 180],
      ['Atom', 'Süzme yoğurt, kurutulmuş acı biber', 160],
      ['Fava', 'Zeytinyağlı bakla ezmesi, dereotu', 150],
      ['Haydari', 'Süzme yoğurt, sarımsak, nane', 140],
      ['Lakerda', 'Klasik boğaz usulü, kırmızı soğan', 320],
    ]],
    ['Ara Sıcaklar', [
      ['Kalamar Tava', 'Tarator sos ile', 340],
      ['Midye Tava', 'Çıtır midye, tarator sos', 300],
      ['Paçanga Böreği', 'Pastırmalı, kaşarlı el açması börek', 260],
      ['Arnavut Ciğeri', 'Soğan ve maydanoz ile', 280],
    ]],
    ['Ana Yemekler', [
      ['Levrek Izgara', 'Mevsim yeşillikleri ile', 520],
      ['Çipura Izgara', 'Roka ve limon eşliğinde', 500],
      ['Kuzu Pirzola', 'Izgara sebze ile', 580],
    ]],
    ['Rakılar', [
      ['Yeni Rakı 70cl', '', 1200],
      ['Yeni Rakı 35cl', '', 650],
      ['Tekirdağ Rakısı 70cl', '', 1250],
      ['Rakı Kadeh', 'Tek kadeh servis', 180],
    ]],
    ['İçecekler', [
      ['Su 75cl', '', 60],
      ['Soda', '', 50],
      ['Şalgam Suyu', 'Acılı veya acısız', 70],
      ['Kola', '', 80],
    ]],
    ['Tatlılar', [
      ['Kabak Tatlısı', 'Tahin ve ceviz ile', 160],
      ['Fırın Sütlaç', '', 140],
      ['Mevsim Meyve Tabağı', '', 200],
    ]],
  ];

  const tx = db.transaction(() => {
    menu.forEach(([catName, products], i) => {
      const catId = insertCat.run(catName, i + 1).lastInsertRowid;
      products.forEach(([name, desc, price]) => insertProd.run(catId, name, desc, price));
    });
  });
  tx();
}

seed();

module.exports = db;
