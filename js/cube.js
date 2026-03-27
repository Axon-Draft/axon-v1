/* ═══════════════════════════════════════════
   js/cube.js — 3D Identity Cube (Three.js)
   Drag + auto-rotate cube. Each face renders a
   named identity card via canvas texture.
   Reacts to theme changes via themeCallbacks.
   Depends on: three.js r128, theme.js
   ═══════════════════════════════════════════ */

(function () {
  const FACES = [
    { name: 'THE BINARY',      sub: 'SDE / BACKEND',      pct: '72%' },
    { name: 'THE SILICON',     sub: 'EMBEDDED / ECE',      pct: '85%' },
    { name: 'THE ANALYTICAL',  sub: 'DATA / FINTECH',      pct: '38%' },
    { name: 'THE CREATIVE',    sub: 'UI/UX / BRAND',       pct: '61%' },
    { name: 'THE OPERATIONAL', sub: 'PRODUCT / OPS',       pct: '54%' },
    { name: 'THE ARCHITECT',   sub: 'SYSTEMS / INFRA',     pct: '77%' },
  ];
  // BoxGeometry face order: +x,-x,+y,-y,+z,-z
  const faceOrder = [1, 3, 4, 5, 0, 2];

  const section   = document.getElementById('cube-section');
  const cnv       = document.getElementById('cube-canvas');
  const faceLabel = document.getElementById('cube-face-label');
  const subLabel  = document.getElementById('cube-sub-label');
  const pFill     = document.getElementById('cube-progress-fill');
  const pPct      = document.getElementById('cube-progress-pct');

  const renderer = new THREE.WebGLRenderer({ canvas: cnv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  function resize() {
    const w = section.offsetWidth, h = section.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Draws an identity card onto an offscreen canvas → THREE texture */
  function makeTexture(label, sub, pct, accent) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const cx = c.getContext('2d');

    cx.fillStyle = '#080808';
    cx.fillRect(0, 0, 512, 512);

    // outer border
    cx.strokeStyle = accent; cx.lineWidth = 3;
    cx.strokeRect(12, 12, 488, 488);
    cx.strokeStyle = 'rgba(255,255,255,0.05)'; cx.lineWidth = 1;
    cx.strokeRect(26, 26, 460, 460);

    // corner ticks
    [[12,12,52,12],[12,12,12,52],[500,12,460,12],[500,12,500,52],
     [12,500,52,500],[12,500,12,460],[500,500,460,500],[500,500,500,460]]
    .forEach(([x1,y1,x2,y2]) => {
      cx.beginPath(); cx.moveTo(x1,y1); cx.lineTo(x2,y2);
      cx.strokeStyle = accent; cx.lineWidth = 2; cx.stroke();
    });

    // pct badge
    cx.fillStyle = accent; cx.fillRect(370, 26, 112, 38);
    cx.fillStyle = '#000'; cx.font = 'bold 20px Space Mono,monospace';
    cx.textAlign = 'center'; cx.fillText(pct, 426, 51);

    // dot grid
    cx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let gx = 60; gx < 480; gx += 36)
      for (let gy = 80; gy < 480; gy += 36) {
        cx.beginPath(); cx.arc(gx, gy, 1.5, 0, Math.PI * 2); cx.fill();
      }

    // accent sidebar
    cx.fillStyle = accent; cx.fillRect(28, 170, 4, 180);

    // label text
    cx.fillStyle = '#fff'; cx.font = 'bold 48px Bebas Neue,sans-serif';
    cx.textAlign = 'left';
    label.split(' ').forEach((w, i) => cx.fillText(w, 46, 222 + i * 56));

    // sub
    cx.fillStyle = accent; cx.font = '13px Space Mono,monospace';
    cx.fillText(sub, 46, 390);

    // bottom rule
    cx.strokeStyle = 'rgba(255,255,255,0.07)'; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(28, 420); cx.lineTo(484, 420); cx.stroke();
    cx.fillStyle = 'rgba(255,255,255,0.18)'; cx.font = '11px Space Mono,monospace';
    cx.fillText('AXON DRAFT — IDENTITY ENGINE', 46, 452);

    return new THREE.CanvasTexture(c);
  }

  const geo = new THREE.BoxGeometry(2, 2, 2);
  let materials = [];
  let cube;

  function buildMaterials() {
    const a = window.getAccentHex();
    materials = faceOrder.map(fi =>
      new THREE.MeshBasicMaterial({
        map: makeTexture(FACES[fi].name, FACES[fi].sub, FACES[fi].pct, a),
        side: THREE.FrontSide
      })
    );
    if (cube) cube.material = materials;
  }

  buildMaterials();
  cube = new THREE.Mesh(geo, materials);
  scene.add(cube);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.07 });
  cube.add(new THREE.LineSegments(eGeo, eMat));

  // ambient particle cloud
  const pGeo = new THREE.BufferGeometry();
  const pBuf = new Float32Array(300 * 3);
  for (let i = 0; i < 300 * 3; i++) pBuf[i] = (Math.random() - 0.5) * 16;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.2 });
  const pts = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  // drag state
  let isDragging = false, prevX = 0, prevY = 0, velX = 0, velY = 0;
  let rotX = 0.3, rotY = 0.4;
  let autoSpin = true;

  cnv.addEventListener('mousedown', e => { isDragging = true; prevX = e.clientX; prevY = e.clientY; autoSpin = false; });
  cnv.addEventListener('touchstart', e => { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; autoSpin = false; }, { passive: true });
  window.addEventListener('mouseup',  () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    velX = (e.clientX - prevX) * 0.01; velY = (e.clientY - prevY) * 0.01;
    rotY += velX; rotX += velY;
    prevX = e.clientX; prevY = e.clientY;
    updateFaceLabel();
  });

  window.addEventListener('touchmove', e => {
    if (!isDragging) return;
    velX = (e.touches[0].clientX - prevX) * 0.01; velY = (e.touches[0].clientY - prevY) * 0.01;
    rotY += velX; rotX += velY;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    updateFaceLabel();
  }, { passive: true });

  function updateFaceLabel() {
    const y = ((rotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const fi = [0, 1, 2, 3][Math.round(y / (Math.PI / 2)) % 4];
    faceLabel.textContent = FACES[fi].name;
    subLabel.textContent  = FACES[fi].sub + ' · ' + FACES[fi].pct + ' READINESS';
  }

  // Re-render textures on theme change
  window.themeCallbacks.push(() => setTimeout(buildMaterials, 60));

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    if (!isDragging) {
      if (autoSpin) rotY += 0.004;
      velX *= 0.92; velY *= 0.92;
      rotY += velX; rotX += velY;
    }
    rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
    cube.rotation.y += (rotY - cube.rotation.y) * 0.1;
    cube.rotation.x += (rotX - cube.rotation.x) * 0.1;
    cube.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.06;
    pts.rotation.y += 0.0004;
    renderer.render(scene, camera);
  }
  animate();
})();