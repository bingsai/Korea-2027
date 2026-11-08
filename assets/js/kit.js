/* =====================================================================
   KOREA 2027 — packing list, travel wallet (device-only), emergency
   ===================================================================== */
window.K27Kit = (() => {
  'use strict';
  const { T, $, $$, esc, icon, store, idb, uid, toast, openDialog, confirmDialog, download, copy, links, emit, on, ymd, dateLabel } = K27;

  /* ===================== PACKING ===================== */
  const CATS = ['Clothing', 'Toiletries', 'Electronics', 'Documents', 'Travel essentials', 'Miscellaneous'];
  let items = store.get('packing');
  let pf = 'All';
  function migrate() {
    if (items && items.length) return;
    items = T.packing.map(([cat, name, qty]) => ({ id: uid(), name, cat, qty: qty || 1, packed: false }));
    // carry over ticks from the previous version of the site
    try {
      const old = JSON.parse(localStorage.getItem('korea27-pack') || 'null');
      if (old) Object.entries(T.legacyPacking).forEach(([k, names]) => names.forEach((n, i) => { if (old[`${k}-${i}`]) { const it = items.find(x => x.name === n); if (it) it.packed = true; } }));
    } catch (e) {}
    store.set('packing', items);
  }
  const savePk = () => { store.set('packing', items); emit('packing'); };
  const norm = s => s.toLowerCase().replace(/[^a-z0-9가-힣]+/g, ' ').trim();
  function renderPack() {
    const done = items.filter(i => i.packed).length, tot = items.length, C = 2 * Math.PI * 36;
    const host = $('#pack');
    const shown = items.filter(i => pf === 'All' || (pf === 'To pack' ? !i.packed : i.cat === pf));
    host.innerHTML = `
      <div class="pk-top"><div class="ring-wrap"><svg class="ring" viewBox="0 0 84 84"><circle class="bg" cx="42" cy="42" r="36"/><circle class="fg" cx="42" cy="42" r="36" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - (tot ? done / tot : 0))}"/></svg><b>${tot ? Math.round(done / tot * 100) : 0}%</b></div>
        <div><h4>${done === tot && tot ? 'Everything’s packed' : `${done} of ${tot} packed`}</h4><p>${tot - done} ${tot - done === 1 ? 'item' : 'items'} left · a winter list for Korea in January</p></div></div>
      <div class="pk-filters" role="group" aria-label="Filter packing list">${['All', 'To pack', ...CATS].map(c => `<button class="chip" type="button" data-pf="${c}" aria-pressed="${pf === c}">${c}${c !== 'All' && c !== 'To pack' ? ` <span class="muted">${items.filter(i => i.cat === c && !i.packed).length}</span>` : ''}</button>`).join('')}</div>
      ${CATS.filter(c => shown.some(i => i.cat === c)).map(c => `<div class="pk-cat"><h5><span>${c}</span><span class="num">${items.filter(i => i.cat === c && i.packed).length}/${items.filter(i => i.cat === c).length}</span></h5>
        ${shown.filter(i => i.cat === c).map(i => `<div class="pk-item ${i.packed ? 'packed' : ''}" data-id="${i.id}">
          <button class="cb" type="button" role="checkbox" aria-checked="${i.packed}" aria-label="${esc(i.name)}"><svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3L13 4.5"/></svg></button>
          <span class="nm">${esc(i.name)}</span>
          <span class="qty"><button type="button" data-q="-1" aria-label="Fewer">${icon('minus', 'sm')}</button><span>${i.qty}</span><button type="button" data-q="1" aria-label="More">${icon('plus', 'sm')}</button></span>
          <button class="btn ghost sm icon-only" type="button" data-rm aria-label="Remove ${esc(i.name)}">${icon('x', 'sm')}</button></div>`).join('')}</div>`).join('') || '<div class="empty">Nothing here.</div>'}
      <form class="pk-add" id="pkAdd"><input class="input" name="n" placeholder="Add an item…" maxlength="80" aria-label="New item">
        <select class="input" name="c" style="width:auto" aria-label="Category">${CATS.map(c => `<option ${c === (CATS.includes(pf) ? pf : 'Miscellaneous') ? 'selected' : ''}>${c}</option>`).join('')}</select>
        <button class="btn primary" type="submit">${icon('plus', 'sm')}Add</button>
        <button class="btn ghost" type="button" id="pkRestore" title="Adds any missing items from the winter list without duplicating">Add missing winter items</button></form>`;
    $('#packing .pk-done') && $('#packing').classList.toggle('pk-all', done === tot && tot > 0);
    $$('[data-pf]', host).forEach(b => b.onclick = () => { pf = b.dataset.pf; renderPack(); });
    $$('.pk-item', host).forEach(row => {
      const it = items.find(i => i.id === row.dataset.id);
      row.querySelector('.cb').onclick = () => { it.packed = !it.packed; savePk(); renderPack(); if (items.every(i => i.packed)) toast('All packed. Have a great trip!'); };
      $$('[data-q]', row).forEach(b => b.onclick = () => { it.qty = Math.max(1, Math.min(99, it.qty + +b.dataset.q)); savePk(); renderPack(); });
      row.querySelector('[data-rm]').onclick = () => { const idx = items.indexOf(it); items.splice(idx, 1); savePk(); renderPack(); toast(`Removed ${it.name}`, { label: 'Undo', fn: () => { items.splice(idx, 0, it); savePk(); renderPack(); } }, 6000); };
      row.querySelector('.nm').ondblclick = () => openDialog({ title: 'Edit item', body: `<label class="field"><span>Name</span><input class="input" name="n" value="${esc(it.name)}" maxlength="80" required></label><label class="field"><span>Category</span><select class="input" name="c">${CATS.map(c => `<option ${c === it.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></label>`, onSubmit: fd => { it.name = String(fd.get('n')).trim() || it.name; it.cat = fd.get('c'); savePk(); renderPack(); } });
    });
    $('#pkAdd').onsubmit = e => {
      e.preventDefault(); const fd = new FormData(e.target), n = String(fd.get('n')).trim(); if (!n) return;
      if (items.some(i => norm(i.name) === norm(n))) { toast(`“${n}” is already on your list`); return; }
      items.push({ id: uid(), name: n, cat: fd.get('c'), qty: 1, packed: false, custom: true }); savePk(); renderPack(); toast('Added'); $('#pkAdd input').focus();
    };
    $('#pkRestore').onclick = () => {
      let added = 0; T.packing.forEach(([cat, name, qty]) => { if (!items.some(i => norm(i.name) === norm(name))) { items.push({ id: uid(), name, cat, qty: qty || 1, packed: false }); added++; } });
      savePk(); renderPack(); toast(added ? `Added ${added} missing ${added === 1 ? 'item' : 'items'}` : 'Nothing missing, your list already has everything');
    };
  }

  /* ===================== WALLET (IndexedDB, this device only) ===================== */
  const TYPES = {
    flight: { name: 'Flight', icon: 'plane', fields: [['ref', 'Booking reference'], ['seat', 'Seats'], ['bags', 'Baggage'], ['notes', 'Notes', 'area']] },
    ktx: { name: 'KTX', icon: 'ktx', fields: [['train', 'Train number'], ['dep', 'Departs (e.g. 12:30)'], ['arr', 'Arrives'], ['seat', 'Car & seats'], ['ref', 'Booking reference'], ['notes', 'Notes', 'area']] },
    stay: { name: 'Stay', icon: 'bed', fields: [['ref', 'Confirmation number'], ['checkIn', 'Check-in time (e.g. 16:00)'], ['checkOut', 'Check-out time (e.g. 11:00)'], ['address', 'Address'], ['koAddress', 'Korean address'], ['google', 'Google Maps link'], ['naver', 'Naver Map link'], ['instructions', 'Entry instructions', 'area'], ['contact', 'Host / hotel contact'], ['notes', 'Notes', 'area']] },
    insurance: { name: 'Insurance', icon: 'shield-plus', fields: [['provider', 'Provider'], ['policy', 'Policy number'], ['hotline', '24-hour assistance number'], ['notes', 'Notes', 'area']] },
    booking: { name: 'Booking', icon: 'ticket', fields: [['what', 'What'], ['date', 'Date'], ['time', 'Time'], ['ref', 'Confirmation'], ['notes', 'Notes', 'area']] },
    document: { name: 'Document', icon: 'file', fields: [['notes', 'Notes', 'area']] }
  };
  const SLOTS = [
    { ref: 'out', type: 'flight', title: 'Jeju Air 7C2642', sub: 'SIN → PUS · Sat 16 Jan, 00:25' },
    { ref: 'home', type: 'flight', title: 'Trinity Airways TW161', sub: 'ICN → SIN · Sat 23 Jan, 15:30' },
    { ref: 'ktx', type: 'ktx', title: 'KTX Busan → Seoul', sub: 'Mon 18 Jan · not booked yet' },
    { ref: 'lavalse', type: 'stay', title: 'Lavalse Hotel', sub: 'Busan · 16–18 Jan' },
    { ref: 'hongdae', type: 'stay', title: 'Hongdae Airbnb', sub: 'Seoul · 18–23 Jan · add the private address here' },
    { ref: 'insurance', type: 'insurance', title: 'Travel insurance', sub: 'Policy and emergency assistance' }
  ];
  let docs = [], files = {}, wOK = true;
  async function loadWallet() {
    try { docs = await idb.all('docs'); const fl = await idb.all('files'); files = Object.fromEntries(fl.map(f => [f.id, f])); }
    catch (e) { wOK = false; docs = []; }
    renderWallet(); emit('wallet', docs);
  }
  function renderWallet() {
    const g = $('#walletGrid');
    if (!wOK) { g.innerHTML = `<div class="card empty" style="grid-column:1/-1">${icon('alert')}This browser doesn't allow private storage (for example in some private-browsing modes), so the wallet can't save here.</div>`; return; }
    const cards = SLOTS.map(s => ({ slot: s, doc: docs.find(d => d.ref === s.ref) })).concat(docs.filter(d => !SLOTS.some(s => s.ref === d.ref)).map(d => ({ doc: d })));
    g.innerHTML = cards.map(({ slot, doc }) => {
      const type = TYPES[(doc && doc.type) || slot.type], f = (doc && doc.fields) || {};
      const vals = type.fields.filter(([k, , t]) => f[k] && t !== 'area').slice(0, 6);
      const fl = (doc && doc.files || []).map(id => files[id]).filter(Boolean);
      return `<article class="wcard">
        <div class="wt"><span class="ic">${icon(type.icon, 'sm')}</span><div style="min-width:0;flex:1"><b>${esc((doc && doc.title) || slot.title)}</b><small>${esc(slot ? slot.sub : type.name)}</small></div>${doc ? '<span class="badge confirmed">Saved</span>' : '<span class="badge optional">Empty</span>'}</div>
        ${vals.length ? `<dl>${vals.map(([k, l]) => `<div><dt>${esc(l)}</dt><dd>${/^https?:/.test(f[k]) ? `<a href="${esc(f[k])}" target="_blank" rel="noopener">Open link</a>` : esc(f[k])}</dd></div>`).join('')}</dl>` : `<p class="small muted" style="margin-top:10px">${doc ? (f.notes ? esc(f.notes) : 'No details yet.') : 'Nothing saved yet.'}</p>`}
        ${fl.length ? `<div class="files">${fl.map(x => `<a href="#" data-file="${x.id}">${icon('file', 'sm')}${esc(x.name)}</a>`).join('')}</div>` : ''}
        <div class="acts"><button class="btn sm" type="button" data-edit="${doc ? doc.id : ''}" data-slot="${slot ? slot.ref : ''}">${icon(doc ? 'pen' : 'plus', 'sm')}${doc ? 'Edit' : 'Add details'}</button>${f.ref ? `<button class="btn sm ghost" type="button" data-copy="${esc(f.ref)}">${icon('copy', 'sm')}Copy ref</button>` : ''}</div>
      </article>`;
    }).join('');
    $$('[data-edit]', g).forEach(b => b.onclick = () => editDoc(b.dataset.edit ? docs.find(d => d.id === b.dataset.edit) : null, b.dataset.slot));
    $$('[data-copy]', g).forEach(b => b.onclick = () => copy(b.dataset.copy, 'Reference copied'));
    $$('[data-file]', g).forEach(a => a.onclick = e => { e.preventDefault(); const x = files[a.dataset.file]; if (!x) return; const u = URL.createObjectURL(x.blob); window.open(u, '_blank', 'noopener') || download(x.name, x.blob); setTimeout(() => URL.revokeObjectURL(u), 60000); });
  }
  function editDoc(doc, slotRef) {
    const slot = SLOTS.find(s => s.ref === (doc ? doc.ref : slotRef));
    let typeKey = doc ? doc.type : slot ? slot.type : 'booking';
    const f = (doc && doc.fields) || {};
    const fl = (doc && doc.files || []).map(id => files[id]).filter(Boolean);
    let removeFiles = new Set();
    const fieldsHTML = tk => TYPES[tk].fields.map(([k, l, t]) => t === 'area' ? `<label class="field"><span>${l}</span><textarea class="input" name="f_${k}" rows="2">${esc(f[k] || '')}</textarea></label>` : `<label class="field"><span>${l}</span><input class="input" name="f_${k}" value="${esc(f[k] || '')}" ${k === 'google' || k === 'naver' ? 'inputmode="url"' : ''} autocomplete="off"></label>`).join('');
    openDialog({
      title: doc ? 'Edit wallet item' : slot ? slot.title : 'Add to wallet', submit: 'Save', wide: true,
      extra: doc ? `<button class="btn danger grow" type="button" id="delDoc">${icon('trash', 'sm')}Delete</button>` : '',
      body: `${slot ? `<p class="small muted">${esc(slot.sub)}</p>` : `<div class="field"><span>Type</span><select class="input" name="type" id="docType">${Object.entries(TYPES).filter(([k]) => k !== 'flight').map(([k, t]) => `<option value="${k}" ${k === typeKey ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>`}
        <label class="field"><span>Title</span><input class="input" name="title" value="${esc((doc && doc.title) || (slot && slot.title) || '')}" required maxlength="80"></label>
        <div id="docFields" style="display:flex;flex-direction:column;gap:12px">${fieldsHTML(typeKey)}</div>
        <div class="field"><span>Attachments (PDF or images, stored on this device)</span>
          ${fl.length ? `<div class="files" style="display:flex;flex-wrap:wrap;gap:6px">${fl.map(x => `<span class="chip" data-fid="${x.id}">${icon('file', 'sm')}${esc(x.name)}<button type="button" aria-label="Remove ${esc(x.name)}" data-rmf="${x.id}">${icon('x', 'sm')}</button></span>`).join('')}</div>` : ''}
          <input class="input" type="file" name="files" accept="application/pdf,image/*" multiple></div>
        <p class="xs muted">${icon('lock', 'sm')} Saved only in this browser on this device. Nothing here is uploaded or published.</p>`,
      onOpen: () => {
        const sel = $('#docType'); if (sel) sel.onchange = () => { typeKey = sel.value; $('#docFields').innerHTML = fieldsHTML(typeKey); };
        $$('[data-rmf]').forEach(b => b.onclick = () => { removeFiles.add(b.dataset.rmf); b.closest('.chip').remove(); });
        const del = $('#delDoc'); if (del) del.onclick = async () => {
          $('#dlg').close();
          if (!(await confirmDialog(`Delete “${doc.title}” and its attachments from this device?`))) return;
          for (const id of doc.files || []) await idb.del('files', id).catch(() => {});
          await idb.del('docs', doc.id); toast('Deleted'); loadWallet();
        };
      },
      onSubmit: async (fd, form) => {
        const fields = {}; TYPES[typeKey].fields.forEach(([k]) => { const v = String(fd.get('f_' + k) || '').trim(); if (v) fields[k] = v; });
        const ids = (doc && doc.files || []).filter(id => !removeFiles.has(id));
        for (const id of removeFiles) await idb.del('files', id).catch(() => {});
        const input = form.querySelector('input[type=file]');
        for (const file of input.files) {
          if (file.size > 25 * 1024 * 1024) { toast(`${file.name} is over 25 MB and wasn’t added`); continue; }
          const id = uid(); await idb.put('files', { id, name: file.name, type: file.type, size: file.size, blob: file }); ids.push(id);
        }
        const rec = { id: (doc && doc.id) || uid(), ref: (doc && doc.ref) || (slot && slot.ref) || null, type: typeKey, title: String(fd.get('title')).trim(), fields, files: ids, updated: Date.now() };
        try { await idb.put('docs', rec); toast('Saved to your wallet'); } catch (e) { toast('Couldn’t save: storage may be full'); return false; }
        loadWallet();
      }
    });
  }
  // backup / restore, optionally encrypted with a passphrase (AES-GCM, PBKDF2)
  const b64 = buf => { let s = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function keyFrom(pass, salt) { const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
  async function walletBackup() {
    if (!docs.length) { toast('Your wallet is empty'); return; }
    openDialog({ title: 'Back up wallet', submit: 'Download backup', body: `<p class="small">Includes every wallet item and attachment. To move it to another device, open this site there and choose Restore.</p>
      <label class="field"><span>Passphrase (recommended)</span><input class="input" type="password" name="p" autocomplete="new-password" placeholder="Leave empty for an unencrypted file"></label>
      <p class="xs muted">With a passphrase the file is encrypted (AES-256). Without the passphrase it can't be opened, and we can't recover it.</p>`,
      onSubmit: async fd => {
        const out = { docs, files: [] };
        for (const d of docs) for (const id of d.files || []) { const x = files[id]; if (x) out.files.push({ id: x.id, name: x.name, type: x.type, size: x.size, data: b64(await x.blob.arrayBuffer()) }); }
        let payload = { app: 'korea-2027-wallet', version: 1, saved: new Date().toISOString(), data: out };
        const pass = String(fd.get('p'));
        if (pass) {
          if (!crypto.subtle) { toast('Encryption isn’t available here (needs HTTPS)'); return false; }
          const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
          const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(pass, salt), new TextEncoder().encode(JSON.stringify(out)));
          payload = { app: 'korea-2027-wallet', version: 1, saved: payload.saved, enc: { salt: b64(salt), iv: b64(iv), data: b64(ct) } };
        }
        download(`korea-2027-wallet-${ymd()}${pass ? '-locked' : ''}.json`, JSON.stringify(payload)); toast('Wallet backup downloaded');
      } });
  }
  function walletRestore() {
    const inp = $('#restoreInput');
    inp.onchange = async () => {
      const file = inp.files[0]; inp.value = ''; if (!file) return;
      let p; try { p = JSON.parse(await file.text()); if (p.app !== 'korea-2027-wallet') throw 0; } catch (e) { toast('That file isn’t a wallet backup'); return; }
      const finish = async data => {
        if (!(await confirmDialog(`Restore ${data.docs.length} wallet ${data.docs.length === 1 ? 'item' : 'items'}? Items with the same name on this device will be replaced.`, 'Restore', false))) return;
        for (const x of data.files) await idb.put('files', { id: x.id, name: x.name, type: x.type, size: x.size, blob: new Blob([unb64(x.data)], { type: x.type }) });
        for (const d of data.docs) await idb.put('docs', d);
        toast('Wallet restored'); loadWallet();
      };
      if (!p.enc) return finish(p.data);
      openDialog({ title: 'Unlock backup', submit: 'Unlock', body: `<label class="field"><span>Passphrase</span><input class="input" type="password" name="p" required autocomplete="current-password"></label>`,
        onSubmit: async fd => {
          try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(p.enc.iv) }, await keyFrom(String(fd.get('p')), unb64(p.enc.salt)), unb64(p.enc.data)); setTimeout(() => finish(JSON.parse(new TextDecoder().decode(pt))), 50); }
          catch (e) { toast('Wrong passphrase'); return false; }
        } });
    };
    inp.click();
  }

  /* ===================== EMERGENCY ===================== */
  let contacts = store.get('contacts', []);
  function renderEmergency() {
    const E = T.emergency;
    $('#sos').innerHTML = E.numbers.map(n => `<a href="tel:${n.tel}"><small>${esc(n.label)}</small><b>${n.num}</b>${n.alt ? `<small>${esc(n.alt)}</small>` : '<small>Tap to call</small>'}</a>`).join('');
    const em = E.embassy;
    $('#embassy').innerHTML = `<h4 style="font-size:var(--t-md);margin-bottom:12px">${esc(em.name)}</h4><dl>
      <dt>Phone</dt><dd><a href="tel:${em.phone.replace(/-/g, '')}">${esc(em.phone)}</a><br><span class="xs muted">In Korea: ${esc(em.phoneLocal)}</span></dd>
      <dt>After hours</dt><dd><a href="tel:${em.duty.replace(/-/g, '')}">${esc(em.duty)}</a><br><span class="xs muted">Duty officer, urgent help only. In Korea: ${esc(em.dutyLocal)}</span></dd>
      <dt>Email</dt><dd><a href="mailto:${em.email}">${esc(em.email)}</a></dd>
      <dt>Address</dt><dd>${esc(em.address)} <button class="btn sm ghost icon-only" type="button" data-copy="${esc(em.address)}" aria-label="Copy address">${icon('copy', 'sm')}</button></dd>
      <dt>Hours</dt><dd class="small" style="font-weight:400">${esc(em.hours)}</dd></dl>
      <p class="note">Source: <a href="${em.source}" target="_blank" rel="noopener">Singapore Embassy in Seoul</a></p>`;
    $('#passport').innerHTML = `<h4 style="font-size:var(--t-md);margin-bottom:12px">If a passport is lost</h4><ol class="steps">${E.passport.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="acts" style="margin-top:12px"><a class="btn sm" href="https://www.ica.gov.sg/documents/passport/loss" target="_blank" rel="noopener">${icon('external', 'sm')}ICA: report a loss</a></div>
      <p class="note">Source: <a href="${E.passportSource}" target="_blank" rel="noopener">Singapore Embassy in Seoul</a></p>`;
    renderContacts(); renderAddresses();
    $('#phrases').innerHTML = E.phrases.map(([en, ko, rom]) => `<li><span>${esc(en)}</span><span><span class="ko" lang="ko">${esc(ko)}</span><small>${esc(rom)}</small></span><span class="acts" style="flex-wrap:nowrap">${'speechSynthesis' in window ? `<button class="btn sm ghost icon-only" type="button" data-say="${esc(ko)}" aria-label="Play ${esc(en)} in Korean">${icon('volume', 'sm')}</button>` : ''}<button class="btn sm ghost icon-only" type="button" data-copy="${esc(ko)}" aria-label="Copy ${esc(en)} in Korean">${icon('copy', 'sm')}</button></span></li>`).join('');
    $$('#essentials [data-copy]').forEach(b => b.onclick = () => copy(b.dataset.copy));
    $$('[data-say]').forEach(b => b.onclick = () => { const u = new SpeechSynthesisUtterance(b.dataset.say); u.lang = 'ko-KR'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); });
  }
  function renderContacts() {
    $('#contacts').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><h4 style="font-size:var(--t-md)">Our emergency contacts</h4><button class="btn sm" type="button" id="addContact">${icon('plus', 'sm')}Add</button></div>
      ${contacts.length ? `<ul class="phr">${contacts.map((c, i) => `<li><span><b>${esc(c.name)}</b><small>${esc(c.rel || '')}</small></span><a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}">${esc(c.phone)}</a><span class="acts" style="flex-wrap:nowrap"><button class="btn sm ghost icon-only" type="button" data-ec="${i}" aria-label="Edit ${esc(c.name)}">${icon('pen', 'sm')}</button></span></li>`).join('')}</ul>` : `<p class="small muted">Add family or friends to call in an emergency. Saved on this device only, never published.</p>`}`;
    $('#addContact').onclick = () => editContact(-1);
    $$('[data-ec]').forEach(b => b.onclick = () => editContact(+b.dataset.ec));
  }
  function editContact(i) {
    const c = contacts[i] || { name: '', rel: '', phone: '' };
    openDialog({ title: i < 0 ? 'Add contact' : 'Edit contact', extra: i >= 0 ? `<button class="btn danger grow" type="button" id="delC">${icon('trash', 'sm')}Delete</button>` : '',
      body: `<label class="field"><span>Name</span><input class="input" name="n" required value="${esc(c.name)}" autocomplete="off"></label><label class="field"><span>Relationship (optional)</span><input class="input" name="r" value="${esc(c.rel)}"></label><label class="field"><span>Phone, with country code</span><input class="input" name="p" type="tel" required value="${esc(c.phone)}" placeholder="+65 …"></label>`,
      onOpen: () => { const d = $('#delC'); if (d) d.onclick = () => { contacts.splice(i, 1); store.set('contacts', contacts); $('#dlg').close(); renderContacts(); toast('Contact removed'); }; },
      onSubmit: fd => { const rec = { name: String(fd.get('n')).trim(), rel: String(fd.get('r')).trim(), phone: String(fd.get('p')).trim() }; if (i < 0) contacts.push(rec); else contacts[i] = rec; store.set('contacts', contacts); renderContacts(); } });
  }
  function renderAddresses() {
    const air = docs.find(d => d.ref === 'hongdae'), f = (air && air.fields) || {};
    const rows = [
      { t: 'Lavalse Hotel, Busan', en: T.P.lavalse.addr, ko: T.P.lavalse.koAddr, q: T.P.lavalse.q },
      f.address || f.koAddress ? { t: 'Hongdae Airbnb, Seoul', en: f.address || '', ko: f.koAddress || '', q: f.address || f.koAddress, lock: true } : { t: 'Hongdae Airbnb, Seoul', missing: true },
      { t: 'Singapore Embassy', en: T.emergency.embassy.address, ko: '', q: 'Seoul Finance Center 136 Sejong-daero' }
    ];
    $('#addresses').innerHTML = `<h4 style="font-size:var(--t-md);margin-bottom:8px">Important addresses</h4>${rows.map(r => r.missing ? `<div class="addr"><div><small>${esc(r.t)}</small><b class="muted" style="font-weight:500">${icon('lock', 'sm')} Private. <a href="#wallet">Add it in your Wallet</a> to see it here.</b></div></div>` : `<div class="addr"><div><small>${esc(r.t)}${r.lock ? ' · from your Wallet' : ''}</small><b>${esc(r.en)}</b>${r.ko ? `<br><span lang="ko" class="small">${esc(r.ko)}</span>` : ''}</div><span class="acts" style="flex-wrap:nowrap"><button class="btn sm ghost icon-only" type="button" data-copy="${esc(r.ko || r.en)}" aria-label="Copy address">${icon('copy', 'sm')}</button><a class="btn sm ghost icon-only" href="${links.google(r.q)}" target="_blank" rel="noopener" aria-label="Open in Google Maps">${icon('pin', 'sm')}</a></span></div>`).join('')}`;
    $$('#addresses [data-copy]').forEach(b => b.onclick = () => copy(b.dataset.copy, 'Address copied'));
  }

  function init() {
    migrate(); renderPack();
    $('#addDoc').onclick = () => editDoc(null, null);
    $('#walletBackup').onclick = walletBackup;
    $('#walletRestore').onclick = walletRestore;
    on('wallet:edit', ref => { const d = docs.find(x => x.ref === ref); editDoc(d || null, ref); });
    on('wallet', () => renderAddresses());
    renderEmergency();
    loadWallet();
  }
  return { init };
})();
