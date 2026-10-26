import React, { useState, useEffect } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
  Eye,
  X,
  Star,
  Zap,
  Award,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { teamMembers } from '../../data/mockData';

function formatVolume(amount) {
  if (!amount || amount === 0) return 'AED 0';
  const num = Number(amount);
  if (isNaN(num)) return `AED ${amount}`;
  if (num >= 1_000_000) {
    const formatted = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `AED ${formatted}M`;
  }
  if (num >= 1_000) {
    const formatted = (num / 1_000).toFixed(0);
    return `AED ${formatted}K`;
  }
  return `AED ${num.toLocaleString('en-AE')}`;
}

export default function AgentSummaryPage() {
  const { id } = useParams();
  const { authToken, account, isLiveData, isMockData } = useApp();
  const [activeTab, setActiveTab] = useState('Overview');
  const [isAwayMode, setIsAwayMode] = useState(false);
  const [isTogglingAway, setIsTogglingAway] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Agent profile state
  const [agent, setAgent] = useState({
    id: id || '',
    name: 'Agent',
    initials: 'AG',
    email: '—',
    phone: '—',
    role: 'Agent',
    brn: '',
    verificationStatus: 'UNVERIFIED',
    isVerified: false,
    tier: 'Rising',
    score: null,
    rating: null,
    reviewsCount: 0,
    unattended: 0,
    responseRate: 100,
    liveListings: 0,
    claimedDeals: 0,
    unclaimedDeals: 0,
    totalDeals: 0,
    closedSalesVolume: 0,
    avgResponseTime: null,
    leadsHandled: 0,
    reviews: []
  });

  useEffect(() => {
    // 1. Mock Data Mode: populate rich demo data
    if (isMockData) {
      let found = null;
      if (id) {
        found = teamMembers.find((m) => m.id === id || String(m.id) === String(id));
      }
      if (!found && account) {
        found = {
          name: account.fullName || account.name || 'Agent',
          email: account.email || 'agent@example.com',
          role: account.role?.name || account.role || 'Agent',
          brn: account.compliance?.brn || account.brn || '50318',
          verified: true
        };
      }
      const agentName = found?.name || found?.fullName || 'Moiz Mmm';
      const initials = agentName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'MM';

      setAgent({
        id: id || 'mock-agent',
        name: agentName,
        initials,
        email: found?.email || 'moiz@example.com',
        phone: found?.phone || '+971 50 123 4567',
        role: found?.role || 'Agent',
        brn: found?.brn || '50318',
        verificationStatus: 'VERIFIED',
        isVerified: true,
        tier: 'Elite',
        score: 750,
        rating: 5.0,
        reviewsCount: 2,
        unattended: 0,
        responseRate: 100,
        liveListings: 4,
        claimedDeals: 1,
        unclaimedDeals: 6,
        totalDeals: 7,
        closedSalesVolume: 18400000,
        avgResponseTime: '11 mins',
        leadsHandled: 142,
        reviews: [
          {
            author: 'Tareq Al-Hashemi',
            date: '14 Sep 2026',
            rating: 5,
            comment: `Very prompt and professional. ${agentName} answered within 5 minutes and arranged the viewing the same day.`
          }
        ]
      });
      setIsLoading(false);
      return;
    }

    // 2. Live Data Mode: fetch real member summary
    setIsLoading(true);
    const targetId = id || account?.id || account?._id;

    cmpConnectApi.getMemberSummary(targetId, authToken)
      .then((res) => {
        const sumData = res?.data;
        if (sumData && sumData.member) {
          const m = sumData.member;
          const name = m.fullName || m.name || 'Agent';
          const initials = name
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'AG';

          setIsAwayMode(Boolean(sumData.awayMode?.active));

          setAgent({
            id: m.id || targetId || '',
            name,
            initials,
            email: m.email || '—',
            phone: m.mobile || '—',
            role: m.role?.name || (typeof m.role === 'string' ? m.role : 'Agent'),
            brn: m.brn || '',
            verificationStatus: m.verificationStatus || (m.brn ? 'VERIFIED' : 'UNVERIFIED'),
            isVerified: Boolean(m.verified || m.verificationStatus === 'VERIFIED'),
            tier: sumData.elite?.level || 'Rising',
            score: sumData.agentScore != null ? sumData.agentScore : null,
            rating: sumData.feedback?.averageRating != null ? sumData.feedback.averageRating : null,
            reviewsCount: sumData.feedback?.ratingsCount || 0,
            unattended: sumData.feedback?.unattendedEnquiries || 0,
            responseRate: sumData.responseRate?.overall != null ? sumData.responseRate.overall : null,
            liveListings: sumData.liveProperties?.total || 0,
            claimedDeals: sumData.transactions12m?.claimed || 0,
            unclaimedDeals: sumData.transactions12m?.notClaimed || 0,
            totalDeals: sumData.transactions12m?.total || 0,
            closedSalesVolume: 0,
            avgResponseTime: null,
            listingQuality: sumData.liveProperties?.listingQuality || null
          });
          return;
        }
        throw new Error('No summary payload');
      })
      .catch(() => {
        // Fallback to individual endpoints if summary endpoint is not populated yet
        Promise.allSettled([
          cmpConnectApi.listMembers({ limit: 100 }, authToken),
          cmpConnectApi.listListings({ agentId: targetId, limit: 100 }, authToken),
          cmpConnectApi.listTransactions({ agentId: targetId, limit: 100 }, authToken)
        ]).then(([membersRes, listingsRes, txRes]) => {
          let member = null;
          if (membersRes.status === 'fulfilled' && Array.isArray(membersRes.value?.data)) {
            member = membersRes.value.data.find(
              (m) => m.id === targetId || m._id === targetId || String(m.id) === String(targetId) || String(m._id) === String(targetId)
            );
          }
          if (!member && account && (account.id === targetId || account._id === targetId || !id)) {
            member = account;
          }

      const name = member?.fullName || member?.name || `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || 'Agent';
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'AG';
      const isVerified = member?.verificationStatus === 'VERIFIED';
      const brn = member?.compliance?.brn || member?.brn || '';

      // Live listings count for this agent
      let liveListingsCount = 0;
      if (listingsRes.status === 'fulfilled') {
        const listingsData = listingsRes.value?.data || [];
        if (listingsRes.value?.counts?.live != null) {
          liveListingsCount = Number(listingsRes.value.counts.live);
        } else {
          liveListingsCount = listingsData.filter((l) => {
            const isLive = String(l.status || '').toUpperCase() === 'LIVE';
            if (!isLive) return false;
            if (!targetId) return true;
            const aId = l.agent?.id || l.agent?._id || l.agentId;
            return !aId || String(aId) === String(targetId);
          }).length;
        }
      }

      // Transactions for this agent
      let serverDeals = [];
      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)) {
        serverDeals = txRes.value.data;
      }

      // Local unclaimed deals
      let localUnclaimed = [];
      try {
        localUnclaimed = JSON.parse(localStorage.getItem('cmp_unclaimed_transactions') || '[]');
      } catch {}

      const agentUnclaimed = localUnclaimed.filter((u) => {
        if (!targetId) return true;
        const aId = u.agent?.id || u.agent?._id || u.agentId;
        return aId ? String(aId) === String(targetId) : (account?.id && String(account.id) === String(targetId));
      });

      const combinedDeals = [
        ...agentUnclaimed.filter((u) => !serverDeals.some((s) => s.id === u.id || s.listing?.id === u.listingId)),
        ...serverDeals
      ];

      const claimedCount = combinedDeals.filter(
        (d) => d.status === 'APPROVED' || d.status === 'UNDER_REVIEW' || d.claimStatus === 'Approved' || d.claimStatus === 'Under review'
      ).length;

      const unclaimedCount = combinedDeals.filter(
        (d) => d.status === 'UNCLAIMED' || d.claimStatus === 'Not claimed'
      ).length;

      const totalDeals = claimedCount + unclaimedCount;

      const closedVolume = combinedDeals
        .filter((d) => d.status === 'APPROVED' || d.status === 'UNDER_REVIEW' || d.claimStatus === 'Approved' || d.claimStatus === 'Under review')
        .reduce((acc, d) => {
          const price = Number(d.finalPrice || d.price || 0);
          return acc + (isNaN(price) ? 0 : price);
        }, 0);

      setAgent({
        id: targetId || '',
        name,
        initials,
        email: member?.email || '—',
        phone: member?.mobile || member?.phone || '—',
        role: member?.role?.name || (typeof member?.role === 'string' ? member.role : 'Agent'),
        brn,
        verificationStatus: member?.verificationStatus || 'UNVERIFIED',
        isVerified,
        tier: isVerified ? 'Verified Broker' : 'Rising',
        score: null,
        rating: null,
        reviewsCount: 0,
        unattended: 0,
        responseRate: 100,
        liveListings: liveListingsCount,
        claimedDeals: claimedCount,
        unclaimedDeals: unclaimedCount,
        totalDeals,
        closedSalesVolume: closedVolume,
        avgResponseTime: null,
        leadsHandled: 0,
        reviews: []
      });
    });
  }).catch((err) => {
    console.warn('[AgentSummaryPage] Error fetching agent summary:', err);
  }).finally(() => {
    setIsLoading(false);
  });
  }, [id, authToken, account, isLiveData, isMockData]);

  // Compute transactions donut stroke lengths
  const total = agent.totalDeals || 0;
  const claimed = agent.claimedDeals || 0;
  const unclaimed = agent.unclaimedDeals || 0;
  const circumference = 339.3;
  const claimedDash = total > 0 ? (claimed / total) * circumference : 0;
  const unclaimedDash = total > 0 ? (unclaimed / total) * circumference : 0;

  return (
    <div>
      {/* Top Agent View Banner */}
      <div className="row" style={{ justifyContent: 'center', marginTop: '-12px', marginBottom: '14px' }}>
        <span
          className="row"
          style={{
            gap: '10px',
            padding: '6px 14px',
            borderRadius: '0 0 10px 10px',
            background: 'var(--cmp-brand)',
            color: 'var(--cmp-text-on-brand)',
            fontSize: '13.5px',
            fontWeight: 600,
            alignItems: 'center'
          }}
        >
          <Eye size={15} />
          <span>Agent summary: {agent.name}</span>
          <NavLink
            to="/team"
            aria-label="Exit agent view"
            style={{ display: 'inline-flex', color: 'inherit', marginLeft: '6px' }}
          >
            <X size={15} />
          </NavLink>
        </span>
      </div>

      {/* Main Header & Controls */}
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}
      >
        <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
          Agent summary
        </h1>
        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${isAwayMode ? 'btn-primary' : 'btn-outline'}`}
            disabled={isTogglingAway}
            onClick={async () => {
              const targetId = id || account?.id || account?._id;
              if (!targetId) return;
              const nextAway = !isAwayMode;
              setIsTogglingAway(true);
              try {
                if (authToken) {
                  await cmpConnectApi.setMemberAway(targetId, nextAway, authToken);
                }
                setIsAwayMode(nextAway);
              } catch (err) {
                alert(err.message || 'Failed to toggle away mode.');
              } finally {
                setIsTogglingAway(false);
              }
            }}
            style={{ gap: '6px' }}
          >
            <span>Away mode: {isAwayMode ? 'Active' : 'Off'}</span>
            <Calendar size={14} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
          Loading agent summary...
        </div>
      ) : (
        <>
          {/* Segmented Tab List */}
          <div role="tablist" className="segmented" style={{ marginBottom: '18px' }}>
            {['Overview', 'Agent Performance', 'Customer Feedback'].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Top Row: Score/Compliance Card + Customer Feedback */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(260px, 1fr)', gap: '16px' }}>
                {/* Score & Standing */}
                <section
                  className="card row"
                  style={{
                    padding: '20px',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                >
                  {isLiveData ? (
                    <div style={{ flex: '1 1 240px' }}>
                      <div className="row" style={{ gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <h2 style={{ fontSize: '20px', margin: 0 }}>
                          {agent.name}
                        </h2>
                        {agent.isVerified ? (
                          <span
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                          >
                            <CheckCircle size={13} /> Verified Broker
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '12px' }}>
                            Verification Pending
                          </span>
                        )}
                      </div>
                      <p className="muted" style={{ margin: '0 0 14px', fontSize: '13.5px' }}>
                        {agent.brn ? `BRN: ${agent.brn} · ` : ''}
                        {agent.role} · {agent.email}
                      </p>
                      <div className="row" style={{ gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-text)' }}>
                            {agent.liveListings}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            Active live properties
                          </span>
                        </div>
                        <div style={{ height: '32px', width: '1px', background: 'var(--cmp-border)' }} />
                        <div>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                            {agent.claimedDeals}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            Closed transactions
                          </span>
                        </div>
                        <div style={{ flex: '1 1 120px' }}>
                          <p className="faint" style={{ margin: '0 0 4px', fontSize: '12px' }}>
                            Compliance & standing
                          </p>
                          <div
                            className="meter"
                            style={{
                              height: '8px',
                              borderRadius: '999px',
                              background: 'var(--cmp-surface-sunken)',
                              border: '1px solid var(--cmp-border)',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: agent.isVerified ? '100%' : '25%',
                                height: '100%',
                                background: agent.isVerified ? 'var(--cmp-success)' : 'var(--cmp-warning)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ flex: '1 1 240px' }}>
                      <h2 style={{ fontSize: '20px', margin: 0 }}>
                        Congratulations {agent.name}!
                      </h2>
                      <p className="muted" style={{ margin: '4px 0 14px', fontSize: '14px' }}>
                        Well done! You are currently at <strong>Elite level</strong>.
                      </p>
                      <div className="row" style={{ gap: '16px', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                            {agent.score}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            Agent score / 1000
                          </span>
                        </div>
                        <div style={{ flex: '1 1' }}>
                          <p className="faint" style={{ margin: '0 0 4px', fontSize: '12px' }}>
                            Great job! Keep it up
                          </p>
                          <div
                            className="meter"
                            style={{
                              height: '8px',
                              borderRadius: '999px',
                              background: 'var(--cmp-surface-sunken)',
                              border: '1px solid var(--cmp-border)',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${(agent.score / 1000) * 100}%`,
                                height: '100%',
                                background: 'var(--cmp-brand)'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Avatar Badge */}
                  <div style={{ position: 'relative', width: '84px', height: '84px', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--cmp-brand-subtle)',
                        color: 'var(--cmp-brand)',
                        fontWeight: 700,
                        fontSize: '28px'
                      }}
                    >
                      {agent.initials}
                    </div>
                    {isLiveData ? (
                      agent.isVerified && (
                        <span
                          title="CMP Verified Broker"
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--cmp-success)',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            border: '2px solid var(--cmp-surface)'
                          }}
                        >
                          <CheckCircle size={18} />
                        </span>
                      )
                    ) : (
                      <span
                        title="Elite agent"
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--cmp-accent)',
                          color: 'var(--cmp-text-on-accent)',
                          display: 'grid',
                          placeItems: 'center',
                          border: '2px solid var(--cmp-surface)'
                        }}
                      >
                        <Award size={18} />
                      </span>
                    )}
                  </div>
                </section>

                {/* Customer Feedback Tile */}
                <section className="card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '15px', margin: 0, textDecoration: 'underline dotted', textUnderlineOffset: '4px' }}>
                    Customer feedback
                  </h2>
                  <p style={{ margin: '14px 0 0', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800 }}>{agent.unattended}</span>
                    <span className="muted" style={{ fontSize: '13px' }}>Unattended enquiry</span>
                  </p>
                  {isLiveData ? (
                    <p className="muted" style={{ margin: '6px 0 0', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={14} style={{ color: 'var(--cmp-text-faint)' }} />
                      <span>{agent.reviewsCount > 0 ? `${agent.rating} rating · ${agent.reviewsCount} verified reviews` : 'No verified client reviews yet'}</span>
                    </p>
                  ) : (
                    <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} style={{ fill: 'var(--cmp-warning)', color: 'var(--cmp-warning)' }} />
                      <span><strong>5.0</strong> rating · 2 verified client reviews</span>
                    </p>
                  )}
                </section>
              </div>

              {/* Bottom Row: Response rate SVG line chart + Properties donut + Transactions donut */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) repeat(2, minmax(220px, 1fr))', gap: '16px' }}>
                {/* Response Rate Chart */}
                <section className="card" style={{ padding: '20px' }}>
                  <h2 style={{ fontSize: '15px', margin: '0 0 12px' }}>Response rate</h2>
                  <div style={{ position: 'relative' }}>
                    <svg viewBox="0 0 760 180" width="100%" role="img" aria-label="Response rate timeline">
                      <line x1="48" x2="744" y1="150" y2="150" stroke="var(--cmp-border)" strokeWidth="1" />
                      <text x="40" y="154" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">0%</text>

                      <line x1="48" x2="744" y1="85" y2="85" stroke="var(--cmp-border)" strokeWidth="1" />
                      <text x="40" y="89" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">50%</text>

                      <line x1="48" x2="744" y1="20" y2="20" stroke="var(--cmp-border)" strokeWidth="1" />
                      <text x="40" y="24" textAnchor="end" fontSize="11" fill="var(--cmp-text-faint)">100%</text>

                      {/* Gradient Area */}
                      <path
                        d="M48,45 L120,40 L200,38 L300,35 L400,32 L500,28 L600,26 L744,22 L744,150 L48,150 Z"
                        fill="var(--cmp-brand)"
                        opacity="0.12"
                      />
                      {/* Line */}
                      <path
                        d="M48,45 L120,40 L200,38 L300,35 L400,32 L500,28 L600,26 L744,22"
                        fill="none"
                        stroke="var(--cmp-brand)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx="744" cy="22" r="4.5" fill="var(--cmp-brand)" stroke="var(--cmp-surface)" strokeWidth="2" />
                    </svg>
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', marginTop: '6px', fontSize: '13.5px' }}>
                    <span>Overall agent response rate: <strong>{agent.responseRate != null ? `${agent.responseRate}%` : '—'}</strong></span>
                    {isLiveData ? (
                      <span className="badge badge-neutral">Standard</span>
                    ) : (
                      <span className="badge badge-success">Top 5% in Dubai</span>
                    )}
                  </div>

                  <div
                    className="card row"
                    style={{
                      margin: '12px 0 0',
                      padding: '10px 14px',
                      gap: '8px',
                      fontSize: '13.5px',
                      background: 'var(--cmp-surface-sunken)',
                      border: 'none',
                      alignItems: 'center'
                    }}
                  >
                    <Zap size={16} style={{ color: 'var(--cmp-accent)', flexShrink: 0 }} />
                    <span>
                      {isLiveData
                        ? 'Quick response times improve lead conversion and portal reach.'
                        : 'Great job! Your quick response time drives higher portal conversions.'}
                    </span>
                  </div>
                </section>

                {/* Live Properties Donut */}
                <section className="card" style={{ padding: '20px', display: 'grid', gap: '12px', alignContent: 'space-between' }}>
                  <h2 style={{ fontSize: '15px', margin: 0 }}>Live properties</h2>
                  <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                    <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="65" cy="65" r="54" fill="none" stroke="var(--cmp-surface-sunken)" strokeWidth="18" />
                      {agent.liveListings > 0 && (
                        <circle
                          cx="65"
                          cy="65"
                          r="54"
                          fill="none"
                          stroke="var(--cmp-accent)"
                          strokeWidth="18"
                          strokeDasharray="339.3 339.3"
                          strokeDashoffset="0"
                        />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: '24px', fontWeight: 800 }}>{agent.liveListings}</span>
                      <span className="faint" style={{ fontSize: '11px' }}>Total</span>
                    </div>
                  </div>

                  <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '10px', flexWrap: 'wrap', fontSize: '12px', justifyContent: 'center' }}>
                    <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-accent)' }} />
                      <span className="muted">Standard: <strong>{agent.liveListings}</strong></span>
                    </li>
                    <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
                      <span className="muted">Featured: <strong>0</strong></span>
                    </li>
                    <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-text-faint)' }} />
                      <span className="muted">Premium: <strong>0</strong></span>
                    </li>
                  </ul>

                  <NavLink to="/properties" className="btn btn-outline btn-sm">
                    View properties
                  </NavLink>
                </section>

                {/* Transactions Donut */}
                <section className="card" style={{ padding: '20px', display: 'grid', gap: '12px', alignContent: 'space-between' }}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '15px', margin: 0 }}>Transactions</h2>
                    <span className="faint" style={{ fontSize: '11px' }}>Last 12 mos</span>
                  </div>

                  <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
                    <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="65" cy="65" r="54" fill="none" stroke="var(--cmp-surface-sunken)" strokeWidth="18" />
                      {total > 0 && claimed > 0 && (
                        <circle
                          cx="65"
                          cy="65"
                          r="54"
                          fill="none"
                          stroke="var(--cmp-brand)"
                          strokeWidth="18"
                          strokeDasharray={`${claimedDash} ${circumference}`}
                          strokeDashoffset="0"
                        />
                      )}
                      {total > 0 && unclaimed > 0 && (
                        <circle
                          cx="65"
                          cy="65"
                          r="54"
                          fill="none"
                          stroke="var(--cmp-border-strong, #ccc)"
                          strokeWidth="18"
                          strokeDasharray={`${unclaimedDash} ${circumference}`}
                          strokeDashoffset={`${-claimedDash}`}
                        />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', textAlign: 'center' }}>
                      <span style={{ fontSize: '24px', fontWeight: 800 }}>{total}</span>
                      <span className="faint" style={{ fontSize: '11px' }}>Total deals</span>
                    </div>
                  </div>

                  <ul className="row" style={{ listStyle: 'none', margin: 0, padding: 0, gap: '12px', flexWrap: 'wrap', fontSize: '12px', justifyContent: 'center' }}>
                    <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-brand)' }} />
                      <span className="muted">Claimed: <strong>{claimed}</strong></span>
                    </li>
                    <li className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cmp-border-strong, #ccc)' }} />
                      <span className="muted">Not claimed: <strong>{unclaimed}</strong></span>
                    </li>
                  </ul>

                  <NavLink to="/transactions" className="btn btn-outline btn-sm">
                    Claim transactions
                  </NavLink>
                </section>
              </div>
            </div>
          )}

          {/* Tab 2: Agent Performance */}
          {activeTab === 'Agent Performance' && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Performance metrics</h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '14px' }}>
                Historical deal volume, speed to answer calls, and lead conversion rates.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                  <span className="faint" style={{ fontSize: '12px' }}>Avg response time</span>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                    {isLiveData ? (agent.avgResponseTime || '—') : '11 mins'}
                  </p>
                  {isLiveData && (
                    <span className="faint" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Portal tracking active
                    </span>
                  )}
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                  <span className="faint" style={{ fontSize: '12px' }}>Total leads handled</span>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800 }}>
                    {isLiveData ? (agent.leadsHandled != null ? agent.leadsHandled : '0') : '142'}
                  </p>
                  {isLiveData && (
                    <span className="faint" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      All portal enquiries
                    </span>
                  )}
                </div>
                <div className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                  <span className="faint" style={{ fontSize: '12px' }}>Closed sales volume</span>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800 }}>
                    {isLiveData ? formatVolume(agent.closedSalesVolume) : 'AED 18.4M'}
                  </p>
                  {isLiveData && (
                    <span className="faint" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      Approved & recorded deals
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Customer Feedback */}
          {activeTab === 'Customer Feedback' && (
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Client ratings and testimonials</h2>
              <p className="muted" style={{ margin: '0 0 20px', fontSize: '14px' }}>
                All verified ratings received from buyers and tenants who enquired with {agent.name}.
              </p>
              {agent.reviews && agent.reviews.length > 0 ? (
                <div style={{ display: 'grid', gap: '14px' }}>
                  {agent.reviews.map((rev, idx) => (
                    <div key={idx} className="card" style={{ padding: '16px', background: 'var(--cmp-surface-sunken)' }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong>{rev.author}</strong>
                        <span className="faint" style={{ fontSize: '12px' }}>{rev.date}</span>
                      </div>
                      <div className="row" style={{ gap: '4px', marginBottom: '8px' }}>
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} size={13} style={{ fill: 'var(--cmp-warning)', color: 'var(--cmp-warning)' }} />
                        ))}
                      </div>
                      <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
                        {`"${rev.comment}"`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--cmp-surface-sunken)',
                    borderRadius: '8px',
                    display: 'grid',
                    placeItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'var(--cmp-surface)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--cmp-text-faint)'
                    }}
                  >
                    <Star size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>No client reviews yet</h3>
                  <p className="muted" style={{ margin: 0, maxWidth: '440px', fontSize: '13px', lineHeight: 1.5 }}>
                    Verified ratings from buyers and tenants will appear here after viewings and deals are completed with {agent.name}.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
