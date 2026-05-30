const HTML = document.documentElement;
const STORAGE_KEY = 'diekus-theme';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function getEffectiveTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return systemDark.matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  HTML.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function toggle() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

// Apply stored preference immediately (before first paint of JS-enhanced state)
const stored = localStorage.getItem(STORAGE_KEY);
if (stored === 'light' || stored === 'dark') {
  HTML.setAttribute('data-theme', stored);
}

const btn = document.getElementById('theme-toggle');
if (btn) btn.addEventListener('click', toggle);

// Keep in sync when the user changes system preference without a stored override
systemDark.addEventListener('change', () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    HTML.removeAttribute('data-theme');
  }
});
