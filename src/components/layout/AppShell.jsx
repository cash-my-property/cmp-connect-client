import React from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import AppRail from './AppRail';
import HubBar from './HubBar';
import CommandPalette from './CommandPalette';
import AskCmpDrawer from './AskCmpDrawer';
import NotificationsDrawer from './NotificationsDrawer';

export default function AppShell({ children }) {
  const { isAuthenticated } = useApp();
  const location = useLocation();

  const isUploadPortal = location.pathname.startsWith('/cmp-connect/upload');
  if (isUploadPortal) {
    return <>{children}</>;
  }

  const isPublicAuthOrOnboarding = 
    !isAuthenticated ||
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
    <div className="portal-shell">
      <AppRail />
      <div className="portal-column">
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
