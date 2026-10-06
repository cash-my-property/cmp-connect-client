import React from 'react';
import { NavLink } from 'react-router-dom';
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
  DollarSign
} from 'lucide-react';

export default function AppRail() {
  const { platform } = useApp();
  const isRto = platform === 'auctions';

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
            <NavLink to="/properties" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Properties">
              <Building size={19} />
              <span>Properties</span>
            </NavLink>
            <NavLink to="/clients" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Clients">
              <Users size={19} />
              <span>Clients</span>
            </NavLink>
            <NavLink to="/transactions" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Transactions">
              <Briefcase size={19} />
              <span>Transactions</span>
            </NavLink>
            <NavLink to="/growth" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Growth">
              <TrendingUp size={19} />
              <span>Growth</span>
            </NavLink>
            <NavLink to="/wallet" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Wallet">
              <CreditCard size={19} />
              <span>Wallet</span>
            </NavLink>
            <NavLink to="/team" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Team">
              <UserCheck size={19} />
              <span>Team</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/rto" end className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Live desk">
              <Radio size={19} />
              <span>Live desk</span>
            </NavLink>
            <NavLink to="/rto/entries" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Entries">
              <Building size={19} />
              <span>Entries</span>
            </NavLink>
            <NavLink to="/rto/bidders" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Bidders">
              <Users size={19} />
              <span>Bidders</span>
            </NavLink>
            <NavLink to="/rto/cheques" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Cheques">
              <DollarSign size={19} />
              <span>Cheques</span>
            </NavLink>
            <NavLink to="/rto/team" className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`} title="Team">
              <UserCheck size={19} />
              <span>Team</span>
            </NavLink>
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
