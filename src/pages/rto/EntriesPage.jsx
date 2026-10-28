import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  Plus,
  Search,
  Radio,
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Edit3,
  MapPin,
  Users
} from 'lucide-react';

function formatAed(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `AED ${Number(val).toLocaleString('en-US')}`;
}

function formatCountdown(targetDate) {
  if (!targetDate) return '—';
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return 'Ended';

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'APPROVED', label: 'Live' },
  { key: 'AWAITING', label: 'In review' },
  { key: 'PRE_APPROVED', label: 'Pre-approved' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'SOLD_FAIL', label: 'No offers' }
];

export default function EntriesPage() {
  const { isLiveData, account, can, authToken } = useApp();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    APPROVED: 0,
    AWAITING: 0,
    PRE_APPROVED: 0,
    SCHEDULED: 0,
    REJECTED: 0,
    PAUSED: 0,
    SOLD: 0,
    SOLD_FAIL: 0
  });

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);

  // Load entries
  const fetchEntries = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const params = {};
        if (activeFilter !== 'all') params.status = activeFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await cmpConnectApi.listRtoProperties(params, token);
        if (res && res.data) {
          setEntries(Array.isArray(res.data) ? res.data : []);
          if (res.counts) {
            setCounts((prev) => ({ ...prev, ...res.counts }));
          }
        } else if (!isLiveData) {
          // Fallback to rich mock data if endpoint is pending or in mock mode
          const mockData = getMockEntries();
          setEntries(
            activeFilter === 'all'
              ? mockData
              : mockData.filter((m) => m.status === activeFilter)
          );
          setCounts(getMockCounts());
        }
      } catch (err) {
        console.error('Failed to load RTO entries:', err);
        if (!isLiveData || err.status === 401) {
          const mockData = getMockEntries();
          setEntries(
            activeFilter === 'all'
              ? mockData
              : mockData.filter((m) => m.status === activeFilter)
          );
          setCounts(getMockCounts());
          if (err.status === 401) {
            setError('Backend RTO API returned: ' + (err.message || 'Authentication token missing') + '. Displaying demo entries while server-side authentication is verified.');
          }
        } else {
          setError(err.message || 'Failed to load entries from server.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeFilter, searchQuery, token, isLiveData]
  );

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Periodic ticker for live countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Filtered entries by local search if search query was typed
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const title = (e.title || e.propertyTitle || '').toLowerCase();
      const ref = (e.rtoRef || e.reference || '').toLowerCase();
      const loc = (e.location || e.propertyLocation || '').toLowerCase();
      const agent = (e.listedBy?.fullName || e.listedBy?.name || '').toLowerCase();
      return title.includes(q) || ref.includes(q) || loc.includes(q) || agent.includes(q);
    });
  }, [entries, searchQuery]);

  const renderStatusBadge = (status, item) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-success)', fontWeight: 700 }}>
            <span className="cmp-live-dot" /> Live
          </span>
        );
      case 'AWAITING':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: '#D97706', fontWeight: 600 }}>
            <Clock size={14} /> Waiting for CMP review
          </span>
        );
      case 'PRE_APPROVED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: '#2563EB', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Pre-approved
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-brand)', fontWeight: 600 }}>
            <Calendar size={14} /> Starts {item?.auction?.startTime ? new Date(item.auction.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-danger)', fontWeight: 700 }}>
            <AlertCircle size={14} /> Sent back by CMP
          </span>
        );
      case 'PAUSED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: '#B45309', fontWeight: 600 }}>
            <AlertTriangle size={14} /> Paused by CMP
          </span>
        );
      case 'SOLD':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
            <Sparkles size={14} /> Sold
          </span>
        );
      case 'SOLD_FAIL':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-text-faint)', fontWeight: 600 }}>
            <Clock size={14} /> No offers
          </span>
        );
      default:
        return (
          <span className="faint" style={{ fontSize: '12.5px' }}>
            {status}
          </span>
        );
    }
  };

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
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={24} style={{ color: 'var(--cmp-brand)' }} />
            Real Time Offer Entries
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Properties submitted by your agency for 7-day Real Time Offer auctions managed by CMP.
          </p>
        </div>

        <div className="row" style={{ gap: '10px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fetchEntries(true)}
            disabled={isRefreshing}
            title="Refresh entries"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Updating…' : 'Refresh'}</span>
          </button>

          {(!account || can('listings.create')) && (
            <NavLink to="/rto/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Enter a property</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        className="row"
        style={{
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '18px',
          alignItems: 'center'
        }}
      >
        <div className="row" style={{ gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {STATUS_FILTERS.map((tab) => {
            const count = counts[tab.key] ?? (tab.key === 'all' ? counts.all : 0);
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className="chip"
                aria-pressed={isActive}
                style={{
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--cmp-brand-subtle)' : undefined,
                  borderColor: isActive ? 'var(--cmp-brand)' : undefined,
                  color: isActive ? 'var(--cmp-brand)' : undefined
                }}
                onClick={() => setActiveFilter(tab.key)}
              >
                {tab.label} {count !== undefined && <span className="faint" style={{ fontSize: '11px', marginInlineStart: '4px' }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {/* View Toggle & Search Box */}
        <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
          <div className="row" style={{ border: '1px solid var(--cmp-border)', borderRadius: '6px', padding: '2px', background: 'var(--cmp-surface)' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                padding: '4px 8px',
                height: '28px',
                background: viewMode === 'grid' ? 'var(--cmp-brand-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--cmp-brand)' : 'inherit'
              }}
              onClick={() => setViewMode('grid')}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                padding: '4px 8px',
                height: '28px',
                background: viewMode === 'table' ? 'var(--cmp-brand-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--cmp-brand)' : 'inherit'
              }}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <ListIcon size={15} />
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={14}
              className="faint"
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              placeholder="Search reference, property, agent…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                paddingLeft: '32px',
                fontSize: '13px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Content Rendering: Loading / Error / Empty / Grid / Table */}
      {isLoading ? (
        <div style={{ padding: '64px 0', textAlign: 'center' }}>
          <RefreshCw size={26} className="spin faint" style={{ margin: '0 auto 10px' }} />
          <p className="muted" style={{ fontSize: '14px' }}>Loading Real Time Offer entries…</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '24px', background: 'var(--cmp-danger-subtle)', borderColor: 'var(--cmp-danger-border)' }}>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--cmp-danger)' }}>Error loading entries</p>
          <p className="muted" style={{ margin: '4px 0 12px', fontSize: '13.5px' }}>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fetchEntries()}>
            Retry
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <Radio size={32} className="faint" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>No properties found</h2>
          <p className="muted" style={{ margin: '6px auto 16px', maxWidth: '400px', fontSize: '13.5px' }}>
            {activeFilter !== 'all'
              ? `There are currently no properties matching the "${activeFilter}" filter.`
              : 'Your agency has not submitted any properties for Real Time Offer auctions yet.'}
          </p>
          {(!account || can('listings.create')) && (
            <NavLink to="/rto/new" className="btn btn-accent btn-sm">
              <Plus size={15} /> Enter a property
            </NavLink>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredEntries.map((item) => {
            const id = item.id || item._id;
            const ref = item.rtoRef || item.reference || id;
            const title = item.title || item.propertyTitle || 'Untitled Property';
            const location = item.location || item.propertyLocation || '';
            const category = item.category || item.propertyCategory || '';
            const plan = item.plan || item.propertyPlan || '';
            const type = item.typeLabel || item.type || item.propertyType || '';
            const startingPrice = item.startingPrice ?? item.propertyPrice ?? 0;
            const primaryImg =
              item.coverImage ||
              item.propertyImages?.[0]?.url ||
              item.thumbnail ||
              (Array.isArray(item.images) ? item.images[0]?.url : null);
            const agentName = item.listedBy?.fullName || item.listedBy?.name || 'Assigned Agent';
            const isLive = item.status === 'APPROVED';

            return (
              <div
                key={id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isLive ? '1px solid var(--cmp-success-border, #10B981)' : undefined,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onClick={() => navigate(`/rto/${id}`)}
              >
                {/* Photo Thumbnail */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '180px',
                    background: '#111',
                    overflow: 'hidden'
                  }}
                >
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#666' }}>
                      <Radio size={28} />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      display: 'flex',
                      gap: '6px'
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 700
                      }}
                    >
                      {category} · {plan} {type ? `· ${type}` : ''}
                    </span>
                  </div>

                  {/* Countdown pill for Live Auction */}
                  {isLive && item.auction?.endTime && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.85)',
                        color: '#10B981',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Clock size={13} />
                      <span>{formatCountdown(item.auction.endTime)}</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ marginBottom: '8px' }}>
                    {renderStatusBadge(item.status, item)}
                  </div>

                  <h3
                    style={{
                      fontSize: '16px',
                      margin: '0 0 4px',
                      fontWeight: 700,
                      lineHeight: '1.3'
                    }}
                  >
                    {title}
                  </h3>

                  <p
                    className="muted"
                    style={{
                      margin: '0 0 14px',
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MapPin size={13} />
                    {location || 'Dubai, UAE'}
                  </p>

                  {/* Key Price & Offer Stats */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--cmp-border)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {item.status === 'SOLD' ? 'Sold Price' : isLive ? 'Highest Offer' : 'Starting Price'}
                      </span>
                      <p style={{ margin: '2px 0 0', fontWeight: 800, fontSize: '15px', color: isLive ? 'var(--cmp-brand)' : 'inherit' }}>
                        {formatAed(item.soldPrice || item.auction?.currentHighestBid || startingPrice)}
                      </p>
                    </div>

                    <div style={{ textAlign: 'end' }}>
                      <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Offers
                      </span>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>
                        {item.auction?.offers ?? 0}
                      </p>
                    </div>
                  </div>

                  {/* Footer Bar: Agent & Action */}
                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--cmp-surface-subtle)'
                    }}
                  >
                    <span className="faint" style={{ fontSize: '12px' }}>
                      {agentName}
                    </span>

                    <NavLink
                      to={`/rto/${id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '12.5px', color: 'var(--cmp-brand)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>View details</span>
                      <ChevronRight size={14} />
                    </NavLink>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Starting price</th>
                <th>Highest offer</th>
                <th>Offers</th>
                <th>Timing / Clock</th>
                <th>Agent</th>
                <th style={{ textAlign: 'end' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((item) => {
                const id = item.id || item._id;
                const ref = item.rtoRef || item.reference || id;
                const title = item.title || item.propertyTitle || 'Untitled Property';
                const category = item.category || item.propertyCategory || '';
                const type = item.typeLabel || item.type || item.propertyType || '';
                const startingPrice = item.startingPrice ?? item.propertyPrice ?? 0;
                const agentName = item.listedBy?.fullName || item.listedBy?.name || 'Agent';
                const isLive = item.status === 'APPROVED';

                return (
                  <tr
                    key={id}
                    onClick={() => navigate(`/rto/${id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ minWidth: '220px' }}>
                      <div style={{ fontWeight: 600 }}>{title}</div>
                      <span className="faint" style={{ fontSize: '12px' }}>
                        {ref} {category ? `· ${category}` : ''} {type ? `· ${type}` : ''}
                      </span>
                    </td>
                    <td>{renderStatusBadge(item.status, item)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatAed(startingPrice)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 700, color: isLive ? 'var(--cmp-brand)' : 'inherit' }}>
                      {formatAed(item.soldPrice || item.auction?.currentHighestBid)}
                    </td>
                    <td>{item.auction?.offers ?? 0}</td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {isLive && item.auction?.endTime ? (
                        <span style={{ color: 'var(--cmp-success)', fontWeight: 600 }}>
                          {formatCountdown(item.auction.endTime)}
                        </span>
                      ) : item.status === 'SCHEDULED' && item.auction?.startTime ? (
                        `Starts ${new Date(item.auction.startTime).toLocaleDateString()}`
                      ) : item.status === 'SOLD' ? (
                        'Completed'
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="faint" style={{ whiteSpace: 'nowrap' }}>
                      {agentName}
                    </td>
                    <td style={{ textAlign: 'end' }}>
                      <NavLink
                        to={`/rto/${id}`}
                        className="btn btn-outline btn-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Inspect
                      </NavLink>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getMockEntries() {
  return [
    {
      _id: 'CMP-RTO-1001',
      reference: 'CMP-RTO-1001',
      propertyTitle: 'Marina view 2 bed in Marina Gate',
      propertyLocation: 'Dubai Marina, Dubai',
      propertyCategory: 'RESIDENTIAL',
      propertyPlan: 'READY',
      propertyType: 'APARTMENT',
      propertyPrice: 2000000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80' }],
      status: 'APPROVED',
      auction: {
        status: 'ACTIVE',
        startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
        endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
        currentHighestBid: 2200000,
        offers: 4,
        extensionCount: 0
      },
      approvedBuyers: 6,
      listedBy: { name: 'Layla Haddad', brn: '49210' },
      can: { edit: false }
    },
    {
      _id: 'CMP-RTO-1002',
      reference: 'CMP-RTO-1002',
      propertyTitle: 'Four bedroom family villa in Arabian Ranches',
      propertyLocation: 'Arabian Ranches 2, Dubai',
      propertyCategory: 'RESIDENTIAL',
      propertyPlan: 'READY',
      propertyType: 'VILLA',
      propertyPrice: 4800000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80' }],
      status: 'APPROVED',
      auction: {
        status: 'ACTIVE',
        startTime: new Date(Date.now() - 86400000 * 6).toISOString(),
        endTime: new Date(Date.now() + 3600000 * 3).toISOString(),
        currentHighestBid: 5250000,
        offers: 11,
        extensionCount: 1
      },
      approvedBuyers: 9,
      listedBy: { name: 'Karim Saleh', brn: '51024' },
      can: { edit: false }
    },
    {
      _id: 'CMP-RTO-1003',
      reference: 'CMP-RTO-1003',
      propertyTitle: 'Retail shop with street frontage',
      propertyLocation: 'Business Bay, Dubai',
      propertyCategory: 'COMMERCIAL',
      propertyPlan: 'READY',
      propertyType: 'RETAIL',
      propertyPrice: 1650000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80' }],
      status: 'AWAITING',
      auction: {},
      approvedBuyers: 0,
      listedBy: { name: 'Emma Clarke', brn: '38192' },
      can: { edit: false }
    },
    {
      _id: 'CMP-RTO-1004',
      reference: 'CMP-RTO-1004',
      propertyTitle: 'Off-plan 1 bed in Creek Harbour',
      propertyLocation: 'Dubai Creek Harbour, Dubai',
      propertyCategory: 'RESIDENTIAL',
      propertyPlan: 'OFF_PLAN',
      propertyType: 'APARTMENT',
      propertyPrice: 1200000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&auto=format&fit=crop&q=80' }],
      status: 'REJECTED',
      rejectionReason: 'Trakheesi permit number does not match Dubai Land Department records.',
      auction: {},
      approvedBuyers: 0,
      listedBy: { name: 'Arjun Mehta', brn: '42880' },
      can: { edit: true }
    },
    {
      _id: 'CMP-RTO-1005',
      reference: 'CMP-RTO-1005',
      propertyTitle: 'Luxury penthouse in Downtown',
      propertyLocation: 'Downtown Dubai, Dubai',
      propertyCategory: 'RESIDENTIAL',
      propertyPlan: 'READY',
      propertyType: 'APARTMENT',
      propertyPrice: 8500000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80' }],
      status: 'SOLD',
      soldPrice: 9400000,
      auction: {
        status: 'ENDED',
        currentHighestBid: 9400000,
        offers: 18
      },
      approvedBuyers: 12,
      listedBy: { name: 'Layla Haddad', brn: '49210' },
      can: { edit: false }
    }
  ];
}

function getMockCounts() {
  return {
    all: 5,
    APPROVED: 2,
    AWAITING: 1,
    PRE_APPROVED: 0,
    SCHEDULED: 0,
    REJECTED: 1,
    PAUSED: 0,
    SOLD: 1,
    SOLD_FAIL: 0
  };
}
