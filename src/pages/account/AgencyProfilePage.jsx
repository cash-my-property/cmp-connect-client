import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  Building2,
  ShieldCheck,
  Check,
  Save,
  LogOut,
  Lock,
  Award,
  AlertCircle
} from 'lucide-react';

// ── Form helpers ──

// Mock agency mein khali field "—" hota hai → form mein ''
const cleanField = (value) => (value && value !== '—' ? value : '');

// "Layla Haddad" → "LH"
const initialsOf = (name, fallback) =>
  (name || '')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || fallback;

// /auth/me ka organization → org form (jo account mein nahi woh pehle wala rakho)
const mergeOrgFromAccount = (prev, acc) => ({
  ...prev,
  name: acc.organization?.companyName || prev.name,
  code: acc.organization?.code || prev.code,
  orn: acc.organization?.orn || prev.orn,
  logo: acc.organization?.logo || prev.logo,
  onboardingStatus: acc.organization?.onboardingStatus || prev.onboardingStatus
});

const userFormFromAccount = (acc) => ({
  fullName: acc.fullName || '',
  code: acc.code || '',
  email: acc.email || '',
  mobile: acc.mobile || '',
  role: acc.role?.name || acc.role?.key || 'Owner',
  accountType: acc.accountType || 'AGENCY'
});

// Company profile API (PATCH) sirf yahi keys leta hai
const COMPANY_EDITABLE_KEYS = ['contactFirstName', 'contactLastName', 'adminContact', 'adminEmail', 'email', 'phone', 'emirate', 'companyType'];
const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];
const COMPANY_TYPES = ['Real estate brokerage', 'Property management', 'Holiday homes operator', 'Other'];

// GET /company/profile → editable form values (null → '')
const companyFormFromProfile = (profile) => {
  const src = { ...(profile?.organisation || {}), ...(profile?.contact || {}) };
  return COMPANY_EDITABLE_KEYS.reduce((acc, k) => ({ ...acc, [k]: src[k] ?? '' }), {});
};

export default function AgencyProfilePage() {
  const navigate = useNavigate();
  const { account, setAccount, agency, setAgency, authToken, isLiveData, isMockData, logout, can } = useApp();

  // 1. Organization & Agency Form State
  const [orgForm, setOrgForm] = useState(() => ({
    name: account?.organization?.companyName || agency?.name || '',
    code: account?.organization?.code || '',
    orn: account?.organization?.orn || agency?.orn || '',
    logo: account?.organization?.logo || '',
    onboardingStatus: account?.organization?.onboardingStatus || '',
    tradeLicense: cleanField(agency?.tradeLicense),
    ded: cleanField(agency?.ded),
    email: cleanField(agency?.email),
    phone: cleanField(agency?.phone),
    whatsapp: cleanField(agency?.whatsapp),
    address: cleanField(agency?.address),
    website: cleanField(agency?.website)
  }));

  // 2. Owner / Account Holder Form State
  const [userForm, setUserForm] = useState(() => ({
    fullName: account?.fullName || agency?.currentUser?.name || '',
    code: account?.code || '',
    email: account?.email || agency?.currentUser?.email || '',
    mobile: account?.mobile || '',
    role: account?.role?.name || account?.role?.key || agency?.currentUser?.role || 'Owner',
    accountType: account?.accountType || 'AGENCY'
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Account aaye / badle → forms sync
  useEffect(() => {
    if (!account) return;
    setOrgForm((prev) => mergeOrgFromAccount(prev, account));
    setUserForm(userFormFromAccount(account));
  }, [account]);

  // Pehli load: /auth/me se taaza data. setAccount → upar wala effect forms sync karta hai.
  useEffect(() => {
    cmpConnectApi
      .getMe(authToken)
      .then((res) => {
        const acc = res?.data;
        if (acc) setAccount(acc);
      })
      .catch(() => {
        // Network fail → context wala data hi chalega
      });
  }, [authToken, setAccount]);

  // Live: GET /company/profile (agency only — developer ko 403 → purana behaviour)
  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyForm, setCompanyForm] = useState(() => companyFormFromProfile(null));

  useEffect(() => {
    if (!isLiveData || !authToken) return undefined;
    let cancelled = false;
    cmpConnectApi
      .getCompanyProfile(authToken)
      .then((res) => {
        if (cancelled || !res?.data) return;
        setCompanyProfile(res.data);
        setCompanyForm(companyFormFromProfile(res.data));
      })
      .catch(() => {
        // 403 (developer) / fail → company card purane tareeke se (read-only)
        if (!cancelled) setCompanyProfile(null);
      });
    return () => { cancelled = true; };
  }, [isLiveData, authToken]);

  // Permission redirect sab hooks ke baad (hooks ka order har render pe same rehna chahiye)
  if (!isMockData && account && !can('company.view')) {
    return <Navigate to="/account/security" replace />;
  }

  // Live mein organisation fields CMP manage karta hai → read-only
  const orgLocked = isLiveData;
  // Company profile mila hai → contact fields live editable (company.manage ho to)
  const companyLive = isLiveData && !!companyProfile;
  const contactLocked = !companyLive || !can('company.manage');
  const org = companyProfile?.organisation || {};

  // Live company display values (API wale) — warna purana orgForm
  const displayName = companyLive ? org.companyName || '' : orgForm.name;
  const displayOrn = companyLive ? org.orn || '' : orgForm.orn;
  const displayCode = companyLive ? org.agencyCode || orgForm.code : orgForm.code;
  const displayEmail = companyLive ? companyForm.email : orgForm.email;
  const displayPhone = companyLive ? companyForm.phone : orgForm.phone;
  const setCompanyField = (key) => (e) => setCompanyForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 0. Live company contact → PATCH /company/profile (sirf badli hui keys, '' = clear)
      if (companyLive && !contactLocked) {
        const original = companyFormFromProfile(companyProfile);
        const changes = {};
        COMPANY_EDITABLE_KEYS.forEach((k) => {
          const next = (companyForm[k] ?? '').trim();
          if (next !== String(original[k] ?? '').trim()) {
            // companyType '' allow nahi → null bhejo
            changes[k] = k === 'companyType' && next === '' ? null : next;
          }
        });
        if (Object.keys(changes).length) {
          const res = await cmpConnectApi.updateCompanyProfile(changes, authToken);
          if (res?.data) {
            setCompanyProfile(res.data);
            setCompanyForm(companyFormFromProfile(res.data));
          }
        }
      }

      // 1. Update Context agency state
      setAgency((prev) => ({
        ...prev,
        name: orgForm.name,
        orn: orgForm.orn,
        tradeLicense: orgForm.tradeLicense,
        ded: orgForm.ded,
        email: orgForm.email,
        phone: orgForm.phone,
        whatsapp: orgForm.whatsapp,
        address: orgForm.address,
        website: orgForm.website,
        currentUser: {
          ...prev.currentUser,
          name: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          initials: initialsOf(userForm.fullName, 'U')
        }
      }));

      // 2. Persist Owner Account details to backend if live
      if (isLiveData && (account?.id || account?._id)) {
        const memberId = account.id || account._id;
        const nameParts = (userForm.fullName || '').trim().split(/\s+/);
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        await cmpConnectApi.updateMemberAccount(
          memberId,
          {
            firstName,
            lastName,
            mobile: userForm.mobile || null,
            email: userForm.email || null
          },
          authToken
        );

        setAccount((prev) => ({
          ...prev,
          fullName: userForm.fullName,
          email: userForm.email,
          mobile: userForm.mobile
        }));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials = initialsOf(userForm.fullName, 'HA');

  return (
    <div style={{ maxWidth: '960px', paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
          Account Profile & Registrations
        </h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Manage your registered organization profile, trade licences, and primary account holder credentials.
        </p>
      </div>

      {errorMessage && (
        <div
          className="row"
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            gap: '10px',
            fontSize: '13.5px'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {saved && (
        <div
          className="row"
          style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            gap: '10px',
            fontSize: '13.5px'
          }}
        >
          <Check size={18} style={{ flexShrink: 0 }} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        {/* ============================================================== */}
        {/* 1. ORGANIZATION / AGENCY PROFILE CARD                          */}
        {/* ============================================================== */}
        <section className="card" style={{ padding: '24px' }}>
          {/* Section Header */}
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--cmp-border)',
              paddingBottom: '16px',
              marginBottom: '20px',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div className="row" style={{ gap: '14px', alignItems: 'center' }}>
              {orgForm.logo ? (
                <img
                  src={orgForm.logo}
                  alt={orgForm.name || 'Company Logo'}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    objectFit: 'contain',
                    border: '1px solid var(--cmp-border)',
                    background: 'var(--cmp-surface-subtle, #f9fafb)',
                    padding: '2px'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: 'var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <Building2 size={24} />
                </div>
              )}

              <div>
                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                    Organization Details
                  </h2>
                  {orgForm.onboardingStatus && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ShieldCheck size={12} /> {orgForm.onboardingStatus}
                    </span>
                  )}
                </div>
                <p className="faint" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                  Official agency registrations, licensing and public directory credentials.
                </p>
              </div>
            </div>

            {displayCode && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.04))',
                  border: '1px solid var(--cmp-border)',
                  color: 'var(--cmp-text-muted)'
                }}
              >
                Org Code: <strong>{displayCode}</strong>
              </span>
            )}
          </div>

          {orgLocked && (
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px' }}>
              Organization details are managed by CMP. To change them, contact your CMP account manager.
              {companyLive && !contactLocked && ' You can update company type, emirate and contact details below.'}
            </p>
          )}

          {/* Organization Fields Grid */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Row 1: Company Name & ORN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Agency / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  placeholder="e.g. Cash My Property"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  RERA Office Reg. Number (ORN) *
                </label>
                <input
                  type="text"
                  required
                  value={displayOrn}
                  readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, orn: e.target.value })}
                  placeholder="e.g. 101011"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
                <p className="faint" style={{ fontSize: '11.5px', margin: '4px 0 0' }}>
                  Official registration licence verified by Dubai Land Department (RERA).
                </p>
              </div>
            </div>

            {/* Row 2: Organization Code & Onboarding Status (System Identifiers) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Organization Code (Read-Only)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={displayCode || '—'}
                    style={{
                      width: '100%',
                      height: '40px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.02))',
                      cursor: 'default',
                      color: 'var(--cmp-text-muted)'
                    }}
                  />
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--cmp-text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Onboarding & Verification Status
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={companyLive ? (org.isVerified ? 'Verified' : 'Not verified') : orgForm.onboardingStatus || '—'}
                    style={{
                      width: '100%',
                      height: '40px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.02))',
                      cursor: 'default',
                      color: '#15803d',
                      fontWeight: 600
                    }}
                  />
                  <ShieldCheck
                    size={16}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#15803d',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Live company profile: Arabic name (read-only) + company type & emirate */}
            {companyLive && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Company Name (Arabic)
                  </label>
                  <input
                    type="text"
                    readOnly
                    dir="rtl"
                    value={org.companyNameArabic || '—'}
                    style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Company Type
                  </label>
                  <select
                    value={companyForm.companyType}
                    disabled={contactLocked}
                    onChange={setCompanyField('companyType')}
                    style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                  >
                    <option value="">Not set</option>
                    {COMPANY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    {companyForm.companyType && !COMPANY_TYPES.includes(companyForm.companyType) && (
                      <option value={companyForm.companyType}>{companyForm.companyType}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Emirate
                  </label>
                  <select
                    value={companyForm.emirate}
                    disabled={contactLocked}
                    onChange={setCompanyField('emirate')}
                    style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                  >
                    <option value="">Not set</option>
                    {EMIRATES.map((em) => (
                      <option key={em} value={em}>{em}</option>
                    ))}
                    {companyForm.emirate && !EMIRATES.includes(companyForm.emirate) && (
                      <option value={companyForm.emirate}>{companyForm.emirate}</option>
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Live company profile: contact person + admin contact */}
            {companyLive && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {[
                  { key: 'contactFirstName', label: 'Contact First Name', type: 'text', placeholder: 'e.g. Layla' },
                  { key: 'contactLastName', label: 'Contact Last Name', type: 'text', placeholder: 'e.g. Haddad' },
                  { key: 'adminContact', label: 'Admin Contact Number', type: 'tel', placeholder: 'e.g. +971 50 123 4567' },
                  { key: 'adminEmail', label: 'Admin Email', type: 'email', placeholder: 'e.g. admin@agency.com' }
                ].map((fld) => (
                  <div key={fld.key}>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      {fld.label}
                    </label>
                    <input
                      type={fld.type}
                      value={companyForm[fld.key]}
                      readOnly={contactLocked}
                      onChange={setCompanyField(fld.key)}
                      placeholder={fld.placeholder}
                      style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Row 3: Trade License & DED License */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={orgForm.tradeLicense}
                  readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, tradeLicense: e.target.value })}
                  placeholder="e.g. 782910"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Dubai Economy (DED) License
                </label>
                <input
                  type="text"
                  value={orgForm.ded}
                  readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, ded: e.target.value })}
                  placeholder="e.g. DED-449102"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>
            </div>

            {/* Row 4: Contact Information */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Agency Email
                </label>
                <input
                  type="email"
                  value={displayEmail}
                  readOnly={companyLive ? contactLocked : orgLocked}
                  onChange={companyLive ? setCompanyField('email') : (e) => setOrgForm({ ...orgForm, email: e.target.value })}
                  placeholder="e.g. info@agency.com"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Office Phone
                </label>
                <input
                  type="tel"
                  value={displayPhone}
                  readOnly={companyLive ? contactLocked : orgLocked}
                  onChange={companyLive ? setCompanyField('phone') : (e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  placeholder="e.g. +971 4 123 4567"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Official WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={orgForm.whatsapp}
                  readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, whatsapp: e.target.value })}
                  placeholder="e.g. +971 50 123 4567"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>
            </div>

            {/* Row 5: Physical Address */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Office Address
              </label>
              <input
                type="text"
                value={orgForm.address}
                readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                placeholder="e.g. Office 1402, Control Tower, Motor City, Dubai, UAE"
                style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
              />
            </div>

            {/* Row 6: Website URL */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Agency Website URL
              </label>
              <input
                type="url"
                value={orgForm.website}
                readOnly={orgLocked} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                placeholder="https://www.agency.com"
                style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
              />
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. OWNER / PRIMARY ACCOUNT HOLDER CARD                         */}
        {/* ============================================================== */}
        <section className="card" style={{ padding: '24px' }}>
          {/* Section Header */}
          <div
            className="row"
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--cmp-border)',
              paddingBottom: '16px',
              marginBottom: '20px',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div className="row" style={{ gap: '14px', alignItems: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'var(--cmp-brand-subtle)',
                  color: 'var(--cmp-brand)',
                  fontWeight: 700,
                  fontSize: '16px',
                  display: 'grid',
                  placeItems: 'center',
                  border: '2px solid var(--cmp-border)'
                }}
              >
                {userInitials}
              </div>

              <div>
                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                    Owner & Account Holder Details
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: 'var(--cmp-brand-subtle)',
                      color: 'var(--cmp-brand)',
                      border: '1px solid var(--cmp-brand-border, rgba(0,0,0,0.1))',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Award size={12} /> {userForm.role}
                  </span>
                </div>
                <p className="faint" style={{ margin: '3px 0 0', fontSize: '13px' }}>
                  Personal credentials and sign-in information of the primary account owner.
                </p>
              </div>
            </div>

            {userForm.code && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.04))',
                  border: '1px solid var(--cmp-border)',
                  color: 'var(--cmp-text-muted)'
                }}
              >
                User Code: <strong>{userForm.code}</strong>
              </span>
            )}
          </div>

          {/* Owner Fields Grid */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Row 1: Full Name & User Code */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="e.g. Hasan Ali"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  User Code (System ID)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={userForm.code || '—'}
                    style={{
                      width: '100%',
                      height: '40px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.02))',
                      cursor: 'default',
                      color: 'var(--cmp-text-muted)'
                    }}
                  />
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--cmp-text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Login Email & Mobile Number */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. ihasanalyy@gmail.com"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
                <p className="faint" style={{ fontSize: '11.5px', margin: '4px 0 0' }}>
                  Used for sign-in and security notifications.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={userForm.mobile}
                  onChange={(e) => setUserForm({ ...userForm, mobile: e.target.value })}
                  placeholder="e.g. +971 50 123 4567"
                  style={{ width: '100%', height: '40px', fontSize: '13.5px' }}
                />
                <p className="faint" style={{ fontSize: '11.5px', margin: '4px 0 0' }}>
                  Verified contact number for critical alerts.
                </p>
              </div>
            </div>

            {/* Row 3: Role & Account Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Assigned Role (Permissions)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={userForm.role || 'Owner'}
                    style={{
                      width: '100%',
                      height: '40px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.02))',
                      cursor: 'default',
                      color: 'var(--cmp-text-muted)'
                    }}
                  />
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--cmp-text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Account Type
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    readOnly
                    value={userForm.accountType || 'AGENCY'}
                    style={{
                      width: '100%',
                      height: '40px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-subtle, rgba(0,0,0,0.02))',
                      cursor: 'default',
                      color: 'var(--cmp-text-muted)'
                    }}
                  />
                  <Lock
                    size={14}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--cmp-text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
            style={{
              height: '42px',
              padding: '0 24px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            <span>{isSaving ? 'Saving changes...' : saved ? 'Changes saved!' : 'Save changes'}</span>
          </button>
        </div>
      </form>

      {/* ============================================================== */}
      {/* 3. CURRENT SESSION & SIGN OUT CARD                             */}
      {/* ============================================================== */}
      <div
        className="card"
        style={{
          padding: '24px',
          marginTop: '24px',
          border: '1px solid var(--cmp-border)'
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px' }}>
          Current Active Session
        </h3>
        <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px' }}>
          You are currently signed in as <strong>{userForm.fullName || 'User'}</strong> ({userForm.email || '—'}) with{' '}
          <strong>{userForm.role || 'Owner'}</strong> permissions.
        </p>

        <button
          type="button"
          onClick={handleSignOut}
          className="btn btn-outline"
          style={{
            borderColor: 'var(--cmp-danger, #ef4444)',
            color: 'var(--cmp-danger, #ef4444)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          <LogOut size={15} />
          <span>Sign out of CMP Connect</span>
        </button>
      </div>
    </div>
  );
}
