import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const initialBidders = [
  {
    id: 'b1',
    name: 'Hala Mansour',
    buyerTag: 'Buyer 12',
    email: 'hala@example.ae',
    phone: '+971 50 311 2280',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    identityStatus: 'verified', // 'verified' | 'checking' | 'failed'
    chequeStatus: 'received',   // 'received' | 'awaiting' | 'bounced'
    chequeAmount: 'AED 950,000',
    requestedTime: '11m ago',
    status: 'pending'          // 'pending' | 'approved' | 'declined'
  },
  {
    id: 'b2',
    name: 'Ravi Menon',
    buyerTag: 'Buyer 13',
    email: 'ravi@example.com',
    phone: '+971 55 902 1144',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmount: 'AED 210,000',
    requestedTime: '34m ago',
    status: 'pending'
  },
  {
    id: 'b3',
    name: 'Faisal Qureshi',
    buyerTag: 'Buyer 9',
    email: 'faisal@example.ae',
    phone: '+971 52 118 7730',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    identityStatus: 'checking',
    chequeStatus: 'awaiting',
    chequeAmount: 'AED 480,000',
    requestedTime: '52m ago',
    status: 'pending'
  },
  {
    id: 'b4',
    name: 'Lukas Berger',
    buyerTag: 'Buyer 14',
    email: 'lukas@example.de',
    phone: '+971 58 440 6612',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    identityStatus: 'failed',
    chequeStatus: 'received',
    chequeAmount: 'AED 950,000',
    requestedTime: '2h ago',
    status: 'pending'
  },
  {
    id: 'b5',
    name: 'Mei Tanaka',
    buyerTag: 'Buyer 3',
    email: 'mei@example.jp',
    phone: '+971 50 882 1099',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmount: 'AED 210,000',
    requestedTime: '1d ago',
    status: 'approved'
  },
  {
    id: 'b6',
    name: 'Daniel Brooks',
    buyerTag: 'Buyer 5',
    email: 'daniel@example.co.uk',
    phone: '+971 55 120 4455',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmount: 'AED 190,000',
    requestedTime: '2w ago',
    status: 'approved'
  },
  {
    id: 'b7',
    name: 'Noura Saeed',
    buyerTag: 'Buyer 8',
    email: 'noura@example.ae',
    phone: '+971 54 300 9988',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    identityStatus: 'verified',
    chequeStatus: 'received',
    chequeAmount: 'AED 190,000',
    requestedTime: '2w ago',
    status: 'approved'
  },
  {
    id: 'b8',
    name: 'Tariq Al Nuaimi',
    buyerTag: 'Buyer 11',
    email: 'tariq@example.ae',
    phone: '+971 50 449 0112',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    identityStatus: 'failed',
    chequeStatus: 'bounced',
    chequeAmount: 'AED 480,000',
    requestedTime: '3d ago',
    status: 'declined'
  }
];

export default function BiddersPage() {
  const { isLiveData } = useApp();
  const [bidders, setBidders] = useState(() => (isLiveData ? [] : initialBidders));
  const [filter, setFilter] = useState('pending');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setBidders(isLiveData ? [] : initialBidders);
  }, [isLiveData]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleApprove = (id, name) => {
    setBidders((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'approved' } : b))
    );
    showNotice(`Bidder ${name} has been approved to place offers.`);
  };

  const handleDecline = (id, name) => {
    setBidders((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'declined' } : b))
    );
    showNotice(`Registration for ${name} has been declined.`);
  };

  const filteredBidders = useMemo(() => {
    if (filter === 'all') return bidders;
    return bidders.filter((b) => b.status === filter);
  }, [bidders, filter]);

  const counts = {
    pending: bidders.filter((b) => b.status === 'pending').length,
    approved: bidders.filter((b) => b.status === 'approved').length,
    declined: bidders.filter((b) => b.status === 'declined').length,
    all: bidders.length
  };

  const renderIdentity = (status) => {
    if (status === 'verified') {
      return (
        <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-success)' }}>
          ✓ Verified
        </span>
      );
    }
    if (status === 'checking') {
      return (
        <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-text-muted)' }}>
          … Checking
        </span>
      );
    }
    return (
      <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: 'var(--cmp-danger)' }}>
        ✕ Failed
      </span>
    );
  };

  const renderCheque = (status, amount) => {
    if (status === 'received') {
      return (
        <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--cmp-success)' }}>✓ Received</span>
          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>{amount}</span>
        </div>
      );
    }
    if (status === 'awaiting') {
      return (
        <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--cmp-text-muted)' }}>… Awaiting</span>
          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>{amount}</span>
        </div>
      );
    }
    return (
      <div style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
        <span style={{ fontWeight: 600, color: 'var(--cmp-danger)' }}>✕ Bounced</span>
        <span className="faint" style={{ display: 'block', fontSize: '12px' }}>{amount}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px' }}>Registrations</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Bidders asking to place offers. Approve once their identity is verified and their 10% security cheque has been received.
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

      {/* Filter Chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'pending'}
          onClick={() => setFilter('pending')}
        >
          Pending ({counts.pending})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'approved'}
          onClick={() => setFilter('approved')}
        >
          Approved ({counts.approved})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'declined'}
          onClick={() => setFilter('declined')}
        >
          Declined ({counts.declined})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Property</th>
              <th>Identity</th>
              <th>10% cheque</th>
              <th>Requested</th>
              <th>Status</th>
              <th style={{ textAlign: 'end' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBidders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No registrations found for this filter.
                </td>
              </tr>
            ) : (
              filteredBidders.map((row) => {
                const canApprove =
                  row.status === 'pending' &&
                  row.identityStatus === 'verified' &&
                  row.chequeStatus === 'received';

                return (
                  <tr key={row.id}>
                    <td style={{ minWidth: '200px' }}>
                      <span style={{ fontWeight: 600 }}>{row.name}</span>{' '}
                      <span className="faint">· {row.buyerTag}</span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {row.email} · {row.phone}
                      </span>
                    </td>
                    <td style={{ minWidth: '180px' }}>
                      <span style={{ fontSize: '13px' }}>{row.propertyTitle}</span>
                      <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                        {row.propertyRef}
                      </span>
                      <span className="row" style={{ gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: row.propertyStatusColor,
                            flexShrink: 0
                          }}
                        />
                        {row.propertyStatus}
                      </span>
                    </td>
                    <td>{renderIdentity(row.identityStatus)}</td>
                    <td>{renderCheque(row.chequeStatus, row.chequeAmount)}</td>
                    <td className="muted">{row.requestedTime}</td>
                    <td style={{ fontSize: '13px' }}>
                      {row.status === 'pending' && <span className="badge badge-accent">pending</span>}
                      {row.status === 'approved' && <span className="badge badge-brand">approved</span>}
                      {row.status === 'declined' && <span className="badge badge-neutral">declined</span>}
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {row.status === 'pending' && (
                          <>
                            {canApprove ? (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApprove(row.id, row.name)}
                              >
                                Approve
                              </button>
                            ) : row.identityStatus === 'checking' ? (
                              <span className="faint" style={{ fontSize: '12px' }}>
                                Waiting for identity check
                              </span>
                            ) : (
                              <span className="faint" style={{ fontSize: '12px' }}>
                                Identity check failed
                              </span>
                            )}
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDecline(row.id, row.name)}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {row.status === 'approved' && (
                          <span className="faint" style={{ fontSize: '12px', color: 'var(--cmp-brand)', fontWeight: 600 }}>
                            ✓ Active in auction
                          </span>
                        )}

                        {row.status === 'declined' && (
                          <span className="faint" style={{ fontSize: '12px' }}>
                            Access blocked
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
