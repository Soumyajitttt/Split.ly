import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDataCache } from '../../context/DataCache';
import { logoutUser } from '../../api';
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';

const MIN_W = 208;
const MAX_W = 420;
const DEFAULT_W = 248;
const RAIL_W = 64;
const COLLAPSE_AT = 150; // dragging narrower than this snaps to the rail
const STORE_KEY = 'splitly.sidebar';
const G_COLORS = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];

// remembered between page mounts so the active highlight can slide from the previous tab
let lastPos = null;
let groupsMemo = [];

function readStored() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    return {
      width: Math.min(MAX_W, Math.max(MIN_W, Number(v.width) || DEFAULT_W)),
      collapsed: false, // the collapse toggle was removed; never start in a state with no way out
    };
  } catch {
    return { width: DEFAULT_W, collapsed: false };
  }
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const showToast = useToast();
  const { fetchGroups } = useDataCache();

  const [{ width, collapsed }, setLayout] = useState(readStored);
  const [dragging, setDragging] = useState(false);
  const [groups, setGroups] = useState(() => groupsMemo);
  const scrollRef = useRef(null);
  const indRef = useRef(null);
  const widthRef = useRef(width);
  useEffect(() => { widthRef.current = width; }, [width]);

  // persist layout
  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ width, collapsed })); } catch { /* ignore */ }
  }, [width, collapsed]);

  // groups shortcut list (served from the existing cache)
  useEffect(() => {
    let cancelled = false;
    fetchGroups().then(gs => { groupsMemo = gs || []; if (!cancelled) setGroups(gs || []); }).catch(() => {});
    return () => { cancelled = true; };
  }, [fetchGroups]);

  // sliding active highlight (GSAP)
  useLayoutEffect(() => {
    const el = scrollRef.current?.querySelector('.sidebar-item.active');
    const ind = indRef.current;
    if (!ind) return undefined;
    if (!el) { gsap.set(ind, { opacity: 0 }); return undefined; }
    const next = { y: el.offsetTop, height: el.offsetHeight };
    let tween;
    if (lastPos) {
      tween = gsap.fromTo(ind, { ...lastPos, opacity: 1 }, { ...next, opacity: 1, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.set(ind, { ...next, opacity: 1 });
    }
    lastPos = next;
    return () => tween?.kill();
  }, [location.pathname, groups.length]);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = collapsed ? RAIL_W : widthRef.current;
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const move = (ev) => {
      const raw = startW + (ev.clientX - startX);
      if (raw < COLLAPSE_AT) {
        setLayout(l => (l.collapsed ? l : { ...l, collapsed: true }));
      } else {
        const next = Math.min(MAX_W, Math.max(MIN_W, raw));
        setLayout({ width: next, collapsed: false });
      }
    };
    const up = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [collapsed]);

  const resetWidth = () => setLayout({ width: DEFAULT_W, collapsed: false });

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const go = (path) => { navigate(path); onClose?.(); };

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* ignore */ }
    logout();
    navigate('/');
    showToast('Logged out');
    onClose?.();
  };

  const initials = user?.fullname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
  const AVATAR_COLORS = ['#e53935','#d81b60','#8e24aa','#5e35b1','#1e88e5','#00897b','#43a047','#fb8c00','#6d4c41','#039be5'];
  const avatarBg = AVATAR_COLORS[(user?.username || user?.fullname || 'U').charCodeAt(0) % AVATAR_COLORS.length];

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid, label: 'Dashboard' },
    { path: '/groups', icon: UserGroupIcon, iconActive: UserGroupIconSolid, label: 'Groups', exact: true },
  ];

  const shownGroups = groups.slice(0, 8);

  return (
    <>
      {open && <div onClick={onClose} className="sidebar-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,19,0.4)', zIndex: 249 }} />}

      <aside
        className={`sidebar ${open ? 'sidebar-open' : ''} ${collapsed ? 'collapsed' : ''} ${dragging ? 'dragging' : ''}`}
        style={{ '--sb-w': `${collapsed ? RAIL_W : width}px` }}
        aria-label="Sidebar"
      >
        <button className="sidebar-mobile-close" onClick={onClose} aria-label="Close menu">
          <XMarkIcon style={{ width: 18, height: 18 }} />
        </button>

        <div className="sidebar-scroll" ref={scrollRef}>
          <span className="sidebar-indicator" ref={indRef} />
          <div className="sidebar-top">
            <span className="sidebar-ws">Workspace</span>
          </div>

          <div className="sidebar-section">
            {navItems.map(item => {
              const active = item.exact
                ? location.pathname === item.path
                : isActive(item.path);
              const Icon = active ? item.iconActive : item.icon;
              return (
                <div
                  key={item.path}
                  className={`sidebar-item ${active ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  onClick={() => go(item.path)}
                >
                  <Icon style={{ width: 18, height: 18 }} />
                  <span className="lbl">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">
              <span>Your groups</span>
            </div>
            {shownGroups.map((g, i) => (
              <div
                key={g._id}
                className={`sidebar-item ${location.pathname === `/groups/${g._id}` ? 'active' : ''}`}
                title={collapsed ? g.name : undefined}
                onClick={() => go(`/groups/${g._id}`)}
              >
                <span className="sidebar-gdot" style={{ background: G_COLORS[i % G_COLORS.length] }}>{g.name?.[0]?.toUpperCase()}</span>
                <span className="lbl">{g.name}</span>
              </div>
            ))}
            {groups.length > shownGroups.length && (
              <div className="sidebar-more" onClick={() => go('/groups')}>View all {groups.length}</div>
            )}
            {groups.length === 0 && !collapsed && (
              <div className="sidebar-empty">No groups yet</div>
            )}
          </div>

          <div className="sidebar-bottom">
            <div
              className="sidebar-item"
              title={collapsed ? 'Settings' : undefined}
              onClick={() => { showToast('Settings coming soon'); onClose?.(); }}
            >
              <Cog6ToothIcon style={{ width: 18, height: 18 }} />
              <span className="lbl">Settings</span>
            </div>
            <div className="sidebar-item" title={collapsed ? 'Log out' : undefined} onClick={handleLogout}>
              <ArrowRightStartOnRectangleIcon style={{ width: 18, height: 18 }} />
              <span className="lbl">Log out</span>
            </div>
            <div className="sidebar-user">
              {user?.avatar
                ? <img src={user.avatar} alt={initials} referrerPolicy="no-referrer" className="sidebar-avatar" />
                : <div className="sidebar-avatar" style={{ background: avatarBg }}>{initials}</div>}
              <div>
                <div className="sidebar-user-name">{user?.fullname || user?.username || 'user'}</div>
                <div className="sidebar-user-role">@{user?.username || 'member'}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="sidebar-resizer"
          onPointerDown={startDrag}
          onDoubleClick={resetWidth}
          role="separator"
          aria-orientation="vertical"
          aria-label="Drag to resize sidebar, double-click to reset"
          title="Drag to resize · double-click to reset"
        />
      </aside>
    </>
  );
}