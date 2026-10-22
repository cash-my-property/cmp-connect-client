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
import { RecordDealModal, ViewClaimModal, SendBackModal } from '../../components/transactions';
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
  X,
  RotateCcw,
  CheckSquare
} from 'lucide-react';

const STATUS_KEYS = [
  { label: 'All', key: 'all' },
  { label: 'Claimed', key: 'CLAIMED' },
  { label: 'Submitted', key: 'SUBMITTED' },
  { label: 'Sent back', key: 'SENT_BACK' },
  { label: 'Pending contract', key: 'PENDING_CONTRACT' }
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
 * Normalise raw deal status into standard Section 10 statuses
 */
function normalizeStatus(rawStatus) {
  if (rawStatus === 'APPROVED' || rawStatus === 'CLAIMED') return 'CLAIMED';
  if (rawStatus === 'UNDER_REVIEW' || rawStatus === 'SUBMITTED') return 'SUBMITTED';
  if (rawStatus === 'REJECTED' || rawStatus === 'SENT_BACK') return 'SENT_BACK';
  return 'PENDING_CONTRACT';
}

/**
 * Memoized Transaction Table Row matching Section 10 specs
 */
const TransactionRow = memo(function TransactionRow({
  item,
  copiedId,
  onCopyRef,
  onActionClick
}) {
  const isCopied = copiedId === (item.listing?.listingRef || item.id);

  const listing = item.listing || {};
  const agent = item.agent || {};

  const displayPrice = item.finalPrice
    ? `AED ${Number(item.finalPrice).toLocaleString()}`
    : listing.askingPrice
    ? `AED ${Number(listing.askingPrice).toLocaleString()}`
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

  const status = normalizeStatus(item.status || item.claimStatus);

  const completedDate = item.transactionDate
    ? new Date(item.transactionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : item.closedAt
    ? new Date(item.closedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : item.completedDate || '—';

  const getStatusDotColor = () => {
    if (status === 'CLAIMED') return 'var(--cmp-success, #10b981)';
    if (status === 'SUBMITTED') return 'var(--cmp-warning, #f59e0b)';
    if (status === 'SENT_BACK') return 'var(--cmp-danger, #ef4444)';
    return 'var(--cmp-text-muted, #8ea399)';
  };

  const getStatusBadgeStyle = () => {
    if (status === 'CLAIMED') {
      return {
        color: 'var(--cmp-success, #10b981)',
        border: '1px solid var(--cmp-success, #10b981)',
        background: 'rgba(16, 185, 129, 0.12)'
      };
    }
    if (status === 'SUBMITTED') {
      return {
        color: 'var(--cmp-warning, #f59e0b)',
        border: '1px solid var(--cmp-warning, #f59e0b)',
        background: 'rgba(245, 158, 11, 0.12)'
      };
    }
    if (status === 'SENT_BACK') {
      return {
        color: 'var(--cmp-danger, #ef4444)',
        border: '1px solid var(--cmp-danger, #ef4444)',
        background: 'rgba(239, 68, 68, 0.12)'
      };
    }
    return {
      color: 'var(--cmp-text-muted, #8ea399)',
      border: '1px solid var(--cmp-border, #1f382f)',
      background: 'rgba(142, 163, 153, 0.12)'
    };
  };

  const statusLabel =
    status === 'CLAIMED' ? 'Claimed' :
    status === 'SUBMITTED' ? 'Submitted' :
    status === 'SENT_BACK' ? 'Sent back' :
    'Pending contract';

  const { isLiveData } = useApp();
  const can = isLiveData
    ? (item.can || {})
    : (item.can || {
        submit: status === 'PENDING_CONTRACT' || status === 'SENT_BACK',
        claim: status === 'SUBMITTED',
        sendBack: status === 'SUBMITTED'
      });

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
          title={status === 'SENT_BACK' && item.reviewNote ? item.reviewNote : undefined}
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
          {statusLabel}
        </span>
      </td>

      {/* 6. Actions driven by row.can */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {can.submit && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onActionClick('submit', item)}
            >
              {status === 'SENT_BACK' ? 'Submit again' : 'Submit contract'}
            </button>
          )}

          {can.claim && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onActionClick('claim', item)}
            >
              Claim
            </button>
          )}

          {can.sendBack && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => onActionClick('sendBack', item)}
              style={{
                color: 'var(--cmp-danger, #ef4444)',
                borderColor: 'var(--cmp-danger, #ef4444)'
              }}
            >
              Send back
            </button>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onActionClick('view', item)}
          >
            View
          </button>
        </div>
      </td>
    </tr>
  );
});

export default function TransactionsPage() {
  const { isLiveData, transactions: mockTransactions } = useApp();

  const [transactions, setTransactions] = useState([]);
  const [counts, setCounts] = useState({ all: 0, CLAIMED: 0, SUBMITTED: 0, SENT_BACK: 0, PENDING_CONTRACT: 0 });
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
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitInitialData, setSubmitInitialData] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewDealId, setViewDealId] = useState(null);
  const [viewInitialDeal, setViewInitialDeal] = useState(null);

  const [sendBackDeal, setSendBackDeal] = useState(null);
  const [confirmClaimDeal, setConfirmClaimDeal] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

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
      const allDeals = [...localUnclaimed, ...mockTransactions];
      const filtered = allDeals.filter((tx) => {
        if (statusFilter !== 'all') {
          const s = normalizeStatus(tx.status || tx.claimStatus);
          if (s !== statusFilter) return false;
        }
        return true;
      });
      setTransactions(filtered);
      setCounts({
        all: allDeals.length,
        CLAIMED: allDeals.filter((t) => normalizeStatus(t.status || t.claimStatus) === 'CLAIMED').length,
        SUBMITTED: allDeals.filter((t) => normalizeStatus(t.status || t.claimStatus) === 'SUBMITTED').length,
        SENT_BACK: allDeals.filter((t) => normalizeStatus(t.status || t.claimStatus) === 'SENT_BACK').length,
        PENDING_CONTRACT: allDeals.filter((t) => normalizeStatus(t.status || t.claimStatus) === 'PENDING_CONTRACT').length
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
        : combined.filter((d) => normalizeStatus(d.status) === statusFilter);

      setTransactions(visible);

      if (res?.counts) {
        setCounts({
          all: res.counts.all ?? combined.length,
          CLAIMED: (res.counts.CLAIMED || 0) + (res.counts.APPROVED || 0),
          SUBMITTED: (res.counts.SUBMITTED || 0) + (res.counts.UNDER_REVIEW || 0),
          SENT_BACK: (res.counts.SENT_BACK || 0) + (res.counts.REJECTED || 0),
          PENDING_CONTRACT: (res.counts.PENDING_CONTRACT || 0) + (res.counts.UNCLAIMED || 0)
        });
      } else {
        setCounts({
          all: combined.length,
          CLAIMED: combined.filter((t) => normalizeStatus(t.status) === 'CLAIMED').length,
          SUBMITTED: combined.filter((t) => normalizeStatus(t.status) === 'SUBMITTED').length,
          SENT_BACK: combined.filter((t) => normalizeStatus(t.status) === 'SENT_BACK').length,
          PENDING_CONTRACT: combined.filter((t) => normalizeStatus(t.status) === 'PENDING_CONTRACT').length
        });
      }
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
    if (type === 'submit') {
      setSubmitInitialData(item);
      setIsSubmitModalOpen(true);
    } else if (type === 'claim') {
      setConfirmClaimDeal(item);
    } else if (type === 'sendBack') {
      setSendBackDeal(item);
    } else if (type === 'view') {
      setViewDealId(item.id || item._id);
      setViewInitialDeal(item);
      setIsViewModalOpen(true);
    }
  }, []);

  const handleExecuteClaim = async () => {
    if (!confirmClaimDeal) return;
    setIsClaiming(true);
    try {
      await cmpConnectApi.claimTransaction(confirmClaimDeal.id || confirmClaimDeal._id);
      setConfirmClaimDeal(null);
      fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to claim transaction.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleOpenRecordNew = () => {
    setSubmitInitialData(null);
    setIsSubmitModalOpen(true);
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
            Finalise and claim deals closed on your company's Cash My Property listings.
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
            How closed deals work
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

      {/* Status Filter Chips with Counts */}
      <div
        className="row"
        role="group"
        aria-label="Deal status"
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

      {/* Filter and Control Bar Grid */}
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
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--cmp-danger, #ef4444)',
            color: 'var(--cmp-danger, #ef4444)',
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

      {/* Submit Contract Modal (Agent Step 2) */}
      <RecordDealModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSubmitInitialData(null);
        }}
        onSuccess={() => fetchTransactions()}
        initialData={submitInitialData}
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
        onSubmitContract={(deal) => {
          setSubmitInitialData(deal);
          setIsSubmitModalOpen(true);
        }}
        onClaim={(deal) => setConfirmClaimDeal(deal)}
        onSendBack={(deal) => setSendBackDeal(deal)}
      />

      {/* Send Back Modal (Company Step 3b) */}
      <SendBackModal
        isOpen={Boolean(sendBackDeal)}
        onClose={() => setSendBackDeal(null)}
        deal={sendBackDeal}
        onSuccess={() => {
          setSendBackDeal(null);
          fetchTransactions();
        }}
      />

      {/* Confirm Claim Dialog (Company Step 3a) */}
      {confirmClaimDeal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay, rgba(0, 0, 0, 0.7))',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setConfirmClaimDeal(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(460px, 95vw)',
              padding: '24px',
              background: 'var(--cmp-surface, #0b1a15)',
              border: '1px solid var(--cmp-border, #1f382f)',
              borderRadius: '16px',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--cmp-success, #10b981)',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <CheckCircle2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                Claim transaction?
              </h3>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: 'var(--cmp-text-muted, #8ea399)', lineHeight: 1.5 }}>
              This will finalise and complete the deal for{' '}
              <strong style={{ color: '#fff' }}>
                {confirmClaimDeal.listing?.title || confirmClaimDeal.listing?.listingRef || 'this property'}
              </strong>{' '}
              internally for your company.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmClaimDeal(null)}
                disabled={isClaiming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleExecuteClaim}
                disabled={isClaiming}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {isClaiming && <Loader2 size={14} className="animate-spin" />}
                <span>Claim deal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {isInfoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay, rgba(0, 0, 0, 0.7))',
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
              width: 'min(520px, 100%)',
              padding: '24px',
              background: 'var(--cmp-surface, #0b1a15)',
              border: '1px solid var(--cmp-border, #1f382f)',
              borderRadius: '16px',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>
                How closed deals work
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsInfoModalOpen(false)}
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--cmp-text, #fff)' }}>
              <p style={{ marginTop: 0, color: 'var(--cmp-text-muted, #8ea399)' }}>
                CMP Connect uses a 3-step internal workflow where deals are finalised within your company:
              </p>
              <ol style={{ paddingLeft: '20px', margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Step 1 (Agent):</strong> Properties ⋮ "Mark as sold / rented" — the listing becomes <em>Closed</em> and appears under Transactions as <em>Pending contract</em>.
                </li>
                <li>
                  <strong>Step 2 (Same Agent):</strong> "Submit contract" — the agent submits their Form F (sale) or Ejari (rent) contract, completion date, and final price. Status becomes <em>Submitted</em>.
                </li>
                <li>
                  <strong>Step 3 (Company Manager / Accounts):</strong> Review the contract. Click <em>Claim</em> to complete the transaction, or <em>Send back</em> with a reason if any document or detail needs fixing.
                </li>
              </ol>
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
