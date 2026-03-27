/* ═══════════════════════════════════════════
   js/main.js — Shared utilities & funnel
   Scroll helpers, reveal observers, tab
   switchers, and the full 4-phase funnel
   state machine.
   ═══════════════════════════════════════════ */

/* ── Smooth scroll helper ── */
function s2(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}
window.s2 = s2;

/* ── Nav border on scroll ── */
window.addEventListener('scroll', () => {
  document.getElementById('nav').style.borderBottomColor =
    window.scrollY > 60 ? 'var(--ln)' : 'transparent';
});

/* ── Reveal on scroll ── */
const ro = new IntersectionObserver(e => {
  e.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('visible'); ro.unobserve(en.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

/* ── Identity matrix bar animation ── */
const mbObs = new IntersectionObserver(e => {
  e.forEach(en => {
    if (en.isIntersecting) {
      en.target.querySelectorAll('.mb-cell').forEach((c, i) =>
        setTimeout(() => c.querySelector('.mb-cell-bar').style.width = c.dataset.pct + '%', i * 120)
      );
      mbObs.unobserve(en.target);
    }
  });
}, { threshold: 0.3 });
const mbG = document.getElementById('mb-grid');
if (mbG) mbObs.observe(mbG);

/* ── Viz-break readiness bars ── */
const vbObs = new IntersectionObserver(e => {
  e.forEach(en => {
    if (en.isIntersecting) {
      en.target.querySelectorAll('.vb-fill').forEach((b, i) =>
        setTimeout(() => b.style.width = b.dataset.w + '%', i * 150)
      );
      vbObs.unobserve(en.target);
    }
  });
}, { threshold: 0.3 });
const vbEl = document.getElementById('vb-bars');
if (vbEl) vbObs.observe(vbEl);

/* ── Showcase tab switcher ── */
function switchTab(btn, id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(id).classList.add('active');
}
window.switchTab = switchTab;

/* ── Resume identity switcher ── */
function switchResume(btn, id) {
  document.querySelectorAll('.r-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  ['r1', 'r2', 'r3'].forEach(r => {
    const el = document.getElementById(r);
    if (el) el.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
}
window.switchResume = switchResume;

/* ══════════════════════════════════════════
   FUNNEL STATE MACHINE
   S = session state for the diagnostic flow
   ══════════════════════════════════════════ */
const S = {
  name: '', email: '', persona: '', domain: '',
  interests: [], bundle: null, price: 0, max: 3, ids: []
};

/* Show a funnel phase by number or 'fin' */
function showFP(n) {
  document.querySelectorAll('.funnel-phase').forEach(p => p.classList.remove('active'));
  document.getElementById(n === 'fin' ? 'fpfin' : 'fp' + n).classList.add('active');
  document.getElementById('funnel-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Phase 1 persona cards */
function selP(el) {
  document.querySelectorAll('.p-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  S.persona = el.dataset.v;
}

/* Interest pills — max 3 */
function selI(el) {
  if (el.classList.contains('sel')) {
    el.classList.remove('sel');
    S.interests = S.interests.filter(i => i !== el.textContent);
  } else {
    if (S.interests.length >= 3) return;
    el.classList.add('sel');
    S.interests.push(el.textContent);
  }
}

/* Back to phase 1 */
function g1() { showFP(1); }

/* Phase 1 → 2: validate and pass data forward */
function g2() {
  S.name   = document.getElementById('i-name').value.trim();
  S.email  = document.getElementById('i-email').value.trim();
  S.domain = document.getElementById('i-dom').value;
  const err = document.getElementById('e1');
  if (!S.name || !S.email || !S.persona || !S.domain) {
    err.classList.add('show'); return;
  }
  err.classList.remove('show');
  document.getElementById('t2n').textContent = S.name.toUpperCase();
  document.getElementById('p2info').innerHTML = `
    <div class="info-item"><div class="info-lbl">Subject</div><div class="info-val">${S.name.toUpperCase()}</div></div>
    <div class="info-item"><div class="info-lbl">Stage</div><div class="info-val">${S.persona.toUpperCase()}</div></div>
    <div class="info-item"><div class="info-lbl">Domain</div><div class="info-val">${S.domain.toUpperCase()}</div></div>
    <div class="info-item"><div class="info-lbl">Signals</div><div class="info-val">${S.interests.length ? S.interests.join(', ') : 'NONE'}</div></div>
  `;
  showFP(2);
}

/* Phase 2 → 3: reveal scorecard */
function g3() {
  document.getElementById('sc-sub').textContent = 'SUBJECT: ' + S.name.toUpperCase();
  showFP(3);
  setTimeout(() =>
    document.querySelectorAll('.sc-fill').forEach(b => b.style.width = b.dataset.w + '%'),
  250);
}

/* Bundle selection */
function selB(el, type, price, max) {
  document.querySelectorAll('.b-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  S.bundle = type;
  S.price  = price;
  S.max    = max || 3;
}

/* Phase 3 → 4: validate bundle selected */
function g4() {
  const err = document.getElementById('e3');
  if (!S.bundle || S.bundle === 'audit') {
    err.classList.add('show'); return;
  }
  err.classList.remove('show');
  S.ids = [];
  document.querySelectorAll('.id-card').forEach(c => c.classList.remove('sel', 'off'));
  document.getElementById('smx').textContent = S.max;
  document.getElementById('sct').textContent = '0';
  document.getElementById('fp4p').textContent = '₹' + S.price;
  document.getElementById('fp4b').textContent =
    (S.bundle === 'starter' ? 'Starter Bundle' : 'Elite Pivot Bundle') + ' — ₹29 applied';
  showFP(4);
}

/* Identity card selection (phase 4) */
function selId(el, num) {
  if (el.classList.contains('sel')) {
    el.classList.remove('sel');
    S.ids = S.ids.filter(i => i !== num);
  } else {
    if (S.ids.length >= S.max) return;
    el.classList.add('sel');
    S.ids.push(num);
  }
  document.getElementById('sct').textContent = S.ids.length;
  // dim cards that can't be selected anymore
  document.querySelectorAll('.id-card').forEach(c => {
    if (!c.classList.contains('sel'))
      c.classList.toggle('off', S.ids.length >= S.max);
  });
}

/* Final submit */
function gFin() {
  const err = document.getElementById('e4');
  if (S.ids.length < 1) {
    err.classList.add('show'); return;
  }
  err.classList.remove('show');
  document.getElementById('fn').textContent    = S.name.toUpperCase();
  document.getElementById('finb').textContent  = S.bundle.toUpperCase();
  document.getElementById('fini').textContent  = S.ids.join(', ');
  document.getElementById('fine').textContent  = S.email;
  showFP('fin');
}

/* Expose all funnel functions globally (called from inline HTML onclick) */
window.selP = selP; window.selI = selI;
window.g1 = g1; window.g2 = g2; window.g3 = g3;
window.selB = selB; window.g4 = g4; window.selId = selId; window.gFin = gFin;