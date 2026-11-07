// Crop/seed dataset for the FFXIV Garden Crossbreed Planner.
// Community-researched cross pairs; a starter subset of popular targets.
// Every pair is order-independent: { a, b, chance? } wildcards allowed via ids.

export const PATCHES = [
  { id: 'round', name: 'Round Garden Patch', beds: 4 },
  { id: 'oblong', name: 'Oblong Garden Patch', beds: 6 },
  { id: 'deluxe', name: 'Deluxe Garden Patch', beds: 8 }
];

// Seeds/crops. `crossOnly` targets can only be grown from their seeds.
export const CROPS = [
  { id: 'old-world-fig',   name: 'Old World Fig',   seedName: 'Old World Fig Seeds' },
  { id: 'mirror-apple',    name: 'Mirror Apple',    seedName: 'Mirror Apple Seeds' },
  { id: 'prickly-pineapple', name: 'Prickly Pineapple', seedName: 'Prickly Pineapple Seeds' },
  { id: 'krakka-root',     name: 'Krakka Root',     seedName: 'Krakka Root Seeds' },
  { id: 'broombush',       name: 'Broombush',       seedName: 'Broombush Seeds', crossOnly: true },
  { id: 'royal-kukuru',    name: 'Royal Kukuru',    seedName: 'Royal Kukuru Seeds', crossOnly: true },
  { id: 'glazenut',        name: 'Glazenut',        seedName: 'Glazenut Seeds', crossOnly: true },
  { id: 'blood-pepper',    name: 'Blood Pepper',    seedName: 'Blood Pepper Seeds', crossOnly: true },
  { id: 'jute',            name: 'Jute',            seedName: 'Jute Seeds', crossOnly: true },
  { id: 'royal-fern',      name: 'Royal Fern',      seedName: 'Royal Fern Seeds', crossOnly: true },
  { id: 'chive',           name: 'Chive',           seedName: 'Chive Seeds', crossOnly: true },
  { id: 'pearl-sprouts',   name: 'Pearl Sprouts',   seedName: 'Pearl Sprout Seeds', crossOnly: true },
  { id: 'clary-sage',      name: 'Clary Sage',      seedName: 'Clary Sage Seeds', crossOnly: true },
  { id: 'tantalizing-thyme', name: 'Tantalizing Thyme', seedName: 'Tantalizing Thyme Seeds', crossOnly: true },
  { id: 'wild-onion',      name: 'Wild Onion',      seedName: 'Wild Onion Seeds' },
  { id: 'blood-currant',   name: 'Blood Currant',   seedName: 'Blood Currant Seeds' },
  { id: 'ialmelon',        name: 'Ialmelon',        seedName: 'Ialmelon Seeds' },
  { id: 'eggplant',        name: 'Eggplant',        seedName: 'Eggplant Seeds' },
  { id: 'garlean-garlic',  name: 'Garlean Garlic',  seedName: 'Garlean Garlic Seeds' },
  { id: 'midland-basil',   name: 'Midland Basil',   seedName: 'Midland Basil Seeds' }
];

// Known crossbreed PAIRS that can yield seeds for `target`.
// chance: community-estimated %, purely informational.
export const CROSS_TABLE = [
  { target: 'royal-kukuru',  a: 'old-world-fig', b: 'mirror-apple',     chance: 50 },
  { target: 'glazenut',      a: 'prickly-pineapple', b: 'old-world-fig', chance: 30 },
  { target: 'blood-pepper',  a: 'krakka-root',   b: 'broombush',        chance: 35 },
  { target: 'broombush',     a: 'wild-onion',    b: 'old-world-fig',    chance: 30 },
  { target: 'jute',          a: 'krakka-root',   b: 'old-world-fig',    chance: 25 },
  { target: 'royal-fern',    a: 'mirror-apple',  b: 'prickly-pineapple', chance: 30 },
  { target: 'chive',         a: 'krakka-root',   b: 'mirror-apple',     chance: 30 },
  { target: 'pearl-sprouts', a: 'prickly-pineapple', b: 'garlean-garlic', chance: 30 },
  { target: 'clary-sage',    a: 'midland-basil', b: 'old-world-fig',    chance: 30 },
  { target: 'tantalizing-thyme', a: 'midland-basil', b: 'krakka-root',  chance: 30 },
  { target: 'ialmelon',      a: 'eggplant',      b: 'prickly-pineapple', chance: 35 },
  { target: 'blood-currant', a: 'wild-onion',    b: 'mirror-apple',     chance: 35 }
];

export const SOILS = [
  { id: 'plain',    name: 'Potting Soil' },
  { id: 'lanoscea', name: 'La Noscea Topsoil' },
  { id: 'shroud',   name: 'Shroud Topsoil' },
  { id: 'thanalan', name: 'Thanalan Topsoil (best for intercrossing)' }
];

export function getPatch(p) {
  return PATCHES.find(x => x.id === (p && p.id ? p.id : p)) || PATCHES[0];
}
export function getCrop(c) {
  return CROPS.find(x => x.id === (c && c.id ? c.id : c)) || null;
}
export function cropsForDropdown() {
  return [...CROPS].sort((x, y) => x.name.localeCompare(y.name));
}
export function crossesFor(targetId) {
  return CROSS_TABLE.filter(r => r.target === targetId);
}
