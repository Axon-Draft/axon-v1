/* ═══════════════════════════════════════════
   js/hero.js — Hero Matrix Rain Canvas
   Renders the falling character rain behind
   the hero headline. Reacts to theme changes.
   ═══════════════════════════════════════════ */

(function () {
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = '01アイウエオAXONDRAFT◆▲■IDENTITY0123456789';
  let drops = Array(Math.floor(window.innerWidth / 22)).fill(1);

  window.addEventListener('resize', () => {
    drops = Array(Math.floor(window.innerWidth / 22)).fill(1);
  });

  setInterval(() => {
    const s = getComputedStyle(document.documentElement);
    ctx.fillStyle = s.getPropertyValue('--mx-bg').trim() || 'rgba(6,6,6,.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = s.getPropertyValue('--mx-col').trim() || 'rgba(201,240,64,.18)';
    ctx.font = '13px Space Mono,monospace';
    drops.forEach((y, i) => {
      ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 22, y * 13);
      if (y * 13 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }, 80);
})();