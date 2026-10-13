import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AppShell>
      </AppProvider>
    </BrowserRouter>
  );
}
