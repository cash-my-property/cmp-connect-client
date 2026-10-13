import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowUpRight, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

const initialResults = [
  {
    id: 'CMP-L-004112',
    title: 'One bed in JLT, owner withdrew',
    community: 'Jumeirah Lake Towers',
    agent: 'Karim Saleh',
    outcome: 'Withdrawn',
    outcomeCategory: 'withdrawn',
    closedDate: '16 Sep 2026',
    guide: 'AED 1.05M–AED 1.15M',
    reserve: 'AED 1,100,000',
    closingPrice: '—',
    againstReserve: '—',
    againstReserveColor: 'var(--cmp-text-faint)',
    offersCount: 0
  },
  {
    id: 'CMP-L-004098',
    title: 'One bed in The Address Residences',
    community: 'Downtown Dubai',
    agent: 'Layla Haddad',
    outcome: 'Sold',
    outcomeCategory: 'sold',
    closedDate: '12 Sep 2026',
    guide: 'AED 2.2M–AED 2.4M',
    reserve: 'AED 2,250,000',
    closingPrice: 'AED 2,340,000',
    againstReserve: '▲ +4.0%',
    againstReserveColor: 'var(--cmp-success)',
    offersCount: 27
  },
  {
    id: 'CMP-L-004076',
    title: 'Furnished studio with pool view',
    community: 'Jumeirah Village Circle',
    agent: 'Arjun Mehta',
    outcome: 'Reserve not met',
    outcomeCategory: 'reserve_not_met',
    closedDate: '10 Sep 2026',
    guide: 'AED 700K–AED 760K',
    reserve: 'AED 720,000',
    closingPrice: 'AED 690,000',
    againstReserve: '▼ −4.2%',
    againstReserveColor: 'var(--cmp-danger)',
    offersCount: 9,
    topBidder: 'Buyer 3'
  },
  {
    id: 'CMP-L-004051',
    title: 'Canal view three bed with study',
    community: 'Business Bay',
    agent: 'Karim Saleh',
    outcome: 'Sold',
    outcomeCategory: 'sold',
    closedDate: '30 Aug 2026',
    guide: 'AED 3.3M–AED 3.6M',
    reserve: 'AED 3,400,000',
    closingPrice: 'AED 3,610,000',
    againstReserve: '▲ +6.2%',
    againstReserveColor: 'var(--cmp-success)',
    offersCount: 22
  }
];

export default function ResultsPage() {
  const [results, setResults] = useState(initialResults);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleRelist = (id) => {
    showNotice(`Relist draft created for ${id}. Offers window scheduled.`);
  };

  const handleNegotiate = (id, bidder) => {
    showNotice(`Direct negotiation initiated with ${bidder} for ${id} at highest offer.`);
  };

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results;
    return results.filter((r) => r.outcomeCategory === filter);
  }, [results, filter]);

  const counts = {
    all: results.length,
    sold: results.filter((r) => r.outcomeCategory === 'sold').length,
    reserve_not_met: results.filter((r) => r.outcomeCategory === 'reserve_not_met').length,
    withdrawn: results.filter((r) => r.outcomeCategory === 'withdrawn').length
  };

  const getOutcomeBadge = (outcome) => {
    let dotBg = 'var(--cmp-text-faint)';
    if (outcome === 'Sold') dotBg = 'var(--cmp-brand)';
    if (outcome === 'Reserve not met') dotBg = 'var(--cmp-danger)';

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
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px' }}>Results</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          How every closed property did against its reserve, and what to do with the ones that did not sell.
        </p>
      </div>

      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-brand-subtle)',
            borderColor: 'var(--cmp-brand-border)',
            color: 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {notice}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Sold at or above reserve
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            67%
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            2 sold, 1 under reserve
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total sold
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            AED 5.95M
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            closing prices combined
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Average against reserve
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            +5.1%
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            on properties that sold
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Offers per property
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            19
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            sold and unsold
          </p>
        </div>
      </div>

      {/* Filter Chips */}
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
          aria-pressed={filter === 'sold'}
          onClick={() => setFilter('sold')}
        >
          Sold ({counts.sold})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'reserve_not_met'}
          onClick={() => setFilter('reserve_not_met')}
        >
          Reserve not met ({counts.reserve_not_met})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'withdrawn'}
          onClick={() => setFilter('withdrawn')}
        >
          Withdrawn ({counts.withdrawn})
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
              <th>Guide</th>
              <th>Reserve</th>
              <th>Closing price</th>
              <th>Against reserve</th>
              <th>Offers</th>
              <th style={{ textAlign: 'end' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No results found for this filter.
                </td>
              </tr>
            ) : (
              filteredResults.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: '220px' }}>
                    <span style={{ fontWeight: 600 }}>{row.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {row.id} · {row.community} · {row.agent}
                    </span>
                  </td>
                  <td>{getOutcomeBadge(row.outcome)}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{row.closedDate}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{row.guide}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.reserve}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{row.closingPrice}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600, color: row.againstReserveColor }}>
                    {row.againstReserve}
                  </td>
                  <td>{row.offersCount}</td>
                  <td>
                    <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {row.outcomeCategory === 'withdrawn' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRelist(row.id)}
                        >
                          Relist
                        </button>
                      )}

                      {row.outcomeCategory === 'sold' && (
                        <NavLink className="btn btn-ghost btn-sm" to="/rto/cheques">
                          Cheques
                        </NavLink>
                      )}

                      {row.outcomeCategory === 'reserve_not_met' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleNegotiate(row.id, row.topBidder)}
                          >
                            Negotiate with {row.topBidder}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleRelist(row.id)}
                          >
                            Relist
                          </button>
                        </>
                      )}
                    </div>
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
