# STATUS

**Project:** ffxiv-garden-crossbreed-planner-webapp
**Built by:** Asdale Dynamics, LLC · **Date:** 2026-11-07 · **License:** MIT

## What was built

A fully static, no-backend webapp for FFXIV housing gardeners:

1. **The Plan** — choose one of the three real FFXIV garden patches
   (Round = 4 beds, Oblong = 6 beds, Deluxe = 8 beds) and a target crop
   (Royal Kukuru, Glazenut, Blood Pepper, Jute and 9 more). The planner
   shows seed pairing suggestions from a community-researched cross table,
   with estimated cross chances and per-bed seed counts.
2. **Bed Map** — the chosen plan is mapped onto a color-coded circular SVG
   layout, bed 1 at 12 o'clock, planting clockwise, respecting bed adjacency
   (crossbreeding only happens between neighboring beds at planting time).
   Clicking a bed plants it (or clears it), and the map doubles as the
   print sheet: a print stylesheet strips buttons and renders a clean desk copy.
3. **Daily Board** — per-bed watering and tending checkboxes for the last
   7 days, with "water all today" / "tend all today" shortcuts. Everything
   persists to `localStorage` under one key; older logs (14+ days) are
   pruned on load; corrupt storage degrades to an empty board instead of
   crashing. Nothing is ever sent anywhere — no backend, no account.

## How to run it

- Open `index.html` directly in a browser, or
- `python3 -m http.server 8080` (or `npm start`) in this folder and visit
  http://localhost:8080.
- Run the test suite: `npm test` (Node's built-in runner; the only dev
  dependency, jsdom, is already vendored in `node_modules` by `npm install`).

No build step, no accounts, no network calls at runtime.

## Verification results

- `npm test` — **30/30 passing** (Node test runner):
  - `tests/pairing.test.mjs` (12 tests): patch sizes match the real 4/6/8
    capacities, adjacency mutuality/no self-adjacency, per-patch neighbor
    counts (round=3, deluxe ring=4), plan building gives every bed a cross
    partner, respects the ≤4-per-seed rule, rejects bad bed counts, ordered
    plans for every known pair, all cross rows reference real crops.
  - `tests/layout.test.mjs` (8 tests): bed 1 exactly at 12 o'clock, clockwise
    even spacing, all beds on one circle, ring lines, custom center/radius,
    and paired seeds never share a color swatch.
  - `tests/storage.test.mjs` (7 tests): planting rules, flag toggling per
    bed/day/kind, localStorage round-trip, 14-day pruning, clear-all,
    corrupt-JSON resilience, day-list ordering.
  - `tests/smoke.test.mjs` (5 tests): full jsdom boot of the real
    `index.html` — dropdowns, plan cards, SVG map, legend chips, board rows,
    click-to-plant persisting to localStorage, water-all, patch switching,
    and graceful handling of targets with no known cross.
- `node --check` passes on every js/module file.
- `python3 -m http.server` serving returns HTTP 200 for `index.html`,
  `styles.css`, and all modules (verified via curl).
- Bugs found and fixed during verification: a broken string literal that
  destroyed a function boundary in `app.js` (initial map never rendered and
  the render-after-plan calls were lost — restored), a `now = new Date`
  default-parameter bug in `storage.js` where the browser path passed a Date
  *instance* where a function was expected (unit tests always injected `now`,
  so the smoke test caught it), invalid `innerHTML` use on SVG elements, and
  missing validation in `isFlagged`.

## Known gaps

- **Dataset is a starter subset.** 12 well-known cross targets; several more
  exist community-wide, and chances are player-estimated, not exact. Treat
  suggestions as starting points and verify in-game.
- **Cross-chance estimates are static**; no soil-integrated percentages.
- Bed adjacency is simplified to ring/neighbor models (documented in
  `js/pairing.js`); in-game intercross priority order (Right > Down > Up >
  Left) is not simulated.
- The board stores UTC-day stamps only (fine for casual tracking; not
  Eorzea-time aware).
- No offline manifest / PWA packaging; open file or serve locally.
- Legend + map use a deterministic 8-swatch palette hash; two seeds of one
  plan can in theory collide in exotic future datasets (test guards current ones).
