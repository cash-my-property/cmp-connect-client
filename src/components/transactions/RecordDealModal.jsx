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
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';

function formatListingOptionLabel(l) {
  const ref = l.listingRef ? `[${l.listingRef}] ` : '';
  const purpose = l.purpose ? ` (${l.purpose})` : '';
  const rawTitle = String(l.title || l.propertyTitle || 'Listing').trim();
  const maxTitleLength = 32;
  const shortTitle =
    rawTitle.length > maxTitleLength ? `${rawTitle.slice(0, maxTitleLength).trim()}…` : rawTitle;
  return `${ref}${shortTitle}${purpose}`;
}

export default function RecordDealModal({
  isOpen,
  onClose,
  onSuccess,
  listing = null,
  initialData = null
}) {
  const { account, isLiveData } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form fields
  const [selectedListingId, setSelectedListingId] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [finalPrice, setFinalPrice] = useState('');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [notes, setNotes] = useState('');
  const [proofDoc, setProofDoc] = useState(null); // { url, public_id, fileName }
  const [declared, setDeclared] = useState(false);

  // Dynamic lists if listing not pre-selected
  const [availableListings, setAvailableListings] = useState([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Pre-fill state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    if (initialData) {
      const initListing = initialData.listing || initialData;
      setSelectedListingId(initListing.id || initListing._id || initialData.listingId || '');
      setFinalPrice(initialData.finalPrice || initListing.price || initListing.askingPrice || '');
      setCounterpartyName(initialData.counterpartyName || '');
      setNotes(initialData.notes || '');
      if (initialData.transactionDate) {
        setTransactionDate(new Date(initialData.transactionDate).toISOString().split('T')[0]);
      } else if (initialData.closedAt) {
        setTransactionDate(new Date(initialData.closedAt).toISOString().split('T')[0]);
      }
      if (initialData.document?.url) {
        setProofDoc(initialData.document);
      } else {
        setProofDoc(null);
      }
      setDeclared(false);
    } else if (listing) {
      setSelectedListingId(listing.id || listing._id || '');
      setFinalPrice(listing.price || listing.askingPrice || '');
      setCounterpartyName('');
      setNotes('');
      setProofDoc(null);
      setDeclared(false);
    } else {
      setSelectedListingId('');
      setFinalPrice('');
      setCounterpartyName('');
      setNotes('');
      setProofDoc(null);
      setDeclared(false);
    }

    // Load listings if not opened from a specific deal/listing
    if (!listing && !initialData && isLiveData) {
      cmpConnectApi.listListings({ limit: 50 })
        .then((res) => {
          if (res?.data) {
            const eligible = res.data.filter((l) =>
              ['LIVE', 'UNPUBLISHED', 'EXPIRED', 'CLOSED'].includes(l.status)
            );
            setAvailableListings(eligible);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, listing, initialData, isLiveData]);

  if (!isOpen) return null;

  const activeListing =
    initialData?.listing ||
    listing ||
    (initialData?.title ? initialData : null) ||
    availableListings.find((l) => (l.id || l._id) === selectedListingId) ||
    null;

  const isRental =
    activeListing?.purpose === 'RENT' ||
    activeListing?.listingPurpose === 'RENT' ||
    activeListing?.offering?.includes('RENT') ||
    initialData?.outcome === 'RENTED';

  const docTitle = isRental ? 'Tenancy contract (Ejari)' : 'Form F (Sale agreement)';
  const docSubtitle = isRental ? 'Tenancy contract or registered Ejari proof' : 'Signed Form F or DLD title transfer document';

  const isSentBack = initialData?.status === 'SENT_BACK' || initialData?.status === 'REJECTED';
  const reviewNote = initialData?.reviewNote;
  const dealAgent = initialData?.agent || (activeListing?.listedBy?.fullName ? activeListing.listedBy : null) || account;

  const handleSelectListing = (e) => {
    const val = e.target.value;
    setSelectedListingId(val);
    const chosen = availableListings.find((l) => (l.id || l._id) === val);
    if (chosen) {
      if (chosen.price && !finalPrice) {
        setFinalPrice(chosen.price);
      }
    }
  };

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
      setError(err.message || 'Failed to upload contract document. Please try again.');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const lid = selectedListingId || listing?.id || listing?._id || initialData?.listingId;
    if (!lid && !initialData?.id) {
      setError('Please select a listing to submit the contract.');
      return;
    }

    if (!finalPrice || Number(finalPrice) <= 0) {
      setError('Please enter a valid closing price.');
      return;
    }

    if (!transactionDate) {
      setError('Please provide the transaction completion date.');
      return;
    }

    if (!proofDoc && isLiveData) {
      setError(`Please upload the required contract document (${docTitle}).`);
      return;
    }

    if (!declared) {
      setError('Please confirm that the contract details and documents are correct.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        transactionDate,
        finalPrice: Number(finalPrice),
        counterpartyName: counterpartyName.trim() || undefined,
        notes: notes.trim() || undefined,
        document: proofDoc || {
          url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf',
          public_id: 'sample_doc',
          fileName: 'contract.pdf'
        },
        declared: true
      };

      if (isLiveData) {
        const txId = initialData?.id || initialData?._id;
        if (txId) {
          await cmpConnectApi.submitTransactionContract(txId, payload);
        } else {
          // If initiated as a brand new deal, mark listing sold first then submit contract
          const markRes = await cmpConnectApi.markListingSold(lid, transactionDate);
          const newTxId = markRes?.data?.transaction?.id;
          if (newTxId) {
            await cmpConnectApi.submitTransactionContract(newTxId, payload);
          }
        }
      }

      onSuccess?.({
        message: 'Contract submitted. Your company will claim the deal.',
        listingId: lid
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit contract. Please check your inputs.');
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
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: 'min(620px, 95vw)',
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
        {/* Modal Header */}
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
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--cmp-text, #fff)' }}>
              {isSentBack ? 'Submit contract again' : 'Submit contract'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--cmp-text-muted, #8ea399)' }}>
              Upload your {docTitle} and finalize details. Your company will claim the deal.
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
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--cmp-danger, #ef4444)',
                color: 'var(--cmp-danger, #ef4444)',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Sent Back Banner if applicable */}
          {isSentBack && reviewNote && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--cmp-warning, #f59e0b)',
                color: 'var(--cmp-warning, #f59e0b)',
                fontSize: '13px',
                lineHeight: 1.5
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px' }}>Review note from company:</strong>
                <span>{reviewNote}</span>
              </div>
            </div>
          )}

          {/* Target Listing & Locked Agent Info */}
          {activeListing ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'var(--cmp-surface-sunken, #06130f)',
                border: '1px solid var(--cmp-border, #1f382f)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <Building size={20} style={{ color: 'var(--cmp-brand, #28a745)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--cmp-text, #fff)' }}>
                    {activeListing.title || activeListing.propertyTitle || 'Listing'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                    Ref: <strong style={{ color: 'var(--cmp-brand, #28a745)' }}>{activeListing.listingRef || activeListing.id}</strong> · {activeListing.location || 'Dubai'} · {isRental ? 'Rent' : 'Sale'}
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--cmp-surface, #0b1a15)',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  fontSize: '12px',
                  color: 'var(--cmp-text-muted, #8ea399)'
                }}
              >
                <User size={13} style={{ color: 'var(--cmp-brand, #28a745)' }} />
                <span>Agent: <strong style={{ color: 'var(--cmp-text, #fff)' }}>{dealAgent?.fullName || 'Assigned agent'}</strong></span>
                {dealAgent?.brn && <span style={{ opacity: 0.7 }}>({dealAgent.brn})</span>}
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}>
                Select Listing <span style={{ color: 'var(--cmp-danger, #ef4444)' }}>*</span>
              </label>
              <select
                value={selectedListingId}
                onChange={handleSelectListing}
                required
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  padding: '0 12px',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  color: 'var(--cmp-text, #fff)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">-- Choose a property --</option>
                {availableListings.map((l) => (
                  <option key={l.id || l._id} value={l.id || l._id} title={l.title}>
                    {formatListingOptionLabel(l)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Final Price & Transaction Date Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label htmlFor="deal-final-price" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}>
                {isRental ? 'Annual Rent (AED)' : 'Final Sale Price (AED)'} <span style={{ color: 'var(--cmp-danger, #ef4444)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--cmp-text-muted, #8ea399)' }} />
                <input
                  id="deal-final-price"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 1500000"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '8px',
                    border: '1px solid var(--cmp-border, #1f382f)',
                    padding: '0 12px 0 34px',
                    background: 'var(--cmp-surface-sunken, #06130f)',
                    color: 'var(--cmp-text, #fff)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="deal-date" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}>
                Completion Date <span style={{ color: 'var(--cmp-danger, #ef4444)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--cmp-text-muted, #8ea399)' }} />
                <input
                  id="deal-date"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '8px',
                    border: '1px solid var(--cmp-border, #1f382f)',
                    padding: '0 12px 0 34px',
                    background: 'var(--cmp-surface-sunken, #06130f)',
                    color: 'var(--cmp-text, #fff)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--cmp-text, #fff)' }}>
              {docTitle} <span style={{ color: 'var(--cmp-danger, #ef4444)' }}>*</span>
            </label>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--cmp-text-muted, #8ea399)' }}>
              {docSubtitle} (PDF, JPG, PNG up to 10 MB)
            </p>

            {proofDoc ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  border: '1px solid var(--cmp-brand, #28a745)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} style={{ color: 'var(--cmp-brand, #28a745)' }} />
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cmp-text, #fff)' }}>
                      {proofDoc.fileName || 'Contract Document'}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--cmp-success, #10b981)' }}>
                      Ready to submit
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setProofDoc(null)}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  Replace
                </button>
              </div>
            ) : (
              <label
                style={{
                  border: '2px dashed var(--cmp-border, #1f382f)',
                  borderRadius: '10px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  cursor: isUploadingProof ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleFileUpload}
                  disabled={isUploadingProof}
                  style={{ display: 'none' }}
                />
                {isUploadingProof ? (
                  <>
                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--cmp-brand, #28a745)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--cmp-text-muted, #8ea399)' }}>
                      Uploading document securely...
                    </span>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'rgba(40, 167, 69, 0.1)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--cmp-brand, #28a745)'
                      }}
                    >
                      <UploadCloud size={20} />
                    </div>
                    <div>
                      <span style={{ color: 'var(--cmp-brand, #28a745)', fontWeight: 600, fontSize: '13px' }}>
                        Click to browse file
                      </span>
                      <span style={{ color: 'var(--cmp-text-muted, #8ea399)', fontSize: '13px' }}> or drag and drop</span>
                    </div>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Counterparty Name & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            <div>
              <label htmlFor="deal-counterparty" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}>
                {isRental ? 'Tenant Name' : 'Buyer Name'} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--cmp-text-muted, #8ea399)' }}>(optional)</span>
              </label>
              <input
                id="deal-counterparty"
                type="text"
                placeholder="e.g. John Doe or Real Estate LLC"
                value={counterpartyName}
                onChange={(e) => setCounterpartyName(e.target.value)}
                maxLength={120}
                style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  padding: '0 12px',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  color: 'var(--cmp-text, #fff)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="deal-notes" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--cmp-text, #fff)' }}>
                Notes <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--cmp-text-muted, #8ea399)' }}>(optional)</span>
              </label>
              <textarea
                id="deal-notes"
                rows={2}
                placeholder="Any special remarks regarding payment terms, commission, or transfer details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid var(--cmp-border, #1f382f)',
                  padding: '10px 12px',
                  background: 'var(--cmp-surface-sunken, #06130f)',
                  color: 'var(--cmp-text, #fff)',
                  fontSize: '13.5px',
                  lineHeight: 1.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Declaration Checkbox */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--cmp-surface-sunken, #06130f)',
              border: '1px solid var(--cmp-border, #1f382f)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={declared}
              onChange={(e) => setDeclared(e.target.checked)}
              required
              style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--cmp-brand, #28a745)' }}
            />
            <span style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--cmp-text, #fff)' }}>
              I confirm that the contract details and documents are accurate and represent an authentic completed deal.
            </span>
          </label>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '10px',
              borderTop: '1px solid var(--cmp-border, #1f382f)'
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
              disabled={loading || isUploadingProof || !declared || (!proofDoc && isLiveData)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              <span>{isSentBack ? 'Submit again' : 'Submit contract'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
