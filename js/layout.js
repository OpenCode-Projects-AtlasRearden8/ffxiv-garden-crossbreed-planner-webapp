// Circular bed layout mapping for the FFXIV Garden Crossbreed Planner.
//
// Bed 1 sits at 12 o'clock; beds proceed clockwise. Positions are returned in
// SVG viewBox coordinates (0..100) so they can be drawn directly.

const TAU = Math.PI * 2;

export function bedPositions(bedCount, { cx = 50, cy = 50, r = 38.5 } = {}) {
  const n = Number(bedCount);
  if (!Number.isInteger(n) || n < 1) return [];
  const out = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (TAU * i) / n;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    out.push({
      bed: i + 1,
      slot: i,
      x: round2(x),
      y: round2(y),
      angleDeg: (360 * i) / n // compass bearing: 0deg = up, clockwise
    });
  }
  return out;
}

export function ringLines(bedCount, positions = null, { cx = 50, cy = 50, r = 38.5 } = {}) {
  const n = Number(bedCount);
  if (!Number.isInteger(n) || n < 3) return [];
  const pos = positions || bedPositions(n, { cx, cy, r });
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = pos[i];
    const b = pos[(i + 1) % n];
    lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  return lines;
}

const PALETTE = [
  'seed-color-1', 'seed-color-2', 'seed-color-3', 'seed-color-4',
  'seed-color-5', 'seed-color-6', 'seed-color-7', 'seed-color-8'
];

export function colorClassForSeed(seedId, palette = PALETTE) {
  if (!seedId) return '';
  let h = 0;
  const s = String(seedId);
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

export function legendForPlan(plan) {
  if (!plan) return [];
  const seen = new Map();
  const entries = [];
  for (const b of plan.beds) {
    if (!seen.has(b.seed)) {
      seen.set(b.seed, colorClassForSeed(b.seed));
      entries.push({ seed: b.seed, colorClass: seen.get(b.seed) });
    }
  }
  return entries;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
