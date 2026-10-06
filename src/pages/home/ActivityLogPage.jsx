import React, { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Inbox } from 'lucide-react';
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
  },
  {
    id: 7,
    dateGroup: 'Sunday, 13 September',
    initials: 'NA',
    agent: 'Noor Al Hashimi',
    action: 'Paid invoice 148955-03',
    time: '10:15 AM',
    area: 'Credits',
    link: '/wallet'
  },
  {
    id: 8,
    dateGroup: 'Friday, 11 September',
    initials: 'KS',
    agent: 'Karim Saleh',
    action: 'Recorded a closed deal on CMP-S-000941',
    time: '04:45 PM',
    area: 'Transactions',
    link: '/transactions'
  }
];

const AREAS = ['Everything', 'Clients', 'Credits', 'Properties', 'Team', 'Transactions'];
const AGENT_OPTIONS = [
  { label: 'Anyone', value: 'Anyone' },
  { label: 'Karim Saleh', value: 'Karim Saleh' },
  { label: 'Layla Haddad', value: 'Layla Haddad' },
  { label: 'Emma Clarke', value: 'Emma Clarke' },
  { label: 'Arjun Mehta', value: 'Arjun Mehta' },
  { label: 'Noor Al Hashimi', value: 'Noor Al Hashimi' }
];

/**
 * Memoized Activity Row component to prevent unnecessary re-renders
 */
const ActivityItemRow = memo(function ActivityItemRow({ item }) {
  return (
    <li>
      <Avatar initials={item.initials} size={32} />
      <span style={{ flex: '1 1 0%', minWidth: '0px' }}>
        <span style={{ display: 'block', fontSize: '14px' }}>
          <strong>{item.agent}</strong> · {item.action}
        </span>
        <span className="faint" style={{ fontSize: '12px' }}>
          {item.time} · {item.area}
        </span>
      </span>
      <Link to={item.link} className="btn btn-ghost btn-sm">
        View
      </Link>
    </li>
  );
});

export default function ActivityLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Everything');
  const [selectedAgent, setSelectedAgent] = useState('Anyone');

  // Debounce search input to optimize performance during typing
  const debouncedQuery = useDebounce(searchQuery, 200);

  // Optimized filtering using useMemo
  const filteredActivities = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();

    return INITIAL_ACTIVITIES.filter((item) => {
      // Area filter
      if (selectedArea !== 'Everything' && item.area !== selectedArea) {
        return false;
      }
      // Agent filter
      if (selectedAgent !== 'Anyone' && item.agent !== selectedAgent) {
        return false;
      }
      // Debounced search query
      if (query) {
        const matchesAgent = item.agent.toLowerCase().includes(query);
        const matchesAction = item.action.toLowerCase().includes(query);
        const matchesArea = item.area.toLowerCase().includes(query);
        if (!matchesAgent && !matchesAction && !matchesArea) {
          return false;
        }
      }
      return true;
    });
  }, [debouncedQuery, selectedArea, selectedAgent]);

  // Group items by date while maintaining chronological order
  const groupedSections = useMemo(() => {
    const groups = [];
    const seen = new Set();

    filteredActivities.forEach((item) => {
      if (!seen.has(item.dateGroup)) {
        seen.add(item.dateGroup);
        groups.push({
          title: item.dateGroup,
          items: filteredActivities.filter((i) => i.dateGroup === item.dateGroup)
        });
      }
    });

    return groups;
  }, [filteredActivities]);

  // Reusable CSV export callback
  const handleDownloadCsv = useCallback(() => {
    const headers = ['Date', 'Time', 'Agent', 'Action', 'Area'];
    const rows = filteredActivities.map((act) => [
      act.dateGroup,
      act.time,
      act.agent,
      act.action,
      act.area
    ]);
    exportToCsv('cmp-activity-log', headers, rows);
  }, [filteredActivities]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

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
              letterSpacing: '-0.02em'
            }}
          >
            Activity log
            <CountBadge count={filteredActivities.length} />
          </h1>
          <p
            className="muted"
            style={{
              margin: '4px 0px 0px',
              fontSize: '14px',
              maxWidth: '820px'
            }}
          >
            Everything your team did in CMP Connect, newest first. Useful for audits and for picking up where a colleague left off.
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleDownloadCsv}
          >
            <Download size={16} style={{ flexShrink: 0 }} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Search & Agent Filter Bar */}
      <div className="row" style={{ gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <SearchInput
          id="activity-search"
          placeholder="Search activity"
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={handleClearSearch}
          maxWidth="320px"
        />

        <Dropdown
          label={selectedAgent}
          options={AGENT_OPTIONS}
          selectedValue={selectedAgent}
          onSelect={setSelectedAgent}
          width="100%"
        />
      </div>

      {/* Area Chips */}
      <div style={{ marginBottom: '18px' }}>
        <div className="row" role="group" aria-label="Area" style={{ gap: '8px', flexWrap: 'wrap' }}>
          {AREAS.map((area) => (
            <Chip
              key={area}
              label={area}
              active={selectedArea === area}
              onClick={() => setSelectedArea(area)}
            />
          ))}
        </div>
      </div>

      {/* Grouped Timeline Sections */}
      {groupedSections.length > 0 ? (
        groupedSections.map((group) => (
          <section key={group.title} style={{ marginBottom: '20px' }}>
            <h2
              className="faint"
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}
            >
              {group.title}
            </h2>
            <ol className="card timeline">
              {group.items.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </ol>
          </section>
        ))
      ) : (
        <EmptyState
          icon={<Inbox size={32} />}
          message="No activity matches your filters."
        />
      )}
    </div>
  );
}
