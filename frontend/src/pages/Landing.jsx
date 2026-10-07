import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import cardBlue from '../assets/cards/card-blue.png';
import cardOrange from '../assets/cards/card-orange.png';
import cardGreen from '../assets/cards/card-green.png';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/layout/Nav';
import Footer from '../components/layout/Footer';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api';
import {
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

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

const MARQUEE_ITEMS = ['Split Smart', 'Zero Drama', 'Settle Up', 'No Arguments', 'Fair & Square', 'Hostel Life', 'Track Everything'];

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

const HIGHLIGHTS = [
  { n: '01', tone: 'sky', img: cardBlue, title: 'Split it your way', desc: 'Divide an expense equally, or enter exactly how much each person owes.' },
  { n: '02', tone: 'peach', img: cardOrange, title: 'Settle share by share', desc: "Mark each person's share as paid. Part-paid or fully settled." },
  { n: '03', tone: 'ink', img: cardGreen, title: 'Live updates', desc: 'Track changes as they happen. Everyone sees the same totals.' },
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

const ARC_VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const ARC_FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2  uRes;
uniform float uTime, uDpr, uCell, uDot;
uniform float uPeak, uHeight, uThick, uFall;
uniform vec3  uBg, uBase, uAccent, uHigh;
uniform vec2  uMouse;
uniform float uMouseRadius, uMouseStrength;
void main(){
  float cs = max(uCell, 2.0);
  vec2 ci = floor(gl_FragCoord.xy / cs);
  vec2 cc = (ci + 0.5) * cs;
  float x = cc.x / uDpr;
  float y = (uRes.y - cc.y) / uDpr;
  float w = uRes.x / uDpr;
  float h = uRes.y / uDpr;
  float normX = (x - w * 0.5) / (w * 0.75);
  float curveY = h * uPeak + normX * normX * (h * uHeight);
  float mdx = x - uMouse.x;
  float influence = uMouseStrength * exp(-(mdx * mdx) / (2.0 * uMouseRadius * uMouseRadius + 1.0));
  curveY = mix(curveY, uMouse.y, influence);
  float dist = abs(y - curveY);
  float th = (140.0 + (1.0 - abs(normX)) * 80.0) * uThick;
  vec3 col = uBg;
  if (dist < th) {
    float i = 1.0 - dist / th;
    float waveX = sin(x * 0.015 + uTime);
    float waveY = cos(y * 0.02 + uTime);
    i = i * 0.7 + waveX * waveY * 0.3 * i;
    i *= max(0.0, 1.0 - pow(abs(normX), uFall));
    if (i > 0.02) {
      float side = uDot * i * uDpr;
      vec2 d = abs(gl_FragCoord.xy - cc);
      float cov = 1.0 - smoothstep(side * 0.5 - 1.0, side * 0.5 + 1.0, max(d.x, d.y));
      vec3 ink = mix(uBase, uAccent, clamp(pow(i, 1.1), 0.0, 1.0));
      ink = mix(ink, uHigh, smoothstep(0.72, 1.0, i));
      col = mix(uBg, ink, cov * clamp(i * 1.6, 0.0, 1.0));
    }
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

const arcHex = hex => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
};

/** Predictive Arc (Originkit) — dotted glow band that follows the pointer. */
function ArcField({
  className = '',
  background = '#eeede9',
  baseColor = '#ff6b35',
  accentColor = '#ff8f5e',
  highlight = '#ff6b35',
  density = 78,
  dotSize = 1.02,
  peak = 1.0,
  thickness = 2.06,
  falloff = 6,
  pointerRadius = 236,
  pointerStrength = 0.34,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });
    if (!gl) return undefined;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, ARC_VERT);
    const fs = compile(gl.FRAGMENT_SHADER, ARC_FRAG);
    if (!vs || !fs) return undefined;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const locs = {};
    const u = name => (name in locs ? locs[name] : (locs[name] = gl.getUniformLocation(prog, name)));

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ps = { x: 0, y: 0, tx: 0, ty: 0, a: 0, ta: 0 };
    const colors = { bg: arcHex(background), base: arcHex(baseColor), accent: arcHex(accentColor), high: arcHex(highlight) };

    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ps.ta = inside ? 1 : 0;
      ps.tx = e.clientX - r.left;
      ps.ty = r.height - (e.clientY - r.top);
    };
    const onLeave = () => { ps.ta = 0; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);

    let raf = 0;
    let visible = true;
    let last = performance.now();
    let clock = 0;

    const draw = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) clock = (clock + dt * 0.9) % 6283;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = canvas.clientWidth || 1200;
      const ch = canvas.clientHeight || 800;
      const bw = Math.max(1, Math.round(cw * dpr));
      const bh = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
      gl.viewport(0, 0, bw, bh);

      const pitchCss = Math.min(bw, bh) / dpr / density;
      ps.x += (ps.tx - ps.x) * Math.min(1, dt * 12);
      ps.y += (ps.ty - ps.y) * Math.min(1, dt * 12);
      ps.a += (ps.ta - ps.a) * Math.min(1, dt * 6);

      gl.uniform2f(u('uRes'), bw, bh);
      gl.uniform1f(u('uTime'), clock);
      gl.uniform1f(u('uDpr'), dpr);
      gl.uniform1f(u('uCell'), Math.max(2, pitchCss * dpr));
      gl.uniform1f(u('uDot'), pitchCss * 1.2 * dotSize);
      gl.uniform1f(u('uPeak'), peak);
      gl.uniform1f(u('uHeight'), 0.0);
      gl.uniform1f(u('uThick'), thickness);
      gl.uniform1f(u('uFall'), falloff);
      gl.uniform2f(u('uMouse'), ps.x, ps.y);
      gl.uniform1f(u('uMouseRadius'), pointerRadius);
      gl.uniform1f(u('uMouseStrength'), reduce ? 0 : pointerStrength * ps.a);
      gl.uniform3f(u('uBg'), colors.bg[0], colors.bg[1], colors.bg[2]);
      gl.uniform3f(u('uBase'), colors.base[0], colors.base[1], colors.base[2]);
      gl.uniform3f(u('uAccent'), colors.accent[0], colors.accent[1], colors.accent[2]);
      gl.uniform3f(u('uHigh'), colors.high[0], colors.high[1], colors.high[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = (!reduce && visible) ? requestAnimationFrame(draw) : 0;
    };

    let io;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
      });
      io.observe(wrap);
    }
    raf = requestAnimationFrame(draw);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [background, baseColor, accentColor, highlight, density, dotSize, peak, thickness, falloff, pointerRadius, pointerStrength]);

  return (
    <div ref={wrapRef} className={`lp-arc ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

/** Soft playful shapes floating around the hero. */
function Buddy({ kind, className = '' }) {
  const g = {
    arch: ['#ffc2a3', '#ff6b35'],
    orb: ['#6aa6ff', '#0056c6'],
    pill: ['#c3b2ff', '#7a5cff'],
    wedge: ['#6fe3bd', '#00a67e'],
    gem: ['#ffd9c7', '#ff8f5e'],
    dot: ['#bcd6ff', '#2a7dff'],
  }[kind];
  /* face is drawn around (0,0) then moved onto the shape */
  const face = {
    arch: 'translate(60 67) scale(.6)',
    orb: 'translate(60 60)',
    pill: 'translate(60 40) scale(.9)',
    wedge: 'translate(68 86) scale(.9)',
  }[kind];
  const shape = {
    arch: <path d="M6 106A54 54 0 0 1 114 106L80 106A20 20 0 0 0 40 106Z" />,
    orb: <circle cx="60" cy="60" r="52" />,
    pill: <rect x="28" y="4" width="64" height="112" rx="32" />,
    wedge: <path d="M12 14A104 104 0 0 1 112 114L12 114Z" />,
    gem: <rect x="26" y="26" width="68" height="68" rx="14" transform="rotate(45 60 60)" />,
    dot: <circle cx="60" cy="60" r="50" />,
  }[kind];
  return (
    <svg className={`bd bd-${kind} ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id={`bdg-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={g[0]} />
          <stop offset="1" stopColor={g[1]} />
        </linearGradient>
        <radialGradient id={`bdh-${kind}`} cx=".3" cy=".25" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill={`url(#bdg-${kind})`}>{shape}</g>
      <g fill={`url(#bdh-${kind})`}>{shape}</g>
      {face && (
        <g transform={face} fill="none" stroke="#111113" strokeOpacity=".72" strokeWidth="3" strokeLinecap="round">
          <path d="M-19 -4q5-6 10 0M9 -4q5-6 10 0M-7 8q7 7 14 0" />
        </g>
      )}
    </svg>
  );
}

function HeroBuddies() {
  return (
    <div className="lp-buddies" aria-hidden="true">
      <Buddy kind="arch" />
      <Buddy kind="orb" />
      <Buddy kind="gem" />
      <Buddy kind="dot" />
      <Buddy kind="pill" />
      <Buddy kind="wedge" />
    </div>
  );
}

/**
 * Folder card — closed: the folder covers ~74% of the card, with the art peeking above.
 * Hover / focus:
 *   - the folder sinks (like the reference), the art zooms + follows the cursor
 *   - a BIG glossy number rises out of the folder pocket (from behind the front panel)
 *     and floats over the art, drifting with the pointer
 *   - the number on the folder surface slides UP out of a mask and disappears
 *   - the larger number inside the folder is revealed UPWARD (clip reveal + rise)
 *   - the card tilts in 3D and a soft spotlight tracks the pointer
 * (touch devices: plays once when the card scrolls into view)
 */
const FC_CLOSED = 0.68;   /* same for every card, so all folder tops line up */
const FC_OPEN = 0.5;      /* every card sinks to the same height — content never decides it */
const CLIP_HIDDEN = 'inset(100% -30% 0% -30%)';   /* fully clipped (reveals bottom -> top) */
const CLIP_SHOWN = 'inset(-30% -30% -30% -30%)';  /* open, with room for the drop-shadow */
const FC_HIDDEN_Y = 200;   /* px the number sits below its resting spot while "inside" the folder */

function FolderCard({ n, tone, img, title, desc }) {
  const rootRef = useRef(null);
  const api = useRef({});

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const q = s => el.querySelector(s);
    const inner = q('.fc-in');
    const panel = q('.fc-panel');
    const image = q('.fc-img');
    const numTop = q('.fc-num-in');     /* number on the folder surface (inside a mask) */
    const pop = q('.fc-pop');           /* rises out of the folder */
    const popNum = q('.fc-pop-num');    /* the glossy digits (rotation / scale / parallax) */

    const mm = window.matchMedia;
    const reduce = mm && mm('(prefers-reduced-motion: reduce)').matches;
    const fine = mm && mm('(hover: hover) and (pointer: fine)').matches;
    const touch = mm && mm('(hover: none)').matches;
    const D = reduce ? 0 : 1;
    let io;

    const ctx = gsap.context(() => {
      gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 60%' });
      /* start tucked inside the folder */
      gsap.set(pop, { y: FC_HIDDEN_Y, clipPath: CLIP_HIDDEN });
      gsap.set(popNum, { rotation: -12, scale: 0.8, transformOrigin: '50% 100%' });

      const tiltX = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const tiltY = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      const imgX = gsap.quickTo(image, 'x', { duration: 0.9, ease: 'power3' });
      const imgY = gsap.quickTo(image, 'y', { duration: 0.9, ease: 'power3' });
      const popX = gsap.quickTo(popNum, 'x', { duration: 1.1, ease: 'power3' });
      const popY = gsap.quickTo(popNum, 'y', { duration: 1.1, ease: 'power3' });

      /* tallest description among ALL cards in the row: every card reacts identically,
         so one card's longer text can't limit (or change) how far another one moves */
      const maxTextH = () => {
        const scope = el.closest('.lp-stats') || document;
        return Math.max(0, ...Array.from(scope.querySelectorAll('.fc-text'), t => t.offsetHeight));
      };
      /* open: sinks to a fixed fraction (the small number has slid away, so its zone is free) */
      const openH = () => Math.max(inner.offsetHeight * FC_OPEN, 4 + maxTextH() + 24 + 12);
      /* closed: fixed fraction too (+ room for number and text if the row is very narrow) */
      const closedH = () => Math.max(inner.offsetHeight * FC_CLOSED, 85 + maxTextH() + 24);

      api.current.open = () => {
        el.classList.add('open');
        /* close() queues a delayed tween — kill pending ones so they can't undo this */
        gsap.killTweensOf([numTop, pop]);

        gsap.to(panel, { height: openH(), duration: 0.85 * D, ease: 'expo.out', overwrite: 'auto' });
        gsap.to(image, { scale: 1.1, duration: 1.4 * D, ease: 'expo.out', overwrite: 'auto' });
        gsap.to(el, { y: -10, duration: 0.7 * D, ease: 'expo.out', overwrite: 'auto' });

        /* surface number exits UPWARD out of its mask */
        gsap.to(numTop, { yPercent: -125, duration: 0.45 * D, ease: 'power3.in', overwrite: 'auto' });

        /* big number pops out of the folder */
        gsap.to(pop, { y: 0, duration: 1.15 * D, ease: 'back.out(1.25)', delay: 0.15 * D, overwrite: 'auto' });
        gsap.to(pop, { clipPath: CLIP_SHOWN, duration: 0.9 * D, ease: 'expo.out', delay: 0.15 * D, overwrite: 'auto' });
        gsap.to(popNum, { rotation: -5, scale: 1, duration: 1.2 * D, ease: 'expo.out', overwrite: 'auto' });
      };

      api.current.close = () => {
        el.classList.remove('open');
        gsap.killTweensOf([numTop, pop]);

        const H = inner.offsetHeight;
        /* closed height is a fixed fraction — NOT derived from text length — so folders align across cards */
        const target = closedH();
        gsap.to(panel, {
          height: target,
          duration: 0.7 * D,
          ease: 'expo.inOut',
          overwrite: 'auto',
          onComplete: () => {
            if (!el.classList.contains('open') && target <= H * FC_CLOSED + 0.5) gsap.set(panel, { clearProps: 'height' });
          },
        });
        gsap.to(image, { scale: 1, duration: 1 * D, ease: 'expo.out', overwrite: 'auto' });
        gsap.to(el, { y: 0, duration: 0.7 * D, ease: 'expo.out', overwrite: 'auto' });

        /* number slides back into the folder, tab number returns */
        gsap.to(pop, { y: FC_HIDDEN_Y, clipPath: CLIP_HIDDEN, duration: 0.6 * D, ease: 'expo.inOut', overwrite: 'auto' });
        gsap.to(popNum, { rotation: -12, scale: 0.8, duration: 0.6 * D, ease: 'expo.inOut', overwrite: 'auto' });
        /* comes back up from below the mask (so it keeps travelling the same direction) */
        gsap.fromTo(numTop, { yPercent: 125 }, { yPercent: 0, duration: 0.8 * D, ease: 'expo.out', delay: 0.3 * D, immediateRender: false, overwrite: 'auto' });
        tiltX(0); tiltY(0); imgX(0); imgY(0); popX(0); popY(0);
      };

      api.current.move = e => {
        if (!fine || reduce) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        tiltY((px - 0.5) * 10);
        tiltX((0.5 - py) * 8);
        imgX((0.5 - px) * 34);
        imgY((0.5 - py) * 24);
        /* foreground object drifts WITH the pointer (opposite of the background) */
        popX((px - 0.5) * 36);
        popY((py - 0.5) * 20);
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
      };

      if (!reduce && touch && typeof IntersectionObserver !== 'undefined') {
        io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) api.current.open();
          else api.current.close();
        }, { threshold: 0.65 });
        io.observe(el);
      }
    }, el);

    return () => {
      if (io) io.disconnect();
      ctx.revert();
    };
  }, []);

  const open = () => api.current.open && api.current.open();
  const close = () => api.current.close && api.current.close();

  return (
    <div
      className="fc-hit"
      onPointerEnter={e => { if (e.pointerType === 'mouse') open(); }}
      onPointerMove={e => { if (e.pointerType === 'mouse' && api.current.move) api.current.move(e); }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') close(); }}
    >
    <article
      ref={rootRef}
      className={`fc ${tone}`}
      tabIndex={0}
      onFocus={open}
      onBlur={close}
    >
      <div className="fc-in">
        <div className="fc-art">
          <img className="fc-img" src={img} alt="" loading="lazy" decoding="async" draggable="false" />
          <div className="fc-glow" />
        </div>
        <div className="fc-panel">
          {/* sits BEHIND the folder tab/body (z-index:-1) but above the art */}
          <div className="fc-pop" aria-hidden="true">
            <span className="fc-pop-num">{n}</span>
          </div>
          <div className="fc-body">
            <span className="fc-num"><span className="fc-num-in">{n}</span></span>
            <div className="fc-text">
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
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
        GET STARTED
        <ArrowRightIcon style={{ width: 15, height: 15, color: '#ffffff' }} />
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
        .lp-st .w.em-solid { color: var(--blue); }
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
          padding: 15px 26px; border-radius: 999px;
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
        .lp-btn.white { background: #fff; color: #000; box-shadow: 0 14px 34px rgba(0,0,0,.18); }
        .lp-btn.white:hover { transform: translateY(-3px); }
        .lp-btn.white .arr { background: rgba(0,0,0,.08); }
        .lp-btn.ghost { background: transparent; color: #fff; border-color: rgba(255,255,255,.4); }
        .lp-btn.ghost:hover { background: rgba(255,255,255,.12); border-color: #fff; transform: translateY(-3px); }
        .roll { display: inline-block; position: relative; overflow: hidden; height: 1.25em; line-height: 1.25; vertical-align: middle; }
        .roll .r1, .roll .r2 { display: block; transition: transform .5s var(--ease); white-space: nowrap; }
        .roll .r2 { position: absolute; left: 0; top: 100%; }
        .lp-btn:hover .roll .r1, .lp-btn:hover .roll .r2 { transform: translateY(-100%); }

        /* ── HERO ───────────────────────────────────────────── */
        .lp-hero { position: relative; min-height: calc(100vh - 72px); min-height: calc(100svh - 72px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0; overflow: clip; background: #eeede9; }
        .lp-hero::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse 62% 52% at 50% 30%, rgba(255,255,255,.85), rgba(255,255,255,0) 70%); }
        .lp-hero > .lp-wrap { width: 100%; }
        .lp-hero-in { text-align: center; position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }
        @keyframes lp-fade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes lp-pulse { 0%,100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0,86,198,.4); } 50% { opacity: .6; transform: scale(.85); box-shadow: 0 0 0 8px rgba(0,86,198,0); } }
        .lp-h1 {
          font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800;
          font-size: clamp(40px, 5.8vw, 80px); line-height: 1; letter-spacing: -.045em;
          margin: 0 auto; max-width: 900px; color: var(--ink);
        }
        .lp-sub {
          font-size: clamp(15px, 1.3vw, 18px); line-height: 1.6; color: var(--ink-2);
          max-width: 520px; margin: 20px auto 0;
          opacity: 0; animation: lp-fade 1s var(--ease) .75s both;
        }
        .lp-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 26px; opacity: 0; animation: lp-fade 1s var(--ease) .95s both; }
        .lp-trust { display: inline-flex; align-items: center; justify-content: center; gap: 12px; margin: 0 0 24px; padding: 6px 18px 6px 8px; border-radius: 999px; background: rgba(255,255,255,.8); border: 1px solid var(--line); font-size: 13px; font-weight: 700; color: var(--ink-2); opacity: 0; animation: lp-fade .9s var(--ease) .05s both; }

        .lp-arc { position: absolute; inset: 0; pointer-events: none; z-index: 0; -webkit-mask-image: linear-gradient(to bottom, transparent 38%, #000 82%); mask-image: linear-gradient(to bottom, transparent 38%, #000 82%); }
        .lp-arc canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }

        /* hero floating shapes */
        .lp-buddies { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
        .bd { position: absolute; display: block; height: auto; filter: drop-shadow(0 18px 20px rgba(30,40,90,.2)); animation: bd-float 7s ease-in-out infinite; }
        @keyframes bd-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -14px; } }
        .bd-arch  { width: 128px; left: 15%; top: 12%; rotate: -10deg; animation-delay: -1s; }
        .bd-orb   { width: 140px; left: 5%; top: 40%; animation-delay: -3s; }
        .bd-gem   { width: 44px; left: 19%; top: 56%; rotate: 12deg; animation-delay: -5s; }
        .bd-dot   { width: 32px; right: 27%; top: 12%; animation-delay: -2s; }
        .bd-pill  { width: 88px; right: 10%; top: 22%; rotate: 8deg; animation-delay: -4s; }
        .bd-wedge { width: 118px; right: 15%; top: 48%; rotate: 14deg; animation-delay: -6s; }

        .hm-stack { display: flex; align-items: center; }
        .lp-av { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 800; font-family: 'Be Vietnam Pro', sans-serif; flex-shrink: 0; }

        /* ── Marquee strip ──────────────────────────────────── */
        .lp-strip { margin-top: 0; padding: 22px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); overflow: hidden; background: #fff; }
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
        .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 80px; }

        /* folder cards — .fc-hit is a static, slightly larger hover zone (the card itself moves/tilts) */
        .fc-hit { padding: 10px; margin: -10px; }
        .fc { --frame:#0b1f55; --panel:#081338; --txt:#fff; --sub:rgba(255,255,255,.62); --acc:#5b8dff; --acc2:#e4dcff; --cut:30px; --r:22px; --mx:50%; --my:30%;
          /* same two-layer resting shadow on every card (wide soft + tight contact) so it reads on dark frames too */
          --sh: 0 36px 44px -26px rgba(30,40,90,.55), 0 14px 22px -14px rgba(17,17,19,.28);
          position: relative; aspect-ratio: 1 / 1; padding: 10px; border-radius: 42px; background: var(--frame);
          box-shadow: var(--sh); cursor: pointer; outline: none; will-change: transform;
          transition: box-shadow .6s var(--ease); }
        .fc { --sh-open: 0 56px 80px -30px rgba(30,40,90,.6); }
        .fc.open { box-shadow: var(--sh-open); }
        .fc:focus-visible { outline: 2px solid var(--orange); outline-offset: 5px; }
        .fc.peach { --frame:#ffd2bd; --panel:#fff4ee; --txt:#111113; --sub:#6c707c; --acc:#ff5a1f; --acc2:#ffe3d4;
          /* light frame shows the same shadow far stronger than dark ones, so tone it down to look equal */
          --sh: 0 36px 44px -26px rgba(30,40,90,.22), 0 14px 22px -14px rgba(17,17,19,.1);
          --sh-open: 0 56px 80px -30px rgba(30,40,90,.32); }
        .fc.ink { --frame:#18261f; --panel:#0b1411; --acc:#14c994; --acc2:#d9fff1; }

        .fc-in { position: absolute; inset: 10px; border-radius: 32px; overflow: hidden; }
        .fc-art { position: absolute; inset: 0; overflow: hidden; }
        .fc.sky .fc-art { background: radial-gradient(110% 80% at 15% 0%, #7a5cff 0%, transparent 60%), radial-gradient(90% 70% at 95% 35%, #2a7dff 0%, transparent 65%), linear-gradient(160deg, #3a2bd0, #0a2a8c); }
        .fc.peach .fc-art { background: radial-gradient(100% 80% at 85% 0%, #ff6b35 0%, transparent 60%), radial-gradient(90% 80% at 0% 25%, #ffb08a 0%, transparent 65%), linear-gradient(160deg, #ff8f5e, #ffd9c7); }
        .fc.ink .fc-art { background: radial-gradient(100% 80% at 0% 0%, #1fa37a 0%, transparent 60%), linear-gradient(160deg, #2f4f40, #0b1411); }
        /* oversized so the parallax never reveals an edge */
        .fc-img { position: absolute; left: -8%; top: -8%; width: 116%; height: 116%; object-fit: cover; will-change: transform; }
        .fc-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .6s ease;
          background: radial-gradient(circle 240px at var(--mx) var(--my), rgba(255,255,255,.65), transparent 70%); mix-blend-mode: soft-light; }
        .fc.open .fc-glow { opacity: 1; }

        .fc-panel { will-change: height; position: absolute; left: 0; right: 0; bottom: 0; height: 68%; display: flex; flex-direction: column; z-index: 2; }

        .fc-body { position: relative; flex: 1; min-height: 0; background: var(--panel); border-radius: var(--cut) var(--cut) 0 0; padding: 4px 28px 24px; display: flex; flex-direction: column; justify-content: flex-end; color: var(--txt); }
        /* number on the folder surface (top of the body, no tab): sits in an overflow mask; on hover GSAP slides it down out of view */
        .fc-num { position: absolute; left: 28px; top: 14px; overflow: hidden; padding: 0 6px 0 0; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 56px; line-height: 1.05; letter-spacing: -.05em; color: var(--txt); }
        .fc-num-in { display: block; will-change: transform; }

        /* number that rises OUT of the folder: lives inside .fc-panel, painted behind the folder body
           (z-index:-1) but above the art. Resting spot = fully ABOVE the folder's top edge (nothing
           tucked behind it), anchored to that edge so it follows the dip */
        .fc-pop { position: absolute; left: 0; right: 0; bottom: calc(100% + 2px); height: 120px; z-index: -1; display: flex; justify-content: center; align-items: flex-end; pointer-events: none; will-change: transform; }
        .fc-pop-num {
          display: block; will-change: transform;
          font-family: 'Be Vietnam Pro', sans-serif; font-weight: 900; font-size: 120px; line-height: .8; letter-spacing: -.07em;
          padding: .08em .1em .04em 0;
          background: linear-gradient(165deg, #ffffff 0%, var(--acc2) 34%, var(--acc) 100%);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent; color: var(--acc2);
          -webkit-text-stroke: 1.5px rgba(255,255,255,.7);
          filter: drop-shadow(0 22px 22px rgba(6,12,40,.45)) drop-shadow(0 2px 0 rgba(255,255,255,.35));
        }

        .fc-text h3 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: -.02em; line-height: 1.2; margin: 0 0 8px; }
        .fc-text p { color: var(--sub); font-size: 15px; line-height: 1.55; font-weight: 500; margin: 0; }

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
        .lp-panel { position: relative; overflow: hidden; border-radius: 44px; padding: 56px; color: #fff; background: linear-gradient(135deg, #2b2b30 0%, #17171a 50%, #08080a 100%); min-height: 460px; display: flex; align-items: center; }
        .lp-panel-in { position: relative; z-index: 2; width: 100%; display: grid; grid-template-columns: 1fr 1.05fr; gap: 48px; align-items: center; animation: lp-swap .7s var(--ease) both; }
        @keyframes lp-swap { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .lp-panel h3 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(32px, 4vw, 52px); letter-spacing: -.045em; line-height: 1.02; margin: 0 0 16px; }
        .lp-panel p { color: rgba(255,255,255,.82); font-size: 17px; line-height: 1.65; max-width: 430px; font-weight: 500; }
        .lp-tags { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 8px; }
        .lp-tag { padding: 7px 16px; border-radius: 999px; background: rgba(255,255,255,.16); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); font-weight: 700; font-size: 12px; border: 1px solid rgba(255,255,255,.18); }
        .lp-link { margin-top: 26px; display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #000; font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 14px; padding: 12px 20px; border-radius: 999px; border: none; cursor: pointer; transition: transform .3s var(--ease); }
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
        .lp-final-card { position: relative; overflow: hidden; max-width: 1180px; margin: 0 auto; border-radius: 48px; padding: 100px 40px; text-align: center; background: linear-gradient(135deg, #2b2b30 0%, #17171a 50%, #08080a 100%); color: #fff; }
        .lp-final-in { position: relative; z-index: 2; }
        .lp-final-eyebrow { font-weight: 800; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.75); margin-bottom: 22px; }
        .lp-final h2 { font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: clamp(46px, 7.4vw, 100px); line-height: .98; letter-spacing: -.05em; margin: 0 auto 22px; max-width: 800px; }
        .lp-final-p { color: rgba(255,255,255,.8); font-size: 18px; margin-bottom: 42px; line-height: 1.6; }
        .lp-final-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* ── Responsive ─────────────────────────────────────── */
        @media (max-width: 960px) {
          .lp-wrap { padding: 0 20px; }
          .bd-pill, .bd-gem, .bd-dot { display: none; }
          .bd-arch { width: 76px; left: 4%; top: 3%; }
          .bd-orb { width: 84px; left: -26px; top: 44%; }
          .bd-wedge { width: 84px; right: -16px; top: 40%; }
          .lp-stats { gap: 14px; }
          .fc { border-radius: 34px; padding: 8px; }
          .fc-in { inset: 8px; border-radius: 26px; }
          .lp-stats { grid-template-columns: 1fr; gap: 20px; max-width: 440px; margin-left: auto; margin-right: auto; }
          .fc-body { padding: 4px 20px 24px; }
          .fc-num { left: 20px; font-size: 46px; }
          .fc-pop-num { font-size: 140px; }
          .fc-text h3 { font-size: 19px; }
          .fc-text p { font-size: 14px; }
          .lp-scard { grid-template-columns: 1fr; padding: 32px 26px; gap: 28px; position: relative; top: 0; min-height: 0; }
          .sv-card { margin: 0; max-width: none; }
          .lp-panel { padding: 32px 22px; border-radius: 32px; }
          .lp-panel-in { grid-template-columns: 1fr; gap: 32px; }
          .lp-faq-grid { grid-template-columns: 1fr; gap: 36px; }
          .lp-faq-side { position: static; }
          .lp-final-card { padding: 72px 22px; border-radius: 36px; }
          .lp-statement { padding: 90px 0 60px; }
        }
        @media (max-width: 720px) {
          .lp-stats { grid-template-columns: 1fr; gap: 20px; }
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
          .lp-reveal, .lp-sub, .lp-cta, .lp-trust { opacity: 1 !important; transform: none !important; }
          .lp-st .w { transform: none !important; }
        }
      `}</style>

      <Nav actions={navActions} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <ArcField
          background="#eeede9"
          baseColor="#FF0000"
          accentColor="#FFA17A"
          highlight="#FF5527"
          density={112}
          dotSize={0.35}
          peak={1}
          thickness={1.61}
          falloff={6}
          pointerRadius={236}
          pointerStrength={0.34}
        />
        <HeroBuddies />
        <div className="lp-wrap lp-hero-in">
          <div className="lp-trust">
            <div className="hm-stack">
              {['R', 'A', 'S', 'P'].map((l, i) => <Av key={l} i={i} size={28} style={{ marginLeft: i ? -8 : 0, border: '2px solid #fff' }}>{l}</Av>)}
            </div>
            <span>Made for hostels, trips and shared flats</span>
          </div>
          <SplitText as="h1" className="lp-h1" onLoad accent="solid" text={'Split the bill.\n*Skip the chasing.*'} />
          <p className="lp-sub">
            Add what you spent and who was in. Split.ly works out the fewest payments that square everyone up, and tracks them until they're done.
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
                  <Roll>See how it works</Roll>
                </button>
              </>
            )}
          </div>
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

      {/* ── STATEMENT + FEATURES ──────────────────────────────────────── */}
      <section className="lp-statement">
        <div className="lp-wrap">
          <ScrollFill text={'Stop the awkward *who owes what* talks. Split.ly turns group finances into a *playful, stress-free* experience.'} />
          <div className="lp-stats">
            {HIGHLIGHTS.map(({ n, tone, img, title, desc }, i) => (
              <Reveal className="fc-wrap" delay={i * 120} key={title}>
                <FolderCard n={n} tone={tone} img={img} title={title} desc={desc} />
              </Reveal>
            ))}
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
            <p className="lp-final-p" style={{ marginTop: 22 }}>Create a group, add an expense, and settle up in a few taps.</p>
            <div className="lp-final-actions">
              {user ? (
                <button className="lp-btn white" onClick={() => navigate('/groups')}>
                  <Roll>Go to My Groups</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: '#000' }} /></span>
                </button>
              ) : (
                <>
                  <button className="lp-btn white" onClick={() => navigate('/signup')}>
                    <Roll>Create a Group</Roll><span className="arr"><ArrowRightIcon style={{ width: 13, height: 13, color: '#000' }} /></span>
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