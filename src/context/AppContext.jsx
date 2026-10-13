import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialAgency,
  initialListings,
  initialClients,
  initialRtoLots,
  initialFollowUps,
  teamMembers,
  needsYouItems,
  initialTransactions
} from '../data/mockData';

import { cmpConnectApi, getAuthToken, setAuthToken, clearAuthToken } from '../services/cmpConnectApi';
import { can as checkPermission } from '../utils/permissions';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [platform, setPlatform] = useState('listings'); // 'listings' | 'auctions'
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // CMP Connect Real Auth State
  const [authToken, setAuthTokenState] = useState(() => getAuthToken());
  const [account, setAccount] = useState(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [agency, setAgency] = useState(initialAgency);
  const [listings, setListings] = useState(initialListings);
  const [clients, setClients] = useState(initialClients);
  const [rtoLots, setRtoLots] = useState(initialRtoLots);
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [team, setTeam] = useState(teamMembers);
  const [needsYou, setNeedsYou] = useState(needsYouItems);
  const [transactions, setTransactions] = useState(initialTransactions);

  // Validate session on app mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthLoading(false);
      return;
    }

    cmpConnectApi.getMe(token)
      .then((res) => {
        const acc = res?.data;
        if (acc) {
          setAccount(acc);
          setMustChangePassword(Boolean(acc.mustChangePassword));
          setAgency((prev) => ({
            ...prev,
            name: acc.organization?.companyName || prev.name,
            orn: acc.organization?.orn || prev.orn,
            currentUser: {
              ...prev.currentUser,
              name: acc.fullName || prev.currentUser.name,
              email: acc.email || prev.currentUser.email,
              role: acc.role || prev.currentUser.role,
              initials: acc.fullName
                ? acc.fullName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                : prev.currentUser.initials
            }
          }));
        }
      })
      .catch((err) => {
        console.warn('[AppContext] Session expired or invalid:', err.message);
        clearAuthToken();
        setAuthTokenState(null);
        setAccount(null);
        setMustChangePassword(false);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  const loginUser = ({ token, account: acc, mustChangePassword: mcp }) => {
    setAuthToken(token);
    setAuthTokenState(token);
    setAccount(acc);
    setMustChangePassword(Boolean(mcp));
    if (acc) {
      setAgency((prev) => ({
        ...prev,
        name: acc.organization?.companyName || prev.name,
        orn: acc.organization?.orn || prev.orn,
        currentUser: {
          ...prev.currentUser,
          name: acc.fullName || prev.currentUser.name,
          email: acc.email || prev.currentUser.email,
          role: acc.role || prev.currentUser.role,
          initials: acc.fullName
            ? acc.fullName.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
            : prev.currentUser.initials
        }
      }));
    }
  };

  const updateToken = (newToken) => {
    setAuthToken(newToken);
    setAuthTokenState(newToken);
    setMustChangePassword(false);
    if (account) {
      setAccount((prev) => (prev ? { ...prev, mustChangePassword: false } : prev));
    }
  };

  const logout = () => {
    clearAuthToken();
    setAuthTokenState(null);
    setAccount(null);
    setMustChangePassword(false);
  };

  const isAuthenticated = Boolean(authToken && account && !mustChangePassword);

  // Sync data attributes to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-platform', platform);
  }, [theme, platform]);

  // Global Ctrl + K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAssistantOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const addListing = (newListing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const moveClientStage = (clientId, newStage) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, stage: newStage } : c))
    );
  };

  const toggleFollowUp = (id) => {
    setFollowUps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const addFollowUp = (text) => {
    if (!text.trim()) return;
    const newItem = {
      id: Date.now(),
      text,
      status: 'Today · Just added',
      agent: agency.currentUser.name,
      done: false
    };
    setFollowUps((prev) => [newItem, ...prev]);
  };

  const extendRtoClock = (lotId, minutes = 10) => {
    setRtoLots((prev) =>
      prev.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              clock: `+${minutes}m extended`,
              clockExtendedCount: lot.clockExtendedCount + 1
            }
          : lot
      )
    );
  };

  const placeRtoOffer = (lotId, amount) => {
    setRtoLots((prev) =>
      prev.map((lot) => {
        if (lot.id === lotId) {
          const newHighest = Math.max(lot.highestOffer || 0, amount);
          const reserveMet = newHighest >= lot.reservePrice;
          const newHistory = [
            { buyer: 'Buyer ' + Math.floor(Math.random() * 20 + 1), amount, time: 'Just now' },
            ...lot.history
          ];
          return {
            ...lot,
            highestOffer: newHighest,
            reserveMet,
            offersCount: lot.offersCount + 1,
            history: newHistory
          };
        }
        return lot;
      })
    );
  };

  const dismissNeedsYou = (id) => {
    setNeedsYou((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        authToken,
        account,
        mustChangePassword,
        isAuthLoading,
        can: (...keys) => checkPermission(account, ...keys),
        userPermissions: account?.permissions || [],
        userRole: account?.role || null,
        loginUser,
        updateToken,
        logout,
        platform,
        setPlatform,
        theme,
        toggleTheme,
        isSearchOpen,
        setIsSearchOpen,
        isAssistantOpen,
        setIsAssistantOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        agency,
        setAgency,
        listings,
        addListing,
        clients,
        moveClientStage,
        rtoLots,
        extendRtoClock,
        placeRtoOffer,
        followUps,
        toggleFollowUp,
        addFollowUp,
        team,
        needsYou,
        dismissNeedsYou,
        transactions
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
