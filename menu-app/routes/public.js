const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const categories = db
    .prepare('SELECT * FROM categories ORDER BY sort_order, name')
    .all();
  const products = db
    .prepare('SELECT * FROM products ORDER BY name')
    .all();

  const byCategory = categories
    .map((cat) => ({
      ...cat,
      products: products.filter((p) => p.category_id === cat.id),
    }))
    .filter((cat) => cat.products.length > 0);

  res.render('menu', { categories: byCategory });
});

module.exports = router;
