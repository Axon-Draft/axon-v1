/* ═══════════════════════════════════════════
   js/particle.js — Particle AXON Reveal
   Scroll-driven Three.js shader animation.
   Phase 0→1: chaos → assemble "AXON" text
   Phase 1→2: AXON shimmer hold
   Phase 2→3: explode → identity node ring
   Depends on: three.js r128, theme.js
   ═══════════════════════════════════════════ */

(function () {
  const NODES = [
    { label: 'THE BINARY',      sub: 'SDE / BACKEND',   pct: '72%', angle: 0   },
    { label: 'THE SILICON',     sub: 'EMBEDDED / ECE',  pct: '85%', angle: 60  },
    { label: 'THE ANALYTICAL',  sub: 'DATA / FINTECH',  pct: '38%', angle: 120 },
    { label: 'THE CREATIVE',    sub: 'UI/UX / BRAND',   pct: '61%', angle: 180 },
    { label: 'THE OPERATIONAL', sub: 'PRODUCT / OPS',   pct: '54%', angle: 240 },
    { label: 'THE ARCHITECT',   sub: 'SYSTEMS / INFRA', pct: '77%', angle: 300 },
  ];

  const section = document.getElementById('particle-section');
  const sticky  = document.getElementById('particle-sticky');
  const cnv     = document.getElementById('particle-canvas');
  const fLabel  = document.getElementById('particle-face-label');
  const sLabel  = document.getElementById('particle-sub-label');
  const pFill   = document.getElementById('particle-progress-fill');
  const pPct    = document.getElementById('particle-progress-pct');

  const renderer = new THREE.WebGLRenderer({ canvas: cnv, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 0, 22);

  function resize() {
    const w = sticky.offsetWidth, h = sticky.offsetHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Sample text glyphs into a 2D point cloud */
  function sampleText(text, count) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 160;
    const cx = c.getContext('2d');
    cx.fillStyle = '#fff';
    cx.font = 'bold 130px Bebas Neue,Arial Black,sans-serif';
    cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.fillText(text, 256, 80);
    const img = cx.getImageData(0, 0, 512, 160);
    const pts = [];
    for (let y = 0; y < 160; y += 2)
      for (let x = 0; x < 512; x += 2)
        if (img.data[(y * 512 + x) * 4 + 3] > 128)
          pts.push([(x - 256) / 32, (80 - y) / 32]);
    const out = [];
    for (let i = 0; i < count; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)];
      out.push(p[0], p[1], 0);
    }
    return out;
  }

  const N = 3000;
  const axonPos  = new Float32Array(sampleText('AXON', N));
  const chaosPos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3) {
    const r = 12 + Math.random() * 8;
    const θ = Math.random() * Math.PI * 2;
    const φ = Math.acos(2 * Math.random() - 1);
    chaosPos[i]     = r * Math.sin(φ) * Math.cos(θ);
    chaosPos[i + 1] = r * Math.sin(φ) * Math.sin(θ);
    chaosPos[i + 2] = r * Math.cos(φ) * (Math.random() - 0.5) * 0.4;
  }
  const nodePos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const ni = i % NODES.length;
    const ang = NODES[ni].angle * Math.PI / 180;
    const r = 7 + Math.random() * 2.5;
    nodePos[i * 3]     = Math.cos(ang) * r + (Math.random() - 0.5) * 1.4;
    nodePos[i * 3 + 1] = Math.sin(ang) * r + (Math.random() - 0.5) * 1.4;
    nodePos[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = Math.random();

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position',   new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  geo.setAttribute('axon',       new THREE.BufferAttribute(axonPos, 3));
  geo.setAttribute('chaos',      new THREE.BufferAttribute(chaosPos, 3));
  geo.setAttribute('nodeTarget', new THREE.BufferAttribute(nodePos, 3));
  geo.setAttribute('seed',       new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPhase:  { value: 0 },
      uAccent: { value: new THREE.Color(window.getAccentHex()) },
      uTime:   { value: 0 },
      uSize:   { value: Math.min(devicePixelRatio, 2) * 2.4 },
    },
    vertexShader: `
      attribute vec3 axon; attribute vec3 chaos; attribute vec3 nodeTarget; attribute float seed;
      uniform float uPhase,uTime,uSize;
      float ease(float t){return t*t*(3.-2.*t);}
      void main(){
        vec3 pos;
        if(uPhase<1.){float t=ease(clamp(uPhase,0.,1.));pos=mix(chaos,axon,t);}
        else if(uPhase<2.){float s=sin(uTime*2.+seed*6.28)*.04;pos=axon+vec3(s,s*.5,s*.3);}
        else{float t=ease(clamp(uPhase-2.,0.,1.));float s=sin(uTime*2.+seed*6.28)*.04*(1.-t);pos=mix(axon+vec3(s),nodeTarget,t);}
        vec4 mv=modelViewMatrix*vec4(pos,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uSize*(1.+.3*sin(uTime*3.+seed*9.42))*(18./-mv.z);
      }`,
    fragmentShader: `
      uniform vec3 uAccent;
      void main(){
        vec2 uv=gl_PointCoord-.5;float d=length(uv);
        if(d>.5)discard;
        float a=1.-smoothstep(.2,.5,d);
        vec3 col=mix(vec3(1.),uAccent,smoothstep(0.,.45,d));
        gl_FragColor=vec4(col,a*.9);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // orbit rings per identity node
  const rings = new THREE.Group();
  scene.add(rings);
  NODES.forEach(n => {
    const ang = n.angle * Math.PI / 180, r = 7;
    const rg = new THREE.RingGeometry(0.55, 0.65, 40);
    const rm = new THREE.MeshBasicMaterial({
      color: new THREE.Color(window.getAccentHex()),
      transparent: true, opacity: 0, side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(rg, rm);
    ring.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0);
    rings.add(ring);
  });

  // HTML label overlays projected onto canvas coords
  const nodeLabels = document.createElement('div');
  nodeLabels.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .6s';
  sticky.appendChild(nodeLabels);

  NODES.forEach((n) => {
    const ang = n.angle * Math.PI / 180, r = 7;
    const el = document.createElement('div');
    el.className = 'node-lbl';
    el.innerHTML = `<div style="font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:2px;color:var(--accent)">${n.label}</div><div style="font-family:'Space Mono',monospace;font-size:7px;letter-spacing:2px;color:var(--t3)">${n.pct}</div>`;
    el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);text-align:center;white-space:nowrap';
    el.dataset.x3 = Math.cos(ang) * r;
    el.dataset.y3 = Math.sin(ang) * r;
    nodeLabels.appendChild(el);
  });

  function projectNodeLabels() {
    const w = sticky.offsetWidth, h = sticky.offsetHeight;
    nodeLabels.querySelectorAll('.node-lbl').forEach(el => {
      const v = new THREE.Vector3(parseFloat(el.dataset.x3), parseFloat(el.dataset.y3), 0);
      v.project(camera);
      el.style.left = ((v.x * 0.5 + 0.5) * w) + 'px';
      el.style.top  = ((-0.5 * v.y + 0.5) * h) + 'px';
    });
  }

  // Scroll-driven phase controller
  let scrollP = 0;
  function onScroll() {
    const rect = section.getBoundingClientRect();
    const raw = -rect.top / (section.offsetHeight - window.innerHeight);
    scrollP = Math.max(0, Math.min(1, raw));

    let phase;
    if (scrollP < 0.35)      phase = scrollP / 0.35;
    else if (scrollP < 0.6)  phase = 1 + (scrollP - 0.35) / 0.25;
    else                     phase = 2 + (scrollP - 0.6) / 0.4;

    mat.uniforms.uPhase.value = phase;

    const pct = Math.round(scrollP * 100);
    pFill.style.width = pct + '%';
    pPct.textContent  = pct + '%';

    const ringT = Math.max(0, (scrollP - 0.6) / 0.4);
    rings.children.forEach(r => r.material.opacity = ringT * 0.7);
    nodeLabels.style.opacity = ringT;

    if (scrollP < 0.05) {
      fLabel.textContent = 'YOUR IDENTITY';
      sLabel.textContent = 'SCROLL TO REVEAL';
    } else if (scrollP < 0.6) {
      fLabel.textContent = 'AXON';
      sLabel.textContent = 'ASSEMBLING YOUR PROFESSIONAL MAP';
    } else {
      const ni = Math.min(Math.floor((scrollP - 0.6) / 0.4 * NODES.length), NODES.length - 1);
      fLabel.textContent = NODES[ni].label;
      sLabel.textContent = NODES[ni].sub + ' · ' + NODES[ni].pct + ' READINESS';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Update accent colour on theme change
  window.themeCallbacks.push(() => {
    setTimeout(() => {
      const col = new THREE.Color(window.getAccentHex());
      mat.uniforms.uAccent.value = col;
      rings.children.forEach(r => r.material.color.set(col));
    }, 60);
  });

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    mat.uniforms.uTime.value = clock.getElapsedTime();
    points.rotation.z = Math.sin(clock.getElapsedTime() * 0.15) * 0.05;
    rings.rotation.z  = points.rotation.z;
    projectNodeLabels();
    renderer.render(scene, camera);
  }
  animate();
})();