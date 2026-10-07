import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, Plus } from 'lucide-react';

export default function RefundsPage() {
  return (
    <div>
      {/* Top Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em'
            }}
          >
            Refunds
          </h1>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline btn-sm">
            <Coins size={16} />
            <span>Calculate credits</span>
          </button>
          <Link to="/wallet" className="btn btn-accent btn-sm">
            <Plus size={16} />
            <span>Add credits</span>
          </Link>
        </div>
      </div>

      {/* Empty State exactly matching returns.html */}
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          padding: '48px 16px',
          gap: '12px'
        }}
      >
        <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
          <circle cx="85" cy="85" r="82" fill="var(--cmp-surface-sunken)" />
          <g fill="none" stroke="var(--cmp-text-faint)" strokeWidth="3" strokeLinejoin="round">
            <path d="M40 120V78l35-28 35 28v42z" />
            <path d="M65 120V96h20v24" />
            <path d="M118 70l8-14 10 4-8 14z" fill="var(--cmp-accent-subtle)" />
          </g>
        </svg>

        <h2 style={{ fontSize: '20px' }}>Eligible listings will appear here</h2>
        <p className="muted" style={{ margin: 0, maxWidth: '520px', fontSize: '14px' }}>
          There are no listings eligible for a credit return at the moment. Listings refused by moderation, or unpublished within 7 days of going live, appear here.
        </p>
      </div>
    </div>
  );
}
