import React, { useState, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Chip,
  Dropdown
} from '../../components/ui';
import { formatNumber } from '../../utils';
import {
  ShieldAlert,
  X,
  TrendingUp,
  ChevronDown
} from 'lucide-react';

// Daily data for 30 days (19 Aug to 17 Sep)
const DAILY_DATA = [
  { day: '17 Sep', views: 564, leads: 9 },
  { day: '16 Sep', views: 586, leads: 10 },
  { day: '15 Sep', views: 607, leads: 12 },
  { day: '14 Sep', views: 624, leads: 13 },
  { day: '13 Sep', views: 635, leads: 13 },
  { day: '12 Sep', views: 758, leads: 15 },
  { day: '11 Sep', views: 752, leads: 14 },
  { day: '10 Sep', views: 616, leads: 11 },
  { day: '9 Sep', views: 592, leads: 9 },
  { day: '8 Sep', views: 562, leads: 8 },
  { day: '7 Sep', views: 528, leads: 7 },
  { day: '6 Sep', views: 494, leads: 7 },
  { day: '5 Sep', views: 583, leads: 9 },
  { day: '4 Sep', views: 557, leads: 9 },
  { day: '3 Sep', views: 418, leads: 8 },
  { day: '2 Sep', views: 409, leads: 9 },
  { day: '1 Sep', views: 409, leads: 9 },
  { day: '31 Aug', views: 418, leads: 9 },
  { day: '30 Aug', views: 433, leads: 9 },
  { day: '29 Aug', views: 574, leads: 10 },
  { day: '28 Aug', views: 596, leads: 10 },
  { day: '27 Aug', views: 497, leads: 7 },
  { day: '26 Aug', views: 513, leads: 7 },
  { day: '25 Aug', views: 523, leads: 7 },
  { day: '24 Aug', views: 525, leads: 7 },
  { day: '23 Aug', views: 517, leads: 8 },
  { day: '22 Aug', views: 620, leads: 11 },
  { day: '21 Aug', views: 595, leads: 11 },
  { day: '20 Aug', views: 444, leads: 9 },
  { day: '19 Aug', views: 410, leads: 9 }
];

const KPI_TABS = [
  { key: 'credits', label: 'Credits spent', value: '4,266', desc: 'The credits used on publishing and upgrading your listings in the selected period and filters.' },
  { key: 'published', label: 'Published listings', value: '24', desc: 'Total listings marketed on Cash My Property across the chosen dates.' },
  { key: 'live', label: 'Live listings', value: '4', desc: 'Active listings currently visible to buyers and tenants in search results.' },
  { key: 'impressions', label: 'Impressions', value: '305,175', desc: 'Times your property cards appeared on search, category and map results.' },
  { key: 'clicks', label: 'Listing clicks', value: '18,611', desc: 'Detailed views where a prospective client clicked into your property page.' },
  { key: 'leads', label: 'Leads', value: '1,809', desc: 'Direct enquiries received via Phone, WhatsApp, Email, Chat and Booking requests.' },
  { key: 'leads_per_listing', label: 'Leads per listing', value: '452.3', desc: 'Average conversion volume generated per published property.' }
];

const COMMUNITIES_DATA = [
  { name: 'Dubai Marina', live: '1 live of 1', views: '4,120', leads: 63, share: '40%', per100: '1.5', avgSqft: 'AED 2,007', pctWidth: 100 },
  { name: 'Downtown Dubai', live: '1 live of 1', views: '2,890', leads: 41, share: '26%', per100: '1.4', avgSqft: 'AED 2,500', pctWidth: 65.1 },
  { name: 'Palm Jumeirah', live: '1 live of 1', views: '6,340', leads: 28, share: '18%', per100: '0.4', avgSqft: 'AED 3,152', pctWidth: 44.4 },
  { name: 'Dubai Hills Estate', live: '1 live of 1', views: '1,740', leads: 22, share: '14%', per100: '1.3', avgSqft: 'AED 2,024', pctWidth: 34.9 },
  { name: 'Jumeirah Village Circle', live: '0 live of 1', views: '210', leads: 3, share: '2%', per100: '1.4', avgSqft: 'AED 1,511', pctWidth: 4.8 },
  { name: 'Arabian Ranches', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: 'AED 1,712', pctWidth: 0 },
  { name: 'Business Bay', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: '—', pctWidth: 0 },
  { name: 'Jumeirah Lake Towers', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: '—', pctWidth: 0 }
];

const RANKED_LISTINGS = [
  { title: 'Full marina view 2 bed in Marina Gate', ref: 'CMP-S-001001', location: 'Dubai Marina', views: '4,120', leads: 63, per100: '1.5', quality: 94 },
  { title: 'Burj Khalifa facing one bed in The Address', ref: 'CMP-S-001002', location: 'Downtown Dubai', views: '2,890', leads: 41, per100: '1.4', quality: 88 },
  { title: 'Duplex penthouse on the Palm', ref: 'CMP-S-001004', location: 'Palm Jumeirah', views: '6,340', leads: 28, per100: '0.4', quality: 97 },
  { title: 'Three bed townhouse near the park', ref: 'CMP-S-001005', location: 'Dubai Hills Estate', views: '1,740', leads: 22, per100: '1.3', quality: 81 }
];

export default function PerformancePage() {
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState('credits');
  const [dateRangeChip, setDateRangeChip] = useState('Last 30 days');

  // Dropdown filter states
  const [agentFilter, setAgentFilter] = useState('All agents');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('Property type');
  const [offeringFilter, setOfferingFilter] = useState('Rent and Sale');
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [periodFilter, setPeriodFilter] = useState('Last 30 days');

  const activeTabMeta = useMemo(() => {
    return KPI_TABS.find((t) => t.key === selectedKpi) || KPI_TABS[0];
  }, [selectedKpi]);

  return (
    <div>
      {/* Stay Safe Security Banner */}
      {showSecurityBanner && (
        <div
          role="note"
          className="row"
          style={{
            gap: '12px',
            padding: '12px 16px',
            marginBottom: '18px',
            borderRadius: 'var(--cmp-radius-lg)',
            background: 'var(--cmp-accent-subtle)',
            border: '1px solid var(--cmp-accent-border)',
            fontSize: '14px'
          }}
        >
          <ShieldAlert size={20} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />
          <span style={{ flex: '1 1 0%' }}>
            <strong>Stay safe:</strong> Cash My Property will never ask for your password or a one-time code by phone, email or WhatsApp.{' '}
            <NavLink to="/account/security" style={{ fontWeight: 600, textDecoration: 'underline' }}>
              Review your security
            </NavLink>
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-label="Dismiss"
            onClick={() => setShowSecurityBanner(false)}
            style={{ padding: '4px', height: '32px', width: '32px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Portfolio Health Hero matching insights.html */}
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
              strokeDasharray="158.52 273.32"
            />
          </svg>
          <span style={{ position: 'absolute', fontSize: '23.04px', fontWeight: 700 }}>58</span>
        </span>

        <div style={{ flex: '1 1 260px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgb(224, 163, 108)'
            }}
          >
            Portfolio health
          </p>
          <h2 style={{ fontSize: '22px', color: '#FFFFFF', margin: '4px 0 6px' }}>
            A few fixes will lift your results
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgb(201, 216, 207)' }}>
            Biggest win:{' '}
            <NavLink to="/properties" style={{ color: '#FFFFFF', fontWeight: 700 }}>
              auto renew on
            </NavLink>{' '}
            is only at 38% of your properties.
          </p>
        </div>

        <ul className="health-bars">
          <li>
            <span>Quality score 80+</span>
            <strong>50%</strong>
            <span className="health-track" aria-hidden="true">
              <span style={{ width: '50%' }} />
            </span>
          </li>
          <li>
            <span>Valid DLD permit</span>
            <strong>50%</strong>
            <span className="health-track" aria-hidden="true">
              <span style={{ width: '50%' }} />
            </span>
          </li>
          <li>
            <span>Form F</span>
            <strong>75%</strong>
            <span className="health-track" aria-hidden="true">
              <span style={{ width: '75%' }} />
            </span>
          </li>
          <li>
            <span>10+ photos</span>
            <strong>75%</strong>
            <span className="health-track" aria-hidden="true">
              <span style={{ width: '75%' }} />
            </span>
          </li>
          <li>
            <span>Auto renew on</span>
            <strong>38%</strong>
            <span className="health-track" aria-hidden="true">
              <span style={{ width: '38%' }} />
            </span>
          </li>
        </ul>
      </section>

      {/* Main Page Title */}
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
          <h1
            style={{
              fontSize: '22px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em'
            }}
          >
            Performance
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            How your properties turn views into enquiries. Pick a figure to chart it.
          </p>
        </div>
      </div>

      {/* Filter Row Grid matching insights.html */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <Dropdown
          label={agentFilter}
          options={[
            { label: 'All agents', value: 'All agents' },
            { label: 'Layla Haddad', value: 'Layla Haddad' },
            { label: 'Karim Saleh', value: 'Karim Saleh' },
            { label: 'Emma Clarke', value: 'Emma Clarke' },
            { label: 'Arjun Mehta', value: 'Arjun Mehta' }
          ]}
          selectedValue={agentFilter}
          onSelect={setAgentFilter}
          width="100%"
        />

        <Dropdown
          label={propertyTypeFilter}
          options={[
            { label: 'Property type', value: 'Property type' },
            { label: 'Apartment', value: 'Apartment' },
            { label: 'Villa', value: 'Villa' },
            { label: 'Townhouse', value: 'Townhouse' },
            { label: 'Office', value: 'Office' }
          ]}
          selectedValue={propertyTypeFilter}
          onSelect={setPropertyTypeFilter}
          width="100%"
        />

        <Dropdown
          label={offeringFilter}
          options={[
            { label: 'Rent and Sale', value: 'Rent and Sale' },
            { label: 'Rent only', value: 'Rent only' },
            { label: 'Sale only', value: 'Sale only' }
          ]}
          selectedValue={offeringFilter}
          onSelect={setOfferingFilter}
          width="100%"
        />

        <Dropdown
          label={locationFilter}
          options={[
            { label: 'All locations', value: 'All locations' },
            { label: 'Dubai Marina', value: 'Dubai Marina' },
            { label: 'Downtown Dubai', value: 'Downtown Dubai' },
            { label: 'Palm Jumeirah', value: 'Palm Jumeirah' },
            { label: 'Dubai Hills Estate', value: 'Dubai Hills Estate' }
          ]}
          selectedValue={locationFilter}
          onSelect={setLocationFilter}
          width="100%"
        />

        <Dropdown
          label={periodFilter}
          options={[
            { label: 'Last 7 days', value: 'Last 7 days' },
            { label: 'Last 14 days', value: 'Last 14 days' },
            { label: 'Last 30 days', value: 'Last 30 days' },
            { label: 'Last 90 days', value: 'Last 90 days' }
          ]}
          selectedValue={periodFilter}
          onSelect={setPeriodFilter}
          width="100%"
        />
      </div>

      {/* Primary KPI & Interactive Chart Section */}
      <section className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        {/* Figure Tabs Grid */}
        <div
          role="tablist"
          aria-label="Performance figures"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '10px'
          }}
        >
          {KPI_TABS.map((tab) => {
            const isSelected = selectedKpi === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className="card"
                onClick={() => setSelectedKpi(tab.key)}
                style={{
                  padding: '12px 14px',
                  textAlign: 'start',
                  cursor: 'pointer',
                  font: 'inherit',
                  borderColor: isSelected ? 'var(--cmp-brand)' : 'var(--cmp-border)',
                  background: isSelected ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)',
                  transition: 'border-color 0.15s'
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '22px',
                    fontWeight: 800,
                    color: isSelected ? 'var(--cmp-brand)' : 'var(--cmp-text)'
                  }}
                >
                  {tab.value}
                </span>
                <span className="muted" style={{ fontSize: '12px' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Metric Details */}
        <h3 style={{ fontSize: '15px', margin: '20px 0 4px' }}>
          {activeTabMeta.label}
        </h3>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: '14px' }}>
          {activeTabMeta.desc}
        </p>

        {/* Trend Polyline Chart & Package Breakdown */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 3fr) minmax(200px, 1fr)',
            gap: '20px',
            alignItems: 'end'
          }}
        >
          {/* Main SVG Trend Chart */}
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 760 240" width="100%" role="img" aria-label={activeTabMeta.label}>
              {/* Horizontal grid lines */}
              <g>
                <line x1="48" x2="744" y1="210" y2="210" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="40" y="214" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
              </g>
              <g>
                <line x1="48" x2="744" y1="144.6" y2="144.6" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="40" y="148.6" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">200</text>
              </g>
              <g>
                <line x1="48" x2="744" y1="79.3" y2="79.3" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="40" y="83.3" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">400</text>
              </g>
              <g>
                <line x1="48" x2="744" y1="14" y2="14" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="40" y="18" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">600</text>
              </g>

              {/* Date ticks */}
              <text x="48" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">19 Aug</text>
              <text x="168" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">24 Aug</text>
              <text x="288" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">29 Aug</text>
              <text x="408" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">3 Sep</text>
              <text x="528" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">8 Sep</text>
              <text x="648" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">13 Sep</text>
              <text x="744" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">17 Sep</text>

              {/* Dynamic Trend Polyline */}
              <g>
                <path
                  d="M48,46.99 L72,180.92 L96,177.00 L120,169.16 L144,179.94 L168,86.52 L192,173.74 L216,180.6 L240,184.19 L264,163.61 L288,188.76 L312,182.88 L336,179.62 L360,170.8 L384,170.47 L408,160.01 L432,172.43 L456,175.04 L480,181.25 L504,120.82 L528,174.06 L552,181.58 L576,172.43 L600,176.68 L624,183.21 L648,178.96 L672,89.46 L696,149.56 L720,179.62 L744,176.02"
                  fill="none"
                  stroke="var(--cmp-accent)"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx="744"
                  cy="176.02"
                  r="4"
                  fill="var(--cmp-accent)"
                  stroke="var(--cmp-surface)"
                  strokeWidth="2"
                />
              </g>
            </svg>
          </div>

          {/* Listing Tier Spend Breakdown */}
          <div style={{ display: 'grid', gap: '10px' }}>
            <div
              className="row"
              role="img"
              aria-label="Standard 2,170, Featured 1,246, Premium 850"
              style={{
                alignItems: 'flex-end',
                gap: '14px',
                height: '200px',
                paddingTop: '20px',
                borderBottom: '1px solid var(--cmp-border)'
              }}
            >
              <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>2,170</span>
                <span title="Standard: 2,170" style={{ width: 'min(28px, 70%)', height: '160px', background: 'var(--cmp-text-faint)', borderRadius: '4px 4px 0 0' }} />
              </div>
              <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>1,246</span>
                <span title="Featured: 1,246" style={{ width: 'min(28px, 70%)', height: '91.8px', background: 'var(--cmp-brand)', borderRadius: '4px 4px 0 0' }} />
              </div>
              <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>850</span>
                <span title="Premium: 850" style={{ width: 'min(28px, 70%)', height: '62.6px', background: 'var(--cmp-accent)', borderRadius: '4px 4px 0 0' }} />
              </div>
            </div>

            <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '14px', flexWrap: 'wrap', fontSize: '12px' }}>
              <li className="row" style={{ gap: '6px' }}>
                <span aria-hidden="true" style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-text-faint)' }} />
                <span className="muted">Standard</span>
              </li>
              <li className="row" style={{ gap: '6px' }}>
                <span aria-hidden="true" style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
                <span className="muted">Featured</span>
              </li>
              <li className="row" style={{ gap: '6px' }}>
                <span aria-hidden="true" style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cmp-accent)' }} />
                <span className="muted">Premium</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Views, leads and locations */}
      <h2 style={{ fontSize: '18px', margin: '32px 0 6px' }}>
        Views, leads and locations
      </h2>
      <p className="muted" style={{ margin: '0 0 16px', fontSize: '14px' }}>
        Daily views and leads for live stock, where leads come from, and how each community performs.
      </p>

      {/* Range Filter Chips */}
      <div
        className="row"
        role="group"
        aria-label="Date range"
        style={{ gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}
      >
        {['Last 7 days', 'Last 14 days', 'Last 30 days'].map((range) => (
          <Chip
            key={range}
            label={range}
            active={dateRangeChip === range}
            onClick={() => setDateRangeChip(range)}
          />
        ))}
      </div>

      {/* Stat Grid */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Listing views
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            16,359
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            No earlier period to compare
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leads
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            286
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            No earlier period to compare
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leads per 100 views
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            1.7
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            No earlier period to compare
          </p>
        </div>
      </div>

      {/* Side-by-side Daily Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}
      >
        {/* Views per day Column Chart */}
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px' }}>Views per day</h2>
          <p className="faint" style={{ margin: '4px 0 12px', fontSize: '12px' }}>
            Every time a listing page was opened
          </p>
          <div style={{ position: 'relative' }}>
            <svg
              width="100%"
              height="210"
              viewBox="0 0 596 210"
              role="group"
              aria-label="Listing views per day"
              style={{ display: 'block' }}
            >
              <g>
                <line x1="44" x2="584" y1="184" y2="184" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="188" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="142.5" y2="142.5" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="146.5" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">250</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="101" y2="101" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="105" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">500</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="59.5" y2="59.5" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="63.5" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">750</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="18" y2="18" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="22" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">1,000</text>
              </g>

              {/* Day Bars */}
              {DAILY_DATA.slice().reverse().map((d, idx) => {
                const x = 45 + idx * 18;
                const barHeight = (d.views / 1000) * 166;
                const y = 184 - barHeight;
                return (
                  <g key={d.day}>
                    <rect
                      x={x}
                      y={y}
                      width="12"
                      height={barHeight}
                      rx="3"
                      fill="var(--cmp-brand)"
                    />
                    {idx % 5 === 4 && (
                      <text x={x + 6} y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">
                        {d.day}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x="485" y="52" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--cmp-text-muted)">
                758
              </text>
            </svg>
          </div>
        </section>

        {/* Leads per day Area Chart */}
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px' }}>Leads per day</h2>
          <p className="faint" style={{ margin: '4px 0 12px', fontSize: '12px' }}>
            Calls, WhatsApp, email, chat and viewing requests
          </p>
          <div style={{ position: 'relative' }}>
            <svg
              width="100%"
              height="210"
              viewBox="0 0 596 210"
              role="group"
              aria-label="Leads per day"
              style={{ display: 'block' }}
            >
              <g>
                <line x1="44" x2="584" y1="184" y2="184" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="188" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="142.5" y2="142.5" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="146.5" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">5</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="101" y2="101" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="105" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">10</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="59.5" y2="59.5" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="63.5" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">15</text>
              </g>
              <g>
                <line x1="44" x2="584" y1="18" y2="18" stroke="var(--cmp-border)" strokeWidth="1" />
                <text x="36" y="22" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">20</text>
              </g>

              {/* Area path */}
              <path
                d="M44,109.3 L81,92.7 L118,117.6 L155,125.9 L192,125.9 L230,101 L267,109.3 L304,109.3 L341,109.3 L379,125.9 L416,117.6 L453,92.7 L472,67.8 L490,59.5 L509,76.1 L546,84.4 L584,109.3 L584,184 L44,184 Z"
                fill="var(--cmp-brand)"
                fillOpacity="0.12"
              />
              <path
                d="M44,109.3 L81,92.7 L118,117.6 L155,125.9 L192,125.9 L230,101 L267,109.3 L304,109.3 L341,109.3 L379,125.9 L416,117.6 L453,92.7 L472,67.8 L490,59.5 L509,76.1 L546,84.4 L584,109.3"
                fill="none"
                stroke="var(--cmp-brand)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Dates */}
              <text x="118" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">23 Aug</text>
              <text x="211" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">28 Aug</text>
              <text x="304" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">2 Sep</text>
              <text x="397" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">7 Sep</text>
              <text x="490" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">12 Sep</text>
              <text x="584" y="202" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">17 Sep</text>

              <circle cx="584" cy="109.3" r="4" fill="var(--cmp-brand)" stroke="var(--cmp-surface)" strokeWidth="2" />
              <text x="576" y="99.3" textAnchor="end" fontSize="11" fontWeight="600" fill="var(--cmp-text-muted)">
                9 today
              </text>
            </svg>
          </div>
        </section>
      </div>

      {/* Daily Data Table Accordion */}
      <details className="card" style={{ padding: '14px 20px', marginTop: '16px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
          View the daily numbers as a table
        </summary>
        <div className="table-scroll" style={{ marginTop: '12px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Day</th>
                <th style={{ textAlign: 'end' }}>Views</th>
                <th style={{ textAlign: 'end' }}>Leads</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_DATA.map((row) => (
                <tr key={row.day}>
                  <td className="muted">{row.day}</td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {formatNumber(row.views)}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {row.leads}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {/* Leads by Channel Card */}
      <section className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px' }}>Leads by channel</h2>
        <p className="faint" style={{ margin: '4px 0 14px', fontSize: '12px' }}>
          How buyers and tenants got in touch
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
          {[
            { channel: 'WhatsApp', count: 116, pct: '41%', width: '100%' },
            { channel: 'Phone call', count: 78, pct: '27%', width: '67.2%' },
            { channel: 'Email', count: 71, pct: '25%', width: '61.2%' },
            { channel: 'Chat', count: 21, pct: '7%', width: '18.1%' }
          ].map((item) => (
            <li
              key={item.channel}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px minmax(0, 1fr)',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--cmp-text-muted)' }}>
                {item.channel}
              </span>
              <span className="row" style={{ gap: '8px', minWidth: 0 }}>
                <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      height: '16px',
                      minWidth: '2px',
                      borderRadius: '0 4px 4px 0',
                      width: item.width,
                      background: 'var(--cmp-brand)'
                    }}
                  />
                </span>
                <span
                  style={{
                    flex: '0 0 76px',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {item.count}{' '}
                  <span className="faint" style={{ fontWeight: 400 }}>
                    · {item.pct}
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Performance by Location Card */}
      <section className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px' }}>Performance by location</h2>
        <p className="faint" style={{ margin: '4px 0 12px', fontSize: '12px' }}>
          Your listings grouped by community, always the last 30 days
        </p>
        <p className="muted" style={{ margin: '0 0 16px', fontSize: '14px' }}>
          Palm Jumeirah draws the most views (6,340). Dubai Marina brings in the most leads (63). Dubai Marina turns views into leads best, at 1.5 per 100 views.
        </p>

        <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
          Leads by community
        </h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
          {COMMUNITIES_DATA.map((com) => (
            <li
              key={com.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '170px minmax(0, 1fr)',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '13px', color: 'var(--cmp-text-muted)' }}>
                {com.name}
              </span>
              <span className="row" style={{ gap: '8px', minWidth: 0 }}>
                <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      height: '16px',
                      minWidth: com.leads > 0 ? '2px' : 0,
                      borderRadius: '0 4px 4px 0',
                      width: `${com.pctWidth}%`,
                      background: 'var(--cmp-brand)'
                    }}
                  />
                </span>
                <span
                  style={{
                    flex: '0 0 76px',
                    fontSize: '13px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {com.leads}{' '}
                  <span className="faint" style={{ fontWeight: 400 }}>
                    · {com.share}
                  </span>
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="table-scroll" style={{ marginTop: '20px' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Location</th>
                <th style={{ textAlign: 'end' }}>Listings</th>
                <th style={{ textAlign: 'end' }}>Views</th>
                <th style={{ textAlign: 'end' }}>Leads</th>
                <th style={{ textAlign: 'end' }}>Share of leads</th>
                <th style={{ textAlign: 'end' }}>Leads per 100 views</th>
                <th style={{ textAlign: 'end' }}>Avg sale price per sqft</th>
              </tr>
            </thead>
            <tbody>
              {COMMUNITIES_DATA.map((row) => (
                <tr key={row.name}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{row.name}</td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {row.live}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {row.views}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {row.leads}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {row.share}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {row.per100}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {row.avgSqft}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Listings Ranked by Leads Table Card */}
      <section style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>
          Listings ranked by leads
        </h2>
        <p className="faint" style={{ margin: '0 0 12px', fontSize: '12px' }}>
          Always the last 30 days, whatever range is selected above
        </p>
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Listing</th>
                <th style={{ textAlign: 'end' }}>Views</th>
                <th style={{ textAlign: 'end' }}>Leads</th>
                <th style={{ textAlign: 'end' }}>Leads per 100 views</th>
                <th style={{ textAlign: 'end' }}>Quality</th>
              </tr>
            </thead>
            <tbody>
              {RANKED_LISTINGS.map((l) => (
                <tr key={l.ref}>
                  <td style={{ minWidth: '240px' }}>
                    <span style={{ fontWeight: 600 }}>{l.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {l.ref} · {l.location}
                    </span>
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {l.views}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {l.leads}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {l.per100}
                  </td>
                  <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                    {l.quality}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
