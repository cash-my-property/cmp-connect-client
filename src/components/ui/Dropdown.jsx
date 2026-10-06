import React, { useState, useRef, memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

/**
 * Reusable Dropdown component for filters and menus in CMP Connect
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.label Current selected label
 * @param {Array<{label: string, value: any}>} [props.options]
 * @param {Function} [props.onSelect]
 * @param {any} [props.selectedValue]
 * @param {string} [props.width='100%']
 * @param {string} [props.className]
 * @param {React.ReactNode} [props.children] Custom dropdown contents
 */
function Dropdown({
  label,
  options = [],
  onSelect,
  selectedValue,
  width = '100%',
  className = '',
  children,
  style
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width,
        ...style
      }}
      className={className}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="btn btn-outline"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          height: '40px',
          justifyContent: 'space-between',
          padding: '0 12px',
          fontWeight: 500,
          color: 'var(--cmp-text-muted)',
          background: 'var(--cmp-surface)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--cmp-duration-fast) var(--cmp-ease)'
          }}
        />
      </button>

      {isOpen && (
        <div
          className="card"
          role="menu"
          style={{
            position: 'absolute',
            top: '44px',
            left: 0,
            right: 0,
            zIndex: 40,
            padding: '6px',
            boxShadow: 'var(--cmp-shadow-md)',
            background: 'var(--cmp-surface)'
          }}
        >
          {children
            ? children
            : options.map((opt) => {
                const isSelected = selectedValue === opt.value || selectedValue === opt.label;
                return (
                  <button
                    key={String(opt.value ?? opt.label)}
                    type="button"
                    role="menuitem"
                    className="menu-item"
                    style={{
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--cmp-brand)' : 'var(--cmp-text)'
                    }}
                    onClick={() => {
                      if (onSelect) onSelect(opt.value ?? opt.label);
                      setIsOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
        </div>
      )}
    </div>
  );
}

export default memo(Dropdown);
