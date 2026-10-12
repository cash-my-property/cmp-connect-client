import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import OnboardingLayout from './OnboardingLayout';

export default function CmpConnectLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, isAuthenticated } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // If already authenticated and password is not forced to change, redirect
  if (isAuthenticated && !location.state?.forced) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setError('');
    setLoading(true);
    setRateLimited(false);

    try {
      const response = await cmpConnectApi.login({
        email: email.trim(),
        password
      });

      const data = response?.data;
      if (!data || !data.token) {
        throw new Error(response?.message || 'Invalid login response from server.');
      }

      // Store auth state in context & sessionStorage
      loginUser({
        token: data.token,
        account: data.account,
        mustChangePassword: data.mustChangePassword
      });

      // If mustChangePassword is true, go straight to change-password screen
      if (data.mustChangePassword) {
        navigate('/cmp-connect/change-password', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const status = err.status;
      const msg = err.message || 'Invalid email or password.';

      if (status === 429) {
        setRateLimited(true);
        setError(msg || 'Too many login attempts. Please wait 15 minutes before trying again.');
      } else if (status === 401) {
        setError('Invalid email or password.');
      } else if (status === 403) {
        setError(msg || 'This account is not active. Please contact CMP support.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="CMP Connect"
      subtitle="Sign in with your verified partner credentials."
      points={[
        "Access real-time listings, auctions, and live desk",
        "Direct property developer & brokerage pipeline management",
        "Compliance records, RERA verification, and wallet balances",
        "Official partner integration for UAE real estate"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">CMP Connect</p>
        <h2>Sign in</h2>
        <p className="sub">
          Enter your registered email and the temporary password received in your activation email.
        </p>

        {location.state?.from && !error && (
          <div
            className="note"
            style={{
              background: 'var(--cmp-brand-subtle)',
              border: '1px solid var(--cmp-brand)',
              color: 'var(--cmp-brand)',
              marginBottom: 16
            }}
          >
            Please sign in to access that page.
          </div>
        )}

        {error && (
          <div
            className="note"
            style={{
              background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
              border: '1px solid var(--cmp-danger)',
              color: 'var(--cmp-danger)',
              marginBottom: 16
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">Registered Email *</label>
            <input
              id="login-email"
              autoComplete="username"
              placeholder="name@company.ae"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || rateLimited}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password *</label>
            <input
              id="login-password"
              autoComplete="current-password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || rateLimited}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || rateLimited}
            style={{ marginTop: 12, padding: '12px 18px' }}
          >
            {loading ? 'Signing in...' : 'Sign in to CMP Connect'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--cmp-border)', paddingTop: 16 }}>
          <p className="meta" style={{ fontSize: '13px' }}>
            Haven't registered yet?{' '}
            <Link to="/cmp-connect/register" style={{ color: 'var(--cmp-brand)', fontWeight: 600 }}>
              Register company or developer
            </Link>
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
