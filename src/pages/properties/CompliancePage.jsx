import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Upload,
  ArrowRight
} from 'lucide-react';

export default function CompliancePage() {
  const { listings } = useApp();

  const complianceItems = [
    {
      id: 'CMP-S-001004',
      title: 'Duplex penthouse on the Palm',
      type: 'Trakheesi DLD Permit',
      status: 'Expired',
      statusText: 'Expired 3 days ago',
      severity: 'danger',
      agent: 'Layla Haddad'
    },
    {
      id: 'CMP-R-002004',
      title: 'Corner shop on retail podium',
      type: 'Form A (Owner Agreement)',
      status: 'Overdue',
      statusText: 'Overdue since 16 Sep',
      severity: 'danger',
      agent: 'Emma Clarke'
    },
    {
      id: 'CMP-S-001002',
      title: 'Burj Khalifa facing one bed',
      type: 'Trakheesi DLD Permit',
      status: 'Renew Soon',
      statusText: 'Expires in 22 days',
      severity: 'warning',
      agent: 'Layla Haddad'
    },
    {
      id: 'BRN-Saleh',
      title: 'Karim Saleh (Broker License)',
      type: 'RERA BRN License',
      status: 'Renew Soon',
      statusText: 'Expires in 46 days',
      severity: 'warning',
      agent: 'Karim Saleh'
    },
    {
      id: 'CMP-S-001001',
      title: 'Full marina view 2 bed in Marina Gate',
      type: 'Trakheesi DLD Permit',
      status: 'Verified',
      statusText: 'Valid until 12 Mar 2027',
      severity: 'success',
      agent: 'Karim Saleh'
    },
    {
      id: 'CMP-S-001005',
      title: 'Three bed townhouse near the park',
      type: 'Form A & DLD Permit',
      status: 'Verified',
      statusText: 'Valid until 28 Nov 2026',
      severity: 'success',
      agent: 'Arjun Mehta'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '24px' }}>Compliance & Regulatory Tracking</h1>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
          Dubai Land Department (DLD) permits, RERA Form A agreements and agent BRN license health.
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Permit Health</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--cmp-warning)' }}>
            75%
          </p>
          <span className="faint" style={{ fontSize: '12px' }}>2 permits need attention</span>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Active Form A</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            7 / 8
          </p>
          <span className="faint" style={{ fontSize: '12px' }}>Signed seller agreements</span>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <span className="muted" style={{ fontSize: '12.5px' }}>Registered BRNs</span>
          <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--cmp-brand)' }}>
            4 / 4
          </p>
          <span className="faint" style={{ fontSize: '12px' }}>All agents verified</span>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Entity / Reference</th>
              <th>Property / Subject</th>
              <th>Requirement</th>
              <th>Status</th>
              <th>Responsible Agent</th>
              <th style={{ textAlign: 'end' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complianceItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong style={{ color: 'var(--cmp-brand)' }}>{item.id}</strong>
                </td>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td>
                  <span className="badge badge-neutral">{item.type}</span>
                </td>
                <td>
                  <span
                    className={`badge ${
                      item.severity === 'danger'
                        ? 'badge-danger'
                        : item.severity === 'warning'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                  >
                    {item.status} · {item.statusText}
                  </span>
                </td>
                <td>{item.agent}</td>
                <td style={{ textAlign: 'end' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${item.severity === 'danger' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => alert(`Document submission dialog for ${item.id}`)}
                  >
                    <Upload size={13} />
                    <span>Upload</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
