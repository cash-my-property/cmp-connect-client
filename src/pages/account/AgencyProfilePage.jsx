import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  Building2,
  User,
  ShieldCheck,
  Check,
  Save,
  LogOut,
  Lock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Award,
  AlertCircle
} from 'lucide-react';

export default function AgencyProfilePage() {
  const navigate = useNavigate();
  const { account, setAccount, agency, setAgency, authToken, isLiveData, isMockData, logout, can } = useApp();

  if (!isMockData && account && !can('company.view')) {
    return <Navigate to="/account/security" replace />;
  }

  // 1. Organization & Agency Form State
  const [orgForm, setOrgForm] = useState({
    name: account?.organization?.companyName || agency?.name || '',
    code: account?.organization?.code || '',
    orn: account?.organization?.orn || agency?.orn || '',
    logo: account?.organization?.logo || '',
    onboardingStatus: account?.organization?.onboardingStatus || 'VERIFIED',
    tradeLicense: agency?.tradeLicense && agency.tradeLicense !== '—' ? agency.tradeLicense : '',
    ded: agency?.ded && agency.ded !== '—' ? agency.ded : '',
    email: agency?.email && agency.email !== '—' ? agency.email : '',
    phone: agency?.phone && agency.phone !== '—' ? agency.phone : '',
    whatsapp: agency?.whatsapp && agency.whatsapp !== '—' ? agency.whatsapp : '',
    address: agency?.address && agency.address !== '—' ? agency.address : '',
    website: agency?.website && agency.website !== '—' ? agency.website : ''
  });

  // 2. Owner / Account Holder Form State
  const [userForm, setUserForm] = useState({
    fullName: account?.fullName || agency?.currentUser?.name || '',
    code: account?.code || '',
    email: account?.email || agency?.currentUser?.email || '',
    mobile: account?.mobile || '',
    role: account?.role?.name || account?.role?.key || agency?.currentUser?.role || 'Owner',
    accountType: account?.accountType || 'AGENCY'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync state whenever account data arrives or updates
  useEffect(() => {
    if (account) {
      setOrgForm((prev) => ({
        ...prev,
        name: account.organization?.companyName || prev.name,
        code: account.organization?.code || prev.code,
        orn: account.organization?.orn || prev.orn,
        logo: account.organization?.logo || prev.logo,
        onboardingStatus: account.organization?.onboardingStatus || prev.onboardingStatus
      }));

      setUserForm({
        fullName: account.fullName || '',
        code: account.code || '',
        email: account.email || '',
        mobile: account.mobile || '',
        role: account.role?.name || account.role?.key || 'Owner',
        accountType: account.accountType || 'AGENCY'
      });
    }
  }, [account]);

  // Initial load: Fetch real /auth/me data to guarantee freshest records
  useEffect(() => {
    cmpConnectApi
      .getMe(authToken)
      .then((res) => {
        const acc = res?.data;
        if (acc) {
          if (setAccount) setAccount(acc);
          setOrgForm((prev) => ({
            ...prev,
            name: acc.organization?.companyName || prev.name,
            code: acc.organization?.code || prev.code,
            orn: acc.organization?.orn || prev.orn,
            logo: acc.organization?.logo || prev.logo,
            onboardingStatus: acc.organization?.onboardingStatus || prev.onboardingStatus
          }));

          setUserForm({
            fullName: acc.fullName || '',
            code: acc.code || '',
            email: acc.email || '',
            mobile: acc.mobile || '',
            role: acc.role?.name || acc.role?.key || 'Owner',
            accountType: acc.accountType || 'AGENCY'
          });
        }
      })
      .catch(() => {
        // Silently use existing context data if network fails
      });
  }, [authToken]);

  const handleSignOut = () => {
    logout();
    navigate('/signin');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
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
          initials:
            userForm.fullName
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'U'
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

        if (setAccount) {
          setAccount((prev) => ({
            ...prev,
            fullName: userForm.fullName,
            email: userForm.email,
            mobile: userForm.mobile
          }));
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const userInitials =
    userForm.fullName
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'HA';

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

            {orgForm.code && (
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
                Org Code: <strong>{orgForm.code}</strong>
              </span>
            )}
          </div>

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
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
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
                  value={orgForm.orn}
                  onChange={(e) => setOrgForm({ ...orgForm, orn: e.target.value })}
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
                    value={orgForm.code || '—'}
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
                    value={orgForm.onboardingStatus || 'VERIFIED'}
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

            {/* Row 3: Trade License & DED License */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={orgForm.tradeLicense}
                  onChange={(e) => setOrgForm({ ...orgForm, tradeLicense: e.target.value })}
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
                  onChange={(e) => setOrgForm({ ...orgForm, ded: e.target.value })}
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
                  value={orgForm.email}
                  onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
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
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
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
                  onChange={(e) => setOrgForm({ ...orgForm, whatsapp: e.target.value })}
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
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
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
                onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
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
