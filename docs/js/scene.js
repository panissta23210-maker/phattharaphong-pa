/* scene.js — Bohr-model atom (Three.js r128). อยู่ด้านขวาใน hero แล้วค่อย ๆ กลายเป็นพื้นหลังหมุนช้า ๆ ทั้งหน้าเมื่อเลื่อนลง
   window.ATOM.set(Z) switches element. */
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas || !window.THREE) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width: 820px)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.4, 11);

  const GOLD = 0xE6C27A, AURA = 0xB44BFF, INDIGO = 0x7F8CFF, CHAMP = 0xFFF1C9;
  const SHELL_COLORS = [GOLD, AURA, INDIGO, CHAMP];

  /* ---- shared textures/geometries ---- */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,236,190,0.95)'); grd.addColorStop(0.25, 'rgba(230,194,122,0.45)');
    grd.addColorStop(0.6, 'rgba(180,75,255,0.18)'); grd.addColorStop(1, 'rgba(180,75,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const protonMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.25, emissive: 0x3a2a08, emissiveIntensity: 0.6 });
  const neutronMat = new THREE.MeshStandardMaterial({ color: 0x6E4BA8, metalness: 0.6, roughness: 0.35, emissive: 0x1a0f33, emissiveIntensity: 0.8 });
  const nucGeo = new THREE.SphereGeometry(1, 20, 20);
  const eGeo = new THREE.SphereGeometry(0.11, 16, 16);

  /* ---- atom root (swappable) ---- */
  const root = new THREE.Group(); scene.add(root);
  let atom = null;           // current atom group
  let rings = [];            // [{d:{r,speed}, electrons:[{mesh,phase}]}]
  let nucleus = null;

  // Fibonacci-sphere packing for nucleons
  function packPositions(n, R) {
    const pts = []; if (n === 1) return [[0, 0, 0]];
    const layers = Math.max(1, Math.round(Math.cbrt(n / 3)));
    let placed = 0;
    for (let L = 0; L < layers && placed < n; L++) {
      const rr = R * (L + 0.55) / layers;
      const count = L === layers - 1 ? n - placed : Math.max(1, Math.round(n * ((L + 1) ** 3 - L ** 3) / layers ** 3));
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count && placed < n; i++, placed++) {
        const y = 1 - (i / Math.max(1, count - 1)) * 2, rad = Math.sqrt(1 - y * y), th = golden * i;
        pts.push([Math.cos(th) * rad * rr, y * rr, Math.sin(th) * rad * rr]);
      }
    }
    return pts;
  }

  function buildAtom(el) {
    const g = new THREE.Group();
    // nucleus: protons (gold) + neutrons (violet), instanced
    const Z = el.z, N = Math.max(0, el.mass - el.z), A = Z + N;
    const R = 0.28 * Math.cbrt(A) * 0.92;
    const size = 0.26 * Math.pow(A, -0.12) * 1.35;
    const pts = packPositions(A, R);
    // shuffle to interleave protons/neutrons
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    const nuc = new THREE.Group();
    const mk = (count, mat, offset) => {
      if (!count) return;
      const im = new THREE.InstancedMesh(nucGeo, mat, count);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(size, size, size);
      for (let i = 0; i < count; i++) { const p = pts[offset + i]; m.compose(new THREE.Vector3(p[0], p[1], p[2]), q, s); im.setMatrixAt(i, m); }
      im.instanceMatrix.needsUpdate = true; nuc.add(im);
    };
    mk(Z, protonMat, 0); mk(N, neutronMat, Z);
    g.add(nuc);
    // glow
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    const gs = 3.2 + R * 2.2; glow.scale.set(gs, gs, 1); g.add(glow);
    // shells
    const rs = [];
    el.shells.forEach((count, i) => {
      const r = 1.75 + i * 0.9 + R * 0.6;
      const color = SHELL_COLORS[i % SHELL_COLORS.length];
      const sg = new THREE.Group();
      sg.rotation.set(0.9 - i * 0.55, 0.35 * i, 0.4 + i * 0.7);
      sg.add(new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 8, 220), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 })));
      const electrons = [];
      for (let k = 0; k < count; k++) {
        const e = new THREE.Mesh(eGeo, new THREE.MeshBasicMaterial({ color }));
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        s.scale.set(0.85, 0.85, 1); e.add(s);
        sg.add(e); electrons.push({ mesh: e, phase: (k / count) * Math.PI * 2 });
      }
      g.add(sg);
      rs.push({ g: sg, d: { r, speed: (i % 2 ? -1 : 1) * (0.62 - i * 0.11) }, electrons });
    });
    return { g, rs, nuc };
  }

  /* ---- swap with transition ---- */
  let swapping = null;
  function setElement(z) {
    const el = window.ELEMENTS && window.ELEMENTS.byZ[z]; if (!el) return;
    const next = buildAtom(el);
    next.g.scale.setScalar(0.001);
    root.add(next.g);
    const prev = atom;
    swapping = { prev, next: next.g, t: 0 };
    atom = next.g; rings = next.rs; nucleus = next.nuc;
    root.userData.z = z;
    applyScale();
    canvas.dispatchEvent(new CustomEvent('atomchange', { detail: el }));
  }
  function disposeGroup(g) {
    g.traverse(o => { if (o.geometry && o.geometry !== nucGeo && o.geometry !== eGeo) o.geometry.dispose(); if (o.material && o.material !== protonMat && o.material !== neutronMat) { if (o.material.map && o.material.map !== glowTex) o.material.map.dispose(); o.material.dispose(); } });
    root.remove(g);
  }

  /* ---- particle field ---- */
  const COUNT = isMobile ? 500 : 1200;
  const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3), sz = new Float32Array(COUNT);
  const cGold = new THREE.Color(GOLD), cAura = new THREE.Color(AURA), cInd = new THREE.Color(INDIGO);
  for (let i = 0; i < COUNT; i++) {
    const r = 6 + Math.random() * 16, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6; pos[i * 3 + 2] = r * Math.cos(ph) - 4;
    const c = Math.random() < 0.5 ? cGold : (Math.random() < 0.5 ? cAura : cInd);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    sz[i] = 0.5 + Math.random() * 1.5;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPR: { value: DPR } },
    vertexShader: `attribute float aSize; varying vec3 vC; varying float vA; uniform float uTime; uniform float uPR;
      void main(){ vC = color; vec3 p = position; p.y += sin(uTime*0.4 + position.x*0.5)*0.25;
        vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv;
        vA = 0.65 + 0.35*sin(uTime*1.3 + position.z*2.0); gl_PointSize = aSize * uPR * 18.0 / -mv.z; }`,
    fragmentShader: `varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); if(d>0.5) discard;
        float a = smoothstep(0.5,0.05,d) * vA; gl_FragColor = vec4(vC, a*0.85); }`
  });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ---- lights ---- */
  scene.add(new THREE.AmbientLight(0x6a4d99, 0.6));
  const key = new THREE.PointLight(0xffe7b0, 2.2, 30); key.position.set(4, 4, 6); scene.add(key);
  const rim = new THREE.PointLight(AURA, 1.6, 30); rim.position.set(-5, -3, 4); scene.add(rim);

  /* ---- interaction ---- */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const onMove = (x, y) => { target.x = (x / innerWidth - 0.5) * 2; target.y = (y / innerHeight - 0.5) * 2; };
  addEventListener('pointermove', e => onMove(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
  let scrollY = 0; addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
  const lerp = (a, b, k) => a + (b - a) * k;
  let bg = 0; // 0 = hero, 1 = พื้นหลังของเนื้อหา

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    root.userData.baseScale = isMobile ? 0.46 : (w < 1100 ? 0.8 : 1.02);
    applyScale();
    root.userData.heroX = isMobile ? 0 : (w < 1100 ? 3.6 : 5.5);
    root.userData.baseY = isMobile ? 2.9 : 2.3;
    root.position.x = root.userData.heroX;
  }
  function applyScale() {
    const el = window.ELEMENTS && window.ELEMENTS.byZ[root.userData.z];
    const n = el ? el.shells.length : 3;
    const k = n > 3 ? 3 / n : (n < 2 ? 1.15 : 1);
    root.userData.fit = k;
    root.scale.setScalar((root.userData.baseScale || 1) * k * lerp(1, isMobile ? 1.8 : 1.35, bg));
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let visible = !document.hidden;
  addEventListener('visibilitychange', () => { visible = !document.hidden; });

  const easeOut = x => 1 - Math.pow(1 - x, 3);
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, clock.getDelta() || 0.016);
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    const spin = reduce ? 0 : t;

    // hero → background : เลื่อนผ่าน hero แล้วอะตอมย้ายมากลางจอ ขยาย จางลง และหมุนช้า ๆ อยู่หลังเนื้อหา
    const p = Math.min(1, Math.max(0, (scrollY - innerHeight * 0.08) / (innerHeight * 0.75)));
    const pe = p * p * (3 - 2 * p);
    if (Math.abs(pe - bg) > 0.0005) {
      bg = pe;
      const o = 1 - bg * (isMobile ? 0.78 : 0.73);
      canvas.style.opacity = o.toFixed(3);
      applyScale();
    }

    // swap transition
    if (swapping) {
      swapping.t = Math.min(1, swapping.t + (reduce ? 1 : dt * 1.6));
      const k = easeOut(swapping.t);
      swapping.next.scale.setScalar(0.001 + k * 0.999);
      swapping.next.rotation.y = (1 - k) * 1.2;
      if (swapping.prev) { const s = 1 - k; swapping.prev.scale.setScalar(Math.max(0.001, s)); swapping.prev.rotation.y = -k * 1.2; }
      if (swapping.t >= 1) { if (swapping.prev) disposeGroup(swapping.prev); swapping = null; }
    }

    root.rotation.y = spin * lerp(0.12, 0.22, bg) + cur.x * lerp(0.45, 0.2, bg);
    root.rotation.x = cur.y * lerp(0.3, 0.12, bg) + Math.sin(spin * 0.2) * 0.08 + bg * 0.35;
    root.position.x = lerp(root.userData.heroX || 0, isMobile ? 0 : 1.8, bg);
    root.position.y = lerp(root.userData.baseY || 0.3, isMobile ? 0.4 : -0.2, bg) + Math.sin(spin * 0.6) * 0.12;
    if (nucleus) { nucleus.rotation.y = -spin * 0.5; nucleus.rotation.z = spin * 0.3; }
    rings.forEach(({ g, d, electrons }) => {
      g.rotation.z += reduce ? 0 : 0.0006;
      electrons.forEach(e => { const a = spin * d.speed + e.phase; e.mesh.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0); });
    });
    pMat.uniforms.uTime.value = spin;
    camera.position.x += (cur.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (0.4 - cur.y * 0.5 - camera.position.y) * 0.04;
    camera.lookAt(lerp((root.userData.heroX || 0) * 0.6, 0.9, bg), lerp(1.1, 0, bg), 0);
    renderer.render(scene, camera);
  }

  window.ATOM = { set: setElement, get: () => root.userData.z };
  setElement(11); // โซเดียม — ธาตุตั้งต้น (Na จากเรื่องกรด–เบส)
  frame();
})();
