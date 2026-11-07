# FFXIV Garden Crossbreed Planner

A friendly, no-account web app for Final Fantasy XIV housing gardeners: pick a **target crop**
and your garden patch size, get **seed pairing suggestions** mapped onto a **color-coded
circular bed layout**, then track **day-by-day watering and tending** on a local-save board.
When it is time to work the garden, hit **Print** for a tidy desk copy.

Built by **Asdale Dynamics, LLC** with the same spirit as everything else we make: plain
language, step by step, never condescending.

---

## What it does

1. **Choose your patch.** FFXIV garden patches hold 4, 6, or 8 beds:
   - Round Garden Patch — 4 beds
   - Oblong Garden Patch — 6 beds
   - Deluxe Garden Patch — 8 beds
2. **Choose a target crop.** The planner looks up seed pairs known to crossbreed into your
   target (for example, Old World Fig + Mirror Apple → Royal Kukuru seeds).
3. **See the plan.** A bed-count-aware pairing plan is mapped onto a circular layout with
   each seed type color-coded, so you can stand in your estate yard and just plant what
   you see. Crossbreeding only happens between **adjacent** beds, so the layout respects
   that adjacency.
4. **Run the garden.** A day board tracks watering and tending per bed, day by day. Your
   board is saved automatically in your browser's local storage — no backend, no account,
   no data leaves your machine.
5. **Print.** A print stylesheet renders the bed map and board cleanly on paper.

Important FFXIV rules the planner keeps in view (as simple reminders, not lectures):
- Crossbreeding happens **at planting time**, based on what is beside the new seed.
- There is no center bed to plant — flowers go in the ring.
- Thanalan Topsoil improves intercross chance (we remind you; the game rolls the dice).

## How to run it

No build step. Any of these:

- **Just open it:** double-click `index.html`.
- **Serve it:** `npm start` (uses `npx serve` on port 8080), or
  `python3 -m http.server 8080` from this folder, then visit
  [http://localhost:8080](http://localhost:8080).
- **Run the tests:** `npm test` (Node's built-in test runner; no dependencies to install).

## Project layout

```
index.html        page shell + print-friendly structure
styles.css        screen + print styles
js/data.js        crop/seed dataset and known cross pairs
js/pairing.js     pairing suggestions + bed assignments for a patch size
js/layout.js      circular bed positions, adjacency, color coding
js/storage.js     local-save board (localStorage-backed, injectable for tests)
js/app.js         UI wiring (no logic worth unit-testing lives here)
tests/            node --test suites for pairing, layout, and storage
```

## A note on the data

The crop list is a starter subset of well-known community cross pairs, chosen because they
are popular desk-print targets (Royal Kukuru, Glazenut, Blood Pepper, Jute, and friends).
Community cross data is player-researched and occasionally revised by game patches — treat
the suggestions as a trustworthy starting point, not gospel, and verify in-game. Everything
runs locally and stays local.

## Browser storage

Your garden board (planted beds, water/tend logs for recent days) is saved in
`localStorage` under a single key. Clearing your browser data clears the board; nothing is
ever sent anywhere — there is no backend to send it to.

## License

MIT — see `LICENSE`. Copyright (c) 2026 Asdale Dynamics, LLC.

FFXIV is a trademark of Square Enix Holdings Co., Ltd. This is an unofficial, fan-made
planning tool with no association with or endorsement by Square Enix.

## Related projects from Asdale Dynamics

- `ffxiv-gathering-route-planner` — overworld gathering routes
- `ffxiv-crafting-checklist` — crafting checklists
