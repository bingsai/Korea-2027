/* =====================================================================
   KOREA 2027 — start-up, offline indicator, service worker
   ===================================================================== */
(() => {
  'use strict';
  const { $, toast, icon } = K27;
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error(`[${name}]`, e); } };

  safe('core', K27.init);
  safe('info', K27Info.init);       // before budget/itinerary: provides the exchange rate + weather helpers
  safe('budget', K27Budget.init);
  safe('itinerary', K27Itin.init);
  safe('map', K27Map.init);
  safe('kit', K27Kit.init);
  safe('journal', K27Journal.init);
  K27.hydrateIcons();

  /* ---------- online / offline ---------- */
  const net = () => {
    const off = !navigator.onLine;
    document.body.classList.toggle('offline', off);
    if (off) toast('You’re offline. The itinerary, stays, transport notes and everything you’ve saved still work. Weather and exchange rates won’t update until you’re back online.', null, 7000);
  };
  addEventListener('online', () => { document.body.classList.remove('offline'); toast('Back online'); });
  addEventListener('offline', net);
  if (!navigator.onLine) net();

  /* ---------- service worker (offline + installable) ---------- */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(reg => {
        const s = $('#swStatus'); if (s) s.textContent = 'Saved for offline use on this device.';
        reg.addEventListener('updatefound', () => {
          const w = reg.installing; if (!w) return;
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) toast('An update is ready', { label: 'Reload', fn: () => { w.postMessage('skip'); } }, 15000);
          });
        });
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    });
  }
})();
