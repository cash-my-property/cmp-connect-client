import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Radio,
  Clock,
  Coins,
  CheckCircle2,
  Users,
  Eye,
  Plus,
  Play,
  Pause,
  ArrowUpRight
} from 'lucide-react';

export default function LiveDeskPage() {
  const { rtoLots, extendRtoClock, placeRtoOffer } = useApp();
  const [selectedLotId, setSelectedLotId] = useState(rtoLots[0]?.id || 'CMP-L-004121');
  const [customBidAmount, setCustomBidAmount] = useState('');

  const selectedLot = rtoLots.find((l) => l.id === selectedLotId) || rtoLots[0];

  const handleBidSubmit = (e) => {
    e.preventDefault();
    const amount = Number(customBidAmount);
    if (amount > 0 && selectedLot) {
      placeRtoOffer(selectedLot.id, amount);
      setCustomBidAmount('');
    }
  };

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
          marginBottom: '20px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="cmp-live-dot" /> Real Time Offer desk
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Every property of yours taking instant bids against a live countdown clock and private reserve.
          </p>
        </div>

        <NavLink to="/rto/new" className="btn btn-accent btn-sm">
          <Plus size={15} />
          <span>Enter a property</span>
        </NavLink>
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Taking offers now
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            3
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>4 on desk in total</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Offers placed
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {rtoLots.reduce((acc, curr) => acc + curr.offersCount, 0)}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>across the desk</p>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Above reserve
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {rtoLots.filter((l) => l.reserveMet).length} of {rtoLots.length}
          </p>
          <p className="faint" style={{ margin: '2px 0 0', fontSize: '12px' }}>would sell immediately</p>
        </div>

        <NavLink to="/rto/bidders" className="card" style={{ padding: '16px', display: 'block' }}>
          <p className="faint" style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Registrations to review
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            4
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cmp-brand)', fontWeight: 600 }}>
            Review buyers →
          </p>
        </NavLink>
      </div>

      {/* Main Layout: Lots Table + Live Inspection Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Table of Lots */}
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Highest offer</th>
                <th>Reserve</th>
                <th>Offers</th>
                <th>Clock</th>
              </tr>
            </thead>
            <tbody>
              {rtoLots.map((lot) => {
                const isSelected = lot.id === selectedLotId;
                return (
                  <tr
                    key={lot.id}
                    onClick={() => setSelectedLotId(lot.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--cmp-brand-subtle)' : 'transparent'
                    }}
                  >
                    <td style={{ minWidth: '180px' }}>
                      <div style={{ fontWeight: 600, color: isSelected ? 'var(--cmp-brand)' : 'inherit' }}>
                        {lot.title}
                      </div>
                      <span className="faint" style={{ fontSize: '12px' }}>
                        {lot.id} · {lot.community}
                      </span>
                    </td>
                    <td>
                      <span className="row" style={{ gap: '6px', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background:
                              lot.status === 'Closing now'
                                ? 'var(--cmp-danger)'
                                : lot.status === 'Offers open'
                                ? 'var(--cmp-success)'
                                : 'var(--cmp-text-faint)'
                          }}
                        />
                        {lot.status}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {lot.highestOffer ? `AED ${(lot.highestOffer / 1000000).toFixed(2)}M` : '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${lot.reserveMet ? 'badge-accent' : 'badge-neutral'}`}
                      >
                        {lot.reserveMet ? 'Met' : 'Not met'}
                      </span>
                    </td>
                    <td>{lot.offersCount}</td>
                    <td className="muted" style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {lot.clock}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Lot Inspection Panel */}
        {selectedLot && (
          <aside className="card" style={{ padding: '20px' }}>
            <span className="faint" style={{ fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>
              {selectedLot.id}
            </span>
            <h2 style={{ fontSize: '18px', marginTop: '4px' }}>{selectedLot.title}</h2>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
              {selectedLot.community} · {selectedLot.saleType} · {selectedLot.agent}
            </p>

            {/* Highest Offer Highlight Card */}
            <div
              style={{
                marginTop: '16px',
                padding: '14px 16px',
                borderRadius: 'var(--cmp-radius-md)',
                background: 'var(--cmp-brand-subtle)',
                border: '1px solid var(--cmp-brand-border)'
              }}
            >
              <p className="muted" style={{ margin: 0, fontSize: '12px' }}>Highest live offer</p>
              <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                {selectedLot.highestOffer
                  ? `AED ${selectedLot.highestOffer.toLocaleString()}`
                  : 'No offers yet'}
              </p>
              <p className="muted" style={{ margin: '6px 0 0', fontSize: '12px' }}>
                Reserve AED {selectedLot.reservePrice.toLocaleString()} · Opening AED {selectedLot.openingOffer.toLocaleString()}
              </p>
            </div>

            {/* Metrics List */}
            <dl style={{ display: 'grid', gap: '8px', margin: '16px 0 0', fontSize: '13px' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Registered verified buyers</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{selectedLot.biddersCount}</dd>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Live spectators</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{selectedLot.watchingCount}</dd>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Clock extensions</dt>
                <dd style={{ margin: 0, fontWeight: 700 }}>{selectedLot.clockExtendedCount} times</dd>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <dt className="muted">Clock state</dt>
                <dd style={{ margin: 0, fontWeight: 700, color: 'var(--cmp-brand)' }}>{selectedLot.clock}</dd>
              </div>
            </dl>

            {/* Live Offer Stream */}
            <h3 style={{ fontSize: '14px', marginTop: '20px', marginBottom: '8px' }}>
              Offer history ({selectedLot.history.length})
            </h3>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {selectedLot.history.map((h, idx) => (
                <li
                  key={idx}
                  className="row"
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '12.5px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: idx === 0 ? 'var(--cmp-surface-sunken)' : 'transparent'
                  }}
                >
                  <span className="muted">{h.buyer}</span>
                  <span style={{ fontWeight: 700 }}>AED {h.amount.toLocaleString()}</span>
                  <span className="faint">{h.time}</span>
                </li>
              ))}
            </ol>

            {/* Desk Control Buttons */}
            <div style={{ display: 'grid', gap: '8px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => extendRtoClock(selectedLot.id, 10)}
              >
                <Clock size={14} />
                <span>Extend the clock by 10 minutes</span>
              </button>

              {/* Offer Simulator */}
              <form onSubmit={handleBidSubmit} className="row" style={{ gap: '6px', marginTop: '4px' }}>
                <input
                  type="number"
                  placeholder="Enter bid amount (AED)…"
                  value={customBidAmount}
                  onChange={(e) => setCustomBidAmount(e.target.value)}
                  style={{ height: '36px', fontSize: '13px' }}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!customBidAmount}>
                  Place bid
                </button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
