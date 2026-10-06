import React from 'react';
import { useApp } from '../../context/AppContext';
import { Briefcase, DollarSign, Award, CheckCircle } from 'lucide-react';

export default function TransactionsPage() {
  const { transactions } = useApp();

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Closed Deals & Agency Transactions</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Historical record of completed sales, Form F transfers and commissions.
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Total Sales Volume</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            AED 23.1M
          </p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Agency Commissions</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--cmp-accent)' }}>
            AED 462,000
          </p>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Closed Deals</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800 }}>
            {transactions.length}
          </p>
        </div>
      </div>

      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Deal ID</th>
              <th>Property</th>
              <th>Buyer / Client</th>
              <th>Closing Price</th>
              <th>Commission</th>
              <th>Closing Date</th>
              <th>Broker</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td><strong>{tx.id}</strong></td>
                <td style={{ fontWeight: 600 }}>{tx.property}</td>
                <td>{tx.client}</td>
                <td style={{ fontWeight: 700 }}>{tx.price}</td>
                <td style={{ fontWeight: 700, color: 'var(--cmp-brand)' }}>{tx.commission}</td>
                <td className="muted">{tx.date}</td>
                <td>{tx.agent}</td>
                <td><span className="badge badge-brand">{tx.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
