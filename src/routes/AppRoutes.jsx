import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

import DashboardPage from '../pages/home/DashboardPage';
import ActivityLogPage from '../pages/home/ActivityLogPage';

import PortfolioPage from '../pages/properties/PortfolioPage';
import AddPropertyPage from '../pages/properties/AddPropertyPage';
import CompliancePage from '../pages/properties/CompliancePage';
import BrandKitPage from '../pages/properties/BrandKitPage';

import PipelinePage from '../pages/clients/PipelinePage';
import EnquiriesPage from '../pages/clients/EnquiriesPage';

import TransactionsPage from '../pages/transactions/TransactionsPage';
import PerformancePage from '../pages/growth/PerformancePage';

import WalletPage from '../pages/wallet/WalletPage';
import InvoicesPage from '../pages/wallet/InvoicesPage';
import CreditActivityPage from '../pages/wallet/CreditActivityPage';
import RefundsPage from '../pages/wallet/RefundsPage';
import ContractPage from '../pages/wallet/ContractPage';

import TeamPage from '../pages/team/TeamPage';
import AgencyProfilePage from '../pages/account/AgencyProfilePage';
import HelpPage from '../pages/help/HelpPage';

import LiveDeskPage from '../pages/rto/LiveDeskPage';

import OnboardingLandingPage from '../pages/onboarding/OnboardingLandingPage';
import OnboardingSigninPage from '../pages/onboarding/OnboardingSigninPage';
import OnboardingSignupPage from '../pages/onboarding/OnboardingSignupPage';
import OnboardingWizardPage from '../pages/onboarding/OnboardingWizardPage';
import UploadPortalPage from '../pages/onboarding/UploadPortalPage';

function ProtectedLayout() {
  const { isAuthenticated } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/signin"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <OnboardingSigninPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <OnboardingSigninPage />
        }
      />

      {/* Public Onboarding & Registration */}
      <Route path="/onboarding" element={<OnboardingLandingPage />} />
      <Route path="/signup" element={<OnboardingSignupPage />} />
      <Route path="/register" element={<OnboardingSignupPage />} />
      <Route path="/apply" element={<OnboardingWizardPage />} />
      <Route path="/onboarding/apply" element={<OnboardingWizardPage />} />

      {/* Standalone CMP Connect Document Upload Portal (Token Auth - Public) */}
      <Route path="/cmp-connect/upload/:token" element={<UploadPortalPage />} />
      <Route path="/upload/:token" element={<UploadPortalPage />} />

      {/* Protected Internal Portal Hubs */}
      <Route element={<ProtectedLayout />}>
        {/* Home Hub */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/activity" element={<ActivityLogPage />} />

        {/* Properties Hub */}
        <Route path="/properties" element={<PortfolioPage />} />
        <Route path="/properties/new" element={<AddPropertyPage />} />
        <Route path="/properties/compliance" element={<CompliancePage />} />
        <Route path="/properties/brand-kit" element={<BrandKitPage />} />
        <Route path="/properties/archive" element={<PortfolioPage />} />

        {/* Clients Hub */}
        <Route path="/clients" element={<PipelinePage />} />
        <Route path="/clients/pipeline" element={<PipelinePage />} />
        <Route path="/clients/enquiries" element={<EnquiriesPage />} />
        <Route path="/clients/contacts" element={<PipelinePage />} />
        <Route path="/clients/messages" element={<EnquiriesPage />} />

        {/* Transactions Hub */}
        <Route path="/transactions" element={<TransactionsPage />} />

        {/* Growth Hub */}
        <Route path="/growth" element={<PerformancePage />} />
        <Route path="/growth/insights" element={<PerformancePage />} />
        <Route path="/growth/smart-boost" element={<PerformancePage />} />
        <Route path="/growth/spotlight" element={<PerformancePage />} />

        {/* Wallet Hub */}
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/activity" element={<CreditActivityPage />} />
        <Route path="/wallet/refunds" element={<RefundsPage />} />
        <Route path="/wallet/contract" element={<ContractPage />} />
        <Route path="/wallet/invoices" element={<InvoicesPage />} />

        {/* Team Hub */}
        <Route path="/team" element={<TeamPage />} />
        <Route path="/team/members" element={<TeamPage />} />
        <Route path="/team/roles" element={<TeamPage />} />

        {/* Account Hub */}
        <Route path="/account" element={<AgencyProfilePage />} />
        <Route path="/account/security" element={<AgencyProfilePage />} />
        <Route path="/account/notifications" element={<AgencyProfilePage />} />

        {/* Help Hub */}
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/whats-new" element={<HelpPage />} />

        {/* Real Time Offer Hub */}
        <Route path="/rto" element={<LiveDeskPage />} />
        <Route path="/rto/entries" element={<LiveDeskPage />} />
        <Route path="/rto/results" element={<LiveDeskPage />} />
        <Route path="/rto/bidders" element={<LiveDeskPage />} />
        <Route path="/rto/cheques" element={<LiveDeskPage />} />
        <Route path="/rto/new" element={<AddPropertyPage />} />
        <Route path="/rto/team" element={<TeamPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/signin"} replace />} />
    </Routes>
  );
}
