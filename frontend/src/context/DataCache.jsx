import { createContext, useContext, useRef, useCallback } from 'react';
import { getMyGroups, getMyExpenses, getGroupDetails, getGroupExpenses, getGroupSummary } from '../api';

const GROUPS_TTL   = 60_000;
const GROUP_TTL    = 30_000;
const EXPENSES_TTL = 60_000;
const SUMMARY_TTL  = 30_000;

function isStale(entry, ttl) {
  return !entry || Date.now() - entry.ts > ttl;
}

const DataCacheCtx = createContext(null);

export function DataCacheProvider({ children }) {
  const cache = useRef({
    groups:      null,
    expenses:    null,
    summaries:   {},   // ← NEW: { [groupId]: { ts, data } }
    groupDetail: {},
  });

  const inflight = useRef({
    groups:      null,
    expenses:    null,
    summaries:   {},   // ← NEW
    groupDetail: {},
  });

  // ── Groups ───────────────────────────────────────────────────────────────────
  const fetchGroups = useCallback(async ({ force = false } = {}) => {
    if (!force && !isStale(cache.current.groups, GROUPS_TTL)) {
      return cache.current.groups.data;
    }
    if (inflight.current.groups) return inflight.current.groups;

    inflight.current.groups = (async () => {
      try {
        const { data } = await getMyGroups();
        const groups = data.groups || [];
        cache.current.groups = { ts: Date.now(), data: groups };
        return groups;
      } finally {
        inflight.current.groups = null;
      }
    })();

    return inflight.current.groups;
  }, []);

  const invalidateGroups = useCallback(() => {
    cache.current.groups = null;
  }, []);

  // ── My expenses ──────────────────────────────────────────────────────────────
  const fetchMyExpenses = useCallback(async ({ force = false } = {}) => {
    if (!force && !isStale(cache.current.expenses, EXPENSES_TTL)) {
      return cache.current.expenses.data;
    }
    if (inflight.current.expenses) return inflight.current.expenses;

    inflight.current.expenses = (async () => {
      try {
        const { data } = await getMyExpenses();
        const expenses = data.expenses || [];
        cache.current.expenses = { ts: Date.now(), data: expenses };
        return expenses;
      } finally {
        inflight.current.expenses = null;
      }
    })();

    return inflight.current.expenses;
  }, []);

  const invalidateMyExpenses = useCallback(() => {
    cache.current.expenses = null;
  }, []);

  // ── Per-group summary ────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async (groupId, { force = false } = {}) => {
    const entry = cache.current.summaries[groupId];
    if (!force && !isStale(entry, SUMMARY_TTL)) return entry.data;
    if (inflight.current.summaries[groupId]) return inflight.current.summaries[groupId];

    inflight.current.summaries[groupId] = (async () => {
      try {
        const { data } = await getGroupSummary(groupId);
        cache.current.summaries[groupId] = { ts: Date.now(), data };
        return data;
      } finally {
        delete inflight.current.summaries[groupId];
      }
    })();

    return inflight.current.summaries[groupId];
  }, []);

  // ── All summaries — stale-while-revalidate ───────────────────────────────────
  // Returns cached data instantly + a refreshPromise for stale entries.
  const fetchAllSummaries = useCallback(async (groups, { force = false } = {}) => {
    const cached = {};
    const toFetch = [];

    for (const g of groups) {
      const entry = cache.current.summaries[g._id];
      if (!force && !isStale(entry, SUMMARY_TTL)) {
        cached[g._id] = entry.data;
      } else {
        cached[g._id] = entry?.data || null; // serve stale immediately
        toFetch.push(g._id);
      }
    }

    // Fire stale fetches in parallel without blocking
    const refreshPromise = toFetch.length > 0
      ? Promise.all(toFetch.map(id => fetchSummary(id, { force: true }).catch(() => null)))
          .then(() => {
            // return freshly populated cache after all settle
            const fresh = {};
            groups.forEach(g => {
              fresh[g._id] = cache.current.summaries[g._id]?.data || null;
            });
            return fresh;
          })
      : Promise.resolve(cached);

    return { summaries: cached, refreshPromise };
  }, [fetchSummary]);

  // ── Group detail ─────────────────────────────────────────────────────────────
  const fetchGroupData = useCallback(async (groupId, { force = false } = {}) => {
    const entry = cache.current.groupDetail[groupId];
    if (!force && !isStale(entry, GROUP_TTL)) {
      return { group: entry.group, expenses: entry.expenses, summary: entry.summary };
    }
    if (inflight.current.groupDetail[groupId]) {
      return inflight.current.groupDetail[groupId];
    }

    inflight.current.groupDetail[groupId] = (async () => {
      try {
        const [gRes, eRes, sRes] = await Promise.all([
          getGroupDetails(groupId),
          getGroupExpenses(groupId),
          getGroupSummary(groupId),
        ]);
        const result = {
          group:    gRes.data.group,
          expenses: eRes.data.expenses || [],
          summary:  sRes.data,
        };
        cache.current.groupDetail[groupId] = { ts: Date.now(), ...result };
        // Populate summary cache so Dashboard benefits on next visit
        cache.current.summaries[groupId] = { ts: Date.now(), data: sRes.data };
        return result;
      } finally {
        delete inflight.current.groupDetail[groupId];
      }
    })();

    return inflight.current.groupDetail[groupId];
  }, []);

  const invalidateGroup = useCallback((groupId) => {
    delete cache.current.groupDetail[groupId];
    delete cache.current.summaries[groupId];
  }, []);

  const invalidateAll = useCallback(() => {
    cache.current = { groups: null, expenses: null, summaries: {}, groupDetail: {} };
  }, []);

  const addGroupToCache = useCallback((group) => {
    if (cache.current.groups) {
      cache.current.groups = {
        ts: cache.current.groups.ts,
        data: [group, ...cache.current.groups.data],
      };
    }
  }, []);

  const value = {
    fetchGroups,
    invalidateGroups,
    fetchMyExpenses,
    invalidateMyExpenses,
    fetchSummary,
    fetchAllSummaries,
    fetchGroupData,
    invalidateGroup,
    invalidateAll,
    addGroupToCache,
  };

  return <DataCacheCtx.Provider value={value}>{children}</DataCacheCtx.Provider>;
}

export function useDataCache() {
  const ctx = useContext(DataCacheCtx);
  if (!ctx) throw new Error('useDataCache must be used inside <DataCacheProvider>');
  return ctx;
}