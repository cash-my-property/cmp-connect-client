import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import '../../styles/uploadPortal.css';

// Filter docs by `when` based on registration answers
function docApplies(doc, portalData) {
  if (!doc.when) return true;
  if (doc.when === 'EMIRATE_ABU_DHABI') {
    return portalData?.emirate === 'Abu Dhabi';
  }
  if (doc.when === 'SUB_DEVELOPER') {
    return portalData?.developerType === 'Sub developer';
  }
  if (doc.when === 'HAS_TRN') {
    const trnField = portalData?.fields?.find((f) => f.path === 'trnNumber');
    const val = trnField ? trnField.value : portalData?.trnNumber;
    return Boolean(val && String(val).trim());
  }
  if (doc.when === 'SIGNATORY_NOT_OWNER') {
    const sigField = portalData?.fields?.find((f) => f.path === 'signatoryIsOwner');
    const isOwner = sigField !== undefined ? sigField.value : portalData?.signatoryIsOwner;
    return isOwner === false;
  }
  return false;
}

// Group array of objects by key
function groupBy(list, key) {
  const out = [];
  (list || []).forEach((item) => {
    let g = out.find((x) => x.name === item[key]);
    if (!g) {
      g = { name: item[key], items: [] };
      out.push(g);
    }
    g.items.push(item);
  });
  return out;
}

export default function UploadPortalPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [uploading, setUploading] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Countdown & urgency
  const [expiryText, setExpiryText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Error/Success state screen (404, 410, 409, Submitted)
  const [screenState, setScreenState] = useState(null);

  // -------------------------------------------------------------
  // Load Portal Data
  // -------------------------------------------------------------
  const loadPortalData = async () => {
    if (!token) {
      setScreenState({
        kind: 'warn',
        title: 'This link cannot be opened',
        lines: [
          'No upload token was provided.',
          <span key="c">
            <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a> · <a href="tel:+971502402661">+971 50 240 2661</a>
          </span>
        ]
      });
      setLoading(false);
      return;
    }

    try {
      const res = await cmpConnectApi.getPortal(token);
      const data = res?.data;
      if (!data) throw new Error('Could not load portal data.');

      setPortalData(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.status === 409) {
        setScreenState({
          kind: 'ok',
          title: 'Documents already submitted',
          lines: [err.message || 'Your documents have already been submitted. We will email you once the review is complete.']
        });
      } else if (err.status === 410) {
        setScreenState({
          kind: 'warn',
          title: 'This link has expired',
          lines: [
            err.message || 'This link has expired. Please contact CMP to receive a new link.',
            <span key="c">
              <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a> · <a href="tel:+971502402661">+971 50 240 2661</a>
            </span>
          ]
        });
      } else {
        // 404 or other errors
        setScreenState({
          kind: 'warn',
          title: 'This link cannot be opened',
          lines: [
            err.message || 'This link is not valid or has been replaced by a newer one.',
            <span key="c">
              <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a> · <a href="tel:+971502402661">+971 50 240 2661</a>
            </span>
          ]
        });
      }
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [token]);

  // -------------------------------------------------------------
  // Expiry Countdown
  // -------------------------------------------------------------
  useEffect(() => {
    if (!portalData?.expiresAt) return;

    const tick = () => {
      const diff = new Date(portalData.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpiryText('Link expired');
        setIsExpired(true);
        setIsUrgent(true);
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setIsUrgent(hrs < 12);
      if (hrs > 24) {
        const days = Math.floor(hrs / 24);
        setExpiryText(`${days}d ${hrs % 24}h remaining`);
      } else {
        setExpiryText(`${hrs}h ${mins}m remaining`);
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [portalData?.expiresAt]);

  // -------------------------------------------------------------
  // Filter Applicable Documents
  // -------------------------------------------------------------
  const visibleDocs = useMemo(() => {
    if (!portalData?.docs) return [];
    return portalData.docs.filter((doc) => docApplies(doc, portalData));
  }, [portalData]);

  const docGroups = useMemo(() => {
    return groupBy(visibleDocs, 'group');
  }, [visibleDocs]);

  // Submission Readiness
  const isReadyToSubmit = useMemo(() => {
    if (visibleDocs.length === 0 || isExpired) return false;
    return visibleDocs
      .filter((d) => !d.optional)
      .every((d) => d.uploaded && d.uploaded.status !== 'REJECTED');
  }, [visibleDocs, isExpired]);

  const uploadedCount = useMemo(() => {
    return visibleDocs.filter((d) => d.uploaded && d.uploaded.status !== 'REJECTED').length;
  }, [visibleDocs]);

  const requiredCount = useMemo(() => {
    return visibleDocs.filter((d) => !d.optional).length;
  }, [visibleDocs]);

  const uploadedRequiredCount = useMemo(() => {
    return visibleDocs.filter((d) => !d.optional && d.uploaded && d.uploaded.status !== 'REJECTED').length;
  }, [visibleDocs]);

  const pct = useMemo(() => {
    if (!requiredCount) return 100;
    return Math.round((uploadedRequiredCount / requiredCount) * 100);
  }, [uploadedRequiredCount, requiredCount]);

  const missingCount = useMemo(() => {
    return Math.max(0, requiredCount - uploadedRequiredCount);
  }, [requiredCount, uploadedRequiredCount]);

  // -------------------------------------------------------------
  // File Upload Handler (POST /upload/:token/documents/:docKey)
  // -------------------------------------------------------------
  const handleFileUpload = async (docKey, file) => {
    if (!file || isExpired) return;

    const docDef = visibleDocs.find((d) => d.key === docKey);
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (file.size > maxSize) {
      setDocErrors((prev) => ({
        ...prev,
        [docKey]: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 10 MB.`
      }));
      return;
    }

    if (docDef?.accept && docDef.accept.length > 0) {
      const typeMatch = docDef.accept.some((mime) => {
        if (mime.includes('*')) {
          const base = mime.split('/')[0];
          return file.type.startsWith(base);
        }
        return file.type === mime;
      });

      // Also check file extension as fallback
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      const extMatch = docDef.accept.some((a) => a.toLowerCase().includes(ext.replace('.', '')));

      if (!typeMatch && !extMatch) {
        setDocErrors((prev) => ({
          ...prev,
          [docKey]: `File format not accepted. Please upload ${docDef.accept.map((a) => a.replace('application/', '').replace('image/', '')).join(', ')}.`
        }));
        return;
      }
    }

    setDocErrors((prev) => ({ ...prev, [docKey]: '' }));
    setUploading((prev) => ({ ...prev, [docKey]: true }));

    try {
      const res = await cmpConnectApi.uploadDocument(token, docKey, file);
      const uploadedData = res?.data;

      // Update local docs state with newly uploaded record
      setPortalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          docs: prev.docs.map((d) => {
            if (d.key === docKey) {
              return {
                ...d,
                uploaded: {
                  fileName: uploadedData?.fileName || file.name,
                  uploadedAt: uploadedData?.uploadedAt || new Date().toISOString(),
                  status: uploadedData?.status || 'UPLOADED',
                  rejectionReason: null
                }
              };
            }
            return d;
          })
        };
      });
    } catch (err) {
      setDocErrors((prev) => ({
        ...prev,
        [docKey]: err.message || 'Upload failed. Please try again.'
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [docKey]: false }));
    }
  };

  // -------------------------------------------------------------
  // Final Submission Handler (POST /upload/:token/submit)
  // -------------------------------------------------------------
  const handleSubmit = async () => {
    if (!isReadyToSubmit || isSubmitting || isExpired) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await cmpConnectApi.submit(token);
      setScreenState({
        kind: 'ok',
        title: 'Thank you. Your documents are in.',
        lines: [
          'Our compliance and verification team will check them against official records.',
          'You will receive an email once the verification is complete.'
        ]
      });
    } catch (err) {
      setSubmitError(err.message || 'Submission failed. Please ensure all documents are uploaded.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: STATUS SCREEN (404, 409, 410, Success)
  // -------------------------------------------------------------
  if (screenState) {
    return (
      <div className="upload-portal-root">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="wordmark">
              Cash My <span>Property</span>
            </div>
            <div className="topbar-tag">CMP CONNECT</div>
          </div>
        </div>

        <main>
          <div className={`state ${screenState.kind === 'ok' ? 'ok' : 'warn'}`}>
            <div className="mark">{screenState.kind === 'ok' ? '✓' : '!'}</div>
            <h2>{screenState.title}</h2>
            {screenState.lines.map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </main>

        <div className="footer">
          Cash My Property · Dubai, United Arab Emirates · +971 50 240 2661 · info@cmpdubai.com
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LOADING STATE
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="upload-portal-root">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="wordmark">
              Cash My <span>Property</span>
            </div>
            <div className="topbar-tag">CMP CONNECT</div>
          </div>
        </div>

        <main>
          <div className="skeleton"></div>
          <div className="skeleton"></div>
          <div className="skeleton"></div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: DOCUMENTS UPLOAD PORTAL
  // -------------------------------------------------------------
  return (
    <div className="upload-portal-root">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="wordmark">
            Cash My <span>Property</span>
          </div>
          <div className="topbar-tag">CMP CONNECT</div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="hero">
        <div className="hero-inner">
          <span className="badge">
            CMP Connect · {portalData.type === 'DEVELOPER' ? 'Developer Registration' : 'Company Registration'}
          </span>
          <h1>{portalData.companyName}</h1>
          <p>
            {portalData.contactName ? `Hi ${portalData.contactName}, ` : ''}
            Complete your document submission below. Everything saves as you upload.
          </p>
          <div className="hero-meta">
            <span className="chip">
              Ref <strong>{portalData.code}</strong>
            </span>
            {portalData.orn && (
              <span className="chip">
                ORN <strong>{portalData.orn}</strong>
              </span>
            )}
            {portalData.emirate && (
              <span className="chip">{portalData.emirate}</span>
            )}
            {expiryText && (
              <span className={`chip expiry ${isUrgent ? 'urgent' : ''}`}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {expiryText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {/* Progress Card */}
        <div className="progress-card">
          <div className="progress-row">
            <strong>
              {uploadedRequiredCount} of {requiredCount} required documents uploaded
            </strong>
            <span>{pct}%</span>
          </div>
          <div className="bar">
            <span style={{ width: `${pct}%` }}></span>
          </div>
        </div>

        {portalData.onboardingStatus === 'CHANGES_REQUESTED' && (
          <div
            className="progress-card"
            style={{
              borderColor: 'var(--up-accent-border)',
              background: 'var(--up-accent-subtle)'
            }}
          >
            <strong style={{ color: 'var(--up-accent)' }}>Some documents need your attention.</strong>
            <div className="doc-hint">
              Our compliance team has requested changes. Please review and replace the rejected documents below.
            </div>
          </div>
        )}

        {isExpired && (
          <div
            className="progress-card"
            style={{
              borderColor: 'var(--up-danger)',
              background: 'var(--up-danger-subtle)',
              color: 'var(--up-danger)'
            }}
          >
            <strong>⛔ This link has expired.</strong>
            <div className="doc-hint">
              The document upload window has closed. Please contact CMP Connect to receive a fresh upload link.
            </div>
          </div>
        )}

        {/* Documents Card */}
        <section className="card">
          <div className="card-head">
            <h2>Your documents</h2>
            <p>Original PDFs or clear image scans, not screenshots. Each file up to 10 MB.</p>
          </div>

          {docGroups.map((group) => (
            <React.Fragment key={group.name}>
              <div className="group-title">{group.name}</div>
              <div className="doc-list">
                {group.items.map((doc) => {
                  const isUploaded = Boolean(doc.uploaded && doc.uploaded.status !== 'REJECTED');
                  const isRejected = doc.uploaded?.status === 'REJECTED';
                  const isItemUploading = uploading[doc.key];

                  return (
                    <div
                      key={doc.key}
                      className={`doc ${isUploaded ? 'done' : ''} ${isRejected ? 'rejected' : ''}`}
                    >
                      <div className="doc-icon">
                        {isUploaded ? (
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : isRejected ? (
                          '!'
                        ) : (
                          'PDF'
                        )}
                      </div>

                      <div className="doc-body">
                        <div className="doc-title">
                          {doc.label} {doc.optional && <span className="opt">(Optional)</span>}
                        </div>
                        {doc.hint && <div className="doc-hint">{doc.hint}</div>}
                        {isUploaded && doc.uploaded?.fileName && (
                          <div className="doc-file">✓ {doc.uploaded.fileName}</div>
                        )}
                        {isRejected && (
                          <div className="doc-error">
                            ⚠️ Rejected: {doc.uploaded.rejectionReason || 'Please upload a replacement document.'}
                          </div>
                        )}
                        {docErrors[doc.key] && (
                          <div className="doc-error">{docErrors[doc.key]}</div>
                        )}
                      </div>

                      <div className="doc-actions">
                        <label
                          className={`btn ${isUploaded ? '' : 'primary'}`}
                          style={{
                            cursor: isExpired || isItemUploading ? 'not-allowed' : 'pointer',
                            opacity: isExpired || isItemUploading ? 0.6 : 1
                          }}
                        >
                          {isItemUploading ? (
                            <>
                              <span className="spinner"></span>
                              <span>Uploading...</span>
                            </>
                          ) : isUploaded ? (
                            'Replace file'
                          ) : (
                            'Upload document'
                          )}
                          <input
                            type="file"
                            style={{ display: 'none' }}
                            disabled={isExpired || isItemUploading}
                            accept={doc.accept ? doc.accept.join(',') : 'application/pdf,image/jpeg,image/png'}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(doc.key, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </section>
      </main>

      {/* Floating Bottom Submit Bar */}
      <div className="submit-bar">
        <div className="submit-inner">
          <div className={`submit-note ${submitError ? 'err' : ''}`}>
            {submitError ? (
              submitError
            ) : isReadyToSubmit ? (
              'All required documents uploaded. Ready to submit.'
            ) : (
              `${missingCount} required document${missingCount === 1 ? '' : 's'} remaining to upload.`
            )}
          </div>
          <button
            type="button"
            className="btn primary lg"
            disabled={!isReadyToSubmit || isSubmitting || isExpired}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                <span>Submitting...</span>
              </>
            ) : (
              'Submit for review'
            )}
          </button>
        </div>
      </div>

      <div className="footer">
        Cash My Property · Dubai, United Arab Emirates · +971 50 240 2661 · info@cmpdubai.com
      </div>
    </div>
  );
}
