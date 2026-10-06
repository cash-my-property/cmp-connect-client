import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Phone,
  MessageCircle,
  MoreVertical,
  CheckCircle,
  Users,
  MoveRight
} from 'lucide-react';

export default function PipelinePage() {
  const { clients, moveClientStage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedClientId, setDraggedClientId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const stages = [
    { key: 'New', label: 'New', color: 'var(--cmp-accent)' },
    { key: 'Contacted', label: 'Contacted', color: 'var(--cmp-brand)' },
    { key: 'Qualified', label: 'Qualified', color: 'var(--cmp-info)' },
    { key: 'Unqualified', label: 'Unqualified', color: 'var(--cmp-text-faint)' }
  ];

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleDragStart = (id) => {
    setDraggedClientId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (stageKey) => {
    if (draggedClientId) {
      moveClientStage(draggedClientId, stageKey);
      setDraggedClientId(null);
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
          <h1 style={{ fontSize: '24px', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            Pipeline <span className="count-badge">{clients.length}</span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Drag client cards across stages or use the stage button to convert leads into closed deals.
          </p>
        </div>
      </div>

      {/* Search & Conversion Rate Bar */}
      <div
        className="row"
        style={{
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '18px'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '340px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cmp-text-faint)'
            }}
          />
          <input
            type="search"
            placeholder="Search clients or references…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '13.5px' }}
          />
        </div>

        <span className="muted" style={{ fontSize: '13.5px', marginInlineStart: 'auto' }}>
          Conversion: <strong style={{ color: 'var(--cmp-brand)' }}>18% qualified</strong>
        </span>
      </div>

      {/* 4-Column Drag & Drop Kanban */}
      <div className="kanban">
        {stages.map((stage) => {
          const stageClients = filteredClients.filter((c) => c.stage === stage.key);
          return (
            <section
              key={stage.key}
              className="kanban-col"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
            >
              <header style={{ borderTopColor: stage.color }}>
                <span>{stage.label}</span>
                <span className="count-badge">{stageClients.length}</span>
              </header>

              <div className="kanban-cards">
                {stageClients.length === 0 ? (
                  <p className="faint kanban-empty">Drop a client here</p>
                ) : (
                  stageClients.map((client) => (
                    <article
                      key={client.id}
                      className="kanban-card"
                      draggable
                      onDragStart={() => handleDragStart(client.id)}
                    >
                      <div className="row" style={{ justifyContent: 'space-between', gap: '6px' }}>
                        <strong style={{ fontSize: '14px' }}>{client.name}</strong>

                        {/* Move stage dropdown trigger */}
                        <div style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ width: '28px', height: '28px', padding: 0 }}
                            onClick={() =>
                              setActiveMenuId(activeMenuId === client.id ? null : client.id)
                            }
                            title="Move stage"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {activeMenuId === client.id && (
                            <div
                              className="card"
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '32px',
                                width: '150px',
                                zIndex: 20,
                                padding: '6px',
                                boxShadow: 'var(--cmp-shadow-md)'
                              }}
                            >
                              <p className="faint" style={{ margin: '4px 6px', fontSize: '11px', textTransform: 'uppercase' }}>
                                Move to:
                              </p>
                              {stages.map((s) => (
                                <button
                                  key={s.key}
                                  type="button"
                                  className="menu-item"
                                  style={{
                                    fontSize: '12.5px',
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

                      <span className="faint" style={{ fontSize: '12px', fontWeight: 600 }}>
                        {client.propertyRef}
                      </span>
                      <p
                        className="muted"
                        style={{ margin: '4px 0 10px', fontSize: '13px', lineHeight: '1.35' }}
                      >
                        {client.propertyTitle}
                      </p>

                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="badge badge-neutral">{client.channel}</span>

                        <div className="row" style={{ gap: '4px' }}>
                          <a
                            href={`tel:${client.phone}`}
                            className="btn btn-ghost btn-sm"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            title={`Call ${client.name}`}
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '30px', height: '30px', padding: 0 }}
                            title={`WhatsApp ${client.name}`}
                          >
                            <MessageCircle size={14} style={{ color: 'var(--cmp-success)' }} />
                          </a>
                          <span
                            title={client.agent}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              background: 'var(--cmp-brand-subtle)',
                              color: 'var(--cmp-brand)',
                              fontSize: '9.5px',
                              fontWeight: 800
                            }}
                          >
                            {client.agentInitials}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
