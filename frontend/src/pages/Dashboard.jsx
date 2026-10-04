import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDataCache } from '../context/DataCache';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

const G_COLORS = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];
const colorFor = (s = '') => G_COLORS[(s.charCodeAt(0) || 0) % G_COLORS.length];
const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

function Metric({ label, value, note, dot }) {
  return (
    <div className="metric">
      <div className="metric-label">
        <span className="metric-dot" style={{ background: dot }} />
        {label}
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct = Math.max(Math.round((d.value / max) * 85), 4);
        const isAccent = i === data.length - 1;
        return (
          <div className="bar-col" key={d.label}>
            <div
              className={`bar ${isAccent ? 'accent' : ''}`}
              style={{ height: `${pct}%` }}
              title={`₹${d.value}`}
            />
            <span className="bar-label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const { fetchGroups, fetchMyExpenses, fetchAllSummaries } = useDataCache();

  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [groupSummaries, setGroupSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        // Step 1: get groups + expenses from cache (instant on revisit)
        const [gs, exps] = await Promise.all([fetchGroups(), fetchMyExpenses()]);
        if (cancelled) return;
        setGroups(gs);
        setExpenses(exps);

        // Step 2: get whatever summaries are cached right now — render immediately
        const { summaries: cachedSummaries, refreshPromise } = await fetchAllSummaries(gs);
        if (cancelled) return;
        setGroupSummaries(cachedSummaries);
        setLoading(false);

        // Step 3: when stale summaries finish refreshing in the background, update quietly
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

  const totalOwe  = expenses.filter(e => e.status === 'PENDING').reduce((s, e) => s + (e.youOwe || 0), 0);
  const totalOwed = expenses.filter(e => e.status === 'YOU PAID').reduce((s, e) => s + (e.othersOweYou || 0), 0);
  const totalTracked = expenses.reduce((s, e) => s + (e.amount || 0), 0);

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
    months.forEach(m => { m.value = Math.round(m.value); });
    return months;
  })();

  const recentActivity = [...expenses]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 6);

  const allSettlements = Object.entries(groupSummaries).flatMap(([gId, s]) => {
    const group = groups.find(g => g._id === gId);
    return (s?.settlements || []).map(st => ({ ...st, groupName: group?.name || '' }));
  });

  // 6-month spend trend for one group (same matching logic as before)
  const sparkFor = (g) => {
    const now = new Date();
    const totals = [0, 0, 0, 0, 0, 0];
    expenses.forEach(e => {
      const isGroupMatch =
        String(e.group?._id) === String(g._id) ||
        String(e.group) === String(g._id) ||
        String(e.groupId) === String(g._id) ||
        e.group?.name === g.name;
      const dateStr = e.createdAt || e.date;
      if (isGroupMatch && dateStr) {
        const eDate = new Date(dateStr);
        const monthDiff = (now.getFullYear() - eDate.getFullYear()) * 12 + (now.getMonth() - eDate.getMonth());
        if (monthDiff >= 0 && monthDiff < 6) totals[5 - monthDiff] += (e.amount || 0);
      }
    });
    const max = Math.max(...totals, 1);
    return { totals, sparks: totals.map(v => (v === 0 ? 0.06 : Math.max(v / max, 0.15))) };
  };

  const monthLabel = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        showMenu
        onMenuClick={() => setSidebarOpen(true)}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Home
          </button>
        }
      />
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <div className="page-header">
            <div>
              <div className="crumbs">Workspace <span>/</span> <b>Dashboard</b></div>
              <div className="page-title">Dashboard</div>
              <div className="page-sub">Your financial overview for {monthLabel}</div>
            </div>
            <span className="tag tag-green" style={{ alignSelf: 'center' }}>
              <span className="live-dot" />
              Live
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: 'var(--primary)' }}>
              <Spinner />
            </div>
          ) : (
            <>
              {/* Metrics */}
              <div className="metrics">
                <Metric dot="#00a67e" label="Owed to you" value={inr(totalOwed)} note="From all groups" />
                <Metric dot="#ff6b35" label="You owe" value={inr(totalOwe)} note="Across groups" />
                <Metric dot="#0056c6" label="Total tracked" value={inr(totalTracked)} note={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`} />
                <Metric dot="#7a5cff" label="Active groups" value={String(groups.length)} note={`${groups.reduce((s, g) => s + (g.members?.length || 0), 0)} total members`} />
              </div>

              {/* Spending + activity */}
              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Monthly spending</div>
                    <span className="panel-meta">Last 6 months</span>
                  </div>
                  <div className="panel-body">
                    <BarChart data={barData} />
                    {barData.every(d => d.value === 0) && (
                      <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 10, fontWeight: 500 }}>
                        Add expenses to see spending trends
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Recent activity</div>
                  </div>
                  <div className="activity-feed">
                    {recentActivity.length === 0 ? (
                      <div className="empty-line">No activity yet. Add an expense in a group.</div>
                    ) : recentActivity.map((e, i) => {
                      const paid = e.status === 'YOU PAID';
                      return (
                        <div className="activity-item" key={i}>
                          <div
                            className="activity-icon"
                            style={{ background: paid ? 'var(--success-bg)' : 'var(--secondary-fixed)', color: paid ? 'var(--success)' : 'var(--secondary)' }}
                          >
                            {paid
                              ? <ArrowUpRightIcon style={{ width: 16, height: 16 }} />
                              : <ReceiptPercentIcon style={{ width: 16, height: 16 }} />}
                          </div>
                          <div className="activity-text">
                            <div className="activity-name">{e.title || e.description}</div>
                            <div className="activity-sub">{e.paidBy || e.paidby?.fullname} paid · {e.status}</div>
                          </div>
                          <div className={`activity-amount ${e.status === 'PENDING' ? 'owed' : ''}`}>
                            {e.status === 'PENDING' ? '−' : '+'}₹{(e.amount || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Groups + settlements */}
              <div className="dashboard-grid">
                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">My groups</div>
                    <button className="panel-link" onClick={() => navigate('/groups')}>View all</button>
                  </div>
                  {groups.length === 0 ? (
                    <div className="empty-line">
                      No groups yet —{' '}
                      <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/groups')}>
                        create one
                      </span>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Group</th>
                            <th>Code</th>
                            <th>6-month trend</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groups.slice(0, 6).map(g => {
                            const s = groupSummaries[g._id];
                            const { totals, sparks } = sparkFor(g);
                            return (
                              <tr key={g._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/groups/${g._id}`)}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                                    <span className="glist-ic" style={{ width: 30, height: 30, borderRadius: 9, fontSize: 13, background: colorFor(g.name) }}>
                                      {g.name[0]?.toUpperCase()}
                                    </span>
                                    <div>
                                      <div style={{ fontWeight: 700 }}>{g.name}</div>
                                      <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 500 }}>{g.members?.length} members</div>
                                    </div>
                                  </div>
                                </td>
                                <td><span className="glist-code">{g.groupcode}</span></td>
                                <td>
                                  <div className="sparkline-row">
                                    {sparks.map((h, j) => (
                                      <div
                                        key={j}
                                        className={`spark-bar ${j === sparks.length - 1 ? 'highlight' : ''}`}
                                        style={{ height: `${h * 100}%` }}
                                        title={`₹${totals[j]}`}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="num">{inr(s?.totalExpense)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-head">
                    <div className="panel-title">Settlement summary</div>
                    {allSettlements.length > 0 && <span className="panel-meta">{allSettlements.length} pending</span>}
                  </div>
                  {allSettlements.length === 0 ? (
                    <div style={{ padding: 18 }}>
                      <span className="tag tag-green" style={{ padding: '8px 14px', fontSize: 13 }}>
                        <CheckCircleIcon style={{ width: 16, height: 16 }} />
                        All settled up
                      </span>
                    </div>
                  ) : (
                    <table className="owe-table">
                      <thead>
                        <tr>
                          <th>From</th>
                          <th>To</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSettlements.slice(0, 6).map((s, i) => (
                          <tr key={i}>
                            <td>{s.from}</td>
                            <td style={{ color: 'var(--on-surface-variant)' }}>{s.to}</td>
                            <td className="amount-owed">−{inr(s.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}