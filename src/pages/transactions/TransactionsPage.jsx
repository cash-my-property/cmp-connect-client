import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Avatar,
  Chip,
  Dropdown,
  EmptyState,
  SearchInput
} from '../../components/ui';
import { useDebounce } from '../../hooks';
import cmpConnectApi from '../../services/cmpConnectApi';
import { RecordDealModal, ViewClaimModal } from '../../components/transactions';
import {
  Clock,
  Copy,
  Check,
  Bed,
  Maximize2,
  Inbox,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';

const STATUS_KEYS = [
  { label: 'All', key: 'all' },
  { label: 'Not claimed', key: 'UNCLAIMED' },
  { label: 'Under review', key: 'UNDER_REVIEW' },
  { label: 'Approved', key: 'APPROVED' },
  { label: 'Rejected', key: 'REJECTED' }
];

const OFFERING_OPTIONS = [
  { label: 'All offerings', value: '' },
  { label: 'Residential rent', value: 'RESIDENTIAL_RENT' },
  { label: 'Residential sale', value: 'RESIDENTIAL_SALE' },
  { label: 'Commercial rent', value: 'COMMERCIAL_RENT' },
  { label: 'Commercial sale', value: 'COMMERCIAL_SALE' }
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'All property types', value: '' },
  { label: 'Apartment', value: 'APARTMENT' },
  { label: 'Villa', value: 'VILLA' },
  { label: 'Office', value: 'OFFICE' },
  { label: 'Townhouse', value: 'TOWNHOUSE' },
  { label: 'Penthouse', value: 'PENTHOUSE' }
];

/**
 * Memoized Transaction Table Row matching concept transactions.html & Section 10
 */
const TransactionRow = memo(function TransactionRow({
  item,
  copiedId,
  onCopyRef,
  onActionClick
}) {
  const isCopied = copiedId === (item.listing?.listingRef || item.id);

  // Normalise fields between API response and mock data
  const listing = item.listing || {};
  const agent = item.agent || {};

  const displayPrice = item.finalPrice
    ? `AED ${Number(item.finalPrice).toLocaleString()}`
    : item.priceDisplay || '—';

  const offeringLabel =
    listing.offering?.replace('_', ' ').toLowerCase() ||
    item.badge ||
    (listing.purpose === 'RENT' ? 'Residential rent' : 'Residential sale');

  const refNumber = listing.listingRef || item.id || '—';
  const agentName = agent.fullName || item.agent || '—';
  const agentBrn = agent.brn ? `BRN: ${agent.brn}` : item.agentBrn || '';
  const agentInitials =
    agentName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AG';

  const status = item.status || (item.claimStatus === 'Not claimed' ? 'UNCLAIMED' : item.claimStatus === 'Approved' ? 'APPROVED' : item.claimStatus === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW');
  const isUnclaimed = status === 'UNCLAIMED' || item.claimStatus === 'Not claimed';
  const completedDate = item.transactionDate
    ? new Date(item.transactionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : item.completedDate || '—';

  const getStatusDotColor = () => {
    if (isUnclaimed) return 'var(--cmp-text-muted, #888)';
    if (status === 'APPROVED') return 'var(--cmp-success)';
    if (status === 'UNDER_REVIEW') return 'var(--cmp-warning)';
    return 'var(--cmp-danger)';
  };

  const getStatusBadgeStyle = () => {
    if (isUnclaimed) {
      return {
        color: 'var(--cmp-text-muted, #718096)',
        border: '1px solid var(--cmp-border, #e2e8f0)',
        background: 'var(--cmp-surface-sunken, #f7fafc)'
      };
    }
    if (status === 'APPROVED') {
      return {
        color: 'var(--cmp-success)',
        border: '1px solid color-mix(in srgb, var(--cmp-success) 55%, transparent)',
        background: 'color-mix(in srgb, var(--cmp-success) 10%, transparent)'
      };
    }
    if (status === 'UNDER_REVIEW') {
      return {
        color: 'var(--cmp-warning)',
        border: '1px solid color-mix(in srgb, var(--cmp-warning) 55%, transparent)',
        background: 'color-mix(in srgb, var(--cmp-warning) 10%, transparent)'
      };
    }
    return {
      color: 'var(--cmp-danger)',
      border: '1px solid color-mix(in srgb, var(--cmp-danger) 55%, transparent)',
      background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)'
    };
  };

  return (
    <tr>
      {/* 1. Listing details */}
      <td style={{ minWidth: '280px' }}>
        <p className="row" style={{ margin: 0, gap: '8px', alignItems: 'center' }}>
          <span
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusDotColor(),
              flexShrink: 0
            }}
          />
          <strong>{displayPrice}</strong>
          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
            {offeringLabel}
          </span>
        </p>

        <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 600 }}>
          {listing.title || item.title || 'Property deal'}
        </p>

        <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
          {listing.location || item.location || 'Dubai'}
        </p>

        {(listing.bedrooms || listing.area || item.beds || item.sqft) && (
          <p className="row" style={{ margin: '6px 0 0', gap: '12px', fontSize: '13px' }}>
            {(listing.bedrooms || item.beds) && (
              <span className="row" style={{ gap: '4px' }}>
                <Bed size={15} style={{ flexShrink: 0 }} />
                {listing.bedrooms || item.beds} {typeof (listing.bedrooms || item.beds) === 'number' ? 'Beds' : ''}
              </span>
            )}
            {(listing.area || item.sqft) && (
              <span className="row" style={{ gap: '4px' }}>
                <Maximize2 size={15} style={{ flexShrink: 0 }} />
                {listing.area ? `${Number(listing.area).toLocaleString()} ${listing.areaUnit || 'sqft'}` : item.sqft}
              </span>
            )}
          </p>
        )}
      </td>

      {/* 2. Reference no. */}
      <td>
        <span className="row" style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            aria-label={`Copy ${refNumber}`}
            title={isCopied ? 'Copied!' : 'Copy reference'}
            onClick={(e) => onCopyRef(refNumber, e)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              color: isCopied ? 'var(--cmp-success)' : 'var(--cmp-text-faint)',
              display: 'inline-flex'
            }}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <span
            title={refNumber}
            style={{
              color: 'var(--cmp-brand)',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            {refNumber}
          </span>
        </span>
      </td>

      {/* 3. Assigned agent */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <span className="row" style={{ gap: '10px', alignItems: 'center' }}>
          <Avatar initials={agentInitials} size={34} />
          <span>
            {agentName}
            {agentBrn && (
              <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                {agentBrn}
              </span>
            )}
          </span>
        </span>
      </td>

      {/* 4. Property type */}
      <td>{listing.typeLabel || listing.propertyType || item.propertyType || 'Apartment'}</td>

      {/* 5. Status & Completion Date */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '13px', color: 'var(--cmp-text)' }}>Completed</span>
        <span className="faint" style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          {completedDate}
        </span>
        <span
          title={status === 'REJECTED' && item.reviewNote ? item.reviewNote : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            ...getStatusBadgeStyle()
          }}
        >
          {isUnclaimed
            ? 'Not claimed'
            : status === 'APPROVED'
            ? 'Approved'
            : status === 'REJECTED'
            ? 'Rejected'
            : 'Under review'}
        </span>
      </td>

      {/* 6. Actions */}
      <td>
        {isUnclaimed ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onActionClick('claim', item)}
          >
            Claim transaction
          </button>
        ) : status === 'REJECTED' ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onActionClick('recordAgain', item)}
          >
            Record again
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onActionClick('view', item)}
          >
            View claim
          </button>
        )}
      </td>
    </tr>
  );
});

export default function TransactionsPage() {
  const { isLiveData, transactions: mockTransactions } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [counts, setCounts] = useState({ all: 0, UNCLAIMED: 0, UNDER_REVIEW: 0, APPROVED: 0, REJECTED: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const [offeringType, setOfferingType] = useState('');
  const [propertyType, setPropertyType] = useState('');

  // Agents list for filter
  const [agentsList, setAgentsList] = useState([]);

  // Modals state
  const [copiedId, setCopiedId] = useState(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordInitialData, setRecordInitialData] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewDealId, setViewDealId] = useState(null);
  const [viewInitialDeal, setViewInitialDeal] = useState(null);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Debounced search
  const debouncedLocation = useDebounce(searchLocation, 300);
  const debouncedRef = useDebounce(refSearch, 300);

  // Load active agents for dropdown
  useEffect(() => {
    if (isLiveData) {
      cmpConnectApi.listMembers({ status: 'ACTIVE', limit: 100 })
        .then((res) => {
          if (res?.data) {
            setAgentsList(res.data.map((m) => ({ label: m.fullName, value: m.id })));
          }
        })
        .catch(() => {});
    }
  }, [isLiveData]);

  // Fetch transactions from API or mock
  const fetchTransactions = useCallback(async () => {
    let localUnclaimed = [];
    try {
      localUnclaimed = JSON.parse(localStorage.getItem('cmp_unclaimed_transactions') || '[]');
    } catch {}

    if (!isLiveData) {
      // Mock data filter
      const allDeals = [...localUnclaimed, ...mockTransactions];
      const filtered = allDeals.filter((tx) => {
        if (statusFilter !== 'all') {
          const s = tx.status || (tx.claimStatus === 'Not claimed' ? 'UNCLAIMED' : tx.claimStatus === 'Approved' ? 'APPROVED' : tx.claimStatus === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW');
          if (s !== statusFilter) return false;
        }
        return true;
      });
      setTransactions(filtered);
      setCounts({
        all: allDeals.length,
        UNCLAIMED: allDeals.filter((t) => t.status === 'UNCLAIMED' || t.claimStatus === 'Not claimed').length,
        APPROVED: allDeals.filter((t) => t.status === 'APPROVED' || t.claimStatus === 'Approved').length,
        UNDER_REVIEW: allDeals.filter((t) => t.status === 'UNDER_REVIEW' || t.claimStatus === 'Under review').length,
        REJECTED: allDeals.filter((t) => t.status === 'REJECTED' || t.claimStatus === 'Rejected').length
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await cmpConnectApi.listTransactions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedLocation || undefined,
        ref: debouncedRef || undefined,
        agentId: selectedAgent || undefined,
        offering: offeringType || undefined,
        propertyType: propertyType || undefined,
        limit: 50
      });

      const serverDeals = res?.data || [];
      const combined = [
        ...localUnclaimed.filter((u) => !serverDeals.some((s) => s.id === u.id || s.listing?.id === u.listingId)),
        ...serverDeals
      ];

      const visible = statusFilter === 'all'
        ? combined
        : combined.filter((d) => (d.status === statusFilter) || (statusFilter === 'UNCLAIMED' && d.claimStatus === 'Not claimed'));

      setTransactions(visible);

      const dynamicCounts = {
        all: combined.length,
        UNCLAIMED: combined.filter((t) => t.status === 'UNCLAIMED' || t.claimStatus === 'Not claimed').length,
        UNDER_REVIEW: combined.filter((t) => t.status === 'UNDER_REVIEW' || t.claimStatus === 'Under review').length,
        APPROVED: combined.filter((t) => t.status === 'APPROVED' || t.claimStatus === 'Approved').length,
        REJECTED: combined.filter((t) => t.status === 'REJECTED' || t.claimStatus === 'Rejected').length
      };
      setCounts(dynamicCounts);
    } catch (err) {
      setError(err.message || 'Failed to load closed deals.');
    } finally {
      setLoading(false);
    }
  }, [
    isLiveData,
    mockTransactions,
    statusFilter,
    debouncedLocation,
    debouncedRef,
    selectedAgent,
    offeringType,
    propertyType
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCopyRef = useCallback((ref, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(ref);
    setCopiedId(ref);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleActionClick = useCallback((type, item) => {
    if (type === 'claim' || type === 'recordAgain') {
      setRecordInitialData(item);
      setIsRecordModalOpen(true);
    } else if (type === 'view') {
      setViewDealId(item.id || item._id);
      setViewInitialDeal(item);
      setIsViewModalOpen(true);
    }
  }, []);

  const handleOpenRecordNew = () => {
    setRecordInitialData(null);
    setIsRecordModalOpen(true);
  };

  const handleRecordSuccess = (msg) => {
    fetchTransactions();
  };

  return (
    <div>
      {/* Top Header matching concept transactions.html & Section 10 */}
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
            Closed deals
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--cmp-text-muted)' }}>
            Record deals you closed on your own Cash My Property listings.
          </p>
        </div>

        <div className="row" style={{ gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsInfoModalOpen(true)}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--cmp-brand)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            Learn more about closed deals
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenRecordNew}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Record a closed deal</span>
          </button>
        </div>
      </div>

      {/* Review Status Filter Chips with Counts */}
      <div
        className="row"
        role="group"
        aria-label="Review status"
        style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}
      >
        {STATUS_KEYS.map((chip) => {
          const count = counts[chip.key] ?? 0;
          return (
            <Chip
              key={chip.key}
              label={`${chip.label}${count !== undefined ? ` (${count})` : ''}`}
              active={statusFilter === chip.key}
              onClick={() => setStatusFilter(chip.key)}
            />
          );
        })}
      </div>

      {/* Filter and Control Bar Grid matching concept */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 2fr) repeat(4, minmax(160px, 1fr))',
          gap: '10px',
          margin: '14px 0'
        }}
      >
        {/* 1. Location search */}
        <SearchInput
          id="tx-search"
          placeholder="City, community or building"
          value={searchLocation}
          onChange={setSearchLocation}
          onClear={() => setSearchLocation('')}
          maxWidth="100%"
        />

        {/* 2. Assigned agent */}
        <Dropdown
          label={
            agentsList.find((a) => a.value === selectedAgent)?.label || 'All agents'
          }
          options={[{ label: 'All agents', value: '' }, ...agentsList]}
          selectedValue={selectedAgent}
          onSelect={(val) => setSelectedAgent(val)}
          width="100%"
        />

        {/* 3. Reference number input */}
        <div>
          <label htmlFor="tx-ref" className="visually-hidden">
            Reference number
          </label>
          <input
            id="tx-ref"
            placeholder="Reference (CLID-...)"
            value={refSearch}
            onChange={(e) => setRefSearch(e.target.value)}
            style={{ height: '40px', width: '100%', borderRadius: '8px' }}
          />
        </div>

        {/* 4. Offering type */}
        <Dropdown
          label={
            OFFERING_OPTIONS.find((o) => o.value === offeringType)?.label || 'Offering type'
          }
          options={OFFERING_OPTIONS}
          selectedValue={offeringType}
          onSelect={(val) => setOfferingType(val)}
          width="100%"
        />

        {/* 5. Property type */}
        <Dropdown
          label={
            PROPERTY_TYPE_OPTIONS.find((p) => p.value === propertyType)?.label || 'Property type'
          }
          options={PROPERTY_TYPE_OPTIONS}
          selectedValue={propertyType}
          onSelect={(val) => setPropertyType(val)}
          width="100%"
        />
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div style={{ display: 'grid', placeItems: 'center', padding: '60px 20px', gap: '12px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--cmp-brand)' }} />
          <span style={{ fontSize: '14px', color: 'var(--cmp-text-muted)' }}>Loading closed deals...</span>
        </div>
      ) : error ? (
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            background: 'var(--cmp-danger-subtle, rgba(220, 38, 38, 0.1))',
            border: '1px solid var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            textAlign: 'center',
            margin: '20px 0'
          }}
        >
          <AlertTriangle size={24} style={{ margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Unable to load transactions</p>
          <p style={{ fontSize: '13px', margin: '0 0 12px' }}>{error}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={fetchTransactions}>
            Try again
          </button>
        </div>
      ) : transactions.length > 0 ? (
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Listing details</th>
                <th>Reference no.</th>
                <th>Assigned agent</th>
                <th>Property type</th>
                <th>Status</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <TransactionRow
                  key={tx.id || tx._id}
                  item={tx}
                  copiedId={copiedId}
                  onCopyRef={handleCopyRef}
                  onActionClick={handleActionClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<Inbox size={32} />}
          message="No closed deals match the selected criteria."
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleOpenRecordNew}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} />
              <span>Record your first deal</span>
            </button>
          }
        />
      )}

      {/* Record a Closed Deal Modal */}
      <RecordDealModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordInitialData(null);
        }}
        onSuccess={handleRecordSuccess}
        initialData={recordInitialData}
      />

      {/* View Claim Details Modal */}
      <ViewClaimModal
        isOpen={isViewModalOpen}
        dealId={viewDealId}
        initialDeal={viewInitialDeal}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewDealId(null);
          setViewInitialDeal(null);
        }}
        onRecordAgain={(deal) => {
          setRecordInitialData(deal);
          setIsRecordModalOpen(true);
        }}
      />

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(500px, 100%)',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Closed Deals on CMP</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsInfoModalOpen(false)}
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--cmp-text)' }}>
              <p className="muted" style={{ marginTop: 0 }}>
                When an agent closes a deal on a live or marketed property, recording it ensures:
              </p>
              <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                <li>The listing moves off-market cleanly to <strong>CLOSED</strong> (Sold / Rented).</li>
                <li>Your agency and agents earn verified transaction credentials.</li>
                <li>Compliance verification ensures prompt proof audit by CMP within 3 working days.</li>
              </ul>
              <div style={{ textAlign: 'right', marginTop: '20px' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsInfoModalOpen(false)}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
