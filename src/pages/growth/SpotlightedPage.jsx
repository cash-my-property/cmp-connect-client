import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Copy, Check, ArrowRight, Building, Award, ExternalLink } from 'lucide-react';

export default function SpotlightedPage() {
  const [copiedId, setCopiedId] = useState(null);

  const eligibleListings = [
    {
      id: 'CMP-S-001001',
      title: 'Full marina view 2 bed in Marina Gate',
      community: 'Dubai Marina',
      agent: 'Karim Saleh',
      price: 'AED 2.85M',
      quality: 94
    },
    {
      id: 'CMP-S-001002',
      title: 'Burj Khalifa facing one bed in The Address',
      community: 'Downtown Dubai',
      agent: 'Layla Haddad',
      price: 'AED 2.35M',
      quality: 88
    },
    {
      id: 'CMP-S-001004',
      title: 'Duplex penthouse on the Palm',
      community: 'Palm Jumeirah',
      agent: 'Layla Haddad',
      price: 'AED 14.5M',
      quality: 97
    }
  ];

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* Header */}
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
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Spotlighted properties
            <span
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                minWidth: '26px',
                height: '22px',
                padding: '0 8px',
                borderRadius: '999px',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              0
            </span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Listings shown at the top of a community’s search results. Bid for a community on Community Spotlight.
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/growth/spotlight" className="btn btn-accent btn-sm">
            Bid for a community
          </NavLink>
        </div>
      </div>

      {/* Empty State Banner with Concept SVG */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 16px', gap: '14px' }}>
          <svg width="170" height="170" viewBox="0 0 170 170" aria-hidden="true">
            <circle cx="85" cy="85" r="82" fill="var(--cmp-surface-sunken)" />
            <g fill="var(--cmp-surface)" stroke="var(--cmp-text-faint)" strokeWidth="2.5">
              <rect x="52" y="44" width="36" height="82" rx="4" />
              <rect x="88" y="62" width="30" height="64" rx="4" />
              <rect x="34" y="84" width="18" height="42" rx="3" />
              <path d="M60 56h6m8 0h6M96 64h6m6 0h4" />
              <path d="M60 68h6m8 0h6M96 76h6m6 0h4" />
              <path d="M60 80h6m8 0h6M96 88h6m6 0h4" />
              <path d="M60 92h6m8 0h6M96 100h6m6 0h4" />
              <path d="M60 104h6m8 0h6M96 112h6m6 0h4" />
            </g>
          </svg>
          <h2 style={{ fontSize: '20px', margin: 0 }}>No spotlight listings yet</h2>
          <p className="muted" style={{ margin: 0, maxWidth: '520px', fontSize: '14px' }}>
            When you bid for a community on Community Spotlight, the listing you choose appears here alongside its live rank and performance.
          </p>
          <NavLink to="/growth/spotlight" className="btn btn-primary btn-sm">
            <span>Open Community Spotlight</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>
      </div>

      {/* Eligible Listings Table */}
      <div>
        <h2 style={{ fontSize: '18px', margin: '0 0 4px' }}>
          Eligible for spotlight ({eligibleListings.length})
        </h2>
        <p className="muted" style={{ margin: '0 0 14px', fontSize: '14px' }}>
          Live, verified listings with a quality score of 80 or more.
        </p>

        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Property</th>
                <th>Agent</th>
                <th>Price</th>
                <th>Quality score</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {eligibleListings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <span className="row" style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(listing.id, e)}
                        title="Copy reference"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--cmp-text-faint)'
                        }}
                      >
                        {copiedId === listing.id ? (
                          <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <NavLink
                        to={`/properties/${listing.id}/edit`}
                        style={{
                          color: 'var(--cmp-brand)',
                          fontWeight: 600,
                          fontSize: '13px',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px'
                        }}
                      >
                        {listing.id}
                      </NavLink>
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--cmp-text)' }}>{listing.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {listing.community}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13.5px' }}>{listing.agent}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13.5px' }}>{listing.price}</strong>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        role="img"
                        aria-label={`${listing.quality}%`}
                        style={{
                          position: 'relative',
                          display: 'inline-grid',
                          placeItems: 'center',
                          width: '40px',
                          height: '40px'
                        }}
                      >
                        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="20"
                            cy="20"
                            r="17.5"
                            fill="none"
                            stroke="var(--cmp-border)"
                            strokeWidth="5"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="17.5"
                            fill="none"
                            stroke="var(--cmp-success)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${(listing.quality / 100) * 110} 110`}
                          />
                        </svg>
                        <span style={{ position: 'absolute', fontSize: '10px', fontWeight: 800 }}>
                          {listing.quality}%
                        </span>
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <NavLink
                      to="/growth/spotlight"
                      className="btn btn-outline btn-sm"
                      style={{ height: '32px', padding: '0 10px' }}
                    >
                      <span>Bid spotlight</span>
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
