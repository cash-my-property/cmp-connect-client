import React, { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, Calculator, Plus, ChevronDown, Copy, Check, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const initialBoostItems = [
  {
    id: 'CMP-S-001002',
    location: 'Dubai, Downtown Dubai',
    opportunity: 'Good',
    opportunityLevel: 'good',
    agent: 'Layla Haddad',
    currentRank: '26 to 50',
    predictedRank: '1 to 10',
    currentLeadClicks: 'Up to 5',
    predictedLeadClicks: 'Up to 15',
    recommendationTitle: 'Premium for 15 days',
    recommendationSub: '304 credits · now featured',
    requiredCredits: 304,
    status: 'unboosted'
  },
  {
    id: 'CMP-S-001005',
    location: 'Dubai, Dubai Hills Estate',
    opportunity: 'Good',
    opportunityLevel: 'good',
    agent: 'Arjun Mehta',
    currentRank: '100+',
    predictedRank: '26 to 50',
    currentLeadClicks: 'Up to 3',
    predictedLeadClicks: 'Up to 6',
    recommendationTitle: 'Featured for 30 days',
    recommendationSub: '336 credits · now standard',
    requiredCredits: 336,
    status: 'unboosted'
  },
  {
    id: 'CMP-S-001001',
    location: 'Dubai, Dubai Marina',
    opportunity: 'Excellent',
    opportunityLevel: 'excellent',
    agent: 'Karim Saleh',
    currentRank: '15 to 25',
    predictedRank: 'Top 3',
    currentLeadClicks: '8',
    predictedLeadClicks: 'Up to 24',
    recommendationTitle: 'Spotlight for 7 days',
    recommendationSub: '450 credits · high search volume',
    requiredCredits: 450,
    status: 'unboosted'
  }
];

export default function SmartBoostPage() {
  const { agency, isLiveData } = useApp();
  const [items, setItems] = useState(() => (isLiveData ? [] : initialBoostItems));

  useEffect(() => {
    setItems(isLiveData ? [] : initialBoostItems);
  }, [isLiveData]);

  const [activeTab, setActiveTab] = useState('suggestions'); // 'suggestions' | 'results'
  const [opportunityFilter, setOpportunityFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('');
  const [communityFilter, setCommunityFilter] = useState('All');
  const [copiedId, setCopiedId] = useState(null);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBoost = (id, credits) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'boosted' } : item
      )
    );
    showNotice(`Listing ${id} successfully boosted using ${credits} credits.`);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === 'suggestions' && item.status === 'boosted') return false;
      if (activeTab === 'results' && item.status !== 'boosted') return false;

      if (opportunityFilter !== 'all' && item.opportunityLevel !== opportunityFilter) return false;
      if (communityFilter !== 'All' && !item.location.toLowerCase().includes(communityFilter.toLowerCase())) return false;
      if (budgetFilter && item.requiredCredits > Number(budgetFilter)) return false;

      return true;
    });
  }, [items, activeTab, opportunityFilter, communityFilter, budgetFilter]);

  const counts = {
    all: items.filter((i) => activeTab === 'suggestions' ? i.status !== 'boosted' : i.status === 'boosted').length,
    excellent: items.filter((i) => i.opportunityLevel === 'excellent' && (activeTab === 'suggestions' ? i.status !== 'boosted' : i.status === 'boosted')).length,
    good: items.filter((i) => i.opportunityLevel === 'good' && (activeTab === 'suggestions' ? i.status !== 'boosted' : i.status === 'boosted')).length,
    low: 0
  };

  return (
    <div>
      {/* Title & Actions */}
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
          <h1 style={{ fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={22} style={{ color: 'var(--cmp-brand)' }} /> Smart Boost
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            AI algorithmic recommendations to maximize lead clicks on your available credit balance.
          </p>
        </div>
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <NavLink to="/wallet" className="btn btn-outline btn-sm">
            <Calculator size={16} />
            <span>Calculate credits</span>
          </NavLink>
          <NavLink to="/wallet" className="btn btn-accent btn-sm">
            <Plus size={16} />
            <span>Add credits</span>
          </NavLink>
        </div>
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

      {/* Segmented Tabs */}
      <div className="segmented" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'suggestions'}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
        >
          Results ({items.filter((i) => i.status === 'boosted').length})
        </button>
      </div>

      {/* Filter Box with gradient banner */}
      <section
        className="card"
        style={{
          padding: '18px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, var(--cmp-brand-subtle), var(--cmp-accent-subtle))'
        }}
      >
        <p className="row" style={{ margin: '0 0 12px', gap: '6px', fontWeight: 700 }}>
          <Zap size={16} style={{ color: 'var(--cmp-brand)' }} />
          <span>Filter listings by</span>
          <span className="faint" style={{ fontWeight: 500 }}>Optional</span>
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            alignItems: 'end'
          }}
        >
          <div>
            <label htmlFor="opt-budget">Credits to optimize</label>
            <input
              id="opt-budget"
              inputMode="numeric"
              placeholder="e.g. 500"
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value)}
              style={{ height: '40px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label>Community</label>
            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              style={{ height: '40px', fontSize: '13px' }}
            >
              <option value="All">All communities</option>
              <option value="Downtown">Downtown Dubai</option>
              <option value="Dubai Hills">Dubai Hills Estate</option>
              <option value="Marina">Dubai Marina</option>
            </select>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ height: '40px' }}
              onClick={() => {
                setBudgetFilter('');
                setCommunityFilter('All');
                setOpportunityFilter('all');
              }}
            >
              Clear all
            </button>
          </div>
        </div>

        <p className="muted" style={{ margin: '10px 0 0', fontSize: '13px' }}>
          Available credits: <strong>{agency.credits.toLocaleString()}</strong>, expire in {agency.creditsExpiryDays}d
        </p>
      </section>

      {/* Opportunity filter chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={opportunityFilter === 'all'}
          onClick={() => setOpportunityFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={opportunityFilter === 'excellent'}
          onClick={() => setOpportunityFilter('excellent')}
        >
          Excellent opportunity ({counts.excellent})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={opportunityFilter === 'good'}
          onClick={() => setOpportunityFilter('good')}
        >
          Good opportunity ({counts.good})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={opportunityFilter === 'low'}
          onClick={() => setOpportunityFilter('low')}
        >
          Low opportunity ({counts.low})
        </button>
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Listing reference</th>
              <th>Opportunity</th>
              <th>Agent</th>
              <th>Predicted ranking</th>
              <th>Predicted lead clicks</th>
              <th>Recommendation</th>
              <th style={{ textAlign: 'end' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  {isLiveData
                    ? 'No live listings recommended for smart boost at this time.'
                    : activeTab === 'results'
                    ? 'No boosted listings yet.'
                    : 'No listings matching this filter.'}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ minWidth: '200px' }}>
                    <span className="row" style={{ gap: '6px', display: 'inline-flex' }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id)}
                        title="Copy"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--cmp-text-faint)',
                          display: 'inline-flex'
                        }}
                      >
                        {copiedId === item.id ? <Check size={14} color="var(--cmp-brand)" /> : <Copy size={14} />}
                      </button>
                      <NavLink
                        to="/properties"
                        style={{
                          color: 'var(--cmp-brand)',
                          fontWeight: 600,
                          fontSize: '13px',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px'
                        }}
                      >
                        {item.id}
                      </NavLink>
                    </span>
                    <span className="muted" style={{ display: 'block', fontSize: '13px' }}>
                      {item.location}
                    </span>
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: item.opportunityLevel === 'excellent' ? 'var(--cmp-accent)' : 'var(--cmp-brand)',
                        border: '1px solid currentColor',
                        background: 'var(--cmp-brand-subtle)'
                      }}
                    >
                      {item.opportunity}
                    </span>
                  </td>

                  <td className="row" style={{ gap: '6px', whiteSpace: 'nowrap' }}>
                    <Star size={14} style={{ color: 'var(--cmp-accent)', fill: 'var(--cmp-accent)' }} />
                    {item.agent}
                  </td>

                  <td>
                    <strong style={{ color: 'var(--cmp-brand)' }}>{item.predictedRank}</strong>
                    <span className="badge badge-neutral" style={{ display: 'block', width: 'fit-content', marginTop: '4px' }}>
                      Now: {item.currentRank}
                    </span>
                  </td>

                  <td>
                    <strong style={{ color: 'var(--cmp-brand)' }}>{item.predictedLeadClicks}</strong>
                    <span className="badge badge-neutral" style={{ display: 'block', width: 'fit-content', marginTop: '4px' }}>
                      Now: {item.currentLeadClicks}
                    </span>
                  </td>

                  <td>
                    <strong style={{ color: 'var(--cmp-brand)' }}>{item.recommendationTitle}</strong>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {item.recommendationSub}
                    </span>
                  </td>

                  <td style={{ textAlign: 'end' }}>
                    {item.status === 'boosted' ? (
                      <span className="badge badge-brand">✓ Boost active</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ minWidth: '100px' }}
                        onClick={() => handleBoost(item.id, item.requiredCredits)}
                      >
                        Boost ({item.requiredCredits})
                      </button>
                    )}
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
