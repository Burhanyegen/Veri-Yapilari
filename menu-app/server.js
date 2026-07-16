const express = require('express');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 }, // 8 saat
  })
);

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => res.status(404).send('Sayfa bulunamadı'));

app.listen(PORT, () => {
  console.log(`Meyhane menüsü hazır: http://localhost:${PORT}`);
  console.log(`Yönetici paneli:     http://localhost:${PORT}/admin`);
});
