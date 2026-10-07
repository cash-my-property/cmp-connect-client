import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDebounce } from '../../hooks';
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

export default function PipelinePage() {
  const { clients, moveClientStage } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [selectedAgent, setSelectedAgent] = useState('All agents');
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);

  // Drag and Drop state
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Active popover move menu
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
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
  }, [clients, debouncedSearch, selectedAgent]);

  // Conversion Metric Calculation
  const totalClientsCount = clients.length;
  const qualifiedCount = useMemo(() => {
    return clients.filter((c) => c.stage === 'Qualified').length;
  }, [clients]);

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
      moveClientStage(clientId, stageKey);
    }
    setDraggedClientId(null);
  }, [draggedClientId, moveClientStage]);

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

        {/* Agent Filter Dropdown */}
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
              {['All agents', 'Layla Haddad', 'Karim Saleh', 'Emma Clarke', 'Arjun Mehta'].map((agentName) => (
                <button
                  key={agentName}
                  type="button"
                  className="menu-item"
                  style={{
                    fontSize: '13px',
                    fontWeight: selectedAgent === agentName ? 700 : 500,
                    color: selectedAgent === agentName ? 'var(--cmp-brand)' : 'inherit'
                  }}
                  onClick={() => {
                    setSelectedAgent(agentName);
                    setIsAgentMenuOpen(false);
                  }}
                >
                  {agentName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Rate Tag */}
        <span className="muted" style={{ fontSize: '14px', marginInlineStart: 'auto' }}>
          Conversion: <strong>{conversionPercentage}%</strong> qualified
        </span>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="kanban">
        {STAGES.map((stage) => {
          const colClients = filteredClients.filter((c) => c.stage === stage.key);
          const isOver = dragOverColumn === stage.key;

          return (
            <section
              key={stage.key}
              className={`kanban-col ${isOver ? 'drag-over' : ''}`}
              aria-label={`${stage.label}, ${colClients.length} clients`}
              data-over={isOver ? 'true' : undefined}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={() => handleDragLeave(stage.key)}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <header style={{ borderTopColor: stage.color }}>
                <span>{stage.label}</span>
                <span className="count-badge">{colClients.length}</span>
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
                        draggable="true"
                        data-dragging={isDragging ? 'true' : undefined}
                        onDragStart={(e) => handleDragStart(e, client.id)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Top: Name & Move Button */}
                        <div className="row" style={{ justifyContent: 'space-between', gap: '6px' }}>
                          <strong style={{ fontSize: '14px' }}>{client.name}</strong>

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
                                      moveClientStage(client.id, s.key);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
