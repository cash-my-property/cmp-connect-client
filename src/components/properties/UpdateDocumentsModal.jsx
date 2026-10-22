import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cmpConnectApi } from '../../services/cmpConnectApi';

export default function UpdateDocumentsModal({
  isOpen,
  onClose,
  property,
  onSave,
  isLiveData,
  authToken
}) {
  const fileInputRef = useRef(null);
  const [permitNumber, setPermitNumber] = useState('');
  const [permitExpiry, setPermitExpiry] = useState('');
  const [formAFile, setFormAFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState('');
  const [formAExpiry, setFormAExpiry] = useState('');
  const [formAStatus, setFormAStatus] = useState('active'); // 'active' | 'expired'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form when a property is selected
  useEffect(() => {
    if (property) {
      setPermitNumber(property.permitNumber || '');
      setPermitExpiry(property.permitExpiry || '2026-12-24');
      setExistingFileName(property.formAFileName || 'form-a-marina-gate.pdf');
      setFormAFile(null);
      setFormAExpiry(property.formAExpiry || '2027-05-19');
      setFormAStatus(
        property.formAActive || (property.formASeverity === 'danger' ? 'expired' : 'active')
      );
      setError(null);
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormAFile(file);
      setFormAStatus('active');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let uploadedDoc = null;

      if (isLiveData) {
        // Upload file to Cloudinary if user picked a new file
        if (formAFile) {
          const sigRes = await cmpConnectApi.getListingUploadSignature(property.id, authToken);
          const sig = sigRes?.data?.docs || sigRes?.data?.documents || sigRes?.data;
          if (!sig) {
            throw new Error('Could not obtain document upload credentials.');
          }
          uploadedDoc = await cmpConnectApi.uploadListingFileToCloudinary(formAFile, sig);
        }

        // Call PATCH /listings/:id
        const patchPayload = {
          permitNumber: permitNumber.trim() || null
        };

        if (uploadedDoc) {
          patchPayload.documents = {
            contractA: uploadedDoc
          };
        }

        await cmpConnectApi.updateListing(property.id, patchPayload, authToken);
      }

      // Notify parent to update local state / UI
      if (onSave) {
        await onSave({
          id: property.id,
          permitNumber: permitNumber.trim() || null,
          permitExpiry,
          formAFileName: formAFile ? formAFile.name : existingFileName,
          formAExpiry,
          formAStatus,
          uploadedDoc
        });
      }

      onClose();
    } catch (err) {
      console.error('Failed to update documents:', err);
      setError(err.message || 'Failed to update documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1100,
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(520px, 95vw)',
          backgroundColor: '#0a1d17',
          border: '1px solid #16362b',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#e6f4ef'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.01em' }}>
            Update documents
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              padding: '4px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '6px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              alignItems: 'start'
            }}
          >
            {/* DLD permit number */}
            <div>
              <label
                htmlFor="dld-permit-num"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1e7dd',
                  marginBottom: '8px'
                }}
              >
                DLD permit number
              </label>
              <input
                id="dld-permit-num"
                type="text"
                value={permitNumber}
                onChange={(e) => setPermitNumber(e.target.value)}
                placeholder="e.g. DLD-7128394"
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#06130f',
                  border: '1px solid #1a3d31',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = '#1a3d31')}
              />
            </div>

            {/* Permit expiry */}
            <div>
              <label
                htmlFor="permit-expiry"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1e7dd',
                  marginBottom: '8px'
                }}
              >
                Permit expiry
              </label>
              <input
                id="permit-expiry"
                type="date"
                value={permitExpiry}
                onChange={(e) => setPermitExpiry(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#06130f',
                  border: '1px solid #1a3d31',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  colorScheme: 'dark',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = '#1a3d31')}
              />
            </div>

            {/* Signed Form A (PDF) - Spans full width */}
            <div style={{ gridColumn: 'span 2' }}>
              <label
                htmlFor="form-a-file"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1e7dd',
                  marginBottom: '8px'
                }}
              >
                Signed Form A (PDF)
              </label>

              {/* Theme-matched file input container */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#06130f',
                  border: '1px solid #1a3d31',
                  borderRadius: '8px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a3d31')}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  style={{
                    backgroundColor: '#1b3329',
                    border: '1px solid #2d5544',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: 500,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2'
                  }}
                >
                  Choose File
                </button>

                <span
                  style={{
                    fontSize: '13px',
                    color: formAFile ? '#ffffff' : '#648074',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {formAFile ? formAFile.name : 'No file chosen'}
                </span>

                <input
                  ref={fileInputRef}
                  id="form-a-file"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>

              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: '12px',
                  color: '#719083',
                  fontWeight: 500
                }}
              >
                On file: {existingFileName || 'None'}
              </p>
            </div>

            {/* Form A expiry */}
            <div>
              <label
                htmlFor="form-a-expiry"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1e7dd',
                  marginBottom: '8px'
                }}
              >
                Form A expiry
              </label>
              <input
                id="form-a-expiry"
                type="date"
                value={formAExpiry}
                onChange={(e) => setFormAExpiry(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#06130f',
                  border: '1px solid #1a3d31',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  colorScheme: 'dark',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = '#1a3d31')}
              />
            </div>

            {/* Form A status */}
            <div>
              <label
                htmlFor="form-a-status"
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#d1e7dd',
                  marginBottom: '8px'
                }}
              >
                Form A status
              </label>
              <select
                id="form-a-status"
                value={formAStatus}
                onChange={(e) => setFormAStatus(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  backgroundColor: '#06130f',
                  border: '1px solid #1a3d31',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = '#1a3d31')}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '16px',
              marginTop: '28px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.75)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '8px 12px'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: '#10b981',
                color: '#042217',
                border: 'none',
                borderRadius: '10px',
                height: '42px',
                padding: '0 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              {isSubmitting && <Loader2 size={16} className="spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save documents'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
