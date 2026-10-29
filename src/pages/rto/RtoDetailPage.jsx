import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import {
  ArrowLeft,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Users,
  Sparkles,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  X,
  UploadCloud,
  Check
} from 'lucide-react';

function formatAed(val) {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `AED ${Number(val).toLocaleString('en-US')}`;
}

function formatCountdown(targetMs) {
  if (!targetMs || targetMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(targetMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function RtoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLiveData, account, authToken, can: appCan } = useApp();

  const [property, setProperty] = useState(null);
  const [bidsData, setBidsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Remaining time in ms for live auction countdown
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Agency Review (Approve / Send back) state
  const [agencyActionLoading, setAgencyActionLoading] = useState(false);
  const [agencyActionError, setAgencyActionError] = useState(null);
  const [agencyActionSuccess, setAgencyActionSuccess] = useState(null);
  const [isRejectBoxOpen, setIsRejectBoxOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fix and Resend / Edit Modal State
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);
  const [fixSubmitting, setFixSubmitting] = useState(false);
  const [fixError, setFixError] = useState(null);
  const [fixSuccess, setFixSuccess] = useState(false);
  const [fixForm, setFixForm] = useState({
    propertyTitle: '',
    propertyDescription: '',
    propertyPrice: '',
    propertyArea: '',
    trakheesiNumber: '',
    emiratesIdExpiry: '',
    auctionOpenDate: '',
    auctionOpenTime: '10:00',
    auctionDurationDays: 7
  });

  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);

  // Load property detail and bids
  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);

      try {
        const [propRes, bidsRes] = await Promise.allSettled([
          cmpConnectApi.getRtoProperty(id, token),
          cmpConnectApi.getRtoPropertyBids(id, token)
        ]);

        if (propRes.status === 'fulfilled' && propRes.value?.data) {
          const p = propRes.value.data;
          setProperty(p);

          // Calculate initial remaining ms
          if (p.status === 'APPROVED' && p.auction?.endTime) {
            const end = new Date(p.auction.endTime).getTime();
            const now = Date.now();
            setTimeRemaining(Math.max(0, end - now));
          } else if (p.status === 'PAUSED' && p.auction?.remainingMs) {
            setTimeRemaining(p.auction.remainingMs);
          }

          // Parse schedule startAt for edit form
          const rawStart = p.schedule?.startAt || p.auction?.startTime || '';
          let openDate = '';
          let openTime = '10:00';
          if (rawStart) {
            const dt = new Date(rawStart);
            if (!isNaN(dt.getTime())) {
              openDate = dt.toISOString().slice(0, 10);
              openTime = dt.toTimeString().slice(0, 5);
            }
          } else {
            openDate = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
          }

          // Populate fix form default values
          setFixForm({
            propertyTitle: p.title || p.propertyTitle || '',
            propertyDescription: p.description || p.propertyDescription || '',
            propertyPrice: p.startingPrice ?? p.propertyPrice ?? '',
            propertyArea: p.area ?? p.propertyArea ?? '',
            trakheesiNumber: p.trakheesiNumber || '',
            emiratesIdExpiry: p.emiratesIdExpiry ? p.emiratesIdExpiry.substring(0, 10) : '',
            auctionOpenDate: openDate,
            auctionOpenTime: openTime,
            auctionDurationDays: p.schedule?.durationDays || 7
          });
        } else {
          // If in mock data mode or endpoint returned 401/404, fallback to mock object
          setProperty(getMockRtoProperty(id));
        }

        if (bidsRes.status === 'fulfilled' && bidsRes.value?.data) {
          setBidsData(bidsRes.value.data);
        } else {
          setBidsData(getMockRtoBids());
        }
      } catch (err) {
        console.error('Failed to load RTO property:', err);
        setProperty(getMockRtoProperty(id));
        setBidsData(getMockRtoBids());
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [id, token, isLiveData]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live countdown ticker
  useEffect(() => {
    if (property?.status !== 'APPROVED') return;

    const timer = setInterval(() => {
      if (property.auction?.endTime) {
        const end = new Date(property.auction.endTime).getTime();
        const diff = end - Date.now();
        setTimeRemaining(Math.max(0, diff));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [property?.status, property?.auction?.endTime]);

  // Poll for live bids every 12 seconds during active auction
  useEffect(() => {
    if (property?.status !== 'APPROVED') return;

    const poll = setInterval(() => {
      loadData(true);
    }, 12000);

    return () => clearInterval(poll);
  }, [property?.status, loadData]);

  // Handle Agency Approve (AGENCY_REVIEW → AWAITING)
  const handleAgencyApprove = async () => {
    setAgencyActionLoading(true);
    setAgencyActionError(null);
    setAgencyActionSuccess(null);
    try {
      const res = await cmpConnectApi.approveRtoProperty(id, token);
      setAgencyActionSuccess(res?.message || 'Approved and sent to CMP for review.');
      await loadData(true);
    } catch (err) {
      setAgencyActionError(err.message || 'Failed to approve property.');
    } finally {
      setAgencyActionLoading(false);
    }
  };

  // Handle Agency Send Back / Reject (AGENCY_REVIEW → AGENCY_REJECTED)
  const handleAgencyReject = async (e) => {
    e.preventDefault();
    const trimmed = rejectReason.trim();
    if (trimmed.length < 3) {
      setAgencyActionError('Please enter a reason (at least 3 characters).');
      return;
    }
    setAgencyActionLoading(true);
    setAgencyActionError(null);
    setAgencyActionSuccess(null);
    try {
      const res = await cmpConnectApi.rejectRtoProperty(id, trimmed, token);
      setAgencyActionSuccess(res?.message || 'Property sent back to the agent.');
      setIsRejectBoxOpen(false);
      setRejectReason('');
      await loadData(true);
    } catch (err) {
      setAgencyActionError(err.message || 'Failed to send back property.');
    } finally {
      setAgencyActionLoading(false);
    }
  };

  // Handle Submit (DRAFT / AGENCY_REJECTED / REJECTED → AGENCY_REVIEW or AWAITING)
  const handleSubmitEntry = async () => {
    setAgencyActionLoading(true);
    setAgencyActionError(null);
    setAgencyActionSuccess(null);
    try {
      const res = await cmpConnectApi.submitRtoProperty(id, token);
      setAgencyActionSuccess(res?.message || 'Property submitted successfully.');
      await loadData(true);
    } catch (err) {
      setAgencyActionError(err.message || 'Failed to submit property.');
    } finally {
      setAgencyActionLoading(false);
    }
  };

  // Handle Delete Draft (DELETE /rto/properties/:id)
  const handleDeleteDraft = async () => {
    if (!window.confirm('Delete this draft property?')) return;
    setAgencyActionLoading(true);
    setAgencyActionError(null);
    try {
      await cmpConnectApi.deleteRtoProperty(id, token);
      navigate('/rto');
    } catch (err) {
      setAgencyActionError(err.message || 'Failed to delete draft.');
      setAgencyActionLoading(false);
    }
  };

  // Handle Fix and Resend / Edit submit
  const handleFixSubmit = async (e) => {
    e.preventDefault();
    setFixSubmitting(true);
    setFixError(null);

    try {
      const payload = {
        propertyTitle: fixForm.propertyTitle.trim(),
        propertyDescription: fixForm.propertyDescription.trim(),
        propertyPrice: Number(fixForm.propertyPrice),
        propertyArea: Number(fixForm.propertyArea),
        trakheesiNumber: fixForm.trakheesiNumber.trim(),
        emiratesIdExpiry: fixForm.emiratesIdExpiry
      };
      if (fixForm.auctionOpenDate && fixForm.auctionOpenTime) {
        payload.auctionStartAt = `${fixForm.auctionOpenDate}T${fixForm.auctionOpenTime}:00+04:00`;
      }
      if (fixForm.auctionDurationDays) {
        payload.auctionDurationDays = Number(fixForm.auctionDurationDays);
      }

      const patchRes = await cmpConnectApi.updateRtoProperty(id, payload, token);
      // Per Section 13: PATCH saves steps/edits without changing status; POST /:id/submit resubmits when DRAFT, AGENCY_REJECTED, or REJECTED
      const updatedStatus = patchRes?.data?.status || property?.status;
      if (['DRAFT', 'AGENCY_REJECTED', 'REJECTED'].includes(updatedStatus)) {
        try {
          await cmpConnectApi.submitRtoProperty(id, token);
        } catch (subErr) {
          // Ignore 404 if backend is still on legacy PATCH-resubmit
          if (subErr.status && subErr.status !== 404) {
            throw subErr;
          }
        }
      }

      setFixSuccess(true);
      setTimeout(() => {
        setIsFixModalOpen(false);
        setFixSuccess(false);
        loadData();
      }, 1500);
    } catch (err) {
      setFixError(err.message || 'Failed to update property.');
    } finally {
      setFixSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin faint" style={{ margin: '0 auto 12px' }} />
        <p className="muted" style={{ fontSize: '14px' }}>Loading Real Time Offer property details…</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ padding: '36px 0', maxWidth: '600px', margin: '0 auto' }}>
        <NavLink to="/rto" className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Entries
        </NavLink>
        <div className="card" style={{ padding: '24px', borderColor: 'var(--cmp-danger-border)', background: 'var(--cmp-danger-subtle)' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--cmp-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> Property not found or error loading
          </h2>
          <p className="muted" style={{ margin: '8px 0 16px', fontSize: '13.5px' }}>
            {error || 'Unable to retrieve property data.'}
          </p>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => loadData()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const propertyTitle = property?.title || property?.propertyTitle || '';
  const propertyDescription = property?.description || property?.propertyDescription || '';
  const propertyLocation = property?.location || property?.propertyLocation || '';
  const propertyPrice = property?.startingPrice ?? property?.propertyPrice ?? 0;
  const propertyCategory = property?.category || property?.propertyCategory || '';
  const propertyPlan = property?.plan || property?.propertyPlan || '';
  const propertyType = property?.typeLabel || property?.type || property?.propertyType || '';
  const propertyArea = property?.area ?? property?.propertyArea ?? '';
  const propertyAreaUnit = property?.areaUnit || property?.propertyAreaUnit || 'sqft';
  const propertyBedrooms = property?.bedrooms ?? property?.propertyBedrooms;
  const propertyWashrooms = property?.washrooms ?? property?.propertyWashrooms;
  const propertyBuiltUpArea = property?.builtUpArea ?? property?.propertyBuiltUpArea;
  const rejectionReason = property?.rejectionReason;
  const soldPrice = property?.soldPrice;
  const listedBy = property?.listedBy;
  const reference = property?.rtoRef || property?.reference || id;

  const auction = property?.auction || {};
  const schedule = property?.schedule || {};
  const can = property?.can || {};
  const submitIssues = Array.isArray(property?.submitIssues) ? property.submitIssues : [];
  const canEdit = Boolean(can?.edit);
  const canSubmit = Boolean(can?.submit);
  const canDelete = Boolean(can?.delete);
  const canAgencyApprove = Boolean(can?.agencyApprove);
  const canAgencyReject = Boolean(can?.agencyReject);
  const historyList = Array.isArray(property?.history) ? property.history : [];
  const documents = property?.documents || [];
  const propertyImages = (Array.isArray(property?.images) && property.images.length > 0)
    ? property.images
    : (Array.isArray(property?.propertyImages) && property.propertyImages.length > 0)
    ? property.propertyImages
    : property?.coverImage
    ? [{ url: property.coverImage }]
    : [];
  const propertyAmenities = Array.isArray(property?.amenities)
    ? property.amenities
    : Array.isArray(property?.propertyAmenities)
    ? property.propertyAmenities
    : [];
  const status = property?.status || 'AWAITING';
  const approvedBuyers = property?.approvedBuyers || 0;

  const docsList = Array.isArray(documents)
    ? documents.filter((d) => d && d.url).map((d) => ({
        key: d.key,
        label: d.label || formatDocTitle(d.key),
        fileName: d.fileName || 'Uploaded Document',
        url: d.url
      }))
    : Object.entries(documents || {})
        .map(([k, d]) => (d && d.url ? { key: k, label: formatDocTitle(k), fileName: d.fileName || 'Uploaded Document', url: d.url } : null))
        .filter(Boolean);

  const currentPrice = auction.currentHighestBid || soldPrice || propertyPrice;
  const offersList = bidsData?.offers || [];
  const biddersList = bidsData?.bidders || [];

  return (
    <div>
      {/* Top Header & Navigation */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="row" style={{ gap: '12px', alignItems: 'center' }}>
          <NavLink to="/rto" className="btn btn-ghost btn-sm" title="Back to Entries">
            <ArrowLeft size={16} />
            <span>Entries</span>
          </NavLink>
          <span className="faint">/</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{reference}</span>
          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
            {propertyCategory} · {propertyPlan} · {propertyType}
          </span>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            title="Refresh latest bids & clock"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Updating…' : 'Refresh'}</span>
          </button>

          {canDelete && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
              onClick={handleDeleteDraft}
              disabled={agencyActionLoading}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          )}

          {canEdit && (
            <NavLink
              to={`/rto/${id}/edit`}
              className="btn btn-outline btn-sm"
            >
              <Edit3 size={14} />
              <span>{status === 'DRAFT' ? 'Continue in wizard' : 'Edit in wizard'}</span>
            </NavLink>
          )}

          {canEdit && status !== 'DRAFT' && (
            <button
              type="button"
              className="btn btn-accent btn-sm"
              onClick={() => setIsFixModalOpen(true)}
            >
              <Edit3 size={14} />
              <span>{status === 'AGENCY_REVIEW' ? 'Quick edit' : 'Fix and resend'}</span>
            </button>
          )}

          {canAgencyApprove && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleAgencyApprove}
              disabled={agencyActionLoading}
            >
              <Check size={14} />
              <span>{agencyActionLoading ? 'Approving…' : 'Approve entry'}</span>
            </button>
          )}

          {canAgencyReject && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
              onClick={() => setIsRejectBoxOpen((prev) => !prev)}
              disabled={agencyActionLoading}
            >
              <X size={14} />
              <span>Send back</span>
            </button>
          )}

          {canSubmit && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSubmitEntry}
              disabled={agencyActionLoading || submitIssues.length > 0}
            >
              <Sparkles size={14} />
              <span>{agencyActionLoading ? 'Submitting…' : 'Submit'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Agency Action Feedback */}
      {agencyActionError && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-danger-subtle)',
            borderColor: 'var(--cmp-danger-border)',
            color: 'var(--cmp-danger)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {agencyActionError}
        </div>
      )}

      {agencyActionSuccess && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-brand-subtle)',
            borderColor: 'var(--cmp-brand-border)',
            color: 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          ✓ {agencyActionSuccess}
        </div>
      )}

      {/* Main Status Hero Banner */}
      <div style={{ marginBottom: '24px' }}>
        {status === 'DRAFT' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-surface-subtle)',
              borderColor: 'var(--cmp-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                <Edit3 size={19} className="faint" />
                <span style={{ fontWeight: 800, fontSize: '14px' }}>
                  Draft entry
                </span>
              </div>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
                {submitIssues.length > 0
                  ? `${submitIssues.length} item(s) still needed before submitting.`
                  : 'All steps are complete. Ready to submit.'}
              </p>
            </div>

            <div className="row" style={{ gap: '8px' }}>
              <NavLink to={`/rto/${id}/edit`} className="btn btn-accent btn-sm">
                <Edit3 size={14} />
                <span>Continue</span>
              </NavLink>
              {canSubmit && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmitEntry}
                  disabled={agencyActionLoading}
                >
                  <Sparkles size={14} />
                  <span>{agencyActionLoading ? 'Submitting…' : 'Submit'}</span>
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
                  onClick={handleDeleteDraft}
                  disabled={agencyActionLoading}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        )}

        {submitIssues.length > 0 && (
          <div
            className="card"
            style={{
              padding: '16px 20px',
              marginTop: '12px',
              background: 'var(--cmp-warning-subtle, rgba(234, 179, 8, 0.08))',
              borderColor: 'var(--cmp-warning-border, rgba(234, 179, 8, 0.3))'
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '13px', color: '#B45309', display: 'block', marginBottom: '8px' }}>
              Remaining items before submit ({submitIssues.length})
            </span>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', display: 'grid', gap: '4px' }}>
              {submitIssues.map((iss, idx) => (
                <li key={idx}>
                  <strong>Step {iss.step || 1}:</strong> {iss.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === 'AGENCY_REVIEW' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-warning-subtle, rgba(234, 179, 8, 0.08))',
              borderColor: 'var(--cmp-warning-border, rgba(234, 179, 8, 0.3))'
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                  <Clock size={19} color="#D97706" />
                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#B45309' }}>
                    Waiting for agency approval
                  </span>
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
                  {canAgencyApprove
                    ? 'Review this agent entry and approve it to send it to CMP, or send it back with a note.'
                    : 'Your agency owner or admin will review this entry before sending it to CMP.'}
                </p>
              </div>

              {(canAgencyApprove || canAgencyReject) && (
                <div className="row" style={{ gap: '8px' }}>
                  {canAgencyApprove && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={agencyActionLoading}
                      onClick={handleAgencyApprove}
                    >
                      <Check size={15} />
                      <span>{agencyActionLoading ? 'Approving…' : 'Approve'}</span>
                    </button>
                  )}
                  {canAgencyReject && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ borderColor: 'var(--cmp-danger)', color: 'var(--cmp-danger)' }}
                      disabled={agencyActionLoading}
                      onClick={() => setIsRejectBoxOpen((prev) => !prev)}
                    >
                      <X size={15} />
                      <span>Send back</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isRejectBoxOpen && (
              <form
                onSubmit={handleAgencyReject}
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--cmp-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 700 }}>
                  Reason for sending back to the agent (3–500 characters) *
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="Explain what needs to be fixed before sending to CMP…"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
                <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsRejectBoxOpen(false);
                      setRejectReason('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm"
                    style={{ background: 'var(--cmp-danger)', color: '#fff', border: 'none' }}
                    disabled={agencyActionLoading}
                  >
                    {agencyActionLoading ? 'Sending back…' : 'Confirm send back'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {status === 'AGENCY_REJECTED' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-danger-subtle)',
              borderColor: 'var(--cmp-danger-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={20} color="var(--cmp-danger)" />
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--cmp-danger)' }}>
                  Sent back by agency
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 600 }}>
                {rejectionReason || 'Your agency requested updates before sending this entry to CMP.'}
              </p>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                Update the required details and click &quot;Fix and resend&quot;.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => setIsFixModalOpen(true)}
              >
                <Edit3 size={15} />
                <span>Fix and resend</span>
              </button>
            )}
          </div>
        )}
        {status === 'APPROVED' && (
          <div
            className="card"
            style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(20, 110, 70, 0.08) 0%, rgba(20, 110, 70, 0.02) 100%)',
              borderColor: 'var(--cmp-success-border, #10B981)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="cmp-live-dot" />
                  <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', color: 'var(--cmp-success)', textTransform: 'uppercase' }}>
                    Live 7-Day Auction
                  </span>
                  {auction.extensionCount > 0 && (
                    <span className="badge badge-accent" style={{ fontSize: '11px' }}>
                      +{auction.extensionCount * 10}m extension active
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '26px', margin: 0, fontWeight: 800 }}>{propertyTitle}</h1>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} /> {propertyLocation}
                </p>
              </div>

              {/* Countdown Clock Display */}
              <div
                style={{
                  background: 'var(--cmp-surface)',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--cmp-border)',
                  textAlign: 'center',
                  minWidth: '200px'
                }}
              >
                <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block' }}>
                  Auction Closes In
                </span>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em',
                    color: timeRemaining < 3600000 ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
                    display: 'block',
                    marginTop: '2px'
                  }}
                >
                  {formatCountdown(timeRemaining)}
                </span>
                <span className="faint" style={{ fontSize: '11.5px' }}>
                  Managed by CMP
                </span>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div
              className="row"
              style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--cmp-border)',
                gap: '24px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <span className="faint" style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Current Highest Bid
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '22px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                  {formatAed(auction.currentHighestBid || propertyPrice)}
                </p>
              </div>

              <div>
                <span className="faint" style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Starting Price
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700 }}>
                  {formatAed(propertyPrice)}
                </p>
              </div>

              <div>
                <span className="faint" style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Offers
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700 }}>
                  {auction.offers || offersList.length || 0}
                </p>
              </div>

              <div>
                <span className="faint" style={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Approved Buyers
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 700 }}>
                  {approvedBuyers}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-danger-subtle)',
              borderColor: 'var(--cmp-danger-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={20} color="var(--cmp-danger)" />
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--cmp-danger)' }}>
                  Sent back by CMP Moderators
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: 600 }}>
                {rejectionReason || 'Moderators requested changes to legal documents or property details before approving.'}
              </p>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                Update the required details and click &quot;Fix and resend&quot; to return this property to CMP review.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={() => setIsFixModalOpen(true)}
              >
                <Edit3 size={15} />
                <span>Fix and resend</span>
              </button>
            )}
          </div>
        )}

        {status === 'AWAITING' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-warning-subtle, rgba(234, 179, 8, 0.08))',
              borderColor: 'var(--cmp-warning-border, rgba(234, 179, 8, 0.3))'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <Clock size={19} color="#D97706" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#B45309' }}>
                Waiting for CMP review
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              Submitted to CMP moderation. Once verified and scheduled, the live auction will commence automatically.
            </p>
          </div>
        )}

        {status === 'PRE_APPROVED' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-info-subtle, rgba(59, 130, 246, 0.08))',
              borderColor: 'var(--cmp-info-border, rgba(59, 130, 246, 0.3))'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <ShieldCheck size={19} color="#2563EB" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#1D4ED8' }}>
                Checked by CMP, waiting for final approval
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              Legal documents and permits have passed moderation. CMP operations is finalizing the auction schedule.
            </p>
          </div>
        )}

        {status === 'SCHEDULED' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-surface)',
              borderColor: 'var(--cmp-border)'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <Calendar size={19} color="var(--cmp-brand)" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--cmp-brand)' }}>
                Starts {(auction.startTime || schedule.startAt) ? new Date(auction.startTime || schedule.startAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'soon'}
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              Buyers in the CMP mobile app can review the property prospectus and sign auction contracts in advance.
            </p>
          </div>
        )}

        {status === 'PAUSED' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-warning-subtle)',
              borderColor: 'var(--cmp-warning-border)'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <AlertTriangle size={19} color="#D97706" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#B45309' }}>
                Paused by CMP
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              The auction has been temporarily paused by CMP administration. Remaining duration ({formatCountdown(auction.remainingMs || 0)}) is preserved.
            </p>
          </div>
        )}

        {status === 'SOLD' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'rgba(16, 185, 129, 0.08)',
              borderColor: 'rgba(16, 185, 129, 0.3)'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <Sparkles size={20} color="#059669" />
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#047857' }}>
                Sold at {formatAed(soldPrice || auction.currentHighestBid)}
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              Auction completed successfully. CMP transaction desk is finalizing settlement and contracts with the winning buyer.
            </p>
          </div>
        )}

        {status === 'SOLD_FAIL' && (
          <div
            className="card"
            style={{
              padding: '20px 24px',
              background: 'var(--cmp-surface)',
              borderColor: 'var(--cmp-border)'
            }}
          >
            <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
              <Clock size={19} className="faint" />
              <span style={{ fontWeight: 800, fontSize: '14px' }}>
                Auction closed — No offers placed
              </span>
            </div>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
              The 7-day bidding window ended without receiving bids. CMP can relist it with updated starting terms.
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Left = Details & Specs, Right = Live Bids Feed & Bidders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column: Photos Gallery, Specs, Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Photos Gallery */}
          <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
            {propertyImages.length > 0 ? (
              <div>
                <div
                  style={{
                    width: '100%',
                    height: '360px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}
                >
                  <img
                    src={propertyImages[selectedPhotoIndex]?.url || propertyImages[0]?.url}
                    alt={propertyTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Thumbnails Strip */}
                {propertyImages.length > 1 && (
                  <div className="row" style={{ gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {propertyImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        style={{
                          width: '64px',
                          height: '48px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: selectedPhotoIndex === idx ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                          padding: 0,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: '220px', display: 'grid', placeItems: 'center', background: 'var(--cmp-surface-subtle)', borderRadius: '8px' }}>
                <p className="muted" style={{ fontSize: '13px' }}>No photos available</p>
              </div>
            )}
          </div>

          {/* Key Property Specs */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', fontWeight: 700 }}>Property Specifications</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Starting Price</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{formatAed(propertyPrice)}</p>
              </div>

              <div>
                <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Area</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{propertyArea} {propertyAreaUnit}</p>
              </div>

              {propertyBedrooms && (
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Bedrooms</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{propertyBedrooms}</p>
                </div>
              )}

              {propertyWashrooms && (
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Washrooms</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{propertyWashrooms}</p>
                </div>
              )}

              {propertyBuiltUpArea && (
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Built-up Area</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{propertyBuiltUpArea} sqft</p>
                </div>
              )}

              <div>
                <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Trakheesi Permit</span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>{property.trakheesiNumber || '—'}</p>
              </div>

              {(schedule?.startAt || property?.auctionStartAt) && (
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Offers Open</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '14px' }}>
                    {new Date(schedule?.startAt || property?.auctionStartAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              )}

              {(schedule?.durationDays || property?.auctionDurationDays) && (
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Offers Open For</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '15px' }}>
                    {schedule?.durationDays || property?.auctionDurationDays} days
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ borderTop: '1px solid var(--cmp-border)', paddingTop: '16px' }}>
              <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Description
              </span>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {propertyDescription || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {propertyAmenities.length > 0 && (
              <div style={{ borderTop: '1px solid var(--cmp-border)', paddingTop: '16px', marginTop: '16px' }}>
                <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Amenities
                </span>
                <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                  {propertyAmenities.map((amenity, idx) => (
                    <span key={idx} className="chip" style={{ fontSize: '12px' }}>
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legal Documents */}
          <div className="card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '16px', marginBottom: '14px', fontWeight: 700 }}>Legal & Regulatory Documents</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {docsList.length === 0 ? (
                <p className="faint" style={{ fontSize: '13px', margin: 0 }}>No documents attached.</p>
              ) : (
                docsList.map((doc, idx) => (
                  <div
                    key={doc.key || idx}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'var(--cmp-surface-subtle)',
                      borderRadius: '6px',
                      border: '1px solid var(--cmp-border)'
                    }}
                  >
                    <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                      <FileText size={18} className="faint" />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                          {doc.label}
                        </p>
                        <span className="faint" style={{ fontSize: '11.5px' }}>
                          {doc.fileName}
                        </span>
                      </div>
                    </div>

                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ gap: '4px' }}
                    >
                      <span>View</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Offers Feed & Anonymous Bidders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Offers Table */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>Offers Feed</h2>
                <span className="faint" style={{ fontSize: '12px' }}>
                  Anonymous CMP buyer offers (no private names disclosed)
                </span>
              </div>
              <span className="badge badge-accent" style={{ fontWeight: 700 }}>
                {offersList.length} total
              </span>
            </div>

            {offersList.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                <Clock size={24} className="faint" style={{ margin: '0 auto 8px' }} />
                <p className="muted" style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>
                  No offers placed yet
                </p>
                <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Offers from pre-qualified buyers will appear live here during the 7-day auction.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {offersList.map((offer, idx) => {
                  const isTop = idx === 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isTop ? '1px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                        background: isTop ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>
                            {offer.buyer || `Buyer ${idx + 1}`}
                          </span>
                          {isTop && (
                            <span className="badge badge-accent" style={{ fontSize: '10px' }}>
                              LEADING
                            </span>
                          )}
                        </div>
                        <span className="faint" style={{ fontSize: '11.5px' }}>
                          {offer.at ? new Date(offer.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                        </span>
                      </div>

                      <div style={{ textAlign: 'end' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: isTop ? 'var(--cmp-brand)' : 'inherit' }}>
                          {formatAed(offer.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Qualified Bidders Overview */}
          {biddersList.length > 0 && (
            <div className="card" style={{ padding: '20px' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>Participating Buyers</h3>
                <span className="faint" style={{ fontSize: '12px' }}>{biddersList.length} approved</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {biddersList.map((b, idx) => (
                  <div
                    key={idx}
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'var(--cmp-surface-subtle)',
                      borderRadius: '6px'
                    }}
                  >
                    <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
                      <Users size={15} className="faint" />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{b.buyer}</span>
                      {b.status === 'LEADING' && (
                        <span className="badge badge-accent" style={{ fontSize: '10px' }}>Leading</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatAed(b.latestOffer)}</span>
                      <span className="faint" style={{ display: 'block', fontSize: '11px' }}>{b.offers} offers placed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listed Agent Info */}
          <div className="card" style={{ padding: '16px' }}>
            <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Assigned Listing Agent
            </span>
            <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--cmp-brand-subtle)',
                  color: 'var(--cmp-brand)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                {(listedBy?.fullName || listedBy?.name || account?.name || 'A').charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600 }}>
                  {listedBy?.fullName || listedBy?.name || account?.name || 'Agency Agent'}
                </p>
                <span className="faint" style={{ fontSize: '12px' }}>
                  BRN: {listedBy?.brn || account?.brn || 'Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity & Review History */}
          {historyList.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '10px' }}>
                Submission & Review History
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historyList.map((evt, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--cmp-surface-subtle)',
                      border: '1px solid var(--cmp-border)'
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700 }}>
                        {evt.label || evt.action || evt.status || 'Update'}
                      </span>
                      {evt.at && (
                        <span className="faint" style={{ fontSize: '11px' }}>
                          {new Date(evt.at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                    {evt.reason && (
                      <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                        Reason: {evt.reason}
                      </p>
                    )}
                    {evt.by && (
                      <span className="faint" style={{ display: 'block', marginTop: '2px', fontSize: '11px' }}>
                        By {evt.by?.fullName || evt.by?.name || evt.by}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fix and Resend / Edit Modal Drawer */}
      {isFixModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--cmp-surface)'
            }}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>
                  {status === 'AGENCY_REVIEW' ? 'Edit Property Details' : 'Fix & Resend Property'}
                </h2>
                <p className="faint" style={{ margin: '2px 0 0', fontSize: '12.5px' }}>
                  {status === 'AGENCY_REVIEW'
                    ? 'Update details before approving or while waiting for agency review.'
                    : 'Update details and resubmit for review.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsFixModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {rejectionReason && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'var(--cmp-danger-subtle)',
                  border: '1px solid var(--cmp-danger-border)',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--cmp-danger)' }}>Reason for return: </span>
                <span>{rejectionReason}</span>
              </div>
            )}

            {fixError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  background: 'var(--cmp-danger-subtle)',
                  color: 'var(--cmp-danger)',
                  fontSize: '13px',
                  marginBottom: '14px'
                }}
              >
                {fixError}
              </div>
            )}

            {fixSuccess && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'var(--cmp-brand-subtle)',
                  color: 'var(--cmp-brand)',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  marginBottom: '14px',
                  textAlign: 'center'
                }}
              >
                ✓ Changes saved and submitted!
              </div>
            )}

            <form onSubmit={handleFixSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Property Title
                </label>
                <input
                  type="text"
                  required
                  value={fixForm.propertyTitle}
                  onChange={(e) => setFixForm((prev) => ({ ...prev, propertyTitle: e.target.value }))}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Starting Price (AED)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={fixForm.propertyPrice}
                  onChange={(e) => setFixForm((prev) => ({ ...prev, propertyPrice: e.target.value }))}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Area (sqft)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={fixForm.propertyArea}
                    onChange={(e) => setFixForm((prev) => ({ ...prev, propertyArea: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Trakheesi Permit #
                  </label>
                  <input
                    type="text"
                    required
                    value={fixForm.trakheesiNumber}
                    onChange={(e) => setFixForm((prev) => ({ ...prev, trakheesiNumber: e.target.value }))}
                    style={{ width: '100%', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* Timing and terms */}
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--cmp-surface-subtle)',
                  border: '1px solid var(--cmp-border)'
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                  Timing and terms
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="field-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Offers open on
                    </label>
                    <input
                      type="date"
                      value={fixForm.auctionOpenDate}
                      onChange={(e) => setFixForm((prev) => ({ ...prev, auctionOpenDate: e.target.value }))}
                      style={{ width: '100%', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      At (+04:00)
                    </label>
                    <input
                      type="time"
                      value={fixForm.auctionOpenTime}
                      onChange={(e) => setFixForm((prev) => ({ ...prev, auctionOpenTime: e.target.value }))}
                      style={{ width: '100%', fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: '11.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Offers stay open for
                    </label>
                    <select
                      value={fixForm.auctionDurationDays}
                      onChange={(e) => setFixForm((prev) => ({ ...prev, auctionDurationDays: e.target.value }))}
                      style={{ width: '100%', fontSize: '12.5px' }}
                    >
                      {[3, 7, 10, 14].map((d) => (
                        <option key={d} value={String(d)}>
                          {d} days
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="faint" style={{ margin: '6px 0 0', fontSize: '11.5px' }}>
                  Late offers add 10 minutes to the clock.
                </p>
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Emirates ID Expiry
                </label>
                <input
                  type="date"
                  required
                  value={fixForm.emiratesIdExpiry}
                  onChange={(e) => setFixForm((prev) => ({ ...prev, emiratesIdExpiry: e.target.value }))}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div>
                <label className="field-label" style={{ fontSize: '12.5px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={fixForm.propertyDescription}
                  onChange={(e) => setFixForm((prev) => ({ ...prev, propertyDescription: e.target.value }))}
                  style={{ width: '100%', fontSize: '13.5px' }}
                />
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsFixModalOpen(false)}
                  disabled={fixSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={fixSubmitting}
                >
                  {fixSubmitting
                    ? 'Saving…'
                    : status === 'AGENCY_REVIEW'
                      ? 'Save changes'
                      : 'Submit for review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDocTitle(key) {
  const map = {
    exclusiveContract: 'Form A (Exclusive contract)',
    propertyTitleDeed: 'Title deed',
    propertyCheque: 'Security cheque',
    propertyTrakheesi: 'Trakheesi / DLD permit',
    passportDocument: "Owner's passport copy",
    propertyUndertakingLetter: 'Undertaking letter',
    propertyFloorPlan: 'Floor plan',
    propertyESignature: 'E-signature',
    propertyEid_Visa: 'Owner Emirates ID / visa',
    ownerPassport: "Owner's passport copy",
    trakheesiPermit: 'Trakheesi / DLD permit',
    securityCheque: 'Security cheque',
    floorPlan: 'Floor plan',
    undertakingLetter: 'Undertaking letter',
    eSignature: 'E-signature'
  };
  return map[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function getMockRtoProperty(id) {
  return {
    _id: id,
    reference: id || 'CMP-RTO-1002',
    propertyTitle: 'Marina view 2 bed in Marina Gate',
    propertyDescription: 'High-floor luxury corner apartment with full panoramic marina and skyline vistas.',
    propertyLocation: 'Marina Gate 1, Dubai Marina, Dubai',
    propertyCategory: 'RESIDENTIAL',
    propertyPlan: 'READY',
    propertyType: 'APARTMENT',
    propertyPrice: 2200000,
    propertyArea: 1420,
    propertyAreaUnit: 'sqft',
    propertyBedrooms: '2',
    propertyWashrooms: '3',
    propertyBuiltUpArea: null,
    trakheesiNumber: '7134567890',
    emiratesIdExpiry: '2028-05-15',
    propertyAmenities: ['Balcony', 'Shared Pool', 'Covered Parking', 'Gym', 'View of Water'],
    propertyImages: [
      { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80' },
      { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80' },
      { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80' }
    ],
    documents: {
      exclusiveContract: { fileName: 'FormA_ExclusiveContract.pdf', url: '#' },
      propertyTitleDeed: { fileName: 'TitleDeed_Verified.pdf', url: '#' }
    },
    status: 'APPROVED',
    rejectionReason: null,
    soldPrice: null,
    auction: {
      status: 'ACTIVE',
      startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
      endTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      currentHighestBid: 2450000,
      offers: 6,
      extensionCount: 0,
      remainingMs: 86400000 * 5
    },
    approvedBuyers: 8,
    can: { edit: true },
    listedBy: { name: 'Layla Haddad', brn: '49210' }
  };
}

function getMockRtoBids() {
  return {
    auction: {
      status: 'ACTIVE',
      currentHighestBid: 2450000,
      offers: 6
    },
    bidders: [
      { buyer: 'Buyer 1', latestOffer: 2450000, status: 'LEADING', offers: 3 },
      { buyer: 'Buyer 2', latestOffer: 2400000, status: 'OUTBID', offers: 2 },
      { buyer: 'Buyer 3', latestOffer: 2300000, status: 'OUTBID', offers: 1 }
    ],
    offers: [
      { buyer: 'Buyer 1', amount: 2450000, at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { buyer: 'Buyer 2', amount: 2400000, at: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
      { buyer: 'Buyer 1', amount: 2350000, at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
      { buyer: 'Buyer 3', amount: 2300000, at: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
      { buyer: 'Buyer 2', amount: 2250000, at: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
      { buyer: 'Buyer 1', amount: 2200000, at: new Date(Date.now() - 1000 * 60 * 480).toISOString() }
    ]
  };
}
