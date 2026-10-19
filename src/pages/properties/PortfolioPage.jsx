import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  CountBadge,
  Chip,
  SearchInput,
  QualityScoreCircle
} from '../../components/ui';
import { useDebounce } from '../../hooks';
import cmpConnectApi from '../../services/cmpConnectApi';

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
  AlertOctagon,
  Home,
  Tag,
  Maximize2,
  Bed,
  Bath,
  MapPin,
  Edit2,
  MoreVertical,
  Loader2,
  ShieldAlert,
  Send,
  CheckCircle2,
  XCircle,
  Archive,
  RotateCcw,
  RotateCw,
  Trash2,
  UserCheck,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

const STATUS_TABS = [
  { label: 'All', key: 'all' },
  { label: 'Live', key: 'LIVE' },
  { label: 'In review', key: 'PENDING_APPROVAL' },
  { label: 'Drafts', key: 'DRAFT' },
  { label: 'Unpublished', key: 'UNPUBLISHED' },
  { label: 'Expired', key: 'EXPIRED' },
  { label: 'Rejected', key: 'REJECTED' },
  { label: 'On hold', key: 'ON_HOLD' },
  { label: 'Archive', key: 'ARCHIVED' }
];

export default function PortfolioPage() {
  const { listings: mockListings, isLiveData, authToken, can, account } = useApp();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  // Live API state
  const [liveListings, setLiveListings] = useState([]);
  const [liveCounts, setLiveCounts] = useState({
    all: 0,
    LIVE: 0,
    PENDING_APPROVAL: 0,
    DRAFT: 0,
    UNPUBLISHED: 0,
    EXPIRED: 0,
    REJECTED: 0,
    ON_HOLD: 0,
    ARCHIVED: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Bulk Actions State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedListingIds, setSelectedListingIds] = useState(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkAssignModal, setBulkAssignModal] = useState({ isOpen: false, agentId: '' });

  // Modals state
  const [rejectModal, setRejectModal] = useState({ isOpen: false, listingId: null, reason: '' });
  const [assignModal, setAssignModal] = useState({ isOpen: false, listingId: null, agentId: '' });
  const [activeTeamMembers, setActiveTeamMembers] = useState([]);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Auto clear feedback message after 4s
  useEffect(() => {
    if (!feedbackMessage) return;
    const t = setTimeout(() => setFeedbackMessage(null), 4000);
    return () => clearTimeout(t);
  }, [feedbackMessage]);

  // Close action dropdown on click outside
  useEffect(() => {
    if (!openActionMenuId) return;
    const handleClickOutside = (e) => {
      if (e.target.closest('[data-action-menu]')) return;
      setOpenActionMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenuId]);

  // Load team members for assign dropdown if user has listings.assign permission
  useEffect(() => {
    if (isLiveData && authToken && can('listings.assign')) {
      cmpConnectApi.listMembers({ status: 'ACTIVE' }, authToken)
        .then((res) => {
          if (Array.isArray(res?.data)) {
            setActiveTeamMembers(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isLiveData, authToken, can]);

  // Map active filter label to API status
  const currentApiStatus = useMemo(() => {
    const found = STATUS_TABS.find((t) => t.label === activeFilter);
    return found ? found.key : 'all';
  }, [activeFilter]);

  // Fetch live listings
  const fetchLiveListings = useCallback(async () => {
    if (!isLiveData || !authToken) return;
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await cmpConnectApi.listListings(
        {
          status: currentApiStatus,
          search: debouncedSearch.trim() || undefined,
          sort: sortBy
        },
        authToken
      );

      if (Array.isArray(res?.data)) {
        setLiveListings(res.data);
      } else {
        setLiveListings([]);
      }

      if (res?.counts) {
        setLiveCounts((prev) => ({ ...prev, ...res.counts }));
      }
    } catch (err) {
      console.error('[Portfolio] Failed to load listings:', err);
      setApiError(err.message || 'Failed to load properties.');
    } finally {
      setIsLoading(false);
    }
  }, [isLiveData, authToken, currentApiStatus, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchLiveListings();
  }, [fetchLiveListings]);

  // Filter tabs with dynamic counts
  const filterTabs = useMemo(() => {
    if (isLiveData) {
      return STATUS_TABS.map((tab) => ({
        label: tab.label,
        count: liveCounts[tab.key] ?? 0
      }));
    }

    // Mock fallback counts
    return [
      { label: 'All', count: mockListings.length },
      { label: 'Live', count: mockListings.filter((l) => l.status === 'Live').length },
      { label: 'In review', count: mockListings.filter((l) => l.status === 'In review').length },
      { label: 'Drafts', count: mockListings.filter((l) => l.status === 'Draft').length },
      { label: 'Unpublished', count: 0 },
      { label: 'Rejected', count: mockListings.filter((l) => l.status === 'Rejected').length },
      { label: 'On hold', count: 0 },
      { label: 'Archive', count: 0 }
    ];
  }, [isLiveData, liveCounts, mockListings]);

  // Filtered listings in mock mode
  const filteredMockListings = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return mockListings.filter((item) => {
      const matchesFilter =
        activeFilter === 'All'
          ? true
          : activeFilter === 'Drafts'
          ? item.status === 'Draft'
          : activeFilter === 'In review'
          ? item.status === 'In review'
          : activeFilter === 'Live'
          ? item.status === 'Live'
          : activeFilter === 'Rejected'
          ? item.status === 'Rejected'
          : false;

      if (!matchesFilter) return false;
      if (q) {
        return (
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.community?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mockListings, activeFilter, debouncedSearch]);

  const displayListings = isLiveData ? liveListings : filteredMockListings;

  const handleCopyRef = useCallback((text, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Action Handlers
  const runListingAction = async (listingId, actionFn, successText) => {
    setActionLoadingId(listingId);
    setOpenActionMenuId(null);
    try {
      await actionFn();
      setFeedbackMessage({ type: 'success', text: successText });
      await fetchLiveListings();
    } catch (err) {
      console.error('[Action error]', err);
      setFeedbackMessage({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublish = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.publishListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} is now live.`
    );
  };

  const handleUnpublish = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.unpublishListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} unpublished.`
    );
  };

  const handleSubmitForApproval = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.submitListing(listing.id, authToken),
      can('listings.approve')
        ? `Listing ${listing.listingRef || ''} submitted and is now live!`
        : `Listing ${listing.listingRef || ''} submitted for approval.`
    );
  };

  const handleApprove = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.approveListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} approved and live.`
    );
  };

  const handleOpenRejectModal = (listing) => {
    setOpenActionMenuId(null);
    setRejectModal({ isOpen: true, listingId: listing.id, reason: '' });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    const { listingId, reason } = rejectModal;
    setRejectModal({ isOpen: false, listingId: null, reason: '' });

    runListingAction(
      listingId,
      () => cmpConnectApi.rejectListing(listingId, reason.trim(), authToken),
      'Listing rejected and returned to agent.'
    );
  };

  const handleArchive = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.archiveListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} moved to archive.`
    );
  };

  const handleRestore = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.restoreListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} restored to Draft.`
    );
  };

  const handleDelete = (listing) => {
    if (!window.confirm(`Are you sure you want to delete listing ${listing.listingRef || listing.title}?`)) {
      return;
    }
    runListingAction(
      listing.id,
      () => cmpConnectApi.deleteListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} deleted.`
    );
  };

  const handleOpenAssignModal = (listing) => {
    setOpenActionMenuId(null);
    setAssignModal({
      isOpen: true,
      listingId: listing.id,
      agentId: listing.listedBy?.id || ''
    });
  };

  const handleConfirmAssign = async () => {
    if (!assignModal.agentId) {
      alert('Please select an agent.');
      return;
    }
    const { listingId, agentId } = assignModal;
    setAssignModal({ isOpen: false, listingId: null, agentId: '' });

    runListingAction(
      listingId,
      () => cmpConnectApi.assignListing(listingId, agentId, authToken),
      'Listing assignment updated successfully.'
    );
  };

  // Refresh Listing (once per 24 hours)
  const handleRefresh = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.refreshListing(listing.id, authToken),
      `Listing ${listing.listingRef || ''} refreshed to top of search.`
    );
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await cmpConnectApi.exportListingsCsv(
        {
          status: currentApiStatus,
          search: debouncedSearch.trim() || undefined,
          sort: sortBy
        },
        authToken
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `listings-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setFeedbackMessage({ type: 'success', text: 'Listings exported to CSV successfully.' });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to export CSV.' });
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk Selection Handlers
  const toggleSelectListing = (id, e) => {
    e?.stopPropagation?.();
    setSelectedListingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedListingIds.size === displayListings.length) {
      setSelectedListingIds(new Set());
    } else {
      setSelectedListingIds(new Set(displayListings.map((l) => l.id)));
    }
  };

  const handleBulkAction = async (action, agentId = null) => {
    if (selectedListingIds.size === 0) return;
    const ids = Array.from(selectedListingIds);
    setIsBulkLoading(true);
    try {
      const res = await cmpConnectApi.bulkListingsAction({ ids, action, agentId }, authToken);
      setFeedbackMessage({
        type: 'success',
        text: res?.message || `Bulk ${action} executed successfully.`
      });
      setSelectedListingIds(new Set());
      setIsBulkMode(false);
      await fetchLiveListings();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || `Bulk ${action} failed.` });
    } finally {
      setIsBulkLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Helper to format price label
  const formatPrice = (price, rentalPeriod) => {
    if (!price && price !== 0) return 'Price on Request';
    const num = Number(price);
    const formatted = num >= 1000000
      ? `AED ${(num / 1000000).toFixed(2)}M`
      : `AED ${num.toLocaleString()}`;

    if (rentalPeriod) {
      const periodMap = {
        PER_YEAR: '/ yr',
        PER_MONTH: '/ mo',
        PER_WEEK: '/ wk',
        PER_DAY: '/ day'
      };
      return `${formatted} ${periodMap[rentalPeriod] || ''}`;
    }
    return formatted;
  };

  return (
    <div>
      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: '8px',
            background: feedbackMessage.type === 'error' ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '13.5px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {feedbackMessage.type === 'error' ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackMessage.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFF',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Portfolio{' '}
            <CountBadge count={isLiveData ? (liveCounts.all || liveListings.length) : mockListings.length} />
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            {isLiveData
              ? 'Real-time property inventory synced with Dubai portals and DLD compliance.'
              : 'Interactive portfolio mockup demonstrating live listing states.'}
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          {can('listings.view') && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={isExporting}
              onClick={handleExportCsv}
              title="Download listings as CSV"
            >
              {isExporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          )}
          <NavLink to="/rto" className="btn btn-outline btn-sm">
            <Radio size={16} />
            <span>Offers</span>
          </NavLink>
          {can('listings.create') && (
            <NavLink to="/properties/new" className="btn btn-accent btn-sm">
              <Plus size={16} />
              <span>List new property</span>
            </NavLink>
          )}
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
          placeholder="Search by title, CMP ref, unit or community..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          maxWidth="330px"
        />

        {/* Sort Select */}
        <div style={{ position: 'relative' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="btn btn-outline btn-sm"
            style={{
              height: '40px',
              appearance: 'none',
              paddingRight: '28px',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Listing created: Newest</option>
            <option value="updated">Recently updated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="quality">Quality Score</option>
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--cmp-text-muted)'
            }}
          />
        </div>

        {/* View Mode Toggle */}
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

        {/* Bulk Selection Toggle */}
        <button
          type="button"
          className={`btn btn-sm ${isBulkMode ? 'btn-accent' : 'btn-outline'}`}
          style={{ height: '40px' }}
          onClick={() => {
            setIsBulkMode(!isBulkMode);
            if (isBulkMode) setSelectedListingIds(new Set());
          }}
          title="Select listings for bulk operations"
        >
          <CheckSquare size={16} />
          <span>{isBulkMode ? 'Done selecting' : 'Select listings'}</span>
        </button>

        {isLoading && (
          <span className="row muted" style={{ gap: '6px', fontSize: '13px', marginLeft: 'auto' }}>
            <Loader2 size={16} className="spin" />
            <span>Loading properties...</span>
          </span>
        )}
      </div>

      {/* Status Chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
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

      {/* Error Banner */}
      {apiError && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            marginBottom: '18px',
            background: 'var(--cmp-danger-subtle)',
            border: '1px solid var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div className="row" style={{ gap: '10px' }}>
            <ShieldAlert size={18} />
            <span>{apiError}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={fetchLiveListings}
            style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Floating Bulk Actions Toolbar */}
      {isBulkMode && (
        <div
          style={{
            position: 'sticky',
            top: '16px',
            zIndex: 40,
            background: 'var(--cmp-brand-dark, #0d3824)',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '10px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)'
          }}
        >
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF' }}
              onClick={handleSelectAll}
            >
              {selectedListingIds.size === displayListings.length && displayListings.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span style={{ fontWeight: 600, fontSize: '13.5px' }}>
              {selectedListingIds.size} of {displayListings.length} selected
            </span>
            {isBulkLoading && <Loader2 size={16} className="spin" />}
          </div>

          <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
            {can('listings.publish') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm"
                style={{ background: 'var(--cmp-success)', color: '#FFF' }}
                onClick={() => handleBulkAction('publish')}
              >
                Publish
              </button>
            )}
            {can('listings.unpublish') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFF' }}
                onClick={() => handleBulkAction('unpublish')}
              >
                Unpublish
              </button>
            )}
            {can('listings.update') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFF' }}
                onClick={() => handleBulkAction('refresh')}
              >
                Refresh
              </button>
            )}
            {can('listings.assign') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFF' }}
                onClick={() => setBulkAssignModal({ isOpen: true, agentId: '' })}
              >
                Assign Agent
              </button>
            )}
            {can('listings.archive') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFF' }}
                onClick={() => handleBulkAction('archive')}
              >
                Archive
              </button>
            )}
            {can('listings.archive') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#FFF' }}
                onClick={() => handleBulkAction('restore')}
              >
                Restore
              </button>
            )}
            {can('listings.delete') && (
              <button
                type="button"
                disabled={selectedListingIds.size === 0 || isBulkLoading}
                className="btn btn-sm"
                style={{ background: 'var(--cmp-danger)', color: '#FFF' }}
                onClick={() => {
                  if (window.confirm(`Delete ${selectedListingIds.size} selected listings?`)) {
                    handleBulkAction('delete');
                  }
                }}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: '#FFF' }}
              onClick={() => {
                setIsBulkMode(false);
                setSelectedListingIds(new Set());
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content Display: Grid vs Table */}
      {isLoading && displayListings.length === 0 ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 12px' }} />
          <p className="muted" style={{ margin: 0, fontSize: '14px' }}>
            Fetching properties from CMP Connect...
          </p>
        </div>
      ) : displayListings.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
            No properties found
          </p>
          <p className="muted" style={{ margin: '6px 0 16px', fontSize: '13.5px' }}>
            {isLiveData
              ? `No properties matched the "${activeFilter}" filter.`
              : 'No mock listings matched your filter criteria.'}
          </p>
          {can('listings.create') && (
            <NavLink to="/properties/new" className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>List your first property</span>
            </NavLink>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '18px'
          }}
        >
          {displayListings.map((listing) => {
            const isLiveProp = isLiveData;
            const refText = isLiveProp ? listing.listingRef : listing.id;
            const coverImg = isLiveProp
              ? (listing.coverImageWatermarked || listing.coverImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=70')
              : listing.image;

            const title = isLiveProp ? (listing.title || 'Untitled Property') : listing.title;
            const location = isLiveProp ? (listing.location || 'Dubai, UAE') : listing.community;
            const beds = isLiveProp ? (listing.bedrooms ?? listing.propertyBedrooms) : listing.beds;
            const baths = isLiveProp ? (listing.bathrooms ?? listing.propertyBathrooms ?? listing.baths) : listing.baths;
            const area = isLiveProp ? listing.area : listing.areaSqft;
            const price = isLiveProp ? formatPrice(listing.price, listing.rentalPeriod) : listing.priceLabel;
            const qualityScore = listing.qualityScore || 0;
            const status = isLiveProp ? listing.status : listing.status.toUpperCase();
            const onHold = Boolean(listing.onHold);
            const holdReason = listing.holdReason;
            const rejectionReason = listing.rejectionReason;
            const attentionCount = isLiveProp ? (listing.attentionRequired || 0) : (listing.attentionCount || 0);

            const agentName = isLiveProp
              ? (listing.listedBy?.fullName || 'Unassigned')
              : listing.agent;
            const agentInitials = isLiveProp
              ? (listing.listedBy?.fullName ? listing.listedBy.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'AG')
              : listing.agentInitials;

            const isActionBusy = actionLoadingId === listing.id;
            const isMenuOpen = openActionMenuId === listing.id;

            return (
              <article
                key={listing.id}
                className="card"
                style={{
                  overflow: isMenuOpen ? 'visible' : 'hidden',
                  position: 'relative',
                  zIndex: isMenuOpen ? 50 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '14px',
                  border: onHold ? '2px solid var(--cmp-danger)' : undefined,
                  minWidth: 0,
                  transition: 'box-shadow var(--cmp-duration-fast) var(--cmp-ease), border-color var(--cmp-duration-fast) var(--cmp-ease)'
                }}
              >
                {/* Image Header */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 9',
                    background: 'var(--cmp-surface-sunken)',
                    borderRadius: '14px 14px 0 0'
                  }}
                >
                  {/* Clipped photo wrapper */}
                  <NavLink
                    to={`/properties/${listing.id}/edit`}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      overflow: 'hidden',
                      borderRadius: '14px 14px 0 0',
                      display: 'block'
                    }}
                    title="Edit property details"
                  >
                    <img
                      src={coverImg}
                      alt={title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  </NavLink>

                  {/* Bulk Select Checkbox */}
                  {isBulkMode && (
                    <div
                      onClick={(e) => toggleSelectListing(listing.id, e)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        zIndex: 25,
                        background: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '6px',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#FFF'
                      }}
                      title="Select listing"
                    >
                      {selectedListingIds.has(listing.id) ? (
                        <CheckSquare size={18} style={{ color: '#2ecc71' }} />
                      ) : (
                        <Square size={18} />
                      )}
                    </div>
                  )}

                  {/* Top-Left Badges */}
                  <div
                    className="row"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: isBulkMode ? '44px' : '10px',
                      gap: '6px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background:
                          status === 'LIVE'
                            ? 'var(--cmp-brand)'
                            : status === 'PENDING_APPROVAL'
                            ? 'var(--cmp-warning)'
                            : status === 'REJECTED'
                            ? 'var(--cmp-danger)'
                            : status === 'EXPIRED'
                            ? '#b26b00'
                            : status === 'ARCHIVED'
                            ? 'rgba(0, 0, 0, 0.55)'
                            : 'rgba(0, 0, 0, 0.65)',
                        color: '#FFFFFF',
                        fontWeight: 700
                      }}
                    >
                      {status === 'PENDING_APPROVAL' ? 'IN REVIEW' : status}
                    </span>

                    {/* Expiry Badge */}
                    {status === 'LIVE' && listing.expiresAt && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                      >
                        {(() => {
                          const dl = getDaysUntilExpiry(listing.expiresAt);
                          return dl === 0 ? 'Expires today' : `Expires in ${dl}d`;
                        })()}
                      </span>
                    )}

                    {status === 'EXPIRED' && (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(178, 107, 0, 0.9)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700
                        }}
                      >
                        Publish again to go live
                      </span>
                    )}

                    {onHold && (
                      <span
                        className="badge"
                        style={{
                          background: 'var(--cmp-danger)',
                          color: '#FFFFFF',
                          fontWeight: 800
                        }}
                      >
                        ON HOLD BY CMP
                      </span>
                    )}
                  </div>

                  {/* Top-Right Edit & Action Buttons */}
                  <div
                    className="row"
                    data-action-menu="true"
                    style={{ position: 'absolute', top: '10px', right: '10px', gap: '6px', zIndex: 40 }}
                  >
                    {!onHold && can('listings.update') && (
                      <NavLink
                        to={`/properties/${listing.id}/edit`}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: '#18231C',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                          textDecoration: 'none'
                        }}
                        title="Edit Property"
                      >
                        <Edit2 size={14} />
                      </NavLink>
                    )}

                    {/* Action Dropdown Menu Trigger */}
                    {isLiveProp && !onHold && (
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          disabled={isActionBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId(isMenuOpen ? null : listing.id);
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            display: 'grid',
                            placeItems: 'center',
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#18231C',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                          }}
                          title="Actions"
                        >
                          {isActionBusy ? <Loader2 size={14} className="spin" /> : <MoreVertical size={15} />}
                        </button>

                        {/* Dropdown Menu Items */}
                        {isMenuOpen && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '38px',
                              right: 0,
                              zIndex: 100,
                              minWidth: '205px',
                              background: 'var(--cmp-surface)',
                              border: '1px solid var(--cmp-border)',
                              borderRadius: '10px',
                              boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                              padding: '6px 0',
                              display: 'grid'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <NavLink
                              to={`/properties/${listing.id}/edit`}
                              className="btn btn-ghost btn-sm"
                              style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                              onClick={() => setOpenActionMenuId(null)}
                            >
                              <Edit2 size={14} />
                              <span>Edit Details</span>
                            </NavLink>

                            {/* Refresh Bump for Live Listings */}
                            {status === 'LIVE' && can('listings.update') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-brand)' }}
                                onClick={() => handleRefresh(listing)}
                              >
                                <RotateCw size={14} />
                                <span>Refresh (Bump listing)</span>
                              </button>
                            )}

                            {/* Submit for Approval */}
                            {['DRAFT', 'REJECTED'].includes(status) && can('listings.create') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-brand)' }}
                                onClick={() => handleSubmitForApproval(listing)}
                              >
                                <Send size={14} />
                                <span>{can('listings.approve') ? 'Publish (Go Live)' : 'Submit for approval'}</span>
                              </button>
                            )}

                            {/* Approve / Reject (Manager) */}
                            {status === 'PENDING_APPROVAL' && can('listings.approve') && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-success)' }}
                                  onClick={() => handleApprove(listing)}
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Approve & Publish</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-danger)' }}
                                  onClick={() => handleOpenRejectModal(listing)}
                                >
                                  <XCircle size={14} />
                                  <span>Reject with reason</span>
                                </button>
                              </>
                            )}

                            {/* Unpublish */}
                            {status === 'LIVE' && can('listings.unpublish') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                                onClick={() => handleUnpublish(listing)}
                              >
                                <XCircle size={14} />
                                <span>Unpublish</span>
                              </button>
                            )}

                            {/* Publish again (for UNPUBLISHED or EXPIRED) */}
                            {(status === 'UNPUBLISHED' || status === 'EXPIRED') && can('listings.publish') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-brand)' }}
                                onClick={() => handlePublish(listing)}
                              >
                                <CheckCircle2 size={14} />
                                <span>Publish</span>
                              </button>
                            )}

                            {/* Assign Agent */}
                            {can('listings.assign') && status !== 'ARCHIVED' && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                                onClick={() => handleOpenAssignModal(listing)}
                              >
                                <UserCheck size={14} />
                                <span>Change Agent</span>
                              </button>
                            )}

                            {/* Archive */}
                            {status !== 'ARCHIVED' && status !== 'PENDING_APPROVAL' && can('listings.archive') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                                onClick={() => handleArchive(listing)}
                              >
                                <Archive size={14} />
                                <span>Archive</span>
                              </button>
                            )}

                            {/* Restore from archive */}
                            {status === 'ARCHIVED' && can('listings.archive') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-brand)' }}
                                onClick={() => handleRestore(listing)}
                              >
                                <RotateCcw size={14} />
                                <span>Restore to Draft</span>
                              </button>
                            )}

                            {/* Soft Delete */}
                            {status !== 'LIVE' && can('listings.delete') && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-danger)' }}
                                onClick={() => handleDelete(listing)}
                              >
                                <Trash2 size={14} />
                                <span>Delete listing</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Red On-Hold Banner */}
                  {onHold && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '7px 12px',
                        background: 'rgba(180, 20, 20, 0.92)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <AlertOctagon size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        On hold by CMP: {holdReason || 'Contact CMP support'}
                      </span>
                    </div>
                  )}

                  {/* Attention Required Banner */}
                  {!onHold && attentionCount > 0 && (
                    <NavLink
                      to={`/properties/${listing.id}/edit`}
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        padding: '7px 10px',
                        background: 'rgba(4, 21, 14, 0.85)',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none'
                      }}
                    >
                      <AlertTriangle size={14} style={{ color: 'var(--cmp-accent)' }} />
                      <span>Attention required ({attentionCount} items)</span>
                    </NavLink>
                  )}
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flex: 1,
                    minWidth: 0,
                    background: 'var(--cmp-surface)'
                  }}
                >
                  {/* Rejection Banner */}
                  {status === 'REJECTED' && rejectionReason && (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: 'var(--cmp-danger-subtle)',
                        border: '1px solid var(--cmp-danger)',
                        color: 'var(--cmp-danger)',
                        fontSize: '12px',
                        fontWeight: 600,
                        minWidth: 0
                      }}
                    >
                      <strong>Rejection note:</strong> {rejectionReason}
                    </div>
                  )}

                  {/* Price & Purpose Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: 'var(--cmp-text)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {price}
                      </span>
                    </div>

                    {listing.purpose && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2.5px 8px',
                          borderRadius: '5px',
                          background:
                            String(listing.purpose).toUpperCase() === 'SALE'
                              ? 'rgba(4, 21, 14, 0.08)'
                              : 'rgba(217, 119, 6, 0.1)',
                          color:
                            String(listing.purpose).toUpperCase() === 'SALE'
                              ? 'var(--cmp-brand)'
                              : '#b45309',
                          border: `1px solid ${
                            String(listing.purpose).toUpperCase() === 'SALE'
                              ? 'rgba(4, 21, 14, 0.16)'
                              : 'rgba(217, 119, 6, 0.22)'
                          }`,
                          flexShrink: 0
                        }}
                      >
                        {listing.purpose}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      lineHeight: 1.35,
                      minWidth: 0
                    }}
                  >
                    <NavLink
                      to={`/properties/${listing.id}/edit`}
                      title={title}
                      style={{
                        color: 'var(--cmp-text)',
                        textDecoration: 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        transition: 'color var(--cmp-duration-fast) var(--cmp-ease)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--cmp-brand)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cmp-text)'; }}
                    >
                      {title}
                    </NavLink>
                  </h3>

                  {/* Location with MapPin icon and clean truncation */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      color: 'var(--cmp-text-muted)',
                      minWidth: 0
                    }}
                  >
                    <MapPin size={13} style={{ flexShrink: 0, color: 'var(--cmp-text-faint)' }} />
                    <span
                      title={location}
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0
                      }}
                    >
                      {location}
                    </span>
                  </div>

                  {/* Specs Row (Beds, Baths, Area, Type) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12.5px',
                      color: 'var(--cmp-text-muted)',
                      padding: '7px 0',
                      borderTop: '1px solid var(--cmp-border)',
                      borderBottom: '1px solid var(--cmp-border)',
                      minWidth: 0,
                      flexWrap: 'wrap'
                    }}
                  >
                    {beds !== undefined && beds !== null && beds !== '' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, flexShrink: 0 }}>
                        <Bed size={14} style={{ color: 'var(--cmp-text-faint)' }} />
                        <span>{beds === '0' || beds === 0 ? 'Studio' : `${beds} beds`}</span>
                      </span>
                    )}

                    {baths !== undefined && baths !== null && baths !== '' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, flexShrink: 0 }}>
                        <Bath size={14} style={{ color: 'var(--cmp-text-faint)' }} />
                        <span>{baths} {Number(baths) === 1 ? 'bath' : 'baths'}</span>
                      </span>
                    )}

                    {area && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500, flexShrink: 0 }}>
                        <Maximize2 size={13} style={{ color: 'var(--cmp-text-faint)' }} />
                        <span>{Number(area).toLocaleString()} sqft</span>
                      </span>
                    )}

                    {listing.typeLabel && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--cmp-text-muted)',
                          background: 'var(--cmp-surface-sunken)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      >
                        {listing.typeLabel}
                      </span>
                    )}
                  </div>

                  {/* Chips (Category, DLD Permit) */}
                  {(listing.category || listing.dldPermitNumber || listing.permitNumber) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', minWidth: 0 }}>
                      {listing.category && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'var(--cmp-surface-sunken)',
                            color: 'var(--cmp-text-muted)',
                            fontWeight: 600
                          }}
                        >
                          {listing.category}
                        </span>
                      )}
                      {(listing.dldPermitNumber || listing.permitNumber) && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'rgba(46, 204, 113, 0.1)',
                            color: '#27ae60',
                            fontWeight: 700
                          }}
                        >
                          DLD: {listing.dldPermitNumber || listing.permitNumber}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Reference Number Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      minWidth: 0,
                      gap: '8px'
                    }}
                  >
                    <span style={{ color: 'var(--cmp-text-faint)', flexShrink: 0 }}>Ref:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                      <button
                        type="button"
                        aria-label={`Copy ${refText}`}
                        title="Copy reference"
                        onClick={(e) => handleCopyRef(refText, e)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          color: copiedId === refText ? 'var(--cmp-brand)' : 'var(--cmp-text-faint)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          flexShrink: 0
                        }}
                      >
                        {copiedId === refText ? (
                          <Check size={13} style={{ color: 'var(--cmp-brand)' }} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                      <NavLink
                        to={`/properties/${listing.id}/edit`}
                        title="Edit property"
                        style={{
                          color: 'var(--cmp-brand)',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0
                        }}
                      >
                        {refText}
                      </NavLink>
                    </div>
                  </div>

                  {/* Quality Score Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'var(--cmp-surface-sunken)',
                      fontSize: '12.5px',
                      minWidth: 0
                    }}
                  >
                    <span style={{ color: 'var(--cmp-text)', fontWeight: 500 }}>Quality Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <QualityScoreCircle score={qualityScore} size={18} strokeWidth={2.5} />
                      <strong
                        style={{
                          fontSize: '12.5px',
                          color:
                            qualityScore >= 80
                              ? 'var(--cmp-success)'
                              : qualityScore >= 60
                              ? 'var(--cmp-warning)'
                              : 'var(--cmp-danger)'
                        }}
                      >
                        {qualityScore}
                      </strong>
                    </div>
                  </div>

                  {/* Agent Info Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--cmp-border)',
                      fontSize: '12px',
                      minWidth: 0,
                      marginTop: 'auto'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'var(--cmp-brand-subtle)',
                          color: 'var(--cmp-brand)',
                          fontWeight: 700,
                          fontSize: '9.5px',
                          flexShrink: 0
                        }}
                      >
                        {agentInitials}
                      </span>
                      <span
                        title={agentName}
                        style={{
                          fontWeight: 600,
                          color: 'var(--cmp-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0
                        }}
                      >
                        {agentName}
                      </span>
                    </div>
                    {listing.listedBy?.brn && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          color: 'var(--cmp-text-faint)',
                          background: 'var(--cmp-surface-sunken)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      >
                        BRN: {listing.listedBy.brn}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                {isBulkMode && (
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedListingIds.size === displayListings.length && displayListings.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th>Reference</th>
                <th>Property</th>
                <th>Purpose</th>
                <th>Price</th>
                <th>Quality</th>
                <th>Status</th>
                <th>Agent</th>
                <th style={{ textAlign: 'end' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayListings.map((listing) => {
                const isLiveProp = isLiveData;
                const refText = isLiveProp ? listing.listingRef : listing.id;
                const title = isLiveProp ? (listing.title || 'Untitled Property') : listing.title;
                const location = isLiveProp ? (listing.location || 'Dubai') : listing.community;
                const price = isLiveProp ? formatPrice(listing.price, listing.rentalPeriod) : listing.priceLabel;
                const qualityScore = listing.qualityScore || 0;
                const status = isLiveProp ? listing.status : listing.status.toUpperCase();
                const agentName = isLiveProp ? (listing.listedBy?.fullName || 'Unassigned') : listing.agent;
                const onHold = Boolean(listing.onHold);
                const daysLeft = isLiveProp && status === 'LIVE' ? getDaysUntilExpiry(listing.expiresAt) : null;
                const isSelected = selectedListingIds.has(listing.id);

                return (
                  <tr key={listing.id} style={{ background: isSelected ? 'rgba(30,123,89,0.06)' : undefined }}>
                    {isBulkMode && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectListing(listing.id, e)}
                        />
                      </td>
                    )}
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--cmp-brand)' }}>
                        {refText}
                      </span>
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <div style={{ fontWeight: 600 }}>{title}</div>
                      <div className="faint" style={{ fontSize: '12px' }}>{location}</div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {listing.purpose} {listing.typeLabel || listing.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{price}</td>
                    <td>
                      <span className="row" style={{ gap: '6px' }}>
                        <QualityScoreCircle score={qualityScore} size={18} strokeWidth={2.5} />
                        <strong>{qualityScore}</strong>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'grid', gap: '3px' }}>
                        <span
                          className={`badge ${
                            onHold
                              ? 'badge-danger'
                              : status === 'LIVE'
                              ? 'badge-brand'
                              : status === 'EXPIRED'
                              ? 'badge-warning'
                              : status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                        >
                          {onHold ? 'ON HOLD' : status}
                        </span>
                        {daysLeft !== null && (
                          <span className="faint" style={{ fontSize: '11px' }}>
                            {daysLeft === 0 ? 'Expiring today' : `${daysLeft}d left`}
                          </span>
                        )}
                        {status === 'EXPIRED' && (
                          <span className="faint" style={{ fontSize: '11px', color: '#b26b00' }}>
                            Publish again
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{agentName}</span>
                    </td>
                    <td style={{ textAlign: 'end' }}>
                      <div className="row" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                        {status === 'LIVE' && can('listings.update') && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Refresh / Bump Listing"
                            onClick={() => handleRefresh(listing)}
                          >
                            <RotateCw size={13} />
                          </button>
                        )}
                        {(status === 'UNPUBLISHED' || status === 'EXPIRED') && can('listings.publish') && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            title="Publish again"
                            onClick={() => handlePublish(listing)}
                          >
                            <CheckCircle2 size={13} />
                            <span>Publish</span>
                          </button>
                        )}
                        <NavLink to={`/properties/${listing.id}/edit`} className="btn btn-outline btn-sm">
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </NavLink>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
        >
          <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Reject listing</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              Explain to the agent what needs to be fixed before this listing can be approved.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Please upload clear photos of both bedrooms and attach Form A."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setRejectModal({ isOpen: false, listingId: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--cmp-danger)', color: '#FFF' }}
                onClick={handleConfirmReject}
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Agent Modal */}
      {assignModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Assign listing to agent</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              Choose which active agent will be the responsible listing agent.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label>Select Agent</label>
              <select
                value={assignModal.agentId}
                onChange={(e) => setAssignModal({ ...assignModal, agentId: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose active agent --</option>
                {activeTeamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.compliance?.brn ? `(BRN: ${m.compliance.brn})` : ''} - {m.role?.name || m.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAssignModal({ isOpen: false, listingId: null, agentId: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmAssign}
              >
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Agent Modal */}
      {bulkAssignModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Assign {selectedListingIds.size} listings to agent</h3>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              Select the active agent who will take over all {selectedListingIds.size} selected listings.
            </p>
            <div style={{ marginBottom: '18px' }}>
              <label>Select Agent</label>
              <select
                value={bulkAssignModal.agentId}
                onChange={(e) => setBulkAssignModal({ ...bulkAssignModal, agentId: e.target.value })}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose active agent --</option>
                {activeTeamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.compliance?.brn ? `(BRN: ${m.compliance.brn})` : ''} - {m.role?.name || m.role}
                  </option>
                ))}
              </select>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setBulkAssignModal({ isOpen: false, agentId: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!bulkAssignModal.agentId || isBulkLoading}
                onClick={() => {
                  const agentId = bulkAssignModal.agentId;
                  setBulkAssignModal({ isOpen: false, agentId: '' });
                  handleBulkAction('assign', agentId);
                }}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
