import React from 'react';
import { Link } from 'react-router-dom';

export default function VerifiedStage({
  accountType,
  details,
  documentsCount,
  onSignOut
}) {
  const isDeveloper = accountType === 'DEVELOPER';
  const companyName = details.companyName || (isDeveloper ? 'Aurora Developments' : 'CMP Prime Real Estate');
  const regNumber = isDeveloper
    ? (details.dldDeveloperNumber || 'DLD-DEV-4417')
    : (details.reraOrnNumber || 'ORN-28841');

  return (
    <div>
      <span className="success-mark">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>

      <h2>You’re verified</h2>
      <p className="sub">
        {companyName} is registered with Cash My Property. Your account on CMP Connect is live.
      </p>

      <ul className="doc-list" style={{ marginBottom: 16 }}>
        <li className="doc-row" data-state="verified">
          <span className="doc-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="doc-main">
            <strong>Account type</strong>
            <span className="faint">
              {isDeveloper ? 'Developer' : 'Real estate company'}
            </span>
          </div>
          <span className="status-pill verified">Verified</span>
        </li>

        <li className="doc-row" data-state="verified">
          <span className="doc-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="doc-main">
            <strong>{isDeveloper ? 'DLD Developer No.' : 'ORN'}</strong>
            <span className="faint">{regNumber}</span>
          </div>
          <span className="status-pill checked">Checked</span>
        </li>

        <li className="doc-row" data-state="verified">
          <span className="doc-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div className="doc-main">
            <strong>Documents</strong>
            <span className="faint">{documentsCount} on file</span>
          </div>
          <span className="status-pill verified">Verified</span>
        </li>
      </ul>

      <div className="btn-row">
        <Link className="btn btn-primary" to="/properties">
          Open CMP Connect
        </Link>
        <button type="button" className="btn btn-ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
