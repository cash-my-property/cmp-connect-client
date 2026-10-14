import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Phone, MessageSquare, Mail, MessageCircle, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LeadInsightsPage() {
  const { isLiveData } = useApp();
  const [period, setPeriod] = useState('7d'); // '7d' | '30d' | '90d'
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'whatsapp' | 'calls' | 'email'
  const [callChartTab, setCallChartTab] = useState('calls'); // 'calls' | 'rate'

  return (
    <div>
      {/* Title & Filter */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px' }}>Enquiry insights</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
            Where your enquiries originate across WhatsApp, phone calls, portal forms and instant chat.
          </p>
        </div>

        <div style={{ width: '180px' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ width: '100%', height: '40px', fontSize: '13px' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Row 1: Source Donut + Over Time Line Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2.2fr)',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* Source Donut Card */}
        <section className="card" style={{ padding: '20px', display: 'grid', gap: '16px', alignContent: 'start' }}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Direct leads source</h2>

          <div style={{ position: 'relative', width: '170px', height: '170px', margin: '0 auto' }}>
            <svg width="170" height="170" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
              <circle cx="85" cy="85" r="74" fill="none" stroke="var(--cmp-surface-sunken)" strokeWidth="22" />
              {!isLiveData && (
                <>
                  {/* WhatsApp: 22 / 43 = 51% */}
                  <circle
                    cx="85"
                    cy="85"
                    r="74"
                    fill="none"
                    stroke="var(--cmp-brand)"
                    strokeWidth="22"
                    strokeDasharray="235.8 464.9"
                    strokeDashoffset="0"
                  />
                  {/* Calls: 9 / 43 = 21% */}
                  <circle
                    cx="85"
                    cy="85"
                    r="74"
                    fill="none"
                    stroke="var(--cmp-accent)"
                    strokeWidth="22"
                    strokeDasharray="95.3 464.9"
                    strokeDashoffset="-237.8"
                  />
                  {/* Email: 7 / 43 = 16% */}
                  <circle
                    cx="85"
                    cy="85"
                    r="74"
                    fill="none"
                    stroke="var(--cmp-info)"
                    strokeWidth="22"
                    strokeDasharray="73.6 464.9"
                    strokeDashoffset="-335.2"
                  />
                  {/* Chat: 5 / 43 = 12% */}
                  <circle
                    cx="85"
                    cy="85"
                    r="74"
                    fill="none"
                    stroke="var(--cmp-warning)"
                    strokeWidth="22"
                    strokeDasharray="52.0 464.9"
                    strokeDashoffset="-410.8"
                  />
                </>
              )}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 800 }}>{isLiveData ? 0 : 43}</span>
              <span className="faint" style={{ fontSize: '12px' }}>Total Leads</span>
            </div>
          </div>

          <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '14px', flexWrap: 'wrap', fontSize: '12.5px' }}>
            <li className="row" style={{ gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
              <span className="muted">WhatsApp</span>
              <strong>{isLiveData ? 0 : 22}</strong>
            </li>
            <li className="row" style={{ gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-accent)' }} />
              <span className="muted">Calls</span>
              <strong>{isLiveData ? 0 : 9}</strong>
            </li>
            <li className="row" style={{ gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-info)' }} />
              <span className="muted">Email</span>
              <strong>{isLiveData ? 0 : 7}</strong>
            </li>
            <li className="row" style={{ gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-warning)' }} />
              <span className="muted">Chat</span>
              <strong>{isLiveData ? 0 : 5}</strong>
            </li>
          </ul>

          <NavLink to="/clients" style={{ color: 'var(--cmp-brand)', fontWeight: 600, fontSize: '13.5px' }}>
            View all client enquiries →
          </NavLink>
        </section>

        {/* Over Time Line Chart Card */}
        <section className="card" style={{ padding: '20px' }}>
          <div className="row" style={{ justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', margin: 0 }}>Direct leads over time</h2>

            <div className="row" style={{ border: '1px solid var(--cmp-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                className="chip"
                style={{
                  borderRadius: 0,
                  border: 'none',
                  background: channelFilter === 'all' ? 'var(--cmp-brand-subtle)' : 'transparent',
                  color: channelFilter === 'all' ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                  fontWeight: channelFilter === 'all' ? 700 : 500
                }}
                onClick={() => setChannelFilter('all')}
              >
                All leads
              </button>
              <button
                type="button"
                className="chip"
                style={{
                  borderRadius: 0,
                  border: 'none',
                  background: channelFilter === 'whatsapp' ? 'var(--cmp-brand-subtle)' : 'transparent',
                  color: channelFilter === 'whatsapp' ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                  fontWeight: channelFilter === 'whatsapp' ? 700 : 500
                }}
                onClick={() => setChannelFilter('whatsapp')}
              >
                WhatsApp
              </button>
              <button
                type="button"
                className="chip"
                style={{
                  borderRadius: 0,
                  border: 'none',
                  background: channelFilter === 'calls' ? 'var(--cmp-brand-subtle)' : 'transparent',
                  color: channelFilter === 'calls' ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                  fontWeight: channelFilter === 'calls' ? 700 : 500
                }}
                onClick={() => setChannelFilter('calls')}
              >
                Calls
              </button>
              <button
                type="button"
                className="chip"
                style={{
                  borderRadius: 0,
                  border: 'none',
                  background: channelFilter === 'email' ? 'var(--cmp-brand-subtle)' : 'transparent',
                  color: channelFilter === 'email' ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                  fontWeight: channelFilter === 'email' ? 700 : 500
                }}
                onClick={() => setChannelFilter('email')}
              >
                Email
              </button>
            </div>
          </div>

          {isLiveData ? (
            <div
              style={{
                height: '240px',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                background: 'var(--cmp-surface-sunken)',
                borderRadius: 'var(--cmp-radius-md)',
                border: '1px dashed var(--cmp-border)',
                padding: '16px'
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>No enquiry trends recorded</p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>Direct leads across all channels over time will be charted here.</p>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 760 240" width="100%" role="img" aria-label="Leads chart">
                <g>
                  <line x1="48" x2="744" y1="210" y2="210" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="214" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
                </g>
                <g>
                  <line x1="48" x2="744" y1="112" y2="112" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="116" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">5</text>
                </g>
                <g>
                  <line x1="48" x2="744" y1="14" y2="14" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="18" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">10</text>
                </g>

                <text x="48" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">11 Sep</text>
                <text x="164" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">12 Sep</text>
                <text x="280" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">13 Sep</text>
                <text x="396" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">14 Sep</text>
                <text x="512" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">15 Sep</text>
                <text x="628" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">16 Sep</text>
                <text x="744" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">17 Sep</text>

                <g>
                  <path
                    d="M48,170.8 L164,131.6 L280,72.8 L396,33.6 L512,72.8 L628,53.2 L744,92.4 L744,210 L48,210 Z"
                    fill="var(--cmp-brand)"
                    opacity="0.12"
                  />
                  <path
                    d="M48,170.8 L164,131.6 L280,72.8 L396,33.6 L512,72.8 L628,53.2 L744,92.4"
                    fill="none"
                    stroke="var(--cmp-brand)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle cx="744" cy="92.4" r="5" fill="var(--cmp-brand)" stroke="var(--cmp-surface)" strokeWidth="2" />
                </g>
              </svg>
            </div>
          )}
        </section>
      </div>

      {/* Row 2: Call Insights */}
      <h2 style={{ fontSize: '18px', margin: '28px 0 14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span aria-hidden="true" style={{ width: '4px', height: '18px', borderRadius: '2px', background: 'var(--cmp-accent)' }} />
        Call insights
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2.2fr)',
          gap: '16px'
        }}
      >
        <section className="card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignContent: 'start' }}>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Total calls</p>
            <p style={{ margin: '6px 0 0', fontSize: '30px', fontWeight: 800 }}>{isLiveData ? 0 : 9}</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: isLiveData ? 'var(--cmp-text-faint)' : 'var(--cmp-danger)' }}>
              {isLiveData ? 'No earlier period' : '↓ 10% vs prev 7 days'}
            </p>
          </div>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: '13px' }}>Answering rate</p>
            <p style={{ margin: '6px 0 0', fontSize: '30px', fontWeight: 800 }}>{isLiveData ? '—' : '100%'}</p>
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              {isLiveData ? 'No calls recorded' : '+10 points'}
            </p>
          </div>
        </section>

        <section className="card" style={{ padding: '20px' }}>
          <div className="row" role="tablist" style={{ gap: '16px', marginBottom: '14px' }}>
            <button
              type="button"
              role="tab"
              aria-selected={callChartTab === 'calls'}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px 2px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '14px',
                fontWeight: callChartTab === 'calls' ? 700 : 500,
                color: callChartTab === 'calls' ? 'var(--cmp-text)' : 'var(--cmp-text-muted)',
                borderBottom: callChartTab === 'calls' ? '2px solid var(--cmp-accent)' : '2px solid transparent'
              }}
              onClick={() => setCallChartTab('calls')}
            >
              Total calls
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={callChartTab === 'rate'}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '4px 2px',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '14px',
                fontWeight: callChartTab === 'rate' ? 700 : 500,
                color: callChartTab === 'rate' ? 'var(--cmp-text)' : 'var(--cmp-text-muted)',
                borderBottom: callChartTab === 'rate' ? '2px solid var(--cmp-accent)' : '2px solid transparent'
              }}
              onClick={() => setCallChartTab('rate')}
            >
              Answering rate
            </button>
          </div>

          {isLiveData ? (
            <div
              style={{
                height: '220px',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                background: 'var(--cmp-surface-sunken)',
                borderRadius: 'var(--cmp-radius-md)',
                border: '1px dashed var(--cmp-border)',
                padding: '16px'
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>No call activity recorded</p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>Call volume and answering rates will appear here once calls are tracked.</p>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 760 220" width="100%" role="img" aria-label="Calls trend">
                <g>
                  <line x1="48" x2="744" y1="190" y2="190" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="194" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
                </g>
                <g>
                  <line x1="48" x2="744" y1="102" y2="102" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="106" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">1</text>
                </g>
                <g>
                  <line x1="48" x2="744" y1="14" y2="14" stroke="var(--cmp-border)" strokeWidth="1" />
                  <text x="40" y="18" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">2</text>
                </g>

                <text x="48" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">11 Sep</text>
                <text x="164" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">12 Sep</text>
                <text x="280" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">13 Sep</text>
                <text x="396" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">14 Sep</text>
                <text x="512" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">15 Sep</text>
                <text x="628" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">16 Sep</text>
                <text x="744" y="212" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">17 Sep</text>

                <g>
                  <path
                    d="M48,190 L164,190 L280,102 L396,14 L512,14 L628,14 L744,14 L744,190 L48,190 Z"
                    fill="var(--cmp-accent)"
                    opacity="0.12"
                  />
                  <path
                    d="M48,190 L164,190 L280,102 L396,14 L512,14 L628,14 L744,14"
                    fill="none"
                    stroke="var(--cmp-accent)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle cx="744" cy="14" r="5" fill="var(--cmp-accent)" stroke="var(--cmp-surface)" strokeWidth="2" />
                </g>
              </svg>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
