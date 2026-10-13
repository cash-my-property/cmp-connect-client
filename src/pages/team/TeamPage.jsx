import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Award, Star, Search, Check, X, Shield, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

export default function TeamPage() {
  const { authToken } = useApp();
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!authToken || hasFetchedRef.current) {
      if (!authToken) setIsLoading(false);
      return;
    }
    hasFetchedRef.current = true;

    cmpConnectApi.listMembers({ limit: 100 }, authToken)
      .then((res) => {
        if (res?.data) {
          const mapped = res.data.map((m) => {
            const name = m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Agent';
            const initials = name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const isVerified = m.verificationStatus === 'VERIFIED';

            return {
              id: m.id || m._id,
              name,
              initials,
              isElite: isVerified,
              criteriaMet: isVerified ? '4/4' : '1/4',
              verified: isVerified,
              liveProperties: 0,
              avgRating: null,
              ratingsCount: 0,
              agentScore: '—',
              waResponseTime: '< 5 mins',
              waScore: '—',
              responseRate: 100,
              responseScore: '—',
              listingQuality: 100,
              qualityScore: '—'
            };
          });
          setAgents(mapped);
        }
      })
      .catch((err) => {
        console.warn('[TeamPage] Failed to fetch members for leaderboard:', err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authToken]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, searchQuery]);

  // Mini circular SVG meter helper
  const renderMeter = (percentage) => {
    const radius = 13;
    const circumference = 2 * Math.PI * radius; // ~81.68
    const dash = (percentage / 100) * circumference;
    const color = percentage >= 90 ? 'var(--cmp-success)' : 'var(--cmp-warning)';

    return (
      <span
        role="img"
        aria-label={`${percentage}%`}
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
          <h1 style={{ fontSize: '26px' }}>Leaderboard</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Agents climb from Rising to Pro to Elite by answering fast, keeping listings accurate and closing deals.
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
              Broker Leaderboard
            </p>
            <p className="faint" style={{ margin: '2px 0 0', fontSize: '13px' }}>
              Performance calculated for the previous 30 days
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
          <table className="data">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Verified</th>
                <th>Live properties</th>
                <th>Average rating</th>
                <th>Agent score</th>
                <th>WhatsApp response time</th>
                <th>Response rate</th>
                <th>Listing quality</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--cmp-text-muted)' }}>
                    Loading leaderboard...
                  </td>
                </tr>
              ) : filteredAgents.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--cmp-text-muted)' }}>
                    No agents found on the leaderboard.
                  </td>
                </tr>
              ) : (
                filteredAgents.map((agent) => (
                <tr key={agent.id}>
                  <td style={{ minWidth: '200px' }}>
                    <div className="row" style={{ gap: '10px' }}>
                      <span style={{ position: 'relative', display: 'inline-block', width: '38px', height: '38px', flexShrink: 0 }}>
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
                        <NavLink
                          to={`/team/agents/${agent.id}`}
                          style={{
                            color: 'var(--cmp-brand)',
                            fontWeight: 700,
                            fontSize: '14px',
                            textDecoration: 'none'
                          }}
                        >
                          {agent.name}
                        </NavLink>
                        <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                          Criteria: {agent.criteriaMet}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="row" style={{ gap: '4px', color: 'var(--cmp-success)', fontSize: '13px', fontWeight: 600 }}>
                      <Check size={14} /> Yes
                    </span>
                    <span className="faint" style={{ fontSize: '12px' }}>Verified</span>
                  </td>

                  <td>
                    <span className="row" style={{ gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                      {agent.liveProperties > 0 ? (
                        <Check size={14} style={{ color: 'var(--cmp-success)' }} />
                      ) : (
                        <X size={14} style={{ color: 'var(--cmp-danger)' }} />
                      )}
                      {agent.liveProperties}
                    </span>
                    <span className="faint" style={{ fontSize: '12px' }}>Live properties</span>
                  </td>

                  <td>
                    {agent.avgRating ? (
                      <>
                        <span className="row" style={{ gap: '4px', fontSize: '13px', fontWeight: 600 }}>
                          <Check size={14} style={{ color: 'var(--cmp-success)' }} />
                          {agent.avgRating}
                        </span>
                        <span className="faint" style={{ fontSize: '12px' }}>{agent.ratingsCount} ratings</span>
                      </>
                    ) : (
                      <span className="muted" style={{ fontSize: '13px' }}>N/A</span>
                    )}
                  </td>

                  <td>
                    <span className="row" style={{ gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)', whiteSpace: 'nowrap' }}>
                        {agent.agentScore}
                      </span>
                    </span>
                    <span className="faint" style={{ fontSize: '12px' }}>Agent score</span>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {agent.waResponseTime}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)', whiteSpace: 'nowrap' }}>
                      {agent.waScore}
                    </span>
                  </td>

                  <td>
                    <span className="row" style={{ gap: '8px', fontSize: '13px' }}>
                      {renderMeter(agent.responseRate)}
                      <strong>{agent.responseRate}%</strong>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)' }}>
                        {agent.responseScore}
                      </span>
                    </span>
                  </td>

                  <td>
                    <span className="row" style={{ gap: '8px', fontSize: '13px' }}>
                      {renderMeter(agent.listingQuality)}
                      <strong>{agent.listingQuality}%</strong>
                      <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-brand)' }}>
                        {agent.qualityScore}
                      </span>
                    </span>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
