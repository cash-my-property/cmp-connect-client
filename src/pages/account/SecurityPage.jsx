import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Mail, Key, Lock, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function SecurityPage() {
  const { agency } = useApp();
  const [is2FaEnabled, setIs2FaEnabled] = useState(true);
  const [isPasswordlessEnforced, setIsPasswordlessEnforced] = useState(false);
  const [notice, setNotice] = useState(null);

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
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
          Choose how your team signs in and keep your account safe.
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

      {/* Section 1: Passwordless login */}
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
    </div>
  );
}
