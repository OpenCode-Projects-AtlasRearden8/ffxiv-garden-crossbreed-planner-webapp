import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBoardStore, todayISO } from '../js/storage.js';

function fakeSaveLoad() {
  const bag = new Map();
  return {
    save: (k, v) => bag.set(k, v),
    load: (k) => (bag.has(k) ? bag.get(k) : null),
    bag
  };
}

const DAY = '2033-05-06';
const now = () => new Date(DAY + 'T12:00:00Z');

test('todayISO gives YYYY-MM-DD', () => {
  assert.match(todayISO(new Date('2026-11-07T23:59:59Z')), /^2026-11-\d\d$/);
});

test('plant, read, clear beds', () => {
  const { save, load } = fakeSaveLoad();
  const store = createBoardStore({ save, load, now });

  store.plantBed(1, 'old-world-fig', DAY);
  store.plantBed(2, 'mirror-apple', DAY);
  assert.equal(store.bedInfo(1).seed, 'old-world-fig');
  assert.equal(store.bedInfo(1).plantedOn, DAY);
  assert.equal(store.bedInfo(5), null);

  store.clearBed(1);
  assert.equal(store.bedInfo(1), null);
  assert.equal(store.clearBed(1), false);

  assert.throws(() => store.plantBed(0, 'echo'), RangeError);
  assert.throws(() => store.plantBed(1, ''), TypeError);
});

test('day flags toggle and persist independently per bed/day/kind', () => {
  const { save, load } = fakeSaveLoad();
  const store = createBoardStore({ save, load, now });

  assert.equal(store.isFlagged(2, 'watered', DAY), false);
  assert.equal(store.toggleDayFlag(2, 'watered', DAY), true);
  assert.equal(store.isFlagged(2, 'watered', DAY), true);
  assert.equal(store.toggleDayFlag(2, 'watered', DAY), false);
  assert.equal(store.toggleDayFlag(2, 'tended', DAY), true);
  assert.equal(store.isFlagged(2, 'tended', DAY), true);
  assert.equal(store.isFlagged(3, 'tended', DAY), false);
  assert.equal(store.isFlagged(2, 'tended', '2033-05-05'), false);
  assert.throws(() => store.isFlagged(2, 'snacked', DAY), TypeError);
});

test('state survives a reload (round-trip through the fake backend)', () => {
  const { save, load } = fakeSaveLoad();
  const store = createBoardStore({ save, load, now });
  store.plantBed(4, 'krakka-root', DAY);
  store.toggleDayFlag(4, 'watered', DAY, true);

  const store2 = createBoardStore({ save, load, now });
  assert.equal(store2.bedInfo(4).seed, 'krakka-root');
  assert.equal(store2.isFlagged(4, 'watered', DAY), true);
  assert.equal(store2.isFlagged(4, 'tended', DAY), false);
});

test('logs older than 14 days are pruned on load', () => {
  const { save, load, bag } = fakeSaveLoad();
  const first = createBoardStore({ save, load, now });
  first.toggleDayFlag(1, 'watered', DAY, true);
  first.toggleDayFlag(2, 'tended', DAY, true);

  // simulate a genuinely old log written long ago (20 days before DAY)
  const oldKeyDay = new Date(now().getTime() - 20 * 86400000)
    .toISOString().slice(0, 10);
  const raw = JSON.parse(bag.get('ffxiv-garden-crossbreed-planner:board:v1'));
  raw.logs[oldKeyDay] = { watered: [7], tended: [7] };
  bag.set('ffxiv-garden-crossbreed-planner:board:v1', JSON.stringify(raw));

  // keep only 6 days back, to force pruning of DAY too if cutoff were tight
  const store2 = createBoardStore({ save, load, now });
  assert.equal(store2.isFlagged(1, 'watered', DAY), true);
  assert.equal(store2.isFlagged(7, 'watered', oldKeyDay), false,
    '20-day-old log pruned');
});

test('clearAll wipes plantings and logs', () => {
  const { save, load } = fakeSaveLoad();
  const store = createBoardStore({ save, load, now });
  store.plantBed(3, 'chive', DAY);
  store.toggleDayFlag(3, 'watered', DAY, true);
  store.clearAll();
  assert.equal(store.bedInfo(3), null);
  assert.equal(store.isFlagged(3, 'watered', DAY), false);

  const store2 = createBoardStore({ save, load, now });
  assert.equal(store2.bedInfo(3), null, 'wipes persist to storage');
});

test('corrupt stored JSON degrades to an empty board instead of crashing', () => {
  const { save, load, bag } = fakeSaveLoad();
  bag.set('ffxiv-garden-crossbreed-planner:board:v1', '{not json');
  const store = createBoardStore({ save, load, now });
  assert.equal(store.bedInfo(1), null);
  assert.equal(store.isFlagged(1, 'watered', DAY), false);
});

test('recentDays returns ascending day list ending today', () => {
  const { save, load } = fakeSaveLoad();
  const store = createBoardStore({ save, load, now });
  assert.deepEqual(store.recentDays(7), [
    '2033-04-30', '2033-05-01', '2033-05-02', '2033-05-03',
    '2033-05-04', '2033-05-05', '2033-05-06'
  ]);
});
