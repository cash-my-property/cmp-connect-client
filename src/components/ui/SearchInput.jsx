import React, { memo } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Standardized Search Input component for CMP Connect pages
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {Function} props.onChange
 * @param {string} [props.placeholder='Search…']
 * @param {string} [props.id]
 * @param {string} [props.maxWidth='320px']
 * @param {Function} [props.onClear]
 * @param {React.CSSProperties} [props.style]
 */
function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  id = 'search-input',
  maxWidth = '320px',
  onClear,
  style,
  ...rest
}) {
  return (
    <div
      style={{
        position: 'relative',
        flex: `1 1 ${maxWidth}`,
        maxWidth,
        ...style
      }}
    >
      <label htmlFor={id} className="visually-hidden">
        {placeholder}
      </label>
      <Search
        size={16}
        style={{
          position: 'absolute',
          insetInlineStart: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--cmp-text-faint)',
          pointerEvents: 'none',
          flexShrink: 0
        }}
      />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          paddingInlineStart: '36px',
          paddingInlineEnd: value ? '32px' : '12px',
          height: '40px'
        }}
        {...rest}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            insetInlineEnd: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            color: 'var(--cmp-text-faint)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export default memo(SearchInput);
