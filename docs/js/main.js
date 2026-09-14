/* main.js — interactions for PA 2569 Atomic Portfolio */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const D = window.PA;

  /* ===================== Intro ===================== */
  const intro = $('#intro');
  const hero = $('#hero');
  [['.hero__pre', 1], ['.hero__title', 2], ['.hero__name', 3], ['.hero__cta', 4], ['.hero__stats', 5]].forEach(([s, n]) => { const el = $(s, hero); if (el) el.dataset.in = n; });
  const finishIntro = () => { intro.classList.add('done'); document.body.classList.add('ready'); setTimeout(countUp, 500); };
  if (reduce) finishIntro(); else setTimeout(finishIntro, 2400);

  function countUp() {
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e) + (p === 1 ? suf : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ===================== Cursor + electron trail ===================== */
  if (fine && !reduce) {
    const cur = $('#cursor'), label = $('.cursor__label', cur);
    const trail = $('#cursorTrail'), ctx = trail.getContext('2d');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    const pts = [];
    const fit = () => { trail.width = innerWidth * devicePixelRatio; trail.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    fit(); addEventListener('resize', fit);
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; pts.push({ x: mx, y: my, life: 1, r: 1.5 + Math.random() * 2, g: Math.random() < 0.35 }); if (pts.length > 60) pts.shift(); }, { passive: true });
    addEventListener('pointerdown', () => cur.classList.add('is-down'));
    addEventListener('pointerup', () => cur.classList.remove('is-down'));
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('a,button,.el,[data-lightbox],.chip,.tile,.cert');
      cur.classList.toggle('is-link', !!t);
      const v = e.target.closest('[data-lightbox],.tile,.el,.cert');
      cur.classList.toggle('is-view', !!v);
      label.textContent = v ? (v.classList.contains('el') ? 'เปิดดู' : 'ขยาย') : '';
    });
    (function loop() {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i]; p.life -= 0.028; p.y -= 0.15;
        if (p.life <= 0) { pts.splice(i, 1); continue; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.g ? `rgba(180,75,255,${p.life * 0.7})` : `rgba(230,194,122,${p.life * 0.8})`;
        ctx.shadowBlur = 10; ctx.shadowColor = p.g ? '#B44BFF' : '#E6C27A';
        ctx.fill();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ===================== Magnetic buttons ===================== */
  if (fine && !reduce) {
    $$('[data-magnet]').forEach(el => {
      const strength = 0.35;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength, y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1)'; el.style.transform = ''; setTimeout(() => el.style.transition = '', 600); });
    });
  }

  /* ===================== 3D tilt cards ===================== */
  if (fine && !reduce) {
    const tiltEls = () => $$('[data-tilt],.profile__poster,.cert,.el');
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('[data-tilt],.profile__poster,.cert,.el'); if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateY(-6px)`;
    });
    document.addEventListener('pointerout', e => {
      const el = e.target.closest('[data-tilt],.profile__poster,.cert,.el'); if (!el || el.contains(e.relatedTarget)) return;
      el.style.transform = '';
    });
    void tiltEls;
  }

  /* ===================== Nav ===================== */
  const nav = $('#nav'), links = $('.nav__links'), burger = $('#burger'), progress = $('#progress');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 300 && !links.classList.contains('open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${h ? y / h : 0})`;
  }, { passive: true });
  burger.addEventListener('click', () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  links.addEventListener('click', e => { if (e.target.tagName === 'A') { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
  const secs = $$('main section[id]');
  const secObs = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) $$('a', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  secs.forEach(s => secObs.observe(s));

  /* ===================== Reveal on scroll ===================== */
  $$('.chapter__head,.profile__grid,.challenge__grid,.awards__grid,.ethics__list,.strip,.policy__table,.closing__inner,.legend').forEach(el => el.classList.add('reveal'));
  const ro = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach(el => ro.observe(el));

  /* ===================== Periodic tables ===================== */
  const groupClass = { 'จัดการเรียนรู้': 'el--a', 'ส่งเสริมสนับสนุน': 'el--b', 'พัฒนาตนเอง': 'el--c' };
  const groupName = { 'จัดการเรียนรู้': 'ด้านที่ 1 · การจัดการเรียนรู้', 'ส่งเสริมสนับสนุน': 'ด้านที่ 2 · การส่งเสริมและสนับสนุนการจัดการเรียนรู้', 'พัฒนาตนเอง': 'ด้านที่ 3 · การพัฒนาตนเองและวิชาชีพ' };
  const pt = $('#ptable');
  D.pa.forEach((it, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'el ' + groupClass[it.group]; b.setAttribute('role', 'listitem');
    b.innerHTML = `<div><div class="el__num">${String(i + 1).padStart(2, '0')} · ${it.group}</div><div class="el__sym">${it.sym}</div></div><div><div class="el__name">${it.name}</div><div class="el__mass">${it.mass} ลักษณะงานในด้านนี้</div></div>`;
    b.addEventListener('click', () => openModal({
      sym: it.sym, title: it.name, sub: groupName[it.group],
      rows: [['งาน (Tasks)', it.task], ['ผลการดำเนินงาน', it.result], ['ตัวชี้วัด', it.kpi]], pics: it.pics
    }));
    pt.appendChild(b);
  });
  const it2 = $('#itable');
  D.ind.forEach(it => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'el ' + (it.d === 1 ? 'el--a' : 'el--b'); b.setAttribute('role', 'listitem');
    b.innerHTML = `<div><div class="el__num">ด้านที่ ${it.d} · ตัวชี้วัดที่ ${it.no}</div><div class="el__sym">${it.sym}</div></div><div><div class="el__name">${it.name}</div><div class="el__mass">${it.d === 1 ? 'ทักษะการจัดการเรียนรู้' : 'ผลลัพธ์การเรียนรู้ของผู้เรียน'}</div></div>`;
    b.addEventListener('click', () => openModal({
      sym: it.sym, title: `ตัวชี้วัดที่ ${it.no} · ${it.name}`, sub: it.d === 1 ? 'ด้านที่ 1 ทักษะการจัดการเรียนรู้และการจัดการชั้นเรียน' : 'ด้านที่ 2 ผลลัพธ์การเรียนรู้ของผู้เรียน',
      rows: [['คำอธิบาย', it.desc], ['ระดับที่คาดหวัง', 'ปรับประยุกต์ (Apply & Adapt) — ปรับประยุกต์การจัดการเรียนรู้ สื่อ และการวัดประเมินผลให้เหมาะกับบริบทและความแตกต่างของผู้เรียน จนเกิดผลต่อคุณภาพผู้เรียน'], ['การปฏิบัติของข้าพเจ้า', it.body]], pics: it.pics
    }));
    it2.appendChild(b);
  });

  /* ===================== Modal ===================== */
  const modal = $('#modal'), mSym = $('#modalSym'), mTitle = $('#modalTitle'), mBody = $('#modalBody'), mPics = $('#modalPics');
  let lastFocus = null;
  function openModal({ sym, title, sub, rows, pics }) {
    lastFocus = document.activeElement;
    mSym.textContent = sym; mTitle.innerHTML = `${title}<small style="display:block;font-family:var(--font-t);font-size:13px;color:var(--ivory-mute);margin-top:6px;font-weight:400">${sub}</small>`;
    mBody.innerHTML = rows.map(([k, v]) => `<div class="row"><b>${k}</b><span>${v}</span></div>`).join('');
    mPics.innerHTML = pics.map(p => `<a href="${p.src}" data-lightbox data-cap="${p.cap}" data-group="modal"><img src="${p.thumb}" alt="${p.cap}" loading="lazy" decoding="async"></a>`).join('');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    $('.modal__close', modal).focus();
    bindLightbox(mPics);
  }
  function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeModal));

  /* ===================== Gallery ===================== */
  const chips = $('#chips'), mas = $('#masonry');
  const all = document.createElement('button'); all.className = 'chip active'; all.type = 'button'; all.textContent = 'ทั้งหมด'; all.dataset.tag = '*'; chips.appendChild(all);
  D.gallery.forEach(g => {
    const c = document.createElement('button'); c.className = 'chip'; c.type = 'button'; c.textContent = g.tag; c.dataset.tag = g.tag; chips.appendChild(c);
    g.pics.forEach(p => {
      const a = document.createElement('a'); a.className = 'tile'; a.href = p.src; a.dataset.lightbox = ''; a.dataset.cap = `${g.tag} · ${p.cap}`; a.dataset.tag = g.tag; a.dataset.group = 'gallery';
      a.innerHTML = `<img src="${p.thumb}" alt="${p.cap}" loading="lazy" decoding="async"><figcaption>${p.cap}</figcaption>`;
      mas.appendChild(a);
    });
  });
  chips.addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    $$('.chip', chips).forEach(x => x.classList.toggle('active', x === c));
    const t = c.dataset.tag;
    $$('.tile', mas).forEach(tl => tl.classList.toggle('hid', t !== '*' && tl.dataset.tag !== t));
  });

  /* ===================== Ethics / certs / policy ===================== */
  $('#ethicsList').innerHTML = D.ethics.map(([h, t]) => `<li><div><b>${h}</b><span>${t}</span></div></li>`).join('');
  const strip = $('#strip');
  strip.innerHTML = D.certs.map(p => `<figure class="cert"><a href="${p.src}" data-lightbox data-cap="${p.cap}" data-group="cert"><img src="${p.src}" alt="${p.cap}" loading="lazy" decoding="async"></a><figcaption>${p.cap}</figcaption></figure>`).join('');
  // drag to scroll
  let dx = 0, sl = 0, dragging = false, moved = false;
  strip.addEventListener('pointerdown', e => { dragging = true; moved = false; dx = e.clientX; sl = strip.scrollLeft; strip.classList.add('drag'); });
  addEventListener('pointermove', e => { if (!dragging) return; const d = e.clientX - dx; if (Math.abs(d) > 4) moved = true; strip.scrollLeft = sl - d; });
  addEventListener('pointerup', () => { dragging = false; strip.classList.remove('drag'); });
  strip.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  $('#policyTable').innerHTML = `<div class="prow prow--h"><div>นโยบาย</div><div>สาระสำคัญ</div><div>การปฏิบัติงานที่สอดคล้อง</div></div>` +
    D.policy.map(([k, p, m]) => `<div class="prow"><div class="prow__k">${k}</div><div class="prow__p">${p}</div><div class="prow__m">${m}</div></div>`).join('');

  /* ===================== Lightbox ===================== */
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  let group = [], idx = 0;
  function bindLightbox(root = document) {
    $$('[data-lightbox]', root).forEach(a => {
      if (a.dataset.bound) return; a.dataset.bound = '1';
      a.addEventListener('click', e => {
        e.preventDefault();
        const g = a.dataset.group || 'page';
        group = $$('[data-lightbox]').filter(x => (x.dataset.group || 'page') === g && !x.classList.contains('hid'));
        idx = group.indexOf(a); show();
      });
    });
  }
  function show() {
    const a = group[idx]; if (!a) return;
    lbImg.style.opacity = 0;
    const im = new Image(); im.onload = () => { lbImg.src = a.href; lbImg.alt = a.dataset.cap || ''; lbCap.textContent = a.dataset.cap || ''; lbImg.style.transition = 'opacity .35s'; lbImg.style.opacity = 1; };
    im.src = a.href;
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  }
  const lbClose = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); if (!modal.classList.contains('open')) document.body.style.overflow = ''; };
  $$('[data-lbclose]').forEach(b => b.addEventListener('click', lbClose));
  $('[data-lbprev]').addEventListener('click', () => { idx = (idx - 1 + group.length) % group.length; show(); });
  $('[data-lbnext]').addEventListener('click', () => { idx = (idx + 1) % group.length; show(); });
  addEventListener('keydown', e => {
    if (lb.classList.contains('open')) { if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowRight') $('[data-lbnext]').click(); if (e.key === 'ArrowLeft') $('[data-lbprev]').click(); }
    else if (modal.classList.contains('open') && e.key === 'Escape') closeModal();
  });
  // touch swipe
  let tx = 0; lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) (d < 0 ? $('[data-lbnext]') : $('[data-lbprev]')).click(); });
  bindLightbox();

  /* ===================== Ambient music (Web Audio, generative) ===================== */
  const audioBtn = $('#audioBtn');
  let ac = null, master = null, timer = null, playing = false;
  const chords = [ // Dorian-ish, warm & calm (Hz)
    [130.81, 196.00, 233.08, 293.66, 349.23], // C  G  Bb D  F
    [116.54, 174.61, 220.00, 261.63, 349.23], // Bb F  A  C  F
    [146.83, 220.00, 261.63, 329.63, 392.00], // D  A  C  E  G
    [98.00, 146.83, 196.00, 246.94, 293.66]   // G  D  G  B  D
  ];
  function note(freq, t, dur, gain, type = 'sine') {
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = type; o.frequency.value = freq; o.detune.value = (Math.random() - 0.5) * 8;
    f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.6;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.1);
  }
  function sparkle(t) {
    const base = [523.25, 659.25, 783.99, 987.77, 1174.66];
    for (let i = 0; i < 3; i++) note(base[Math.floor(Math.random() * base.length)], t + Math.random() * 6, 3.5, 0.012, 'triangle');
  }
  let bar = 0;
  function schedule() {
    const t = ac.currentTime + 0.1, ch = chords[bar % chords.length];
    ch.forEach((f, i) => { note(f, t, 9, i === 0 ? 0.05 : 0.028, i === 0 ? 'triangle' : 'sine'); note(f * 2.002, t + 0.3, 8, 0.008); });
    sparkle(t);
    bar++;
    timer = setTimeout(schedule, 7800);
  }
  function makeReverb() {
    const len = ac.sampleRate * 3.2, buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
    const cv = ac.createConvolver(); cv.buffer = buf; return cv;
  }
  async function startAudio() {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0;
      const rv = makeReverb(), wet = ac.createGain(), dry = ac.createGain(); wet.gain.value = 0.55; dry.gain.value = 0.7;
      master.connect(dry).connect(ac.destination); master.connect(rv).connect(wet).connect(ac.destination);
    }
    if (ac.state === 'suspended') await ac.resume();
    master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0.9, ac.currentTime, 1.2);
    schedule(); playing = true;
    audioBtn.setAttribute('aria-pressed', 'true'); audioBtn.setAttribute('aria-label', 'ปิดเพลงบรรยากาศ'); $('.btn-audio__text', audioBtn).textContent = 'กำลังเล่น';
  }
  function stopAudio() {
    if (!ac) return;
    master.gain.setTargetAtTime(0, ac.currentTime, 0.8); clearTimeout(timer); playing = false;
    audioBtn.setAttribute('aria-pressed', 'false'); audioBtn.setAttribute('aria-label', 'เปิดเพลงบรรยากาศ'); $('.btn-audio__text', audioBtn).textContent = 'เปิดเพลง';
  }
  audioBtn.addEventListener('click', () => playing ? stopAudio() : startAudio());
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { master.gain.setTargetAtTime(0, ac.currentTime, 0.5); } else if (!document.hidden && playing) { master.gain.setTargetAtTime(0.9, ac.currentTime, 1); } });

  /* ===================== GSAP scroll polish ===================== */
  if (window.gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to('.hero__inner', { yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.utils.toArray('.el').forEach((el, i) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'expo.out', delay: (i % 6) * 0.06, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    gsap.utils.toArray('.tile,.cert,.award,.prow').forEach((el, i) => {
      gsap.from(el, { y: 26, opacity: 0, duration: 0.8, ease: 'expo.out', delay: (i % 4) * 0.05, scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
    });
  }
})();

/* ===================== Element picker → 3D atom ===================== */
(() => {
  const E = window.ELEMENTS; if (!E) return;
  const table = document.getElementById('miniTable'), card = document.getElementById('elCard');
  if (!table) return;
  const cells = {};
  // 4 periods × 18 groups; fill gaps for layout
  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= 18; col++) {
      const el = E.list.find(e => e.row === row && e.col === col);
      if (!el) { const g = document.createElement('span'); g.className = 'pel gap'; table.appendChild(g); continue; }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pel'; b.dataset.z = el.z; b.textContent = el.sym;
      b.style.setProperty('--pc', el.color);
      b.setAttribute('aria-label', `${el.th} (${el.sym}) เลขอะตอม ${el.z}`);
      b.title = `${el.th} · ${el.en}`;
      b.addEventListener('click', () => window.ATOM && window.ATOM.set(el.z));
      cells[el.z] = b; table.appendChild(b);
    }
  }
  const $id = id => document.getElementById(id);
  function render(el) {
    Object.values(cells).forEach(c => c.classList.toggle('active', +c.dataset.z === el.z));
    card.style.setProperty('--el-c', el.color);
    $id('elZ').textContent = el.z; $id('elSym').textContent = el.sym;
    $id('elTh').textContent = el.th; $id('elEn').textContent = el.en;
    $id('elMass').textContent = el.mass; $id('elPN').textContent = `${el.z} / ${el.mass - el.z}`;
    $id('elShells').textContent = el.shells.join(', '); $id('elCat').textContent = el.catTh;
    $id('elQuote').textContent = el.quote || '';
    card.classList.remove('show'); void card.offsetWidth; card.classList.add('show');
    const cell = cells[el.z]; if (cell) { const r = cell.getBoundingClientRect(), p = card.parentElement.getBoundingClientRect(); card.style.setProperty('--ax', Math.max(24, Math.min(p.width - 24, p.right - (r.left + r.width / 2))) + 'px'); }
  }
  document.getElementById('scene').addEventListener('atomchange', e => render(e.detail));
  // keyboard: arrows move between elements
  table.addEventListener('keydown', e => {
    const cur = +((document.activeElement || {}).dataset || {}).z; if (!cur) return;
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
    const nz = Math.min(36, Math.max(1, cur + d)); cells[nz].focus(); window.ATOM.set(nz); e.preventDefault();
  });
  const cur = window.ATOM && window.ATOM.get(); if (cur) render(E.byZ[cur]);
  const picker = document.getElementById('picker'); if (picker) picker.dataset.in = 6;
})();
