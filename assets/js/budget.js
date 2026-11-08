/* =====================================================================
   KOREA 2027 — budget & expense tracker (saved on this device)
   ===================================================================== */
window.K27Budget = (() => {
  'use strict';
  const { T, $, $$, esc, icon, store, uid, toast, openDialog, confirmDialog, download, dateLabel, ymd, on, emit, reduce } = K27;
  const CATS = [
    { id: 'stay', name: 'Accommodation', icon: 'bed', c: '#527D95' },
    { id: 'food', name: 'Food & drinks', icon: 'utensils', c: '#B7832F' },
    { id: 'transport', name: 'Transport', icon: 'train', c: '#39866B' },
    { id: 'shopping', name: 'Shopping', icon: 'bag', c: '#8B6BB0' },
    { id: 'activities', name: 'Activities', icon: 'landmark', c: '#C0605B' },
    { id: 'other', name: 'Other', icon: 'more', c: '#647782' }
  ];
  const cat = id => CATS.find(c => c.id === id) || CATS[5];
  let list = store.get('expenses', []);
  let budget = store.get('budget', null); // { sgd }
  let filter = 'all';
  const save = () => { store.set('expenses', list); emit('budget'); };
  const rateNow = () => { const r = window.K27Info && K27Info.currentRate(); return r ? r.r : null; };
  const toSGD = e => e.cur === 'SGD' ? e.amount : ((e.rate || rateNow()) ? e.amount / (e.rate || rateNow()) : null);
  const toKRW = e => e.cur === 'KRW' ? e.amount : ((e.rate || rateNow()) ? e.amount * (e.rate || rateNow()) : null);
  const sgd = v => 'S$' + (v || 0).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const krw = v => '₩' + Math.round(v || 0).toLocaleString('en-SG');

  function totals() {
    let s = 0, k = 0, missing = 0; const byCat = {}, byDay = {};
    list.forEach(e => {
      const a = toSGD(e), b = toKRW(e);
      if (a == null) { missing++; return; }
      s += a; k += b; byCat[e.cat] = (byCat[e.cat] || 0) + a; byDay[e.date] = (byDay[e.date] || 0) + a;
    });
    return { s, k, missing, byCat, byDay };
  }
  function totalSGD() { return list.length ? totals().s : null; }
  function dayTotal(date) { const l = list.filter(e => e.date === date); let s = 0; l.forEach(e => { const a = toSGD(e); if (a != null) s += a; }); return { n: l.length, sgd: s }; }

  function render() {
    const t = totals();
    const days = Object.keys(t.byDay).length;
    const rem = budget && budget.sgd ? budget.sgd - t.s : null;
    $('#kpis').innerHTML = `
      <div class="card kpi"><small>Total spent</small><b>${sgd(t.s)}</b><span class="sub">${krw(t.k)}${t.missing ? ` · ${t.missing} not converted` : ''}</span></div>
      <div class="card kpi ${rem != null && rem < 0 ? 'over' : ''}"><small>Budget remaining</small>${budget && budget.sgd ? `<b>${sgd(rem)}</b><div class="bar"><i style="width:${Math.min(100, t.s / budget.sgd * 100)}%;${rem < 0 ? 'background:var(--red)' : ''}"></i></div><span class="sub">of ${sgd(budget.sgd)}</span>` : `<b class="muted">—</b><button class="btn sm" type="button" data-setbudget style="margin-top:6px">Set a budget</button>`}</div>
      <div class="card kpi"><small>Average per spending day</small><b>${days ? sgd(t.s / days) : '—'}</b><span class="sub">${days ? `over ${days} ${days === 1 ? 'day' : 'days'}` : 'no spending yet'}</span></div>
      <div class="card kpi"><small>Entries</small><b>${list.length}</b><span class="sub">${list.length ? 'Top: ' + esc(cat(Object.entries(t.byCat).sort((a, b) => b[1] - a[1])[0]?.[0]).name) : 'Add your first expense'}</span></div>`;
    $$('[data-setbudget]').forEach(b => b.onclick = setBudget);
    // charts
    const total = t.s || 0, C = 2 * Math.PI * 54;
    let off = 0;
    const segs = CATS.filter(c => t.byCat[c.id]).map(c => { const v = t.byCat[c.id], len = total ? v / total * C : 0, s = `<circle r="54" cx="75" cy="75" stroke="${c.c}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}"/>`; off += len; return s; }).join('');
    const tripDates = T.days.map(d => d.date);
    const other = Object.entries(t.byDay).filter(([d]) => !tripDates.includes(d)).reduce((a, [, v]) => a + v, 0);
    const bars = [...tripDates.map(d => ({ lbl: dateLabel(d, { day: 'numeric', month: 'short' }), v: t.byDay[d] || 0, today: d === ymd() })), ...(other ? [{ lbl: 'Other dates', v: other }] : [])];
    const max = Math.max(1, ...bars.map(b => b.v));
    $('#charts').innerHTML = list.length ? `
      <div class="card chart"><h4>By category</h4><div class="donut-wrap">
        <svg class="donut" viewBox="0 0 150 150" role="img" aria-label="Spending by category"><circle r="54" cx="75" cy="75" stroke="var(--bg-2)"/><g transform="rotate(-90 75 75)">${segs}</g><text x="75" y="72" text-anchor="middle" font-size="17">${sgd(total).replace('.00', '')}</text><text x="75" y="92" text-anchor="middle" font-size="10" fill="var(--muted)" style="font-family:var(--f-ui);font-weight:500">total</text></svg>
        <ul class="clegend">${CATS.filter(c => t.byCat[c.id]).sort((a, b) => t.byCat[b.id] - t.byCat[a.id]).map(c => `<li style="--c:${c.c}"><i></i>${c.name}<span>${sgd(t.byCat[c.id])} · ${Math.round(t.byCat[c.id] / total * 100)}%</span></li>`).join('')}</ul></div></div>
      <div class="card chart"><h4>By day (S$)</h4><div class="bars" role="img" aria-label="Spending per day">${bars.map(b => `<div class="b ${b.today ? 'today' : ''}"><span>${b.v ? Math.round(b.v) : ''}</span><i data-h="${b.v / max * 100}"></i><small>${esc(b.lbl)}</small></div>`).join('')}</div></div>`
      : `<div class="card empty" style="grid-column:1/-1">${icon('coins')}No expenses yet. Tap <b>Add expense</b> to log your first one. Charts appear here as you go.</div>`;
    requestAnimationFrame(() => $$('#charts .bars i').forEach(i => i.style.height = (reduce ? i.dataset.h : i.dataset.h) + '%'));
    // filters + list
    $('#expFilters').innerHTML = [{ id: 'all', name: 'All' }, ...CATS].map(c => `<button class="chip" type="button" data-f="${c.id}" aria-pressed="${filter === c.id}">${esc(c.name)}</button>`).join('');
    $$('#expFilters .chip').forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });
    const shown = list.filter(e => filter === 'all' || e.cat === filter).sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
    if (!shown.length) { $('#expList').innerHTML = `<div class="empty">${icon('coins')}${list.length ? 'Nothing in this category yet.' : 'Your expenses will be listed here, grouped by day.'}</div>`; return; }
    const groups = {}; shown.forEach(e => (groups[e.date] = groups[e.date] || []).push(e));
    $('#expList').innerHTML = Object.entries(groups).map(([d, es]) => {
      const dsum = es.reduce((a, e) => a + (toSGD(e) || 0), 0);
      const dn = T.days.find(x => x.date === d);
      return `<div style="padding:0 var(--s4)"><div class="exp-day"><span>${dn ? `Day ${dn.n} · ` : ''}${dateLabel(d, { weekday: 'short', day: 'numeric', month: 'short', year: d.startsWith('2027') ? undefined : 'numeric' })}</span><span class="num">${sgd(dsum)}</span></div></div>
        ${es.map(e => { const c = cat(e.cat), a = toSGD(e); return `<button class="exp" type="button" data-id="${e.id}" style="--c:${c.c};width:100%;text-align:left">
          <span class="cat">${icon(c.icon, 'sm')}</span><span style="min-width:0"><b>${esc(e.desc || c.name)}</b><small>${c.name}${e.notes ? ' · ' + esc(e.notes) : ''}</small></span>
          <span class="amt">${e.cur === 'KRW' ? krw(e.amount) : sgd(e.amount)}<small class="muted">${a == null ? 'no rate' : e.cur === 'KRW' ? '≈ ' + sgd(a) : '≈ ' + krw(toKRW(e))}</small></span><span class="muted">${icon('chevron-right', 'sm')}</span></button>`; }).join('')}`;
    }).join('');
    $$('#expList .exp').forEach(b => b.onclick = () => edit(list.find(e => e.id === b.dataset.id)));
  }

  function edit(e) {
    const isNew = !e;
    const today = ymd(), def = T.days.some(d => d.date === today) ? today : today;
    e = e || { id: uid(), amount: '', cur: 'KRW', cat: 'food', desc: '', date: def, notes: '' };
    let cur = e.cur, ct = e.cat;
    openDialog({
      title: isNew ? 'Add expense' : 'Edit expense', submit: isNew ? 'Add expense' : 'Save changes',
      extra: isNew ? '' : `<button class="btn danger grow" type="button" id="delExp">${icon('trash', 'sm')}Delete</button>`,
      body: `<div class="row2" style="align-items:end"><label class="field"><span>Amount</span><input class="input num" name="amount" inputmode="decimal" required value="${e.amount}" placeholder="0" autocomplete="off"></label>
          <div class="field"><span>Currency</span><div class="seg" id="curSeg"><button type="button" data-c="KRW" aria-pressed="${cur === 'KRW'}">₩ KRW</button><button type="button" data-c="SGD" aria-pressed="${cur === 'SGD'}">S$ SGD</button></div></div></div>
        <p class="xs muted" id="conv"></p>
        <div class="field"><span>Category</span><div class="catpick" id="catPick">${CATS.map(c => `<button type="button" data-c="${c.id}" style="--c:${c.c}" aria-pressed="${ct === c.id}">${icon(c.icon)}${c.name}</button>`).join('')}</div></div>
        <label class="field"><span>Description</span><input class="input" name="desc" value="${esc(e.desc)}" placeholder="e.g. Tteokbokki at Gwangjang" maxlength="120"></label>
        <div class="row2"><label class="field"><span>Date</span><input class="input" type="date" name="date" required value="${e.date}"></label>
          <label class="field"><span>Notes (optional)</span><input class="input" name="notes" value="${esc(e.notes)}" maxlength="200"></label></div>`,
      onOpen: f => {
        const conv = () => { const v = parseFloat(String(f.amount.value).replace(/[^\d.]/g, '')); const r = rateNow(); $('#conv').textContent = v && r ? (cur === 'KRW' ? `≈ ${sgd(v / r)} at today's rate` : `≈ ${krw(v * r)} at today's rate`) : (v && !r ? 'No exchange rate available, so this will be totalled in its own currency until a rate is available.' : ''); };
        $$('#curSeg button').forEach(b => b.onclick = () => { cur = b.dataset.c; $$('#curSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); conv(); });
        $$('#catPick button').forEach(b => b.onclick = () => { ct = b.dataset.c; $$('#catPick button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
        f.amount.addEventListener('input', conv); conv();
        const del = $('#delExp'); if (del) del.onclick = async () => { $('#dlg').close(); const old = { ...e }; list = list.filter(x => x.id !== e.id); save(); render(); toast('Expense deleted', { label: 'Undo', fn: () => { list.push(old); save(); render(); } }, 6000); };
      },
      onSubmit: fd => {
        const amount = parseFloat(String(fd.get('amount')).replace(/[^\d.]/g, ''));
        if (!(amount > 0)) { toast('Enter an amount greater than zero'); return false; }
        const r = rateNow();
        const rec = { ...e, amount, cur, cat: ct, desc: String(fd.get('desc')).trim(), date: fd.get('date'), notes: String(fd.get('notes')).trim(), rate: e.rate || r || null, created: e.created || Date.now() };
        if (isNew) list.push(rec); else list = list.map(x => x.id === rec.id ? rec : x);
        save(); render(); toast(isNew ? 'Expense added' : 'Expense updated');
      }
    });
  }
  function setBudget() {
    openDialog({ title: 'Trip budget', submit: 'Save budget', body: `<label class="field"><span>Total budget in S$</span><input class="input num" name="b" inputmode="decimal" value="${budget && budget.sgd ? budget.sgd : ''}" placeholder="e.g. 2500"></label><p class="xs muted">Used for the remaining-budget figure. Leave empty to remove.</p>`,
      onSubmit: fd => { const v = parseFloat(fd.get('b')); budget = v > 0 ? { sgd: v } : null; store.set('budget', budget); render(); emit('budget'); } });
  }
  function csv() {
    if (!list.length) { toast('No expenses to export yet'); return; }
    const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const rows = [['Date', 'Description', 'Category', 'Amount', 'Currency', 'SGD equivalent', 'KRW equivalent', 'Rate used (KRW per SGD)', 'Notes']];
    [...list].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => { const a = toSGD(e), b = toKRW(e); rows.push([e.date, e.desc, cat(e.cat).name, e.amount, e.cur, a == null ? '' : a.toFixed(2), b == null ? '' : Math.round(b), e.rate || rateNow() || '', e.notes]); });
    download('korea-2027-expenses.csv', '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv');
    toast('CSV downloaded');
  }
  // full-app backup (expenses, budget, packing, itinerary notes, contacts, rate override)
  const KEYS = ['expenses', 'budget', 'packing', 'itin', 'contacts', 'fx.override'];
  function backupMenu() {
    openDialog({ title: 'Backup & restore', submit: null, body: `<p class="small">A backup file holds your expenses, budget, packing list, itinerary notes and emergency contacts. Wallet and journal have their own backups because they can include files.</p>
      <div class="acts"><button class="btn primary" type="button" id="bk">${icon('download', 'sm')}Download backup</button><button class="btn" type="button" id="rs">${icon('upload', 'sm')}Restore from file</button></div>`,
      onOpen: () => {
        $('#bk').onclick = () => { const data = { app: 'korea-2027', version: 1, saved: new Date().toISOString() }; KEYS.forEach(k => data[k] = store.get(k)); download(`korea-2027-backup-${ymd()}.json`, JSON.stringify(data, null, 2)); toast('Backup downloaded'); };
        $('#rs').onclick = () => { const inp = $('#restoreInput'); inp.onchange = async () => { const f = inp.files[0]; inp.value = ''; if (!f) return; try { const d = JSON.parse(await f.text()); if (d.app !== 'korea-2027') throw 0;
          $('#dlg').close();
          const ok = await confirmDialog(`Restore the backup from ${d.saved ? new Date(d.saved).toLocaleString('en-SG') : 'this file'}? It replaces your current expenses, budget, packing list, itinerary notes and contacts on this device.`, 'Restore', false);
          if (!ok) return; KEYS.forEach(k => { if (d[k] !== undefined) d[k] === null ? store.del(k) : store.set(k, d[k]); }); toast('Backup restored. Reloading…'); setTimeout(() => location.reload(), 900);
        } catch (e) { toast('That file isn’t a Korea 2027 backup'); } }; inp.click(); };
      } });
  }

  function init() {
    $('#addExp').onclick = () => edit(null);
    $('#budgetBtn').onclick = setBudget;
    $('#csvBtn').onclick = csv;
    $('#expMore').onclick = backupMenu;
    render();
    on('fx', render);
  }
  return { init, totalSGD, dayTotal, CATS };
})();
