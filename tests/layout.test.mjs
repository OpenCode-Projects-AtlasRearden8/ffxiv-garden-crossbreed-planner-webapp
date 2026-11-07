import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bedPositions, ringLines, colorClassForSeed } from '../js/layout.js';
import { CROSS_TABLE } from '../js/data.js';

const near = (x, y, eps = 1e-6) => Math.abs(x - y) <= eps;

test('bed 1 sits at 12 o\'clock, others clockwise, all on one circle', () => {
  for (const n of [4, 6, 8]) {
    const pos = bedPositions(n);
    assert.equal(pos.length, n);
    assert.ok(near(pos[0].x, 50) && near(pos[0].y, 50 - 38.5, 0.01),
      `bed 1 top for n=${n}: got ${pos[0].x},${pos[0].y}`);
    // first step of a clockwise sweep heads right (x grows)
    assert.ok(pos[1].x > 50, `clockwise sweep right for n=${n}`);
    for (const p of pos) {
      assert.ok(near(Math.hypot(p.x - 50, p.y - 50), 38.5, 0.02), 'on the ring');
      assert.ok(near(p.angleDeg % 360, p.angleDeg), 'angle normalized 0..360');
    }
    assert.ok(pos[0].angleDeg >= 359.9 || pos[0].angleDeg <= 0.1, 'bed 1 at 0deg');
  }
});

test('bed numbering is 1-based and gap-consistent', () => {
  const pos = bedPositions(6);
  assert.deepEqual(pos.map(p => p.bed), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(pos.map(p => p.slot), [0, 1, 2, 3, 4, 5]);
});

test('rotation angles are evenly spaced (0deg = up, clockwise)', () => {
  for (const n of [4, 6, 8]) {
    const pos = bedPositions(n);
    const step = 360 / n;
    for (let i = 0; i < n; i++) {
      assert.ok(near(pos[i].angleDeg, i * step),
        `bed ${i + 1} bearing ${pos[i].angleDeg} ~ ${i * step}`);
    }
  }
});

test('ringLines connect each bed to its clockwise successor', () => {
  const n = 4;
  const pos = bedPositions(n);
  const lines = ringLines(n, pos);
  assert.equal(lines.length, n);
  assert.deepEqual([lines[0].x1, lines[0].y1], [pos[0].x, pos[0].y]);
  assert.deepEqual([lines[0].x2, lines[0].y2], [pos[1].x, pos[1].y]);
  // too few beds to form a ring: nothing to draw
  assert.deepEqual(ringLines(1), []);
  assert.deepEqual(ringLines(2), []);
});

test('positions honor custom center and radius', () => {
  const pos = bedPositions(8, { cx: 30, cy: 20, r: 10 });
  assert.ok(near(pos[0].x, 30) && near(pos[0].y, 20 - 10, 0.02));
});

test('color coding: same seed always same color, different seeds differ here', () => {
  const a = colorClassForSeed('royal-kukuru');
  assert.equal(a, colorClassForSeed('royal-kukuru'));
  const b = colorClassForSeed('mirror-apple');
  assert.notEqual(a, b, 'known pair crops must not collide on the 8-swatch palette');
  assert.equal(colorClassForSeed(''), '');
  assert.equal(colorClassForSeed(null), '');
});

test('paired seeds never share a swatch (they must look clearly different)', () => {
  for (const row of CROSS_TABLE) {
    assert.notEqual(colorClassForSeed(row.a), colorClassForSeed(row.b),
      `${row.a} vs ${row.b} collide`);
  }
  assert.equal(colorClassForSeed(''), '');
  assert.equal(colorClassForSeed(null), '');
});
