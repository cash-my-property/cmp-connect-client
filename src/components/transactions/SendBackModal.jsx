import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import cmpConnectApi from '../../services/cmpConnectApi';

export default function SendBackModal({ isOpen, onClose, deal, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !deal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 3) {
      setError('Please provide a reason of at least 3 characters.');
      return;
    }
    if (trimmed.length > 500) {
      setError('Reason cannot exceed 500 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await cmpConnectApi.sendBackTransaction(deal.id || deal._id, trimmed);
      onSuccess?.('Deal sent back to agent.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send back transaction.');
    } finally {
      setLoading(false);
    }
  };

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
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(500px, 95vw)',
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
            padding: '16px 20px',
            borderBottom: '1px solid var(--cmp-border, #1f382f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--cmp-surface-sunken, #06130f)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--cmp-danger, #ef4444)',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--cmp-text, #fff)' }}>
                Send back to agent
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                {deal.listing?.listingRef || deal.listing?.title || 'Closed deal'}
              </p>
            </div>
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

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--cmp-danger, #ef4444)',
                color: 'var(--cmp-danger, #ef4444)',
                fontSize: '13px'
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="sendback-reason"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}
            >
              Reason for sending back <span style={{ color: 'var(--cmp-danger, #ef4444)' }}>*</span>
            </label>
            <textarea
              id="sendback-reason"
              rows={4}
              placeholder="e.g. The buyer's signature is missing on page 2, or the completion date does not match the Ejari contract."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={3}
              maxLength={500}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid var(--cmp-border, #1f382f)',
                background: 'var(--cmp-surface-sunken, #06130f)',
                color: 'var(--cmp-text, #fff)',
                padding: '10px 12px',
                fontSize: '13.5px',
                lineHeight: 1.5,
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)' }}>
              <span>The agent will see this note and can fix the details and submit again.</span>
              <span>{reason.length} / 500</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm"
              disabled={loading || reason.trim().length < 3}
              style={{
                background: 'var(--cmp-danger, #ef4444)',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>Send back deal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
