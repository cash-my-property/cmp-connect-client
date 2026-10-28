import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Building,
  Users,
  Briefcase,
  TrendingUp,
  CreditCard,
  UserCheck,
  HelpCircle,
  Settings,
  Radio,
  FileCheck,
  DollarSign,
  Plus,
  Sparkles
} from 'lucide-react';

export default function AppRail() {
  const { platform, account, can, hasAny } = useApp();
  const location = useLocation();
  const isRto = platform === 'auctions' || location.pathname.startsWith('/rto');

  return (
    <nav className="app-rail" aria-label="Main" data-side={isRto ? 'rto' : 'listings'}>
      <NavLink className="rail-logo" aria-label="Home" to={isRto ? '/rto' : '/'}>
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M4 15 L16 5 L28 15 V27 a1 1 0 0 1-1 1 H5 a1 1 0 0 1-1-1 Z"
            fill="none"
            stroke={isRto ? '#E3A972' : '#6ED4A1'}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="19" r="5" fill={isRto ? '#6ED4A1' : '#E3A972'} />
        </svg>
      </NavLink>

      <span className="rail-side">{isRto ? 'Real Time' : 'Listings'}</span>

      <div className="rail-group">
        {!isRto ? (
          <>
            <NavLink to="/" end className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Home">
              <Home size={19} />
              <span>Home</span>
            </NavLink>

            {(!account || hasAny('listings.view', 'listings.create')) && (
              <NavLink to="/properties" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Properties">
                <Building size={19} />
                <span>Properties</span>
              </NavLink>
            )}

            {(!account || can('leads.view')) && (
              <NavLink to="/clients" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Clients">
                <Users size={19} />
                <span>Clients</span>
              </NavLink>
            )}

            {(!account || can('transactions.view')) && (
              <NavLink to="/transactions" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Transactions">
                <Briefcase size={19} />
                <span>Transactions</span>
              </NavLink>
            )}

            {(!account || hasAny('insights.listings_view', 'insights.leads_view', 'listings.spotlight')) && (
              <NavLink to="/growth" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Growth">
                <TrendingUp size={19} />
                <span>Growth</span>
              </NavLink>
            )}

            {(!account || hasAny('contracts.view', 'credits.calculator', 'credits.history_view')) && (
              <NavLink to="/wallet" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Wallet">
                <CreditCard size={19} />
                <span>Wallet</span>
              </NavLink>
            )}

            {(!account || hasAny('team.view', 'insights.agents_view', 'roles.view')) && (
              <NavLink to="/team" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Team">
                <UserCheck size={19} />
                <span>Team</span>
              </NavLink>
            )}
          </>
        ) : (
          <>
            {(!account || can('listings.view')) && (
              <NavLink to="/rto/desk" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Live desk">
                <Radio size={19} />
                <span>Live desk</span>
              </NavLink>
            )}
            {(!account || can('listings.view')) && (
              <NavLink to="/rto" end className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Entries">
                <Building size={19} />
                <span>Entries</span>
              </NavLink>
            )}
            {(!account || can('leads.view') || can('listings.view')) && (
              <NavLink to="/rto/bidders" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Bidders">
                <Users size={19} />
                <span>Bidders</span>
              </NavLink>
            )}
            {(!account || hasAny('contracts.view', 'transactions.view', 'listings.view')) && (
              <NavLink to="/rto/cheques" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Cheques">
                <DollarSign size={19} />
                <span>Cheques</span>
              </NavLink>
            )}
            {(!account || can('listings.view')) && (
              <NavLink to="/rto/results" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Results">
                <Sparkles size={19} />
                <span>Results</span>
              </NavLink>
            )}

            {(!account || hasAny('team.view', 'insights.agents_view', 'roles.view')) && (
              <NavLink to="/rto/team" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Team">
                <UserCheck size={19} />
                <span>Team</span>
              </NavLink>
            )}
          </>
        )}
      </div>

      <div className="rail-group rail-bottom">
        <NavLink to="/help" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Help & Guides">
          <HelpCircle size={19} />
          <span>Help</span>
        </NavLink>
        <NavLink to="/account" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Agency Account">
          <Settings size={19} />
          <span>Account</span>
        </NavLink>
      </div>
    </nav>
  );
}
