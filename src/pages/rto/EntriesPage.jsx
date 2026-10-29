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
  Trash2,
  Check,
  X,
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
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'AGENCY_REVIEW', label: 'Waiting for agency' },
  { key: 'AGENCY_REJECTED', label: 'Sent back by agency' },
  { key: 'AWAITING', label: 'Waiting for CMP' },
  { key: 'PRE_APPROVED', label: 'Pre-approved' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'APPROVED', label: 'Live' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'REJECTED', label: 'Sent back by CMP' },
  { key: 'SOLD', label: 'Sold' },
  { key: 'SOLD_FAIL', label: 'No offers' }
];

export default function EntriesPage() {
  const { isLiveData, account, can, authToken } = useApp();
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    DRAFT: 0,
    AGENCY_REVIEW: 0,
    AGENCY_REJECTED: 0,
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
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const handleDeleteDraft = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this draft property?')) return;
    try {
      await cmpConnectApi.deleteRtoProperty(id, token);
      fetchEntries(true);
    } catch (err) {
      setError(err.message || 'Failed to delete draft.');
    }
  };

  const handleApproveItem = async (e, item) => {
    e.stopPropagation();
    const id = item.id || item._id;
    setActionLoadingId(id);
    setError(null);
    setActionMessage(null);
    try {
      const res = await cmpConnectApi.approveRtoProperty(id, token);
      setActionMessage(res?.message || 'Property approved and sent to CMP for review.');
      fetchEntries(true);
    } catch (err) {
      setError(err.message || 'Failed to approve property.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (e, item) => {
    e.stopPropagation();
    setRejectModalItem(item);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 3) {
      setError('Please enter a reason (at least 3 characters).');
      return;
    }
    const id = rejectModalItem.id || rejectModalItem._id;
    setActionLoadingId(id);
    setError(null);
    setActionMessage(null);
    try {
      const res = await cmpConnectApi.rejectRtoProperty(id, trimmed, token);
      setActionMessage(res?.message || 'Property sent back to the agent.');
      setRejectModalItem(null);
      setRejectReason('');
      fetchEntries(true);
    } catch (err) {
      setError(err.message || 'Failed to send back property.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (status, item) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-text-muted)', fontWeight: 700 }}>
            <Edit3 size={14} /> Draft
          </span>
        );
      case 'AGENCY_REVIEW':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: '#D97706', fontWeight: 700 }}>
            <Clock size={14} /> Waiting for agency approval
          </span>
        );
      case 'AGENCY_REJECTED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-danger)', fontWeight: 700 }}>
            <AlertCircle size={14} /> Sent back by agency
          </span>
        );
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
            <CheckCircle2 size={14} /> Checked by CMP, waiting for final approval
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="row" style={{ gap: '6px', fontSize: '12.5px', color: 'var(--cmp-brand)', fontWeight: 600 }}>
            <Calendar size={14} /> Starts {(item?.auction?.startTime || item?.schedule?.startAt) ? new Date(item.auction?.startTime || item.schedule?.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon'}
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
      {actionMessage && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-brand-subtle)',
            borderColor: 'var(--cmp-brand-border)',
            color: 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          ✓ {actionMessage}
        </div>
      )}

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
                onClick={() => navigate(item.status === 'DRAFT' ? `/rto/${id}/edit` : `/rto/${id}`)}
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
                      borderTop: '1px solid var(--cmp-surface-subtle)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <span className="faint" style={{ fontSize: '12px' }}>
                      {agentName}
                    </span>

                    {item.status === 'DRAFT' ? (
                      <div className="row" style={{ gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        {item.can?.delete && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: '12px', color: 'var(--cmp-danger)' }}
                            onClick={(e) => handleDeleteDraft(e, id)}
                            title="Delete draft"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                        {item.can?.edit && (
                          <NavLink
                            to={`/rto/${id}/edit`}
                            className="btn btn-accent btn-sm"
                            style={{ padding: '2px 8px', fontSize: '12px' }}
                          >
                            <span>Continue</span>
                            <ChevronRight size={13} />
                          </NavLink>
                        )}
                      </div>
                    ) : (item.can?.agencyApprove || item.can?.agencyReject) ? (
                      <div className="row" style={{ gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                        {item.can?.agencyApprove && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 10px', fontSize: '12px', height: '28px' }}
                            disabled={actionLoadingId === id}
                            onClick={(e) => handleApproveItem(e, item)}
                            title="Approve and send to CMP"
                          >
                            <Check size={13} />
                            <span>{actionLoadingId === id ? 'Approving…' : 'Approve'}</span>
                          </button>
                        )}
                        {item.can?.agencyReject && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '3px 10px',
                              fontSize: '12px',
                              height: '28px',
                              borderColor: 'var(--cmp-danger)',
                              color: 'var(--cmp-danger)'
                            }}
                            disabled={actionLoadingId === id}
                            onClick={(e) => handleOpenRejectModal(e, item)}
                            title="Send back to agent"
                          >
                            <X size={13} />
                            <span>Send back</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <NavLink
                        to={`/rto/${id}`}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontSize: '12.5px', color: 'var(--cmp-brand)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>View details</span>
                        <ChevronRight size={14} />
                      </NavLink>
                    )}
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
                    onClick={() => navigate(item.status === 'DRAFT' ? `/rto/${id}/edit` : `/rto/${id}`)}
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
                      {item.status === 'DRAFT' ? (
                        <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                          {item.can?.delete && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--cmp-danger)' }}
                              onClick={(e) => handleDeleteDraft(e, id)}
                            >
                              Delete
                            </button>
                          )}
                          {item.can?.edit && (
                            <NavLink
                              to={`/rto/${id}/edit`}
                              className="btn btn-accent btn-sm"
                            >
                              Continue
                            </NavLink>
                          )}
                        </div>
                      ) : (item.can?.agencyApprove || item.can?.agencyReject) ? (
                        <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                          {item.can?.agencyApprove && (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={actionLoadingId === id}
                              onClick={(e) => handleApproveItem(e, item)}
                            >
                              <Check size={13} />
                              <span>{actionLoadingId === id ? 'Approving…' : 'Approve'}</span>
                            </button>
                          )}
                          {item.can?.agencyReject && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
                              disabled={actionLoadingId === id}
                              onClick={(e) => handleOpenRejectModal(e, item)}
                            >
                              <X size={13} />
                              <span>Send back</span>
                            </button>
                          )}
                          <NavLink
                            to={`/rto/${id}`}
                            className="btn btn-ghost btn-sm"
                          >
                            Inspect
                          </NavLink>
                        </div>
                      ) : (
                        <NavLink
                          to={`/rto/${id}`}
                          className="btn btn-outline btn-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Inspect
                        </NavLink>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Agency Send Back / Reject Modal */}
      {rejectModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setRejectModalItem(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              background: 'var(--cmp-surface)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Send Back to Agent</h2>
                <p className="faint" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                  {rejectModalItem.title || rejectModalItem.propertyTitle} ({rejectModalItem.rtoRef || rejectModalItem.reference || rejectModalItem.id || rejectModalItem._id})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRejectModalItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Reason for sending back (3–500 characters) *
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Explain what the agent needs to fix before you approve this entry for CMP…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setRejectModalItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{ background: 'var(--cmp-danger)', color: '#fff', border: 'none' }}
                  disabled={Boolean(actionLoadingId)}
                >
                  {actionLoadingId ? 'Sending back…' : 'Confirm send back'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockEntries() {
  return [
    {
      _id: 'CMP-RTO-1000',
      reference: 'CRID-88A1K2M9',
      propertyTitle: 'Sea view 3 bed apartment in Bluewaters',
      propertyLocation: 'Bluewaters Island, Dubai',
      propertyCategory: 'RESIDENTIAL',
      propertyPlan: 'READY',
      propertyType: 'APARTMENT',
      propertyPrice: 5400000,
      propertyImages: [{ url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80' }],
      status: 'AGENCY_REVIEW',
      auction: {},
      approvedBuyers: 0,
      listedBy: { name: 'Tariq Shakoor', brn: '990101' },
      can: { edit: true, agencyApprove: true, agencyReject: true }
    },
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
    all: 6,
    DRAFT: 0,
    AGENCY_REVIEW: 1,
    AGENCY_REJECTED: 0,
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
