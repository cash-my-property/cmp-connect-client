import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CountBadge,
  SearchInput
} from '../../components/ui';
import { exportToCsv } from '../../utils';
import { useDebounce } from '../../hooks';
import {
  SlidersHorizontal,
  Download,
  Mail,
  MessageCircle,
  Phone,
  MessageSquare,
  Check,
  Clock,
  Copy,
  MoreVertical
} from 'lucide-react';

export default function EnquiriesPage() {
  const { clients } = useApp();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Everything'); // 'Everything' | 'Owner Selling' | 'Via agents'
  const [copiedId, setCopiedId] = useState(null);

  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    return clients.filter((c) => {
      const matchesSource =
        sourceFilter === 'Everything'
          ? true
          : sourceFilter === 'Owner Selling'
          ? c.source === 'owner_selling'
          : c.source === 'via_agents';

      if (!matchesSource) return false;

      if (q) {
        return (
          c.name.toLowerCase().includes(q) ||
          c.propertyTitle.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [clients, sourceFilter, debouncedSearch]);

  const handleCopyRef = useCallback((id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExportCsv = useCallback(() => {
    const headers = ['Lead Name', 'Phone', 'Email', 'Source', 'Property', 'Status', 'Agent'];
    const rows = filtered.map((c) => [
      c.name,
      c.phone,
      c.email || '',
      c.leadType,
      c.propertyTitle,
      c.statusState,
      c.agent
    ]);
    exportToCsv('cmp-leads-export', headers, rows);
  }, [filtered]);

  const renderChannelIcon = (channel) => {
    switch (channel) {
      case 'email':
        return (
          <Mail
            size={18}
            style={{ flexShrink: 0, color: 'var(--cmp-brand)' }}
            aria-label="email"
          />
        );
      case 'whatsapp':
        return (
          <MessageCircle
            size={18}
            style={{ flexShrink: 0, color: 'var(--cmp-success)' }}
            aria-label="whatsapp"
          />
        );
      case 'call':
        return (
          <Phone
            size={18}
            style={{ flexShrink: 0, color: 'var(--cmp-brand)' }}
            aria-label="call"
          />
        );
      case 'chat':
        return (
          <MessageSquare
            size={18}
            style={{ flexShrink: 0, color: 'var(--cmp-brand)' }}
            aria-label="chat"
          />
        );
      default:
        return (
          <Mail
            size={18}
            style={{ flexShrink: 0, color: 'var(--cmp-brand)' }}
            aria-label="email"
          />
        );
    }
  };

  return (
    <div>
      {/* Page Header matching leads.html */}
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
            Enquiries <CountBadge count={filtered.length} />
          </h1>
        </div>
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleExportCsv}
          >
            <Download size={16} />
            <span>Export leads</span>
          </button>
        </div>
      </div>

      {/* Search and Filters matching leads.html */}
      <div
        className="row"
        style={{
          gap: '8px',
          marginBottom: '14px',
          flexWrap: 'wrap'
        }}
      >
        <SearchInput
          id="leads-search"
          placeholder="Search by lead name, phone number or email"
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          maxWidth="340px"
        />

        <button type="button" className="btn btn-sm btn-outline" style={{ height: '40px' }}>
          <SlidersHorizontal size={16} />
          <span>All filters</span>
        </button>
      </div>

      {/* Segmented Source Tabs matching leads.html */}
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div role="tablist" aria-label="Enquiry source" className="segmented" style={{ marginBottom: '18px' }}>
          <button
            type="button"
            role="tab"
            aria-selected={sourceFilter === 'Everything'}
            onClick={() => setSourceFilter('Everything')}
          >
            Everything 11
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sourceFilter === 'Owner Selling'}
            onClick={() => setSourceFilter('Owner Selling')}
          >
            Owner Selling 1
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sourceFilter === 'Via agents'}
            onClick={() => setSourceFilter('Via agents')}
          >
            Via agents 1
          </button>
        </div>
      </div>

      {/* Data Table matching leads.html 1:1 */}
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Lead details</th>
              <th>Lead type</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Assigned agent</th>
              <th>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                {/* 1. Lead details */}
                <td style={{ minWidth: '190px' }}>
                  {renderChannelIcon(item.channel)}
                  <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '13px' }}>{item.phone}</p>
                  <p className="muted" style={{ margin: 0, fontSize: '12px' }}>
                    {item.dateTime}
                  </p>
                  <p className="faint" style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>
                    {item.relativeTime}
                  </p>
                </td>

                {/* 2. Lead type */}
                <td>
                  <span className="badge badge-neutral">{item.leadType}</span>
                </td>

                {/* 3. Reference */}
                <td style={{ minWidth: '280px' }}>
                  {item.image ? (
                    <div className="row" style={{ gap: '10px', alignItems: 'flex-start' }}>
                      <img
                        src={item.image}
                        alt=""
                        style={{
                          width: '48px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: '6px'
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span className="badge badge-neutral">{item.purpose}</span>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: '13px',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.propertyTitle}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                          {item.price}
                        </p>
                        <span className="row" style={{ gap: '6px', display: 'inline-flex' }}>
                          <button
                            type="button"
                            aria-label={`Copy ${item.propertyRef}`}
                            title="Copy"
                            onClick={(e) => handleCopyRef(item.propertyRef, e)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: 0,
                              cursor: 'pointer',
                              color: 'var(--cmp-text-faint)',
                              display: 'inline-flex'
                            }}
                          >
                            {copiedId === item.propertyRef ? (
                              <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            title={item.propertyRef}
                            style={{
                              color: 'var(--cmp-brand)',
                              fontWeight: 600,
                              fontSize: '13px',
                              textDecoration: 'underline',
                              textUnderlineOffset: '3px'
                            }}
                          >
                            {item.propertyRef}
                          </a>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="muted" style={{ fontSize: '13px' }}>
                      {item.propertyTitle}
                    </span>
                  )}
                </td>

                {/* 4. Status */}
                <td style={{ whiteSpace: 'nowrap' }}>
                  {item.callDuration && (
                    <div style={{ marginBottom: '6px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          color: 'var(--cmp-text-muted)',
                          border:
                            '1px solid color-mix(in srgb, var(--cmp-text-muted) 55%, transparent)',
                          background:
                            'color-mix(in srgb, var(--cmp-text-muted) 10%, transparent)'
                        }}
                      >
                        <Phone size={13} />
                        {item.callDuration}
                      </span>
                    </div>
                  )}

                  <span
                    className="row"
                    style={{
                      gap: '4px',
                      color:
                        item.statusState === 'Replied'
                          ? 'var(--cmp-success)'
                          : 'var(--cmp-warning)',
                      fontWeight: 600,
                      fontSize: '13px'
                    }}
                  >
                    {item.statusState === 'Replied' ? (
                      <Check size={15} style={{ flexShrink: 0 }} />
                    ) : (
                      <Clock size={15} style={{ flexShrink: 0 }} />
                    )}
                    <span>{item.statusState}</span>
                  </span>
                  <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                    {item.statusSub}
                  </span>
                </td>

                {/* 5. Assigned agent */}
                <td style={{ whiteSpace: 'nowrap' }}>{item.agent}</td>

                {/* 6. Actions */}
                <td>
                  <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }}>
                    {item.channel === 'call' ? (
                      <a className="btn btn-outline btn-sm" href={`tel:${item.phone.replace(/\s+/g, '')}`}>
                        Call back
                      </a>
                    ) : item.channel === 'whatsapp' ? (
                      <a
                        className="btn btn-outline btn-sm"
                        href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(item.name)}%2C%20thanks%20for%20your%20enquiry.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Message
                      </a>
                    ) : (
                      <a
                        className="btn btn-outline btn-sm"
                        href={`mailto:${item.email}?subject=${encodeURIComponent(item.propertyRef || 'Enquiry')}`}
                      >
                        Message
                      </a>
                    )}
                    <button
                      type="button"
                      aria-label={`More actions for ${item.name}`}
                      className="btn btn-outline btn-sm"
                      style={{ width: '36px', padding: 0 }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
