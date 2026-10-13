import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Search, CheckCircle, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

const initialEntries = [
  {
    id: 'CMP-L-004120',
    title: 'Duplex penthouse on the Palm',
    community: 'Palm Jumeirah',
    agent: 'Layla Haddad',
    status: 'Offers open',
    statusCategory: 'taking_offers',
    reserve: 'AED 12M',
    openingOffer: 'AED 9.5M',
    highestOffer: 'AED 12.4M',
    offersCount: 34,
    timing: 'Closes in Ended',
    actionType: 'live_desk'
  },
  {
    id: 'CMP-L-004121',
    title: 'Two bed on a high floor of Marina Gate',
    community: 'Dubai Marina',
    agent: 'Layla Haddad',
    status: 'Closing now',
    statusCategory: 'taking_offers',
    reserve: 'AED 2.6M',
    openingOffer: 'AED 2.1M',
    highestOffer: 'AED 2.48M',
    offersCount: 19,
    timing: 'Closes in Ended',
    actionType: 'live_desk'
  },
  {
    id: 'CMP-L-004122',
    title: 'Four bedroom family villa',
    community: 'Arabian Ranches',
    agent: 'Karim Saleh',
    status: 'Offers open',
    statusCategory: 'taking_offers',
    reserve: 'AED 5.9M',
    openingOffer: 'AED 4.8M',
    highestOffer: 'AED 5.65M',
    offersCount: 12,
    timing: 'Closes in 23h 51m',
    actionType: 'live_desk'
  },
  {
    id: 'CMP-L-004123',
    title: 'Three bed townhouse near the park',
    community: 'Dubai Hills Estate',
    agent: 'Emma Clarke',
    status: 'Opens soon',
    statusCategory: 'scheduled',
    reserve: 'AED 4.1M',
    openingOffer: 'AED 3.6M',
    highestOffer: '—',
    offersCount: 0,
    timing: 'Opens 20 Sep',
    actionType: 'scheduled'
  },
  {
    id: 'CMP-L-004098',
    title: 'One bed in The Address Residences',
    community: 'Downtown Dubai',
    agent: 'Layla Haddad',
    status: 'Sold',
    statusCategory: 'closed',
    reserve: 'AED 2.25M',
    openingOffer: 'AED 1.9M',
    highestOffer: 'AED 2.34M',
    offersCount: 27,
    timing: 'Closed 12 Sep',
    actionType: 'result'
  },
  {
    id: 'CMP-L-004076',
    title: 'Furnished studio with pool view',
    community: 'Jumeirah Village Circle',
    agent: 'Arjun Mehta',
    status: 'Reserve not met',
    statusCategory: 'closed',
    reserve: 'AED 720K',
    openingOffer: 'AED 560K',
    highestOffer: 'AED 690K',
    offersCount: 9,
    timing: 'Closed 10 Sep',
    actionType: 'result'
  },
  {
    id: 'CMP-L-004051',
    title: 'Canal view three bed with study',
    community: 'Business Bay',
    agent: 'Karim Saleh',
    status: 'Sold',
    statusCategory: 'closed',
    reserve: 'AED 3.4M',
    openingOffer: 'AED 2.9M',
    highestOffer: 'AED 3.61M',
    offersCount: 22,
    timing: 'Closed 30 Aug',
    actionType: 'result'
  },
  {
    id: 'CMP-L-004130',
    title: 'Garden apartment on the golf course',
    community: 'Jumeirah Golf Estates',
    agent: 'Emma Clarke',
    status: 'In review',
    statusCategory: 'in_review',
    reserve: 'AED 2.95M',
    openingOffer: 'AED 2.5M',
    highestOffer: '—',
    offersCount: 0,
    timing: 'Opens 22 Sep',
    actionType: 'in_review'
  },
  {
    id: 'CMP-L-004131',
    title: 'Four bed villa in The Springs',
    community: 'The Springs',
    agent: 'Arjun Mehta',
    status: 'Draft',
    statusCategory: 'drafts',
    reserve: 'AED 3.8M',
    openingOffer: 'AED 3.2M',
    highestOffer: '—',
    offersCount: 0,
    timing: 'Opens 27 Sep',
    actionType: 'draft'
  },
  {
    id: 'CMP-L-004112',
    title: 'One bed in JLT, owner withdrew',
    community: 'Jumeirah Lake Towers',
    agent: 'Karim Saleh',
    status: 'Withdrawn',
    statusCategory: 'closed',
    reserve: 'AED 1.1M',
    openingOffer: 'AED 900K',
    highestOffer: '—',
    offersCount: 0,
    timing: 'Closed 16 Sep',
    actionType: 'result'
  }
];

export default function EntriesPage() {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleWithdraw = (id) => {
    setEntries((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'Withdrawn', statusCategory: 'closed', actionType: 'result' } : item
      )
    );
    showNotice(`Property ${id} withdrawn from Real Time Offer.`);
  };

  const handleSubmitForReview = (id) => {
    setEntries((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'In review', statusCategory: 'in_review', actionType: 'in_review' } : item
      )
    );
    showNotice(`Property ${id} submitted for moderator review.`);
  };

  const handleDeleteDraft = (id) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
    showNotice(`Draft ${id} deleted.`);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const matchesFilter =
        filter === 'all' || item.statusCategory === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.community.toLowerCase().includes(q) ||
        item.agent.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [entries, filter, searchQuery]);

  const counts = {
    all: entries.length,
    drafts: entries.filter((e) => e.statusCategory === 'drafts').length,
    in_review: entries.filter((e) => e.statusCategory === 'in_review').length,
    scheduled: entries.filter((e) => e.statusCategory === 'scheduled').length,
    taking_offers: entries.filter((e) => e.statusCategory === 'taking_offers').length,
    closed: entries.filter((e) => e.statusCategory === 'closed').length
  };

  const getStatusBadge = (status) => {
    let dotBg = 'var(--cmp-text-faint)';
    if (status === 'Offers open') dotBg = 'var(--cmp-success)';
    if (status === 'Closing now') dotBg = 'var(--cmp-danger)';
    if (status === 'Sold') dotBg = 'var(--cmp-brand)';
    if (status === 'Opens soon' || status === 'In review') dotBg = 'var(--cmp-info)';

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
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Title & Actions */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px' }}>Entries</h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
            Every property your agency has entered for Real Time Offer, from draft to result.
          </p>
        </div>
        <NavLink to="/rto/new" className="btn btn-primary">
          <Plus size={16} />
          <span>Enter a property</span>
        </NavLink>
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

      {/* Filter Chips & Search Bar */}
      <div
        className="row"
        style={{
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          alignItems: 'center'
        }}
      >
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
          aria-pressed={filter === 'drafts'}
          onClick={() => setFilter('drafts')}
        >
          Drafts ({counts.drafts})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'in_review'}
          onClick={() => setFilter('in_review')}
        >
          In review ({counts.in_review})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'scheduled'}
          onClick={() => setFilter('scheduled')}
        >
          Scheduled ({counts.scheduled})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'taking_offers'}
          onClick={() => setFilter('taking_offers')}
        >
          Taking offers ({counts.taking_offers})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'closed'}
          onClick={() => setFilter('closed')}
        >
          Closed ({counts.closed})
        </button>

        <div style={{ marginInlineStart: 'auto', position: 'relative', minWidth: '260px' }}>
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
            placeholder="Search reference, property or agent"
            aria-label="Search entries"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '36px',
              paddingLeft: '34px',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Property</th>
              <th>Status</th>
              <th>Reserve</th>
              <th>Opening offer</th>
              <th>Highest offer</th>
              <th>Offers</th>
              <th>Timing</th>
              <th style={{ textAlign: 'end' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No properties found matching this criteria.
                </td>
              </tr>
            ) : (
              filteredEntries.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: '240px' }}>
                    <span style={{ fontWeight: 600 }}>{row.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {row.id} · {row.community} · {row.agent}
                    </span>
                  </td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.reserve}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.openingOffer}</td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{row.highestOffer}</td>
                  <td>{row.offersCount}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{row.timing}</td>
                  <td>
                    <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {row.actionType === 'live_desk' && (
                        <NavLink className="btn btn-outline btn-sm" to="/rto">
                          Live desk
                        </NavLink>
                      )}

                      {row.actionType === 'scheduled' && (
                        <>
                          <NavLink className="btn btn-ghost btn-sm" to="/rto">
                            Live desk
                          </NavLink>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleWithdraw(row.id)}
                          >
                            Withdraw
                          </button>
                        </>
                      )}

                      {row.actionType === 'result' && (
                        <NavLink className="btn btn-ghost btn-sm" to="/rto/results">
                          Result
                        </NavLink>
                      )}

                      {row.actionType === 'in_review' && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleWithdraw(row.id)}
                        >
                          Withdraw from review
                        </button>
                      )}

                      {row.actionType === 'draft' && (
                        <>
                          <NavLink className="btn btn-ghost btn-sm" to="/rto/new">
                            Edit
                          </NavLink>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSubmitForReview(row.id)}
                          >
                            Submit for review
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--cmp-danger)' }}
                            onClick={() => handleDeleteDraft(row.id)}
                          >
                            Delete
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
