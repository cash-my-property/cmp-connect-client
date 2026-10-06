import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
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
  ShieldAlert
} from 'lucide-react';

export default function DashboardPage() {
  const {
    agency,
    listings,
    clients,
    followUps,
    toggleFollowUp,
    addFollowUp,
    needsYou,
    dismissNeedsYou
  } = useApp();

  const [newFollowUpText, setNewFollowUpText] = useState('');
  const [setupHidden, setSetupHidden] = useState(false);

  const liveListingsCount = listings.filter((l) => l.status === 'Live').length;
  const qualifiedClientsCount = clients.filter((c) => c.stage === 'Qualified').length;
  const topProperties = listings.slice(0, 4);

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (newFollowUpText.trim()) {
      addFollowUp(newFollowUpText.trim());
      setNewFollowUpText('');
    }
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
          <h1 style={{ fontSize: '26px' }}>Good evening, {agency.currentUser.name.split(' ')[0]}</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Thursday, 17 September · {needsYou.length} things need your attention today
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/clients" className="btn btn-outline btn-sm">
            <Users size={15} />
            <span>Add contact</span>
          </NavLink>
          <NavLink to="/properties/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add property</span>
          </NavLink>
        </div>
      </div>

      {/* Setup Progress Card */}
      {!setupHidden && (
        <section className="card setup-card">
          <div className="row" style={{ gap: '18px', flexWrap: 'wrap' }}>
            {/* SVG Circular Progress Ring 80% */}
            <span
              role="img"
              aria-label="80%"
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
                  strokeDasharray="143.25 179.07"
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '15px', fontWeight: 800 }}>4/5</span>
            </span>

            <div style={{ flex: '1 1 220px' }}>
              <h2 style={{ fontSize: '17px' }}>Finish setting up CMP Connect</h2>
              <p className="muted" style={{ margin: '3px 0 0', fontSize: '13.5px' }}>
                A few steps that make your agency's listings safer, faster to manage and easier for buyers to find.
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
              <NavLink to="/account/security" data-done="true">
                <span className="setup-check"><Check size={13} /></span>
                <span>Turn on two-step verification</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/team/members" data-done="true">
                <span className="setup-check"><Check size={13} /></span>
                <span>Invite your whole team</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/growth/smart-boost">
                <span className="setup-check"></span>
                <span>Boost your best property</span>
              </NavLink>
            </li>
          </ul>
        </section>
      )}

      {/* 4 KPI Cards */}
      <div className="stat-grid" style={{ marginBottom: '22px' }}>
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
            <span className="faint" style={{ fontSize: '12px' }}>{listings.length} in your portfolio</span>
          </span>
        </NavLink>

        <NavLink className="card" to="/growth/insights" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
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
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Enquiries, 30 days</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>196</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cmp-danger)' }}>
              ▼ 5% vs last 30 days
            </span>
          </span>
        </NavLink>

        <NavLink className="card" to="/clients" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
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
            <CheckCircle2 size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Qualified clients</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>{qualifiedClientsCount}</span>
            <span className="faint" style={{ fontSize: '12px' }}>5 new enquiries waiting</span>
          </span>
        </NavLink>

        <NavLink className="card" to="/wallet" style={{ display: 'flex', gap: '14px', padding: '16px' }}>
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
            <Coins size={20} />
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <span className="muted" style={{ fontSize: '12.5px', fontWeight: 600 }}>Wallet Credits</span>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              {agency.credits.toLocaleString()}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>Expire in {agency.creditsExpiryDays} days</span>
          </span>
        </NavLink>
      </div>

      {/* Main Grid: Needs You + Follow-ups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: '18px', alignItems: 'start' }}>
        {/* Needs You Feed */}
        <section className="card" style={{ padding: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--cmp-border)' }}>
            <div className="row" style={{ gap: '10px' }}>
              <h2 style={{ fontSize: '16.5px' }}>Needs you</h2>
              <span className="count-badge">{needsYou.length}</span>
            </div>
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {needsYou.slice(0, 7).map((item) => (
              <li
                key={item.id}
                className="row"
                style={{
                  gap: '12px',
                  padding: '12px 20px',
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
                    color:
                      item.severity === 'Now'
                        ? 'var(--cmp-danger)'
                        : item.severity === 'Soon'
                        ? 'var(--cmp-warning)'
                        : 'var(--cmp-brand)',
                    background:
                      item.severity === 'Now'
                        ? 'rgba(179, 38, 30, 0.12)'
                        : item.severity === 'Soon'
                        ? 'rgba(180, 116, 12, 0.12)'
                        : 'var(--cmp-brand-subtle)'
                  }}
                >
                  <AlertTriangle size={16} />
                </span>

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: '13.5px' }}>
                    {item.title}
                  </span>
                  <span className="muted" style={{ display: 'block', fontSize: '12.5px' }}>
                    {item.subtitle}
                  </span>
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color:
                      item.severity === 'Now'
                        ? 'var(--cmp-danger)'
                        : item.severity === 'Soon'
                        ? 'var(--cmp-warning)'
                        : 'var(--cmp-brand)'
                  }}
                >
                  {item.severity}
                </span>

                <NavLink to={item.actionUrl} className="btn btn-outline btn-sm">
                  {item.actionLabel}
                </NavLink>
              </li>
            ))}
          </ul>
        </section>

        {/* My Follow-ups Card */}
        <div style={{ display: 'grid', gap: '18px' }}>
          <section className="card" style={{ padding: 0 }}>
            <div className="row" style={{ justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--cmp-border)' }}>
              <div className="row" style={{ gap: '10px' }}>
                <h2 style={{ fontSize: '16.5px' }}>My follow-ups</h2>
                <span className="count-badge">
                  {followUps.filter((f) => !f.done).length}
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

            <ul style={{ listStyle: 'none', margin: 0, padding: '4px 10px 12px' }}>
              {followUps.map((task) => (
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
          </section>
        </div>
      </div>

      {/* Best Performing Properties Showcase */}
      <section style={{ marginTop: '28px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px' }}>Best performing properties</h2>
          <NavLink to="/properties" className="btn btn-ghost btn-sm">
            <span>All properties</span>
            <ArrowRight size={14} />
          </NavLink>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {topProperties.map((prop, idx) => (
            <NavLink
              key={prop.id}
              to="/properties"
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
                src={prop.image}
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
                  {prop.title}
                </strong>
                <span className="muted" style={{ fontSize: '12.5px' }}>
                  {prop.community.split(',')[0]} · {prop.priceLabel}
                </span>
                <span style={{ fontSize: '12px' }}>
                  <strong>{prop.leads}</strong> enquiries · <strong>{prop.views.toLocaleString()}</strong> views
                </span>
              </div>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}
