const HTML = document.documentElement;
const OVERRIDE_KEY = 'diekus-theme-override';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function systemTheme() {
  return systemDark.matches ? 'dark' : 'light';
}

function isFlipped() {
  return sessionStorage.getItem(OVERRIDE_KEY) === 'flipped';
}

function opposite(theme) {
  return theme === 'dark' ? 'light' : 'dark';
}

function render() {
  if (isFlipped()) {
    HTML.setAttribute('data-theme', opposite(systemTheme()));
  } else {
    HTML.removeAttribute('data-theme');
  }
}

function toggle() {
  if (isFlipped()) {
    sessionStorage.removeItem(OVERRIDE_KEY);
  } else {
    sessionStorage.setItem(OVERRIDE_KEY, 'flipped');
  }
  render();
}

// Apply session override immediately (before first paint of JS-enhanced state)
render();

const btn = document.getElementById('theme-toggle');
if (btn) btn.addEventListener('click', toggle);

// Re-derive the effective theme whenever the system preference changes
systemDark.addEventListener('change', render);
