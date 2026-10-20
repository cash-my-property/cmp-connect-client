import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  CountBadge,
  Chip,
  SearchInput,
  QualityScoreCircle,
  Drawer
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
  { label: 'Sold', key: 'SOLD' },
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
    SOLD: 0,
    ARCHIVED: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Concept Drawers State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showDraftsInAll, setShowDraftsInAll] = useState(true);

  // Advanced Filters State
  const [advancedFilters, setAdvancedFilters] = useState({
    purpose: '',
    propertyType: '',
    tier: '',
    verification: '',
    priceMin: '',
    priceMax: '',
    beds: '',
    areaMin: '',
    areaMax: '',
    agentId: ''
  });

  // Visible Columns for Table View
  const [visibleColumns, setVisibleColumns] = useState([
    'property', 'agent', 'purpose', 'propertyType', 'bedrooms', 'area', 'status', 'exposure', 'price', 'quality', 'lastUpdated'
  ]);

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

  // Compute pending actions for any listing
  const getListingPendingActions = useCallback((l) => {
    const list = [];
    const st = String(l.status || '').toUpperCase();
    if (st === 'ARCHIVED') return list;
    if (!l.dldPermitNumber && !l.permitNumber) {
      list.push({ key: 'permit', label: 'Add the DLD permit number', kind: 'edit' });
    }
    if (st === 'REJECTED') {
      list.push({ key: 'rejected', label: 'Fix what was rejected and resubmit', kind: 'edit' });
    }
    const days = l.expiresAt ? Math.max(0, Math.ceil((new Date(l.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : l.expiresInDays;
    if (st === 'LIVE' && days != null && days <= 20) {
      list.push({ key: 'expiry', label: `Expires in ${days} days: publish again soon`, kind: 'renew' });
    }
    const q = l.qualityScore || 0;
    if (q < 70) {
      list.push({ key: 'quality', label: `Raise the quality score from ${q}`, kind: 'edit' });
    }
    return list;
  }, []);

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

  const baseListings = isLiveData ? liveListings : filteredMockListings;

  const displayListings = useMemo(() => {
    return baseListings.filter((l) => {
      // Drafts / Unpublished toggle when in 'All' tab
      if (activeFilter === 'All' && !showDraftsInAll) {
        const st = String(l.status || '').toUpperCase();
        if (st === 'DRAFT' || st === 'UNPUBLISHED') return false;
      }
      // Advanced Filters
      const f = advancedFilters;
      if (f.purpose && String(l.purpose || '').toUpperCase() !== f.purpose.toUpperCase()) return false;
      if (f.propertyType && String(l.typeLabel || l.propertyType || '').toLowerCase() !== f.propertyType.toLowerCase()) return false;
      if (f.tier && String(l.tier || '').toLowerCase() !== f.tier.toLowerCase()) return false;
      if (f.verification) {
        const ver = String(l.verificationStatus || l.verification || '').toLowerCase();
        if (f.verification === 'verified' && ver !== 'verified') return false;
        if (f.verification === 'pending' && ver !== 'pending') return false;
        if (f.verification === 'not-verified' && ver === 'verified') return false;
      }
      if (f.priceMin && Number(l.price || 0) < Number(f.priceMin)) return false;
      if (f.priceMax && Number(l.price || 0) > Number(f.priceMax)) return false;
      if (f.areaMin && Number(l.area || l.areaSqft || 0) < Number(f.areaMin)) return false;
      if (f.areaMax && Number(l.area || l.areaSqft || 0) > Number(f.areaMax)) return false;
      if (f.beds) {
        const b = String(l.bedrooms ?? l.beds ?? '');
        if (f.beds === 'studio' && b !== '0' && b !== 'Studio') return false;
        if (f.beds === '6+' && Number(b) < 6) return false;
        if (f.beds !== 'studio' && f.beds !== '6+' && b !== f.beds) return false;
      }
      if (f.agentId && (l.listedBy?.id || l.agentId) !== f.agentId) return false;
      return true;
    });
  }, [baseListings, activeFilter, showDraftsInAll, advancedFilters]);

  const activeAdvancedCount = useMemo(() => {
    return Object.values(advancedFilters).filter(Boolean).length;
  }, [advancedFilters]);

  const pendingList = useMemo(() => {
    return (isLiveData ? liveListings : mockListings)
      .map((l) => ({ l, actions: getListingPendingActions(l) }))
      .filter((x) => x.actions.length > 0);
  }, [isLiveData, liveListings, mockListings, getListingPendingActions]);

  const pendingCount = useMemo(() => {
    return pendingList.reduce((sum, item) => sum + item.actions.length, 0);
  }, [pendingList]);

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
      `Listing ${listing.listingRef || ''} submitted for approval.`
    );
  };

  const handleMoveToDraft = (listing) => {
    runListingAction(
      listing.id,
      () => cmpConnectApi.moveListingToDraft(listing.id, authToken),
      `Listing ${listing.listingRef || ''} moved back to Drafts.`
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

  // Mark as Sold / Rented (Step 1)
  // Calls POST /api/cmpConnect/listings/:id/mark-sold and adds deal to Transactions as UNCLAIMED
  const handleMarkSold = (listing) => {
    setOpenActionMenuId(null);
    const isRent = String(listing.purpose || '').toUpperCase() === 'RENT';
    runListingAction(
      listing.id,
      async () => {
        if (isLiveData) {
          await cmpConnectApi.markListingSold(listing.id, authToken).catch(() => {});
        }

        // Cache as UNCLAIMED in local storage so Transactions page shows it
        try {
          const txItem = {
            id: listing.listingRef || listing.id,
            listingId: listing.id,
            listing: {
              id: listing.id,
              listingRef: listing.listingRef || listing.id,
              title: listing.title || 'Untitled Property',
              location: listing.location || listing.community || 'Dubai',
              purpose: listing.purpose || (isRent ? 'RENT' : 'SALE'),
              category: listing.category || 'RESIDENTIAL',
              propertyType: listing.typeLabel || listing.propertyType || 'Apartment',
              bedrooms: listing.bedrooms ?? listing.beds,
              area: listing.area ?? listing.areaSqft,
              askingPrice: listing.price,
              coverImage: listing.coverImageWatermarked || listing.coverImage || listing.image
            },
            agent: {
              id: listing.listedBy?.id || listing.agentId || account?.id,
              fullName: listing.listedBy?.fullName || listing.agent || account?.fullName || 'Agent',
              brn: listing.listedBy?.compliance?.brn || listing.agentBrn || account?.compliance?.brn || ''
            },
            finalPrice: listing.price || 0,
            priceDisplay: formatPrice(listing.price, listing.rentalPeriod),
            badge: isRent ? 'Residential rent' : 'Residential sale',
            propertyType: listing.typeLabel || listing.propertyType || 'Apartment',
            status: 'UNCLAIMED',
            claimStatus: 'Not claimed',
            completedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            transactionDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          };

          const stored = JSON.parse(localStorage.getItem('cmp_unclaimed_transactions') || '[]');
          const remaining = stored.filter((t) => t.listingId !== listing.id && t.id !== txItem.id);
          localStorage.setItem('cmp_unclaimed_transactions', JSON.stringify([txItem, ...remaining]));
        } catch (e) {
          console.error('[Portfolio] Failed to cache unclaimed transaction:', e);
        }
      },
      `${listing.listingRef || listing.title} marked as ${isRent ? 'rented' : 'sold'}. Deal added to Transactions as 'Not claimed'.`
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
          <NavLink to="/rto" className="btn btn-outline btn-sm">
            <Radio size={16} />
            <span>Offers</span>
          </NavLink>

          {/* Export Dropdown Menu */}
          {can('listings.view') && (
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                title="Export listings"
              >
                {isExporting ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                <span>Export listings</span>
                <ChevronDown size={14} />
              </button>
              {exportMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: 0,
                    zIndex: 60,
                    minWidth: '220px',
                    background: 'var(--cmp-surface)',
                    border: '1px solid var(--cmp-border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--cmp-shadow-lg)',
                    padding: '6px'
                  }}
                  onClick={() => setExportMenuOpen(false)}
                >
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => handleExportCsv()}
                  >
                    <span>All listings ({isLiveData ? (liveCounts.all || liveListings.length) : mockListings.length})</span>
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => handleExportCsv()}
                  >
                    <span>Listings shown ({displayListings.length})</span>
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    disabled={selectedListingIds.size === 0}
                    onClick={() => handleExportCsv()}
                  >
                    <span>Selected listings ({selectedListingIds.size})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Select Listings Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${isBulkMode ? 'btn-primary' : 'btn-outline'}`}
            aria-pressed={isBulkMode}
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              if (isBulkMode) setSelectedListingIds(new Set());
            }}
          >
            <span>Select listings</span>
          </button>

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
          placeholder="City, community, building, title or reference"
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          maxWidth="330px"
        />

        {/* All Filters Button */}
        <button
          type="button"
          className={`btn btn-sm ${activeAdvancedCount ? 'btn-primary' : 'btn-outline'}`}
          style={{ height: '40px' }}
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
        >
          <SlidersHorizontal size={16} />
          <span>All filters{activeAdvancedCount ? ` (${activeAdvancedCount})` : ''}</span>
        </button>

        {/* Fixes to make Button */}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{
            height: '40px',
            borderColor: pendingCount > 0 ? 'var(--cmp-accent)' : undefined
          }}
          onClick={() => setPendingOpen(true)}
        >
          <Bell size={16} style={{ color: pendingCount > 0 ? 'var(--cmp-accent)' : undefined }} />
          <span>{pendingCount} {pendingCount === 1 ? 'fix' : 'fixes'} to make</span>
        </button>

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
            <option value="created_asc">Listing created: Oldest</option>
            <option value="price_desc">Price: Highest</option>
            <option value="price_asc">Price: Lowest</option>
            <option value="published_desc">Listing published: Newest</option>
            <option value="published_asc">Listing published: Oldest</option>
            <option value="updated">Last updated: Newest</option>
            <option value="quality">Quality score: Highest</option>
            <option value="views_desc">Views: Most</option>
            <option value="views_asc">Views: Fewest</option>
            <option value="leads_desc">Leads: Most</option>
            <option value="leads_asc">Leads: Fewest</option>
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

        {/* Choose Columns Button */}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ height: '40px', width: '40px', padding: 0 }}
          aria-label="Choose columns"
          title="Choose columns"
          onClick={() => {
            setViewMode('table');
            setCustomizeOpen(true);
          }}
        >
          <Sliders size={16} />
        </button>

        {/* Clear Filters Button */}
        {(searchQuery || activeAdvancedCount > 0) && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ height: '40px' }}
            onClick={() => {
              setSearchQuery('');
              setAdvancedFilters({
                purpose: '',
                propertyType: '',
                tier: '',
                verification: '',
                priceMin: '',
                priceMax: '',
                beds: '',
                areaMin: '',
                areaMax: '',
                agentId: ''
              });
            }}
          >
            Clear filters
          </button>
        )}

        {/* Drafts / Unpublished Switch on Right */}
        <span className="row" style={{ gap: '8px', marginInlineStart: 'auto', fontSize: '13px' }}>
          <span className="muted">Drafts / Unpublished</span>
          <button
            type="button"
            role="switch"
            aria-checked={showDraftsInAll}
            onClick={() => setShowDraftsInAll(!showDraftsInAll)}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              border: 'none',
              background: showDraftsInAll ? 'var(--cmp-brand)' : 'var(--cmp-border)',
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.2s'
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: showDraftsInAll ? '18px' : '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#FFFFFF',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            />
          </button>
        </span>
      </div>

      {/* Status Tabs Chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className="chip"
            aria-pressed={activeFilter === tab.label}
            onClick={() => setActiveFilter(tab.label)}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.85 }}>({tab.count})</span>
          </button>
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

            const isRent = String(listing.purpose || '').toUpperCase() === 'RENT';
            const isClosed = status === 'CLOSED' || status === 'SOLD' || status === 'RENTED';
            const statusDisplay = isClosed ? (isRent ? 'RENTED' : 'SOLD') : (status === 'PENDING_APPROVAL' ? 'IN REVIEW' : status);

            const canEdit = listing.can ? Boolean(listing.can.edit) : can('listings.update');
            const canSubmit = listing.can ? Boolean(listing.can.submit) : (['DRAFT', 'REJECTED'].includes(status) && can('listings.create'));
            const canApprove = listing.can ? Boolean(listing.can.approve) : (status === 'PENDING_APPROVAL' && can('listings.approve'));
            const canReject = listing.can ? Boolean(listing.can.reject) : (status === 'PENDING_APPROVAL' && can('listings.approve'));
            const canPublish = listing.can ? Boolean(listing.can.publish) : ((status === 'UNPUBLISHED' || status === 'EXPIRED') && can('listings.publish'));
            const canUnpublish = listing.can ? Boolean(listing.can.unpublish) : (status === 'LIVE' && can('listings.unpublish'));
            const canMoveToDraft = listing.can ? Boolean(listing.can.moveToDraft) : (['PENDING_APPROVAL', 'REJECTED', 'UNPUBLISHED', 'EXPIRED'].includes(status) && can('listings.update'));
            const canMarkSold = listing.can ? Boolean(listing.can.markSold || listing.can.recordDeal) : (!['ARCHIVED', 'CLOSED', 'SOLD', 'RENTED'].includes(status));
            const canAssign = listing.can ? Boolean(listing.can.assign) : (can('listings.assign') && status !== 'ARCHIVED');
            const canRefresh = listing.can ? Boolean(listing.can.refresh) : (status === 'LIVE' && can('listings.update'));
            const canArchive = listing.can ? Boolean(listing.can.archive) : (status !== 'ARCHIVED' && status !== 'PENDING_APPROVAL' && can('listings.archive'));
            const canRestore = listing.can ? Boolean(listing.can.restore) : (status === 'ARCHIVED' && can('listings.archive'));
            const canDelete = listing.can ? Boolean(listing.can.delete) : (status !== 'LIVE' && can('listings.delete'));

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
                            : isClosed
                            ? 'var(--cmp-accent, #c88228)'
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
                      {statusDisplay}
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
                    {!onHold && canEdit && (
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
                            {canEdit && (
                              <NavLink
                                to={`/properties/${listing.id}/edit`}
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                                onClick={() => setOpenActionMenuId(null)}
                              >
                                <Edit2 size={14} />
                                <span>Edit Details</span>
                              </NavLink>
                            )}

                            {/* Refresh Bump for Live Listings */}
                            {canRefresh && (
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
                            {canSubmit && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-brand)' }}
                                onClick={() => handleSubmitForApproval(listing)}
                              >
                                <Send size={14} />
                                <span>Submit for approval</span>
                              </button>
                            )}

                            {/* Move to Draft */}
                            {canMoveToDraft && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px' }}
                                onClick={() => handleMoveToDraft(listing)}
                              >
                                <RotateCcw size={14} />
                                <span>Move to draft</span>
                              </button>
                            )}

                            {/* Approve / Reject (Manager) */}
                            {canApprove && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-success)' }}
                                onClick={() => handleApprove(listing)}
                              >
                                <CheckCircle2 size={14} />
                                <span>Approve &amp; Publish</span>
                              </button>
                            )}
                            {canReject && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-danger)' }}
                                onClick={() => handleOpenRejectModal(listing)}
                              >
                                <XCircle size={14} />
                                <span>Reject with reason</span>
                              </button>
                            )}

                            {/* Unpublish */}
                            {canUnpublish && (
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
                            {canPublish && (
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
                            {canAssign && (
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

                            {/* Mark as Sold / Rented */}
                            {canMarkSold && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', borderRadius: 0, width: '100%', padding: '8px 14px', color: 'var(--cmp-accent, #c88228)' }}
                                onClick={() => handleMarkSold(listing)}
                              >
                                <Tag size={14} />
                                <span>{isRent ? 'Mark as rented' : 'Mark as sold'}</span>
                              </button>
                            )}

                            {/* Archive */}
                            {canArchive && (
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
                            {canRestore && (
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
                            {canDelete && (
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

                const isRent = String(listing.purpose || '').toUpperCase() === 'RENT';
                const isClosed = status === 'CLOSED' || status === 'SOLD' || status === 'RENTED';
                const statusDisplay = isClosed ? (isRent ? 'RENTED' : 'SOLD') : (status === 'PENDING_APPROVAL' ? 'IN REVIEW' : status);

                const canEdit = listing.can ? Boolean(listing.can.edit) : can('listings.update');
                const canSubmit = listing.can ? Boolean(listing.can.submit) : (['DRAFT', 'REJECTED'].includes(status) && can('listings.create'));
                const canPublish = listing.can ? Boolean(listing.can.publish) : ((status === 'UNPUBLISHED' || status === 'EXPIRED') && can('listings.publish'));
                const canMoveToDraft = listing.can ? Boolean(listing.can.moveToDraft) : (['PENDING_APPROVAL', 'REJECTED', 'UNPUBLISHED', 'EXPIRED'].includes(status) && can('listings.update'));
                const canMarkSold = listing.can ? Boolean(listing.can.markSold || listing.can.recordDeal) : (!['ARCHIVED', 'CLOSED', 'SOLD', 'RENTED'].includes(status));
                const canRefresh = listing.can ? Boolean(listing.can.refresh) : (status === 'LIVE' && can('listings.update'));

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
                              : isClosed
                              ? 'badge-accent'
                              : status === 'EXPIRED'
                              ? 'badge-warning'
                              : status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-neutral'
                          }`}
                        >
                          {onHold ? 'ON HOLD' : statusDisplay}
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
                        {canRefresh && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Refresh / Bump Listing"
                            onClick={() => handleRefresh(listing)}
                          >
                            <RotateCw size={13} />
                          </button>
                        )}
                        {canSubmit && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            title="Submit for approval"
                            onClick={() => handleSubmitForApproval(listing)}
                          >
                            <Send size={13} />
                            <span>Submit</span>
                          </button>
                        )}
                        {canMoveToDraft && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            title="Move to draft"
                            onClick={() => handleMoveToDraft(listing)}
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                        {canPublish && (
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
                        {canMarkSold && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            title={isRent ? 'Mark as Rented' : 'Mark as Sold'}
                            onClick={() => handleMarkSold(listing)}
                          >
                            <Tag size={13} />
                            <span>{isRent ? 'Rented' : 'Sold'}</span>
                          </button>
                        )}
                        {canEdit && (
                          <NavLink to={`/properties/${listing.id}/edit`} className="btn btn-outline btn-sm">
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </NavLink>
                        )}
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

      {/* Concept All Filters Drawer */}
      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="All filters"
        subtitle="Narrow your listings by property attributes, pricing, or compliance."
        width={420}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setAdvancedFilters({
                  purpose: '',
                  propertyType: '',
                  tier: '',
                  verification: '',
                  priceMin: '',
                  priceMax: '',
                  beds: '',
                  areaMin: '',
                  areaMax: '',
                  agentId: ''
                });
                setFiltersOpen(false);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setFiltersOpen(false)}
            >
              Save &amp; Apply
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <label>Purpose</label>
            <select
              value={advancedFilters.purpose}
              onChange={(e) => setAdvancedFilters((f) => ({ ...f, purpose: e.target.value }))}
            >
              <option value="">All purposes</option>
              <option value="SALE">Sale</option>
              <option value="RENT">Rent</option>
            </select>
          </div>

          <div>
            <label>Property type</label>
            <select
              value={advancedFilters.propertyType}
              onChange={(e) => setAdvancedFilters((f) => ({ ...f, propertyType: e.target.value }))}
            >
              <option value="">All property types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="penthouse">Penthouse</option>
              <option value="duplex">Duplex</option>
              <option value="office">Office</option>
              <option value="retail">Retail</option>
              <option value="warehouse">Warehouse</option>
              <option value="land">Plot / Land</option>
            </select>
          </div>

          <div>
            <label>Exposure tier</label>
            <select
              value={advancedFilters.tier}
              onChange={(e) => setAdvancedFilters((f) => ({ ...f, tier: e.target.value }))}
            >
              <option value="">All tiers</option>
              <option value="standard">Standard</option>
              <option value="featured">Featured</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label>Verification</label>
            <select
              value={advancedFilters.verification}
              onChange={(e) => setAdvancedFilters((f) => ({ ...f, verification: e.target.value }))}
            >
              <option value="">Any verification</option>
              <option value="verified">Verified only</option>
              <option value="pending">Pending verification</option>
              <option value="not-verified">Unverified</option>
            </select>
          </div>

          <div>
            <label>Bedrooms</label>
            <select
              value={advancedFilters.beds}
              onChange={(e) => setAdvancedFilters((f) => ({ ...f, beds: e.target.value }))}
            >
              <option value="">Any bedrooms</option>
              <option value="studio">Studio</option>
              <option value="1">1 Bedroom</option>
              <option value="2">2 Bedrooms</option>
              <option value="3">3 Bedrooms</option>
              <option value="4">4 Bedrooms</option>
              <option value="5">5 Bedrooms</option>
              <option value="6+">6+ Bedrooms</option>
            </select>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Min Price (AED)</label>
              <input
                type="number"
                placeholder="0"
                value={advancedFilters.priceMin}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, priceMin: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Max Price (AED)</label>
              <input
                type="number"
                placeholder="Any"
                value={advancedFilters.priceMax}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, priceMax: e.target.value }))}
              />
            </div>
          </div>

          <div className="row" style={{ gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label>Min Area (sqft)</label>
              <input
                type="number"
                placeholder="0"
                value={advancedFilters.areaMin}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, areaMin: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label>Max Area (sqft)</label>
              <input
                type="number"
                placeholder="Any"
                value={advancedFilters.areaMax}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, areaMax: e.target.value }))}
              />
            </div>
          </div>

          {activeTeamMembers.length > 0 && (
            <div>
              <label>Listed by Agent</label>
              <select
                value={advancedFilters.agentId}
                onChange={(e) => setAdvancedFilters((f) => ({ ...f, agentId: e.target.value }))}
              >
                <option value="">All agents</option>
                {activeTeamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Drawer>

      {/* Concept Fixes to Make Drawer */}
      <Drawer
        open={pendingOpen}
        onClose={() => setPendingOpen(false)}
        title={`${pendingCount} ${pendingCount === 1 ? 'fix' : 'fixes'} to make`}
        subtitle="Listings that need something before they can perform at their best."
        width={460}
      >
        {pendingList.length === 0 ? (
          <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
            Nothing needs attention right now. All properties are fully compliant.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
            {pendingList.map(({ l, actions }) => (
              <li key={l.id} className="card" style={{ padding: 14 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{l.title || 'Untitled Property'}</p>
                <p className="faint" style={{ margin: '2px 0 10px', fontSize: 12 }}>
                  {l.listingRef || l.id} · {l.listedBy?.fullName || l.agent || 'Agent'}
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                  {actions.map((a) => (
                    <li key={a.key} className="row" style={{ justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                      <span className="row" style={{ gap: 6 }}>
                        <AlertTriangle size={15} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />
                        <span>{a.label}</span>
                      </span>
                      {a.kind === 'verify' ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setPendingOpen(false);
                            runListingAction(l.id, () => cmpConnectApi.requestVerification(l.id, authToken), 'Verification requested.');
                          }}
                        >
                          Request
                        </button>
                      ) : (
                        <NavLink
                          to={`/properties/${l.id}/edit`}
                          className="btn btn-outline btn-sm"
                          onClick={() => setPendingOpen(false)}
                        >
                          Fix
                        </NavLink>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      {/* Concept Choose Columns Drawer */}
      <Drawer
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title="Customize columns"
        subtitle="Choose and order the columns shown in your table view."
        width={380}
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setVisibleColumns(['property', 'agent', 'purpose', 'propertyType', 'bedrooms', 'area', 'status', 'exposure', 'price', 'quality', 'lastUpdated']);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCustomizeOpen(false)}
            >
              Save &amp; Apply
            </button>
          </>
        }
      >
        <p className="faint" style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Available columns
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {[
            { id: 'property', label: 'Property details (Title & Community)' },
            { id: 'agent', label: 'Responsible Agent & BRN' },
            { id: 'purpose', label: 'Offering / Purpose (Sale/Rent)' },
            { id: 'propertyType', label: 'Property Type' },
            { id: 'bedrooms', label: 'Bedrooms' },
            { id: 'area', label: 'Built-up Area' },
            { id: 'status', label: 'Status' },
            { id: 'exposure', label: 'Exposure Tier' },
            { id: 'price', label: 'Price (AED)' },
            { id: 'quality', label: 'Quality Score' },
            { id: 'lastUpdated', label: 'Last Updated' }
          ].map((col) => {
            const isVisible = visibleColumns.includes(col.id);
            return (
              <li
                key={col.id}
                className="card row"
                style={{
                  gap: 10,
                  padding: '10px 12px',
                  background: isVisible ? 'var(--cmp-surface)' : 'var(--cmp-surface-sunken)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (isVisible) {
                    if (visibleColumns.length > 2) {
                      setVisibleColumns(visibleColumns.filter((c) => c !== col.id));
                    }
                  } else {
                    setVisibleColumns([...visibleColumns, col.id]);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => {}}
                  style={{ width: 18, height: 18, accentColor: 'var(--cmp-brand)' }}
                />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: isVisible ? 600 : 400 }}>
                  {col.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Drawer>
    </div>
  );
}
