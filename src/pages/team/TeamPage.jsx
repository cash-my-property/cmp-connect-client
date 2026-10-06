import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Award, Shield, Check, X, Plus } from 'lucide-react';

export default function TeamPage() {
  const { team } = useApp();
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'roles'

  const permissionsList = [
    { name: 'View properties & listings', owner: true, director: true, admin: true, coord: true, agent: true, acct: true, viewer: false },
    { name: 'Create new listing & upload media', owner: true, director: true, admin: true, coord: true, agent: true, acct: false, viewer: false },
    { name: 'Publish & unpublish listings', owner: true, director: true, admin: true, coord: true, agent: false, acct: false, viewer: false },
    { name: 'Approve or refuse listing drafts', owner: true, director: true, admin: true, coord: true, agent: false, acct: false, viewer: false },
    { name: 'Enter property into Real Time Offer', owner: true, director: true, admin: true, coord: false, agent: false, acct: false, viewer: false },
    { name: 'View billing, invoices & buy credits', owner: true, director: true, admin: false, coord: false, agent: false, acct: true, viewer: false },
    { name: 'Manage team members & permissions', owner: true, director: true, admin: false, coord: false, agent: false, acct: false, viewer: false }
  ];

  return (
    <div>
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
          <h1 style={{ fontSize: '24px' }}>Team & Access Control</h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Broker leaderboard, members directory and granular role access matrix.
          </p>
        </div>

        <div className="segmented">
          <button
            type="button"
            className={activeTab === 'leaderboard' ? 'active' : ''}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            type="button"
            className={activeTab === 'roles' ? 'active' : ''}
            onClick={() => setActiveTab('roles')}
          >
            Roles & Access Matrix
          </button>
        </div>
      </div>

      {activeTab === 'leaderboard' ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Top Leaderboard Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {team.map((member, i) => (
              <div key={member.id} className="card" style={{ padding: '18px', position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: i === 0 ? 'var(--cmp-accent)' : 'var(--cmp-surface-sunken)',
                    color: i === 0 ? '#FFFFFF' : 'var(--cmp-text-muted)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '12px'
                  }}
                >
                  #{i + 1}
                </span>

                <div className="row" style={{ gap: '12px', marginBottom: '14px' }}>
                  <span
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--cmp-brand-subtle)',
                      color: 'var(--cmp-brand)',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}
                  >
                    {member.initials}
                  </span>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{member.name}</strong>
                    <div className="muted" style={{ fontSize: '12.5px' }}>{member.role}</div>
                  </div>
                </div>

                <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderTop: '1px solid var(--cmp-border)' }}>
                  <span className="muted">RERA BRN:</span>
                  <strong>{member.brn}</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
                  <span className="muted">Deals Closed:</span>
                  <strong style={{ color: 'var(--cmp-brand)' }}>{member.dealsCount} deals</strong>
                </div>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', padding: '6px 0' }}>
                  <span className="muted">Active Listings:</span>
                  <strong>{member.listingsCount} properties</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Roles & Granular Permissions Matrix */
        <div className="card table-scroll">
          <table className="data" style={{ minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '260px' }}>Permission Scope</th>
                <th style={{ textAlign: 'center' }}>Owner</th>
                <th style={{ textAlign: 'center' }}>Director</th>
                <th style={{ textAlign: 'center' }}>Office Admin</th>
                <th style={{ textAlign: 'center' }}>Coordinator</th>
                <th style={{ textAlign: 'center' }}>Agent</th>
                <th style={{ textAlign: 'center' }}>Accounts</th>
              </tr>
            </thead>
            <tbody>
              {permissionsList.map((perm, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{perm.name}</td>
                  {['owner', 'director', 'admin', 'coord', 'agent', 'acct'].map((r) => (
                    <td key={r} style={{ textAlign: 'center' }}>
                      {perm[r] ? (
                        <Check size={16} style={{ color: 'var(--cmp-brand)' }} />
                      ) : (
                        <X size={15} style={{ color: 'var(--cmp-text-faint)' }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
