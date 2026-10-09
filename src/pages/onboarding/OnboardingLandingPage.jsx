import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingLandingPage() {
  const navigate = useNavigate();

  return (
    <OnboardingLayout
      title="Register with Cash My Property"
      subtitle="One portal for real estate companies and developers to join the platform."
      points={[
        "Company or developer registration",
        "Every document in one place",
        "Saved as you go, come back any time",
        "Clear status until you are live"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">Registration portal</p>
        <h2>Let’s get you on the platform</h2>
        <p className="sub">
          Create an account, tell us about your business, upload your documents, and we take it from there.
        </p>

        <div className="type-grid" style={{ marginBottom: 20 }}>
          <div
            className="type-card"
            onClick={() => navigate('/signup?type=agency')}
            role="button"
            tabIndex={0}
          >
            <span className="type-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m14 10v-2a4 4 0 0 0-3-3.87" />
              </svg>
            </span>
            <strong>Real estate company</strong>
            <span className="muted">Brokerages and agencies that list and sell other people’s property.</span>
          </div>

          <div
            className="type-card"
            onClick={() => navigate('/signup?type=developer')}
            role="button"
            tabIndex={0}
          >
            <span className="type-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M4 21V10l8-6 8 6v11M9 21v-6h6v6" />
              </svg>
            </span>
            <strong>Developer</strong>
            <span className="muted">Developers selling their own projects, off-plan or ready.</span>
          </div>
        </div>

        <div className="btn-row">
          <Link className="btn btn-primary" to="/signup">
            Create an account
          </Link>
          <Link className="btn btn-outline" to="/signin">
            Sign in
          </Link>
        </div>
      </div>
    </OnboardingLayout>
  );
}
