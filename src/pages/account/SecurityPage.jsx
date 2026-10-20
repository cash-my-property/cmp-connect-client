import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Mail,
  Key,
  Lock,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Monitor,
  Laptop,
  Globe,
  Trash2,
  LogOut,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { cmpConnectApi, getDeviceId } from '../../services/cmpConnectApi';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*]).{6,}$/;

export default function SecurityPage() {
  const { agency, authToken, updateToken, isLiveData } = useApp();
  const [is2FaEnabled, setIs2FaEnabled] = useState(true);
  const [isPasswordlessEnforced, setIsPasswordlessEnforced] = useState(false);
  const [notice, setNotice] = useState(null);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Active Sessions & Devices State
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const currentDeviceId = getDeviceId();

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      setSessionError(null);
      const res = await cmpConnectApi.listSessions();
      const list = res?.data || res?.sessions || [];
      setSessions(list);
    } catch (err) {
      // If backend sessions endpoint is in development, provide current device fallback
      setSessions([
        {
          id: 'current_session',
          sessionId: 'current_session',
          deviceId: currentDeviceId,
          isCurrent: true,
          browser: 'Current Web Browser',
          os: typeof navigator !== 'undefined' ? navigator.platform || 'Desktop' : 'Desktop',
          ip: 'Current IP',
          lastActiveAt: new Date().toISOString()
        }
      ]);
      if (err.status !== 404) {
        setSessionError(err.message);
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to revoke this session? The device will be logged out immediately.')) {
      return;
    }

    try {
      setRevokingId(sessionId);
      await cmpConnectApi.deleteSession(sessionId);
      showNotice('Device session revoked successfully.');
      await loadSessions();
    } catch (err) {
      showNotice(err.message || 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices? This will invalidate all active sessions except your current one.')) {
      return;
    }

    try {
      setIsLoggingOutAll(true);
      await cmpConnectApi.logoutAll();
      showNotice('All other devices have been logged out.');
      await loadSessions();
    } catch (err) {
      showNotice(err.message || 'Failed to log out all sessions.');
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      setPasswordError('Password must be at least 6 characters, with at least 1 uppercase letter and 1 special character (!@#$%^&*).');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('New password cannot be the same as your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await cmpConnectApi.changePassword(
        { currentPassword, newPassword },
        authToken
      );

      if (res?.data?.token) {
        updateToken(res.data.token);
      }

      setPasswordSuccess('Password changed successfully. Your new password is now active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2Fa = () => {
    setIs2FaEnabled(!is2FaEnabled);
    showNotice(is2FaEnabled ? '2-Factor Authentication disabled.' : '2-Factor Authentication enabled.');
  };

  const handleTogglePasswordless = () => {
    setIsPasswordlessEnforced(!isPasswordlessEnforced);
    showNotice(isPasswordlessEnforced ? 'Passwordless login is no longer enforced.' : 'Passwordless login enforced for all agency team members.');
  };

  return (
    <div style={{ maxWidth: '780px' }}>
      {/* Title */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '26px' }}>Sign-in &amp; security</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: '14px' }}>
          Manage your credentials, password updates, and account security.
        </p>
      </div>

      {notice && (
        <div
          className="card"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            background: 'var(--cmp-brand-subtle)',
            borderColor: 'var(--cmp-brand-border)',
            color: 'var(--cmp-brand)',
            fontSize: '13.5px',
            fontWeight: 600
          }}
        >
          {notice}
        </div>
      )}

      {/* Section 1: Change Password (Live Backend API) */}
      <section style={{ marginBottom: '36px' }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} style={{ color: 'var(--cmp-brand)' }} />
            <span>Change password</span>
          </h2>
        </div>
        <p className="muted" style={{ margin: '10px 0 16px', fontSize: '14px' }}>
          Update your CMP Connect password. Choose a strong password that you do not use on other sites.
        </p>

        <div className="card" style={{ padding: '20px 24px' }}>
          {passwordSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                background: 'rgba(46, 204, 113, 0.1)',
                border: '1px solid rgba(46, 204, 113, 0.3)',
                color: '#27ae60',
                fontSize: '13.5px',
                fontWeight: 600
              }}
            >
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                border: '1px solid var(--cmp-danger)',
                color: 'var(--cmp-danger)',
                fontSize: '13.5px',
                fontWeight: 600
              }}
            >
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '14px', maxWidth: '480px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Current password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingRight: '40px' }}
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
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
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                New password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingRight: '40px' }}
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
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
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="faint" style={{ margin: '4px 0 0', fontSize: '11.5px' }}>
                Must be at least 6 characters, with 1 uppercase letter and 1 special symbol (!@#$%^&*).
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Confirm new password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingRight: '40px' }}
                  disabled={isChangingPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isChangingPassword}
                style={{ height: '38px', padding: '0 18px', gap: '6px' }}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Updating password...</span>
                  </>
                ) : (
                  <span>Update password</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Section 2: Passwordless login */}
      <section style={{ marginBottom: '36px' }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Passwordless login</span>
            <span className="badge badge-neutral">
              {isPasswordlessEnforced ? 'Enforced' : 'Not enforced'}
            </span>
          </h2>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleTogglePasswordless}
          >
            {isPasswordlessEnforced ? 'Revoke enforcement' : 'Enforce for everyone'}
          </button>
        </div>
        <p className="muted" style={{ margin: '10px 0 0', fontSize: '14px' }}>
          {isPasswordlessEnforced
            ? 'All agency members must use one-time magic links sent to their verified email or phone.'
            : 'Passwordless login is not enforced. Team members may still log in with traditional passwords.'}
        </p>
      </section>

      {/* Section 2: 2-Factor Authentication */}
      <section style={{ marginBottom: '36px' }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>2-Factor Authentication</span>
            <span
              className="badge"
              style={{
                background: is2FaEnabled ? 'var(--cmp-brand)' : 'var(--cmp-surface-sunken)',
                color: is2FaEnabled ? 'var(--cmp-text-on-brand)' : 'var(--cmp-text-muted)',
                borderRadius: '999px',
                padding: '4px 10px'
              }}
            >
              {is2FaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </h2>
        </div>
        <p style={{ margin: '12px 0', fontSize: '14px' }} className="muted">
          2-factor authentication adds an extra layer of security to your agency portal account.
        </p>

        <div className="card" style={{ padding: '6px 20px' }}>
          <p style={{ margin: '12px 0 0', fontWeight: 700, fontSize: '14px' }}>
            2-factor authentication methods
          </p>

          <div
            className="row"
            style={{
              gap: '12px',
              padding: '14px 0',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--cmp-border)'
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                flexShrink: 0
              }}
            >
              <Smartphone size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>Authenticator App</p>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                Use Google Authenticator or Microsoft Authenticator to generate one-time TOTP codes.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => showNotice('Authenticator app setup modal.')}
            >
              Set up
            </button>
          </div>

          <div
            className="row"
            style={{
              gap: '12px',
              padding: '14px 0',
              alignItems: 'flex-start'
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                flexShrink: 0
              }}
            >
              <Mail size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>
                Email &amp; SMS{' '}
                <span className="badge" style={{ marginInlineStart: '8px', background: 'var(--cmp-brand-subtle)', color: 'var(--cmp-success)' }}>
                  Configured
                </span>
              </p>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                Receive verification codes via {agency.currentUser.email}.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => showNotice('SMS/Email reconfigure modal.')}
            >
              Reconfigure
            </button>
          </div>
        </div>

        <div className="row" style={{ justifyContent: 'flex-end', marginTop: '14px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={handleToggle2Fa}
            style={{
              background: is2FaEnabled ? 'var(--cmp-danger)' : 'var(--cmp-brand)',
              color: '#FFFFFF'
            }}
          >
            {is2FaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </section>

      {/* Section 3: PassKey (My Profile) */}
      <section>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--cmp-border)'
          }}
        >
          <h2 style={{ fontSize: '18px', margin: 0 }}>PassKey (My Profile)</h2>
        </div>
        <p style={{ margin: '12px 0', fontSize: '14px' }} className="muted">
          Log in without a password using a biometric sensor such as a fingerprint or face unlock, a PIN, or a hardware security key.
        </p>

        <div className="card" style={{ padding: '6px 20px' }}>
          <div
            className="row"
            style={{
              gap: '12px',
              padding: '14px 0',
              alignItems: 'flex-start'
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                background: 'var(--cmp-brand-subtle)',
                color: 'var(--cmp-brand)',
                flexShrink: 0
              }}
            >
              <Key size={16} />
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>PassKey</p>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                Log in without a password using Windows Hello, Touch ID or Android Biometrics.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => showNotice('PassKey registration initiated with your device.')}
            >
              Add PassKey
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Active Sessions & Connected Devices (API Section 3.5) */}
      <section style={{ marginTop: '36px' }}>
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--cmp-border)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={18} style={{ color: 'var(--cmp-brand)' }} />
              <span>Active Sessions &amp; Devices</span>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadSessions}
              disabled={isLoadingSessions}
              title="Refresh session list"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={14} className={isLoadingSessions ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            {sessions.length > 1 && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleLogoutAll}
                disabled={isLoggingOutAll}
                style={{
                  background: 'color-mix(in srgb, var(--cmp-danger) 10%, transparent)',
                  border: '1px solid var(--cmp-danger)',
                  color: 'var(--cmp-danger)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isLoggingOutAll ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    <span>Log out everywhere else</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="muted" style={{ margin: '12px 0 16px', fontSize: '14px' }}>
          Devices and browsers currently signed in to your CMP Connect account. You can revoke any unrecognized session immediately.
        </p>

        {sessionError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: 'color-mix(in srgb, var(--cmp-warning) 12%, transparent)',
              border: '1px solid var(--cmp-warning)',
              color: '#92400e',
              fontSize: '13px'
            }}
          >
            <AlertCircle size={16} />
            <span>{sessionError}</span>
          </div>
        )}

        {isLoadingSessions ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
            <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', color: 'var(--cmp-brand)' }} />
            <p style={{ margin: 0, fontSize: '13.5px' }}>Loading active sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--cmp-text-muted)' }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No other active sessions detected.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessions.map((sess, idx) => {
              const isThisDevice =
                sess.isCurrent ||
                sess.deviceId === currentDeviceId ||
                sess.id === 'current_session';

              const osLower = String(sess.os || sess.userAgent || '').toLowerCase();
              const isMobile = osLower.includes('ios') || osLower.includes('android') || osLower.includes('mobile');
              const isLaptop = osLower.includes('windows') || osLower.includes('mac') || osLower.includes('linux');

              const sessionKey = sess.id || sess.sessionId || sess.deviceId || idx;

              return (
                <div
                  key={sessionKey}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    borderColor: isThisDevice ? 'var(--cmp-brand-border)' : 'var(--cmp-border)',
                    background: isThisDevice ? 'color-mix(in srgb, var(--cmp-brand-subtle) 40%, var(--cmp-surface))' : 'var(--cmp-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        background: isThisDevice ? 'var(--cmp-brand-subtle)' : 'var(--cmp-surface-sunken)',
                        color: isThisDevice ? 'var(--cmp-brand)' : 'var(--cmp-text-muted)',
                        flexShrink: 0
                      }}
                    >
                      {isMobile ? <Smartphone size={18} /> : isLaptop ? <Laptop size={18} /> : <Monitor size={18} />}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--cmp-text)' }}>
                          {sess.browser || sess.userAgent || 'Web Browser'}
                        </span>
                        {isThisDevice && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#15803d',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              letterSpacing: '0.02em'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                            This device
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12.5px', color: 'var(--cmp-text-muted)', flexWrap: 'wrap' }}>
                        {sess.os && <span>{sess.os}</span>}
                        {sess.ip && (
                          <span>
                            IP: <span style={{ fontFamily: 'monospace' }}>{sess.ip}</span>
                          </span>
                        )}
                        {sess.location && <span>· {sess.location}</span>}
                        {sess.lastActiveAt && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {isThisDevice ? 'Active now' : new Date(sess.lastActiveAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isThisDevice && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRevokeSession(sess.id || sess.sessionId)}
                      disabled={revokingId === (sess.id || sess.sessionId)}
                      style={{
                        borderColor: 'var(--cmp-danger)',
                        color: 'var(--cmp-danger)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '12.5px'
                      }}
                      title="Log out this device"
                    >
                      {revokingId === (sess.id || sess.sessionId) ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          <span>Revoking...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} />
                          <span>Revoke</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
