import React from 'react';
import { HelpCircle, BookOpen, ShieldCheck, Sparkles, Video, ArrowRight } from 'lucide-react';

export default function HelpPage() {
  const guides = [
    {
      title: 'Real Time Offer: Broker Masterclass',
      category: 'Auctions',
      time: '6 min read',
      desc: 'How to advise sellers on reserve pricing and setting up successful 7-day bidding windows.'
    },
    {
      title: 'Trakheesi DLD Permit Compliance in Dubai',
      category: 'Legal',
      time: '4 min read',
      desc: 'Avoiding advertising fines: generating permit numbers and updating expired Form A agreements.'
    },
    {
      title: 'Optimizing Listing Quality for 90+ Score',
      category: 'Listings',
      time: '5 min read',
      desc: 'Photo ordering, verified descriptions, and amenities checklist for maximum portal impressions.'
    },
    {
      title: 'Handling 10% Bidder Security Cheques',
      category: 'Operations',
      time: '3 min read',
      desc: 'Safe custody, receipt acknowledgment, and 48-hour return procedures for non-winning bidders.'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Help & Knowledge Academy</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Best practices, UAE regulations compliance guides, and Real Time Offer workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {guides.map((g, idx) => (
          <article key={idx} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className="badge badge-brand">{g.category}</span>
              <span className="faint" style={{ fontSize: '12px' }}>{g.time}</span>
            </div>
            <strong style={{ fontSize: '16px', marginBottom: '6px' }}>{g.title}</strong>
            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', flex: 1 }}>
              {g.desc}
            </p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => alert(`Opening guide: ${g.title}`)}
            >
              <span>Read guide</span>
              <ArrowRight size={13} />
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
