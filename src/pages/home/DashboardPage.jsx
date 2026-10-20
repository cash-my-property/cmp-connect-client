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

  const [newDue, setNewDue] = useState(new Date().toISOString().slice(0, 10));

  const formatPriceCompact = (amount) => {
    if (!amount && amount !== 0) return 'AED —';
    const num = Number(amount);
    if (isNaN(num)) return `AED ${amount}`;
    if (num >= 1_000_000) {
      const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `AED ${formatted}M`;
    }
    if (num >= 1_000) {
      const formatted = (num / 1_000).toFixed(0);
      return `AED ${formatted}K`;
    }
    return `AED ${num.toLocaleString('en-AE')}`;
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (newFollowUpText.trim()) {
      addFollowUp(newFollowUpText.trim(), newDue);
      setNewFollowUpText('');
    }
  };

  // Resolve link for Needs You items
  const resolveNeedsYouUrl = (item) => {
    if (!item.link) return '/properties';
    if (item.link.kind === 'listing') return `/properties/${item.link.id}/edit`;
    if (item.link.kind === 'member') return `/team/members`;
    if (item.link.kind === 'profile') return `/account`;
    if (item.href) return item.href;
    return '/properties';
  };

  const resolveNeedsYouActionLabel = (item) => {
    if (item.action) return item.action;
    if (item.type === 'APPROVE_LISTING') return 'Review';
    if (item.type === 'FIX_REJECTED_LISTING') return 'Fix';
    if (item.type === 'LISTING_ON_HOLD') return 'Review';
    if (item.type === 'PUBLISH_AGAIN') return 'Publish';
    if (item.type === 'EXPIRING_SOON') return 'Review';
    if (item.type === 'FINISH_DRAFT') return 'Edit';
    if (item.type === 'VERIFY_MY_BRN') return 'Update';
    if (item.type === 'RESEND_INVITE') return 'Resend';
    if (item.type === 'FIX_MEMBER_BRN') return 'Update';
    return 'Open';
  };

  const resolveSeverityInfo = (severity) => {
    const s = String(severity || 'info').toLowerCase();
    if (s === 'urgent' || s === 'now') {
      return { label: 'Now', color: 'var(--cmp-danger)', bg: 'color-mix(in srgb, var(--cmp-danger) 12%, transparent)' };
    }
    if (s === 'soon') {
      return { label: 'Soon', color: 'var(--cmp-warning)', bg: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)' };
    }
    return { label: 'Today', color: 'var(--cmp-brand)', bg: 'color-mix(in srgb, var(--cmp-brand) 12%, transparent)' };
  };

  // User display name
  const userFullName = account?.fullName || agency?.currentUser?.name || 'Layla';
  const userFirstName = userFullName.split(' ')[0];

  // Enquiries 30d
  const enquiries30d = homeData?.leads30d ?? 34;
  const enquiriesPrev30d = homeData?.leadsPrev30d ?? 28;

  // Credits info
  const creditsBalance = homeData?.credits?.balance ?? (agency?.credits ?? 850);
  const creditsDaysLeft = homeData?.credits?.daysLeft ?? 42;

  // Setup items
  const setupItems = setupProgress?.steps || [
    { done: true, label: 'Create your agency account', href: '/account' },
    { done: true, label: 'Add your brand watermark', href: '/properties/brand-kit' },
    { done: true, label: 'Turn on two-step verification', href: '/account/security' },
    { done: (teamStats?.active ?? 6) >= 5, label: 'Invite your whole team', href: '/team/members' },
    { done: (stats?.live ?? 4) >= 1, label: 'Boost your best property', href: '/properties' }
  ];

  const activeFollowUps = mockFollowUps.filter((f) => !f.done);

  return (
    <>
      {/* Security Banner */}
      <div
        role="note"
        className="row"
        style={{
          gap: 12,
          padding: '12px 18px',
          marginBottom: 20,
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

      {/* Greeting Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.02em', margin: 0 }}>
            {timeGreeting}, {userFirstName}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            {todayFormatted} · {needsYouList.length ? `${needsYouList.length} ${needsYouList.length === 1 ? 'thing needs' : 'things need'} you` : 'Nothing urgent'}
          </p>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <NavLink to="/clients/regular" className="btn btn-outline btn-sm">
            <Users size={16} />
            <span>Add contact</span>
          </NavLink>
          <NavLink to="/properties/new" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>Add property</span>
          </NavLink>
        </div>
      </div>

      {/* Setup Card */}
      {!setupHidden && setupDone < setupTotal && (
        <section className="card setup-card">
          <div className="row" style={{ gap: 16, flexWrap: 'wrap' }}>
            {/* SVG Circular Ring */}
            <span
              role="img"
              aria-label={`${setupPct}%`}
              style={{
                position: 'relative',
                display: 'inline-grid',
                placeItems: 'center',
                width: 64,
                height: 64,
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
              <span style={{ position: 'absolute', fontSize: 14, fontWeight: 800 }}>
                {setupDone}/{setupTotal}
              </span>
            </span>

            <div style={{ flex: 1, minWidth: 220 }}>
              <h2 style={{ fontSize: 17, margin: 0 }}>Finish setting up CMP Connect</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>
                A few steps that make listings safer, faster to manage and easier to find.
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

          <ul className="setup-list">
            {setupItems.map((s) => (
              <li key={s.label}>
                <NavLink to={s.href || '/account'} data-done={s.done ? 'true' : undefined}>
                  <span className="setup-check" aria-hidden>
                    {s.done ? <Check size={14} /> : null}
                  </span>
                  <span>{s.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4 KPI Grid */}
      <div className="kpi-grid">
        <NavLink to="/properties" className="card kpi-tile">
          <span className="kpi-icon">
            <Building size={18} />
          </span>
          <span style={{ display: 'grid', gap: 2 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Live properties</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cmp-text)' }}>
              {liveListingsCount}
            </span>
            <span className="faint" style={{ fontSize: 12 }}>
              {totalListingsCount} in your portfolio
            </span>
          </span>
        </NavLink>

        <NavLink to="/growth/lead-insights" className="card kpi-tile">
          <span className="kpi-icon">
            <Phone size={18} />
          </span>
          <span style={{ display: 'grid', gap: 2 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Enquiries, 30 days</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cmp-text)' }}>
              {enquiries30d}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: enquiries30d >= enquiriesPrev30d ? 'var(--cmp-success)' : 'var(--cmp-danger)' }}>
              {enquiries30d >= enquiriesPrev30d ? '▲' : '▼'} {enquiriesPrev30d ? Math.round(Math.abs((enquiries30d - enquiriesPrev30d) / enquiriesPrev30d) * 100) : 12}% vs last 30 days
            </span>
          </span>
        </NavLink>

        <NavLink to="/clients/pipeline" className="card kpi-tile">
          <span className="kpi-icon">
            <Users size={18} />
          </span>
          <span style={{ display: 'grid', gap: 2 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Qualified clients</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cmp-text)' }}>
              {qualifiedClientsCount}
            </span>
            <span className="faint" style={{ fontSize: 12 }}>
              {mockClients.filter((c) => c.stage === 'New').length || 2} new enquiries waiting
            </span>
          </span>
        </NavLink>

        <NavLink to="/wallet/credits" className="card kpi-tile">
          <span className="kpi-icon">
            <Coins size={18} />
          </span>
          <span style={{ display: 'grid', gap: 2 }}>
            <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Credits</span>
            <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--cmp-text)' }}>
              {Number(creditsBalance).toLocaleString('en-AE')}
            </span>
            <span className="faint" style={{ fontSize: 12 }}>
              Expire in {creditsDaysLeft} days
            </span>
          </span>
        </NavLink>
      </div>

      {/* Today Grid: Needs You + My Follow-ups */}
      <div className="today-grid">
        {/* Needs You Card */}
        <section className="card" style={{ padding: 0 }}>
          <div className="section-head">
            <h2>Needs you</h2>
            <span className="count-badge">{needsYouList.length}</span>
          </div>

          {isLoading && !homeData ? (
            <div style={{ padding: '24px 20px', textAlign: 'center' }} className="muted">
              <Loader2 size={22} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13 }}>Getting your day ready…</p>
            </div>
          ) : needsYouList.length === 0 ? (
            <p className="muted" style={{ padding: '0 20px 20px' }}>You’re all caught up.</p>
          ) : (
            <ul className="priority-list">
              {needsYouList.slice(0, 12).map((item, idx) => {
                const sev = resolveSeverityInfo(item.severity);
                return (
                  <li key={item.id || idx}>
                    <span
                      className="priority-icon"
                      style={{ color: sev.color, background: sev.bg }}
                    >
                      <AlertTriangle size={17} />
                    </span>

                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: 14 }}>
                        {item.title || item.text}
                      </span>
                      {item.detail && (
                        <span className="muted" style={{ display: 'block', fontSize: 13 }}>
                          {item.detail}
                        </span>
                      )}
                    </span>

                    <span className="severity" style={{ color: sev.color }}>
                      {sev.label}
                    </span>

                    <NavLink to={resolveNeedsYouUrl(item)} className="btn btn-outline btn-sm">
                      {resolveNeedsYouActionLabel(item)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          )}
          {needsYouList.length > 12 && (
            <p className="faint" style={{ padding: '0 20px 16px', margin: 0, fontSize: 13 }}>
              And {needsYouList.length - 12} more.
            </p>
          )}
        </section>

        {/* My Follow-ups Card */}
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <section className="card" style={{ padding: 0 }}>
            <div className="section-head">
              <h2>My follow-ups</h2>
              <span className="count-badge">{activeFollowUps.length}</span>
            </div>

            <form
              className="row"
              style={{ gap: 6, padding: '0 16px 12px' }}
              onSubmit={handleFollowUpSubmit}
            >
              <label htmlFor="task-title" className="visually-hidden">New follow-up</label>
              <input
                id="task-title"
                value={newFollowUpText}
                onChange={(e) => setNewFollowUpText(e.target.value)}
                placeholder="Add a follow-up…"
                style={{ height: 38 }}
              />
              <label htmlFor="task-due" className="visually-hidden">Due date</label>
              <input
                id="task-due"
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                style={{ height: 38, width: 140 }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                aria-label="Add follow-up"
                disabled={!newFollowUpText.trim()}
              >
                <Plus size={16} />
              </button>
            </form>

            <ul style={{ listStyle: 'none', margin: 0, padding: '0 8px 10px' }}>
              {mockFollowUps.map((t) => (
                <li key={t.id} className="task-row">
                  <input
                    type="checkbox"
                    checked={t.done}
                    aria-label={`Mark done: ${t.text}`}
                    onChange={() => toggleFollowUp(t.id)}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        textDecoration: t.done ? 'line-through' : 'none',
                        color: t.done ? 'var(--cmp-text-faint)' : 'var(--cmp-text)'
                      }}
                    >
                      {t.text}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: t.status?.includes('Overdue') ? 'var(--cmp-danger)' : 'var(--cmp-text-faint)',
                        fontWeight: t.status?.includes('Overdue') ? 700 : 500
                      }}
                    >
                      {t.status} · {t.agent}
                    </span>
                  </span>
                </li>
              ))}
              {mockFollowUps.length === 0 && (
                <li className="muted" style={{ padding: 10, fontSize: 14 }}>
                  No follow-ups. Nice.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>

      {/* Best Performing Properties */}
      <section style={{ marginTop: 24 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Best performing properties</h2>
          <NavLink to="/properties" className="btn btn-ghost btn-sm">
            All properties
          </NavLink>
        </div>

        <div className="top-properties">
          {topProperties.slice(0, 4).map((l, i) => {
            const photoUrl = l.coverImageWatermarked || l.coverImage || l.image || l.photo;
            const price = l.price;
            const leads = l.leads30d ?? l.leads ?? 14;
            const views = l.views30d ?? l.views ?? 1240;

            return (
              <NavLink
                key={l.id}
                to={`/properties/${l.id}/edit`}
                className="card top-property"
              >
                <span className="rank">{i + 1}</span>
                {photoUrl ? (
                  <img src={photoUrl} alt="" loading="lazy" />
                ) : (
                  <span className="img-fallback" />
                )}
                <span style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                  <strong
                    style={{
                      fontSize: 14,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {l.title || 'Untitled Property'}
                  </strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {l.location || l.community || 'Dubai'} · {formatPriceCompact(price)}
                  </span>
                  <span style={{ fontSize: 13 }}>
                    <strong>{leads}</strong> enquiries · <strong>{Number(views).toLocaleString('en-AE')}</strong> views
                  </span>
                </span>
              </NavLink>
            );
          })}
        </div>
      </section>

      {/* Footer Team info */}
      <p className="faint" style={{ fontSize: 12, marginTop: 20 }}>
        Agents on your team: {homeData?.teamAgents ? homeData.teamAgents.join(', ') : 'Layla, Karim Saleh, Arjun Mehta, Emma Clarke'}.
      </p>
    </>
  );
}
