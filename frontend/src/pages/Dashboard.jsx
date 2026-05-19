import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Spinner } from '../components/ui';
import { getMyGroups, getMyExpenses, getGroupSummary } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  InboxIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';


function StatCard({ label, value, change, changeType, accent, bgBlob }) {
  const isOwed = label.toLowerCase().includes('you owe') && !label.includes('Owed to');
  return (
    <div
      className="stat-card"
      style={{
        background: accent ? 'var(--primary)' : 'var(--surface-container-lowest)',
        color: accent ? 'var(--on-primary)' : 'var(--on-surface)',
      }}
    >
      {/* Decorative blob */}
      <div
        style={{
          position: 'absolute',
          right: -20,
          top: -20,
          width: 80,
          height: 80,
          background: accent
            ? 'rgba(255,255,255,0.12)'
            : isOwed
            ? 'rgba(253,108,0,0.08)'
            : 'rgba(0,86,198,0.06)',
          borderRadius: '50%',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <div
        className="stat-label-sm"
        style={{ color: accent ? 'rgba(255,255,255,0.7)' : undefined }}
      >
        {label}
      </div>
      <div
        className="stat-value"
        style={{
          color: accent
            ? 'var(--on-primary)'
            : isOwed
            ? 'var(--secondary-container)'
            : 'var(--on-surface)',
          fontSize: 32,
        }}
      >
        {value}
      </div>
      {change && (
        <div
          className={`stat-change ${changeType || ''}`}
          style={{ color: accent ? 'rgba(255,255,255,0.65)' : undefined }}
        >
          {change}
        </div>
      )}
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
  const hasFetched = useRef(false);

  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [groupSummaries, setGroupSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [gRes, eRes] = await Promise.all([getMyGroups(), getMyExpenses()]);
        const gs = gRes.data.groups || [];
        setGroups(gs);
        setExpenses(eRes.data.expenses || []);

        const summaries = {};
        for (const g of gs) {
          try {
            const sRes = await getGroupSummary(g._id);
            summaries[g._id] = sRes.data;
          } catch {}
        }
        setGroupSummaries(summaries);
      } catch {
        showToast('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    .slice(0, 5);

  const allSettlements = Object.entries(groupSummaries).flatMap(([gId, s]) => {
    const group = groups.find(g => g._id === gId);
    return (s?.settlements || []).map(st => ({ ...st, groupName: group?.name || '' }));
  });

  const initials = user?.fullname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        showMenu
        onMenuClick={() => setSidebarOpen(true)}
        actions={
          <>
            {/* <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'white', fontWeight: 600 }} className="sidebar-avatar">
              {initials}
            </span> */}
            <button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/')}
          >
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Home
          </button>
          </>
        }
      />
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          {/* Header */}
          <div className="page-header">
            <div>
              <div className="page-title">Dashboard</div>
              <div className="page-sub">
                Your financial overview · {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <span
              className="tag tag-primary"
              style={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span style={{ width: 7, height: 7, background: 'var(--primary)', borderRadius: '50%', animation: 'pulse 2s ease infinite', display: 'inline-block' }} />
              Live
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
              <Spinner />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-row">
                <StatCard
                  accent
                  label="Total Owed to You"
                  value={`₹${Math.round(totalOwed).toLocaleString('en-IN')}`}
                  change="From all groups"
                  changeType="up"
                />
                <StatCard
                  label="You Owe Others"
                  value={`₹${Math.round(totalOwe).toLocaleString('en-IN')}`}
                  change="Across groups"
                  changeType="down"
                />
                <StatCard
                  label="Total Tracked"
                  value={`₹${Math.round(totalTracked).toLocaleString('en-IN')}`}
                  change={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
                />
                <StatCard
                  label="Active Groups"
                  value={String(groups.length)}
                  change={`${groups.reduce((s, g) => s + (g.members?.length || 0), 0)} total members`}
                />
              </div>

              {/* Charts Row */}
              <div className="dashboard-grid">
                <div className="chart-card">
                  <div className="chart-title">
                    Monthly Spending <span className="chart-title-tag">6 Months</span>
                  </div>
                  <BarChart data={barData} />
                  {barData.every(d => d.value === 0) && (
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 8, fontWeight: 500 }}>
                      Add expenses to see spending trends
                    </div>
                  )}
                </div>

                <div className="chart-card">
                  <div className="chart-title">Recent Activity</div>
                  <div className="activity-feed">
                    {recentActivity.length === 0 ? (
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', padding: '16px 0', fontWeight: 500 }}>
                        No recent activity
                      </div>
                    ) : recentActivity.map((e, i) => (
                      <div className="activity-item" key={i}>
                        <div
                          className="activity-icon"
                          style={{ background: e.status === 'YOU PAID' ? 'var(--primary-fixed)' : 'var(--secondary-fixed)' }}
                        >
                          {e.status === 'YOU PAID' ? '💸' : '📋'}
                        </div>
                        <div className="activity-text">
                          <div className="activity-name">{e.title || e.description}</div>
                          <div className="activity-sub">{e.paidBy || e.paidby?.fullname} paid · {e.status}</div>
                        </div>
                        <div className={`activity-amount ${e.status === 'PENDING' ? 'owed' : ''}`}>
                          {e.status === 'PENDING' ? '−' : '+'}₹{(e.amount || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Second Charts Row */}
              <div className="dashboard-grid">
                <div className="chart-card">
                  <div className="chart-title">Settlement Summary</div>
                  {allSettlements.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '16px 0',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: 13,
                        color: '#1a7f37',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{ background: '#dcfce7', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircleIcon style={{ width: 16, height: 16, color: '#16a34a' }} />All settled up</span>
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
                            <td><span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: 'var(--on-surface-variant)' }}>{s.to}</span></td>
                            <td className="amount-owed">−₹{Math.round(s.amount).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="chart-card">
                  <div className="chart-title">My Groups</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {groups.length === 0 ? (
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                        No groups yet —{' '}
                        <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/groups')}>
                          create one
                        </span>
                      </div>
                    ) : groups.slice(0, 4).map(g => {
                      const s = groupSummaries[g._id];
                      return (
                        <div
                          key={g._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 10px',
                            borderRadius: 14,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            borderBottom: '1px solid var(--surface-container-high)',
                          }}
                          onClick={() => navigate(`/groups/${g._id}`)}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--primary)' }}>
                              {g.name[0]}
                            </div>
                            <div>
                              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface)', fontWeight: 600 }}>{g.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 1, fontWeight: 500 }}>
                                {g.members?.length} members · {g.groupcode}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                              ₹{(s?.totalExpense || 0).toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: 'var(--on-surface-variant)', fontWeight: 600 }}>total</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Group Sparklines */}
              {groups.length > 0 && (
                <div className="dashboard-grid-3">
                  {groups.slice(0, 2).map(g => {
                    const s = groupSummaries[g._id];
                    const now = new Date();
                    const monthlyGroupTotals = [0, 0, 0, 0, 0, 0];
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
                        if (monthDiff >= 0 && monthDiff < 6) {
                          monthlyGroupTotals[5 - monthDiff] += (e.amount || 0);
                        }
                      }
                    });
                    const maxTotal = Math.max(...monthlyGroupTotals, 1);
                    const sparks = monthlyGroupTotals.map(val => val === 0 ? 0.05 : Math.max(val / maxTotal, 0.15));

                    return (
                      <div className="chart-card" key={g._id}>
                        <div className="chart-title">
                          {g.name}
                          <span className="chart-title-tag">{g.members?.length}M</span>
                        </div>
                        <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0 4px', color: 'var(--on-surface)' }}>
                          ₹{(s?.totalExpense || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', marginBottom: 14, fontWeight: 600 }}>
                          Code: {g.groupcode}
                        </div>
                        <div className="sparkline-row">
                          {sparks.map((h, j) => (
                            <div
                              key={j}
                              className={`spark-bar ${j === sparks.length - 1 ? 'highlight' : ''}`}
                              style={{ height: `${h * 100}%` }}
                              title={`₹${monthlyGroupTotals[j]}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}