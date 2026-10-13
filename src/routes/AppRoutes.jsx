import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

import DashboardPage from '../pages/home/DashboardPage';
import ActivityLogPage from '../pages/home/ActivityLogPage';

import PortfolioPage from '../pages/properties/PortfolioPage';
import AddPropertyPage from '../pages/properties/AddPropertyPage';
import EditPropertyPage from '../pages/properties/EditPropertyPage';
import ArchivePage from '../pages/properties/ArchivePage';
import CompliancePage from '../pages/properties/CompliancePage';
import BrandKitPage from '../pages/properties/BrandKitPage';

import PipelinePage from '../pages/clients/PipelinePage';
import EnquiriesPage from '../pages/clients/EnquiriesPage';
import ContactsPage from '../pages/clients/ContactsPage';
import MessagesPage from '../pages/clients/MessagesPage';

import TransactionsPage from '../pages/transactions/TransactionsPage';
import PerformancePage from '../pages/growth/PerformancePage';
import LeadInsightsPage from '../pages/growth/LeadInsightsPage';
import SmartBoostPage from '../pages/growth/SmartBoostPage';
import CommunitySpotlightPage from '../pages/growth/CommunitySpotlightPage';
import SpotlightedPage from '../pages/growth/SpotlightedPage';

import WalletPage from '../pages/wallet/WalletPage';
import InvoicesPage from '../pages/wallet/InvoicesPage';
import CreditActivityPage from '../pages/wallet/CreditActivityPage';
import RefundsPage from '../pages/wallet/RefundsPage';
import ContractPage from '../pages/wallet/ContractPage';

import TeamPage from '../pages/team/TeamPage';
import MembersPage from '../pages/team/MembersPage';
import MemberProfilePage from '../pages/team/MemberProfilePage';
import AgentSummaryPage from '../pages/team/AgentSummaryPage';
import RolesPage from '../pages/team/RolesPage';

import AgencyProfilePage from '../pages/account/AgencyProfilePage';
import SecurityPage from '../pages/account/SecurityPage';
import NotificationsPage from '../pages/account/NotificationsPage';
import HelpPage from '../pages/help/HelpPage';
import WhatsNewPage from '../pages/help/WhatsNewPage';

import LiveDeskPage from '../pages/rto/LiveDeskPage';
import EntriesPage from '../pages/rto/EntriesPage';
import ResultsPage from '../pages/rto/ResultsPage';
import BiddersPage from '../pages/rto/BiddersPage';
import ChequesPage from '../pages/rto/ChequesPage';
import EnterPropertyPage from '../pages/rto/EnterPropertyPage';

import OnboardingLandingPage from '../pages/onboarding/OnboardingLandingPage';
import OnboardingSigninPage from '../pages/onboarding/OnboardingSigninPage';
import OnboardingSignupPage from '../pages/onboarding/OnboardingSignupPage';
import OnboardingWizardPage from '../pages/onboarding/OnboardingWizardPage';
import UploadPortalPage from '../pages/onboarding/UploadPortalPage';
import CmpConnectLoginPage from '../pages/onboarding/CmpConnectLoginPage';
import ChangePasswordPage from '../pages/onboarding/ChangePasswordPage';
import AcceptInvitePage from '../pages/onboarding/AcceptInvitePage';

function ProtectedLayout() {
  const { isAuthenticated, mustChangePassword, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--cmp-bg)' }}>
        <p className="muted" style={{ fontSize: '14px' }}>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/cmp-connect/login" state={{ from: location }} replace />;
  }

  if (mustChangePassword) {
    return <Navigate to="/cmp-connect/change-password" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public CMP Connect Auth Routes */}
      <Route
        path="/cmp-connect/login"
        element={<CmpConnectLoginPage />}
      />
      <Route
        path="/cmp-connect/change-password"
        element={<ChangePasswordPage />}
      />
      <Route
        path="/signin"
        element={isAuthenticated ? <Navigate to="/" replace /> : <CmpConnectLoginPage />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <CmpConnectLoginPage />}
      />

      {/* Public Onboarding & Registration */}
      <Route path="/cmp-connect/register" element={<OnboardingSignupPage />} />
      <Route path="/onboarding" element={<OnboardingLandingPage />} />
      <Route path="/signup" element={<OnboardingSignupPage />} />
      <Route path="/register" element={<OnboardingSignupPage />} />
      <Route path="/apply" element={<OnboardingWizardPage />} />
      <Route path="/onboarding/apply" element={<OnboardingWizardPage />} />

      {/* Standalone CMP Connect Document Upload Portal (Token Auth - Public) */}
      <Route path="/cmp-connect/upload/:token" element={<UploadPortalPage />} />
      <Route path="/upload/:token" element={<UploadPortalPage />} />

      {/* Public Team Invite Acceptance (Token Auth - Public) */}
      <Route path="/cmp-connect/accept-invite/:token" element={<AcceptInvitePage />} />
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />

      {/* Protected Internal Portal Hubs */}
      <Route element={<ProtectedLayout />}>
        {/* Home Hub */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/activity" element={<ActivityLogPage />} />

        {/* Properties Hub */}
        <Route path="/properties" element={<PortfolioPage />} />
        <Route path="/properties/new" element={<AddPropertyPage />} />
        <Route path="/properties/:id/edit" element={<EditPropertyPage />} />
        <Route path="/properties/edit" element={<EditPropertyPage />} />
        <Route path="/properties/compliance" element={<CompliancePage />} />
        <Route path="/properties/brand-kit" element={<BrandKitPage />} />
        <Route path="/properties/archive" element={<ArchivePage />} />

        {/* Clients Hub */}
        <Route path="/clients" element={<PipelinePage />} />
        <Route path="/clients/pipeline" element={<PipelinePage />} />
        <Route path="/clients/enquiries" element={<EnquiriesPage />} />
        <Route path="/clients/contacts" element={<ContactsPage />} />
        <Route path="/clients/messages" element={<MessagesPage />} />

        {/* Transactions Hub */}
        <Route path="/transactions" element={<TransactionsPage />} />

        {/* Growth Hub */}
        <Route path="/growth" element={<PerformancePage />} />
        <Route path="/growth/insights" element={<LeadInsightsPage />} />
        <Route path="/growth/smart-boost" element={<SmartBoostPage />} />
        <Route path="/growth/spotlight" element={<CommunitySpotlightPage />} />
        <Route path="/growth/spotlighted" element={<SpotlightedPage />} />

        {/* Wallet Hub */}
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/activity" element={<CreditActivityPage />} />
        <Route path="/wallet/refunds" element={<RefundsPage />} />
        <Route path="/wallet/contract" element={<ContractPage />} />
        <Route path="/wallet/invoices" element={<InvoicesPage />} />

        {/* Team Hub */}
        <Route path="/team" element={<TeamPage />} />
        <Route path="/team/members" element={<MembersPage />} />
        <Route path="/team/members/:id" element={<MemberProfilePage />} />
        <Route path="/team/agents/:id" element={<AgentSummaryPage />} />
        <Route path="/team/summary" element={<AgentSummaryPage />} />
        <Route path="/team/roles" element={<RolesPage />} />

        {/* Account Hub */}
        <Route path="/account" element={<AgencyProfilePage />} />
        <Route path="/account/security" element={<SecurityPage />} />
        <Route path="/account/notifications" element={<NotificationsPage />} />

        {/* Help Hub */}
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/whats-new" element={<WhatsNewPage />} />

        {/* Real Time Offer Hub */}
        <Route path="/rto" element={<LiveDeskPage />} />
        <Route path="/rto/entries" element={<EntriesPage />} />
        <Route path="/rto/results" element={<ResultsPage />} />
        <Route path="/rto/bidders" element={<BiddersPage />} />
        <Route path="/rto/cheques" element={<ChequesPage />} />
        <Route path="/rto/new" element={<EnterPropertyPage />} />
        <Route path="/rto/team" element={<TeamPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/signin"} replace />} />
    </Routes>
  );
}
