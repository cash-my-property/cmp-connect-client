import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi } from '../../services/cmpConnectApi';
import OnboardingLayout from './OnboardingLayout';

// Password rules: at least 6 chars, 1 capital letter, 1 special char (!@#$%^&*)
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/;

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { authToken, updateToken, logout, mustChangePassword } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }

    if (!newPassword) {
      setError('New password is required.');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError('New password must be at least 6 characters, with at least 1 uppercase letter and 1 special character (!@#$%^&*).');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await cmpConnectApi.changePassword(
        {
          currentPassword,
          newPassword
        },
        authToken
      );

      const data = response?.data;
      if (data?.token) {
        updateToken(data.token);
      } else {
        updateToken(null);
      }

      // Navigate to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Failed to change password. Please check your current password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="Security & Access"
      subtitle="Update your password to activate your CMP Connect account."
      points={[
        "Mandatory one-time password update for new partner accounts",
        "At least 6 characters, 1 uppercase letter, 1 special character",
        "Your old temporary password will immediately expire",
        "Direct access to your CMP Connect workspace upon confirmation"
      ]}
    >
      <div className="reg-card">
        <p className="eyebrow">Security Requirement</p>
        <h2>Change Password</h2>
        <p className="sub">
          {mustChangePassword
            ? 'For security, you must set a new permanent password before accessing CMP Connect.'
            : 'Update your CMP Connect account password.'}
        </p>

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
            <label htmlFor="cp-current">Current (Temporary) Password *</label>
            <input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="cp-new">New Password *</label>
            <input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 chars, 1 uppercase, 1 special char"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
            <span className="hint">
              Must include at least 1 capital letter and 1 special symbol (!@#$%^&*).
            </span>
          </div>

          <div className="field">
            <label htmlFor="cp-confirm">Confirm New Password *</label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: 16, padding: '12px 18px' }}
          >
            {loading ? 'Updating password...' : 'Set new password & Continue'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid var(--cmp-border)', paddingTop: 16 }}>
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--cmp-text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
}
