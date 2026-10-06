import React, { memo } from 'react';

/**
 * Reusable Count Badge pill matching CMP Connect design system
 * @param {Object} props
 * @param {number|string} props.count
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
function CountBadge({ count, className = '', style }) {
  if (count === undefined || count === null) return null;

  return (
    <span
      className={`count-badge ${className}`}
      style={style}
    >
      {count}
    </span>
  );
}

export default memo(CountBadge);
