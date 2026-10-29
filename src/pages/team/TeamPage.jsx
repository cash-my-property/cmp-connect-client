import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Navigate, useLocation } from 'react-router-dom';
import { Search, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

const mockLeaderboardAgents = [
  {
    id: 'lb-1',
    name: 'Layla Haddad',
    initials: 'LH',
    isElite: true,
    criteriaMet: '4/4',
    verified: true,
    liveProperties: 14,
    claimedDeals12m: 4,
    avgRating: 4.9,
    ratingsCount: 32,
    agentScore: 96,
    waResponseTime: '< 2 mins',
    waScore: 98,
    responseRate: 99,
    responseScore: 99,
    listingQuality: 95,
    qualityScore: 95,
    realTimeOffer: {
      entered: 6,
      live: 2,
      scheduled: 1,
      sold: 3,
      unsold: 0,
      soldValue: 8450000,
      sellThrough: 100
    }
  },
  {
    id: 'lb-2',
    name: 'Karim Saleh',
    initials: 'KS',
    isElite: true,
    criteriaMet: '4/4',
    verified: true,
    liveProperties: 9,
    claimedDeals12m: 2,
    avgRating: 4.8,
    ratingsCount: 24,
    agentScore: 92,
    waResponseTime: '< 5 mins',
    waScore: 94,
    responseRate: 96,
    responseScore: 96,
    listingQuality: 92,
    qualityScore: 92,
    realTimeOffer: {
      entered: 4,
      live: 1,
      scheduled: 1,
      sold: 1,
      unsold: 1,
      soldValue: 2350000,
      sellThrough: 50
    }
  },
  {
    id: 'lb-3',
    name: 'Emma Clarke',
    initials: 'EC',
    isElite: false,
    criteriaMet: '3/4',
    verified: false,
    liveProperties: 7,
    claimedDeals12m: 1,
    avgRating: 4.6,
    ratingsCount: 18,
    agentScore: 84,
    waResponseTime: '< 8 mins',
    waScore: 86,
    responseRate: 91,
    responseScore: 91,
    listingQuality: 88,
    qualityScore: 88,
    realTimeOffer: {
      entered: 2,
      live: 0,
      scheduled: 0,
      sold: 1,
      unsold: 1,
      soldValue: 1800000,
      sellThrough: 50
    }
  },
  {
    id: 'lb-4',
    name: 'Arjun Mehta',
    initials: 'AM',
    isElite: true,
    criteriaMet: '4/4',
    verified: true,
    liveProperties: 11,
    claimedDeals12m: 3,
    avgRating: 4.9,
    ratingsCount: 29,
    agentScore: 94,
    waResponseTime: '< 3 mins',
    waScore: 95,
    responseRate: 97,
    responseScore: 97,
    listingQuality: 93,
    qualityScore: 93,
    realTimeOffer: {
      entered: 3,
      live: 1,
      scheduled: 0,
      sold: 1,
      unsold: 1,
      soldValue: 3100000,
      sellThrough: 50
    }
  }
];

export default function TeamPage() {
  const { authToken, isMockData, account, can } = useApp();
  const location = useLocation();
  const isRto = location.pathname.startsWith('/rto');

  if (!isMockData && account && !can('insights.agents_view')) {
    if (can('roles.view')) {
      return <Navigate to={isRto ? '/rto/team/roles' : '/team/roles'} replace />;
    }
    if (can('team.view')) {
      return <Navigate to={isRto ? '/rto/members' : '/members'} replace />;
    }
    return <Navigate to={isRto ? '/rto' : '/'} replace />;
  }

  const [agents, setAgents] = useState([]);
  const [dataAsOf, setDataAsOf] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isMockData) {
      setAgents(mockLeaderboardAgents);
      setIsLoading(false);
      return;
    }

    if (!authToken) {
      setAgents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const fetchFn = isRto
      ? cmpConnectApi.getRtoLeaderboard({}, authToken)
      : cmpConnectApi.getLeaderboard({}, authToken);

    fetchFn
      .then((res) => {
        const payload = res?.data;
        if (payload?.dataAsOf || res?.dataAsOf) {
          setDataAsOf(payload?.dataAsOf || res?.dataAsOf);
        }
        const rawList = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
                ? res
                : [];

        if (rawList.length > 0) {
          const mapped = rawList.map((m) => {
            const name = m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Agent';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'AG';

            const met = m.elite?.criteriaMet != null ? m.elite.criteriaMet : (m.verified ? 2 : 1);
            const total = m.elite?.criteriaTotal != null ? m.elite.criteriaTotal : 4;
            const rto = m.realTimeOffer || {};

            return {
              id: m.id || m._id,
              name,
              initials,
              photo: m.photo || null,
              brn: m.brn || '',
              away: Boolean(m.away),
              isElite: Boolean(m.elite?.level),
              criteriaMet: `${met}/${total}`,
              verified: Boolean(m.verified),
              liveProperties: m.liveProperties != null ? m.liveProperties : 0,
              claimedDeals12m: m.claimedDeals12m != null ? m.claimedDeals12m : 0,
              listingQuality: m.listingQuality != null ? m.listingQuality : null,
              avgRating: m.averageRating != null ? m.averageRating : null,
              ratingsCount: m.ratingsCount != null ? m.ratingsCount : 0,
              agentScore: m.agentScore != null ? m.agentScore : null,
              waResponseTime: m.whatsappResponseTime || null,
              responseRate: m.responseRate != null ? m.responseRate : null,
              realTimeOffer: {
                entered: rto.entered ?? 0,
                live: rto.live ?? 0,
                scheduled: rto.scheduled ?? 0,
                sold: rto.sold ?? 0,
                unsold: rto.unsold ?? 0,
                soldValue: rto.soldValue ?? 0,
                sellThrough: rto.sellThrough ?? null
              }
            };
          });
          setAgents(mapped);
        } else {
          setAgents([]);
        }
      })
      .catch((err) => {
        console.warn('[TeamPage] Failed to fetch leaderboard:', err.message);
        setAgents([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authToken, isMockData, isRto]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter((a) =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.brn || '').toLowerCase().includes(q)
    );
  }, [agents, searchQuery]);

  // Mini circular SVG meter helper
  const renderMeter = (percentage) => {
    const val = Number(percentage);
    if (isNaN(val) || percentage === null || percentage === undefined) return null;
    const radius = 13;
    const circumference = 2 * Math.PI * radius; // ~81.68
    const dash = (Math.min(100, Math.max(0, val)) / 100) * circumference;
    const color = val >= 90 ? 'var(--cmp-success)' : val >= 70 ? 'var(--cmp-brand)' : 'var(--cmp-warning)';

    return (
      <span
        role="img"
        aria-label={`${val}%`}
        style={{ position: 'relative', display: 'inline-grid', placeItems: 'center', width: '30px', height: '30px' }}
      >
        <svg width="30" height="30" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="15" cy="15" r={radius} fill="none" stroke="var(--cmp-border)" strokeWidth="3.5" />
          <circle
            cx="15"
            cy="15"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
      </span>
    );
  };

  const agentSummaryBasePath = isRto ? '/rto/team/agents' : '/team/agents';

  return (
    <div>
      {/* Title */}
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
          <h1 style={{ fontSize: '26px' }}>
            {isRto ? 'Real Time Offer Leaderboard' : 'Leaderboard'}
          </h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            {isRto
              ? 'Agents ranked by Real Time Offer properties sold, total sold value and active auctions on the desk.'
              : 'Agents climb from Rising to Pro to Elite by answering fast, keeping listings accurate and closing deals.'}
          </p>
        </div>
      </div>

      <section className="card">
        {/* Table Header Controls */}
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            gap: '12px',
            padding: '18px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
              {isRto ? 'Real Time Offer Broker Leaderboard' : 'Broker Leaderboard'}
            </p>
            <p className="faint" style={{ margin: '2px 0 0', fontSize: '13px' }}>
              {isRto
                ? 'Sorted by auctions sold, total sold value and live entries'
                : 'Performance calculated for the previous 30 days'}
              {dataAsOf
                ? ` · Updated ${new Date(dataAsOf).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
            </p>
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={15}
              className="faint"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            />
            <input
              id="agent-search"
              placeholder="Search agents…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ height: '38px', paddingLeft: '34px', width: '100%', fontSize: '13px' }}
            />
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="table-scroll">
          {isRto ? (
            /* REAL TIME OFFER LEADERBOARD TABLE (Section 13.5) */
            <table className="data">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Verified</th>
                  <th>Entered</th>
                  <th>Live</th>
                  <th>Sold</th>
                  <th>Not sold</th>
                  <th>Sell-through</th>
                  <th>Sold value</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--cmp-text-muted)' }}>
                      Loading Real Time Offer leaderboard...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--cmp-text-muted)' }}>
                      No agents found on the leaderboard.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const rto = agent.realTimeOffer || {};
                    return (
                      <tr key={agent.id}>
                        <td style={{ minWidth: '220px' }}>
                          <div className="row" style={{ gap: '10px' }}>
                            <span style={{ position: 'relative', display: 'inline-block', width: '38px', height: '38px', flexShrink: 0 }}>
                              {agent.photo ? (
                                <img
                                  src={agent.photo}
                                  alt={agent.name}
                                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    display: 'grid',
                                    placeItems: 'center',
                                    background: 'var(--cmp-brand-subtle)',
                                    color: 'var(--cmp-brand)',
                                    fontWeight: 700,
                                    fontSize: '13.5px'
                                  }}
                                >
                                  {agent.initials}
                                </span>
                              )}
                            </span>
                            <div>
                              <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                                <NavLink
                                  to={`${agentSummaryBasePath}/${agent.id}`}
                                  style={{
                                    color: 'var(--cmp-brand)',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    textDecoration: 'none'
                                  }}
                                >
                                  {agent.name}
                                </NavLink>
                                {agent.away && (
                                  <span
                                    style={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      background: '#fef3c7',
                                      color: '#92400e',
                                      border: '1px solid #fde68a'
                                    }}
                                  >
                                    Away
                                  </span>
                                )}
                              </div>
                              <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                                {agent.brn ? `BRN# ${agent.brn} · ` : ''}Criteria: {agent.criteriaMet}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {agent.verified ? (
                            <span className="row" style={{ gap: '4px', color: 'var(--cmp-success)', fontSize: '13px', fontWeight: 600 }}>
                              <Check size={14} /> Verified
                            </span>
                          ) : (
                            <span className="row" style={{ gap: '4px', color: 'var(--cmp-text-muted)', fontSize: '13px', fontWeight: 600 }}>
                              <X size={14} /> Unverified
                            </span>
                          )}
                        </td>

                        <td style={{ fontWeight: 600, fontSize: '13.5px' }}>
                          {rto.entered ?? 0}
                        </td>

                        <td>
                          <span style={{ fontWeight: 700, fontSize: '13.5px', color: (rto.live || 0) > 0 ? 'var(--cmp-brand)' : 'inherit' }}>
                            {rto.live ?? 0}
                          </span>
                          {(rto.scheduled || 0) > 0 && (
                            <span className="faint" style={{ display: 'block', fontSize: '11.5px' }}>
                              +{rto.scheduled} scheduled
                            </span>
                          )}
                        </td>

                        <td style={{ fontWeight: 700, fontSize: '13.5px', color: (rto.sold || 0) > 0 ? 'var(--cmp-success)' : 'inherit' }}>
                          {rto.sold ?? 0}
                        </td>

                        <td className="muted" style={{ fontSize: '13.5px' }}>
                          {rto.unsold ?? 0}
                        </td>

                        <td>
                          {rto.sellThrough != null ? (
                            <span className="row" style={{ gap: '8px', fontSize: '13px' }}>
                              {renderMeter(rto.sellThrough)}
                              <strong>{rto.sellThrough}%</strong>
                            </span>
                          ) : (
                            <span className="muted" style={{ fontSize: '13px' }}>—</span>
                          )}
                        </td>

                        <td style={{ fontWeight: 700, fontSize: '13.5px', whiteSpace: 'nowrap' }}>
                          {rto.soldValue != null
                            ? `AED ${Number(rto.soldValue).toLocaleString()}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* LISTINGS LEADERBOARD TABLE (Section 5.5) */
            <table className="data">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Verified</th>
                  <th>Live properties</th>
                  <th>Claimed deals</th>
                  <th>Listing quality</th>
                  <th>Average rating</th>
                  <th>Agent score</th>
                  <th>WhatsApp response</th>
                  <th>Response rate</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--cmp-text-muted)' }}>
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--cmp-text-muted)' }}>
                      No agents found on the leaderboard.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td style={{ minWidth: '220px' }}>
                        <div className="row" style={{ gap: '10px' }}>
                          <span style={{ position: 'relative', display: 'inline-block', width: '38px', height: '38px', flexShrink: 0 }}>
                            {agent.photo ? (
                              <img
                                src={agent.photo}
                                alt={agent.name}
                                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  display: 'grid',
                                  placeItems: 'center',
                                  background: 'var(--cmp-brand-subtle)',
                                  color: 'var(--cmp-brand)',
                                  fontWeight: 700,
                                  fontSize: '13.5px'
                                }}
                              >
                                {agent.initials}
                              </span>
                            )}
                            {agent.isElite && (
                              <span
                                title="Elite agent"
                                style={{
                                  position: 'absolute',
                                  top: '-3px',
                                  right: '-3px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: 'var(--cmp-accent)',
                                  color: '#fff',
                                  display: 'grid',
                                  placeItems: 'center',
                                  border: '2px solid var(--cmp-surface)',
                                  fontSize: '9px',
                                  fontWeight: 800
                                }}
                              >
                                ★
                              </span>
                            )}
                          </span>
                          <div>
                            <div className="row" style={{ gap: '6px', alignItems: 'center' }}>
                              <NavLink
                                to={`${agentSummaryBasePath}/${agent.id}`}
                                style={{
                                  color: 'var(--cmp-brand)',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  textDecoration: 'none'
                                }}
                              >
                                {agent.name}
                              </NavLink>
                              {agent.away && (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    border: '1px solid #fde68a'
                                  }}
                                >
                                  Away
                                </span>
                              )}
                            </div>
                            <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                              {agent.brn ? `BRN# ${agent.brn} · ` : ''}Criteria: {agent.criteriaMet}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {agent.verified ? (
                          <>
                            <span className="row" style={{ gap: '4px', color: 'var(--cmp-success)', fontSize: '13px', fontWeight: 600 }}>
                              <Check size={14} /> Yes
                            </span>
                            <span className="faint" style={{ fontSize: '12px' }}>Verified</span>
                          </>
                        ) : (
                          <>
                            <span className="row" style={{ gap: '4px', color: 'var(--cmp-text-muted)', fontSize: '13px', fontWeight: 600 }}>
                              <X size={14} /> No
                            </span>
                            <span className="faint" style={{ fontSize: '12px' }}>Unverified</span>
                          </>
                        )}
                      </td>

                      <td>
                        <span className="row" style={{ gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                          {agent.liveProperties > 0 ? (
                            <Check size={14} style={{ color: 'var(--cmp-success)' }} />
                          ) : (
                            <X size={14} style={{ color: 'var(--cmp-text-muted)' }} />
                          )}
                          {agent.liveProperties}
                        </span>
                        <span className="faint" style={{ fontSize: '12px' }}>Live properties</span>
                      </td>

                      <td>
                        <span className="row" style={{ gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                          {agent.claimedDeals12m > 0 ? (
                            <Check size={14} style={{ color: 'var(--cmp-success)' }} />
                          ) : (
                            <span style={{ color: 'var(--cmp-text-muted)' }}>—</span>
                          )}
                          {agent.claimedDeals12m}
                        </span>
                        <span className="faint" style={{ fontSize: '12px' }}>Closed deals</span>
                      </td>

                      <td>
                        {agent.listingQuality != null ? (
                          <span className="row" style={{ gap: '8px', fontSize: '13px' }}>
                            {renderMeter(agent.listingQuality)}
                            <strong>{agent.listingQuality}%</strong>
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '13px' }}>N/A</span>
                        )}
                      </td>

                      <td>
                        {agent.avgRating != null ? (
                          <>
                            <span className="row" style={{ gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                              <Check size={14} style={{ color: 'var(--cmp-success)' }} />
                              {agent.avgRating}
                            </span>
                            <span className="faint" style={{ fontSize: '12px' }}>{agent.ratingsCount || 0} ratings</span>
                          </>
                        ) : (
                          <span className="muted" style={{ fontSize: '13px' }}>N/A</span>
                        )}
                      </td>

                      <td>
                        {agent.agentScore != null ? (
                          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)', whiteSpace: 'nowrap' }}>
                            {agent.agentScore}
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '13px' }}>N/A</span>
                        )}
                      </td>

                      <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {agent.waResponseTime ? (
                          <span>{agent.waResponseTime}</span>
                        ) : (
                          <span className="muted">N/A</span>
                        )}
                      </td>

                      <td>
                        {agent.responseRate != null ? (
                          <span className="row" style={{ gap: '8px', fontSize: '13px' }}>
                            {renderMeter(agent.responseRate)}
                            <strong>{agent.responseRate}%</strong>
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '13px' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
