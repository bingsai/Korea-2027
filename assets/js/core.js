/* =====================================================================
   KOREA 2027 — core: helpers, icons, storage, dialogs, theme, nav,
   hero countdown, Today view, key times + calendar export
   ===================================================================== */
window.K27 = (() => {
  'use strict';
  const T = window.TRIP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------------- events ---------------- */
  const bus = new EventTarget();
  const on = (n, fn) => bus.addEventListener(n, e => fn(e.detail));
  const emit = (n, d) => bus.dispatchEvent(new CustomEvent(n, { detail: d }));

  /* ---------------- storage (localStorage, safe) ---------------- */
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem('k27.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('k27.' + k, JSON.stringify(v)); return true; } catch (e) { toast('Couldn’t save: this browser’s storage is full or blocked.'); return false; } },
    del(k) { try { localStorage.removeItem('k27.' + k); } catch (e) {} }
  };

  /* ---------------- IndexedDB (wallet, journal) ---------------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!('indexedDB' in window)) return rej(new Error('IndexedDB unavailable'));
      const r = indexedDB.open('k27', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        ['docs', 'files', 'photos', 'reflections'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: n === 'reflections' ? 'date' : 'id' }); });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const idb = {
    async all(s) { const d = await db(); return new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => rej(q.error); }); },
    async get(s, k) { const d = await db(); return new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async put(s, v) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction(s, 'readwrite'); tx.objectStore(s).put(v); tx.oncomplete = () => res(v); tx.onerror = () => rej(tx.error); }); },
    async del(s, k) { const d = await db(); return new Promise((res, rej) => { const tx = d.transaction(s, 'readwrite'); tx.objectStore(s).delete(k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); }
  };

  /* ---------------- icons (Lucide-style, 24px, 2px stroke) ---------------- */
  const P = {
    compass:'<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    'calendar-plus':'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v5M9.5 16.5h5"/>',
    map:'<path d="M14.1 5.9 9.9 3.8a2 2 0 0 0-1.8 0L3.6 6A1 1 0 0 0 3 7v12.4a.6.6 0 0 0 .9.5l4.2-2.1a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.2A1 1 0 0 0 21 17V4.6a.6.6 0 0 0-.9-.5l-4.2 2.1a2 2 0 0 1-1.8 0z"/><path d="M15 5.8v15M9 3.2v15"/>',
    wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    bed:'<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
    train:'<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 11h16M12 3v8M8 19l-2 3M18 22l-2-3M8 15h.01M16 15h.01"/>',
    ktx:'<path d="M3 15h13.5a4.5 4.5 0 0 0 4.2-6.1C20 7 18 6 16 6H5a2 2 0 0 0-2 2z"/><path d="M3 11h17.6M7 6v5M6 19l-1 2M17 19l1 2M3 15v2a2 2 0 0 0 2 2h12"/>',
    cloud:'<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>',
    coins:'<circle cx="8" cy="8" r="6"/><path d="M18.1 10.4A6 6 0 1 1 10.3 18M7 6h1v4M16.7 13.9l.7.7-2.8 2.8"/>',
    luggage:'<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
    ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    shield:'<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
    'shield-plus':'<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6M12 9v6"/>',
    camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    'wifi-off':'<path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5c4-.4 8.1.9 11.3 3.8M16.9 11.3a10 10 0 0 1 2.2 1.7M5 13a10 10 0 0 1 5.2-2.8M2 2l20 20"/>',
    plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    pin:'<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    nav:'<path d="M3 11 22 2l-9 19-2-8z"/>',
    external:'<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy:'<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    'check-circle':'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    chevron:'<path d="m6 9 6 6 6-6"/>',
    'chevron-left':'<path d="m15 18-6-6 6-6"/>',
    'chevron-right':'<path d="m9 18 6-6-6-6"/>',
    plus:'<path d="M5 12h14M12 5v14"/>',
    minus:'<path d="M5 12h14"/>',
    trash:'<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2"/>',
    pen:'<path d="M21.2 6.8a2.8 2.8 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5zM15 5l4 4"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    more:'<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert:'<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3M12 9v4M12 17h.01"/>',
    phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
    utensils:'<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    bag:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    landmark:'<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 5H4z"/>',
    bus:'<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2s-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3M9 18h5"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
    car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    walk:'<circle cx="13" cy="4" r="2"/><path d="m9 21 2.5-6 2.5 2.5V21M11.5 15l1-5 3 3 3 1M7.5 11l2-2.5 3 1.5"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    translate:'<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
    sunrise:'<path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4M16 18a4 4 0 0 0-8 0"/>',
    sunset:'<path d="M12 10V2M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 6l-4 4-4-4M16 18a4 4 0 0 0-8 0"/>',
    wind:'<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>',
    droplet:'<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
    snow:'<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
    rain:'<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2M16 14v6M8 14v6M12 16v6"/>',
    'cloud-sun':'<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 12.65a4 4 0 0 0-5.93-4.13M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z"/>',
    fog:'<path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2M16 17H7M17 21H9"/>',
    storm:'<path d="M6 16.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 9M13 11l-4 6h6l-4 6"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>',
    swap:'<path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16"/>',
    file:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    book:'<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    volume:'<path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6A1.4 1.4 0 0 1 5.4 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5zM16 9a5 5 0 0 1 0 6M19.4 18.4a9 9 0 0 0 0-12.8"/>',
    arrow:'<path d="M5 12h14M12 5l7 7-7 7"/>',
    user:'<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>'
  };
  const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[n] || P.info}</svg>`;
  function hydrateIcons(root = document) { $$('[data-icon]', root).forEach(el => { if (!el.firstChild) el.outerHTML = icon(el.dataset.icon, el.className); }); }

  /* ---------------- time ---------------- */
  const KST = 'Asia/Seoul', SGT = 'Asia/Singapore';
  const ymd = (d = new Date(), tz = KST) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const fmt = (d, opt, tz = KST) => new Intl.DateTimeFormat('en-SG', { timeZone: tz, ...opt }).format(typeof d === 'string' ? new Date(d) : d);
  const dateLabel = (iso, opt = { weekday: 'short', day: 'numeric', month: 'short' }) => fmt(new Date(iso + 'T12:00:00+09:00'), opt);
  const hhmm = (iso, tz) => fmt(iso, { hour: '2-digit', minute: '2-digit', hour12: false }, tz);
  function tripPhase(now = new Date()) {
    const today = ymd(now);
    if (now < new Date(T.departure)) return { phase: 'before', today };
    if (now > new Date(T.homecoming)) return { phase: 'after', today };
    const day = T.days.find(d => d.date === today) || T.days[0];
    return { phase: 'during', today, day };
  }

  /* ---------------- toasts ---------------- */
  function toast(msg, action, ms = 4200) {
    const host = $('#toasts'); if (!host) return;
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
    host.appendChild(t);
    const kill = () => t.remove();
    if (action) t.querySelector('button').onclick = () => { action.fn(); kill(); };
    setTimeout(kill, ms);
  }

  /* ---------------- dialog ---------------- */
  const dlg = () => $('#dlg');
  function openDialog({ title, body, submit = 'Save', danger = false, extra = '', onSubmit, onOpen, wide = false }) {
    const d = dlg();
    d.style.width = wide ? 'min(680px, calc(100vw - 24px))' : '';
    d.innerHTML = `<form method="dialog" novalidate>
      <header><h3>${esc(title)}</h3><button class="btn ghost icon-only sm" value="cancel" type="button" data-close aria-label="Close">${icon('x', 'sm')}</button></header>
      <div class="dbody">${body}</div>
      <footer>${extra}<button class="btn" type="button" data-close>Cancel</button>${submit ? `<button class="btn ${danger ? 'danger' : 'primary'}" type="submit" value="ok">${esc(submit)}</button>` : ''}</footer></form>`;
    const f = d.querySelector('form');
    $$('[data-close]', d).forEach(b => b.onclick = () => d.close('cancel'));
    f.onsubmit = async e => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const r = onSubmit ? await onSubmit(new FormData(f), f) : true;
      if (r !== false) d.close('ok');
    };
    onOpen && onOpen(f, d);
    d.showModal();
    const first = f.querySelector('input:not([type=hidden]):not([type=file]),select,textarea');
    if (first && matchMedia('(pointer:fine)').matches) first.focus();
    return d;
  }
  function confirmDialog(text, ok = 'Delete', danger = true) {
    return new Promise(res => {
      const d = openDialog({ title: 'Are you sure?', body: `<p>${esc(text)}</p>`, submit: ok, danger, onSubmit: () => { res(true); } });
      d.addEventListener('close', () => res(false), { once: true });
    });
  }

  /* ---------------- clipboard, links ---------------- */
  async function copy(text, label = 'Copied') {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const ta = Object.assign(document.createElement('textarea'), { value: text }); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (_) {} ta.remove(); }
    toast(label);
  }
  const enc = encodeURIComponent;
  const links = {
    google: q => `https://www.google.com/maps/search/?api=1&query=${enc(q)}`,
    naver: q => `https://map.naver.com/p/search/${enc(q)}`,
    dir: q => `https://www.google.com/maps/dir/?api=1&destination=${enc(q)}&travelmode=transit`
  };
  const mapButtons = (place, extra = '') => place ? `
    <a class="btn sm" href="${links.google(place.q || place.en)}" target="_blank" rel="noopener">${icon('pin', 'sm')}Google Maps</a>
    <a class="btn sm" href="${links.naver(place.ko || place.q)}" target="_blank" rel="noopener">${icon('map', 'sm')}Naver Map</a>${extra}` : '';

  function download(name, data, type = 'application/json') {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------------- theme ---------------- */
  function initTheme() {
    // carry over a choice made on the previous version of the site
    try { const old = localStorage.getItem('korea27-theme'); if (old && store.get('theme') == null) store.set('theme', old === 'night' ? 'dark' : 'light'); } catch (e) {}
    const btn = $('#themeBtn');
    const paint = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      btn.innerHTML = icon(dark ? 'sun' : 'moon');
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    const saved = store.get('theme'); if (saved === 'dark') document.documentElement.dataset.theme = 'dark';
    btn.onclick = () => {
      const dark = document.documentElement.dataset.theme !== 'dark';
      if (dark) document.documentElement.dataset.theme = 'dark'; else delete document.documentElement.dataset.theme;
      store.set('theme', dark ? 'dark' : 'light'); paint(); emit('theme');
    };
    paint();
  }

  /* ---------------- navigation ---------------- */
  function initNav() {
    const nav = $('#topnav'), ind = $('.topnav .ind'), linksEl = $$('#links a'), bn = $$('#bnav a');
    const ids = ['overview', 'route', 'itinerary', 'stays', 'transport', 'budget', 'essentials', 'journal'];
    const secs = ids.map(id => document.getElementById(id)).filter(Boolean);
    let current = '';
    function setCurrent(id) {
      if (id === current) return; current = id;
      linksEl.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));
      const map = { stays: 'more', transport: 'more', essentials: 'more', journal: 'more' };
      bn.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + id ? 'true' : 'false'));
      $('#moreBtn').setAttribute('aria-current', map[id] ? 'true' : 'false');
      const a = linksEl.find(x => x.getAttribute('href') === '#' + id);
      if (a && ind) { ind.style.opacity = 1; ind.style.left = a.offsetLeft + 12 + 'px'; ind.style.width = a.offsetWidth - 24 + 'px'; }
      else if (ind) ind.style.opacity = 0;
    }
    let ticking = false;
    function onScroll() {
      ticking = false;
      const y = scrollY, hero = $('#top').offsetHeight;
      nav.classList.toggle('solid', y > hero - 80);
      nav.classList.toggle('on-hero', y < hero - 80);
      nav.classList.toggle('compact', y > hero + 200);
      let id = '';
      for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * .35) id = s.id;
      setCurrent(id);
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', () => { current = ''; onScroll(); });
    onScroll();

    // "More" sheet (mobile)
    const sheet = $('#moreSheet'), bd = $('#sheetBackdrop'), more = $('#moreBtn');
    const open = () => { sheet.hidden = false; requestAnimationFrame(() => { sheet.classList.add('open'); bd.classList.add('open'); }); more.setAttribute('aria-expanded', 'true'); sheet.querySelector('a').focus({ preventScroll: true }); };
    const close = () => { sheet.classList.remove('open'); bd.classList.remove('open'); more.setAttribute('aria-expanded', 'false'); setTimeout(() => { sheet.hidden = true; }, 400); };
    more.onclick = () => sheet.classList.contains('open') ? close() : open();
    bd.onclick = close;
    $$('a', sheet).forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) close(); });
  }

  /* ---------------- hero ---------------- */
  function initHero() {
    const img = $('#heroImg');
    const done = () => img.classList.add('loaded');
    if (img.complete && img.naturalWidth) done(); else { img.addEventListener('load', done); img.addEventListener('error', () => img.remove()); }
    // flights line
    $('#heroFlights').innerHTML = T.flights.map(f => `<span>${icon('plane', 'sm')}<b>${f.code}</b> ${f.from.code} → ${f.to.code}, ${fmt(f.dep, { day: 'numeric', month: 'short' }, f.id === 'out' ? SGT : KST)} ${hhmm(f.dep, f.id === 'out' ? SGT : KST)}</span>`).join('');
    // gentle parallax
    if (!reduce) {
      const media = $('#heroMedia'); let t = false;
      addEventListener('scroll', () => { if (t) return; t = true; requestAnimationFrame(() => { t = false; const y = Math.min(scrollY, innerHeight); media.style.transform = `translate3d(0, ${y * .18}px, 0)`; }); }, { passive: true });
    }
    // countdown (to departure from Changi, in Singapore time)
    const dep = new Date(T.departure), back = new Date(T.homecoming);
    const els = { d: $('[data-u=d]'), h: $('[data-u=h]'), m: $('[data-u=m]'), s: $('[data-u=s]') };
    const set = (k, v) => { const el = els[k], s = String(v).padStart(2, '0'); if (el.textContent !== s) { el.textContent = s; if (!reduce && k !== 'd') { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); } } };
    function tick() {
      const now = new Date(); let ms = dep - now;
      if (ms <= 0) {
        ms = 0;
        $('#cdNote').textContent = now < back ? 'We’re on the trip now.' : 'Trip complete. Welcome home.';
      }
      set('d', Math.floor(ms / 864e5)); set('h', Math.floor(ms / 36e5) % 24); set('m', Math.floor(ms / 6e4) % 60); set('s', Math.floor(ms / 1e3) % 60);
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------------- overview: Today + tickets + key times ---------------- */
  function timed(now = new Date()) {
    const out = [];
    T.days.forEach(d => d.items.forEach(it => { if (it.start) out.push({ d, it, s: new Date(it.start), e: it.end ? new Date(it.end) : null }); }));
    T.keyTimes.forEach(k => { if (k.when && !out.some(o => o.it.start === k.when && o.it.title.startsWith(k.title.slice(0, 8)))) out.push({ d: null, it: { title: k.title, desc: k.note, start: k.when }, s: new Date(k.when), e: null, key: true }); });
    return out.sort((a, b) => a.s - b.s);
  }
  function renderToday() {
    const now = new Date(), ph = tripPhase(now), host = $('#today');
    const list = timed(now);
    const next = list.find(x => x.s > now);
    const curr = list.find(x => x.e && x.s <= now && now <= x.e);
    const packed = (() => { const p = store.get('packing'); if (!p || !p.length) return null; return Math.round(p.filter(i => i.packed).length / p.length * 100); })();
    const spent = window.K27Budget ? window.K27Budget.totalSGD() : null;
    let head = '', state = '', body = '';
    const tzNote = x => x.it.start && x.it.start.endsWith('+08:00') ? 'SGT' : 'KST';
    const whenTxt = x => `${fmt(x.s, { weekday: 'short', day: 'numeric', month: 'short' }, tzNote(x) === 'SGT' ? SGT : KST)}, ${hhmm(x.s, tzNote(x) === 'SGT' ? SGT : KST)} ${tzNote(x)}`;
    if (ph.phase === 'before') {
      const days = Math.ceil((new Date(T.departure) - now) / 864e5);
      state = 'Before the trip';
      head = `${days} ${days === 1 ? 'day' : 'days'} to go`;
      body = next ? `<div class="next"><span class="when">${icon('clock')}</span><div><small class="muted xs">Next up</small><b>${esc(next.it.title)}</b><span class="small muted">${esc(whenTxt(next))}</span></div></div>` : '';
      body += `<p class="small muted">Today's plan appears here automatically during the trip, based on the date in Korea.</p>`;
    } else if (ph.phase === 'during') {
      const d = ph.day;
      state = `Day ${d.n} of 8 · ${d.city}`;
      head = esc(d.headline);
      if (curr) body += `<div class="next" style="background:var(--green-soft)"><span class="tag-now">${icon('clock', 'sm')}Now</span><div><b>${esc(curr.it.title)}</b><span class="small muted">Until ${hhmm(curr.e, curr.it.end.endsWith('+08:00') ? SGT : KST)}</span></div></div>`;
      if (next) body += `<div class="next"><span class="when">${icon('clock')}</span><div><small class="muted xs">Next timed item</small><b>${esc(next.it.title)}</b><span class="small muted">${esc(whenTxt(next))}</span></div></div>`;
      body += `<a class="btn primary" href="#itinerary" data-goto-day="${d.n}">${icon('calendar', 'sm')}Open today's plan</a>`;
    } else {
      state = 'Trip complete';
      head = 'Welcome home';
      body = `<p class="small muted">The itinerary, journal and expenses stay here for remembering.</p><a class="btn" href="#journal">${icon('camera', 'sm')}Open the journal</a>`;
    }
    host.innerHTML = `
      <div class="card today-main"><p class="state">${state}</p><h3>${head}</h3>
        <p class="small muted">Today: ${fmt(now, { weekday: 'long', day: 'numeric', month: 'long' }, KST)} in Korea, ${hhmm(now, KST)} KST · ${hhmm(now, SGT)} in Singapore</p>${body}</div>
      <div class="card pad" style="display:flex;flex-direction:column;gap:var(--s4)">
        <div class="stats">
          <div><b class="num">8</b><small>days, Busan &amp; Seoul</small></div>
          <div><b class="num">${packed == null ? '–' : packed + '%'}</b><small>${packed == null ? 'packing not started' : 'packed'}</small></div>
          <div><b class="num">${spent == null ? '–' : 'S$' + Math.round(spent).toLocaleString('en-SG')}</b><small>spent so far</small></div>
        </div>
        <div style="display:flex;gap:var(--s2);flex-wrap:wrap">
          <a class="btn sm" href="#packing">${icon('luggage', 'sm')}Packing</a>
          <a class="btn sm" href="#wallet">${icon('ticket', 'sm')}Wallet</a>
          <a class="btn sm" href="#currency">${icon('coins', 'sm')}Won ⇄ SGD</a>
          <a class="btn sm" href="#emergency">${icon('shield', 'sm')}Emergency</a>
        </div>
      </div>`;
  }
  function renderTickets(walletDocs = []) {
    $('#tickets').innerHTML = T.flights.map(f => {
      const depTz = f.from.code === 'SIN' ? SGT : KST, arrTz = f.to.code === 'SIN' ? SGT : KST;
      const saved = walletDocs.find(d => d.ref === f.id && d.fields && d.fields.ref);
      return `<article class="ticket">
        <div class="top"><span>${esc(f.airline)} · <b style="color:var(--text)">${f.code}</b></span><span>${fmt(f.dep, { weekday: 'short', day: 'numeric', month: 'short' }, depTz)}</span></div>
        <div><div class="code">${f.from.code}</div><div class="t">${hhmm(f.dep, depTz)}</div><div class="lbl">${esc(f.from.airport)} ${esc(f.from.terminal)}</div></div>
        <div class="mid">${f.duration}<div class="ln"></div>${icon('plane', 'sm')}</div>
        <div class="r"><div class="code">${f.to.code}</div><div class="t">${hhmm(f.arr, arrTz)}</div><div class="lbl">${esc(f.to.airport)} ${esc(f.to.terminal)}</div></div>
        <div style="grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span class="badge confirmed">Confirmed</span>
          <a class="small" href="#wallet">${saved ? icon('lock', 'sm') + ' Booking ref saved in Wallet' : 'Add booking ref in Wallet'}</a></div>
      </article>`;
    }).join('');
  }
  let walletCache = [];
  function stayTimes(stayId) { const d = walletCache.find(x => x.ref === stayId); return d ? d.fields || {} : {}; }
  function renderKeyTimes() {
    const now = new Date();
    $('#keytimes').innerHTML = T.keyTimes.map(k => {
      let time = k.time, pending = false;
      if (k.stay) { const v = stayTimes(k.stay)[k.field]; if (v) time = v; else pending = true; }
      const past = k.when && new Date(k.when) < now;
      return `<li class="${past ? 'past' : ''} ${k.highlight ? 'hl' : ''}">
        <div class="kt-when"><b>${esc(time)}</b><span class="muted">${esc(k.day)}${k.tz && !pending ? ' · ' + k.tz : ''}</span>${pending ? '<span class="badge pending">Time to add</span>' : ''}</div>
        <h4>${esc(k.title)}</h4><p>${esc(k.note)}</p></li>`;
    }).join('');
  }
  function exportICS() {
    const f = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const clean = s => String(s).replace(/[,;\\]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const ev = [];
    T.keyTimes.forEach((k, i) => {
      let when = k.when;
      if (k.stay) { const v = stayTimes(k.stay)[k.field]; if (v && /^\d{1,2}:\d{2}$/.test(v)) when = `${k.field === 'checkIn' ? '2027-01-18' : '2027-01-23'}T${v.padStart(5, '0')}:00+09:00`; }
      if (!when) return;
      const s = new Date(when), e = new Date(s.getTime() + 30 * 6e4);
      ev.push(['BEGIN:VEVENT', `UID:k27-${i}@korea-2027`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${clean(k.title)}`, `DESCRIPTION:${clean(k.note)}`, 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${clean(k.title)}`, 'END:VALARM', 'END:VEVENT'].join('\r\n'));
    });
    download('korea-2027-key-times.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Korea 2027//EN', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
    toast(`Calendar file with ${ev.length} events downloaded`);
  }

  /* ---------------- reveal on scroll ---------------- */
  function initReveal() {
    if (reduce || !('IntersectionObserver' in window)) { $$('.reveal').forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    $$('.reveal').forEach(e => io.observe(e));
  }

  /* ---------------- photos ---------------- */
  const photo = (p, sizes = '100vw', eager = false) => p ? `<img alt="${esc(p.alt)}" src="${T.img(p.id, 1200)}" srcset="${T.img(p.id, 640)} 640w, ${T.img(p.id, 1200)} 1200w, ${T.img(p.id, 1800)} 1800w" sizes="${sizes}" ${eager ? '' : 'loading="lazy"'} decoding="async" onload="this.classList.add('loaded')" onerror="this.remove()">` : '';
  const credit = p => p ? `Photo: <a href="${p.page}" target="_blank" rel="noopener">${esc(p.by)}</a> / Unsplash` : '';

  function init() {
    hydrateIcons();
    initTheme(); initNav(); initHero();
    renderToday(); renderTickets(); renderKeyTimes();
    $('#icsBtn').onclick = exportICS;
    setInterval(renderToday, 60000);
    on('wallet', docs => { walletCache = docs; renderTickets(docs); renderKeyTimes(); });
    on('budget', renderToday); on('packing', renderToday);
    initReveal();
  }

  return { T, $, $$, esc, uid, debounce, on, emit, store, idb, icon, hydrateIcons, ymd, fmt, dateLabel, hhmm, tripPhase, toast, openDialog, confirmDialog, copy, links, mapButtons, download, photo, credit, reduce, KST, SGT, init, stayTimes, get walletCache() { return walletCache; } };
})();
