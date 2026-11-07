// DOM smoke test: load the real index.html into jsdom, run the bundled
// app (module scripts are concatenated and evaled because jsdom does not
// execute type=module tags), and drive the UI end to end.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = url.fileURLToPath(new URL('.', import.meta.url));
const { JSDOM } = await import('jsdom');

function loadApp() {
  const html = fs.readFileSync(path.join(ROOT, '..', 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;

  const order = ['data.js', 'pairing.js', 'layout.js', 'storage.js', 'app.js'];
  let src = '';
  for (const file of order) {
    let code = fs.readFileSync(path.join(ROOT, '..', 'js', file), 'utf8');
    code = code
      .replace(/^import\s+(?:.*?\s+from\s+)?['"].*['"];?\s*$/gm, '')
      .replace(/^export\s+function\s+/gm, 'function ')
      .replace(/^export\s+const\s+/gm, 'const ')
      .replace(/^export\s+let\s+/gm, 'let ');
    src += code + '\n';
  }
  window.eval(src);
  window.init();
  return window;
}

test('app boots: targets, plans, map, board and legend all render', () => {
  const win = loadApp();
  const doc = win.document;

  const targetSel = doc.querySelector('#target');
  assert.ok(targetSel.options.length > 10, 'target dropdown is populated');
  assert.equal(targetselValue(targetSel), 'royal-kukuru', 'default target selected');

  const planCards = doc.querySelectorAll('.plan-card');
  assert.ok(planCards.length >= 1, 'at least one plan card rendered');
  assert.match(planCards[0].textContent, /Old World Fig Seeds \+ Mirror Apple Seeds/,
    'top plan names the known pair');

  const beds = doc.querySelectorAll('#bedmap .bed');
  assert.equal(beds.length, 8, 'deluxe patch default: 8 bed groups on the map');
  assert.equal(doc.querySelectorAll('#bedmap .bed circle').length, 8);

  const legendChips = doc.querySelectorAll('#legend .chip');
  assert.equal(legendChips.length, 2, 'legend shows both seed colors');
  assert.notEqual(legendChips[0].querySelector('.swatch').className,
    legendChips[1].querySelector('.swatch').className,
    'legend swatches differ');

  const rows = doc.querySelectorAll('#board-body .bed-row');
  assert.equal(rows.length, 8, 'one board row per bed');
  assert.ok(rows[0].textContent.includes('Old World Fig'), 'row labels include planned seed');
});

function targetselValue(sel) {
  return sel.options[sel.selectedIndex].value;
}

test('clicking a bed plants it and persists to localStorage', () => {
  const win = loadApp();
  const doc = win.document;

  const bed3 = doc.querySelector('#bedmap .bed[data-bed="3"]');
  assert.ok(bed3, 'bed 3 exists');
  bed3.dispatchEvent(new win.Event('click', { bubbles: true }));

  assert.match(bed3.getAttribute('class'), /seed-color/, 'bed 3 now color-coded');
  const raw = win.localStorage.getItem('ffxiv-garden-crossbreed-planner:board:v1');
  assert.ok(raw, 'localStorage entry written');
  const state = JSON.parse(raw);
  assert.equal(state.beds['3'].seed, 'old-world-fig', 'bed 3 planted with plan seed');

  // clicking again clears it
  const bed3b = doc.querySelector('#bedmap .bed[data-bed="3"]');
  bed3b.dispatchEvent(new win.Event('click', { bubbles: true }));
  const state2 = JSON.parse(win.localStorage.getItem('ffxiv-garden-crossbreed-planner:board:v1'));
  assert.equal(state2.beds['3'], undefined, 'bed 3 cleared on second click');
});

test('water-all and day checkboxes log against today', () => {
  const win = loadApp();
  const doc = win.document;

  doc.querySelector('#water-all').dispatchEvent(new win.Event('click', { bubbles: true }));
  const state = JSON.parse(win.localStorage.getItem('ffxiv-garden-crossbreed-planner:board:v1'));
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(state.logs[today].watered.includes(2), 'bed 2 logged watered today');

  const boxes = doc.querySelectorAll('#board-body .bed-row:nth-child(5) input.day-check');
  assert.equal(boxes.length, 14, '7 days x 2 kinds of boxes per row');
});

test('switching patch size re-renders the right bed count', () => {
  const win = loadApp();
  const doc = win.document;
  const patch = doc.querySelector('#patch');
  patch.value = 'round';
  patch.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(doc.querySelectorAll('#bedmap .bed').length, 4, 'round patch: 4 beds');
  assert.equal(doc.querySelectorAll('#board-body .bed-row').length, 4, 'round patch: 4 rows');

  patch.value = 'oblong';
  patch.dispatchEvent(new win.Event('change', { bubbles: true }));
  assert.equal(doc.querySelectorAll('#bedmap .bed').length, 6, 'oblong patch: 6 beds');
});

test('unknown target degrades gracefully with a helpful card', () => {
  const win = loadApp();
  const doc = win.document;
  const target = doc.querySelector('#target');
  target.value = 'prickly-pineapple'; // in data as a crop, but never a cross target
  target.dispatchEvent(new win.Event('change', { bubbles: true }));
  const card = doc.querySelector('.plan-card');
  assert.ok(card, 'still renders a card');
  assert.match(card.textContent, /No known cross pair/);
});
