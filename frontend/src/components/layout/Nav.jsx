import { useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';

export function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <span className="logo-mark">S</span>
      <span className="logo-word">Split.ly</span>
    </div>
  );
}

export default function Nav({ actions, onMenuClick, showMenu = false }) {
  const navigate = useNavigate();
  return (
    <nav>
      <div className="nav-left">
        {showMenu && (
          <button className="nav-menu-btn" onClick={onMenuClick} aria-label="Open menu">
            <Bars3Icon style={{ width: 18, height: 18 }} />
          </button>
        )}
        <Logo onClick={() => navigate('/')} />
      </div>
      <div className="nav-actions">{actions}</div>
    </nav>
  );
}