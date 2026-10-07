import React, { useState, useMemo } from 'react';
import { initialWalletActivity } from '../../data/mockData';
import { exportToCsv } from '../../utils';
import { useApp } from '../../context/AppContext';
import {
  Coins,
  Plus,
  Download,
  ChevronDown,
  Search,
  Calculator,
  X,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreditActivityPage() {
  const { agency } = useApp();
  const [searchRef, setSearchRef] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Calculator state
  const [calcFeatured, setCalcFeatured] = useState(2);
  const [calcPremium, setCalcPremium] = useState(1);
  const [calcRefresh, setCalcRefresh] = useState(4);

  const calculatedTotal = useMemo(() => {
    return calcFeatured * 60 + calcPremium * 150 + calcRefresh * 5;
  }, [calcFeatured, calcPremium, calcRefresh]);

  // Filtered Activity Rows
  const filteredActivity = useMemo(() => {
    if (!searchRef.trim()) return initialWalletActivity;
    const q = searchRef.toLowerCase().trim();
    return initialWalletActivity.filter(
      (item) =>
        item.reference.toLowerCase().includes(q) ||
        item.originator.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.propertyType.toLowerCase().includes(q)
    );
  }, [searchRef]);

  // Export to CSV
  const handleExportCSV = () => {
    exportToCsv(
      filteredActivity.map((r) => ({
        Originator: r.originator,
        Date: r.date,
        Credits: r.credits,
        Credit_Balance: r.balance,
        Description: r.description,
        Reference: r.reference,
        Property_Type: r.propertyType,
        Category: r.category
      })),
      `cmp-wallet-activity-${new Date().toISOString().slice(0, 10)}.csv`
    );
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
              letterSpacing: '-0.02em'
            }}
          >
            Wallet activity
          </h1>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setCalculatorOpen(true)}
          >
            <Coins size={16} />
            <span>Calculate credits</span>
          </button>
          <Link to="/wallet" className="btn btn-accent btn-sm">
            <Plus size={16} />
            <span>Add credits</span>
          </Link>
        </div>
      </div>

      {/* Filter Card */}
      <section className="card" style={{ padding: '18px', marginBottom: '16px' }}>
        <div
          className="row"
          style={{ justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}
        >
          <h2 style={{ fontSize: '16px' }}>Wallet activity</h2>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-label="Export to CSV"
            className="btn btn-outline btn-sm"
            style={{ gap: '6px', whiteSpace: 'nowrap' }}
            onClick={handleExportCSV}
          >
            <Download size={16} />
            <span>Export to .CSV</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="row" style={{ gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <div style={{ width: '280px' }}>
            <label htmlFor="usage-ref" className="visually-hidden">
              Search by reference
            </label>
            <input
              id="usage-ref"
              placeholder="Search by reference"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              style={{ height: '40px' }}
            />
          </div>

          <div style={{ width: '260px', position: 'relative' }}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isPeriodMenuOpen}
              className="btn btn-outline"
              style={{
                width: '100%',
                height: '40px',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontWeight: 500,
                color: 'var(--cmp-text)',
                background: 'var(--cmp-surface)'
              }}
              onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedPeriod === '30d'
                  ? 'Last 30 days (18 Aug 2026 – today)'
                  : selectedPeriod === '60d'
                  ? 'Last 60 days (19 Jul 2026 – today)'
                  : 'Year to date (2026)'}
              </span>
              <ChevronDown size={14} />
            </button>

            {isPeriodMenuOpen && (
              <div
                className="card"
                style={{
                  position: 'absolute',
                  top: '44px',
                  left: 0,
                  right: 0,
                  zIndex: 25,
                  padding: '6px',
                  boxShadow: 'var(--cmp-shadow-md)'
                }}
              >
                {[
                  { id: '30d', label: 'Last 30 days (18 Aug 2026 – today)' },
                  { id: '60d', label: 'Last 60 days (19 Jul 2026 – today)' },
                  { id: 'ytd', label: 'Year to date (2026)' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="menu-item"
                    style={{
                      fontSize: '13px',
                      color: selectedPeriod === opt.id ? 'var(--cmp-brand)' : 'inherit',
                      fontWeight: selectedPeriod === opt.id ? 700 : 500
                    }}
                    onClick={() => {
                      setSelectedPeriod(opt.id);
                      setIsPeriodMenuOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Transaction originator</th>
              <th>Date</th>
              <th>Credits</th>
              <th>Credit balance</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Property type</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivity.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }} className="muted">
                  No transaction records found matching "{searchRef}"
                </td>
              </tr>
            ) : (
              filteredActivity.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="row" style={{ gap: '10px' }}>
                      {row.isSystem ? (
                        <span
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid var(--cmp-border)',
                            display: 'inline-block'
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '32px',
                            height: '32px',
                            flexShrink: 0
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              background: 'var(--cmp-brand-subtle)',
                              color: 'var(--cmp-brand)',
                              fontWeight: 700,
                              fontSize: '11.52px'
                            }}
                          >
                            {row.originatorInitials}
                          </span>
                        </span>
                      )}
                      {row.originator}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.date}</td>
                  <td
                    style={{
                      fontWeight: 700,
                      color: row.credits > 0 ? 'var(--cmp-success)' : 'var(--cmp-text)',
                      fontVariantNumeric: 'tabular-nums'
                    }}
                  >
                    {row.credits > 0 ? `+ ${row.credits}` : row.credits}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.balance}
                  </td>
                  <td>{row.description}</td>
                  <td
                    style={{
                      color: row.reference === '—' ? 'var(--cmp-text-muted)' : 'var(--cmp-brand)',
                      fontWeight: row.reference === '—' ? 400 : 600
                    }}
                  >
                    {row.reference !== '—' ? (
                      <Link to="/properties" style={{ color: 'var(--cmp-brand)' }}>
                        {row.reference}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{row.propertyType}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{row.category}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Credit Calculator Modal */}
      {calculatorOpen && (
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
          onClick={() => setCalculatorOpen(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(460px, 100%)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button"
              style={{ position: 'absolute', top: '14px', right: '14px' }}
              onClick={() => setCalculatorOpen(false)}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '18px', marginBottom: '6px' }}>
              Credit Calculator
            </h2>
            <p className="muted" style={{ fontSize: '13.5px', margin: '0 0 18px' }}>
              Estimate how many credits you need for marketing upgrades.
            </p>

            <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Featured placements (60 credits / 7d)</span>
                  <strong>{calcFeatured}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={calcFeatured}
                  onChange={(e) => setCalcFeatured(Number(e.target.value))}
                  style={{ height: '32px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Premium placements (150 credits / 7d)</span>
                  <strong>{calcPremium}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={calcPremium}
                  onChange={(e) => setCalcPremium(Number(e.target.value))}
                  style={{ height: '32px' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Manual listing refreshes (5 credits each)</span>
                  <strong>{calcRefresh}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={calcRefresh}
                  onChange={(e) => setCalcRefresh(Number(e.target.value))}
                  style={{ height: '32px' }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'var(--cmp-surface-sunken)',
                border: '1px solid var(--cmp-border)',
                borderRadius: 'var(--cmp-radius-md)',
                padding: '16px',
                marginBottom: '18px',
                textAlign: 'center'
              }}
            >
              <span className="muted" style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Credits Required
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
                {calculatedTotal.toLocaleString()}{' '}
                <span style={{ fontSize: '15px', fontWeight: 600 }}>credits</span>
              </p>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                Current balance: {agency.credits.toLocaleString()} credits (
                {agency.credits >= calculatedTotal ? 'Sufficient balance' : 'Top-up needed'}
                )
              </p>
            </div>

            <div className="row" style={{ gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setCalculatorOpen(false)}
              >
                Close
              </button>
              <Link
                to="/wallet"
                className="btn btn-primary btn-sm"
                onClick={() => setCalculatorOpen(false)}
              >
                Request Credits Pack
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
