import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDebounce } from '../../hooks';
import cmpConnectApi from '../../services/cmpConnectApi';
import {
  Search,
  Phone,
  MessageSquare,
  MoreVertical,
  ChevronDown,
  X,
  ExternalLink
} from 'lucide-react';

const STAGES = [
  { key: 'New', label: 'New', color: 'var(--cmp-accent)' },
  { key: 'Contacted', label: 'Contacted', color: 'var(--cmp-brand)' },
  { key: 'Qualified', label: 'Qualified', color: 'var(--cmp-info, var(--cmp-brand))' },
  { key: 'Unqualified', label: 'Unqualified', color: 'var(--cmp-text-faint)' }
];

// Backend stages uppercase hain, UI mein title case
const STAGE_TO_UI = { NEW: 'New', CONTACTED: 'Contacted', QUALIFIED: 'Qualified', UNQUALIFIED: 'Unqualified' };
const UI_TO_STAGE = { New: 'NEW', Contacted: 'CONTACTED', Qualified: 'QUALIFIED', Unqualified: 'UNQUALIFIED' };
const MOCK_AGENTS = ['All agents', 'Layla Haddad', 'Karim Saleh', 'Emma Clarke', 'Arjun Mehta'];

const getInitials = (name) =>
  (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?';

// Live lead row ko card wale shape mein map karo
const mapLeadToCard = (lead) => ({
  id: lead.id,
  name: lead.contact?.name || 'Unknown caller',
  phone: lead.contact?.phone || '',
  propertyRef: lead.listing?.ref || '',
  propertyTitle: lead.listing?.title || lead.message || '',
  channel: lead.channel ? lead.channel.toLowerCase() : 'manual',
  agent: lead.agent?.name || 'Unassigned',
  agentInitials: lead.agent?.name ? getInitials(lead.agent.name) : '—',
  stage: STAGE_TO_UI[lead.stage] || 'New'
});

export default function PipelinePage() {
  const { clients, moveClientStage, isLiveData, authToken, can } = useApp();
  const canManage = can('leads.manage');

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [selectedAgent, setSelectedAgent] = useState('All agents');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);

  // Live mode: backend se leads + stage counts
  const [liveLeads, setLiveLeads] = useState([]);
  const [stageCounts, setStageCounts] = useState({ NEW: 0, CONTACTED: 0, QUALIFIED: 0, UNQUALIFIED: 0 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [members, setMembers] = useState([]);
  const [membersFailed, setMembersFailed] = useState(false);
  const requestIdRef = useRef(0);

  const loadLeads = useCallback(async () => {
    if (!isLiveData) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setLoadError('');
    try {
      const res = await cmpConnectApi.listLeads(
        { tab: 'PIPELINE', limit: 100, search: debouncedSearch.trim(), agentId: selectedAgentId },
        authToken
      );
      if (reqId !== requestIdRef.current) return; // purana response ignore
      setLiveLeads((res?.data || []).map(mapLeadToCard));
      setStageCounts({ NEW: 0, CONTACTED: 0, QUALIFIED: 0, UNQUALIFIED: 0, ...(res?.counts?.stages || {}) });
    } catch (err) {
      if (reqId !== requestIdRef.current) return;
      setLoadError(err?.message || 'Failed to load pipeline.');
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [isLiveData, authToken, debouncedSearch, selectedAgentId]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Live mode: agent dropdown ke liye members (team.view nahi hai to filter hide)
  useEffect(() => {
    if (!isLiveData) return;
    let cancelled = false;
    cmpConnectApi
      .listMembers({ status: 'ACTIVE', limit: 100 }, authToken)
      .then((res) => {
        if (cancelled) return;
        setMembers(res?.data || []);
        setMembersFailed(false);
      })
      .catch(() => {
        if (!cancelled) setMembersFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLiveData, authToken]);

  // Drag and Drop state
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Active popover move menu
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Stage change: mock mein context, live mein optimistic + revert
  const moveStage = useCallback(
    async (clientId, stageKey) => {
      if (!isLiveData) {
        moveClientStage(clientId, stageKey);
        return;
      }
      if (!canManage) return;
      const lead = liveLeads.find((l) => l.id === clientId);
      if (!lead || lead.stage === stageKey) return;
      const prevStage = lead.stage;
      const shiftCounts = (from, to) =>
        setStageCounts((c) => ({
          ...c,
          [UI_TO_STAGE[from]]: Math.max(0, (c[UI_TO_STAGE[from]] || 0) - 1),
          [UI_TO_STAGE[to]]: (c[UI_TO_STAGE[to]] || 0) + 1
        }));
      setActionError('');
      setLiveLeads((ls) => ls.map((l) => (l.id === clientId ? { ...l, stage: stageKey } : l)));
      shiftCounts(prevStage, stageKey);
      try {
        await cmpConnectApi.setLeadStage(clientId, UI_TO_STAGE[stageKey], authToken);
      } catch (err) {
        // Fail hua to wapas purani stage
        setLiveLeads((ls) => ls.map((l) => (l.id === clientId ? { ...l, stage: prevStage } : l)));
        shiftCounts(stageKey, prevStage);
        setActionError(err?.message || 'Could not move the lead. Please try again.');
      }
    },
    [isLiveData, moveClientStage, canManage, liveLeads, authToken]
  );

  // Filtered clients
  const filteredClients = useMemo(() => {
    // Live mode: search/agent filter backend pe already lag chuka
    if (isLiveData) return liveLeads;

    let result = clients;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.propertyRef.toLowerCase().includes(q) ||
          c.propertyTitle.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }

    if (selectedAgent !== 'All agents') {
      result = result.filter((c) => c.agent === selectedAgent);
    }

    return result;
  }, [isLiveData, liveLeads, clients, debouncedSearch, selectedAgent]);

  // Conversion Metric Calculation (live: counts.stages company-wide hain)
  const liveTotal =
    (stageCounts.NEW || 0) + (stageCounts.CONTACTED || 0) + (stageCounts.QUALIFIED || 0) + (stageCounts.UNQUALIFIED || 0);
  const totalClientsCount = isLiveData ? liveTotal : clients.length;
  const qualifiedCount = useMemo(() => {
    if (isLiveData) return stageCounts.QUALIFIED || 0;
    return clients.filter((c) => c.stage === 'Qualified').length;
  }, [isLiveData, stageCounts, clients]);

  const conversionPercentage = useMemo(() => {
    if (totalClientsCount === 0) return 0;
    return Math.round((qualifiedCount / totalClientsCount) * 100);
  }, [qualifiedCount, totalClientsCount]);

  // Drag handlers
  const handleDragStart = useCallback((e, id) => {
    setDraggedClientId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, stageKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== stageKey) {
      setDragOverColumn(stageKey);
    }
  }, [dragOverColumn]);

  const handleDragLeave = useCallback((stageKey) => {
    if (dragOverColumn === stageKey) {
      setDragOverColumn(null);
    }
  }, [dragOverColumn]);

  const handleDrop = useCallback((e, stageKey) => {
    e.preventDefault();
    setDragOverColumn(null);
    const clientId = e.dataTransfer.getData('text/plain') || draggedClientId;
    if (clientId) {
      moveStage(clientId, stageKey);
    }
    setDraggedClientId(null);
  }, [draggedClientId, moveStage]);

  const handleDragEnd = useCallback(() => {
    setDraggedClientId(null);
    setDragOverColumn(null);
  }, []);

  // Format channel name
  const formatChannel = (ch) => {
    if (!ch) return 'Email';
    if (ch.toLowerCase() === 'whatsapp') return 'WhatsApp';
    if (ch.toLowerCase() === 'call') return 'Call';
    if (ch.toLowerCase() === 'chat') return 'Chat';
    return ch.charAt(0).toUpperCase() + ch.slice(1);
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
          <h1
            style={{
              fontSize: '22px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              letterSpacing: '-0.02em'
            }}
          >
            Pipeline
            <span className="count-badge">{totalClientsCount}</span>
          </h1>
          <p
            className="muted"
            style={{
              margin: '4px 0 0',
              fontSize: '14px',
              maxWidth: '820px'
            }}
          >
            Drag a client card to the stage they’re at. On a phone or keyboard, use the move button on each card.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="row"
        style={{
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '14px'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '300px' }}>
          <label htmlFor="pipeline-search" className="visually-hidden">
            Search clients or references
          </label>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              position: 'absolute',
              insetInlineStart: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)',
              pointerEvents: 'none'
            }}
          >
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14m9 2-3.5-3.5" />
          </svg>
          <input
            id="pipeline-search"
            placeholder="Search clients or references"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingInlineStart: '36px', height: '40px' }}
          />
        </div>

        {/* Agent Filter Dropdown (live mein members se; permission nahi to hide) */}
        {!(isLiveData && membersFailed) && (
        <div style={{ position: 'relative', width: '220px' }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isAgentMenuOpen}
            aria-label={selectedAgent}
            className="btn btn-outline"
            style={{
              width: '100%',
              height: '40px',
              justifyContent: 'space-between',
              padding: '0 12px',
              fontWeight: 500,
              color: 'var(--cmp-text-muted)',
              background: 'var(--cmp-surface)'
            }}
            onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedAgent}
            </span>
            <ChevronDown size={14} />
          </button>

          {isAgentMenuOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                top: '44px',
                left: 0,
                right: 0,
                zIndex: 30,
                padding: '6px',
                boxShadow: 'var(--cmp-shadow-md)'
              }}
            >
              {(isLiveData
                ? [{ id: '', name: 'All agents' }, ...members.map((m) => ({ id: m.id, name: m.fullName }))]
                : MOCK_AGENTS.map((n) => ({ id: n, name: n }))
              ).map((opt) => {
                const isSelected = isLiveData ? selectedAgentId === opt.id : selectedAgent === opt.name;
                return (
                  <button
                    key={opt.id || 'all'}
                    type="button"
                    className="menu-item"
                    style={{
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--cmp-brand)' : 'inherit'
                    }}
                    onClick={() => {
                      setSelectedAgent(opt.name);
                      if (isLiveData) setSelectedAgentId(opt.id);
                      setIsAgentMenuOpen(false);
                    }}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        {/* Conversion Rate Tag */}
        <span className="muted" style={{ fontSize: '14px', marginInlineStart: 'auto' }}>
          Conversion: <strong>{conversionPercentage}%</strong> qualified
        </span>
      </div>

      {/* Live mode: loading / error / action error */}
      {isLiveData && actionError && (
        <p role="alert" style={{ color: 'var(--cmp-danger, #c0392b)', fontSize: '13px', margin: '0 0 12px' }}>
          {actionError}
        </p>
      )}
      {isLiveData && loading && liveLeads.length === 0 && !loadError && (
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
      /* 4-Column Kanban Board */
      <div className="kanban">
        {STAGES.map((stage) => {
          const colClients = filteredClients.filter((c) => c.stage === stage.key);
          const isOver = dragOverColumn === stage.key;
          // Live: column count backend counts.stages se
          const colCount = isLiveData ? stageCounts[UI_TO_STAGE[stage.key]] || 0 : colClients.length;
          const canDrag = !isLiveData || canManage;

          return (
            <section
              key={stage.key}
              className={`kanban-col ${isOver ? 'drag-over' : ''}`}
              aria-label={`${stage.label}, ${colCount} clients`}
              data-over={isOver ? 'true' : undefined}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={() => handleDragLeave(stage.key)}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <header style={{ borderTopColor: stage.color }}>
                <span>{stage.label}</span>
                <span className="count-badge">{colCount}</span>
              </header>

              <div className="kanban-cards">
                {colClients.length === 0 ? (
                  <p className="faint kanban-empty">Drop a client here</p>
                ) : (
                  colClients.map((client) => {
                    const isDragging = draggedClientId === client.id;
                    const cleanPhone = client.phone ? client.phone.replace(/[^0-9]/g, '') : '';

                    return (
                      <article
                        key={client.id}
                        className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
                        draggable={canDrag ? 'true' : 'false'}
                        data-dragging={isDragging ? 'true' : undefined}
                        onDragStart={(e) => canDrag && handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Top: Name & Move Button */}
                        <div className="row" style={{ justifyContent: 'space-between', gap: '6px' }}>
                          <strong style={{ fontSize: '14px' }}>{client.name}</strong>

                          {canDrag && (
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              aria-haspopup="menu"
                              aria-expanded={activeMenuId === client.id}
                              aria-label={`Move ${client.name}`}
                              className="btn btn-outline btn-sm"
                              style={{ width: '36px', height: '32px', padding: 0 }}
                              onClick={() =>
                                setActiveMenuId(activeMenuId === client.id ? null : client.id)
                              }
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Move Menu Dropdown */}
                            {activeMenuId === client.id && (
                              <div
                                className="card"
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '36px',
                                  width: '150px',
                                  zIndex: 40,
                                  padding: '6px',
                                  boxShadow: 'var(--cmp-shadow-md)'
                                }}
                              >
                                <p
                                  className="faint"
                                  style={{
                                    margin: '4px 6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                  }}
                                >
                                  Move to:
                                </p>
                                {STAGES.map((s) => (
                                  <button
                                    key={s.key}
                                    type="button"
                                    className="menu-item"
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: client.stage === s.key ? 700 : 500,
                                      color: client.stage === s.key ? 'var(--cmp-brand)' : 'inherit'
                                    }}
                                    onClick={() => {
                                      moveStage(client.id, s.key);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          )}
                        </div>

                        {/* Property Reference */}
                        {client.propertyRef ? (
                          <Link
                            to="/properties"
                            className="faint"
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--cmp-text-faint)',
                              display: 'inline-block',
                              marginTop: '2px'
                            }}
                          >
                            {client.propertyRef}
                          </Link>
                        ) : (
                          <span
                            className="faint"
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              minHeight: '18px',
                              display: 'inline-block'
                            }}
                          />
                        )}

                        {/* Subtitle / Notes */}
                        <p
                          className="muted"
                          style={{
                            margin: '4px 0 8px',
                            fontSize: '13px',
                            lineHeight: 1.35
                          }}
                        >
                          {client.propertyTitle}
                        </p>

                        {/* Bottom Row: Channel & Action Buttons */}
                        <div className="row" style={{ gap: '6px', justifyContent: 'space-between' }}>
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
                              border: '1px solid color-mix(in srgb, var(--cmp-text-muted) 55%, transparent)',
                              background: 'color-mix(in srgb, var(--cmp-text-muted) 10%, transparent)'
                            }}
                          >
                            {formatChannel(client.channel)}
                          </span>

                          <span className="row" style={{ gap: '4px' }}>
                            {client.phone && (
                              <a
                                href={`tel:${client.phone}`}
                                className="btn btn-ghost btn-sm"
                                aria-label={`Call ${client.name}`}
                                style={{ width: '30px', height: '30px', padding: 0 }}
                                title={`Call ${client.name}`}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.9"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                  style={{ flexShrink: 0 }}
                                >
                                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7.7 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2" />
                                </svg>
                              </a>
                            )}

                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-ghost btn-sm"
                                aria-label={`WhatsApp ${client.name}`}
                                style={{ width: '30px', height: '30px', padding: 0 }}
                                title={`WhatsApp ${client.name}`}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.9"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                  style={{ flexShrink: 0 }}
                                >
                                  <path d="M3 21l1.6-4.8A9 9 0 1 1 8 19.6zM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2z" />
                                </svg>
                              </a>
                            )}

                            <span title={client.agent}>
                              <span
                                style={{
                                  position: 'relative',
                                  display: 'inline-block',
                                  width: '24px',
                                  height: '24px',
                                  flexShrink: 0
                                }}
                              >
                                <span
                                  aria-hidden="true"
                                  style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'grid',
                                    placeItems: 'center',
                                    background: 'var(--cmp-brand-subtle)',
                                    color: 'var(--cmp-brand)',
                                    fontWeight: 700,
                                    fontSize: '8.64px'
                                  }}
                                >
                                  {client.agentInitials}
                                </span>
                              </span>
                            </span>
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
      )}
    </div>
  );
}
