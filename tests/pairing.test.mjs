import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CROSS_TABLE, getCrop } from '../js/data.js';
import {
  adjacency, adjacentPairs, bedCountForPatch,
  buildPlan, plansForTarget, maxPerSeed, PATCH_SIZES
} from '../js/pairing.js';

test('patch lookup maps ids to bed counts', () => {
  assert.equal(bedCountForPatch('round'), 4);
  assert.equal(bedCountForPatch('oblong'), 6);
  assert.equal(bedCountForPatch('deluxe'), 8);
  assert.equal(bedCountForPatch('nonsense'), 0);
});

test('patch sizes match FFXIV patch capacities 4/6/8', () => {
  assert.deepEqual(PATCH_SIZES.map(p => p.beds).sort(), [4, 6, 8]);
});

test('adjacency is a bidirectional relation for every patch size', () => {
  for (const n of [4, 6, 8]) {
    const adj = adjacency(n);
    assert.equal(adj.length, n);
    for (let i = 0; i < n; i++) {
      for (const j of adj[i]) {
        assert.ok(adj[j].includes(i), `(${i},${j}) must be mutual`);
      }
      for (const own of adj[i]) assert.ok(own !== i, 'no self-adjacency');
    }
  }
  assert.deepEqual(adjacency(0), []);
  assert.deepEqual(adjacency(1), []);
});

test('round (4 beds) and deluxe (8 beds) allow long-range touching paths', () => {
  // Round patch: all four beds can cross (each bed has 3 neighbors).
  assert.deepEqual(adjacency(4).map(x => x.length), [3, 3, 3, 3]);
  // Deluxe ring: 4 neighbors per bed (right, down, up, left per in-game path).
  assert.deepEqual(adjacency(8).map(x => x.length), [4, 4, 4, 4, 4, 4, 4, 4]);
});

test('adjacentPairs lists each touching pair exactly once', () => {
  for (const n of [4, 6, 8]) {
    const pairs = adjacentPairs(n);
    const keys = new Set(pairs.map(([a, b]) => `${a}-${b}`));
    assert.equal(keys.size, pairs.length);
    for (const [a, b] of pairs) assert.ok(a < b);
    // mutual adjacency implies the reversed pair is never double-listed
    for (const [a, b] of pairs) assert.equal(keys.has(`${b}-${a}`), false);
  }
});

test('buildPlan gives every bed at least one cross partner and no wasted churn', () => {
  for (const n of [4, 6, 8]) {
    const plan = buildPlan({ target: 'x', a: 'a-seed', b: 'b-seed' }, n);
    assert.ok(plan);
    assert.equal(plan.beds.length, n);
    const adj = adjacency(n);
    for (let i = 0; i < n; i++) {
      const partners = adj[i].filter(j => plan.beds[j].seed !== plan.beds[i].seed);
      assert.ok(partners.length > 0, `bed ${i + 1} must have a cross partner`);
    }
    // Live cross opportunities (different seed touching): round K4 checker
    // 2/2 -> 4 of 6 touching pairs; oblong ring -> all 6; the classic deluxe
    // 4x4 checkerboard -> the 8 ring-neighbor pairs (±2 diagonals are your
    // same-seed duplicates, which is exactly how the 4x4 cross is laid out).
    const expected = { 4: 4, 6: 6, 8: 8 }[n];
    assert.equal(plan.adjacentCrossPairs, expected);
  }
});

test('buildPlan respects the at-most-4-per-seed rule', () => {
  for (const n of [4, 6, 8]) {
    const plan = buildPlan({ target: 'x', a: 'a-seed', b: 'b-seed' }, n);
    const count = seed => plan.beds.filter(b => b.seed === seed).length;
    assert.ok(count('a-seed') <= maxPerSeed(n));
    assert.ok(count('b-seed') <= maxPerSeed(n));
    assert.ok(count('a-seed') > 0 && count('b-seed') > 0);
  }
  assert.deepEqual([4, 6, 8].map(n =>
    buildPlan({ target: 'x', a: 'a', b: 'b' }, n).beds.filter(b => b.seed === 'a').length),
    [2, 3, 4]);
});

test('buildPlan rejects nonsensical bed counts', () => {
  assert.equal(buildPlan({ a: 'a', b: 'b' }, 0), null);
  assert.equal(buildPlan({ a: 'a', b: 'b' }, -3), null);
  assert.equal(buildPlan({ a: 'a', b: 'b' }, 1.5), null);
});

test('plansForTarget returns ordered, usable plans for every known pair', () => {
  for (const row of CROSS_TABLE) {
    for (const n of [4, 6, 8]) {
      const plans = plansForTarget(row.target, n);
      assert.ok(plans.length >= 1, `${row.target} has plans for ${n} beds`);
      const ch = plans.map(p => p.chance ?? -1);
      for (let i = 1; i < ch.length; i++) assert.ok(ch[i - 1] >= ch[i], 'ordered by chance');
      const crop = getCrop(row.target);
      assert.equal(getCrop(plans[0].seedA).id, plans[0].seedA);
      assert.ok(crop);
    }
  }
});

test('every cross pair references real crops with real seed names', () => {
  for (const row of CROSS_TABLE) {
    assert.ok(getCrop(row.target), `target ${row.target} defined`);
    assert.ok(getCrop(row.a), `pair seed ${row.a} defined`);
    assert.ok(getCrop(row.b), `pair seed ${row.b} defined`);
    assert.notEqual(row.a, row.b);
  }
});
