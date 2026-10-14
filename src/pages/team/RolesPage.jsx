import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  Shield,
  Lock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';

// Fallback initial groups mirroring server/src/utils/cmpConnectPermissions.js
const defaultFallbackGroups = [
  {
    key: 'CONTRACTS',
    label: 'Contracts & invoices',
    permissions: [
      { key: 'contracts.view', label: 'View contracts, payments and invoices' },
      { key: 'contracts.manage', label: 'Manage contracts, payments and invoices' }
    ]
  },
  {
    key: 'PROPERTIES',
    label: 'Properties',
    permissions: [
      { key: 'listings.view', label: 'View listings' },
      { key: 'listings.create', label: 'Create new listing' },
      { key: 'listings.update', label: 'Update listing details' },
      { key: 'listings.delete', label: 'Delete listings' },
      { key: 'listings.publish', label: 'Publish listings' },
      { key: 'listings.unpublish', label: 'Unpublish listings' },
      { key: 'listings.spotlight', label: 'Spotlight listings' },
      { key: 'listings.auto_renew', label: 'Auto renew listings' },
      { key: 'listings.archive', label: 'Archive listing' },
      { key: 'listings.approve', label: 'Approve or refuse listing' },
      { key: 'listings.upgrade_featured', label: 'Upgrade listing to Featured' },
      { key: 'listings.upgrade_premium', label: 'Upgrade listing to Premium' },
      { key: 'listings.downgrade', label: 'Downgrade listing' },
      { key: 'listings.preview', label: 'Preview listing' },
      { key: 'listings.claim_transaction', label: 'Claim transaction for a listing' }
    ]
  },
  {
    key: 'LEADS',
    label: 'Leads',
    permissions: [
      { key: 'leads.view', label: 'View regular leads' },
      { key: 'leads.manage', label: 'Create and update regular leads' },
      { key: 'leads.delete', label: 'Delete regular leads' },
      { key: 'leads.export_regular', label: 'Export regular leads' },
      { key: 'leads.call_view', label: 'View call leads' },
      { key: 'leads.whatsapp_view', label: 'View WhatsApp leads' },
      { key: 'leads.seller_manage', label: 'Manage seller leads' },
      { key: 'leads.export', label: 'Export leads' }
    ]
  },
  {
    key: 'CREDITS',
    label: 'Credits',
    permissions: [
      { key: 'credits.calculator', label: 'Use credit calculator' },
      { key: 'credits.give_teams', label: 'Give credits to teams' },
      { key: 'credits.give_agents', label: 'Give credits to agents' },
      { key: 'credits.return_request', label: 'Request credit return' },
      { key: 'credits.history_view', label: 'View credit usage history' },
      { key: 'credits.top_up', label: 'Top up credits' }
    ]
  },
  {
    key: 'TEAM',
    label: 'Users & roles',
    permissions: [
      { key: 'team.view', label: 'View all users' },
      { key: 'roles.view', label: 'View roles and permissions' },
      { key: 'team.profile_view', label: "View individual user's profile" },
      { key: 'team.profile_manage', label: "Manage individual user's profile" },
      { key: 'team.create', label: 'Create new users' },
      { key: 'roles.manage', label: 'Create and manage custom roles' },
      { key: 'team.delete', label: 'Deactivate / Reactivate users' }
    ]
  }
];

const defaultFallbackRoles = [
  { id: 'r-owner', key: 'OWNER', name: 'Owner', isSystem: true, editable: false, memberCount: 1, permissions: ['contracts.view', 'contracts.manage', 'listings.view', 'listings.create', 'listings.update', 'listings.delete', 'listings.publish', 'listings.unpublish', 'listings.spotlight', 'listings.auto_renew', 'listings.archive', 'listings.approve', 'listings.upgrade_featured', 'listings.upgrade_premium', 'listings.downgrade', 'listings.preview', 'listings.claim_transaction', 'leads.view', 'leads.manage', 'leads.delete', 'leads.export_regular', 'leads.call_view', 'leads.whatsapp_view', 'leads.seller_manage', 'leads.export', 'credits.calculator', 'credits.give_teams', 'credits.give_agents', 'credits.return_request', 'credits.history_view', 'credits.top_up', 'team.view', 'roles.view', 'team.profile_view', 'team.profile_manage', 'team.create', 'roles.manage', 'team.delete'] },
  { id: 'r-dir', key: 'DIRECTOR', name: 'Director', isSystem: true, editable: false, memberCount: 0, permissions: ['contracts.view', 'contracts.manage', 'listings.view', 'listings.create', 'listings.update', 'listings.delete', 'listings.publish', 'listings.unpublish', 'listings.spotlight', 'listings.auto_renew', 'listings.archive', 'listings.approve', 'listings.upgrade_featured', 'listings.upgrade_premium', 'listings.downgrade', 'listings.preview', 'listings.claim_transaction', 'leads.view', 'leads.manage', 'leads.delete', 'leads.export_regular', 'leads.call_view', 'leads.whatsapp_view', 'leads.seller_manage', 'leads.export', 'credits.calculator', 'credits.give_teams', 'credits.give_agents', 'credits.return_request', 'credits.history_view', 'credits.top_up', 'team.view', 'roles.view', 'team.profile_view', 'team.profile_manage', 'team.create', 'roles.manage', 'team.delete'] },
  { id: 'r-admin', key: 'OFFICE_ADMIN', name: 'Office admin', isSystem: true, editable: false, memberCount: 1, permissions: ['contracts.view', 'listings.view', 'listings.create', 'listings.update', 'listings.delete', 'listings.publish', 'listings.unpublish', 'listings.spotlight', 'listings.auto_renew', 'listings.archive', 'listings.approve', 'listings.upgrade_featured', 'listings.upgrade_premium', 'listings.downgrade', 'listings.preview', 'listings.claim_transaction', 'leads.view', 'leads.manage', 'leads.call_view', 'leads.whatsapp_view', 'leads.seller_manage', 'credits.calculator', 'credits.give_teams', 'credits.give_agents', 'credits.return_request', 'credits.history_view', 'credits.top_up', 'team.view', 'roles.view', 'team.profile_view', 'team.profile_manage', 'team.create', 'roles.manage', 'team.delete'] },
  { id: 'r-coord', key: 'COORDINATOR', name: 'Coordinator', isSystem: true, editable: false, memberCount: 0, permissions: ['listings.view', 'listings.create', 'listings.update', 'listings.delete', 'listings.publish', 'listings.unpublish', 'listings.auto_renew', 'listings.archive', 'listings.approve', 'listings.preview', 'listings.claim_transaction', 'leads.view', 'leads.manage', 'leads.call_view', 'leads.whatsapp_view', 'credits.calculator', 'team.view', 'roles.view', 'team.profile_view', 'team.profile_manage', 'team.create', 'roles.manage', 'team.delete'] },
  { id: 'r-agent', key: 'AGENT', name: 'Agent', isSystem: true, editable: false, memberCount: 3, permissions: ['listings.view', 'listings.create', 'listings.update', 'listings.preview', 'listings.claim_transaction', 'leads.view', 'leads.manage', 'leads.call_view', 'leads.whatsapp_view', 'roles.view', 'team.profile_view'] },
  { id: 'r-acc', key: 'ACCOUNTS', name: 'Accounts', isSystem: true, editable: false, memberCount: 1, permissions: ['contracts.view', 'contracts.manage', 'listings.view', 'credits.calculator', 'credits.give_teams', 'credits.give_agents', 'credits.return_request', 'credits.history_view', 'credits.top_up', 'roles.view', 'team.profile_view'] },
  { id: 'r-view', key: 'VIEWER', name: 'Viewer', isSystem: true, editable: false, memberCount: 0, permissions: ['roles.view', 'team.profile_view'] }
];

export default function RolesPage() {
  const { account, authToken, can, dataMode, isMockData } = useApp();

  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg, isError = false) => {
    setNotice({ text: msg, isError });
    setTimeout(() => setNotice(null), 4000);
  };

  // Sync roles & groups based on dataMode
  useEffect(() => {
    if (isMockData) {
      setGroups(defaultFallbackGroups);
      setRoles(defaultFallbackRoles);
      setIsLoading(false);
      return;
    }

    // Live Data Mode: API strictly called, no mock fallback
    if (!authToken) {
      setGroups([]);
      setRoles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    cmpConnectApi.listRoles(authToken)
      .then((res) => {
        if (res?.data?.groups && res?.data?.roles) {
          setGroups(res.data.groups);
          setRoles(res.data.roles);
        } else {
          setGroups([]);
          setRoles([]);
        }
      })
      .catch((err) => {
        console.warn('[RolesPage] Live API fetch error:', err.message);
        setGroups([]);
        setRoles([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authToken, isMockData]);



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
          <h1 style={{ fontSize: '26px', margin: 0, letterSpacing: '-0.02em' }}>
            Roles & access
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Company roles and the exact permissions each user type has on listings, leads, wallet and team.
          </p>
        </div>

      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: notice.isError ? 'rgba(179,38,30,0.1)' : 'var(--cmp-brand-subtle)',
            borderColor: notice.isError ? 'var(--cmp-danger)' : 'var(--cmp-brand-border)',
            color: notice.isError ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {notice.text}
        </div>
      )}

      {/* Permission Matrix Table */}
      {isLoading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
          Loading roles and permissions matrix...
        </div>
      ) : (
        <div className="card table-scroll" style={{ overflowX: 'auto' }}>
          <table className="data" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
          <thead>
            <tr>
              <th style={{ width: '300px', position: 'sticky', left: 0, background: 'var(--cmp-surface)', zIndex: 2 }}>
                Capability
              </th>
              {roles.map((r) => (
                <th key={r.id || r.key} style={{ textAlign: 'center', minWidth: '110px' }}>
                  <div style={{ display: 'grid', gap: '4px', placeItems: 'center' }}>
                    <div className="row" style={{ gap: '4px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{r.name}</span>
                      {!r.isSystem && (
                        <span
                          className="badge"
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            background: 'var(--cmp-accent-subtle)',
                            color: 'var(--cmp-accent)',
                            border: '1px solid var(--cmp-accent-border)'
                          }}
                        >
                          Custom
                        </span>
                      )}
                    </div>

                    </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((grp) => (
              <React.Fragment key={grp.key}>
                {/* Category Header Row */}
                <tr style={{ background: 'var(--cmp-surface-sunken)' }}>
                  <td
                    colSpan={roles.length + 1}
                    style={{
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--cmp-text-faint)',
                      position: 'sticky',
                      left: 0
                    }}
                  >
                    {grp.label}
                  </td>
                </tr>

                {/* Individual Permission Rows */}
                {grp.permissions.map((p) => (
                  <tr key={p.key}>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '13.5px',
                        fontWeight: 500,
                        position: 'sticky',
                        left: 0,
                        background: 'var(--cmp-surface)',
                        zIndex: 1,
                        borderRight: '1px solid var(--cmp-border)'
                      }}
                    >
                      {p.label}
                    </td>

                    {roles.map((r) => {
                      const hasAccess = r.key === 'OWNER' || (r.permissions && r.permissions.includes(p.key));
                      const tooltip = `${r.name} ${hasAccess ? 'can' : 'cannot'} ${p.label.toLowerCase()}`;

                      return (
                        <td
                          key={r.id || r.key}
                          style={{ textAlign: 'center', padding: '12px 6px' }}
                          title={tooltip}
                        >
                          {hasAccess ? (
                            <span
                              style={{
                                display: 'inline-grid',
                                placeItems: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--cmp-brand-subtle)',
                                color: 'var(--cmp-brand)'
                              }}
                            >
                              <Check size={14} strokeWidth={2.5} />
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-grid',
                                placeItems: 'center',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                color: 'var(--cmp-text-faint)',
                                opacity: 0.35
                              }}
                            >
                              <X size={14} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
