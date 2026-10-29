import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { ArrowUpRight, RefreshCw } from 'lucide-react';

const initialResults = [
  {
    id: 'CMP-L-004098',
    rtoRef: 'CMP-L-004098',
    title: 'One bed in The Address Residences',
    community: 'Downtown Dubai',
    agent: 'Layla Haddad',
    outcome: 'Sold',
    outcomeCategory: 'SOLD',
    closedDate: '12 Sep 2026',
    startingPrice: 'AED 2,200,000',
    closingPrice: 'AED 2,340,000',
    againstStart: 6.4,
    offersCount: 27
  },
  {
    id: 'CMP-L-004076',
    rtoRef: 'CMP-L-004076',
    title: 'Furnished studio with pool view',
    community: 'Jumeirah Village Circle',
    agent: 'Arjun Mehta',
    outcome: 'Not sold',
    outcomeCategory: 'SOLD_FAIL',
    closedDate: '10 Sep 2026',
    startingPrice: 'AED 700,000',
    closingPrice: '—',
    againstStart: null,
    offersCount: 0
  },
  {
    id: 'CMP-L-004051',
    rtoRef: 'CMP-L-004051',
    title: 'Canal view three bed with study',
    community: 'Business Bay',
    agent: 'Karim Saleh',
    outcome: 'Sold',
    outcomeCategory: 'SOLD',
    closedDate: '30 Aug 2026',
    startingPrice: 'AED 3,300,000',
    closingPrice: 'AED 3,610,000',
    againstStart: 9.4,
    offersCount: 22
  }
];

export default function ResultsPage() {
  const { isLiveData, authToken } = useApp();
  const token = authToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('cmp_connect_auth_token') : null);
  const [results, setResults] = useState(() => (isLiveData ? [] : initialResults));
  const [serverStats, setServerStats] = useState(null);
  const [serverCounts, setServerCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchLiveResults = useCallback(async () => {
    if (!isLiveData) return;
    setLoading(true);
    try {
      const res = await cmpConnectApi.getRtoResults({ status: filter, limit: 50 }, token);
      const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
      const rawItems = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

      if (res?.stats || payload?.stats) {
        setServerStats(res?.stats || payload?.stats);
      }
      if (res?.counts || payload?.counts) {
        setServerCounts(res?.counts || payload?.counts);
      }

      const mapped = rawItems.map((item) => {
        const id = item.id || item._id || item.propertyId;
        const isSold = item.status === 'SOLD';
        const soldVal = item.soldPrice ?? item.auction?.currentHighestBid ?? null;
        const startVal = item.startingPrice ?? item.propertyPrice ?? 0;
        const closedAtRaw = item.closedAt || item.auction?.closedAt || item.updatedAt;
        return {
          id,
          rtoRef: item.rtoRef || item.reference || id,
          title: item.title || item.propertyTitle || 'Untitled Property',
          community: item.location || item.propertyLocation || 'Dubai',
          agent: item.listedBy?.fullName || item.agent?.fullName || 'Agency Agent',
          outcome: isSold ? 'Sold' : 'Not sold',
          outcomeCategory: isSold ? 'SOLD' : 'SOLD_FAIL',
          closedDate: closedAtRaw
            ? new Date(closedAtRaw).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—',
          startingPrice: startVal ? `AED ${Number(startVal).toLocaleString()}` : '—',
          closingPrice: isSold && soldVal ? `AED ${Number(soldVal).toLocaleString()}` : '—',
          againstStart: item.againstStart != null ? item.againstStart : null,
          rawSoldPrice: isSold && soldVal ? Number(soldVal) : 0,
          offersCount: item.auction?.offers ?? item.auction?.totalBids ?? 0
        };
      });

      setResults(mapped);
    } catch {
      // Fallback to listRtoProperties if /results is not reachable
      try {
        const res = await cmpConnectApi.listRtoProperties({ limit: 50 }, token);
        const allItems = res?.data?.items || res?.items || (Array.isArray(res?.data) ? res.data : []);
        const closedItems = allItems
          .filter((item) => ['SOLD', 'SOLD_FAIL'].includes(item.status))
          .map((item) => {
            const id = item.id || item._id;
            const isSold = item.status === 'SOLD';
            const soldVal = item.soldPrice || item.auction?.currentHighestBid || 0;
            const startVal = item.startingPrice ?? item.propertyPrice ?? 0;
            const againstStart =
              isSold && startVal > 0 && soldVal > 0
                ? Math.round(((soldVal - startVal) / startVal) * 1000) / 10
                : null;
            return {
              id,
              rtoRef: item.rtoRef || item.reference || id,
              title: item.title || item.propertyTitle || 'Untitled Property',
              community: item.location || item.propertyLocation || 'Dubai',
              agent: item.listedBy?.fullName || item.listedBy?.name || 'Agency Agent',
              outcome: isSold ? 'Sold' : 'Not sold',
              outcomeCategory: isSold ? 'SOLD' : 'SOLD_FAIL',
              closedDate: item.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—',
              startingPrice: startVal ? `AED ${Number(startVal).toLocaleString()}` : '—',
              closingPrice: isSold && soldVal ? `AED ${Number(soldVal).toLocaleString()}` : '—',
              againstStart,
              rawSoldPrice: isSold ? Number(soldVal) : 0,
              offersCount: item.auction?.offers || item.auction?.totalBids || 0
            };
          });
        setResults(closedItems);
      } catch {
        // Keep existing state
      }
    } finally {
      setLoading(false);
    }
  }, [isLiveData, filter, token]);

  useEffect(() => {
    if (isLiveData) {
      fetchLiveResults();
    } else {
      setResults(initialResults);
    }
  }, [isLiveData, fetchLiveResults]);

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => r.outcomeCategory === filter);
  }, [results, filter]);

  const counts = {
    all: isLiveData && serverCounts?.all != null ? serverCounts.all : results.length,
    SOLD: isLiveData && serverCounts?.SOLD != null ? serverCounts.SOLD : results.filter((r) => r.outcomeCategory === 'SOLD').length,
    SOLD_FAIL: isLiveData && serverCounts?.SOLD_FAIL != null ? serverCounts.SOLD_FAIL : results.filter((r) => r.outcomeCategory === 'SOLD_FAIL').length
  };

  const sellThroughDisplay = isLiveData
    ? serverStats?.sellThrough != null
      ? `${serverStats.sellThrough}%`
      : counts.all > 0
        ? `${Math.round((counts.SOLD / counts.all) * 100)}%`
        : '—'
    : '67%';

  const avgAboveStartDisplay = isLiveData
    ? serverStats?.averageAboveStart != null
      ? `+${serverStats.averageAboveStart}%`
      : '—'
    : '+7.9%';

  const soldValueDisplay = isLiveData
    ? serverStats?.soldValue != null && serverStats.soldValue > 0
      ? `AED ${Number(serverStats.soldValue).toLocaleString()}`
      : 'AED 0'
    : 'AED 5,950,000';

  const getOutcomeBadge = (outcome) => {
    const dotBg = outcome === 'Sold' ? 'var(--cmp-brand)' : 'var(--cmp-text-faint)';
    return (
      <span className="row" style={{ gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
        <span
          aria-hidden="true"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: dotBg,
            flexShrink: 0
          }}
        />
        {outcome}
      </span>
    );
  };

  return (
    <div>
      {/* Title */}
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px' }}>Results</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
            Closed Real Time Offer auctions, final sale prices and buyer offer activity.
          </p>
        </div>

        {isLiveData && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchLiveResults}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        )}
      </div>

      {/* 3 Stat Cards (Section 13.6) */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Sold
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {sellThroughDisplay}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {counts.SOLD} sold, {counts.SOLD_FAIL} not sold
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Average above starting price
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700 }}>
            {avgAboveStartDisplay}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            across sold properties
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Total sold value
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            {soldValueDisplay}
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {counts.all} closed auctions in total
          </p>
        </div>
      </div>

      {/* Filter Chips: All / Sold / Not sold (Section 13.6) */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'SOLD'}
          onClick={() => setFilter('SOLD')}
        >
          Sold ({counts.SOLD})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'SOLD_FAIL'}
          onClick={() => setFilter('SOLD_FAIL')}
        >
          Not sold ({counts.SOLD_FAIL})
        </button>
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Property</th>
              <th>Outcome</th>
              <th>Closed</th>
              <th>Starting price</th>
              <th>Closing price</th>
              <th>Against start</th>
              <th>Offers</th>
              <th style={{ textAlign: 'end' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No closed auctions found for this filter.
                </td>
              </tr>
            ) : (
              filteredResults.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: '220px' }}>
                    <span style={{ fontWeight: 600 }}>{row.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {row.rtoRef} · {row.community} · {row.agent}
                    </span>
                  </td>
                  <td>{getOutcomeBadge(row.outcome)}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{row.closedDate}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{row.startingPrice}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{row.closingPrice}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: row.againstStart != null && row.againstStart > 0 ? 'var(--cmp-success)' : 'var(--cmp-text-muted)' }}>
                    {row.againstStart != null ? `${row.againstStart > 0 ? '+' : ''}${row.againstStart}%` : '—'}
                  </td>
                  <td>{row.offersCount}</td>
                  <td style={{ textAlign: 'end' }}>
                    <NavLink className="btn btn-ghost btn-sm" to={`/rto/${row.id}`}>
                      <span>View</span>
                      <ArrowUpRight size={13} />
                    </NavLink>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
