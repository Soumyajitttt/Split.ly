import { useNavigate } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/outline';

export function Logo({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.1,
      }}
    >
      <span
        style={{
          fontFamily: "'Be Vietnam Pro', sans-serif",
          fontSize: 22,
          fontWeight: 900,
          color: 'var(--primary)',
          letterSpacing: '-0.03em',
        }}
      >
        Split.ly
      </span>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--on-surface-variant)',
          marginTop: 1,
        }}
      >
        Shared Expenses
      </span>
    </div>
  );
}

export default function Nav({ actions, onMenuClick, showMenu = false }) {
  const navigate = useNavigate();
  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* {showMenu && (
          <button
            className="hamburger-btn"
            onClick={onMenuClick}
            aria-label="Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8,
              borderRadius: 10,
              border: 'none',
              background: 'var(--surface-container-high)',
              cursor: 'pointer',
              color: 'var(--on-surface)',
            }}
          >
            <Bars3Icon style={{ width: 20, height: 20 }} />
          </button>
        )} */}
        <Logo onClick={() => navigate('/')} />
      </div>
      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {actions}
      </div>
    </nav>
  );
}