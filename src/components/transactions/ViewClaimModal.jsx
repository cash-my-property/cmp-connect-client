import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  Copy,
  Check,
  User,
  History,
  RotateCcw,
  CheckSquare
} from 'lucide-react';
import { formatAED } from '../../utils';
import cmpConnectApi from '../../services/cmpConnectApi';
import { useApp } from '../../context/AppContext';

export default function ViewClaimModal({
  isOpen,
  onClose,
  dealId,
  initialDeal = null,
  onSubmitContract = null,
  onClaim = null,
  onSendBack = null
}) {
  const { isLiveData } = useApp();
  const [deal, setDeal] = useState(initialDeal);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !dealId) return;

    if (isLiveData) {
      setLoading(true);
      cmpConnectApi.getTransaction(dealId)
        .then((res) => {
          if (res?.data) setDeal(res.data);
        })
        .catch(() => {
          if (initialDeal) setDeal(initialDeal);
        })
        .finally(() => setLoading(false));
    } else {
      setDeal(initialDeal);
    }
  }, [isOpen, dealId, isLiveData, initialDeal]);

  if (!isOpen || !deal) return null;

  const listing = deal.listing || {};
  const agent = deal.agent || {};
  const doc = deal.document || null;
  const status = deal.status || 'PENDING_CONTRACT';

  const getStatusBadge = () => {
    switch (status) {
      case 'CLAIMED':
      case 'APPROVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--cmp-success, #10b981)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid var(--cmp-success, #10b981)'
            }}
          >
            <CheckCircle2 size={14} /> Claimed
          </span>
        );
      case 'SENT_BACK':
      case 'REJECTED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--cmp-danger, #ef4444)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--cmp-danger, #ef4444)'
            }}
          >
            <AlertTriangle size={14} /> Sent back
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--cmp-warning, #f59e0b)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid var(--cmp-warning, #f59e0b)'
            }}
          >
            <Clock size={14} /> Submitted
          </span>
        );
      case 'PENDING_CONTRACT':
      case 'UNCLAIMED':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--cmp-text-muted, #8ea399)',
              background: 'rgba(142, 163, 153, 0.12)',
              border: '1px solid var(--cmp-border, #1f382f)'
            }}
          >
            <Clock size={14} /> Pending contract
          </span>
        );
    }
  };

  const handleCopyRef = () => {
    const ref = listing.listingRef || deal.id;
    if (ref) {
      navigator.clipboard?.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const can = deal.can || {};

  return (
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
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(640px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--cmp-surface, #0b1a15)',
          border: '1px solid var(--cmp-border, #1f382f)',
          borderRadius: '16px',
          boxShadow: 'var(--cmp-shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--cmp-border, #1f382f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cmp-surface-sunken, #06130f)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--cmp-text, #fff)' }}>
              Closed Deal Details
            </h2>
            {getStatusBadge()}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close modal"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sent back banner if reviewNote exists */}
          {(status === 'SENT_BACK' || status === 'REJECTED') && deal.reviewNote && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--cmp-danger, #ef4444)',
                color: 'var(--cmp-danger, #ef4444)',
                fontSize: '13.5px',
                lineHeight: 1.5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <AlertTriangle size={18} />
                <strong style={{ fontSize: '14px' }}>Reason Sent Back:</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--cmp-text, #fff)' }}>{deal.reviewNote}</p>
            </div>
          )}

          {/* Listing details card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--cmp-surface-sunken, #06130f)',
              border: '1px solid var(--cmp-border, #1f382f)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--cmp-brand, #28a745)',
                    background: 'rgba(40, 167, 69, 0.1)',
                    marginBottom: '6px'
                  }}
                >
                  {deal.outcome || (listing.purpose === 'RENT' ? 'RENTED' : 'SOLD')}
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--cmp-text, #fff)' }}>
                  {listing.title || 'Untitled Property'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                  {listing.location || 'Dubai'} · {listing.typeLabel || listing.propertyType || 'Apartment'}
                  {listing.bedrooms ? ` · ${listing.bedrooms} Beds` : ''}
                  {listing.area ? ` · ${listing.area} ${listing.areaUnit || 'sqft'}` : ''}
                </p>
              </div>

              {/* Reference */}
              <button
                type="button"
                onClick={handleCopyRef}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--cmp-surface, #0b1a15)',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  cursor: 'pointer',
                  color: copied ? 'var(--cmp-success, #10b981)' : 'var(--cmp-brand, #28a745)',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{listing.listingRef || deal.id || '—'}</span>
              </button>
            </div>
          </div>

          {/* Pricing & Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--cmp-surface-sunken, #06130f)',
              border: '1px solid var(--cmp-border, #1f382f)'
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)', display: 'block' }}>
                Final Price:
              </span>
              <strong style={{ fontSize: '16px', color: 'var(--cmp-text, #fff)' }}>
                {deal.finalPrice ? formatAED(deal.finalPrice) : 'Pending'}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)', display: 'block' }}>
                Asking Price:
              </span>
              <span style={{ fontSize: '14px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                {deal.askingPrice ? formatAED(deal.askingPrice) : '—'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)', display: 'block' }}>
                Completion Date:
              </span>
              <span style={{ fontSize: '14px', color: 'var(--cmp-text, #fff)', fontWeight: 600 }}>
                {deal.transactionDate ? new Date(deal.transactionDate).toLocaleDateString() : deal.closedAt ? new Date(deal.closedAt).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>

          {/* Agent info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--cmp-surface-sunken, #06130f)',
              border: '1px solid var(--cmp-border, #1f382f)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(40, 167, 69, 0.15)',
                  color: 'var(--cmp-brand, #28a745)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                <User size={16} />
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: 'var(--cmp-text, #fff)' }}>
                  {agent.fullName || 'Assigned Agent'}
                </span>
                {agent.brn && (
                  <span style={{ fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                    BRN: {agent.brn}
                  </span>
                )}
              </div>
            </div>
            {deal.counterpartyName && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--cmp-text-muted, #8ea399)', display: 'block' }}>
                  Counterparty:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cmp-text, #fff)' }}>
                  {deal.counterpartyName}
                </span>
              </div>
            )}
          </div>

          {/* Uploaded Document */}
          {doc && doc.url ? (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cmp-text-muted, #8ea399)', display: 'block', marginBottom: '6px' }}>
                Contract Document:
              </span>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  color: 'var(--cmp-brand, #28a745)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <FileText size={16} />
                <span>{doc.fileName || 'View uploaded contract document'}</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--cmp-surface-sunken, #06130f)',
                border: '1px dashed var(--cmp-border, #1f382f)',
                color: 'var(--cmp-text-muted, #8ea399)',
                fontSize: '13px'
              }}
            >
              No contract document has been submitted yet.
            </div>
          )}

          {/* Notes */}
          {deal.notes && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cmp-text-muted, #8ea399)', display: 'block', marginBottom: '4px' }}>
                Notes:
              </span>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--cmp-text, #fff)', background: 'var(--cmp-surface-sunken, #06130f)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--cmp-border, #1f382f)' }}>
                {deal.notes}
              </p>
            </div>
          )}

          {/* History of Previous Attempts */}
          {Array.isArray(deal.attempts) && deal.attempts.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <History size={14} style={{ color: 'var(--cmp-text-muted, #8ea399)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cmp-text-muted, #8ea399)', textTransform: 'uppercase' }}>
                  Submission History ({deal.attempts.length})
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deal.attempts.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'var(--cmp-surface-sunken, #06130f)',
                      border: '1px solid var(--cmp-border, #1f382f)',
                      fontSize: '12.5px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--cmp-danger, #ef4444)' }}>
                        {att.status === 'REJECTED' || att.status === 'SENT_BACK' ? 'Sent back' : att.status}
                      </span>
                      <span style={{ color: 'var(--cmp-text-faint, #52665e)' }}>
                        {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {att.reviewNote && (
                      <p style={{ margin: 0, color: 'var(--cmp-text, #fff)', fontSize: '12px' }}>
                        Note: {att.reviewNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--cmp-border, #1f382f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cmp-surface-sunken, #06130f)',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {can.submit && onSubmitContract && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onSubmitContract(deal);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>{status === 'SENT_BACK' || status === 'REJECTED' ? 'Submit again' : 'Submit contract'}</span>
              </button>
            )}

            {can.claim && onClaim && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  onClaim(deal);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckSquare size={14} />
                <span>Claim deal</span>
              </button>
            )}

            {can.sendBack && onSendBack && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  onClose();
                  onSendBack(deal);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--cmp-danger, #ef4444)',
                  borderColor: 'var(--cmp-danger, #ef4444)'
                }}
              >
                <AlertTriangle size={14} />
                <span>Send back</span>
              </button>
            )}
          </div>

          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
