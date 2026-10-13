import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Building,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import { useApp } from '../../context/AppContext';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Fetch invite details on load
  useEffect(() => {
    if (!token) {
      setLoadError('Invalid invitation link. No token provided.');
      setIsLoading(false);
      return;
    }

    cmpConnectApi.getInviteDetails(token)
      .then((res) => {
        if (res?.data) {
          setInviteData(res.data);
        } else {
          setLoadError('Unable to load invitation details.');
        }
      })
      .catch((err) => {
        const msg = err.message || 'This invitation link is invalid or has expired.';
        setLoadError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  // Validate password rules (matches backend change-password and set-password schema)
  const validatePassword = (pwd) => {
    if (pwd.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter.';
    if (!/[!@#$%^&*]/.test(pwd)) return 'Password must include at least one special character (!@#$%^&*).';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    const validationMsg = validatePassword(password);
    if (validationMsg) {
      setSubmitError(validationMsg);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await cmpConnectApi.acceptInvite({ token, password });

      if (res?.data?.token) {
        // Automatically sign in the user
        loginUser({
          token: res.data.token,
          account: res.data.account,
          mustChangePassword: false
        });
        navigate('/', { replace: true });
      } else {
        navigate('/cmp-connect/login', { replace: true });
      }
    } catch (err) {
      setSubmitError(err.message || 'Failed to activate account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cmp-bg)',
        color: 'var(--cmp-text)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '36px',
          boxShadow: 'var(--cmp-shadow-lg)',
          background: 'var(--cmp-surface)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--cmp-brand-subtle)',
              color: 'var(--cmp-brand)',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}
          >
            <ShieldCheck size={14} />
            <span>CMP Connect</span>
          </div>

          <h1 style={{ fontSize: '24px', margin: 0, letterSpacing: '-0.02em' }}>
            Activate your account
          </h1>
          <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
            Set your password to join the agency portal.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p className="muted">Loading invitation details...</p>
          </div>
        )}

        {/* Expired / Invalid Token Error Screen */}
        {!isLoading && loadError && (
          <div style={{ textAlign: 'center', display: 'grid', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(179,38,30,0.1)',
                color: 'var(--cmp-danger)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto'
              }}
            >
              <AlertCircle size={28} />
            </div>
            <strong style={{ fontSize: '18px', color: 'var(--cmp-danger)' }}>
              Invitation Unavailable
            </strong>
            <p className="muted" style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
              {loadError}
            </p>
            <p className="faint" style={{ margin: 0, fontSize: '13px' }}>
              If your link expired (valid for 7 days), ask your agency administrator to click "Resend invite" in the Members table.
            </p>
            <NavLink
              to="/cmp-connect/login"
              className="btn btn-outline btn-sm"
              style={{ width: 'fit-content', margin: '14px auto 0' }}
            >
              Go to sign in
            </NavLink>
          </div>
        )}

        {/* Active Invite Form */}
        {!isLoading && !loadError && inviteData && (
          <div>
            {/* Invitation Details Banner */}
            <div
              className="card"
              style={{
                padding: '16px',
                background: 'var(--cmp-surface-sunken)',
                marginBottom: '20px',
                display: 'grid',
                gap: '8px'
              }}
            >
              <div className="row" style={{ gap: '10px', alignItems: 'center' }}>
                <Building size={18} style={{ color: 'var(--cmp-brand)' }} />
                <div>
                  <span className="faint" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Invited to join
                  </span>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14.5px' }}>
                    {inviteData.companyName || 'CMP Agency'}
                  </p>
                </div>
              </div>

              <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', paddingTop: '6px', borderTop: '1px solid var(--cmp-border)' }}>
                <span className="muted">Role assigned:</span>
                <strong style={{ color: 'var(--cmp-brand)' }}>{inviteData.roleName || 'Agent'}</strong>
              </div>
            </div>

            {submitError && (
              <div
                className="card"
                style={{
                  padding: '12px 14px',
                  marginBottom: '16px',
                  background: 'rgba(179,38,30,0.1)',
                  color: 'var(--cmp-danger)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Login email</label>
                <input
                  type="email"
                  value={inviteData.email || ''}
                  disabled
                  style={{ background: 'var(--cmp-surface-sunken)', opacity: 0.85 }}
                />
              </div>

              <div>
                <label>Set your password*</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--cmp-text-faint)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="faint" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>
                  At least 6 characters, one capital letter, and one symbol (!@#$%^&*).
                </p>
              </div>

              <div>
                <label>Confirm password*</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--cmp-text-faint)',
                      cursor: 'pointer'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', marginTop: '6px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Activating account...' : 'Set password and sign in'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
