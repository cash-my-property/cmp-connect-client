import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import {
  Building,
  Users,
  Coins,
  TrendingDown,
  Check,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const {
    isLiveData,
    authToken,
    agency,
    listings: mockListings,
    clients: mockClients,
    followUps: mockFollowUps,
    toggleFollowUp,
    addFollowUp,
    needsYou: mockNeedsYou,
    account
  } = useApp();

  const [newFollowUpText, setNewFollowUpText] = useState('');
  const [setupHidden, setSetupHidden] = useState(false);

  // Live Home Dashboard Data from GET /api/cmpConnect/home
  const [homeData, setHomeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLiveData && authToken) {
      setIsLoading(true);
      cmpConnectApi.getHomeDashboard(authToken)
        .then((res) => {
          if (res?.data) {
            setHomeData(res.data);
          }
        })
        .catch((err) => {
          console.warn('[DashboardPage] Failed to fetch home dashboard:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isLiveData, authToken]);

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // Stats calculation
  const stats = homeData?.stats;
  const teamStats = homeData?.team;
  const liveListingsCount = isLiveData && stats ? stats.live : mockListings.filter((l) => l.status === 'Live').length;
  const totalListingsCount = isLiveData && stats ? stats.total : mockListings.length;
  const qualifiedClientsCount = mockClients.filter((c) => c.stage === 'Qualified').length;

  // Needs you feed
  const needsYouList = isLiveData && homeData?.needsYou ? homeData.needsYou : mockNeedsYou;

  // Setup Progress
  const setupProgress = homeData?.setup;
  const setupDone = setupProgress ? setupProgress.done : 4;
  const setupTotal = setupProgress ? setupProgress.total : 5;
  const setupPct = setupTotal > 0 ? Math.round((setupDone / setupTotal) * 100) : 80;

  // Top Properties
  const topProperties = isLiveData && homeData?.topListings && homeData.topListings.length > 0
    ? homeData.topListings
    : mockListings.slice(0, 4);

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (newFollowUpText.trim()) {
      addFollowUp(newFollowUpText.trim());
      setNewFollowUpText('');
    }
  };

  // Resolve link for Needs You items
  const resolveNeedsYouUrl = (item) => {
    if (!item.link) return '/properties';
    if (item.link.kind === 'listing') return `/properties/${item.link.id}/edit`;
    if (item.link.kind === 'member') return `/team/members`;
    if (item.link.kind === 'profile') return `/account`;
    return '/properties';
  };

  const resolveNeedsYouActionLabel = (item) => {
    if (item.type === 'APPROVE_LISTING') return 'Review & Approve';
    if (item.type === 'FIX_REJECTED_LISTING') return 'Fix & Resubmit';
    if (item.type === 'LISTING_ON_HOLD') return 'View Notice';
    if (item.type === 'PUBLISH_AGAIN') return 'Publish Again';
    if (item.type === 'EXPIRING_SOON') return 'Extend / Refresh';
    if (item.type === 'FINISH_DRAFT') return 'Continue Draft';
    if (item.type === 'VERIFY_MY_BRN') return 'Verify BRN';
    if (item.type === 'RESEND_INVITE') return 'Resend Invite';
    if (item.type === 'FIX_MEMBER_BRN') return 'Fix Licence';
    return 'View Details';
  };

  return (
    <div>
      {/* Security Banner */}
      <div
        role="note"
        className="row"
        style={{
          gap: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          borderRadius: 'var(--cmp-radius-lg)',
          background: 'var(--cmp-accent-subtle)',
          border: '1px solid var(--cmp-accent-border)',
          fontSize: '13.5px'
        }}
      >
        <ShieldAlert size={19} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          <strong>Stay safe:</strong> Cash My Property will never ask for your password or a one-time code by phone, email or WhatsApp.{' '}
          <NavLink to="/account/security" style={{ fontWeight: 600, textDecoration: 'underline' }}>
            Review your security
          </NavLink>
        </span>
      </div>

      {/* Greeting & Quick Actions */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '22px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', margin: 0, letterSpacing: '-0.02em' }}>
            {timeGreeting}, {agency.currentUser.name ? agency.currentUser.name.split(' ')[0] : 'User'}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            {todayFormatted} · {needsYouList.length} {needsYouList.length === 1 ? 'thing needs' : 'things need'} your attention today
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/properties/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>List new property</span>
          </NavLink>
        </div>
      </div>

      {/* Setup Progress Card */}
      {!setupHidden && (
        <section className="card setup-card" style={{ marginBottom: '22px' }}>
          <div className="row" style={{ gap: '18px', flexWrap: 'wrap' }}>
            {/* SVG Circular Progress Ring */}
            <span
              role="img"
              aria-label={`${setupPct}%`}
              style={{
                position: 'relative',
                display: 'inline-grid',
                placeItems: 'center',
                width: '64px',
                height: '64px',
                flexShrink: 0
              }}
            >
              <svg width="64" height="64" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28.5" fill="none" stroke="var(--cmp-border)" strokeWidth="7" />
                <circle
                  cx="32"
                  cy="32"
                  r="28.5"
                  fill="none"
                  stroke="var(--cmp-accent)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${(setupPct / 100) * 179.07} 179.07`}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '14px', fontWeight: 800 }}>
                {setupDone}/{setupTotal}
              </span>
            </span>

            <div style={{ flex: '1 1 220px' }}>
              <h2 style={{ fontSize: '17px', margin: 0 }}>Finish setting up CMP Connect</h2>
              <p className="muted" style={{ margin: '3px 0 0', fontSize: '13.5px' }}>
                Essential compliance and branding steps to unlock instant approvals and buyer trust.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSetupHidden(true)}
            >
              Hide for now
            </button>
          </div>

          <ul className="setup-list" style={{ marginTop: '16px' }}>
            {setupProgress?.steps ? (
              setupProgress.steps.map((st) => {
                const targetLink =
                  st.key === 'logo' || st.key === 'account'
                    ? '/account'
                    : st.key === 'watermark'
                    ? '/properties/brand-kit'
                    : st.key === 'team' || st.key === 'brn'
                    ? '/team/members'
                    : '/properties/new';

                return (
                  <li key={st.key}>
                    <NavLink to={targetLink} data-done={st.done ? 'true' : undefined}>
                      <span className="setup-check">{st.done && <Check size={13} />}</span>
                      <span>{st.label}</span>
                    </NavLink>
                  </li>
                );
              })
            ) : (
              <>
                <li>
                  <NavLink to="/account" data-done="true">
                    <span className="setup-check"><Check size={13} /></span>
                    <span>Create your agency account</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/properties/brand-kit" data-done="true">
                    <span className="setup-check"><Check size={13} /></span>
                    <span>Add brand photo watermark</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/team/members" data-done="true">
                    <span className="setup-check"><Check size={13} /></span>
                    <span>Invite your whole team</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/properties/new">
                    <span className="setup-check"></span>
                    <span>Add your first property</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </section>
      )}

      {/* 4 KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
        {/* Live Properties */}
        <NavLink className="card" to="/properties" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--cmp-brand-subtle)',
              color: 'var(--cmp-brand)',
              flexShrink: 0
            }}
          >
            <Building size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Live properties</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>{liveListingsCount}</span>
            <span className="faint" style={{ fontSize: '12px' }}>
              {isLiveData && stats
                ? `${totalListingsCount} in portfolio (${stats.pendingApproval} in review)`
                : `${mockListings.length} in your portfolio`}
            </span>
          </span>
        </NavLink>

        {/* Team Members */}
        <NavLink className="card" to="/team/members" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--cmp-brand-subtle)',
              color: 'var(--cmp-brand)',
              flexShrink: 0
            }}
          >
            <Users size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Team Members</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              {isLiveData && teamStats ? teamStats.active : 6}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              {isLiveData && teamStats
                ? `${teamStats.invited} invited · ${teamStats.brnPending} pending BRN`
                : 'Active verified brokers'}
            </span>
          </span>
        </NavLink>

        {/* Pending Approval / Fixes */}
        <NavLink className="card" to="/properties?status=PENDING_APPROVAL" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(180, 116, 12, 0.12)',
              color: 'var(--cmp-warning)',
              flexShrink: 0
            }}
          >
            <Clock size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>In Review / Drafts</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              {isLiveData && stats ? stats.pendingApproval + stats.drafts : 2}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              {isLiveData && stats && stats.expiringSoon > 0
                ? `${stats.expiringSoon} listings expiring soon`
                : 'Waiting compliance / edits'}
            </span>
          </span>
        </NavLink>

        {/* Quality Score & Status */}
        <NavLink className="card" to="/properties/brand-kit" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
          <span
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--cmp-accent-subtle)',
              color: 'var(--cmp-accent)',
              flexShrink: 0
            }}
          >
            <Sparkles size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Brand & Watermark</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              Active
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>
              Automatic listing watermark
            </span>
          </span>
        </NavLink>
      </div>

      {/* Main Grid: Needs You + Follow-ups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '18px', alignItems: 'start' }}>
        {/* Needs You Feed */}
        <section className="card" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--cmp-border)' }}>
            <div className="row" style={{ gap: '10px' }}>
              <h2 style={{ fontSize: '16.5px', margin: 0 }}>Needs you</h2>
              <span className="count-badge">{needsYouList.length}</span>
            </div>
          </div>

          {isLoading && !homeData ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }} className="muted">
              <Loader2 size={24} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Loading action items...</p>
            </div>
          ) : needsYouList.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }} className="muted">
              Nothing needs your attention right now. All listings and team items are up to date.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {needsYouList.slice(0, 7).map((item, idx) => {
                const isNow = item.severity === 'NOW' || item.severity === 'Now';
                const isSoon = item.severity === 'SOON' || item.severity === 'Soon';

                return (
                  <li
                    key={item.id || idx}
                    className="row"
                    style={{
                      gap: '12px',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--cmp-border)'
                    }}
                  >
                    <span
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        color: isNow ? 'var(--cmp-danger)' : isSoon ? 'var(--cmp-warning)' : 'var(--cmp-brand)',
                        background: isNow ? 'rgba(179, 38, 30, 0.12)' : isSoon ? 'rgba(180, 116, 12, 0.12)' : 'var(--cmp-brand-subtle)'
                      }}
                    >
                      <AlertTriangle size={16} />
                    </span>

                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '13.5px' }}>
                        {item.text || item.title}
                      </span>
                      {item.detail && (
                        <span className="muted" style={{ display: 'block', fontSize: '12.5px', marginTop: '2px' }}>
                          {item.detail}
                        </span>
                      )}
                    </span>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: isNow ? 'var(--cmp-danger)' : isSoon ? 'var(--cmp-warning)' : 'var(--cmp-brand)'
                      }}
                    >
                      {item.severity}
                    </span>

                    <NavLink to={resolveNeedsYouUrl(item)} className="btn btn-outline btn-sm">
                      {resolveNeedsYouActionLabel(item)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* My Follow-ups Card */}
        <div style={{ display: 'grid', gap: '18px' }}>
          <section className="card" style={{ padding: 0 }}>
            <div className="row" style={{ justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--cmp-border)' }}>
              <div className="row" style={{ gap: '10px' }}>
                <h2 style={{ fontSize: '16.5px', margin: 0 }}>My follow-ups</h2>
                <span className="count-badge">
                  {mockFollowUps.filter((f) => !f.done).length}
                </span>
              </div>
            </div>

            {/* Quick Add Follow-up Form */}
            <form onSubmit={handleFollowUpSubmit} style={{ display: 'flex', gap: '8px', padding: '14px 18px 10px' }}>
              <input
                placeholder="Add a follow-up task…"
                value={newFollowUpText}
                onChange={(e) => setNewFollowUpText(e.target.value)}
                style={{ height: '36px', fontSize: '13px' }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!newFollowUpText.trim()}
              >
                <Plus size={15} />
              </button>
            </form>

            {mockFollowUps.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', fontSize: '13px' }} className="muted">
                No follow-ups scheduled.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: '4px 10px 12px' }}>
                {mockFollowUps.map((task) => (
                  <li
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      transition: 'background var(--cmp-duration-fast) var(--cmp-ease)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleFollowUp(task.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginTop: '3px',
                        accentColor: 'var(--cmp-brand)',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '13.5px',
                          textDecoration: task.done ? 'line-through' : 'none',
                          color: task.done ? 'var(--cmp-text-faint)' : 'var(--cmp-text)'
                        }}
                      >
                        {task.text}
                      </span>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: task.status.includes('Overdue') ? 'var(--cmp-danger)' : 'var(--cmp-text-faint)'
                        }}
                      >
                        {task.status} · {task.agent}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Best Performing Properties Showcase */}
      <section style={{ marginTop: '28px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Best performing properties</h2>
          <NavLink to="/properties" className="btn btn-ghost btn-sm">
            <span>All properties</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        {topProperties.length === 0 ? (
          <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }} className="muted">
              No live properties recorded yet
            </p>
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
              Once you add and publish listings, their compliance and performance ranking will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {topProperties.map((prop, idx) => (
              <NavLink
                key={prop.id}
                to={`/properties/${prop.id}/edit`}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  position: 'relative'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--cmp-accent)',
                    color: 'var(--cmp-text-on-accent)',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    zIndex: 2
                  }}
                >
                  {idx + 1}
                </span>

                <img
                  src={prop.coverImageWatermarked || prop.coverImage || prop.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=300&q=70'}
                  alt={prop.title}
                  style={{
                    width: '78px',
                    height: '66px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />

                <div style={{ display: 'grid', gap: '3px', minWidth: 0, flex: 1 }}>
                  <strong
                    style={{
                      fontSize: '13.5px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {prop.title || 'Untitled Property'}
                  </strong>
                  <span className="muted" style={{ fontSize: '12.5px' }}>
                    {prop.location || prop.community}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--cmp-brand)', fontWeight: 700 }}>
                    Quality score: {prop.qualityScore || 0}/100
                  </span>
                </div>
              </NavLink>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
