// Pairing suggestions for the FFXIV Garden Crossbreed Planner.
//
// Rules honored here:
// - Crossbreeding happens at planting time between ADJACENT beds only.
// - Bed numbering: bed 1 at 12 o'clock, proceeding clockwise.
// - Patch bed counts: round = 4, oblong = 6, deluxe = 8.
// - A patch should dedicate itself to one target; classic plans use at most
//   4 of each seed (the famous "4x4 cross" on 8 beds).

// Neighbors of each bed index. Bed i's neighbors:
// - ring neighbors (i±1) for every patch;
// - i±2 on the 4-bed round patch (all four beds touch) and the 8-bed deluxe
//   ring (its 3-3-with-sides ring makes begin/end rows touch diagonally).
export function adjacency(bedCount) {
  const n = bedCount;
  if (!Number.isInteger(n) || n < 2) return [];
  const adj = [];
  for (let i = 0; i < n; i++) {
    const s = new Set();
    s.add((i + 1) % n);
    s.add((i - 1 + n) % n);
    if (n === 4) {
      s.add((i + 2) % n);
    } else if (n === 8) {
      s.add((i + 2) % n);
      s.add((i - 2 + n) % n);
    }
    adj.push([...s].sort((x, y) => x - y));
  }
  return adj;
}

export function adjacentPairs(bedCount) {
  const pairs = [];
  adjacency(bedCount).forEach((neighbors, i) => {
    for (const j of neighbors) if (j > i) pairs.push([i, j]);
  });
  return pairs;
}

export function bedCountForPatch(patchId) {
  return { round: 4, oblong: 6, deluxe: 8 }[patchId] ?? 0;
}

export const PATCH_SIZES = [
  { id: 'round',  name: 'Round Garden Patch',   beds: 4 },
  { id: 'oblong', name: 'Oblong Garden Patch',  beds: 6 },
  { id: 'deluxe', name: 'Deluxe Garden Patch',  beds: 8 }
];

import { CROSS_TABLE, getCrop } from './data.js';

// Rule of thumb from cross diagrams: dedicate a patch to one target and use
// at most 4 of each seed (the classic 4x4 cross needs 4 + 4 on 8 beds).
export function maxPerSeed(_bedCount) {
  return 4;
}

// Builds one plan: assign seeds of pair (a, b) onto beds so that every
// adjacent bed pair carries different seeds (maximizing cross opportunities).
// Uses the alternating pattern, which is optimal for even ring counts 4/6/8.
export function buildPlan(pair, bedCount) {
  if (!Number.isInteger(bedCount) || bedCount < 2) return null;
  const n = bedCount;
  const beds = [];
  for (let i = 0; i < n; i++) {
    beds.push({ bed: i + 1, slot: i, seed: i % 2 === 0 ? pair.a : pair.b });
  }
  const counts = { [pair.a]: 0, [pair.b]: 0 };
  for (const b of beds) counts[b.seed]++;
  if (counts[pair.a] > 4 || counts[pair.b] > 4) return null;
  const ap = adjacency(n);
  let mismatches = 0;
  for (let i = 0; i < n; i++) {
    for (const j of ap[i]) {
      if (j > i && beds[i].seed === beds[j].seed) mismatches++;
    }
  }
  return {
    target: pair.target,
    seedA: pair.a,
    seedB: pair.b,
    chance: typeof pair.chance === 'number' ? pair.chance : null,
    beds,
    adjacentCrossPairs: adjacentPairs(n).length - mismatches
  };
}

export function plansForTarget(targetId, bedCount, table = CROSS_TABLE) {
  const n = bedCount;
  if (!Number.isInteger(n) || n < 2) return [];
  const rows = table.filter(r => r.target === targetId);
  const plans = [];
  for (const row of rows) {
    for (const p of [row, { ...row, a: row.b, b: row.a }]) {
      const plan = buildPlan(p, n);
      if (plan) plans.push(plan);
    }
  }
  // Stable, useful order: most pairs with the *better-known* seed first is
  // noisy; just prefer higher chance, then A/B as authored in the table.
  return plans.sort((x, y) => (y.chance ?? 0) - (x.chance ?? 0));
}

export function summarizePlan(plan) {
  const nameA = getCrop(plan.seedA)?.seedName || plan.seedA;
  const nameB = getCrop(plan.seedB)?.seedName || plan.seedB;
  return `${nameA} + ${nameB}`;
}
