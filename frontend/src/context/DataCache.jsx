/**
 * DataCache.jsx  –  context/DataCache.jsx
 *
 * A shared, in-memory cache for groups, per-group expenses, and summaries.
 * Pages read from the cache on first render (instant) and only hit the
 * network when the data is genuinely stale or explicitly invalidated.
 *
 * Usage
 * ─────
 * 1. Wrap your router with <DataCacheProvider>
 * 2. In any page:
 *      const { groups, invalidateGroups, getGroupData, invalidateGroup } = useDataCache();
 *
 * Cache TTL
 * ─────────
 * Groups list   → 60 s
 * Group detail  → 30 s  (expenses + summary)
 * Dashboard expenses → 60 s
 *
 * Call invalidate* after any mutation to force the next read to re-fetch.
 */

import { createContext, useContext, useRef, useCallback } from 'react';
import { getMyGroups, getMyExpenses, getGroupDetails, getGroupExpenses, getGroupSummary } from '../api';

// ─── TTLs (ms) ────────────────────────────────────────────────────────────────
const GROUPS_TTL   = 60_000;
const GROUP_TTL    = 30_000;
const EXPENSES_TTL = 60_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isStale(entry, ttl) {
  return !entry || Date.now() - entry.ts > ttl;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const DataCacheCtx = createContext(null);

export function DataCacheProvider({ children }) {
  // All cache lives in a ref so updates never trigger re-renders by themselves.
  const cache = useRef({
    groups:       null,   // { ts, data: Group[] }
    expenses:     null,   // { ts, data: Expense[] }   (dashboard / my expenses)
    groupDetail:  {},     // { [groupId]: { ts, group, expenses, summary } }
  });

  // In-flight promise deduplication — prevents parallel identical fetches
  const inflight = useRef({
    groups:      null,
    expenses:    null,
    groupDetail: {},
  });

  // ── Groups list ─────────────────────────────────────────────────────────────
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

  // ── My expenses (dashboard) ─────────────────────────────────────────────────
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

  // ── Group detail (group + expenses + summary) ───────────────────────────────
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
        return result;
      } finally {
        delete inflight.current.groupDetail[groupId];
      }
    })();

    return inflight.current.groupDetail[groupId];
  }, []);

  const invalidateGroup = useCallback((groupId) => {
    delete cache.current.groupDetail[groupId];
  }, []);

  // Invalidate everything (e.g. on logout)
  const invalidateAll = useCallback(() => {
    cache.current = { groups: null, expenses: null, groupDetail: {} };
  }, []);

  // Optimistic patch helpers — update cache without re-fetching ─────────────
  // Add a new group to the cached list
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