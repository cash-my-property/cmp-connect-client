import React, { useState } from 'react';
import { Coins, Star, Clock, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const initialSpotlightLots = [
  {
    id: 'spot-1',
    community: 'Dubai Marina',
    offering: 'Residential sale',
    monthlySearches: '48,200',
    leadingBid: 420,
    minBid: 250,
    yourBid: null,
    closingIn: '3 days'
  },
  {
    id: 'spot-2',
    community: 'Downtown Dubai',
    offering: 'Residential sale',
    monthlySearches: '51,800',
    leadingBid: 510,
    minBid: 300,
    yourBid: null,
    closingIn: '3 days'
  },
  {
    id: 'spot-3',
    community: 'Palm Jumeirah',
    offering: 'Residential sale',
    monthlySearches: '39,500',
    leadingBid: null,
    minBid: 350,
    yourBid: null,
    closingIn: '5 days'
  },
  {
    id: 'spot-4',
    community: 'Jumeirah Village Circle',
    offering: 'Residential rent',
    monthlySearches: '62,300',
    leadingBid: 280,
    minBid: 150,
    yourBid: null,
    closingIn: '2 days'
  },
  {
    id: 'spot-5',
    community: 'Jumeirah Lake Towers',
    offering: 'Residential rent',
    monthlySearches: '30,100',
    leadingBid: null,
    minBid: 120,
    yourBid: null,
    closingIn: '6 days'
  },
  {
    id: 'spot-6',
    community: 'Business Bay',
    offering: 'Commercial rent',
    monthlySearches: '12,400',
    leadingBid: 190,
    minBid: 100,
    yourBid: null,
    closingIn: '4 days'
  },
  {
    id: 'spot-7',
    community: 'Dubai Hills Estate',
    offering: 'Residential sale',
    monthlySearches: '27,600',
    leadingBid: null,
    minBid: 220,
    yourBid: null,
    closingIn: '5 days'
  }
];

export default function CommunitySpotlightPage() {
  const { agency } = useApp();
  const [lots, setLots] = useState(initialSpotlightLots);
  const [biddingLot, setBiddingLot] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleOpenBidModal = (lot) => {
    setBiddingLot(lot);
    const suggested = lot.leadingBid ? lot.leadingBid + 25 : lot.minBid;
    setBidAmount(String(suggested));
  };

  const handleConfirmBid = (e) => {
    e.preventDefault();
    const amount = Number(bidAmount);
    if (!amount || !biddingLot) return;

    setLots((prev) =>
      prev.map((l) =>
        l.id === biddingLot.id
          ? {
              ...l,
              yourBid: amount,
              leadingBid: Math.max(l.leadingBid || 0, amount)
            }
          : l
      )
    );
    showNotice(`Bid of ${amount} credits placed for ${biddingLot.community} (${biddingLot.offering}).`);
    setBiddingLot(null);
    setBidAmount('');
  };

  const activeBidsCount = lots.filter((l) => l.yourBid !== null).length;
  const creditsHeld = lots.reduce((acc, curr) => acc + (curr.yourBid || 0), 0);

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '26px' }}>Community Spotlight</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '820px' }}>
          Win the top spot in a community’s search results for a month. The highest bid when the window closes wins; everyone else gets their credits back.
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

      {/* 3 Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="row muted" style={{ margin: 0, gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Coins size={16} /> Available credits
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 800 }}>
            {agency.credits.toLocaleString()}
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="row muted" style={{ margin: 0, gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Star size={16} /> Your active bids
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 800 }}>
            {activeBidsCount}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>
            {creditsHeld} credits held
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="row muted" style={{ margin: 0, gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <Clock size={16} /> Next window closes
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 800 }}>
            2 days
          </p>
        </div>
      </div>

      {/* Spotlight Lots Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Community</th>
              <th>Offering</th>
              <th>Searches a month</th>
              <th>Leading bid</th>
              <th>Your bid</th>
              <th>Window closes</th>
              <th style={{ textAlign: 'end' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((lot) => (
              <tr key={lot.id}>
                <td>
                  <strong>{lot.community}</strong>
                </td>
                <td>{lot.offering}</td>
                <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {lot.monthlySearches}
                </td>
                <td>
                  {lot.leadingBid ? (
                    <>
                      <span>{lot.leadingBid} credits</span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        Minimum {lot.minBid}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="muted">No bids yet</span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        Minimum {lot.minBid}
                      </span>
                    </>
                  )}
                </td>
                <td>
                  {lot.yourBid ? (
                    <span style={{ fontWeight: 700, color: 'var(--cmp-brand)' }}>
                      {lot.yourBid} credits
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="row" style={{ gap: '6px' }}>
                  <Clock size={14} className="faint" />
                  <span>{lot.closingIn}</span>
                </td>
                <td style={{ textAlign: 'end' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenBidModal(lot)}
                  >
                    {lot.yourBid ? 'Increase bid' : 'Place bid'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Place Bid Modal */}
      {biddingLot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setBiddingLot(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                Bid for {biddingLot.community}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setBiddingLot(null)}
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px' }}>
              Offering: <strong>{biddingLot.offering}</strong> · Monthly searches: <strong>{biddingLot.monthlySearches}</strong>
            </p>

            <form onSubmit={handleConfirmBid} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label>Bid amount (Credits)</label>
                <input
                  type="number"
                  required
                  min={biddingLot.minBid}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '15px', fontWeight: 700 }}
                />
                <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Minimum required bid is {biddingLot.minBid} credits.
                </p>
              </div>

              <div className="row" style={{ gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setBiddingLot(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
