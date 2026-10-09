import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import OnboardingLayout from './OnboardingLayout';

export default function OnboardingSigninPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useApp();

  const [email, setEmail] = useState('layla@cmpprime.ae');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your registered work email and password.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      login({ email: email.trim() });
      navigate(from, { replace: true });
    }, 350);
  };

  return (
    <OnboardingLayout
      title="CMP Connect Portal"
      subtitle="Sign in to access your partner dashboard, portfolio, live desk, and pipeline."
      points={[
        "Real-time listings and property portfolio management",
        "Live desk offers and real-time bidder monitoring",
        "Client pipeline, leads, and direct enquiries",
        "Wallet balance, invoices, and agency compliance"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">CMP Connect Partner Portal</p>
        <h2>Sign in</h2>
        <p className="sub">Use the email you registered with to access internal portal pages.</p>

        {location.state?.from && (
          <div className="note" style={{ background: 'var(--cmp-brand-subtle)', border: '1px solid var(--cmp-brand)', color: 'var(--cmp-brand)', marginBottom: 16 }}>
            Please sign in to access that page.
          </div>
        )}

        {error && (
          <div className="note" style={{ background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)', border: '1px solid var(--cmp-danger)', color: 'var(--cmp-danger)', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="si-email">Work Email</label>
            <input
              id="si-email"
              autoComplete="username"
              placeholder="name@company.ae"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="si-password">Password</label>
            <input
              id="si-password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign in to Portal'}
          </button>
        </form>

        <p className="meta" style={{ marginTop: 16 }}>
          No account yet? <Link to="/signup">Register your company or projects</Link>
        </p>

        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'var(--cmp-surface-sunken)', border: '1px solid var(--cmp-border)', fontSize: '12px', color: 'var(--cmp-text-muted)' }}>
          💡 <strong>Demo credentials:</strong> Pre-filled for instant access. Click <em>Sign in to Portal</em> to proceed.
        </div>
      </div>
    </OnboardingLayout>
  );
}
