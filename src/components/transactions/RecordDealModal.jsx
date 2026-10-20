import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  User,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';

export default function RecordDealModal({
  isOpen,
  onClose,
  onSuccess,
  listing = null,
  initialData = null
}) {
  const { account, can, isLiveData } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [selectedListingId, setSelectedListingId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [finalPrice, setFinalPrice] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofDoc, setProofDoc] = useState(null); // { url, public_id, fileName }
  const [declared, setDeclared] = useState(false);

  // Dynamic lists if listing or agent not pre-selected
  const [availableListings, setAvailableListings] = useState([]);
  const [activeAgents, setActiveAgents] = useState([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Initialize or prefill state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (listing) {
      setSelectedListingId(listing.id || listing._id || '');
      setFinalPrice(listing.price || '');
      if (listing.listedBy?.id) {
        setAgentId(listing.listedBy.id);
      }
    } else if (initialData) {
      const initListing = initialData.listing || initialData;
      setSelectedListingId(initListing.id || initListing._id || initialData.listingId || '');
      setFinalPrice(initialData.finalPrice || initListing.price || initListing.askingPrice || '');
      setAgentId(initialData.agent?.id || initListing.listedBy?.id || initListing.agentId || account?.id || '');
      setCounterpartyName(initialData.counterpartyName || '');
      setNotes(initialData.notes || '');
    } else {
      setSelectedListingId('');
      setFinalPrice('');
      setAgentId(account?.id || '');
    }

    // Load active agents for assignment
    if (isLiveData && (can('listings.assign') || can('team.view'))) {
      cmpConnectApi.listMembers({ status: 'ACTIVE', limit: 100 })
        .then((res) => {
          if (res?.data) setActiveAgents(res.data);
        })
        .catch(() => {});
    }

    // Load listings if not opened from a specific listing
    if (!listing && !initialData && isLiveData) {
      cmpConnectApi.listListings({ limit: 50 })
        .then((res) => {
          if (res?.data) {
            // Filter to only LIVE, UNPUBLISHED, or EXPIRED listings that can be closed
            const eligible = res.data.filter((l) =>
              ['LIVE', 'UNPUBLISHED', 'EXPIRED'].includes(l.status)
            );
            setAvailableListings(eligible);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, listing, initialData, isLiveData, account, can]);

  if (!isOpen) return null;

  // Determine current active listing object
  const activeListing =
    listing ||
    (initialData?.listing ? initialData.listing : (initialData?.title ? initialData : null)) ||
    availableListings.find((l) => (l.id || l._id) === selectedListingId) ||
    null;

  const isRental =
    activeListing?.purpose === 'RENT' ||
    activeListing?.listingPurpose === 'RENT' ||
    activeListing?.offering?.includes('RENT');

  const docLabel = isRental
    ? 'Tenancy contract (Ejari proof)'
    : 'Form F (Sale agreement) or Title Transfer';

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Proof document size exceeds the 10 MB limit.');
      return;
    }

    setIsUploadingProof(true);
    setError(null);
    try {
      const sigRes = await cmpConnectApi.getTransactionUploadSignature();
      const sig = sigRes?.data?.document || sigRes?.data;
      if (!sig) throw new Error('Failed to obtain proof upload signature.');

      const uploaded = await cmpConnectApi.uploadTransactionProof(file, sig);
      setProofDoc(uploaded);
    } catch (err) {
      setError(err.message || 'Failed to upload proof document. Please try again.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const lid = selectedListingId || listing?.id || listing?._id;
    if (!lid) {
      setError('Please select a listing to record the closed deal.');
      return;
    }

    if (!finalPrice || Number(finalPrice) <= 0) {
      setError('Please enter a valid final closing price.');
      return;
    }

    if (!transactionDate) {
      setError('Please provide the transaction completion date.');
      return;
    }

    if (!proofDoc && isLiveData) {
      setError(`Please upload the required proof document (${docLabel}).`);
      return;
    }

    if (!declared) {
      setError('Please confirm that your agency took part in this transaction.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        listingId: lid,
        ...(agentId ? { agentId } : {}),
        transactionDate,
        finalPrice: Number(finalPrice),
        counterpartyName: counterpartyName.trim() || undefined,
        notes: notes.trim() || undefined,
        document: proofDoc || {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
          public_id: 'sample_doc',
          fileName: 'proof.pdf'
        },
        declared: true
      };

      if (isLiveData) {
        const txId = initialData?.id || initialData?._id;
        if (txId && (initialData?.status === 'UNCLAIMED' || initialData?.claimStatus === 'Not claimed')) {
          await cmpConnectApi.claimTransaction(txId, payload);
        } else {
          await cmpConnectApi.recordClosedDeal(payload);
        }
      }

      // Clear from unclaimed localStorage store if present
      try {
        const stored = JSON.parse(localStorage.getItem('cmp_unclaimed_transactions') || '[]');
        const updated = stored.filter((t) => t.listingId !== lid && t.id !== initialData?.id && t.id !== initialData?._id);
        localStorage.setItem('cmp_unclaimed_transactions', JSON.stringify(updated));
      } catch (e) {}

      onSuccess?.({
        message: 'Deal claimed and submitted for CMP verification.',
        listingId: lid
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit deal claim. Please check your inputs.');
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
        {/* Modal Header */}
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
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              Record a closed deal
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--cmp-text-muted)' }}>
              Mark this property as {isRental ? 'rented' : 'sold'} and submit proof for CMP verification.
            </p>
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--cmp-danger-subtle, rgba(220, 38, 38, 0.1))',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Target Listing Info */}
          {activeListing ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--cmp-surface-sunken)',
                border: '1px solid var(--cmp-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <Building size={20} style={{ color: 'var(--cmp-brand)', flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeListing.title || activeListing.propertyTitle || 'Listing'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
                  Ref: <strong style={{ color: 'var(--cmp-brand)' }}>{activeListing.listingRef || activeListing.id}</strong> · {activeListing.location || activeListing.propertyLocation || 'Dubai'} · {isRental ? 'Rent' : 'Sale'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Select Listing <span style={{ color: 'var(--cmp-danger)' }}>*</span>
              </label>
              <select
                value={selectedListingId}
                onChange={(e) => setSelectedListingId(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border)',
                  padding: '0 12px',
                  background: 'var(--cmp-surface)',
                  color: 'var(--cmp-text)',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Choose an active property --</option>
                {availableListings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.listingRef ? `[${l.listingRef}] ` : ''}{l.title} ({l.purpose})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Assigned Agent */}
          {activeAgents.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Closing Agent
              </label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border)',
                  padding: '0 12px',
                  background: 'var(--cmp-surface)',
                  color: 'var(--cmp-text)',
                  fontSize: '14px'
                }}
              >
                <option value="">Myself ({account?.fullName || 'Current user'})</option>
                {activeAgents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.fullName} {ag.compliance?.brn ? `(BRN: ${ag.compliance.brn})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Final Price & Transaction Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label htmlFor="deal-final-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                {isRental ? 'Annual Rent (AED)' : 'Final Sale Price (AED)'} <span style={{ color: 'var(--cmp-danger)' }}>*</span>
              </label>
              <input
                id="deal-final-price"
                type="number"
                min="1"
                placeholder="e.g. 1950000"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border)',
                  padding: '0 12px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label htmlFor="deal-date" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Completion Date <span style={{ color: 'var(--cmp-danger)' }}>*</span>
              </label>
              <input
                id="deal-date"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border)',
                  padding: '0 12px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* 4. Counterparty Name (Buyer / Tenant) */}
          <div>
            <label htmlFor="deal-counterparty" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              {isRental ? 'Tenant Full Name' : 'Buyer Full Name'} <span style={{ color: 'var(--cmp-text-faint)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="deal-counterparty"
              type="text"
              placeholder="e.g. Tariq Al Mansoori"
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                borderRadius: '8px',
                border: '1px solid var(--cmp-border)',
                padding: '0 12px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* 5. Proof Document Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Upload Proof Document <span style={{ color: 'var(--cmp-danger)' }}>*</span>
            </label>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
              {docLabel}. PDF, JPG, PNG up to 10 MB.
            </p>

            {proofDoc ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--cmp-brand-subtle)',
                  border: '1px solid var(--cmp-brand-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FileText size={18} style={{ color: 'var(--cmp-brand)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {proofDoc.fileName || 'Proof Document'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setProofDoc(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--cmp-danger)',
                    padding: '2px',
                    display: 'inline-flex'
                  }}
                  title="Remove document"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  border: '2px dashed var(--cmp-border)',
                  borderRadius: '10px',
                  cursor: isUploadingProof ? 'not-allowed' : 'pointer',
                  background: 'var(--cmp-surface-sunken)',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  disabled={isUploadingProof}
                  style={{ display: 'none' }}
                />
                {isUploadingProof ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cmp-brand)' }}>
                    <Loader2 size={20} className="animate-spin" />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Uploading proof to Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={24} style={{ color: 'var(--cmp-brand)', marginBottom: '6px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Click to browse proof file</span>
                    <span style={{ fontSize: '11px', color: 'var(--cmp-text-faint)', marginTop: '2px' }}>
                      Form F, Title Transfer, or Tenancy Contract (PDF/Image)
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* 6. Notes */}
          <div>
            <label htmlFor="deal-notes" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Notes <span style={{ color: 'var(--cmp-text-faint)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              id="deal-notes"
              rows={2}
              placeholder="Any additional deal or closing notes for CMP compliance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                borderRadius: '8px',
                border: '1px solid var(--cmp-border)',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 7. Declaration Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'var(--cmp-surface-sunken)',
              border: '1px solid var(--cmp-border)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--cmp-brand)' }}
            />
            <span style={{ fontSize: '12.5px', lineHeight: 1.4, color: 'var(--cmp-text)' }}>
              I confirm that our agency was directly involved in closing this transaction and the uploaded document is authentic.
            </span>
          </label>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '12px',
              borderTop: '1px solid var(--cmp-border)'
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading || isUploadingProof}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || isUploadingProof}
              style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Submit Deal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
