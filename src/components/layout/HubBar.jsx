import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Coins,
  Bell,
  Sun,
  Moon,
  HelpCircle,
  Building,
  Radio,
  Plus,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react';

export default function HubBar() {
  const {
    dataMode,
    setDataMode,
    platform,
    setPlatform,
    theme,
    toggleTheme,
    setIsSearchOpen,
    setIsNotificationsOpen,
    agency,
    needsYou,
    logout,
    account,
    can,
    hasAny
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  // Close user menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen]);

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/signin');
  };

  // Derive active hub information based on current URL path
  const getHubInfo = () => {
    if (pathname.startsWith('/rto')) {
      const isNew = pathname === '/rto/new' || pathname.endsWith('/edit');
      const isTeam = pathname === '/rto/team' || pathname.startsWith('/rto/team/');
      const isMembers = pathname === '/rto/members' || pathname.startsWith('/rto/members/');
      const isEntries = pathname === '/rto/entries' || pathname === '/rto';
      const isResults = pathname === '/rto/results';
      const isOffers = pathname === '/rto/offers' || pathname === '/rto/bidders' || pathname === '/rto/cheques';
      const isDesk = pathname === '/rto/desk';
      const isDetail = pathname.startsWith('/rto/') && !isNew && !isTeam && !isMembers && !isEntries && !isResults && !isOffers && !isDesk;

      if (isMembers) {
        return {
          title: 'Members',
          blurb: 'Manage your agency team members, invitations, roles and RERA verification.',
          tabs: []
        };
      }

      if (isTeam) {
        const rtoTeamTabs = [];
        if (!account || can('insights.agents_view')) rtoTeamTabs.push({ label: 'Leaderboard', path: '/rto/team' });
        if (!account || can('roles.view')) rtoTeamTabs.push({ label: 'Roles & access', path: '/rto/team/roles' });
        return {
          title: 'Team',
          blurb: 'How your people are performing on Real Time Offer and what they can access.',
          tabs: rtoTeamTabs
        };
      }

      let title = 'Real Time Offer';
      let blurb = 'Live property auctions managed by CMP. Enter properties and monitor live buyer offers.';

      if (isNew) {
        title = 'Enter a property';
        blurb = 'Submit an agency property for a Real Time Offer auction managed by CMP.';
      } else if (isDetail) {
        title = 'Auction Desk';
        blurb = 'Live auction countdown, buyer offers, agency approval and property details.';
      } else if (isDesk) {
        title = 'Live Desk';
        blurb = 'Every property of yours taking instant bids against a live countdown clock.';
      } else if (isEntries) {
        title = 'Real Time Offer Entries';
        blurb = 'Properties submitted by your agency for Real Time Offer auctions managed by CMP.';
      } else if (isResults) {
        title = 'Auction Results';
        blurb = 'Closed auctions, final sale prices and performance history.';
      } else if (isOffers) {
        title = 'Offers';
        blurb = 'Registered buyers, live offer activity, identity verification and 10% security deposit cheques.';
      }

      const tabs = [];
      if (!account || can('listings.view')) {
        tabs.push({ label: 'Live desk', path: '/rto/desk' });
        tabs.push({ label: 'Entries', path: '/rto' });
      }
      if (!account || hasAny('leads.view', 'contracts.view', 'transactions.view', 'listings.view')) {
        tabs.push({ label: 'Offers', path: '/rto/offers' });
      }
      if (!account || can('listings.view')) {
        tabs.push({ label: 'Results', path: '/rto/results' });
      }

      return {
        title,
        blurb,
        tabs
      };
    }
    if (pathname.startsWith('/properties')) {
      const tabs = [];
      if (!account || can('listings.view')) {
        tabs.push({ label: 'Portfolio', path: '/properties' });
        tabs.push({ label: 'Compliance', path: '/properties/compliance' });
      }
      if (!account || can('listings.archive') || can('listings.view')) {
        tabs.push({ label: 'Archive', path: '/properties/archive' });
      }
      if (!account || can('company.watermark')) {
        tabs.push({ label: 'Brand kit', path: '/properties/brand-kit' });
      }

      return {
        title: 'Properties',
        blurb: 'Every property you market, its compliance and your brand on its photos.',
        tabs
      };
    }
    if (pathname.startsWith('/clients')) {
      const tabs = [];
      if (!account || can('leads.view')) {
        tabs.push({ label: 'Enquiries', path: '/clients/enquiries' });
        tabs.push({ label: 'Pipeline', path: '/clients' });
        tabs.push({ label: 'Contacts', path: '/clients/contacts' });
      }
      if (!account || can('leads.whatsapp_view') || can('leads.call_view') || can('leads.view')) {
        tabs.push({ label: 'Messages', path: '/clients/messages' });
      }

      return {
        title: 'Clients',
        blurb: 'Enquiries in, contacts kept, clients moved towards a deal.',
        tabs
      };
    }
    if (pathname.startsWith('/transactions')) {
      return {
        title: 'Transactions',
        blurb: 'Deals your agents closed on your Cash My Property listings.',
        tabs: []
      };
    }
    if (pathname.startsWith('/growth') || pathname.startsWith('/market') || pathname.startsWith('/insights')) {
      const tabs = [];
      if (!account || can('insights.listings_view')) {
        tabs.push({ label: 'Performance', path: '/growth' });
        tabs.push({ label: 'Market standing', path: '/growth/market' });
      }
      if (!account || can('insights.leads_view')) {
        tabs.push({ label: 'Enquiry insights', path: '/growth/insights' });
      }
      if (!account || can('listings.view')) {
        tabs.push({ label: 'Smart Boost', path: '/growth/smart-boost' });
      }
      if (!account || can('listings.spotlight')) {
        tabs.push({ label: 'Community Spotlight', path: '/growth/spotlight' });
        tabs.push({ label: 'Spotlighted', path: '/growth/spotlighted' });
      }

      return {
        title: 'Growth',
        blurb: 'Where your enquiries come from and how to get more of them.',
        tabs
      };
    }
    if (pathname.startsWith('/wallet')) {
      const tabs = [];
      if (!account || can('contracts.view') || can('credits.calculator') || can('credits.history_view')) {
        tabs.push({ label: 'Balance & plan', path: '/wallet' });
      }
      if (!account || can('credits.history_view') || can('contracts.view')) {
        tabs.push({ label: 'Activity', path: '/wallet/activity' });
      }
      if (!account || can('credits.return_request') || can('contracts.view')) {
        tabs.push({ label: 'Refunds', path: '/wallet/refunds' });
      }
      if (!account || can('contracts.view')) {
        tabs.push({ label: 'Contract', path: '/wallet/contract' });
        tabs.push({ label: 'Invoices', path: '/wallet/invoices' });
      }

      return {
        title: 'Wallet',
        blurb: 'Your credits, your contract with Cash My Property and its invoices.',
        tabs
      };
    }
    if (pathname.startsWith('/members') || pathname.startsWith('/team/members')) {
      return {
        title: 'Members',
        blurb: 'Manage your agency team members, invitations, roles and RERA verification.',
        tabs: []
      };
    }
    if (pathname.startsWith('/team')) {
      const teamTabs = [];
      if (!account || can('insights.agents_view')) teamTabs.push({ label: 'Leaderboard', path: '/team' });
      if (!account || can('roles.view')) teamTabs.push({ label: 'Roles & access', path: '/team/roles' });

      return {
        title: 'Team',
        blurb: 'How your people are performing and what they can access.',
        tabs: teamTabs
      };
    }
    if (pathname.startsWith('/account')) {
      const tabs = [];
      if (!account || can('company.view')) {
        tabs.push({ label: 'Agency profile', path: '/account' });
      }
      tabs.push({ label: 'Sign-in & security', path: '/account/security' });
      if (!account || can('team.notifications_manage') || can('company.view')) {
        tabs.push({ label: 'Notifications', path: '/account/notifications' });
      }

      return {
        title: 'Account',
        blurb: 'Your agency’s details, sign-in security and what you get notified about.',
        tabs
      };
    }
    if (pathname.startsWith('/help')) {
      return {
        title: 'Help',
        blurb: 'Guides, product updates and a person to talk to.',
        tabs: [
          { label: 'Guides', path: '/help' },
          { label: "What’s new", path: '/help/whats-new' }
        ]
      };
    }
    // Default to Home
    return {
      title: 'Home',
      blurb: 'What needs you today, and how the agency is doing.',
      tabs: [
        { label: 'Today', path: '/' },
        { label: 'Activity log', path: '/activity' }
      ]
    };
  };

  const hub = getHubInfo();

  const handlePlatformChange = (targetPlatform) => {
    setPlatform(targetPlatform);
    if (targetPlatform === 'auctions') {
      navigate('/rto');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="hub-bar">
      <div className="hub-bar-top">
        {/* Dual Platform Switcher */}
        <nav className="platform-switch" aria-label="Platform">
          <button
            type="button"
            className={!pathname.startsWith('/rto') && platform === 'listings' ? 'active' : ''}
            onClick={() => handlePlatformChange('listings')}
          >
            <Building size={16} />
            <span>Listings</span>
          </button>
          {(!account || account?.accountType === 'AGENCY') && (
            <button
              type="button"
              className={pathname.startsWith('/rto') || platform === 'auctions' ? 'active' : ''}
              onClick={() => handlePlatformChange('auctions')}
            >
              <Radio size={16} />
              <span>Real Time Offer</span>
            </button>
          )}
        </nav>

        {/* Global Search Button */}
        <button
          type="button"
          className="search-trigger"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Search or jump to a page (Ctrl K)"
        >
          <Search size={16} />
          <span>Search properties, clients, pages…</span>
          <kbd>Ctrl K</kbd>
        </button>

        {/* Actions / Wallet / Notifications / Profile */}
        <div className="row" style={{ gap: '8px', marginInlineStart: 'auto', alignItems: 'center' }}>
          {/* Data Mode Switcher: Live Data vs Mock Data */}
          <div className="data-mode-switch" role="group" aria-label="Data Source Mode">
            <button
              type="button"
              className={`data-mode-btn ${dataMode === 'live' ? 'active live' : ''}`}
              onClick={() => setDataMode('live')}
              title="Live Data Mode: Only real data from APIs, static data disabled"
            >
              <span className={`live-indicator-dot ${dataMode !== 'live' ? 'dormant' : ''}`} />
              <span>Live Data</span>
            </button>
            <button
              type="button"
              className={`data-mode-btn ${dataMode === 'mock' ? 'active mock' : ''}`}
              onClick={() => setDataMode('mock')}
              title="Mock Data Mode: Rich demo data for clients, APIs off"
            >
              <Sparkles size={13} style={{ color: dataMode === 'mock' ? 'var(--cmp-accent)' : 'inherit' }} />
              <span>Mock Data</span>
            </button>
          </div>

          {/* Wallet Pill */}
          <NavLink
            to="/wallet"
            className="wallet-pill"
            title={`Credits expire in ${agency.creditsExpiryDays} days`}
          >
            <Coins size={16} style={{ color: 'var(--cmp-accent)' }} />
            <strong>{agency.credits.toLocaleString()}</strong>
            <span className="faint" style={{ fontSize: '12px' }}>
              credits · {agency.creditsExpiryDays}d
            </span>
          </NavLink>

          {/* Notifications Button */}
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell size={18} />
            {needsYou.length > 0 && (
              <span className="dot-count">
                {needsYou.length > 9 ? '9+' : needsYou.length}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="icon-button"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ position: 'relative' }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>

          {/* Help Button */}
          <NavLink to="/help" className="icon-button" aria-label="Help">
            <HelpCircle size={18} />
          </NavLink>

          {/* User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                border: isUserMenuOpen ? '2px solid var(--cmp-brand)' : '1px solid var(--cmp-border)',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={`${agency.currentUser.name} (${agency.currentUser.role})`}
              aria-label="User account menu"
              aria-expanded={isUserMenuOpen}
            >
              {agency.currentUser.initials}
            </button>

            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '260px',
                  backgroundColor: 'var(--cmp-surface)',
                  border: '1px solid var(--cmp-border)',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '12px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ padding: '4px 6px', borderBottom: '1px solid var(--cmp-border)', paddingBottom: '10px' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: 'var(--cmp-text)' }}>
                    {agency.currentUser.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
                    {agency.currentUser.role}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: 'var(--cmp-text-faint)', wordBreak: 'break-all' }}>
                    {agency.currentUser.email}
                  </p>
                </div>

                <NavLink
                  to="/account"
                  onClick={() => setIsUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    color: 'var(--cmp-text)',
                    textDecoration: 'none',
                    fontSize: '13px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cmp-surface-sunken)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Settings size={15} style={{ color: 'var(--cmp-text-muted)' }} />
                  <span>Agency Profile & Settings</span>
                </NavLink>

                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--cmp-danger, #ef4444)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--cmp-danger, #ef4444) 10%, transparent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hub Title and Sub-Tabs */}
      <div className="hub-bar-main">
        <div style={{ minWidth: 0 }}>
          <p className="hub-eyebrow">{hub.title}</p>
          <p className="hub-blurb">{hub.blurb}</p>
        </div>

        {pathname.startsWith('/properties') && (!account || can('listings.create')) && (
          <NavLink to="/properties/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add property</span>
          </NavLink>
        )}
        {pathname.startsWith('/rto') && (!account || can('listings.create')) && (
          <NavLink to="/rto/new" className="btn btn-accent btn-sm">
            <Plus size={15} />
            <span>Enter a property</span>
          </NavLink>
        )}
      </div>

      <nav className="hub-tabs" aria-label={`${hub.title} sections`}>
        {hub.tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/' || tab.path === '/properties' || tab.path === '/clients' || tab.path === '/growth' || tab.path === '/wallet' || tab.path === '/team' || tab.path === '/rto/team' || tab.path === '/account' || tab.path === '/help' || tab.path === '/rto'}
            className={({ isActive }) =>
              isActive ||
              (tab.path === '/rto/offers' &&
                (pathname.startsWith('/rto/bidders') || pathname.startsWith('/rto/cheques')))
                ? 'active'
                : ''
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
