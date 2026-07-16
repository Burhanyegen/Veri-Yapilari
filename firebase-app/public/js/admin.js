import { db, auth } from './firebase-init.js';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

let categories = [];
let products = [];
let editingPhoto = null; // yeni seçilen fotoğrafın dataURL'i

// ---------- Yardımcılar ----------

function showMsg(text, isError = false) {
  const el = $('#msg');
  el.textContent = text;
  el.className = `alert ${isError ? 'alert-error' : 'alert-ok'}`;
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => el.classList.add('hidden'), 4000);
}

function parsePrice(raw) {
  const price = parseFloat(String(raw).replace(',', '.'));
  return Number.isFinite(price) && price >= 0 ? price : null;
}

const fmtPrice = (n) => Number(n).toLocaleString('tr-TR', {
  minimumFractionDigits: 0, maximumFractionDigits: 2,
});

// Fotoğrafı tarayıcıda küçült (Firestore belge sınırına sığması için)
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 640;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.75;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > 700000 && quality > 0.3) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      URL.revokeObjectURL(img.src);
      if (dataUrl.length > 700000) reject(new Error('Fotoğraf çok büyük, daha küçük bir görsel seçin.'));
      else resolve(dataUrl);
    };
    img.onerror = () => reject(new Error('Fotoğraf okunamadı.'));
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Oturum ----------

onAuthStateChanged(auth, (user) => {
  $('#view-login').classList.toggle('hidden', !!user);
  $('#view-panel').classList.toggle('hidden', !user);
  if (user) {
    $('#who').textContent = user.email;
    refresh();
  }
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  try {
    await signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value);
    f.reset();
    $('#login-error').classList.add('hidden');
  } catch (err) {
    const el = $('#login-error');
    el.textContent = 'E-posta veya şifre hatalı.';
    el.classList.remove('hidden');
  }
});

$('#logout-btn').addEventListener('click', () => signOut(auth));

// ---------- Sekmeler ----------

document.querySelectorAll('.tab-link').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    ['products', 'categories', 'qr', 'password'].forEach((t) => {
      $(`#tab-${t}`).classList.toggle('hidden', t !== a.dataset.tab);
    });
  });
});

// QR: menü adresini gösteren kod (harici üretici ile, kütüphane gerekmez)
const menuUrl = `${location.origin}/`;
$('#qr-url').textContent = menuUrl;
$('#qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`;

// ---------- Veri yükleme ----------

async function refresh() {
  const [catSnap, prodSnap] = await Promise.all([
    getDocs(query(collection(db, 'categories'), orderBy('sort_order'))),
    getDocs(query(collection(db, 'products'), orderBy('name'))),
  ]);
  categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  products = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderProducts();
  renderCategories();
  fillCategorySelect();
  $('#seed-btn').classList.toggle('hidden', categories.length > 0);
}

// ---------- Ürün listesi ----------

function renderProducts() {
  const host = $('#product-list');
  if (products.length === 0) {
    host.innerHTML = '<p class="loading">Henüz ürün yok. "+ Yeni Ürün" ile ekleyin.</p>';
    return;
  }
  host.innerHTML = categories.map((cat) => {
    const items = products.filter((p) => p.category_id === cat.id);
    if (items.length === 0) return '';
    return `
      <section class="admin-category">
        <h2>${esc(cat.name)}</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Ürün</th><th>Fiyat (₺)</th><th>Durum</th><th>İşlemler</th></tr></thead>
            <tbody>
              ${items.map((p) => `
                <tr class="${p.available ? '' : 'row-sold-out'}">
                  <td><strong>${esc(p.name)}</strong>${p.description ? `<br><small>${esc(p.description)}</small>` : ''}</td>
                  <td>
                    <span class="price-form">
                      <input type="text" inputmode="decimal" value="${fmtPrice(p.price).replace(/ /g, '')}" data-price-input="${p.id}" size="7">
                      <button type="button" class="btn btn-small" data-save-price="${p.id}">Kaydet</button>
                    </span>
                  </td>
                  <td>
                    <button type="button" class="btn btn-small ${p.available ? 'btn-ok' : 'btn-warn'}" data-toggle="${p.id}">
                      ${p.available ? 'Mevcut ✓' : 'Tükendi ✗'}
                    </button>
                  </td>
                  <td class="actions">
                    <button type="button" class="btn btn-small" data-edit="${p.id}">Düzenle</button>
                    <button type="button" class="btn btn-small btn-danger" data-delete="${p.id}">Sil</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>`;
  }).join('');
}

$('#product-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  try {
    if (btn.dataset.savePrice) {
      const price = parsePrice($(`[data-price-input="${btn.dataset.savePrice}"]`).value);
      if (price === null) return showMsg('Geçersiz fiyat', true);
      await updateDoc(doc(db, 'products', btn.dataset.savePrice), { price });
      showMsg('Fiyat güncellendi');
      await refresh();
    } else if (btn.dataset.toggle) {
      const p = products.find((x) => x.id === btn.dataset.toggle);
      await updateDoc(doc(db, 'products', p.id), { available: !p.available });
      await refresh();
    } else if (btn.dataset.edit) {
      openProductForm(products.find((x) => x.id === btn.dataset.edit));
    } else if (btn.dataset.delete) {
      const p = products.find((x) => x.id === btn.dataset.delete);
      if (!confirm(`${p.name} silinsin mi?`)) return;
      await deleteDoc(doc(db, 'products', p.id));
      showMsg('Ürün silindi');
      await refresh();
    }
  } catch (err) {
    console.error(err);
    showMsg('İşlem başarısız: ' + err.message, true);
  }
});

// ---------- Ürün formu ----------

function fillCategorySelect() {
  $('#product-form [name=category_id]').innerHTML = categories
    .map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`)
    .join('');
}

function openProductForm(product) {
  const f = $('#product-form');
  f.reset();
  editingPhoto = null;
  f.id.value = product ? product.id : '';
  $('#product-form-title').textContent = product ? 'Ürün Düzenle' : 'Yeni Ürün';
  if (product) {
    f.name.value = product.name;
    f.description.value = product.description || '';
    f.price.value = product.price;
    f.category_id.value = product.category_id;
    f.available.checked = !!product.available;
  }
  const hasPhoto = product && product.image;
  $('#photo-preview-wrap').classList.toggle('hidden', !hasPhoto);
  if (hasPhoto) $('#photo-preview').src = product.image;
  f.classList.remove('hidden');
  f.scrollIntoView({ behavior: 'smooth' });
}

$('#new-product-btn').addEventListener('click', () => {
  if (categories.length === 0) return showMsg('Önce bir kategori ekleyin (Kategoriler sekmesi).', true);
  openProductForm(null);
});
$('#product-cancel-btn').addEventListener('click', () => $('#product-form').classList.add('hidden'));

$('#product-form [name=photo]').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    editingPhoto = await resizePhoto(file);
    $('#photo-preview').src = editingPhoto;
    $('#photo-preview-wrap').classList.remove('hidden');
    $('#product-form [name=remove_image]').checked = false;
  } catch (err) {
    showMsg(err.message, true);
    e.target.value = '';
  }
});

$('#product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const price = parsePrice(f.price.value);
  if (!f.name.value.trim() || price === null) return showMsg('Ürün adı ve geçerli bir fiyat zorunludur.', true);

  const data = {
    name: f.name.value.trim(),
    description: f.description.value.trim(),
    price,
    category_id: f.category_id.value,
    available: f.available.checked,
  };

  const btn = $('#product-save-btn');
  btn.disabled = true;
  try {
    if (f.id.value) {
      const existing = products.find((x) => x.id === f.id.value);
      data.image = editingPhoto || (f.remove_image.checked ? null : existing.image || null);
      await updateDoc(doc(db, 'products', f.id.value), data);
      showMsg('Ürün güncellendi');
    } else {
      data.image = editingPhoto || null;
      await addDoc(collection(db, 'products'), data);
      showMsg('Ürün eklendi');
    }
    f.classList.add('hidden');
    await refresh();
  } catch (err) {
    console.error(err);
    showMsg('Kaydedilemedi: ' + err.message, true);
  } finally {
    btn.disabled = false;
  }
});

// ---------- Kategoriler ----------

function renderCategories() {
  const host = $('#category-list');
  if (categories.length === 0) {
    host.innerHTML = '<p class="loading">Henüz kategori yok.</p>';
    return;
  }
  host.innerHTML = `
    <table>
      <thead><tr><th>Sıra</th><th>Ad</th><th>Ürün</th><th>İşlemler</th></tr></thead>
      <tbody>
        ${categories.map((c, i) => `
          <tr>
            <td class="actions">
              <button type="button" class="btn btn-small" data-move-up="${c.id}" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="btn btn-small" data-move-down="${c.id}" ${i === categories.length - 1 ? 'disabled' : ''}>↓</button>
            </td>
            <td>
              <span class="price-form">
                <input type="text" value="${esc(c.name)}" data-cat-name="${c.id}">
                <button type="button" class="btn btn-small" data-rename="${c.id}">Kaydet</button>
              </span>
            </td>
            <td>${products.filter((p) => p.category_id === c.id).length}</td>
            <td><button type="button" class="btn btn-small btn-danger" data-delete-cat="${c.id}">Sil</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
}

$('#category-add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = e.target.name.value.trim();
  if (!name) return;
  const max = categories.reduce((m, c) => Math.max(m, c.sort_order || 0), 0);
  await addDoc(collection(db, 'categories'), { name, sort_order: max + 1 });
  e.target.reset();
  showMsg('Kategori eklendi');
  await refresh();
});

$('#category-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  try {
    if (btn.dataset.rename) {
      const name = $(`[data-cat-name="${btn.dataset.rename}"]`).value.trim();
      if (!name) return showMsg('Kategori adı boş olamaz', true);
      await updateDoc(doc(db, 'categories', btn.dataset.rename), { name });
      showMsg('Kategori güncellendi');
      await refresh();
    } else if (btn.dataset.moveUp || btn.dataset.moveDown) {
      const id = btn.dataset.moveUp || btn.dataset.moveDown;
      const dir = btn.dataset.moveUp ? -1 : 1;
      const idx = categories.findIndex((c) => c.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= categories.length) return;
      const batch = writeBatch(db);
      categories.forEach((c, i) => batch.update(doc(db, 'categories', c.id), { sort_order: i + 1 }));
      batch.update(doc(db, 'categories', categories[idx].id), { sort_order: swap + 1 });
      batch.update(doc(db, 'categories', categories[swap].id), { sort_order: idx + 1 });
      await batch.commit();
      await refresh();
    } else if (btn.dataset.deleteCat) {
      const c = categories.find((x) => x.id === btn.dataset.deleteCat);
      const count = products.filter((p) => p.category_id === c.id).length;
      if (!confirm(`${c.name} ve içindeki ${count} ürün silinsin mi?`)) return;
      const batch = writeBatch(db);
      products.filter((p) => p.category_id === c.id)
        .forEach((p) => batch.delete(doc(db, 'products', p.id)));
      batch.delete(doc(db, 'categories', c.id));
      await batch.commit();
      showMsg('Kategori silindi');
      await refresh();
    }
  } catch (err) {
    console.error(err);
    showMsg('İşlem başarısız: ' + err.message, true);
  }
});

// ---------- Şifre değiştirme ----------

$('#password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.password.value !== f.confirm.value) return showMsg('Yeni şifreler birbiriyle uyuşmuyor.', true);
  if (f.password.value.length < 6) return showMsg('Yeni şifre en az 6 karakter olmalı.', true);
  try {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, f.current.value);
    await reauthenticateWithCredential(user, cred);
    await updatePassword(user, f.password.value);
    f.reset();
    showMsg('Şifreniz güncellendi');
  } catch (err) {
    console.error(err);
    showMsg('Mevcut şifre hatalı.', true);
  }
});

// ---------- Örnek menü (boş veritabanı için) ----------

const SAMPLE_MENU = [
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

$('#seed-btn').addEventListener('click', async () => {
  const batch = writeBatch(db);
  SAMPLE_MENU.forEach(([catName, items], i) => {
    const catRef = doc(collection(db, 'categories'));
    batch.set(catRef, { name: catName, sort_order: i + 1 });
    items.forEach(([name, description, price]) => {
      batch.set(doc(collection(db, 'products')), {
        category_id: catRef.id, name, description, price, image: null, available: true,
      });
    });
  });
  await batch.commit();
  showMsg('Örnek menü yüklendi — panelden düzenleyebilirsiniz');
  await refresh();
});
