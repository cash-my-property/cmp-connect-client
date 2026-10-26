import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  Check,
  ShieldCheck,
  Upload,
  ChevronDown,
  Globe,
  Award,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  UserCheck,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

export default function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authToken, account } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [rawMember, setRawMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneCode: '+971',
    phone: '',
    email: '',
    role: 'Member',
    // Public profile
    displayedName: '',
    publicEmail: '',
    publicNumberCode: '+971',
    publicNumber: '',
    secondaryCode: '+971',
    secondaryNumber: '',
    whatsappCode: '+971',
    whatsapp: '',
    // Compliance
    brn: '',
    brnExpiry: '',
    bln: '',
    otherLicense: '',
    otherExpiry: '',
    // About
    experienceSince: '2026',
    languages: 'English',
    nationality: 'Emirati',
    position: 'Agent',
    linkedin: '',
    description: '',
    descriptionAr: ''
  });

  const [isPublicCollapsed, setIsPublicCollapsed] = useState(false);
  const [usePrivateInfo, setUsePrivateInfo] = useState(true);
  const [profileScore, setProfileScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const populateMember = (found) => {
    const fullName = found.fullName || found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || '';
    const parts = fullName.split(' ');
    const fName = found.firstName || parts[0] || '';
    const lName = found.lastName || parts.slice(1).join(' ') || '';
    const mobile = found.mobile || found.phone || '';
    const roleName = found.role?.name || (typeof found.role === 'string' ? found.role : 'Member');
    const brnVal = found.compliance?.brn || found.brn || '';
    const brnExp = found.compliance?.brnExpiry ? found.compliance.brnExpiry.split('T')[0] : '';
    const prof = found.profile || {};

    setFormData((prev) => ({
      ...prev,
      firstName: fName,
      lastName: lName,
      email: found.email || '',
      phone: mobile.replace(/^\+971/, '').trim(),
      role: roleName,
      displayedName: prof.publicName || fullName,
      publicEmail: prof.publicEmail || found.email || '',
      publicNumber: (prof.publicPhone || mobile).replace(/^\+971/, '').trim(),
      whatsapp: (prof.whatsapp || mobile).replace(/^\+971/, '').trim(),
      brn: brnVal,
      brnExpiry: brnExp,
      bln: prof.bln || '',
      otherLicence: prof.otherLicence || '',
      otherLicenceExpiry: prof.otherLicenceExpiry ? prof.otherLicenceExpiry.split('T')[0] : '',
      experienceSince: prof.experienceSince ? String(prof.experienceSince) : '',
      languages: Array.isArray(prof.languages) ? prof.languages.join(', ') : (prof.languages || 'English, Arabic'),
      nationality: prof.nationality || 'Emirati',
      position: prof.position || 'Agent',
      linkedin: prof.linkedin || '',
      description: prof.description || '',
      descriptionAr: prof.descriptionAr || '',
      photo: prof.photo?.url || found.photo || ''
    }));
    setUsePrivateInfo(prof.useAccountInfo !== undefined ? prof.useAccountInfo : true);
    setRawMember(found);
    setProfileScore(found.verificationStatus === 'VERIFIED' ? 100 : 50);
  };

  useEffect(() => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    const targetMemberId = id || account?.id || account?._id;
    if (!targetMemberId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    cmpConnectApi.getMember(targetMemberId, authToken)
      .then((res) => {
        if (res?.data) {
          populateMember(res.data);
        } else {
          fallbackList();
        }
      })
      .catch((err) => {
        console.warn('[MemberProfilePage] getMember failed, trying listMembers:', err.message);
        fallbackList();
      })
      .finally(() => {
        setIsLoading(false);
      });

    function fallbackList() {
      cmpConnectApi.listMembers({ limit: 100 }, authToken)
        .then((res) => {
          if (res?.data) {
            const found = res.data.find((m) => (m.id === targetMemberId || m._id === targetMemberId)) || (account?.id === targetMemberId ? account : null);
            if (found) populateMember(found);
          }
        })
        .catch(() => {});
    }
  }, [id, authToken, account]);

  const handleSaveAccount = async (e) => {
    e?.preventDefault();
    const targetMemberId = id || account?.id || account?._id;
    if (!targetMemberId) return;

    setIsSaving(true);
    try {
      const cleanMobile = formData.phone
        ? `${formData.phoneCode || '+971'}${formData.phone.replace(/^0+/, '').replace(/\s+/g, '')}`
        : undefined;

      await cmpConnectApi.updateMemberAccount(
        targetMemberId,
        {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || undefined,
          mobile: cleanMobile,
          email: formData.email.trim().toLowerCase()
        },
        authToken
      );
      alert('Account details updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update account details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    const targetMemberId = id || account?.id || account?._id;
    if (!targetMemberId) return;

    setIsSaving(true);
    try {
      const profilePayload = {
        useAccountInfo: Boolean(usePrivateInfo),
        publicName: formData.displayedName.trim() || undefined,
        publicEmail: formData.publicEmail.trim() || undefined,
        publicPhone: formData.publicNumber ? `+971${formData.publicNumber.replace(/\s+/g, '')}` : undefined,
        whatsapp: formData.whatsapp ? `+971${formData.whatsapp.replace(/\s+/g, '')}` : undefined,
        bln: formData.bln.trim() || undefined,
        otherLicence: formData.otherLicence.trim() || undefined,
        otherLicenceExpiry: formData.otherLicenceExpiry || undefined,
        experienceSince: formData.experienceSince ? Number(formData.experienceSince) : undefined,
        languages: formData.languages ? formData.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
        nationality: formData.nationality.trim() || undefined,
        position: formData.position.trim() || undefined,
        linkedin: formData.linkedin.trim() || undefined,
        description: formData.description.trim() || undefined,
        descriptionAr: formData.descriptionAr.trim() || undefined
      };

      await cmpConnectApi.updateMemberProfile(targetMemberId, profilePayload, authToken);
      alert('Public profile updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update public profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    try {
      await handleSaveAccount();
      await handleSaveProfile();
      navigate('/team/members');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile photo size must be under 5 MB.');
      return;
    }

    const targetMemberId = id || account?.id || account?._id;
    if (!targetMemberId) return;

    setIsUploadingPhoto(true);
    try {
      const sigRes = await cmpConnectApi.getMemberPhotoSignature(targetMemberId, authToken);
      const sig = sigRes?.data;
      if (!sig) throw new Error('Could not obtain signed upload signature for photo.');

      const uploaded = await cmpConnectApi.uploadMemberPhoto(file, sig);
      await cmpConnectApi.updateMemberProfile(targetMemberId, { photo: uploaded }, authToken);
      setFormData((prev) => ({ ...prev, photo: uploaded.url }));
      alert('Profile photo updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to upload profile photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const memberInitials = (formData.displayedName || formData.firstName || 'U')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div>
      {/* Top Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div>
          <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <NavLink to="/team/members" className="btn btn-ghost btn-sm" style={{ padding: '0 4px' }}>
              <ArrowLeft size={16} />
              <span>Back to Members</span>
            </NavLink>
          </div>
          <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
            Member profile
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Manage agency permissions, private contact info, and public portal bio.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
            <span>Save all changes</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
          Loading member profile...
        </div>
      ) : (
        <>
          {/* SECTION 1: Account details */}
          <section className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Account details</h2>
              <span className="muted" style={{ fontSize: '13px' }}>{formData.role || 'Member'}</span>
            </div>

            {/* Member Metadata Chips Bar */}
            <div
              className="row"
              style={{
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--cmp-surface-sunken)',
                borderRadius: '8px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: '12.5px'
              }}
            >
              {rawMember?.code && (
                <span className="badge" style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                  ID: {rawMember.code}
                </span>
              )}
              {rawMember?.isSelf && (
                <span className="badge badge-brand" style={{ fontWeight: 700 }}>
                  You
                </span>
              )}
              {rawMember?.isOwner && (
                <span className="badge" style={{ background: 'rgba(200, 130, 40, 0.15)', color: 'var(--cmp-accent)', fontWeight: 700 }}>
                  ★ Agency Owner
                </span>
              )}
              <span className="badge" style={{ textTransform: 'capitalize' }}>
                Status: {rawMember?.status?.toLowerCase() || 'active'}
              </span>
              <span className="badge" style={{ textTransform: 'capitalize' }}>
                Verification: {rawMember?.verificationStatus?.toLowerCase() || 'unverified'}
              </span>
              {rawMember?.createdAt && (
                <span className="faint" style={{ marginLeft: 'auto' }}>
                  Joined: {formatDate(rawMember.createdAt)}
                </span>
              )}
              {rawMember?.lastLoginAt && (
                <span className="faint">
                  · Last login: {formatDateTime(rawMember.lastLoginAt)}
                </span>
              )}
            </div>

            {/* If Invited, show invite info bar */}
            {rawMember?.status === 'INVITED' && rawMember?.invite && (
              <div
                className="card"
                style={{
                  padding: '12px 16px',
                  marginBottom: '18px',
                  background: 'var(--cmp-surface-sunken)',
                  border: '1px solid var(--cmp-border)',
                  fontSize: '13px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <strong>Invitation:</strong> Email {rawMember.invite.emailStatus?.toLowerCase() || 'sent'} on{' '}
                  {formatDate(rawMember.invite.invitedAt || rawMember.createdAt)}.
                  {rawMember.invite.expiresAt && ` Expires: ${formatDate(rawMember.invite.expiresAt)}.`}
                </div>
                {rawMember.invite.expired && (
                  <span className="badge" style={{ background: 'rgba(179,38,30,0.1)', color: 'var(--cmp-danger)' }}>
                    Invitation Expired
                  </span>
                )}
              </div>
            )}

        <h3 style={{ fontSize: '14.5px', margin: '0 0 12px', fontWeight: 700 }}>
          User details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div>
            <label>First name*</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label>Last name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <div>
            <label>Mobile phone*</label>
            <div className="row" style={{ gap: 0 }}>
              <select
                value={formData.phoneCode}
                onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
                style={{ width: '96px', borderRadius: '8px 0 0 8px' }}
              >
                <option value="+971">+971</option>
                <option value="+966">+966</option>
                <option value="+974">+974</option>
                <option value="+44">+44</option>
                <option value="+91">+91</option>
                <option value="+92">+92</option>
              </select>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
              />
            </div>
          </div>
          <div>
            <label>Login email*</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '14.5px', margin: '18px 0 10px', fontWeight: 700 }}>
          Account settings
        </h3>
        <div style={{ maxWidth: '320px' }}>
          <label>Role*</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="Owner">Owner</option>
            <option value="Director">Director</option>
            <option value="Office admin">Office admin</option>
            <option value="Coordinator">Coordinator</option>
            <option value="Agent">Agent</option>
            <option value="Accounts">Accounts</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ marginTop: '16px' }}
          onClick={handleSaveAccount}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 size={13} className="spin" /> : null}
          <span>Save account details</span>
        </button>
      </section>

      {/* SECTION 2: Public profile */}
      <section className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>Public profile</h2>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '13.5px' }}>
              What buyers, sellers, and tenants see on Cash My Property portal.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsPublicCollapsed(!isPublicCollapsed)}
            aria-label="Toggle public profile"
          >
            <ChevronDown
              size={18}
              style={{
                transform: isPublicCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s ease'
              }}
            />
          </button>
        </div>

        {!isPublicCollapsed && (
          <div>
            <label className="row" style={{ gap: '8px', fontWeight: 500, marginBottom: '16px', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={usePrivateInfo}
                onChange={(e) => setUsePrivateInfo(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--cmp-brand)' }}
              />
              <span>Use contact info from private profile</span>
            </label>

            {/* Profile Completeness Gauge */}
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                gap: '16px',
                margin: '16px 0',
                flexWrap: 'wrap',
                padding: '16px',
                background: 'var(--cmp-surface-sunken)',
                borderRadius: '12px',
                alignItems: 'center'
              }}
            >
              <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '64px', height: '64px', display: 'grid', placeItems: 'center' }}>
                  <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="32" cy="32" r="27" fill="none" stroke="var(--cmp-border)" strokeWidth="8" />
                    <circle
                      cx="32"
                      cy="32"
                      r="27"
                      fill="none"
                      stroke="var(--cmp-brand)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(profileScore / 100) * 170} 170`}
                    />
                  </svg>
                  <span style={{ position: 'absolute', fontSize: '14px', fontWeight: 800 }}>
                    {profileScore}%
                  </span>
                </div>
                <div>
                  <strong style={{ fontSize: '15px' }}>Profile is {profileScore}% complete</strong>
                  <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                    A complete profile is easier to verify and unlocks Elite status ranking.
                  </p>
                </div>
              </div>
              <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                Verified Broker
              </span>
            </div>

            {/* Profile Photo */}
            <div className="row" style={{ gap: '16px', alignItems: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  background: formData.photo ? `url(${formData.photo}) center/cover no-repeat` : 'var(--cmp-brand-subtle)',
                  color: 'var(--cmp-brand)',
                  fontWeight: 700,
                  fontSize: '26px',
                  overflow: 'hidden'
                }}
              >
                {!formData.photo && memberInitials}
              </div>
              <div>
                <strong>{formData.displayedName}</strong>
                <p className="muted" style={{ margin: '2px 0 8px', fontSize: '13px' }}>
                  {formData.publicEmail}
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ gap: '6px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? <Loader2 size={13} className="spin" /> : <Upload size={13} />}
                  <span>{isUploadingPhoto ? 'Uploading photo...' : 'Upload profile photo'}</span>
                </button>
                <p className="faint" style={{ margin: '6px 0 0', fontSize: '12px' }}>
                  Visible on all your active listings. Recommended size 520 × 400 px.
                </p>
              </div>
            </div>

            {/* Public Details Inputs */}
            <h3 style={{ fontSize: '14.5px', margin: '18px 0 10px', fontWeight: 700 }}>
              Public details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Displayed name*</label>
                <input
                  type="text"
                  value={formData.displayedName}
                  onChange={(e) => setFormData({ ...formData, displayedName: e.target.value })}
                />
              </div>
              <div>
                <label>Public email*</label>
                <input
                  type="email"
                  value={formData.publicEmail}
                  onChange={(e) => setFormData({ ...formData, publicEmail: e.target.value })}
                />
              </div>
              <div>
                <label>Public number*</label>
                <div className="row" style={{ gap: 0 }}>
                  <select
                    value={formData.publicNumberCode}
                    onChange={(e) => setFormData({ ...formData, publicNumberCode: e.target.value })}
                    style={{ width: '96px', borderRadius: '8px 0 0 8px' }}
                  >
                    <option value="+971">+971</option>
                    <option value="+966">+966</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.publicNumber}
                    onChange={(e) => setFormData({ ...formData, publicNumber: e.target.value })}
                    style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                  />
                </div>
              </div>
              <div>
                <label>WhatsApp number</label>
                <div className="row" style={{ gap: 0 }}>
                  <select
                    value={formData.whatsappCode}
                    onChange={(e) => setFormData({ ...formData, whatsappCode: e.target.value })}
                    style={{ width: '96px', borderRadius: '8px 0 0 8px' }}
                  >
                    <option value="+971">+971</option>
                    <option value="+966">+966</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    style={{ borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Compliance Section */}
            <h3 style={{ fontSize: '14.5px', margin: '22px 0 10px', fontWeight: 700 }}>
              Regulatory compliance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div>
                <label>Dubai broker licence (BRN)</label>
                <input
                  type="text"
                  value={formData.brn}
                  onChange={(e) => setFormData({ ...formData, brn: e.target.value })}
                />
              </div>
              <div>
                <label>BRN expiry date</label>
                <input
                  type="date"
                  value={formData.brnExpiry}
                  onChange={(e) => setFormData({ ...formData, brnExpiry: e.target.value })}
                />
              </div>
            </div>

            {/* About Me */}
            <h3 style={{ fontSize: '14.5px', margin: '22px 0 10px', fontWeight: 700 }}>
              About agent
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label>Experience since</label>
                <select
                  value={formData.experienceSince}
                  onChange={(e) => setFormData({ ...formData, experienceSince: e.target.value })}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2020">2020</option>
                  <option value="2018">2018</option>
                  <option value="2015">2015</option>
                </select>
              </div>
              <div>
                <label>Spoken languages</label>
                <input
                  type="text"
                  value={formData.languages}
                  onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                />
              </div>
              <div>
                <label>Nationality</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                >
                  <option value="Emirati">Emirati</option>
                  <option value="British">British</option>
                  <option value="Pakistani">Pakistani</option>
                  <option value="Indian">Indian</option>
                  <option value="Lebanese">Lebanese</option>
                  <option value="French">French</option>
                </select>
              </div>
              <div>
                <label>Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Description in English</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Description in Arabic (optional)</label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: '20px' }}
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 size={14} className="spin" /> : null}
              <span>Save public profile</span>
            </button>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
