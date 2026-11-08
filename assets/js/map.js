/* =====================================================================
   KOREA 2027 — illustrated route map (SVG, no map API needed)
   Coastline: Natural Earth 1:50m via world-atlas (cached offline by the SW)
   ===================================================================== */
window.K27Map = (() => {
  'use strict';
  const { T, $, $$, esc, icon, links, mapButtons, toast, reduce, photo, credit, dateLabel, emit, on } = K27;
  const NS = 'http://www.w3.org/2000/svg';
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const LON0 = 118, LAT_TOP = 42, K = 1000 / rad(14); // 14° of longitude ≈ 1000 units
  const merc = lat => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));
  const TOP = merc(LAT_TOP);
  const proj = (lon, lat) => [rad(lon - LON0) * K, (TOP - merc(lat)) * K];
  const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const path = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');

  /* ---------- markers from the itinerary ---------- */
  const TYPE = { stay: 'bed', flight: 'plane', transport: 'train', place: null };
  function buildMarkers() {
    const m = new Map();
    const add = (key, place, type, extra = {}) => {
      if (!place) return;
      if (!m.has(key)) m.set(key, { key, place, type, visits: [], ...extra });
      return m.get(key);
    };
    add('lavalse', T.P.lavalse, 'stay', { stay: 'lavalse' });
    add('hongdae', { ...T.P.hongik, en: 'Hongdae Airbnb (area)', ko: '홍대입구역 부근' }, 'stay', { stay: 'hongdae' });
    add('PUS', T.P.PUS, 'flight'); add('ICN', T.P.ICN, 'flight');
    add('busanStn', T.P.busanStn, 'transport'); add('seoulStn', T.P.seoulStn, 'transport');
    const keyOf = p => Object.keys(T.P).find(k => T.P[k] === p);
    T.days.forEach(d => d.items.forEach(it => {
      if (!it.place || it.place === T.P.SIN) return;
      let key = keyOf(it.place) || it.place.en;
      if (key === 'hongik') key = 'hongdae';
      const mk = m.get(key) || add(key, it.place, 'place');
      mk.visits.push({ day: d, it });
    }));
    // KTX departure belongs to Busan Station
    return [...m.values()];
  }

  /* ---------- state ---------- */
  let svg, gWorld, gMarkers, vb = { x: 0, y: 0, w: 1000, h: 700 }, markers = [], selected = null, mapEl;
  const presets = {
    korea: { lon: [125.6, 130.0], lat: [34.4, 38.3] },
    busan: { lon: [128.88, 129.27], lat: [35.06, 35.22] },
    seoul: { lon: [126.38, 127.12], lat: [37.42, 37.62] },
    seoulCentral: { lon: [126.9, 127.07], lat: [37.5, 37.6] }
  };
  function boundsToVB(b, pad = .08) {
    const [x1, y1] = proj(b.lon[0], b.lat[1]), [x2, y2] = proj(b.lon[1], b.lat[0]);
    let w = x2 - x1, h = y2 - y1;
    const ar = mapEl.clientWidth / Math.max(1, mapEl.clientHeight);
    if (w / h > ar) { const nh = w / ar; return { x: x1 - w * pad, y: y1 - (nh - h) / 2 - nh * pad, w: w * (1 + 2 * pad), h: nh * (1 + 2 * pad) }; }
    const nw = h * ar; return { x: x1 - (nw - w) / 2 - nw * pad, y: y1 - h * pad, w: nw * (1 + 2 * pad), h: h * (1 + 2 * pad) };
  }
  function apply() {
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    const s = vb.w / Math.max(1, mapEl.clientWidth); // world units per screen px
    markers.forEach(mk => mk.g.setAttribute('transform', `translate(${mk.x} ${mk.y}) scale(${s})`));
    $$('.city-label', svg).forEach(t => { t.setAttribute('font-size', 15 * s); t.setAttribute('stroke-width', 4 * s); });
    svg.classList.toggle('z-far', s > .045);   // whole-country view: hide small place dots and all labels
    // when zoomed into a city, show labels for hubs always and places once close enough
    markers.forEach(mk => { if (mk.label) mk.label.style.display = (mk.type !== 'place' || s < .012) ? '' : 'none'; });
    const tr = $('#trainDot'); if (tr) tr.setAttribute('r', 6 * s);
  }
  let anim = 0;
  function flyTo(target, ms = 650) {
    cancelAnimationFrame(anim);
    if (reduce) { vb = target; apply(); return; }
    const from = { ...vb }, t0 = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
    const step = now => { const k = Math.min(1, (now - t0) / ms), e = ease(k);
      vb = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e };
      apply(); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function setPreset(name) {
    $$('#mapPresets button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === name ? 'true' : 'false'));
    flyTo(boundsToVB(presets[name]));
  }
  function zoomAt(f, cx = .5, cy = .5) {
    const nw = Math.min(2600, Math.max(6, vb.w * f)), nh = nw * vb.h / vb.w;
    vb = { x: vb.x + (vb.w - nw) * cx, y: vb.y + (vb.h - nh) * cy, w: nw, h: nh }; apply();
    $$('#mapPresets button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  }

  /* ---------- drawing ---------- */
  function draw() {
    mapEl = $('#map');
    svg = el('svg', { role: 'img', 'aria-label': 'Illustrated map of South Korea with our route' });
    mapEl.appendChild(svg);
    gWorld = el('g', {}, svg);
    // graticule
    const g = el('g', { class: 'grat' }, gWorld);
    for (let lon = 120; lon <= 134; lon += 2) { const [x] = proj(lon, 0); el('line', { x1: x, x2: x, y1: -200, y2: 1200 }, g); }
    for (let lat = 30; lat <= 42; lat += 2) { const [, y] = proj(0, lat); el('line', { x1: -200, x2: 1300, y1: y, y2: y }, g); }
    el('path', { class: 'land', id: 'mapLand', d: '' }, gWorld);
    // Han River (illustrative course through Seoul)
    const han = [[126.68, 37.66], [126.76, 37.62], [126.82, 37.585], [126.86, 37.567], [126.89, 37.551], [126.915, 37.54], [126.935, 37.527], [126.96, 37.517], [126.99, 37.512], [127.02, 37.519], [127.05, 37.527], [127.08, 37.522], [127.11, 37.535], [127.14, 37.55], [127.18, 37.57], [127.25, 37.56]];
    el('path', { class: 'river', d: path(han.map(p => proj(p[0], p[1]))) }, gWorld);
    // routes
    const routes = el('g', {}, gWorld);
    const gc = (a, b, n = 80) => { const A = [rad(a[0]), rad(a[1])], B = [rad(b[0]), rad(b[1])];
      const v = ([l, p]) => [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
      const va = v(A), vb2 = v(B), d = Math.acos(va[0] * vb2[0] + va[1] * vb2[1] + va[2] * vb2[2]);
      return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
        const x = va[0] * s1 + vb2[0] * s2, y = va[1] * s1 + vb2[1] * s2, z = va[2] * s1 + vb2[2] * s2;
        return proj(deg(Math.atan2(y, x)), deg(Math.atan2(z, Math.hypot(x, y)))); }); };
    const sin = [T.P.SIN.lon, T.P.SIN.lat];
    el('path', { class: 'route flight', d: path(gc(sin, [T.P.PUS.lon, T.P.PUS.lat])) }, routes);
    el('path', { class: 'route flight', d: path(gc([T.P.ICN.lon, T.P.ICN.lat], sin)) }, routes);
    const arex = [[126.9707, 37.5547], [126.9518, 37.5435], [126.9245, 37.5572], [126.8, 37.562], [126.66, 37.53], [126.55, 37.49], [126.451, 37.449]];
    el('path', { class: 'route arex draw', d: path(arex.map(p => proj(p[0], p[1]))) }, routes);
    const ktx = el('path', { class: 'route ktx draw', id: 'ktxPath', d: path(T.ktx.via.map(p => proj(p[1], p[0]))) }, routes);
    $$('.route.draw', svg).forEach(p => { const L = p.getTotalLength(); p.style.setProperty('--len', L); });
    if (!reduce) {
      const dot = el('circle', { class: 'train-dot', id: 'trainDot', r: 6 }, routes);
      const am = el('animateMotion', { dur: '9s', repeatCount: 'indefinite', rotate: 'auto', begin: '2.2s' }, dot);
      el('mpath', { href: '#ktxPath' }, am);
    }
    // city labels
    [['Seoul', 126.98, 37.66], ['Busan', 129.07, 35.29], ['Daejeon', 127.38, 36.42], ['Daegu', 128.6, 35.97]].forEach(([n, lon, lat]) => {
      const [x, y] = proj(lon, lat); const t = el('text', { class: 'city-label', x, y, 'text-anchor': 'middle' }, gWorld); t.textContent = n;
      if (n === 'Daejeon' || n === 'Daegu') t.style.opacity = .55;
    });
    // flight labels at the map edge
    // markers
    gMarkers = el('g', {}, svg);
    markers = buildMarkers().sort((a, b) => (a.type === 'place') - (b.type === 'place')).reverse(); // places underneath, stays on top
    markers.forEach(mk => {
      [mk.x, mk.y] = proj(mk.place.lon, mk.place.lat);
      const g = el('g', { class: `mk type-${mk.type}`, tabindex: 0, role: 'button', 'aria-label': `${mk.place.en}${mk.visits.length ? `, ${mk.visits.length} ${mk.visits.length === 1 ? 'visit' : 'visits'}` : ''}` }, gMarkers);
      const big = mk.type !== 'place';
      el('circle', { class: 'halo', r: big ? 20 : 15 }, g);
      el('circle', { class: 'dot', r: big ? 11 : 6 }, g);
      if (TYPE[mk.type]) { const ic = el('g', { class: 'glyph', transform: 'translate(-6 -6) scale(.5)' }, g); ic.innerHTML = K27.icon(TYPE[mk.type]).replace(/^<svg[^>]*>|<\/svg>$/g, ''); }
      const label = el('text', { x: big ? 16 : 10, y: 4 }, g); label.textContent = mk.place.en.replace(' (area)', '');
      mk.label = label; mk.g = g;
      g.addEventListener('click', e => { e.stopPropagation(); select(mk); });
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(mk); } });
    });
    loadLand();
  }

  function loadLand() {
    const status = $('#mapStatus');
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json').then(r => r.ok ? r.json() : Promise.reject(r.status)).then(topo => {
      const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
      const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
      const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
      const rings = [];
      (topo.objects.land.geometries || [topo.objects.land]).forEach(gm => {
        const polys = gm.type === 'Polygon' ? [gm.arcs] : gm.type === 'MultiPolygon' ? gm.arcs : [];
        polys.forEach(poly => poly.forEach(r => rings.push(r.flatMap(arc))));
      });
      const box = { lo: 112, hi: 140, la: 28, ha: 46 }, d = [];
      for (const ring of rings) {
        if (!ring.some(([lo, la]) => lo > box.lo && lo < box.hi && la > box.la && la < box.ha)) continue;
        const pts = []; let last = null;
        for (let [lo, la] of ring) {
          lo = Math.max(box.lo - 2, Math.min(box.hi + 2, lo)); la = Math.max(box.la - 2, Math.min(box.ha + 2, la));
          const p = proj(lo, la);
          if (!last || Math.abs(last[0] - p[0]) + Math.abs(last[1] - p[1]) > .35) { pts.push(p); last = p; }
        }
        if (pts.length > 2) d.push(path(pts) + 'Z');
      }
      $('#mapLand').setAttribute('d', d.join(''));
      status.remove();
    }).catch(() => { status.textContent = 'Coastline unavailable offline. Markers and routes still work.'; status.style.alignItems = 'end'; status.style.paddingBottom = '48px'; });
  }

  /* ---------- interaction ---------- */
  function interact() {
    const pts = new Map(); let start = null, hintT = 0;
    const local = e => { const r = mapEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    mapEl.addEventListener('pointerdown', e => {
      if (e.target.closest('.mk,.map-ctrl,.legend')) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (e.pointerType === 'mouse' || pts.size === 2) { mapEl.setPointerCapture(e.pointerId); start = { vb: { ...vb }, pts: new Map([...pts].map(([k, v]) => [k, { ...v }])) }; }
    });
    mapEl.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (e.pointerType === 'touch' && pts.size === 1) { // one finger scrolls the page; show a hint
        if (!hintT) { const h = $('#mapHint'); h.style.opacity = 1; hintT = setTimeout(() => { h.style.opacity = 0; hintT = 0; }, 1400); }
        return;
      }
      if (!start) return;
      const r = mapEl.getBoundingClientRect(), u = start.vb.w / r.width;
      const cur = [...pts.values()], st = [...start.pts.values()];
      if (cur.length >= 2 && st.length >= 2) {
        const d0 = Math.hypot(st[0].x - st[1].x, st[0].y - st[1].y), d1 = Math.hypot(cur[0].x - cur[1].x, cur[0].y - cur[1].y);
        const f = d0 / Math.max(1, d1), m0 = { x: (st[0].x + st[1].x) / 2, y: (st[0].y + st[1].y) / 2 }, m1 = { x: (cur[0].x + cur[1].x) / 2, y: (cur[0].y + cur[1].y) / 2 };
        const nw = Math.min(2600, Math.max(6, start.vb.w * f)), nh = nw * start.vb.h / start.vb.w;
        const ax = (m0.x - r.left) / r.width, ay = (m0.y - r.top) / r.height;
        vb = { x: start.vb.x + start.vb.w * ax - nw * ax - (m1.x - m0.x) * nw / r.width, y: start.vb.y + start.vb.h * ay - nh * ay - (m1.y - m0.y) * nh / r.height, w: nw, h: nh };
      } else if (e.pointerType === 'mouse') {
        const p0 = st[0]; vb = { ...start.vb, x: start.vb.x - (e.clientX - p0.x) * u, y: start.vb.y - (e.clientY - p0.y) * u };
        mapEl.classList.add('drag');
      }
      apply(); $$('#mapPresets button').forEach(b => b.setAttribute('aria-pressed', 'false'));
    });
    const end = e => { pts.delete(e.pointerId); if (pts.size < 2 && e.pointerType === 'touch') start = null; if (e.pointerType === 'mouse') { start = null; mapEl.classList.remove('drag'); } };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => mapEl.addEventListener(t, end));
    mapEl.addEventListener('wheel', e => {
      if (!(e.ctrlKey || e.metaKey || document.activeElement === mapEl)) { const h = $('#mapHint'); h.textContent = navigator.platform.includes('Mac') ? 'Use ⌘ + scroll to zoom the map' : 'Use Ctrl + scroll to zoom the map'; h.style.opacity = 1; clearTimeout(hintT); hintT = setTimeout(() => { h.style.opacity = 0; hintT = 0; }, 1400); return; }
      e.preventDefault(); const [cx, cy] = local(e); zoomAt(Math.exp(e.deltaY * .0022), cx, cy);
    }, { passive: false });
    mapEl.addEventListener('dblclick', e => { const [cx, cy] = local(e); zoomAt(.5, cx, cy); });
    mapEl.addEventListener('keydown', e => {
      if (e.target !== mapEl) return;
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (k) { e.preventDefault(); vb.x += k[0] * vb.w * .12; vb.y += k[1] * vb.h * .12; apply(); }
      if (e.key === '+' || e.key === '=') zoomAt(.7); if (e.key === '-') zoomAt(1.4);
    });
    svg.addEventListener('click', () => select(null));
    addEventListener('resize', () => { if (vb.w) { const ar = mapEl.clientWidth / mapEl.clientHeight; vb.h = vb.w / ar; apply(); } });
  }

  /* ---------- panel ---------- */
  function select(mk) {
    selected = mk;
    markers.forEach(m => m.g.classList.toggle('sel', m === mk));
    const body = $('#panelBody'), empty = $('#panelEmpty'), panel = $('#mapPanel');
    if (!mk) { body.hidden = true; empty.hidden = false; panel.classList.remove('open'); return; }
    const p = mk.place, typeTxt = { stay: 'Where we stay', flight: 'Airport', transport: 'Station', place: 'Place to visit' }[mk.type];
    const stay = mk.stay ? T.stays.find(s => s.id === mk.stay) : null;
    let extra = '';
    if (stay && !stay.public) extra = `<div class="private-note" style="margin-top:12px">${icon('lock', 'sm')}<span>The exact address is private. If you've saved it in your Wallet it appears under Stays on this device.</span></div>`;
    if (stay && stay.public) extra = `<p class="desc">${esc(stay.place.addr)}<br><span lang="ko">${esc(stay.place.koAddr)}</span></p>`;
    body.innerHTML = `<button class="btn ghost icon-only sm panel-close" type="button" aria-label="Close details">${icon('x', 'sm')}</button>
      <div class="ph">${icon(TYPE[mk.type] || 'pin', 'sm')}${typeTxt}</div>
      <h3>${esc(p.en)}</h3>${p.ko ? `<p class="ko" lang="ko">${esc(p.ko)}</p>` : ''}
      ${extra}
      <div class="acts">${mapButtons(p)}<a class="btn sm" href="${links.dir(p.q || p.en)}" target="_blank" rel="noopener">${icon('nav', 'sm')}Directions</a>${p.ko ? `<button class="btn sm" type="button" data-copy="${esc(p.ko)}">${icon('copy', 'sm')}Copy Korean name</button>` : ''}</div>
      ${mk.visits.length ? `<ul class="visits">${mk.visits.map(v => `<li><a href="#itinerary" data-goto="${v.it.id}">${esc(v.it.title)}</a><small>Day ${v.day.n}, ${dateLabel(v.day.date)} · ${esc(v.it.time)} · ${v.it.status}</small></li>`).join('')}</ul>` : ''}
      ${mk.type === 'transport' && mk.key === 'busanStn' ? `<p class="desc">KTX to Seoul on Mon 18 Jan. <a href="#ktxPanel">See the KTX journey</a></p>` : ''}`;
    empty.hidden = true; body.hidden = false; panel.classList.add('open');
    body.querySelector('.panel-close').onclick = () => select(null);
    body.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => K27.copy(b.dataset.copy, 'Korean name copied'));
    body.querySelectorAll('[data-goto]').forEach(a => a.onclick = e => { e.preventDefault(); select(null); emit('goto', a.dataset.goto); });
  }
  function focusPlace(key) {
    const mk = markers.find(m => m.key === key || m.place.en === key); if (!mk) return;
    const pad = mk.type === 'place' ? .02 : .05;
    flyTo(boundsToVB({ lon: [mk.place.lon - pad * 3, mk.place.lon + pad * 3], lat: [mk.place.lat - pad * 2, mk.place.lat + pad * 2] }, 0));
    select(mk);
  }

  /* ---------- legs + KTX panel ---------- */
  function renderLegs() {
    const legs = [
      { k: 'out', ic: 'plane', t: 'Singapore → Busan', s: 'Sat 16 Jan · 7C2642 · 6h 40m', go: () => { setPreset('busan'); focusPlace('PUS'); } },
      { k: 'busan', ic: 'bed', t: 'Busan, 2 nights', s: 'Lavalse Hotel, Yeongdo', go: () => { setPreset('busan'); focusPlace('lavalse'); } },
      { k: 'ktx', ic: 'ktx', t: 'KTX to Seoul', s: 'Mon 18 Jan · about 2h 15m–2h 45m', go: () => { setPreset('korea'); select(markers.find(m => m.key === 'busanStn')); }, cls: 'ktx' },
      { k: 'seoul', ic: 'home', t: 'Seoul, 5 nights', s: 'Hongdae, near Hongik Univ.', go: () => { setPreset('seoul'); focusPlace('hongdae'); } },
      { k: 'home', ic: 'plane', t: 'Seoul → Singapore', s: 'Sat 23 Jan · TW161 · 6h 55m', go: () => { setPreset('seoul'); focusPlace('ICN'); } }
    ];
    $('#legs').innerHTML = legs.map(l => `<button class="leg ${l.cls || ''}" type="button" data-leg="${l.k}"><span class="ic">${icon(l.ic, 'sm')}</span><b>${esc(l.t)}</b><small>${esc(l.s)}</small></button>`).join('');
    $$('#legs .leg').forEach((b, i) => b.onclick = () => { legs[i].go(); $('#map').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
  }
  function renderKTX(docs = []) {
    const k = T.ktx, booked = docs.find(d => d.ref === 'ktx');
    const f = booked ? booked.fields || {} : {};
    $('#ktxPanel').innerHTML = `
      <div class="photo">${photo(T.PHOTOS.ktx, '(max-width:860px) 100vw, 45vw')}<span class="credit">${credit(T.PHOTOS.ktx)}</span></div>
      <div class="body">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="lbl">The KTX journey · Monday 18 January</span>
          <span class="badge ${booked && (f.train || f.ref) ? 'confirmed' : 'planned'}">${booked && (f.train || f.ref) ? 'Booked' : 'Not booked yet'}</span></div>
        <h3>Busan to Seoul by high-speed rail</h3>
        <div class="ktx-track"><div><b>${f.dep ? esc(f.dep) : 'Busan'}</b><small>Busan Station 부산역</small></div><div class="ktx-line"><i></i></div><div style="text-align:right"><b>${f.arr ? esc(f.arr) : 'Seoul'}</b><small>Seoul Station 서울역</small></div></div>
        <div class="ktx-facts">
          <div><small>Journey time</small>${esc(k.duration)}</div>
          <div><small>Distance</small>${esc(k.distance)}</div>
          <div><small>Train</small>${f.train ? esc(f.train) : 'To be booked'}</div>
          <div><small>Seats</small>${f.seat ? esc(f.seat) : '—'}</div>
          <div style="grid-column:1/-1"><small>After arriving</small>${esc(k.then)}</div>
        </div>
        <p class="small" style="color:var(--mist)">${esc(k.booking)}</p>
        <div class="acts">
          <a class="btn sm" href="https://www.letskorail.com/" target="_blank" rel="noopener">${icon('external', 'sm')}Korail</a>
          <a class="btn sm" href="https://www.google.com/maps/dir/?api=1&origin=Busan+Station&destination=Seoul+Station&travelmode=transit" target="_blank" rel="noopener">${icon('nav', 'sm')}Route</a>
          <button class="btn sm" type="button" id="ktxWallet">${icon('ticket', 'sm')}${booked ? 'View booking' : 'Add booking to Wallet'}</button>
        </div>
      </div>`;
    $('#ktxWallet').onclick = () => emit('wallet:edit', 'ktx');
  }

  function init() {
    draw();
    const ctrl = document.createElement('div'); ctrl.className = 'map-ctrl';
    ctrl.innerHTML = `<div class="presets" id="mapPresets" role="group" aria-label="Map views">
        <button type="button" data-p="korea" aria-pressed="true">All Korea</button><button type="button" data-p="busan" aria-pressed="false">Busan</button><button type="button" data-p="seoul" aria-pressed="false">Seoul</button><button type="button" data-p="seoulCentral" aria-pressed="false">Central Seoul</button></div>
      <div class="zoom"><button type="button" aria-label="Zoom in" data-z=".6">${icon('plus', 'sm')}</button><button type="button" aria-label="Zoom out" data-z="1.6">${icon('minus', 'sm')}</button></div>`;
    mapEl.appendChild(ctrl);
    mapEl.insertAdjacentHTML('beforeend', `<div class="legend" aria-hidden="true"><span><i style="border-color:var(--navy);border-top-width:3px"></i>KTX</span><span><i style="border-color:#0090D2"></i>AREX</span><span><i style="border-color:var(--slate);border-top-style:dashed"></i>Flights</span></div>
      <div class="map-attr">Positions approximate · Natural Earth</div>
      <div id="mapHint" style="position:absolute;inset:auto 0 50% 0;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s;font-size:13px;font-weight:600;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.6)">Use two fingers to move the map</div>`);
    $$('#mapPresets button').forEach(b => b.onclick = () => setPreset(b.dataset.p));
    $$('.zoom button').forEach(b => b.onclick = () => zoomAt(+b.dataset.z));
    vb = boundsToVB(presets.korea); apply();
    interact(); renderLegs(); renderKTX();
    new IntersectionObserver(([e]) => { if (e.isIntersecting) mapEl.classList.add('inview'); }, { threshold: .3 }).observe(mapEl);
    on('wallet', renderKTX);
    on('map:focus', key => { setPreset(key.startsWith('d') ? 'korea' : 'korea'); focusPlace(key); $('#route').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  }
  return { init, focusPlace };
})();
