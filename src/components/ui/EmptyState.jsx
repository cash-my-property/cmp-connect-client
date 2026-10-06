import React, { memo } from 'react';

/**
 * Reusable Empty State component for lists and cards
 *
 * @param {Object} props
 * @param {string} [props.title]
 * @param {string} [props.message='No items found.']
 * @param {React.ReactNode} [props.icon]
 * @param {React.ReactNode} [props.action]
 * @param {React.CSSProperties} [props.style]
 */
function EmptyState({
  title,
  message = 'No items found.',
  icon,
  action,
  style
}) {
  return (
    <div
      className="card"
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        ...style
      }}
    >
      {icon && (
        <div
          style={{
            color: 'var(--cmp-text-faint)',
            marginBottom: '4px'
          }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
          {title}
        </h3>
      )}
      <p className="muted" style={{ margin: 0, fontSize: '14px', maxWidth: '420px' }}>
        {message}
      </p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}

export default memo(EmptyState);
