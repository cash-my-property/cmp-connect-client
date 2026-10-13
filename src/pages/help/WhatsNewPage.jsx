import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Lightbulb,
  Search,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Sparkles,
  CheckCircle,
  FileText,
  Shield,
  Layers,
  X
} from 'lucide-react';

export default function WhatsNewPage() {
  const [activeTab, setActiveTab] = useState('Released'); // 'Released' | 'Coming soon'
  const [searchQuery, setSearchQuery] = useState('');
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [ideaText, setIdeaText] = useState('');

  const [features, setFeatures] = useState([
    {
      id: 'f1',
      title: 'Filters for every listing detail',
      date: '15 Sep 2026',
      badge: 'Listing Search',
      description: 'Filter your listings by agent, exposure, verification, completion, furnishing, size, expiry, owner and more, all from one streamlined panel.',
      link: '/properties',
      actionText: 'Try it now',
      helpfulCount: 20,
      unhelpfulCount: 2,
      userVote: null,
      tab: 'Released'
    },
    {
      id: 'f2',
      title: 'Create a PDF brochure in one click',
      date: '11 Sep 2026',
      badge: 'Brochure Generator',
      description: 'Open the menu on any listing and choose Create PDF for a branded A4 brochure with your agency watermark and agent’s direct contact QR code.',
      link: '/properties',
      actionText: 'Go to listings',
      helpfulCount: 7,
      unhelpfulCount: 0,
      userVote: null,
      tab: 'Released'
    },
    {
      id: 'f3',
      title: 'Export your leads on demand',
      date: '8 Sep 2026',
      badge: 'Leads & Enquiries',
      description: 'Download your full lead history as a CSV file straight from the enquiries panel. Instant access, no support request required.',
      link: '/clients/enquiries',
      actionText: 'Open enquiries',
      helpfulCount: 12,
      unhelpfulCount: 5,
      userVote: null,
      tab: 'Released'
    },
    {
      id: 'f4',
      title: 'Security cheques on Real Time Offer',
      date: '2 Sep 2026',
      badge: 'Real Time Offer',
      description: 'Bidders now lodge a 10% security cheque instead of a deposit. Track every physical and digital cheque from received to returned in the Cheque Vault.',
      link: '/rto/cheques',
      actionText: 'Open cheques',
      helpfulCount: 9,
      unhelpfulCount: 1,
      userVote: null,
      tab: 'Released'
    },
    // Coming soon items
    {
      id: 'f5',
      title: 'AI WhatsApp Auto-Responder for Off-Peak Leads',
      date: 'October 2026',
      badge: 'Coming Soon',
      description: 'Instantly respond to midnight property enquiries via WhatsApp with your agency tone of voice and verified listing details.',
      link: '/clients/messages',
      actionText: 'Preview messages',
      helpfulCount: 42,
      unhelpfulCount: 1,
      userVote: null,
      tab: 'Coming soon'
    },
    {
      id: 'f6',
      title: 'Bulk DLD Trakheesi Permit Expiry Alerts',
      date: 'October 2026',
      badge: 'Coming Soon',
      description: 'Automated 14-day and 7-day push alerts before any Form A or marketing permit expires to avoid Dubai Land Department compliance penalties.',
      link: '/properties/compliance',
      actionText: 'View compliance',
      helpfulCount: 31,
      unhelpfulCount: 0,
      userVote: null,
      tab: 'Coming soon'
    }
  ]);

  const handleVote = (id, type) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        if (f.userVote === type) {
          // undo vote
          return {
            ...f,
            userVote: null,
            helpfulCount: type === 'helpful' ? f.helpfulCount - 1 : f.helpfulCount,
            unhelpfulCount: type === 'unhelpful' ? f.unhelpfulCount - 1 : f.unhelpfulCount
          };
        }
        return {
          ...f,
          userVote: type,
          helpfulCount:
            type === 'helpful'
              ? f.userVote === 'unhelpful'
                ? f.helpfulCount + 1
                : f.helpfulCount + 1
              : f.userVote === 'helpful'
              ? f.helpfulCount - 1
              : f.helpfulCount,
          unhelpfulCount:
            type === 'unhelpful'
              ? f.userVote === 'helpful'
                ? f.unhelpfulCount + 1
                : f.unhelpfulCount + 1
              : f.userVote === 'unhelpful'
              ? f.unhelpfulCount - 1
              : f.unhelpfulCount
        };
      })
    );
  };

  const handleSubmitIdea = (e) => {
    e.preventDefault();
    if (!ideaText.trim()) return;
    alert('Thank you! Your product suggestion has been sent directly to the CMP engineering team.');
    setIdeaText('');
    setIsIdeaModalOpen(false);
  };

  const filteredFeatures = features.filter((f) => {
    const matchesTab = f.tab === activeTab;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
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
          <h1 style={{ fontSize: '22px', margin: 0, letterSpacing: '-0.02em' }}>
            What’s new
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            New features, speed improvements, and workflow updates shipped to CMP Connect.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsIdeaModalOpen(true)}
            style={{ gap: '6px' }}
          >
            <Lightbulb size={15} style={{ color: 'var(--cmp-accent)' }} />
            <span>Submit an idea</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div role="tablist" className="segmented" style={{ marginBottom: '18px' }}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'Released'}
          onClick={() => setActiveTab('Released')}
        >
          Released
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'Coming soon'}
          onClick={() => setActiveTab('Coming soon')}
        >
          Coming soon
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '320px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          />
          <input
            id="features-search"
            type="search"
            placeholder="Search updates"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
          />
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredFeatures.map((item) => (
          <article
            key={item.id}
            className="card"
            style={{
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'border-color var(--cmp-duration-fast) var(--cmp-ease)'
            }}
          >
            {/* Visual Header Banner matching concept radial gradient */}
            <div
              style={{
                borderRadius: '10px',
                aspectRatio: '16 / 8',
                padding: '18px',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                color: '#FFFFFF',
                background:
                  'radial-gradient(70% 90% at 50% 110%, rgba(184, 115, 51, 0.85), transparent 70%), linear-gradient(135deg, #04150E, #0C6140)'
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '18px', textWrap: 'balance', letterSpacing: '-0.01em' }}>
                {item.title}
              </span>
            </div>

            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge" style={{ background: 'var(--cmp-surface-sunken)', color: 'var(--cmp-text-muted)' }}>
                {item.badge}
              </span>
              <p className="faint" style={{ margin: 0, fontSize: '12px' }}>
                {item.date}
              </p>
            </div>

            <h2 style={{ fontSize: '17px', margin: 0 }}>{item.title}</h2>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px', flex: '1 1 auto', lineHeight: 1.5 }}>
              {item.description}
            </p>

            <NavLink
              to={item.link}
              className="btn btn-outline btn-sm"
              style={{ width: 'fit-content', gap: '6px' }}
            >
              <span>{item.actionText}</span>
              <ArrowRight size={13} />
            </NavLink>

            {/* Was this helpful feedback row */}
            <div
              className="row"
              style={{
                justifyContent: 'space-between',
                paddingTop: '10px',
                borderTop: '1px solid var(--cmp-border)',
                fontSize: '13px',
                alignItems: 'center'
              }}
            >
              <span className="muted">Was this update helpful?</span>
              <div className="row" style={{ gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${item.userVote === 'helpful' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ gap: '6px', height: '30px', padding: '0 8px' }}
                  onClick={() => handleVote(item.id, 'helpful')}
                  aria-label={`Helpful, ${item.helpfulCount} votes`}
                >
                  <ThumbsUp size={13} />
                  <span>{item.helpfulCount}</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${item.userVote === 'unhelpful' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ gap: '6px', height: '30px', padding: '0 8px' }}
                  onClick={() => handleVote(item.id, 'unhelpful')}
                  aria-label={`Not helpful, ${item.unhelpfulCount} votes`}
                >
                  <ThumbsDown size={13} />
                  <span>{item.unhelpfulCount}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Idea Modal */}
      {isIdeaModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 100,
            padding: '16px'
          }}
          onClick={() => setIsIdeaModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Suggest a feature or improvement</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsIdeaModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              What tools or workflows would save you time closing deals on Cash My Property?
            </p>
            <form onSubmit={handleSubmitIdea}>
              <textarea
                rows={4}
                placeholder="E.g., Automated tenancy contract renewals, bulk photo watermarking..."
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                style={{ width: '100%', marginBottom: '16px' }}
                required
              />
              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsIdeaModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Send idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
