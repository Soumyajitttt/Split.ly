import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import { RedDot } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';


/* ── Dot Pattern Background ───────────────────────────────────────────────── */
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

const TESTIMONIALS = [
  { text: "Finally no more awkward 'hey did you pay me back' messages in the hostel group chat.", name: "Ravi K.", location: "Kolkata" },
  { text: "We use it for every trip. Splitting 12-person expenses used to be a nightmare. Not anymore.", name: "Anisha M.", location: "Bangalore" },
  { text: "Settled a 3-month hostel bill in like 2 minutes. This thing actually works.", name: "Sourav D.", location: "Delhi" },
  { text: "Our friend group has 8 people and SplitX keeps everyone honest. No drama, ever.", name: "Priya R.", location: "Mumbai" },
  { text: "The algorithm is insane — told me I only need 2 payments instead of 7. Genius.", name: "Arnav S.", location: "Pune" },
  { text: "Tried 4 other apps. This is the only one that doesn't make me feel like I need a degree.", name: "Meera T.", location: "Chennai" },
  { text: "Used it for our Manali trip. Zero arguments about money for the first time ever.", name: "Kabir P.", location: "Hyderabad" },
  { text: "Clean UI, fast, does exactly what it says. My entire PG uses it now.", name: "Devanshi A.", location: "Ahmedabad" },
];

const MARQUEE_ITEMS = ['Split Smart', 'Zero Drama', 'Settle Up', 'No Arguments', 'Fair & Square', 'Hostel Life', 'Track Everything', 'Split Smart'];

const FEATURES = [
  {
    span: 'large',
    bg: 'var(--primary)',
    textColor: '#fff',
    title: 'Minimum Transactions',
    desc: 'Our greedy algorithm collapses complex debts into the fewest possible payments. No unnecessary back-and-forth.',
    tags: ['Debt Simplification', 'Smart Routing'],
    icon: (
      <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.18 }}>
        <circle cx="80" cy="80" r="60" stroke="white" strokeWidth="8"/>
        <circle cx="40" cy="40" r="16" fill="white"/>
        <circle cx="120" cy="40" r="16" fill="white"/>
        <circle cx="80" cy="130" r="16" fill="white"/>
        <line x1="40" y1="40" x2="80" y2="130" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="120" y1="40" x2="80" y2="130" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="40" y1="40" x2="120" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    span: 'small',
    bg: 'var(--secondary-container, #fd6c00)',
    textColor: '#fff',
    title: 'Group Flexibility',
    desc: 'Create any number of groups — hostels, trips, flatmates, office lunches. Each fully independent.',
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="20" width="22" height="22" rx="8" fill="white" fillOpacity="0.3"/>
        <rect x="38" y="20" width="22" height="22" rx="8" fill="white" fillOpacity="0.3"/>
        <rect x="21" y="8" width="22" height="22" rx="8" fill="white" fillOpacity="0.5"/>
        <rect x="21" y="34" width="22" height="22" rx="8" fill="white" fillOpacity="0.5"/>
      </svg>
    ),
  },
  {
    span: 'medium-left',
    bg: 'var(--surface-container-highest, #e4e2e2)',
    textColor: 'var(--on-surface, #1b1c1c)',
    title: 'Live Settlement View',
    desc: 'The Unpaid tab recalculates in real time as you add or settle expenses. Always accurate, always current.',
    avatars: true,
  },
  {
    span: 'medium-right',
    bg: '#fff',
    textColor: 'var(--on-surface, #1b1c1c)',
    title: 'Zero Learning Curve',
    desc: "If you can read a WhatsApp message, you can use SplitX. No tutorials. No onboarding. Just add and split.",
    icon: (
      <div style={{
        width: 80, height: 80,
        background: 'rgba(0,86,198,0.08)',
        borderRadius: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M10 16h28M10 24h20M10 32h14" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round"/>
          <circle cx="38" cy="30" r="8" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="2.5"/>
          <path d="M35 30l2 2 4-4" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    ),
    cta: 'Share via Group Code →',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { user, logout } = useAuth();
  const whyRef = useRef(null);

  const scrollToWhy = () => whyRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleLogout = async () => {
    try { await logoutUser(); } catch {}
    logout();
    showToast('Logged out');
  };

  const allTestimonials = [...TESTIMONIALS, ...TESTIMONIALS];
  const allMarquee = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  const initials = user?.fullname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

  const navActions = user ? (
    <>
      <button className="btn btn-ghost btn-sm"  onClick={() => navigate('/groups')}>GROUPS</button>
      <button className="btn btn-ghost btn-sm"  onClick={() => navigate('/dashboard')}>DASHBOARD</button>
      {/* <button className="btn btn-primary btn-sm" onClick={handleLogout}>Log Out</button> */}
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: 'white', fontWeight: 600 }} className="sidebar-avatar">
        {initials}
      </span>
    </>
  ) : (
    <>
     <button 
  className="btn btn-ghost btn-sm" 
  onClick={() => navigate('/login')}
>
  LOG IN
</button>

<button
  className="btn btn-primary btn-sm"
  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
  onClick={() => navigate('/')}
>
  <ArrowRightIcon style={{ width: 15, height: 15, color: '#ffffff' }} />
  GET STARTED
</button>
    </>
  );

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .landing-btn-primary {
          background: var(--primary);
          color: #fff;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 16px;
          padding: 16px 36px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          box-shadow: 0 16px 40px rgba(0,86,198,0.28);
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          will-change: transform;
        }
        .landing-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 48px rgba(0,86,198,0.35);
        }
        .landing-btn-outline {
          background: #fff;
          color: var(--on-surface);
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 16px;
          padding: 14px 32px;
          border-radius: 16px;
          border: 2px solid var(--outline-variant, #c2c6d8);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.18s ease, transform 0.18s cubic-bezier(.34,1.56,.64,1);
          will-change: transform;
        }
        .landing-btn-outline:hover {
          background: var(--surface-container-low);
          transform: translateY(-2px);
        }
        .landing-btn-ghost {
          background: transparent;
          color: #fff;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 700;
          font-size: 16px;
          padding: 14px 32px;
          border-radius: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          cursor: pointer;
          transition: background 0.18s ease;
          will-change: transform;
        }
        .landing-btn-ghost:hover {
          background: rgba(255,255,255,0.1);
        }

        /* Hero */
        .hero-split {
          display: flex;
          min-height: 88vh;
          overflow: hidden;
        }
        .hero-left {
          flex: 1;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 60px 60px 80px;
          position: relative;
          z-index: 1;
        }
        .hero-left-inner {
          max-width: 500px;
          width: 100%;
        }
        .hero-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0,86,198,0.08);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .hero-eyebrow-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .hero-h1 {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(52px, 6vw, 76px);
          font-weight: 900;
          line-height: 0.92;
          letter-spacing: -0.03em;
          color: var(--on-surface, #1b1c1c);
          margin: 0 0 24px;
        }
        .hero-h1 em {
          font-style: italic;
          color: var(--primary);
        }
        .hero-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          color: var(--on-surface-variant, #424655);
          line-height: 1.65;
          max-width: 420px;
          margin: 0 0 40px;
        }
        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        /* Hero Right */
        .hero-right {
          flex: 1;
          background: #fd6c00;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          overflow: hidden;
        }
        .hero-right-inner {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 60px 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Floating receipt card */
        .receipt-card {
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 20px 24px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.15);
          position: absolute;
          left: 10px; /* Adjusted to overlap properly */
          top: 30px;  /* Adjusted spacing */
          transform: rotate(-6deg);
          z-index: 20;
          border: 1.5px solid rgba(255,255,255,0.6);
          transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
          width: 200px;
        }
        .receipt-card:hover {
          transform: translateY(-8px) rotate(0deg);
        }
        .receipt-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(253,108,0,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .receipt-label {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: var(--on-surface, #1b1c1c);
          margin-bottom: 10px;
        }
        .receipt-amount-wrap {
          background: var(--surface-container-low, #f5f3f3);
          border-radius: 12px;
          padding: 10px 14px;
        }
        .receipt-amount-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--on-surface-variant);
          margin-bottom: 2px;
        }
        .receipt-amount {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #fd6c00;
          letter-spacing: -0.02em;
        }

        /* Central graphic card */
        .central-card {
          background: #fff;
          border-radius: 48px;
          padding: 36px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.18);
          border: 4px solid rgba(255,255,255,0.4);
          transform: rotate(3deg);
          position: relative;
          z-index: 10;
          margin-top: 50px; /* Reduced gap to fix top overlap */
        }
        .friend-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .friend-cell {
          aspect-ratio: 1;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .better-with {
          margin-top: 50px;
          text-align: center;
        }
        .better-with h2 {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 42px;
          font-weight: 900;
          color: #fff;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        /* ── HOW IT WORKS (MINIMAL TYPOGRAPHY) ── */
        .how-section {
          background: #fff; /* Pure white for high contrast */
          padding: 100px 80px 120px;
          border-top: 1px solid var(--outline-variant, #e4e2e2);
        }
        .how-inner {
          max-width: 1000px; /* Slightly narrower for better reading width */
          margin: 0 auto;
        }
        
        .how-header-minimal {
          text-align: center;
          margin-bottom: 80px;
        }
        .how-heading {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(40px, 5vw, 60px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.03em;
          color: var(--on-surface, #1b1c1c);
          margin: 0 0 16px;
        }
        .how-desc-minimal {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          color: var(--on-surface-variant);
          font-weight: 500;
          margin: 0;
        }

        .steps-minimal-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px; /* Slightly reduced gap because we added padding to cards */
        }

        /* ── Base Minimal Step ── */
        .step-minimal {
          border-top: 2px solid var(--on-surface, #1b1c1c);
          padding: 32px 24px;
          position: relative;
          overflow: hidden; /* Keeps the color fill inside the box */
          transition: border-color 0.4s ease;
          z-index: 1;
        }

        /* ── The Color Fill Background (Hidden by default) ── */
        .step-minimal::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: scaleY(0); /* Squished to the bottom */
          transform-origin: bottom;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }

        /* Hover Animation - Expands the background */
        .step-minimal:hover::before {
          transform: scaleY(1);
        }

        /* Removes the black border on hover so it blends smoothly */
        .step-minimal:hover {
          border-top-color: transparent;
        }

        /* Unique Colors for each step */
        .step-1::before { background: #fd6c00; } /* Orange */
        .step-2::before { background: var(--primary, #0056c6); } /* Blue */
        .step-3::before { background: var(--on-surface, #1b1c1c); } /* Dark */

        /* ── Typography & Hover Color Inversion ── */
        .step-minimal-number {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 72px;
          font-weight: 900;
          color: var(--surface-container-highest, #e4e2e2);
          line-height: 0.9;
          letter-spacing: -0.05em;
          margin-bottom: 24px;
          transition: color 0.4s ease;
        }
        
        .step-minimal-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: var(--on-surface);
          margin: 0 0 12px 0;
          transition: color 0.4s ease;
        }
        
        .step-minimal-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          color: var(--on-surface-variant);
          line-height: 1.7;
          margin: 0;
          transition: color 0.4s ease;
        }

        /* Change text to white when hovered */
        .step-minimal:hover .step-minimal-number {
          color: rgba(255, 255, 255, 0.25); /* Cool translucent white */
        }
        .step-minimal:hover .step-minimal-title,
        .step-minimal:hover .step-minimal-desc {
          color: #ffffff;
        }

        @media (max-width: 900px) {
          .steps-minimal-grid { grid-template-columns: 1fr; gap: 48px; }
          .how-section { padding: 60px 28px; }
        }

        /* The Tinted Cards */
        .step-card-tint {
          border-radius: 32px;
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease;
          border: 1px solid rgba(255,255,255,0.6); /* Adds a slight glass/inset effect */
          cursor: default;
        }
        .step-card-tint:hover {
          transform: translateY(-8px) scale(1.01);
        }

        /* Specific Background Tints & Hover Glows */
        .bg-orange-tint { background: rgba(253, 108, 0, 0.05); }
        .bg-orange-tint:hover { box-shadow: 0 24px 48px rgba(253, 108, 0, 0.12); }

        .bg-blue-tint { background: rgba(0, 86, 198, 0.05); }
        .bg-blue-tint:hover { box-shadow: 0 24px 48px rgba(0, 86, 198, 0.12); }

        .bg-dark-tint { background: rgba(27, 28, 28, 0.04); }
        .bg-dark-tint:hover { box-shadow: 0 24px 48px rgba(27, 28, 28, 0.08); }

        /* Floating White Icon Circle */
        .step-emoji {
          width: 64px;
          height: 64px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 32px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
        }

        .step-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: var(--on-surface);
          margin: 0 0 12px 0;
        }
        .step-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15.5px;
          color: var(--on-surface-variant);
          line-height: 1.65;
          margin: 0;
        }
        

        /* Marquee */
        .marquee-rule {
          overflow: hidden;
          border-top: 1.5px solid var(--outline-variant, #c2c6d8);
          border-bottom: 1.5px solid var(--outline-variant, #c2c6d8);
          padding: 18px 0;
          background: var(--surface-container-low, #f5f3f3);
        }
        .marquee-rule-track {
          display: flex;
          animation: marquee 22s linear infinite;
          width: max-content;
        }
        .marquee-rule-item {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          padding: 0 32px;
        }
        .marquee-rule-item::before {
          content: '·';
          margin-right: 32px;
          color: var(--primary);
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* Built for real life (bento) */
        .bento-section {
          background: #1b1c1c;
          padding: 88px 80px 96px;
          position: relative;
          overflow: hidden;
        }
        .bento-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .bento-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .bento-heading {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #fff;
          margin: 0 0 16px;
        }
        .bento-subhead {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 18px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
        }
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-auto-rows: auto;
          gap: 18px;
        }
        .bento-card {
          border-radius: 36px;
          padding: 40px;
          overflow: hidden;
          position: relative;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1);
          cursor: default;
          will-change: transform;
          isolation: isolate;
        }
        .bento-card:hover { transform: translateY(-6px); }
        .bento-large {
          grid-column: span 8;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .bento-small {
          grid-column: span 4;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
          text-align: center;
        }
        .bento-mid-left {
          grid-column: span 5;
          min-height: 320px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .bento-mid-right {
          grid-column: span 7;
          min-height: 320px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 28px;
        }
        .bento-card-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(24px, 2.8vw, 36px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .bento-card-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 15px;
          line-height: 1.65;
          font-weight: 500;
        }
        .bento-tag {
          display: inline-flex;
          align-items: center;
          padding: 6px 16px;
          border-radius: 999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 12px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
          color: #fff;
          margin-right: 8px;
        }
        .bento-tags { margin-top: 20px; }

        /* Avatars */
        .avatar-stack { display: flex; margin-bottom: 20px; }
        .avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 4px solid #1b1c1c;
          margin-right: -12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 900;
          font-size: 17px;
          color: #fff;
        }

        /* CTA link */
        .bento-cta-link {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: var(--primary);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-top: 14px;
          transition: gap 0.2s ease;
        }
        .bento-cta-link:hover { gap: 12px; }

        /* Testimonials */
        .testimonials-section {
          background: var(--surface, #fbf9f8);
          padding: 88px 0 96px;
          overflow: hidden;
          position: relative;
        }
        .testimonials-inner {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          padding: 0 40px 56px;
        }
        .testimonials-heading {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 900;
          letter-spacing: -0.025em;
          line-height: 0.97;
          color: var(--on-surface);
          margin: 0 0 12px;
        }
        .testimonials-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          color: var(--on-surface-variant);
        }
        .marquee-wrapper {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          padding: 16px 0 24px;
        }
        .marquee-track {
          display: flex;
          animation: marquee 28s linear infinite;
          width: max-content;
          gap: 20px;
          align-items: flex-start;
        }
        .testimonial-card {
          background: #fff;
          border-radius: 22px;
          padding: 26px 26px;
          width: 310px;
          flex-shrink: 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease;
          cursor: default;
          will-change: transform;
          isolation: isolate;
        }
        .testimonial-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 14px 36px rgba(0,0,0,0.11);
        }
        .testimonial-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 14px;
          color: var(--on-surface);
          line-height: 1.65;
          margin: 0 0 18px;
        }
        .testimonial-meta { display: flex; align-items: center; gap: 10px; }
        .testimonial-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .testimonial-author {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--on-surface);
        }
        .testimonial-location {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: var(--on-surface-variant);
          font-weight: 600;
        }

        /* Final CTA */
        .final-cta {
          background: var(--primary);
          padding: 88px 60px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .final-cta-inner { max-width: 600px; margin: 0 auto; position: relative; z-index: 1; }
        .final-cta-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.65);
          margin-bottom: 20px;
        }
        .final-cta h2 {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: clamp(44px, 6vw, 72px);
          font-weight: 900;
          color: #fff;
          line-height: 0.95;
          letter-spacing: -0.03em;
          margin: 0 0 20px;
        }
        .final-cta h2 em { font-style: italic; opacity: 0.85; }
        .final-cta p {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 44px;
          line-height: 1.6;
        }
        .final-cta-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .final-btn-white {
          background: #fff;
          color: var(--primary);
          font-family: 'Be Vietnam Pro', sans-serif;
          font-weight: 800;
          font-size: 15px;
          padding: 16px 36px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          will-change: transform;
        }
        .final-btn-white:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.18); }


        @media (max-width: 900px) {
          .hero-split { flex-direction: column; }
          .hero-left { padding: 56px 28px; }
          .steps-grid { grid-template-columns: 1fr; }
          .bento-large, .bento-small, .bento-mid-left, .bento-mid-right { grid-column: span 12; }
          .bento-mid-right { flex-direction: column; }
          .how-section, .bento-section, .final-cta { padding: 60px 28px; }
          .hero-right-inner { padding: 40px 28px; }
          .receipt-card { left: 20px; top: 0; }
        }
      `}</style>

      <Nav actions={navActions} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="hero-split">
        {/* Left */}
        <div className="hero-left">
          <div className="hero-left-inner">
            <div className="hero-eyebrow-pill">
              <span className="hero-eyebrow-dot" />
              Expense splitting, reimagined
            </div>
            <h1 className="hero-h1" style={{ lineHeight: '1.00' }}>
              Split Smart,<br />
              <em>Live Easy.</em>
            </h1>
            <p className="hero-sub">
              Stop the awkward "who owes what" talks. SplitX turns group finances into a playful, stress-free experience.
            </p>
            <div className="hero-cta-row">
              {user ? (
                <>
                  <button className="landing-btn-primary" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard →
                  </button>
                  <button className="landing-btn-outline" onClick={() => navigate('/groups')}>
                    My Groups
                  </button>
                </>
              ) : (
                <>
                  <button className="landing-btn-primary" onClick={() => navigate('/signup')}>
                    Get Started Free
                  </button>
                  <button className="landing-btn-outline" onClick={scrollToWhy}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 7l5 3-5 3V7z" fill="currentColor"/></svg>
                    See How
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right – orange */}
        <div className="hero-right">
          <DotPattern
            color="rgba(255,255,255,0.18)"
            style={{ inset: 0, width: '100%', height: '100%' }}
          />

          <div className="hero-right-inner">
            {/* Floating receipt card */}
            <div className="receipt-card">
              <div className="receipt-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="2" width="16" height="18" rx="3" stroke="#fd6c00" strokeWidth="2"/>
                  <path d="M7 7h8M7 11h6M7 15h4" stroke="#fd6c00" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="receipt-label">Group Dinner</div>
              <div className="receipt-amount-wrap">
                <div className="receipt-amount-label">Total Split</div>
                <div className="receipt-amount">₹4,250</div>
              </div>
            </div>

            {/* Central card */}
            <div className="central-card">
              <div className="friend-grid">
                {/* Row 1 */}
                <div className="friend-cell" style={{ background: 'rgba(0,86,198,0.15)' }}>
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="14" r="7" fill="var(--primary)" fillOpacity="0.7"/><ellipse cx="18" cy="30" rx="12" ry="7" fill="var(--primary)" fillOpacity="0.4"/></svg>
                </div>
                <div className="friend-cell" style={{ background: 'rgba(253,108,0,0.15)' }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 3l2.5 8H24l-6.5 4.7 2.5 8L14 19l-6 4.7 2.5-8L4 11h7.5z" fill="#fd6c00"/></svg>
                </div>
                <div className="friend-cell" style={{ background: 'var(--surface-container-highest, #e4e2e2)' }} />
                {/* Row 2 */}
                <div className="friend-cell" style={{ background: 'var(--surface-container-highest, #e4e2e2)' }} />
                <div className="friend-cell" style={{ background: 'var(--primary)', color: '#fff' }}>
                  <span style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontWeight: 900, fontSize: 20 }}>+12</span>
                </div>
                <div className="friend-cell" style={{ background: 'var(--surface-container-highest, #e4e2e2)' }} />
              </div>
            </div>

            {/* Tagline */}
            <div className="better-with">
              <h2>Better with<br />Friends.</h2>
            </div>
          </div>
        </div>
      </div>

{/* ── HOW IT WORKS (EDITORIAL / TYPOGRAPHIC) ──────────────────── */}
      <div className="how-section" ref={whyRef}>
        <div className="how-inner">
          
          <div className="how-header-minimal">
            <h2 className="how-heading">Simple as 1-2-3.</h2>
            <p className="how-desc-minimal">No tutorials. No onboarding. Just pure efficiency.</p>
          </div>
          
          <div className="steps-minimal-grid">
            {/* Step 1 */}
            <div className="step-minimal step-1">
              <div className="step-minimal-number">01</div>
              <h3 className="step-minimal-title">Create</h3>
              <p className="step-minimal-desc">Start a group for your hostel mates, travel squad, or dinner party in seconds.</p>
            </div>

            {/* Step 2 */}
            <div className="step-minimal step-2">
              <div className="step-minimal-number">02</div>
              <h3 className="step-minimal-title">Log</h3>
              <p className="step-minimal-desc">Add expenses instantly. Note who paid and who it's split with — SplitX handles the arithmetic.</p>
            </div>

            {/* Step 3 */}
            <div className="step-minimal step-3">
              <div className="step-minimal-number">03</div>
              <h3 className="step-minimal-title">Settle</h3>
              <p className="step-minimal-desc">Our algorithm finds the minimum payments needed. One tap marks it done.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── MARQUEE ─────────────────────────────────────────────────── */}
      <div className="marquee-rule">
        <div className="marquee-rule-track">
          {allMarquee.map((item, i) => (
            <span className="marquee-rule-item" key={i}>{item}</span>
          ))}
        </div>
      </div>

      {/* ── BUILT FOR REAL LIFE (BENTO) ──────────────────────────────── */}
      <div className="bento-section">
        <DotPattern
          color="rgba(255,255,255,0.04)"
          style={{ top: 0, right: 0, width: '40%', height: '100%' }}
        />

        <div className="bento-inner">
          <div className="bento-header">
            <h2 className="bento-heading">Built for real life.</h2>
            <p className="bento-subhead">Precision tools wrapped in a playful experience.</p>
          </div>

          <div className="bento-grid">
            {/* Large blue card */}
            <div className="bento-card bento-large" style={{ background: 'var(--primary)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, padding: 40, opacity: 0.15 }}>
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="12"/>
                  <circle cx="50" cy="50" r="22" fill="white"/>
                  <circle cx="150" cy="50" r="22" fill="white"/>
                  <circle cx="100" cy="168" r="22" fill="white"/>
                  <line x1="50" y1="50" x2="100" y2="168" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                  <line x1="150" y1="50" x2="100" y2="168" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                  <line x1="50" y1="50" x2="150" y2="50" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ maxWidth: 440, position: 'relative', zIndex: 1 }}>
                <div className="bento-card-title" style={{ color: '#fff' }}>
                  Minimum<br />Transactions
                </div>
                <p className="bento-card-desc" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Our greedy algorithm collapses complex debts into the fewest possible payments. No unnecessary back-and-forth between friends.
                </p>
              </div>
              <div className="bento-tags" style={{ position: 'relative', zIndex: 1 }}>
                <span className="bento-tag">Debt Simplification</span>
                <span className="bento-tag">Smart Routing</span>
              </div>
            </div>

            {/* Small orange card */}
            <div className="bento-card bento-small" style={{ background: '#fd6c00', position: 'relative' }}>
              <DotPattern
                color="rgba(255,255,255,0.12)"
                style={{ inset: 0, width: '100%', height: '100%', borderRadius: 40 }}
              />
              <div style={{
                width: 88, height: 88,
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'rotate(12deg)',
                flexShrink: 0,
                position: 'relative', zIndex: 1,
              }}>
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <rect x="6" y="6" width="18" height="18" rx="5" fill="white" fillOpacity="0.8"/>
                  <rect x="28" y="6" width="18" height="18" rx="5" fill="white" fillOpacity="0.6"/>
                  <rect x="6" y="28" width="18" height="18" rx="5" fill="white" fillOpacity="0.6"/>
                  <path d="M34 34m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0" fill="none" stroke="white" strokeWidth="3"/>
                  <path d="M31 34h6M34 31v6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="bento-card-title" style={{ color: '#fff', fontSize: 28 }}>
                  Group<br />Flexibility
                </div>
                <p className="bento-card-desc" style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14 }}>
                  Create any number of groups — hostels, trips, flatmates, office lunches. Each fully independent.
                </p>
              </div>
            </div>

            {/* Mid left – Live Activity */}
            <div className="bento-card bento-mid-left" style={{ background: 'var(--surface-container-highest, #e4e2e2)', color: 'var(--on-surface)' }}>
              <div className="avatar-stack">
                <div className="avatar-circle" style={{ background: 'var(--primary)' }}>R</div>
                <div className="avatar-circle" style={{ background: '#fd6c00' }}>A</div>
                <div className="avatar-circle" style={{ background: '#1b1c1c', border: '4px solid #e4e2e2' }}>S</div>
              </div>
              <div>
                <div className="bento-card-title" style={{ color: 'var(--on-surface)' }}>Live<br />Settlement View</div>
                <p className="bento-card-desc" style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                  The Unpaid tab recalculates in real time as you add or settle expenses. Always accurate.
                </p>
              </div>
            </div>

            {/* Mid right – Zero learning curve + debt simplification */}
            <div className="bento-card bento-mid-right" style={{ background: '#fff', color: 'var(--on-surface)' }}>
              <div style={{ flex: 1 }}>
                <div className="bento-card-title" style={{ color: 'var(--on-surface)' }}>Debt<br />Simplification</div>
                <p className="bento-card-desc" style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                  We find the shortest path to zero. Why pay 5 people when you can pay 1?
                </p>
                <button className="bento-cta-link" onClick={() => navigate(user ? '/groups' : '/signup')}>
                  Share via Group Code <span>→</span>
                </button>
              </div>
              <div style={{
                width: 140, height: 140,
                background: 'rgba(0,86,198,0.08)',
                borderRadius: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="20" stroke="var(--primary)" strokeWidth="3"/>
                  <circle cx="40" cy="12" r="7" fill="var(--primary)" fillOpacity="0.7"/>
                  <circle cx="64" cy="56" r="7" fill="var(--primary)" fillOpacity="0.7"/>
                  <circle cx="16" cy="56" r="7" fill="var(--primary)" fillOpacity="0.7"/>
                  <line x1="40" y1="19" x2="40" y2="20" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="58" y1="50" x2="57" y2="49" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="22" y1="50" x2="23" y2="49" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M40 19L40 32M57 49L50 44M23 49L30 44" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <div className="testimonials-section">
        <div className="testimonials-inner">
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 12 }}>
            What people say
          </p>
          <h2 className="testimonials-heading" style={{ lineHeight: '1.05' }}>Real People.<br />Real Relief.</h2>
        </div>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {allTestimonials.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-meta">
                  <div className="testimonial-avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-author">{t.name}</div>
                    <div className="testimonial-location">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <div className="final-cta">
        <DotPattern
          color="rgba(255,255,255,0.07)"
          style={{ inset: 0, width: '100%', height: '100%' }}
        />
        <div className="final-cta-inner">
          <p className="final-cta-eyebrow">Get started for free</p>
          <h2>Ready to<br /><em>split smart?</em></h2>
          <p>Join 2M+ friends living life without the money stress.</p>
          <div className="final-cta-actions">
            {user ? (
              <button className="final-btn-white" onClick={() => navigate('/groups')}>
                Go to My Groups →
              </button>
            ) : (
              <>
                <button className="final-btn-white" onClick={() => navigate('/signup')}>
                  Create a Group
                </button>
                <button className="landing-btn-ghost" onClick={() => navigate('/login')}>
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}