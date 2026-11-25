import React, { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './publicPages.css';

/**
 * Public pages (Pricing, Terms) — signup se khulte hain, login ki zaroorat nahi.
 * Onboarding ka dark green brand bar + Connect theme ka content.
 */
export default function PublicPageShell({ title, children }) {
  const { isAuthenticated } = useApp();

  useEffect(() => {
    const prev = document.title;
    document.title = `${title} · Cash My Property`;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, [title]);

  return (
    <div className="pub-shell">
      <header className="pub-bar">
        <div className="pub-bar-inner">
          <Link className="reg-logo" to="/onboarding">
            Cash My <span>Property</span>
          </Link>
          <nav className="pub-nav" aria-label="Public pages">
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/terms">Terms &amp; Conditions</NavLink>
          </nav>
          <div className="pub-actions">
            {isAuthenticated ? (
              <Link to="/" className="pub-btn solid">Back to CMP Connect</Link>
            ) : (
              <>
                <Link to="/signin" className="pub-btn ghost">Sign in</Link>
                <Link to="/signup" className="pub-btn solid">Create an account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pub-wrap">
        <Link to={isAuthenticated ? '/' : '/signup'} className="pub-back">
          <ArrowLeft size={15} /> {isAuthenticated ? 'Back to CMP Connect' : 'Back to sign up'}
        </Link>
        {children}
      </main>

      <footer className="pub-foot">
        <p>Cash My Property · Dubai, United Arab Emirates</p>
        <p>
          <a href="tel:+971502402661">+971 50 240 2661</a> · <a href="mailto:info@cmpdubai.com">info@cmpdubai.com</a>
          {' · '}<Link to="/pricing">Pricing</Link> · <Link to="/terms">Terms &amp; Conditions</Link>
        </p>
      </footer>
    </div>
  );
}
