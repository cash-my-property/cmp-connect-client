import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import cmpConnectApi from '../../services/cmpConnectApi';
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

const PAGE_LIMIT = 50;
const STAGE_LABELS = { NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', UNQUALIFIED: 'Unqualified' };

// "x minutes/hours/days ago" banane ke liye
const formatRelative = (iso) => {
  const t = new Date(iso).getTime();
  if (!iso || Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const formatDateTime = (iso) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Live lead row ko table wale shape mein map karo
const mapLeadToRow = (lead) => ({
  id: lead.id,
  name: lead.contact?.name || 'Unknown caller',
  phone: lead.contact?.phone || '',
  email: lead.contact?.email || '',
  channel: lead.channel ? lead.channel.toLowerCase() : null,
  dateTime: formatDateTime(lead.createdAt),
  relativeTime: formatRelative(lead.createdAt),
  leadType: 'Listing lead',
  image: null, // backend row mein image/price/purpose nahi hai
  propertyRef: lead.listing?.ref || '',
  propertyTitle: lead.listing?.title || lead.message || '—',
  statusState: lead.stage === 'NEW' ? 'Not replied' : 'Replied',
  statusSub: STAGE_LABELS[lead.stage] || '',
  agent: lead.agent?.name || 'Unassigned'
});

export default function EnquiriesPage() {
  const { clients, isLiveData, authToken, can } = useApp();
  const canExport = can('leads.export');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('Everything'); // 'Everything' | 'Owner Selling' | 'Via agents'
  const [copiedId, setCopiedId] = useState(null);

  const ownerSellingCount = useMemo(() => clients.filter((c) => c.source === 'owner_selling').length, [clients]);
  const viaAgentsCount = useMemo(() => clients.filter((c) => c.source === 'via_agents').length, [clients]);

  const debouncedSearch = useDebounce(search, 200);

  // Live mode: backend se enquiries (sirf CTA) + pagination
  const [page, setPage] = useState(1);
  const [liveRows, setLiveRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [enquiriesTabCount, setEnquiriesTabCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const requestIdRef = useRef(0);

  const loadLeads = useCallback(async () => {
    if (!isLiveData) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setLoadError('');
    try {
      const res = await cmpConnectApi.listLeads(
        { tab: 'ENQUIRIES', search: debouncedSearch.trim(), page, limit: PAGE_LIMIT },
        authToken
      );
      if (reqId !== requestIdRef.current) return; // purana response ignore
      setLiveRows((res?.data || []).map(mapLeadToRow));
      setPagination({
        total: res?.pagination?.total ?? 0,
        page: res?.pagination?.page ?? page,
        pages: Math.max(1, res?.pagination?.pages ?? 1)
      });
      setEnquiriesTabCount(res?.counts?.tabs?.enquiries ?? 0);
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      setLoadError(err?.message || 'Failed to load enquiries.');
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [isLiveData, authToken, debouncedSearch, page]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Search badle to page 1 pe wapas
  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    // Live mode: search backend pe ho chuka
    if (isLiveData) return liveRows;

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
  }, [isLiveData, liveRows, clients, sourceFilter, debouncedSearch]);

  const handleCopyRef = useCallback((id, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExportCsv = useCallback(async () => {
    // Live mode: backend CSV download
    if (isLiveData) {
      setExporting(true);
      setExportError('');
      try {
        const blob = await cmpConnectApi.exportLeadsCsv({ tab: 'ENQUIRIES', search: debouncedSearch.trim() }, authToken);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        setExportError(err?.message || 'Export failed.');
      } finally {
        setExporting(false);
      }
      return;
    }
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
  }, [isLiveData, authToken, debouncedSearch, filtered]);

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
            Enquiries <CountBadge count={isLiveData ? pagination.total : filtered.length} />
          </h1>
        </div>
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          {canExport && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCsv}
              disabled={exporting}
            >
              <Download size={16} />
              <span>{exporting ? 'Exporting…' : 'Export leads'}</span>
            </button>
          )}
        </div>
      </div>
      {exportError && (
        <p role="alert" style={{ color: 'var(--cmp-danger, #c0392b)', fontSize: '13px', margin: '0 0 12px' }}>
          {exportError}
        </p>
      )}

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
          onChange={handleSearchChange}
          onClear={() => handleSearchChange('')}
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
            Everything {isLiveData ? enquiriesTabCount : clients.length}
          </button>
          {/* Owner Selling / Via agents ka backend equivalent nahi hai — live mode mein hide */}
          {!isLiveData && (
            <>
              <button
                type="button"
                role="tab"
                aria-selected={sourceFilter === 'Owner Selling'}
                onClick={() => setSourceFilter('Owner Selling')}
              >
                Owner Selling {ownerSellingCount}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceFilter === 'Via agents'}
                onClick={() => setSourceFilter('Via agents')}
              >
                Via agents {viaAgentsCount}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live mode: loading / error */}
      {isLiveData && loading && liveRows.length === 0 && !loadError && (
        <p className="muted" style={{ fontSize: '14px', margin: '0 0 12px' }}>Loading…</p>
      )}
      {isLiveData && loadError ? (
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <p className="muted" style={{ margin: '0 0 12px', fontSize: '14px' }}>{loadError}</p>
          <button type="button" className="btn btn-outline btn-sm" onClick={loadLeads}>
            Retry
          </button>
        </div>
      ) : (
      <>

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }} className="muted">
                    No client enquiries found
                  </p>
                  <p className="faint" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                    {isLiveData
                      ? 'No live client enquiries recorded yet. Once clients enquire about your listings, they will appear here.'
                      : 'Try adjusting your search query or filters to find what you are looking for.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id}>
                {/* 1. Lead details */}
                <td style={{ minWidth: '190px' }}>
                  {renderChannelIcon(item.channel)}
                  <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{item.name}</p>
                  <p style={{ margin: 0, fontSize: '13px' }}>{item.phone || item.email}</p>
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
                    <>
                      <span className="muted" style={{ fontSize: '13px' }}>
                        {item.propertyTitle}
                      </span>
                      {/* Live: image nahi hai, sirf ref + copy */}
                      {isLiveData && item.propertyRef && (
                        <span className="row" style={{ gap: '6px', display: 'flex', marginTop: '2px' }}>
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
                          <span style={{ color: 'var(--cmp-brand)', fontWeight: 600, fontSize: '13px' }}>
                            {item.propertyRef}
                          </span>
                        </span>
                      )}
                    </>
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
                    {/* Live: reply button sirf tab jab contact field ho */}
                    {item.channel === 'call' ? (
                      item.phone ? (
                      <a className="btn btn-outline btn-sm" href={`tel:${item.phone.replace(/\s+/g, '')}`}>
                        Call back
                      </a>
                      ) : null
                    ) : item.channel === 'whatsapp' ? (
                      item.phone ? (
                      <a
                        className="btn btn-outline btn-sm"
                        href={`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(item.name)}%2C%20thanks%20for%20your%20enquiry.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Message
                      </a>
                      ) : null
                    ) : !isLiveData || item.email ? (
                      <a
                        className="btn btn-outline btn-sm"
                        href={`mailto:${item.email}?subject=${encodeURIComponent(item.propertyRef || 'Enquiry')}`}
                      >
                        Message
                      </a>
                    ) : null}
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
            )))}
          </tbody>
        </table>
      </div>

      {/* Live mode: simple prev/next pagination */}
      {isLiveData && pagination.pages > 1 && (
        <div className="row" style={{ gap: '10px', justifyContent: 'flex-end', marginTop: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="muted" style={{ fontSize: '13px' }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page >= pagination.pages || loading}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
}
