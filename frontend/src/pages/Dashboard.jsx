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
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

function Kpi({ icon: Icon, bg, fg, label, value }) {
  return (
    <div className="kpi">
      <div className="kpi-ic" style={{ background: bg, color: fg }}>
        <Icon style={{ width: 19, height: 19 }} />
      </div>
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
      </div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const pct = Math.max(Math.round((d.value / max) * 85), 4);
        return (
          <div className="bar-col" key={d.label}>
            <div className={`bar ${i === data.length - 1 ? 'accent' : ''}`} style={{ height: `${pct}%` }} title={inr(d.value)} />
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

  const totalOwe  = expenses.filter(e => e.status === 'PENDING').reduce((s, e) => s + (e.youOwe || 0), 0);
  const totalOwed = expenses.filter(e => e.status === 'YOU PAID').reduce((s, e) => s + (e.othersOweYou || 0), 0);

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
    .slice(0, 4);

  const allSettlements = Object.values(groupSummaries).flatMap(s => s?.settlements || []);

  const firstName = (user?.fullname || user?.username || '').split(' ')[0];

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
              <div className="page-title">Hi{firstName ? `, ${firstName}` : ''}</div>
              <div className="page-sub">Here's where your money stands.</div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80, color: 'var(--primary)' }}>
              <Spinner />
            </div>
          ) : (
            <>
              <div className="kpis">
                <Kpi icon={ArrowDownLeftIcon} bg="var(--success-bg)" fg="var(--success)" label="You're owed" value={inr(totalOwed)} />
                <Kpi icon={ArrowUpRightIcon} bg="var(--secondary-fixed)" fg="var(--secondary)" label="You owe" value={inr(totalOwe)} />
                <Kpi icon={UserGroupIcon} bg="var(--primary-fixed)" fg="var(--primary)" label="Groups" value={String(groups.length)} />
              </div>

              <div className="dash-row">
                <div className="panel">
                  <div className="panel-head"><div className="panel-title">Your spending</div></div>
                  <div className="panel-body">
                    <BarChart data={barData} />
                    {barData.every(d => d.value === 0) && (
                      <div style={{ fontSize: 12.5, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 10, fontWeight: 500 }}>
                        Add an expense to see your spending.
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-head"><div className="panel-title">To settle</div></div>
                  {allSettlements.length === 0 ? (
                    <div style={{ padding: 18 }}>
                      <span className="tag tag-green" style={{ padding: '8px 14px', fontSize: 13 }}>
                        <CheckCircleIcon style={{ width: 16, height: 16 }} />
                        All settled up
                      </span>
                    </div>
                  ) : allSettlements.slice(0, 4).map((s, i) => (
                    <div className="pay-row" key={i}>
                      <span className="who">{s.from}<i>→</i>{s.to}</span>
                      <b>{inr(s.amount)}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-head"><div className="panel-title">Recent expenses</div></div>
                {recentActivity.length === 0 ? (
                  <div className="empty-line">Nothing yet. Open a group and add your first expense.</div>
                ) : recentActivity.map((e, i) => (
                  <div className="pay-row" key={i}>
                    <span className="who">{e.title || e.description}</span>
                    <b style={{ color: e.status === 'PENDING' ? 'var(--secondary)' : 'var(--success)' }}>
                      {e.status === 'PENDING' ? '−' : '+'}{inr(e.amount)}
                    </b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}