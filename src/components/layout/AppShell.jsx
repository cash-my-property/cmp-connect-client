import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppRail from './AppRail';
import HubBar from './HubBar';
import CommandPalette from './CommandPalette';
import AskCmpDrawer from './AskCmpDrawer';
import NotificationsDrawer from './NotificationsDrawer';

import BrnComplianceBanner from './BrnComplianceBanner';

export default function AppShell({ children }) {
  const { isAuthenticated } = useApp();
  const location = useLocation();
  const [isRailExpanded, setIsRailExpanded] = useState(() => {
    try {
      return localStorage.getItem('cmp_connect_rail_expanded') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cmp_connect_rail_expanded', String(isRailExpanded));
    } catch {
      // ignore storage errors
    }
  }, [isRailExpanded]);

  const isUploadPortal =
    location.pathname.startsWith('/cmp-connect/upload') ||
    location.pathname.startsWith('/upload/');
  if (isUploadPortal) {
    return <>{children}</>;
  }

  const isPublicAuthOrOnboarding = 
    !isAuthenticated ||
    location.pathname.startsWith('/cmp-connect') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname === '/signin' ||
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/register' ||
    location.pathname === '/apply';

  if (isPublicAuthOrOnboarding) {
    return (
      <>
        {children}
        <CommandPalette />
      </>
    );
  }

  return (
    <div className={`portal-shell ${isRailExpanded ? 'rail-expanded' : 'rail-collapsed'}`}>
      <AppRail
        isExpanded={isRailExpanded}
        onToggleExpand={() => setIsRailExpanded((prev) => !prev)}
      />
      <div className="portal-column">
        <BrnComplianceBanner />
        <HubBar />
        <main className="portal-main">
          {children}
        </main>
      </div>
      <CommandPalette />
      <AskCmpDrawer />
      <NotificationsDrawer />
    </div>
  );
}
