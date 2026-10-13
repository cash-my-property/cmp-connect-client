import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Building,
  Archive,
  ChevronDown
} from 'lucide-react';

export default function ArchivePage() {
  const { listings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy, setSortBy] = useState('newest');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Mock archived listings
  const [archivedListings, setArchivedListings] = useState([
    {
      id: 'CMP-A-000991',
      title: 'Luxury 3 Bed Duplex with Private Pool',
      location: 'Palm Jumeirah',
      type: 'Penthouse',
      purpose: 'Sale',
      price: 'AED 12,800,000',
      archivedDate: '12 Sep 2026',
      reason: 'Sold via external network',
      agent: 'Layla Haddad',
      quality: 92
    },
    {
      id: 'CMP-A-000985',
      title: 'Studio Apartment with Canal View',
      location: 'Business Bay',
      type: 'Apartment',
      purpose: 'Rent',
      price: 'AED 65,000 / yr',
      archivedDate: '01 Sep 2026',
      reason: 'Owner withdrawn listing',
      agent: 'Karim Saleh',
      quality: 84
    }
  ]);

  const handleCopy = (id, e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRestore = (id) => {
    const item = archivedListings.find((l) => l.id === id);
    if (!item) return;
    setArchivedListings((prev) => prev.filter((l) => l.id !== id));
    alert(`Listing ${id} has been restored to active Portfolio.`);
  };

  const handleDeletePermanently = (id) => {
    if (window.confirm(`Permanently delete ${id}? This action cannot be undone.`)) {
      setArchivedListings((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const filteredListings = useMemo(() => {
    return archivedListings.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.agent.toLowerCase().includes(q)
      );
    });
  }, [archivedListings, searchTerm]);

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
              letterSpacing: '-0.02em',
              margin: 0
            }}
          >
            Archive
            <span
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                minWidth: '26px',
                height: '22px',
                padding: '0 8px',
                borderRadius: '999px',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                fontSize: '12px',
                fontWeight: 800
              }}
            >
              {archivedListings.length}
            </span>
          </h1>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13.5px' }}>
            Listings you or your team have archived. Restore them anytime back to your live portfolio.
          </p>
        </div>

        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${isSelectMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsSelectMode(!isSelectMode)}
          >
            {isSelectMode ? 'Done selecting' : 'Select listings'}
          </button>
          <NavLink to="/properties" className="btn btn-sm btn-outline">
            Active portfolio
          </NavLink>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        className="row"
        style={{
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '14px',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: '360px' }}>
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
            id="archive-search"
            type="search"
            placeholder="City, community, building, title or reference"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', height: '40px', width: '100%' }}
          />
        </div>

        <div className="row" style={{ gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ height: '40px', gap: '6px' }}
            onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}
          >
            <ArrowUpDown size={15} />
            <span>Archived: {sortBy === 'newest' ? 'Newest' : 'Oldest'}</span>
          </button>

          <div className="segmented" style={{ height: '40px', padding: '3px' }}>
            <button
              type="button"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              aria-selected={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      {filteredListings.length === 0 ? (
        <div className="card muted" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ display: 'grid', placeItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'var(--cmp-surface-sunken)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--cmp-text-faint)'
              }}
            >
              <Archive size={24} />
            </div>
            <strong style={{ fontSize: '17px', color: 'var(--cmp-text)' }}>
              No archived listings
            </strong>
            <p className="muted" style={{ margin: 0, fontSize: '13.5px', maxWidth: '420px' }}>
              {searchTerm
                ? 'No archived listings matched your search query.'
                : 'Listings you archive will safely appear here. You can unarchive or permanently purge them whenever needed.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ marginTop: '8px' }}
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                {isSelectMode && <th style={{ width: '36px' }}>Select</th>}
                <th>Reference</th>
                <th>Property</th>
                <th>Price & Type</th>
                <th>Archived date</th>
                <th>Reason</th>
                <th>Agent</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((item) => (
                <tr key={item.id}>
                  {isSelectMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, item.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== item.id));
                          }
                        }}
                      />
                    </td>
                  )}
                  <td>
                    <span className="row" style={{ gap: '6px', display: 'inline-flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(item.id, e)}
                        title="Copy reference"
                        style={{
                          border: 'none',
                          background: 'transparent',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--cmp-text-faint)'
                        }}
                      >
                        {copiedId === item.id ? (
                          <Check size={14} style={{ color: 'var(--cmp-brand)' }} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <strong style={{ color: 'var(--cmp-text)', fontSize: '13px' }}>
                        {item.id}
                      </strong>
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--cmp-text)' }}>{item.title}</span>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {item.location}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{item.price}</strong>
                    <span className="faint" style={{ display: 'block', fontSize: '12px' }}>
                      {item.purpose} · {item.type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>{item.archivedDate}</span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'var(--cmp-surface-sunken)', color: 'var(--cmp-text-muted)' }}>
                      {item.reason}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px' }}>{item.agent}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row" style={{ gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ height: '32px', padding: '0 10px', gap: '4px' }}
                        onClick={() => handleRestore(item.id)}
                        title="Restore to active portfolio"
                      >
                        <RotateCcw size={13} />
                        <span>Restore</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ height: '32px', width: '32px', padding: 0, color: 'var(--cmp-danger)' }}
                        onClick={() => handleDeletePermanently(item.id)}
                        title="Delete permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredListings.map((item) => (
            <article key={item.id} className="card" style={{ padding: '18px', display: 'grid', gap: '12px' }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="badge" style={{ background: 'var(--cmp-surface-sunken)' }}>
                  {item.id}
                </span>
                <span className="badge badge-warning">{item.reason}</span>
              </div>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--cmp-text)', display: 'block' }}>
                  {item.title}
                </strong>
                <span className="faint" style={{ fontSize: '12.5px' }}>
                  {item.location}
                </span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{item.price}</span>
                <span className="faint">Archived: {item.archivedDate}</span>
              </div>
              <div className="row" style={{ justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--cmp-border)' }}>
                <span className="faint" style={{ fontSize: '12px' }}>Agent: {item.agent}</span>
                <div className="row" style={{ gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleRestore(item.id)}
                  >
                    <RotateCcw size={13} />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--cmp-danger)' }}
                    onClick={() => handleDeletePermanently(item.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
