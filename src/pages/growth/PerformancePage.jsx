import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Chip,
  Dropdown
} from '../../components/ui';
import { formatNumber } from '../../utils';
import {
  ShieldAlert,
  X,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { cmpConnectApi } from '../../services/cmpConnectApi';

// Mock Daily data for 30 days (19 Aug to 17 Sep)
const MOCK_DAILY_DATA = [
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

const MOCK_KPI_TABS = [
  { key: 'credits', label: 'Credits spent', value: '4,266', desc: 'The credits used on publishing and upgrading your listings in the selected period and filters.' },
  { key: 'published', label: 'Published listings', value: '24', desc: 'Total listings marketed on Cash My Property across the chosen dates.' },
  { key: 'live', label: 'Live listings', value: '4', desc: 'Active listings currently visible to buyers and tenants in search results.' },
  { key: 'impressions', label: 'Impressions', value: '305,175', desc: 'Times your property cards appeared on search, category and map results.' },
  { key: 'clicks', label: 'Listing clicks', value: '18,611', desc: 'Detailed views where a prospective client clicked into your property page.' },
  { key: 'leads', label: 'Leads', value: '1,809', desc: 'Direct enquiries received via Phone, WhatsApp, Email, Chat and Booking requests.' },
  { key: 'leads_per_listing', label: 'Leads per listing', value: '452.3', desc: 'Average conversion volume generated per published property.' }
];

const MOCK_COMMUNITIES = [
  { name: 'Dubai Marina', live: '1 live of 1', views: '4,120', leads: 63, share: '40%', per100: '1.5', avgSqft: 'AED 2,007', pctWidth: 100 },
  { name: 'Downtown Dubai', live: '1 live of 1', views: '2,890', leads: 41, share: '26%', per100: '1.4', avgSqft: 'AED 2,500', pctWidth: 65.1 },
  { name: 'Palm Jumeirah', live: '1 live of 1', views: '6,340', leads: 28, share: '18%', per100: '0.4', avgSqft: 'AED 3,152', pctWidth: 44.4 },
  { name: 'Dubai Hills Estate', live: '1 live of 1', views: '1,740', leads: 22, share: '14%', per100: '1.3', avgSqft: 'AED 2,024', pctWidth: 34.9 },
  { name: 'Jumeirah Village Circle', live: '0 live of 1', views: '210', leads: 3, share: '2%', per100: '1.4', avgSqft: 'AED 1,511', pctWidth: 4.8 },
  { name: 'Arabian Ranches', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: 'AED 1,712', pctWidth: 0 },
  { name: 'Business Bay', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: '—', pctWidth: 0 },
  { name: 'Jumeirah Lake Towers', live: '0 live of 1', views: '0', leads: 0, share: '0%', per100: '—', avgSqft: '—', pctWidth: 0 }
];

const MOCK_RANKED_LISTINGS = [
  { title: 'Full marina view 2 bed in Marina Gate', ref: 'CMP-S-001001', location: 'Dubai Marina', views: '4,120', leads: 63, per100: '1.5', quality: 94 },
  { title: 'Burj Khalifa facing one bed in The Address', ref: 'CMP-S-001002', location: 'Downtown Dubai', views: '2,890', leads: 41, per100: '1.4', quality: 88 },
  { title: 'Duplex penthouse on the Palm', ref: 'CMP-S-001004', location: 'Palm Jumeirah', views: '6,340', leads: 28, per100: '0.4', quality: 97 },
  { title: 'Three bed townhouse near the park', ref: 'CMP-S-001005', location: 'Dubai Hills Estate', views: '1,740', leads: 22, per100: '1.3', quality: 81 }
];

const KPI_DESCRIPTIONS = {
  credits: 'The credits used on publishing and upgrading your listings in the selected period and filters.',
  published: 'Total listings marketed on Cash My Property across the chosen dates.',
  live: 'Active listings currently visible to buyers and tenants in search results.',
  impressions: 'Times your property cards appeared on search, category and map results.',
  clicks: 'Detailed views where a prospective client clicked into your property page.',
  leads: 'Direct enquiries received via Phone, WhatsApp, Email, Chat and Booking requests.',
  leads_per_listing: 'Average conversion volume generated per published property.'
};

function getSeriesValue(point, kpiKey) {
  if (!point) return null;
  switch (kpiKey) {
    case 'credits':
      return point.creditsSpent;
    case 'published':
      return point.published;
    case 'live':
      return point.live;
    case 'impressions':
      return point.impressions;
    case 'clicks':
      return point.clicks;
    case 'leads':
      return point.leads;
    case 'leads_per_listing':
      return point.perListing;
    default:
      return null;
  }
}

export default function PerformancePage() {
  const { isLiveData, authToken } = useApp();
  const [showSecurityBanner, setShowSecurityBanner] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState('published');
  const [dateRangeChip, setDateRangeChip] = useState('Last 30 days');

  // Filter states
  const [agentFilter, setAgentFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [offeringFilter, setOfferingFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('30');

  // Live API States
  const [performanceData, setPerformanceData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Fetch Section 1: Performance figures from GET /api/cmpConnect/insights/performance
  const fetchPerformance = useCallback(async () => {
    if (!isLiveData) return;
    setIsLoadingPerformance(true);
    try {
      const params = {
        agentId: agentFilter || undefined,
        propertyType: propertyTypeFilter || undefined,
        offering: offeringFilter !== 'all' ? offeringFilter : undefined,
        location: locationFilter || undefined,
        range: periodFilter || '30'
      };
      const res = await cmpConnectApi.getInsightsPerformance(params, authToken);
      if (res?.data) {
        setPerformanceData(res.data);
      }
    } catch (err) {
      console.warn('[PerformancePage] Failed to fetch insights performance:', err);
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [isLiveData, authToken, agentFilter, propertyTypeFilter, offeringFilter, locationFilter, periodFilter]);

  // Fetch Section 2: Overview numbers from GET /api/cmpConnect/insights/overview
  const fetchOverview = useCallback(async () => {
    if (!isLiveData) return;
    setIsLoadingOverview(true);
    try {
      const rangeNum = dateRangeChip.includes('7') ? '7' : dateRangeChip.includes('14') ? '14' : '30';
      const res = await cmpConnectApi.getInsightsOverview({ range: rangeNum }, authToken);
      if (res?.data) {
        setOverviewData(res.data);
      }
    } catch (err) {
      console.warn('[PerformancePage] Failed to fetch insights overview:', err);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [isLiveData, authToken, dateRangeChip]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Build dynamic KPI tiles list
  const activeKpis = useMemo(() => {
    if (!isLiveData) return MOCK_KPI_TABS;

    const tiles = performanceData?.tiles || {};
    return [
      {
        key: 'credits',
        label: 'Credits spent',
        value: tiles.credits != null ? formatNumber(tiles.credits) : '—',
        desc: KPI_DESCRIPTIONS.credits
      },
      {
        key: 'published',
        label: 'Published listings',
        value: tiles.published != null ? formatNumber(tiles.published) : '0',
        desc: KPI_DESCRIPTIONS.published
      },
      {
        key: 'live',
        label: 'Live listings',
        value: tiles.live != null ? formatNumber(tiles.live) : '0',
        desc: KPI_DESCRIPTIONS.live
      },
      {
        key: 'impressions',
        label: 'Impressions',
        value: tiles.impressions != null ? formatNumber(tiles.impressions) : '—',
        desc: KPI_DESCRIPTIONS.impressions
      },
      {
        key: 'clicks',
        label: 'Listing clicks',
        value: tiles.clicks != null ? formatNumber(tiles.clicks) : '—',
        desc: KPI_DESCRIPTIONS.clicks
      },
      {
        key: 'leads',
        label: 'Leads',
        value: tiles.leads != null ? formatNumber(tiles.leads) : '—',
        desc: KPI_DESCRIPTIONS.leads
      },
      {
        key: 'leads_per_listing',
        label: 'Leads per listing',
        value: tiles.perListing != null ? tiles.perListing : '—',
        desc: KPI_DESCRIPTIONS.leads_per_listing
      }
    ];
  }, [isLiveData, performanceData]);

  const activeTabMeta = useMemo(() => {
    return activeKpis.find((t) => t.key === selectedKpi) || activeKpis[0];
  }, [selectedKpi, activeKpis]);

  // Resolve Health Data
  const healthData = useMemo(() => {
    if (!isLiveData) {
      return {
        score: 58,
        headline: 'A few fixes will lift your results',
        weakest: { label: 'auto renew on', value: 38, href: '/properties' },
        factors: [
          { label: 'Quality score 80+', value: 50 },
          { label: 'Valid DLD permit', value: 50 },
          { label: 'Form F', value: 75 },
          { label: '10+ photos', value: 75 },
          { label: 'Auto renew on', value: 38 }
        ]
      };
    }

    const h = performanceData?.health;
    const score = h?.score ?? 0;
    const headline = h?.headline || (score > 0 ? 'Good, with room to grow' : 'No active listings to evaluate');
    const weakest = h?.weakest;
    const factors = Array.isArray(h?.factors) && h.factors.length > 0
      ? h.factors
      : [
          { label: 'Quality score 80+', value: null },
          { label: 'Valid DLD permit', value: null },
          { label: 'Form F', value: null },
          { label: '10+ photos', value: null },
          { label: 'Auto renew on', value: null }
        ];

    return { score, headline, weakest, factors };
  }, [isLiveData, performanceData]);

  // Check if series has numeric data for the currently selected KPI
  const seriesList = useMemo(() => {
    if (!isLiveData) return [];
    return performanceData?.series || [];
  }, [isLiveData, performanceData]);

  const seriesHasValues = useMemo(() => {
    if (!isLiveData) return true;
    return seriesList.some((pt) => {
      const v = getSeriesValue(pt, selectedKpi);
      return v !== null && v !== undefined && v > 0;
    });
  }, [isLiveData, seriesList, selectedKpi]);

  // Generate dynamic SVG polyline for the series
  const chartSvgData = useMemo(() => {
    if (!seriesList.length) return null;

    const values = seriesList.map((pt) => Number(getSeriesValue(pt, selectedKpi)) || 0);
    const maxVal = Math.max(...values, 5);
    const minVal = 0;
    const plotXMin = 48;
    const plotXMax = 744;
    const plotYMin = 20;
    const plotYMax = 210;

    const points = seriesList.map((pt, i) => {
      const val = Number(getSeriesValue(pt, selectedKpi)) || 0;
      const x = plotXMin + (i / Math.max(seriesList.length - 1, 1)) * (plotXMax - plotXMin);
      const y = plotYMax - ((val - minVal) / (maxVal - minVal)) * (plotYMax - plotYMin);
      return { x, y, label: pt.label || pt.date, val };
    });

    const dStr = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const lastPoint = points[points.length - 1];

    return { points, dStr, lastPoint, maxVal };
  }, [seriesList, selectedKpi]);

  // Filter options from API
  const filterOptions = performanceData?.filterOptions;

  const agentDropdownOptions = useMemo(() => {
    if (!isLiveData) {
      return [
        { label: 'All agents', value: '' },
        { label: 'Layla Haddad', value: 'Layla Haddad' },
        { label: 'Karim Saleh', value: 'Karim Saleh' },
        { label: 'Emma Clarke', value: 'Emma Clarke' },
        { label: 'Arjun Mehta', value: 'Arjun Mehta' }
      ];
    }
    const apiAgents = filterOptions?.agents || [];
    return [
      { label: 'All agents', value: '' },
      ...apiAgents.map((a) => ({ label: a.label || a.name || 'Agent', value: a.value || a.id }))
    ];
  }, [isLiveData, filterOptions]);

  const propertyTypeDropdownOptions = useMemo(() => {
    if (!isLiveData) {
      return [
        { label: 'All property types', value: '' },
        { label: 'Apartment', value: 'APARTMENT' },
        { label: 'Villa', value: 'VILLA' },
        { label: 'Townhouse', value: 'TOWNHOUSE' },
        { label: 'Office', value: 'OFFICE' }
      ];
    }
    const apiTypes = filterOptions?.propertyTypes || [];
    return [
      { label: 'All property types', value: '' },
      ...apiTypes.map((t) => ({ label: t.label || t.name, value: t.value || t.key }))
    ];
  }, [isLiveData, filterOptions]);

  const locationDropdownOptions = useMemo(() => {
    if (!isLiveData) {
      return [
        { label: 'All locations', value: '' },
        { label: 'Dubai Marina', value: 'Dubai Marina' },
        { label: 'Downtown Dubai', value: 'Downtown Dubai' },
        { label: 'Palm Jumeirah', value: 'Palm Jumeirah' },
        { label: 'Dubai Hills Estate', value: 'Dubai Hills Estate' }
      ];
    }
    const apiLocs = filterOptions?.locations || [];
    return [
      { label: 'All locations', value: '' },
      ...apiLocs.map((loc) => ({ label: loc, value: loc }))
    ];
  }, [isLiveData, filterOptions]);

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
          aria-label={`${healthData.score}%`}
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
            {healthData.score > 0 && (
              <circle
                cx="48"
                cy="48"
                r="43.5"
                fill="none"
                stroke="#E0A36C"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(healthData.score / 100) * 273.32} 273.32`}
              />
            )}
          </svg>
          <span style={{ position: 'absolute', fontSize: '23.04px', fontWeight: 700 }}>
            {healthData.score}
          </span>
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
            {healthData.headline}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgb(201, 216, 207)' }}>
            {healthData.weakest ? (
              <>
                Biggest win:{' '}
                <NavLink to={healthData.weakest.href || '/properties'} style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  {healthData.weakest.label}
                </NavLink>{' '}
                is only at {healthData.weakest.value != null ? `${healthData.weakest.value}%` : 'N/A'}.
              </>
            ) : (
              <>
                Manage properties in your{' '}
                <NavLink to="/properties" style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  portfolio
                </NavLink>{' '}
                to track quality scores and portfolio health indicators.
              </>
            )}
          </p>
        </div>

        <ul className="health-bars">
          {healthData.factors.map((f, idx) => (
            <li key={f.id || idx}>
              <span>{f.label}</span>
              <strong>{f.value != null ? `${f.value}%` : 'N/A'}</strong>
              <span className="health-track" aria-hidden="true">
                <span style={{ width: f.value != null ? `${f.value}%` : '0%' }} />
              </span>
            </li>
          ))}
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
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Performance
            {isLoadingPerformance && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--cmp-brand)' }} />}
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            How your properties turn views into enquiries. Pick a figure to chart it.
          </p>
        </div>
      </div>

      {/* Filter Row Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          marginBottom: '16px'
        }}
      >
        <Dropdown
          label={agentDropdownOptions.find((a) => a.value === agentFilter)?.label || 'All agents'}
          options={agentDropdownOptions}
          selectedValue={agentFilter}
          onSelect={setAgentFilter}
          width="100%"
        />

        <Dropdown
          label={propertyTypeDropdownOptions.find((p) => p.value === propertyTypeFilter)?.label || 'All property types'}
          options={propertyTypeDropdownOptions}
          selectedValue={propertyTypeFilter}
          onSelect={setPropertyTypeFilter}
          width="100%"
        />

        <Dropdown
          label={offeringFilter === 'rent' ? 'Rent only' : offeringFilter === 'sale' ? 'Sale only' : 'All offerings'}
          options={[
            { label: 'All offerings', value: 'all' },
            { label: 'Rent only', value: 'rent' },
            { label: 'Sale only', value: 'sale' }
          ]}
          selectedValue={offeringFilter}
          onSelect={setOfferingFilter}
          width="100%"
        />

        <Dropdown
          label={locationDropdownOptions.find((l) => l.value === locationFilter)?.label || 'All locations'}
          options={locationDropdownOptions}
          selectedValue={locationFilter}
          onSelect={setLocationFilter}
          width="100%"
        />

        <Dropdown
          label={periodFilter === '7' ? 'Last 7 days' : periodFilter === '90' ? 'Last 90 days' : 'Last 30 days'}
          options={[
            { label: 'Last 7 days', value: '7' },
            { label: 'Last 30 days', value: '30' },
            { label: 'Last 90 days', value: '90' }
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
          {activeKpis.map((tab) => {
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

        {/* Dynamic Chart vs Empty State */}
        {isLiveData && !seriesHasValues ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: 'var(--cmp-surface-sunken)',
              borderRadius: 'var(--cmp-radius-md)',
              border: '1px dashed var(--cmp-border)'
            }}
          >
            <TrendingUp size={28} style={{ color: 'var(--cmp-text-faint)', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
              {selectedKpi === 'credits'
                ? 'Credits tracking pending live wallet'
                : 'Traffic impressions, clicks and leads will graph here as properties go live'}
            </p>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Real-time daily telemetry syncs directly with Cash My Property portal visitors.
            </p>
          </div>
        ) : (
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
              {isLiveData && chartSvgData ? (
                <svg viewBox="0 0 760 240" width="100%" role="img" aria-label={activeTabMeta.label}>
                  <g>
                    <line x1="48" x2="744" y1="210" y2="210" stroke="var(--cmp-border)" strokeWidth="1" />
                    <text x="40" y="214" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0</text>
                  </g>
                  <g>
                    <line x1="48" x2="744" y1="144" y2="144" stroke="var(--cmp-border)" strokeWidth="1" />
                    <text x="40" y="148" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">
                      {Math.round(chartSvgData.maxVal / 3)}
                    </text>
                  </g>
                  <g>
                    <line x1="48" x2="744" y1="80" y2="80" stroke="var(--cmp-border)" strokeWidth="1" />
                    <text x="40" y="84" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">
                      {Math.round((chartSvgData.maxVal * 2) / 3)}
                    </text>
                  </g>
                  <g>
                    <line x1="48" x2="744" y1="16" y2="16" stroke="var(--cmp-border)" strokeWidth="1" />
                    <text x="40" y="20" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">
                      {chartSvgData.maxVal}
                    </text>
                  </g>

                  {/* Render Polyline */}
                  <path
                    d={chartSvgData.dStr}
                    fill="none"
                    stroke="var(--cmp-accent)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />

                  {chartSvgData.lastPoint && (
                    <circle
                      cx={chartSvgData.lastPoint.x}
                      cy={chartSvgData.lastPoint.y}
                      r="4"
                      fill="var(--cmp-accent)"
                      stroke="var(--cmp-surface)"
                      strokeWidth="2"
                    />
                  )}

                  {/* Date ticks */}
                  {chartSvgData.points.map((pt, i) => {
                    const step = Math.max(Math.floor(chartSvgData.points.length / 6), 1);
                    if (i % step === 0 || i === chartSvgData.points.length - 1) {
                      return (
                        <text key={i} x={pt.x} y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">
                          {pt.label}
                        </text>
                      );
                    }
                    return null;
                  })}
                </svg>
              ) : (
                // Mock SVG Chart
                <svg viewBox="0 0 760 240" width="100%" role="img" aria-label={activeTabMeta.label}>
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

                  <text x="48" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">19 Aug</text>
                  <text x="168" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">24 Aug</text>
                  <text x="288" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">29 Aug</text>
                  <text x="408" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">3 Sep</text>
                  <text x="528" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">8 Sep</text>
                  <text x="648" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">13 Sep</text>
                  <text x="744" y="232" textAnchor="middle" fontSize="11" fill="var(--cmp-text-faint)">17 Sep</text>

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
              )}
            </div>

            {/* Listing Tier Spend Breakdown */}
            <div style={{ display: 'grid', gap: '10px' }}>
              <div
                className="row"
                style={{
                  alignItems: 'flex-end',
                  gap: '14px',
                  height: '200px',
                  paddingTop: '20px',
                  borderBottom: '1px solid var(--cmp-border)'
                }}
              >
                <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>
                    {isLiveData ? (performanceData?.creditsBreakdown?.standard ?? '—') : '2,170'}
                  </span>
                  <span style={{ width: 'min(28px, 70%)', height: '160px', background: 'var(--cmp-text-faint)', borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>
                    {isLiveData ? (performanceData?.creditsBreakdown?.featured ?? '—') : '1,246'}
                  </span>
                  <span style={{ width: 'min(28px, 70%)', height: '91.8px', background: 'var(--cmp-brand)', borderRadius: '4px 4px 0 0' }} />
                </div>
                <div style={{ flex: '1 1 0%', display: 'grid', justifyItems: 'center', gap: '4px', height: '100%', alignContent: 'end' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>
                    {isLiveData ? (performanceData?.creditsBreakdown?.premium ?? '—') : '850'}
                  </span>
                  <span style={{ width: 'min(28px, 70%)', height: '62.6px', background: 'var(--cmp-accent)', borderRadius: '4px 4px 0 0' }} />
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
        )}
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
            {isLiveData
              ? (overviewData?.kpis?.views != null ? formatNumber(overviewData.kpis.views) : '—')
              : '16,359'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            {isLiveData && overviewData?.kpis?.viewsChange != null
              ? `${overviewData.kpis.viewsChange > 0 ? '+' : ''}${overviewData.kpis.viewsChange}% vs previous period`
              : 'No earlier period to compare'}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leads
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            {isLiveData
              ? (overviewData?.kpis?.leads != null ? formatNumber(overviewData.kpis.leads) : '—')
              : '286'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            {isLiveData && overviewData?.kpis?.leadsChange != null
              ? `${overviewData.kpis.leadsChange > 0 ? '+' : ''}${overviewData.kpis.leadsChange}% vs previous period`
              : 'No earlier period to compare'}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Leads per 100 views
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            {isLiveData
              ? (overviewData?.kpis?.rate != null ? overviewData.kpis.rate : '—')
              : '1.7'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--cmp-text-faint)' }}>
            {isLiveData && overviewData?.kpis?.rateChange != null
              ? `${overviewData.kpis.rateChange > 0 ? '+' : ''}${overviewData.kpis.rateChange}% vs previous period`
              : 'No earlier period to compare'}
          </p>
        </div>
      </div>

      {/* Row Charts: Views per day & Leads per day */}
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
          {isLiveData && (!overviewData?.daily || !overviewData.daily.some((d) => d.views != null && d.views > 0)) ? (
            <div
              style={{
                height: '210px',
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
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>No views recorded</p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Daily listing views will appear here once properties go live on the portal.
                </p>
              </div>
            </div>
          ) : (
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
                {MOCK_DAILY_DATA.slice().reverse().map((d, idx) => {
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
              </svg>
            </div>
          )}
        </section>

        {/* Leads per day Area Chart */}
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16px' }}>Leads per day</h2>
          <p className="faint" style={{ margin: '4px 0 12px', fontSize: '12px' }}>
            Calls, WhatsApp, email, chat and viewing requests
          </p>
          {isLiveData && (!overviewData?.daily || !overviewData.daily.some((d) => d.leads != null && d.leads > 0)) ? (
            <div
              style={{
                height: '210px',
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
                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>No leads recorded</p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Incoming client enquiries will be graphed daily here.
                </p>
              </div>
            </div>
          ) : (
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
              </svg>
            </div>
          )}
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
              {isLiveData ? (
                Array.isArray(overviewData?.daily) && overviewData.daily.length > 0 ? (
                  overviewData.daily.map((row, idx) => (
                    <tr key={idx}>
                      <td className="muted">{row.date}</td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {row.views != null ? formatNumber(row.views) : '—'}
                      </td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {row.leads != null ? row.leads : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '24px' }} className="muted">
                      No daily numbers recorded yet.
                    </td>
                  </tr>
                )
              ) : (
                MOCK_DAILY_DATA.map((row) => (
                  <tr key={row.day}>
                    <td className="muted">{row.day}</td>
                    <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(row.views)}
                    </td>
                    <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                      {row.leads}
                    </td>
                  </tr>
                ))
              )}
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
        {isLiveData && (!overviewData?.channels || !overviewData.channels.some((c) => c.count != null)) ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: 'var(--cmp-surface-sunken)',
              borderRadius: 'var(--cmp-radius-md)',
              border: '1px dashed var(--cmp-border)'
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }} className="muted">
              No lead channels recorded for this period.
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
            {(isLiveData && overviewData?.channels ? overviewData.channels : [
              { channel: 'WhatsApp', count: 116, pct: '41%', width: '100%' },
              { channel: 'Phone call', count: 78, pct: '27%', width: '67.2%' },
              { channel: 'Email', count: 71, pct: '25%', width: '61.2%' },
              { channel: 'Chat', count: 21, pct: '7%', width: '18.1%' }
            ]).map((item) => (
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
                        width: item.width || (item.share ? `${item.share}%` : '20%'),
                        background: 'var(--cmp-brand)'
                      }}
                    />
                  </span>
                  <span
                    style={{
                      flex: '0 0 86px',
                      fontSize: '13px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {item.count != null ? item.count : '—'}{' '}
                    <span className="faint" style={{ fontWeight: 400 }}>
                      · {item.pct || (item.share != null ? `${item.share}%` : '—')}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Performance by Location Card */}
      <section className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '16px' }}>Performance by location</h2>
        <p className="faint" style={{ margin: '4px 0 12px', fontSize: '12px' }}>
          Your listings grouped by community, always the last 30 days
        </p>
        {isLiveData && (!overviewData?.locations || overviewData.locations.length === 0) ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--cmp-surface-sunken)',
              borderRadius: 'var(--cmp-radius-md)',
              border: '1px dashed var(--cmp-border)'
            }}
          >
            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }} className="muted">
              No performance data by location recorded yet.
            </p>
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
              Once your published properties generate views and enquiries, community breakdown will be shown here.
            </p>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>
              Leads by community
            </h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
              {(isLiveData && overviewData?.locations ? overviewData.locations : MOCK_COMMUNITIES).map((com) => {
                const name = com.location || com.name;
                const leads = com.leads != null ? com.leads : '—';
                const share = com.shareOfLeads != null ? `${com.shareOfLeads}%` : com.share || '—';
                const pctWidth = com.pctWidth != null ? com.pctWidth : (com.shareOfLeads != null ? Math.min(com.shareOfLeads * 2.5, 100) : 0);

                return (
                  <li
                    key={name}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '170px minmax(0, 1fr)',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: 'var(--cmp-text-muted)' }}>
                      {name}
                    </span>
                    <span className="row" style={{ gap: '8px', minWidth: 0 }}>
                      <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                        <span
                          style={{
                            display: 'block',
                            height: '16px',
                            minWidth: Number(leads) > 0 ? '2px' : 0,
                            borderRadius: '0 4px 4px 0',
                            width: `${pctWidth}%`,
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
                        {leads}{' '}
                        <span className="faint" style={{ fontWeight: 400 }}>
                          · {share}
                        </span>
                      </span>
                    </span>
                  </li>
                );
              })}
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
                  {(isLiveData && overviewData?.locations ? overviewData.locations : MOCK_COMMUNITIES).map((row) => {
                    const name = row.location || row.name;
                    const liveStr = row.live != null && row.total != null ? `${row.live} live of ${row.total}` : row.live || '—';
                    const viewsStr = row.views != null ? formatNumber(row.views) : '—';
                    const leadsStr = row.leads != null ? row.leads : '—';
                    const shareStr = row.shareOfLeads != null ? `${row.shareOfLeads}%` : row.share || '—';
                    const per100Str = row.leadsPer100Views != null ? row.leadsPer100Views : row.per100 || '—';
                    const avgSqftStr = row.avgSalePricePerSqft ? `AED ${Number(row.avgSalePricePerSqft).toLocaleString()}` : row.avgSqft || '—';

                    return (
                      <tr key={name}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{name}</td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {liveStr}
                        </td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                          {viewsStr}
                        </td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                          {leadsStr}
                        </td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                          {shareStr}
                        </td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                          {per100Str}
                        </td>
                        <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                          {avgSqftStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Listings Ranked by Leads Table Card */}
      <section style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>
          {isLiveData && overviewData?.rankedBy === 'quality' ? 'Top listings by quality' : 'Listings ranked by leads'}
        </h2>
        <p className="faint" style={{ margin: '0 0 12px', fontSize: '12px' }}>
          {isLiveData && overviewData?.rankedBy === 'quality'
            ? 'Ranked by listing quality score until consumer enquiry tracking goes live'
            : 'Always the last 30 days, whatever range is selected above'}
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
              {isLiveData ? (
                Array.isArray(overviewData?.topListings) && overviewData.topListings.length > 0 ? (
                  overviewData.topListings.map((l) => (
                    <tr key={l.id || l.reference}>
                      <td style={{ minWidth: '240px' }}>
                        <span style={{ fontWeight: 600 }}>{l.title}</span>
                        <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                          {l.reference || '—'} · {l.location || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {l.views != null ? formatNumber(l.views) : '—'}
                      </td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {l.leads != null ? l.leads : '—'}
                      </td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {l.leadsPer100Views != null ? l.leadsPer100Views : '—'}
                      </td>
                      <td style={{ textAlign: 'end', fontVariantNumeric: 'tabular-nums' }}>
                        {l.qualityScore != null ? l.qualityScore : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }} className="muted">
                      No live listings recorded yet.
                    </td>
                  </tr>
                )
              ) : (
                MOCK_RANKED_LISTINGS.map((l) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
