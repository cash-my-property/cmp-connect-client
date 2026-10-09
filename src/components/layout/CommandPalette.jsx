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
  ArrowRight
} from 'lucide-react';

export default function CommandPalette() {
  const { isSearchOpen, setIsSearchOpen, listings, clients } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

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
    { title: 'Help & Knowledge Guides', path: '/help', icon: HelpCircle, category: 'Pages' },
    { title: 'Registration & Onboarding Portal', path: '/onboarding', icon: Building, category: 'Onboarding' },
    { title: 'Register New Account (Sign up)', path: '/signup', icon: Users, category: 'Onboarding' },
    { title: 'Sign In (Registration portal)', path: '/signin', icon: Settings, category: 'Onboarding' }
  ];

  const filteredPages = quickPages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredListings = listings
    .filter(
      (l) =>
        l.title.toLowerCase().includes(query.toLowerCase()) ||
        l.id.toLowerCase().includes(query.toLowerCase()) ||
        l.community.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 4);

  const filteredClients = clients
    .filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.toLowerCase().includes(query.toLowerCase()) ||
        c.propertyTitle.toLowerCase().includes(query.toLowerCase())
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

          {/* Listings */}
          {filteredListings.length > 0 && (
            <div>
              <p className="palette-group">Properties</p>
              {filteredListings.map((listing) => (
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

          {/* Clients */}
          {filteredClients.length > 0 && (
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

          {filteredPages.length === 0 &&
            filteredListings.length === 0 &&
            filteredClients.length === 0 && (
              <div style={{ padding: '30px 20px', textAlign: 'center' }} className="muted">
                No matching results found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
