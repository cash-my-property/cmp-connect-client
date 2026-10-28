import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { KeyRound, Mail, CheckCircle2, AlertCircle, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import OnboardingLayout from './OnboardingLayout';

export default function CmpConnectLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, isAuthenticated } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Check if redirected due to 401 session expiry
  const [sessionNotice] = useState(() => {
    try {
      const notice = sessionStorage.getItem('cmp_connect_auth_notice');
      sessionStorage.removeItem('cmp_connect_auth_notice');
      return notice;
    } catch {
      return null;
    }
  });

  const from = location.state?.from?.pathname || '/';

  // If already authenticated and password is not forced to change, redirect
  if (isAuthenticated && !location.state?.forced) {
    return <Navigate to={from} replace />;
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await cmpConnectApi.forgotPassword({ email: forgotEmail.trim() });
      setForgotSuccess(
        res?.message ||
          'If this email is registered with CMP Connect, instructions to reset your password have been sent.'
      );
    } catch (err) {
      if (err.status === 429) {
        setForgotError('Too many attempts. Please wait 15 minutes before trying again.');
      } else {
        setForgotError(err.message || 'Unable to request password reset. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

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

      let account = response?.data?.account;
      const token =
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.token ||
        response?.accessToken ||
        response?.data?.tokenPair?.token ||
        null;
      let mustChangePassword = Boolean(response?.data?.mustChangePassword);

      // In pure cookie mode, if account wasn't in response, hydrate via getMe
      if (!account) {
        try {
          const meRes = await cmpConnectApi.getMe(token);
          account = meRes?.data;
          if (account?.mustChangePassword !== undefined) {
            mustChangePassword = Boolean(account.mustChangePassword);
          }
        } catch {
          // Fallback if getMe is not immediately ready
        }
      }

      const isSuccessfulLogin = Boolean(account || token || response?.data?.sessionId || response?.status === 'success');
      if (!isSuccessfulLogin) {
        throw new Error(response?.message || 'Invalid login response from server.');
      }

      // Store auth state in context & storage
      loginUser({
        token,
        account,
        mustChangePassword,
        rememberMe
      });

      // If mustChangePassword is true, go straight to change-password screen
      if (mustChangePassword) {
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
          Enter your registered email and the password received in your activation email.
        </p>

        {sessionNotice && !error && (
          <div
            className="note"
            style={{
              background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
              border: '1px solid var(--cmp-warning)',
              color: '#92400e',
              marginBottom: 16
            }}
          >
            {sessionNotice}
          </div>
        )}

        {location.state?.from && !sessionNotice && !error && (
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
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || rateLimited}
                required
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--cmp-text-faint, #64748b)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Option & Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 14px', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', userSelect: 'none', color: 'var(--cmp-text-muted)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '15px', height: '15px', accentColor: 'var(--cmp-brand)', cursor: 'pointer' }}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotSuccess('');
                setForgotError('');
                setForgotEmail(email || '');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cmp-brand)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || rateLimited}
            style={{ marginTop: 4, padding: '12px 18px' }}
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !forgotLoading) {
              setShowForgotModal(false);
            }
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              background: 'var(--cmp-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--cmp-border)'
            }}
          >
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              disabled={forgotLoading}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--cmp-text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: '6px'
              }}
              title="Close"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--cmp-brand-subtle)',
                  color: 'var(--cmp-brand)',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                <KeyRound size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', margin: 0, fontWeight: 700 }}>Reset Password</h3>
                <p className="faint" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                  CMP Connect Account Security
                </p>
              </div>
            </div>

            {forgotSuccess ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#15803d',
                    fontSize: '13.5px',
                    lineHeight: 1.5,
                    marginBottom: '18px'
                  }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>Instructions Sent</div>
                    <div>{forgotSuccess}</div>
                  </div>
                </div>

                <p className="muted" style={{ fontSize: '13px', margin: '0 0 18px', lineHeight: 1.5 }}>
                  Please check your inbox (and spam or junk folder) for an email with your secure password reset link. Reset links expire within 1 hour.
                </p>

                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => setShowForgotModal(false)}
                  style={{ padding: '10px 16px' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p className="muted" style={{ margin: '0 0 16px', fontSize: '13.5px', lineHeight: 1.5 }}>
                  Enter your registered partner email address. If the account exists, we will email you a secure link to choose a new password.
                </p>

                {forgotError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                      border: '1px solid var(--cmp-danger)',
                      color: 'var(--cmp-danger)',
                      fontSize: '13px',
                      marginBottom: '14px'
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{forgotError}</span>
                  </div>
                )}

                <div className="field" style={{ marginBottom: '18px' }}>
                  <label htmlFor="forgot-email" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Registered Email *
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="name@company.ae"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    required
                    style={{ height: '40px' }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                    style={{ padding: '9px 16px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotLoading}
                    style={{ padding: '9px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <span>Send reset link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
