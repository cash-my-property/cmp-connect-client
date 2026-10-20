import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = 420
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(4, 21, 14, 0.45)',
          zIndex: 70,
          backdropFilter: 'blur(2px)'
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100vw)`,
          zIndex: 71,
          background: 'var(--cmp-surface-raised, #FFFFFF)',
          boxShadow: 'var(--cmp-shadow-lg)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          borderLeft: '1px solid var(--cmp-border)'
        }}
      >
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '18px 20px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <div>
            <h2 style={{ fontSize: 17, margin: 0 }}>{title}</h2>
            {subtitle && (
              <p className="faint" style={{ margin: '4px 0 0', fontSize: 13 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 20 }}>{children}</div>
        {footer && (
          <div
            className="row"
            style={{
              justifyContent: 'flex-end',
              gap: 10,
              padding: '14px 20px',
              borderTop: '1px solid var(--cmp-border)'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

export default Drawer;
