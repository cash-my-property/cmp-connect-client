import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  Search,
  Award,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

const MOCK_MARKET_DATA = {
  stats: {
    communities: 11,
    liveProperties: 14,
    enquiries30d: null,
    strongest: {
      community: 'Dubai Marina',
      offering: 'SALE',
      basis: 'listings',
      listingRank: 1,
      companies: 2
    },
    biggestGap: null
  },
  communities: [
    {
      community: 'Dubai Marina',
      offering: 'SALE',
      yourListings: 4,
      companies: 2,
      listingRank: 1,
      topPercent: 50,
      marketListings: 8,
      yourEnquiries: null,
      enquiryRank: null,
      enquiriesPerListing: null,
      marketDeals: null,
      marketDealsValue: null,
      change: null
    },
    {
      community: 'Downtown Dubai',
      offering: 'SALE',
      yourListings: 3,
      companies: 4,
      listingRank: 2,
      topPercent: 50,
      marketListings: 12,
      yourEnquiries: null,
      enquiryRank: null,
      enquiriesPerListing: null,
      marketDeals: null,
      marketDealsValue: null,
      change: null
    },
    {
      community: 'Palm Jumeirah',
      offering: 'SALE',
      yourListings: 2,
      companies: 3,
      listingRank: 2,
      topPercent: 67,
      marketListings: 6,
      yourEnquiries: null,
      enquiryRank: null,
      enquiriesPerListing: null,
      marketDeals: null,
      marketDealsValue: null,
      change: null
    },
    {
      community: 'Dubai Hills Estate',
      offering: 'RENT',
      yourListings: 3,
      companies: 5,
      listingRank: 2,
      topPercent: 40,
      marketListings: 9,
      yourEnquiries: null,
      enquiryRank: null,
      enquiriesPerListing: null,
      marketDeals: null,
      marketDealsValue: null,
      change: null
    },
    {
      community: 'Jumeirah Village Circle',
      offering: 'RENT',
      yourListings: 2,
      companies: 6,
      listingRank: 3,
      topPercent: 50,
      marketListings: 14,
      yourEnquiries: null,
      enquiryRank: null,
      enquiriesPerListing: null,
      marketDeals: null,
      marketDealsValue: null,
      change: null
    }
  ],
  factors: [
    {
      id: 'quality',
      label: 'Quality score 90+',
      unit: '%',
      you: 42,
      topFive: 38,
      best: 55,
      why: 'Listings scoring above 90 bring up to twice the enquiries of those below.'
    },
    {
      id: 'photos',
      label: 'Ten or more photos',
      unit: '%',
      you: 78,
      topFive: 72,
      best: 85,
      why: 'Buyers skip listings with few photos before they read a word.'
    },
    {
      id: 'elite',
      label: 'Listed under an Elite agent',
      unit: '%',
      you: null,
      topFive: null,
      best: null,
      why: 'Elite agents reply faster, and their listings bring more enquiries.'
    },
    {
      id: 'exposure',
      label: 'Featured or Premium placement',
      unit: '%',
      you: null,
      topFive: null,
      best: null,
      why: 'Premium listings bring many times the enquiries of a standard listing.'
    }
  ],
  comparedWith: 'CMP Connect companies with live listings'
};

export default function MarketStandingPage() {
  const { isLiveData } = useApp();

  const [offeringFilter, setOfferingFilter] = useState('all'); // 'all' | 'sale' | 'rent'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [data, setData] = useState(MOCK_MARKET_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchMarketData = useCallback(async () => {
    if (!isLiveData) {
      let filtered = [...MOCK_MARKET_DATA.communities];
      if (offeringFilter !== 'all') {
        filtered = filtered.filter((c) => c.offering.toLowerCase() === offeringFilter);
      }
      if (debouncedSearch) {
        filtered = filtered.filter((c) =>
          c.community.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      setData({
        ...MOCK_MARKET_DATA,
        communities: filtered
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await cmpConnectApi.getInsightsMarket({
        offering: offeringFilter,
        search: debouncedSearch
      });
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching market standing data:', err);
      setError(err.message || 'Failed to load market standing data.');
    } finally {
      setLoading(false);
    }
  }, [isLiveData, offeringFilter, debouncedSearch]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const stats = data?.stats || {};
  const communities = data?.communities || [];
  const factors = data?.factors || [];

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Market standing
          </h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '680px' }}>
            How your company compares with other CMP Connect agencies and developers marketing stock in the same communities.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMarketData}
          className="btn btn-outline btn-sm"
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Info Notice about Market Comparison */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          background: 'var(--cmp-surface-sunken)',
          borderColor: 'var(--cmp-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px'
        }}
      >
        <Info size={18} style={{ color: 'var(--cmp-brand)', flexShrink: 0 }} />
        <span style={{ color: 'var(--cmp-text-muted)' }}>
          Comparison basis: <strong>{data?.comparedWith || 'CMP Connect companies with live listings'}</strong>.
          Metrics shown as <em>N/A</em> will activate once direct consumer tracking and DLD integration are linked.
        </span>
      </div>

      {error && (
        <div
          className="card"
          style={{
            padding: '14px 18px',
            background: 'var(--cmp-danger-subtle, rgba(220, 38, 38, 0.08))',
            borderColor: 'var(--cmp-danger)',
            color: 'var(--cmp-danger)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <div className="card" style={{ padding: '18px 20px', display: 'grid', gap: '6px' }}>
          <span className="muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>
            Active Communities
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
              {stats.communities ?? 0}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>locations</span>
          </div>
          <span className="faint" style={{ fontSize: '11.5px' }}>Where you have live stock</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'grid', gap: '6px' }}>
          <span className="muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>
            Live Market Properties
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
              {stats.liveProperties ?? 0}
            </span>
            <span className="faint" style={{ fontSize: '12px' }}>properties</span>
          </div>
          <span className="faint" style={{ fontSize: '11.5px' }}>Published & visible right now</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'grid', gap: '6px' }}>
          <span className="muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>
            Your Strongest Position
          </span>
          {stats.strongest ? (
            <div style={{ display: 'grid', gap: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cmp-text)' }}>
                {stats.strongest.community}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--cmp-accent)', fontWeight: 600 }}>
                Rank #{stats.strongest.listingRank} of {stats.strongest.companies} companies ({stats.strongest.offering})
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>
              —
            </span>
          )}
          <span className="faint" style={{ fontSize: '11.5px' }}>Based on active stock volume</span>
        </div>

        <div className="card" style={{ padding: '18px 20px', display: 'grid', gap: '6px' }}>
          <span className="muted" style={{ fontSize: '12.5px', fontWeight: 500 }}>
            30-Day Market Enquiries
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cmp-text-muted)' }}>
              {stats.enquiries30d != null ? stats.enquiries30d : 'N/A'}
            </span>
          </div>
          <span className="faint" style={{ fontSize: '11.5px' }}>
            Available once CMP consumer web tracking goes live
          </span>
        </div>
      </div>

      {/* Main Section: Communities Table & Filter Controls */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table Toolbar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--cmp-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: 'var(--cmp-surface-sunken)'
          }}
        >
          {/* Offering Tabs */}
          <div
            style={{
              display: 'inline-flex',
              background: 'var(--cmp-surface)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--cmp-border)'
            }}
          >
            {[
              { key: 'all', label: 'Rent and Sale' },
              { key: 'sale', label: 'Sale' },
              { key: 'rent', label: 'Rent' }
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setOfferingFilter(tab.key)}
                style={{
                  border: 'none',
                  background: offeringFilter === tab.key ? 'var(--cmp-brand-subtle)' : 'transparent',
                  color: offeringFilter === tab.key ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                  fontWeight: offeringFilter === tab.key ? 700 : 500,
                  fontSize: '12.5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--cmp-text-muted)'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search community..."
              style={{
                width: '100%',
                height: '36px',
                paddingLeft: '34px',
                paddingRight: '12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--cmp-border)',
                background: 'var(--cmp-surface)'
              }}
            />
          </div>
        </div>

        {/* Communities Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cmp-border)', background: 'var(--cmp-surface)' }}>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Community</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Offering</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'right' }}>Your Listings</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'right' }}>Market Stock</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Listing Rank</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'center' }}>Market Enquiries</th>
                <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'center' }}>Market Deals</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
                    Loading market comparisons...
                  </td>
                </tr>
              ) : communities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                    <div style={{ maxWidth: '380px', margin: '0 auto', display: 'grid', gap: '8px' }}>
                      <Building size={32} style={{ margin: '0 auto', color: 'var(--cmp-text-muted)' }} />
                      <strong style={{ fontSize: '15px' }}>No community positions found</strong>
                      <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                        {searchQuery
                          ? `No live properties match "${searchQuery}".`
                          : 'You currently have no active listings in this category.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                communities.map((row, idx) => {
                  const isTopRank = row.listingRank === 1;
                  return (
                    <tr
                      key={`${row.community}-${row.offering}-${idx}`}
                      style={{
                        borderBottom: '1px solid var(--cmp-border)',
                        background: isTopRank ? 'var(--cmp-surface-sunken)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isTopRank && <Award size={16} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />}
                          <span>{row.community}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          className="chip"
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            background: row.offering === 'SALE' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-info-subtle)',
                            color: row.offering === 'SALE' ? 'var(--cmp-brand)' : 'var(--cmp-info)',
                            border: 'none'
                          }}
                        >
                          {row.offering}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>
                        {row.yourListings}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--cmp-text-muted)' }}>
                        {row.marketListings}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: isTopRank ? 'var(--cmp-accent)' : 'inherit' }}>
                            #{row.listingRank} of {row.companies}
                          </span>
                          {row.topPercent != null && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isTopRank ? 'var(--cmp-accent-subtle, rgba(234, 179, 8, 0.15))' : 'var(--cmp-surface-sunken)',
                                color: isTopRank ? 'var(--cmp-accent)' : 'var(--cmp-text-muted)',
                                fontWeight: 600
                              }}
                            >
                              Top {row.topPercent}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
                        <span title="Available once consumer website tracking is enabled">N/A</span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
                        <span title="Available with historical DLD transaction feeds">N/A</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* "What decides your results" Factors Section */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
            What decides your results
          </h2>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Proven listing quality and presentation standards compared against the top 5 companies and the market leader.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {factors.map((factor) => {
            const isNa = factor.you == null;
            return (
              <div
                key={factor.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--cmp-border)',
                  background: 'var(--cmp-surface-sunken)',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 1.8fr) minmax(180px, 1.2fr)',
                  gap: '20px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14.5px', color: 'var(--cmp-text)' }}>
                      {factor.label}
                    </strong>
                    {isNa && (
                      <span
                        className="chip"
                        style={{ fontSize: '10.5px', padding: '2px 6px', background: 'var(--cmp-surface)', color: 'var(--cmp-text-muted)' }}
                      >
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: '12.5px', lineHeight: 1.4 }}>
                    {factor.why}
                  </p>
                </div>

                {/* Score Comparison Display */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span className="faint" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>
                      You
                    </span>
                    <strong style={{ fontSize: '16px', color: factor.you != null ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)' }}>
                      {factor.you != null ? `${factor.you}%` : 'N/A'}
                    </strong>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span className="faint" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>
                      Top 5 Avg
                    </span>
                    <strong style={{ fontSize: '16px', color: 'var(--cmp-text)' }}>
                      {factor.topFive != null ? `${factor.topFive}%` : 'N/A'}
                    </strong>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <span className="faint" style={{ fontSize: '11px', display: 'block', textTransform: 'uppercase' }}>
                      Best
                    </span>
                    <strong style={{ fontSize: '16px', color: 'var(--cmp-accent)' }}>
                      {factor.best != null ? `${factor.best}%` : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
