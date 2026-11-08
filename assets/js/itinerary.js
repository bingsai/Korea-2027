/* =====================================================================
   KOREA 2027 — itinerary: editorial days, activity timeline, Today mode
   ===================================================================== */
window.K27Itin = (() => {
  'use strict';
  const { T, $, $$, esc, icon, store, links, mapButtons, photo, credit, dateLabel, fmt, hhmm, tripPhase, copy, toast, debounce, on, emit, reduce, KST, SGT } = K27;
  const S = Object.assign({ done: {}, notes: {} }, store.get('itin') || {});
  const save = () => store.set('itin', S);
  const METHOD = { flight: ['plane', 'Flight'], subway: ['train', 'Subway / rail'], ktx: ['ktx', 'KTX'], taxi: ['car', 'Taxi'], 'taxi or bus': ['bus', 'Taxi or bus'], bus: ['bus', 'Bus'], walk: ['walk', 'Walk'] };
  const STATUS = { confirmed: 'Confirmed', planned: 'Planned', optional: 'Optional' };
  let cur = 1, wx = {}, open = new Set();

  function dayForToday() { const p = tripPhase(); return p.phase === 'during' ? p.day.n : 1; }
  function statusOf(it, now = new Date()) {
    if (!it.start || !it.end) return null;
    const s = new Date(it.start), e = new Date(it.end);
    if (now >= s && now <= e) return 'now';
    return null;
  }
  function nextTimed(d, now = new Date()) { return d.items.find(it => it.start && new Date(it.start) > now); }

  function renderTabs() {
    const today = tripPhase().phase === 'during' ? tripPhase().day.n : null;
    $('#daytabs').innerHTML = T.days.map(d => `<button class="daytab" role="tab" type="button" id="tab-${d.n}" aria-controls="dayView" aria-selected="${d.n === cur}" tabindex="${d.n === cur ? 0 : -1}" data-n="${d.n}">
      <small>Day ${d.n}${d.n === today ? '<span class="today-dot" title="Today"></span>' : ''}</small><b>${dateLabel(d.date, { weekday: 'short', day: 'numeric' })}</b><span>${esc(d.city)}</span></button>`).join('');
    $$('#daytabs .daytab').forEach(b => {
      b.onclick = () => show(+b.dataset.n, true);
      b.onkeydown = e => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); const n = Math.min(8, Math.max(1, cur + k)); show(n, true); $(`#tab-${n}`).focus(); } };
    });
  }

  function weatherChip(d) {
    const city = d.city.startsWith('Busan') ? 'busan' : 'seoul';
    const day = wx[city] && wx[city].daily && wx[city].daily[d.date];
    if (!day) return '';
    return `<span class="wx-chip">${icon(K27Info.wxIcon(day.code), 'sm')}<b class="num">${Math.round(day.max)}° / ${Math.round(day.min)}°</b><small>${esc(K27Info.wxText(day.code))}${day.pop != null ? ` · ${day.pop}% precip.` : ''}</small></span>`;
  }

  function actHTML(d, it, i) {
    const st = statusOf(it), done = !!S.done[it.id], m = METHOD[it.method];
    const place = it.place;
    const nxt = d.items[i + 1];
    const facts = [];
    if (place) facts.push(`<div><small>Location</small>${esc(place.en)}${place.ko ? `<br><span lang="ko">${esc(place.ko)}</span>` : ''}</div>`);
    if (place && place.koAddr) facts.push(`<div><small>Korean address</small><span lang="ko">${esc(place.koAddr)}</span></div>`);
    if (m) facts.push(`<div><small>Getting there</small>${m[1]}</div>`);
    if (it.duration) facts.push(`<div><small>Duration</small>${esc(it.duration)}</div>`);
    if (it.start) facts.push(`<div><small>Scheduled</small>${hhmm(it.start, it.start.endsWith('+08:00') ? SGT : KST)} ${it.start.endsWith('+08:00') ? 'SGT' : 'KST'}${it.end ? ` – ${hhmm(it.end, it.end.endsWith('+08:00') ? SGT : KST)} ${it.end.endsWith('+08:00') ? 'SGT' : 'KST'}` : ''}</div>`);
    facts.push(`<div><small>Status</small>${STATUS[it.status]}${it.todo ? ` · <span class="flag">${icon('alert', 'sm')}${esc(it.todo)}</span>` : ''}</div>`);
    if (nxt && nxt.place && place && nxt.place !== place) facts.push(`<div><small>Next stop</small>${esc(nxt.place.en)}<br><a href="${links.dir(nxt.place.q || nxt.place.en)}" target="_blank" rel="noopener" class="xs">Travel time on Google Maps</a></div>`);
    const isOpen = open.has(it.id);
    return `<li class="act s-${it.status} ${done ? 'done' : ''} ${st === 'now' ? 'now' : ''}" id="act-${it.id}">
      <span class="time">${esc(it.time)}</span><span class="node"><i></i></span>
      <div class="act-card" data-open="${isOpen}">
        <button class="act-sum" type="button" aria-expanded="${isOpen}" aria-controls="more-${it.id}">
          <span class="tx"><b>${esc(it.title)}</b><span class="meta"><span class="badge ${it.status}">${STATUS[it.status]}</span>${m ? `<span class="xs muted" style="display:inline-flex;align-items:center;gap:4px">${icon(m[0], 'sm')}${m[1]}</span>` : ''}${st === 'now' ? `<span class="tag-now">${icon('clock', 'sm')}Now</span>` : ''}${it.todo ? `<span class="flag">${icon('alert', 'sm')}${esc(it.todo)}</span>` : ''}${S.notes[it.id] ? `<span class="xs muted" style="display:inline-flex;align-items:center;gap:4px">${icon('pen', 'sm')}Note</span>` : ''}</span></span>
          <span class="chev">${icon('chevron')}</span>
        </button>
        <div class="act-more" id="more-${it.id}"><div><div class="in">
          ${it.desc ? `<p>${esc(it.desc)}</p>` : ''}
          ${it.note ? `<p class="flag" style="font-weight:500">${icon('info', 'sm')}${esc(it.note)}</p>` : ''}
          <div class="facts">${facts.join('')}</div>
          <div class="acts">
            <button class="btn sm ${done ? 'ok' : ''}" type="button" data-done="${it.id}" aria-pressed="${done}">${icon(done ? 'check-circle' : 'check', 'sm')}${done ? 'Done' : 'Mark done'}</button>
            ${mapButtons(place)}
            ${place ? `<a class="btn sm" href="${links.dir(place.q || place.en)}" target="_blank" rel="noopener">${icon('nav', 'sm')}Directions</a>` : ''}
            ${place && place.ko ? `<button class="btn sm" type="button" data-copy="${esc(place.koAddr || place.ko)}">${icon('copy', 'sm')}Copy ${place.koAddr ? 'Korean address' : 'Korean name'}</button>` : ''}
            ${place && place !== T.P.SIN ? `<button class="btn sm ghost" type="button" data-map="${esc(Object.keys(T.P).find(k => T.P[k] === place) || place.en)}">${icon('map', 'sm')}On the map</button>` : ''}
          </div>
          <label class="field mynote"><span>My notes (saved on this device)</span><textarea class="input" rows="2" data-note="${it.id}" placeholder="Add a note…">${esc(S.notes[it.id] || '')}</textarea></label>
        </div></div></div>
      </div></li>`;
  }

  function show(n, user = false) {
    cur = n;
    $$('#daytabs .daytab').forEach(b => { const on = +b.dataset.n === n; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    const tab = $(`#tab-${n}`); if (tab && user) tab.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    const d = T.days[n - 1];
    const counts = d.items.reduce((a, it) => (a[it.status] = (a[it.status] || 0) + 1, a), {});
    const doneN = d.items.filter(it => S.done[it.id]).length;
    const spend = window.K27Budget ? K27Budget.dayTotal(d.date) : null;
    const nt = nextTimed(d);
    const ph = tripPhase();
    $('#dayView').innerHTML = `<article class="day" role="tabpanel" aria-labelledby="tab-${n}">
      <div class="day-hero">${photo(d.photo, '(max-width:1180px) 100vw, 1130px')}<span class="credit">${credit(d.photo)}</span>
        <div class="cap"><div><p class="dn">Day ${d.n} · ${dateLabel(d.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(d.city)}</p><h3>${esc(d.headline)}</h3></div>${weatherChip(d)}</div></div>
      <div class="day-body">
        <aside class="day-aside">
          <p>${esc(d.blurb)}</p>
          <dl>
            <dt>City</dt><dd>${esc(d.city)}</dd>
            <dt>Sleeping at</dt><dd>${esc(d.sleep)}</dd>
            <dt>Activities</dt><dd>${d.items.length}${counts.confirmed ? ` · ${counts.confirmed} confirmed` : ''}${counts.optional ? ` · ${counts.optional} optional` : ''}</dd>
            <dt>Spent</dt><dd>${spend && spend.n ? `S$${spend.sgd.toFixed(2)} <span class="muted">(${spend.n} ${spend.n === 1 ? 'entry' : 'entries'})</span>` : '<span class="muted">Nothing logged</span>'}</dd>
            ${ph.phase === 'during' && ph.day.n === n && nt ? `<dt>Next</dt><dd>${esc(nt.title)}, ${esc(nt.time)}</dd>` : ''}
          </dl>
          <div class="day-progress"><div style="display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--muted);margin-bottom:6px"><span>Done</span><span class="num">${doneN} of ${d.items.length}</span></div><div class="bar"><i style="width:${doneN / d.items.length * 100}%"></i></div></div>
          <div class="acts" style="margin-top:var(--s5)">
            <button class="btn sm" type="button" data-step="-1" ${n === 1 ? 'disabled' : ''}>${icon('chevron-left', 'sm')}Day ${n - 1 || ''}</button>
            <button class="btn sm" type="button" data-step="1" ${n === 8 ? 'disabled' : ''}>Day ${n < 8 ? n + 1 : ''}${icon('chevron-right', 'sm')}</button>
          </div>
        </aside>
        <ol class="tl">${d.items.map((it, i) => actHTML(d, it, i)).join('')}</ol>
      </div></article>`;
    wire();
  }

  function wire() {
    const v = $('#dayView');
    $$('.act-sum', v).forEach(b => b.onclick = () => {
      const card = b.closest('.act-card'), id = b.getAttribute('aria-controls').slice(5), o = card.dataset.open !== 'true';
      card.dataset.open = o; b.setAttribute('aria-expanded', o); o ? open.add(id) : open.delete(id);
    });
    $$('[data-done]', v).forEach(b => b.onclick = () => {
      const id = b.dataset.done; S.done[id] = !S.done[id]; if (!S.done[id]) delete S.done[id]; save();
      const sy = scrollY; show(cur); scrollTo(0, sy);
      toast(S.done[id] ? 'Marked as done' : 'Marked as not done');
      emit('itin');
    });
    $$('[data-copy]', v).forEach(b => b.onclick = () => copy(b.dataset.copy, 'Copied. Show it to the driver or paste it into Naver Map.'));
    $$('[data-map]', v).forEach(b => b.onclick = () => emit('map:focus', b.dataset.map));
    $$('[data-step]', v).forEach(b => b.onclick = () => { show(cur + +b.dataset.step, true); $('#itinerary').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
    const saveNote = debounce((id, val) => { if (val.trim()) S.notes[id] = val; else delete S.notes[id]; save(); }, 400);
    $$('[data-note]', v).forEach(t => t.oninput = () => saveNote(t.dataset.note, t.value));
  }

  function goto(id) {
    const d = T.days.find(dd => dd.items.some(it => it.id === id)); if (!d) return;
    open.add(id); show(d.n, true);
    const el = $('#act-' + id);
    if (el) { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); el.querySelector('.act-card').style.boxShadow = '0 0 0 3px var(--accent-soft)'; setTimeout(() => el.querySelector('.act-card').style.boxShadow = '', 1600); }
  }

  function init() {
    cur = dayForToday();
    renderTabs(); show(cur);
    on('goto', goto);
    on('weather', data => { wx = data; show(cur); });
    on('budget', () => show(cur));
    document.addEventListener('click', e => { const a = e.target.closest('[data-goto-day]'); if (a) { show(+a.dataset.gotoDay, true); } });
    // refresh "now" highlighting every minute during the trip
    setInterval(() => { if (tripPhase().phase === 'during') { const sy = scrollY; const ae = document.activeElement; if (!(ae && ae.matches('textarea'))) { show(cur); scrollTo(0, sy); } } }, 60000);
  }
  return { init, show, get S() { return S; } };
})();
