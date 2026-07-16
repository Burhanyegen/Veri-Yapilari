import { db } from './firebase-init.js';
import {
  collection, getDocs, query, orderBy,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

const fmtPrice = (n) => Number(n).toLocaleString('tr-TR', {
  minimumFractionDigits: 0, maximumFractionDigits: 2,
});

async function load() {
  const menuEl = document.getElementById('menu');
  const navEl = document.getElementById('cat-nav');
  try {
    const [catSnap, prodSnap] = await Promise.all([
      getDocs(query(collection(db, 'categories'), orderBy('sort_order'))),
      getDocs(query(collection(db, 'products'), orderBy('name'))),
    ]);
    const categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const withProducts = categories
      .map((c) => ({ ...c, products: products.filter((p) => p.category_id === c.id) }))
      .filter((c) => c.products.length > 0);

    if (withProducts.length === 0) {
      menuEl.innerHTML = '<p class="loading">Menü hazırlanıyor, kısa süre sonra buradayız…</p>';
      return;
    }

    navEl.innerHTML = withProducts
      .map((c) => `<a href="#kat-${esc(c.id)}">${esc(c.name)}</a>`)
      .join('');

    menuEl.innerHTML = withProducts.map((c) => `
      <section class="category" id="kat-${esc(c.id)}">
        <h2>${esc(c.name)}</h2>
        ${c.products.map((p) => `
          <article class="item ${p.available ? '' : 'sold-out'}">
            ${p.image ? `<img class="item-photo" src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">` : ''}
            <div class="item-info">
              <div class="item-top">
                <h3>${esc(p.name)}</h3>
                <span class="dots"></span>
                <span class="price">${fmtPrice(p.price)} ₺</span>
              </div>
              ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
              ${p.available ? '' : '<span class="badge">Tükendi</span>'}
            </div>
          </article>
        `).join('')}
      </section>
    `).join('');
  } catch (err) {
    console.error(err);
    menuEl.innerHTML = '<p class="loading">Menü şu an yüklenemedi, lütfen sayfayı yenileyin.</p>';
  }
}

load();
