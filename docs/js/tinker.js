/* tinker.js — ผลงานนักเรียนใน Tinkercad Circuits (ห้อง ม.6/2) */
(() => {
  const grid = document.getElementById('tinkerGrid'); if (!grid) return;
  const T = (window.PA && window.PA.tinkercad) || {};
  const works = T.works || [];
  if (!works.length) { grid.innerHTML = '<div class="tk tk--empty"><b>กำลังรวบรวมผลงานนักเรียน</b></div>'; return; }

  const KIND = {
    count: { th: 'นับเลขด้วยลูป', hint: 'for / while · Serial.println', leds: 1 },
    blink: { th: 'ไฟ LED กระพริบ', hint: 'digitalWrite · delay', leds: 2 },
    tree:  { th: 'โปรแกรมต้นไม้', hint: 'ลูปซ้อน · การวาดรูปแบบ', leds: 3 },
    draft: { th: 'แบบร่าง / ทดลอง', hint: 'งานฝึกหัดระหว่างเรียน', leds: 0 }
  };

  // Arduino UNO ในธีมของเว็บ (SVG) พร้อม LED ตามชนิดโปรแกรม
  const board = (kind, i) => {
    const n = KIND[kind].leds;
    let leds = '';
    for (let k = 0; k < n; k++) {
      const x = 172 + k * 26;
      leds += `<g class="led led-${k}" style="--d:${((i % 3) * 0.3 + k * 0.45).toFixed(2)}s">
        <circle cx="${x}" cy="54" r="7" class="led__glow"/><circle cx="${x}" cy="54" r="4" class="led__dot"/>
        <rect x="${x - 2}" y="60" width="4" height="16" fill="#9aa"/></g>`;
    }
    return `<svg viewBox="0 0 320 180" class="ard" aria-hidden="true">
      <defs><linearGradient id="pcb${i}" x1="0" x2="1"><stop offset="0" stop-color="#1b1650"/><stop offset="1" stop-color="#2b2470"/></linearGradient></defs>
      <rect x="60" y="30" width="230" height="130" rx="10" fill="url(#pcb${i})" stroke="rgba(230,194,122,.55)"/>
      <rect x="70" y="36" width="110" height="12" rx="2" fill="#0b0916"/><rect x="190" y="36" width="92" height="12" rx="2" fill="#0b0916"/>
      <rect x="70" y="142" width="70" height="12" rx="2" fill="#0b0916"/><rect x="150" y="142" width="70" height="12" rx="2" fill="#0b0916"/>
      <rect x="150" y="90" width="110" height="34" rx="3" fill="#0e0b1e" stroke="#3a3270"/>
      <text x="205" y="112" text-anchor="middle" font-family="Bai Jamjuree, sans-serif" font-size="9" fill="#E6C27A" letter-spacing="1">ATMEGA328P</text>
      <circle cx="100" cy="95" r="16" fill="#0e0b1e" stroke="#3a3270"/>
      <text x="100" y="99" text-anchor="middle" font-family="Trirong, serif" font-size="11" fill="#E6C27A" font-weight="600">UNO</text>
      <rect x="30" y="60" width="40" height="34" rx="4" fill="#3b3554"/><rect x="18" y="70" width="14" height="14" rx="2" fill="#5b5580"/>
      <rect x="36" y="118" width="30" height="22" rx="4" fill="#2a2540"/>
      ${leds}
      <text x="270" y="152" text-anchor="end" font-family="Bai Jamjuree, sans-serif" font-size="8" fill="rgba(244,239,230,.45)">TINKERCAD CIRCUITS</text>
    </svg>`;
  };

  const byStu = {};
  works.forEach(w => (byStu[w.student] = byStu[w.student] || []).push(w));
  const order = ['count', 'blink', 'tree', 'draft'];
  const head = T.classroom ? `<div class="tk__intro"><div><b>ห้องเรียน ${T.classroom.name}</b><span>${T.classroom.tool} · นักเรียน ${T.classroom.students} คน · ผลงาน ${works.length} ชิ้น</span></div>
    <a class="btn btn--ghost btn--sm" href="${T.classroom.url}" target="_blank" rel="noopener" data-magnet>เปิดห้องเรียนใน Tinkercad</a></div>` : '';

  let i = 0;
  grid.innerHTML = head + Object.keys(byStu).sort().map(stu => {
    const list = byStu[stu].slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    const done = list.filter(w => w.kind !== 'draft').length;
    const cards = list.map(w => {
      const k = KIND[w.kind]; i++;
      const frame = w.embed
        ? `<iframe src="https://www.tinkercad.com/embed/${w.id.split('-')[0]}?editbtn=0" loading="lazy" allowfullscreen title="${w.title}"></iframe>`
        : board(w.kind, i);
      return `<article class="tk tk--${w.kind}"><div class="tk__frame">${frame}</div>
        <div class="tk__body"><b>${w.title}</b><span>${k.th} · ${k.hint}</span>
        <a href="${w.url}" target="_blank" rel="noopener">เปิดใน Tinkercad</a></div></article>`;
    }).join('');
    return `<section class="tk__group"><h3 class="tk__stu"><span>${stu}</span><small>${list.length} ชิ้น · ${done} โปรแกรมสมบูรณ์</small></h3><div class="tk__cards">${cards}</div></section>`;
  }).join('');
})();
