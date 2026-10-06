import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </AppProvider>
    </BrowserRouter>
  );
}
