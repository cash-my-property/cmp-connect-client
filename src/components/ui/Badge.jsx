import React, { memo } from 'react';

/**
 * Reusable Badge component matching CMP Connect design system
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'brand'|'accent'|'neutral'|'success'|'warning'|'danger'|'offer'} [props.variant='neutral']
 * @param {string} [props.className]
 * @param {React.CSSProperties} [props.style]
 */
function Badge({
  children,
  variant = 'neutral',
  className = '',
  style,
  ...rest
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'brand':
        return 'badge-brand';
      case 'accent':
        return 'badge-accent';
      case 'neutral':
      default:
        return 'badge-neutral';
    }
  };

  const getCustomStyle = () => {
    if (variant === 'success') {
      return { background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)', border: '1px solid var(--cmp-brand-border)' };
    }
    if (variant === 'warning') {
      return { background: 'var(--cmp-accent-subtle)', color: 'var(--cmp-warning)', border: '1px solid var(--cmp-accent-border)' };
    }
    if (variant === 'danger') {
      return { background: 'rgba(179, 38, 30, 0.1)', color: 'var(--cmp-danger)', border: '1px solid rgba(179, 38, 30, 0.3)' };
    }
    return {};
  };

  return (
    <span
      className={`badge ${getVariantClass()} ${className}`}
      style={{ ...getCustomStyle(), ...style }}
      {...rest}
    >
      {children}
    </span>
  );
}

export default memo(Badge);
