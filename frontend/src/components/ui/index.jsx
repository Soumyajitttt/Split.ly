// ──────────────────────────────────────────────
//  UI Primitives — Solaris Split Design System
// ──────────────────────────────────────────────

export function Btn({ variant = 'primary', size = '', className = '', children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    red: 'btn-red',
    ghost: 'btn-ghost',
    outline: 'btn-outline',
    tonal: 'btn-tonal',
  };
  const sizes = { sm: 'btn-sm', '': '' };
  return (
    <button
      className={`btn ${variants[variant] || ''} ${sizes[size] || ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return <input className={`input-field ${className}`} {...props} />;
}

export function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 440 }) {
  if (!open) return null;
  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal modal-anim" style={{ maxWidth }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function RedDot() {
  return <span className="red-dot" />;
}

export function Tag({ variant = 'mono', children }) {
  return <span className={`tag tag-${variant}`}>{children}</span>;
}

export function Divider() {
  return <hr className="divider" />;
}

export function EmptyState({ icon = '∅', text }) {
  return (
    <div className="empty-state">
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 24,
          background: 'var(--surface-container-high)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          color: 'var(--on-surface-variant)',
          marginBottom: 8,
        }}
      >
        {icon}
      </div>
      <div className="empty-text">{text}</div>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" />;
}