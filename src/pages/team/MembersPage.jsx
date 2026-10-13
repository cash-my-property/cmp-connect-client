import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  ShieldCheck,
  User,
  X,
  Check,
  Mail,
  RotateCcw,
  UserMinus,
  UserCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { assignableRoles } from '../../utils/permissions';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'Never';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Never';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Never';
  }
};

export default function MembersPage() {
  const { account, authToken, can } = useApp();

  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState({ all: 0, ACTIVE: 0, INVITED: 0, INACTIVE: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Available roles for filter and invite
  const [availableRoles, setAvailableRoles] = useState([]);

  // Modals & notices
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isChangeRoleModalOpen, setIsChangeRoleModalOpen] = useState(false);
  const [activeMemberForRole, setActiveMemberForRole] = useState(null);
  const [selectedNewRoleId, setSelectedNewRoleId] = useState('');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [notice, setNotice] = useState(null);

  // Invite Form
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    roleId: '',
    brn: ''
  });
  const [inviteError, setInviteError] = useState(null);
  const [isInviting, setIsInviting] = useState(false);

  const actionMenuRef = useRef(null);

  const showNotice = (msg, isError = false) => {
    setNotice({ text: msg, isError });
    setTimeout(() => setNotice(null), 4000);
  };

  // Close row action dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const rolesFetchedRef = useRef(false);
  const isFetchingMembersRef = useRef(false);

  // Debounce search input by 300ms (only when value actually changes)
  useEffect(() => {
    if (searchQuery.trim() === debouncedSearch) return;
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  // Load Roles for filter and modal (fetched once per session)
  useEffect(() => {
    if (!authToken || rolesFetchedRef.current) return;
    rolesFetchedRef.current = true;

    cmpConnectApi.listRoles(authToken)
      .then((res) => {
        if (res?.data?.roles) {
          setAvailableRoles(res.data.roles);
        }
      })
      .catch((err) => {
        console.warn('[MembersPage] Could not fetch roles list:', err.message);
      });
  }, [authToken]);

  // Fetch Members List from Backend
  const fetchMembers = () => {
    if (!authToken || isFetchingMembersRef.current) return;
    isFetchingMembersRef.current = true;
    setIsLoading(true);

    const params = {
      search: debouncedSearch,
      roleId: roleFilter,
      status: statusFilter,
      page: pagination.page,
      limit: pagination.limit
    };

    cmpConnectApi.listMembers(params, authToken)
      .then((res) => {
        if (res?.data) {
          setMembers(res.data);
          if (res.counts) setCounts(res.counts);
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .catch((err) => {
        console.warn('[MembersPage] API fetch fallback to mock:', err.message);
      })
      .finally(() => {
        isFetchingMembersRef.current = false;
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchMembers();
  }, [authToken, debouncedSearch, roleFilter, statusFilter, pagination.page]);

  // Handle Invite Submission
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteForm.firstName.trim() || !inviteForm.email.trim() || !inviteForm.mobile.trim() || !inviteForm.roleId) {
      setInviteError('Please fill in First name, Email, Mobile and Role.');
      return;
    }

    try {
      setIsInviting(true);
      const res = await cmpConnectApi.inviteMember(
        {
          firstName: inviteForm.firstName.trim(),
          lastName: inviteForm.lastName.trim() || undefined,
          email: inviteForm.email.trim(),
          mobile: inviteForm.mobile.trim(),
          roleId: inviteForm.roleId,
          brn: inviteForm.brn.trim() || undefined
        },
        authToken
      );

      setIsInviteModalOpen(false);
      setInviteForm({ firstName: '', lastName: '', email: '', mobile: '', roleId: '', brn: '' });

      if (res?.data) {
        setMembers((prev) => [res.data, ...prev]);
        setCounts((prev) => ({ ...prev, all: prev.all + 1, INVITED: prev.INVITED + 1 }));
      } else {
        fetchMembers();
      }

      if (res?.data?.inviteEmailStatus === 'FAILED') {
        showNotice('User created, but invite email could not be delivered. Use Resend invite.', true);
      } else {
        showNotice(`Invite sent successfully to ${inviteForm.email}.`);
      }
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite.');
    } finally {
      setIsInviting(false);
    }
  };

  // Handle Resend Invite
  const handleResendInvite = async (member) => {
    setActiveActionMenuId(null);
    try {
      await cmpConnectApi.resendInvite(member.id, authToken);
      showNotice(`Invite resent to ${member.email}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to resend invite.', true);
    }
  };

  // Handle Change Role
  const openChangeRoleModal = (member) => {
    setActiveActionMenuId(null);
    setActiveMemberForRole(member);
    setSelectedNewRoleId(member.role?.id || '');
    setIsChangeRoleModalOpen(true);
  };

  const handleChangeRoleSubmit = async (e) => {
    e.preventDefault();
    if (!activeMemberForRole || !selectedNewRoleId) return;

    try {
      const res = await cmpConnectApi.changeMemberRole(activeMemberForRole.id, selectedNewRoleId, authToken);
      const updated = res?.data;
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        fetchMembers();
      }
      setIsChangeRoleModalOpen(false);
      showNotice(`Role updated for ${activeMemberForRole.fullName || activeMemberForRole.name}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to update role.', true);
    }
  };

  // Handle Status Toggle (Deactivate / Reactivate)
  const handleToggleStatus = async (member, targetStatus) => {
    setActiveActionMenuId(null);
    try {
      const res = await cmpConnectApi.setMemberStatus(member.id, targetStatus, authToken);
      const updated = res?.data;
      if (updated) {
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        fetchMembers();
      }
      showNotice(`${member.fullName || member.name} has been set to ${targetStatus.toLowerCase()}.`);
    } catch (err) {
      showNotice(err.message || 'Failed to update status.', true);
    }
  };

  // Assignable roles list (excluding Owner and roles with excessive permissions)
  const assignable = useMemo(() => {
    return assignableRoles(availableRoles, account);
  }, [availableRoles, account]);

  return (
    <div>
      {/* Title & Actions */}
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
            Members ({isLoading ? '…' : counts.all})
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '14px' }}>
            Manage agency agents, brokers, admins and account operators.
          </p>
        </div>

        {can('team.create') && (
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => setIsInviteModalOpen(true)}
            style={{ gap: '6px' }}
          >
            <Plus size={16} />
            <span>Create a new user</span>
          </button>
        )}
      </div>

      {/* Global Banner Notice */}
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
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notice.isError ? <AlertTriangle size={16} /> : <Check size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Status Segmented Quick Filter Chips */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[
          { key: 'all', label: 'All', count: isLoading ? '…' : counts.all },
          { key: 'ACTIVE', label: 'Active', count: isLoading ? '…' : counts.ACTIVE },
          { key: 'INVITED', label: 'Invited', count: isLoading ? '…' : counts.INVITED },
          { key: 'INACTIVE', label: 'Inactive', count: isLoading ? '…' : counts.INACTIVE }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className="chip"
            aria-pressed={statusFilter === tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{ gap: '6px' }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Search & Role Filter Bar */}
      <div className="row" style={{ gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '420px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          />
          <input
            id="users-search"
            placeholder="Search by name, email, mobile"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%', fontSize: '13px' }}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: '40px', width: '100%', fontSize: '13px' }}
          >
            <option value="">Any role</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Users ({isLoading ? '…' : pagination.total || members.length})</th>
              <th>Role</th>
              <th>Verification</th>
              <th>Compliance</th>
              <th>Status</th>
              <th>Activity</th>
              <th style={{ textAlign: 'end', width: '60px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--cmp-text-muted)' }}>
                  Loading team members...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--cmp-text-muted)' }}>
                  No members matched the filter criteria.
                </td>
              </tr>
            ) : (
              members.map((m) => {
                const displayName = m.fullName || m.name || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'User';
                const roleName = m.role?.name || (typeof m.role === 'string' ? m.role : 'Member');
                const initials = (displayName || 'U')
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const brnText = m.compliance?.brn ? `BRN#${m.compliance.brn}` : (typeof m.compliance === 'string' ? m.compliance : '—');
                const isBlocked = Boolean(m.blockedByCmp);
                const isInvited = m.status === 'INVITED';
                const isInactive = m.status === 'INACTIVE';
                const isActive = m.status === 'ACTIVE';

                return (
                  <tr key={m.id || m._id}>
                    <td>
                      <div className="row" style={{ gap: '12px', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            background: m.isOwner ? 'rgba(200, 130, 40, 0.15)' : 'var(--cmp-brand-subtle)',
                            color: m.isOwner ? 'var(--cmp-accent, #c88228)' : 'var(--cmp-brand)',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                            border: m.isOwner ? '1px solid rgba(200, 130, 40, 0.3)' : 'none'
                          }}
                        >
                          {initials}
                        </span>
                        <div>
                          <div className="row" style={{ gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <NavLink
                              to={`/team/members/${m.id || m._id}`}
                              style={{ color: 'var(--cmp-brand)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
                            >
                              {displayName}
                            </NavLink>
                            {m.isSelf && (
                              <span
                                className="badge"
                                style={{
                                  fontSize: '10.5px',
                                  padding: '1px 6px',
                                  background: 'var(--cmp-brand-subtle)',
                                  color: 'var(--cmp-brand)',
                                  border: '1px solid var(--cmp-brand-border)',
                                  fontWeight: 700
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>

                          {m.code && (
                            <span
                              className="badge"
                              style={{
                                display: 'inline-block',
                                fontSize: '10.5px',
                                fontFamily: 'monospace',
                                letterSpacing: '0.04em',
                                padding: '1px 5px',
                                marginTop: '3px',
                                background: 'var(--cmp-surface-sunken)',
                                color: 'var(--cmp-text-faint)'
                              }}
                              title="User Reference Code"
                            >
                              {m.code}
                            </span>
                          )}

                          <span className="faint" style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                            {m.mobile || m.phone || '—'}
                          </span>
                          <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                            {m.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'grid', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '13.5px' }}>{roleName}</span>
                        {m.isOwner && (
                          <span style={{ fontSize: '11px', color: 'var(--cmp-accent)', fontWeight: 700 }}>
                            ★ Owner
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      {m.verificationStatus === 'VERIFIED' ? (
                        <span className="row" style={{ gap: '4px', color: 'var(--cmp-success)', fontWeight: 600, fontSize: '13px' }}>
                          Verified <Check size={14} />
                        </span>
                      ) : m.verificationStatus === 'PENDING' ? (
                        <span className="badge badge-warning" style={{ fontSize: '12px' }}>
                          Pending
                        </span>
                      ) : m.verificationStatus === 'REJECTED' ? (
                        <span
                          className="badge"
                          style={{ background: 'rgba(179,38,30,0.1)', color: 'var(--cmp-danger)', fontSize: '12px' }}
                          title={m.verification?.note || 'Verification rejected'}
                        >
                          Rejected
                        </span>
                      ) : (
                        <span style={{ color: 'var(--cmp-warning)', fontSize: '13px', fontWeight: 500 }}>Unverified</span>
                      )}
                    </td>

                    <td>
                      {m.compliance?.brn ? (
                        <div>
                          <span style={{ color: 'var(--cmp-brand)', fontWeight: 600, fontSize: '13px' }}>
                            BRN#{m.compliance.brn}
                          </span>
                          {m.compliance.brnExpiry && (
                            <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                              Exp: {formatDate(m.compliance.brnExpiry)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>

                    <td>
                      {isBlocked ? (
                        <span
                          className="badge"
                          style={{ background: 'rgba(179,38,30,0.15)', color: 'var(--cmp-danger)', fontSize: '12px' }}
                          title={m.blockedReason || 'Suspended by CMP administration'}
                        >
                          Suspended by CMP
                        </span>
                      ) : isInvited ? (
                        <div>
                          <span
                            className="badge"
                            style={{
                              background: m.invite?.expired ? 'rgba(179,38,30,0.1)' : 'var(--cmp-surface-sunken)',
                              color: m.invite?.expired ? 'var(--cmp-danger)' : 'var(--cmp-text-muted)',
                              fontSize: '12px'
                            }}
                          >
                            Invited {m.invite?.expired ? '· Expired' : ''}
                          </span>
                          {m.invite && (
                            <span className="faint" style={{ display: 'block', fontSize: '11px', marginTop: '3px' }}>
                              {m.invite.emailStatus === 'SENT' ? 'Invite email sent' : m.invite.emailStatus ? `Email: ${m.invite.emailStatus}` : ''}
                              {m.invite.expiresAt ? ` · Exp: ${formatDate(m.invite.expiresAt)}` : ''}
                            </span>
                          )}
                        </div>
                      ) : isInactive ? (
                        <span className="badge" style={{ background: 'var(--cmp-surface-sunken)', color: 'var(--cmp-text-faint)', fontSize: '12px' }}>
                          Inactive
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--cmp-success)',
                            border: '1px solid currentColor',
                            background: 'var(--cmp-brand-subtle)'
                          }}
                        >
                          Active
                        </span>
                      )}
                    </td>

                    {/* Activity Column (lastLoginAt & createdAt) */}
                    <td>
                      <div style={{ fontSize: '12.5px', lineHeight: 1.4 }}>
                        {m.lastLoginAt ? (
                          <>
                            <span style={{ fontWeight: 600, color: 'var(--cmp-text)' }}>
                              {formatDateTime(m.lastLoginAt)}
                            </span>
                            <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                              Joined {formatDate(m.createdAt)}
                            </span>
                          </>
                        ) : isInvited ? (
                          <>
                            <span className="muted" style={{ fontSize: '12px' }}>Invite pending</span>
                            <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                              Invited {formatDate(m.invite?.invitedAt || m.createdAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="muted" style={{ fontSize: '12px' }}>Never logged in</span>
                            <span className="faint" style={{ display: 'block', fontSize: '11px' }}>
                              Joined {formatDate(m.createdAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Actions ⋮ Column */}
                    <td style={{ textAlign: 'end', position: 'relative' }}>
                      {/* Hide action menu for Owner and self */}
                      {!m.isOwner && !m.isSelf && (
                        <div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            onClick={() => setActiveActionMenuId(activeActionMenuId === m.id ? null : m.id)}
                            aria-label="Member actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeActionMenuId === m.id && (
                            <div
                              ref={actionMenuRef}
                              style={{
                                position: 'absolute',
                                right: '6px',
                                top: '38px',
                                zIndex: 60,
                                minWidth: '190px',
                                padding: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                background: 'var(--cmp-surface)',
                                border: '1px solid var(--cmp-border)',
                                borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                                textAlign: 'start'
                              }}
                            >
                              {/* Resend invite */}
                              {isInvited && can('team.create') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => handleResendInvite(m)}
                                >
                                  <Mail size={15} style={{ color: 'var(--cmp-brand)' }} />
                                  <span>Resend invite</span>
                                </button>
                              )}

                              {/* Change role */}
                              {can('team.profile_manage') && (
                                <button
                                  type="button"
                                  className="menu-item"
                                  onClick={() => openChangeRoleModal(m)}
                                >
                                  <Shield size={15} style={{ color: 'var(--cmp-text-muted)' }} />
                                  <span>Change role</span>
                                </button>
                              )}

                              {/* Deactivate / Reactivate */}
                              {can('team.delete') && (
                                <>
                                  {!isInactive ? (
                                    <button
                                      type="button"
                                      className="menu-item menu-item-danger"
                                      onClick={() => handleToggleStatus(m, 'INACTIVE')}
                                    >
                                      <UserMinus size={15} />
                                      <span>Deactivate</span>
                                    </button>
                                  ) : !isBlocked ? (
                                    <button
                                      type="button"
                                      className="menu-item"
                                      style={{ color: 'var(--cmp-success)' }}
                                      onClick={() => handleToggleStatus(m, 'ACTIVE')}
                                    >
                                      <UserCheck size={15} />
                                      <span>Reactivate</span>
                                    </button>
                                  ) : null}
                                </>
                              )}

                              <div style={{ height: '1px', background: 'var(--cmp-border)', margin: '4px 2px' }} />

                              <NavLink
                                to={`/team/members/${m.id || m._id}`}
                                className="menu-item"
                                style={{ textDecoration: 'none' }}
                              >
                                <User size={15} style={{ color: 'var(--cmp-text-muted)' }} />
                                <span>View profile</span>
                              </NavLink>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            borderTop: '1px solid var(--cmp-border)',
            fontSize: '13px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <span className="muted">
            Showing {members.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total || members.length)} of{' '}
            <strong>{pagination.total || members.length}</strong> members
          </span>

          <div className="row" style={{ gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              style={{ gap: '4px', padding: '4px 10px', height: '32px' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="faint" style={{ fontSize: '12px', padding: '0 4px' }}>
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={pagination.page >= (pagination.pages || 1) || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              style={{ gap: '4px', padding: '4px 10px', height: '32px' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE NEW USER / INVITE MODAL */}
      {isInviteModalOpen && (
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
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Invite new team member</h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {inviteError && (
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
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label>First name*</label>
                    <input
                      type="text"
                      placeholder="e.g. Karim"
                      value={inviteForm.firstName}
                      onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Last name</label>
                    <input
                      type="text"
                      placeholder="e.g. Saleh"
                      value={inviteForm.lastName}
                      onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label>Login email* (becomes their username)</label>
                  <input
                    type="email"
                    placeholder="user@agency.ae"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>Mobile phone* (UAE number)</label>
                  <input
                    type="tel"
                    placeholder="0553182240 or +971553182240"
                    value={inviteForm.mobile}
                    onChange={(e) => setInviteForm({ ...inviteForm, mobile: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label>Role*</label>
                  <select
                    value={inviteForm.roleId}
                    onChange={(e) => setInviteForm({ ...inviteForm, roleId: e.target.value })}
                    required
                  >
                    <option value="">Select a role</option>
                    <optgroup label="Default roles">
                      {assignable.filter((r) => r.isSystem).map((r) => (
                        <option key={r.id} value={r.id} disabled={r.disabled}>
                          {r.name} {r.disabled ? '(No permission)' : ''}
                        </option>
                      ))}
                    </optgroup>
                    {assignable.some((r) => !r.isSystem) && (
                      <optgroup label="Custom roles">
                        {assignable.filter((r) => !r.isSystem).map((r) => (
                          <option key={r.id} value={r.id} disabled={r.disabled}>
                            {r.name} {r.disabled ? '(No permission)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label>Dubai broker licence (BRN) (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 50318"
                    value={inviteForm.brn}
                    onChange={(e) => setInviteForm({ ...inviteForm, brn: e.target.value })}
                  />
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isInviting}>
                  {isInviting ? 'Sending invite...' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {isChangeRoleModalOpen && activeMemberForRole && (
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
          onClick={() => setIsChangeRoleModalOpen(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              background: 'var(--cmp-surface-raised)',
              boxShadow: 'var(--cmp-shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>
                Change role for {activeMemberForRole.fullName || activeMemberForRole.name}
              </h2>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsChangeRoleModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangeRoleSubmit}>
              <div style={{ margin: '14px 0' }}>
                <label>Select new role</label>
                <select
                  value={selectedNewRoleId}
                  onChange={(e) => setSelectedNewRoleId(e.target.value)}
                  required
                >
                  <option value="">Select a role</option>
                  {assignable.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.disabled}>
                      {r.name} {r.disabled ? '(No permission to assign)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row" style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsChangeRoleModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
