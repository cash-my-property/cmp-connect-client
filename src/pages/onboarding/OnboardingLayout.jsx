import React from 'react';
import { Link } from 'react-router-dom';

export default function OnboardingLayout({
  title = "Register with Cash My Property",
  subtitle = "One portal for real estate companies and developers to join the platform.",
  points = [
    "Company or developer registration",
    "Every document in one place",
    "Saved as you go, come back any time",
    "Clear status until you are live"
  ],
  children
}) {
  return (
    <div className="reg-shell">
      {/* Brand Hero Sidebar */}
      <aside className="reg-brand">
        <Link className="reg-logo" to="/onboarding">
          Cash My <span>Property</span>
        </Link>

        <div>
          <h1>{title}</h1>
          <p className="lead">{subtitle}</p>
        </div>

        <ul className="points">
          {points.map((pt, idx) => (
            <li key={idx}>
              <span className="tick">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        <footer>
          <p>Cash My Property · Dubai, United Arab Emirates</p>
          <p>
            <a href="tel:+971502402661">+971 50 240 2661</a> · <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a>
          </p>
        </footer>
      </aside>

      {/* Main Panel */}
      <main className="reg-panel">
        {children}
      </main>
    </div>
  );
}
