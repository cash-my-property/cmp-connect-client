import React, { memo } from 'react';
import { getInitials } from '../../utils/formatters';

/**
 * Reusable Avatar component for agents and users in CMP Connect
 *
 * @param {Object} props
 * @param {string} [props.name] Full name (auto-calculates initials if initials not provided)
 * @param {string} [props.initials] Explicit initials (e.g. "LH")
 * @param {string} [props.src] Optional image URL
 * @param {number} [props.size=32] Diameter in pixels (default 32)
 * @param {'brand'|'accent'|'neutral'} [props.variant='brand']
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
function Avatar({
  name,
  initials,
  src,
  size = 32,
  variant = 'brand',
  className = '',
  style
}) {
  const displayInitials = initials || (name ? getInitials(name) : '--');
  const fontSize = Math.round(size * 0.36 * 10) / 10;

  const bgStyle =
    variant === 'accent'
      ? { background: 'var(--cmp-accent-subtle)', color: 'var(--cmp-accent)' }
      : variant === 'neutral'
      ? { background: 'var(--cmp-surface-sunken)', color: 'var(--cmp-text-muted)' }
      : { background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)' };

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        flexShrink: 0,
        ...style
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: `${fontSize}px`,
            letterSpacing: '0.02em',
            ...bgStyle
          }}
        >
          {displayInitials}
        </span>
      )}
    </span>
  );
}

export default memo(Avatar);
