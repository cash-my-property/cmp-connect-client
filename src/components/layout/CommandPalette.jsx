import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Building,
  Users,
  Home,
  Radio,
  CreditCard,
  Settings,
  HelpCircle,
  X,
  ArrowRight,
  Loader2,
  Shield
} from 'lucide-react';
import cmpConnectApi from '../../services/cmpConnectApi';

export default function CommandPalette() {
  const { isSearchOpen, setIsSearchOpen, listings, clients, isLiveData, authToken } = useApp();
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState({ listings: [], members: [] });
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setLiveResults({ listings: [], members: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Live search debounced query
  useEffect(() => {
    if (!isLiveData || !authToken || !isSearchOpen) return;
    const clean = query.trim();
    if (clean.length < 2) {
      setLiveResults({ listings: [], members: [] });
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const res = await cmpConnectApi.globalSearch(clean, authToken);
        const data = res?.data || res || {};
        setLiveResults({
          listings: Array.isArray(data.listings) ? data.listings : [],
          members: Array.isArray(data.members) ? data.members : []
        });
      } catch (err) {
        console.warn('[CommandPalette] Live search error:', err.message);
        setLiveResults({ listings: [], members: [] });
      } finally {
        setIsSearchingLive(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isLiveData, authToken, isSearchOpen]);

  if (!isSearchOpen) return null;

  const quickPages = [
    { title: 'Dashboard (Today)', path: '/', icon: Home, category: 'Pages' },
    { title: 'Properties Portfolio', path: '/properties', icon: Building, category: 'Pages' },
    { title: 'Add New Property', path: '/properties/new', icon: Building, category: 'Pages' },
    { title: 'CRM Client Pipeline', path: '/clients', icon: Users, category: 'Pages' },
    { title: 'Enquiries Inbox', path: '/clients/enquiries', icon: Users, category: 'Pages' },
    { title: 'Real Time Offer Live Desk', path: '/rto', icon: Radio, category: 'Pages' },
    { title: 'Wallet & Credits', path: '/wallet', icon: CreditCard, category: 'Pages' },
    { title: 'Agency Profile & Settings', path: '/account', icon: Settings, category: 'Pages' },
    { title: 'Brand Kit (Watermark)', path: '/properties/brand-kit', icon: Building, category: 'Pages' },
    { title: 'Activity Audit Log', path: '/activity', icon: Settings, category: 'Pages' },
    { title: 'Team Members', path: '/team/members', icon: Users, category: 'Pages' },
    { title: 'Roles & Access Matrix', path: '/team/roles', icon: Settings, category: 'Pages' },
    { title: 'Help & Knowledge Guides', path: '/help', icon: HelpCircle, category: 'Pages' }
  ];

  const filteredPages = quickPages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMockListings = listings
    .filter(
      (l) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.id.toLowerCase().includes(query.toLowerCase()) ||
        (l.community && l.community.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 4);

  const filteredClients = clients
    .filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.toLowerCase().includes(query.toLowerCase()) ||
        (c.propertyTitle && c.propertyTitle.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 4);

  const handleSelect = (path) => {
    setIsSearchOpen(false);
    navigate(path);
  };

  return (
    <div className="palette-backdrop" onClick={() => setIsSearchOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <div className="palette-input-box">
          <Search size={20} style={{ color: 'var(--cmp-text-faint)' }} />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search properties, clients, or jump to page…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => setIsSearchOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="palette-results">
          {isSearchingLive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', color: 'var(--cmp-text-muted)', fontSize: '13px' }}>
              <Loader2 size={16} className="spin" />
              <span>Searching inventory and team members...</span>
            </div>
          )}

          {/* Quick Pages */}
          {filteredPages.length > 0 && (
            <div>
              <p className="palette-group">Navigation Pages</p>
              {filteredPages.map((page) => {
                const Icon = page.icon;
                return (
                  <button
                    key={page.path}
                    type="button"
                    className="palette-item"
                    onClick={() => handleSelect(page.path)}
                  >
                    <Icon size={16} style={{ color: 'var(--cmp-brand)' }} />
                    <span style={{ flex: 1 }}>{page.title}</span>
                    <ArrowRight size={14} className="faint" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Live Data Mode: Live Properties */}
          {isLiveData && liveResults.listings.length > 0 && (
            <div>
              <p className="palette-group">Properties ({liveResults.listings.length})</p>
              {liveResults.listings.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="palette-item"
                  onClick={() => handleSelect(`/properties/${l.id}/edit`)}
                >
                  {(l.coverImageWatermarked || l.coverImage) ? (
                    <img
                      src={l.coverImageWatermarked || l.coverImage}
                      alt=""
                      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                  ) : (
                    <Building size={16} style={{ color: 'var(--cmp-accent)' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.title || 'Untitled Property'}
                    </div>
                    <div className="faint" style={{ fontSize: '12px' }}>
                      {l.listingRef || l.id} {l.location ? `· ${l.location}` : ''}
                    </div>
                  </div>
                  <span className="badge badge-brand">{l.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Live Data Mode: Live Team Members */}
          {isLiveData && liveResults.members.length > 0 && (
            <div>
              <p className="palette-group">Team Members ({liveResults.members.length})</p>
              {liveResults.members.map((m) => {
                const roleName = m.role?.name || m.role || 'Member';
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="palette-item"
                    onClick={() => handleSelect('/team/members')}
                  >
                    <Users size={16} style={{ color: 'var(--cmp-info)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{m.fullName}</div>
                      <div className="faint" style={{ fontSize: '12px' }}>
                        {m.email} · {roleName}
                      </div>
                    </div>
                    <span className="badge badge-neutral">{m.status}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Mock Mode: Mock Listings */}
          {!isLiveData && filteredMockListings.length > 0 && (
            <div>
              <p className="palette-group">Properties</p>
              {filteredMockListings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  className="palette-item"
                  onClick={() => handleSelect('/properties')}
                >
                  <Building size={16} style={{ color: 'var(--cmp-accent)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{listing.title}</div>
                    <div className="faint" style={{ fontSize: '12px' }}>
                      {listing.id} · {listing.community} · {listing.priceLabel}
                    </div>
                  </div>
                  <span className="badge badge-brand">{listing.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Mock Mode: Mock Clients */}
          {!isLiveData && filteredClients.length > 0 && (
            <div>
              <p className="palette-group">Clients & Enquiries</p>
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className="palette-item"
                  onClick={() => handleSelect('/clients')}
                >
                  <Users size={16} style={{ color: 'var(--cmp-info)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{client.name}</div>
                    <div className="faint" style={{ fontSize: '12px' }}>
                      {client.phone} · {client.propertyTitle}
                    </div>
                  </div>
                  <span className="badge badge-neutral">{client.stage}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isSearchingLive &&
            filteredPages.length === 0 &&
            (isLiveData
              ? liveResults.listings.length === 0 && liveResults.members.length === 0
              : filteredMockListings.length === 0 && filteredClients.length === 0) && (
              <div style={{ padding: '30px 20px', textAlign: 'center' }} className="muted">
                No matching results found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
