import React, { useState, useMemo } from 'react';
import { initialContracts } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { Search, X, FileText, CheckCircle } from 'lucide-react';

export default function ContractPage() {
  const { agency } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingContract, setViewingContract] = useState(null);

  const filteredContracts = useMemo(() => {
    if (!searchQuery.trim()) return initialContracts;
    const q = searchQuery.toLowerCase().trim();
    return initialContracts.filter(
      (c) =>
        c.contractNumber.toLowerCase().includes(q) ||
        c.products.some((p) => p.toLowerCase().includes(q))
    );
  }, [searchQuery]);

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
            Contract
          </h1>
        </div>
      </div>

      {/* Contract Search Bar matching concept */}
      <div className="row" style={{ marginBottom: '18px', maxWidth: '360px' }}>
        <label htmlFor="contract-search" className="visually-hidden">
          Search by contract number
        </label>
        <input
          id="contract-search"
          inputMode="numeric"
          placeholder="Search by contract number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ height: '40px', borderRadius: '8px 0 0 8px' }}
        />
        <span
          className="btn btn-outline"
          aria-hidden="true"
          style={{
            height: '40px',
            borderRadius: '0 8px 8px 0',
            borderInlineStart: 'none'
          }}
        >
          <Search size={16} />
        </span>
      </div>

      {/* Contracts Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Contract # / Product</th>
              <th>Contract duration</th>
              <th>Contract price</th>
              <th>Payment mode</th>
              <th>Signed by</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContracts.map((c) => (
              <tr key={c.contractNumber}>
                <td style={{ minWidth: '180px' }}>
                  <span className="muted" style={{ fontSize: '13px' }}>
                    {c.contractNumber}
                  </span>
                  {c.products.map((p) => (
                    <span
                      key={p}
                      style={{
                        display: 'block',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{c.duration}</td>
                <td>
                  <dl
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto auto',
                      gap: '2px 12px',
                      margin: 0,
                      fontSize: '13px'
                    }}
                  >
                    <dt className="muted">Gross amount (AED)</dt>
                    <dd style={{ margin: 0 }}>{c.grossAmount}</dd>
                    <dt className="muted">Discount %</dt>
                    <dd style={{ margin: 0 }}>{c.discountPct}</dd>
                    <dt className="muted">Total amount (AED)</dt>
                    <dd style={{ margin: 0, fontWeight: 700 }}>{c.totalAmount}</dd>
                  </dl>
                </td>
                <td>{c.paymentMode}</td>
                <td>{c.signedBy}</td>
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
                      color:
                        c.status === 'Active'
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-text-muted)',
                      border: `1px solid color-mix(in srgb, ${
                        c.status === 'Active'
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-text-muted)'
                      } 55%, transparent)`,
                      background: `color-mix(in srgb, ${
                        c.status === 'Active'
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-text-muted)'
                      } 10%, transparent)`
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewingContract(c)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contract Detail View Modal */}
      {viewingContract && (
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
          onClick={() => setViewingContract(null)}
        >
          <div
            className="card"
            style={{
              width: 'min(500px, 100%)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="icon-button"
              style={{ position: 'absolute', top: '14px', right: '14px' }}
              onClick={() => setViewingContract(null)}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>
              Contract #{viewingContract.contractNumber}
            </h2>
            <p className="muted" style={{ fontSize: '13px', margin: '0 0 16px' }}>
              Validity period: {viewingContract.duration}
            </p>

            <div
              style={{
                background: 'var(--cmp-surface-sunken)',
                border: '1px solid var(--cmp-border)',
                borderRadius: 'var(--cmp-radius-md)',
                padding: '16px',
                marginBottom: '18px',
                display: 'grid',
                gap: '8px',
                fontSize: '13.5px'
              }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Authorized Signatory:</span>
                <strong>{viewingContract.signedBy}</strong>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Agency Name:</span>
                <span>{agency.name}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Included Products:</span>
                <span>{viewingContract.products.join(', ')}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Total Contract Value:</span>
                <strong style={{ color: 'var(--cmp-brand)' }}>
                  AED {viewingContract.totalAmount}
                </strong>
              </div>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Status:</span>
                <span style={{ fontWeight: 600 }}>{viewingContract.status}</span>
              </div>
            </div>

            <div className="row" style={{ gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewingContract(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
