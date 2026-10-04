import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Modal, EmptyState, Spinner } from '../components/ui';
import { createGroup, joinGroup } from '../api';
import { useToast } from '../context/ToastContext';
import { useDataCache } from '../context/DataCache';
import {
  PlusIcon,
  ArrowRightEndOnRectangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const G_COLORS = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];
const colorFor = (s = '') => G_COLORS[(s.charCodeAt(0) || 0) % G_COLORS.length];
const firstName = (m) => ((m?.fullname || m?.username || '').trim().split(/\s+/)[0]) || '';

// Whole rupees stay clean; anything with paise keeps two decimals.
const money = (n) => {
  const v = Math.round((Number(n) || 0) * 100) / 100;
  const hasPaise = Math.abs(v % 1) > 0;
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: hasPaise ? 2 : 0, maximumFractionDigits: 2 })}`;
};

function GroupRow({ group, total, onClick }) {
  const members = group.members || [];
  const names = members.map(firstName).filter(Boolean).join(', ') || '—';
  return (
    <div className="glist-row" onClick={onClick} role="link" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="glist-name">
        <div className="glist-ic" style={{ background: colorFor(group.name) }}>{group.name[0]?.toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <div className="glist-title">{group.name}</div>
          <div className="glist-desc">{group.description || 'No description'}</div>
        </div>
      </div>
      <div className="glist-members">
        <div className="glist-stack">
          {members.slice(0, 3).map((m, i) => (
            <span key={m._id || i} style={{ background: colorFor(m.fullname || m.username || String(i)) }}>
              {(m.fullname || m.username || '?')[0].toUpperCase()}
            </span>
          ))}
        </div>
        {members.length} member{members.length !== 1 ? 's' : ''}
      </div>
      <div><span className="glist-total">{total == null ? <i className="glist-total-skel" /> : money(total)}</span></div>
      <div className="glist-names">{names}</div>
      <ChevronRightIcon className="glist-chev" style={{ width: 16, height: 16 }} />
    </div>
  );
}

export default function Groups() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { fetchGroups, fetchAllSummaries, addGroupToCache } = useDataCache();

  const [groups, setGroups] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load from cache (or network on first visit / after invalidation)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGroups()
      .then(gs => { if (!cancelled) setGroups(gs); })
      .catch(() => { if (!cancelled) showToast('Failed to load groups'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) { showToast('Group name required'); return; }
    setSubmitting(true);
    try {
      const { data } = await createGroup({ name: newName, description: newDesc });
      if (data.success) {
        addGroupToCache(data.group);
        setGroups(gs => [data.group, ...gs]);
        setCreateModal(false);
        setNewName(''); setNewDesc('');
        showToast('Group created!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { showToast('Enter a code'); return; }
    setSubmitting(true);
    try {
      const { data } = await joinGroup({ groupcode: joinCode.trim().toUpperCase() });
      if (data.success) {
        addGroupToCache(data.group);
        setGroups(gs => [data.group, ...gs]);
        setJoinModal(false);
        setJoinCode('');
        showToast('Joined group!');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  };

  // Group totals come from the per-group summaries (shared cache; cached ones paint instantly, stale ones refresh).
  useEffect(() => {
    if (groups.length === 0) return undefined;
    let cancelled = false;
    const pick = (summaries) => {
      const next = {};
      groups.forEach(g => { next[g._id] = summaries[g._id]?.totalExpense ?? null; });
      return next;
    };
    fetchAllSummaries(groups).then(({ summaries, refreshPromise }) => {
      if (cancelled) return;
      setTotals(pick(summaries));
      refreshPromise.then(fresh => { if (!cancelled) setTotals(pick(fresh)); });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [groups, fetchAllSummaries]);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.members?.some(m => (m.fullname || m.username || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-page" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
              <div className="crumbs">Workspace <span>/</span> <b>Groups</b></div>
              <div className="page-title">Groups</div>
              <div className="page-sub">Your expense circles — hostels, trips, flatmates.</div>
            </div>
            <div className="new-menu-wrapper">
              <button className="btn btn-primary" onClick={() => setShowMenu(!showMenu)}>
                <PlusIcon style={{ width: 16, height: 16 }} />
                New
              </button>
              {showMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 70 }} onClick={() => setShowMenu(false)} />
                  <div className="new-menu">
                    <div className="new-menu-item" onClick={() => { setJoinModal(true); setShowMenu(false); }}>
                      <ArrowRightEndOnRectangleIcon style={{ width: 16, height: 16 }} />
                      Join group
                    </div>
                    <div className="new-menu-item" onClick={() => { setCreateModal(true); setShowMenu(false); }}>
                      <UserGroupIcon style={{ width: 16, height: 16 }} />
                      Create group
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="list-toolbar">
            <div className="list-search">
              <MagnifyingGlassIcon />
              <input
                className="input-field"
                placeholder="Search groups or members…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {!loading && (
              <span className="list-count">{filtered.length} group{filtered.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--primary)' }}><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="glist">
              <EmptyState
                icon={<UserGroupIcon style={{ width: 28, height: 28, color: 'var(--on-surface-variant)' }} />}
                text={groups.length === 0 ? 'No groups yet. Create or join one to get started.' : 'No groups match your search.'}
              />
            </div>
          ) : (
            <div className="glist">
              <div className="glist-head">
                <span>Group</span>
                <span>Members</span>
                <span>Total expense</span>
                <span>People</span>
                <span />
              </div>
              {filtered.map(g => (
                <GroupRow key={g._id} group={g} total={totals[g._id]} onClick={() => navigate(`/groups/${g._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title="Join a group">
        <p style={{ fontSize: 13.5, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Enter the group code you were given.
        </p>
        <div style={{ marginBottom: 8 }}>
          <label className="form-label">Group code</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input-field"
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ letterSpacing: 4, fontWeight: 700, textTransform: 'uppercase' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={handleJoin} disabled={submitting}>
              {submitting ? <Spinner /> : 'Join'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create a group">
        <p style={{ fontSize: 13.5, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Give your group a name and start splitting expenses.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Group name</label>
            <input className="input-field" placeholder="Hostel bills, Trip to Goa…" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Description (optional)</label>
            <input className="input-field" placeholder="What's this group for?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? <Spinner /> : 'Create group'}
            </button>
          </div>
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}