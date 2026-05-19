import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
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

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const showToast = useToast();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout();
    navigate('/');
    showToast('Logged out');
    onClose?.();
  };

  const go = (path) => {
    navigate(path);
    onClose?.();
  };

  const initials = user?.fullname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
  const AVATAR_COLORS = ['#e53935','#d81b60','#8e24aa','#5e35b1','#1e88e5','#00897b','#43a047','#fb8c00','#6d4c41','#039be5'];
  const avatarBg = AVATAR_COLORS[(user?.username || user?.fullname || 'U').charCodeAt(0) % AVATAR_COLORS.length];

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, iconActive: HomeIconSolid, label: 'Dashboard' },
    { path: '/groups', icon: UserGroupIcon, iconActive: UserGroupIconSolid, label: 'Groups' },
  ];

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="sidebar-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 199 }}
        />
      )}

      <div className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <button className="sidebar-mobile-close" onClick={onClose}>
          <XMarkIcon style={{ width: 18, height: 18 }} />
        </button>

        <div className="sidebar-section">
          <div className="sidebar-label">Navigation</div>
          {navItems.map(item => {
            const active = isActive(item.path);
            const Icon = active ? item.iconActive : item.icon;
            return (
              <div
                key={item.path}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={() => go(item.path)}
              >
                <Icon style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-section">
            <div className="sidebar-user">
              <div
                className="sidebar-avatar"
                style={{ background: avatarBg, fontFamily: "'Google Sans', 'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 500, letterSpacing: 0, color: 'white' }}
              >
                {initials}
              </div>
              <div>
                <div className="sidebar-user-name">{user?.username || 'user'}</div>
                <div className="sidebar-user-role">Member</div>
              </div>
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">Account</div>
            <div
              className="sidebar-item"
              onClick={() => { showToast('Settings coming soon'); onClose?.(); }}
            >
              <Cog6ToothIcon style={{ width: 18, height: 18 }} />
              <span>Settings</span>
            </div>
            <div className="sidebar-item" onClick={handleLogout}>
              <ArrowRightStartOnRectangleIcon style={{ width: 18, height: 18 }} />
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}