import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TrendingUp, Users, Eye, Coins, Sparkles, ArrowRight } from 'lucide-react';

export default function PerformancePage() {
  const [selectedMetric, setSelectedMetric] = useState('credits');
  const [dateRange, setDateRange] = useState('30');

  const metrics = [
    { key: 'credits', label: 'Credits spent', value: '4,266', unit: '' },
    { key: 'published', label: 'Published listings', value: '24', unit: '' },
    { key: 'live', label: 'Live listings', value: '4', unit: '' },
    { key: 'impressions', label: 'Impressions', value: '305,175', unit: '' },
    { key: 'clicks', label: 'Listing clicks', value: '18,611', unit: '' },
    { key: 'leads', label: 'Leads', value: '1,809', unit: '' }
  ];

  return (
    <div>
      {/* Portfolio Health Hero Banner */}
      <section className="health-hero">
        <span
          role="img"
          aria-label="58%"
          style={{
            position: 'relative',
            display: 'inline-grid',
            placeItems: 'center',
            width: '96px',
            height: '96px',
            flexShrink: 0
          }}
        >
          <svg width="96" height="96" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="48" cy="48" r="43.5" fill="none" stroke="var(--cmp-border)" strokeWidth="9" />
            <circle
              cx="48"
              cy="48"
              r="43.5"
              fill="none"
              stroke="#E0A36C"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray="158.52 273.31"
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '23px', fontWeight: 800 }}>58%</span>
        </span>

        <div style={{ flex: '1 1 260px' }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#E0A36C' }}>
            Portfolio health
          </p>
          <h2 style={{ fontSize: '22px', color: '#FFFFFF', margin: '4px 0 6px' }}>
            A few fixes will lift your portal rankings
          </h2>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#C9D8CF' }}>
            Biggest win: auto renew is only enabled on 38% of your properties.
          </p>
        </div>

        <ul className="health-bars">
          <li>
            <span>Quality score 80+</span>
            <strong>50%</strong>
            <span className="health-track"><span style={{ width: '50%' }} /></span>
          </li>
          <li>
            <span>Valid DLD permit</span>
            <strong>75%</strong>
            <span className="health-track"><span style={{ width: '75%' }} /></span>
          </li>
          <li>
            <span>10+ photos uploaded</span>
            <strong>75%</strong>
            <span className="health-track"><span style={{ width: '75%' }} /></span>
          </li>
          <li>
            <span>Auto renew enabled</span>
            <strong>38%</strong>
            <span className="health-track"><span style={{ width: '38%' }} /></span>
          </li>
        </ul>
      </section>

      {/* Analytics Tabs */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              className="card"
              onClick={() => setSelectedMetric(m.key)}
              style={{
                padding: '12px 14px',
                textAlign: 'start',
                cursor: 'pointer',
                border: selectedMetric === m.key ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                background: selectedMetric === m.key ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '22px',
                  fontWeight: 800,
                  color: selectedMetric === m.key ? 'var(--cmp-brand)' : 'var(--cmp-text)'
                }}
              >
                {m.value}
              </span>
              <span className="muted" style={{ fontSize: '12px' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* SVG Daily Chart */}
        <h3 style={{ fontSize: '15px', margin: '0 0 6px' }}>Performance Trend over Time</h3>
        <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
          Daily metrics recorded across Cash My Property web & mobile applications.
        </p>

        <div style={{ position: 'relative', height: '200px' }}>
          <svg viewBox="0 0 760 200" width="100%" height="100%" style={{ overflow: 'visible' }}>
            <line x1="40" x2="740" y1="170" y2="170" stroke="var(--cmp-border)" strokeWidth="1" />
            <line x1="40" x2="740" y1="110" y2="110" stroke="var(--cmp-border)" strokeWidth="1" />
            <line x1="40" x2="740" y1="50" y2="50" stroke="var(--cmp-border)" strokeWidth="1" />

            {/* Simulated Trend Polyline */}
            <polyline
              fill="none"
              stroke="var(--cmp-brand)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="40,150 100,140 160,110 220,130 280,80 340,95 400,60 460,75 520,45 580,65 640,40 740,30"
            />
            {/* Dots */}
            {[
              [40, 150], [100, 140], [160, 110], [220, 130],
              [280, 80], [340, 95], [400, 60], [460, 75],
              [520, 45], [580, 65], [640, 40], [740, 30]
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="4" fill="var(--cmp-brand)" stroke="var(--cmp-surface)" strokeWidth="2" />
            ))}
          </svg>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px' }}>Leads by Contact Channel</h2>
          <p className="faint" style={{ margin: '4px 0 16px', fontSize: '12px' }}>
            Preferred communication mediums used by prospective buyers
          </p>

          <div style={{ display: 'grid', gap: '14px' }}>
            {[
              { channel: 'WhatsApp', count: 116, pct: '41%' },
              { channel: 'Phone call', count: 71, pct: '25%' },
              { channel: 'Email', count: 51, pct: '18%' },
              { channel: 'Portal Chat', count: 48, pct: '16%' }
            ].map((c) => (
              <div key={c.channel} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.channel}</span>
                <div style={{ height: '14px', borderRadius: '4px', background: 'var(--cmp-surface-sunken)', overflow: 'hidden' }}>
                  <div style={{ width: c.pct, height: '100%', background: 'var(--cmp-brand)' }} />
                </div>
                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{c.count} ({c.pct})</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px' }}>Top Inquiring Communities</h2>
          <p className="faint" style={{ margin: '4px 0 16px', fontSize: '12px' }}>
            Geographic enquiry density across Dubai
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              { name: 'Dubai Marina', leads: 63, views: '4,120' },
              { name: 'Palm Jumeirah', leads: 48, views: '7,760' },
              { name: 'Downtown Dubai', leads: 41, views: '2,890' },
              { name: 'Dubai Hills Estate', leads: 22, views: '1,740' }
            ].map((com) => (
              <div key={com.name} className="row" style={{ justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: 'var(--cmp-surface-sunken)' }}>
                <strong>{com.name}</strong>
                <span style={{ fontSize: '13px' }}>
                  <strong>{com.leads}</strong> leads · <span className="muted">{com.views} views</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
