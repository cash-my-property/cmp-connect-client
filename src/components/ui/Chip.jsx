import React, { memo } from 'react';

/**
 * Reusable Chip filter button matching CMP Connect design system
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.label
 * @param {boolean} [props.active=false]
 * @param {number|string} [props.count]
 * @param {React.ReactNode} [props.icon]
 * @param {Function} [props.onClick]
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
function Chip({
  label,
  active = false,
  count,
  icon,
  onClick,
  className = '',
  style,
  ...rest
}) {
  return (
    <button
      type="button"
      className={`chip ${className}`}
      aria-pressed={active}
      onClick={onClick}
      style={style}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && count !== null && (
        <span
          style={{
            opacity: active ? 1 : 0.75,
            fontSize: '11.5px',
            fontWeight: 700,
            marginLeft: '2px'
          }}
        >
          ({count})
        </span>
      )}
    </button>
  );
}

export default memo(Chip);
