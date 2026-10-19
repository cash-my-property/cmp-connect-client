import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
import {
  Avatar,
  Chip,
  CountBadge,
  Dropdown,
  EmptyState,
  SearchInput
} from '../../components/ui';
import { exportToCsv } from '../../utils';
import { useDebounce } from '../../hooks';

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    dateGroup: 'Today',
    initials: 'KS',
    agent: 'Karim Saleh',
    action: 'Replied to Eden Tesfaye on WhatsApp',
    time: '09:12 AM',
    area: 'Clients',
    link: '/clients'
  },
  {
    id: 2,
    dateGroup: 'Today',
    initials: 'LH',
    agent: 'Layla Haddad',
    action: 'Boosted CMP-S-001002 to Featured for 15 days (85 credits)',
    time: '08:40 AM',
    area: 'Credits',
    link: '/wallet'
  },
  {
    id: 3,
    dateGroup: 'Yesterday',
    initials: 'EC',
    agent: 'Emma Clarke',
    action: 'Saved CMP-R-002004 as a draft',
    time: '05:05 PM',
    area: 'Properties',
    link: '/properties'
  },
  {
    id: 4,
    dateGroup: 'Yesterday',
    initials: 'LH',
    agent: 'Layla Haddad',
    action: 'Moved Aisha Rahman to Contacted',
    time: '03:20 PM',
    area: 'Clients',
    link: '/clients'
  },
  {
    id: 5,
    dateGroup: 'Tuesday, 15 September',
    initials: 'AM',
    agent: 'Arjun Mehta',
    action: 'Refreshed CMP-S-001005',
    time: '11:00 AM',
    area: 'Properties',
    link: '/properties'
  },
  {
    id: 6,
    dateGroup: 'Monday, 14 September',
    initials: 'LH',
    agent: 'Layla Haddad',
    action: 'Invited Sara Haddad as an Agent',
    time: '02:30 PM',
    area: 'Team',
    link: '/team'
  }
];

const TYPE_TABS = [
  { label: 'All Activity', value: 'ALL' },
  { label: 'Listings', value: 'LISTING' },
  { label: 'Team', value: 'MEMBER' },
  { label: 'Roles', value: 'ROLE' },
  { label: 'Company', value: 'COMPANY' }
];

export default function ActivityLogPage() {
  const { isLiveData, authToken } = useApp();
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveActivities, setLiveActivities] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 30, pages: 1 });
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch real activities
  const fetchLiveActivities = useCallback(async () => {
    if (!isLiveData || !authToken) return;
    setIsLoading(true);
    try {
      const res = await cmpConnectApi.getActivityLog(
        {
          type: selectedType,
          page: pagination.page,
          limit: 30
        },
        authToken
      );
      if (Array.isArray(res?.data)) {
        setLiveActivities(res.data);
      }
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.warn('[ActivityLog] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLiveData, authToken, selectedType, pagination.page]);

  useEffect(() => {
    fetchLiveActivities();
  }, [fetchLiveActivities]);

  // Resolve entity link
  const resolveEntityLink = (entity) => {
    if (!entity?.id) return '/';
    if (entity.type === 'LISTING') return `/properties/${entity.id}/edit`;
    if (entity.type === 'MEMBER') return `/team/members`;
    if (entity.type === 'ROLE') return `/team/roles`;
    if (entity.type === 'COMPANY') return `/properties/brand-kit`;
    return '/';
  };

  // Mock filtering
  const filteredMockActivities = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return INITIAL_ACTIVITIES.filter((item) => {
      if (!q) return true;
      return (
        item.agent.toLowerCase().includes(q) ||
        item.action.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q)
      );
    });
  }, [debouncedQuery]);

  const displayList = isLiveData ? liveActivities : filteredMockActivities;

  return (
    <div>
      {/* Page Header */}
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
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Activity log{' '}
            <CountBadge count={isLiveData ? (pagination.total || liveActivities.length) : filteredMockActivities.length} />
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Real-time audit log of listings published, team role changes, and compliance updates.
          </p>
        </div>

        {isLiveData && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchLiveActivities}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="row" style={{ gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {TYPE_TABS.map((tab) => (
          <Chip
            key={tab.value}
            label={tab.label}
            active={selectedType === tab.value}
            onClick={() => setSelectedType(tab.value)}
          />
        ))}
      </div>

      {/* Activity List Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading && displayList.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }} className="muted">
            <Loader2 size={24} className="spin" style={{ color: 'var(--cmp-brand)', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '13.5px' }}>Loading audit log...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }} className="muted">
            <Inbox size={32} style={{ margin: '0 auto 8px', color: 'var(--cmp-text-faint)' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No activities recorded</p>
            <p className="faint" style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
              Events appear as your team creates listings, approves updates, and changes roles.
            </p>
          </div>
        ) : isLiveData ? (
          /* Live API Activities List */
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {displayList.map((act) => {
              const actorName = act.actor?.type === 'CMP_ADMIN' ? 'CMP' : act.actor?.name || 'System';
              const actorInitials = actorName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
              const dateStr = act.at ? new Date(act.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Just now';

              return (
                <li
                  key={act.id}
                  className="row"
                  style={{
                    gap: '14px',
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--cmp-border)',
                    alignItems: 'center'
                  }}
                >
                  <span
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: act.actor?.type === 'CMP_ADMIN' ? 'var(--cmp-accent-subtle)' : 'var(--cmp-brand-subtle)',
                      color: act.actor?.type === 'CMP_ADMIN' ? 'var(--cmp-accent)' : 'var(--cmp-brand)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '11px',
                      flexShrink: 0
                    }}
                  >
                    {actorInitials}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', lineHeight: 1.4 }}>
                      <strong>{actorName}</strong>: {act.text || act.action}
                      {act.entity?.label && (
                        <>
                          {' — '}
                          <Link
                            to={resolveEntityLink(act.entity)}
                            style={{ color: 'var(--cmp-brand)', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            {act.entity.label}
                          </Link>
                        </>
                      )}
                    </div>
                    {act.note && (
                      <div className="muted" style={{ fontSize: '12px', marginTop: '3px' }}>
                        Note: {act.note}
                      </div>
                    )}
                    <span className="faint" style={{ fontSize: '11.5px', marginTop: '2px', display: 'block' }}>
                      {dateStr}
                    </span>
                  </div>

                  {act.status && (
                    <span
                      className={`badge ${
                        act.status === 'LIVE'
                          ? 'badge-brand'
                          : act.status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-neutral'
                      }`}
                    >
                      {act.status}
                    </span>
                  )}

                  {act.entity?.id && (
                    <Link to={resolveEntityLink(act.entity)} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          /* Mock Activities Fallback */
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {displayList.map((item) => (
              <li
                key={item.id}
                className="row"
                style={{
                  gap: '14px',
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--cmp-border)',
                  alignItems: 'center'
                }}
              >
                <Avatar initials={item.initials} size={32} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '13.5px' }}>
                    <strong>{item.agent}</strong> · {item.action}
                  </span>
                  <span className="faint" style={{ fontSize: '12px' }}>
                    {item.dateGroup} · {item.time} · {item.area}
                  </span>
                </span>
                <Link to={item.link} className="btn btn-ghost btn-sm">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
