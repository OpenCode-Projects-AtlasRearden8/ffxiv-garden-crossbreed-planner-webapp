// UI wiring for the FFXIV Garden Crossbreed Planner.
// Logic worth testing lives in data.js / pairing.js / layout.js / storage.js.

import { getCrop } from './data.js';
import { plansForTarget, bedCountForPatch } from './pairing.js';
import { bedPositions, ringLines, colorClassForSeed } from './layout.js';
import { createBoardStore, todayISO } from './storage.js';

const $ = (sel) => document.querySelector(sel);

const board = createBoardStore();

let currentPlan = null;
let bedCount = 8;

function svgEl(tag, attrs = {}, kids = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const kid of kids) el.appendChild(kid);
  return el;
}

function dayStamp(day) {
  const [, m, d] = day.split('-');
  return `${m}/${d}`;
}

function renderTargets() {
  const sel = $('#target');
  sel.innerHTML = '';
  for (const crop of cropsForDropdown()) {
    const opt = document.createElement('option');
    opt.value = crop.id;
    opt.textContent = crop.crossOnly ? `${crop.name} (cross only!)` : crop.name;
    if (crop.id === 'royal-kukuru') opt.selected = true;
    sel.appendChild(opt);
  }
}

function renderPlans() {
  const target = $('#target').value;
  const n = bedCountForPatch($('#patch').value);
  const plans = plansForTarget(target, n);
  const plansBox = $('#plans');
  const note = $('#plan-note');
  plansBox.innerHTML = '';

  if (plans.length === 0) {
    plansBox.innerHTML =
      '<div class="plan-card"><div class="meta">No known cross pair for this target in our starter data. Any two different seeds beside each other can intercross — plant something and experiment!</div></div>';
    note.textContent = '';
    currentPlan = null;
    renderMap();
    renderBoard();
    return;
  }

  const best = plans[0];
  plans.forEach((plan, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'plan-card';
    card.dataset.plan = String(i);
    const seedNA = getCrop(plan.seedA)?.seedName || plan.seedA;
    const seedNB = getCrop(plan.seedB)?.seedName || plan.seedB;
    const chance = plan.chance === null ? '' : ` — about ${plan.chance}%`;
    const countsA = plan.beds.filter(b => b.seed === plan.seedA).length;
    const countsB = plan.beds.filter(b => b.seed === plan.seedB).length;
    card.innerHTML =
      `<div class="pair">${i === 0 ? '★ Plan 1 (top pick): ' : `Plan ${i + 1}: `}${seedNA} + ${seedNB}${chance}</div>` +
      `<div class="counts">${countsA} ${seedNA} beds · ${countsB} ${seedNB} beds · ${plan.adjacentCrossPairs} neighboring pairs that can cross</div>`;
    card.addEventListener('click', () => {
      currentPlan = plan;
      document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('picked'));
      card.classList.add('picked');
      renderMap();
      renderBoard();
    });
    plansBox.appendChild(card);
    if (i === 0) card.classList.add('picked');
  });

  currentPlan = best;
  note.textContent =
        'Crossbreeding happens the moment a seed is planted next to a different kind of seed. Plant bed 1 first, then continue around the ring. Click any bed on the map to plant or clear it.';
  renderMap();
  renderBoard();
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderMap() {
  const svg = $('#bedmap');
  clearChildren(svg);
  const n = bedCountForPatch($('#patch').value);

  const pos = bedPositions(n);
  for (const line of ringLines(n, pos)) {
    svg.appendChild(svgEl('line', {
      x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2, class: 'ring'
    }));
  }

  for (const p of pos) {
    const planted = board.bedInfo(p.bed);
    const seedId = planted?.seed ||
      (currentPlan ? currentPlan.beds.find(b => b.bed === p.bed)?.seed : null) || '';
    const colorClass = seedId ? colorClassForSeed(seedId) : '';
    const dorm = svgEl('g', {
      class: `bed${seedId ? ' planted' : ' empty'}${colorClass ? ' ' + colorClass : ''}`,
      'data-bed': String(p.bed),
      role: 'button',
      tabindex: '0',
      transform: `translate(${p.x} ${p.y})`,
      'aria-label': `Bed ${p.bed}${seedId ? ', planted ' + (getCrop(seedId)?.name || seedId) : ', empty'}`
    });
    dorm.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 6.4 }));
    dorm.appendChild(svgEl('text', { x: 0, y: 0.4 }, [document.createTextNode(String(p.bed))]));
    const plantOrClear = () => {
      if (planted && planted.seed === seedId) {
        board.clearBed(p.bed);
      } else if (seedId) {
        board.plantBed(p.bed, seedId);
      }
      renderMap();
      renderBoard();
    };
    dorm.addEventListener('click', plantOrClear);
    dorm.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); plantOrClear(); }
    });
    svg.appendChild(dorm);
  }

  // Legend
  const legend = $('#legend');
  legend.innerHTML = '';
  const seeds = new Map();
  for (const p of pos) {
    const planted = board.bedInfo(p.bed);
    const seedId = planted?.seed ||
      (currentPlan ? currentPlan.beds.find(b => b.bed === p.bed)?.seed : null);
    if (!seedId) continue;
    if (seeds.has(seedId)) continue;
    const chip = document.createElement('span');
    chip.className = 'chip';
    const sw = document.createElement('span');
    sw.className = `swatch ${colorClassForSeed(seedId)}`;
    chip.appendChild(sw);
    chip.appendChild(document.createTextNode(getCrop(seedId)?.name || seedId));
    seeds.set(seedId, chip);
    legend.appendChild(chip);
  }
  if (seeds.size === 0) {
    legend.appendChild(Object.assign(document.createElement('span'),
      { textContent: 'Pick a plan above, then click beds to plant.' , className: 'note' }));
  }
}

function renderBoard() {
  const n = bedCountForPatch($('#patch').value);
  const days = board.recentDays(7);
  const today = todayISO();

  const head = $('#board-head');
  head.innerHTML = '';
  const thBed = document.createElement('th');
  thBed.textContent = 'Bed / seed';
  head.appendChild(thBed);
  for (const day of days) {
    const th = document.createElement('th');
    th.textContent = dayStamp(day);
    if (day === today) th.classList.add('today-col');
    head.appendChild(th);
  }

  const body = $('#board-body');
  body.innerHTML = '';
  for (let bed = 1; bed <= n; bed++) {
    const tr = document.createElement('tr');
    tr.className = 'bed-row';
    const info = board.bedInfo(bed);
    if (info) tr.classList.remove('missing');
    else tr.classList.add('missing');

    const tdInfo = document.createElement('td');
    tdInfo.className = 'seed-cell';
    const planSeed = currentPlan ? currentPlan.beds.find(b => b.bed === bed)?.seed : null;
    const seedId = info?.seed || planSeed;
    tdInfo.textContent = seedId
      ? `Bed ${bed} — ${getCrop(seedId)?.name || seedId}`
      : `Bed ${bed} — empty`;
    tr.appendChild(tdInfo);

    for (const day of days) {
      const td = document.createElement('td');
      if (day === today) td.classList.add('today-col');
      td.className += ' daycell';
      for (const kind of ['💧', '🤲']) {
        const key = kind === '💧' ? 'watered' : 'tended';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'day-check';
        box.checked = board.isFlagged(bed, key, day);
        box.setAttribute('aria-label', `Bed ${bed} ${key} on ${day}`);
        box.addEventListener('change', () => {
          board.toggleDayFlag(bed, key, day, box.checked);
          renderMap();
          updateSavedNote();
        });
        td.appendChild(box);
      }
      tr.appendChild(td);
    }
    body.appendChild(tr);
  }
}

function updateSavedNote() {
  $('#board-saved').textContent = `Saved locally in this browser · last change ${todayISO()} · nothing is sent anywhere.`;
}

function init() {
  renderTargets();
  $('#patch').addEventListener('change', renderPlans);
  $('#target').addEventListener('change', renderPlans);
  $('#water-all').addEventListener('click', () => {
    const n = bedCountForPatch($('#patch').value);
    for (let bed = 1; bed <= n; bed++) board.toggleDayFlag(bed, 'watered', todayISO(), true);
    renderBoard();
    renderMap();
  });
  $('#tend-all').addEventListener('click', () => {
    const n = bedCountForPatch($('#patch').value);
    for (let bed = 1; bed <= n; bed++) board.toggleDayFlag(bed, 'tended', todayISO(), true);
    renderBoard();
  });
  $('#clear-day').addEventListener('click', () => {
    const n = bedCountForPatch($('#patch').value);
    for (let bed = 1; bed <= n; bed++) {
      board.toggleDayFlag(bed, 'watered', todayISO(), false);
      board.toggleDayFlag(bed, 'tended', todayISO(), false);
    }
    renderBoard();
    renderMap();
  });
  $('#clear-board').addEventListener('click', () => {
    if (confirm('Clear the whole board? Plantings and day logs will be gone.')) {
      board.clearAll();
      renderMap();
      renderBoard();
    }
  });
  $('#print').addEventListener('click', () => window.print());

  renderPlans();
  updateSavedNote();
}

document.addEventListener('DOMContentLoaded', init);
