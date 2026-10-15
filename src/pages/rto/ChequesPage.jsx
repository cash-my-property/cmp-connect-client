import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, CheckCircle2, RotateCcw, AlertTriangle, Building } from 'lucide-react';

const initialCheques = [
  {
    id: 'ch1',
    bidderName: 'Yousef Al Marri',
    bidderTag: 'Buyer 7',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    amountNum: 950000,
    amountLabel: 'AED 950,000',
    chequeNo: 'No. 004812',
    bank: 'Emirates NBD',
    receivedDate: '2026-09-11',
    status: 'received', // 'received' | 'awaiting' | 'returned' | 'cashed' | 'bounced'
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch2',
    bidderName: 'Hala Mansour',
    bidderTag: 'Buyer 12',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    amountNum: 950000,
    amountLabel: 'AED 950,000',
    chequeNo: 'No. 118830',
    bank: 'ADCB',
    receivedDate: '2026-09-14',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch3',
    bidderName: 'Lukas Berger',
    bidderTag: 'Buyer 14',
    propertyTitle: 'Duplex penthouse on the Palm',
    propertyRef: 'CMP-L-004120',
    propertyOpening: '10% of AED 9.5M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    amountNum: 950000,
    amountLabel: 'AED 950,000',
    chequeNo: 'No. 220417',
    bank: 'Mashreq',
    receivedDate: '2026-09-14',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch4',
    bidderName: 'Mei Tanaka',
    bidderTag: 'Buyer 3',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyOpening: '10% of AED 2.1M opening offer',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    amountNum: 210000,
    amountLabel: 'AED 210,000',
    chequeNo: 'No. 090221',
    bank: 'First Abu Dhabi Bank',
    receivedDate: '2026-09-12',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch5',
    bidderName: 'Ravi Menon',
    bidderTag: 'Buyer 13',
    propertyTitle: 'Two bed on a high floor of Marina Gate',
    propertyRef: 'CMP-L-004121',
    propertyOpening: '10% of AED 2.1M opening offer',
    propertyStatus: 'Closing now',
    propertyStatusColor: 'var(--cmp-danger)',
    amountNum: 210000,
    amountLabel: 'AED 210,000',
    chequeNo: 'No. 331904',
    bank: 'HSBC UAE',
    receivedDate: '2026-09-14',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch6',
    bidderName: 'Sophie Lambert',
    bidderTag: 'Buyer 4',
    propertyTitle: 'Three bed townhouse near the park',
    propertyRef: 'CMP-L-004123',
    propertyOpening: '10% of AED 3.6M opening offer',
    propertyStatus: 'Opens soon',
    propertyStatusColor: 'var(--cmp-info)',
    amountNum: 360000,
    amountLabel: 'AED 360,000',
    chequeNo: 'No. 562210',
    bank: 'RAKBANK',
    receivedDate: '2026-09-14',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch7',
    bidderName: 'Faisal Qureshi',
    bidderTag: 'Buyer 9',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyOpening: '10% of AED 4.8M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    amountNum: 480000,
    amountLabel: 'AED 480,000',
    chequeNo: null,
    bank: 'Not yet received',
    receivedDate: '—',
    status: 'awaiting',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch8',
    bidderName: 'Grace Okafor',
    bidderTag: 'Buyer 15',
    propertyTitle: 'Four bedroom family villa',
    propertyRef: 'CMP-L-004122',
    propertyOpening: '10% of AED 4.8M opening offer',
    propertyStatus: 'Offers open',
    propertyStatusColor: 'var(--cmp-success)',
    amountNum: 480000,
    amountLabel: 'AED 480,000',
    chequeNo: 'No. 771045',
    bank: 'Commercial Bank of Dubai',
    receivedDate: '2026-09-12',
    status: 'bounced',
    subText: 'on 2026-09-13',
    isReadyToReturn: false,
    isWinningBidder: false
  },
  {
    id: 'ch9',
    bidderName: 'Daniel Brooks',
    bidderTag: 'Buyer 5 · winning bidder',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyOpening: '10% of AED 1.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    amountNum: 190000,
    amountLabel: 'AED 190,000',
    chequeNo: 'No. 400118',
    bank: 'Emirates NBD',
    receivedDate: '2026-09-03',
    status: 'received',
    isReadyToReturn: false,
    isWinningBidder: true
  },
  {
    id: 'ch10',
    bidderName: 'Noura Saeed',
    bidderTag: 'Buyer 8',
    propertyTitle: 'One bed in The Address Residences',
    propertyRef: 'CMP-L-004098',
    propertyOpening: '10% of AED 1.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    amountNum: 190000,
    amountLabel: 'AED 190,000',
    chequeNo: 'No. 400931',
    bank: 'Dubai Islamic Bank',
    receivedDate: '2026-09-04',
    status: 'received',
    isReadyToReturn: true,
    isWinningBidder: false
  },
  {
    id: 'ch11',
    bidderName: 'Hassan Rafiq',
    bidderTag: 'Buyer 3',
    propertyTitle: 'Furnished studio with pool view',
    propertyRef: 'CMP-L-004076',
    propertyOpening: '10% of AED 560K opening offer',
    propertyStatus: 'Reserve not met',
    propertyStatusColor: 'var(--cmp-text-faint)',
    amountNum: 56000,
    amountLabel: 'AED 56,000',
    chequeNo: 'No. 120087',
    bank: 'ADIB',
    receivedDate: '2026-08-30',
    status: 'received',
    isReadyToReturn: true,
    isWinningBidder: false
  },
  {
    id: 'ch12',
    bidderName: 'Chloe Martin',
    bidderTag: 'Buyer 2 · winning bidder',
    propertyTitle: 'Canal view three bed with study',
    propertyRef: 'CMP-L-004051',
    propertyOpening: '10% of AED 2.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    amountNum: 290000,
    amountLabel: 'AED 290,000',
    chequeNo: 'No. 613302',
    bank: 'First Abu Dhabi Bank',
    receivedDate: '2026-08-22',
    status: 'returned',
    subText: 'on 2026-09-10',
    isReadyToReturn: false,
    isWinningBidder: true
  },
  {
    id: 'ch13',
    bidderName: 'Imran Sheikh',
    bidderTag: 'Buyer 6',
    propertyTitle: 'Canal view three bed with study',
    propertyRef: 'CMP-L-004051',
    propertyOpening: '10% of AED 2.9M opening offer',
    propertyStatus: 'Sold',
    propertyStatusColor: 'var(--cmp-brand)',
    amountNum: 290000,
    amountLabel: 'AED 290,000',
    chequeNo: 'No. 613877',
    bank: 'Mashreq',
    receivedDate: '2026-08-21',
    status: 'returned',
    subText: 'on 2026-08-26',
    isReadyToReturn: false,
    isWinningBidder: false
  }
];

export default function ChequesPage() {
  const { isLiveData } = useApp();
  const [cheques, setCheques] = useState(() => (isLiveData ? [] : initialCheques));
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setCheques(isLiveData ? [] : initialCheques);
  }, [isLiveData]);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleReturnAllReady = () => {
    const readyCount = cheques.filter((c) => c.isReadyToReturn && c.status === 'received').length;
    if (readyCount === 0) {
      showNotice('No cheques are currently marked ready for return.');
      return;
    }
    setCheques((prev) =>
      prev.map((c) =>
        c.isReadyToReturn && c.status === 'received'
          ? {
              ...c,
              status: 'returned',
              isReadyToReturn: false,
              subText: `on ${new Date().toISOString().slice(0, 10)}`
            }
          : c
      )
    );
    showNotice(`Returned ${readyCount} security cheques to non-winning bidders.`);
  };

  const handleReturnSingle = (id, name) => {
    setCheques((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'returned',
              isReadyToReturn: false,
              subText: `on ${new Date().toISOString().slice(0, 10)}`
            }
          : c
      )
    );
    showNotice(`Cheque returned to ${name}.`);
  };

  const handleMarkReceived = (id, name) => {
    setCheques((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'received',
              chequeNo: 'No. ' + Math.floor(100000 + Math.random() * 900000),
              bank: 'Emirates NBD',
              receivedDate: new Date().toISOString().slice(0, 10)
            }
          : c
      )
    );
    showNotice(`Security cheque received and held in vault for ${name}.`);
  };

  const handleCashCheque = (id, name) => {
    setCheques((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'cashed',
              subText: `cashed on ${new Date().toISOString().slice(0, 10)}`
            }
          : c
      )
    );
    showNotice(`Cheque for ${name} dispatched for banking.`);
  };

  const filteredCheques = useMemo(() => {
    if (filter === 'all') return cheques;
    return cheques.filter((c) => c.status === filter);
  }, [cheques, filter]);

  const counts = {
    all: cheques.length,
    awaiting: cheques.filter((c) => c.status === 'awaiting').length,
    received: cheques.filter((c) => c.status === 'received').length,
    returned: cheques.filter((c) => c.status === 'returned').length,
    cashed: cheques.filter((c) => c.status === 'cashed').length,
    bounced: cheques.filter((c) => c.status === 'bounced').length
  };

  const heldTotal = cheques
    .filter((c) => c.status === 'received')
    .reduce((acc, curr) => acc + curr.amountNum, 0);

  const readyToReturnCount = cheques.filter(
    (c) => c.isReadyToReturn && c.status === 'received'
  ).length;

  const readyToReturnTotal = cheques
    .filter((c) => c.isReadyToReturn && c.status === 'received')
    .reduce((acc, curr) => acc + curr.amountNum, 0);

  const awaitingTotal = cheques
    .filter((c) => c.status === 'awaiting')
    .reduce((acc, curr) => acc + curr.amountNum, 0);

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '26px' }}>Cheques</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px', maxWidth: '760px' }}>
          Cash My Property takes no deposit. Each bidder lodges a security cheque for 10% of the property’s opening offer. Cheques go back once offers close, and the winner’s is only cashed if they fail to complete the sale.
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
      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Held now
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            AED {(heldTotal / 1000000).toFixed(2)}M
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {counts.received} cheques
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ready to return
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            AED {Math.round(readyToReturnTotal / 1000)}K
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {readyToReturnCount} bidders who did not win
          </p>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <p className="faint" style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Awaiting
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '26px', fontWeight: 700, color: 'var(--cmp-brand)' }}>
            AED {Math.round(awaitingTotal / 1000)}K
          </p>
          <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
            {counts.awaiting} bidder yet to lodge
          </p>
        </div>
      </div>

      {/* Filter Chips & Batch Action */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'awaiting'}
          onClick={() => setFilter('awaiting')}
        >
          Awaiting ({counts.awaiting})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'received'}
          onClick={() => setFilter('received')}
        >
          Received ({counts.received})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'returned'}
          onClick={() => setFilter('returned')}
        >
          Returned ({counts.returned})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'cashed'}
          onClick={() => setFilter('cashed')}
        >
          Cashed ({counts.cashed})
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={filter === 'bounced'}
          onClick={() => setFilter('bounced')}
        >
          Bounced ({counts.bounced})
        </button>

        {readyToReturnCount > 0 && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginInlineStart: 'auto' }}
            onClick={handleReturnAllReady}
          >
            Return all ready ({readyToReturnCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Bidder</th>
              <th>Property</th>
              <th style={{ textAlign: 'end' }}>Amount</th>
              <th>Cheque</th>
              <th>Received</th>
              <th>Status</th>
              <th style={{ textAlign: 'end' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheques.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px' }} className="muted">
                  No cheques found matching this filter.
                </td>
              </tr>
            ) : (
              filteredCheques.map((row) => (
                <tr key={row.id}>
                  <td style={{ minWidth: '170px' }}>
                    <span style={{ fontWeight: 600 }}>{row.bidderName}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {row.bidderTag}
                    </span>
                  </td>
                  <td style={{ minWidth: '200px' }}>
                    <span style={{ fontSize: '13px' }}>{row.propertyTitle}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {row.propertyRef} · {row.propertyOpening}
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
                  <td style={{ textAlign: 'end', fontWeight: 700, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {row.amountLabel}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                    {row.chequeNo ? (
                      <>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.chequeNo}</span>
                        <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                          {row.bank}
                        </span>
                      </>
                    ) : (
                      <span className="faint">Not yet received</span>
                    )}
                  </td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {row.receivedDate}
                  </td>
                  <td>
                    {row.status === 'received' && <span className="badge badge-brand">Received</span>}
                    {row.status === 'awaiting' && <span className="badge badge-accent">Awaiting</span>}
                    {row.status === 'returned' && (
                      <>
                        <span className="badge badge-neutral">Returned</span>
                        {row.subText && (
                          <span className="faint" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                            {row.subText}
                          </span>
                        )}
                      </>
                    )}
                    {row.status === 'cashed' && (
                      <>
                        <span className="badge badge-accent">Cashed</span>
                        {row.subText && (
                          <span className="faint" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                            {row.subText}
                          </span>
                        )}
                      </>
                    )}
                    {row.status === 'bounced' && (
                      <>
                        <span className="badge badge-neutral">Bounced</span>
                        {row.subText && (
                          <span className="faint" style={{ display: 'block', fontSize: '12px', marginTop: '4px' }}>
                            {row.subText}
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td style={{ minWidth: '220px' }}>
                    <div className="row" style={{ gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {row.status === 'awaiting' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMarkReceived(row.id, row.bidderName)}
                        >
                          Mark received
                        </button>
                      )}

                      {row.status === 'received' && row.isWinningBidder && (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleReturnSingle(row.id, row.bidderName)}
                          >
                            Return on completion
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleCashCheque(row.id, row.bidderName)}
                          >
                            Cash cheque
                          </button>
                        </>
                      )}

                      {row.status === 'received' && row.isReadyToReturn && !row.isWinningBidder && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleReturnSingle(row.id, row.bidderName)}
                        >
                          Return cheque
                        </button>
                      )}

                      {row.status === 'received' && !row.isReadyToReturn && !row.isWinningBidder && (
                        <span className="faint" style={{ fontSize: '12px' }}>
                          Held until offers close
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
