import React, { useState, useMemo } from 'react';
import { initialWalletPlan } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { Check, Mail, Send, X, AlertTriangle } from 'lucide-react';

export default function WalletPage() {
  const { agency, setAgency } = useApp();
  const [planData, setPlanData] = useState(initialWalletPlan);
  const [requestModal, setRequestModal] = useState(null); // package object when opened
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [customCredits, setCustomCredits] = useState('');

  // Handle requesting extra credits
  const handleRequestCredits = (pkg) => {
    setRequestModal(pkg);
    setRequestSuccess(false);
  };

  const confirmRequest = () => {
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestModal(null);
      setRequestSuccess(false);
    }, 1800);
  };

  return (
    <div>
      <h1 style={{ fontSize: '26px' }}>Balance &amp; plan</h1>
      <p className="muted" style={{ margin: '6px 0 20px', fontSize: '14px' }}>
        What your agency’s plan includes, what is used, and where the credits went.
      </p>

      {/* Plan summary hero card */}
      <section
        className="card"
        style={{
          padding: '20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px'
        }}
      >
        <div>
          <p
            className="faint"
            style={{
              margin: 0,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Plan
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '22px', fontWeight: 800 }}>
            {planData.planName}
          </p>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Renews {planData.renewalDate}
          </p>
        </div>

        <div>
          <p
            className="faint"
            style={{
              margin: 0,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Credit balance
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--cmp-brand)'
            }}
          >
            {planData.balance.toLocaleString()}
          </p>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            {planData.monthlyAllowance.toLocaleString()} added on the 1st of each month
          </p>
        </div>

        <div>
          <p
            className="faint"
            style={{
              margin: 0,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Account manager
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '16px', fontWeight: 700 }}>
            {planData.accountManager.name}
          </p>
          <a
            href={`mailto:${planData.accountManager.email}?subject=Plan%20change%20for%20CMP%20Prime%20Real%20Estate`}
            className="btn btn-outline btn-sm"
            style={{ marginTop: '8px' }}
          >
            Change plan
          </a>
        </div>
      </section>

      {/* 3 Meter Cards */}
      <div className="stat-grid">
        {planData.meters.map((meter) => (
          <div key={meter.id} className="card" style={{ padding: '18px' }}>
            <div className="row" style={{ justifyContent: 'space-between', gap: '8px' }}>
              <p
                className="faint"
                style={{
                  margin: 0,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {meter.label}
              </p>
              {meter.badge && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--cmp-surface-sunken)',
                    color: meter.badgeColor || 'var(--cmp-warning)',
                    border: '1px solid var(--cmp-border)'
                  }}
                >
                  {meter.badge}
                </span>
              )}
            </div>

            <p style={{ margin: '8px 0 10px', fontSize: '26px', fontWeight: 800 }}>
              {meter.used}{' '}
              <span className="faint" style={{ fontSize: '15px', fontWeight: 600 }}>
                of {meter.total}
              </span>
            </p>

            <div
              className="meter"
              role="meter"
              aria-label={meter.label}
              aria-valuemin={0}
              aria-valuemax={meter.total}
              aria-valuenow={meter.used}
            >
              <div
                style={{
                  width: `${meter.pct}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background:
                    meter.id === 'premium_slots'
                      ? 'var(--cmp-warning)'
                      : 'var(--cmp-brand)'
                }}
              />
            </div>

            <p className="faint" style={{ margin: '8px 0 0', fontSize: '12px' }}>
              {meter.left} {meter.unit}
            </p>
          </div>
        ))}
      </div>

      {/* What credits buy & Add credits */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          marginTop: '24px'
        }}
      >
        {/* Left: What credits buy */}
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '17px' }}>What credits buy</h2>
          <dl style={{ margin: '12px 0 0' }}>
            {planData.pricingCatalog.map((item, idx) => (
              <div
                key={item.title}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '10px 0',
                  borderBottom:
                    idx < planData.pricingCatalog.length - 1
                      ? '1px solid var(--cmp-border)'
                      : 'none'
                }}
              >
                <dt>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>
                    {item.title}
                  </span>
                  <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                    {item.desc}
                  </span>
                </dt>
                <dd style={{ margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {item.credits} credits
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Right: Add credits */}
        <section className="card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '17px' }}>Add credits</h2>
          <p className="muted" style={{ margin: '6px 0 14px', fontSize: '13px' }}>
            Your account manager invoices the agency, and the credits appear once it is paid.
          </p>

          <div style={{ display: 'grid', gap: '10px' }}>
            {planData.topUpPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px',
                  border: '1px solid var(--cmp-border)',
                  borderRadius: 'var(--cmp-radius-md)'
                }}
              >
                <span>
                  <span style={{ fontWeight: 700 }}>
                    {pkg.credits.toLocaleString()} credits
                  </span>
                  <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                    {pkg.priceDisplay} · {pkg.rateDisplay}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRequestCredits(pkg)}
                >
                  Request
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Credit history table */}
      <section style={{ marginTop: '24px' }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '18px' }}>Credit history</h2>
        </div>

        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th style={{ textAlign: 'end' }}>Credits</th>
                <th style={{ textAlign: 'end' }}>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {planData.creditHistory.map((item) => (
                <tr key={item.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {item.date}
                  </td>
                  <td>{item.description}</td>
                  <td
                    style={{
                      textAlign: 'end',
                      fontWeight: 700,
                      color: item.credits > 0 ? 'var(--cmp-success)' : 'var(--cmp-text)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.credits > 0 ? `+${item.credits.toLocaleString()}` : item.credits.toLocaleString()}
                  </td>
                  <td className="muted" style={{ textAlign: 'end' }}>
                    {item.balance}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Credit request dialog modal */}
      {requestModal && (
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
          onClick={() => setRequestModal(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(440px, 100%)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button"
              style={{ position: 'absolute', top: '14px', right: '14px' }}
              onClick={() => setRequestModal(null)}
            >
              <X size={18} />
            </button>

            {requestSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--cmp-brand-subtle)',
                    color: 'var(--cmp-brand)',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 14px'
                  }}
                >
                  <Check size={26} />
                </div>
                <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Request Dispatched</h3>
                <p className="muted" style={{ fontSize: '13.5px', margin: 0 }}>
                  Rashid Al Amiri has been notified. An invoice for {requestModal.priceDisplay} will be added to your Invoices tab.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>
                  Request Credit Package
                </h2>
                <p className="muted" style={{ fontSize: '13.5px', margin: '0 0 16px' }}>
                  Confirm your request for <strong>{requestModal.credits.toLocaleString()} credits</strong> at <strong>{requestModal.priceDisplay}</strong> ({requestModal.rateDisplay}).
                </p>

                <div
                  style={{
                    background: 'var(--cmp-surface-sunken)',
                    border: '1px solid var(--cmp-border)',
                    borderRadius: 'var(--cmp-radius-md)',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    fontSize: '13px'
                  }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="muted">Agency:</span>
                    <strong>{agency.name}</strong>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="muted">Account Manager:</span>
                    <span>{planData.accountManager.name}</span>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Billing Mode:</span>
                    <span>Monthly Consolidated Invoice</span>
                  </div>
                </div>

                <div className="row" style={{ gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setRequestModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={confirmRequest}
                  >
                    <Send size={14} />
                    <span>Send Request</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
