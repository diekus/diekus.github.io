const GALLERY_JSON = 'gallery.json';

let photos = [];
let currentIndex = 0;
let openerBtn = null;

const dialog = document.getElementById('lightbox');
const lightboxImg = dialog.querySelector('.lightbox-img');
const lightboxDesc = dialog.querySelector('.lightbox-description');
const lightboxPrev = dialog.querySelector('.lightbox-prev');
const lightboxNext = dialog.querySelector('.lightbox-next');
const lightboxClose = dialog.querySelector('.lightbox-close');
const exifRows = dialog.querySelectorAll('.exif-row');

async function init() {
  let data;
  try {
    const res = await fetch(GALLERY_JSON);
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    return;
  }

  photos = data;

  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  if (photos.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'gallery-empty';
    msg.textContent = 'No photos yet — check back soon.';
    grid.replaceWith(msg);
    return;
  }

  renderGrid(grid);
  setupLightbox();
  checkUrlParam();
}

function renderGrid(grid) {
  photos.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gallery-thumb-btn';
    btn.setAttribute('aria-label', `Open photo${photo.description ? ': ' + photo.description : ''}`);

    btn.addEventListener('click', () => {
      openerBtn = btn;
      openLightbox(index);
    });

    const img = document.createElement('img');
    img.src = `images/gallery/${photo.filename}`;
    img.alt = photo.description || '';
    img.loading = 'lazy';
    img.decoding = 'async';

    btn.appendChild(img);
    item.appendChild(btn);
    grid.appendChild(item);
  });
}

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  dialog.showModal();
  updateUrl();
}

function updateLightbox() {
  const photo = photos[currentIndex];

  lightboxImg.src = `images/gallery/${photo.filename}`;
  lightboxImg.alt = photo.description || '';

  lightboxDesc.textContent = photo.description || '';
  lightboxDesc.hidden = !photo.description;

  exifRows.forEach(row => {
    const field = row.dataset.field;
    const val = photo[field];
    const isEmpty = val === null || val === undefined || val === '';
    row.hidden = isEmpty;
    if (!isEmpty) row.querySelector('dd').textContent = val;
  });

  lightboxPrev.disabled = currentIndex === 0;
  lightboxNext.disabled = currentIndex === photos.length - 1;
}

function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set('photo', photos[currentIndex].filename);
  history.replaceState(null, '', url);
}

function navigate(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= photos.length) return;
  currentIndex = next;
  updateLightbox();
  updateUrl();
}

function setupLightbox() {
  lightboxClose.addEventListener('click', () => dialog.close());

  // Close on backdrop click (target is the <dialog> element itself)
  dialog.addEventListener('click', e => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname);
    openerBtn?.focus();
    openerBtn = null;
  });

  // Keyboard: arrow navigation (Escape is handled natively by <dialog>)
  document.addEventListener('keydown', e => {
    if (!dialog.open) return;
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  // Touch swipe
  let touchStartX = 0;
  dialog.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  dialog.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) >= 50) navigate(delta > 0 ? -1 : 1);
  }, { passive: true });

  lightboxPrev.addEventListener('click', () => navigate(-1));
  lightboxNext.addEventListener('click', () => navigate(1));
}

function checkUrlParam() {
  const param = new URL(location.href).searchParams.get('photo');
  if (!param) return;
  const index = photos.findIndex(p => p.filename === param);
  if (index !== -1) openLightbox(index);
}

init().catch(() => {});
