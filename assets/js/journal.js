/* =====================================================================
   KOREA 2027 — photo journal (IndexedDB, compressed on device)
   ===================================================================== */
window.K27Journal = (() => {
  'use strict';
  const { T, $, $$, esc, icon, idb, uid, toast, openDialog, confirmDialog, download, ymd, dateLabel } = K27;
  let photos = [], notes = {}, urls = new Map(), ok = true, lbList = [], lbIdx = 0;

  async function load() {
    try { photos = await idb.all('photos'); notes = Object.fromEntries((await idb.all('reflections')).map(r => [r.date, r])); }
    catch (e) { ok = false; }
    render();
  }
  const url = p => { if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob)); return urls.get(p.id); };
  const defDate = () => { const t = ymd(); return t; };
  const dayOf = d => T.days.find(x => x.date === d);

  function render() {
    const v = $('#journalView');
    if (!ok) { v.innerHTML = `<div class="card empty">${icon('alert')}This browser doesn't allow saving photos here (for example in some private-browsing modes).</div>`; return; }
    const dates = [...new Set([...photos.map(p => p.date), ...Object.keys(notes)])].sort();
    if (!dates.length) { v.innerHTML = `<div class="card empty">${icon('camera')}No memories yet. Add photos or write a few lines about the day. Everything stays on this device until you export it.</div>`; return; }
    v.innerHTML = dates.map(d => {
      const ps = photos.filter(p => p.date === d).sort((a, b) => a.created - b.created), dn = dayOf(d);
      return `<section class="jday"><h4>${dn ? `Day ${dn.n}` : 'Memories'} <small>${dateLabel(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${dn ? ' · ' + esc(dn.city) : ''}</small></h4>
        ${notes[d] ? `<p class="reflect">${esc(notes[d].text)}</p><button class="btn sm ghost" type="button" data-edit-note="${d}" style="margin:-8px 0 12px">${icon('pen', 'sm')}Edit note</button>` : ''}
        ${ps.length ? `<div class="masonry">${ps.map(p => `<figure class="photo-card"><button class="img" type="button" data-open="${p.id}" aria-label="Open photo${p.caption ? ': ' + esc(p.caption) : ''}"><img src="${url(p)}" alt="${esc(p.caption || 'Trip photo')}" width="${p.w}" height="${p.h}" loading="lazy"></button>${p.caption ? `<figcaption class="cap">${esc(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div>` : ''}</section>`;
    }).join('');
    $$('[data-open]', v).forEach(b => b.onclick = () => { lbList = photos.slice().sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created); openLB(lbList.findIndex(p => p.id === b.dataset.open)); });
    $$('[data-edit-note]', v).forEach(b => b.onclick = () => write(b.dataset.editNote));
  }

  async function compress(file) {
    let bmp;
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); }); }
    const max = 1600, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * s), h = Math.round(bmp.height * s);
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .82));
    return { blob, w, h };
  }
  function addPhotos(fileList) {
    const filesArr = [...fileList].filter(f => f.type.startsWith('image/'));
    if (!filesArr.length) return;
    const guess = ymd(new Date(filesArr[0].lastModified || Date.now()));
    openDialog({ title: `Add ${filesArr.length} ${filesArr.length === 1 ? 'photo' : 'photos'}`, submit: 'Add to journal',
      body: `<label class="field"><span>Date</span><input class="input" type="date" name="d" required value="${guess}"></label>
        <label class="field"><span>Caption (optional, applies to all)</span><input class="input" name="c" maxlength="140"></label>
        <p class="xs muted">Photos are resized to 1600px and saved on this device.</p>`,
      onSubmit: async fd => {
        toast('Saving photos…');
        let n = 0;
        for (const f of filesArr) {
          try { const { blob, w, h } = await compress(f); await idb.put('photos', { id: uid(), date: fd.get('d'), caption: String(fd.get('c')).trim(), blob, w, h, created: Date.now() + n }); n++; }
          catch (e) { toast(`Couldn’t add ${f.name}`); }
        }
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
        toast(`Added ${n} ${n === 1 ? 'photo' : 'photos'}`); load();
      } });
  }
  function write(date) {
    const d = date || (dayOf(ymd()) ? ymd() : T.days[0].date);
    openDialog({ title: 'Write about the day', submit: 'Save',
      body: `<label class="field"><span>Date</span><input class="input" type="date" name="d" required value="${d}"></label>
        <label class="field"><span>Reflection</span><textarea class="input" name="t" rows="6" maxlength="4000" placeholder="What stood out today?">${esc((notes[d] && notes[d].text) || '')}</textarea></label>`,
      onOpen: f => { f.d.onchange = () => { f.t.value = (notes[f.d.value] && notes[f.d.value].text) || ''; }; },
      onSubmit: async fd => { const dd = fd.get('d'), t = String(fd.get('t')).trim(); if (t) await idb.put('reflections', { date: dd, text: t, updated: Date.now() }); else await idb.del('reflections', dd); toast('Saved'); load(); } });
  }

  function openLB(i) {
    lbIdx = (i + lbList.length) % lbList.length; const p = lbList[lbIdx], lb = $('#lightbox');
    lb.querySelector('img').src = url(p); lb.querySelector('img').alt = p.caption || 'Trip photo';
    lb.querySelector('.cap').innerHTML = `${esc(p.caption || '')} <span style="opacity:.7">${dateLabel(p.date)}</span> <button class="btn sm" type="button" id="lbEdit" style="margin-left:8px;background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.2)">${icon('pen', 'sm')}Edit</button>`;
    lb.classList.add('open'); lb.querySelector('.x').focus();
    $('#lbEdit').onclick = () => { closeLB(); editPhoto(p); };
  }
  const closeLB = () => $('#lightbox').classList.remove('open');
  function editPhoto(p) {
    openDialog({ title: 'Edit photo', extra: `<button class="btn danger grow" type="button" id="delP">${icon('trash', 'sm')}Delete</button>`,
      body: `<img src="${url(p)}" alt="" style="border-radius:8px;max-height:220px;object-fit:cover;width:100%"><label class="field"><span>Caption</span><input class="input" name="c" value="${esc(p.caption || '')}" maxlength="140"></label><label class="field"><span>Date</span><input class="input" type="date" name="d" value="${p.date}" required></label>`,
      onOpen: () => { $('#delP').onclick = async () => { $('#dlg').close(); if (!(await confirmDialog('Delete this photo from the journal on this device?'))) return; await idb.del('photos', p.id); URL.revokeObjectURL(urls.get(p.id)); urls.delete(p.id); toast('Photo deleted'); load(); }; },
      onSubmit: async fd => { await idb.put('photos', { ...p, caption: String(fd.get('c')).trim(), date: fd.get('d') }); load(); } });
  }

  const b64 = async blob => { const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); };
  function menu() {
    openDialog({ title: 'Journal backup', submit: null, body: `<p class="small">Export everything (photos and notes) as one file, or restore from an earlier export. Restoring adds to what's here and doesn't delete anything.</p><p class="small muted" id="jsz"></p>
      <div class="acts"><button class="btn primary" type="button" id="jex">${icon('download', 'sm')}Export journal</button><button class="btn" type="button" id="jim">${icon('upload', 'sm')}Restore</button></div>`,
      onOpen: async () => {
        if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); $('#jsz').textContent = `${photos.length} photos · this site is using about ${(e.usage / 1048576).toFixed(1)} MB of storage on this device.`; }
        $('#jex').onclick = async () => {
          if (!photos.length && !Object.keys(notes).length) { toast('Nothing to export yet'); return; }
          toast('Preparing export…');
          const data = { app: 'korea-2027-journal', version: 1, saved: new Date().toISOString(), notes: Object.values(notes), photos: [] };
          for (const p of photos) data.photos.push({ id: p.id, date: p.date, caption: p.caption, w: p.w, h: p.h, created: p.created, data: await b64(p.blob) });
          download(`korea-2027-journal-${ymd()}.json`, JSON.stringify(data)); toast('Journal exported');
        };
        $('#jim').onclick = () => { const inp = $('#restoreInput'); inp.onchange = async () => { const f = inp.files[0]; inp.value = ''; if (!f) return; try { const d = JSON.parse(await f.text()); if (d.app !== 'korea-2027-journal') throw 0;
          for (const n of d.notes || []) await idb.put('reflections', n);
          for (const p of d.photos || []) await idb.put('photos', { id: p.id, date: p.date, caption: p.caption, w: p.w, h: p.h, created: p.created, blob: new Blob([Uint8Array.from(atob(p.data), c => c.charCodeAt(0))], { type: 'image/jpeg' }) });
          $('#dlg').close(); toast(`Restored ${(d.photos || []).length} photos`); load(); } catch (e) { toast('That file isn’t a journal export'); } }; inp.click(); };
      } });
  }

  function init() {
    const inp = $('#photoInput'); inp.onchange = () => { addPhotos(inp.files); inp.value = ''; };
    $('#reflectBtn').onclick = () => write();
    $('#journalMore').onclick = menu;
    const lb = $('#lightbox');
    lb.querySelector('.x').onclick = closeLB;
    lb.onclick = e => { if (e.target === lb) closeLB(); };
    addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') openLB(lbIdx + 1); if (e.key === 'ArrowLeft') openLB(lbIdx - 1); });
    load();
  }
  return { init };
})();
