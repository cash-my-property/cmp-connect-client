import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import OnboardingLayout from './OnboardingLayout';

// Password rules: at least 6 characters, 1 uppercase letter, 1 special symbol (!@#$%^&*)
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/;

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify reset token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token was provided in the link.');
      setIsVerifying(false);
      return;
    }

    cmpConnectApi.verifyResetToken(token)
      .then((res) => {
        setTokenInfo(res?.data || {});
      })
      .catch((err) => {
        const msg =
          err.message ||
          'This password reset link is invalid, has expired, or has already been used.';
        setTokenError(msg);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!password) {
      setFormError('Please enter a new password.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setFormError('Password must be at least 6 characters, with at least 1 uppercase letter and 1 special character (!@#$%^&*).');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await cmpConnectApi.resetPassword({ token, password });
      setIsSuccess(true);
    } catch (err) {
      setFormError(err.message || 'Failed to reset password. Please request a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout
      title="CMP Connect Security"
      subtitle="Set a new password for your verified partner account."
      points={[
        "Single-use secure link with 1-hour expiration",
        "At least 6 characters, 1 uppercase letter, 1 special character",
        "All previous sessions on other devices will be ended",
        "Sign in immediately once your new password is confirmed"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">Account Recovery</p>
        <h2>Choose new password</h2>
        <p className="sub">
          {tokenInfo?.email ? (
            <>Resetting password for <strong>{tokenInfo.email}</strong></>
          ) : (
            'Enter and confirm your new secure CMP Connect password below.'
          )}
        </p>

        {isVerifying ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--cmp-text-muted)' }}>
            <Loader2 size={32} className="spin" style={{ margin: '0 auto 14px', color: 'var(--cmp-brand)' }} />
            <p style={{ fontSize: '14px', margin: 0 }}>Verifying your reset link...</p>
          </div>
        ) : tokenError ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                fontSize: '13.5px',
                lineHeight: 1.5,
                marginBottom: '20px'
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>Invalid or Expired Link</div>
                <div>{tokenError}</div>
              </div>
            </div>

            <p className="muted" style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              For your account security, password reset links expire after 1 hour or immediately after use. Please return to the login page and request a new password reset link.
            </p>

            <Link to="/cmp-connect/login" className="btn btn-primary btn-block" style={{ padding: '12px' }}>
              Return to Sign in
            </Link>
          </div>
        ) : isSuccess ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#15803d',
                fontSize: '13.5px',
                lineHeight: 1.5,
                marginBottom: '20px'
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, marginBottom: '2px' }}>Password Reset Complete</div>
                <div>Your CMP Connect account password has been successfully updated.</div>
              </div>
            </div>

            <p className="muted" style={{ fontSize: '13.5px', lineHeight: 1.5, marginBottom: '20px' }}>
              You can now sign in with your email and new password.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => navigate('/cmp-connect/login', { replace: true })}
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span>Sign in now</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {formError && (
              <div
                className="note"
                style={{
                  background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                  border: '1px solid var(--cmp-danger)',
                  color: 'var(--cmp-danger)',
                  marginBottom: 16
                }}
              >
                {formError}
              </div>
            )}

            <div className="field">
              <label htmlFor="reset-new-password">New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  style={{ width: '100%', paddingRight: '40px' }}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--cmp-text-faint)',
                    cursor: 'pointer'
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>
                At least 6 characters, with 1 uppercase letter and 1 special symbol (!@#$%^&*).
              </p>
            </div>

            <div className="field">
              <label htmlFor="reset-confirm-password">Confirm New Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                  style={{ width: '100%', paddingRight: '40px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--cmp-text-faint)',
                    cursor: 'pointer'
                  }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ marginTop: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update password &amp; continue</span>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--cmp-border)', paddingTop: 16 }}>
          <p className="meta" style={{ fontSize: '13px' }}>
            Remembered your password?{' '}
            <Link to="/cmp-connect/login" style={{ color: 'var(--cmp-brand)', fontWeight: 600 }}>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
