import React from 'react';
import AppRail from './AppRail';
import HubBar from './HubBar';
import CommandPalette from './CommandPalette';
import AskCmpDrawer from './AskCmpDrawer';
import NotificationsDrawer from './NotificationsDrawer';

export default function AppShell({ children }) {
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
