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
  RotateCcw
} from 'lucide-react';
import { formatAED } from '../../utils';
import cmpConnectApi from '../../services/cmpConnectApi';
import { useApp } from '../../context/AppContext';

export default function ViewClaimModal({
  isOpen,
  onClose,
  dealId,
  initialDeal = null,
  onRecordAgain = null
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
          // Fallback to initial deal if fetch fails
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
  const status = deal.status || 'UNDER_REVIEW';

  const getStatusBadge = () => {
    switch (status) {
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
              color: 'var(--cmp-success)',
              background: 'color-mix(in srgb, var(--cmp-success) 12%, transparent)',
              border: '1px solid var(--cmp-success)'
            }}
          >
            <CheckCircle2 size={14} /> Approved
          </span>
        );
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
              color: 'var(--cmp-danger)',
              background: 'color-mix(in srgb, var(--cmp-danger) 12%, transparent)',
              border: '1px solid var(--cmp-danger)'
            }}
          >
            <AlertTriangle size={14} /> Rejected
          </span>
        );
      case 'UNDER_REVIEW':
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
              color: 'var(--cmp-warning)',
              background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
              border: '1px solid var(--cmp-warning)'
            }}
          >
            <Clock size={14} /> Under review
          </span>
        );
    }
  };

  const handleCopyRef = (ref) => {
    navigator.clipboard?.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(580px, 100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--cmp-surface)',
          border: '1px solid var(--cmp-border)',
          borderRadius: 'var(--cmp-radius-xl, 16px)',
          boxShadow: 'var(--cmp-shadow-lg)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--cmp-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cmp-surface-sunken)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              Transaction Claim Details
            </h2>
            {getStatusBadge()}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
            style={{ width: '32px', height: '32px', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Rejection Note Warning */}
          {status === 'REJECTED' && deal.reviewNote && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'var(--cmp-danger-subtle, rgba(220, 38, 38, 0.1))',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                fontSize: '13px'
              }}
            >
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Rejection Reason from CMP:</p>
              <p style={{ margin: 0 }}>{deal.reviewNote}</p>
            </div>
          )}

          {/* Under Review Notice */}
          {status === 'UNDER_REVIEW' && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--cmp-warning) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--cmp-warning) 30%, transparent)',
                color: 'var(--cmp-warning)',
                fontSize: '13px'
              }}
            >
              <p style={{ margin: 0 }}>
                This closed deal claim is currently under review by the Cash My Property compliance desk. Average review time: 3 working days.
              </p>
            </div>
          )}

          {/* Listing Card */}
          <div
            style={{
              padding: '14px',
              borderRadius: '10px',
              background: 'var(--cmp-surface-sunken)',
              border: '1px solid var(--cmp-border)',
              display: 'flex',
              gap: '14px',
              alignItems: 'center'
            }}
          >
            {listing.coverImage ? (
              <img
                src={listing.coverImage}
                alt={listing.title}
                style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '8px',
                  background: 'var(--cmp-brand-subtle)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--cmp-brand)'
                }}
              >
                <Building size={24} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>
                {listing.title || 'Untitled Property'}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: '12.5px', color: 'var(--cmp-text-muted)' }}>
                {listing.location || 'Dubai'} · {listing.offering || listing.purpose || 'Sale'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--cmp-text-faint)' }}>Ref:</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
                  {listing.listingRef || deal.listingRef || deal.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyRef(listing.listingRef || deal.id)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: 'var(--cmp-text-faint)' }}
                  title="Copy reference"
                >
                  {copied ? <Check size={12} style={{ color: 'var(--cmp-success)' }} /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Key Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px'
            }}
          >
            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--cmp-surface-sunken)', border: '1px solid var(--cmp-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--cmp-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Closing Price
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 800, color: 'var(--cmp-text)' }}>
                {deal.finalPrice ? `AED ${Number(deal.finalPrice).toLocaleString()}` : '—'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--cmp-surface-sunken)', border: '1px solid var(--cmp-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--cmp-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Completion Date
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--cmp-text)' }}>
                {deal.transactionDate ? new Date(deal.transactionDate).toLocaleDateString() : '—'}
              </p>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--cmp-surface-sunken)', border: '1px solid var(--cmp-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--cmp-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Outcome
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: 'var(--cmp-text)' }}>
                {deal.outcome === 'RENTED' ? 'Rented' : 'Sold'}
              </p>
            </div>
          </div>

          {/* Agent & Buyer Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--cmp-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--cmp-text-muted)', fontWeight: 600 }}>Closing Agent</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700 }}>
                {agent.fullName || '—'}
              </p>
              {agent.brn && (
                <span style={{ fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
                  BRN: {agent.brn}
                </span>
              )}
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--cmp-border)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--cmp-text-muted)', fontWeight: 600 }}>Buyer / Tenant</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700 }}>
                {deal.counterpartyName || 'Not specified'}
              </p>
            </div>
          </div>

          {/* Proof Document Link */}
          {doc && doc.url && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--cmp-surface-sunken)',
                border: '1px solid var(--cmp-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} style={{ color: 'var(--cmp-brand)' }} />
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                    {doc.fileName || 'Proof Document'}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--cmp-text-faint)' }}>
                    Uploaded on {deal.submittedAt ? new Date(deal.submittedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>View document</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Notes if any */}
          {deal.notes && (
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Notes:</span>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--cmp-text)' }}>
                {deal.notes}
              </p>
            </div>
          )}

          {/* History of Previous Attempts */}
          {Array.isArray(deal.attempts) && deal.attempts.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <History size={14} style={{ color: 'var(--cmp-text-muted)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cmp-text-muted)', textTransform: 'uppercase' }}>
                  Previous Submission History
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {deal.attempts.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--cmp-surface-sunken)',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{att.status}: {att.reviewNote || 'No notes provided'}</span>
                    <span style={{ color: 'var(--cmp-text-faint)' }}>
                      {att.transactionDate ? new Date(att.transactionDate).toLocaleDateString() : ''}
                    </span>
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
            borderTop: '1px solid var(--cmp-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cmp-surface-sunken)'
          }}
        >
          {status === 'REJECTED' && onRecordAgain ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                onRecordAgain(deal);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>Record again</span>
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
