# Korea, 2027

Travel companion for Busan & Seoul, 16–23 January 2027. A static site for GitHub Pages: no build step, no framework, no API keys.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page structure |
| `assets/css/app.css` | Design system (light + dark) |
| `assets/js/data.js` | **All public trip data**: flights, stays, itinerary, transport, emergency info. Edit this to change the plan. |
| `assets/js/core.js` | Helpers, icons, storage, navigation, hero countdown, Today view, key times + calendar export |
| `assets/js/map.js` | Illustrated route map + KTX panel |
| `assets/js/itinerary.js` | Day-by-day itinerary, notes, completion, Today highlighting |
| `assets/js/info.js` | Stays, transport, live weather, currency converter |
| `assets/js/budget.js` | Expense tracker, charts, CSV, backup |
| `assets/js/kit.js` | Packing list, travel wallet, emergency info |
| `assets/js/journal.js` | Photo journal |
| `assets/js/boot.js` | Start-up, offline indicator, service-worker registration |
| `sw.js`, `manifest.webmanifest`, `assets/icons/` | Offline support and "Add to Home Screen" |

## Privacy

Everything in this repository is public. Keep private details (the Airbnb address, door codes, booking references, phone numbers) out of these files. Put them in the **Travel Wallet** on the site instead: it stores them only in your browser on your device (IndexedDB), never on GitHub. Use the Wallet's Backup button (with a passphrase) to move them to another device.

## External services (all free, no keys)

- **Open-Meteo**: weather forecast and last year's recorded weather
- **ExchangeRate-API** (open endpoint), with **Frankfurter** (ECB rates) as backup: exchange rates
- **world-atlas / Natural Earth** via jsDelivr: map coastline
- **Unsplash**: photos (credited on each image), **Google Fonts**: Inter, Manrope, Noto Sans KR

If any are unreachable, the site shows a clear "unavailable" or "not live" state instead of made-up values.

## Deploy

1. Commit and push to the `main` branch.
2. In the repository: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
3. After changing any file, bump `VERSION` in `sw.js` (e.g. `k27-v2` → `k27-v3`) so installed copies pick up the update.

## Local preview

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Offline support needs `http://localhost` or HTTPS; it doesn't work from a `file://` path.
