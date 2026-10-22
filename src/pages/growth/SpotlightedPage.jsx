import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Building,
  Award,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

const mockEligibleListings = [
  {
    id: 'CLID-7K2M9QXA',
    reference: 'CLID-7K2M9QXA',
    title: 'Full marina view 2 bed in Marina Gate',
    location: 'Dubai Marina',
    listedBy: 'Karim Saleh',
    purpose: 'SALE',
    qualityScore: 94
  },
  {
    id: 'CLID-8L3N0RYB',
    reference: 'CLID-8L3N0RYB',
    title: 'Burj Khalifa facing one bed in The Address',
    location: 'Downtown Dubai',
    listedBy: 'Layla Haddad',
    purpose: 'SALE',
    qualityScore: 88
  },
  {
    id: 'CLID-9M4P1SZC',
    reference: 'CLID-9M4P1SZC',
    title: 'Duplex penthouse on the Palm',
    location: 'Palm Jumeirah',
    listedBy: 'Layla Haddad',
    purpose: 'SALE',
    qualityScore: 97
  }
];

export default function SpotlightedPage() {
  const { isLiveData } = useApp();
  const [copiedId, setCopiedId] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSpotlightData = useCallback(async () => {
    if (!isLiveData) return;
    try {
      setLoading(true);
      setError(null);
      const res = await cmpConnectApi.getInsightsSpotlight();
      if (res && res.data) {
        setApiData(res.data);
      }
    } catch (err) {
      console.error('Error fetching spotlight data:', err);
      setError(err.message || 'Failed to fetch spotlighted data.');
    } finally {
      setLoading(false);
    }
  }, [isLiveData]);

  useEffect(() => {
    fetchSpotlightData();
  }, [fetchSpotlightData]);

  const eligibleListings = isLiveData
    ? (apiData?.eligible || [])
    : mockEligibleListings;

  const minQuality = apiData?.minQuality || 80;
  const biddingAvailable = apiData?.biddingAvailable || false;

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      {/* Header */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Spotlighted properties
            <span
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                minWidth: '26px',
                height: '22px',
                padding: '0 8px',
                borderRadius: '999px',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              {apiData?.entries?.length || 0}
            </span>
          </h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Listings pinned at the top of a community search results. Bid for a community spotlight placement.
          </p>
        </div>

        <div className="row" style={{ gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {isLiveData && (
            <button
              type="button"
              onClick={fetchSpotlightData}
              className="btn btn-outline btn-sm"
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          )}

          <button
            type="button"
            className="btn btn-accent btn-sm"
            disabled={!biddingAvailable}
            title={!biddingAvailable ? 'Spotlight bidding will activate with Wallet Credits' : 'Bid now'}
            style={{ opacity: !biddingAvailable ? 0.6 : 1, cursor: !biddingAvailable ? 'not-allowed' : 'pointer' }}
          >
            <Sparkles size={14} />
            <span>Bid for a community</span>
          </button>
        </div>
      </div>

      {/* Info notice about Bidding and Credits */}
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
          <strong>Community Spotlight Bidding:</strong> Active spotlight placements require Wallet Credits.
          Properties below are verified and meet the <strong>quality score {minQuality}+</strong> threshold to qualify for spotlighting.
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

      {/* Empty State Banner with Concept Graphic */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'grid', placeItems: 'center', textAlign: 'center', padding: '48px 20px', gap: '14px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--cmp-brand-subtle)',
              color: 'var(--cmp-brand)',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            <Sparkles size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>No spotlight listings yet</h2>
          <p className="muted" style={{ margin: 0, maxWidth: '520px', fontSize: '14px', lineHeight: 1.5 }}>
            When you place a bid on a community, your selected property will appear here with live position, ranking, and search impressions.
          </p>
        </div>
      </div>

      {/* Eligible Listings Table */}
      <div>
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
            Ready for the spotlight ({eligibleListings.length})
          </h2>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            Active, live listings scoring {minQuality} or higher in quality with no holds.
          </p>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--cmp-border)', background: 'var(--cmp-surface-sunken)' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Reference</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Property</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>Agent</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'center' }}>Purpose</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'center' }}>Quality Score</th>
                  <th style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--cmp-text-muted)', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
                      Loading eligible properties...
                    </td>
                  </tr>
                ) : eligibleListings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '44px 20px' }} className="muted">
                      No eligible listings found. Live properties with a quality score of {minQuality}+ will appear here.
                    </td>
                  </tr>
                ) : (
                  eligibleListings.map((listing) => {
                    const ref = listing.reference || listing.listingRef || listing.id;
                    const quality = listing.qualityScore ?? listing.quality ?? 80;
                    const agentName = listing.listedBy?.fullName || listing.listedBy || listing.agent || '—';
                    const location = listing.location || listing.community || '—';

                    return (
                      <tr
                        key={listing.id}
                        style={{ borderBottom: '1px solid var(--cmp-border)', transition: 'background 0.15s ease' }}
                      >
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(ref, e)}
                              title="Copy reference"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'var(--cmp-text-faint)'
                              }}
                            >
                              {copiedId === ref ? (
                                <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                            <NavLink
                              to={`/properties/${listing.id}/edit`}
                              style={{
                                color: 'var(--cmp-brand)',
                                fontWeight: 600,
                                fontSize: '13px',
                                textDecoration: 'underline',
                                textUnderlineOffset: '3px'
                              }}
                            >
                              {ref}
                            </NavLink>
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--cmp-text)', display: 'block' }}>
                            {listing.title || listing.propertyTitle}
                          </span>
                          <span className="faint" style={{ fontSize: '12px' }}>
                            {location}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '13px' }}>{agentName}</span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span
                            className="chip"
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              background: listing.purpose === 'SALE' ? 'var(--cmp-brand-subtle)' : 'var(--cmp-info-subtle)',
                              color: listing.purpose === 'SALE' ? 'var(--cmp-brand)' : 'var(--cmp-info)',
                              border: 'none'
                            }}
                          >
                            {listing.purpose || 'SALE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                background: 'var(--cmp-success-subtle, rgba(34, 197, 94, 0.12))',
                                color: 'var(--cmp-success, #16a34a)',
                                fontWeight: 800,
                                fontSize: '12px'
                              }}
                            >
                              {quality}/100
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={!biddingAvailable}
                            style={{ height: '32px', padding: '0 12px', opacity: !biddingAvailable ? 0.6 : 1 }}
                            title="Bidding will activate with Wallet Credits"
                          >
                            <span>Spotlight</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
