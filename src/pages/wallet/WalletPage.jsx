import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Coins, Plus, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck } from 'lucide-react';

export default function WalletPage() {
  const { agency, setAgency } = useApp();
  const [topUpModal, setTopUpModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState(1000);

  const transactionsLedger = [
    { id: 'TX-C1', description: 'Listing auto-renewal: Marina Gate 2 bed', type: 'debit', amount: 50, date: '17 Sep 2026' },
    { id: 'TX-C2', description: 'Smart Boost: Palm Jumeirah duplex penthouse', type: 'debit', amount: 120, date: '16 Sep 2026' },
    { id: 'TX-C3', description: 'Monthly agency tier credit allocation', type: 'credit', amount: 2000, date: '01 Sep 2026' },
    { id: 'TX-C4', description: 'Featured badge: Burj Khalifa 1 bed', type: 'debit', amount: 80, date: '28 Aug 2026' }
  ];

  const handleTopUp = () => {
    setAgency((prev) => ({
      ...prev,
      credits: prev.credits + selectedPack
    }));
    setTopUpModal(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Wallet & Credits</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Credit consumption balance, auto-topup settings, package tiers and billing history.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(320px, 1.4fr)', gap: '22px', alignItems: 'start' }}>
        {/* Balance Card */}
        <div className="card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--cmp-surface), var(--cmp-surface-sunken))' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted" style={{ fontSize: '13px', fontWeight: 600 }}>Available Balance</span>
            <span className="badge badge-accent">Agency Plan</span>
          </div>

          <p style={{ margin: '14px 0 6px', fontSize: '38px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            {agency.credits.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: 600 }}>credits</span>
          </p>

          <p className="muted" style={{ margin: '0 0 20px', fontSize: '13px' }}>
            Current allocation expires in <strong>{agency.creditsExpiryDays} days</strong> (27 Sep 2026)
          </p>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => setTopUpModal(true)}
          >
            <Plus size={16} />
            <span>Top up credits</span>
          </button>
        </div>

        {/* Recent Ledger */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '16.5px', marginBottom: '14px' }}>Recent Credit Activity</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {transactionsLedger.map((tx) => (
              <div
                key={tx.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'var(--cmp-surface-sunken)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{tx.description}</div>
                  <span className="faint" style={{ fontSize: '11.5px' }}>{tx.date}</span>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '14px',
                    color: tx.type === 'credit' ? 'var(--cmp-brand)' : 'var(--cmp-accent)'
                  }}
                >
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top up modal */}
      {topUpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '20px'
          }}
          onClick={() => setTopUpModal(false)}
        >
          <div
            className="card"
            style={{ width: 'min(440px, 100%)', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Choose a Credit Package</h2>
            <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
              {[
                { amount: 500, price: 'AED 950', badge: 'Standard' },
                { amount: 1000, price: 'AED 1,750', badge: 'Most Popular' },
                { amount: 2500, price: 'AED 3,800', badge: 'Best Value' }
              ].map((pack) => (
                <button
                  key={pack.amount}
                  type="button"
                  className="card"
                  onClick={() => setSelectedPack(pack.amount)}
                  style={{
                    padding: '14px',
                    textAlign: 'start',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: selectedPack === pack.amount ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                    background: selectedPack === pack.amount ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '16px' }}>{pack.amount} Credits</strong>
                    <div className="muted" style={{ fontSize: '12px' }}>{pack.badge}</div>
                  </div>
                  <strong style={{ color: 'var(--cmp-brand)' }}>{pack.price}</strong>
                </button>
              ))}
            </div>

            <div className="row" style={{ gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setTopUpModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleTopUp}>
                Confirm Top-up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
