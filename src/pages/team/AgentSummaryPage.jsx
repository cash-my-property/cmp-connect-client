import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Eye,
  X,
  Star,
  Zap,
  TrendingUp,
  Award,
  Building,
  CheckCircle,
  Clock,
  ChevronDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

export default function AgentSummaryPage() {
  const { id } = useParams();
  const { authToken, account } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAwayMode, setIsAwayMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Agent profile state
  const [agent, setAgent] = useState({
    id: id || '',
    name: 'Agent',
    initials: 'AG',
    email: '—',
    phone: '—',
    role: 'Agent',
    tier: 'Rising',
    score: 0,
    rating: null,
    reviewsCount: 0,
    unattended: 0,
    responseRate: 100,
    liveListings: 0,
    claimedDeals: 0,
    unclaimedDeals: 0
  });

  useEffect(() => {
    if (!authToken) {
      setIsLoading(false);
      return;
    }

    cmpConnectApi.listMembers({ limit: 100 }, authToken)
      .then((res) => {
        if (res?.data) {
          const found = res.data.find((m) => (m.id === id || m._id === id)) || (account?.id === id ? account : null);
          if (found) {
            const name = found.fullName || found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || 'Agent';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();
            const isVerified = found.verificationStatus === 'VERIFIED';

            setAgent({
              id: found.id || found._id,
              name,
              initials,
              email: found.email || '—',
              phone: found.mobile || found.phone || '—',
              role: found.role?.name || (typeof found.role === 'string' ? found.role : 'Agent'),
              tier: isVerified ? 'Elite' : 'Rising',
              score: isVerified ? 750 : 350,
              rating: null,
              reviewsCount: 0,
              unattended: 0,
              responseRate: 100,
              liveListings: 0,
              claimedDeals: 0,
              unclaimedDeals: 0
            });
          }
        }
      })
      .catch((err) => {
        console.warn('[AgentSummaryPage] Failed to fetch agent:', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, authToken, account]);

  return (
    <div>
      {/* Top Agent View Banner */}
      <div className="row" style={{ justifyContent: 'center', marginTop: '-12px', marginBottom: '14px' }}>
        <span
          className="row"
          style={{
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '0 0 10px 10px',
            background: 'var(--cmp-brand)',
            color: 'var(--cmp-text-on-brand)',
            fontSize: '13.5px',
            fontWeight: 600,
            alignItems: 'center'
          }}
        >
          <Eye size={15} />
          <span>Agent summary: {agent.name}</span>
          <NavLink
            to="/team"
            aria-label="Exit agent view"
            style={{ display: 'inline-flex', color: 'inherit', marginLeft: '6px' }}
          >
            <X size={15} />
          </NavLink>
        </span>
      </div>

      {/* Main Header & Controls */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
          Agent summary
        </h1>
        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${isAwayMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsAwayMode(!isAwayMode)}
            style={{ gap: '6px' }}
          >
            <span>Away mode: {isAwayMode ? 'Active' : 'Off'}</span>
            <Calendar size={14} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
          Loading agent summary...
        </div>
      ) : (
        <>
          {/* Segmented Tab List */}
          <div role="tablist" className="segmented" style={{ marginBottom: '18px' }}>
            {['Overview', 'Agent Performance', 'Customer Feedback'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Top Row: Congratulations / Score + Customer Feedback */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(260px, 1fr)', gap: '16px' }}>
            {/* Score & Elite Level */}
            <section
              className="card row"
              style={{
                padding: '20px',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: '1 1 240px' }}>
                <h2 style={{ fontSize: '20px', margin: 0 }}>
                  Congratulations {agent.name}!
                </h2>
                <p className="muted" style={{ margin: '4px 0 14px', fontSize: '14px' }}>
                  Well done! You are currently at <strong>Elite level</strong>.
                </p>
                <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                      {agent.score}
                    </span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      Agent score / 1000
                    </span>
                  </div>
                  <div style={{ flex: '1 1' }}>
                    <p className="faint" style={{ margin: '0 0 4px', fontSize: '12px' }}>
                      Great job! Keep it up
                    </p>
                    <div className="meter" style={{ height: '8px', borderRadius: '999px', background: 'var(--cmp-surface-sunken)', border: '1px solid var(--cmp-border)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${(agent.score / 1000) * 100}%`,
                          height: '100%',
                          background: 'var(--cmp-brand)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar with Elite Badge */}
              <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)',
                    fontWeight: 700,
                    fontSize: '28px'
                  }}
                >
                  {agent.initials}
                </div>
                <span
                  title="Elite agent"
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--cmp-accent)',
                    color: 'var(--cmp-text-on-accent)',
                    display: 'grid',
                    placeItems: 'center',
                    border: '2px solid var(--cmp-surface)'
                  }}
                >
                  <Award size={18} />
                </span>
              </div>
            </section>

            {/* Customer Feedback Tile */}
            <section className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '15px', margin: 0, textDecoration: 'underline dotted', textUnderlineOffset: '4px' }}>
                Customer feedback
              </h2>
              <p style={{ margin: '14px 0 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800 }}>{agent.unattended}</span>
                <span className="muted" style={{ fontSize: '13px' }}>Unattended enquiry</span>
              </p>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} style={{ fill: 'var(--cmp-warning)', color: 'var(--cmp-warning)' }} />
                <span><strong>5.0</strong> rating · 2 verified client reviews</span>
              </p>
            </section>
          </div>

          {/* Bottom Row: Response rate SVG line chart + Properties donut + Transactions donut */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) repeat(2, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Response Rate Chart */}
            <section className="card" style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '15px', margin: '0 0 12px' }}>Response rate</h2>
              <div style={{ position: 'relative' }}>
                <svg viewBox="0 0 760 180" width="100%" role="img" aria-label="Response rate timeline">
                  <line x1="48" x2="744" y1="150" y2="150" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="154" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0%</text>

                  <line x1="48" x2="744" y1="85" y2="85" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="89" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">50%</text>

                  <line x1="48" x2="744" y1="20" y2="20" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="24" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">100%</text>

                  {/* Gradient Area */}
                  <path
                    d="M48,45 L120,40 L200,38 L300,35 L400,32 L500,28 L600,26 L744,22 L744,150 L48,150 Z"
                    fill="var(--cmp-brand)"
                    opacity="0.12"
                  />
                  {/* Line */}
                  <path
                    d="M48,45 L120,40 L200,38 L300,35 L400,32 L500,28 L600,26 L744,22"
                    fill="none"
                    stroke="var(--cmp-brand)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="744" cy="22" r="4.5" fill="var(--cmp-brand)" stroke="var(--cmp-surface)" strokeWidth="2" />
                </svg>
              </div>

              <div className="row" style={{ justifyContent: 'space-between', marginTop: '6px', fontSize: '13.5px' }}>
                <span>Overall agent response rate: <strong>{agent.responseRate}%</strong></span>
                <span className="badge badge-success">Top 5% in Dubai</span>
              </div>

              <div
                className="card row"
                style={{
                  margin: '12px 0 0',
                  padding: '10px 14px',
                  gap: '8px',
                  fontSize: '13.5px',
                  background: 'var(--cmp-surface-sunken)',
                  border: 'none',
                  alignItems: 'center'
                }}
              >
                <Zap size={16} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />
                <span><strong>Great job!</strong> Your quick response time drives higher portal conversions.</span>
              </div>
            </section>

            {/* Live Properties Donut */}
            <section className="card" style={{ padding: '20px', display: 'grid', gap: '12px', alignContent: 'space-between' }}>
              <h2 style={{ fontSize: '15px', margin: 0 }}>Live properties</h2>
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="54" fill="none" stroke="var(--cmp-surface-sunken)" strokeWidth="18" />
                  <circle
                    cx="65"
                    cy="65"
                    r="54"
                    fill="none"
                    stroke="var(--cmp-accent)"
                    strokeWidth="18"
                    strokeDasharray="339 339"
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>{agent.liveListings}</span>
                  <span className="faint" style={{ fontSize: '11px' }}>Total</span>
                </div>
              </div>

              <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '10px', flexWrap: 'wrap', fontSize: '12px', justifyContent: 'center' }}>
                <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-text-faint)' }} />
                  <span className="muted">Standard</span>
                </li>
                <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
                  <span className="muted">Featured</span>
                </li>
                <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-accent)' }} />
                  <span className="muted">Premium</span>
                </li>
              </ul>

              <NavLink to="/properties" className="btn btn-outline btn-sm">
                View properties
              </NavLink>
            </section>

            {/* Transactions Donut */}
            <section className="card" style={{ padding: '20px', display: 'grid', gap: '12px', alignContent: 'space-between' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '15px', margin: 0 }}>Transactions</h2>
                <span className="faint" style={{ fontSize: '11px' }}>Last 12 mos</span>
              </div>

              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="65" cy="65" r="54" fill="none" stroke="var(--cmp-surface-sunken)" strokeWidth="18" />
                  <circle
                    cx="65"
                    cy="65"
                    r="54"
                    fill="none"
                    stroke="var(--cmp-brand)"
                    strokeWidth="18"
                    strokeDasharray="48 339"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="65"
                    cy="65"
                    r="54"
                    fill="none"
                    stroke="var(--cmp-brand-subtle)"
                    strokeWidth="18"
                    strokeDasharray="285 339"
                    strokeDashoffset="-48"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800 }}>7</span>
                  <span className="faint" style={{ fontSize: '11px' }}>Total deals</span>
                </div>
              </div>

              <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '12px', flexWrap: 'wrap', fontSize: '12px', justifyContent: 'center' }}>
                <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
                  <span className="muted">Claimed: <strong>1</strong></span>
                </li>
                <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-border-strong)' }} />
                  <span className="muted">Not claimed: <strong>6</strong></span>
                </li>
              </ul>

              <NavLink to="/transactions" className="btn btn-outline btn-sm">
                Claim transactions
              </NavLink>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'Agent Performance' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Performance metrics</h2>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: '14px' }}>
            Historical deal volume, speed to answer calls, and lead conversion rates.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
              <span className="faint" style={{ fontSize: '12px' }}>Avg response time</span>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--cmp-brand)' }}>11 mins</p>
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
              <span className="faint" style={{ fontSize: '12px' }}>Total leads handled</span>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800 }}>142</p>
            </div>
            <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
              <span className="faint" style={{ fontSize: '12px' }}>Closed sales volume</span>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800 }}>AED 18.4M</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Customer Feedback' && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Client ratings and testimonials</h2>
          <p className="muted" style={{ margin: '0 0 20px', fontSize: '14px' }}>
            All verified ratings received from buyers and tenants who enquired with {agent.name}.
          </p>
          <div style={{ display: 'grid', gap: '14px' }}>
            <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong>Tareq Al-Hashemi</strong>
                <span className="faint" style={{ fontSize: '12px' }}>14 Sep 2026</span>
              </div>
              <div className="row" style={{ gap: '4px', marginBottom: '8px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} style={{ fill: 'var(--cmp-warning)', color: 'var(--cmp-warning)' }} />
                ))}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                {`"Very prompt and professional. ${agent.name} answered within 5 minutes and arranged the viewing the same day."`}
              </p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
