/* ═══════════════════════════════════════════
   js/theme.js — Theme system
   Handles 4-theme switching, persistence,
   and accent colour helpers used by 3D modules
   ═══════════════════════════════════════════ */

const THEMES = { acid:'ACID GREEN', red:'CRIMSON RED', blue:'ELECTRIC BLUE', amber:'AMBER GOLD' };
const THEME_ORDER = ['acid','red','blue','amber'];

// Array that other modules push callbacks into
window.themeCallbacks = [];

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.sw-dot').forEach(d => d.classList.toggle('on', d.dataset.t === t));
  document.getElementById('sw-name').textContent = THEMES[t];
  localStorage.setItem('axon-theme', t);
  window.themeCallbacks.forEach(fn => fn(t));
}

// Expose globally so inline onclick handlers can call it
window.setTheme = setTheme;

// Helper used by cube.js + particle.js to read current accent colour
window.getAccentHex = function () {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c9f040';
};

// Init: pick a theme (avoid repeating last session's theme)
(function () {
  const saved = localStorage.getItem('axon-theme');
  let t;
  if (saved && THEMES[saved]) {
    const others = THEME_ORDER.filter(x => x !== saved);
    t = others[Math.floor(Math.random() * others.length)];
  } else {
    t = THEME_ORDER[Math.floor(Math.random() * THEME_ORDER.length)];
  }
  setTheme(t);
})();