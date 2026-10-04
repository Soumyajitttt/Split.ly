import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Pill tab bar with a GSAP-animated sliding indicator.
 *   tabs: [[id, label], ...]
 */
export function TabBar({ tabs, value, onChange }) {
  const barRef = useRef(null);
  const indRef = useRef(null);
  const first = useRef(true);
  const labelKey = tabs.map(t => t[1]).join('|');

  useLayoutEffect(() => {
    const el = barRef.current?.querySelector('.tab.active');
    const ind = indRef.current;
    if (!el || !ind) return undefined;
    const to = { x: el.offsetLeft, width: el.offsetWidth };
    if (first.current) {
      gsap.set(ind, { ...to, opacity: 1 });
      first.current = false;
      return undefined;
    }
    const t = gsap.to(ind, { ...to, duration: 0.5, ease: 'power3.out', overwrite: true });
    return () => t.kill();
  }, [value, labelKey]);

  return (
    <div className="tab-bar" ref={barRef}>
      <span className="tab-indicator" ref={indRef} />
      {tabs.map(([id, label]) => (
        <button key={id} className={`tab ${value === id ? 'active' : ''}`} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Wraps tab content; softly slides/fades it in when `id` changes (not on first render). */
export function TabContent({ id, animate, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!animate || !ref.current) return undefined;
    const t = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out', clearProps: 'opacity,transform' }
    );
    return () => t.kill();
  }, [id, animate]);
  return <div ref={ref}>{children}</div>;
}