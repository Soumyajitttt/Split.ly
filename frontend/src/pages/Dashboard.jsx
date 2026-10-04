import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDataCache } from '../context/DataCache';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

/* ─── helpers ─────────────────────────────────────────────────────────── */

const G_COLORS = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];
const colorFor = (s = '') => G_COLORS[(s.charCodeAt(0) || 0) % G_COLORS.length];

// Whole rupees stay clean; anything with paise keeps two decimals so small amounts never show as ₹0.
const inr = (n) => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const hasPaise = Math.abs(v % 1) > 0;
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: hasPaise ? 2 : 0, maximumFractionDigits: 2 })}`;
};
const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(Math.round(n)));
const shortDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/** Eases a number up from 0 once (in paise, so the end value is exact), honouring reduced-motion. */
function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduced ? 0 : ms;
    const end = Math.round(target * 100);
    let raf = 0;
    let t0 = null;
    const tick = (t) => {
      if (t0 === null) t0 = t;
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      setV(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v / 100;
}

/* ─── hero: where you stand overall ───────────────────────────────────── */

function Hero({ owed, owe, openCount }) {
  const net = owed - owe;
  const absNet = Math.round(Math.abs(net) * 100) / 100;
  const shown = useCountUp(absNet);
  const hasPaise = Math.round(absNet * 100) % 100 !== 0;
  const whole = Math.floor(shown);
  const paise = String(Math.round((shown - whole) * 100)).padStart(2, '0');
  const total = owed + owe;

  const label = net > 0.5 ? "Overall, you're owed" : net < -0.5 ? 'Overall, you owe' : "You're all square";
  const note = openCount > 0
    ? `${openCount} payment${openCount === 1 ? '' : 's'} left to settle.`
    : 'Nothing left to settle right now.';

  return (
    <section className="dx-hero" aria-label="Overall balance">
      <i className="dx-blob b1" />
      <i className="dx-blob b2" />
      <div className="dx-dots" />

      <span className="dx-pill"><i />{label}</span>

      <div className="dx-num" aria-label={inr(absNet)}>
        <span className="dx-cur">₹</span>{whole.toLocaleString('en-IN')}
        {hasPaise && <span className="dx-paise">.{paise}</span>}
      </div>
      <p className="dx-note">{note}</p>

      <div className="dx-split" role="img" aria-label={`You're owed ${inr(owed)} and you owe ${inr(owe)}`}>
        {total === 0 ? (
          <span className="idle" />
        ) : (
          <>
            {owed > 0 && <span className="in" style={{ flexGrow: owed }} />}
            {owe > 0 && <span className="out" style={{ flexGrow: owe }} />}
          </>
        )}
      </div>

      <div className="dx-legend">
        <div>
          <small><i className="in" />You're owed</small>
          <b>{inr(owed)}</b>
        </div>
        <div>
          <small><i className="out" />You owe</small>
          <b>{inr(owe)}</b>
        </div>
      </div>
    </section>
  );
}

/* ─── spending chart ──────────────────────────────────────────────────── */

function Spending({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const cur = data[data.length - 1]?.value || 0;
  const prev = data[data.length - 2]?.value || 0;
  const empty = data.every(d => d.value === 0);

  let delta = null;
  if (prev > 0) {
    const pct = Math.round(((cur - prev) / prev) * 100);
    delta = pct === 0 ? 'Same as last month' : `${Math.abs(pct)}% ${pct > 0 ? 'more' : 'less'} than last month`;
  }

  return (
    <section className="dx-panel dx-spend">
      <div className="dx-head">
        <h2>Your spending</h2>
        <span className="dx-meta">Last 6 months</span>
      </div>
      <div className="dx-spend-top">
        <b>{inr(cur)}</b>
        <span>{delta || 'Your share this month'}</span>
      </div>
      <div className="dx-chart">
        {data.map((d, i) => {
          const last = i === data.length - 1;
          const pct = d.value === 0 ? 3 : Math.max(Math.round((d.value / max) * 100), 8);
          return (
            <div className="dx-col" key={`${d.label}-${i}`}>
              <div className="dx-track">
                <div className={`dx-bar ${last ? 'now' : ''}`} style={{ height: `${pct}%`, '--i': i }} title={inr(d.value)}>
                  {d.value > 0 && <em>{compact(d.value)}</em>}
                </div>
              </div>
              <span className={`dx-month ${last ? 'now' : ''}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
      {empty && <p className="dx-hint">Add an expense in a group to see your spending here.</p>}
    </section>
  );
}

/* ─── page ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const { fetchGroups, fetchMyExpenses, fetchAllSummaries } = useDataCache();

  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [groupSummaries, setGroupSummaries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [gs, exps] = await Promise.all([fetchGroups(), fetchMyExpenses()]);
        if (cancelled) return;
        setGroups(gs);
        setExpenses(exps);

        const { summaries: cachedSummaries, refreshPromise } = await fetchAllSummaries(gs);
        if (cancelled) return;
        setGroupSummaries(cachedSummaries);
        setLoading(false);

        refreshPromise.then(() => {
          if (cancelled) return;
          fetchAllSummaries(gs).then(({ summaries }) => {
            if (!cancelled) setGroupSummaries(summaries);
          });
        });
      } catch {
        if (!cancelled) {
          showToast('Failed to load dashboard');
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [fetchGroups, fetchMyExpenses, fetchAllSummaries]);

  /* totals (unchanged logic) */
  const totalOwe  = expenses.filter(e => e.status === 'PENDING').reduce((s, e) => s + (e.youOwe || 0), 0);
  const totalOwed = expenses.filter(e => e.status === 'YOU PAID').reduce((s, e) => s + (e.othersOweYou || 0), 0);

  /* last six months of my own share */
  const barData = (() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('en-IN', { month: 'short' }), month: d.getMonth(), year: d.getFullYear(), value: 0 });
    }
    expenses.forEach(e => {
      const dateStr = e.createdAt || e.date;
      if (!dateStr) return;
      const eDate = new Date(dateStr);
      const match = months.find(m => m.month === eDate.getMonth() && m.year === eDate.getFullYear());
      if (match) {
        const myShare = e.status === 'YOU PAID' ? e.amount - (e.othersOweYou || 0) : (e.youOwe || 0);
        match.value += myShare;
      }
    });
    months.forEach(m => { m.value = Math.round(m.value * 100) / 100; });
    return months;
  })();

  /* per-group net balance, from the same expense list */
  const groupNet = {};
  expenses.forEach(e => {
    const gid = e.group?._id || e.group;
    if (!gid) return;
    const delta = (e.status === 'YOU PAID' ? (e.othersOweYou || 0) : 0) - (e.status === 'PENDING' ? (e.youOwe || 0) : 0);
    groupNet[gid] = (groupNet[gid] || 0) + delta;
  });
  const groupRows = [...groups]
    .sort((a, b) => Math.abs(groupNet[b._id] || 0) - Math.abs(groupNet[a._id] || 0))
    .slice(0, 5);

  /* payments that involve me */
  const myId = user?._id ? String(user._id) : null;
  const settleRows = Object.entries(groupSummaries)
    .flatMap(([gid, s]) => (s?.settlements || []).map(x => ({ ...x, gid })))
    .filter(x => !myId || String(x.fromId) === myId || String(x.toId) === myId);

  const recent = [...expenses]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 5);

  const firstName = (user?.fullname || user?.username || '').split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
<div className="main-content">
          <div className="dx-wrap">
            <div className="page-header">
              <div>
                <div className="page-title">{greeting()}{firstName ? `, ${firstName}` : ''}</div>
                <div className="page-sub">{today}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/groups')}>
                <UserGroupIcon style={{ width: 15, height: 15 }} />
                Open groups
              </button>
            </div>

            {loading ? (
              <div className="dx-grid" aria-busy="true">
                <div className="dx-hero dx-loading"><i className="dx-blob b1" /><i className="dx-blob b2" /><div className="dx-dots" /></div>
                <div className="dx-panel dx-settle"><div className="dx-skel" style={{ width: 110, height: 16 }} /><div className="dx-skel" style={{ height: 44, marginTop: 22 }} /><div className="dx-skel" style={{ height: 44, marginTop: 12 }} /></div>
                <div className="dx-panel dx-spend"><div className="dx-skel" style={{ width: 130, height: 16 }} /><div className="dx-skel" style={{ height: 150, marginTop: 22 }} /></div>
                <div className="dx-panel dx-groups"><div className="dx-skel" style={{ width: 110, height: 16 }} /><div className="dx-skel" style={{ height: 44, marginTop: 22 }} /><div className="dx-skel" style={{ height: 44, marginTop: 12 }} /><div className="dx-skel" style={{ height: 44, marginTop: 12 }} /></div>
              </div>
            ) : (
              <div className="dx-grid">
                <Hero owed={totalOwed} owe={totalOwe} openCount={settleRows.length} />

                {/* who to pay / who pays you */}
                <section className="dx-panel dx-settle">
                  <div className="dx-head">
                    <h2>To settle</h2>
                    {settleRows.length > 0 && <span className="dx-meta">{settleRows.length} open</span>}
                  </div>
                  {settleRows.length === 0 ? (
                    <div className="dx-empty">
                      <span className="dx-empty-ic"><CheckCircleIcon style={{ width: 26, height: 26 }} /></span>
                      <b>{groups.length === 0 ? 'Nothing to settle' : 'All settled up'}</b>
                      <span>{groups.length === 0 ? 'Payments between friends will show up here.' : 'Nobody owes anybody in your groups.'}</span>
                    </div>
                  ) : (
                    <div className="dx-list">
                      {settleRows.slice(0, 4).map((s, i) => {
                        const iPay = myId ? String(s.fromId) === myId : false;
                        const iGet = myId ? String(s.toId) === myId : false;
                        const other = iPay ? s.to : iGet ? s.from : s.from;
                        const gname = groups.find(g => g._id === s.gid)?.name;
                        return (
                          <button className="dx-row" key={`${s.gid}-${i}`} onClick={() => navigate(`/groups/${s.gid}`)}>
                            <span className="dx-av" style={{ background: colorFor(other || '') }}>{(other || '?')[0].toUpperCase()}</span>
                            <span className="dx-row-text">
                              <span className="dx-row-title">
                                {iPay ? <>You pay <b>{s.to}</b></> : iGet ? <><b>{s.from}</b> pays you</> : <><b>{s.from}</b> pays <b>{s.to}</b></>}
                              </span>
                              {gname && <span className="dx-row-sub">{gname}</span>}
                            </span>
                            <span className={`dx-amt ${iPay ? 'out' : iGet ? 'in' : ''}`}>{inr(s.amount)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {settleRows.length > 4 && (
                    <button className="dx-more" onClick={() => navigate('/groups')}>See {settleRows.length - 4} more in your groups</button>
                  )}
                </section>

                <Spending data={barData} />

                {/* groups with their balance */}
                <section className="dx-panel dx-groups">
                  <div className="dx-head">
                    <h2>Your groups</h2>
                    {groups.length > 0 && (
                      <button className="dx-link" onClick={() => navigate('/groups')}>View all {groups.length}</button>
                    )}
                  </div>
                  {groupRows.length === 0 ? (
                    <div className="dx-empty">
                      <span className="dx-empty-ic"><UserGroupIcon style={{ width: 26, height: 26 }} /></span>
                      <b>No groups yet</b>
                      <span>Start one for your hostel, trip or flat and add the first expense.</span>
                      <button className="btn btn-primary btn-sm" onClick={() => navigate('/groups')}>
                        <PlusIcon style={{ width: 15, height: 15 }} />
                        Create a group
                      </button>
                    </div>
                  ) : (
                    <div className="dx-list">
                      {groupRows.map(g => {
                        const net = Math.round((groupNet[g._id] || 0) * 100) / 100;
                        const n = (g.members || []).length;
                        return (
                          <button className="dx-row" key={g._id} onClick={() => navigate(`/groups/${g._id}`)}>
                            <span className="dx-av sq" style={{ background: colorFor(g.name) }}>{g.name?.[0]?.toUpperCase()}</span>
                            <span className="dx-row-text">
                              <span className="dx-row-title"><b>{g.name}</b></span>
                              <span className="dx-row-sub">{n} member{n === 1 ? '' : 's'}</span>
                            </span>
                            <span className={`dx-chip ${net > 0 ? 'in' : net < 0 ? 'out' : ''}`}>
                              {net > 0 ? `+${inr(net)}` : net < 0 ? `−${inr(-net)}` : 'Settled'}
                            </span>
                            <ChevronRightIcon className="dx-chev" style={{ width: 16, height: 16 }} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* latest expenses */}
                <section className="dx-panel dx-activity">
                  <div className="dx-head">
                    <h2>Recent activity</h2>
                  </div>
                  {recent.length === 0 ? (
                    <div className="dx-empty">
                      <b>Nothing here yet</b>
                      <span>Open a group and add your first expense.</span>
                    </div>
                  ) : (
                    <div className="dx-list">
                      {recent.map((e, i) => {
                        const isSettlement = e.isSettlementRecord;
                        const tone = isSettlement || e.status === 'SETTLED' ? 'done' : e.status === 'YOU PAID' ? 'in' : 'out';
                        const Icon = tone === 'in' ? ArrowDownLeftIcon : tone === 'out' ? ArrowUpRightIcon : CheckCircleIcon;
                        const gname = e.group?.name;
                        const who = e.status === 'YOU PAID' || (myId && e.payerId === myId) ? 'you paid' : `${e.paidBy} paid`;
                        const sub = isSettlement ? (gname ? `${gname}, payment` : 'Payment') : gname ? `${gname}, ${who}` : who.charAt(0).toUpperCase() + who.slice(1);
                        const amount = tone === 'in' ? e.othersOweYou : tone === 'out' ? e.youOwe : e.amount;
                        const caption = isSettlement ? 'payment' : tone === 'in' ? "you're owed" : tone === 'out' ? 'you owe' : 'settled';
                        return (
                          <div className="dx-row static" key={e._id || i}>
                            <span className={`dx-ic ${tone}`}><Icon style={{ width: 18, height: 18 }} /></span>
                            <span className="dx-row-text">
                              <span className="dx-row-title"><b>{e.title || e.description}</b></span>
                              <span className="dx-row-sub">{sub}</span>
                            </span>
                            <span className="dx-right">
                              <span className={`dx-amt ${tone === 'done' ? '' : tone}`}>
                                {tone === 'in' ? '+' : tone === 'out' ? '−' : ''}{inr(amount)}
                              </span>
                              <span className="dx-row-sub">{caption}{shortDate(e.createdAt || e.date) ? `, ${shortDate(e.createdAt || e.date)}` : ''}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
  );
}