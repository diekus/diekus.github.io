async function init() {
  let photos;
  try {
    const res = await fetch('gallery.json');
    if (!res.ok) throw new Error();
    photos = await res.json();
  } catch {
    return;
  }

  if (!photos.length) return;

  const grid = document.querySelector('.gallery-teaser-grid');
  if (!grid) return;

  photos.slice(0, 5).forEach(photo => {
    const a = document.createElement('a');
    a.href = `gallery.html?photo=${encodeURIComponent(photo.filename)}`;
    a.className = 'gallery-teaser-thumb';
    a.setAttribute('aria-label', photo.description || photo.filename);

    const img = document.createElement('img');
    img.src = `images/gallery/${photo.filename}`;
    img.alt = photo.description || '';
    img.loading = 'lazy';
    img.decoding = 'async';

    a.appendChild(img);
    grid.appendChild(a);
  });
}

init().catch(() => {});
