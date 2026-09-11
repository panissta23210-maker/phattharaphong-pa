/* scene.js — 3D atom hero (Three.js r128) */
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

  const GOLD = 0xE6C27A, AURA = 0xB44BFF, INDIGO = 0x7F8CFF;

  /* ---- nucleus: cluster of gold spheres ---- */
  const atom = new THREE.Group();
  scene.add(atom);
  const nucleus = new THREE.Group();
  const nMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.25, emissive: 0x3a2a08, emissiveIntensity: 0.6 });
  const nGeo = new THREE.SphereGeometry(0.34, 32, 32);
  const offsets = [[0, 0, 0], [0.42, 0.18, 0.1], [-0.36, 0.3, -0.2], [0.1, -0.42, 0.28], [-0.2, -0.2, -0.4], [0.3, -0.1, -0.38], [-0.4, -0.05, 0.3]];
  offsets.forEach(o => { const m = new THREE.Mesh(nGeo, nMat); m.position.set(...o); nucleus.add(m); });
  atom.add(nucleus);

  /* ---- glow sprite behind nucleus ---- */
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,236,190,0.95)'); grd.addColorStop(0.25, 'rgba(230,194,122,0.45)');
    grd.addColorStop(0.6, 'rgba(180,75,255,0.18)'); grd.addColorStop(1, 'rgba(180,75,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(4.2, 4.2, 1);
  atom.add(glow);

  /* ---- orbit rings + electrons ---- */
  const rings = [];
  const ringDefs = [
    { r: 2.6, tilt: [1.1, 0.0, 0.3], color: AURA, speed: 0.55, n: 2 },
    { r: 3.4, tilt: [0.5, 1.0, -0.6], color: GOLD, speed: -0.38, n: 3 },
    { r: 4.2, tilt: [-0.9, 0.4, 1.2], color: INDIGO, speed: 0.27, n: 3 }
  ];
  const eGeo = new THREE.SphereGeometry(0.11, 16, 16);
  ringDefs.forEach(d => {
    const g = new THREE.Group();
    g.rotation.set(...d.tilt);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.012, 8, 220),
      new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.55 }));
    g.add(ring);
    const electrons = [];
    for (let i = 0; i < d.n; i++) {
      const e = new THREE.Mesh(eGeo, new THREE.MeshBasicMaterial({ color: d.color }));
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: d.color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.set(0.9, 0.9, 1); e.add(s);
      g.add(e); electrons.push({ mesh: e, phase: (i / d.n) * Math.PI * 2 });
    }
    atom.add(g);
    rings.push({ g, d, electrons });
  });

  /* ---- particle field (BufferGeometry + Points) ---- */
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
        float tw = 0.65 + 0.35*sin(uTime*1.3 + position.z*2.0);
        vA = tw; gl_PointSize = aSize * uPR * 18.0 / -mv.z; }`,
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

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    atom.scale.setScalar(isMobile ? 0.55 : (w < 1100 ? 0.8 : 1));
    atom.position.x = isMobile ? 0 : (w < 1100 ? 2.6 : 3.9);
    atom.userData.baseY = isMobile ? 2.3 : 0.2;
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = clock.getElapsedTime();
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    const spin = reduce ? 0 : t;
    atom.rotation.y = spin * 0.12 + cur.x * 0.45;
    atom.rotation.x = cur.y * 0.3 + Math.sin(spin * 0.2) * 0.08;
    atom.position.y = (atom.userData.baseY || 0.2) + Math.sin(spin * 0.6) * 0.12 - Math.min(scrollY, 900) * 0.0012;
    nucleus.rotation.y = -spin * 0.5; nucleus.rotation.z = spin * 0.3;
    rings.forEach(({ g, d, electrons }) => {
      g.rotation.z += reduce ? 0 : 0.0006;
      electrons.forEach(e => {
        const a = spin * d.speed + e.phase;
        e.mesh.position.set(Math.cos(a) * d.r, Math.sin(a) * d.r, 0);
      });
    });
    pMat.uniforms.uTime.value = spin;
    camera.position.x += (cur.x * 0.8 - camera.position.x) * 0.04;
    camera.position.y += (0.4 - cur.y * 0.5 - camera.position.y) * 0.04;
    camera.lookAt(atom.position.x * 0.55, 0.2, 0);
    renderer.render(scene, camera);
  }
  frame();
})();
