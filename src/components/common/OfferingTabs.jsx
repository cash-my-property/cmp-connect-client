import React from 'react';

// One ALL / SALE / RENT filter for every Growth page. Values match the API's `offering` param.
export const OFFERING_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'Sale' },
  { value: 'rent', label: 'Rent' }
];

/** Does an item (SALE / RENT / Sale / Rent, any key) match the selected offering? */
export const matchesOffering = (offering, purpose) =>
  offering === 'all' || String(purpose || '').toLowerCase().split(/[^a-z]+/).includes(offering);

export default function OfferingTabs({ value = 'all', onChange, ariaLabel = 'Filter by offering' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        gap: '4px',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid var(--cmp-border)',
        background: 'var(--cmp-surface)'
      }}
    >
      {OFFERING_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            style={{
              border: 'none',
              background: active ? 'var(--cmp-brand-subtle)' : 'transparent',
              color: active ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
              fontWeight: active ? 700 : 500,
              fontSize: '12.5px',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
