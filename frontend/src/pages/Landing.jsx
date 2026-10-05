import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

/* ════════════════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════════════════ */

const TESTIMONIALS = [
  { text: "Finally no more awkward 'hey did you pay me back' messages in the hostel group chat.", name: "Ravi K.", location: "Kolkata" },
  { text: "We use it for every trip. Splitting 12-person expenses used to be a nightmare. Not anymore.", name: "Anisha M.", location: "Bangalore" },
  { text: "Settled a 3-month hostel bill in like 2 minutes. This thing actually works.", name: "Sourav D.", location: "Delhi" },
  { text: "Our friend group has 8 people and Split.ly keeps everyone honest. No drama, ever.", name: "Priya R.", location: "Mumbai" },
  { text: "The algorithm is insane — told me I only need 2 payments instead of 7. Genius.", name: "Arnav S.", location: "Pune" },
  { text: "Tried 4 other apps. This is the only one that doesn't make me feel like I need a degree.", name: "Meera T.", location: "Chennai" },
  { text: "Used it for our Manali trip. Zero arguments about money for the first time ever.", name: "Kabir P.", location: "Hyderabad" },
  { text: "Clean UI, fast, does exactly what it says. My entire PG uses it now.", name: "Devanshi A.", location: "Ahmedabad" },
];

const MARQUEE_ITEMS = ['Split Smart', 'Zero Drama', 'Settle Up', 'No Arguments', 'Fair & Square', 'Hostel Life', 'Track Everything', 'Split Smart'];

const TABS = [
  {
    id: 'min',
    label: 'Minimum Transactions',
    title: 'Minimum Transactions',
    desc: 'Our greedy algorithm collapses complex debts into the fewest possible payments. No unnecessary back-and-forth between friends.',
    tags: ['Debt Simplification', 'Smart Routing'],
  },
  {
    id: 'groups',
    label: 'Group Flexibility',
    title: 'Group Flexibility',
    desc: 'Create any number of groups — hostels, trips, flatmates, office lunches. Each fully independent.',
    tags: ['Hostels', 'Trips', 'Flatmates'],
  },
  {
    id: 'live',
    label: 'Live Settlement',
    title: 'Live Settlement View',
    desc: 'The Unpaid tab recalculates in real time as you add or settle expenses. Always accurate.',
    tags: ['Real-time', 'Unpaid tab'],
  },
  {
    id: 'simple',
    label: 'Debt Simplification',
    title: 'Debt Simplification',
    desc: 'We find the shortest path to zero. Why pay 5 people when you can pay 1?',
    tags: ['Group Code', 'Zero Learning Curve'],
    cta: true,
  },
];

const FAQS = [
  {
    q: 'How does Split.ly decide who pays whom?',
    a: 'Our greedy algorithm collapses complex debts into the fewest possible payments. Instead of everyone paying everyone, you settle with just a handful of transfers.',
  },
  {
    q: 'Can I run more than one group?',
    a: 'Yes — create any number of groups: hostels, trips, flatmates, office lunches. Each group is fully independent, with its own expenses and balances.',
  },
  {
    q: 'How do my friends join a group?',
    a: 'Just share the group code. Anyone who has it can join and start adding or splitting expenses right away.',
  },
  {
    q: 'Do I need to learn anything first?',
    a: "No tutorials. No onboarding. If you can read a WhatsApp message, you can use Split.ly — just add an expense and split.",
  },
  {
    q: 'What happens when someone pays me back?',
    a: 'One tap marks it done. The Unpaid tab recalculates in real time as you add or settle expenses, so it is always accurate.',
  },
  {
    q: 'Is it free to get started?',
    a: 'Yes. You can create an account and start your first group for free.',
  },
];

const AVATAR_PALETTE = ['#0056c6', '#ff6b35', '#7a5cff', '#00a67e', '#e5486b', '#141414'];

/* ════════════════════════════════════════════════════════════════════════════
   HOOKS & SMALL PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/** Fade + rise on scroll. */
function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const [ref, inView] = useInView(0.15);
  return (
    <Tag
      ref={ref}
      className={`lp-reveal ${inView ? 'in' : ''} ${className}`}
      {...rest}
      style={{ '--d': `${delay}ms`, ...(style || {}) }}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word masked text reveal.
 *   text:   "Split smart,\n*live easy.*"   (\n = line break, *…* = gradient accent)
 *   onLoad: animate immediately on mount (hero) instead of on scroll
 */
function SplitText({ text, as: Tag = 'h2', className = '', onLoad = false, delay = 0, accent = 'grad' }) {
  const [ref, inView] = useInView(0.3);
  let idx = 0;
  const lines = text.split('\n').map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    const words = [];
    parts.forEach(part => {
      const em = part.startsWith('*') && part.endsWith('*');
      const clean = em ? part.slice(1, -1) : part;
      clean.split(' ').filter(Boolean).forEach(w => words.push({ w, em }));
    });
    return (
      <span className="ln" key={li}>
        {words.map((o, wi) => (
          <span key={wi}>
            <span className="m">
              <span className={`w ${o.em ? `em em-${accent}` : ''}`} style={{ '--i': idx++ }}>{o.w}</span>
            </span>
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    );
  });
  return (
    <Tag
      ref={ref}
      className={`lp-st ${onLoad ? 'onload' : inView ? 'in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` }}
      aria-label={text.replace(/[*\n]/g, ' ')}
    >
      <span aria-hidden="true">{lines}</span>
    </Tag>
  );
}

/** Paragraph whose words "fill in" as you scroll past it. */
function ScrollFill({ text }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const tokens = [];
  text.split(/(\*[^*]+\*)/g).filter(Boolean).forEach(part => {
    const em = part.startsWith('*') && part.endsWith('*');
    (em ? part.slice(1, -1) : part).split(' ').filter(Boolean).forEach(w => tokens.push({ w, em }));
  });
  const total = tokens.length;

  useEffect(() => {
    let raf = 0;
    const calc = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.88;
      const end = vh * 0.32;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
      const next = Math.round(p * total);
      setActive(prev => (prev === next ? prev : next));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(calc); };
    calc();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [total]);

  return (
    <p className="lp-fill" ref={ref} aria-label={text.replace(/\*/g, '')}>
      <span aria-hidden="true">
        {tokens.map((t, i) => (
          <span key={i} className={`fw ${i < active ? 'on' : ''} ${t.em ? 'em' : ''}`}>{t.w}{' '}</span>
        ))}
      </span>
    </p>
  );
}

/** Number that counts up when scrolled into view. */
function CountUp({ to, suffix = '', duration = 1400 }) {
  const [ref, inView] = useInView(0.4);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{v}{suffix}</span>;
}

/** Button label that rolls up on hover. */
function Roll({ children }) {
  return (
    <span className="roll">
      <span className="r1">{children}</span>
      <span className="r2" aria-hidden="true">{children}</span>
    </span>
  );
}

function DotPattern({ color = 'currentColor', style = {}, className = '' }) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${color} 1px, transparent 0)`,
        backgroundSize: '28px 28px',
        position: 'absolute',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

function Av({ children, i = 0, size = 34, style = {} }) {
  return (
    <span
      className="lp-av"
      style={{ width: size, height: size, background: AVATAR_PALETTE[i % AVATAR_PALETTE.length], fontSize: size * 0.4, ...style }}
    >
      {children}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MOCK UI PIECES (hero / steps / tabs)
   ════════════════════════════════════════════════════════════════════════════ */

function HeroMock() {
  const bars = [42, 66, 50, 82, 60, 34, 56];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const groups = [
    { n: 'Hostel Squad', s: '8 members', amt: '+₹1,240', pos: true, i: 0, l: 'H' },
    { n: 'Manali Trip', s: '12 members', amt: '−₹680', pos: false, i: 1, l: 'M' },
    { n: 'Flat 4B', s: '3 members', amt: '+₹2,860', pos: true, i: 2, l: 'F' },
  ];
  return (
    <div className="hm-wrap">
      <div className="hm-float hm-receipt">
        <div className="hm-receipt-ic">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <rect x="3" y="2" width="16" height="18" rx="3" stroke="#ff6b35" strokeWidth="2" />
            <path d="M7 7h8M7 11h6M7 15h4" stroke="#ff6b35" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="hm-receipt-l">Group Dinner</div>
        <div className="hm-receipt-box">
          <div className="hm-receipt-s">Total Split</div>
          <div className="hm-receipt-a">₹4,250</div>
        </div>
      </div>

      <div className="hm-frame">
        <div className="hm-bar"><i /><i /><i /></div>
        <div className="hm-grid">
          <div className="hm-card hm-groups">
            <div className="hm-head">
              <span>Groups</span>
              <span className="hm-sort">Sort by Newest ⌄</span>
            </div>
            {groups.map(g => (
              <div className="hm-row" key={g.n}>
                <Av i={g.i} size={40} style={{ borderRadius: 14 }}>{g.l}</Av>
                <div className="hm-row-t">
                  <b>{g.n}</b>
                  <small>{g.s}</small>
                </div>
                <span className={`hm-chip ${g.pos ? 'pos' : 'neg'}`}>{g.amt}</span>
              </div>
            ))}
            <div className="hm-foot">All groups</div>
          </div>

          <div className="hm-col">
            <div className="hm-card hm-stat">
              <small>You're owed</small>
              <div className="hm-big">₹3,420</div>
              <div className="hm-delta">+₹450 this week</div>
              <div className="hm-bars">
                {bars.map((h, i) => (
                  <div className="hm-b" key={i}>
                    <span className={i === 3 ? 'hot' : ''} style={{ '--h': `${h}%`, '--k': i }} />
                    <em>{days[i]}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="hm-card hm-settle">
              <div className="hm-settle-ic">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <b>2 payments</b>
                <small>instead of 7 — settled smart</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hm-float hm-friends">
        <div className="hm-stack">
          {['R', 'A', 'S', 'P'].map((l, i) => <Av key={l} i={i} size={30} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff' }}>{l}</Av>)}
        </div>
        <span>+12 friends</span>
      </div>
    </div>
  );
}

function StepVisual({ n }) {
  if (n === 0) {
    return (
      <div className="sv-card">
        <small className="sv-lab">New group</small>
        <div className="sv-input"><span className="lp-type">Hostel Squad</span></div>
        <div className="sv-members">
          {['R', 'A', 'S', 'K'].map((l, i) => <Av key={l} i={i} size={36} style={{ marginLeft: i ? -10 : 0, border: '3px solid #fff' }}>{l}</Av>)}
          <span className="sv-add">+ Invite</span>
        </div>
        <div className="sv-btn">Create group</div>
      </div>
    );
  }
  if (n === 1) {
    return (
      <div className="sv-card">
        <small className="sv-lab">Add expense</small>
        <div className="sv-line"><span>Dinner</span><b>₹4,250</b></div>
        <div className="sv-line"><span>Paid by</span><b><Av i={0} size={22} style={{ marginRight: 6 }}>R</Av>Ravi</b></div>
        <div className="sv-line"><span>Split</span><b>Equally · 5 people</b></div>
        <div className="sv-chips"><i>₹850</i><i>₹850</i><i>₹850</i><i>₹850</i><i>₹850</i></div>
      </div>
    );
  }
  return (
    <div className="sv-card">
      <small className="sv-lab">Unpaid</small>
      {[['Anisha', 'Ravi', '₹420'], ['Sourav', 'Ravi', '₹180']].map(([a, b, amt], i) => (
        <div className="sv-pay" key={a}>
          <span><b>{a}</b> pays <b>{b}</b></span>
          <em>{amt}</em>
          <span className="sv-done" style={{ animationDelay: `${i * 1.1}s` }}>✓ Paid</span>
        </div>
      ))}
      <div className="sv-ok">All settled up</div>
    </div>
  );
}

function TabVisual({ id }) {
  if (id === 'min') {
    const before = ['Ravi → Anisha', 'Anisha → Sourav', 'Sourav → Priya', 'Priya → Ravi', 'Ravi → Sourav', 'Anisha → Priya', 'Sourav → Ravi'];
    return (
      <div className="tv-card tv-split">
        <div>
          <small className="sv-lab">Before · 7 payments</small>
          <div className="tv-list dim">{before.map(b => <span key={b}>{b}</span>)}</div>
        </div>
        <div className="tv-arrow">→</div>
        <div>
          <small className="sv-lab">After · 2 payments</small>
          <div className="tv-list good">
            <span>Anisha → Ravi <b>₹620</b></span>
            <span>Priya → Sourav <b>₹240</b></span>
          </div>
        </div>
      </div>
    );
  }
  if (id === 'groups') {
    const g = [['Hostel', '8'], ['Trip', '12'], ['Flatmates', '3'], ['Office lunch', '6']];
    return (
      <div className="tv-card tv-groups">
        {g.map(([n, m], i) => (
          <div className="tv-tile" key={n} style={{ animationDelay: `${i * 90}ms` }}>
            <Av i={i} size={40} style={{ borderRadius: 14 }}>{n[0]}</Av>
            <b>{n}</b>
            <small>{m} members</small>
          </div>
        ))}
      </div>
    );
  }
  if (id === 'live') {
    return (
      <div className="tv-card">
        <div className="tv-live"><i /> Live</div>
        <div className="tv-tabs"><span className="on">Unpaid</span><span>Settled</span></div>
        {[['Anisha', '₹420'], ['Sourav', '₹180'], ['Priya', '₹240']].map(([n, a], i) => (
          <div className="sv-pay" key={n}>
            <span><Av i={i} size={26} style={{ marginRight: 8 }}>{n[0]}</Av><b>{n}</b></span>
            <em className="tv-tick" style={{ animationDelay: `${i * 0.6}s` }}>{a}</em>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="tv-card tv-code">
      <small className="sv-lab">Group code</small>
      <div className="tv-code-box">
        {['S', 'P', 'L', 'T', '4', '8'].map((c, i) => <span key={i} style={{ animationDelay: `${i * 80}ms` }}>{c}</span>)}
      </div>
      <div className="tv-members">
        <div className="hm-stack">
          {['R', 'A', 'S', 'P', 'K'].map((l, i) => <Av key={l} i={i} size={32} style={{ marginLeft: i ? -10 : 0, border: '2px solid #fff' }}>{l}</Av>)}
        </div>
        <span>5 friends joined</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function Landing() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, logout } = useAuth();
  const whyRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tab, setTab] = useState(0);
  const [tabPaused, setTabPaused] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const scrollToWhy = () => whyRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout();
    showToast('Logged out');
  };

  /* nav gets a hairline once the page scrolls */
  useEffect(() => {
    const onScroll = () => setScrolled(prev => {
      const next = window.scrollY > 8;
      return prev === next ? prev : next;
    });
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* feature tabs auto-advance (pauses on hover; resets whenever tab changes) */
  useEffect(() => {
    if (tabPaused) return undefined;
    const id = setTimeout(() => setTab(t => (t + 1) % TABS.length), 6000);
    return () => clearTimeout(id);
  }, [tab, tabPaused]);

  const allTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];
  const row2 = [...TESTIMONIALS].reverse();
  const allRow2 = [...row2, ...row2];
  const allMarquee = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  const initials = user?.fullname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
  const AVATAR_COLORS = ['#e53935','#d81b60','#8e24aa','#5e35b1','#1e88e5','#00897b','#43a047','#fb8c00','#6d4c41','#039be5'];
  const avatarBg = AVATAR_COLORS[(user?.username || user?.fullname || 'U').charCodeAt(0) % AVATAR_COLORS.length];

  const AvatarEl = ({ className = 'sidebar-avatar' }) => {
    const img = user?.avatar
      ? <img src={user.avatar} alt={initials} referrerPolicy="no-referrer" className={className} style={{ objectFit: 'cover' }} />
      : <span className={className} style={{ background: avatarBg, fontFamily: "'Google Sans','Plus Jakarta Sans',sans-serif", fontSize: 16, fontWeight: 500, letterSpacing: 0, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</span>;

    return (
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setShowDropdown(p => !p)}
          style={{ cursor: 'pointer', borderRadius: '50%', display: 'flex' }}
        >
          {img}
        </div>
        {showDropdown && (
          <>
            <div
              onClick={() => setShowDropdown(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              zIndex: 100,
              background: 'var(--surface, #fff)',
              border: '1px solid var(--outline-variant, #e0ddd6)',
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: 210,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--outline-variant, #e0ddd6)',
              }}>
                <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--on-surface)' }}>
                  {user?.fullname || user?.username}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => { setShowDropdown(false); handleLogout(); }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#e53935',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,57,53,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const navActions = user ? (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/groups')}>GROUPS</button>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>DASHBOARD</button>
      <AvatarEl />
    </>
  ) : (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>LOG IN</button>
      <button
        className="btn btn-primary btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => navigate('/signup')}
      >
        <ArrowRightIcon style={{ width: 15, height: 15, color: '#ffffff' }} />
        GET STARTED
      </button>
    </>
  );

  const active = TABS[tab];
  const steps = [
    { n: '01', title: 'Create', desc: 'Start a group for your hostel mates, travel squad, or dinner party in seconds.', tone: 'peach' },
    { n: '02', title: 'Log', desc: "Add expenses instantly. Note who paid and who it's split with — Split.ly handles the arithmetic.", tone: 'sky' },
    { n: '03', title: 'Settle', desc: 'Our algorithm finds the minimum payments needed. One tap marks it done.', tone: 'mint' },
  ];

  return (
    <div className={`page-enter lp ${scrolled ? 'lp-scrolled' : ''}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .lp {
          --ink: #111113;
          --ink-2: #3c3f4a;
          --muted: #6c707c;
          --paper: #f7f6f2;
          --card: #ffffff;
          --line: rgba(17,17,19,0.09);
          --blue: var(--primary, #0056c6);
          --blue-2: #2a7dff;
          --violet: #7a5cff;
          --orange: #ff6b35;
          --peach: #ffe9de;
          --sky: #dfeaff;
          --mint: #dcf6ea;
          --lilac: #ebe6ff;
          --ease: cubic-bezier(.16,1,.3,1);
          background: var(--paper);
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', sans-serif;
          overflow-x: clip;
        }
        .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
        .lp-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; position: relative; }

        /* ── Nav restyle (scoped) ───────────────────────────── */
        .lp nav {
          background: rgba(247,246,242,0.72);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
          backdrop-filter: blur(16px) saturate(1.4);
          border-bottom: 1px solid transparent;
          transition: border-color .3s ease, background .3s ease;
        }
        .lp.lp-scrolled nav { border-bottom-color: var(--line); background: rgba(247,246,242,0.86); }
        .lp nav .btn { border-radius: 999px; }
        .lp nav .btn-primary { background: var(--ink); box-shadow: none; }
        .lp nav .btn-primary:hover:not(:disabled) { background: #2a2b31; box-shadow: 0 8px 22px rgba(0,0,0,.18); }

        /* ── Split-text word reveal ─────────────────────────── */
        .lp-st { margin: 0; }
        .lp-st .ln { display: block; }
        .lp-st .m { display: inline-block; overflow: hidden; vertical-align: top; padding: .08em .06em .16em; margin: -.08em -.06em -.16em; }
        .lp-st .w {
          display: inline-block;
          transform: translateY(118%) rotate(5deg);
          transform-origin: 0 100%;
          transition: transform 1s var(--ease);
          transition-delay: calc(var(--i) * 55ms + var(--d, 0ms));
        }
        .lp-st.in .w { transform: none; }
        .lp-st.onload .w {
          animation: lp-rise 1s var(--ease) both;
          animation-delay: calc(var(--i) * 80ms + var(--d, 120ms));
        }
        @keyframes lp-rise {
          from { transform: translateY(118%) rotate(5deg); }
          to   { transform: none; }
        }
        .lp-st .w.em-grad {
          background: linear-gradient(100deg, #0a3fa6 0%, var(--blue) 50%, var(--blue-2) 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: var(--blue);
          padding-right: .04em;
          animation: lp-shift 6s ease-in-out infinite alternate;
        }
        .lp-st.onload .w.em-grad { animation: lp-rise 1s var(--ease) both, lp-shift 6s ease-in-out infinite alternate; animation-delay: calc(var(--i) * 80ms + var(--d, 120ms)), 0s; }
        .lp-st .w.em-white { color: #fff; opacity: .78; }
        @keyframes lp-shift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }

        /* ── Generic reveal ─────────────────────────────────── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity .9s var(--ease), transform .9s var(--ease);
          transition-delay: var(--d, 0ms);
        }
        .lp-reveal.in { opacity: 1; transform: none; }

        /* ── Buttons ────────────────────────────────────────── */
        .lp-btn {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 700; font-size: 15px;
          padding: 16px 28px; border-radius: 999px;
          border: 1.5px solid transparent; cursor: pointer;
          transition: transform .3s var(--ease), box-shadow .3s ease, background .25s ease, border-color .25s ease;
          will-change: transform;
        }
        .lp-btn:active { transform: scale(.97); }
        .lp-btn .arr { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.18); transition: transform .35s var(--ease); }
        .lp-btn:hover .arr { transform: translateX(3px) rotate(-45deg); }
        .lp-btn.dark { background: var(--ink); color: #fff; box-shadow: 0 14px 30px rgba(17,17,19,.22); }
        .lp-btn.dark:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(17,17,19,.28); }
        .lp-btn.light { background: #fff; color: var(--ink); border-color: var(--line); }
        .lp-btn.light:hover { transform: translateY(-3px); border-color: var(--ink); }
        .lp-btn.white { background: #fff; color: var(--blue); box-shadow: 0 14px 34px rgba(0,0,0,.18); }
        .lp-btn.white:hover { transform: translateY(-3px); }
        .lp-btn.white .arr { background: rgba(0,86,198,.1); }
        .lp-btn.ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
        .lp-btn.ghost:hover { background: rgba(255,255,255,.12); border-color: #fff; transform: translateY(-3px); }
        .roll { display: inline-block; position: relative; overflow: hidden; height: 1.25em; line-height: 1.25; vertical-align: middle; }
        .roll .r1, .roll .r2 { display: block; transition: transform .5s var(--ease); white-space: nowrap; }
        .roll .r2 { position: absolute; left: 0; top: 100%; }
        .lp-btn:hover .roll .r1, .lp-btn:hover .roll .r2 { transform: translateY(-100%); }

        /* ── HERO ───────────────────────────────────────────── */
        .lp-hero { position: relative; padding: 76px 0 40px; overflow: clip; }
        .lp-blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .55; pointer-events: none; animation: lp-drift 14s ease-in-out infinite alternate; }
        .lp-blob.b1 { width: 520px; height: 520px; background: #c9d9ff; top: -160px; left: -140px; }
        .lp-blob.b2 { width: 460px; height: 460px; background: #ffd9c7; top: -60px; right: -120px; animation-delay: -4s; }
        .lp-blob.b3 { width: 380px; height: 380px; background: #e2d9ff; top: 260px; left: 38%; animation-delay: -8s; opacity: .45; }
        @keyframes lp-drift { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.12); } }
        .lp-hero-in { text-align: center; position: relative; z-index: 2; }
        .lp-pill {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,.8); border: 1px solid var(--line);
          padding: 8px 16px 8px 12px; border-radius: 999px;
          font-weight: 700; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2);
          opacity: 0; animation: lp-fade .9s var(--ease) .05s both;
        }
        .lp-pill i { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); animation: lp-pulse 2s infinite; }
        @keyframes lp-pulse { 0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0,86,198,.4); } 50% { opacity: .6; transform: scale(.85); box-shadow: 0 0 0 8px rgba(0,86,198,0); } }
        @keyframes lp-fade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .lp-h1 {
          font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800;
          font-size: clamp(50px, 8.4vw, 112px); line-height: .98; letter-spacing: -.05em;
          margin: 26px auto 0; max-width: 980px; color: var(--ink);
        }
        .lp-sub {
          font-size: clamp(16px, 1.6vw, 19px); line-height: 1.65; color: var(--muted);
          max-width: 520px; margin: 26px auto 0;
          opacity: 0; animation: lp-fade 1s var(--ease) .75s both;
        }
        .lp-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 34px; opacity: 0; animation: lp-fade 1s var(--ease) .95s both; }

        /* hero mock */
        .hm-wrap { position: relative; max-width: 940px; margin: 72px auto 40px; opacity: 0; animation: lp-fade 1.2s var(--ease) 1.1s both; }
        .hm-frame {
          background: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.9);
          border-radius: 34px; padding: 14px; box-shadow: 0 50px 100px -30px rgba(40,50,110,.35), 0 0 0 1px var(--line);
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        }
        .hm-bar { display: flex; gap: 6px; padding: 4px 8px 12px; }
        .hm-bar i { width: 10px; height: 10px; border-radius: 50%; background: #e3e1dc; }
        .hm-grid { display: grid; grid-template-columns: 1.25fr 1fr; gap: 14px; text-align: left; }
        .hm-col { display: flex; flex-direction: column; gap: 14px; }
        .hm-card { background: #fff; border-radius: 24px; padding: 22px; border: 1px solid var(--line); }
        .hm-head { display: flex; justify-content: space-between; align-items: center; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 18px; margin-bottom: 14px; }
        .hm-sort { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; font-size: 12px; color: var(--muted); background: var(--paper); padding: 6px 12px; border-radius: 999px; }
        .hm-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid var(--line); }
        .hm-row-t { flex: 1; min-width: 0; }
        .hm-row-t b { display: block; font-family: 'Be Vietnam Pro', sans-serif; font-size: 15px; font-weight: 700; }
        .hm-row-t small { color: var(--muted); font-size: 12px; font-weight: 500; }
        .hm-chip { font-weight: 800; font-size: 13px; padding: 6px 12px; border-radius: 999px; font-family: 'Be Vietnam Pro', sans-serif; }
        .hm-chip.pos { background: var(--mint); color: #0a7a57; }
        .hm-chip.neg { background: var(--peach); color: #c24a17; }
        .hm-foot { margin-top: 6px; padding-top: 14px; border-top: 1px solid var(--line); font-weight: 700; font-size: 13px; color: var(--blue); }
        .hm-stat small { color: var(--muted); font-weight: 600; font-size: 13px; }
        .hm-big { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: 44px; letter-spacing: -.04em; line-height: 1.1; margin-top: 4px; }
        .hm-delta { display: inline-block; margin-top: 6px; font-size: 12px; font-weight: 700; color: #0a7a57; background: var(--mint); padding: 4px 10px; border-radius: 999px; }
        .hm-bars { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; height: 96px; margin-top: 18px; }
        .hm-b { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 6px; }
        .hm-b span { display: block; width: 100%; border-radius: 8px; background: var(--sky); height: var(--h); transform-origin: bottom; animation: lp-grow 1.1s var(--ease) both; animation-delay: calc(1.5s + var(--k) * 90ms); }
        .hm-b span.hot { background: linear-gradient(180deg, var(--blue-2), var(--blue)); }
        .hm-b em { font-style: normal; font-size: 11px; font-weight: 700; color: var(--muted); }
        @keyframes lp-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .hm-settle { display: flex; align-items: center; gap: 14px; padding: 16px 20px; }
        .hm-settle b { display: block; font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 800; }
        .hm-settle small { color: var(--muted); font-size: 12px; font-weight: 500; }
        .hm-settle-ic { width: 40px; height: 40px; border-radius: 14px; background: linear-gradient(135deg, #00b386, #00a67e); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hm-float { position: absolute; z-index: 5; animation: lp-float 6s ease-in-out infinite; }
        @keyframes lp-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -12px; } }
        .hm-receipt {
          right: -48px; top: -52px; width: 188px; background: rgba(255,255,255,.96);
          border-radius: 22px; padding: 16px 18px; box-shadow: 0 24px 50px rgba(30,40,90,.2);
          border: 1px solid var(--line); rotate: 6deg; text-align: left;
        }
        .hm-receipt-ic { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,107,53,.14); display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
        .hm-receipt-l { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 13px; margin-bottom: 8px; }
        .hm-receipt-box { background: var(--paper); border-radius: 12px; padding: 8px 12px; }
        .hm-receipt-s { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
        .hm-receipt-a { font-family: 'Be Vietnam Pro', sans-serif; font-size: 22px; font-weight: 900; color: var(--orange); letter-spacing: -.02em; }
        .hm-friends { left: 36px; bottom: -34px; background: #fff; border-radius: 999px; padding: 10px 18px 10px 12px; display: flex; align-items: center; gap: 10px; box-shadow: 0 20px 44px rgba(30,40,90,.2); border: 1px solid var(--line); font-weight: 800; font-size: 13px; font-family: 'Be Vietnam Pro', sans-serif; animation-delay: -2.5s; }
        .hm-stack { display: flex; align-items: center; }
        .lp-av { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 800; font-family: 'Be Vietnam Pro', sans-serif; flex-shrink: 0; }

        /* ── Marquee strip ──────────────────────────────────── */
        .lp-strip { margin-top: 56px; padding: 22px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); overflow: hidden; background: #fff; }
        .lp-strip-track { display: flex; width: max-content; animation: lp-marquee 30s linear infinite; }
        .lp-strip-item { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(18px, 2.4vw, 28px); letter-spacing: -.02em; color: var(--ink); padding: 0 28px; display: flex; align-items: center; gap: 56px; white-space: nowrap; }
        .lp-strip-item::after { content: '✦'; color: var(--orange); font-size: .7em; }
        @keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        /* ── Statement (scroll-fill) ────────────────────────── */
        .lp-statement { padding: 130px 0 90px; }
        .lp-fill { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: clamp(30px, 4.6vw, 62px); line-height: 1.12; letter-spacing: -.035em; max-width: 1020px; margin: 0 auto; text-align: center; }
        .lp-fill .fw { color: rgba(17,17,19,.14); transition: color .35s ease; }
        .lp-fill .fw.on { color: var(--ink); }
        .lp-fill .fw.em.on { color: var(--blue); }
        .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 80px; }
        .lp-stat { background: #fff; border: 1px solid var(--line); border-radius: 28px; padding: 30px 28px; transition: transform .4s var(--ease), box-shadow .4s ease; }
        .lp-stat:hover { transform: translateY(-6px); box-shadow: 0 24px 50px -20px rgba(30,40,90,.25); }
        .lp-stat > b { display: block; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: clamp(44px, 5vw, 68px); letter-spacing: -.05em; line-height: 1; }
        .lp-stat:nth-child(1) > b { color: var(--blue); }
        .lp-stat:nth-child(2) > b { color: var(--orange); }
        .lp-stat:nth-child(3) > b { color: var(--violet); }
        .lp-stat > span { display: block; margin-top: 12px; color: var(--muted); font-weight: 600; font-size: 15px; }

        /* ── Section heads ──────────────────────────────────── */
        .lp-eyebrow { display: inline-block; font-weight: 800; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; color: var(--blue); background: var(--sky); padding: 7px 14px; border-radius: 999px; margin-bottom: 20px; }
        .lp-h2 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(38px, 5.6vw, 72px); line-height: 1.02; letter-spacing: -.045em; }
        .lp-lede { color: var(--muted); font-size: 18px; line-height: 1.6; margin-top: 18px; font-weight: 500; }
        .lp-head { text-align: center; margin-bottom: 64px; }

        /* ── Steps: sticky stacking cards ───────────────────── */
        .lp-how { padding: 60px 0 120px; scroll-margin-top: 70px; }
        .lp-stack { display: flex; flex-direction: column; gap: 28px; }
        .lp-scard {
          position: sticky; top: calc(96px + var(--n) * 22px);
          border-radius: 40px; padding: 48px; min-height: 420px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
          border: 1px solid rgba(17,17,19,.06);
          box-shadow: 0 30px 60px -30px rgba(30,40,90,.25);
        }
        .lp-scard.peach { background: linear-gradient(135deg, #ffe9de, #ffd6c2); }
        .lp-scard.sky { background: linear-gradient(135deg, #e3edff, #cddfff); }
        .lp-scard.mint { background: linear-gradient(135deg, #dff7ec, #c4efdc); }
        .lp-snum { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: clamp(80px, 11vw, 150px); line-height: .85; letter-spacing: -.07em; color: rgba(17,17,19,.1); }
        .lp-scard h3 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 48px); letter-spacing: -.04em; margin: 18px 0 12px; }
        .lp-scard p { color: var(--ink-2); font-size: 17px; line-height: 1.65; max-width: 400px; font-weight: 500; }
        .sv-card { background: #fff; border-radius: 28px; padding: 26px; box-shadow: 0 30px 60px -24px rgba(17,17,19,.28); max-width: 400px; margin-left: auto; width: 100%; }
        .sv-lab { display: block; font-weight: 800; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
        .sv-input { border: 2px solid var(--blue); border-radius: 16px; padding: 16px 18px; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 20px; box-shadow: 0 0 0 5px rgba(0,86,198,.1); }
        .lp-type { display: inline-block; overflow: hidden; white-space: nowrap; vertical-align: bottom; border-right: 2px solid var(--blue); width: 0; animation: lp-typing 3.6s steps(12) infinite alternate, lp-caret .7s step-end infinite; }
        @keyframes lp-typing { 0%,12% { width: 0; } 70%,100% { width: 12ch; } }
        @keyframes lp-caret { 50% { border-color: transparent; } }
        .sv-members { display: flex; align-items: center; margin: 20px 0; }
        .sv-add { margin-left: 12px; font-weight: 700; font-size: 13px; color: var(--blue); background: var(--sky); padding: 8px 14px; border-radius: 999px; }
        .sv-btn { background: var(--ink); color: #fff; text-align: center; padding: 14px; border-radius: 14px; font-weight: 700; font-family: 'Be Vietnam Pro', sans-serif; }
        .sv-line { display: flex; justify-content: space-between; align-items: center; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 15px; }
        .sv-line span { color: var(--muted); font-weight: 600; }
        .sv-line b { display: inline-flex; align-items: center; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; }
        .sv-chips { display: flex; gap: 8px; margin-top: 18px; }
        .sv-chips i { flex: 1; font-style: normal; text-align: center; font-weight: 800; font-size: 12px; padding: 9px 0; border-radius: 12px; background: var(--sky); color: var(--blue); animation: lp-pop 2.6s var(--ease) infinite; }
        .sv-chips i:nth-child(2) { animation-delay: .12s; } .sv-chips i:nth-child(3) { animation-delay: .24s; } .sv-chips i:nth-child(4) { animation-delay: .36s; } .sv-chips i:nth-child(5) { animation-delay: .48s; }
        @keyframes lp-pop { 0%,60%,100% { transform: none; } 30% { transform: translateY(-6px); background: var(--blue); color: #fff; } }
        .sv-pay { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
        .sv-pay > span { display: inline-flex; align-items: center; gap: .3em; }
        .sv-pay em { font-style: normal; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: 16px; }
        .sv-done { font-size: 12px; font-weight: 800; color: #0a7a57; background: var(--mint); padding: 5px 10px; border-radius: 999px; opacity: 0; animation: lp-done 4.4s ease infinite; }
        @keyframes lp-done { 0%,25% { opacity: 0; transform: scale(.8); } 35%,85% { opacity: 1; transform: none; } 100% { opacity: 0; } }
        .sv-ok { margin-top: 16px; text-align: center; font-weight: 800; font-size: 13px; color: #0a7a57; background: var(--mint); padding: 12px; border-radius: 14px; }

        /* ── Feature tabs panel ─────────────────────────────── */
        .lp-feat { padding: 20px 0 120px; }
        .lp-tabs { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
        .lp-tab { position: relative; overflow: hidden; border: 1.5px solid var(--line); background: #fff; color: var(--ink-2); font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 999px; cursor: pointer; transition: background .3s ease, color .3s ease, border-color .3s ease, transform .3s var(--ease); }
        .lp-tab:hover { transform: translateY(-2px); border-color: var(--ink); }
        .lp-tab.on { background: var(--ink); color: #fff; border-color: var(--ink); }
        .lp-tab .pg { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--orange); width: 0; animation: lp-prog 6s linear forwards; }
        .lp-tab.paused .pg { animation-play-state: paused; }
        @keyframes lp-prog { to { width: 100%; } }
        .lp-panel { position: relative; overflow: hidden; border-radius: 44px; padding: 56px; color: #fff; background: #000; min-height: 460px; display: flex; align-items: center; }
        .lp-panel-in { position: relative; z-index: 2; width: 100%; display: grid; grid-template-columns: 1fr 1.05fr; gap: 48px; align-items: center; animation: lp-swap .7s var(--ease) both; }
        @keyframes lp-swap { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .lp-panel h3 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 52px); letter-spacing: -.045em; line-height: 1.02; margin: 0 0 16px; }
        .lp-panel p { color: rgba(255,255,255,.82); font-size: 17px; line-height: 1.65; max-width: 430px; font-weight: 500; }
        .lp-tags { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 8px; }
        .lp-tag { padding: 7px 16px; border-radius: 999px; background: rgba(255,255,255,.16); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font-weight: 700; font-size: 12px; border: 1px solid rgba(255,255,255,.18); }
        .lp-link { margin-top: 26px; display: inline-flex; align-items: center; gap: 8px; background: #fff; color: var(--blue); font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 14px; padding: 12px 20px; border-radius: 999px; border: none; cursor: pointer; transition: transform .3s var(--ease); }
        .lp-link:hover { transform: translateY(-2px); }
        .lp-link span { display: inline-block; transition: transform .25s ease; }
        .lp-link:hover span { transform: translateX(4px); }
        .tv-card { background: #fff; color: var(--ink); border-radius: 30px; padding: 26px; box-shadow: 0 36px 70px -26px rgba(0,0,0,.45); }
        .tv-split { display: grid; grid-template-columns: 1fr auto 1fr; gap: 12px; align-items: center; }
        .tv-arrow { font-size: 26px; font-weight: 800; color: var(--orange); }
        .tv-list { display: flex; flex-direction: column; gap: 6px; }
        .tv-list span { font-size: 12px; font-weight: 700; padding: 7px 11px; border-radius: 10px; background: var(--paper); display: flex; justify-content: space-between; gap: 6px; }
        .tv-list.dim span { color: var(--muted); text-decoration: line-through; text-decoration-color: rgba(229,57,53,.6); }
        .tv-list.good span { background: var(--mint); color: #0a7a57; padding: 12px; animation: lp-pop 3s var(--ease) infinite; }
        .tv-list.good span:nth-child(2) { animation-delay: .25s; }
        .tv-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .tv-tile { background: var(--paper); border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 4px; animation: lp-swap .8s var(--ease) both; transition: transform .35s var(--ease); }
        .tv-tile:hover { transform: translateY(-5px) rotate(-1deg); }
        .tv-tile .lp-av { margin-bottom: 8px; }
        .tv-tile b { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 16px; }
        .tv-tile small { color: var(--muted); font-weight: 600; font-size: 12px; }
        .tv-live { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #0a7a57; margin-bottom: 14px; }
        .tv-live i { width: 8px; height: 8px; border-radius: 50%; background: #00b386; animation: lp-pulse 1.6s infinite; }
        .tv-tabs { display: inline-flex; background: var(--paper); border-radius: 999px; padding: 4px; margin-bottom: 8px; }
        .tv-tabs span { padding: 8px 18px; border-radius: 999px; font-weight: 700; font-size: 13px; color: var(--muted); }
        .tv-tabs span.on { background: var(--ink); color: #fff; }
        .tv-tick { animation: lp-tick 3.2s ease-in-out infinite; }
        @keyframes lp-tick { 0%,70%,100% { color: var(--ink); transform: none; } 80% { color: var(--orange); transform: scale(1.18); } }
        .tv-code-box { display: flex; gap: 8px; margin: 4px 0 22px; }
        .tv-code-box span { flex: 1; text-align: center; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: 26px; padding: 14px 0; border-radius: 14px; background: var(--sky); color: var(--blue); animation: lp-swap .6s var(--ease) both; }
        .tv-members { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 14px; color: var(--ink-2); }

        /* ── Testimonials ───────────────────────────────────── */
        .lp-testi { padding: 20px 0 120px; overflow: hidden; }
        .lp-twrap { overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent); padding: 14px 0; }
        .lp-ttrack { display: flex; gap: 18px; width: max-content; animation: lp-marquee 55s linear infinite; }
        .lp-ttrack.rev { animation-direction: reverse; animation-duration: 62s; }
        .lp-twrap:hover .lp-ttrack { animation-play-state: paused; }
        .lp-tcard { width: 340px; flex-shrink: 0; background: #fff; border: 1px solid var(--line); border-radius: 26px; padding: 26px; display: flex; flex-direction: column; justify-content: space-between; gap: 22px; min-height: 200px; transition: transform .4s var(--ease), box-shadow .4s ease; }
        .lp-tcard:hover { transform: translateY(-6px); box-shadow: 0 24px 50px -22px rgba(30,40,90,.3); }
        .lp-tcard p { font-size: 15px; line-height: 1.65; font-weight: 500; color: var(--ink); }
        .lp-tmeta { display: flex; align-items: center; gap: 12px; }
        .lp-tmeta b { display: block; font-family: 'Be Vietnam Pro', sans-serif; font-size: 14px; font-weight: 800; }
        .lp-tmeta small { color: var(--muted); font-size: 12px; font-weight: 600; }
        .lp-ttrack + .lp-ttrack { margin-top: 18px; }

        /* ── FAQ ────────────────────────────────────────────── */
        .lp-faq { padding: 0 0 120px; }
        .lp-faq-grid { display: grid; grid-template-columns: .85fr 1.15fr; gap: 64px; align-items: start; }
        .lp-faq-side { position: sticky; top: 110px; }
        .lp-faq-side .lp-h2 { font-size: clamp(36px, 4.6vw, 60px); }
        .lp-qa { border-bottom: 1px solid var(--line); }
        .lp-qa:first-child { border-top: 1px solid var(--line); }
        .lp-q { width: 100%; background: none; border: none; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 0; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 19px; letter-spacing: -.02em; color: var(--ink); }
        .lp-q .pm { position: relative; width: 36px; height: 36px; border-radius: 50%; background: #fff; border: 1px solid var(--line); flex-shrink: 0; transition: background .3s ease, transform .5s var(--ease); }
        .lp-q .pm::before, .lp-q .pm::after { content: ''; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; background: var(--ink); border-radius: 2px; transform: translate(-50%,-50%); transition: transform .5s var(--ease), background .3s ease; }
        .lp-q .pm::after { transform: translate(-50%,-50%) rotate(90deg); }
        .lp-qa.open .pm { background: var(--ink); transform: rotate(180deg); }
        .lp-qa.open .pm::before, .lp-qa.open .pm::after { background: #fff; }
        .lp-qa.open .pm::after { transform: translate(-50%,-50%) rotate(0deg); }
        .lp-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .55s var(--ease); }
        .lp-qa.open .lp-a { grid-template-rows: 1fr; }
        .lp-a > div { overflow: hidden; }
        .lp-a p { padding: 0 56px 26px 0; color: var(--muted); font-size: 16px; line-height: 1.7; font-weight: 500; opacity: 0; transform: translateY(-6px); transition: opacity .5s ease .08s, transform .5s var(--ease) .05s; }
        .lp-qa.open .lp-a p { opacity: 1; transform: none; }

        /* ── Final CTA ──────────────────────────────────────── */
        .lp-final { padding: 0 24px 90px; }
        .lp-final-card { position: relative; overflow: hidden; max-width: 1180px; margin: 0 auto; border-radius: 48px; padding: 100px 40px; text-align: center; background: #000; color: #fff; }
        .lp-final-in { position: relative; z-index: 2; }
        .lp-final-eyebrow { font-weight: 800; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.75); margin-bottom: 22px; }
        .lp-final h2 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(46px, 7.4vw, 100px); line-height: .98; letter-spacing: -.05em; margin: 0 auto 22px; max-width: 800px; }
        .lp-final-p { color: rgba(255,255,255,.8); font-size: 18px; margin-bottom: 42px; line-height: 1.6; }
        .lp-final-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* ── Responsive ─────────────────────────────────────── */
        @media (max-width: 960px) {
          .lp-wrap { padding: 0 20px; }
          .lp-hero { padding-top: 48px; }
          .hm-receipt { right: -6px; top: -46px; width: 160px; }
          .hm-friends { left: 12px; bottom: -30px; }
          .hm-grid { grid-template-columns: 1fr; }
          .lp-stats { grid-template-columns: 1fr; }
          .lp-scard { grid-template-columns: 1fr; padding: 32px 26px; gap: 28px; position: relative; top: 0; min-height: 0; }
          .sv-card { margin: 0; max-width: none; }
          .lp-panel { padding: 32px 22px; border-radius: 32px; }
          .lp-panel-in { grid-template-columns: 1fr; gap: 32px; }
          .lp-faq-grid { grid-template-columns: 1fr; gap: 36px; }
          .lp-faq-side { position: static; }
          .lp-final-card { padding: 72px 22px; border-radius: 36px; }
          .lp-statement { padding: 90px 0 60px; }
        }
        @media (max-width: 560px) {
          .tv-split { grid-template-columns: 1fr; }
          .tv-arrow { transform: rotate(90deg); text-align: center; }
          .lp-tcard { width: 290px; }
          .lp-a p { padding-right: 0; }
          .lp footer > div:first-child { grid-template-columns: 1fr 1fr !important; padding: 44px 24px 32px !important; gap: 32px !important; }
          .lp footer > div:last-child { padding: 18px 24px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp *, .lp *::before, .lp *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; transition-delay: 0ms !important; animation-delay: 0ms !important; }
          .lp-strip-track, .lp-ttrack { animation: none !important; }
          .lp-reveal, .lp-pill, .lp-sub, .lp-cta, .hm-wrap { opacity: 1 !important; transform: none !important; }
          .lp-st .w { transform: none !important; }
        }
      `}</style>

      <Nav actions={navActions} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-blob b1" />
        <div className="lp-blob b2" />
        <div className="lp-blob b3" />
        <DotPattern color="rgba(17,17,19,0.07)" style={{ inset: 0, width: '100%', height: '100%', WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 0%, transparent 70%)', maskImage: 'radial-gradient(ellipse at 50% 30%, #000 0%, transparent 70%)' }} />
        <div className="lp-wrap lp-hero-in">
          <span className="lp-pill"><i />Expense splitting, reimagined</span>
          <SplitText as="h1" className="lp-h1" onLoad text={'Split Smart,\n*Live Easy.*'} />
          <p className="lp-sub">
            Stop the awkward "who owes what" talks. Split.ly turns group finances into a playful, stress-free experience.
          </p>
          <div className="lp-cta">
            {user ? (
              <>
                <button className="lp-btn dark" onClick={() => navigate('/dashboard')}>
                  <Roll>Go to Dashboard</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: '#fff' }} /></span>
                </button>
                <button className="lp-btn light" onClick={() => navigate('/groups')}>
                  <Roll>My Groups</Roll>
                </button>
              </>
            ) : (
              <>
                <button className="lp-btn dark" onClick={() => navigate('/signup')}>
                  <Roll>Get Started Free</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: '#fff' }} /></span>
                </button>
                <button className="lp-btn light" onClick={scrollToWhy}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7l5 3-5 3V7z" fill="currentColor"/></svg>
                  <Roll>See How</Roll>
                </button>
              </>
            )}
          </div>
          <HeroMock />
        </div>
      </section>

      {/* ── MARQUEE STRIP ─────────────────────────────────────────────── */}
      <div className="lp-strip" aria-hidden="true">
        <div className="lp-strip-track">
          {allMarquee.map((item, i) => (
            <span className="lp-strip-item" key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── STATEMENT + STATS ─────────────────────────────────────────── */}
      <section className="lp-statement">
        <div className="lp-wrap">
          <ScrollFill text={'Stop the awkward *who owes what* talks. Split.ly turns group finances into a *playful, stress-free* experience.'} />
          <div className="lp-stats">
            <Reveal className="lp-stat" delay={0}>
              <b><CountUp to={2} suffix="M+" /></b>
              <span>friends living life without the money stress</span>
            </Reveal>
            <Reveal className="lp-stat" delay={120}>
              <b><CountUp to={1} suffix=" tap" /></b>
              <span>to mark a payment as settled</span>
            </Reveal>
            <Reveal className="lp-stat" delay={240}>
              <b>∞</b>
              <span>groups — hostels, trips, flatmates, lunches</span>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="lp-how" ref={whyRef}>
        <div className="lp-wrap">
          <div className="lp-head">
            <Reveal><span className="lp-eyebrow">How it works</span></Reveal>
            <SplitText className="lp-h2" text={'Simple as *1-2-3.*'} />
            <Reveal as="p" className="lp-lede" delay={150}>No tutorials. No onboarding. Just pure efficiency.</Reveal>
          </div>
          <div className="lp-stack">
            {steps.map((s, i) => (
              <article className={`lp-scard ${s.tone}`} style={{ '--n': i }} key={s.n}>
                <div>
                  <div className="lp-snum">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                <StepVisual n={i} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUILT FOR REAL LIFE (tabs) ────────────────────────────────── */}
      <section className="lp-feat">
        <div className="lp-wrap">
          <div className="lp-head">
            <Reveal><span className="lp-eyebrow">Features</span></Reveal>
            <SplitText className="lp-h2" text={'Built for *real life.*'} />
            <Reveal as="p" className="lp-lede" delay={150}>Precision tools wrapped in a playful experience.</Reveal>
          </div>

          <Reveal>
            <div className="lp-tabs" role="tablist">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === i}
                  className={`lp-tab ${tab === i ? 'on' : ''} ${tabPaused ? 'paused' : ''}`}
                  onClick={() => setTab(i)}
                >
                  {t.label}
                  {tab === i && !tabPaused && <span className="pg" key={`${tab}-pg`} />}
                </button>
              ))}
            </div>
            <div
              className="lp-panel"
              onMouseEnter={() => setTabPaused(true)}
              onMouseLeave={() => setTabPaused(false)}
            >
              <DotPattern color="rgba(255,255,255,0.10)" style={{ top: 0, right: 0, width: '45%', height: '100%' }} />
              <div className="lp-panel-in" key={active.id}>
                <div>
                  <h3>{active.title}</h3>
                  <p>{active.desc}</p>
                  <div className="lp-tags">
                    {active.tags.map(t => <span className="lp-tag" key={t}>{t}</span>)}
                  </div>
                  {active.cta && (
                    <button className="lp-link" onClick={() => navigate(user ? '/groups' : '/signup')}>
                      Share via Group Code <span>→</span>
                    </button>
                  )}
                </div>
                <TabVisual id={active.id} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────── */}
      <section className="lp-testi">
        <div className="lp-wrap">
          <div className="lp-head">
            <Reveal><span className="lp-eyebrow">What people say</span></Reveal>
            <SplitText className="lp-h2" text={'Real People.\n*Real Relief.*'} />
          </div>
        </div>
        <div className="lp-twrap">
          <div className="lp-ttrack">
            {allTestimonials.map((t, i) => (
              <div className="lp-tcard" key={i}>
                <p>"{t.text}"</p>
                <div className="lp-tmeta">
                  <Av i={i} size={38}>{t.name[0]}</Av>
                  <div><b>{t.name}</b><small>{t.location}</small></div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-ttrack rev">
            {allRow2.map((t, i) => (
              <div className="lp-tcard" key={i}>
                <p>"{t.text}"</p>
                <div className="lp-tmeta">
                  <Av i={i + 2} size={38}>{t.name[0]}</Av>
                  <div><b>{t.name}</b><small>{t.location}</small></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="lp-faq">
        <div className="lp-wrap">
          <div className="lp-faq-grid">
            <div className="lp-faq-side">
              <Reveal><span className="lp-eyebrow">FAQ</span></Reveal>
              <SplitText className="lp-h2" text={'Your questions,\n*answered.*'} />
              <Reveal as="p" className="lp-lede" delay={150}>Quick answers to the most common questions about Split.ly.</Reveal>
              <Reveal delay={250}>
                <button className="lp-btn dark" style={{ marginTop: 28 }} onClick={() => navigate(user ? '/groups' : '/signup')}>
                  <Roll>{user ? 'Go to My Groups' : 'Try it free'}</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: '#fff' }} /></span>
                </button>
              </Reveal>
            </div>
            <Reveal>
              <div>
                {FAQS.map((f, i) => (
                  <div className={`lp-qa ${openFaq === i ? 'open' : ''}`} key={f.q}>
                    <button className="lp-q" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                      <span>{f.q}</span>
                      <span className="pm" />
                    </button>
                    <div className="lp-a"><div><p>{f.a}</p></div></div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
      <section className="lp-final">
        <Reveal className="lp-final-card">
          <DotPattern color="rgba(255,255,255,0.10)" style={{ inset: 0, width: '100%', height: '100%' }} />
          <div className="lp-final-in">
            <p className="lp-final-eyebrow">Get started for free</p>
            <SplitText className="lp-final-h" accent="white" text={'Ready to\n*split smart?*'} />
            <p className="lp-final-p" style={{ marginTop: 22 }}>Join 2M+ friends living life without the money stress.</p>
            <div className="lp-final-actions">
              {user ? (
                <button className="lp-btn white" onClick={() => navigate('/groups')}>
                  <Roll>Go to My Groups</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: 'var(--blue)' }} /></span>
                </button>
              ) : (
                <>
                  <button className="lp-btn white" onClick={() => navigate('/signup')}>
                    <Roll>Create a Group</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: 'var(--blue)' }} /></span>
                  </button>
                  <button className="lp-btn ghost" onClick={() => navigate('/login')}>
                    <Roll>Log In</Roll>
                  </button>
                </>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}