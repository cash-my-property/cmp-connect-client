import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Bell, X, AlertTriangle, Clock, ArrowRight } from 'lucide-react';

export default function NotificationsDrawer() {
  const { isNotificationsOpen, setIsNotificationsOpen, needsYou, dismissNeedsYou } = useApp();
  const navigate = useNavigate();

  if (!isNotificationsOpen) return null;

  const handleAction = (item) => {
    setIsNotificationsOpen(false);
    navigate(item.actionUrl);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--cmp-overlay)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(3px)'
      }}
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        style={{
          width: 'min(440px, 100vw)',
          height: '100%',
          background: 'var(--cmp-surface-raised)',
          boxShadow: 'var(--cmp-shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--cmp-border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <div className="row" style={{ gap: '10px' }}>
            <Bell size={20} style={{ color: 'var(--cmp-brand)' }} />
            <h2 style={{ fontSize: '17px' }}>Urgent Action Feed</h2>
            <span className="count-badge">{needsYou.length}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={() => setIsNotificationsOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {needsYou.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }} className="muted">
              You're all caught up! No urgent tasks waiting.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {needsYou.map((item) => (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderLeft: `4px solid ${
                      item.severity === 'Now'
                        ? 'var(--cmp-danger)'
                        : item.severity === 'Soon'
                        ? 'var(--cmp-warning)'
                        : 'var(--cmp-brand)'
                    }`
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color:
                          item.severity === 'Now'
                            ? 'var(--cmp-danger)'
                            : item.severity === 'Soon'
                            ? 'var(--cmp-warning)'
                            : 'var(--cmp-brand)'
                      }}
                    >
                      {item.severity}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 6px', height: '24px' }}
                      onClick={() => dismissNeedsYou(item.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div>
                    <strong style={{ fontSize: '13.5px', display: 'block' }}>
                      {item.title}
                    </strong>
                    <span className="muted" style={{ fontSize: '12.5px' }}>
                      {item.subtitle}
                    </span>
                  </div>
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAction(item)}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
