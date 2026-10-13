import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  ChevronDown,
  ArrowRight,
  Clock,
  BookOpen,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedGuides, setExpandedGuides] = useState({ 1: true });

  const categories = ['All', 'Listings', 'Leads', 'Credits', 'Agents', 'Transactions'];

  const guides = [
    {
      id: 1,
      category: 'Listings',
      time: '4 min',
      title: 'List your first property',
      steps: [
        'Choose who the property is listed under (assigned agent)',
        'Pick purpose (Sale / Rent) and property type (Apartment / Villa)',
        'Add the official DLD permit and high-resolution photos',
        'Review quality score and publish'
      ],
      link: '/properties/new'
    },
    {
      id: 2,
      category: 'Listings',
      time: '3 min',
      title: 'Clear your pending actions',
      steps: [
        'Review expired or expiring Form A permits',
        'Address low quality score listing recommendations',
        'Update prices and re-verify compliance'
      ],
      link: '/properties'
    },
    {
      id: 3,
      category: 'Leads',
      time: '5 min',
      title: 'Answer leads faster',
      steps: [
        'Enable portal email & push notifications in Account preferences',
        'Use quick-reply WhatsApp message templates',
        'Aim for under 15 minutes response time to unlock Elite agent status'
      ],
      link: '/clients/enquiries'
    },
    {
      id: 4,
      category: 'Credits',
      time: '6 min',
      title: 'Get more from your credits',
      steps: [
        'Check your credits expiry dates (30-day rollover balance)',
        'Activate Smart Boost on units with 80+ quality score',
        'Bid on Community Spotlight slots during peak weekend traffic'
      ],
      link: '/growth/smart-boost'
    },
    {
      id: 5,
      category: 'Agents',
      time: '4 min',
      title: 'Become a Top Agent',
      steps: [
        'Complete 100% of your public bio and upload a broker headshot',
        'Verify your Dubai Land Department BRN license and expiry date',
        'Keep unattended enquiries at zero'
      ],
      link: '/team'
    },
    {
      id: 6,
      category: 'Transactions',
      time: '3 min',
      title: 'Claim a transaction',
      steps: [
        'Open Closed deals in the Transactions hub',
        'Search the property reference or buyer name',
        'Upload proof of transfer to claim your agency commission credits'
      ],
      link: '/transactions'
    }
  ];

  const toggleSteps = (id) => {
    setExpandedGuides((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredGuides = guides.filter((g) => {
    if (selectedCategory === 'All') return true;
    return g.category === selectedCategory;
  });

  return (
    <div>
      {/* Top Header */}
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
            CMP Academy
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px', maxWidth: '820px' }}>
            Short step-by-step guides to get more enquiries, maintain compliance, and close deals faster on CMP Connect.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <NavLink to="/help/whats-new" className="btn btn-outline btn-sm">
            What’s new in CMP
          </NavLink>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className="chip"
            aria-pressed={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Guides Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredGuides.map((item) => {
          const isExpanded = !!expandedGuides[item.id];
          return (
            <article
              key={item.id}
              className="card"
              style={{
                padding: '20px',
                display: 'grid',
                gap: '12px',
                alignContent: 'start',
                transition: 'border-color var(--cmp-duration-fast) var(--cmp-ease)'
              }}
            >
              <div className="row faint" style={{ gap: '8px', fontSize: '12px', alignItems: 'center' }}>
                <GraduationCap size={15} style={{ color: 'var(--cmp-brand)' }} />
                <span>{item.category} · {item.time} read</span>
              </div>

              <h2 style={{ fontSize: '17px', margin: 0 }}>{item.title}</h2>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => toggleSteps(item.id)}
                aria-expanded={isExpanded}
                style={{ width: 'fit-content', padding: 0, gap: '4px', color: 'var(--cmp-text-muted)' }}
              >
                <span>{isExpanded ? 'Hide steps' : 'Show steps'}</span>
                <ChevronDown
                  size={14}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {isExpanded && (
                <ol
                  style={{
                    margin: '4px 0 6px',
                    paddingLeft: '20px',
                    display: 'grid',
                    gap: '6px',
                    fontSize: '13.5px',
                    color: 'var(--cmp-text)'
                  }}
                >
                  {item.steps.map((step, idx) => (
                    <li key={idx} style={{ lineHeight: 1.4 }}>{step}</li>
                  ))}
                </ol>
              )}

              <NavLink
                to={item.link}
                className="btn btn-primary btn-sm"
                style={{ width: 'fit-content', marginTop: '4px', gap: '6px' }}
              >
                <span>Open in CMP Connect</span>
                <ArrowRight size={13} />
              </NavLink>
            </article>
          );
        })}
      </div>
    </div>
  );
}
