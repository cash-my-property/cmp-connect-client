import React, { useState, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  CountBadge,
  Chip,
  SearchInput,
  QualityScoreCircle
} from '../../components/ui';
import { useDebounce } from '../../hooks';
import {
  Grid,
  List,
  Plus,
  Radio,
  Sliders,
  SlidersHorizontal,
  Bell,
  ArrowUpDown,
  ChevronDown,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Home,
  Tag,
  Maximize2,
  Bed,
  Edit2,
  MoreVertical
} from 'lucide-react';

export default function PortfolioPage() {
  const { listings } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [showDrafts, setShowDrafts] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filterTabs = useMemo(() => [
    { label: 'All', count: listings.length },
    { label: 'Live', count: listings.filter((l) => l.status === 'Live').length },
    { label: 'Unpublished', count: 0 },
    { label: 'In review', count: listings.filter((l) => l.status === 'In review').length },
    { label: 'Drafts', count: listings.filter((l) => l.status === 'Draft').length },
    { label: 'Rejected', count: listings.filter((l) => l.status === 'Rejected').length },
    { label: 'Expired', count: listings.filter((l) => l.status === 'Expired').length }
  ], [listings]);

  const filteredListings = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    return listings.filter((item) => {
      if (!showDrafts && (item.status === 'Draft' || item.status === 'Unpublished')) {
        return false;
      }

      const matchesFilter =
        activeFilter === 'All'
          ? true
          : activeFilter === 'Drafts'
          ? item.status === 'Draft'
          : activeFilter === 'Unpublished'
          ? item.status === 'Unpublished'
          : item.status.toLowerCase() === activeFilter.toLowerCase();

      if (!matchesFilter) return false;

      if (q) {
        return (
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.community.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [listings, activeFilter, showDrafts, debouncedSearch]);

  const handleCopyRef = useCallback((id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

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
            Portfolio <CountBadge count={listings.length} />
          </h1>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/rto" className="btn btn-outline btn-sm">
            <Radio size={16} />
            <span>Offers</span>
          </NavLink>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ gap: '6px', whiteSpace: 'nowrap' }}
          >
            <Download size={16} />
            <span>Export listings</span>
            <ChevronDown size={14} />
          </button>
          <button type="button" className="btn btn-sm btn-outline">
            Select listings
          </button>
          <NavLink to="/properties/new" className="btn btn-accent btn-sm">
            <Plus size={16} />
            <span>List new property</span>
          </NavLink>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        className="row"
        style={{
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px'
        }}
      >
        {/* Search */}
        <SearchInput
          id="management-search"
          placeholder="City, community, building, title or reference"
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          maxWidth="330px"
        />

        <button type="button" className="btn btn-sm btn-outline" style={{ height: '40px' }}>
          <SlidersHorizontal size={16} />
          <span>All filters</span>
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ height: '40px', borderColor: 'var(--cmp-accent)' }}
        >
          <Bell size={16} />
          <span>9 fixes to make</span>
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ gap: '6px', whiteSpace: 'nowrap', height: '40px' }}
        >
          <ArrowUpDown size={16} />
          <span>Listing created: Newest</span>
          <ChevronDown size={14} />
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ height: '40px' }}
          onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {viewMode === 'grid' ? <List size={16} /> : <Grid size={16} />}
          <span>{viewMode === 'grid' ? 'List' : 'Grid'}</span>
        </button>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          aria-label="Choose columns"
          title="Columns apply to the list view"
          style={{ height: '40px', width: '40px', padding: 0 }}
        >
          <Sliders size={16} />
        </button>

        <span className="row" style={{ gap: '8px', marginInlineStart: 'auto', fontSize: '13px' }}>
          <span className="muted">Drafts / Unpublished</span>
          <button
            type="button"
            role="switch"
            aria-checked={showDrafts}
            aria-label="Show drafts and unpublished listings in All"
            onClick={() => setShowDrafts(!showDrafts)}
            style={{
              position: 'relative',
              width: '38px',
              height: '22px',
              flexShrink: 0,
              borderRadius: '999px',
              cursor: 'pointer',
              padding: 0,
              border: `1px solid ${showDrafts ? 'var(--cmp-brand)' : 'var(--cmp-border)'}`,
              background: showDrafts ? 'var(--cmp-brand)' : 'var(--cmp-surface-sunken)'
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '2px',
                left: showDrafts ? '18px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: showDrafts ? 'var(--cmp-text-on-brand)' : 'var(--cmp-text-muted)',
                transition: 'left 0.15s'
              }}
            />
          </button>
        </span>
      </div>

      {/* Status Chips matching concept listings.html */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {filterTabs.map((tab) => (
          <Chip
            key={tab.label}
            label={tab.label}
            count={tab.count}
            active={activeFilter === tab.label}
            onClick={() => setActiveFilter(tab.label)}
          />
        ))}
      </div>

      {/* Content Display: Grid vs Table */}
      {viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredListings.map((listing) => (
            <article
              key={listing.id}
              className="card"
              style={{
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '14px'
              }}
            >
              {/* Image Header with Brand Watermark, Badges & Action Buttons */}
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  overflow: 'hidden',
                  background: 'var(--cmp-surface-sunken)'
                }}
              >
                <img
                  src={listing.image}
                  alt={listing.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* Centered Brand Watermark Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    opacity: 0.5,
                    color: '#FFFFFF',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontSize: '11.5px',
                    textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  CMP Prime Real Estate
                </div>

                {/* Top-Left Badges matching concept */}
                <div
                  className="row"
                  style={{ position: 'absolute', top: '10px', left: '10px', gap: '6px', flexWrap: 'wrap' }}
                >
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      color: '#18231C',
                      textTransform: 'uppercase',
                      fontWeight: 800
                    }}
                  >
                    STANDARD
                  </span>

                  <span
                    className="badge"
                    style={{
                      background:
                        listing.permitStatus === 'Valid'
                          ? 'rgba(15, 122, 75, 0.9)'
                          : listing.permitStatus.includes('Expires')
                          ? 'var(--cmp-warning)'
                          : 'rgba(0, 0, 0, 0.55)',
                      color: '#FFFFFF',
                      fontWeight: 700
                    }}
                  >
                    {listing.permitStatus === 'Valid' ? 'VERIFIED' : 'UNVERIFIED'}
                  </span>

                  <span
                    className="badge"
                    style={{
                      background:
                        listing.status === 'Live'
                          ? 'var(--cmp-brand)'
                          : listing.status === 'Draft'
                          ? 'rgba(0, 0, 0, 0.65)'
                          : listing.status === 'Rejected'
                          ? 'var(--cmp-danger)'
                          : 'var(--cmp-warning)',
                      color: '#FFFFFF',
                      fontWeight: 700
                    }}
                  >
                    {listing.status.toUpperCase()}
                  </span>
                </div>

                {/* Top-Right Circle Edit & Action Buttons */}
                <div
                  className="row"
                  style={{ position: 'absolute', top: '10px', right: '10px', gap: '6px' }}
                >
                  <NavLink
                    to="/properties/new"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255, 255, 255, 0.92)',
                      color: '#18231C',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Edit Property"
                  >
                    <Edit2 size={14} />
                  </NavLink>

                  <button
                    type="button"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      border: 'none',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(255, 255, 255, 0.92)',
                      color: '#18231C',
                      cursor: 'pointer',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}
                    title="Actions"
                  >
                    <MoreVertical size={15} />
                  </button>
                </div>

                {/* Attention Required Banner */}
                {listing.attentionCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      padding: '7px 10px',
                      background: 'rgba(4, 21, 14, 0.75)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <AlertTriangle size={15} style={{ color: 'var(--cmp-accent)' }} />
                    <span>Attention required ({listing.attentionCount})</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '14px', display: 'grid', gap: '8px', flex: 1 }}>
                {/* Title with Status Dot */}
                <p
                  className="row"
                  style={{
                    margin: 0,
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '15px'
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: '9px',
                      height: '9px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background:
                        listing.status === 'Live'
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-text-faint)'
                    }}
                  />
                  <span
                    title={listing.title}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {listing.title}
                  </span>
                </p>

                {/* Location with Icon */}
                <p className="row muted" style={{ margin: 0, gap: '6px', fontSize: '13px' }}>
                  <Home size={14} style={{ flexShrink: 0 }} />
                  <span>{listing.community}</span>
                </p>

                {/* Specs with Icons */}
                <p className="row" style={{ margin: 0, gap: '12px', fontSize: '13px', flexWrap: 'wrap' }}>
                  {listing.beds > 0 && (
                    <span className="row" style={{ gap: '4px' }}>
                      <Bed size={15} style={{ flexShrink: 0 }} />
                      <span>{listing.beds}</span>
                    </span>
                  )}
                  <span className="row" style={{ gap: '4px' }}>
                    <Maximize2 size={15} style={{ flexShrink: 0 }} />
                    <span>{listing.areaSqft.toLocaleString()} sqft</span>
                  </span>
                  <span className="row" style={{ gap: '4px', fontWeight: 600 }}>
                    <Tag size={15} style={{ flexShrink: 0 }} />
                    <span>{listing.priceLabel}</span>
                  </span>
                </p>

                {/* Category Chips */}
                <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: 'var(--cmp-surface-sunken)' }}>
                    {listing.purpose}
                  </span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: 'var(--cmp-surface-sunken)' }}>
                    {listing.type}
                  </span>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '6px', background: 'var(--cmp-surface-sunken)' }}>
                    {listing.category}
                  </span>
                </div>

                {/* Reference Number Row with Copy Button */}
                <p className="row" style={{ margin: 0, gap: '6px', fontSize: '13px' }}>
                  <span className="muted">Reference number:</span>
                  <span className="row" style={{ gap: '6px', display: 'inline-flex' }}>
                    <button
                      type="button"
                      aria-label={`Copy ${listing.id}`}
                      title="Copy"
                      onClick={(e) => handleCopyRef(listing.id, e)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--cmp-text-faint)',
                        display: 'inline-flex'
                      }}
                    >
                      {copiedId === listing.id ? (
                        <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <a
                      href="#"
                      title={listing.id}
                      onClick={(e) => e.preventDefault()}
                      style={{
                        color: 'var(--cmp-brand)',
                        fontWeight: 600,
                        fontSize: '13px',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px'
                      }}
                    >
                      {listing.id}
                    </a>
                  </span>
                </p>

                {/* Leads & Circular Quality Score Bar (MATCHING SCREENSHOT) */}
                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'var(--cmp-surface-sunken)',
                    fontSize: '13px'
                  }}
                >
                  <span>
                    Leads <strong>{listing.leads}</strong>
                  </span>
                  <span className="row" style={{ gap: '6px' }}>
                    {/* Dynamic Circular SVG Progress Ring */}
                    <QualityScoreCircle score={listing.qualityScore} size={20} strokeWidth={3} />
                    <span>
                      Quality score <strong>{listing.qualityScore}</strong>
                    </span>
                  </span>
                </div>

                {/* Agent & Update Dates */}
                <div className="row" style={{ justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                  <span className="row" style={{ gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--cmp-brand-subtle)',
                        color: 'var(--cmp-brand)',
                        fontWeight: 700,
                        fontSize: '8px'
                      }}
                    >
                      {listing.agentInitials}
                    </span>
                    <span>{listing.agent}</span>
                  </span>

                  <span className="muted" style={{ textAlign: 'end', fontSize: '11.5px', lineHeight: 1.25 }}>
                    Last updated: 17 Sep 2026<br />
                    Published: {listing.status === 'Live' ? '12 Sep 2026' : '—'}
                  </span>
                </div>

                {/* Bottom Status Summary Footer */}
                <div
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--cmp-border)',
                    fontSize: '12px'
                  }}
                >
                  <span className="muted">
                    {listing.status === 'Draft'
                      ? 'Draft. Not visible to the public.'
                      : listing.status === 'In review'
                      ? 'In review.'
                      : listing.status === 'Rejected'
                      ? 'Rejected. Fix and resubmit.'
                      : listing.status === 'Live'
                      ? 'Live on public portal.'
                      : 'Expired.'}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Property</th>
                <th>Purpose</th>
                <th>Price</th>
                <th>Quality</th>
                <th>Leads</th>
                <th>Views</th>
                <th>Status</th>
                <th>Agent</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--cmp-brand)' }}>
                      {listing.id}
                    </span>
                  </td>
                  <td style={{ minWidth: '220px' }}>
                    <div style={{ fontWeight: 600 }}>{listing.title}</div>
                    <div className="faint" style={{ fontSize: '12px' }}>
                      {listing.community}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{listing.purpose}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{listing.priceLabel}</td>
                  <td>
                    <span className="row" style={{ gap: '6px' }}>
                      <QualityScoreCircle score={listing.qualityScore} size={18} strokeWidth={2.5} />
                      <strong
                        style={{
                          color:
                            listing.qualityScore >= 80
                              ? 'var(--cmp-success)'
                              : listing.qualityScore >= 50
                              ? 'var(--cmp-warning)'
                              : 'var(--cmp-danger)'
                        }}
                      >
                        {listing.qualityScore}
                      </strong>
                    </span>
                  </td>
                  <td><strong>{listing.leads}</strong></td>
                  <td className="muted">{listing.views.toLocaleString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        listing.status === 'Live'
                          ? 'badge-brand'
                          : listing.status === 'Rejected'
                          ? 'badge-danger'
                          : 'badge-neutral'
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td>
                    <span className="row" style={{ gap: '6px', fontSize: '13px' }}>
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'var(--cmp-brand-subtle)',
                          color: 'var(--cmp-brand)',
                          fontSize: '8.5px',
                          fontWeight: 700
                        }}
                      >
                        {listing.agentInitials}
                      </span>
                      {listing.agent}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
