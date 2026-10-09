import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { cmpConnectApi } from '../../services/cmpConnectApi';

// UAE Phone Number Validation Regex
// Matches: +971 50 412 7781, 050 412 7781, 00971504127781, 504127781
const UAE_PHONE_REGEX = /^(?:\+971|00971|971|0)?(?:50|52|54|55|56|58|2|3|4|6|7|9)\d{7}$/;

// Standard email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidUaePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return UAE_PHONE_REGEX.test(cleaned);
}

// UAE Date/Time Formatter (Asia/Dubai)
// Example output: "Link valid until 12 October 2026, 13:30 (UAE)"
function formatUaeDateTime(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    const clean = formatted.replace(' at ', ', ');
    return `Link valid until ${clean} (UAE)`;
  } catch (err) {
    return `Link valid until ${isoString} (UAE)`;
  }
}

// Form validation helper
function validateForm(formData, accountType) {
  const errors = {};

  // Contact person
  if (!formData.firstName.trim()) {
    errors.firstName = 'First name is required.';
  } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 80) {
    errors.firstName = 'First name must be 2 to 80 characters.';
  }

  if (!formData.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 80) {
    errors.lastName = 'Last name must be 2 to 80 characters.';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidUaePhone(formData.phone)) {
    errors.phone = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  // Company / Developer
  const compLabel = accountType === 'DEVELOPER' ? 'Developer' : 'Company';
  if (!formData.companyName.trim()) {
    errors.companyName = `${compLabel} name is required.`;
  } else if (formData.companyName.trim().length < 2 || formData.companyName.trim().length > 150) {
    errors.companyName = `${compLabel} name must be 2 to 150 characters.`;
  }

  if (!formData.emirate) {
    errors.emirate = 'Emirate is required.';
  }

  if (accountType === 'AGENCY') {
    if (!formData.companyType) {
      errors.companyType = 'Company type is required.';
    }
    if (!formData.tradeLicenceStatus) {
      errors.tradeLicenceStatus = 'Trade licence status is required.';
    }
    if (!formData.orn.trim()) {
      errors.orn = 'RERA ORN number is required.';
    } else if (formData.orn.trim().length < 1 || formData.orn.trim().length > 50) {
      errors.orn = 'RERA ORN number must be 1 to 50 characters.';
    }
  } else {
    if (!formData.developerType) {
      errors.developerType = 'Developer type is required.';
    }
  }

  // Owner
  if (!formData.ownerFullName.trim()) {
    errors.ownerFullName = 'Owner full name is required.';
  } else if (formData.ownerFullName.trim().length < 2 || formData.ownerFullName.trim().length > 80) {
    errors.ownerFullName = 'Owner full name must be 2 to 80 characters.';
  }

  if (!formData.ownerEmail.trim()) {
    errors.ownerEmail = 'Owner email is required.';
  } else if (!EMAIL_REGEX.test(formData.ownerEmail.trim())) {
    errors.ownerEmail = 'Please enter a valid email address.';
  }

  if (!formData.ownerMobile.trim()) {
    errors.ownerMobile = 'Owner mobile is required.';
  } else if (!isValidUaePhone(formData.ownerMobile)) {
    errors.ownerMobile = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  // Admin
  if (!formData.adminFullName.trim()) {
    errors.adminFullName = 'Admin full name is required.';
  } else if (formData.adminFullName.trim().length < 2 || formData.adminFullName.trim().length > 80) {
    errors.adminFullName = 'Admin full name must be 2 to 80 characters.';
  }

  if (!formData.adminEmail.trim()) {
    errors.adminEmail = 'Admin email is required.';
  } else if (!EMAIL_REGEX.test(formData.adminEmail.trim())) {
    errors.adminEmail = 'Please enter a valid email address.';
  }

  if (!formData.adminMobile.trim()) {
    errors.adminMobile = 'Admin mobile is required.';
  } else if (!isValidUaePhone(formData.adminMobile)) {
    errors.adminMobile = 'Please provide a valid UAE phone number (e.g., +971501234567)';
  }

  return errors;
}

export default function OnboardingSignupPage() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'developer' ? 'DEVELOPER' : 'AGENCY';

  // 1. "Registering as" toggle: Real estate company (AGENCY) / Developer (DEVELOPER)
  const [accountType, setAccountType] = useState(initialType);

  // 2. Form state
  const [formData, setFormData] = useState({
    // Contact person
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Company / Developer
    companyName: '',
    companyType: 'Real estate brokerage',
    emirate: 'Dubai',
    tradeLicenceStatus: 'Valid and active',
    orn: '',
    developerType: 'Master developer',
    // Owner
    ownerFullName: '',
    ownerEmail: '',
    ownerMobile: '',
    // Admin
    adminFullName: '',
    adminEmail: '',
    adminMobile: ''
  });

  // 3. User interaction tracking
  const [touched, setTouched] = useState({});

  // 4. Pre-check states
  // Agency ORN pre-check
  const [agencyPrecheck, setAgencyPrecheck] = useState({
    loading: false,
    checkedOrn: '',
    result: null, // { canSubmit, whitelisted, registeredOnApp, message }
    error: null
  });

  // Developer pre-check
  const [devPrecheck, setDevPrecheck] = useState({
    loading: false,
    checkedKey: '', // `${companyName}:::${email}`
    result: null, // { canSubmit, message }
    error: null
  });

  // 5. Backend response errors
  const [backendErrors, setBackendErrors] = useState({
    orn: '',
    companyName: '',
    general: '',
    network: false
  });

  // 6. Submission status & rate limit timer
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  // 7. Success state (HTTP 201)
  const [successData, setSuccessData] = useState(null);

  // Timers & refs for debouncing and rate limiting
  const agencyDebounceRef = useRef(null);
  const devDebounceRef = useRef(null);

  // Clean up debounce timers
  useEffect(() => {
    return () => {
      if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    };
  }, []);

  // 429 countdown ticker
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  // Client validation
  const formErrors = useMemo(() => {
    return validateForm(formData, accountType);
  }, [formData, accountType]);

  const isFormValid = Object.keys(formErrors).length === 0;

  // Single source of truth for canSubmit from backend pre-check
  const canSubmitFromPrecheck = useMemo(() => {
    if (accountType === 'AGENCY') {
      return agencyPrecheck.result ? agencyPrecheck.result.canSubmit === true : false;
    } else {
      return devPrecheck.result ? devPrecheck.result.canSubmit === true : false;
    }
  }, [accountType, agencyPrecheck.result, devPrecheck.result]);

  const isSubmitEnabled =
    isFormValid &&
    canSubmitFromPrecheck &&
    !agencyPrecheck.loading &&
    !devPrecheck.loading &&
    !isSubmitting &&
    rateLimitCountdown === 0;

  // -------------------------------------------------------------
  // Account Type Switch
  // -------------------------------------------------------------
  const handleAccountTypeChange = (newType) => {
    if (newType === accountType) return;
    setAccountType(newType);

    // Reset pre-check and backend errors when switching types
    if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
    if (devDebounceRef.current) clearTimeout(devDebounceRef.current);

    setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
    setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });
  };

  // -------------------------------------------------------------
  // Generic Field Input Handler
  // -------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // -------------------------------------------------------------
  // AGENCY Pre-check: debounced 400ms & on blur
  // -------------------------------------------------------------
  const runAgencyCheck = async (ornValue) => {
    const trimmed = (ornValue || '').trim();
    if (!trimmed) {
      setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });
      return;
    }

    if (agencyPrecheck.checkedOrn === trimmed && agencyPrecheck.result) {
      return;
    }

    setAgencyPrecheck((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await cmpConnectApi.checkExistence({
        type: 'AGENCY',
        orn: trimmed
      });

      setAgencyPrecheck({
        loading: false,
        checkedOrn: trimmed,
        result: res?.data || null,
        error: null
      });
    } catch (err) {
      const msg = err.message || 'Error checking ORN';
      if (err.status === 429) {
        setAgencyPrecheck({
          loading: false,
          checkedOrn: trimmed,
          result: { canSubmit: false, message: 'Too many checks. Please wait a minute before trying again.' },
          error: 'Too many checks. Please wait a minute before trying again.'
        });
      } else {
        setAgencyPrecheck({
          loading: false,
          checkedOrn: trimmed,
          result: { canSubmit: false, message: msg },
          error: msg
        });
      }
    }
  };

  const handleOrnChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, orn: val }));

    // Clear previous result and backend error immediately upon edit
    setBackendErrors((prev) => ({ ...prev, orn: '' }));
    setAgencyPrecheck({ loading: false, checkedOrn: '', result: null, error: null });

    if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
    if (val.trim()) {
      agencyDebounceRef.current = setTimeout(() => {
        runAgencyCheck(val);
      }, 400);
    }
  };

  const handleOrnBlur = () => {
    setTouched((prev) => ({ ...prev, orn: true }));
    if (agencyDebounceRef.current) clearTimeout(agencyDebounceRef.current);
    if (formData.orn.trim()) {
      runAgencyCheck(formData.orn);
    }
  };

  // -------------------------------------------------------------
  // DEVELOPER Pre-check: debounced 400ms once name & email are filled, and on blur
  // -------------------------------------------------------------
  const runDeveloperCheck = async (nameVal, emailVal) => {
    const trimmedName = (nameVal || '').trim();
    const trimmedEmail = (emailVal || '').trim().toLowerCase();

    // Check once developer name and email are BOTH filled
    if (!trimmedName || !trimmedEmail) {
      setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return;
    }

    const key = `${trimmedName}:::${trimmedEmail}`;
    if (devPrecheck.checkedKey === key && devPrecheck.result) {
      return;
    }

    setDevPrecheck((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await cmpConnectApi.checkExistence({
        type: 'DEVELOPER',
        companyName: trimmedName,
        email: trimmedEmail
      });

      setDevPrecheck({
        loading: false,
        checkedKey: key,
        result: res?.data || null,
        error: null
      });
    } catch (err) {
      const msg = err.message || 'Error checking developer';
      if (err.status === 429) {
        setDevPrecheck({
          loading: false,
          checkedKey: key,
          result: { canSubmit: false, message: 'Too many checks. Please wait a minute before trying again.' },
          error: 'Too many checks. Please wait a minute before trying again.'
        });
      } else {
        setDevPrecheck({
          loading: false,
          checkedKey: key,
          result: { canSubmit: false, message: msg },
          error: msg
        });
      }
    }
  };

  const handleDevNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, companyName: val }));

    // Clear previous check result and backend error on edit
    setBackendErrors((prev) => ({ ...prev, companyName: '' }));
    setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

    if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    if (val.trim() && formData.email.trim()) {
      devDebounceRef.current = setTimeout(() => {
        runDeveloperCheck(val, formData.email);
      }, 400);
    }
  };

  const handleDevNameBlur = () => {
    setTouched((prev) => ({ ...prev, companyName: true }));
    if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
    if (formData.companyName.trim() && formData.email.trim()) {
      runDeveloperCheck(formData.companyName, formData.email);
    }
  };

  const handleContactEmailChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, email: val }));

    if (accountType === 'DEVELOPER') {
      setBackendErrors((prev) => ({ ...prev, companyName: '' }));
      setDevPrecheck({ loading: false, checkedKey: '', result: null, error: null });

      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
      if (formData.companyName.trim() && val.trim()) {
        devDebounceRef.current = setTimeout(() => {
          runDeveloperCheck(formData.companyName, val);
        }, 400);
      }
    }
  };

  const handleContactEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    if (accountType === 'DEVELOPER') {
      if (devDebounceRef.current) clearTimeout(devDebounceRef.current);
      if (formData.companyName.trim() && formData.email.trim()) {
        runDeveloperCheck(formData.companyName, formData.email);
      }
    }
  };

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach((k) => {
      allTouched[k] = true;
    });
    setTouched(allTouched);

    const currentErrors = validateForm(formData, accountType);
    if (Object.keys(currentErrors).length > 0) {
      return;
    }

    if (!canSubmitFromPrecheck || isSubmitting || rateLimitCountdown > 0) {
      return;
    }

    setIsSubmitting(true);
    setBackendErrors({ orn: '', companyName: '', general: '', network: false });

    // Send only the fields of the selected type
    let payload;
    if (accountType === 'AGENCY') {
      payload = {
        type: 'AGENCY',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        companyType: formData.companyType,
        emirate: formData.emirate,
        tradeLicenceStatus: formData.tradeLicenceStatus,
        orn: formData.orn.trim(),
        ownerFullName: formData.ownerFullName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerMobile: formData.ownerMobile.trim(),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminMobile: formData.adminMobile.trim()
      };
    } else {
      payload = {
        type: 'DEVELOPER',
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        companyName: formData.companyName.trim(),
        developerType: formData.developerType,
        emirate: formData.emirate,
        ownerFullName: formData.ownerFullName.trim(),
        ownerEmail: formData.ownerEmail.trim().toLowerCase(),
        ownerMobile: formData.ownerMobile.trim(),
        adminFullName: formData.adminFullName.trim(),
        adminEmail: formData.adminEmail.trim().toLowerCase(),
        adminMobile: formData.adminMobile.trim()
      };
    }

    try {
      const response = await cmpConnectApi.register(payload);
      if (response?.status === 'success' && response?.data) {
        setSuccessData(response.data);
      } else {
        throw new Error(response?.message || 'Registration failed.');
      }
    } catch (err) {
      const status = err.status;
      const msg = err.message || 'An error occurred during registration.';

      if (status === 400) {
        // 400 -> show message above the submit button
        setBackendErrors((prev) => ({ ...prev, general: msg }));
      } else if (status === 403) {
        // 403 -> show message on the ORN field
        setBackendErrors((prev) => ({ ...prev, orn: msg }));
        if (accountType === 'AGENCY') {
          setAgencyPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        }
      } else if (status === 409) {
        // 409 -> show message on the ORN field (AGENCY) or the name field (DEVELOPER). Disable submit.
        if (accountType === 'AGENCY') {
          setBackendErrors((prev) => ({ ...prev, orn: msg }));
          setAgencyPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        } else {
          setBackendErrors((prev) => ({ ...prev, companyName: msg }));
          setDevPrecheck((prev) => ({
            ...prev,
            result: { ...(prev.result || {}), canSubmit: false, message: msg }
          }));
        }
      } else if (status === 429) {
        // 429 -> "Please wait a minute and try again." Re-enable submit after 60 seconds.
        setBackendErrors((prev) => ({
          ...prev,
          general: 'Please wait a minute and try again.'
        }));
        setRateLimitCountdown(60);
      } else {
        // Network or 5xx -> keep all values and show a Retry button.
        setBackendErrors((prev) => ({
          ...prev,
          general: msg || 'Unable to connect to the server. Please check your connection and retry.',
          network: true
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: SUCCESS SCREEN
  // -------------------------------------------------------------
  if (successData) {
    return (
      <OnboardingLayout
        title="Cash My Property"
        subtitle="Registration request submitted."
        points={[
          "Your request is with our verification team",
          "Upload link sent to your registered email",
          "Link is active for 3 days to complete uploads",
          "Instant activation once documents are approved"
        ]}
      >
        <div className="reg-card wide">
          <div className="success-mark" style={{ margin: '0 auto 20px', width: 64, height: 64 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <p className="eyebrow" style={{ textAlign: 'center' }}>Registration received</p>
          <h2 style={{ textAlign: 'center', fontSize: '26px', marginBottom: 12 }}>
            Your registration is in.
          </h2>

          <p className="sub" style={{ textAlign: 'center', fontSize: '15px', maxWidth: '580px', margin: '0 auto 24px' }}>
            We have emailed you a link to upload your documents. The link is valid for 3 days.
          </p>

          <div
            className="summary"
            style={{
              background: 'var(--cmp-surface-sunken)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--cmp-border)',
              margin: '24px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}
          >
            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference number</dt>
              <dd style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cmp-brand)', marginTop: 4 }}>
                {successData.code}
              </dd>
            </div>

            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email address</dt>
              <dd style={{ fontSize: '15px', fontWeight: 600, marginTop: 4, wordBreak: 'break-all' }}>
                {successData.email}
              </dd>
            </div>

            <div>
              <dt style={{ fontSize: '12px', color: 'var(--cmp-text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link validity</dt>
              <dd style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cmp-text-muted)', marginTop: 4 }}>
                {formatUaeDateTime(successData.linkExpiresAt)}
              </dd>
            </div>
          </div>

          {successData.linkEmailStatus === 'FAILED' && (
            <div
              className="note"
              style={{
                background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
                border: '1px solid var(--cmp-warning)',
                color: 'var(--cmp-warning)',
                marginBottom: 20
              }}
            >
              ⚠️ Your request is saved, but we could not send the email yet. Our team will send the link shortly.
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p className="faint" style={{ fontSize: '13px' }}>
              Didn't receive the email? Check your spam folder or contact support at{' '}
              <a href="mailto:info@cmpdubai.com" style={{ color: 'var(--cmp-brand)', textDecoration: 'underline' }}>
                info@cmpdubai.com
              </a>.
            </p>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // -------------------------------------------------------------
  // RENDER: REGISTRATION FORM
  // -------------------------------------------------------------
  return (
    <OnboardingLayout
      title="Join Cash My Property"
      subtitle="One account for listings and Real Time Offer, on the app, the website and CMP Connect."
      points={[
        "Register your company or your projects",
        "Upload your documents once",
        "Track the checks as they happen",
        "Go live as soon as you are approved"
      ]}
    >
      <div className="reg-card wide">
        <p className="eyebrow">CMP Connect</p>
        <h2>Registration form</h2>
        <p className="sub">
          Submit your company registration request. Once received, we will send an upload link to complete your verification documents.
        </p>

        {/* 1. Registering as Toggle */}
        <div className="type-grid">
          <button
            type="button"
            className="type-card"
            aria-pressed={accountType === 'AGENCY'}
            onClick={() => handleAccountTypeChange('AGENCY')}
          >
            <span className="type-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m14 10v-2a4 4 0 0 0-3-3.87" />
              </svg>
            </span>
            <strong>Real estate company</strong>
            <span className="muted">Brokerages and agencies that list and sell other people’s property.</span>
            <span className="faint">Brokerage, agency, property management, holiday homes</span>
          </button>

          <button
            type="button"
            className="type-card"
            aria-pressed={accountType === 'DEVELOPER'}
            onClick={() => handleAccountTypeChange('DEVELOPER')}
          >
            <span className="type-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" />
              </svg>
            </span>
            <strong>Developer</strong>
            <span className="muted">Developers selling their own projects, off-plan or ready.</span>
            <span className="faint">Master developer, sub developer, project owner</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* 2. Contact Person Section */}
          <section className="form-section">
            <h3>Contact person</h3>
            <div className="form-grid">
              <div className="field half" data-invalid={touched.firstName && formErrors.firstName ? true : undefined}>
                <label htmlFor="reg-first-name">First name</label>
                <input
                  id="reg-first-name"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.firstName && formErrors.firstName && (
                  <span className="error-text">{formErrors.firstName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.lastName && formErrors.lastName ? true : undefined}>
                <label htmlFor="reg-last-name">Last name</label>
                <input
                  id="reg-last-name"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.lastName && formErrors.lastName && (
                  <span className="error-text">{formErrors.lastName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.email && formErrors.email ? true : undefined}>
                <label htmlFor="reg-contact-email">Email</label>
                <input
                  id="reg-contact-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleContactEmailChange}
                  onBlur={handleContactEmailBlur}
                  required
                />
                <span className="hint">We send the upload link and all updates here.</span>
                {touched.email && formErrors.email && (
                  <span className="error-text">{formErrors.email}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.phone && formErrors.phone ? true : undefined}>
                <label htmlFor="reg-contact-phone">Phone number</label>
                <input
                  id="reg-contact-phone"
                  name="phone"
                  type="tel"
                  placeholder="+971 50 412 7781"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.phone && formErrors.phone && (
                  <span className="error-text">{formErrors.phone}</span>
                )}
              </div>
            </div>
          </section>

          {/* 3. Company (AGENCY) or Developer (DEVELOPER) Section */}
          {accountType === 'AGENCY' ? (
            <section className="form-section">
              <h3>Company</h3>
              <div className="form-grid">
                <div className="field" data-invalid={touched.companyName && formErrors.companyName ? true : undefined}>
                  <label htmlFor="reg-company-name">Company name</label>
                  <input
                    id="reg-company-name"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  <span className="hint">As it appears on the trade licence.</span>
                  {touched.companyName && formErrors.companyName && (
                    <span className="error-text">{formErrors.companyName}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched.companyType && formErrors.companyType ? true : undefined}>
                  <label htmlFor="reg-company-type">Company type</label>
                  <select
                    id="reg-company-type"
                    name="companyType"
                    value={formData.companyType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Real estate brokerage">Real estate brokerage</option>
                    <option value="Property management">Property management</option>
                    <option value="Holiday homes operator">Holiday homes operator</option>
                    <option value="Other">Other</option>
                  </select>
                  {touched.companyType && formErrors.companyType && (
                    <span className="error-text">{formErrors.companyType}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched.emirate && formErrors.emirate ? true : undefined}>
                  <label htmlFor="reg-emirate">Emirate</label>
                  <select
                    id="reg-emirate"
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                  {touched.emirate && formErrors.emirate && (
                    <span className="error-text">{formErrors.emirate}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched.tradeLicenceStatus && formErrors.tradeLicenceStatus ? true : undefined}>
                  <label htmlFor="reg-trade-status">Trade licence status</label>
                  <select
                    id="reg-trade-status"
                    name="tradeLicenceStatus"
                    value={formData.tradeLicenceStatus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Valid and active">Valid and active</option>
                    <option value="Under renewal">Under renewal</option>
                    <option value="New application">New application</option>
                  </select>
                  {touched.tradeLicenceStatus && formErrors.tradeLicenceStatus && (
                    <span className="error-text">{formErrors.tradeLicenceStatus}</span>
                  )}
                </div>

                <div
                  className="field half"
                  data-invalid={
                    backendErrors.orn ||
                    (agencyPrecheck.result && agencyPrecheck.result.canSubmit === false) ||
                    (touched.orn && formErrors.orn)
                      ? true
                      : undefined
                  }
                >
                  <label htmlFor="reg-orn">RERA ORN number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-orn"
                      name="orn"
                      type="text"
                      placeholder="e.g. 90996"
                      value={formData.orn}
                      onChange={handleOrnChange}
                      onBlur={handleOrnBlur}
                      required
                    />
                    {agencyPrecheck.loading && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          fontSize: 12,
                          color: 'var(--cmp-text-faint)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <svg
                          style={{ animation: 'cmp-spin 0.85s linear infinite' }}
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        Checking...
                      </span>
                    )}
                  </div>

                  {backendErrors.orn && (
                    <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                      {backendErrors.orn}
                    </span>
                  )}

                  {touched.orn && formErrors.orn && !backendErrors.orn && (
                    <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                      {formErrors.orn}
                    </span>
                  )}

                  {!backendErrors.orn && agencyPrecheck.result && (
                    <>
                      {agencyPrecheck.result.canSubmit === false ? (
                        <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                          {agencyPrecheck.result.message || 'This ORN is not registered with RERA. Check the number or contact CMP.'}
                        </span>
                      ) : agencyPrecheck.result.whitelisted ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 4,
                            color: 'var(--cmp-success)',
                            fontSize: '13px',
                            fontWeight: 600
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          ORN verified with RERA
                        </span>
                      ) : agencyPrecheck.result.registeredOnApp ? (
                        <div
                          className="note"
                          style={{
                            background: 'color-mix(in srgb, var(--cmp-info) 10%, transparent)',
                            border: '1px solid var(--cmp-info)',
                            color: 'var(--cmp-info)',
                            fontSize: '12.5px',
                            marginTop: 6,
                            padding: '8px 10px'
                          }}
                        >
                          This agency already uses the CMP app. Registering here adds your documents to the same account.
                        </div>
                      ) : (
                        <div
                          className="note"
                          style={{
                            background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
                            border: '1px solid var(--cmp-warning)',
                            color: 'var(--cmp-warning)',
                            fontSize: '12.5px',
                            marginTop: 6,
                            padding: '8px 10px'
                          }}
                        >
                          We could not find this ORN in the RERA list. You can still submit. Our team will verify it.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          ) : (
            <section className="form-section">
              <h3>Developer</h3>
              <div className="form-grid">
                <div
                  className="field"
                  data-invalid={
                    backendErrors.companyName ||
                    (devPrecheck.result && devPrecheck.result.canSubmit === false) ||
                    (touched.companyName && formErrors.companyName)
                      ? true
                      : undefined
                  }
                >
                  <label htmlFor="reg-dev-name">Developer name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="reg-dev-name"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleDevNameChange}
                      onBlur={handleDevNameBlur}
                      required
                    />
                    {devPrecheck.loading && (
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          fontSize: 12,
                          color: 'var(--cmp-text-faint)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <svg
                          style={{ animation: 'cmp-spin 0.85s linear infinite' }}
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" />
                        </svg>
                        Checking...
                      </span>
                    )}
                  </div>

                  {backendErrors.companyName && (
                    <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                      {backendErrors.companyName}
                    </span>
                  )}

                  {touched.companyName && formErrors.companyName && !backendErrors.companyName && (
                    <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                      {formErrors.companyName}
                    </span>
                  )}

                  {!backendErrors.companyName && devPrecheck.result && devPrecheck.result.canSubmit === false && (
                    <span className="error-text" style={{ display: 'block', marginTop: 4 }}>
                      {devPrecheck.result.message || 'This developer registration cannot be submitted.'}
                    </span>
                  )}
                </div>

                <div className="field half" data-invalid={touched.developerType && formErrors.developerType ? true : undefined}>
                  <label htmlFor="reg-dev-type">Developer type</label>
                  <select
                    id="reg-dev-type"
                    name="developerType"
                    value={formData.developerType}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Master developer">Master developer</option>
                    <option value="Sub developer">Sub developer</option>
                  </select>
                  {touched.developerType && formErrors.developerType && (
                    <span className="error-text">{formErrors.developerType}</span>
                  )}
                </div>

                <div className="field half" data-invalid={touched.emirate && formErrors.emirate ? true : undefined}>
                  <label htmlFor="reg-dev-emirate">Emirate</label>
                  <select
                    id="reg-dev-emirate"
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                  {touched.emirate && formErrors.emirate && (
                    <span className="error-text">{formErrors.emirate}</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 4. Owner Section */}
          <section className="form-section">
            <h3>Owner</h3>
            <div className="form-grid">
              <div className="field" data-invalid={touched.ownerFullName && formErrors.ownerFullName ? true : undefined}>
                <label htmlFor="reg-owner-name">Owner full name</label>
                <input
                  id="reg-owner-name"
                  name="ownerFullName"
                  type="text"
                  value={formData.ownerFullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerFullName && formErrors.ownerFullName && (
                  <span className="error-text">{formErrors.ownerFullName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.ownerEmail && formErrors.ownerEmail ? true : undefined}>
                <label htmlFor="reg-owner-email">Owner email</label>
                <input
                  id="reg-owner-email"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerEmail && formErrors.ownerEmail && (
                  <span className="error-text">{formErrors.ownerEmail}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.ownerMobile && formErrors.ownerMobile ? true : undefined}>
                <label htmlFor="reg-owner-mobile">Owner mobile</label>
                <input
                  id="reg-owner-mobile"
                  name="ownerMobile"
                  type="tel"
                  placeholder="+971 50 412 7781"
                  value={formData.ownerMobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.ownerMobile && formErrors.ownerMobile && (
                  <span className="error-text">{formErrors.ownerMobile}</span>
                )}
              </div>
            </div>
          </section>

          {/* 5. Admin Section */}
          <section className="form-section">
            <h3>Admin</h3>
            <div className="form-grid">
              <div className="field" data-invalid={touched.adminFullName && formErrors.adminFullName ? true : undefined}>
                <label htmlFor="reg-admin-name">Admin full name</label>
                <input
                  id="reg-admin-name"
                  name="adminFullName"
                  type="text"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <span className="hint">The person who runs the account day to day.</span>
                {touched.adminFullName && formErrors.adminFullName && (
                  <span className="error-text">{formErrors.adminFullName}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.adminEmail && formErrors.adminEmail ? true : undefined}>
                <label htmlFor="reg-admin-email">Admin email</label>
                <input
                  id="reg-admin-email"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.adminEmail && formErrors.adminEmail && (
                  <span className="error-text">{formErrors.adminEmail}</span>
                )}
              </div>

              <div className="field half" data-invalid={touched.adminMobile && formErrors.adminMobile ? true : undefined}>
                <label htmlFor="reg-admin-mobile">Admin mobile</label>
                <input
                  id="reg-admin-mobile"
                  name="adminMobile"
                  type="tel"
                  placeholder="+971 50 412 7781"
                  value={formData.adminMobile}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                {touched.adminMobile && formErrors.adminMobile && (
                  <span className="error-text">{formErrors.adminMobile}</span>
                )}
              </div>
            </div>
          </section>

          {/* 6. Submit Button & Server Feedback */}
          {backendErrors.general && (
            <div
              className="note"
              style={{
                background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                marginTop: 20,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <span>{backendErrors.general}</span>
              {backendErrors.network && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSubmit()}
                  style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)', flexShrink: 0 }}
                >
                  Retry
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={!isSubmitEnabled}
              style={{
                height: 48,
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              {isSubmitting && (
                <svg
                  style={{ animation: 'cmp-spin 0.85s linear infinite' }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              )}
              {isSubmitting
                ? 'Submitting registration...'
                : rateLimitCountdown > 0
                ? `Please wait (${rateLimitCountdown}s)`
                : 'Submit registration'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
}
