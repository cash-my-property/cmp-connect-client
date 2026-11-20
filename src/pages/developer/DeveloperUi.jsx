import React from 'react';
import { Plug, Loader2, X } from 'lucide-react';
import { Badge } from '../../components/ui';
import { PROJECT_STATUS, useProjectOptions } from '../../context/DeveloperContext';

export function ProjectStatusBadge({ status }) {
  const { statusLabels } = useProjectOptions();
  const variant = PROJECT_STATUS[status]?.variant || 'neutral';
  // Label server ke options se (live), warna local
  return <Badge variant={variant}>{statusLabels[status] || PROJECT_STATUS[status]?.label || status || '—'}</Badge>;
}

export function BuildRing({ pct = 0, size = 38 }) {
  const r = size / 2 - 2.5;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <span role="img" aria-label={`${v}% built`} style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cmp-border)" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cmp-brand)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: size * 0.24, fontWeight: 700 }}>{v}%</span>
    </span>
  );
}

export function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="card kpi-tile" style={{ cursor: 'default' }}>
      {Icon && (
        <span className="kpi-icon">
          <Icon size={18} />
        </span>
      )}
      <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cmp-text)' }}>{value}</span>
        {hint && <span className="faint" style={{ fontSize: 12 }}>{hint}</span>}
      </span>
    </div>
  );
}

export function PageHead({ title, count, blurb, actions }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 24, letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          {title}
          {count != null && <span className="count-badge">{count}</span>}
        </h1>
        {blurb && <p className="muted" style={{ margin: '4px 0 0', fontSize: 14, maxWidth: 820 }}>{blurb}</p>}
      </div>
      {actions && <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function InfoNote({ children, tone = 'brand' }) {
  const bg = tone === 'warning' ? 'var(--cmp-accent-subtle)' : 'var(--cmp-brand-subtle)';
  const border = tone === 'warning' ? 'var(--cmp-accent-border)' : 'var(--cmp-brand-border)';
  return (
    <div style={{ padding: '12px 16px', borderRadius: 'var(--cmp-radius-lg)', background: bg, border: `1px solid ${border}`, fontSize: 13.5, marginBottom: 18 }}>
      {children}
    </div>
  );
}

// Live data loading / error wrapper
export function LoadState({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <section className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
        <Loader2 size={22} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px', display: 'block' }} />
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Loading…</p>
      </section>
    );
  }
  if (error) {
    return (
      <section className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>Couldn’t load this</h2>
        <p className="muted" style={{ margin: '0 auto 14px', fontSize: 13.5, maxWidth: 520 }}>{error}</p>
        {onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>Try again</button>}
      </section>
    );
  }
  return children;
}

// Action ka result / error (dismissable)
export function Notice({ tone = 'danger', children, onClose }) {
  if (!children) return null;
  const color = tone === 'success' ? 'var(--cmp-success)' : tone === 'warning' ? 'var(--cmp-warning)' : 'var(--cmp-danger)';
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className="row" style={{ gap: 10, padding: '10px 14px', borderRadius: 'var(--cmp-radius-md)', border: `1px solid ${color}`, background: 'var(--cmp-surface)', color, fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <button type="button" className="icon-button" aria-label="Dismiss" onClick={onClose} style={{ width: 28, height: 28 }}><X size={14} /></button>}
    </div>
  );
}

// Live mode: developer APIs abhi backend pe nahi hain
export function NotConnected({ what = 'This page' }) {
  return (
    <section className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
      <span className="kpi-icon" style={{ margin: '0 auto 12px' }}>
        <Plug size={18} />
      </span>
      <h2 style={{ fontSize: 17, margin: '0 0 6px' }}>Not connected yet</h2>
      <p className="muted" style={{ margin: '0 auto', fontSize: 14, maxWidth: 520 }}>
        {what} will show your real data as soon as the developer workspace is connected to the server. Switch to Mock Data to see how it works.
      </p>
    </section>
  );
}

export const fieldStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid var(--cmp-border)',
  background: 'var(--cmp-surface)',
  color: 'var(--cmp-text)',
  font: 'inherit',
  fontSize: 14
};

export function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: 'grid', gap: 5, fontSize: 13, fontWeight: 600, ...style }}>
      <span>{label}</span>
      {children}
      {hint && <span className="faint" style={{ fontWeight: 400, fontSize: 12 }}>{hint}</span>}
    </label>
  );
}
