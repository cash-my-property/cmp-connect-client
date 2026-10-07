import React, { useState, useMemo, useCallback, memo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Avatar,
  Badge,
  Chip,
  Dropdown,
  EmptyState,
  SearchInput
} from '../../components/ui';
import { formatAED } from '../../utils';
import { useDebounce } from '../../hooks';
import {
  Clock,
  Copy,
  Check,
  Bed,
  Maximize2,
  Inbox,
  X,
  ExternalLink,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

const REVIEW_STATUS_CHIPS = ['All', 'Approved', 'Under review', 'Rejected'];

const AGENT_OPTIONS = [
  { label: 'Assigned agent', value: '' },
  { label: 'All agents', value: '' },
  { label: 'Emma Clarke', value: 'Emma Clarke' },
  { label: 'Karim Saleh', value: 'Karim Saleh' },
  { label: 'Layla Haddad', value: 'Layla Haddad' },
  { label: 'Arjun Mehta', value: 'Arjun Mehta' }
];

const OFFERING_OPTIONS = [
  { label: 'Offering type', value: '' },
  { label: 'All offerings', value: '' },
  { label: 'Residential rent', value: 'Residential rent' },
  { label: 'Residential sale', value: 'Residential sale' },
  { label: 'Commercial rent', value: 'Commercial rent' },
  { label: 'Commercial sale', value: 'Commercial sale' }
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Property type', value: '' },
  { label: 'All property types', value: '' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Office', value: 'Office' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Penthouse', value: 'Penthouse' }
];

/**
 * Memoized Transaction Table Row matching concept transactions.html
 */
const TransactionRow = memo(function TransactionRow({
  item,
  copiedId,
  onCopyRef,
  onActionClick
}) {
  const isCopied = copiedId === item.id;

  const getClaimBadgeStyle = (status) => {
    switch (status) {
      case 'Approved':
        return {
          color: 'var(--cmp-success)',
          border: '1px solid color-mix(in srgb, var(--cmp-success) 55%, transparent)',
          background: 'color-mix(in srgb, var(--cmp-success) 10%, transparent)'
        };
      case 'Under review':
        return {
          color: 'var(--cmp-warning)',
          border: '1px solid color-mix(in srgb, var(--cmp-warning) 55%, transparent)',
          background: 'color-mix(in srgb, var(--cmp-warning) 10%, transparent)'
        };
      case 'Rejected':
        return {
          color: 'var(--cmp-danger)',
          border: '1px solid color-mix(in srgb, var(--cmp-danger) 55%, transparent)',
          background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)'
        };
      case 'Not claimed':
      default:
        return {
          color: 'var(--cmp-text-muted)',
          border: '1px solid color-mix(in srgb, var(--cmp-text-muted) 55%, transparent)',
          background: 'color-mix(in srgb, var(--cmp-text-muted) 10%, transparent)'
        };
    }
  };

  const getStatusDotColor = (status) => {
    if (status === 'Approved') return 'var(--cmp-success)';
    if (status === 'Under review') return 'var(--cmp-warning)';
    return 'var(--cmp-danger)';
  };

  return (
    <tr>
      {/* 1. Listing details */}
      <td style={{ minWidth: '300px' }}>
        <p className="row" style={{ margin: 0, gap: '8px' }}>
          <span
            aria-hidden="true"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: getStatusDotColor(item.claimStatus),
              flexShrink: 0
            }}
          />
          <strong>{item.priceDisplay}</strong>
          <span className="badge badge-neutral">{item.badge}</span>
        </p>

        <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 500 }}>
          {item.title}
        </p>

        <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
          {item.location}
        </p>

        <p className="row" style={{ margin: '6px 0 0', gap: '12px', fontSize: '13px' }}>
          {item.beds && (
            <span className="row" style={{ gap: '4px' }}>
              <Bed size={15} style={{ flexShrink: 0 }} />
              {item.beds}
            </span>
          )}
          {item.sqft && (
            <span className="row" style={{ gap: '4px' }}>
              <Maximize2 size={15} style={{ flexShrink: 0 }} />
              {item.sqft}
            </span>
          )}
        </p>
      </td>

      {/* 2. Reference no. */}
      <td>
        <span className="row" style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
          <button
            type="button"
            aria-label={`Copy ${item.id}`}
            title={isCopied ? 'Copied!' : 'Copy'}
            onClick={(e) => onCopyRef(item.id, e)}
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
            title={item.id}
            style={{
              color: 'var(--cmp-brand)',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {item.id}
          </span>
        </span>
      </td>

      {/* 3. Assigned agent */}
      <td style={{ whiteSpace: 'nowrap' }}>
        <span className="row" style={{ gap: '10px' }}>
          <Avatar initials={item.agentInitials} size={34} />
          <span>
            {item.agent}
            <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
              {item.agentBrn}
            </span>
          </span>
        </span>
      </td>

      {/* 4. Property type */}
      <td>{item.propertyType}</td>

      {/* 5. Status & Claim Badge */}
      <td style={{ whiteSpace: 'nowrap' }}>
        Completed
        <span className="faint" style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
          {item.completedDate}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            ...getClaimBadgeStyle(item.claimStatus)
          }}
        >
          {item.claimStatus}
        </span>
      </td>

      {/* 6. Actions */}
      <td>
        {item.claimStatus === 'Not claimed' ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onActionClick('claim', item)}
          >
            Claim transaction
          </button>
        ) : item.claimStatus === 'Rejected' ? (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => onActionClick('record', item)}
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
  const { transactions } = useApp();

  const [reviewFilter, setReviewFilter] = useState('All');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const [offeringType, setOfferingType] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const [copiedId, setCopiedId] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'claim' | 'view' | 'info'

  // Debounced search terms for high-performance typing
  const debouncedLocation = useDebounce(searchLocation, 200);
  const debouncedRef = useDebounce(refSearch, 200);

  // Filtered transactions matching all combined criteria
  const filteredTransactions = useMemo(() => {
    const locQuery = debouncedLocation.trim().toLowerCase();
    const refQuery = debouncedRef.trim().toLowerCase();

    return transactions.filter((tx) => {
      // Review status chip filter
      if (reviewFilter !== 'All' && tx.claimStatus !== reviewFilter) {
        return false;
      }

      // Location / City / Community search
      if (locQuery) {
        const matchesLoc =
          tx.location.toLowerCase().includes(locQuery) ||
          tx.title.toLowerCase().includes(locQuery);
        if (!matchesLoc) return false;
      }

      // Agent filter
      if (selectedAgent && tx.agent !== selectedAgent) {
        return false;
      }

      // Reference filter
      if (refQuery && !tx.id.toLowerCase().includes(refQuery)) {
        return false;
      }

      // Offering type filter
      if (offeringType && tx.offeringType !== offeringType) {
        return false;
      }

      // Property type filter
      if (propertyType && tx.propertyType !== propertyType) {
        return false;
      }

      return true;
    });
  }, [
    transactions,
    reviewFilter,
    debouncedLocation,
    selectedAgent,
    debouncedRef,
    offeringType,
    propertyType
  ]);

  const handleCopyRef = useCallback((id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleActionClick = useCallback((type, item) => {
    setModalItem(item);
    setModalType(type);
  }, []);

  const closeModal = useCallback(() => {
    setModalItem(null);
    setModalType(null);
  }, []);

  return (
    <div>
      {/* Top Header matching concept transactions.html */}
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
            Closed deals
          </h1>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <span className="row" style={{ gap: '14px', fontSize: '13px' }}>
            <span className="row muted" style={{ gap: '6px' }}>
              <Clock size={16} style={{ flexShrink: 0 }} />
              Data as of yesterday
            </span>
            <button
              type="button"
              onClick={() => setModalType('info')}
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--cmp-brand)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'inherit',
                fontFamily: 'inherit'
              }}
            >
              Learn more about claim transactions
            </button>
          </span>
        </div>
      </div>

      <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
        Record deals you closed on your own Cash My Property listings.
      </p>

      {/* Review Status Filter Chips */}
      <div
        className="row"
        role="group"
        aria-label="Review status"
        style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}
      >
        {REVIEW_STATUS_CHIPS.map((chip) => (
          <Chip
            key={chip}
            label={chip}
            active={reviewFilter === chip}
            onClick={() => setReviewFilter(chip)}
          />
        ))}
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
          label={selectedAgent || 'Assigned agent'}
          options={AGENT_OPTIONS}
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
            placeholder="Reference number"
            value={refSearch}
            onChange={(e) => setRefSearch(e.target.value)}
            style={{ height: '40px' }}
          />
        </div>

        {/* 4. Offering type */}
        <Dropdown
          label={offeringType || 'Offering type'}
          options={OFFERING_OPTIONS}
          selectedValue={offeringType}
          onSelect={(val) => setOfferingType(val)}
          width="100%"
        />

        {/* 5. Property type */}
        <Dropdown
          label={propertyType || 'Property type'}
          options={PROPERTY_TYPE_OPTIONS}
          selectedValue={propertyType}
          onSelect={(val) => setPropertyType(val)}
          width="100%"
        />
      </div>

      {/* Transactions Data Table */}
      {filteredTransactions.length > 0 ? (
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
              {filteredTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
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
          message="No transactions match the selected filters."
        />
      )}

      {/* Claim / View Claim / Info Modal Dialog */}
      {modalType && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 99,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            className="card"
            style={{
              width: 'min(520px, 100%)',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                {modalType === 'info'
                  ? 'Claim Transactions Guide'
                  : modalType === 'view'
                  ? `Claim Details: ${modalItem?.id}`
                  : `Record Closed Deal: ${modalItem?.id}`}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={closeModal}
                style={{ padding: '4px', height: '32px', width: '32px' }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {modalType === 'info' ? (
              <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                <p className="muted" style={{ marginTop: 0 }}>
                  By recording and claiming your closed deals on Cash My Property:
                </p>
                <ul style={{ paddingLeft: '20px', margin: '12px 0' }}>
                  <li>Your agency and agents earn verified transaction badges.</li>
                  <li>Increases your Quality Score and ranking in search results.</li>
                  <li>Unlock monthly rebate credits and exclusive portal perks.</li>
                </ul>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={closeModal}>
                    Got it
                  </button>
                </div>
              </div>
            ) : modalType === 'view' ? (
              <div>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--cmp-surface-sunken)',
                    marginBottom: '16px'
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '15px' }}>
                    {modalItem?.title}
                  </p>
                  <p className="muted" style={{ margin: '0 0 8px', fontSize: '13px' }}>
                    {modalItem?.location}
                  </p>
                  <div className="row" style={{ gap: '14px', fontSize: '13px' }}>
                    <span>
                      Closing Price: <strong>{modalItem?.priceDisplay}</strong>
                    </span>
                    <span>
                      Status: <strong>{modalItem?.claimStatus}</strong>
                    </span>
                  </div>
                </div>
                <p className="faint" style={{ fontSize: '13px' }}>
                  Claim verified on {modalItem?.completedDate} by Cash My Property compliance desk.
                </p>
                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(`Claim for ${modalItem?.id} submitted for review!`);
                  closeModal();
                }}
              >
                <p className="muted" style={{ fontSize: '14px', marginTop: 0 }}>
                  Upload proof of transfer or Form F to submit this deal for verification.
                </p>
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="deal-form-f">Form F / Title Deed Reference</label>
                  <input
                    id="deal-form-f"
                    placeholder="e.g. DLD-TR-2026-88190"
                    required
                    style={{ height: '40px' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="deal-buyer">Buyer / Tenant Name</label>
                  <input
                    id="deal-buyer"
                    placeholder="Full name of client"
                    required
                    style={{ height: '40px' }}
                  />
                </div>
                <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Submit Claim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
