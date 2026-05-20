import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Modal, Input, FormGroup, EmptyState, Spinner } from '../components/ui';
import { getMyGroups, createGroup, joinGroup } from '../api';
import { useToast } from '../context/ToastContext';
import {
  PlusIcon,
  ArrowRightEndOnRectangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

function GroupCard({ group, onClick }) {
  const memberCount = group.members?.length || 0;
  return (
    <div className="card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        {/* Avatar-style group icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--primary-fixed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Be Vietnam Pro', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: 'var(--primary)',
            flexShrink: 0,
          }}
        >
          {group.name[0]}
        </div>
        <span className="tag tag-mono">{memberCount} members</span>
      </div>
      <div className="card-title">{group.name}</div>
      <div className="card-sub" style={{ marginTop: 6, marginBottom: 16 }}>
        {group.members?.map(m => m.fullname || m.username).join(', ') || '—'}
      </div>
      <hr className="divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--on-surface-variant)',
            background: 'var(--surface-container-low)',
            padding: '4px 10px',
            borderRadius: 8,
            letterSpacing: '0.08em',
          }}
        >
          {group.groupcode}
        </span>
        {group.description && (
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: 'var(--on-surface-variant)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {group.description}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Groups() {
  const navigate = useNavigate();
  const showToast = useToast();

  const [groups, setGroups] = useState([]);
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

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await getMyGroups();
      setGroups(data.groups || []);
    } catch {
      showToast('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) { showToast('Group name required'); return; }
    setSubmitting(true);
    try {
      const { data } = await createGroup({ name: newName, description: newDesc });
      if (data.success) {
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

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.members?.some(m => (m.fullname || m.username || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Nav
        showMenu
        onMenuClick={() => setSidebarOpen(true)}
        actions={<button
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => navigate('/')}
          >
            <ArrowLeftIcon style={{ width: 15, height: 15 }} />
            Home
          </button>}
      />
      <div className="app-layout">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-content">
          <div className="page-header">
            <div>
              <div className="page-title">Groups</div>
              <div className="page-sub">Your expense circles</div>
            </div>
            <div className="new-menu-wrapper">
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => setShowMenu(!showMenu)}
              >
                <PlusIcon style={{ width: 16, height: 16 }} />
                New
              </button>
              {showMenu && (
                <div className="new-menu">
                  <div className="new-menu-item" onClick={() => { setJoinModal(true); setShowMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <ArrowRightEndOnRectangleIcon style={{ width: 16, height: 16 }} />
                    Join Group
                  </div>
                  <div className="new-menu-item" onClick={() => { setCreateModal(true); setShowMenu(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <UserGroupIcon style={{ width: 16, height: 16 }} />
                    Create Group
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="search-bar" style={{ position: 'relative' }}>
            <MagnifyingGlassIcon
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
                color: 'var(--on-surface-variant)',
                pointerEvents: 'none',
              }}
            />
            <input
              className="input-field"
              placeholder="Search groups or members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<UserGroupIcon style={{ width: 32, height: 32, color: 'var(--on-surface-variant)' }} />} text="No groups yet. Create or join one above." />
          ) : (
            <div className="groups-grid">
              {filtered.map(g => (
                <GroupCard key={g._id} group={g} onClick={() => navigate(`/groups/${g._id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title="Join a Group">
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Enter the invite code from your group admin.
        </p>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Invite Code</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input-field"
              placeholder="XXXXXX"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              style={{ letterSpacing: 4, fontWeight: 700, textTransform: 'uppercase' }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn btn-primary" style={{ borderRadius: 14, flexShrink: 0 }} onClick={handleJoin} disabled={submitting}>
              {submitting ? <Spinner /> : 'Join →'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create a Group">
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20, fontWeight: 500 }}>
          Give your group a name and start splitting expenses.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Group Name</label>
            <input className="input-field" placeholder="Hostel Bills, Trip to Goa..." value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Description (optional)</label>
            <input className="input-field" placeholder="What's this group for?" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ borderRadius: 14 }} onClick={handleCreate} disabled={submitting}>
              {submitting ? <Spinner /> : 'Create Group'}
            </button>
          </div>
        </div>
      </Modal>

      <BottomNav />
    </div>
  );
}