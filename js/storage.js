// Local-save garden board: per-bed plantings plus water/tend logs by day.
// Persistence is injectable; defaults to browser localStorage. No data
// ever leaves the user's machine.

const KEY = 'ffxiv-garden-crossbreed-planner:board:v1';
const KEEP_DAYS = 14;

export function todayISO(now = new Date()) {
  return now.toISOString().slice(0, 10); // FFXIV earth-day, UTC is fine for casual use
}

function emptyState() {
  return { beds: {}, logs: {}, updatedAt: null };
}

function checkKind(kind) {
  const kinds = ['watered', 'tended'];
  if (!kinds.includes(kind)) throw new TypeError(`kind must be one of ${kinds}`);
}

export function createBoardStore({
  save = typeof localStorage !== 'undefined' ? (key, v) => localStorage.setItem(key, v) : () => {},
  load = typeof localStorage !== 'undefined' ? (key) => localStorage.getItem(key) : () => null,
  now = () => new Date()
} = {}) {
  let state = null;

  function persist() {
    save(KEY, JSON.stringify(state));
  }

  function refresh() {
    const raw = load(KEY);
    state = emptyState();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          state.beds = parsed.beds || {};
          state.logs = {};
          const cutoff = cutoffDate(now());
          for (const [day, entry] of Object.entries(parsed.logs || {})) {
            if (day >= cutoff) state.logs[day] = entry;
          }
        }
      } catch {
        state = emptyState();
      }
    }
    return state;
  }

  function cutoffDate(today) {
    const d = new Date(today.getTime() - (KEEP_DAYS - 1) * 86400000);
    return d.toISOString().slice(0, 10);
  }

  function state_() {
    if (!state) refresh();
    return state;
  }

  return {
    // Planting ------------------------------------------------------------
    plantBed(bed, seedId, day = todayISO(now())) {
      const s = state_();
      if (!Number.isInteger(bed) || bed < 1) throw new RangeError('bed must be >= 1');
      if (!seedId) throw new TypeError('seedId required');
      s.beds[bed] = { seed: seedId, plantedOn: day };
      persist();
      return s.beds[bed];
    },
    clearBed(bed) {
      const s = state_();
      if (s.beds[bed]) {
        delete s.beds[bed];
        persist();
        return true;
      }
      return false;
    },
    bedInfo(bed) {
      return state_().beds[bed] || null;
    },

    // Daily log ------------------------------------------------------------
    toggleDayFlag(bed, kind, day = todayISO(now()), on = null) {
      const s = state_();
      checkKind(kind);
      const entry = (s.logs[day] ||= {});
      const set = new Set(entry[kind] || []);
      const want = on === null ? !set.has(bed) : Boolean(on);
      if (want) set.add(bed);
      else set.delete(bed);
      entry[kind] = [...set].sort((a, b) => a - b);
      s.updatedAt = day;
      persist();
      return want;
    },
    isFlagged(bed, kind, day = todayISO(now())) {
      const s = state_();
      checkKind(kind);
      return (s.logs[day]?.[kind] || []).includes(bed);
    },
    recentDays(count = 7, day = todayISO(now())) {
      const out = [];
      const t = new Date(day + 'T00:00:00Z');
      for (let i = count - 1; i >= 0; i--) {
        out.push(new Date(t.getTime() - i * 86400000).toISOString().slice(0, 10));
      }
      return out;
    },

    // Housekeeping ----------------------------------------------------------
    clearAll() {
      state = emptyState();
      persist();
    }
  };
}
