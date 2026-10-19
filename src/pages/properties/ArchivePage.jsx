import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Building,
  Archive,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

const defaultMockArchived = [
  {
    id: 'CMP-A-000991',
    listingRef: 'CMP-A-000991',
    title: 'Luxury 3 Bed Duplex with Private Pool',
    location: 'Palm Jumeirah',
    type: 'Penthouse',
    typeLabel: 'Penthouse',
    purpose: 'Sale',
    price: 12800000,
    archivedDate: '12 Sep 2026',
    reason: 'Sold via external network',
    agent: 'Layla Haddad',
    qualityScore: 92
  },
  {
    id: 'CMP-A-000985',
    listingRef: 'CMP-A-000985',
    title: 'Studio Apartment with Canal View',
    location: 'Business Bay',
    type: 'Apartment',
    typeLabel: 'Apartment',
    purpose: 'Rent',
    rentalPeriod: 'YEARLY',
    price: 65000,
    archivedDate: '01 Sep 2026',
    reason: 'Owner withdrawn listing',
    agent: 'Karim Saleh',
    qualityScore: 84
  }
];

export default function ArchivePage() {
  const { isLiveData, authToken, can } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Live API states
  const [archivedListings, setArchivedListings] = useState(() => (isLiveData ? [] : defaultMockArchived));
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Debounce search input for live API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-dismiss feedback message after 5 seconds
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => {
      setFeedbackMessage(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  // Fetch archived listings from live API or use mock
  const fetchArchivedListings = useCallback(async () => {
    if (!isLiveData) {
      setArchivedListings(defaultMockArchived);
      return;
    }
    if (!authToken) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const res = await cmpConnectApi.listListings(
        {
          status: 'ARCHIVED',
          search: debouncedSearch.trim() || undefined,
          sort: sortBy
        },
        authToken
      );

      if (Array.isArray(res?.data)) {
        setArchivedListings(res.data);
      } else {
        setArchivedListings([]);
      }
    } catch (err) {
      console.error('[ArchivePage] Failed to fetch archived listings:', err);
      setApiError(err.message || 'Failed to load archived listings.');
    } finally {
      setIsLoading(false);
    }
  }, [isLiveData, authToken, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchArchivedListings();
  }, [fetchArchivedListings]);

  // Copy Reference
  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Restore Single Listing (ARCHIVED -> DRAFT)
  const handleRestore = async (listingId, listingRef) => {
    setActionLoadingId(listingId);
    setFeedbackMessage(null);

    try {
      if (isLiveData && authToken) {
        await cmpConnectApi.restoreListing(listingId, authToken);
        setFeedbackMessage({
          type: 'success',
          text: `Listing ${listingRef || listingId} restored to active portfolio (Draft).`
        });
        await fetchArchivedListings();
      } else {
        setArchivedListings((prev) => prev.filter((l) => l.id !== listingId));
        setFeedbackMessage({
          type: 'success',
          text: `Listing ${listingRef || listingId} restored to active portfolio.`
        });
      }
    } catch (err) {
      console.error('[ArchivePage] Restore failed:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to restore listing.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Single Listing Permanently
  const handleDeletePermanently = async (listingId, listingRef) => {
    if (!window.confirm(`Permanently delete listing ${listingRef || listingId}? This action cannot be undone.`)) {
      return;
    }

    setActionLoadingId(listingId);
    setFeedbackMessage(null);

    try {
      if (isLiveData && authToken) {
        await cmpConnectApi.deleteListing(listingId, authToken);
        setFeedbackMessage({
          type: 'success',
          text: `Listing ${listingRef || listingId} permanently deleted.`
        });
        await fetchArchivedListings();
      } else {
        setArchivedListings((prev) => prev.filter((l) => l.id !== listingId));
        setFeedbackMessage({
          type: 'success',
          text: `Listing ${listingRef || listingId} permanently deleted.`
        });
      }
    } catch (err) {
      console.error('[ArchivePage] Delete failed:', err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to delete listing.'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bulk Actions (restore / delete)
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    setIsBulkLoading(true);
    setFeedbackMessage(null);

    try {
      if (isLiveData && authToken) {
        const res = await cmpConnectApi.bulkListingsAction(
          { ids: selectedIds, action },
          authToken
        );
        setFeedbackMessage({
          type: 'success',
          text: res?.message || `Successfully executed bulk ${action}.`
        });
        setSelectedIds([]);
        setIsSelectMode(false);
        await fetchArchivedListings();
      } else {
        setArchivedListings((prev) => prev.filter((l) => !selectedIds.includes(l.id)));
        setFeedbackMessage({
          type: 'success',
          text: `${selectedIds.length} listings ${action === 'restore' ? 'restored' : 'deleted'}.`
        });
        setSelectedIds([]);
        setIsSelectMode(false);
      }
    } catch (err) {
      console.error(`[ArchivePage] Bulk ${action} failed:`, err);
      setFeedbackMessage({
        type: 'error',
        text: err.message || `Bulk ${action} failed.`
      });
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Format Helpers
  const formatPrice = (price, rentalPeriod) => {
    if (price == null || price === '') return 'Price on Request';
    if (typeof price === 'string' && price.startsWith('AED')) return price;
    const num = Number(price);
    if (isNaN(num)) return String(price);
    const formatted = num >= 1000000
      ? `AED ${(num / 1000000).toFixed(2)}M`
      : `AED ${num.toLocaleString()}`;

    if (rentalPeriod) {
      const periodMap = {
        YEARLY: '/ yr',
        MONTHLY: '/ mo',
        WEEKLY: '/ wk',
        DAILY: '/ day'
      };
      return `${formatted} ${periodMap[rentalPeriod] || rentalPeriod}`;
    }
    return formatted;
  };

  const formatArchivedDate = (item) => {
    if (item.archivedDate) return item.archivedDate;
    const dateVal = item.updatedAt || item.createdAt;
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  const getReason = (item) => {
    return item.reason || item.holdReason || (item.status === 'ARCHIVED' ? 'Archived' : 'Archived');
  };

  const getAgentName = (item) => {
    return item.listedBy?.fullName || item.agent || '—';
  };

  // Local filtering for mock data
  const displayedListings = useMemo(() => {
    if (isLiveData) {
      return archivedListings;
    }
    const q = searchTerm.toLowerCase();
    return archivedListings.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      const ref = (item.listingRef || item.id || '').toLowerCase();
      const agent = getAgentName(item).toLowerCase();
      return title.includes(q) || location.includes(q) || ref.includes(q) || agent.includes(q);
    });
  }, [archivedListings, searchTerm, isLiveData]);

  // Select all helper
  const allIds = useMemo(() => displayedListings.map((l) => l.id), [displayedListings]);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  return (
    <div>
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`card row ${feedbackMessage.type === 'error' ? 'card-danger' : 'card-success'}`}
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: feedbackMessage.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            borderColor: feedbackMessage.type === 'error' ? 'var(--cmp-danger)' : 'var(--cmp-success)',
            color: feedbackMessage.type === 'error' ? 'var(--cmp-danger)' : 'var(--cmp-success)'
          }}
        >
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: '2px', height: 'auto', minWidth: 'auto' }}
            onClick={() => setFeedbackMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* API Error Banner */}
      {apiError && (
        <div
          className="card row card-danger"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'var(--cmp-danger)',
            color: 'var(--cmp-danger)'
          }}
        >
          <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{apiError}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={fetchArchivedListings}
          >
            Retry
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
            Archive
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
              {displayedListings.length}
            </span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Listings you or your team have archived. Restore them anytime back to your live portfolio.
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${isSelectMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setIsSelectMode(!isSelectMode);
              if (isSelectMode) setSelectedIds([]);
            }}
          >
            {isSelectMode ? 'Done selecting' : 'Select listings'}
          </button>
          <NavLink to="/properties" className="btn btn-sm btn-outline">
            Active portfolio
          </NavLink>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {(isSelectMode || selectedIds.length > 0) && (
        <div
          className="card row"
          style={{
            background: 'var(--cmp-surface-contrast, #1e293b)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '14px',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
              {selectedIds.length} of {displayedListings.length} selected
            </span>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: '#94a3b8', padding: '0 6px', fontSize: '12.5px' }}
              onClick={toggleSelectAll}
            >
              {isAllSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="row" style={{ gap: '8px' }}>
            {can('listings.archive') && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff', gap: '6px' }}
                disabled={selectedIds.length === 0 || isBulkLoading}
                onClick={() => handleBulkAction('restore')}
              >
                {isBulkLoading ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
                <span>Restore selected</span>
              </button>
            )}
            {can('listings.delete') && (
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: 'var(--cmp-danger)', color: '#fff', gap: '6px' }}
                disabled={selectedIds.length === 0 || isBulkLoading}
                onClick={() => {
                  if (window.confirm(`Permanently delete ${selectedIds.length} selected listings? This cannot be undone.`)) {
                    handleBulkAction('delete');
                  }
                }}
              >
                {isBulkLoading ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
                <span>Delete selected</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: '#fff' }}
              onClick={() => {
                setSelectedIds([]);
                setIsSelectMode(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div
        className="row"
        style={{
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '360px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          />
          <input
            id="archive-search"
            type="search"
            placeholder="City, community, building, title or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
          />
        </div>

        <div className="row" style={{ gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ height: '40px', gap: '6px' }}
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          >
            <ArrowUpDown size={15} />
            <span>Archived: {sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
          </button>

          <div className="segmented" style={{ height: '40px', padding: '3px' }}>
            <button
              type="button"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              aria-selected={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
            <Loader2 size={28} className="spin" style={{ color: 'var(--cmp-brand)' }} />
            <strong style={{ fontSize: '15px', color: 'var(--cmp-text)' }}>
              Loading archived listings...
            </strong>
          </div>
        </div>
      ) : displayedListings.length === 0 ? (
        <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--cmp-surface-sunken)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--cmp-text-faint)'
              }}
            >
              <Archive size={24} />
            </div>
            <strong style={{ fontSize: '17px', color: 'var(--cmp-text)' }}>
              No archived listings
            </strong>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px', maxWidth: '420px' }}>
              {searchTerm
                ? 'No archived listings matched your search query.'
                : 'Listings you archive will safely appear here. You can unarchive or permanently purge them whenever needed.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ marginTop: '8px' }}
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                {isSelectMode && (
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                )}
                <th>Reference</th>
                <th>Property</th>
                <th>Price & Type</th>
                <th>Archived date</th>
                <th>Reason</th>
                <th>Agent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedListings.map((item) => {
                const ref = item.listingRef || item.id;
                const cover = item.coverImageWatermarked || item.coverImage || (item.images?.[0]?.url || item.images?.[0]) || null;
                const isItemActionLoading = actionLoadingId === item.id;

                return (
                  <tr key={item.id}>
                    {isSelectMode && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, item.id]);
                            } else {
                              setSelectedIds(selectedIds.filter((id) => id !== item.id));
                            }
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <span className="row" style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(ref, e)}
                          title="Copy reference"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            cursor: 'pointer',
                            color: 'var(--cmp-text-faint)'
                          }}
                        >
                          {copiedId === ref ? (
                            <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <strong style={{ color: 'var(--cmp-text)', fontSize: '13px' }}>
                          {ref}
                        </strong>
                      </span>
                    </td>
                    <td>
                      <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              background: 'var(--cmp-surface-sunken)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: 'var(--cmp-surface-sunken)',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              color: 'var(--cmp-text-faint)'
                            }}
                          >
                            <Building size={18} />
                          </div>
                        )}
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--cmp-text)', display: 'block' }}>
                            {item.title || item.propertyTitle || 'Untitled Property'}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            {item.location || item.propertyLocation || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>
                        {formatPrice(item.price, item.rentalPeriod)}
                      </strong>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {item.purpose || 'Sale'} · {item.typeLabel || item.type || 'Property'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{formatArchivedDate(item)}</span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--cmp-surface-sunken)', color: 'var(--cmp-text-muted)' }}>
                        {getReason(item)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>{getAgentName(item)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }}>
                        {can('listings.archive') && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ height: '32px', padding: '0 10px', gap: '4px' }}
                            disabled={isItemActionLoading || isBulkLoading}
                            onClick={() => handleRestore(item.id, ref)}
                            title="Restore to active portfolio"
                          >
                            {isItemActionLoading ? (
                              <Loader2 size={13} className="spin" />
                            ) : (
                              <RotateCcw size={13} />
                            )}
                            <span>Restore</span>
                          </button>
                        )}
                        {can('listings.delete') && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ height: '32px', width: '32px', padding: 0, color: 'var(--cmp-danger)' }}
                            disabled={isItemActionLoading || isBulkLoading}
                            onClick={() => handleDeletePermanently(item.id, ref)}
                            title="Delete permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {displayedListings.map((item) => {
            const ref = item.listingRef || item.id;
            const cover = item.coverImageWatermarked || item.coverImage || (item.images?.[0]?.url || item.images?.[0]) || null;
            const isItemActionLoading = actionLoadingId === item.id;

            return (
              <article key={item.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Thumbnail / Header */}
                <div style={{ position: 'relative', height: '160px', background: 'var(--cmp-surface-sunken)' }}>
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--cmp-text-faint)' }}>
                      <Building size={32} />
                    </div>
                  )}

                  {isSelectMode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '6px',
                        padding: '4px',
                        zIndex: 2
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== item.id));
                          }
                        }}
                      />
                    </div>
                  )}

                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                    <span className="badge badge-warning" style={{ backdropFilter: 'blur(4px)' }}>
                      {getReason(item)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                    <span className="badge" style={{ background: 'var(--cmp-surface-sunken)', fontSize: '11.5px', flexShrink: 0 }}>
                      {ref}
                    </span>
                    <span className="faint" style={{ fontSize: '12px', flexShrink: 0 }}>
                      Archived: {formatArchivedDate(item)}
                    </span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <strong
                      title={item.title || item.propertyTitle || 'Untitled Property'}
                      style={{
                        fontSize: '15px',
                        color: 'var(--cmp-text)',
                        display: 'block',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.title || item.propertyTitle || 'Untitled Property'}
                    </strong>
                    <span
                      className="faint"
                      title={item.location || item.propertyLocation || '—'}
                      style={{
                        fontSize: '12.5px',
                        marginTop: '2px',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.location || item.propertyLocation || '—'}
                    </span>
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', marginTop: 'auto', paddingTop: '8px' }}>
                    <strong style={{ color: 'var(--cmp-text)' }}>
                      {formatPrice(item.price, item.rentalPeriod)}
                    </strong>
                    <span className="faint">
                      {item.purpose || 'Sale'} · {item.typeLabel || item.type || 'Property'}
                    </span>
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--cmp-border)', alignItems: 'center' }}>
                    <span className="faint" style={{ fontSize: '12px' }}>
                      Agent: {getAgentName(item)}
                    </span>
                    <div className="row" style={{ gap: '6px' }}>
                      {can('listings.archive') && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          disabled={isItemActionLoading || isBulkLoading}
                          onClick={() => handleRestore(item.id, ref)}
                          title="Restore to portfolio"
                        >
                          {isItemActionLoading ? (
                            <Loader2 size={13} className="spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          <span>Restore</span>
                        </button>
                      )}
                      {can('listings.delete') && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--cmp-danger)' }}
                          disabled={isItemActionLoading || isBulkLoading}
                          onClick={() => handleDeletePermanently(item.id, ref)}
                          title="Delete permanently"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

