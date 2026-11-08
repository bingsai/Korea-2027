/* =====================================================================
   KOREA 2027 — stays, transport, weather (Open-Meteo), currency
   ===================================================================== */
window.K27Info = (() => {
  'use strict';
  const { T, $, $$, esc, icon, store, links, mapButtons, photo, credit, dateLabel, fmt, copy, toast, on, emit, openDialog, KST } = K27;

  /* ===================== STAYS ===================== */
  let docs = [];
  function stayDoc(id) { return docs.find(d => d.ref === id); }
  function renderStays() {
    $('#staysList').innerHTML = T.stays.map(s => {
      const doc = stayDoc(s.id), f = doc ? doc.fields || {} : {};
      const ciTime = s.checkIn ? fmt(s.checkIn, { hour: '2-digit', minute: '2-digit', hour12: false }) : (f.checkIn || null);
      const coTime = s.checkOut ? fmt(s.checkOut, { hour: '2-digit', minute: '2-digit', hour12: false }) : (f.checkOut || null);
      const ciDate = s.checkIn ? s.checkIn.slice(0, 10) : s.checkInDate, coDate = s.checkOut ? s.checkOut.slice(0, 10) : s.checkOutDate;
      const timesPending = !ciTime || !coTime;
      // address block: public for the hotel; from the wallet (device only) for the flat
      let addr = '';
      if (s.public) {
        addr = `<div class="addr"><div><small>Address</small><b>${esc(s.place.addr)}</b></div><button class="btn sm" type="button" data-copy="${esc(s.place.addr)}">${icon('copy', 'sm')}Copy</button></div>
                <div class="addr"><div><small>For the taxi driver</small><b lang="ko">${esc(s.place.koAddr)}</b></div><button class="btn sm" type="button" data-copy="${esc(s.place.koAddr)}">${icon('copy', 'sm')}Copy</button></div>`;
      } else if (f.address || f.koAddress) {
        addr = `${f.address ? `<div class="addr"><div><small>Address · ${icon('lock', 'sm')} from your Wallet</small><b>${esc(f.address)}</b></div><button class="btn sm" type="button" data-copy="${esc(f.address)}">${icon('copy', 'sm')}Copy</button></div>` : ''}
                ${f.koAddress ? `<div class="addr"><div><small>For the taxi driver</small><b lang="ko">${esc(f.koAddress)}</b></div><button class="btn sm" type="button" data-copy="${esc(f.koAddress)}">${icon('copy', 'sm')}Copy</button></div>` : ''}`;
      } else {
        addr = `<div class="private-note">${icon('lock', 'sm')}<div><b style="color:var(--text)">Exact address kept private.</b> It isn't published on the website. Add it to your Wallet and it will show here on this device only.</div></div>`;
      }
      const gLink = !s.public && f.google ? f.google : links.google(s.public ? s.place.q : (f.address || s.place.q));
      const nLink = !s.public && f.naver ? f.naver : links.naver(s.public ? s.place.ko : (f.koAddress || s.place.ko));
      return `<article class="card stay reveal in" id="stay-${s.id}">
        <div class="photo">${photo(s.photo, '(max-width:860px) 100vw, 45vw')}<span class="city">${esc(s.city)} · ${s.nights} nights</span><span class="credit">${credit(s.photo)}</span></div>
        <div class="body">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><h3>${esc(s.name)}</h3><p class="area">${esc(s.area)}</p></div>
            <div class="acts"><span class="badge confirmed">Booked</span>${timesPending ? '<span class="badge pending">Times to confirm</span>' : ''}${doc && f.ref ? `<span class="badge confirmed">${icon('lock', 'sm')}Ref in Wallet</span>` : ''}</div></div>
          <div class="dates">
            <div><small>Check-in</small><b>${dateLabel(ciDate)}</b><span class="small ${ciTime ? '' : 'muted'}">${ciTime || 'Time to add'}</span></div>
            <div class="nights">${icon('moon', 'sm')}<br>${s.nights} nights</div>
            <div class="r"><small>Check-out</small><b>${dateLabel(coDate)}</b><span class="small ${coTime ? '' : 'muted'}">${coTime || 'Time to add'}</span></div>
          </div>
          <p class="small"><span class="muted">Room:</span> ${esc(s.room)}</p>
          ${s.amenities.length ? `<div class="amen">${s.amenities.map(a => `<span>${esc(a)}</span>`).join('')}</div>` : ''}
          <ul class="notes">${s.notes.map(n => `<li>${esc(n)}</li>`).join('')}${f.instructions ? `<li>${icon('lock', 'sm')} ${esc(f.instructions)}</li>` : ''}</ul>
          <div>${addr}</div>
          <div class="acts">
            <a class="btn sm" href="${gLink}" target="_blank" rel="noopener">${icon('pin', 'sm')}Google Maps</a>
            <a class="btn sm" href="${nLink}" target="_blank" rel="noopener">${icon('map', 'sm')}Naver Map</a>
            <button class="btn sm" type="button" data-wallet="${s.id}">${icon('ticket', 'sm')}${doc ? 'Booking info' : (s.public ? 'Add booking info' : 'Add private details')}</button>
          </div>
        </div></article>`;
    }).join('');
    $$('#staysList [data-copy]').forEach(b => b.onclick = () => copy(b.dataset.copy, 'Address copied'));
    $$('#staysList [data-wallet]').forEach(b => b.onclick = () => emit('wallet:edit', b.dataset.wallet));
  }

  /* ===================== TRANSPORT ===================== */
  const MODE = { subway: 'train', ktx: 'ktx', taxi: 'car', walk: 'walk', bus: 'bus' };
  function renderTransport() {
    $('#journeys').innerHTML = T.journeys.map(j => `
      <article class="card jr reveal in">
        <span class="ic">${icon(MODE[j.modes[0]] || 'train')}</span>
        <div>
          <span class="daylbl">Day ${j.day} · ${dateLabel(T.days[j.day - 1].date)}</span>
          <h4>${esc(j.from)} ${icon('arrow', 'sm')} ${esc(j.to)}</h4>
          ${j.lines ? `<div class="lines">${j.lines.map(l => `<span class="line" style="--c:${l.color}"><i></i>${esc(l.name)}<span class="muted" style="font-weight:500">· ${esc(l.note)}</span></span>`).join('')}</div>` : ''}
          <dl>
            ${j.station ? `<div><dt>Station</dt><dd>${esc(j.station)}</dd></div>` : ''}
            ${j.exit ? `<div><dt>Exit</dt><dd>${esc(j.exit)} ${j.exitVerify ? `<span class="verify">${icon('alert', 'sm')}Check on the day</span>` : ''}</dd></div>` : ''}
            ${j.duration ? `<div><dt>Journey time</dt><dd>${esc(j.duration)}</dd></div>` : ''}
            <div><dt>Transfers</dt><dd>${j.transfers}</dd></div>
            ${j.walk ? `<div><dt>Walking</dt><dd>${esc(j.walk)}</dd></div>` : ''}
            ${j.distance ? `<div><dt>Distance</dt><dd>${esc(j.distance)}</dd></div>` : ''}
            ${j.alt ? `<div><dt>Alternative</dt><dd>${esc(j.alt)}</dd></div>` : ''}
          </dl>
          <p class="src">Source: ${esc(j.source)}</p>
        </div>
        <div class="acts">
          <a class="btn sm" href="${links.dir(j.place.q)}" target="_blank" rel="noopener">${icon('nav', 'sm')}Google route</a>
          <a class="btn sm" href="${links.naver(j.place.ko)}" target="_blank" rel="noopener">${icon('map', 'sm')}Naver Map</a>
        </div>
      </article>`).join('');
    const block = (title, list) => `<div><h4>${title}</h4><ul>${list.map(l => `<li><span class="ln" style="--c:${l.color}">${esc(l.line)}</span><div><b>${esc(l.name)}</b><small>${esc(l.stops)}</small><small>${esc(l.note)}</small></div></li>`).join('')}</ul></div>`;
    $('#subway').innerHTML = block('Seoul', T.subway.seoul) + block('Busan', T.subway.busan);
    $('#tips').innerHTML = T.tips.map(t => `<div class="card tip"><div class="ic">${icon(t.icon)}</div><b>${esc(t.title)}</b><p>${esc(t.text)}</p></div>`).join('');
  }

  /* ===================== WEATHER ===================== */
  const WMO = [[0, 'Clear', 'sun'], [1, 'Mostly clear', 'sun'], [2, 'Partly cloudy', 'cloud-sun'], [3, 'Overcast', 'cloud'], [45, 'Fog', 'fog'], [48, 'Freezing fog', 'fog'], [51, 'Light drizzle', 'rain'], [53, 'Drizzle', 'rain'], [55, 'Heavy drizzle', 'rain'], [56, 'Freezing drizzle', 'rain'], [57, 'Freezing drizzle', 'rain'], [61, 'Light rain', 'rain'], [63, 'Rain', 'rain'], [65, 'Heavy rain', 'rain'], [66, 'Freezing rain', 'rain'], [67, 'Freezing rain', 'rain'], [71, 'Light snow', 'snow'], [73, 'Snow', 'snow'], [75, 'Heavy snow', 'snow'], [77, 'Snow grains', 'snow'], [80, 'Light showers', 'rain'], [81, 'Showers', 'rain'], [82, 'Heavy showers', 'rain'], [85, 'Snow showers', 'snow'], [86, 'Heavy snow showers', 'snow'], [95, 'Thunderstorm', 'storm'], [96, 'Thunderstorm, hail', 'storm'], [99, 'Thunderstorm, hail', 'storm']];
  const wmo = c => WMO.find(w => w[0] === c) || [c, 'Unknown', 'cloud'];
  const wxText = c => wmo(c)[1], wxIcon = c => wmo(c)[2];
  const WX = {};
  const fresh = (c, ms) => c && Date.now() - c.t < ms;
  async function loadWeather(force = false) {
    const out = {};
    await Promise.all(Object.entries(T.cities).map(async ([key, c]) => {
      const ck = 'wx.' + key; let cache = store.get(ck);
      if (!force && fresh(cache, 30 * 6e4)) { out[key] = { ...cache, state: navigator.onLine ? 'live' : 'stale', hist: store.get('wxh.' + key) }; return; }
      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=Asia%2FSeoul&forecast_days=16`;
        const r = await fetch(u); if (!r.ok) throw new Error(r.status);
        const j = await r.json();
        if (!j.current || !j.daily) throw new Error('bad data');
        const daily = {};
        j.daily.time.forEach((t, i) => daily[t] = { code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], fmax: j.daily.apparent_temperature_max[i], fmin: j.daily.apparent_temperature_min[i], pop: j.daily.precipitation_probability_max[i], wind: j.daily.wind_speed_10m_max[i], sunrise: j.daily.sunrise[i], sunset: j.daily.sunset[i] });
        cache = { t: Date.now(), current: { temp: j.current.temperature_2m, feels: j.current.apparent_temperature, code: j.current.weather_code, wind: j.current.wind_speed_10m, rh: j.current.relative_humidity_2m, time: j.current.time }, daily, order: j.daily.time };
        store.set(ck, cache); out[key] = { ...cache, state: 'live' };
      } catch (e) { out[key] = cache ? { ...cache, state: 'stale' } : { state: 'none' }; }
      // same dates last year (recorded, not a forecast) — fetched once
      let hist = store.get('wxh.' + key);
      if (!hist) {
        try {
          const from = c.from.replace('2027', '2026'), to = c.to.replace('2027', '2026');
          const r = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lon}&start_date=${from}&end_date=${to}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=Asia%2FSeoul`);
          if (r.ok) { const j = await r.json(); if (j.daily && j.daily.time && j.daily.time.length) { hist = { max: j.daily.temperature_2m_max, min: j.daily.temperature_2m_min, snow: j.daily.snowfall_sum, rain: j.daily.precipitation_sum, from, to }; store.set('wxh.' + key, hist); } }
        } catch (e) {}
      }
      out[key].hist = hist || null;
    }));
    Object.assign(WX, out);
    renderWeather(); emit('weather', WX);
  }
  function renderWeather() {
    const any = Object.values(WX).some(w => w.state === 'live'), stale = Object.values(WX).some(w => w.state === 'stale');
    $('#wxStatus').innerHTML = any ? '<span class="badge live">Live</span>' : stale ? '<span class="badge stale">Saved, not live</span>' : '<span class="badge off">Unavailable</span>';
    $('#wxGrid').innerHTML = Object.entries(T.cities).map(([key, c]) => {
      const w = WX[key];
      if (!w || w.state === 'none') return `<div class="card wx"><div class="wx-top"><h4>${c.name}</h4><span class="badge off">No data</span></div>
        <div class="empty">${icon('wifi-off')}Weather couldn't be loaded. Check your connection and try again.<br><br><button class="btn sm" type="button" data-wxretry>${icon('refresh', 'sm')}Try again</button></div>${hist(w, c)}</div>`;
      const cu = w.current, today = K27.ymd();
      const td = w.daily[today] || w.daily[w.order[0]];
      const tripDays = w.order.filter(d => d >= c.from && d <= c.to);
      const show = w.order.slice(0, 10);
      return `<div class="card wx"><div class="wx-top"><div><h4>${c.name}</h4><p class="xs muted">Now · ${w.state === 'live' ? 'updated ' + fmt(new Date(w.t), { hour: '2-digit', minute: '2-digit', hour12: false }, KST) + ' KST' : 'saved ' + fmt(new Date(w.t), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }, KST)}</p></div>
          <span class="badge ${w.state === 'live' ? 'live' : 'stale'}">${w.state === 'live' ? 'Live' : 'Not live'}</span></div>
        <div class="wx-now">${icon(wxIcon(cu.code), 'lg')}<span class="t num">${Math.round(cu.temp)}°</span><div><b>${esc(wxText(cu.code))}</b><p class="small muted">Feels like ${Math.round(cu.feels)}°</p></div></div>
        <div class="wx-meta">
          <div><small>Wind</small><span class="num">${Math.round(cu.wind)} km/h</span></div>
          <div><small>Precip. chance</small><span class="num">${td && td.pop != null ? td.pop + '%' : '—'}</span></div>
          <div><small>Sunrise · sunset</small><span class="num">${td ? td.sunrise.slice(11, 16) + ' · ' + td.sunset.slice(11, 16) : '—'}</span></div>
        </div>
        <div class="wx-days" aria-label="Daily forecast">${show.map(d => { const x = w.daily[d]; return `<div class="wx-day ${d >= c.from && d <= c.to ? 'trip' : ''}"><span>${dateLabel(d, { weekday: 'short', day: 'numeric' })}</span>${icon(wxIcon(x.code))}<b class="num">${Math.round(x.max)}°</b> <span class="num">${Math.round(x.min)}°</span><br><span class="num">${x.pop != null ? x.pop + '%' : ''}</span></div>`; }).join('')}</div>
        ${tripDays.length ? `<p class="xs" style="margin-top:8px;color:var(--accent)">Highlighted: forecast for our days in ${c.name}.</p>` : `<p class="xs muted" style="margin-top:8px">Our dates in ${c.name} (${dateLabel(c.from)} – ${dateLabel(c.to)}) aren't in the 16-day forecast yet.</p>`}
        ${hist(w, c)}</div>`;
    }).join('');
    $$('[data-wxretry]').forEach(b => b.onclick = () => { b.disabled = true; loadWeather(true); });
  }
  function hist(w, c) {
    const h = w && w.hist; if (!h) return '';
    const mx = h.max.filter(v => v != null), mn = h.min.filter(v => v != null), snowDays = (h.snow || []).filter(v => v > 0).length;
    if (!mx.length) return '';
    return `<div class="wx-hist">Same dates last year (${dateLabel(h.from)}–${dateLabel(h.to)} 2026): highs <b>${Math.round(Math.min(...mx))}° to ${Math.round(Math.max(...mx))}°</b>, lows <b>${Math.round(Math.min(...mn))}° to ${Math.round(Math.max(...mn))}°</b>${snowDays ? `, snow on ${snowDays} ${snowDays === 1 ? 'day' : 'days'}` : ', no snow recorded'}.</div>`;
  }

  /* ===================== CURRENCY ===================== */
  const FX = { mode: 'krw', amount: 30000 };
  let rate = null; // { r: KRW per SGD, src, t (fetched), updated (provider time), user? }
  function currentRate() { const o = store.get('fx.override'); if (o && o > 0) return { r: o, src: 'user' }; return rate; }
  async function loadRate(force = false) {
    const c = store.get('fx.rate');
    if (c && c.r > 0) rate = { ...c, state: 'saved' };
    renderFX();
    if (!force && c && Date.now() - c.t < 6 * 36e5) { rate.state = navigator.onLine ? 'live' : 'saved'; renderFX(); emit('fx', currentRate()); return; }
    try {
      let r = await fetch('https://open.er-api.com/v6/latest/SGD'); let j = r.ok ? await r.json() : null;
      if (j && j.result === 'success' && j.rates && j.rates.KRW) rate = { r: j.rates.KRW, src: 'ExchangeRate-API', t: Date.now(), updated: j.time_last_update_unix * 1000 };
      else {
        r = await fetch('https://api.frankfurter.app/latest?from=SGD&to=KRW'); j = r.ok ? await r.json() : null;
        if (j && j.rates && j.rates.KRW) rate = { r: j.rates.KRW, src: 'Frankfurter (ECB)', t: Date.now(), updated: Date.parse(j.date + 'T16:00:00Z') };
        else throw new Error('no rate');
      }
      store.set('fx.rate', rate); rate.state = 'live';
    } catch (e) { if (rate) rate.state = 'saved'; }
    renderFX(); emit('fx', currentRate());
  }
  const fmtKRW = v => '₩' + Math.round(v).toLocaleString('en-SG');
  const fmtSGD = v => 'S$' + v.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function renderFX() {
    const cr = currentRate(), o = store.get('fx.override');
    const st = !cr ? '<span class="badge off">Rate unavailable</span>' : cr.src === 'user' ? '<span class="badge planned">Your rate</span>' : rate.state === 'live' ? '<span class="badge live">Live mid-market</span>' : '<span class="badge stale">Saved rate</span>';
    $('#fxStatus').innerHTML = st;
    const host = $('#fx');
    if (!host.dataset.built) {
      host.dataset.built = 1;
      host.innerHTML = `<div>
          <div class="fx-box">
            <label class="fx-row"><span class="fx-cur" id="fxFrom"><b>KRW</b>Won</span><input class="fx-in" id="fxIn" inputmode="decimal" autocomplete="off" aria-label="Amount to convert"></label>
            <div class="fx-swap"><button class="btn icon-only" id="fxSwap" type="button" aria-label="Swap currencies">${icon('swap')}</button></div>
            <div class="fx-row"><span class="fx-cur" id="fxTo"><b>SGD</b>Dollars</span><output class="fx-out" id="fxOut" for="fxIn" aria-live="polite">—</output></div>
          </div>
          <div class="presets-row" id="fxPresets"></div>
        </div>
        <div class="fx-side">
          <div class="fx-rate" id="fxRate"></div>
          <form class="fx-override" id="fxOverride"><label class="field"><span>Use my own rate (₩ per S$1)</span><input class="input num" name="o" inputmode="decimal" placeholder="e.g. your card or money-changer rate"></label><button class="btn" type="submit">Use</button></form>
          <p class="xs muted">Live rates are mid-market rates. Card, ATM and money-changer rates are usually a little worse, so set your own rate above to match what you'll actually get.</p>
        </div>`;
      const inp = $('#fxIn');
      inp.value = FX.amount.toLocaleString('en-SG');
      inp.addEventListener('input', () => { const v = parseFloat(inp.value.replace(/[^\d.]/g, '')); FX.amount = isNaN(v) ? 0 : v; out(); });
      inp.addEventListener('blur', () => { inp.value = FX.amount ? FX.amount.toLocaleString('en-SG', { maximumFractionDigits: 2 }) : ''; });
      $('#fxSwap').onclick = e => {
        const r = convert(); FX.mode = FX.mode === 'krw' ? 'sgd' : 'krw';
        if (r != null) FX.amount = FX.mode === 'sgd' ? Math.round(r * 100) / 100 : Math.round(r);
        e.currentTarget.classList.toggle('spin'); inp.value = FX.amount.toLocaleString('en-SG', { maximumFractionDigits: 2 }); labels(); presets(); out();
      };
      $('#fxOverride').onsubmit = e => { e.preventDefault(); const v = parseFloat(new FormData(e.target).get('o')); if (v > 0) { store.set('fx.override', v); toast('Using your rate'); renderFX(); emit('fx', currentRate()); } };
      labels(); presets();
    }
    const rr = $('#fxRate');
    if (!cr) rr.innerHTML = `<b>Rate unavailable</b><p>We couldn't load an exchange rate and none is saved yet. Connect to the internet, or enter your own rate below.</p><button class="btn sm" type="button" id="fxRetry" style="margin-top:8px">${icon('refresh', 'sm')}Try again</button>`;
    else if (cr.src === 'user') rr.innerHTML = `<b class="num">1 SGD = ₩${cr.r.toLocaleString('en-SG', { maximumFractionDigits: 2 })}</b><p>Your own rate.${rate ? ` Market rate: ₩${Math.round(rate.r).toLocaleString('en-SG')}.` : ''}</p><button class="btn sm" type="button" id="fxClear" style="margin-top:8px">Use the market rate</button>`;
    else rr.innerHTML = `<b class="num">1 SGD = ₩${cr.r.toLocaleString('en-SG', { maximumFractionDigits: 2 })}</b><p>${rate.state === 'live' ? 'Mid-market' : 'Saved mid-market'} rate from ${esc(cr.src)}, published ${fmt(new Date(cr.updated || cr.t), { day: 'numeric', month: 'short', year: 'numeric' }, KST)}${rate.state !== 'live' ? '. Not live: you appear to be offline.' : ''}</p><button class="btn sm ghost" type="button" id="fxRetry" style="margin-top:6px">${icon('refresh', 'sm')}Refresh</button>`;
    const rt = $('#fxRetry'); if (rt) rt.onclick = () => loadRate(true);
    const cl = $('#fxClear'); if (cl) cl.onclick = () => { store.del('fx.override'); renderFX(); emit('fx', currentRate()); };
    out();
  }
  function convert() { const cr = currentRate(); if (!cr) return null; return FX.mode === 'krw' ? FX.amount / cr.r : FX.amount * cr.r; }
  function out() { const v = convert(); $('#fxOut').textContent = v == null ? '—' : '≈ ' + (FX.mode === 'krw' ? fmtSGD(v) : fmtKRW(v)); }
  function labels() { $('#fxFrom').innerHTML = FX.mode === 'krw' ? '<b>KRW</b>Won' : '<b>SGD</b>Dollars'; $('#fxTo').innerHTML = FX.mode === 'krw' ? '<b>SGD</b>Dollars' : '<b>KRW</b>Won'; }
  function presets() {
    const list = FX.mode === 'krw' ? [10000, 30000, 50000, 100000, 500000] : [10, 20, 50, 100, 500];
    $('#fxPresets').innerHTML = list.map(v => `<button class="chip" type="button" data-v="${v}">${FX.mode === 'krw' ? fmtKRW(v) : 'S$' + v}</button>`).join('');
    $$('#fxPresets .chip').forEach(b => b.onclick = () => { FX.amount = +b.dataset.v; $('#fxIn').value = FX.amount.toLocaleString('en-SG'); out(); });
  }

  function init() {
    renderStays(); renderTransport();
    loadWeather(); loadRate();
    on('wallet', d => { docs = d; renderStays(); });
    addEventListener('online', () => { loadWeather(true); loadRate(true); });
    addEventListener('offline', () => { Object.values(WX).forEach(w => { if (w.state === 'live') w.state = 'stale'; }); if (rate && rate.state === 'live') rate.state = 'saved'; renderWeather(); renderFX(); });
  }
  return { init, wxText, wxIcon, currentRate, fmtKRW, fmtSGD };
})();
