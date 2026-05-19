import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export default function Footer() {
  const navigate = useNavigate();
  const showToast = useToast();

  return (
    <footer>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
          gap: 40,
          padding: '60px 48px 44px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <span
              style={{
                fontFamily: "'Be Vietnam Pro', sans-serif",
                fontSize: 22,
                fontWeight: 900,
                color: 'var(--inverse-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              Split.ly
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.7,
              maxWidth: 220,
            }}
          >
            The smartest way to track shared expenses with friends, roommates, and travel squads.
          </p>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 11,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase',
              marginTop: 20,
              fontWeight: 700,
            }}
          >
            Split expenses, not friendships
          </p>
        </div>

        {[
          {
            title: 'Product',
            links: [
              { label: 'Get Started', action: () => navigate('/signup') },
              { label: 'How It Works', action: () => showToast('Coming soon') },
              { label: 'Pricing', action: () => showToast('Coming soon') },
              { label: 'Changelog', action: () => showToast('Coming soon') },
            ],
          },
          {
            title: 'Company',
            links: [
              { label: 'About', action: () => showToast('Coming soon') },
              { label: 'Blog', action: () => showToast('Coming soon') },
              { label: 'Careers', action: () => showToast('Coming soon') },
              { label: 'Contact', action: () => showToast('Coming soon') },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacy Policy', action: () => showToast('Coming soon') },
              { label: 'Terms of Service', action: () => showToast('Coming soon') },
              { label: 'Cookie Policy', action: () => showToast('Coming soon') },
              { label: 'Security', action: () => showToast('Coming soon') },
            ],
          },
        ].map(col => (
          <div key={col.title}>
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 18,
              }}
            >
              {col.title}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {col.links.map(l => (
                <li key={l.label}>
                  <a
                    onClick={l.action}
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.55)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                      fontWeight: 500,
                    }}
                    onMouseOver={e => (e.target.style.color = 'rgba(255,255,255,0.9)')}
                    onMouseOut={e => (e.target.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 48px',
          flexWrap: 'wrap',
          gap: 12,
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 600,
            letterSpacing: '0.05em',
          }}
        >
          © {new Date().getFullYear()} Split.ly — All rights reserved
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Made in India', 'Open Beta', 'v2.0.0'].map(b => (
            <span
              key={b}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 9,
                letterSpacing: '0.12em',
                padding: '5px 12px',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 999,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}