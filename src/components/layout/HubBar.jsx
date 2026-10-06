import React from 'react';
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
  Plus
} from 'lucide-react';

export default function HubBar() {
  const {
    platform,
    setPlatform,
    theme,
    toggleTheme,
    setIsSearchOpen,
    setIsNotificationsOpen,
    agency,
    needsYou
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  // Derive active hub information based on current URL path
  const getHubInfo = () => {
    if (pathname.startsWith('/rto')) {
      return {
        title: 'Live desk',
        blurb: 'Offers arriving right now on properties with a closing date.',
        tabs: [
          { label: 'Live desk', path: '/rto' },
          { label: 'Entries', path: '/rto/entries' },
          { label: 'Results', path: '/rto/results' },
          { label: 'Registrations', path: '/rto/bidders' },
          { label: 'Cheques', path: '/rto/cheques' }
        ]
      };
    }
    if (pathname.startsWith('/properties')) {
      return {
        title: 'Properties',
        blurb: 'Every property you market, its compliance and your brand on its photos.',
        tabs: [
          { label: 'Portfolio', path: '/properties' },
          { label: 'Compliance', path: '/properties/compliance' },
          { label: 'Archive', path: '/properties/archive' },
          { label: 'Brand kit', path: '/properties/brand-kit' }
        ]
      };
    }
    if (pathname.startsWith('/clients')) {
      return {
        title: 'Clients',
        blurb: 'Enquiries in, contacts kept, clients moved towards a deal.',
        tabs: [
          { label: 'Enquiries', path: '/clients/enquiries' },
          { label: 'Pipeline', path: '/clients' },
          { label: 'Contacts', path: '/clients/contacts' },
          { label: 'Messages', path: '/clients/messages' }
        ]
      };
    }
    if (pathname.startsWith('/transactions')) {
      return {
        title: 'Transactions',
        blurb: 'Deals your agents closed on your Cash My Property listings.',
        tabs: []
      };
    }
    if (pathname.startsWith('/growth')) {
      return {
        title: 'Growth',
        blurb: 'Where your enquiries come from and how to get more of them.',
        tabs: [
          { label: 'Performance', path: '/growth' },
          { label: 'Enquiry insights', path: '/growth/insights' },
          { label: 'Smart Boost', path: '/growth/smart-boost' },
          { label: 'Community Spotlight', path: '/growth/spotlight' },
          { label: 'Spotlighted', path: '/growth/spotlighted' }
        ]
      };
    }
    if (pathname.startsWith('/wallet')) {
      return {
        title: 'Wallet',
        blurb: 'Your credits, your contract with Cash My Property and its invoices.',
        tabs: [
          { label: 'Balance & plan', path: '/wallet' },
          { label: 'Activity', path: '/wallet/activity' },
          { label: 'Refunds', path: '/wallet/refunds' },
          { label: 'Contract', path: '/wallet/contract' },
          { label: 'Invoices', path: '/wallet/invoices' }
        ]
      };
    }
    if (pathname.startsWith('/team')) {
      return {
        title: 'Team',
        blurb: 'Your people, how they are performing and what they can access.',
        tabs: [
          { label: 'Leaderboard', path: '/team' },
          { label: 'Members', path: '/team/members' },
          { label: 'Roles & access', path: '/team/roles' }
        ]
      };
    }
    if (pathname.startsWith('/account')) {
      return {
        title: 'Account',
        blurb: 'Your agency’s details, sign-in security and what you get notified about.',
        tabs: [
          { label: 'Agency profile', path: '/account' },
          { label: 'Sign-in & security', path: '/account/security' },
          { label: 'Notifications', path: '/account/notifications' }
        ]
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
            className={platform === 'listings' ? 'active' : ''}
            onClick={() => handlePlatformChange('listings')}
          >
            <Building size={16} />
            <span>Listings</span>
          </button>
          <button
            type="button"
            className={platform === 'auctions' ? 'active' : ''}
            onClick={() => handlePlatformChange('auctions')}
          >
            <Radio size={16} />
            <span>Real Time Offer</span>
          </button>
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
        <div className="row" style={{ gap: '8px', marginInlineStart: 'auto' }}>
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
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Help Button */}
          <NavLink to="/help" className="icon-button" aria-label="Help">
            <HelpCircle size={18} />
          </NavLink>

          {/* User Profile Avatar */}
          <NavLink
            to="/account"
            className="btn btn-outline btn-sm"
            style={{
              width: '38px',
              height: '38px',
              padding: 0,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--cmp-brand-subtle)',
              color: 'var(--cmp-brand)',
              fontWeight: 700,
              fontSize: '13px'
            }}
            title={`${agency.currentUser.name} (${agency.currentUser.role})`}
          >
            {agency.currentUser.initials}
          </NavLink>
        </div>
      </div>

      {/* Hub Title and Sub-Tabs */}
      <div className="hub-bar-main">
        <div style={{ minWidth: 0 }}>
          <p className="hub-eyebrow">{hub.title}</p>
          <p className="hub-blurb">{hub.blurb}</p>
        </div>

        {pathname.startsWith('/properties') && (
          <NavLink to="/properties/new" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add property</span>
          </NavLink>
        )}
        {pathname.startsWith('/rto') && (
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
            end={tab.path === '/' || tab.path === '/properties' || tab.path === '/clients' || tab.path === '/growth' || tab.path === '/wallet' || tab.path === '/team' || tab.path === '/account' || tab.path === '/help' || tab.path === '/rto'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
