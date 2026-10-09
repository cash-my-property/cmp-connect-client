import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import '../../styles/uploadPortal.css';

// Conditional document check matching server CONNECT_DOC_CONFIG `when` rules
function docApplies(doc, portalData, values) {
  if (!doc.when) return true;
  if (doc.when === 'EMIRATE_ABU_DHABI') return portalData?.emirate === 'Abu Dhabi';
  if (doc.when === 'SUB_DEVELOPER') return portalData?.developerType === 'Sub developer';
  if (doc.when === 'SIGNATORY_NOT_OWNER') return values?.signatoryIsOwner === false;
  if (doc.when === 'HAS_TRN') return !!(values?.trnNumber && String(values.trnNumber).trim());
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
  const [values, setValues] = useState({});
  const [uploading, setUploading] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [saveState, setSaveState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Countdown & urgency
  const [expiryText, setExpiryText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Error/Success state screen (404, 410, 409, Submitted)
  const [screenState, setScreenState] = useState(null);

  const pendingRef = useRef({});
  const saveTimerRef = useRef(null);

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
      const initialVals = {};
      (data.fields || []).forEach((f) => {
        initialVals[f.path] = f.value;
      });
      setValues(initialVals);
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
            err.message || 'The upload window has closed. Please contact CMP and we will send you a new link.',
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
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [token]);

  // -------------------------------------------------------------
  // Expiry Countdown Timer
  // -------------------------------------------------------------
  useEffect(() => {
    if (!portalData?.expiresAt) return;

    const tick = () => {
      const ms = new Date(portalData.expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        setIsExpired(true);
        setScreenState({
          kind: 'warn',
          title: 'This link has expired',
          lines: [
            'The upload window has closed. Please contact CMP and we will send you a new link.',
            <span key="c">
              <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a> · <a href="tel:+971502402661">+971 50 240 2661</a>
            </span>
          ]
        });
        return;
      }

      const d = Math.floor(ms / 864e5);
      const h = Math.floor((ms % 864e5) / 36e5);
      const m = Math.floor((ms % 36e5) / 6e4);

      setExpiryText(`Link expires in ${d ? `${d}d ` : ''}${h}h ${m < 10 ? '0' : ''}${m}m`);
      setIsUrgent(ms < 12 * 36e5);
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [portalData?.expiresAt]);

  // -------------------------------------------------------------
  // Autosave Details (700ms debounce)
  // -------------------------------------------------------------
  const flushSaveDetails = async () => {
    const body = { ...pendingRef.current };
    pendingRef.current = {};
    if (!Object.keys(body).length) return Promise.resolve();

    setSaveState('Saving…');
    try {
      await cmpConnectApi.saveDetails(token, body);
      setSaveState('All changes saved.');
    } catch (err) {
      Object.keys(body).forEach((k) => {
        if (!(k in pendingRef.current)) pendingRef.current[k] = body[k];
      });
      setSaveState('Not saved: ' + (err.message || 'Error saving'));
      if (err.status === 410 || err.status === 409 || err.status === 404) {
        loadPortalData();
      }
    }
  };

  const handleFieldChange = (f, raw) => {
    let val;
    if (f.boolean) {
      val = raw === 'Yes' ? true : raw === 'No' ? false : null;
    } else if (f.input === 'number') {
      val = raw === '' ? null : Number(raw);
    } else {
      val = raw.trim() === '' ? null : raw;
    }

    setValues((prev) => ({ ...prev, [f.path]: val }));
    pendingRef.current[f.path] = val === '' ? null : val;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSaveDetails, 700);
  };

  // -------------------------------------------------------------
  // File Upload Handling
  // -------------------------------------------------------------
  const handleFileChange = async (doc, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setDocErrors((prev) => ({ ...prev, [doc.key]: null }));

    // File checks: size <= 10 MB and type in doc.accept
    if (file.size > 10 * 1024 * 1024) {
      setDocErrors((prev) => ({ ...prev, [doc.key]: 'This file is larger than 10 MB.' }));
      return;
    }

    if (doc.accept && !doc.accept.includes(file.type)) {
      setDocErrors((prev) => ({
        ...prev,
        [doc.key]: doc.key === 'companyLogo' ? 'Logo must be PNG, SVG or JPG.' : 'Only PDF, JPG or PNG files are allowed.'
      }));
      return;
    }

    setUploading((prev) => ({ ...prev, [doc.key]: true }));

    try {
      const res = await cmpConnectApi.uploadDocument(token, doc.key, file);
      setPortalData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          docs: prev.docs.map((d) => {
            if (d.key === doc.key) {
              return {
                ...d,
                uploaded: {
                  fileName: res.data?.fileName || file.name,
                  uploadedAt: res.data?.uploadedAt || new Date().toISOString(),
                  status: res.data?.status || 'PENDING'
                }
              };
            }
            return d;
          })
        };
      });
    } catch (err) {
      setDocErrors((prev) => ({ ...prev, [doc.key]: err.message || 'Upload failed.' }));
      if (err.status === 410 || err.status === 409 || err.status === 404) {
        loadPortalData();
      }
    } finally {
      setUploading((prev) => ({ ...prev, [doc.key]: false }));
      // Reset input element value so uploading the same file triggers onChange
      e.target.value = '';
    }
  };

  // -------------------------------------------------------------
  // Progress & Missing Calculation
  // -------------------------------------------------------------
  const { missingFields, missingDocs, pct } = useMemo(() => {
    if (!portalData) return { missingFields: [], missingDocs: [], pct: 0 };

    const mFields = (portalData.fields || []).filter((f) => {
      const v = values[f.path];
      return f.required && (v === null || v === undefined || v === '');
    });

    const mDocs = (portalData.docs || []).filter((doc) => {
      return (
        docApplies(doc, portalData, values) &&
        !doc.optional &&
        !(doc.uploaded && doc.uploaded.status !== 'REJECTED')
      );
    });

    const reqFields = (portalData.fields || []).filter((f) => f.required).length;
    const reqDocs = (portalData.docs || []).filter((d) => docApplies(d, portalData, values) && !d.optional).length;
    const total = reqFields + reqDocs;
    const done = total - mFields.length - mDocs.length;
    const percentage = total ? Math.round((done / total) * 100) : 100;

    return {
      missingFields: mFields,
      missingDocs: mDocs,
      pct: percentage
    };
  }, [portalData, values]);

  const isAnyUploading = useMemo(() => {
    return Object.values(uploading).some(Boolean);
  }, [uploading]);

  const isReady =
    !missingFields.length &&
    !missingDocs.length &&
    !isExpired &&
    !isSubmitting &&
    !isAnyUploading;

  // -------------------------------------------------------------
  // Final Submission
  // -------------------------------------------------------------
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    try {
      await flushSaveDetails();
      await cmpConnectApi.submit(token);
      setScreenState({
        kind: 'ok',
        title: 'Thank you. Your documents are in.',
        lines: [
          'Our team will check your documents against the official records.',
          'We will email you at every change of status.'
        ]
      });
    } catch (err) {
      setIsSubmitting(false);
      if (err.status === 410 || err.status === 409 || err.status === 404) {
        loadPortalData();
        return;
      }
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    }
  };

  // -------------------------------------------------------------
  // RENDER: Error or Success State Screens
  // -------------------------------------------------------------
  if (screenState) {
    return (
      <div className="upload-portal-root">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="wordmark">Cash My <span>Property</span></div>
            <div className="topbar-tag">CMP CONNECT</div>
          </div>
        </div>

        <main>
          <div className={`state ${screenState.kind}`}>
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
  // RENDER: Loading Skeleton
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className="upload-portal-root">
        <div className="topbar">
          <div className="topbar-inner">
            <div className="wordmark">Cash My <span>Property</span></div>
            <div className="topbar-tag">CMP CONNECT</div>
          </div>
        </div>

        <div className="hero">
          <div className="hero-inner">
            <span className="badge">CMP Connect · Registration</span>
            <h1>Loading upload portal…</h1>
            <p>Please wait while we retrieve your registration details.</p>
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
  // RENDER: Active Upload Portal
  // -------------------------------------------------------------
  const d = portalData;
  const fieldGroups = groupBy(d.fields, 'group');
  const docGroups = groupBy(d.docs, 'group');

  return (
    <div className="upload-portal-root">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="wordmark">Cash My <span>Property</span></div>
          <div className="topbar-tag">CMP CONNECT</div>
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        <div className="hero-inner">
          <span className="badge">
            CMP Connect · {d.type === 'DEVELOPER' ? 'Developer registration' : 'Company registration'}
          </span>
          <h1>{d.companyName}</h1>
          <p>
            Hi {d.contactName || 'there'}, complete the details below and upload your documents. Everything saves as you go.
          </p>
          <div className="hero-meta">
            <span className="chip">Ref {d.code}</span>
            {d.orn && <span className="chip">ORN {d.orn}</span>}
            <span className="chip">{d.emirate}</span>
            {expiryText && (
              <span className={`chip expiry ${isUrgent ? 'urgent' : ''}`}>
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
              {missingDocs.length || missingFields.length ? (
                <>
                  {missingDocs.length} document{missingDocs.length === 1 ? '' : 's'} and{' '}
                  {missingFields.length} detail{missingFields.length === 1 ? '' : 's'} still needed
                </>
              ) : (
                'Everything is in. You can submit.'
              )}
            </strong>
            <span>{pct}%</span>
          </div>
          <div className="bar">
            <span style={{ width: `${pct}%` }}></span>
          </div>
        </div>

        {/* Changes Requested Banner */}
        {d.onboardingStatus === 'CHANGES_REQUESTED' && (
          <div
            className="progress-card"
            style={{ borderColor: 'var(--up-accent-border)', background: 'var(--up-accent-subtle)', marginBottom: 16 }}
          >
            <strong>Some documents need your attention.</strong>
            <div className="doc-hint" style={{ marginTop: 4 }}>
              Our team has asked for changes. Replace the documents marked below, then submit again.
            </div>
          </div>
        )}

        {/* Card 1: Details */}
        <section className="card">
          <div className="card-head">
            <h2>Your details</h2>
            <p>These go on your listings, contracts and invoices.</p>
          </div>

          {fieldGroups.map((g) => (
            <div key={g.name}>
              <div className="group-title">{g.name}</div>
              <div className="grid">
                {g.items.map((f) => {
                  const val = values[f.path];
                  const id = `f-${f.path.replace(/\./g, '-')}`;
                  const isInvalid = f.required && (val === null || val === undefined || val === '');

                  return (
                    <div className={`field ${isInvalid && val === '' ? 'invalid' : ''}`} key={f.path}>
                      <label htmlFor={id}>
                        {f.label}
                        {f.required && <span className="req"> *</span>}
                      </label>

                      {f.options ? (
                        <select
                          id={id}
                          value={f.boolean ? (val === true ? 'Yes' : val === false ? 'No' : '') : (val ?? '')}
                          onChange={(e) => handleFieldChange(f, e.target.value)}
                        >
                          <option value="">Choose one</option>
                          {f.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={id}
                          type={f.input || 'text'}
                          min={f.input === 'number' ? '1' : undefined}
                          step={f.input === 'number' ? '1' : undefined}
                          value={val ?? ''}
                          onChange={(e) => handleFieldChange(f, e.target.value)}
                        />
                      )}

                      {f.hint && <div className="hint">{f.hint}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="save-state">{saveState}</div>
        </section>

        {/* Card 2: Documents */}
        <section className="card">
          <div className="card-head">
            <h2>Your documents</h2>
            <p>Original PDFs or clear scans, not screenshots. Each file up to 10 MB.</p>
          </div>

          {docGroups.map((g) => {
            const visibleDocs = g.items.filter((doc) => docApplies(doc, portalData, values));
            if (!visibleDocs.length) return null;

            return (
              <div key={g.name}>
                <div className="group-title">{g.name}</div>
                <div className="doc-list">
                  {visibleDocs.map((doc) => {
                    const up = doc.uploaded;
                    const busy = uploading[doc.key];
                    const err = docErrors[doc.key];
                    const rejected = up && up.status === 'REJECTED';

                    return (
                      <div
                        key={doc.key}
                        className={`doc ${up && !rejected ? 'done' : ''} ${rejected ? 'rejected' : ''}`}
                      >
                        <div className="doc-icon">
                          {up && !rejected ? '✓' : rejected ? '!' : doc.key === 'companyLogo' ? 'IMG' : 'PDF'}
                        </div>

                        <div className="doc-body">
                          <div className="doc-title">
                            {doc.label}
                            {doc.optional && <span className="opt"> (optional)</span>}
                          </div>
                          <div className="doc-hint">{doc.hint}</div>
                          {up && <div className="doc-file">{up.fileName || 'Uploaded'}</div>}
                          {rejected && up.rejectionReason && (
                            <div className="doc-error">Needs replacing: {up.rejectionReason}</div>
                          )}
                          {err && <div className="doc-error">{err}</div>}
                        </div>

                        <div className="doc-actions">
                          <label className={`btn ${up && !rejected ? '' : 'primary'}`} style={{ opacity: busy ? 0.6 : 1 }}>
                            {busy ? (
                              <>
                                <span className="spinner"></span> Uploading
                              </>
                            ) : up ? (
                              'Replace'
                            ) : (
                              'Upload'
                            )}
                            <input
                              type="file"
                              className="hidden"
                              accept={doc.accept ? doc.accept.join(',') : '*'}
                              disabled={busy || isExpired}
                              onChange={(e) => handleFileChange(doc, e)}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Floating Submit Bar */}
      <div className="submit-bar">
        <div className="submit-inner">
          <div className={`submit-note ${submitError ? 'err' : ''}`}>
            {submitError ||
              (isReady
                ? 'Ready to send to CMP for review.'
                : 'Complete all required details and documents to submit.')}
          </div>

          <button
            type="button"
            className="btn primary lg"
            disabled={!isReady}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Submitting
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
