/** Randomly selects a hero image from images/hero/manifest.json on each load.
 *
 * Manifest entries can be:
 *   "hero1.jpg"                              — used in any theme
 *   {"file": "hero2.jpg", "theme": "light"}  — light mode only
 *   {"file": "hero3.jpg", "theme": "dark"}   — dark mode only
 *
 * For each entry a sibling .webp file is tried first via <source type="image/webp">;
 * the browser falls back to the .jpg <img src> if no WebP exists.
 */

function activeTheme() {
  const manual = document.documentElement.dataset.theme;
  if (manual === 'light' || manual === 'dark') return manual;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function pickFrom(list) {
  const theme = activeTheme();
  const eligible = list.filter(entry =>
    typeof entry === 'string' || !entry.theme || entry.theme === theme
  );
  if (!eligible.length) return null;
  const entry = eligible[Math.floor(Math.random() * eligible.length)];
  return typeof entry === 'string' ? entry : entry.file;
}

const heroSource = document.querySelector('.hero-backdrop source');
const heroImg    = document.querySelector('.hero-bg-img');

if (heroImg) {
  fetch('images/hero/manifest.json')
    .then(r => r.json())
    .then(list => {
      const file = pickFrom(list);
      if (!file) return;
      // Only activate the WebP source if a .webp sibling is explicitly listed
      // in the manifest (e.g. {"file":"hero1.jpg","webp":true}). Otherwise
      // leave <source> empty so the browser uses <img src> directly.
      const entry = list.find(e => (typeof e === 'string' ? e : e.file) === file);
      const hasWebp = entry && typeof entry === 'object' && entry.webp;
      if (heroSource) {
        heroSource.srcset = hasWebp ? `images/hero/${file.replace(/\.[^.]+$/, '')}.webp` : '';
      }
      heroImg.src = `images/hero/${file}`;
    })
    .catch(() => {});
}
