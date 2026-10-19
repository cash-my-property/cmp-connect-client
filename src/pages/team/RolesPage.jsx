import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  Shield,
  Lock,
  AlertTriangle,
  Info,
  Plus,
  Edit2,
  Trash2,
  Loader2
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

  const userHasPerm = (permKey) => {
    if (account?.role?.key === 'OWNER') return true;
    return Array.isArray(account?.permissions) && account.permissions.includes(permKey);
  };

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    baseRoleKey: 'AGENT',
    permissions: []
  });
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [roleModalError, setRoleModalError] = useState(null);

  const fetchRolesData = async () => {
    if (!authToken || isMockData) return;
    try {
      const res = await cmpConnectApi.listRoles(authToken);
      if (res?.data?.groups && res?.data?.roles) {
        setGroups(res.data.groups);
        setRoles(res.data.roles);
      }
    } catch (err) {
      console.warn('[RolesPage] fetch error:', err.message);
    }
  };

  const openCreateModal = () => {
    const defaultBase = roles.find((r) => r.key === 'AGENT') || roles.find((r) => r.isSystem && r.key !== 'OWNER');
    const basePerms = defaultBase?.permissions || [];
    const allowedPerms = basePerms.filter((p) => userHasPerm(p));
    setRoleForm({
      name: '',
      description: '',
      baseRoleKey: defaultBase?.key || 'AGENT',
      permissions: allowedPerms
    });
    setEditingRoleId(null);
    setRoleModalError(null);
    setIsRoleModalOpen(true);
  };

  const openEditModal = (role) => {
    setRoleForm({
      name: role.name || '',
      description: role.description || '',
      baseRoleKey: role.baseRoleKey || 'AGENT',
      permissions: role.permissions || []
    });
    setEditingRoleId(role.id);
    setRoleModalError(null);
    setIsRoleModalOpen(true);
  };

  const handleBaseRoleChange = (newBaseKey) => {
    const baseRole = roles.find((r) => r.key === newBaseKey);
    const basePerms = baseRole?.permissions || [];
    const allowedPerms = basePerms.filter((p) => userHasPerm(p));
    setRoleForm((prev) => ({
      ...prev,
      baseRoleKey: newBaseKey,
      permissions: allowedPerms
    }));
  };

  const togglePermission = (permKey) => {
    if (!userHasPerm(permKey)) return;
    setRoleForm((prev) => {
      const has = prev.permissions.includes(permKey);
      return {
        ...prev,
        permissions: has
          ? prev.permissions.filter((k) => k !== permKey)
          : [...prev.permissions, permKey]
      };
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      setRoleModalError('Role name is required (2–50 characters).');
      return;
    }
    setIsSubmittingRole(true);
    setRoleModalError(null);

    try {
      if (editingRoleId) {
        await cmpConnectApi.updateCustomRole(
          editingRoleId,
          {
            name: roleForm.name.trim(),
            description: roleForm.description.trim(),
            permissions: roleForm.permissions
          },
          authToken
        );
        showNotice(`Custom role "${roleForm.name}" updated successfully.`);
      } else {
        await cmpConnectApi.createCustomRole(
          {
            name: roleForm.name.trim(),
            description: roleForm.description.trim(),
            baseRoleKey: roleForm.baseRoleKey,
            permissions: roleForm.permissions
          },
          authToken
        );
        showNotice(`Custom role "${roleForm.name}" created successfully.`);
      }
      setIsRoleModalOpen(false);
      await fetchRolesData();
    } catch (err) {
      setRoleModalError(err.message || 'Failed to save role.');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.memberCount > 0) {
      alert(`Cannot delete "${role.name}" while it is assigned to ${role.memberCount} member(s). Reassign them first.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete custom role "${role.name}"?`)) {
      return;
    }

    try {
      await cmpConnectApi.deleteCustomRole(role.id, authToken);
      showNotice(`Role "${role.name}" deleted.`);
      await fetchRolesData();
    } catch (err) {
      showNotice(err.message || 'Failed to delete role.', true);
    }
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
          <h1 style={{ fontSize: '26px', margin: 0, letterSpacing: '-0.02em' }}>
            Roles & access
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Company roles and the exact permissions each user type has on listings, leads, wallet and team.
          </p>
        </div>

        {can('roles.manage') && (
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={openCreateModal}
            style={{ gap: '6px' }}
          >
            <Plus size={16} />
            <span>Create custom role</span>
          </button>
        )}
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
          <Loader2 size={24} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px' }} />
          <span>Loading roles and permissions matrix...</span>
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
                <th key={r.id || r.key} style={{ textAlign: 'center', minWidth: '130px', padding: '12px 8px' }}>
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

                    <span className="faint" style={{ fontSize: '11px' }}>
                      {r.memberCount || 0} {r.memberCount === 1 ? 'member' : 'members'}
                    </span>

                    {/* Actions for custom roles */}
                    {!r.isSystem && can('roles.manage') && (
                      <div className="row" style={{ gap: '4px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '3px 6px', height: 'auto' }}
                          title="Edit role name and permissions"
                          onClick={() => openEditModal(r)}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={r.memberCount > 0}
                          style={{
                            padding: '3px 6px',
                            height: 'auto',
                            color: r.memberCount > 0 ? 'var(--cmp-text-faint)' : 'var(--cmp-danger)'
                          }}
                          title={
                            r.memberCount > 0
                              ? `Cannot delete while assigned to ${r.memberCount} member(s)`
                              : 'Delete custom role'
                          }
                          onClick={() => handleDeleteRole(r)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
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

      {/* CREATE / EDIT CUSTOM ROLE MODAL */}
      {isRoleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--cmp-overlay)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: '16px'
          }}
          onClick={() => setIsRoleModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                {editingRoleId ? 'Edit custom role' : 'Create a custom role'}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {roleModalError && (
              <div
                className="card"
                style={{
                  padding: '10px 14px',
                  marginBottom: '14px',
                  background: 'rgba(179,38,30,0.1)',
                  color: 'var(--cmp-danger)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {roleModalError}
              </div>
            )}

            <form onSubmit={handleSaveRole}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label>Role Name* (2–50 characters)</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Listing Specialist"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    required
                    maxLength={50}
                  />
                </div>

                <div>
                  <label>Description (optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what members with this role can do..."
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  />
                </div>

                {!editingRoleId && (
                  <div>
                    <label>Based on Default Role</label>
                    <select
                      value={roleForm.baseRoleKey}
                      onChange={(e) => handleBaseRoleChange(e.target.value)}
                    >
                      {roles
                        .filter((r) => r.isSystem && r.key !== 'OWNER')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                    <span className="faint" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Pre-fills permissions from this standard template.
                    </span>
                  </div>
                )}

                <div>
                  <label style={{ marginBottom: '4px', display: 'block' }}>
                    Permissions ({roleForm.permissions.length} selected)
                  </label>
                  <span className="faint" style={{ fontSize: '12px', display: 'block', marginBottom: '10px' }}>
                    You can only grant permissions that your own role possesses.
                  </span>

                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      border: '1px solid var(--cmp-border)',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  >
                    {groups.map((grp) => (
                      <div key={grp.key} style={{ marginBottom: '14px' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: 'var(--cmp-text-faint)',
                            marginBottom: '6px'
                          }}
                        >
                          {grp.label}
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {grp.permissions.map((p) => {
                            const isAllowed = userHasPerm(p.key);
                            const isChecked = roleForm.permissions.includes(p.key);

                            return (
                              <label
                                key={p.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '13px',
                                  cursor: isAllowed ? 'pointer' : 'not-allowed',
                                  opacity: isAllowed ? 1 : 0.45,
                                  fontWeight: 500
                                }}
                                title={!isAllowed ? 'You cannot grant permissions you do not possess' : ''}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={!isAllowed}
                                  onChange={() => togglePermission(p.key)}
                                />
                                <span>{p.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsRoleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmittingRole || !roleForm.name.trim()}
                >
                  {isSubmittingRole ? 'Saving...' : editingRoleId ? 'Save changes' : 'Create role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
